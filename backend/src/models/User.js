import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

class UserModel {
  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }

  // Find user by ID with role-specific details
  static async getById(id) {
    const query = `
      SELECT u.*, 
             s.student_id, s.grade_level, s.section,
             t.subject,
             p.id AS parent_id
      FROM users u
      LEFT JOIN students s ON u.id = s.id
      LEFT JOIN teachers t ON u.id = t.id
      LEFT JOIN parents p ON u.id = p.id
      WHERE u.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  //get student by student_id
  static async getByStudentId(id){
    const query = `
      SELECT u.*, 
             s.student_id, s.grade_level, s.section,
             t.subject,
             p.id AS parent_id
      FROM students s
      LEFT JOIN users u ON s.id = u.id
      LEFT JOIN teachers t ON u.id = t.id
      LEFT JOIN parents p ON u.id = p.id
      WHERE u.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Create a new user
  static async create({ email, password, role, firstName, lastName }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const query = `
      INSERT INTO users (email, password, role, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, role, first_name, last_name
    `;
    const { rows } = await pool.query(query, [
      email,
      hashedPassword,
      role,
      firstName,
      lastName
    ]);
    return rows[0];
  }

  // Create student profile
  static async createStudent(id, { birthDate, gradeLevel, section }) {
    const studentId = `STU-${Date.now()}`;
    const query = `
      INSERT INTO students (id, student_id, birth_date, grade_level, section)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING student_id, grade_level, section
    `;
    await pool.query(query, [
      id,
      studentId,
      birthDate,
      gradeLevel,
      section
    ]);
    return { studentId, gradeLevel, section };
  }

  // Create teacher profile
  static async createTeacher(id, subject) {
    const query = `
      INSERT INTO teachers (id, subject)
      VALUES ($1, $2)
      RETURNING subject
    `;
    await pool.query(query, [id, subject]);
    return { subject };
  }

  // Create parent profile
  static async createParent(id) {
    const query = `
      INSERT INTO parents (id)
      VALUES ($1)
      RETURNING id
    `;
    await pool.query(query, [id]);
  }

  // Link parent to child
  static async linkParentChild(parentId, studentId) {
    const query = `
      INSERT INTO student_parents (student_id, parent_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    await pool.query(query, [studentId, parentId]);
  }

  // Update user password
  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const query = `
      UPDATE users 
      SET password = $1 
      WHERE id = $2
    `;
    await pool.query(query, [hashedPassword, id]);
  }

  // Update user role
  static async updateRole(id, role) {
    const query = `
      UPDATE users 
      SET role = $1 
      WHERE id = $2
    `;
    await pool.query(query, [role, id]);
  }

  // Delete user and all related data
  static async delete(id) {
    await pool.query('BEGIN');
    
    // Delete from role-specific tables
    await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    await pool.query('DELETE FROM parents WHERE id = $1', [id]);
    
    // Delete relationships
    await pool.query('DELETE FROM student_parents WHERE student_id = $1 OR parent_id = $1', [id]);
    
    // Delete from main users table
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    await pool.query('COMMIT');
  }

  // Get all users with optional role filter
  static async findAll(roleFilter = null) {
    let query = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
             s.student_id, s.grade_level, s.section
      FROM users u
      LEFT JOIN students s ON u.id = s.id
      WHERE u.role IN ('admin', 'teacher', 'student', 'parent')
    `;
    
    const params = [];
    if (roleFilter) {
      query += ` AND u.role = $${params.length + 1}`;
      params.push(roleFilter);
    }
    
    query += ' ORDER BY u.role, u.last_name';
    
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getAllChildren(id) {
    let query = `
      // SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
      //        s.student_id, s.grade_level, s.section, p.*, sp.*
      // FROM users u
      // LEFT JOIN students s ON u.id = s.id
      // LEFT JOIN parents p ON u.id = p.id
      // LEFT JOIN student_parents sp ON u.id = s.id
      SELECT * FROM student_parents sp
      WHERE sp.parent_id = $1
    `;
    
    const { rows } = await pool.query(query, id);
    return rows;
  }

  // Verify password
  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  // Get child by student ID
  static async getChildByStudentId(studentId) {
    const query = 'SELECT id FROM students WHERE student_id = $1';
    const { rows } = await pool.query(query, [studentId]);
    return rows[0];
  }
}

export default UserModel;