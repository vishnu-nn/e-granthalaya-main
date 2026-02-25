// Borrow Routes
const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');

// Student routes
router.post('/', borrowController.borrowBook);
router.post('/return/:id', borrowController.returnBook);
router.get('/my-history', borrowController.getStudentRecords);
router.get('/my-active', borrowController.getStudentActiveRecords);

// Admin routes
router.get('/all', borrowController.getAllRecords);
router.get('/active', borrowController.getActiveRecords);
router.get('/student/:studentId', borrowController.getStudentRecords);

module.exports = router;
