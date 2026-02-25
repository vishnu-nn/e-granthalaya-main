// ===== Authentication Module =====

const ADMIN_PASSWORD = '112233';

// Departments
const DEPARTMENTS = [
    { id: 'computer-science', name: 'Computer Science E-Books', icon: '💻' },
    { id: 'mechanical', name: 'Mechanical E-Books', icon: '⚙️' },
    { id: 'mining', name: 'Mining E-Books', icon: '⛏️' }
];

// Get all departments
function getDepartments() {
    return DEPARTMENTS;
}

// Admin Login
function adminLogin(password) {
    if (password === ADMIN_PASSWORD) {
        const adminData = {
            type: 'admin',
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(adminData));
        return { success: true, message: 'Login successful!' };
    }
    return { success: false, message: 'Invalid password. Please try again.' };
}

// Student Login
async function studentLogin(name, email, department) {
    if (!name || !email || !department) {
        return { success: false, message: 'Please fill in all fields.' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, message: 'Please enter a valid email address.' };
    }

    // Generate student ID from email
    const studentId = generateStudentId(email);

    // Get department name
    const dept = DEPARTMENTS.find(d => d.id === department);
    const departmentName = dept ? dept.name : department;

    // Create or update student record
    const studentData = {
        type: 'student',
        name: name.trim(),
        email: email.trim().toLowerCase(),
        studentId: studentId,
        department: department,
        departmentName: departmentName,
        loginTime: new Date().toISOString()
    };

    // Save to current user
    localStorage.setItem('currentUser', JSON.stringify(studentData));

    // Register student in database
    await registerStudent(studentData);

    return { success: true, message: 'Login successful!' };
}

// Generate Student ID from email
function generateStudentId(email) {
    // Create a simple hash from email
    const emailPart = email.split('@')[0].toUpperCase();
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `STU${hash.toString().slice(-4)}${emailPart.slice(0, 3)}`;
}

// Register new student in database
async function registerStudent(studentData) {
    try {
        // Check if student already exists
        const existing = await window.dbModule.dbGet('students', studentData.studentId);

        const student = {
            studentId: studentData.studentId,
            name: studentData.name,
            email: studentData.email,
            department: studentData.department,
            departmentName: studentData.departmentName,
            registeredAt: existing ? existing.registeredAt : new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        await window.dbModule.dbPut('students', student);
    } catch (error) {
        console.error('Error registering student:', error);
    }
}

// Check if admin is logged in
function isAdminLoggedIn() {
    if (window.API) return window.API.isAdmin();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user && user.type === 'admin';
}

// Check if student is logged in
function isStudentLoggedIn() {
    if (window.API) return window.API.isStudent();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user && user.type === 'student';
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Logout
function logout() {
    if (window.API) {
        window.API.logout();
    }
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Get all registered students from database
async function getAllStudents() {
    try {
        return await window.dbModule.dbGetAll('students');
    } catch (error) {
        console.error('Error getting students:', error);
        return [];
    }
}

// Get students by department
async function getStudentsByDepartment(department) {
    try {
        return await window.dbModule.dbGetByIndex('students', 'department', department);
    } catch (error) {
        console.error('Error getting students by department:', error);
        return [];
    }
}
