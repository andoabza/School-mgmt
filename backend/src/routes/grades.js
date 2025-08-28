import express from 'express';
import gradeController from '../controllers/gradeController.js';
import auth from '../middleware/auth.js';
const router = express.Router();

// All routes require authentication
router.use(auth);

// Create a new grade (teachers and admins only)
router.post('/', auth(['teacher', 'admin']), gradeController.createGrade);

// Get all grades for a class (teachers and admins only)
router.get('/class/:classId', auth(['teacher', 'admin']), gradeController.getClassGrades);

// Get grades for a student (students, parents of that student, teachers, and admins)
router.get('/student/:studentId', gradeController.getStudentGrades);

// Update a grade (teachers and admins only)
router.put('/:id', auth(['teacher', 'admin']), gradeController.updateGrade);

// Delete a grade (admins only)
router.delete('/:id', auth(['admin']), gradeController.deleteGrade);

// Get class average for an assignment
router.get('/class/:classId/average/:assignmentName', gradeController.getClassAverage);

// Get student average in a class
router.get('/student/:studentId/average/:classId', gradeController.getStudentAverage);

// Get class analytics
router.get('/analytics/class/:classId', gradeController.getClassAnalytics);

// Get student analytics
router.get('/analytics/student/:studentId', gradeController.getStudentAnalytics);

// Get grade distribution for a class
router.get('/distribution/class/:classId', gradeController.getGradeDistribution);

export default router;