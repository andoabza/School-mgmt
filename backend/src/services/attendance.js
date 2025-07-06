// backend/src/services/attendance.js
const { pool } = require('../config/db');

module.exports = {
  async recordAttendance(classId, records, recordedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const deleteQuery = `
        DELETE FROM attendance 
        WHERE class_id = $1 AND date = CURRENT_DATE
      `;
      await client.query(deleteQuery, [classId]);
      
      const insertQuery = `
        INSERT INTO attendance 
        (student_id, class_id, date, status, recorded_by)
        VALUES ($1, $2, CURRENT_DATE, $3, $4)
      `;
      
      for (const record of records) {
        await client.query(insertQuery, [
          record.studentId,
          classId,
          record.status,
          recordedBy
        ]);
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};