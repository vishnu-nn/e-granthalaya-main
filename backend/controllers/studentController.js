// Student Controller (Admin operations)
const Student = require('../models/Student');

// Get all students
exports.getAllStudents = (req, res) => {
    try {
        const students = Student.findAll();
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get student by ID
exports.getStudentById = (req, res) => {
    try {
        const student = Student.findByStudentId(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get statistics
        const stats = Student.getStats(student.student_id);

        res.json({ success: true, data: { ...student, stats } });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get current student's info
exports.getCurrentStudent = (req, res) => {
    try {
        const studentId = req.session.user.studentId;
        const student = Student.findByStudentId(studentId);
        const stats = Student.getStats(studentId);

        res.json({ success: true, data: { ...student, stats } });
    } catch (error) {
        console.error('Get current student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
