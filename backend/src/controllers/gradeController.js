import Grade from'../models/Grade.js';


const gradeController = {
    createGrade: async (req, res) => {
        try {
            const grade = await Grade.create(req.body);
            res.status(201).json({
            success: true,
            data: grade
            });
        } catch (error) {
            res.status(400).json({
            success: false,
            message: error.message
            });
        }
    },

    // Get all grades for a class
    getClassGrades: async (req, res) => {
        try {
            const grades = await Grade.findByClassId(req.params.classId);
            res.status(200).json({
            success: true,
            data: grades
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message
            });
        }
    },

    // Get grades for a student
    getStudentGrades: async (req, res) => {
        try {
            const { studentId } = req.params;
            const { classId } = req.query;
            
            const grades = classId 
            ? await Grade.findByStudentId(studentId, classId)
            : await Grade.findByStudentId(studentId);
            
            res.status(200).json({
            success: true,
            data: grades
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message
            });
        }
    },

    // Update a grade
    updateGrade: async (req, res) => {
        try {
            const grade = await Grade.update(req.params.id, req.body);
            res.status(200).json({
            success: true,
            data: grade
            });
        } catch (error) {
            console.log(error, req.body);
            
            res.status(400).json({
            success: false,
            message: error.message
            });
        }
    },

    // Delete a grade
    deleteGrade: async (req, res) => {
        try {
            await Grade.delete(req.params.id);
            res.status(200).json({
            success: true,
            message: 'Grade deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message
            });
        }
    },

    // Get class average for an assignment
    getClassAverage: async (req, res) => {
        try {
            const { classId, assignmentName } = req.params;
            const average = await Grade.getClassAverage(classId, assignmentName);
            res.status(200).json({
            success: true,
            data: { average }
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message
            });
        }
    },

    // Get student average in a class
    getStudentAverage: async (req, res) => {
        try {
        const { studentId, classId } = req.params;
        const average = await Grade.getStudentAverage(studentId, classId);
        res.status(200).json({
            success: true,
            data: { average }
        });
        } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
        }},
        // Get class analytics
    getClassAnalytics: async (req, res) => {
        try {
            const { classId } = req.params;
            const analytics = await Grade.getClassAnalytics(classId);
            res.status(200).json({
            success: true,
            data: analytics
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message
            });
        }
        },

    // Get student analytics
    getStudentAnalytics: async (req, res) => {
        try {
            const { studentId } = req.params;
            const analytics = await Grade.getStudentAnalytics(studentId);
            res.status(200).json({
            success: true,
            data: analytics
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message
            });
        }
        },

    // Get grade distribution for a class
    getGradeDistribution: async (req, res) => {
        try {
            const { classId } = req.params;
            const distribution = await Grade.getGradeDistribution(classId);
            res.status(200).json({
            success: true,
            data: distribution
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message
            });
        }
        }

}

export default gradeController;