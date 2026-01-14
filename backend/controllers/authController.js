// Authentication Controller
const Student = require('../models/Student');
const { hashPassword } = require('../config/database');

// Admin login
exports.adminLogin = async (req, res) => {
    try {
        const { password } = req.body;

        // Get admin from database
        const db = require('../config/database');
        const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get('admin');

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }

        // Verify password (using crypto hash)
        const hashedInput = hashPassword(password);
        const isValid = hashedInput === admin.password;

        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Set session
        req.session.user = {
            type: 'admin',
            username: admin.username
        };

        res.json({ success: true, message: 'Admin logged in successfully' });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Student registration
exports.studentRegister = async (req, res) => {
    try {
        const { studentId, name, email, password, department } = req.body;

        // Check if student already exists
        const existing = Student.findByStudentId(studentId);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Student ID already registered' });
        }

        const existingEmail = Student.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Create student
        await Student.create({ studentId, name, email, password, department });

        res.json({ success: true, message: 'Student registered successfully' });
    } catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Student login
exports.studentLogin = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        // Get student
        const student = Student.findByStudentId(studentId);
        if (!student) {
            return res.status(401).json({ success: false, message: 'Invalid student ID or password' });
        }

        // Verify password
        const isValid = await Student.verifyPassword(studentId, password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid student ID or password' });
        }

        // Update last login
        Student.updateLastLogin(studentId);

        // Set session
        req.session.user = {
            type: 'student',
            studentId: student.student_id,
            name: student.name,
            email: student.email,
            department: student.department
        };

        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
};

// Check session
exports.checkSession = (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false });
    }
};
