import { pool } from '../config/db.js';

class ClassTeacher {
  // Assign teacher to class for a specific subject
  static async assign(classId, teacherId, subject) {
    const query = `
      INSERT INTO class_teachers (class_id, teacher_id, subject)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [classId, teacherId, subject];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // // Unassign teacher from class for a specific subject
  // static async unassign(classId, teacherId, subject) {
  //   const query = `
  //     DELETE FROM class_teachers
  //     WHERE class_id = $1 AND teacher_id = $2 AND subject = $3
  //     RETURNING *
  //   `;
  //   const values = [classId, teacherId, subject];
  //   const { rows } = await pool.query(query, values);
  //   return rows[0];
  // }

  // Get all teachers for a class
  static async getByClass(classId) {
  const query = `
    SELECT ct.*, u.first_name, u.last_name
    FROM class_teachers ct
    JOIN users u ON ct.teacher_id = u.id
    WHERE ct.class_id = $1
  `;
  const { rows } = await pool.query(query, [classId]);
  return rows;
}

static async unassign(classId, teacherId, subject) {
  const query = `
    DELETE FROM class_teachers
    WHERE class_id = $1 AND teacher_id = $2 AND subject = $3
    RETURNING *
  `;
  const { rows } = await pool.query(query, [classId, teacherId, subject]);
  return rows[0];
}

  // Get all classes for a teacher
  static async getByTeacher(teacherId) {
    const query = `
      SELECT ct.*, c.name AS class_name
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.id
      WHERE ct.teacher_id = $1
    `;
    const { rows } = await pool.query(query, [teacherId]);
    return rows;
  }

  // Update teacher assignment
  static async updateAssignment(classId, oldTeacherId, newTeacherId, subject) {
    await this.unassign(classId, oldTeacherId, subject);
    return this.assign(classId, newTeacherId, subject);
  }
}

export default ClassTeacher;