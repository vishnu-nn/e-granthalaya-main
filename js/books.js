// ===== Books Module =====

// Borrowing period in days
const BORROWING_DAYS = 15;

// Generate book cover SVG with unique colors
function generateBookCover(title, dept) {
    const colors = {
        'computer-science': ['#6366f1', '#8b5cf6', '#a78bfa'],
        'mechanical': ['#f59e0b', '#d97706', '#fbbf24'],
        'mining': ['#10b981', '#059669', '#34d399']
    };
    const deptColors = colors[dept] || colors['computer-science'];
    const hash = title.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const bgColor = deptColors[Math.abs(hash) % 3];
    const initial = title.charAt(0).toUpperCase();

    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180" viewBox="0 0 120 180"><rect fill="${bgColor}" width="120" height="180"/><rect fill="rgba(255,255,255,0.1)" x="10" y="10" width="100" height="160" rx="5"/><text x="60" y="100" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${initial}</text><text x="60" y="130" font-family="Arial,sans-serif" font-size="8" fill="rgba(255,255,255,0.8)" text-anchor="middle">${dept.replace('-', ' ').toUpperCase()}</text></svg>`)}`;
}

// Books data organized by department (from Excel file LIB-25.xlsx)
const DEPARTMENT_BOOKS = {
    'computer-science': [
        {
            title: "E-Granthalaya User Manual",
            author: 'System Admin',
            description: 'Official user guide for the E-Granthalaya Library Management System. Learn how to borrow, return, and read books.',
            // Valid Blank Page PDF base64 with Data URI prefix
            fileData: 'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA1OTUgODQyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDw+Pj4+ZW5kb2JqIHhyZWYgMCA0IDAwMDAwMDAwMDAgNjU1MzUgZiAwMDAwMDAwMDEwIDAwMDAwIG4gMDAwMDAwMDAwNjAgMDAwMDAgbiAwMDAwMDAwMTE3IDAwMDAwIG4gdHJhaWxlcjw8L1NpemUgNC9Sb290IDEgMCBSPj5zdGFydHhyZWYKMTc4CiUlRU9GCg==',
            fileType: 'application/pdf'
        },
        {
            title: "Introduction to Programming",
            author: 'Library Collection',
            description: 'A comprehensive introduction to programming concepts, algorithms, and data structures. Perfect for beginners.',
            // Sample PDF with text content
            fileData: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDUgMCBSCj4+Cj4+Cj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCA0NDc+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MjAgVGQKKEludHJvZHVjdGlvbiB0byBQcm9ncmFtbWluZykgVGoKRVQKQlQKL0YxIDE0IFRmCjUwIDY2MCBUZAooQXV0aG9yOiBMaWJyYXJ5IENvbGxlY3Rpb24pIFRqCkVUCkJUCi9GMSAxMiBUZgo1MCA2MDAgVGQKKFRoaXMgaXMgYSBzYW1wbGUgYm9vayBkZW1vbnN0cmF0aW5nIFBERiByZWFkaW5nIGZ1bmN0aW9uYWxpdHkuKSBUagpFVApCVAovRjEgMTIgVGYKNTAgNTgwIFRkCigpIFRqCkVUCkJUCi9GMSAxNiBUZgo1MCA1NDAgVGQKKENoYXB0ZXIgMTogR2V0dGluZyBTdGFydGVkKSBUagpFVApCVAovRjEgMTIgVGYKNTAgNTEwIFRkCihQcm9ncmFtbWluZyBpcyB0aGUgYXJ0IG9mIGNyZWF0aW5nIGluc3RydWN0aW9ucyBmb3IgY29tcHV0ZXJzLikgVGoKRVQKQlQKL0YxIDEyIFRmCjUwIDQ4NSBUZAooSXQgaW52b2x2ZXMgcHJvYmxlbS1zb2x2aW5nLCBhbGdvcml0aG1pYyB0aGlua2luZywgYW5kIGNyZWF0aXZpdHkuKSBUagpFVApCVAovRjEgMTIgVGYKNTAgNDYwIFRkCigpIFRqCkVUCkJUCi9GMSAxMiBUZgo1MCA0MzAgVGQKKEtleSBDb25jZXB0czopIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCA0MDUgVGQKKC0gVmFyaWFibGVzIGFuZCBEYXRhIFR5cGVzKSBUagpFVApCVAovRjEgMTEgVGYKNzAgMzgwIFRkCigtIENvbnRyb2wgU3RydWN0dXJlcykgVGoKRVQKQlQKL0YxIDExIFRmCjcwIDM1NSBUZAooLSBGdW5jdGlvbnMgYW5kIE1vZHVsZXMpIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCAzMzAgVGQKKC0gRGF0YSBTZXJ1Y3R1cmVzKSBUagpFVApCVAovRjEgMTEgVGYKNzAgMzA1IFRkCigtIEFsZ29yaXRobXMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoyIDAgb2JqCjw8L1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCj4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDA3NDAgMDAwMDAgbiAKMDAwMDAwMDc5NyAwMDAwMCBuIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAxNDQgMDAwMDAgbiAKMDAwMDAwMDY0MCAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNgovUm9vdCAyIDAgUgo+PgpzdGFydHhyZWYKODQ2CiUlRU9GCg==',
            fileType: 'application/pdf'
        },
        {
            title: "Data Structures Guide",
            author: 'Library Collection',
            description: 'Essential guide to data structures including arrays, linked lists, stacks, queues, trees, and graphs.',
            fileData: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDUgMCBSCj4+Cj4+Cj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCA1MzI+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjE1MCA3MjAgVGQKKERhdGEgU3RydWN0dXJlcyBHdWlkZSkgVGoKRVQKQlQKL0YxIDE0IFRmCjUwIDY2MCBUZAooQXV0aG9yOiBMaWJyYXJ5IENvbGxlY3Rpb24pIFRqCkVUCkJUCi9GMSAxMiBUZgo1MCA2MDAgVGQKKEEgY29tcHJlaGVuc2l2ZSBndWlkZSB0byBkYXRhIHN0cnVjdHVyZXMgYW5kIHRoZWlyIGFwcGxpY2F0aW9ucy4pIFRqCkVUCkJUCi9GMSAxMiBUZgo1MCA1ODAgVGQKKCkgVGoKRVQKQlQKL0YxIDE2IFRmCjUwIDU0MCBUZAooQ2hhcHRlciAxOiBGdW5kYW1lbnRhbCBEYXRhIFN0cnVjdHVyZXMpIFRqCkVUCkJUCi9GMSAxMiBUZgo1MCA1MTAgVGQKKERhdGEgc3RydWN0dXJlcyBhcmUgd2F5cyBvZiBvcmdhbml6aW5nIGFuZCBzdG9yaW5nIGRhdGEuKSBUagpFVApCVAovRjEgMTIgVGYKNTAgNDg1IFRkCigpIFRqCkVUCkJUCi9GMSAxNCBUZgo1MCA0NTUgVGQKKDEuIEFycmF5cykgVGoKRVQKQlQKL0YxIDExIFRmCjcwIDQzMCBUZAooLSBDb250aWd1b3VzIG1lbW9yeSBsb2NhdGlvbnMpIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCA0MDUgVGQKKC0gUmFuZG9tIGFjY2VzcykgVGoKRVQKQlQKL0YxIDExIFRmCjcwIDM4MCBUZAooLSBGaXhlZCBzaXplKSBUagpFVApCVAovRjEgMTQgVGYKNTAgMzUwIFRkCigyLiBMaW5rZWQgTGlzdHMpIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCAzMjUgVGQKKC0gRHluYW1pYyBzaXplKSBUagpFVApCVAovRjEgMTEgVGYKNzAgMzAwIFRkCigtIFNlcXVlbnRpYWwgYWNjZXNzKSBUagpFVApCVAovRjEgMTEgVGYKNzAgMjc1IFRkCigtIEVhc3kgaW5zZXJ0aW9uL2RlbGV0aW9uKSBUagpFVApCVAovRjEgMTQgVGYKNTAgMjQ1IFRkCigzLiBTdGFja3MgJiBRdWV1ZXMpIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCAyMjAgVGQKKC0gTElGTyB2cy4gRklGTykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoxIDAgb2JqCjw8L1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZwovUGFnZXMgMSAwIFIKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDgyNSAwMDAwMCBuIAowMDAwMDAwODgyIDAwMDAwIG4gCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDE0NCAwMDAwMCBuIAowMDAwMDAwNzI1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2Ci9Sb290IDIgMCBSCj4+CnN0YXJ0eHJlZgo5MzEKJSVFT0YK',
            fileType: 'application/pdf'
        },
        {
            title: "Python Programming Basics",
            author: 'Library Collection',
            description: 'Learn Python programming from scratch. Covers syntax, data types, functions, and object-oriented programming.',
            fileData: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDUgMCBSCj4+Cj4+Cj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCA1NTE++PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEyMCA3MjAgVGQKKFB5dGhvbiBQcm9ncmFtbWluZyBCYXNpY3MpIFRqCkVUCkJUCi9GMSAxNCBUZgo1MCA2NjAgVGQKKEF1dGhvcjogTGlicmFyeSBDb2xsZWN0aW9uKSBUagpFVApCVAovRjEgMTIgVGYKNTAgNjAwIFRkCihMZWFybiBQeXRob24gcHJvZ3JhbW1pbmcgZnJvbSBzY3JhdGNoIHdpdGggdGhpcyBjb21wcmVoZW5zaXZlIGd1aWRlLikgVGoKRVQKQlQKL0YxIDEyIFRmCjUwIDU4MCBUZAooKSBUagpFVApCVAovRjEgMTYgVGYKNTAgNTQwIFRkCihDaGFwdGVyIDE6IEludHJvZHVjdGlvbiB0byBQeXRob24pIFRqCkVUCkJUCi9GMSAxMiBUZgo1MCA1MTAgVGQKKFB5dGhvbiBpcyBhIHBvd2VyZnVsLCBoaWdoLWxldmVsIHByb2dyYW1taW5nIGxhbmd1YWdlLikgVGoKRVQKQlQKL0YxIDEyIFRmCjUwIDQ4NSBUZAooSXQncyBlYXN5IHRvIGxlYXJuIGFuZCB3aWRlbHkgdXNlZCBpbiB3ZWIgZGV2ZWxvcG1lbnQsIEFJLCBhbmQgZGF0YSBzY2llbmNlLikgVGoKRVQKQlQKL0YxIDEyIFRmCjUwIDQ2MCBUZAooKSBUagpFVApCVAovRjEgMTQgVGYKNTAgNDMwIFRkCihCYXNpYyBTeW50YXgpIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCA0MDUgVGQKKDEuIFByaW50IFN0YXRlbWVudDogcHJpbnQoIkhlbGxvLCBXb3JsZCEiKSkgVGoKRVQKQlQKL0YxIDExIFRmCjcwIDM4MCBUZAooMi4gVmFyaWFibGVzOiB4ID0gMTApIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCAzNTUgVGQKKDMuIERhdGEgVHlwZXM6IGludCwgZmxvYXQsIHN0ciwgYm9vbCkgVGoKRVQKQlQKL0YxIDExIFRmCjcwIDMzMCBUZAooNC4gTGlzdHM6IG15X2xpc3QgPSBbMSwgMiwgMywgNF0pIFRqCkVUCkJUCi9GMSAxMSBUZgo3MCAzMDUgVGQKKDUuIERpY3Rpb25hcmllczogbXlfZGljdCA9IHsibmFtZSI6ICJKb2huIn0pIFRqCkVUCkJUCi9GMSAxNCBUZgo1MCAyNzAgVGQKKENvbnRyb2wgU3RydWN0dXJlcykgVGoKRVQKQlQKL0YxIDExIFRmCjcwIDI0NSBUZAooLSBpZi9lbGlmL2Vsc2Ugc3RhdGVtZW50cykgVGoKRVQKQlQKL0YxIDExIFRmCjcwIDIyMCBUZAooLSBmb3IgbG9vcHMKRVQKQlQKL0YxIDExIFRmCjcwIDE5NSBUZAooLSB3aGlsZSBsb29wcykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoxIDAgb2JqCjw8L1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZwovUGFnZXMgMSAwIFIKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDg1NiAwMDAwMCBuIAowMDAwMDAwOTEzIDAwMDAwIG4gCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDE0NCAwMDAwMCBuIAowMDAwMDAwNzU2IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2Ci9Sb290IDIgMCBSCj4+CnN0YXJ0eHJlZgo5NjIKJSVFT0YK',
            fileType: 'application/pdf'
        },
        { title: "Programming With 'C'", author: 'Gottfried' },
        { title: 'Fundamentals of Computers', author: 'V. Rajaraman' },
        { title: 'IBM PC & Clones', author: 'Govindarajulu' },
        { title: 'Introduction to Computers', author: 'Subramanyan' },
        { title: 'Digital Electronics & Introduction to Microprocessor', author: 'Kamat' },
        { title: 'Digital Fundamentals', author: 'Floyd' },
        { title: 'Digital Principles & Applications', author: 'Malvino' },
        { title: 'Microprocessors', author: 'Gaonkar' },
        { title: 'Computer Organisation & Architecture', author: 'Stallings' },
        { title: 'Java Programming Language', author: 'Arnold' },
        { title: 'Computer Networks', author: 'Tanenbaum' },
        { title: 'Operating Systems Concepts', author: 'Galvin' },
        { title: 'Database System Concepts', author: 'Korth' },
        { title: 'Let Us C', author: 'Kanetkar' },
        { title: 'Data Structures Using C', author: 'Tanenbaum' }
    ],
    'mechanical': [
        { title: 'Thermal Engineering in SI Units', author: 'P.L. Ballaney' },
        { title: 'A Textbook of Mechanical Technology', author: 'R.S. Khurmi' },
        { title: 'Theory of Machines', author: 'R.S. Khurmi & J.K. Gupta' },
        { title: 'Production Technology', author: 'R.K. Jain' },
        { title: 'Engineering Drawing Vol.I', author: 'K.R. Gopalakrishna' },
        { title: 'A Textbook of Hydraulics & Fluid Mechanics', author: 'R.S. Khurmi' },
        { title: 'Workshop Technology Vol.I', author: 'Hajra Choudhury' },
        { title: 'Workshop Technology Vol.II', author: 'Hajra Choudhury' },
        { title: 'Machine Design', author: 'R.S. Khurmi' },
        { title: 'Strength of Materials', author: 'R.K. Bansal' },
        { title: 'Refrigeration & Air Conditioning', author: 'P.L. Ballaney' },
        { title: 'Internal Combustion Engines', author: 'Mathur' },
        { title: 'CAD/CAM', author: 'Groover' },
        { title: 'Mechatronics', author: 'Bolton' },
        { title: 'CNC Machines', author: 'Pabla' }
    ],
    'mining': [
        { title: 'Mine Environment and Ventilation', author: 'G.B. Misra' },
        { title: 'Mine Disasters and Mine Rescue', author: 'M.A. Ramulu' },
        { title: 'Numerical Problems on Mine Ventilation', author: 'L.C. Kaku' },
        { title: 'Elements of Mining Technology Vol.I', author: 'D.J. Deshmukh' },
        { title: 'Elements of Mining Technology Vol.II', author: 'D.J. Deshmukh' },
        { title: 'Elements of Mining Technology Vol.III', author: 'D.J. Deshmukh' },
        { title: 'Modern Coal Mining Technology', author: 'S.K. Das' },
        { title: 'Surface Mining Technology', author: 'S.K. Das' },
        { title: 'Underground Winning of Coal', author: 'T.N. Singh' },
        { title: 'Explosion & Blasting Practices in Mines', author: 'S.K. Das' },
        { title: 'Mine Surveying & Levelling Vol.I', author: 'S. Ghatak' },
        { title: 'Mine Surveying & Levelling Vol.II', author: 'S. Ghatak' },
        { title: 'SME Mining Engineering Handbook', author: 'Howard L. Hartman' },
        { title: 'Underground Mining Methods Handbook', author: 'W.A. Hustrulid' },
        { title: 'Introductory Mining Engineering', author: 'Hartman' }
    ]
};

