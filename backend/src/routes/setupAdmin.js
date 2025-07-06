import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = express.Router();

// Middleware to disable this route in production after initial setup
const setupGuard = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.INITIAL_SETUP_COMPLETE === 'true') {
    return res.status(403).json({ 
      error: 'Initial setup already completed',
      code: 'SETUP_COMPLETE'
    });
  }
  next();
};

router.post('/setup-admin', setupGuard, async (req, res) => {
  const { setupKey, email, firstName, lastName, password } = req.body;
  const SECURE_KEY = process.env.ADMIN_SETUP_KEY || '$2b$12$2zEWVBTPAlAIxo/bxK796ecoHl1FG2wR657fqMWIMhpVeyfazbkJa';
 
  if (!SECURE_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // Validate inputs
  if (!setupKey || !email || !firstName || !lastName || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Verify setup key
  if (!await bcrypt.compare(setupKey, SECURE_KEY)) {
    return res.status(401).json({ error: 'Invalid setup key' });
  }

  try {
    // Check if admin already exists
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1', 
      ['admin']
    );
    
    if (rows.length > 0) {
      return res.status(409).json({ error: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin
    const { rows: [admin] } = await pool.query(
      `INSERT INTO users (email, password, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, first_name, last_name`,
      [email, hashedPassword, 'admin', firstName, lastName]
    );

    // Generate token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET || '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L',
      { expiresIn: '1h' }
    );

    // Mark setup complete in production
    if (process.env.NODE_ENV === 'production') {
      process.env.INITIAL_SETUP_COMPLETE = 'true';
    }

    return res.status(201).json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.first_name,
        lastName: admin.last_name
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

export default router;
