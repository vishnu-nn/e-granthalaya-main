// Authentication Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Admin login
router.post('/admin/login', authController.adminLogin);

// Student registration
router.post('/student/register', authController.studentRegister);

// Student login
router.post('/student/login', authController.studentLogin);

// Logout
router.post('/logout', authController.logout);

// Check session
router.get('/check', authController.checkSession);

module.exports = router;
