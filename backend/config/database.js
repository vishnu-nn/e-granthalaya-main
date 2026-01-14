// Database configuration and initialization
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

// Database file path
const dbPath = path.join(__dirname, '../../database/library.db');

// Initialize database
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Simple hash function (using crypto instead of bcrypt)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Create tables if they don't exist
function initializeDatabase() {
    // Students table
    db.exec(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            department TEXT NOT NULL,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Admin users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL DEFAULT 'admin',
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Books table
    db.exec(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            department TEXT NOT NULL,
            image TEXT,
            description TEXT,
            file_path TEXT,
            file_name TEXT,
            file_size INTEGER,
            added_by TEXT DEFAULT 'admin',
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted INTEGER DEFAULT 0,
            deleted_at DATETIME
        )
    `);

    // Borrowing history table
    db.exec(`
        CREATE TABLE IF NOT EXISTS borrowing_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            student_id TEXT NOT NULL,
            book_title TEXT NOT NULL,
            book_department TEXT NOT NULL,
            student_name TEXT NOT NULL,
            student_email TEXT NOT NULL,
            student_department TEXT NOT NULL,
            borrow_date DATETIME NOT NULL,
            due_date DATETIME NOT NULL,
            return_date DATETIME,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (book_id) REFERENCES books(id),
            FOREIGN KEY (student_id) REFERENCES students(student_id)
        )
    `);

    // Create default admin user (password: 112233)
    const hashedPassword = hashPassword('112233');

    const checkAdmin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get('admin');
    if (!checkAdmin) {
        db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
        console.log('Default admin user created (password: 112233)');
    }

    console.log('Database initialized successfully');
}

// Initialize on module load
initializeDatabase();

module.exports = db;
module.exports.hashPassword = hashPassword;
