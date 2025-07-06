import express from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';

const router = express.Router();

const adminAuth = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Admin registration endpoint
router.post('/register', auth('admin'), async (req, res) => {
  const { email, firstName, lastName, role, birthDate, gradeLevel, section, studentId, subject } = req.body;
  const defaultPassword = 'School@123'; // Default password for all users

  try {
    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    // Create user
    const newUser = await pool.query(
      `INSERT INTO users (email, password, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role`,
      [email, hashedPassword, role, firstName, lastName]
    );
    
    // Handle role-specific data
    if (role === 'student') {
      const studentId = `STU-${Date.now()}`;
      
      await pool.query(
        `INSERT INTO students (id, student_id, birth_date, grade_level, section)
         VALUES ($1, $2, $3, $4, $5)`,
        [newUser.rows[0].id, studentId, birthDate, gradeLevel, section]
      );
    } 
    else if (role === 'teacher') {
      await pool.query(
        `INSERT INTO teachers (id, subject)
         VALUES ($1, $2)`,
        [newUser.rows[0].id, subject]
      );
    }
    else if (role === 'parent' && childStudentId) {
      await pool.query(
        `INSERT INTO parents (id) VALUES ($1)`,
        [newUser.rows[0].id]
      );

      // Link parent to child if student ID provided
      const child = await pool.query(
        `SELECT id FROM students WHERE id = $1`, 
        [studentId]
      );
      
      if (child.rows.length > 0) {
        await pool.query(
          `INSERT INTO student_parents (student_id, parent_id)
           VALUES ($1, $2)`,
          [child.rows[0].id, newUser.rows[0].id]
        );
      }
    }

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Bulk registration endpoint
router.post('/bulk-register', auth('admin'), async (req, res) => {
  const { users } = req.body;
  // const pool = await pool.connect();
  const defaultPassword = 'School@123';

    // await pool.query('BEGIN');
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    let successCount = 0;
    let existingUser = [];
    try {
    for (const user of users) {
      
          const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', [user.email]
    );
    
    if (userExists.rows.length > 0){
      // res.status(200).json({ message: 'User already exists' });
      existingUser.push(user);
      
    } else{

    if (user.role == 'student'){
      const newUser = await pool.query(
      `INSERT INTO users (email, password, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user.email, hashedPassword, user.role, user.firstName, user.lastName]
      );
      const studentId = `STU-${Date.now()}`;
      await pool.query(
       `INSERT INTO students (id, birth_date, student_id, grade_level, section)
        VALUES ($1, $2, $3, $4, $5)`,
        [newUser.rows[0].id, user.birthDate, studentId, user.gradeLevel, user.section]
          );

      } else if (user.role == 'teacher') {
          const newUser = await pool.query(
          `INSERT INTO users (email, password, role, first_name, last_name)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [user.email, hashedPassword, 'teacher', user.firstName, user.lastName]
            );
          await pool.query(
          `INSERT INTO teachers (id, subject)
           VALUES ($1, $2)`,
           [newUser.rows[0].id, user.subject]
          );
        } else if (user.role == 'parent') {
            const newUser = await pool.query(
              `INSERT INTO users (email, password, role, first_name, last_name)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [user.email, hashedPassword, 'parent', user.firstName, user.lastName]
            );

            await pool.query(
              `INSERT INTO parents (id) VALUES ($1)`,
              [newUser.rows[0].id]
            );

            if (user.studentId) {
              const child = await pool.query(
                `SELECT id FROM students WHERE student_id = $1`,
                [user.studentId]
              );
              if (child.rows.length > 0) {
                await pool.query(
                  `INSERT INTO student_parents (student_id, parent_id)
                   VALUES ($1, $2)`,
                  [child.rows[0].id, newUser.rows[0].id]
                );
              }
            }
          }
          successCount++;

      }}
      // } catch(err) {
      //   console.error(`Error registering user ${user.email}:`, err);
      // }
      await pool.query('COMMIT');
      res.json({ count: successCount,
        users: existingUser
       });
    }
     catch(error) {
    console.error('Bulk registration error:', error);
    await pool.query('ROLLBACK');
    res.status(500).json({ message: 'Bulk registration failed' });
  }
  // } finally {
  //   // await pool.release();
  // }
});

// Initialize Admin

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
      if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT *
       FROM users u
       WHERE LOWER(u.email) = LOWER($1)`, 
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }    
    // Create JWT token with user details
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Return user data with token
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };

    return res.status(201).json({
      token,
      user: userData
    });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
});


// Get current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      `SELECT u.*, 
              s.student_id, s.grade_level, s.section,
              t.subject,
              p.id AS parent_id
       FROM users u
       LEFT JOIN students s ON u.id = s.id
       LEFT JOIN teachers t ON u.id = t.id
       LEFT JOIN parents p ON u.id = p.id
       WHERE u.id = $1`, 
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      ...(user.role === 'student' && {
        studentId: user.student_id,
        gradeLevel: user.grade_level,
        section: user.section
      }),
      ...(user.role === 'teacher' && {
        subject: user.subject
      }),
      ...(user.role === 'parent' && {
        parentId: user.parent_id
      })
    };

    res.json(userData);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
