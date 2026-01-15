// Simple Pure Node.js Server (No Dependencies!)
// Uses only built-in Node.js modules
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..');

// Simple in-memory database (will be replaced with file-based storage)
let db = {
    books: [],
    students: [],
    borrowingHistory: [],
    adminPassword: crypto.createHash('sha256').update('112233').digest('hex'),
    sessions: {}
};

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
    const url = req.url;
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

    // GET /api/books - Get all books
    if (url === '/api/books' && method === 'GET') {
        sendJSON(res, 200, { success: true, data: db.books });
        return;
    }

    // POST /api/books - Add book (simple version without file upload)
    if (url === '/api/books' && method === 'POST') {
        parseBody(req, (err, body) => {
            const newBook = {
                id: db.books.length + 1,
                title: body.title,
                author: body.author,
                department: body.department,
                description: body.description || '',
                addedAt: new Date().toISOString()
            };
            db.books.push(newBook);
            console.log(`📚 Book added: ${newBook.title}`);
            sendJSON(res, 200, { success: true, bookId: newBook.id });
        });
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

            const hashedPassword = crypto.createHash('sha256').update(body.password).digest('hex');
            const student = {
                id: db.students.length + 1,
                studentId: body.studentId,
                name: body.name,
                email: body.email,
                password: hashedPassword,
                department: body.department,
                createdAt: new Date().toISOString()
            };
            db.students.push(student);
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

            const hashedInput = crypto.createHash('sha256').update(body.password || '').digest('hex');
            if (hashedInput === student.password) {
                const sessionId = crypto.randomBytes(16).toString('hex');
                db.sessions[sessionId] = {
                    type: 'student',
                    studentId: student.studentId,
                    name: student.name,
                    email: student.email,
                    department: student.department
                };
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

    // Serve frontend files
    let filePath = path.join(FRONTEND_DIR, url === '/' ? 'index.html' : url);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        serveFile(res, filePath);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start server
server.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('📚 e-Granthalaya Library Management System - Simple Server');
    console.log('='.repeat(60));
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`🔑 Admin password: 112233`);
    console.log(`📁 Serving from: ${FRONTEND_DIR}`);
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

    initializeSampleBooks();

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
