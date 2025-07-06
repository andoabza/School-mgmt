import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';

const enrollmentController = {
enrollStudent: async (req, res) => {
  try {
    const { class_id, student_id } = req.body;
    const enrollment = await Enrollment.enrollStudent(class_id, student_id);
    res.status(201).json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},

removeEnrollment: async (req, res) => {
  try {
    const { class_id, student_id } = req.params;
    await Enrollment.removeEnrollment(class_id, student_id);
    res.json({ message: 'Enrollment removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},

getClassStudents: async (req, res) => {
  try {
    const { class_id } = req.params;
    const students = await Enrollment.getClassStudents(class_id);
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
},
getStudentEnrollments: async (req, res) => {
 try{
  const enrollments = await Enrollment.getStudentEnrollments(req.params.id);
  res.json(enrollments);
} catch (error)
{
  console.error(error);
    res.status(500).json({ message: 'Server error' });
 }},

}
export default enrollmentController;