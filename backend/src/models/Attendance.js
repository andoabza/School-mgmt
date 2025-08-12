import { pool } from "../config/db.js";
import { format } from 'fast-csv';
import moment from 'moment';


class Attendance {
  static async createOrUpdateAttendance(classId, date, remark = null, createdBy = null) {
    const { rows } = await pool.query(
      `INSERT INTO attendance (class_id, attendance_date, remark, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (class_id, attendance_date) 
       DO UPDATE SET remark = EXCLUDED.remark, updated_at = NOW()
       RETURNING id`,
      [classId, date, remark, createdBy]
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
       ON CONFLICT (attendance_id, student_id)
       DO UPDATE SET status = EXCLUDED.status, details = EXCLUDED.details, updated_at = NOW()
       RETURNING id`,
      [attendanceId, studentId, status, details]
    );
    return rows[0];
  }

  static async getAttendanceByClassAndDate(classId, date) {
    const headerRes = await pool.query(
      `SELECT id, class_id, attendance_date as date, remark 
       FROM attendance
       WHERE class_id = $1 AND attendance_date = $2`,
      [classId, date]
    );
    
    if (headerRes.rows.length === 0) return null;
    
    const recordsRes = await pool.query(
      `SELECT ar.student_id, s.first_name, s.last_name, s.student_id as student_number,
              ar.status, ar.details as remark
       FROM attendance_records ar
       JOIN students s ON ar.student_id = s.id
       WHERE ar.attendance_id = $1
       ORDER BY s.last_name, s.first_name`,
      [headerRes.rows[0].id]
    );
    
    return {
      ...headerRes.rows[0],
      records: recordsRes.rows
    };
  }

  static async getStudentAttendanceForDate(studentId, date) {
    const res = await pool.query(
      `SELECT a.id, a.class_id, c.name as class_name, 
              a.attendance_date as date, a.remark,
              ar.status, ar.details as remark
       FROM attendance_records ar
       JOIN attendance a ON ar.attendance_id = a.id
       JOIN classes c ON a.class_id = c.id
       WHERE ar.student_id = $1 AND a.attendance_date = $2`,
      [studentId, date]
    );
    
    return res.rows[0] || null;
  }

  static async getClassMonthlyAttendance(classId, month) {
    const daysInMonth = moment(month, 'YYYY-MM').daysInMonth();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const studentsRes = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.student_id
       FROM enrollment e
       JOIN students s ON e.student_id = s.id
       WHERE e.class_id = $1
       ORDER BY s.last_name, s.first_name`,
      [classId]
    );
    
    const attendanceRes = await pool.query(
      `SELECT ar.student_id, 
              to_char(a.attendance_date, 'DD') as day,
              ar.status
       FROM attendance_records ar
       JOIN attendance a ON ar.attendance_id = a.id
       WHERE a.class_id = $1 
         AND to_char(a.attendance_date, 'YYYY-MM') = $2`,
      [classId, month]
    );
    
    const attendanceMap = {};
    attendanceRes.rows.forEach(row => {
      if (!attendanceMap[row.student_id]) {
        attendanceMap[row.student_id] = {};
      }
      attendanceMap[row.student_id][row.day] = row.status;
    });
    
    const summary = studentsRes.rows.map(student => {
      const studentAttendance = {};
      days.forEach(day => {
        studentAttendance[day] = attendanceMap[student.id]?.[day] || null;
      });
      
      const presentCount = Object.values(studentAttendance).filter(s => s === 'present').length;
      const totalDays = Object.values(studentAttendance).filter(s => s !== null).length;
      const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
      
      return {
        ...student,
        attendance: studentAttendance,
        presentCount,
        totalDays,
        attendanceRate
      };
    });
    
    return {
      month,
      classId,
      days,
      students: summary
    };
  }


  static async getStudentMonthlyAttendance(studentId, month) {
    const daysInMonth = moment(month, 'YYYY-MM').daysInMonth();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const studentsRes = await pool.query(
      `SELECT s.id, u.first_name, u.last_name, s.student_id
       FROM enrollment e
       JOIN students s ON e.student_id = s.id
       JOIN users u ON s.id = u.id
       WHERE e.student_id = $1
       ORDER BY u.last_name, u.first_name`,
      [studentId]
    );
    
    const attendanceRes = await pool.query(
      `SELECT ar.student_id, 
              to_char(a.attendance_date, 'DD') as day,
              ar.status
       FROM attendance_records ar
       JOIN attendance a ON ar.attendance_id = a.id
       WHERE ar.student_id = $1 
         AND to_char(a.attendance_date, 'YYYY-MM') = $2`,
      [studentId, month]
    );
    
    const attendanceMap = {};
    attendanceRes.rows.forEach(row => {
      if (!attendanceMap[row.student_id]) {
        attendanceMap[row.student_id] = {};
      }
      attendanceMap[row.student_id][row.day] = row.status;
    });
    
    const summary = studentsRes.rows.map(student => {
      const studentAttendance = {};
      days.forEach(day => {
        studentAttendance[day] = attendanceMap[student.id]?.[day] || null;
      });
      
      const presentCount = Object.values(studentAttendance).filter(s => s === 'present').length;
      const lateCount = Object.values(studentAttendance).filter(s => s === 'late').length;
      const absentCount = Object.values(studentAttendance).filter(s => s === 'absent').length;
      const excusedCount = Object.values(studentAttendance).filter(s => s === 'excused').length;
      const totalDays = Object.values(studentAttendance).filter(s => s !== null).length;
      const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
      
      return {
        ...student,
        attendance: studentAttendance,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        totalDays,
        attendanceRate
      };
    });
    
    return {
      month,
      studentId,
      days,
      records: summary
    };
  }

  static async exportAttendanceToCSV(classId, month) {
    return new Promise((resolve, reject) => {
      const csvStream = format({ headers: true });
      let csvData = '';
      
      csvStream
        .on('data', chunk => csvData += chunk)
        .on('end', () => resolve(csvData))
        .on('error', reject);
      
      pool.query(`
        SELECT 
          s.student_id as "Student ID",
          s.first_name as "First Name",
          s.last_name as "Last Name",
          ${Array.from({ length: 31 }, (_, i) => 
            `MAX(CASE WHEN to_char(a.attendance_date, 'DD') = '${String(i+1).padStart(2, '0')}' THEN ar.status ELSE NULL END) as "Day ${i+1}"`
          ).join(',')}
        FROM students s
        LEFT JOIN enrollment e ON s.id = e.student_id
        LEFT JOIN attendance_records ar ON s.id = ar.student_id
        LEFT JOIN attendance a ON ar.attendance_id = a.id 
          AND to_char(a.attendance_date, 'YYYY-MM') = $2
        WHERE e.class_id = $1
        GROUP BY s.id
        ORDER BY s.last_name, s.first_name
      `, [classId, month])
      .then(res => {
        res.rows.forEach(row => csvStream.write(row));
        csvStream.end();
      })
      .catch(reject);
    });
  }

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

export default Attendance;