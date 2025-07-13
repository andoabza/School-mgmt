import React, { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import api from '../axiosConfig.js';

export default function ParentPortal() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState({
    children: true,
    grades: false,
    attendance: false
  });
  const [addChildVisible, setAddChildVisible] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState(null);
  const { user } = useUser();

  // Fetch parent's children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await api.get(`/parents/${user.id}/children`);
        
        if (response.data.length > 0) {
          setChildren(response.data);
          setSelectedChild(response.data[0].id);
        }
      } catch (err) {
        setError('Failed to load children data');
      } finally {
        setLoading(prev => ({ ...prev, children: false }));
      }
    };

    fetchChildren();
  }, [user]);

  // Fetch data when selected child changes
  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildData = async (childId) => {
    setLoading(prev => ({ ...prev, grades: true, attendance: true }));
    try {
      const [gradesRes, attendanceRes] = await Promise.all([
        api.get(`/parents/child/${childId}/grades`),
        api.get(`/parents/child/${childId}/attendance`)
      ]);

      setGrades(gradesRes.data);
      setAttendance(attendanceRes.data);
    } catch (err) {
      setError('Failed to load child data');
    } finally {
      setLoading(prev => ({ ...prev, grades: false, attendance: false }));
    }
  };

  const handleAddChild = async () => {
    if (!emailInput) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      await api.post(`/parents/${user.id}/add-child`, { email: emailInput });
      
      // Refresh children list
      const response = await api.get(`/parents/${user.id}/children`);
      setChildren(response.data);
      setAddChildVisible(false);
      setEmailInput('');
      
      // Show success message
      setError(null);
      alert('Child added successfully!');
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error || 
                      'Failed to add child. Please check the email and try again.';
      setError(errorMsg);
    }
  };

  const handleRemoveChild = async (childId) => {
    if (window.confirm('Are you sure you want to remove this child?')) {
      try {
        await api.delete(`/parents/${user.id}/${childId}`);
        const updatedChildren = children.filter(child => child.id !== childId);
        setChildren(updatedChildren);
        if (updatedChildren.length > 0 && selectedChild === childId) {
          setSelectedChild(updatedChildren[0].id);
        } else if (updatedChildren.length === 0) {
          setSelectedChild(null);
        }
        alert('Child removed successfully');
      } catch (err) {
        setError('Failed to remove child');
      }
    }
  };

  const gradeColumns = [
    { Header: 'Subject', accessor: 'class_name' },
    { Header: 'Assignment', accessor: 'name' },
    { 
      Header: 'Score', 
      accessor: 'score',
      Cell: ({ row }) => {
        const score = row.original.score;
        const maxScore = row.original.max_score;
        const percentage = (score / maxScore * 100).toFixed(1);
        return (
          <span className={percentage >= 70 ? 'text-green-600' : 'text-red-600'}>
            {score} / {maxScore} 
            <span className="ml-2 text-gray-500">({percentage}%)</span>
          </span>
        );
      }
    },
    { Header: 'Teacher', accessor: 'teacher_name' },
    { 
      Header: 'Date', 
      accessor: 'due_date',
      Cell: ({ value }) => new Date(value).toLocaleDateString()
    },
  ];

  const attendanceColumns = [
    { 
      Header: 'Date', 
      accessor: 'date',
      Cell: ({ value }) => new Date(value).toLocaleDateString()
    },
    { Header: 'Class', accessor: 'class_name' },
    { 
      Header: 'Status', 
      accessor: 'status',
      Cell: ({ value }) => {
        const colorMap = {
          present: 'bg-green-100 text-green-800',
          absent: 'bg-red-100 text-red-800',
          late: 'bg-yellow-100 text-yellow-800',
          excused: 'bg-blue-100 text-blue-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[value] || 'bg-gray-100'}`}>
            {value.toUpperCase()}
          </span>
        );
      }
    },
    { Header: 'Teacher', accessor: 'teacher_name' },
  ];

  
  // Calculate overall performance
  const overallPerformance = children.map(child => {
    const childGrades = grades.filter(g => g.student_id === child.id);
    const totalScore = childGrades.reduce((sum, grade) => sum + (grade.score / grade.max_score), 0);
    const average = childGrades.length > 0 ? (totalScore / childGrades.length * 100).toFixed(1) : 0;
    
    const childAttendance = attendance.filter(a => a.student_id === child.id);
    const presentCount = childAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = childAttendance.length > 0 
      ? (presentCount / childAttendance.length * 100).toFixed(1)
      : 0;
    
    return {
      id: child.id,
      name: `${child.first_name} ${child.last_name}`,
      average,
      attendanceRate
    };
  });

  // Calculate attendance summary
  const attendanceSummary = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
          Parent Portal
        </h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Summary Dashboard */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Family Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{children.length}</p>
              <p className="text-gray-600">Children</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">
                {overallPerformance.length > 0 
                  ? (overallPerformance.reduce((sum, p) => sum + parseFloat(p.average), 0) / overallPerformance.length).toFixed(1) 
                  : '0.0'}
                <span className="text-lg">%</span>
              </p>
              <p className="text-gray-600">Avg. Performance</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">
                {overallPerformance.length > 0 
                  ? (overallPerformance.reduce((sum, p) => sum + parseFloat(p.attendanceRate), 0) / overallPerformance.length).toFixed(1) 
                  : '0.0'}
                <span className="text-lg">%</span>
              </p>
              <p className="text-gray-600">Avg. Attendance</p>
            </div>
          </div>
        </div>

        {/* Children Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h3 className="text-lg font-semibold mb-2 md:mb-0">My Children</h3>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
              onClick={() => setAddChildVisible(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Child
            </button>
          </div>
          
          {loading.children ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : children.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="flex overflow-x-auto border-b">
                {children.map(child => (
                  <button
                    key={child.id}
                    className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                      selectedChild === child.id 
                        ? 'bg-blue-100 border-b-2 border-blue-500 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedChild(child.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {child.first_name} {child.last_name}
                    <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                      Grade {child.grade_level}
                    </span>
                    <button 
                      className="ml-2 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveChild(child.id);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-4 text-gray-600">No children linked to your account</p>
              <button 
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                onClick={() => setAddChildVisible(true)}
              >
                Add Your First Child
              </button>
            </div>
          )}
        </div>

        {/* Child Details */}
        {selectedChild && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-semibold">Academic Performance</h3>
              </div>
              
              {loading.grades ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : grades.length > 0 ? (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {gradeColumns.map((column, index) => (
                            <th 
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column.Header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grades
                          .filter(g => g.student_id === selectedChild)
                          .map((grade, index) => (
                            <tr key={index}>
                              {gradeColumns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                                  {column.Cell ? 
                                    column.Cell({ row: { original: grade } }) : 
                                    grade[column.accessor]}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Performance Summary */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Overall Performance</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${grades.filter(g => g.student_id === selectedChild)
                            .reduce((sum, grade) => sum + (grade.score / grade.max_score), 0) / 
                            Math.max(grades.filter(g => g.student_id === selectedChild).length, 1) * 100}%` 
                        }}
                      ></div>
                    </div>
                    
                    <h4 className="font-medium mb-2">Assignment Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {['A', 'B', 'C', 'D', 'F'].map(grade => {
                        const count = grades.filter(g => 
                          g.student_id === selectedChild && 
                          g.score / g.max_score >= 
                          { 'A': 0.9, 'B': 0.8, 'C': 0.7, 'D': 0.6 }[grade] &&
                          g.score / g.max_score < 
                          ({ 'A': 1.1, 'B': 0.9, 'C': 0.8, 'D': 0.7, 'F': 0.6 }[grade])
                        ).length;
                        
                        return (
                          <div key={grade} className="bg-gray-50 rounded p-3 text-center">
                            <p className="text-lg font-semibold">Grade {grade}</p>
                            <p className="text-2xl font-bold">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-gray-600">No grade records found</p>
                </div>
              )}
            </div>

            {/* Attendance Records */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Attendance Records</h3>
              </div>
              
              {loading.attendance ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : attendance.length > 0 ? (
                <div>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {attendanceColumns.map((column, index) => (
                            <th 
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column.Header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendance
                          .filter(a => a.student_id === selectedChild)
                          .map((record, index) => (
                            <tr key={index}>
                              {attendanceColumns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                                  {column.Cell ? 
                                    column.Cell({ value: record[column.accessor] }) : 
                                    record[column.accessor]}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Attendance Summary */}
                  <div>
                    <h4 className="font-medium mb-4">Attendance Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {Object.entries({
                        present: 'bg-green-100 text-green-800',
                        absent: 'bg-red-100 text-red-800',
                        late: 'bg-yellow-100 text-yellow-800',
                        excused: 'bg-blue-100 text-blue-800'
                      }).map(([status, classes]) => (
                        <div key={status} className={`rounded-lg p-4 text-center ${classes}`}>
                          <p className="text-xl font-bold">{attendanceSummary[status] || 0}</p>
                          <p className="capitalize">{status}</p>
                        </div>
                      ))}
                    </div>
                    
                    <h4 className="font-medium mb-2">Attendance Rate</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${(attendanceSummary.present || 0) / attendance.length * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-right">
                      {((attendanceSummary.present || 0) / attendance.length * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-gray-600">No attendance records found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Child Modal */}
        {addChildVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Add Child to Your Account</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Child's Email
                  </label>
                  <input 
                    type="email"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's email address"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                  />
                  <p className="mt-1 text-gray-500 text-sm">
                    Use the email associated with your child's school account
                  </p>
                </div>
              </div>
              <div className="flex justify-end px-6 py-4 bg-gray-50 rounded-b-lg">
                <button 
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setAddChildVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleAddChild}
                  disabled={!emailInput}
                >
                  Add Child
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}