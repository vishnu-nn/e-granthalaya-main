// Book Controller
const Book = require('../models/Book');
const path = require('path');
const fs = require('fs');

// Get all books
exports.getAllBooks = (req, res) => {
    try {
        const books = Book.findAll();
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get book by ID
exports.getBookById = (req, res) => {
    try {
        const book = Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }
        res.json({ success: true, data: book });
    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get books by department
exports.getBooksByDepartment = (req, res) => {
    try {
        const books = Book.findByDepartment(req.params.department);
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('Get books by department error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add new book
exports.addBook = (req, res) => {
    try {
        const { title, author, department, description, image } = req.body;
        const file = req.file;

        if (!title || !author || !department) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const bookData = {
            title,
            author,
            department,
            description,
            image,
            file_path: file ? file.path : null,
            file_name: file ? file.originalname : null,
            file_size: file ? file.size : null
        };

        const bookId = Book.create(bookData);

        res.json({ success: true, bookId, message: 'Book added successfully' });
    } catch (error) {
        console.error('Add book error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update book
exports.updateBook = (req, res) => {
    try {
        const { title, author, department, description, image } = req.body;

        Book.update(req.params.id, { title, author, department, description, image });

        res.json({ success: true, message: 'Book updated successfully' });
    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete book (soft delete)
exports.deleteBook = (req, res) => {
    try {
        const book = Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // Check if book is borrowed
        if (Book.isBorrowed(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Cannot delete borrowed book' });
        }

        Book.delete(req.params.id);

        res.json({ success: true, message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get deleted books
exports.getDeletedBooks = (req, res) => {
    try {
        const books = Book.findDeleted();
        res.json({ success: true, data: books });
    } catch (error) {
        console.error('Get deleted books error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Restore deleted book
exports.restoreBook = (req, res) => {
    try {
        Book.restore(req.params.id);
        res.json({ success: true, message: 'Book restored successfully' });
    } catch (error) {
        console.error('Restore book error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Download book PDF
exports.downloadBook = (req, res) => {
    try {
        const book = Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        if (!book.file_path || !fs.existsSync(book.file_path)) {
            return res.status(404).json({ success: false, message: 'PDF file not found' });
        }

        res.sendFile(path.resolve(book.file_path));
    } catch (error) {
        console.error('Download book error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
