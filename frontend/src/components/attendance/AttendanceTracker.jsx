import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import moment from 'moment';
import api from '../../axiosConfig';
import { toast } from 'react-toastify';
import { 
  FiUser, FiCalendar, FiCheckCircle, FiXCircle, 
  FiClock, FiAlertCircle, FiEdit, FiTrash2,
  FiPlus, FiSearch, FiChevronDown, FiChevronUp,
  FiDownload, FiFilter, FiBarChart2, FiTrendingUp,
  FiAward, FiRefreshCw, FiSave
} from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const AttendanceSystem = () => {
  const { user } = useUser();
  const [view, setView] = useState('daily');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [month, setMonth] = useState(moment().format('YYYY-MM'));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin/Teacher states
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Parent states
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // Student states
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [error, setError] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // Fetch data based on role
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'admin') {
          const classesRes = await api.get('/classes');
          setClasses(classesRes.data);
          if (classesRes.data.length > 0) {
            setSelectedClass(classesRes.data[0].id);
          }
        } 
        else if (user?.role === 'teacher') {
          const classesRes = await api.get(`/teacher/${user.id}/classes`);
          setClasses(classesRes.data);
          if (classesRes.data.length > 0) {
            setSelectedClass(classesRes.data[0].id);
          }
        } 
        else if (user?.role === 'parent') {
          const childrenRes = await api.get(`/parents/${user.id}/children`);
          setChildren(childrenRes.data);
          if (childrenRes.data.length > 0) {
            setSelectedChild(childrenRes.data[0].id);
          }
        } else if (user?.role === 'student') {
          const classesRes = await api.get(`/enrollments/student/${user.id}/classes`);          
          setSelectedClass(classesRes.data[0]?.class_id);
        } 

      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch class students when class is selected
  useEffect(() => {
    if (selectedClass && (user?.role === 'admin' || user?.role === 'teacher')) {
      fetchClassStudents();
    }
  }, [selectedClass]);

  // Fetch attendance records when date/month changes
  useEffect(() => {
    if (view === 'daily' && date) {
      fetchAttendanceRecords();
      fetchStudentAttendance();
    } else if (view === 'monthly' && month) {
      fetchMonthlyAttendance();
    }
  }, [view, date, month, selectedClass, selectedChild]);

  // Calculate statistics when records change
  useEffect(() => {
    if (user?.role !== 'student') calculateStatistics();
  }, [attendanceRecords]);

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/enrollments/class/${selectedClass}/students`);
      setStudents(res.data);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance?studentId=${user?.id}&date=${date}`;
      if (user?.role === 'student' && user?.id) {
      const attendanceRes = await api.get(endpoint);
      setStudentAttendance(attendanceRes.data?.data);
      setError('');
    }
      } catch (error) {
      setError(error.response.data.message)
      toast.error(error);
      setStudentAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance?date=${date}&classId=${selectedClass}`;
      if (user?.role === 'parent' && selectedChild) endpoint += `&studentId=${selectedChild}`;
      if (selectedClass || selectedChild) {
      const res = await api.get(endpoint);
      setAttendanceRecords(res.data?.data?.records || []);
      setError('');  
      }
    } catch (error) {
       setStats({
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
        currentStreak: 0,
        bestStreak: 0
      });
      setError(`${error.response.data.message} for ${moment(date).format('dddd, MMMM D, YYYY')}`);
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMonthlyAttendance = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance/monthly?month=${month}&classId=${selectedClass}`;
      if (user?.role === 'student') endpoint += `&studentId=${user.id}`;
      if (user?.role === 'parent' && selectedChild) endpoint += `&studentId=${selectedChild}`;
      
      const res = await api.get(endpoint);
      
      setAttendanceRecords(res.data?.data?.students);
    } catch (error) {
      toast.error('Failed to load monthly attendance');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    if (attendanceRecords.length === 0) {
      setStats({
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
        currentStreak: 0,
        bestStreak: 0
      });
      return;
    }

    if (user?.role === 'admin' || user?.role === 'teacher') {
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const total = attendanceRecords.length;
      const attendanceRate = Math.round((presentCount / total) * 100);

      setStats({
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
        currentStreak: 0,
        bestStreak: 0
      });
    } else {
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      const sortedRecords = [...attendanceRecords].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      sortedRecords.forEach(record => {
        if (record.status === 'present') {
          tempStreak++;
          currentStreak = tempStreak;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      });

      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const total = presentCount + absentCount + lateCount;
      const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

      setStats({
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
        currentStreak,
        bestStreak
      });
    }
  };

  const handleBulkStatusChange = (status) => {
    setBulkStatus(status);
  };

  const applyBulkStatus = () => {
    if (!selectedClass || !date) {
      toast.error('Please select a class and date first');
      return;
    }

    const updatedRecords = students.map(student => {
      const existingRecord = attendanceRecords.find(r => r.student_id === student.id);
      
      return {
        ...(existingRecord || {}),
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        date,
        created_by: user?.id,
        class_id: selectedClass,
        status: bulkStatus,
        remark: bulkStatus === 'absent' ? 'marked absent' : 
                bulkStatus === 'late' ? 'marked late' : 'marked present'
      };
    });
    
    setAttendanceRecords(updatedRecords);
    toast.success(`status applied: ${bulkStatus}`);
  };

  const saveBulkChanges = async () => {
    try {
      if (attendanceRecords.length == 0){
        toast.error('Apply the status first');
        document.getElementById('applyBtn').classList.add('bg-red-500')
        return;
      }
      if (!selectedClass || !date) {
        throw new Error('Class and date are required');
      }

      setLoading(true);
      
      const response = await api.post('/attendance', {
        classId: selectedClass,
        date,
        remark: `attendance for ${moment(date).format('LL')}`,
        records: attendanceRecords.map(record => ({
          studentId: record.student_id,
          status: record.status,
          details: record.remark || null
        }))
      });

      if (response.data.success) {
        toast.success('Attendance saved successfully');
        fetchAttendanceRecords();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setShowBulkActions(false);
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance/export?month=${month}`;
      if (selectedClass) endpoint += `&classId=${selectedClass}`;
      
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = (studentId, field, value) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.student_id === studentId ? { ...record, [field]: value } : record
    ));
  };

  const renderStatsCards = () => {
    if (user?.role === 'student' || user?.role === 'parent') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">Attendance Rate</p>
                <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
              </div>
              <FiTrendingUp className="text-2xl" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">Current Streak</p>
                <p className="text-3xl font-bold">{stats.currentStreak} days</p>
              </div>
              <FiAward className="text-2xl" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">Best Streak</p>
                <p className="text-3xl font-bold">{stats.bestStreak} days</p>
              </div>
              <FiBarChart2 className="text-2xl" />
            </div>
          </div>
        </div>
      );
    } else if (user?.role === 'admin' || user?.role === 'teacher') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
              </div>
              <FiCheckCircle className="text-2xl text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
              </div>
              <FiXCircle className="text-2xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lateCount}</p>
              </div>
              <FiClock className="text-2xl text-yellow-500" />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderAttendanceChart = () => {
    
    if (view !== 'monthly') return null;
    
    const labels = Array.from({ length: moment(month).daysInMonth() }, (_, i) => i + 1);
    
    const presentData = labels.map((day) => {
      
    return attendanceRecords.filter(
      (student) => student.attendance[day] === 'present'
    ).length;
  });
  
    const absentData = labels.map(day => {
      return attendanceRecords.filter(
      (student) => student.attendance[day] === 'absent').length;
    });

    const lateData = labels.map(day => {
      return attendanceRecords.filter(
      (student) => student.attendance[day] === 'late').length;
    });

    const data = {
      labels,
      datasets: [
        {
          label: 'Present',
          data: presentData,
          backgroundColor: '#10B981',
          borderRadius: 4
        },
        {
          label: 'Absent',
          data: absentData,
          backgroundColor: '#EF4444',
          borderRadius: 4
        },
        {
          label: 'late',
          data: lateData,
          backgroundColor: '#EFF555',
          borderRadius: 4
        },
      ]
    };

    return (
      <div className="bg-white rounded-xl p-4 shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Attendance Overview</h3>
        <Bar 
          data={data} 
          options={{
            responsive: true,
            scales: {
              x: {
                stacked: true,
                grid: {
                  display: false
                }
              },
              y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  afterBody: (context) => {
                    const day = context[0].label;
                    const dateStr = moment(month).date(day).format('YYYY-MM-DD');
                    const lateCount = attendanceRecords.filter(r => r.date === dateStr && r.status === 'late').length;
                    return lateCount > 0 ? [`Late: ${lateCount}`] : [];
                  }
                }
              }
            }
          }}
        />
      </div>
    );
  };

  // const renderStatusDistribution = () => {
  //   if (view !== 'monthly') return null;

  //   let presentCount = 0;
  //   attendanceRecords.forEach(student => {
  //     presentCount =+ student.presentCount
  //   });
  //   console.log(presentCount);
    
  //   const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  //   const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

  //   const data = {
  //     labels: ['Present', 'Absent', 'Late'],
  //     datasets: [
  //       {
  //         data: [presentCount, absentCount, lateCount],
  //         backgroundColor: [
  //           '#10B981',
  //           '#EF4444',
  //           '#FFF555'
  //         ],
  //         borderWidth: 1
  //       }
  //     ]
  //   };

  //   return (
  //     <div className="bg-white rounded-xl p-4 shadow-md">
  //       <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
  //       <div className="h-64">
  //         <Pie 
  //           data={data} 
  //           options={{
  //             responsive: true,
  //             maintainAspectRatio: false,
  //             plugins: {
  //               legend: {
  //                 position: 'right',
  //               },
  //               tooltip: {
  //                 callbacks: {
  //                   label: (context) => {
  //                     const label = context.label || '';
  //                     const value = context.raw || 0;
  //                     const total = context.dataset.data.reduce((a, b) => a + b, 0);
  //                     const percentage = Math.round((value / total) * 100);
  //                     return `${label}: ${value} (${percentage}%)`;
  //                   }
  //                 }
  //               }
  //             }
  //           }}
  //         />
  //       </div>
  //     </div>
  //   );
  // };
const renderStatusDistribution = () => {
  if (view !== 'monthly') return null;
  
  // Calculate total counts across all students
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalExcused = 0;

  // Loop through each student and their attendance data
  attendanceRecords.forEach(student => {
    // Count statuses from the attendance object
    Object.values(student.attendance || {}).forEach(status => {
      if (status === 'present') totalPresent++;
      else if (status === 'absent') totalAbsent++;
      else if (status === 'late') totalLate++;
      else if (status === 'excused') totalExcused++;
    });
  });

  const data = {
    labels: ['Present', 'Absent', 'Late', 'Excused'],
    datasets: [
      {
        data: [totalPresent, totalAbsent, totalLate, totalExcused],
        backgroundColor: [
          '#10B981', // Green for present
          '#EF4444', // Red for absent
          '#F59E0B', // Amber for late (better contrast than yellow)
          '#3B82F6'  // Blue for excused
        ],
        borderWidth: 1,
        borderColor: '#ffffff'
      }
    ]
  };

  const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4">Class Status Distribution</h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{totalPresent}</div>
          <div className="text-sm text-green-800">Present</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{totalAbsent}</div>
          <div className="text-sm text-red-800">Absent</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">{totalLate}</div>
          <div className="text-sm text-amber-800">Late</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalExcused}</div>
          <div className="text-sm text-blue-800">Excused</div>
        </div>
      </div>

      {totalRecords > 0 ? (
        <div className="h-64">
          <Pie 
            data={data} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    usePointStyle: true,
                    padding: 15
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const percentage = Math.round((value / totalRecords) * 100);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No attendance data available
        </div>
      )}
    </div>
  );
};

  const renderAdminTeacherView = () => (
    <div className="space-y-6">
      {/* Header and controls */}
      
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          
          <select
            value={selectedClass || ''}
            onChange={(e) => {setSelectedClass(e.target.value || null), fetchMonthlyAttendance()}}
            className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - Grade {cls.grade_level}
              </option>
            ))}
          </select>
          
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
            <button onClick={() => setView('daily')} className={`px-3 py-1 rounded-md transition-all ${view === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              Daily
            </button>
            <button onClick={() => {setView('monthly'),fetchMonthlyAttendance()}} className={`px-3 py-1 rounded-md transition-all ${view === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              Monthly
            </button>
          </div>
          
          {view === 'daily' ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-500 text-white p-2 border rounded-lgshadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-50"
            />
          ) : (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="p-2 border rounded-lg bg-gray-500 text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-all"
          >
            <FiDownload /> Export
          </button>
          {view === 'daily' && selectedClass && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all"
            >
              <FiRefreshCw /> Bulk Actions
            </button>
          )}
        </div>
      </div>
      
      {showBulkActions && (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange('present')}
                className={`px-3 py-1 rounded-md border ${bulkStatus === 'present' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300'}`}
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleBulkStatusChange('absent')}
                className={`px-3 py-1 rounded-md border ${bulkStatus === 'absent' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300'}`}
              >
                Mark All Absent
              </button>
              <button
                onClick={() => handleBulkStatusChange('late')}
                className={`px-3 py-1 rounded-md border ${bulkStatus === 'late' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'bg-white border-gray-300'}`}
              >
                Mark All Late
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                id='applyBtn'
                onClick={applyBulkStatus}
                className="flex items-center gap-2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiRefreshCw /> Apply
              </button>
              <button
                onClick={saveBulkChanges}
                className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FiSave /> Save
              </button>
              <button
                onClick={() => setShowBulkActions(false)}
                className="flex items-center gap-2 px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className='items-center text-center gap-2 px-4 py-1 bg-red-200'>{error}</div>
        
      )}
      {selectedClass ? (
        <div className="space-y-6">
          {view === 'daily' ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {renderStatsCards()}
          
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {moment(date).format('dddd, MMMM D, YYYY')}
                </h3>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students
                      .filter(student => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          student.first_name.toLowerCase().includes(searchLower) ||
                          student.last_name.toLowerCase().includes(searchLower) ||
                          student.student_id.toLowerCase().includes(searchLower)
                        );
                      })
                      .map(student => {
                        const record = attendanceRecords.find(r => r.student_id === student.id);
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={record?.status || ''}
                                onChange={(e) => handleEditRecord(student.id, 'status', e.target.value)}
                                className={`p-1 rounded border ${
                                  record?.status === 'present' ? 'bg-green-50 border-green-200' :
                                  record?.status === 'absent' ? 'bg-red-50 border-red-200' :
                                  record?.status === 'late' ? 'bg-yellow-50 border-yellow-200' :
                                  'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={record?.remark || ''}
                                onChange={(e) => handleEditRecord(student.id, 'remark', e.target.value)}
                                placeholder="Add remark..."
                                className="p-1 border rounded w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={saveBulkChanges}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FiSave size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {renderAttendanceChart()}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MonthlyAttendanceView 
                    students={students} 
                    records={attendanceRecords} 
                    month={month}
                  />
                </div>
                <div>
                  {renderStatusDistribution()}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FiUser className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No class selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select a class to view attendance records</p>
        </div>
      )}
    </div>
  );

  const renderStudentView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1 rounded ${view === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Daily
          </button>
          <button
            onClick={() => {setView('monthly'), fetchMonthlyAttendance()}}
            className={`px-3 py-1 rounded ${view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Monthly
          </button>
        </div>
        
        
        {view === 'daily' ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded bg-gray-500 text-white"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded bg-gray-500 text-white"
          />
        )}
      </div>
      {error && (
          <div className='px-4 py-1 bg-red-400 text-center'>{error} for {moment(date).format('dddd, MMMM D, YYYY')}</div>
          
          )}
      {view === 'daily' ? (
        <div className={`${studentAttendance?.status === 'present' ? 'bg-[#10B981]' : studentAttendance?.status === 'absent' ? 'bg-[#EF4444]' : studentAttendance?.status === 'late' ? 'bg-[#EFF555]' : 'bg-blue-100'} rounded-lg shadow p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {moment(date).format('dddd, MMMM D, YYYY')}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex justify-center w-10 h-10 rounded-full bg-gray-200 items-center text-center">
                {user?.firstName.charAt(0) + user?.lastName.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm text-gray-500">ID: {user?.studentId}</div>
              </div>
            </div>
          </div>
                
          {studentAttendance?.id ? (
            <div className="space-y-4">
              {/* {attendanceRecords.map(record => ( */}
                
                <div key={studentAttendance.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        Grade - {studentAttendance?.class_name}
                      </div>
                      <div className={`capitalize inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                        studentAttendance?.status === 'present' ? 'bg-[#10B981] text-green-700' :
                        studentAttendance?.status === 'absent' ? 'bg-[#EF4444] text-red-700' :
                        studentAttendance?.status === 'late' ? 'bg-[#EFF555] text-yellow-700' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {studentAttendance?.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Attendance Taken - {moment(studentAttendance?.date).format('h:mm A')}
                      </div>
                    </div>
                  </div>
                  {studentAttendance?.remark && (
                    <div className="mt-3 p-3rounded text-cente">
                      <p className="text-sm capitalize">{studentAttendance?.remark}</p>
                    </div>
                  )}
                </div>
              {/* ))} */}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for this date
            </div>
          )}
        </div>
      ) : (
        <MonthlyAttendanceCalendar 
          records={attendanceRecords} 
          month={month}
          id={user?.id}
        />
      )}
    </div>
  );

  const renderParentView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedChild || ''}
          onChange={(e) => setSelectedChild(e.target.value || null)}
          className="p-2 border rounded"
        >
          <option value="">Select Child</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1 rounded ${view === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded ${view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Monthly
          </button>
        </div>
        
        {view === 'daily' ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded bg-gray-500 text-white"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded bg-gray-500 text-white"
          />
        )}
      </div>
      
      {selectedChild ? (
        view === 'daily' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {moment(date).format('dddd, MMMM D, YYYY')}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div>
                  <div className="font-medium">
                    {children.find(c => c.id === selectedChild)?.first_name} 
                    {' '}
                    {children.find(c => c.id === selectedChild)?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {children.find(c => c.id === selectedChild)?.student_id}
                  </div>
                </div>
              </div>
            </div>
            
            {attendanceRecords.length > 0 ? (
              <div className="space-y-4">
                {attendanceRecords.map(record => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {record.class_name} - Grade {record.grade_level}
                        </div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {record.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {moment(record.date).format('h:mm A')}
                        </div>
                      </div>
                    </div>
                    {record.remark && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm">{record.remark}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No attendance records found for this date
              </div>
            )}
          </div>
        ) : (
          <MonthlyAttendanceCalendar 
            records={attendanceRecords} 
            month={month}
          />
        )
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select a child to view attendance
        </div>
      )}
    </div>
  );
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Attendance Management</h2>
        <div className="text-sm text-gray-500">
          {user?.role === 'admin' ? 'Administrator' : 
           user?.role === 'teacher' ? 'Teacher' : 
           user?.role === 'student' ? 'Student' : 
           user?.role === 'parent' ? 'Parent' : 'Guest'} View
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      ) : user?.role === 'admin' || user?.role === 'teacher' ? (
        renderAdminTeacherView()
      ) : user?.role === 'student' ? (
        renderStudentView()
      ) : user?.role === 'parent' ? (
        renderParentView()
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FiAlertCircle className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-gray-500">Please log in to view attendance records</p>
        </div>
      )}
    </div>
  );
};
const MonthlyAttendanceView = ({ students, records, month }) => {
  const daysInMonth = moment(month).daysInMonth();
  const monthName = moment(month).format('MMMM YYYY');

  // Calculate summary statistics
  const summary = students.map(student => {    
    const studentRecords = records.filter(r => r.id === student.id);
    
    return {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      present: studentRecords[0].presentCount || 0,
      absent: studentRecords[0].absentCount || 0,
      late: studentRecords[0].lateCount || 0,
      excused: studentRecords[0].excusedCount || 0,
      totalDays: studentRecords[0].totalDays || 0,
      records: studentRecords
    };
  });
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{monthName} Attendance Details</h3>
        <p className="text-sm text-gray-500">Daily status for each student</p>
      </div>
      <div className='flex items-center gap-2'>
        <div className='flex items-center'>
          <span className='w-2.5 h-2.5 rounded-full bg-[#10B981] mr-1'></span>
          <span className='text-sm text-gray-500'>Present</span>
        </div>
        <div className='flex items-center'>
          <span className='w-2.5 h-2.5 rounded-full bg-[#EF4444] mr-1'></span>
          <span className='text-sm text-gray-500'>Absent</span>
        </div>
        <div className='flex items-center'>
          <span className='w-2.5 h-2.5 rounded-full bg-[#EFF555] mr-1'></span>
          <span className='text-sm text-gray-500'>Late</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <th 
                  key={i} 
                  className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {i + 1}
                </th>
              ))}
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-green-600">P</span>
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-red-600">A</span>
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-yellow-600">L</span>
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summary.map(student => {
              const totalDays = student.totalDays;
              const attendanceRate = totalDays > 0 
                ? Math.round((student.present / totalDays) * 100)
                : 0;

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500">{student.studentId}</div>
                  </td>
                  
                  {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                    const day = dayIndex + 1;
                    
                    const record = student?.records[0]?.attendance[day];
                     // Get status from attendance object
                    const date = moment(month).date(day).format('YYYY-MM-DD');
                    const dayOfWeek = moment(date).day();                        
                    return (
                      <td 
                        key={day} 
                        className={`px-1 py-2 text-center text-xs ${
                          dayOfWeek === 0 || dayOfWeek === 6 ? 'bg-gray-50' : ''
                        }`}
                      >
                        {record ? (
                          <div 
                            className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center ${
                              record === 'present' ? 'bg-green-100 text-green-800' :
                              record === 'absent' ? 'bg-red-100 text-red-800' :
                              record === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                            title={`${moment(date).format('ddd, MMM D')}: ${record}`}
                          >
                            {record.charAt(0).toUpperCase() || ''}
                          </div>
                        ) : (
                          <div 
                            className="text-2 mx-auto w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                            title={`${moment(date).format('ddd, MMM D')}: No record`}
                          >
                            N/A
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className="px-2 py-3 text-center text-sm font-medium text-[#10B981]">
                    {student.present}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-[#EF4444]">
                    {student.absent}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-[#EFF555]">
                    {student.late}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium">
                    <span className={`${
                      attendanceRate >= 90 ? 'text-green-600' :
                      attendanceRate >= 75 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {attendanceRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MonthlyAttendanceCalendar = ({ records, month, id }) => {
  const daysInMonth = moment(month).daysInMonth();
  const firstDay = moment(month).startOf('month').day();
  const monthName = moment(month).format('MMMM YYYY');
  const record = records.filter(r => r.id === id);
  // Calculate summary statistics // filter(r => r.status === 'present').length
  const presentDays = record[0]?.presentCount;
  const absentDays = record[0]?.absentCount;

  const lateDays = record[0]?.lateCount;
  // const excusedDays = records.data?.records[0]?.excusedCount;
  const totalDays = record[0]?.totalDays;
  const attendanceRate = record[0]?.attendanceRate;
  
  // Find current streak
  let currentStreak = 0;
  let tempStreak = 0;

  // const sortedRecords = record[0]?.attendance;
  // //[...record].sort((a, b) => new Date(a.date) - new Date(b.date));
  // sortedRecords.map(record => {
  for (let index = 1; index < daysInMonth + 1; index++) {
    if (record[0]?.attendance[index] === 'present') {
        tempStreak++;
    }

    if (tempStreak > currentStreak) {
        currentStreak = tempStreak;
      }

  };


  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">{monthName} Calendar View</h3>
        
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="text-center font-medium text-sm py-2 bg-gray-50 rounded"
            >
              {day}
            </div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="h-10 bg-gray-50 rounded"
            />
            ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {

            const date = moment(month).date(i + 1).format('YYYY-MM-DD');
            const dayRecords = record[0]?.attendance[i+1];
            
            
            const isWeekend = moment(date).day() === 0 || moment(date).day() === 6;

            const isToday = moment().date(i + 1).isSame(moment(), 'day');

            return (
              <div 
              key={i} 
              className={`${isToday ? 'bg-red-500' : ''} h-12 border rounded flex flex-col items-center justify-center relative 
              ${isWeekend ? 'bg-gray-400' : 'bg-white'} `}
              >
              <div className="text-xs absolute top-1 left-1">
                {i + 1}
              </div>
              {dayRecords !== null && (
                <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  dayRecords === 'present' ? 'bg-green-800 text-green-100' :
                  dayRecords === 'absent' ? 'bg-red-800 text-red-100' :
                  dayRecords === 'late' ? 'bg-yellow-800 text-yellow-100' :
                  'bg-blue-100 text-blue-800'
                }`}
                title={`${moment(date).format('ddd, MMM D')}: ${dayRecords}`}
                >
                {dayRecords.charAt(0).toUpperCase() || 'N/A'}
                </div>
              )}
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-800 border border-green-300 mr-2"></div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-800 border border-red-300 mr-2"></div>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-800 border border-yellow-300 mr-2"></div>
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-800 border border-blue-300 mr-2"></div>
              <span className="text-sm">Excused</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium">Current Streak: </span>
              <span className="ml-1 font-bold text-green-600">{currentStreak} days</span>
            </div>
            <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium">Attendance Rate: </span>
              <span className={`ml-1 font-bold ${
                attendanceRate >= 90 ? 'text-green-600' :
                attendanceRate >= 75 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {attendanceRate}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Present Days</p>
              <p className="text-2xl font-bold text-green-600">{presentDays}</p>
            </div>
            <FiCheckCircle className="text-2xl text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Absent Days</p>
              <p className="text-2xl font-bold text-red-600">{absentDays}</p>
            </div>
            <FiXCircle className="text-2xl text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Late Days</p>
              <p className="text-2xl font-bold text-yellow-600">{lateDays}</p>
            </div>
            <FiClock className="text-2xl text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Days</p>
              <p className="text-2xl font-bold text-blue-600">{totalDays}</p>
            </div>
            <FiCalendar className="text-2xl text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default AttendanceSystem;