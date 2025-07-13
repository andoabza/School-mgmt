import { pool } from '../config/db.js'

class Class {
  static async create({ name, subject, teacher_id, grade_level }) {
    const result = await pool.query(
      'INSERT INTO classes (name, subject, teacher_id, grade_level) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, subject, teacher_id, grade_level]
    );
    return result.rows[0];
  }


  // static async findAll() {
  //   const result = await pool.query(`
  //     SELECT c.*, u.first_name || ' ' || u.last_name as teacher_name 
  //     FROM classes c
  //     LEFT JOIN users u ON c.teacher_id = u.id
  //   `);
  //   return result.rows;
  // }

  // static async findById(id) {
  //   const result = await pool.query('SELECT * FROM classes WHERE id = $1', [id]);
  //   return result.rows[0];
  // }



  // Update teacher assignment for a class
  static async updateTeacher(classId, teacherId) {
    const query = `
      UPDATE classes 
      SET teacher_id = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const values = [teacherId, classId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Get class by ID
  static async getById(classId) {
    const query = `
      SELECT 
        c.id, c.name, c.subject, c.grade_level, c.teacher_id,
        u.first_name, u.last_name
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = $1
    `;
    const { rows } = await pool.query(query, [classId]);
    return rows[0];
  }

  static async update(id, { name, subject, teacher_id, grade_level }) {
    const result = await pool.query(
      'UPDATE classes SET name = $1, subject = $2, teacher_id = $3, grade_level = $4 WHERE id = $5 RETURNING *',
      [name, subject, teacher_id, grade_level, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM classes WHERE id = $1', [id]);
  }
  static async findAll() {
    try {
      const query = `
        SELECT 
          c.id, c.name, c.subject, c.grade_level,
          json_agg(
            json_build_object(
              'id', u.id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'subject', ct.subject
            ) 
          ) AS teachers
        FROM classes c
        LEFT JOIN class_teachers ct ON c.id = ct.class_id
        LEFT JOIN users u ON ct.teacher_id = u.id
        GROUP BY c.id
        ORDER BY c.grade_level, c.name
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error('Failed to fetch classes');
    }
  }

  // Get class by ID with teachers
  static async findById(id) {
    try {
      const query = `
        SELECT 
          c.id, c.name, c.subject, c.grade_level,
          json_agg(
            json_build_object(
              'id', u.id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'subject', ct.subject
            ) 
          ) AS teachers
        FROM classes c
        LEFT JOIN class_teachers ct ON c.id = ct.class_id
        LEFT JOIN users u ON ct.teacher_id = u.id
        WHERE c.id = $1
        GROUP BY c.id
      `;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw new Error('Failed to fetch class');
    }
  }
}

export default Class;