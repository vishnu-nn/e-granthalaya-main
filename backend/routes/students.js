// Student Routes
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireAdmin, requireStudent } = require('../middleware/auth');

// Admin routes
router.get('/', requireAdmin, studentController.getAllStudents);
router.get('/:id', requireAdmin, studentController.getStudentById);

// Student routes
router.get('/me/profile', requireStudent, studentController.getCurrentStudent);

module.exports = router;
