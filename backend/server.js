// Main Express Server for e-Granthalaya Library Management System
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'e-granthalaya-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize database (this creates tables and default admin)
require('./config/database');

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../e-granthalaya-main')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/borrow', require('./routes/borrow'));
app.use('/api/students', require('./routes/students'));

// Serve frontend HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../e-granthalaya-main/index.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../e-granthalaya-main/admin-login.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../e-granthalaya-main/admin-dashboard.html'));
});

app.get('/student-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../e-granthalaya-main/student-login.html'));
});

app.get('/student-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../e-granthalaya-main/student-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Initialize sample books on first run
function initializeSampleBooks() {
    const Book = require('./models/Book');
    const books = Book.findAll();

    if (books.length === 0) {
        console.log('Initializing sample books...');

        const sampleBooks = [
            {
                title: "E-Granthalaya User Manual",
                author: "System Admin",
                department: "computer-science",
                description: "Official user guide for the E-Granthalaya Library Management System."
            },
            {
                title: "Introduction to Programming",
                author: "Library Collection",
                department: "computer-science",
                description: "A comprehensive introduction to programming concepts, algorithms, and data structures."
            },
            {
                title: "Data Structures Guide",
                author: "Library Collection",
                department: "computer-science",
                description: "Essential guide to data structures including arrays, linked lists, stacks, queues, trees, and graphs."
            },
            {
                title: "Python Programming Basics",
                author: "Library Collection",
                department: "computer-science",
                description: "Learn Python programming from scratch. Covers syntax, data types, functions, and OOP."
            },
            {
                title: "Programming With 'C'",
                author: "Gottfried",
                department: "computer-science",
                description: "Classic textbook for C programming language."
            },
            {
                title: "Fundamentals of Computers",
                author: "V. Rajaraman",
                department: "computer-science",
                description: "Introduction to computer fundamentals and concepts."
            },
            {
                title: "Thermal Engineering in SI Units",
                author: "P.L. Ballaney",
                department: "mechanical",
                description: "Comprehensive guide to thermal engineering."
            },
            {
                title: "Theory of Machines",
                author: "R.S. Khurmi & J.K. Gupta",
                department: "mechanical",
                description: "Essential textbook on theory of machines."
            },
            {
                title: "Mine Environment and Ventilation",
                author: "G.B. Misra",
                department: "mining",
                description: "Study of mine environment and ventilation systems."
            },
            {
                title: "Elements of Mining Technology Vol.I",
                author: "D.J. Deshmukh",
                department: "mining",
                description: "Fundamental concepts in mining technology."
            }
        ];

        sampleBooks.forEach(book => {
            Book.create(book);
        });

        console.log(`${sampleBooks.length} sample books added to database`);
    } else {
        console.log(`Found ${books.length} existing books in database`);
    }
}

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('📚 e-Granthalaya Library Management System');
    console.log('='.repeat(50));
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`Admin login: http://localhost:${PORT}/admin-login.html`);
    console.log(`Student login: http://localhost:${PORT}/student-login.html`);
    console.log(`Default admin password: 112233`);
    console.log('='.repeat(50));

    // Initialize sample books
    initializeSampleBooks();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});
