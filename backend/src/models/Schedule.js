import { pool } from '../config/db.js';

class Schedule {
  // Get all schedules with class details
  static async getAll() {
    const query = `
      SELECT 
        s.id, 
        s.classroom_id, 
        s.day_of_week, 
        s.start_time, 
        s.end_time,
        c.id AS class_id,
        c.grade_level,
        c.name AS class_name,
        ct.subject,
        c.teacher_id,
        u.first_name,
        u.last_name
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      JOIN class_teachers ct ON ct.teacher_id = c.teacher_id
      JOIN users u ON c.teacher_id = u.id
      ORDER BY s.day_of_week, s.start_time
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Get schedule by ID
  static async findById(id) {
    const query = `
      SELECT 
        s.*,
        c.name AS class_name,
        c.subject,
        c.teacher_id
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Create new schedule
  static async create({ class_id, classroom_id, day_of_week, start_time, end_time }) {
    const query = `
      INSERT INTO schedules 
      (class_id, classroom_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      class_id, classroom_id, day_of_week, start_time, end_time
    ]);
    return rows[0];
  }

  // Update schedule
  static async update(id, { class_id, classroom_id, day_of_week, start_time, end_time }) {
    const query = `
      UPDATE schedules 
      SET 
        class_id = $1,
        classroom_id = $2,
        day_of_week = $3,
        start_time = $4,
        end_time = $5
      WHERE id = $6
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      class_id, classroom_id, day_of_week, start_time, end_time, id
    ]);
    return rows[0];
  }

  // Delete schedule
  static async delete(id) {
    const query = 'DELETE FROM schedules WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Check for classroom conflicts
  static async checkClassroomConflict({ classroom_id, day_of_week, start_time, end_time, excludeId = null }) {
    const query = `
      SELECT id FROM schedules 
      WHERE classroom_id = $1 
      AND day_of_week = $2 
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
      AND id != COALESCE($5, -1)
    `;
    const { rows } = await pool.query(query, [
      classroom_id, day_of_week, start_time, end_time, excludeId
    ]);
    return rows.length > 0;
  }

  // Check for teacher conflicts
  static async checkTeacherConflict({ class_id, day_of_week, start_time, end_time, excludeId = null }) {
    const query = `
      SELECT s.id FROM schedules s
      JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = (SELECT teacher_id FROM classes WHERE id = $1)
      AND s.day_of_week = $2
      AND (
        (s.start_time <= $3 AND s.end_time > $3) OR
        (s.start_time < $4 AND s.end_time >= $4) OR
        (s.start_time >= $3 AND s.end_time <= $4)
      )
      AND s.id != COALESCE($5, -1)
    `;
    const { rows } = await pool.query(query, [
      class_id, day_of_week, start_time, end_time, excludeId
    ]);
    return rows.length > 0;
  }
}

export default Schedule;