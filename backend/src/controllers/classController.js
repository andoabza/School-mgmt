import Class from '../models/Class.js';
import ClassTeacher from '../models/ClassTeacher.js';
import UserModel from'../models/User.js';
import { pool } from '../config/db.js';



class ClassController {
  // Get all classes
  static async getAllClasses(req, res) {
    try {
      const classes = await Class.findAll();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new class
  static async createClass(req, res) {
    try {
      const { name, subject, teacher_id, grade_level } = req.body;
      
      // Validate required fields
      if (!name || !subject || !grade_level) {
        return res.status(400).json({ error: 'Name, subject, and grade level are required' });
      }
      
      const newClass = await Class.create({ 
        name, 
        subject, 
        teacher_id: teacher_id || null, 
        grade_level 
      });
      
      res.status(201).json(newClass);
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Update a class
  static async updateClass(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Validate at least one field to update
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No update fields provided' });
      }
      
      const updatedClass = await Class.update(id, updates);
      res.json(updatedClass);
    } catch (error) {
      console.error('Error updating class:', error);
      
      if (error.message === 'Class not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(400).json({ error: error.message });
    }
  }

  // Delete a class
  static async deleteClass(req, res) {
    try {
      const { id } = req.params;
      await Class.delete(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting class:', error);
      
      if (error.message === 'Class not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }


  // Assign teacher to class for a subject
  static async assignTeacher(req, res) {
    const { classId } = req.params;
    const { teacherId, subject } = req.body;
    
    try {
      // Validate teacher exists and is a teacher
      const teacher = await UserModel.getById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ error: 'Invalid teacher ID' });
      }

      // Assign teacher to class for the subject
      const assignment = await ClassTeacher.assign(classId, teacherId, subject);
      res.status(201).json(assignment);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({ error: 'Teacher already assigned to this subject' });
      } else {
        res.status(500).json({ error: 'Failed to assign teacher' });
      }
    }
  }

  // Unassign teacher from class for a subject
  static async unassignTeacher(req, res) {
    const { classId, teacherId, subject } = req.params;
    
    try {
      const result = await ClassTeacher.unassign(classId, teacherId, subject);
      if (!result) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to unassign teacher' });
    }
  }

  // Get all teachers for a class
  static async getClassTeachers(req, res) {
    const { classId } = req.params;
    
    try {
      const teachers = await ClassTeacher.getByClass(classId);
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch teachers' });
    }
  }

  // Update class with multiple teachers
  static async updateClassTeachers(req, res) {
  const { classId } = req.params;
  const { teachers } = req.body;
  
  try {
    // Validate all teachers
    for (const teacher of teachers) {
      const teacherData = await UserModel.getById(teacher.teacherId);
      if (!teacherData || teacherData.role !== 'teacher') {
        return res.status(400).json({ error: `Invalid teacher ID: ${teacher.teacherId}` });
      }
    }

    // Start transaction
    await pool.query('BEGIN');

    // Get existing assignments
    const existingAssignments = await ClassTeacher.getByClass(classId);
    
    // Identify assignments to remove
    const assignmentsToRemove = existingAssignments.filter(existing => 
      !teachers.some(t => 
        t.teacherId === existing.teacher_id && t.subject === existing.subject
      )
    );
    
    // Remove obsolete assignments
    for (const assignment of assignmentsToRemove) {
      await ClassTeacher.unassign(
        classId, 
        assignment.teacher_id, 
        assignment.subject
      );
    }
    
    // Add new assignments (only non-existing ones)
    const assignments = [];
    for (const teacher of teachers) {
      // Skip if assignment already exists
      const exists = existingAssignments.some(a => 
        a.teacher_id === teacher.teacherId && a.subject === teacher.subject
      );
      
      if (!exists) {
        try {
          const assignment = await ClassTeacher.assign(
            classId, 
            teacher.teacherId, 
            teacher.subject
          );
          assignments.push(assignment);
        } catch (error) {
          // Handle unique constraint violation gracefully
          if (error.code !== '23505') throw error;
        }
      }
    }
    
    await pool.query('COMMIT');
    res.json({
      added: assignments,
      removed: assignmentsToRemove.length
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ 
      error: 'Failed to update class teachers',
      details: error.message 
    });
  }
}
}

export default ClassController;