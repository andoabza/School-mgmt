import React, { useState, useEffect } from 'react';
import api from '../axiosConfig';

const ClassEnrollment = () => {
  // State management
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [viewMode, setViewMode] = useState('enroll'); // 'enroll' or 'view'
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('enroll'); // 'enroll' or 'unenroll'
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    enrolledCount: 0,
    unenrolledCount: 0
  });

  // Fetch classes and students on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, studentsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/users?role=student')
        ]);
        setClasses(classesRes.data);
        setStudents(studentsRes.data);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch enrolled students and update statistics when a class is selected
  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!selectedClass) return;
      
      try {
        setLoading(true);
        const res = await api.get(`/enrollments/class/${selectedClass}/students`);
        console.log(res);
        const enrolledIds = res.data.map(s => s.id);
        setEnrolledStudents(enrolledIds);
        
        // Update statistics
        setStatistics({
          totalStudents: students.length,
          enrolledCount: enrolledIds.length,
          unenrolledCount: students.length - enrolledIds.length
        });
      } catch (err) {
        setError('Failed to load enrolled students.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledStudents();
  }, [selectedClass, viewMode, students]);

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Handle select all students on current page
  const handleSelectPage = () => {
    const pageStudents = paginatedStudents.map(s => s.id);
    const allSelected = pageStudents.every(id => selectedStudents.includes(id));
    
    if (allSelected) {
      setSelectedStudents(selectedStudents.filter(id => !pageStudents.includes(id)));
    } else {
      setSelectedStudents([...new Set([...selectedStudents, ...pageStudents])]);
    }
  };

  // Handle select all matching students (all filtered)
  const handleSelectAllMatching = () => {
    const allMatchingIds = filteredStudents.map(s => s.id);
    const allSelected = allMatchingIds.every(id => selectedStudents.includes(id));
    
    if (allSelected) {
      setSelectedStudents(selectedStudents.filter(id => !allMatchingIds.includes(id)));
    } else {
      setSelectedStudents(allMatchingIds);
    }
  };

  // Handle enrollment submission
  const handleEnroll = async () => {
    if (!selectedClass || selectedStudents.length === 0) {
      setError('Please select a class and at least one student');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Create enrollment for each selected student
      await Promise.all(
        selectedStudents.map(studentId => 
          api.post('/enrollments', { class_id: selectedClass, student_id: studentId })
        )
      );

      setSuccess(`Successfully enrolled ${selectedStudents.length} student(s) in the class!`);
      setSelectedStudents([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to enroll students. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Handle unenrollment
  const handleUnenroll = async (studentId = null) => {
    try {
      setLoading(true);
      setError('');
      
      const studentsToUnenroll = studentId ? [studentId] : selectedStudents;
      
      if (!studentsToUnenroll.length) {
        setError('Please select at least one student to unenroll');
        return;
      }
      
      await Promise.all(
        studentsToUnenroll.map(id => 
          api.delete(`/enrollments/${selectedClass}/${id}`)
        )
      );

      setSuccess(`Successfully unenrolled ${studentsToUnenroll.length} student(s)!`);
      setSelectedStudents([]);
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh enrolled students
      const res = await api.get(`/enrollments/class/${selectedClass}/students`);
      setEnrolledStudents(res.data.map(s => s.id));
    } catch (err) {
      setError('Failed to unenroll students. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Filter students based on search term and grade filter
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      student.student_id?.toLowerCase().includes(searchLower)
    );
    
    const matchesGrade = gradeFilter === 'all' || student.grade_level == gradeFilter;
    
    return matchesSearch && matchesGrade;
  });

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const paginatedStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Grade level options (dynamic based on students)
  const gradeLevels = [...new Set(students.map(student => student.grade_level))]
    .filter(grade => grade !== null && grade !== undefined)
    .sort((a, b) => a - b);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Class Enrollment Management</h1>
          <p className="text-gray-600 mt-1">Manage student enrollments across all classes</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('enroll')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'enroll' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Enroll Students
          </button>
          <button 
            onClick={() => setViewMode('view')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'view' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            View Enrollments
          </button>
        </div>
      </div>

      {/* Statistics Card */}
      {selectedClass && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{statistics.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{statistics.enrolledCount}</div>
              <div className="text-sm text-gray-600">Enrolled</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-700">{statistics.unenrolledCount}</div>
              <div className="text-sm text-gray-600">Not Enrolled</div>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md border border-green-200">
          {success}
        </div>
      )}

      {/* Class Selection */}
      <div className="mb-8">
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        >
          <option value="">Choose a class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - Grade {cls.grade_level} ({cls.subject})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedClass ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Select a class to begin</h3>
          <p className="mt-1 text-sm text-gray-500">Choose a class from the dropdown to manage enrollments</p>
        </div>
      ) : viewMode === 'enroll'? (
        <>
          {/* Filter Section */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Students
              </label>
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Grade
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="all">All Grades</option>
                {gradeLevels.map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Actions */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={paginatedStudents.length > 0 && 
                    paginatedStudents.every(s => selectedStudents.includes(s.id))}
                  onChange={handleSelectPage}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Select page ({paginatedStudents.length})
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filteredStudents.length > 0 && 
                    filteredStudents.every(s => selectedStudents.includes(s.id))}
                  onChange={handleSelectAllMatching}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Select all matching ({filteredStudents.length})
                </label>
              </div>
            </div>
            
            {selectedStudents.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {selectedStudents.length} selected
                </span>
                <button
                  onClick={() => {
                    setBulkAction('enroll');
                    setShowConfirmModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Enroll Selected
                </button>
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Available Students ({filteredStudents.length})
            </h2>
            
            {filteredStudents.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto p-1">
                  {paginatedStudents.map(student => (
                    <div 
                      key={student.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                        selectedStudents.includes(student.id) 
                          ? 'bg-blue-50 border-blue-300 shadow-sm' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleStudentSelect(student.id)}
                    >
                      <div className="flex items-center">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mr-4" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </h3>
                          <div className="text-sm text-gray-500">
                            ID: {student.student_id} | Grade: {student.grade_level}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {enrolledStudents.includes(student.id) ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Already Enrolled
                          </span>
                        ) : (
                          <input 
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentSelect(student.id)}
                            className="h-5 w-5 text-blue-600 rounded"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === 1 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === totalPages 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* View Enrollments Mode */
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Currently Enrolled Students in {selectedClass}
            </h2>
            
            {selectedStudents.length > 0 && (
              <button
                onClick={() => {
                  setBulkAction('unenroll');
                  setShowConfirmModal(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Unenroll Selected ({selectedStudents.length})
              </button>
            )}
          </div>
          
          {enrolledStudents.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No students enrolled</h3>
              <p className="mt-1 text-sm text-gray-500">This class currently has no enrolled students</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={students
                          .filter(student => enrolledStudents.includes(student.id))
                          .every(s => selectedStudents.includes(s.id))}
                        onChange={(e) => {
                          const enrolledIds = students
                            .filter(student => enrolledStudents.includes(student.id))
                            .map(s => s.id);
                          
                          if (e.target.checked) {
                            setSelectedStudents([...new Set([...selectedStudents, ...enrolledIds])]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => !enrolledIds.includes(id)));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade Level
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students
                    .filter(student => enrolledStudents.includes(student.id))
                    .map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentSelect(student.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mr-3" />
                            <div className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Grade {student.grade_level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            className="text-red-600 hover:text-red-900 flex items-center"
                            onClick={() => handleUnenroll(student.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm {bulkAction === 'enroll' ? 'Enrollment' : 'Unenrollment'}
                </h3>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="mb-4">
                Are you sure you want to {bulkAction} {selectedStudents.length} student(s)?
              </p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => bulkAction === 'enroll' ? handleEnroll() : handleUnenroll()}
                  className={`px-4 py-2 text-white rounded-md ${
                    bulkAction === 'enroll' 
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassEnrollment;