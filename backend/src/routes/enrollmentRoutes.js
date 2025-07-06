import express from 'express';
const router = express.Router();
import enrollmentController from '../controllers/enrollmentController.js';

router.post('/', enrollmentController.enrollStudent);
router.delete('/:class_id/:student_id', enrollmentController.removeEnrollment);
router.get('/class/:class_id/students', enrollmentController.getClassStudents);
router.get('/:id', enrollmentController.getStudentEnrollments);

export default router;