// Initialize books in database
async function initializeBooks() {
    try {
        const existingBooks = await window.dbModule.dbGetAll('books');

        // Always initialize if no books exist
        if (existingBooks.length === 0) {
            console.log('No books found, initializing sample books...');

            let bookId = 1;

            for (const [department, books] of Object.entries(DEPARTMENT_BOOKS)) {
                for (const book of books) {
                    await window.dbModule.dbAdd('books', {
                        id: bookId++,
                        title: book.title,
                        author: book.author,
                        image: generateBookCover(book.title, department),
                        department: department,
                        description: book.description || `A comprehensive book on ${book.title} for ${department} students.`,
                        fileData: book.fileData || null,
                        fileType: book.fileType || null,
                        addedAt: new Date().toISOString()
                    });
                }
            }
            console.log('Books initialized in database with SVG covers');
        } else {
            console.log(`Found ${existingBooks.length} existing books in database`);
        }
    } catch (error) {
        console.error('Error initializing books:', error);
    }
}

// Get all books
async function getAllBooks() {
    try {
        return await window.dbModule.dbGetAll('books');
    } catch (error) {
        console.error('Error getting books:', error);
        return [];
    }
}

// Get books by department
async function getBooksByDepartment(department) {
    try {
        return await window.dbModule.dbGetByIndex('books', 'department', department);
    } catch (error) {
        console.error('Error getting books by department:', error);
        return [];
    }
}

