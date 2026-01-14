// Book Model - Database operations for books
const db = require('../config/database');

class Book {
    // Get all books (excluding deleted)
    static findAll() {
        return db.prepare('SELECT * FROM books WHERE deleted = 0 ORDER BY added_at DESC').all();
    }

    // Get book by ID
    static findById(id) {
        return db.prepare('SELECT * FROM books WHERE id = ? AND deleted = 0').get(id);
    }

    // Get books by department
    static findByDepartment(department) {
        return db.prepare('SELECT * FROM books WHERE department = ? AND deleted = 0').all(department);
    }

    // Create new book
    static create(bookData) {
        const stmt = db.prepare(`
            INSERT INTO books (title, author, department, image, description, file_path, file_name, file_size, added_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            bookData.title,
            bookData.author,
            bookData.department,
            bookData.image || null,
            bookData.description || null,
            bookData.file_path || null,
            bookData.file_name || null,
            bookData.file_size || null,
            bookData.added_by || 'admin'
        );

        return result.lastInsertRowid;
    }

    // Update book
    static update(id, bookData) {
        const stmt = db.prepare(`
            UPDATE books 
            SET title = ?, author = ?, department = ?, image = ?, description = ?
            WHERE id = ?
        `);

        return stmt.run(
            bookData.title,
            bookData.author,
            bookData.department,
            bookData.image || null,
            bookData.description || null,
            id
        );
    }

    // Soft delete book
    static delete(id) {
        const stmt = db.prepare(`
            UPDATE books 
            SET deleted = 1, deleted_at = datetime('now')
            WHERE id = ?
        `);

        return stmt.run(id);
    }

    // Get deleted books
    static findDeleted() {
        return db.prepare('SELECT * FROM books WHERE deleted = 1 ORDER BY deleted_at DESC').all();
    }

    // Restore deleted book
    static restore(id) {
        const stmt = db.prepare(`
            UPDATE books 
            SET deleted = 0, deleted_at = NULL
            WHERE id = ?
        `);

        return stmt.run(id);
    }

    // Check if book is borrowed
    static isBorrowed(id) {
        const record = db.prepare(`
            SELECT * FROM borrowing_history 
            WHERE book_id = ? AND status = 'active'
        `).get(id);

        return record !== undefined;
    }
}

module.exports = Book;
