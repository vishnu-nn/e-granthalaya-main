// Book Routes
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const upload = require('../middleware/upload');

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/deleted/all', bookController.getDeletedBooks);
router.get('/:id', bookController.getBookById);
router.get('/department/:department', bookController.getBooksByDepartment);
router.get('/:id/download', bookController.downloadBook);

// Admin routes (auth handled client-side via localStorage)
router.post('/', upload.single('file'), bookController.addBook);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);
router.post('/:id/restore', bookController.restoreBook);

module.exports = router;
