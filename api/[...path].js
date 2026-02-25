// Vercel Serverless API - No Railway needed!
// This file creates API endpoints that run on Vercel

// Helper to parse JSON body
async function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch {
                resolve({});
            }
        });
    });
}

// Get next ID for an array
function getNextId(arr) {
    if (arr.length === 0) return 1;
    return Math.max(...arr.map(item => item.id)) + 1;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // In-memory storage (persists across requests in same instance)
    if (!global.db) {
        global.db = {
            books: [],
            students: [],
            borrowingHistory: [],
            adminPassword: '112233',
            sessions: {}
        };
    }

    const url = new URL(req.url, `https://${req.headers.host}`);
    const pathname = url.pathname;

    console.log(`${req.method} ${pathname}`);

    // GET /api/books
    if (pathname === '/api/books' && req.method === 'GET') {
        return res.status(200).json({ success: true, data: global.db.books });
    }

    // POST /api/books
    if (pathname === '/api/books' && req.method === 'POST') {
        const body = await getBody(req);
        const newBook = {
            id: getNextId(global.db.books),
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
            addedBy: body.addedBy || 'admin'
        };
        global.db.books.push(newBook);
        return res.status(200).json({ success: true, bookId: newBook.id, message: 'Book added successfully' });
    }

    // DELETE /api/books/:id
    if (pathname.startsWith('/api/books/') && req.method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3], 10);
        const bookIndex = global.db.books.findIndex(b => b.id === id);
        if (bookIndex !== -1) {
            global.db.books.splice(bookIndex, 1);
            console.log(`📚 Book deleted: id=${id}`);
            return res.status(200).json({ success: true, message: 'Book deleted successfully' });
        }
        return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // POST /api/auth/admin/login
    if (pathname === '/api/auth/admin/login' && req.method === 'POST') {
        const body = await getBody(req);
        console.log('Admin login attempt:', body);

        if (body.password === global.db.adminPassword) {
            const sessionId = Math.random().toString(36).substring(7);
            global.db.sessions[sessionId] = { type: 'admin' };
            console.log('Admin login success');
            return res.status(200).json({ success: true, sessionId, message: 'Admin logged in' });
        }
        console.log('Admin login failed');
        return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // POST /api/auth/student/register
    if (pathname === '/api/auth/student/register' && req.method === 'POST') {
        const body = await getBody(req);
        const existing = global.db.students.find(s => s.studentId === body.studentId);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Student ID already registered' });
        }

        const student = {
            id: getNextId(global.db.students),
            studentId: body.studentId,
            name: body.name,
            email: body.email,
            password: body.password,
            department: body.department,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginHistory: []
        };
        global.db.students.push(student);
        return res.status(200).json({ success: true, message: 'Student registered successfully' });
    }

    // POST /api/auth/student/login
    if (pathname === '/api/auth/student/login' && req.method === 'POST') {
        const body = await getBody(req);
        const student = global.db.students.find(s =>
            s.studentId === body.studentId && s.password === body.password
        );

        if (student) {
            const sessionId = Math.random().toString(36).substring(7);
            const loginTime = new Date().toISOString();
            student.lastLogin = loginTime;
            if (!student.loginHistory) student.loginHistory = [];
            student.loginHistory.push(loginTime);

            global.db.sessions[sessionId] = {
                type: 'student',
                studentId: student.studentId,
                name: student.name,
                email: student.email,
                department: student.department
            };
            return res.status(200).json({
                success: true,
                sessionId,
                user: {
                    type: 'student',
                    studentId: student.studentId,
                    name: student.name,
                    email: student.email,
                    department: student.department
                }
            });
        }
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // POST /api/borrow
    if (pathname === '/api/borrow' && req.method === 'POST') {
        const body = await getBody(req);
        const book = global.db.books.find(b => b.id === body.bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        const alreadyBorrowed = global.db.borrowingHistory.find(h => h.bookId === body.bookId && h.status === 'active');
        if (alreadyBorrowed) {
            return res.status(400).json({ success: false, message: 'Book already borrowed' });
        }

        const record = {
            id: getNextId(global.db.borrowingHistory),
            bookId: body.bookId,
            bookTitle: book.title,
            studentId: body.studentId,
            studentName: body.studentName,
            borrowDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };
        global.db.borrowingHistory.push(record);
        return res.status(200).json({ success: true, recordId: record.id, dueDate: record.dueDate });
    }

    // GET /api/borrow/all
    if (pathname === '/api/borrow/all' && req.method === 'GET') {
        return res.status(200).json({ success: true, data: global.db.borrowingHistory });
    }

    // GET /api/students
    if (pathname === '/api/students' && req.method === 'GET') {
        // Return students without passwords
        const safeStudents = global.db.students.map(s => ({
            id: s.id,
            studentId: s.studentId,
            name: s.name,
            email: s.email,
            department: s.department,
            lastLogin: s.lastLogin,
            createdAt: s.createdAt
        }));
        return res.status(200).json({ success: true, data: safeStudents });
    }

    return res.status(404).json({ error: 'Not found', path: pathname });
}

