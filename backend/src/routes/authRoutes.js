import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = express.Router();

/**
 * Secure initial admin setup endpoint
 */
router.post('/', async (req, res) => {
  // Configuration
  const SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'your-secret-key';
  const MIN_PASSWORD_LENGTH = 12;
  const SALT_ROUNDS = 12;
  const TOKEN_EXPIRY = '1h';

  // Validate setup key exists
  if (!SETUP_KEY) {
    console.error('ADMIN_SETUP_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Destructure and validate input
  const { setupKey, email, firstName, lastName, password } = req.body;

  if (!setupKey || !email || !firstName || !lastName || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['setupKey', 'email', 'firstName', 'lastName', 'password']
    });
  }

  // Secure setup key validation
  if (!bcrypt.compareSync(setupKey, SETUP_KEY)) {
    return res.status(401).json({ error: 'Invalid setup key' });
  }

  // Enhanced password validation
  const passwordErrors = [];
  if (password.length < MIN_PASSWORD_LENGTH) {
    passwordErrors.push(`Minimum ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    passwordErrors.push('At least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    passwordErrors.push('At least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    passwordErrors.push('At least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    passwordErrors.push('At least one special character');
  }

  if (passwordErrors.length > 0) {
    return res.status(400).json({
      error: 'Password does not meet requirements',
      requirements: passwordErrors
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check for existing admin
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1 FOR UPDATE',
      ['admin']
    );

    if (adminCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Admin user already exists',
        code: 'ADMIN_EXISTS'
      });
    }

    // Check for email uniqueness
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1 FOR UPDATE',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Email already in use',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password with async version
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create admin with transaction
    const newAdmin = await client.query(
      `INSERT INTO users (
        email, password, role, 
        first_name, last_name, 
        is_verified, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, role, first_name, last_name, is_verified`,
      [email, hashedPassword, 'admin', firstName, lastName, true]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newAdmin.rows[0].id,
        email: email,
        role: 'admin',
        firstName: firstName,
        lastName: lastName
      },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    await client.query('COMMIT');

    // Secure cookie settings for production
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 3600000 // 1 hour
    };

    res
      .status(201)
      .cookie('auth_token', token, cookieOptions)
      .json({
        user: {
          id: newAdmin.rows[0].id,
          email: newAdmin.rows[0].email,
          role: newAdmin.rows[0].role,
          firstName: newAdmin.rows[0].first_name,
          lastName: newAdmin.rows[0].last_name,
          isVerified: newAdmin.rows[0].is_verified
        }
      });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin setup transaction failed:', error);
    
    const errorResponse = {
      error: 'Admin setup failed',
      code: 'SETUP_FAILED'
    };

    // Differentiate between unique constraint violations
    if (error.code === '23505') {
      errorResponse.details = 'Database constraint violation';
      errorResponse.field = error.constraint.includes('email') ? 'email' : 'unknown';
    }

    res.status(500).json(errorResponse);
  } finally {
    client.release();
  }
});

// Middleware to disable this route in production after setup
const setupGuard = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ADMIN_EXISTS === 'true') {
    return res.status(403).json({ 
      error: 'Initial setup already completed',
      code: 'SETUP_COMPLETE'
    });
  }
  next();
};

// Apply guard middleware
router.use('/setup-admin', setupGuard);

export default router;
