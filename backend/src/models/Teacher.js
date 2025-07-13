import { pool } from "../config/db.js";

class Teacher {

  static async getAll() {
  const { rows } = await pool.query(`
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      json_agg(json_build_object(
        'id', c.id,
        'subject', ct.subject,
        'name', c.name,
        'grade_level', c.grade_level
      )) AS classes
    FROM users u
    JOIN class_teachers ct ON u.id = ct.teacher_id
    JOIN classes c ON ct.class_id = c.id
    WHERE u.role = 'teacher'
    GROUP BY u.id, u.first_name, u.last_name
  `);
  
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
      // `SELECT ct.id, c.name, ct.subject, c.grade_level, 
      //         COUNT(e.id) AS student_count
      //  FROM class_teachers ct
      //  LEFT JOIN enrollment e ON ct.class_id = e.class_id
      //   JOIN classes c ON ct.class_id = c.id
      //  WHERE ct.teacher_id = $1
      `SELECT ct.class_id AS id, ct.teacher_id, ct.subject, c.name, c.grade_level
       FROM class_teachers ct
       JOIN classes c ON ct.class_id = c.id
       WHERE ct.teacher_id = $1`,
      [teacherId]
    );
    return rows;
  }
}

export default Teacher;