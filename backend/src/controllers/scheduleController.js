import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import Classroom from '../models/Classroom.js';

const scheduleController = {
  // Get all schedules
  getAllSchedules: async (req, res) => {
    try {
      const schedules = await Schedule.getAll();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new schedule
  createSchedule: async (req, res) => {
    const { class_id, classroom_id, day_of_week, start_time, end_time } = req.body;
    
    try {
      // Validate class exists
      const classExists = await Class.findById(class_id);
      if (!classExists) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Validate classroom exists
      const classroomExists = await Classroom.findById(classroom_id);
      if (!classroomExists) {
        return res.status(404).json({ error: 'Classroom not found' });
      }

      // Check for classroom conflicts
      const hasClassroomConflict = await Schedule.checkClassroomConflict({
        classroom_id, day_of_week, start_time, end_time
      });
      if (hasClassroomConflict) {
        return res.status(400).json({ error: 'Time conflict with existing schedule in this classroom' });
      }

      // Check teacher availability
      const hasTeacherConflict = await Schedule.checkTeacherConflict({
        class_id, day_of_week, start_time, end_time
      });
      if (hasTeacherConflict) {
        return res.status(400).json({ error: 'Teacher has a conflicting schedule' });
      }

      // Create schedule
      const newSchedule = await Schedule.create({
        class_id, classroom_id, day_of_week, start_time, end_time
      });
      
      res.status(201).json(newSchedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update schedule
  updateSchedule: async (req, res) => {
    const { id } = req.params;
    const { class_id, classroom_id, day_of_week, start_time, end_time } = req.body;

    try {
      // Check if schedule exists
      const existingSchedule = await Schedule.findById(id);
      if (!existingSchedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Validate class exists
      const classExists = await Class.findById(class_id);
      if (!classExists) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Validate classroom exists
      const classroomExists = await Classroom.findById(classroom_id);
      if (!classroomExists) {
        return res.status(404).json({ error: 'Classroom not found' });
      }

      // Check for classroom conflicts (excluding current schedule)
      const hasClassroomConflict = await Schedule.checkClassroomConflict({
        classroom_id, day_of_week, start_time, end_time, excludeId: id
      });
      if (hasClassroomConflict) {
        return res.status(400).json({ error: 'Time conflict with existing schedule in this classroom' });
      }

      // Check teacher availability (excluding current schedule)
      const hasTeacherConflict = await Schedule.checkTeacherConflict({
        class_id, day_of_week, start_time, end_time, excludeId: id
      });
      if (hasTeacherConflict) {
        return res.status(400).json({ error: 'Teacher has a conflicting schedule' });
      }

      // Update schedule
      const updatedSchedule = await Schedule.update(id, {
        class_id, classroom_id, day_of_week, start_time, end_time
      });
      
      res.json(updatedSchedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete schedule
  deleteSchedule: async (req, res) => {
    const { id } = req.params;
    
    try {
      const deletedSchedule = await Schedule.delete(id);
      if (!deletedSchedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default scheduleController;