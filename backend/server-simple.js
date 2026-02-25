// Simple Pure Node.js Server (No Dependencies!)
// Uses only built-in Node.js modules
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..');
const DB_FILE = path.join(__dirname, '..', 'database', 'database.json');
const BOOKS_FILE = path.join(__dirname, '..', 'database', 'books.json');

// Database with file-based persistence
let db = {
    books: [],
    students: [],
    borrowingHistory: [],
    adminPassword: crypto.createHash('sha256').update('112233').digest('hex'),
    sessions: {}
};

// Load database from file
function loadDatabase() {
    try {
        // Load main database (students, history, etc.)
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const loaded = JSON.parse(data);
            db.students = loaded.students || [];
            db.borrowingHistory = loaded.borrowingHistory || [];
            db.adminPassword = loaded.adminPassword || db.adminPassword;
            console.log(`✅ Main database loaded: ${db.students.length} students`);
        } else {
            console.log('ℹ️  No existing database file, starting fresh');
        }

        // Load books from separate file
        if (fs.existsSync(BOOKS_FILE)) {
            const booksData = fs.readFileSync(BOOKS_FILE, 'utf8');
            const loadedBooks = JSON.parse(booksData);
            db.books = loadedBooks.books || [];
            console.log(`✅ Books database loaded: ${db.books.length} books`);
        } else {
            console.log('ℹ️  No existing books file, starting fresh');
            db.books = [];
        }
    } catch (error) {
        console.error('❌ Error loading database:', error.message);
    }
}

// Save database to file
function saveDatabase() {
    if (process.env.VERCEL) return; // Skip write on Vercel
    try {
        // Ensure database directory exists
        const dbDir = path.dirname(DB_FILE);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Save main database (without books)
        const mainData = {
            students: db.students,
            borrowingHistory: db.borrowingHistory,
            adminPassword: db.adminPassword
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(mainData, null, 2), 'utf8');
        console.log('💾 Main database saved');
    } catch (error) {
        console.error('❌ Error saving database:', error.message);
    }
}

// Save books to separate file
function saveBooksDatabase() {
    if (process.env.VERCEL) return; // Skip write on Vercel
    try {
        const booksData = {
            books: db.books
        };
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(booksData, null, 2), 'utf8');
        console.log('📚 Books database saved');
    } catch (error) {
        console.error('❌ Error saving books database:', error.message);
    }
}

// Initialize sample books
function initializeSampleBooks() {
    if (db.books.length === 0) {
        db.books = [
            { id: 1, title: "E-Granthalaya User Manual", author: "System Admin", department: "computer-science", description: "Official user guide" },
            { id: 2, title: "Introduction to Programming", author: "Library Collection", department: "computer-science", description: "Programming basics" },
            { id: 3, title: "Data Structures Guide", author: "Library Collection", department: "computer-science", description: "Data structures fundamentals" },
            { id: 4, title: "Python Programming Basics", author: "Library Collection", department: "computer-science", description: "Learn Python from scratch" },
            { id: 5, title: "Programming With 'C'", author: "Gottfried", department: "computer-science", description: "C programming textbook" },
            { id: 6, title: "Thermal Engineering", author: "P.L. Ballaney", department: "mechanical", description: "Thermal engineering guide" },
            { id: 7, title: "Theory of Machines", author: "R.S. Khurmi", department: "mechanical", description: "Machine theory" },
            { id: 8, title: "Mine Environment", author: "G.B. Misra", department: "mining", description: "Mining safety and environment" }
        ];
        console.log(`✅ ${db.books.length} sample books initialized`);
    }
}

// Helper: Parse JSON body
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            callback(null, JSON.parse(body));
        } catch (e) {
            callback(null, {});
        }
    });
}

