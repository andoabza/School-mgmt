import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../axiosConfig';


export default function AttendanceModal({ classId, date, onClose }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
      const [enrolledRes, attendanceRes] = await Promise.all([
        api.get(`/classes/${classId}/students`),
        api.get(`/attendance?classId=${classId}&date=${date}`)
      ]);
      
      setStudents(enrolledRes.data);
      
      if (attendanceRes.data) {
        const records = {};
        attendanceRes.data.records.forEach(r => {
          records[r.student_id] = r.status;
        });
        setAttendance(records);
      }
    };
    
    fetchData();
  }, [classId, date]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    await api.post('/attendance', {
      classId,
      date,
      records: Object.entries(attendance).map(([studentId, status]) => ({
        studentId, status
      }))});
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Attendance for {date}</h2>
        <div className="space-y-2">
          {students.map(student => (
            <div key={student.id} className="flex items-center justify-between p-2 border-b">
              <span>{student.first_name} {student.last_name}</span>
              <select
                value={attendance[student.id] || 'present'}
                onChange={(e) => handleStatusChange(student.id, e.target.value)}
                className="border rounded p-1"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save Attendance
          </button>
        </div>
      </div>
    </Modal>
  );
}