import Teacher from '../models/Teacher.js';
import UserModel from '../models/User.js';
import jwt from 'jsonwebtoken';

const teacherController = {
getTeacherClasses: async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const classes = await Teacher.getClassesByTeacher(teacher_id);
    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}, 

getAll: async (req, res) => {
  try {
    const teachers = await Teacher.getAll();
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},
getByClassId: async (req, res) => {
  try {
    const teachers = await Teacher.getByClassId(req.params.id);
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},
getSetting: async (req, res) => {
  try {
    const { teacherId } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    const user = await UserModel.getById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }    
    
    // Verify the requesting user has access to these settings
    if (user.id !== parseInt(teacherId) && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await Teacher.getSetting(teacherId);
    
    const settings = result;
    
    res.json({
      gradingScale: settings.grading_scale || 0,
      categoryWeights: settings.category_weights || 0
    });
  } catch (error) {
    console.error('Error fetching teacher settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
},

// Update teacher settings
setSetting: async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { gradingScale, categoryWeights } = req.body;
    
    // Verify the requesting user has access to these settings
    if (req.user.id !== parseInt(teacherId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Validate input
    if (!gradingScale || !categoryWeights) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if settings already exist
    const result = await Teacher.setSetting(teacherId, gradingScale, categoryWeights);
    
    res.json({
      gradingScale: result.rows[0].grading_scale,
      categoryWeights: result.rows[0].category_weights
    });
  } catch (error) {
    console.error('Error updating teacher settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
}


}
export default teacherController;