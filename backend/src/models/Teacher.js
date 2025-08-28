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
  static async getSetting(teacherId) {
    const { rows } = pool.query(
      `SELECT * FROM teacher_settings WHERE teacher_id = $1`,
      [teacherId]
    );
    
    if (!rows) {
      // Return default settings if none exist
      return {
        gradingScale: { A: 90, B: 80, C: 70, D: 60, F: 0 },
        categoryWeights: { homework: 0.3, classwork: 0.2, assessment: 0.4, project: 0.1 }
      }
    }
    return rows;
  }

  static async setSetting(teacherId, gradingScale, categoryWeights) {
    const existingSettings = pool.query(
      `SELECT * FROM teacher_settings WHERE teacher_id = $1`,
      [teacherId]
    );
    
    let result;
    if (existingSettings.rows.length > 0) {
      // Update existing settings
      result = await db.query(
        `UPDATE teacher_settings 
         SET grading_scale = $1, category_weights = $2, updated_at = CURRENT_TIMESTAMP
         WHERE teacher_id = $3 
         RETURNING *`,
        [gradingScale, categoryWeights, teacherId]
      );
      return result;
    } else {
      // Insert new settings
      result = await db.query(
        `INSERT INTO teacher_settings (teacher_id, grading_scale, category_weights)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [teacherId, gradingScale, categoryWeights]
      );
      return result
    }
  }
}

export default Teacher;