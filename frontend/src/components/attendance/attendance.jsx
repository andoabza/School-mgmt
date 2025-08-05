// attendanceTracker.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import moment from 'moment';
import api from '../../axiosConfig';
import { toast } from 'react-toastify';
import { useUser } from '../../context/userContext';
import { 
  FiEdit, FiSave, FiClock, FiAlertCircle, FiCheckCircle, 
  FiXCircle, FiUser, FiCalendar, FiFilter, FiChevronDown, 
  FiChevronUp, FiSearch, FiBarChart2, FiGrid, FiList, FiPrinter 
} from 'react-icons/fi';
import { CSVLink } from 'react-csv';
import { AdminView } from './AdminView';
import { TeacherView }  from './teacherView';
import { ParentView } from './parentView';
import { StudentView } from './studentView';

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
    start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [viewMode, setViewMode] = useState('daily');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentAttendanceHistory, setStudentAttendanceHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [displayMode, setDisplayMode] = useState('table');
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [monthAttendance, setMonthAttendance] = useState([]);
  const [exportData, setExportData] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [ws, setWs] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);
  const [error, setError] = useState('');

  // Status options
  const statusOptions = [
    { value: 'present', label: 'Present', color: '#10B981', icon: <FiCheckCircle /> },
    { value: 'absent', label: 'Absent', color: '#EF4444', icon: <FiXCircle /> },
    { value: 'late', label: 'Late', color: '#F59E0B', icon: <FiClock /> },
    { value: 'excused', label: 'Excused', color: '#3B82F6', icon: <FiAlertCircle /> },
  ];

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    if (!user) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${localStorage.getItem('token')}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({ 
        type: 'subscribe', 
        userId: user.id,
        role: user.role 
      }));
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'attendanceUpdate') {
        setRealtimeUpdates(prev => [...prev, data]);
        toast.info(`Attendance updated: ${data.studentName} marked as ${data.status}`);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setWs(socket);
    
    return () => {
      if (socket.readyState === 1) {
        socket.close();
      }
    };
  }, [user]);

  // Apply real-time updates
  useEffect(() => {
    if (realtimeUpdates.length > 0) {
      const lastUpdate = realtimeUpdates[realtimeUpdates.length - 1];
      
      if (lastUpdate.classId === selectedClass && 
          lastUpdate.date === selectedDate) {
        setAttendance(prev => ({
          ...prev,
          [lastUpdate.studentId]: {
            status: lastUpdate.status,
            details: lastUpdate.details || ''
          }
        }));
        
        // Refetch data to ensure consistency
        fetchAttendanceData();
      }
    }
  }, [realtimeUpdates, selectedClass, selectedDate]);

  // Find attendance record for a student on a specific date
  const findAttendanceRecord = useCallback((studentId, date) => {
    if (!studentAttendanceHistory.length) return null;
    console.log(existingAttendance);
    // First check existing attendance for the day
    if (existingAttendance && existingAttendance.records) {
      const record = existingAttendance.records.find(
        r => r.student_id === studentId && r.date === date
      );
      if (record) return record;
    }
    
    // Then check student-specific history
    return studentAttendanceHistory.find(
      item => item.student_id === studentId && item.date === date
    );
  }, [studentAttendanceHistory, existingAttendance]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const studentStatus = attendance[student.id]?.status;
      const matchesStatus = statusFilter === 'all' || studentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter, attendance]);

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    const stats = {
      total: students.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      presentPercentage: 0
    };

    students.forEach(student => {
      const status = attendance[student.id]?.status;
      if (stats[status] !== undefined) stats[status]++;
    });

    if (stats.total > 0) {
      stats.presentPercentage = Math.round((stats.present / stats.total) * 100);
    }

    return stats;
  }, [students, attendance]);

  // Prepare data for export
  const prepareExportData = useCallback(() => {
    const data = [];
    
    // Add headers
    data.push(['Student ID', 'Name', 'Status', 'Details', 'Date', 'Class']);
    
    // Add student records
    students.forEach(student => {
      const status = attendance[student.id]?.status || 'present';
      const details = attendance[student.id]?.details || '';
      
      data.push([
        student.student_id || '',
        `${student.first_name} ${student.last_name}`,
        status.charAt(0).toUpperCase() + status.slice(1),
        details,
        selectedDate,
        classes.find(c => c.id === selectedClass)?.name || ''
      ]);
    });
    
    return data;
  }, [students, attendance, selectedDate, classes, selectedClass]);

  // Fetch classes based on user role
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        let endpoint = '/classes';
        
        if (user?.role === 'teacher') {
          endpoint = `/teacher/${user.id}/classes`;
        } else if (user?.role === 'student') {
          endpoint = `/enrollments/student/${user.id}/classes`;
        } else if (user?.role === 'parent') {
          const childrenRes = await api.get(`/parents/${user.id}/children`);
          setChildren(childrenRes.data);
          
          if (childrenRes.data.length > 0) {
            setSelectedChild(childrenRes.data[0].id);
            const classesRes = await api.get(`/enrollments/student/${childrenRes.data[0].id}/classes`);
            setClasses(classesRes.data);
            
            if (classesRes.data.length > 0) {
              setSelectedClass(classesRes.data[0].id);
            }
          }
          setLoading(false);
          return;
        }
        
        const res = await api.get(endpoint);
        setClasses(res.data);
        
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

  // Fetch students and attendance data
  useEffect(() => {
    if (selectedClass) {
      if (viewMode === 'daily') {
        fetchClassStudents();
        fetchAttendanceData();
      } else if (viewMode === 'range') {
        fetchAttendanceHistory();
      } else {
        fetchMonthAttendance();
      }
    }
  }, [selectedClass, selectedDate, dateRange, viewMode, selectedChild]);

  // Prepare export data
  useEffect(() => {
    if (students.length > 0 && selectedClass) {
      setExportData(prepareExportData());
    }
  }, [students, attendance, selectedClass, selectedDate, prepareExportData]);

  // Fetch students for the selected class
  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      let endpoint = `/enrollments/class/${selectedClass}/students`;
      
      if (user?.role === 'student') {
        const res = await api.get(`/users/me`);
        setStudents([res.data]);
        
        const historyRes = await api.get(`/attendance/student/${user.id}?start=${dateRange.start}&end=${dateRange.end}`);
        setStudentAttendanceHistory(historyRes.data);
        return;
      } else if (user?.role === 'parent') {
        if (selectedChild) {
          setStudents([children.find(child => child.id === selectedChild)]);
        } else {
          setStudents([]);
        }
        setLoading(false);
        return;
      }
      
      const res = await api.get(endpoint);
      setStudents(res.data);
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

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      let endpoint = `/attendance?classId=${selectedClass}&date=${selectedDate}`;
      
      if (user?.role === 'student') {
        endpoint += `&studentId=${user.id}`;
      } else if (user?.role === 'parent' && selectedChild) {
        endpoint += `&studentId=${selectedChild}`;
      }
      
      const res = await api.get(endpoint);
      if (res.data) {
        setExistingAttendance(res.data);
        setRemark(res.data.remark || "");
        
        const filledAttendance = {};
        res.data.records.forEach(record => {
          filledAttendance[record.student_id] = {
            status: record.status,
            details: record.details || ''
          };
        });
        setAttendance(filledAttendance);
      } else {
        setExistingAttendance(null);
        setRemark("");
        
        // Initialize attendance if none exists
        const initialAttendance = {};
        students.forEach(student => {
          initialAttendance[student.id] = {
            status: 'present',
            details: 'present'
          };
        });
        setAttendance(initialAttendance);
        
        // Show warning for new date
        if (students.length > 0 && user?.role !== 'student' && user?.role !== 'parent') {
          toast.warn(`No attendance recorded for ${moment(selectedDate).format('MMM D, YYYY')}. Please add records.`);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    }
  };

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    if (!selectedClass) return;
    
    try {
      let endpoint = `/attendance/history?classId=${selectedClass}&start=${dateRange.start}&end=${dateRange.end}`;
      
      if (user?.role === 'student') {
        endpoint += `&studentId=${user.id}`;
      } else if (user?.role === 'parent' && selectedChild) {
        endpoint += `&studentId=${selectedChild}`;
      }
      
      const res = await api.get(endpoint);
      if (!res.data || res.data.length === 0) {
        toast.warn('No attendance recorded for selected date range');
      }
      setExistingAttendance(res.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Failed to load attendance history');
    }
  };

  // Fetch month attendance
  const fetchMonthAttendance = async (studentId) => {
    if (!selectedClass) return;
    try {
      const startOfMonth = moment(selectedMonth).startOf('month').format('YYYY-MM-DD');
      const currentDate = moment().format('YYYY-MM-DD')
      
      let endpoint = `/attendance/student/${studentId || user?.id}?start=${startOfMonth}&end=${currentDate}`;
        
      if (user?.role === 'parent' && selectedChild) {
        endpoint += `&studentId=${selectedChild}`;
      }

      const res = await api.get(endpoint);
      if (user?.role != 'student')
        setStudentAttendanceHistory(res.data);
      setMonthAttendance(res.data);
      return res.data;
    } catch (error) {
      console.error('Error fetching month attendance:', error);
      toast.error('Failed to load monthly attendance');
    }
  };

  // Handle status change
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

  // Save late details
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
    
    // Send real-time update
    if (ws && ws.readyState === WebSocket.OPEN) {
      const student = students.find(s => s.id === studentId);
      ws.send(JSON.stringify({
        type: 'attendanceUpdate',
        classId: selectedClass,
        date: selectedDate,
        studentId,
        studentName: `${student.first_name} ${student.last_name}`,
        status: 'late',
        details: `${minutes} minutes late`
      }));
    }
  };

  // Save excused reason
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
    
    // Send real-time update
    if (ws && ws.readyState === WebSocket.OPEN) {
      const student = students.find(s => s.id === studentId);
      ws.send(JSON.stringify({
        type: 'attendanceUpdate',
        classId: selectedClass,
        date: selectedDate,
        studentId,
        studentName: `${student.first_name} ${student.last_name}`,
        status: 'excused',
        details: reason
      }));
    }
  };

  // Submit attendance
  const submitAttendance = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      setError('Please select a class first');
      return;
    }

    setLoading(true);
    try {
      const records = students.map(student => ({
        studentId: student.id,
        status: attendance[student.id]?.status || 'present',
        details: attendance[student.id]?.details || attendance[student.id]?.status,
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
      
      // Fetch updated data
      fetchAttendanceData();
    } catch (error) {
      toast.error('Failed to save attendance select students status');
    } finally {
      setLoading(false);
    }
  };

  // Mark all students with a status
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

  const renderView = () => {
    if (user?.role === 'admin') {
      return (
        <AdminView
          students={students}
          attendance={attendance}
          selectedDate={selectedDate}
          loading={loading}
          lateModal={lateModal}
          setLateModal={setLateModal}
          excusedModal={excusedModal}
          setExcusedModal={setExcusedModal}
          remark={remark}
          setRemark={setRemark}
          classes={classes}
          selectedClass={selectedClass}
          existingAttendance={existingAttendance}
          dateRange={dateRange}
          viewMode={viewMode}
          expandedStudent={expandedStudent}
          setExpandedStudent={setExpandedStudent}
          studentAttendanceHistory={studentAttendanceHistory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          selectedMonth={selectedMonth}
          monthAttendance={monthAttendance}
          exportData={exportData}
          statusOptions={statusOptions}
          attendanceStats={attendanceStats}
          handleStatusChange={handleStatusChange}
          fetchMonthAttendance={fetchMonthAttendance}
          markAll={markAll}
          submitAttendance={submitAttendance}
          filteredStudents={filteredStudents}
        />
      );
    } else if (user?.role === 'teacher') {
      return (
        <TeacherView
          students={students}
          attendance={attendance}
          selectedDate={selectedDate}
          loading={loading}
          lateModal={lateModal}
          setLateModal={setLateModal}
          excusedModal={excusedModal}
          setExcusedModal={setExcusedModal}
          remark={remark}
          setRemark={setRemark}
          classes={classes}
          selectedClass={selectedClass}
          existingAttendance={existingAttendance}
          dateRange={dateRange}
          viewMode={viewMode}
          expandedStudent={expandedStudent}
          setExpandedStudent={setExpandedStudent}
          studentAttendanceHistory={studentAttendanceHistory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          selectedMonth={selectedMonth}
          monthAttendance={monthAttendance}
          exportData={exportData}
          statusOptions={statusOptions}
          attendanceStats={attendanceStats}
          handleStatusChange={handleStatusChange}
          fetchMonthAttendance={fetchMonthAttendance}
          markAll={markAll}
          submitAttendance={submitAttendance}
          filteredStudents={filteredStudents}
        />
      );
    } else if (user?.role === 'parent') {
      return (
        <ParentView
          students={students}
          attendance={attendance}
          selectedDate={selectedDate}
          classes={classes}
          selectedClass={selectedClass}
          existingAttendance={existingAttendance}
          statusOptions={statusOptions}
          findAttendanceRecord={findAttendanceRecord}
          children={children}
          selectedChild={selectedChild}
        />
      );
    } else if (user?.role === 'student') {
      return (
        <StudentView
          students={students}
          selectedDate={selectedDate}
          classes={classes}
          selectedClass={selectedClass}
          existingAttendance={existingAttendance}
          statusOptions={statusOptions}
          findAttendanceRecord={findAttendanceRecord}
          studentAttendanceHistory={studentAttendanceHistory}
        />
      );
    }
    return null;
  };

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
          {/* Child selection for parent */}
          {user?.role === 'parent' && children.length > 0 && (
            <select 
              value={selectedChild || ''}
              onChange={async (e) => {
                const childId = parseInt(e.target.value);
                setSelectedChild(childId);
                setLoading(true);
                try {
                  const res = await api.get(`/enrollments/student/${childId}/classes`);
                  setClasses(res.data);
                  setSelectedClass(res.data.length > 0 ? res.data[0].id : null);
                } catch (error) {
                  toast.error('Failed to load classes for the selected child');
                } finally {
                  setLoading(false);
                }
              }}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          )}
          
          {/* Class selection */}
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            // setSelectedClass(classes)
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

          )}
          {error && (
              <span className="text-red-">{error}</span>
              )}
          
          {/* View mode selection */}
          {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'student') && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-2 rounded-md text-sm ${
                  viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
              {user?.role == 'admin' || user?.role == 'teacher' && (
              <button
                onClick={() => setViewMode('range')}
                className={`px-3 py-2 rounded-md text-sm ${
                  viewMode === 'range' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Range
              </button>
              )}
              {user?.role == 'student' && (
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-2 rounded-md text-sm ${
                  viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              )}
            </div>
          )}
          
          {/* Date selection */}
          {viewMode === 'daily' ? (
            <div className="relative">
              <FiCalendar className="absolute  left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 p-2 bg-gray-500 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                max={moment().format('YYYY-MM-DD')}
                disabled={loading}
              />
            </div>
          ) : viewMode === 'range' ? (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="pl-10 p-2 border bg-gray-500 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  max={moment().format('YYYY-MM-DD')}
                />
              </div>
              <span className="text-gray-500">to</span>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="pl-10 p-2 border bg-gray-500 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  max={moment().format('YYYY-MM-DD')}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-10 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  max={moment().format('YYYY-MM')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'monthly' ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-xl font-medium text-gray-900 mb-4">
    Monthly Attendance - {moment(selectedMonth).format('MMMM YYYY')}
  </h3>
  <div className="grid grid-cols-7 gap-1 mb-4">
    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
      <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
        {day}
      </div>
    ))}
    {Array.from({ length: moment(selectedMonth).startOf('month').day() }).map((_, i) => (
      <div key={`empty-${i}`} className="p-4"></div>
    ))}
    {Array.from({ length: moment(selectedMonth).daysInMonth() }).map((_, i) => {
      const day = i + 1;
      const date = moment(selectedMonth).date(day).format('YYYY-MM-DD');
      // Find the student's attendance record for this date
      const studentRecord = studentAttendanceHistory.find(item => 
        moment(item.created_at).format('YYYY-MM-DD') === date
      );
      
      // Determine background color based on status
      let bgColor = 'bg-gray-50'; // Default for no record
      let borderColor = 'border-gray-200';
      let statusText = '';
      
      if (studentRecord) {
        statusText = studentRecord.status.charAt(0).toUpperCase();
        switch(studentRecord.status) {
          case 'present':
            bgColor = 'bg-green-500';
            borderColor = 'border-green-200';
            break;
          case 'absent':
            bgColor = 'bg-red-500';
            borderColor = 'border-red-200';
            break;
          case 'late':
            bgColor = 'bg-amber-500';
            borderColor = 'border-amber-200';
            break;
          case 'excused':
            bgColor = 'bg-blue-500';
            borderColor = 'border-blue-200';
            break;
        }
      }
      
      return (
        <div 
          key={date} 
          className={`p-3 border rounded-lg text-center ${bgColor} ${borderColor} hover:shadow-sm transition-shadow`}
          title={studentRecord ? `Status: ${studentRecord.status}` : 'No attendance recorded'}
        >
          <div className="text-sm">{day}</div>
          {studentRecord && (
            <div className={`mt-1 mx-auto h-6 w-6 rounded-full flex items-center justify-center ${
              studentRecord.status === 'present' ? 'bg-green-500 text-green-800' :
              studentRecord.status === 'absent' ? 'bg-red-500 text-red-800' :
              studentRecord.status === 'late' ? 'bg-amber-500 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {statusText}
            </div>
          )}
        </div>
      );
    })}
  </div>
  <div className="mt-4 flex flex-wrap gap-4 justify-center">
    <div className="flex items-center">
      <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300 mr-2"></div>
      <span className="text-sm">Present</span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300 mr-2"></div>
      <span className="text-sm">Absent</span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 rounded-full bg-amber-100 border border-amber-300 mr-2"></div>
      <span className="text-sm">Late</span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
      <span className="text-sm">Excused</span>
    </div>
    <div className="flex items-center">
      <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-300 mr-2"></div>
      <span className="text-sm">No Record</span>
    </div>
  </div>
</div>
      ) : loading ? (
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
        renderView()
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

// adminView.jsx
import React from 'react';
import moment from 'moment';
import { 
  FiEdit, FiSave, FiClock, FiAlertCircle, FiCheckCircle, 
  FiXCircle, FiUser, FiCalendar, FiFilter, FiChevronDown, 
  FiChevronUp, FiSearch, FiBarChart2, FiGrid, FiList, FiPrinter 
} from 'react-icons/fi';
import { CSVLink } from 'react-csv';

export const AdminView = ({
  students,
  attendance,
  selectedDate,
  loading,
  lateModal,
  setLateModal,
  excusedModal,
  setExcusedModal,
  remark,
  setRemark,
  classes,
  selectedClass,
  existingAttendance,
  dateRange,
  viewMode,
  expandedStudent,
  setExpandedStudent,
  studentAttendanceHistory,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  displayMode,
  setDisplayMode,
  selectedMonth,
  monthAttendance,
  exportData,
  statusOptions,
  attendanceStats,
  handleStatusChange,
  findAttendanceRecord,
  markAll,
  submitAttendance,
  filteredStudents
}) => {
  const weekStart = moment().startOf('isoWeek');
  return (
    <>
      {!existingAttendance && viewMode === 'daily' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>No attendance recorded for {moment(selectedDate).format('MMM D, YYYY')}.</strong> 
                {' '}Please mark attendance and save.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <select
            onChange={(e) => markAll(e.target.value || 'present')}
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
        
        <div className="flex gap-2">
          <button
            onClick={() => setDisplayMode(displayMode === 'table' ? 'card' : 'table')}
            className="p-2 border border-gray-300 rounded-md bg-white flex items-center"
          >
            {displayMode === 'table' ? <FiGrid className="mr-1" /> : <FiList className="mr-1" />}
            {displayMode === 'table' ? 'Card View' : 'Table View'}
          </button>
          
          {exportData.length > 0 && (
            <CSVLink 
              data={exportData} 
              filename={`attendance-${selectedDate}-${classes.find(c => c.id === selectedClass)?.name || 'class'}.csv`}
              className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center"
            >
              <FiPrinter className="mr-1" /> Export CSV
            </CSVLink>
          )}
          
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
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{attendanceStats.total}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        
        {statusOptions.map(status => (
          <div key={status.value} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                style={{ backgroundColor: `${status.color}20`, border: `1px solid ${status.color}` }}
              >
                {status.icon}
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: status.color }}>
                  {attendanceStats[status.value]}
                </div>
                <div className="text-sm text-gray-600">{status.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Table View */}
      {displayMode === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  History
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const status = attendance[student.id]?.status || 'present';
                const details = attendance[student.id]?.details || '';
                const statusInfo = statusOptions.find(opt => opt.value === status);
                
                return (
                  <React.Fragment key={student.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Grade: {student.grade_level} | Class: {student.class_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.student_id || 'N/A'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        <button 
                          onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                          className="flex items-center"
                        >
                          {expandedStudent === student.id ? (
                            <>
                              <FiChevronUp className="mr-1" /> Hide
                            </>
                          ) : (
                            <>
                              <FiChevronDown className="mr-1" /> View
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedStudent === student.id && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50">
                          <div className="text-sm text-gray-700">
                            <h4 className="font-medium mb-2">Attendance History (Last 7 Days)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                              {Array.from({ length: 7 }).map((_, i) => {
                                const date = weekStart.clone().add(i, 'days').format('YYYY-MM-DD');
                                const historyItem = findAttendanceRecord(student.id, date);
                                const status = historyItem?.status || 'not recorded';
                                const statusInfo = statusOptions.find(opt => opt.value === status) || 
                                                 { color: '#9CA3AF', icon: <FiCalendar /> };
                                
                                return (
                                  <div key={date} className="text-center p-2 bg-white rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                                    <div className="text-xs mb-1">{moment(date).format('MMM D')}</div>
                                    <div 
                                      className="mx-auto h-8 w-8 rounded-full flex items-center justify-center"
                                      style={{ 
                                        backgroundColor: `${statusInfo.color}20`, 
                                        border: `1px solid ${statusInfo.color}` 
                                      }}
                                    >
                                      {statusInfo.icon}
                                    </div>
                                    <div className="text-xs mt-1 capitalize">
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
      ) : (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const status = attendance[student.id]?.status;
            const details = attendance[student.id]?.details;
            const statusInfo = statusOptions.find(opt => opt.value === status);
            
            return (
              <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {student.student_id || 'N/A'} | Grade {student.grade_level}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center mr-2"
                        style={{ 
                          backgroundColor: `${statusInfo?.color}20`, 
                          border: `1px solid ${statusInfo?.color}` 
                        }}
                      >
                        {statusInfo?.icon}
                      </div>
                      <div>
                        <div className="font-medium">{statusInfo?.label}</div>
                        <div className="text-sm text-gray-600">{details || 'No details'}</div>
                      </div>
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
                  
                  <button 
                    onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                    className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                  >
                    {expandedStudent === student.id ? (
                      <>
                        <FiChevronUp className="mr-1" /> Hide history
                      </>
                    ) : (
                      <>
                        <FiChevronDown className="mr-1" /> Show history
                      </>
                    )}
                  </button>
                  
                  {expandedStudent === student.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium mb-2">Recent Attendance</h4>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.apply(Array(7), null).map((_, i) => {
                          const date = moment(i, 'e').startOf('week').isoWeekday(i + 1).format('YYYY-MM-DD');
                          const historyItem = findAttendanceRecord(student.id, date);
                          const status = historyItem?.status || 'not recorded';
                          const statusInfo = statusOptions.find(opt => opt.value === status) || 
                                          { color: '#9CA3AF', icon: <FiCalendar /> };
                          
                          return (
                            <div key={date} className="text-center">
                              <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                              <div 
                                className="mx-auto h-6 w-6 rounded-full flex items-center justify-center"
                                style={{ 
                                  backgroundColor: `${statusInfo.color}20`, 
                                  border: `1px solid ${statusInfo.color}` 
                                }}
                              >
                                {statusInfo.icon}
                              </div>
                              <div className="text-xs mt-1 capitalize">
                                {status}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// teacherView.jsx
import React, { useState } from 'react';
import moment from 'moment';
import { 
  FiEdit, FiSave, FiClock, FiAlertCircle, FiCheckCircle, 
  FiXCircle, FiUser, FiCalendar, FiFilter, FiChevronDown, 
  FiChevronUp, FiSearch, FiBarChart2, FiGrid, FiList, FiPrinter 
} from 'react-icons/fi';
import { CSVLink } from 'react-csv';

export const TeacherView = ({
  attendance,
  handleStatusChange,
  loading,
  existingAttendance,
  remark,
  setRemark,
  submitAttendance,
  statusOptions,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  attendanceStats,
  displayMode,
  setDisplayMode,
  exportData,
  filteredStudents,
  expandedStudent,
  setExpandedStudent,
  fetchMonthAttendance,
  classes,
  selectedClass
}) => {
  
  return (
    <>
      {!existingAttendance && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>No attendance recorded for today.</strong> 
                {' '}Please mark attendance and save.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <textarea
            placeholder="Add remarks about today's class..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="p-2 border border-gray-300 rounded-md flex-grow min-w-[200px]"
            rows={1}
            disabled={loading}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setDisplayMode(displayMode === 'table' ? 'card' : 'table')}
            className="p-2 border border-gray-300 rounded-md bg-white flex items-center"
          >
            {displayMode === 'table' ? <FiGrid className="mr-1" /> : <FiList className="mr-1" />}
            {displayMode === 'table' ? 'Card View' : 'Table View'}
          </button>
          
          {exportData.length > 0 && (
            <CSVLink 
              data={exportData} 
              filename={`attendance-${classes.find(c => c.id === selectedClass)?.name || 'class'}.csv`}
              className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center"
            >
              <FiPrinter className="mr-1" /> Export CSV
            </CSVLink>
          )}
          
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
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{attendanceStats.total}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        
        {statusOptions.map(status => (
          <div key={status.value} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                style={{ backgroundColor: `${status.color}20`, border: `1px solid ${status.color}` }}
              >
                {status.icon}
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: status.color }}>
                  {attendanceStats[status.value]}
                </div>
                <div className="text-sm text-gray-600">{status.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Table View */}
      {displayMode === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  History
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const status = attendance[student.id]?.status || 'present';
                const details = attendance[student.id]?.details || '';
                const statusInfo = statusOptions.find(opt => opt.value === status);
                
                return (
                  <React.Fragment key={student.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Grade: {student.grade_level}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.student_id || 'N/A'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        <button 
                    onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}

                          className="flex items-center"
                        >
                          {expandedStudent === student.id ? (
                            <>
                              <FiChevronUp className="mr-1" /> Hide
                            </>
                          ) : (
                            <>
                              <FiChevronDown className="mr-1" /> View
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedStudent === student.id && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50">
                          <div className="text-sm text-gray-700">
                            <h4 className="font-medium mb-2">Attendance History (Last 7 Days)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                              {Array.from({ length: 7 }).map((_, i) => {
                                const date = moment().startOf('week').add(i, 'days').format('YYYY-MM-DD');
                                const historyItem = fetchMonthAttendance(student.id);
                                
                                const status = historyItem?.status || 'not recorded';
                                
                                const statusInfo = statusOptions.find(opt => opt.value === status) || 
                                                 { color: '#9CA3AF', icon: <FiCalendar /> };
                                
                                return (
                                  <div key={date} className="text-center p-2 bg-white rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                                    <div className="text-xs mb-1">{moment(date).format('MMM D')}</div>
                                    <div 
                                      className="mx-auto h-8 w-8 rounded-full flex items-center justify-center"
                                      style={{ 
                                        backgroundColor: `${statusInfo.color}20`, 
                                        border: `1px solid ${statusInfo.color}` 
                                      }}
                                    >
                                      {statusInfo.icon}
                                    </div>
                                    <div className="text-xs mt-1 capitalize">
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
      ) : (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const status = attendance[student.id]?.status;
            const details = attendance[student.id]?.details;
            const statusInfo = statusOptions.find(opt => opt.value === status);
            
            return (
              <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {student.student_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center mr-2"
                        style={{ 
                          backgroundColor: `${statusInfo?.color}20`, 
                          border: `1px solid ${statusInfo?.color}` 
                        }}
                      >
                        {statusInfo?.icon}
                      </div>
                      <div>
                        <div className="font-medium">{statusInfo?.label}</div>
                        <div className="text-sm text-gray-600">{details || 'No details'}</div>
                      </div>
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
                  
                  <button 
                    onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                    className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                  >
                    {expandedStudent === student.id ? (
                      <>
                        <FiChevronUp className="mr-1" /> Hide history
                      </>
                    ) : (
                      <>
                        <FiChevronDown className="mr-1" /> Show history
                      </>
                    )}
                  </button>
                  
                  {expandedStudent === student.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium mb-2">Recent Attendance</h4>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }).map((_, i) => {
                          const date = moment().startOf('week').add(i, 'days').format('YYYY-MM-DD');
                          const historyItem = history(student.id);
                          const status = historyItem?.status || 'not recorded';
                          const statusInfo = statusOptions.find(opt => opt.value === status) || 
                                          { color: '#9CA3AF', icon: <FiCalendar /> };
                          
                          return (
                            <div key={date} className="text-center">
                              <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                              <div 
                                className="mx-auto h-6 w-6 rounded-full flex items-center justify-center"
                                style={{ 
                                  backgroundColor: `${statusInfo.color}20`, 
                                  border: `1px solid ${statusInfo.color}` 
                                }}
                              >
                                {statusInfo.icon}
                              </div>
                              <div className="text-xs mt-1 capitalize">
                                {status}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
//studentView.jsx
import React from 'react';
import { FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import moment from 'moment';

export const StudentView = ({
  students,
  existingAttendance,
  selectedDate,
  studentAttendanceHistory,
  statusOptions,
  classes,
}) => {
  const currentStudent = students.length > 0 ? students[0] : null;
  const studentAttendance = studentAttendanceHistory.filter(item => item.student_id === currentStudent?.id)
  //   : [];
  const cls = classes.map(cls => cls)[0];
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {currentStudent ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
              <div>
                <h2 className="text-xl font-bold">
                  {currentStudent.firstName} {currentStudent.lastName}
                </h2>
                <p className="text-gray-600">ID: {currentStudent.studentId || 'N/A'} | Grade {currentStudent.gradeLevel}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {moment(selectedDate).format('dddd, MMMM D, YYYY')}
              </div>
              <div className="text-gray-600">
                {cls?.class_name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Today's Status</h3>
              {existingAttendance && existingAttendance.records && existingAttendance.records.length > 0 ? (
                <div className="flex items-center">
                  {statusOptions.map(option => {
                    if (option.value === existingAttendance.records[0].status) {
                      return (
                        <div key={option.value} className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center mr-2"
                            style={{ 
                              backgroundColor: `${option.color}20`, 
                              border: `1px solid ${option.color}` 
                            }}
                          >
                            {option.icon}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: option.color }}>
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {existingAttendance.records[0].details || 'No details'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="text-gray-500">No attendance recorded for today</div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Attendance Stats</h3>
              <div className="space-y-2">
                {studentAttendance.length > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span>Present:</span>
                      <span className="font-medium">
                        {Math.round(
                          (studentAttendance.filter(r => r.status === 'present').length / 
                          studentAttendance.length) * 100
                        )}% 
                        ({studentAttendance.filter(r => r.status === 'present').length}/
                        {studentAttendance.length} days)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.round(
                            (studentAttendance.filter(r => r.status === 'present').length / 
                            studentAttendance.length) * 100
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Absences: {studentAttendance.filter(r => r.status === 'absent').length}</span>
                      <span>Late: {studentAttendance.filter(r => r.status === 'late').length}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">No attendance data available</div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
  <h3 className="font-medium text-gray-900 mb-2">Recent Attendance</h3>
  <div className="grid grid-cols-7 gap-1">
    {Array.from({ length: 7 }).map((_, i) => {
      const date = moment().startOf('week').add(i, 'days').format('YYYY-MM-DD');
      const formattedDate = moment(date).format('D-ddd');
      // Find attendance record for this date
      const historyItem = studentAttendance.find(item => 
        moment(item.created_at).format('YYYY-MM-DD') === date
      );
      
      const status = historyItem?.status || 'not recorded';
      const statusInfo = statusOptions.find(opt => opt.value === status) || 
                       { color: '#9CA3AF', icon: <FiCalendar /> };
      
      return (
        <div key={date} className="text-center">
          <div className="text-xs text-gray-500">{formattedDate}</div>
          <div 
            className="mx-auto h-6 w-6 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: `${statusInfo.color}20`, 
              border: `1px solid ${statusInfo.color}` 
            }}
          >
            {statusInfo.icon}
          </div>
          <div className="text-xs mt-1 capitalize">
            {status}
          </div>
        </div>
      );
    })}
  </div>
</div>
        </>
      ) : (
        <div className="text-center py-8">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No student information found</h3>
        </div>
      )}
    </div>
  );
};
// parentView.jsx
import React from 'react';
import { FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

export const ParentView = ({
  children,
  selectedChild,
  setSelectedChild,
  classes,
  selectedClass,
  setSelectedClass,
  loading,
  students,
  existingAttendance,
  selectedDate,
  studentAttendanceHistory,
  statusOptions
}) => {
  const currentStudent = students.length > 0 ? students[0] : null;
  const studentAttendance = currentStudent 
    ? studentAttendanceHistory.filter(item => item.student_id === currentStudent?.id)
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {children.length === 0 ? (
        <div className="text-center py-8">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No children registered</h3>
          <p className="mt-1 text-sm text-gray-500">Please contact the school to register your children</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-8">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No attendance data available</h3>
          <p className="mt-1 text-sm text-gray-500">Select a child and class to view attendance</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
              <div>
                <h2 className="text-xl font-bold">
                  {currentStudent.first_name} {currentStudent.last_name}
                </h2>
                <p className="text-gray-600">ID: {currentStudent.student_id || 'N/A'} | Grade {currentStudent.grade_level}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {moment(selectedDate).format('dddd, MMMM D, YYYY')}
              </div>
              <div className="text-gray-600">
                {classes.find(c => c.id === selectedClass)?.name || 'Class not selected'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Today's Status</h3>
              {existingAttendance && existingAttendance.records && existingAttendance.records.length > 0 ? (
                <div className="flex items-center">
                  {statusOptions.map(option => {
                    if (option.value === existingAttendance.records[0].status) {
                      return (
                        <div key={option.value} className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center mr-2"
                            style={{ 
                              backgroundColor: `${option.color}20`, 
                              border: `1px solid ${option.color}` 
                            }}
                          >
                            {option.icon}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: option.color }}>
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {existingAttendance.records[0].details || 'No details'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="text-gray-500">No attendance recorded for today</div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Attendance Stats</h3>
              <div className="space-y-2">
                {studentAttendance.length > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span>Present:</span>
                      <span className="font-medium">
                        {Math.round(
                          (studentAttendance.filter(r => r.status === 'present').length / 
                          studentAttendance.length) * 100
                        )}% 
                        ({studentAttendance.filter(r => r.status === 'present').length}/
                        {studentAttendance.length} days)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.round(
                            (studentAttendance.filter(r => r.status === 'present').length / 
                            studentAttendance.length) * 100
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Absences: {studentAttendance.filter(r => r.status === 'absent').length}</span>
                      <span>Late: {studentAttendance.filter(r => r.status === 'late').length}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">No attendance data available</div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Recent Attendance</h3>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
                  const historyItem = studentAttendance.find(item => item.date === date);
                  const status = historyItem?.status || 'not recorded';
                  const statusInfo = statusOptions.find(opt => opt.value === status) || 
                                  { color: '#9CA3AF', icon: <FiCalendar /> };
                  
                  return (
                    <div key={date} className="text-center">
                      <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                      <div 
                        className="mx-auto h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${statusInfo.color}20`, 
                          border: `1px solid ${statusInfo.color}` 
                        }}
                      >
                        {statusInfo.icon}
                      </div>
                      <div className="text-xs mt-1 capitalize">
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};