// Borrow Routes
const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { requireAuth, requireAdmin, requireStudent } = require('../middleware/auth');

// Student routes
router.post('/', requireStudent, borrowController.borrowBook);
router.post('/return/:id', requireStudent, borrowController.returnBook);
router.get('/my-history', requireStudent, borrowController.getStudentRecords);
router.get('/my-active', requireStudent, borrowController.getStudentActiveRecords);

// Admin routes
router.get('/all', requireAdmin, borrowController.getAllRecords);
router.get('/active', requireAdmin, borrowController.getActiveRecords);
router.get('/student/:studentId', requireAdmin, borrowController.getStudentRecords);

module.exports = router;