// Get book by ID
async function getBookById(id) {
    try {
        return await window.dbModule.dbGet('books', id);
    } catch (error) {
        console.error('Error getting book:', error);
        return null;
    }
}

// Get borrowing history
async function getBorrowingHistory() {
    try {
        return await window.dbModule.dbGetAll('borrowingHistory');
    } catch (error) {
        console.error('Error getting borrowing history:', error);
        return [];
    }
}

// Get student's borrowing history
async function getStudentHistory(studentId) {
    try {
        return await window.dbModule.dbGetByIndex('borrowingHistory', 'studentId', studentId);
    } catch (error) {
        console.error('Error getting student history:', error);
        return [];
    }
}

// Check if book is currently borrowed
async function isBookBorrowed(bookId) {
    try {
        const history = await getBorrowingHistory();
        return history.some(record => record.bookId === bookId && record.status === 'active');
    } catch (error) {
        console.error('Error checking book status:', error);
        return false;
    }
}

// Get who borrowed the book
async function getBookBorrower(bookId) {
    try {
        const history = await getBorrowingHistory();
        const record = history.find(r => r.bookId === bookId && r.status === 'active');
        return record || null;
    } catch (error) {
        console.error('Error getting book borrower:', error);
        return null;
    }
}

// Calculate due date (15 days from borrow date)
function calculateDueDate(borrowDate) {
    const due = new Date(borrowDate);
    due.setDate(due.getDate() + BORROWING_DAYS);
    return due.toISOString();
}

