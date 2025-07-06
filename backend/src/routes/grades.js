// backend/src/routes/grades.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');

router.post('/', auth('teacher'), async (req, res) => {
  const { classId, assignment, studentGrades } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // First create the assignment
    const assignmentRes = await client.query(
      `INSERT INTO assignments 
       (class_id, name, max_score) 
       VALUES ($1, $2, $3) RETURNING id`,
      [classId, assignment.name, assignment.maxScore]
    );
    
    const assignmentId = assignmentRes.rows[0].id;
    
    // Insert all grades
    for (const grade of studentGrades) {
      await client.query(
        `INSERT INTO grades 
         (assignment_id, student_id, score) 
         VALUES ($1, $2, $3)`,
        [assignmentId, grade.studentId, grade.score]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Grades recorded' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to record grades' });
  } finally {
    client.release();
  }
});