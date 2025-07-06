import express from 'express';
import ClassController from '../controllers/classController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all classes
router.get('/', ClassController.getAllClasses);

// Create new class (admin only)
router.post('/', auth('admin'), ClassController.createClass);

// Update class (admin only)
router.put('/:id', auth('admin'), ClassController.updateClass);

// Delete class (admin only)
router.delete('/:id', auth('admin'), ClassController.deleteClass);
// Assign teacher to class for a subject
router.post('/:classId/teachers', auth('admin'), ClassController.assignTeacher);

// Unassign teacher from class for a subject
router.delete('/:classId/teachers/:teacherId/:subject', auth('admin'), ClassController.unassignTeacher);

// Get all teachers for a class
router.get('/:classId/teachers', auth(['admin', 'teacher']), ClassController.getClassTeachers);

// Update all teachers for a class (bulk update)
router.put('/:classId/teachers', auth('admin'), ClassController.updateClassTeachers);

export default router;