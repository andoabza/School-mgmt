import { pool } from "../config/db.js";

class Enrollment {
  static async enrollStudent(classId, studentId) {
    try {
      // Check if enrollment already exists
      const existing = await pool.query(
        `SELECT id FROM enrollment
         WHERE class_id = $1 AND student_id = $2`,
        [classId, studentId]
      );

      if (existing.rows.length > 0) {
        throw new Error('Student is already enrolled in this class');
      }

      const { rows } = await pool.query(
        `INSERT INTO enrollment (class_id, student_id)
         VALUES ($1, $2) RETURNING *`,
        [classId, studentId]
      );
      return rows[0];
    } catch (error) {
      // Handle unique constraint violation specifically
      if (error.code === '23505') { // Unique violation error code
        throw new Error('Student is already enrolled in this class');
      }
      throw error;
    }
  }

  static async removeEnrollment(classId, studentId) {
    const { rowCount } = await pool.query(
      `DELETE FROM enrollment
       WHERE class_id = $1 AND student_id = $2`,
      [classId, studentId]
    );

    if (rowCount === 0) {
      throw new Error('Enrollment record not found');
    }

    return { success: true, message: 'Enrollment removed successfully' };
  }

  static async getClassStudents(classId) {
    const { rows } = await pool.query(
      `SELECT *
       FROM enrollment e
       JOIN students s ON e.student_id = s.id
       JOIN users u ON s.id = u.id
       WHERE e.class_id = $1`,
      [classId]
    );
    return rows;
  }

  static async getStudentEnrollments(studentId) {
    const { rows } = await pool.query(
     `SELECT e.*, c.name as class_name, c.subject
      FROM enrollment e
      JOIN classes c ON e.class_id = c.id
      JOIN users u ON u.id = e.student_id
      WHERE e.student_id = $1`,
      [studentId]
    );
    return rows;
  }

  static async getClassEnrollmentCount(classId) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM enrollment
       WHERE class_id = $1`,
      [classId]
    );
    return parseInt(rows[0].count);
  }

  static async validateEnrollment(classId, studentId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM enrollment
       WHERE class_id = $1 AND student_id = $2`,
      [classId, studentId]
    );
    return rows.length > 0;
  }
}

export default Enrollment;