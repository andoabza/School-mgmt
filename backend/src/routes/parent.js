// backend/src/routes/parent.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');

router.get('/children', auth('parent'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, u.first_name, u.last_name, s.grade_level, s.section
      FROM students s
      JOIN users u ON s.id = u.id
      JOIN student_parents sp ON s.id = sp.student_id
      WHERE sp.parent_id = $1
    `, [req.user.id]);
    
    res.json(rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/child/:id/grades', auth('parent'), async (req, res) => {
  try {
    // Verify parent-child relationship
    const relationship = await pool.query(
      `SELECT 1 FROM student_parents 
       WHERE parent_id = $1 AND student_id = $2`,
      [req.user.id, req.params.id]
    );
    
    if (relationship.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { rows } = await pool.query(`
      SELECT a.name, a.max_score, g.score, 
             c.name AS class_name, u.first_name AS teacher_first_name,
             u.last_name AS teacher_last_name
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE g.student_id = $1
      ORDER BY a.due_date DESC
    `, [req.params.id]);
    
    res.json(rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});