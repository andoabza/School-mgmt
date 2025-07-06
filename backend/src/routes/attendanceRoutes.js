import express from 'express';
const router = express.Router();
import attendanceController from '../controllers/attendanceController.js';

router.post('/', attendanceController.saveAttendance);
router.get('/', attendanceController.getAttendance);
router.get('/history', attendanceController.getAttendanceHistory);

export default router;