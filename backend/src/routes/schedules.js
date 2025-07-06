import express from 'express';
import scheduleController from '../controllers/scheduleController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all schedules
router.get('/', scheduleController.getAllSchedules);

// Create new schedule (admin/teacher only)
router.post('/', auth(['admin', 'teacher']), scheduleController.createSchedule);

// Update schedule (admin/teacher only)
router.patch('/:id', auth(['admin', 'teacher']), scheduleController.updateSchedule);

// Delete schedule (admin/teacher only)
router.delete('/:id', auth(['admin', 'teacher']), scheduleController.deleteSchedule);

export default router;