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
  FiAward, FiRefreshCw
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
          setSelectedClass(classesRes.data[0].id);
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
        } 
        else if (user?.role === 'student') {
          const attendanceRes = await api.get(`/students/${user.id}/attendance`);
          setStudentAttendance(attendanceRes.data);
        }
      } catch (error) {
        toast.error('Failed to load data');
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
    } else if (view === 'monthly' && month) {
      fetchMonthlyAttendance();
    }
  }, [view, date, month, selectedClass, selectedChild]);

  // Calculate statistics when records change
  useEffect(() => {
    calculateStatistics();
  }, [attendanceRecords]);

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/enrollments/class/${selectedClass}/students`);
      setStudents(res.data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance?date=${date}&classId=${selectedClass}`;
      if (user?.role === 'student') endpoint += `&studentId=${user.id}`;
      if (user?.role === 'parent' && selectedChild) endpoint += `&studentId=${selectedChild}`;
      
      const res = await api.get(endpoint);
      setAttendanceRecords(res.data);
    } catch (error) {
        toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance/monthly?month=${month}`;
      if (selectedClass) endpoint += `&classId=${selectedClass}`;
      if (user?.role === 'student') endpoint += `&studentId=${user.id}`;
      if (user?.role === 'parent' && selectedChild) endpoint += `&studentId=${selectedChild}`;
      
      const res = await api.get(endpoint);
      setAttendanceRecords(res.data);
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

    // For admin/teacher view
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
        currentStreak: 0, // These would need backend support
        bestStreak: 0    // to calculate properly
      });
    } 
    // For student/parent view
    else {
      // Calculate streaks (simplified - would need proper backend support)
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

  // const applyBulkStatus = () => {
  //   const updatedRecords = students.map(student => {
  //     const existingRecord = attendanceRecords.find(r => r.student_id === student.id);
      
  //     if (existingRecord) {
  //       return {
  //         ...existingRecord,
  //         status: bulkStatus,
  //         remark: bulkStatus === 'absent' ? 'Bulk marked absent' : 
  //                 bulkStatus === 'late' ? 'Bulk marked late' : ''
  //       };
  //     } else {
  //       return {
  //         student_id: student.id,
  //         date: date,
  //         class_id: selectedClass,
  //         status: bulkStatus,
  //         remark: bulkStatus === 'absent' ? 'Bulk marked absent' : 
  //                 bulkStatus === 'late' ? 'Bulk marked late' : ''
  //       };
  //     }
  //   });

  //   setAttendanceRecords(updatedRecords);
  //   setShowBulkActions(false);
  //   toast.success(`Bulk status applied: ${bulkStatus}`);
  // };

  // const saveBulkChanges = async () => {
  //   try {
  //     setLoading(true);
  //     await api.post('/attendance', {
  //       date,
  //       classId: selectedClass,
  //       records: attendanceRecords
  //     });
  //     toast.success('Attendance saved successfully');
  //     fetchAttendanceRecords();
  //   } catch (error) {
  //     toast.error('Failed to save attendance');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
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
      class_id: selectedClass,
      status: bulkStatus,
      remark: bulkStatus === 'absent' ? 'Bulk marked absent' : 
              bulkStatus === 'late' ? 'Bulk marked late' : 'Bulk marked present'
    };
  });

  setAttendanceRecords(updatedRecords);
  setShowBulkActions(false);
  toast.success(`Bulk status applied: ${bulkStatus}`);
};

const saveBulkChanges = async () => {
  try {
    setLoading(true);
    
    const response = await api.post('/attendance', {
      classId: selectedClass,
      date,
      remark: `${date} attendance`,
      records: attendanceRecords.map(record => ({
        studentId: record.student_id,
        status: record.status,
        details: record.remark || null
      }))
    });

    if (response.data.success) {
      toast.success(response.data.message);
      fetchAttendanceRecords();
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    toast.error(error.message);
  } finally {
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

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      student.student_id.toLowerCase().includes(searchLower)
    );
  });

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
    
    const presentData = labels.map(day => {
      const dateStr = moment(month).date(day).format('YYYY-MM-DD');
      return attendanceRecords.filter(r => r.date === dateStr && r.status === 'present').length;
    });

    const absentData = labels.map(day => {
      const dateStr = moment(month).date(day).format('YYYY-MM-DD');
      return attendanceRecords.filter(r => r.date === dateStr && r.status === 'absent').length;
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
        }
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

  const renderStatusDistribution = () => {
    if (view !== 'monthly') return null;

    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

    const data = {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [
        {
          data: [presentCount, absentCount, lateCount],
          backgroundColor: [
            '#10B981',
            '#EF4444',
            '#F59E0B'
          ],
          borderWidth: 1
        }
      ]
    };

    return (
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
        <div className="h-64">
          <Pie 
            data={data} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = Math.round((value / total) * 100);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value || null)}
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
            <button
              onClick={() => setView('daily')}
              className={`px-3 py-1 rounded-md transition-all ${view === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1 rounded-md transition-all ${view === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Monthly
            </button>
          </div>
          
          {view === 'daily' ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                onClick={applyBulkStatus}
                className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={saveBulkChanges}
                className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowBulkActions(false)}
                className="px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {selectedClass ? (
        <div className="space-y-6">
          {renderStatsCards()}
          
          {view === 'daily' ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                    {filteredStudents.map(student => {
                      if (attendanceRecords.length > 0){
                      const record = attendanceRecords.filter(r => r.student_id === student.id);
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
                            {record ? (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                record.status === 'present' ? 'bg-green-100 text-green-800' :
                                record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            ):
                            (
                              <span className="text-gray-500">No record</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record?.remark || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {record && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEdit(record)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit"
                                >
                                  <FiEdit />
                                </button>
                                <button 
                                  onClick={() => handleDelete(record.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
}})}
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

  // ... (Other role views would follow similar patterns with their specific enhancements)

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Attendance System</h1>
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
      ) : user?.role === 'admin' ? (
        renderAdminView()
      ) : user?.role === 'teacher' ? (
        renderAdminView() // Similar to admin view with minor differences
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
    const studentRecords = records.filter(r => r.student_id === student.id);
    return {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      present: studentRecords.filter(r => r.status === 'present').length,
      absent: studentRecords.filter(r => r.status === 'absent').length,
      late: studentRecords.filter(r => r.status === 'late').length,
      excused: studentRecords.filter(r => r.status === 'excused').length,
      records: studentRecords
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{monthName} Attendance Details</h3>
        <p className="text-sm text-gray-500">Daily status for each student</p>
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
              const totalDays = student.present + student.absent + student.late + student.excused;
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
                  
                  {Array.from({ length: daysInMonth }).map((_, day) => {
                    const date = moment(month).date(day + 1).format('YYYY-MM-DD');
                    const record = student.records.find(r => r.date === date);
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
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'absent' ? 'bg-red-100 text-red-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                            title={`${moment(date).format('ddd, MMM D')}: ${record.status}`}
                          >
                            {record.status.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div 
                            className="mx-auto w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                            title={`${moment(date).format('ddd, MMM D')}: No record`}
                          >
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className="px-2 py-3 text-center text-sm font-medium text-green-600">
                    {student.present}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-red-600">
                    {student.absent}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-yellow-600">
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

const MonthlyAttendanceCalendar = ({ records, month }) => {
  const daysInMonth = moment(month).daysInMonth();
  const firstDay = moment(month).startOf('month').day();
  const monthName = moment(month).format('MMMM YYYY');
  
  // Calculate summary statistics
  const presentDays = records.filter(r => r.status === 'present').length;
  const absentDays = records.filter(r => r.status === 'absent').length;
  const lateDays = records.filter(r => r.status === 'late').length;
  const excusedDays = records.filter(r => r.status === 'excused').length;
  const totalDays = presentDays + absentDays + lateDays + excusedDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Find current streak
  let currentStreak = 0;
  let tempStreak = 0;
  const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  sortedRecords.forEach(record => {
    if (record.status === 'present') {
      tempStreak++;
      if (tempStreak > currentStreak) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  });

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
            const dayRecords = records.filter(r => r.date === date);
            const isWeekend = moment(date).day() === 0 || moment(date).day() === 6;
            
            return (
              <div 
                key={i} 
                className={`h-12 border rounded flex flex-col items-center justify-center relative ${
                  isWeekend ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="text-xs absolute top-1 left-1">
                  {i + 1}
                </div>
                {dayRecords.length > 0 && (
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      dayRecords[0].status === 'present' ? 'bg-green-100 text-green-800' :
                      dayRecords[0].status === 'absent' ? 'bg-red-100 text-red-800' :
                      dayRecords[0].status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                    title={`${moment(date).format('ddd, MMM D')}: ${dayRecords[0].status}`}
                  >
                    {dayRecords[0].status.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300 mr-2"></div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300 mr-2"></div>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-300 mr-2"></div>
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
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


import { pool } from "../config/db.js";
import Attendance from "../models/Attendance.js";

const attendanceController = {
  // Save or update attendance (for teachers/admins)
  saveAttendance: async (req, res) => {
    const { classId, date, remark, records } = req.body;
    const attendanceId = req.params.id;

    if (!classId || !date || !records) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      await pool.query('BEGIN');

      // Use the provided ID or create/update based on classId and date
      const effectiveAttendanceId = attendanceId || 
        (await Attendance.createOrUpdateAttendance(classId, date, remark));

      // Clear existing records
      await Attendance.deleteAttendanceRecords(effectiveAttendanceId);

      console.log(records);
      // Insert new records with validation
      for (const record of records) {
        if (!record.studentId || !record.status) {
          throw new Error(`Invalid record format for student ${record.studentId}`);
        }
        console.log(record);
        
        await Attendance.createAttendanceRecord(
          effectiveAttendanceId,
          record.studentId,
          record.status,
          record.details || null
        );
      }

      await pool.query('COMMIT');
      res.json({ 
        success: true,
        message: 'Attendance saved successfully',
        attendanceId: effectiveAttendanceId
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Attendance save error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to save attendance'
      });
    }
  },

  // Get attendance by class and date
  getAttendance: async (req, res) => {
    try {
      const { classId, date } = req.query;
      
      if (!classId || !date) {
        return res.status(400).json({ message: 'Class ID and date are required' });
      }
      
      const attendance = await Attendance.getAttendanceByClassAndDate(classId, date);
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
      
      res.json(attendance);
    } catch (error) {
      console.error('Error getting attendance:', error);
      res.status(500).json({ message: 'Failed to get attendance' });
    }
  },

  // Get class attendance history
  getAttendanceHistory: async (req, res) => {
    try {
      const { classId, start, end } = req.query;
      
      if (!classId || !start || !end) {
        return res.status(400).json({ 
          message: 'Class ID, start date, and end date are required' 
        });
      }
      
      const history = await Attendance.getAttendanceHistory(classId, start, end);
      res.json(history);
    } catch (error) {
      console.error('Error getting attendance history:', error);
      res.status(500).json({ message: 'Failed to get attendance history' });
    }
  },

  // Get student attendance history
  getStudentHistory: async (req, res) => {
    try {
      const { id: studentId } = req.params;
      const { start, end } = req.query;
      
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }
      
      const history = await Attendance.getStudentHistory(studentId, start, end);
      res.json(history);
    } catch (error) {
      console.error('Error getting student history:', error);
      res.status(500).json({ message: 'Failed to get student history' });
    }
  },

  // Get monthly attendance summary
  getMonthlySummary: async (req, res) => {
    try {
      const { classId, studentId, month } = req.query;
      
      if (!month) {
        return res.status(400).json({ message: 'Month is required (YYYY-MM)' });
      }
      
      let summary;
      if (classId) {
        summary = await Attendance.getClassMonthlySummary(classId, month);
      } else if (studentId) {
        summary = await Attendance.getStudentMonthlySummary(studentId, month);
      } else {
        return res.status(400).json({ 
          message: 'Either classId or studentId is required' 
        });
      }
      
      res.json(summary);
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      res.status(500).json({ message: 'Failed to get monthly summary' });
    }
  },

  // Get class students
  getClassStudents: async (req, res) => {
    try {
      const { classId } = req.params;
      
      if (!classId) {
        return res.status(400).json({ message: 'Class ID is required' });
      }
      
      const students = await Attendance.getClassStudents(classId);
      res.json(students);
    } catch (error) {
      console.error('Error getting class students:', error);
      res.status(500).json({ message: 'Failed to get class students' });
    }
  }
};

export default attendanceController;
// import { pool } from "../config/db.js";
// import Attendance from "../models/Attendance.js";


// const attendanceController = {
// saveAttendance: async (req, res) => {
//   let attendanceId;
//   const { classId, date, remark, records } = req.body;

//   attendanceId = req.params.id;

//   try {
//     try {
//       await pool.query('BEGIN');
//       if (!attendanceId) { 
//         attendanceId = await Attendance.createOrUpdateAttendance(
//         classId, date, remark
//       );
//       }
      
//       await Attendance.deleteAttendanceRecords(attendanceId);
      
//       for (const record of records) {
//         await Attendance.createAttendanceRecord(
//           attendanceId,
//           record.studentId,
//           record.status,
//           record.details
//         );
//       }
      
//       await pool.query('COMMIT');
//       res.json({ message: 'Attendance saved successfully' });
//     } catch (error) {
//       await pool.query('ROLLBACK');
//       throw error;
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// },

// getAttendance: async (req, res) => {
//   try {
//     const { classId, date } = req.query;
//     const attendance = await Attendance.getAttendanceByClassAndDate(classId, date);
//     res.json(attendance);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// },

// getAttendanceHistory: async (req, res) => {
//   try {
//     const { classId, start, end } = req.query;
//     const history = await Attendance.getAttendanceHistory(classId, start, end);
//     res.json(history);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// },

// getStudentHistory: async (req, res) => {
//   try {
//     const studentId = req.params.id;
//     const { start, end } = req.query;
//     const history = await Attendance.getStudentHistory(studentId, start, end);
//     res.json(history);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }
// }

// export default attendanceController;

// Updated Attendance.js model
import { pool } from "../config/db.js";

class Attendance {
  // Create new attendance header
  static async createOrUpdateAttendance(classId, date, remark = null) {
    const { rows } = await pool.query(
      `INSERT INTO attendance (class_id, attendance_date, remark)
       VALUES ($1, $2, $3)
       ON CONFLICT (class_id, attendance_date) 
       DO UPDATE SET remark = EXCLUDED.remark
       RETURNING id`,
      [classId, date, remark]
    );
    return rows[0].id;
  }

  static async deleteAttendanceRecords(attendanceId) {
    const { rowCount } = await pool.query(
      `DELETE FROM attendance_records
       WHERE attendance_id = $1`,
      [attendanceId]
    );
    return rowCount;
  }

  static async createAttendanceRecord(attendanceId, studentId, status, details = null) {
    const { rows } = await pool.query(
      `INSERT INTO attendance_records 
       (attendance_id, student_id, status, details)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [attendanceId, studentId, status, details]
    );
    return rows[0];
  }

  // Get attendance by class and date
  static async getAttendanceByClassAndDate(classId, date) {
    if (!classId || !date) {
      return;
    }
    const headerRes = await pool.query(
      `SELECT id, remark FROM attendance
       WHERE class_id = $1 AND attendance_date = $2`,
      [classId, date]
    );
    
    if (headerRes.rows.length === 0) return null;
    
    const recordsRes = await pool.query(
      `SELECT ar.student_id, ar.status, ar.details,
              u.first_name, u.last_name, s.student_id as student_number
       FROM attendance_records ar
       JOIN students s ON ar.student_id = s.id
       JOIN users u ON s.id = u.id
       WHERE ar.attendance_id = $1`,
      [headerRes.rows[0].id]
    );
    
    return {
      ...headerRes.rows[0],
      class_id: classId,
      date,
      records: recordsRes.rows
    };
  }

  // Get class attendance history
  static async getAttendanceHistory(classId, start, end) {
    const { rows } = await pool.query(
      `SELECT a.attendance_date, 
              COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present,
              COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent,
              COUNT(ar.id) FILTER (WHERE ar.status = 'late') AS late,
              COUNT(ar.id) FILTER (WHERE ar.status = 'excused') AS excused
       FROM attendance a
       LEFT JOIN attendance_records ar ON a.id = ar.attendance_id
       WHERE a.class_id = $1 AND a.attendance_date BETWEEN $2 AND $3
       GROUP BY a.attendance_date
       ORDER BY a.attendance_date DESC`,
      [classId, start, end]
    );
    return rows;
  }

  // Get student attendance history
  static async getStudentHistory(studentId, start, end) {
    const { rows } = await pool.query(
      `SELECT a.attendance_date, a.class_id, c.name as class_name,
              ar.status, ar.details
       FROM attendance_records ar
       JOIN attendance a ON ar.attendance_id = a.id
       JOIN classes c ON a.class_id = c.id
       WHERE ar.student_id = $1 
         AND a.attendance_date BETWEEN $2 AND $3
       ORDER BY a.attendance_date DESC`,
      [studentId, start, end]
    );
    return rows;
  }

  // Get class monthly summary
  static async getClassMonthlySummary(classId, month) {
    const { rows } = await pool.query(
      `SELECT 
         s.id as student_id,
         u.first_name,
         u.last_name,
         s.student_id as student_number,
         COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present,
         COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent,
         COUNT(ar.id) FILTER (WHERE ar.status = 'late') AS late,
         COUNT(ar.id) FILTER (WHERE ar.status = 'excused') AS excused
       FROM students s
       LEFT JOIN attendance_records ar ON s.id = ar.student_id
       LEFT JOIN users u ON s.id = u.id
       LEFT JOIN attendance a ON ar.attendance_id = a.id
       WHERE s.id IN (SELECT student_id FROM enrollment WHERE class_id = $1)
         AND to_char(a.attendance_date, 'YYYY-MM') = $2
       GROUP BY s.id, u.first_name
       ORDER BY u.last_name, u.first_name`,
      [classId, month]
    );
    return rows;
  }

  // Get student monthly summary
  static async getStudentMonthlySummary(studentId, month) {
    const { rows } = await pool.query(
      `SELECT 
         a.attendance_date,
         c.name as class_name,
         ar.status,
         ar.details
       FROM attendance_records ar
       JOIN attendance a ON ar.attendance_id = a.id
       JOIN classes c ON a.class_id = c.id
       WHERE ar.student_id = $1
         AND to_char(a.attendance_date, 'YYYY-MM') = $2
       ORDER BY a.attendance_date`,
      [studentId, month]
    );
    return rows;
  }

  // Get class students
  static async getClassStudents(classId) {
    const { rows } = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.student_id, s.grade_level
       FROM enrollment e
       JOIN students s ON e.student_id = s.id
       WHERE e.class_id = $1
       ORDER BY s.last_name, s.first_name`,
      [classId]
    );
    return rows;
  }
}

//   static async createOrUpdateAttendance(classId, date, remark) {
//     const { rows } = await pool.query(
//       `INSERT INTO attendance (class_id, attendance_date, remark)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (class_id, attendance_date) 
//        DO UPDATE SET remark = EXCLUDED.remark
//        RETURNING id`,
//       [classId, date, remark]
//     );
//     return rows[0].id;
//   }

//   static async deleteAttendanceRecords(attendanceId) {
//     await pool.query(
//       `DELETE FROM attendance_records
//        WHERE attendance_id = $1`,
//       [attendanceId]
//     );
//   }

//   static async createAttendanceRecord(attendanceId, studentId, status, details) {
//     await pool.query(
//       `INSERT INTO attendance_records 
//        (attendance_id, student_id, status, details)
//        VALUES ($1, $2, $3, $4)`,
//       [attendanceId, studentId, status, details]
//     );
//   }

//   static async getAttendanceByClassAndDate(classId, date) {
//     const headerRes = await pool.query(
//       `SELECT id, remark FROM attendance
//        WHERE class_id = $1 AND attendance_date = $2`,
//       [classId, date]
//     );
    
//     if (headerRes.rows.length === 0) {
//       return null;
//     }
    
//     const attendance = headerRes.rows[0];
//     const recordsRes = await pool.query(
//       `SELECT student_id, status, details
//        FROM attendance_records
//        WHERE attendance_id = $1`,
//       [attendance.id]
//     );
    
//     return {
//       id: attendance.id,
//       class_id: classId,
//       date,
//       remark: attendance.remark,
//       records: recordsRes.rows
//     };
//   }

//   static async getAttendanceHistory(classId, start, end) {
//     const { rows } = await pool.query(
//       `SELECT a.class_id, a.attendance_date, a.remark, 
//               COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
//               COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent_count,
//               COUNT(ar.id) FILTER (WHERE ar.status = 'late') AS late_count,
//               COUNT(ar.id) FILTER (WHERE ar.status = 'excused') AS excused_count
//        FROM attendance a
//        LEFT JOIN attendance_records ar ON a.id = ar.attendance_id
//        WHERE a.class_id = $1 AND a.attendance_date BETWEEN $2 AND $3
//        GROUP BY a.id
//        ORDER BY a.attendance_date DESC`,
//       [classId, start, end]
//     );
//     return rows;
//   }

// static async getStudentHistory(studentId, start, end) {
//     const { rows } = await pool.query(
//       `SELECT a.id, ar.*
//        FROM attendance_records ar
//        LEFT JOIN attendance a ON ar.attendance_id = a.id
//        WHERE ar.student_id = $1 AND a.attendance_date BETWEEN $2 AND $3
//        GROUP BY a.attendance_date, a.id, ar.id
//        ORDER BY a.attendance_date DESC`,
//       [studentId, start, end]
//     );
//     return rows;
//   }
// }
export default Attendance;

// attendanceRoutes.js
import express from 'express';
const router = express.Router();
import attendanceController from '../controllers/attendanceController.js';
import auth from '../middleware/auth.js';

// Teacher/Admin routes
router.post('/', 
  auth(['teacher', 'admin']), 
  attendanceController.saveAttendance
);
router.put('/:id', 
  auth(['teacher', 'admin']), 
  attendanceController.saveAttendance
);

// General access routes
router.get('/', attendanceController.getAttendance);
router.get('/history', attendanceController.getAttendanceHistory);
router.get('/student/:id', attendanceController.getStudentHistory);
router.get('/monthly', attendanceController.getMonthlySummary);
router.get('/class/:classId/students', 
  attendanceController.getClassStudents
);


// router.post('/', attendanceController.saveAttendance);
// router.put('/:id', attendanceController.saveAttendance);
// router.get('/', attendanceController.getAttendance);
// router.get('/history', attendanceController.getAttendanceHistory);
// router.get('/student/:id', attendanceController.getStudentHistory);

export default router;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  teacher_id INTEGER REFERENCES users(id),
  grade_level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    building VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE (classroom_id, day_of_week, start_time, end_time)
);

CREATE TABLE students (
    id INTEGER PRIMARY KEY REFERENCES users(id),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    birth_date DATE,
    grade_level INTEGER,
    section VARCHAR(1)
);

CREATE TABLE teachers (
    id INTEGER PRIMARY KEY REFERENCES users(id),
    subject VARCHAR(100) NOT NULL
);

CREATE TABLE parents (
    id INTEGER PRIMARY KEY REFERENCES users(id)
);

CREATE TABLE student_parents (
    student_id INTEGER REFERENCES students(id),
    parent_id INTEGER REFERENCES parents(id),
    PRIMARY KEY (student_id, parent_id)
);


-- CREATE TABLE attendance (
--     id SERIAL PRIMARY KEY,
--     class_id INTEGER NOT NULL REFERENCES classes(id),
--     attendance_date DATE NOT NULL,
--     remark TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE (class_id, date)
-- );

-- CREATE TABLE attendance_records (
--     id SERIAL PRIMARY KEY,
--     attendance_id INTEGER NOT NULL REFERENCES attendance(id),
--     student_id INTEGER NOT NULL REFERENCES students(id),
--     status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
--     details TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE (class_id, attendance_date)
);

CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    attendance_id INTEGER NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (attendance_id, student_id)
);

CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

CREATE TABLE enrollment (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    UNIQUE (class_id, student_id)
);
CREATE TABLE class_teachers (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_id, teacher_id, subject)
);