// Check if book is overdue
function isOverdue(dueDate) {
    return new Date() > new Date(dueDate);
}

// Calculate days remaining or overdue
function getDaysStatus(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { overdue: true, days: Math.abs(diffDays) };
    }
    return { overdue: false, days: diffDays };
}

// Borrow a book
async function borrowBook(bookId, studentData) {
    try {
        const borrowed = await isBookBorrowed(bookId);
        if (borrowed) {
            return { success: false, message: 'This book is already borrowed by someone.' };
        }

        const book = await getBookById(bookId);
        if (!book) {
            return { success: false, message: 'Book not found.' };
        }

        const borrowDate = new Date().toISOString();
        const dueDate = calculateDueDate(borrowDate);

        const borrowRecord = {
            bookId: bookId,
            bookTitle: book.title,
            bookDepartment: book.department,
            studentId: studentData.studentId,
            studentName: studentData.name,
            studentEmail: studentData.email,
            studentDepartment: studentData.department,
            borrowDate: borrowDate,
            dueDate: dueDate,
            returnDate: null,
            status: 'active'
        };

        await window.dbModule.dbAdd('borrowingHistory', borrowRecord);

        return {
            success: true,
            message: `Book borrowed successfully! Due date: ${formatDate(dueDate)}`,
            dueDate: dueDate
        };
    } catch (error) {
        console.error('Error borrowing book:', error);
        return { success: false, message: 'Failed to borrow book. Please try again.' };
    }
}

