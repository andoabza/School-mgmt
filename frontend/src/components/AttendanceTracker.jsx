import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import moment from 'moment';
import api from '../../axiosConfig';
import { toast } from 'react-toastify';
import { 
  FiUser, FiCalendar, FiCheckCircle, FiXCircle, 
  FiClock, FiAlertCircle, FiEdit, FiTrash2,
  FiPlus, FiSearch, FiChevronDown, FiChevronUp
} from 'react-icons/fi';

const AttendanceSystem = () => {
  const { user } = useUser();
  const [view, setView] = useState('daily');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [month, setMonth] = useState(moment().format('YYYY-MM'));
  const [loading, setLoading] = useState(false);

  // Admin/Teacher states
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Parent states
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // Student states
  const [studentAttendance, setStudentAttendance] = useState([]);

  // CRUD states
  const [isEditing, setIsEditing] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [newStatus, setNewStatus] = useState('present');
  const [remark, setRemark] = useState('');

  // Fetch data based on role
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'admin') {
          const classesRes = await api.get('/classes');
          setClasses(classesRes.data);
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
  }, [view, date, month]);

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
      let endpoint = `/attendance?date=${date}`;
      if (selectedClass) endpoint += `&classId=${selectedClass}`;
      if (user?.role === 'student') endpoint += `&studentId=${user.id}`;
      if (user?.role === 'parent' && selectedChild) endpoint += `&studentId=${selectedChild}`;
      
      const res = await api.get(endpoint);
      setAttendanceRecords(res.data);
      console.log(res.data);
      
    } catch (error) {
      if (!selectedClass) 
        toast.error('Select Class to load attendance records');
      else
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

  const handleEdit = (record) => {
    setIsEditing(true);
    setEditRecord(record);
    setNewStatus(record.status);
    setRemark(record.remark || record.status);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await api.put(`/attendance/${editRecord.id}`, {
        status: newStatus,
        remark
      });
      toast.success('Attendance updated successfully');
      fetchAttendanceRecords();
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/attendance/${id}`);
      toast.success('Attendance record deleted');
      fetchAttendanceRecords();
    } catch (error) {
      toast.error('Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedClass || ''}
          onChange={(e) => setSelectedClass(e.target.value || null)}
          className="p-2 border rounded"
        >
          <option value="">Select Class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - Grade {cls.grade_level}
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
            className="p-2 border rounded"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded"
          />
        )}
      </div>
      
      {selectedClass ? (
        view === 'daily' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Remark</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const record = attendanceRecords.find(r => r.student_id === student.id);
                  return (
                    <tr key={student.id} className="border-t">
                      <td className="p-3">
                        {student.first_name} {student.last_name}
                        <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                      </td>
                      <td className="p-3">
                        {record ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <span className="text-gray-500">No record</span>
                        )}
                      </td>
                      <td className="p-3">{record?.remark || '-'}</td>
                      <td className="p-3 space-x-2">
                        {record && (
                          <>
                            <button 
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FiEdit />
                            </button>
                            <button 
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <MonthlyAttendanceView 
            students={students} 
            records={attendanceRecords} 
            month={month}
          />
        )
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select a class to view attendance
        </div>
      )}
      
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Edit Attendance Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Remark</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTeacherView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedClass || ''}
          onChange={(e) => setSelectedClass(e.target.value || null)}
          className="p-2 border rounded"
        >
          <option value="">Select Class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - Grade {cls.grade_level}
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
            className="p-2 border rounded"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded"
          />
        )}
      </div>
      
      {selectedClass ? (
        view === 'daily' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Remark</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const record = attendanceRecords.find(r => r.student_id === student.id);
                  
                  return (
                    <tr key={student.id} className="border-t">
                      <td className="p-3">
                        {student.first_name} {student.last_name}
                        <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                      </td>
                      <td className="p-3">
                        {record ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditRecord({
                                id: student.id,
                                date,
                                class_id: selectedClass,
                                status: 'present',
                                remark: ''
                              });
                              setIsEditing(true);
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Mark Attendance
                          </button>
                        )}
                      </td>
                      <td className="p-3">{record?.remark || '-'}</td>
                      <td className="p-3">
                        {record && (
                          <button 
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEdit />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <MonthlyAttendanceView 
            students={students} 
            records={attendanceRecords} 
            month={month}
          />
        )
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select a class to view attendance
        </div>
      )}
      
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {editRecord?.id ? 'Edit' : 'Create'} Attendance Record
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Remark</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {editRecord?.id ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
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
            className="p-2 border rounded"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded"
          />
        )}
      </div>
      
      {view === 'daily' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {moment(date).format('dddd, MMMM D, YYYY')}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div>
                <div className="font-medium">{user.first_name} {user.last_name}</div>
                <div className="text-sm text-gray-500">ID: {user.student_id}</div>
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
            className="p-2 border rounded"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded"
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Attendance System</h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      ) : user?.role === 'admin' ? (
        renderAdminView()
      ) : user?.role === 'teacher' ? (
        renderTeacherView()
      ) : user?.role === 'student' ? (
        renderStudentView()
      ) : user?.role === 'parent' ? (
        renderParentView()
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please log in to view attendance
        </div>
      )}
    </div>
  );
};

// Helper components
const MonthlyAttendanceView = ({ students, records, month }) => {
  const daysInMonth = moment(month).daysInMonth();
  const firstDay = moment(month).startOf('month').day();
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        {moment(month).format('MMMM YYYY')} Attendance
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="p-2 text-left">Student</th>
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <th key={i} className="p-2 text-center text-sm">
                  {i + 1}
                </th>
              ))}
              <th className="p-2 text-center">Present</th>
              <th className="p-2 text-center">Absent</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const studentRecords = records.filter(r => r.student_id === student.id);
              const presentCount = studentRecords.filter(r => r.status === 'present').length;
              const absentCount = studentRecords.filter(r => r.status === 'absent').length;
              
              return (
                <tr key={student.id} className="border-t">
                  <td className="p-2">
                    {student.first_name} {student.last_name}
                    <div className="text-xs text-gray-500">{student.student_id}</div>
                  </td>
                  
                  {Array.from({ length: daysInMonth }).map((_, day) => {
                    const date = moment(month).date(day + 1).format('YYYY-MM-DD');
                    const record = studentRecords.find(r => r.date === date);
                    
                    return (
                      <td key={day} className="p-1 text-center">
                        {record ? (
                          <div className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="mx-auto w-6 h-6 rounded-full bg-gray-100"></div>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className="p-2 text-center font-medium text-green-600">
                    {presentCount}
                  </td>
                  <td className="p-2 text-center font-medium text-red-600">
                    {absentCount}
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
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        {moment(month).format('MMMM YYYY')} Attendance
      </h2>
      
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-sm py-2">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10"></div>
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = moment(month).date(i + 1).format('YYYY-MM-DD');
          const dayRecords = records.filter(r => r.date === date);
          
          return (
            <div 
              key={i} 
              className={`h-10 border rounded flex flex-col items-center justify-center ${
                dayRecords.length > 0 ? 
                  dayRecords[0].status === 'present' ? 'bg-green-50 border-green-200' :
                  dayRecords[0].status === 'absent' ? 'bg-red-50 border-red-200' :
                  dayRecords[0].status === 'late' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="text-sm">{i + 1}</div>
              {dayRecords.length > 0 && (
                <div className="text-xs">
                  {dayRecords[0].status.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
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
    </div>
  );
};

export default AttendanceSystem;