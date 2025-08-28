import { pool } from "../config/db.js";

class Grade {
  // Create a new grade
  static async create(gradeData) {
    const { student_id, class_id, assignment_name, score, max_score, grade_date } = gradeData;
    
    const query = `
      INSERT INTO grades (student_id, class_id, assignment_name, score, max_score, grade_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [student_id, class_id, assignment_name, score, max_score, grade_date];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating grade: ${error.message}`);
    }
  }

  // Get all grades for a specific class
  static async findByClassId(classId) {
    const query = `
      SELECT g.*, u.first_name, u.last_name, s.student_id as student_number
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN users u ON s.id = u.id
      WHERE g.class_id = $1
      ORDER BY u.last_name, u.first_name, g.assignment_name
    `;
    
    try {
      const result = await pool.query(query, [classId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching grades for class: ${error.message}`);
    }
  }

  // Get grades for a specific student
  static async findByStudentId(studentId, classId = null) {
    let query, values;
    
    if (classId) {
      query = `
        SELECT g.*, c.name as class_name
        FROM grades g
        JOIN classes c ON g.class_id = c.id
        WHERE g.student_id = $1 AND g.class_id = $2
        ORDER BY g.grade_date DESC
      `;
      values = [studentId, classId];
    } else {
      query = `
        SELECT g.*, c.name as class_name
        FROM grades g
        JOIN classes c ON g.class_id = c.id
        WHERE g.student_id = $1
        ORDER BY g.class_id, g.grade_date DESC
      `;
      values = [studentId];
    }
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching grades for student: ${error.message}`);
    }
  }

  // Update a grade
  static async update(id, gradeData) {
    const { assignment_name, score, max_score } = gradeData;
    
    const query = `
      UPDATE grades 
      SET assignment_name = $1, score = $2, max_score = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [assignment_name, score, max_score, id];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating grade: ${error.message}`);
    }
  }

  // Delete a grade
  static async delete(id) {
    const query = 'DELETE FROM grades WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting grade: ${error.message}`);
    }
  }

  // Get class average for an assignment
  static async getClassAverage(classId, assignmentName) {
    const query = `
      SELECT AVG(score/max_score*100) as average_percentage
      FROM grades
      WHERE class_id = $1 AND assignment_name = $2
    `;
    
    try {
      const result = await pool.query(query, [classId, assignmentName]);
      return result.rows[0].average_percentage;
    } catch (error) {
      throw new Error(`Error calculating class average: ${error.message}`);
    }
  }

  // Get student average in a class
  static async getStudentAverage(studentId, classId) {
    const query = `
      SELECT AVG(score/max_score*100) as average_percentage
      FROM grades
      WHERE student_id = $1 AND class_id = $2
    `;
    
    try {
      const result = await pool.query(query, [studentId, classId]);
      return result.rows[0].average_percentage;
    } catch (error) {
      throw new Error(`Error calculating student average: ${error.message}`);
    }
  }
  // Get class analytics
  static async getClassAnalytics(classId) {
    const query = `
      SELECT 
        AVG(score/max_score*100) as class_average,
        COUNT(DISTINCT student_id) as students_with_grades,
        (SELECT COUNT(*) FROM enrollments WHERE class_id = $1) as total_students,
        COUNT(CASE WHEN score/max_score >= 0.9 THEN 1 END) as a_grades,
        COUNT(CASE WHEN score/max_score >= 0.8 AND score/max_score < 0.9 THEN 1 END) as b_grades,
        COUNT(CASE WHEN score/max_score >= 0.7 AND score/max_score < 0.8 THEN 1 END) as c_grades,
        COUNT(CASE WHEN score/max_score >= 0.6 AND score/max_score < 0.7 THEN 1 END) as d_grades,
        COUNT(CASE WHEN score/max_score < 0.6 THEN 1 END) as f_grades
      FROM grades
      WHERE class_id = $1
    `;
    
    try {
      const result = await db.query(query, [classId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error fetching class analytics: ${error.message}`);
    }
  }

  // Get student analytics
  static async getStudentAnalytics(studentId) {
    const query = `
      SELECT 
        AVG(score/max_score*100) as overall_average,
        COUNT(*) as total_assignments,
        c.subject,
        AVG(CASE WHEN g.class_id = c.id THEN score/max_score*100 END) as subject_average
      FROM grades g
      JOIN classes c ON g.class_id = c.id
      WHERE g.student_id = $1
      GROUP BY c.subject
      ORDER BY subject_average DESC
    `;
    
    try {
      const result = await db.query(query, [studentId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching student analytics: ${error.message}`);
    }
  }

  // Get grade distribution for a class
  static async getGradeDistribution(classId) {
    const query = `
      SELECT 
        assignment_name,
        AVG(score/max_score*100) as average_score,
        COUNT(*) as submissions
      FROM grades
      WHERE class_id = $1
      GROUP BY assignment_name
      ORDER BY assignment_name
    `;
    
    try {
      const result = await db.query(query, [classId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching grade distribution: ${error.message}`);
    }
  }
}

export default Grade;