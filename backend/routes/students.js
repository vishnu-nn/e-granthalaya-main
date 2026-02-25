// Student Routes
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Admin routes
router.get('/', studentController.getAllStudents);
router.get('/me/profile', studentController.getCurrentStudent);
router.get('/:id', studentController.getStudentById);

module.exports = router;
