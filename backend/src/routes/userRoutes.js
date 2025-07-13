import express from 'express';
import auth from '../middleware/auth.js';
import UserController from '../controllers/userController.js';

const router = express.Router();

// Admin registration endpoint
router.post('/register', auth(['admin']), UserController.register);

// Bulk registration endpoint
router.post('/bulk-register', auth(['admin']), UserController.bulkRegister);

// User login
router.post('/login', UserController.login);

// Get current user
router.get('/me', UserController.getCurrentUser);

// Get all users
router.get('/', auth(['admin', 'teacher', 'student']), UserController.getAllUsers);

// Update user role
router.patch('/:id/role', auth(['admin']), UserController.updateRole);

// Reset password
router.post('/reset-password', auth(['admin', 'user']), UserController.resetPassword);

// Delete user
router.delete('/:id', auth(['admin']), UserController.deleteUser);


// Protected route (any authenticated user)
router.get('/profile', auth(), UserController.getProfile);

// Admin-only route
router.get('/admin', auth(['admin']), UserController.adminDashboard);

// Teacher or admin route
router.get('/teacher', auth(['teacher', 'admin']), UserController.teacherResource);

export default router;