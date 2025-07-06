import express from 'express';
const router = express.Router();
import teacherController from '../controllers/teacherController.js';

router.get('/:teacher_id/classes', teacherController.getTeacherClasses);
router.get('/', teacherController.getAll);
router.get('/:id', teacherController.getByClassId);

export default router;