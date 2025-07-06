import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js'; // Adjust the import based on your project structure

/**
 * Verify JWT token and check user role
 * @param {Array} allowedRoles - Roles permitted to access the route
 */
const auth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // 1. Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L');
      
      // 3. Check if user still exists in database
      const userQuery = await pool.query(
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

      if (userQuery.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = userQuery.rows[0];

      // 4. Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // 5. Attach user to request
      req.user = {
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

      next();
    } catch (error) {
      //console.error('Authentication error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      res.status(401).json({ error: 'Authentication failed' });
    }
  };
};

export default auth;