import express from 'express';
const router = express.Router();
import attendanceController from '../controllers/attendanceController.js';
import auth from '../middleware/auth.js';

// Teacher/Admin routes
router.post('/', 
  auth(['teacher', 'admin']), 
  attendanceController.saveAttendance
);
router.put('/:id', 
  auth(['teacher', 'admin']), 
  attendanceController.saveAttendance
);

// General access routes
router.get('/', attendanceController.getAttendance);
router.get('/monthly', attendanceController.getMonthlyAttendance);
router.get('/export', attendanceController.exportAttendance);
router.get('/class/:classId/students', 
  attendanceController.getClassStudents
);

export default router;
