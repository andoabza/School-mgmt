import { pool } from "../config/db.js";

class Attendance {
  static async createOrUpdateAttendance(classId, date, remark) {
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
    await pool.query(
      `DELETE FROM attendance_records
       WHERE attendance_id = $1`,
      [attendanceId]
    );
  }

  static async createAttendanceRecord(attendanceId, studentId, status, details) {
    await pool.query(
      `INSERT INTO attendance_records 
       (attendance_id, student_id, status, details)
       VALUES ($1, $2, $3, $4)`,
      [attendanceId, studentId, status, details]
    );
  }

  static async getAttendanceByClassAndDate(classId, date) {
    const headerRes = await pool.query(
      `SELECT id, remark FROM attendance
       WHERE class_id = $1 AND attendance_date = $2`,
      [classId, date]
    );
    
    if (headerRes.rows.length === 0) {
      return null;
    }
    
    const attendance = headerRes.rows[0];
    const recordsRes = await pool.query(
      `SELECT student_id, status, details
       FROM attendance_records
       WHERE attendance_id = $1`,
      [attendance.id]
    );
    
    return {
      id: attendance.id,
      class_id: classId,
      date,
      remark: attendance.remark,
      records: recordsRes.rows
    };
  }

  static async getAttendanceHistory(classId, start, end) {
    const { rows } = await pool.query(
      `SELECT a.class_id, a.attendance_date, a.remark, 
              COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
              COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent_count,
              COUNT(ar.id) FILTER (WHERE ar.status = 'late') AS late_count,
              COUNT(ar.id) FILTER (WHERE ar.status = 'excused') AS excused_count
       FROM attendance a
       LEFT JOIN attendance_records ar ON a.id = ar.attendance_id
       WHERE a.class_id = $1 AND a.attendance_date BETWEEN $2 AND $3
       GROUP BY a.id
       ORDER BY a.attendance_date DESC`,
      [classId, start, end]
    );
    return rows;
  }

static async getStudentHistory(studentId, start, end) {
    const { rows } = await pool.query(
      `SELECT a.id, ar.*
       FROM attendance_records ar
       LEFT JOIN attendance a ON ar.attendance_id = a.id
       WHERE ar.student_id = $1 AND a.attendance_date BETWEEN $2 AND $3
       GROUP BY a.attendance_date, a.id, ar.id
       ORDER BY a.attendance_date DESC`,
      [studentId, start, end]
    );
    return rows;
  }
}
export default Attendance;