import express from 'express';
import auth from '../middleware/auth.js';
import Classroom from '../models/Classroom.js'

const router = express.Router();

// Get all classrooms
router.get('/', async (req, res) => {
  try {
    const classrooms = await Classroom.findAll();
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new classroom (admin only)
router.post('/', auth('admin'), async (req, res) => {
  try {
    const newClassroom = await Classroom.create(req.body);
    
    res.status(201).json(newClassroom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update classroom (admin only)
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const updatedClassroom = await Classroom.update(req.params.id, req.body);
    if (!updatedClassroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    res.json(updatedClassroom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete classroom (admin only)
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    await Classroom.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
