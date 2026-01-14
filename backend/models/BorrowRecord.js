// BorrowRecord Model - Database operations for borrowing
const db = require('../config/database');

class BorrowRecord {
    // Get all borrowing records
    static findAll() {
        return db.prepare('SELECT * FROM borrowing_history ORDER BY borrow_date DESC').all();
    }

    // Get active borrowings
    static findActive() {
        return db.prepare('SELECT * FROM borrowing_history WHERE status = \'active\' ORDER BY borrow_date DESC').all();
    }

    // Get student's borrowing history
    static findByStudentId(studentId) {
        return db.prepare('SELECT * FROM borrowing_history WHERE student_id = ? ORDER BY borrow_date DESC').all(studentId);
    }

    // Get student's active borr owings
    static findActiveByStudentId(studentId) {
        return db.prepare('SELECT * FROM borrowing_history WHERE student_id = ? AND status = \'active\'').all(studentId);
    }

    // Check if book is borrowed
    static isBookBorrowed(bookId) {
        const record = db.prepare('SELECT * FROM borrowing_history WHERE book_id = ? AND status = \'active\'').get(bookId);
        return record !== undefined;
    }

    // Get who borrowed the book
    static getBookBorrower(bookId) {
        return db.prepare('SELECT * FROM borrowing_history WHERE book_id = ? AND status = \'active\'').get(bookId);
    }

    // Create borrow record
    static create(borrowData) {
        const stmt = db.prepare(`
            INSERT INTO borrowing_history (
                book_id, student_id, book_title, book_department,
                student_name, student_email, student_department,
                borrow_date, due_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `);

        const result = stmt.run(
            borrowData.bookId,
            borrowData.studentId,
            borrowData.bookTitle,
            borrowData.bookDepartment,
            borrowData.studentName,
            borrowData.studentEmail,
            borrowData.studentDepartment,
            borrowData.borrowDate,
            borrowData.dueDate
        );

        return result.lastInsertRowid;
    }

    // Return book
    static returnBook(recordId) {
        const stmt = db.prepare(`
            UPDATE borrowing_history 
            SET status = 'returned', return_date = datetime('now')
            WHERE id = ?
        `);

        return stmt.run(recordId);
    }

    // Get record by ID
    static findById(id) {
        return db.prepare('SELECT * FROM borrowing_history WHERE id = ?').get(id);
    }
}

module.exports = BorrowRecord;
