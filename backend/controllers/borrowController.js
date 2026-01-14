// Borrow Controller
const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const Student = require('../models/Student');

// Borrow a book
exports.borrowBook = (req, res) => {
    try {
        const { bookId } = req.body;
        const studentId = req.session.user.studentId;

        // Check if book exists
        const book = Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // Check if book is already borrowed
        if (BorrowRecord.isBookBorrowed(bookId)) {
            return res.status(400).json({ success: false, message: 'Book is already borrowed' });
        }

        // Get student details
        const student = Student.findByStudentId(studentId);

        // Calculate dates
        const borrowDate = new Date().toISOString();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // 15 days borrowing period

        // Create borrow record
        const borrowData = {
            bookId: book.id,
            studentId: student.student_id,
            bookTitle: book.title,
            bookDepartment: book.department,
            studentName: student.name,
            studentEmail: student.email,
            studentDepartment: student.department,
            borrowDate: borrowDate,
            dueDate: dueDate.toISOString()
        };

        const recordId = BorrowRecord.create(borrowData);

        res.json({
            success: true,
            recordId,
            dueDate: dueDate.toISOString(),
            message: 'Book borrowed successfully'
        });
    } catch (error) {
        console.error('Borrow book error:', error);
        res.status(500).json({ success: false, message: 'Server error ' });
    }
};

// Return a book
exports.returnBook = (req, res) => {
    try {
        const recordId = req.params.id;

        const record = BorrowRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Borrow record not found' });
        }

        if (record.status === 'returned') {
            return res.status(400).json({ success: false, message: 'Book already returned' });
        }

        BorrowRecord.returnBook(recordId);

        res.json({ success: true, message: 'Book returned successfully' });
    } catch (error) {
        console.error('Return book error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all borrowing records (admin only)
exports.getAllRecords = (req, res) => {
    try {
        const records = BorrowRecord.findAll();
        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get active borrowings (admin only)
exports.getActiveRecords = (req, res) => {
    try {
        const records = BorrowRecord.findActive();
        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Get active records error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get student's borrowing history
exports.getStudentRecords = (req, res) => {
    try {
        const studentId = req.params.studentId || req.session.user.studentId;
        const records = BorrowRecord.findByStudentId(studentId);
        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Get student records error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get student's active borrowings
exports.getStudentActiveRecords = (req, res) => {
    try {
        const studentId = req.session.user.studentId;
        const records = BorrowRecord.findActiveByStudentId(studentId);
        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Get student active records error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
