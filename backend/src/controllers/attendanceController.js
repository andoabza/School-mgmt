import { pool } from "../config/db.js";
import Attendance from "../models/Attendance.js";


const attendanceController = {
saveAttendance: async (req, res) => {
  let attendanceId;
  const { classId, date, remark, records } = req.body;

  attendanceId = req.params.id;

  try {
    try {
      await pool.query('BEGIN');
      if (!attendanceId) { 
        attendanceId = await Attendance.createOrUpdateAttendance(
        classId, date, remark
      );
      }
      
      await Attendance.deleteAttendanceRecords(attendanceId);
      
      for (const record of records) {
        await Attendance.createAttendanceRecord(
          attendanceId,
          record.studentId,
          record.status,
          record.details
        );
      }
      
      await pool.query('COMMIT');
      res.json({ message: 'Attendance saved successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},

getAttendance: async (req, res) => {
  try {
    const { classId, date } = req.query;
    const attendance = await Attendance.getAttendanceByClassAndDate(classId, date);
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},

getAttendanceHistory: async (req, res) => {
  try {
    const { classId, start, end } = req.query;
    const history = await Attendance.getAttendanceHistory(classId, start, end);
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},

getStudentHistory: async (req, res) => {
  try {
    const studentId = req.params.id;
    const { start, end } = req.query;
    const history = await Attendance.getStudentHistory(studentId, start, end);
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
}

export default attendanceController;