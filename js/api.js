// API Client - Frontend interface to backend server
// Replaces IndexedDB with server API calls

// Use relative path for production, localhost for local dev if needed (though relative works for both if served by same server)
const API_BASE = '/api';

// Store session data - restore from localStorage on load
let currentSession = {
    sessionId: localStorage.getItem('sessionId'),
    user: null
};

// Restore user data from localStorage on load
(function restoreSession() {
    const sessionId = localStorage.getItem('sessionId');
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('userData');

    if (sessionId && userType) {
        currentSession.sessionId = sessionId;
        if (userData) {
            try {
                currentSession.user = JSON.parse(userData);
            } catch (e) {
                console.warn('Could not parse userData from localStorage');
            }
        } else if (userType === 'admin') {
            currentSession.user = { type: 'admin' };
        }
        console.log('✅ Session restored from localStorage:', userType);
    }
})();

const API = {
    // ===== Books =====
    async getBooks() {
        try {
            const response = await fetch(`${API_BASE}/books`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    },

    async addBook(bookData) {
        try {
            const response = await fetch(`${API_BASE}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding book:', error);
            return { success: false, message: 'Failed to add book' };
        }
    },

    async deleteBook(bookId) {
        try {
            const response = await fetch(`${API_BASE}/books/${bookId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting book:', error);
            return { success: false, message: 'Failed to delete book' };
        }
    },

    // ===== Authentication =====
    async adminLogin(password) {
        try {
            const response = await fetch(`${API_BASE}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            if (data.success) {
                currentSession.sessionId = data.sessionId;
                currentSession.user = { type: 'admin' };
                localStorage.setItem('sessionId', data.sessionId);
                localStorage.setItem('userType', 'admin');
            }
            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, message: 'Login failed' };
        }
    },

    async studentRegister(studentData) {
        try {
            const response = await fetch(`${API_BASE}/auth/student/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error registering:', error);
            return { success: false, message: 'Registration failed' };
        }
    },

    async studentLogin(studentId, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/student/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, password })
            });
            const data = await response.json();
            if (data.success) {
                currentSession.sessionId = data.sessionId;
                currentSession.user = data.user;
                localStorage.setItem('sessionId', data.sessionId);
                localStorage.setItem('userType', 'student');
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, message: 'Login failed' };
        }
    },

    // ===== Borrowing =====
    async borrowBook(bookId, studentId, studentName) {
        try {
            const response = await fetch(`${API_BASE}/borrow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, studentId, studentName })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error borrowing book:', error);
            return { success: false, message: 'Failed to borrow book' };
        }
    },

    async getBorrowingHistory() {
        try {
            const response = await fetch(`${API_BASE}/borrow/all`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    },

    // ===== Session Management =====
    isLoggedIn() {
        return localStorage.getItem('sessionId') !== null;
    },

    isAdmin() {
        return localStorage.getItem('userType') === 'admin';
    },

    isStudent() {
        return localStorage.getItem('userType') === 'student';
    },

    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    // Get all registered students
    async getStudents() {
        try {
            const response = await fetch(`${API_BASE}/students`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    },

    logout() {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        currentSession = { sessionId: null, user: null };
    }
};

// Make API available globally
window.API = API;

console.log('✅ API Client loaded - Using backend server at', API_BASE);
