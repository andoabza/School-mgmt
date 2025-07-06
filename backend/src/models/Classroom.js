import { pool } from '../config/db.js'


class Classroom {
  static async create({ name, building, capacity }) {
    const result = await pool.query(
      'INSERT INTO classrooms (name, building, capacity) VALUES ($1, $2, $3) RETURNING *',
      [name, building, capacity]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM classrooms');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM classrooms WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, { name, building, capacity }) {
    const result = await pool.query(
      'UPDATE classrooms SET name = $1, building = $2, capacity = $3 WHERE id = $4 RETURNING *',
      [name, building, capacity, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM classrooms WHERE id = $1', [id]);
  }
}

export default Classroom;