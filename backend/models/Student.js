// Student Model - Database operations for students
const db = require('../config/database');
const { hashPassword } = require('../config/database');

class Student {
    // Get all students
    static findAll() {
        return db.prepare('SELECT id, student_id, name, email, department, last_login, created_at FROM students').all();
    }

    // Get student by student_id
    static findByStudentId(studentId) {
        return db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId);
    }

    // Get student by email
    static findByEmail(email) {
        return db.prepare('SELECT * FROM students WHERE email = ?').get(email);
    }

    // Create new student
    static async create(studentData) {
        const hashedPass = hashPassword(studentData.password);

        const stmt = db.prepare(`
            INSERT INTO students (student_id, name, email, password, department)
            VALUES (?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            studentData.studentId,
            studentData.name,
            studentData.email,
            hashedPass,
            studentData.department
        );

        return result.lastInsertRowid;
    }

    // Verify student password
    static async verifyPassword(studentId, password) {
        const student = this.findByStudentId(studentId);
        if (!student) return false;

        const hashedInput = hashPassword(password);
        return hashedInput === student.password;
    }

    // Update last login
    static updateLastLogin(studentId) {
        const stmt = db.prepare(`
            UPDATE students 
            SET last_login = datetime('now')
            WHERE student_id = ?
        `);

        return stmt.run(studentId);
    }

    // Get student statistics
    static getStats(studentId) {
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_borrowed,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as currently_holding,
                SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned
            FROM borrowing_history
            WHERE student_id = ?
        `).get(studentId);

        return stats || { total_borrowed: 0, currently_holding: 0, returned: 0 };
    }
}

module.exports = Student;