// Helper: Send JSON response
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Helper: Serve static files
function serveFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        };

        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(data);
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    const method = req.method;

    console.log(`${method} ${url}`);

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // API Routes

    // GET /api/books - Get all books (excluding deleted)
    if (url === '/api/books' && method === 'GET') {
        const activeBooks = db.books.filter(b => !b.deleted);
        sendJSON(res, 200, { success: true, data: activeBooks });
        return;
    }

    // GET /api/books/deleted/all - Get all deleted books
    if (url === '/api/books/deleted/all' && method === 'GET') {
        const deletedBooks = db.books.filter(b => b.deleted === true);
        sendJSON(res, 200, { success: true, data: deletedBooks });
        return;
    }

    // POST /api/books - Add book with all fields including file data
    if (url === '/api/books' && method === 'POST') {
        parseBody(req, (err, body) => {
            const maxId = db.books.reduce((max, b) => Math.max(max, b.id || 0), 0);
            const newBook = {
                id: maxId + 1,
                title: body.title,
                author: body.author,
                department: body.department,
                description: body.description || '',
                image: body.image || null,
                fileName: body.fileName || null,
                fileSize: body.fileSize || 0,
                fileType: body.fileType || 'application/pdf',
                fileData: body.fileData || null,
                addedAt: body.addedAt || new Date().toISOString(),
                addedBy: body.addedBy || 'admin',
                deleted: false,
                deleted_at: null
            };
            db.books.push(newBook);
            saveBooksDatabase();
            console.log(`📚 Book added to books.json: ${newBook.title}`);
            sendJSON(res, 200, { success: true, bookId: newBook.id, message: 'Book saved to database' });
        });
        return;
    }

    // POST /api/books/:id/restore - Restore a soft-deleted book
    if (url.match(/^\/api\/books\/\d+\/restore$/) && method === 'POST') {
        const id = parseInt(url.split('/')[3], 10);
        const book = db.books.find(b => b.id === id && b.deleted === true);
        if (book) {
            book.deleted = false;
            book.deleted_at = null;
            saveBooksDatabase();
            console.log(`♻️ Book restored: ${book.title}`);
            sendJSON(res, 200, { success: true, message: 'Book restored successfully' });
        } else {
            sendJSON(res, 404, { success: false, message: 'Book not found in deleted books' });
        }
        return;
    }

    // DELETE /api/books/:id/permanent - Permanently delete a book (hard delete)
    if (url.match(/^\/api\/books\/\d+\/permanent$/) && method === 'DELETE') {
        const id = parseInt(url.split('/')[3], 10);
        const bookIndex = db.books.findIndex(b => b.id === id && b.deleted === true);
        if (bookIndex !== -1) {
            const removedBook = db.books.splice(bookIndex, 1)[0];
            saveBooksDatabase();
            console.log(`🗑️ Book permanently deleted: ${removedBook.title}`);
            sendJSON(res, 200, { success: true, message: 'Book permanently deleted' });
        } else {
            sendJSON(res, 404, { success: false, message: 'Book not found in deleted books' });
        }
        return;
    }

    // DELETE /api/books/:id - Soft delete book (mark as deleted)
    if (url.match(/^\/api\/books\/\d+$/) && method === 'DELETE') {
        const id = parseInt(url.split('/')[3], 10);
        const book = db.books.find(b => b.id === id && !b.deleted);
        if (book) {
            book.deleted = true;
            book.deleted_at = new Date().toISOString();
            saveBooksDatabase();
            console.log(`📚 Book soft-deleted: ${book.title}`);
            sendJSON(res, 200, { success: true, message: 'Book deleted successfully' });
        } else {
            sendJSON(res, 404, { success: false, message: 'Book not found' });
        }
        return;
    }

    // POST /api/auth/admin/login - Admin login
    if (url === '/api/auth/admin/login' && method === 'POST') {
        parseBody(req, (err, body) => {
            const hashedInput = crypto.createHash('sha256').update(body.password || '').digest('hex');
            if (hashedInput === db.adminPassword) {
                const sessionId = crypto.randomBytes(16).toString('hex');
                db.sessions[sessionId] = { type: 'admin', username: 'admin' };
                sendJSON(res, 200, { success: true, sessionId, message: 'Admin logged in' });
            } else {
                sendJSON(res, 401, { success: false, message: 'Invalid password' });
            }
        });
        return;
    }

    // POST /api/auth/student/register - Student registration
    if (url === '/api/auth/student/register' && method === 'POST') {
        parseBody(req, (err, body) => {
            const existing = db.students.find(s => s.studentId === body.studentId);
            if (existing) {
                sendJSON(res, 400, { success: false, message: 'Student ID already registered' });
                return;
            }

            // Validate required fields
            if (!body.password || !body.studentId || !body.name || !body.email) {
                sendJSON(res, 400, { success: false, message: 'Missing required fields' });
                return;
            }

            // Store password as plain text (no hashing)
            const student = {
                id: db.students.length + 1,
                studentId: body.studentId,
                name: body.name,
                email: body.email,
                password: body.password,  // Plain text password
                department: body.department,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                loginHistory: []
            };
            db.students.push(student);
            saveDatabase();
            console.log(`👨‍🎓 Student registered: ${student.name}`);
            sendJSON(res, 200, { success: true, message: 'Student registered successfully' });
        });
        return;
    }

    // POST /api/auth/student/login - Student login
    if (url === '/api/auth/student/login' && method === 'POST') {
        parseBody(req, (err, body) => {
            const student = db.students.find(s => s.studentId === body.studentId);
            if (!student) {
                sendJSON(res, 401, { success: false, message: 'Invalid credentials' });
                return;
            }

            // Compare plain text passwords
            if (body.password === student.password) {
                const sessionId = crypto.randomBytes(16).toString('hex');

                // Record login date/time
                const loginTime = new Date().toISOString();
                student.lastLogin = loginTime;
                if (!student.loginHistory) student.loginHistory = [];
                student.loginHistory.push(loginTime);
                saveDatabase();

                db.sessions[sessionId] = {
                    type: 'student',
                    studentId: student.studentId,
                    name: student.name,
                    email: student.email,
                    department: student.department
                };
                console.log(`🔐 Student logged in: ${student.name} at ${loginTime}`);
                sendJSON(res, 200, { success: true, sessionId, user: db.sessions[sessionId] });
            } else {
                sendJSON(res, 401, { success: false, message: 'Invalid credentials' });
            }
        });
        return;
    }

    // POST /api/borrow - Borrow a book
    if (url === '/api/borrow' && method === 'POST') {
        parseBody(req, (err, body) => {
            const book = db.books.find(b => b.id === body.bookId);
            if (!book) {
                sendJSON(res, 404, { success: false, message: 'Book not found' });
                return;
            }

            // Check if already borrowed
            const alreadyBorrowed = db.borrowingHistory.find(h => h.bookId === body.bookId && h.status === 'active');
            if (alreadyBorrowed) {
                sendJSON(res, 400, { success: false, message: 'Book already borrowed' });
                return;
            }

            const borrowDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 15);

            const record = {
                id: db.borrowingHistory.length + 1,
                bookId: book.id,
                bookTitle: book.title,
                studentId: body.studentId || 'student1',
                studentName: body.studentName || 'Student',
                borrowDate: borrowDate.toISOString(),
                dueDate: dueDate.toISOString(),
                status: 'active'
            };

            db.borrowingHistory.push(record);
            saveDatabase();
            console.log(`📖 Book borrowed: ${book.title}`);
            sendJSON(res, 200, { success: true, recordId: record.id, dueDate: dueDate.toISOString() });
        });
        return;
    }

    // GET /api/borrow/all - Get all borrowing records
    if (url === '/api/borrow/all' && method === 'GET') {
        sendJSON(res, 200, { success: true, data: db.borrowingHistory });
        return;
    }

    // GET /api/students - Get all registered students
    if (url === '/api/students' && method === 'GET') {
        sendJSON(res, 200, { success: true, data: db.students });
        return;
    }

    // Serve frontend files
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;

    // Default to index.html for root
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Security: Prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(FRONTEND_DIR, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        serveFile(res, filePath);
    } else {
        console.log(`❌ 404 Not Found: ${pathname}`);
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Start server
if (process.env.VERCEL) {
    // Export for Vercel serverless environment
    module.exports = (req, res) => {
        server.emit('request', req, res);
    };
} else {
    server.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('📚 e-Granthalaya Library Management System - Simple Server');
        console.log('='.repeat(60));
        console.log(`✅ Server running on: http://localhost:${PORT}`);
        console.log(`🔑 Admin password: 112233`);
        console.log(`📁 Serving from: ${FRONTEND_DIR}`);
        console.log(`💾 Database file: ${DB_FILE}`);
        console.log('='.repeat(60));
        console.log('');
        console.log('🌐 Access URLs:');
        console.log(`   Main: http://localhost:${PORT}`);
        console.log(`   Admin: http://localhost:${PORT}/admin-login.html`);
        console.log(`   Student: http://localhost:${PORT}/student-login.html`);
        console.log('');
        console.log('📡 API Endpoints:');
        console.log('   GET  /api/books');
        console.log('   POST /api/books');
        console.log('   POST /api/auth/admin/login');
        console.log('   POST /api/auth/student/register');
        console.log('   POST /api/auth/student/login');
        console.log('   POST /api/borrow');
        console.log('='.repeat(60));

        // Load existing database first
        loadDatabase();

        // Initialize sample books only if none exist
        // initializeSampleBooks(); // Disabled - keep books empty

        // Save initial state
        saveDatabase();

        console.log('');
        console.log('✅ Server is ready! Press Ctrl+C to stop.');
        console.log('');
    });

    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down server...');
        server.close(() => {
            console.log('✅ Server stopped');
            process.exit(0);
        });
    });
}
