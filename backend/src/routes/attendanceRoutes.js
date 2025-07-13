import express from 'express';
const router = express.Router();
import attendanceController from '../controllers/attendanceController.js';

router.post('/', attendanceController.saveAttendance);
router.put('/:id', attendanceController.saveAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/history', attendanceController.getAttendanceHistory);
router.get('/student/:id', attendanceController.getStudentHistory);

export default router;