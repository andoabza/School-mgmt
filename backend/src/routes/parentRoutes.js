import express from 'express';
const router = express.Router();
import ParentController from '../controllers/ParentController.js';
import auth from '../middleware/auth.js';

// Link parent to child
router.post('/:parentId/add-child', auth('parent'), ParentController.linkParentChild);

// Get children for a parent
router.get('/:parentId/children', auth('parent'), ParentController.getChildren);

// Get grades for a child
router.get('/child/:childId/grades', auth('parent'), ParentController.getChildGrades);

// Get attendance for a child
router.get('/child/:childId/attendance', auth('parent'), ParentController.getChildAttendance);

export default router;