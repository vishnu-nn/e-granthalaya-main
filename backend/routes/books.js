// Book Routes
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (authenticated users)
router.get('/', requireAuth, bookController.getAllBooks);
router.get('/:id', requireAuth, bookController.getBookById);
router.get('/department/:department', requireAuth, bookController.getBooksByDepartment);
router.get('/:id/download', requireAuth, bookController.downloadBook);

// Admin-only routes
router.post('/', requireAdmin, upload.single('file'), bookController.addBook);
router.put('/:id', requireAdmin, bookController.updateBook);
router.delete('/:id', requireAdmin, bookController.deleteBook);
router.get('/deleted/all', requireAdmin, bookController.getDeletedBooks);
router.post('/:id/restore', requireAdmin, bookController.restoreBook);

module.exports = router;
