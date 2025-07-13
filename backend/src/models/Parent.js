import { pool } from '../config/db.js';

class Parent{
	//find by email
	static async findByEmail(email) {
    const query = `
    SELECT *
    FROM users 
    WHERE LOWER(email) = LOWER($1)`;

    // JOIN students s ON u.id = s.student_id
    const { rows } = await pool.query(query, [email]);
    console.log(rows);
    return rows[0];
  }
	// link parent with child
	static async linkParentChild(parentId, email) {
	const result = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
	const studentId = result.rows[0].id;
	const query = `
      INSERT INTO student_parents (student_id, parent_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    await pool.query(query, [studentId, parentId]);
  }

  // check if the link exists
  static async linkExist(parentId, email){
	const result = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
	const studentId = result.rows[0].id;
	const rows = await pool.query(
        'SELECT * FROM student_parents WHERE parent_id = $1 AND student_id = $2',
        [parentId, studentId]
      );
      
      return rows[0];
  }

  // get all childrens
	static async getChildren(id) {
      const { rows } = await pool.query(
        `SELECT s.id, u.first_name, u.last_name, s.student_id, s.grade_level, s.section
         FROM students s
         JOIN users u ON s.id = u.id
         JOIN student_parents sp ON s.id = sp.student_id
         WHERE sp.parent_id = $1`,
        [id]
      );
      
      return rows;
	}

  // get child grade
	static async getChildGrades(id) {
      const { rows } = await pool.query(
        `SELECT g.id, a.name, g.score, a.max_score, c.name AS class_name, 
                t.first_name AS teacher_first_name, t.last_name AS teacher_last_name,
                a.due_date
         FROM grades g
         JOIN assignments a ON g.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         JOIN users t ON c.teacher_id = t.id
         WHERE g.student_id = $1`,
        [id]
      );
      
      return rows;
    }

    // Get attendance for a child
  static async getChildAttendance(id) {
      const { rows } = await pool.query(
        `SELECT ar.id, c.name AS class_name, ar.status, 
                t.first_name AS teacher_first_name, t.last_name AS teacher_last_name,
                a.attendance_date AS date
         FROM attendance_records ar
         JOIN attendance a ON ar.attendance_id = a.id
         JOIN classes c ON a.class_id = c.id
         JOIN users t ON c.teacher_id = t.id
         WHERE ar.student_id = $1`,
        [id]
      );
      
  	return rows;
}
}

export default Parent;
