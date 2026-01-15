// Vercel Serverless API - No Railway needed!
// This file creates API endpoints that run on Vercel

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // In-memory storage (temporary - resets on each deployment)
    global.db = global.db || {
        books: [
            { id: 1, title: "E-Granthalaya User Manual", author: "System Admin", department: "computer-science", description: "Official user guide" },
            { id: 2, title: "Introduction to Programming", author: "Library Collection", department: "computer-science", description: "Programming basics" },
            { id: 3, title: "Data Structures Guide", author: "Library Collection", department: "computer-science", description: "Data structures fundamentals" },
            { id: 4, title: "Python Programming Basics", author: "Library Collection", department: "computer-science", description: "Learn Python from scratch" },
            { id: 5, title: "Programming With 'C'", author: "Gottfried", department: "computer-science", description: "C programming textbook" },
            { id: 6, title: "Thermal Engineering", author: "P.L. Ballaney", department: "mechanical", description: "Thermal engineering guide" },
            { id: 7, title: "Theory of Machines", author: "R.S. Khurmi", department: "mechanical", description: "Machine theory" },
            { id: 8, title: "Mine Environment", author: "G.B. Misra", department: "mining", description: "Mining safety and environment" }
        ],
        students: [],
        borrowingHistory: [],
        adminPassword: 'hashed_112233', // Simplified for demo
        sessions: {}
    };

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    // GET /api/books
    if (pathname === '/api/books' && req.method === 'GET') {
        return res.status(200).json({ success: true, data: global.db.books });
    }

    // POST /api/books
    if (pathname === '/api/books' && req.method === 'POST') {
        const newBook = {
            id: global.db.books.length + 1,
            ...req.body,
            addedAt: new Date().toISOString()
        };
        global.db.books.push(newBook);
        return res.status(200).json({ success: true, bookId: newBook.id });
    }

    // POST /api/auth/admin/login
    if (pathname === '/api/auth/admin/login' && req.method === 'POST') {
        const { password } = req.body || {};
        if (password === '112233') {
            const sessionId = Math.random().toString(36).substring(7);
            global.db.sessions[sessionId] = { type: 'admin' };
            return res.status(200).json({ success: true, sessionId, message: 'Admin logged in' });
        }
        return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // POST /api/auth/student/register
    if (pathname === '/api/auth/student/register' && req.method === 'POST') {
        const student = {
            id: global.db.students.length + 1,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        global.db.students.push(student);
        return res.status(200).json({ success: true, message: 'Student registered successfully' });
    }

    // POST /api/auth/student/login
    if (pathname === '/api/auth/student/login' && req.method === 'POST') {
        const { studentId, password } = req.body || {};
        const student = global.db.students.find(s => s.studentId === studentId && s.password === password);
        if (student) {
            const sessionId = Math.random().toString(36).substring(7);
            global.db.sessions[sessionId] = { type: 'student', ...student };
            return res.status(200).json({ success: true, sessionId, user: student });
        }
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // POST /api/borrow
    if (pathname === '/api/borrow' && req.method === 'POST') {
        const record = {
            id: global.db.borrowingHistory.length + 1,
            ...req.body,
            borrowDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };
        global.db.borrowingHistory.push(record);
        return res.status(200).json({ success: true, recordId: record.id });
    }

    // GET /api/borrow/all
    if (pathname === '/api/borrow/all' && req.method === 'GET') {
        return res.status(200).json({ success: true, data: global.db.borrowingHistory });
    }

    return res.status(404).json({ error: 'Not found' });
}
