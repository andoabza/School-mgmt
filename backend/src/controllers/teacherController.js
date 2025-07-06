import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';


const teacherController = {
getTeacherClasses: async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const classes = await Teacher.getClassesByTeacher(teacher_id);
    console.log(classes);
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
    console.log(req.params.id);
    const teachers = await Teacher.getByClassId(req.params.id);
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
}
export default teacherController;