// Return a book
async function returnBook(recordId) {
    try {
        const history = await getBorrowingHistory();
        const record = history.find(r => r.id === recordId);

        if (!record) {
            return { success: false, message: 'Record not found.' };
        }

        record.returnDate = new Date().toISOString();
        record.status = 'returned';

        await window.dbModule.dbPut('borrowingHistory', record);

        return { success: true, message: 'Book returned successfully!' };
    } catch (error) {
        console.error('Error returning book:', error);
        return { success: false, message: 'Failed to return book. Please try again.' };
    }
}

// Get currently borrowed books for a student
async function getStudentCurrentBooks(studentId) {
    try {
        const history = await getStudentHistory(studentId);
        return history.filter(record => record.status === 'active');
    } catch (error) {
        console.error('Error getting student current books:', error);
        return [];
    }
}

// Get all active borrowings
async function getAllActiveBorrowings() {
    try {
        const history = await getBorrowingHistory();
        return history.filter(record => record.status === 'active');
    } catch (error) {
        console.error('Error getting active borrowings:', error);
        return [];
    }
}

// Get student statistics
async function getStudentStats(studentId) {
    try {
        const history = await getStudentHistory(studentId);
        const totalBorrowed = history.length;
        const currentlyHolding = history.filter(r => r.status === 'active').length;
        const overdue = history.filter(r => r.status === 'active' && isOverdue(r.dueDate)).length;

        return {
            totalBorrowed,
            currentlyHolding,
            overdue
        };
    } catch (error) {
        console.error('Error getting student stats:', error);
        return { totalBorrowed: 0, currentlyHolding: 0, overdue: 0 };
    }
}

// Format date for display
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format time for display
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date and time
function formatDateTime(isoString) {
    return `${formatDate(isoString)} at ${formatTime(isoString)}`;
}

// Get department name
function getDepartmentName(departmentId) {
    const departments = getDepartments();
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : departmentId;
}
