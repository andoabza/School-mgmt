import React, { useState, useEffect } from 'react';
import moment from 'moment';
import api from '../axiosConfig';
import { toast } from 'react-toastify';
import { useUser } from '../context/userContext';
import { FiEdit, FiSave, FiClock, FiAlertCircle, FiCheckCircle, FiXCircle, FiUser, FiCalendar, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const AttendanceTracker = () => {
  const { user } = useUser();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [lateModal, setLateModal] = useState({ visible: false, studentId: null });
  const [excusedModal, setExcusedModal] = useState({ visible: false, studentId: null });
  const [remark, setRemark] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [existingAttendance, setExistingAttendance] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: moment().startOf('week').format('YYYY-MM-DD'),
    end: moment().endOf('week').format('YYYY-MM-DD')
  });
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'range'
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentAttendanceHistory, setStudentAttendanceHistory] = useState([]);

  // Status options with icons and colors
  const statusOptions = [
    { value: 'present', label: 'Present', color: '#10B981', icon: <FiCheckCircle /> },
    { value: 'absent', label: 'Absent', color: '#EF4444', icon: <FiXCircle /> },
    { value: 'late', label: 'Late', color: '#F59E0B', icon: <FiClock /> },
    { value: 'excused', label: 'Excused', color: '#3B82F6', icon: <FiAlertCircle /> },
  ];

  // Fetch classes based on user role
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        let endpoint = '/classes';
        
        if (user?.role === 'teacher') {
          endpoint = `/classes?teacherId=${user.id}`;
        } else if (user?.role === 'student') {
          endpoint = `/enrollments/student/${user.id}/classes`;
        } else if (user?.role === 'parent') {
          // For parents, we need to get their children first
          const childrenRes = await api.get(`/parents/${user.id}/children`);
          if (childrenRes.data.length > 0) {
            endpoint = `/enrollments/student/${childrenRes.data[0].id}/classes`;
          }
        }
        
        const res = await api.get(endpoint);
        setClasses(res.data);
        
        // Auto-select the first class for non-admins
        if (res.data.length > 0 && user?.role !== 'admin') {
          setSelectedClass(res.data[0].id);
        }
      } catch (error) {
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  // Fetch students and attendance data when class or date changes
  useEffect(() => {
    if (selectedClass) {
      if (viewMode === 'daily') {
        fetchClassStudents();
        fetchAttendanceData();
      } else {
        fetchAttendanceHistory();
      }
    }
  }, [selectedClass, selectedDate, dateRange, viewMode]);

  // Fetch students for the selected class
  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      let endpoint = `/enrollments/class/${selectedClass}/students`;
      
      if (user?.role === 'student') {
        // Students only see their own attendance
        const res = await api.get(`/users/${user.id}`);
        setStudents([res.data]);
        
        // Also fetch their attendance history for the sidebar
        const historyRes = await api.get(`/attendance/student/${user.id}?start=${dateRange.start}&end=${dateRange.end}`);
        setStudentAttendanceHistory(historyRes.data);
        return;
      } else if (user?.role === 'parent') {
        // Parents see their children's attendance
        const childrenRes = await api.get(`/parents/${user.id}/children`);
        if (childrenRes.data.length > 0) {
          const studentIds = childrenRes.data.map(child => child.id).join(',');
          endpoint += `?studentIds=${studentIds}`;
        }
      }
      
      const res = await api.get(endpoint);
      setStudents(res.data);
      
      // Initialize attendance statuses
      const initialAttendance = {};
      res.data.forEach(student => {
        initialAttendance[student.id] = {
          status: 'present',
          details: ''
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance data for a specific date
  const fetchAttendanceData = async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      let endpoint = `/attendance?classId=${selectedClass}&date=${selectedDate}`;
      
      if (user?.role === 'student') {
        endpoint += `&studentId=${user.id}`;
      } else if (user?.role === 'parent') {
        const childrenRes = await api.get(`/parents/${user.id}/children`);
        if (childrenRes.data.length > 0) {
          endpoint += `&studentId=${childrenRes.data[0].id}`;
        }
      }
      
      const res = await api.get(endpoint);
      if (res.data) {
        setExistingAttendance(res.data);
        setRemark(res.data.remark || "");
        
        // Pre-fill attendance statuses
        const filledAttendance = {};
        res.data.records.forEach(record => {
          filledAttendance[record.student_id] = {
            status: record.status,
            details: record.details || ''
          };
        });
        setAttendance(filledAttendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Fetch attendance history for a date range
  const fetchAttendanceHistory = async () => {
    if (!selectedClass) return;
    
    try {
      let endpoint = `/attendance/history?classId=${selectedClass}&start=${dateRange.start}&end=${dateRange.end}`;
      
      if (user?.role === 'student') {
        endpoint += `&studentId=${user.id}`;
      } else if (user?.role === 'parent') {
        const childrenRes = await api.get(`/parents/${user.id}/children`);
        if (childrenRes.data.length > 0) {
          endpoint += `&studentId=${childrenRes.data[0].id}`;
        }
      }
      
      const res = await api.get(endpoint);
      setExistingAttendance(res.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  // Handle status change for a student
  const handleStatusChange = (studentId, status) => {
    if (user?.role === 'student' || user?.role === 'parent') return;
    
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        status,
        details: prev[studentId]?.details || ''
      }
    }));

    if (status === 'late') {
      setLateModal({ visible: true, studentId });
    } else if (status === 'excused') {
      setExcusedModal({ visible: true, studentId });
    }
  };

  // Save late arrival details
  const saveLateDetails = (minutes) => {
    const { studentId } = lateModal;
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        status: 'late',
        details: `${minutes} minutes late`
      }
    }));
    setLateModal({ visible: false, studentId: null });
  };

  // Save excused absence reason
  const saveExcusedReason = (reason) => {
    const { studentId } = excusedModal;
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        status: 'excused',
        details: reason
      }
    }));
    setExcusedModal({ visible: false, studentId: null });
  };

  // Submit attendance data
  const submitAttendance = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    setLoading(true);
    try {
      const records = students.map(student => ({
        studentId: student.id,
        status: attendance[student.id]?.status || 'present',
        details: attendance[student.id]?.details || '',
      }));

      const payload = {
        classId: selectedClass,
        date: selectedDate,
        remark,
        records
      };

      const endpoint = existingAttendance 
        ? `/attendance/${existingAttendance.id}`
        : '/attendance';

      const method = existingAttendance ? 'put' : 'post';
      
      await api[method](endpoint, payload);
      toast.success('Attendance saved successfully!');
      setRemark("");
      setExistingAttendance({ ...payload, id: existingAttendance?.id });
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  // Mark all students with a specific status
  const markAll = (status) => {
    if (user?.role === 'student' || user?.role === 'parent') return;
    
    const newAttendance = { ...attendance };
    students.forEach(student => {
      newAttendance[student.id] = {
        status,
        details: status === 'late' ? '0 minutes late' : 
                 status === 'excused' ? 'Reason not specified' : ''
      };
    });
    setAttendance(newAttendance);
  };

  // Get status counts for summary
  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    students.forEach(student => {
      const status = attendance[student.id]?.status || 'present';
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Toggle student details expansion
  const toggleStudentExpansion = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  // Render different views based on user role
  const renderAdminTeacherView = () => (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <select
            onChange={(e) => markAll(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white"
            disabled={loading}
          >
            <option value="">Mark All As</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <textarea
            placeholder="Add remarks about today's class..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="p-2 border border-gray-300 rounded-md flex-grow min-w-[200px]"
            rows={1}
            disabled={loading}
          />
        </div>
        
        <button 
          onClick={submitAttendance}
          disabled={loading}
          className={`px-4 py-2 rounded-md flex items-center gap-1 min-w-[180px] justify-center ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <FiSave className="h-5 w-5" />
              {existingAttendance ? 'Update' : 'Save'} Attendance
            </>
          )}
        </button>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const status = attendance[student.id]?.status || 'present';
              const details = attendance[student.id]?.details || '';
              const statusInfo = statusOptions.find(opt => opt.value === status);
              
              return (
                <React.Fragment key={student.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleStudentExpansion(student.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {student.student_id} | Grade: {student.grade_level}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${statusInfo?.color}20`, border: `1px solid ${statusInfo?.color}` }}
                        >
                          {statusInfo.icon}
                        </div>
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                          className="p-1 border border-gray-300 rounded-md bg-white"
                          disabled={loading}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {details || '-'}
                    </td>
                  </tr>
                  {expandedStudent === student.id && (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 bg-gray-50">
                        <div className="text-sm text-gray-700">
                          <h4 className="font-medium mb-2">Attendance History (Last 7 Days)</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                            {Array.from({ length: 7 }).map((_, i) => {
                              const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
                              const historyItem = studentAttendanceHistory.find(item => item.date === date);
                              const status = historyItem?.status || 'not recorded';
                              
                              return (
                                <div key={date} className="text-center">
                                  <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                                  <div className="text-xs">{moment(date).format('MMM D')}</div>
                                  <div className={`mt-1 p-1 rounded-full text-xs ${
                                    status === 'present' ? 'bg-green-100 text-green-800' :
                                    status === 'absent' ? 'bg-red-100 text-red-800' :
                                    status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                    status === 'excused' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {status}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderStudentView = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
        <div>
          <h3 className="text-xl font-medium text-gray-900">
            {students[0]?.first_name} {students[0]?.last_name}
          </h3>
          <p className="text-gray-600">Student Id: {students[0]?.student_id} | Grade: {students[0]?.grade_level}</p>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Today's Attendance</h4>
        {existingAttendance ? (
          <div className="flex items-center">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center mr-3"
              style={{ 
                backgroundColor: `${statusOptions.find(opt => opt.value === existingAttendance.records[0]?.status)?.color}20`,
                border: `1px solid ${statusOptions.find(opt => opt.value === existingAttendance.records[0]?.status)?.color}`
              }}
            >
              {statusOptions.find(opt => opt.value === existingAttendance.records[0]?.status)?.icon}
            </div>
            <div>
              <p className="font-medium">
                {statusOptions.find(opt => opt.value === existingAttendance.records[0]?.status)?.label}
              </p>
              <p className="text-sm text-gray-600">
                {existingAttendance.records[0]?.details || 'No details provided'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Attendance not recorded yet</p>
        )}
      </div>
      
      <h4 className="font-medium text-gray-900 mb-3">Weekly Summary</h4>
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 mb-6">
        {Array.from({ length: 7 }).map((_, i) => {
          const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
          const historyItem = studentAttendanceHistory.find(item => item.date === date);
          const status = historyItem?.status || 'not recorded';
          
          return (
            <div key={date} className={`p-2 rounded-lg text-center ${
              date === selectedDate ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}>
              <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
              <div className="text-xs mb-1">{moment(date).format('MMM D')}</div>
              <div className={`text-xs p-1 rounded-full ${
                status === 'present' ? 'bg-green-100 text-green-800' :
                status === 'absent' ? 'bg-red-100 text-red-800' :
                status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                status === 'excused' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status}
              </div>
            </div>
          );
        })}
      </div>
      
      <h4 className="font-medium text-gray-900 mb-3">Attendance Statistics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOptions.map(status => (
          <div key={status.value} className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold" style={{ color: status.color }}>
              {studentAttendanceHistory.filter(item => item.status === status.value).length}
            </div>
            <div className="text-sm text-gray-600">{status.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderParentView = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-900 mb-4">My Children's Attendance</h3>
        <div className="space-y-4">
          {students.map(student => (
            <div key={student.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 mr-3" />
                <div>
                  <h4 className="font-medium">{student.first_name} {student.last_name}</h4>
                  <p className="text-sm text-gray-600">Grade {student.grade_level}</p>
                </div>
              </div>
              
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-800 mb-1">Today's Status</h5>
                {attendance[student.id] ? (
                  <div className="flex items-center">
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                      style={{ 
                        backgroundColor: `${statusOptions.find(opt => opt.value === attendance[student.id]?.status)?.color}20`,
                        border: `1px solid ${statusOptions.find(opt => opt.value === attendance[student.id]?.status)?.color}`
                      }}
                    >
                      {statusOptions.find(opt => opt.value === attendance[student.id]?.status)?.icon}
                    </div>
                    <div>
                      <p className="text-sm">
                        {statusOptions.find(opt => opt.value === attendance[student.id]?.status)?.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {attendance[student.id]?.details || 'No details provided'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Not recorded yet</p>
                )}
              </div>
              
              <button 
                onClick={() => toggleStudentExpansion(student.id)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                {expandedStudent === student.id ? (
                  <>
                    <FiChevronUp className="mr-1" /> Hide details
                  </>
                ) : (
                  <>
                    <FiChevronDown className="mr-1" /> View weekly summary
                  </>
                )}
              </button>
              
              {expandedStudent === student.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2">Weekly Attendance</h5>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
                      const historyItem = studentAttendanceHistory.find(item => 
                        item.date === date && item.student_id === student.id
                      );
                      const status = historyItem?.status || 'not recorded';
                      
                      return (
                        <div key={date} className="text-center">
                          <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                          <div className={`text-xs p-1 rounded ${
                            status === 'present' ? 'bg-green-100 text-green-800' :
                            status === 'absent' ? 'bg-red-100 text-red-800' :
                            status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'excused' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {moment(date).format('D')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance Tracking</h2>
          <p className="text-gray-600">
            {user?.role === 'admin' ? 'Manage all class attendance' : 
             user?.role === 'teacher' ? 'Track your class attendance' : 
             user?.role === 'student' ? 'View your attendance records' : 
             'View your children\'s attendance'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {user?.role !== 'student' && user?.role !== 'parent' && (
            <>
              <select 
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
                className='p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                disabled={loading || classes.length === 0}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - Grade {cls.grade_level}
                  </option>
                ))}
              </select>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-2 rounded-md text-sm ${
                    viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Daily View
                </button>
                <button
                  onClick={() => setViewMode('range')}
                  className={`px-3 py-2 rounded-md text-sm ${
                    viewMode === 'range' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Date Range
                </button>
              </div>
            </>
          )}
          
          {viewMode === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              max={moment().format('YYYY-MM-DD')}
              disabled={loading || (user?.role !== 'admin' && user?.role !== 'teacher')}
            />
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                max={moment().format('YYYY-MM-DD')}
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                max={moment().format('YYYY-MM-DD')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      {(user?.role === 'admin' || user?.role === 'teacher') && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statusOptions.map(status => (
            <div key={status.value} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${status.color}20`, border: `1px solid ${status.color}` }}
                >
                  {status.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: status.color }}>
                    {statusCounts[status.value]}
                  </div>
                  <div className="text-sm text-gray-600">{status.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedClass && (user?.role === 'admin' || user?.role === 'teacher') ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <FiFilter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Select a class to view attendance</h3>
          <p className="mt-1 text-sm text-gray-500">Choose a class from the dropdown to begin</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            {user?.role === 'parent' ? 'No children enrolled' : 'No students enrolled'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'parent' ? 
              'Your children are not enrolled in any classes' : 
              'This class currently has no enrolled students'}
          </p>
        </div>
      ) : (
        <>
          {user?.role === 'admin' || user?.role === 'teacher' ? renderAdminTeacherView() : 
           user?.role === 'student' ? renderStudentView() : 
           renderParentView()}
        </>
      )}

      {/* Late Modal */}
      {lateModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Record Late Arrival</h3>
                <button 
                  onClick={() => setLateModal({ visible: false, studentId: null })}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="mb-4">How many minutes late is the student?</p>
              
              <div className="flex flex-wrap justify-end gap-2">
                <button 
                  onClick={() => setLateModal({ visible: false, studentId: null })}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                {[5, 10, 15, 20, 30].map(minutes => (
                  <button 
                    key={minutes}
                    onClick={() => saveLateDetails(minutes)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {minutes} Min
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excused Modal */}
      {excusedModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Record Excused Absence</h3>
                <button 
                  onClick={() => setExcusedModal({ visible: false, studentId: null })}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="mb-2">Reason for absence:</p>
              <textarea
                placeholder="Enter reason (e.g. doctor appointment, family event)"
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                id="excuse-reason"
              />
              
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setExcusedModal({ visible: false, studentId: null })}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const reason = document.getElementById('excuse-reason').value || 'Reason not specified';
                    saveExcusedReason(reason);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Reason
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;