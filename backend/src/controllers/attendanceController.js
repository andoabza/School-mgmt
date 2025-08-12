import { pool } from "../config/db.js";
import Attendance from "../models/Attendance.js";

const attendanceController = {
  saveAttendance: async (req, res) => {
    const { classId, date, remark, records } = req.body;
    const attendanceId = req.params.id;

    if (!classId || !date || !records) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    try {
      await pool.query('BEGIN');

      // Use the provided ID or create/update based on classId and date
      const effectiveAttendanceId = attendanceId || 
        (await Attendance.createOrUpdateAttendance(classId, date, remark, req.user.id));

      // Clear existing records
      await Attendance.deleteAttendanceRecords(effectiveAttendanceId);

      // Insert new records with validation
      for (const record of records) {
        if (!record.studentId || !record.status) {
          throw new Error(`Invalid record format for student ${record.studentId}`);
        }
        
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

  getAttendance: async (req, res) => {
    try {
      const { classId, date, studentId } = req.query;
      if (!date) {
        return res.status(400).json({ 
          success: false,
          message: 'Date is required' 
        });
      }
      let attendance;
      if (classId) {
        attendance = await Attendance.getAttendanceByClassAndDate(classId, date);
      } 
      else if (studentId) {
        attendance = await Attendance.getStudentAttendanceForDate(studentId, date);
      } 
      else if (studentId || classId){
        return res.status(400).json({ 
          success: false,
          message: 'Either classId or studentId is required' 
        });
      }
      
      if (!attendance) {
        return res.status(404).json({ 
          success: false,
          message: 'Attendance record not found' 
        });
      }
      
      res.json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Error getting attendance:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get attendance' 
      });
    }
  },

  getMonthlyAttendance: async (req, res) => {
    try {
      const { classId, studentId, month } = req.query;
      
      if (!month) {
        return res.status(400).json({ 
          success: false,
          message: 'Month is required (YYYY-MM)' 
        });
      }

      let data;
      if (classId) {
        data = await Attendance.getClassMonthlyAttendance(classId, month);
      } else if (studentId) {
        data = await Attendance.getStudentMonthlyAttendance(studentId, month);
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'Either classId or studentId is required' 
        });
      }
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error getting monthly attendance:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get monthly attendance' 
      });
    }
  },

  exportAttendance: async (req, res) => {
    try {
      const { classId, month } = req.query;
      
      if (!month) {
        return res.status(400).json({ 
          success: false,
          message: 'Month is required (YYYY-MM)' 
        });
      }

      const csvData = await Attendance.exportAttendanceToCSV(classId, month);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_${month}.csv`);
      res.status(200).end(csvData);
    } catch (error) {
      console.error('Error exporting attendance:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to export attendance' 
      });
    }
  },

  getClassStudents: async (req, res) => {
    try {
      const { classId } = req.params;
      
      if (!classId) {
        return res.status(400).json({ 
          success: false,
          message: 'Class ID is required' 
        });
      }
      
      const students = await Attendance.getClassStudents(classId);
      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Error getting class students:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to get class students' 
      });
    }
  }
};

export default attendanceController;