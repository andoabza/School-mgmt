import { pool } from "../config/db.js";

class Teacher {

  static async getAll() {
    const { rows } = await pool.query(
      `SELECT 
        u.first_name,
        u.last_name,
        t.id, 
        t.subject, 
        c.id AS class_id,
        c.name AS class_name,
        c.subject,
        c.teacher_id
      FROM teachers t
      JOIN classes c ON t.id = c.teacher_id
      JOIN users u ON t.id = u.id`
    );
    return rows;
  }

  static async getByClassId(classId) {
  const { rows } = await pool.query(
    `SELECT 
      u.first_name,
      u.last_name,
      t.id, 
      t.subject AS teacher_subject,  -- Added alias to avoid conflict
      c.id AS class_id,
      c.name AS class_name,
      c.subject AS class_subject,   -- Added alias to avoid conflict
      c.teacher_id
    FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    JOIN users u ON t.id = u.id
    WHERE c.id = $1`,  // Changed filter to class ID
    [classId]
  );
  return rows;
}

  static async getClassesByTeacher(teacherId) {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.subject, c.grade_level, 
              COUNT(e.id) AS student_count
       FROM classes c
       LEFT JOIN enrollment e ON c.id = e.class_id
       WHERE c.teacher_id = $1
       GROUP BY c.id`,
      [teacherId]
    );
    return rows;
  }
}

export default Teacher;