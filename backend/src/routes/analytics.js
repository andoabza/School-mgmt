import express from 'express';
const router = express.Router();
import { pool } from '../config/db.js';
import auth from '../middleware/auth.js';
import { calculateGradeWithSettings, getLetterGrade } from '../services/gradeCalculator.js';

router.get('/class/:classId', auth(), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Get teacher settings
    const teacherId = req.user.id; // Assuming teacher is making the request
    const settingsResult = await pool.query(
      `SELECT * FROM teacher_settings WHERE teacher_id = $1`,
      [teacherId]
    );
    
    const settings = settingsResult.rows.length > 0 
      ? {
          gradingScale: settingsResult.rows[0].grading_scale,
          categoryWeights: settingsResult.rows[0].category_weights
        }
      : {
          gradingScale: { A: 90, B: 80, C: 70, D: 60, F: 0 },
          categoryWeights: { homework: 0.3, classwork: 0.2, assessment: 0.4, project: 0.1 }
        };
    
    // Get class grades
    const gradesResult = await pool.query(
      `SELECT g.*, u.first_name, u.last_name, s.student_id 
       FROM grades g 
       JOIN students s ON g.student_id = s.id 
       JOIN users u On s.id = u.id
       WHERE g.class_id = $1`,
      [classId]
    );
    
    // Calculate analytics using settings
    const analytics = calculateClassAnalytics(gradesResult.rows, settings);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function calculateClassAnalytics(grades, settings) {
  // Group grades by student
  const gradesByStudent = {};
  grades.forEach(grade => {
    if (!gradesByStudent[grade.student_id]) {
      gradesByStudent[grade.student_id] = [];
    }
    gradesByStudent[grade.student_id].push(grade);
  });
  
  // Calculate analytics for each student and overall
  const studentAnalytics = [];
  let classTotal = 0;
  let studentCount = 0;
  
  Object.entries(gradesByStudent).forEach(([studentId, studentGrades]) => {
    const average = calculateGradeWithSettings(studentGrades, settings);
    const letterGrade = getLetterGrade(average, settings.gradingScale);
    
    studentAnalytics.push({
      studentId,
      average,
      letterGrade,
      firstName: studentGrades[0].first_name,
      lastName: studentGrades[0].last_name,
      studentId: studentGrades[0].student_id
    });
    
    classTotal += average;
    studentCount++;
  });
  
  const classAverage = studentCount > 0 ? classTotal / studentCount : 0;
  
  // Calculate grade distribution
  const gradeDistribution = {
    A: 0, B: 0, C: 0, D: 0, F: 0
  };
  
  studentAnalytics.forEach(student => {
    gradeDistribution[student.letterGrade]++;
  });
  
  return {
    classAverage,
    gradeDistribution,
    studentAnalytics,
    settings // Include settings in response for reference
  };
}

export default router;