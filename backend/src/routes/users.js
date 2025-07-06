import express from 'express';
import { pool } from '../config/db.js';
import auth from '../middleware/auth.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Get all users (admin only)
// router.get('/', auth(['admin', 'teacher', 'student']), async (req, res) => {
//   const role = req.query.role;

//   try {
//     if (role && role == 'student'){
//       console.log(role);
//     const { rows } = await pool.query(`
//       SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
//              s.student_id, s.grade_level, s.section
//       FROM users u
//       LEFT JOIN students s ON u.id = s.id
//       WHERE u.role = 'student'
//       ORDER BY u.role, u.last_name
//     `);  
//     }
//     const { rows } = await pool.query(`
//       SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
//              s.student_id, s.grade_level, s.section
//       FROM users u
//       LEFT JOIN students s ON u.id = s.id
//       ORDER BY u.role, u.last_name
//     `);
//     res.json(rows);
//   } catch (err) {
//     console.log(err);
    
//     res.status(500).send('Server error');
//   }
// });


router.get('/', auth(['admin', 'teacher', 'student']), async (req, res) => {
  try {
    const requesterRole = req.user.role;
    const requesterId = req.user.id;
    const roleFilter = req.query.role;

    if (requesterRole === 'student') {
      // Students can only view their own data
      const { rows } = await pool.query(`
        SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
               s.student_id, s.grade_level, s.section
        FROM users u
        LEFT JOIN students s ON u.id = s.id
        WHERE u.id = $1
      `, [requesterId]);
      return res.json(rows);
    }

    // Admin/teacher path with optional role filtering
    let query = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, 
             s.student_id, s.grade_level, s.section
      FROM users u
      LEFT JOIN students s ON u.id = s.id
      WHERE u.role IN ('admin', 'teacher', 'student')
    `;
    const params = [];

    // Add role filter if valid and provided
    if (roleFilter && ['admin', 'teacher', 'student'].includes(roleFilter)) {
      query += ` AND u.role = $${params.length + 1}`;
      params.push(roleFilter);
    }

    query += ' ORDER BY u.role, u.last_name';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user role
router.patch('/:id/role', auth('admin'), async (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin', 'teacher', 'student', 'parent'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, req.params.id]
    );
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/reset-password', auth(['admin', 'user']), async (req, res) => {
  const { currentPassword, newPassword, id } = req.body;
  const defaultPassword = 'School@123';
  
  try {
    // 1. Verify current password
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (currentPassword){
    const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
  }

    // 2. Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword || defaultPassword, saltRounds);

    // 3. Update password
  
    // Reset password to default
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [
      hashedPassword,
      id
    ]);    
  
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// delete user
// router.delete('/:i', auth('admin'), async(req, res) => {
//   const { users } = req.body;

//   try{
//     const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
//     if (!user){
//       return res.status(403).json({error: 'User Not Found!'});
//     }
//     await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
//     res.json({ message: 'User Deleted successfully' });
//   }
//    catch (error) {
//     console.error('Delete User error:', error);
//     res.status(500).json({ error: 'Delete User failed' });
//   }
// });

router.delete('/:id', auth('admin'), async(req, res) => {
  const id = req.params.id; // Get user IDs from request body
  
  if (!id || id.length === 0) {
    return res.status(400).json({ message: 'No users provided for deletion' });
  }

  try {
    // First check if all users exist
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (!userCheck) {
      res.json({ message: 'user not found' });
    }

    // Delete from dependent tables first
    await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    await pool.query('DELETE FROM parents WHERE id = $1', [id]);
    await pool.query('DELETE FROM student_parents WHERE student_id = $1 OR parent_id = $1', [id]);
    await pool.query('DELETE FROM classes WHERE teacher_id = $1', [id]);


    // Then delete the users
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    await pool.query('COMMIT'); // Commit transaction
    
    res.status(200).json({ 
      message: 'Users deleted successfully',
    });
  } catch (error) {
    await pool.query('ROLLBACK'); // Rollback on error
    console.error('Delete Users error:', error);
    res.status(500).json({ 
      message: 'Delete Users failed',
      detail: error.message 
    });
  } 
});

// router.delete('/', auth('admin'), async (req, res) => {
//   const { users } = req.body; // users should be an array of user IDs
//   console.log(users);

//   if (!Array.isArray(users) || users.length === 0) {
//     return res.status(400).json({ message: 'No users provided for deletion' });
//   }

//   // const pool = await pool.connect();
//   try {
//     await pool.query('BEGIN');
//     for (const userId of users) {
//       // Delete from dependent tables first
//       await pool.query('DELETE FROM teachers WHERE id = $1', [userId]);
//       await pool.query('DELETE FROM students WHERE id = $1', [userId]);
//       await pool.query('DELETE FROM parents WHERE id = $1', [userId]);
//       await pool.query('DELETE FROM student_parents WHERE id = $1', [userId]);
//       await pool.query('DELETE FROM classes WHERE id = $1', [userId]);
//       // Then delete the user
//       await pool.query('DELETE FROM users WHERE id = $1', [userId]);
//     }
//     await pool.query('COMMIT');
//     res.json({ message: 'Users deleted successfully' });
//   } catch (error) {
//     await pool.query('ROLLBACK');
//     console.error('Delete Users error:', error);
//     res.status(500).json({
//       message: 'Delete Users failed',
//       detail: error.message
//     });
//   }
//   // } finally {
//   //   return;
//   //   // pool.release();
//   // }
// });


// Protected route (any authenticated user)
router.get('/profile', auth(), (req, res) => {
  res.json(req.user);
});

// Admin-only route
router.get('/admin', auth(['admin']), (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

// Teacher or admin route
router.get('/teacher', auth(['teacher', 'admin']), (req, res) => {
  res.json({ message: 'Teacher resource' });
});

export default router;
