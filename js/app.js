// ===== Main Application Module =====

let currentBookToAction = null;
let currentRecordId = null;

// ===== Admin Dashboard =====
async function initAdminDashboard() {
    // Initialize database and books
    await window.dbModule.initDatabase();
    await initializeBooks();

    // Load data
    await loadBooksGrid(true);
    await loadBorrowingRecords();
    await loadStudentsList();
    await loadDeletedBooks();

    // Initialize file upload for Add Books tab
    initAddBooksTab();
}

// Load books grid
async function loadBooksGrid(isAdmin = false) {
    const books = await getAllBooks();
    const grid = document.getElementById('booksGrid');
    const user = getCurrentUser();

    if (books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">📚</div>
                <p>No books available in the library.</p>
            </div>
        `;
        return;
    }

    // Filter by department for students if needed
    let filteredBooks = books;
    const departmentFilter = document.getElementById('departmentFilter');
    if (departmentFilter && departmentFilter.value) {
        filteredBooks = books.filter(b => b.department === departmentFilter.value);
    }

    const bookCards = await Promise.all(filteredBooks.map(async (book) => {
        const isBorrowed = await isBookBorrowed(book.id);
        const borrower = isBorrowed ? await getBookBorrower(book.id) : null;

        let actionButton = '';
        let dueDateInfo = '';

        if (!isAdmin) {
            if (isBorrowed) {
                if (borrower && borrower.studentId === user.studentId) {
                    const daysStatus = getDaysStatus(borrower.dueDate);
                    dueDateInfo = `
                        <p class="due-date ${daysStatus.overdue ? 'overdue' : ''}">
                            ${daysStatus.overdue ?
                            `⚠️ Overdue by ${daysStatus.days} days` :
                            `📅 Due in ${daysStatus.days} days (${formatDate(borrower.dueDate)})`
                        }
                        </p>
                    `;
                    actionButton = `
                        <div class="book-actions">
                            <button class="btn btn-secondary" style="margin-bottom: 8px;" onclick="viewBookDetails(${book.id})">
                                👁️ Preview Book
                            </button>
                            <button class="btn btn-success" onclick="showReturnModal(${book.id}, ${borrower.id})">
                                Return Book
                            </button>
                        </div>
                    `;
                } else {
                    actionButton = `
                        <div class="book-actions">
                            <button class="btn btn-secondary" style="margin-bottom: 8px;" onclick="viewBookDetails(${book.id})">
                                👁️ Preview Book
                            </button>
                            <button class="btn btn-secondary" disabled>
                                Not Available
                            </button>
                        </div>
                    `;
                }
            } else {
                actionButton = `
                    <div class="book-actions">
                        <button class="btn btn-secondary" style="margin-bottom: 8px;" onclick="viewBookDetails(${book.id})">
                            👁️ Preview Book
                        </button>
                        <button class="btn btn-primary" onclick="showBorrowModal(${book.id})">
                            Borrow Book
                        </button>
                    </div>
                `;
            }
        }

        const deptName = getDepartmentName(book.department);
        const bookCover = book.image ?
            `<img src="${book.image}" alt="${book.title}" class="book-cover-image" onerror="this.onerror=null;this.src='https://via.placeholder.com/120x180?text=No+Cover';">` :
            `<div class="book-icon">📖</div>`;

        // Admin delete button
        const adminActions = isAdmin ? `
            <div class="book-admin-actions">
                <button class="btn-delete" onclick="showDeleteModal(${book.id})">
                    <span>🗑️</span> Remove
                </button>
            </div>
        ` : '';

        return `
            <div class="book-card" data-title="${book.title.toLowerCase()}" data-department="${book.department}">
                <button class="btn-view-corner" onclick="viewBookDetails(${book.id})" title="View Book Details">
                    👁️
                </button>
                <div class="book-department-badge">${book.department === 'computer-science' ? '💻' : book.department === 'mechanical' ? '⚙️' : '⛏️'} ${deptName}</div>
                ${bookCover}
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <span class="book-status ${isBorrowed ? 'borrowed' : 'available'}">
                    ${isBorrowed ? 'Borrowed' : 'Available'}
                </span>
                ${dueDateInfo}
                ${isBorrowed && isAdmin ? `<p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary);">Borrowed by: ${borrower.studentName}</p>` : ''}
                ${actionButton}
                ${adminActions}
            </div>
        `;
    }));

    grid.innerHTML = bookCards.join('');
}

// Filter books by search
function filterBooks() {
    const searchTerm = document.getElementById('bookSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.book-card');

    cards.forEach(card => {
        const title = card.dataset.title;
        if (title.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter books by department
async function filterByDepartment() {
    const isAdmin = isAdminLoggedIn();
    await loadBooksGrid(isAdmin);
}

// Load borrowing records for admin
async function loadBorrowingRecords() {
    const history = await getBorrowingHistory();
    const tbody = document.getElementById('recordsTableBody');
    const totalSpan = document.getElementById('totalBorrowings');

    if (totalSpan) {
        totalSpan.textContent = `${history.length} Total Borrowings`;
    }

    if (history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    No borrowing records yet.
                </td>
            </tr>
        `;
        return;
    }

    // Sort by date (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

    tbody.innerHTML = sortedHistory.map(record => {
        const daysStatus = record.status === 'active' ? getDaysStatus(record.dueDate) : null;
        let statusBadge = '';

        if (record.status === 'returned') {
            statusBadge = '<span class="status-badge returned">Returned</span>';
        } else if (daysStatus && daysStatus.overdue) {
            statusBadge = `<span class="status-badge overdue">Overdue (${daysStatus.days} days)</span>`;
        } else {
            statusBadge = `<span class="status-badge active">Active (${daysStatus ? daysStatus.days : 0} days left)</span>`;
        }

        return `
            <tr>
                <td><strong>${record.studentId}</strong></td>
                <td>${record.studentName}</td>
                <td>${getDepartmentName(record.studentDepartment)}</td>
                <td>${record.bookTitle}</td>
                <td>${formatDateTime(record.borrowDate)}</td>
                <td>${formatDate(record.dueDate)}</td>
                <td>${record.returnDate ? formatDateTime(record.returnDate) : '-'}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// Load students list for admin
async function loadStudentsList() {
    const students = await getAllStudents();
    const history = await getBorrowingHistory();
    const tbody = document.getElementById('studentsTableBody');
    const totalSpan = document.getElementById('totalStudents');
    const detailsContainer = document.getElementById('studentDetailsContainer');

    if (totalSpan) {
        totalSpan.textContent = `${students.length} Students`;
    }

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    No registered students yet.
                </td>
            </tr>
        `;
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">👨‍🎓</div>
                    <p>No students have logged in yet.</p>
                </div>
            `;
        }
        return;
    }

    // Generate table rows
    tbody.innerHTML = students.map(student => {
        const studentHistory = history.filter(r => r.studentId === student.studentId);
        const totalBorrowed = studentHistory.length;
        const returned = studentHistory.filter(r => r.status === 'returned').length;
        const currentlyHolding = studentHistory.filter(r => r.status === 'active').length;
        const overdue = studentHistory.filter(r => r.status === 'active' && isOverdue(r.dueDate)).length;

        return `
            <tr>
                <td><strong>${student.studentId}</strong></td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${getDepartmentName(student.department)}</td>
                <td>${student.lastLogin ? formatDateTime(student.lastLogin) : 'N/A'}</td>
                <td><span class="count-badge">${totalBorrowed}</span></td>
                <td><span class="count-badge success">${returned}</span></td>
                <td>
                    <span class="count-badge ${currentlyHolding > 0 ? 'warning' : ''}">${currentlyHolding}</span>
                    ${overdue > 0 ? `<span class="status-badge overdue" style="margin-left: 5px;">${overdue} overdue</span>` : ''}
                </td>
            </tr>
        `;
    }).join('');

    // Generate detailed student cards with book history
    if (detailsContainer) {
        detailsContainer.innerHTML = students.map(student => {
            const studentHistory = history.filter(r => r.studentId === student.studentId);

            if (studentHistory.length === 0) {
                return `
                    <div class="student-detail-card">
                        <div class="student-card-header">
                            <div class="student-avatar">👨‍🎓</div>
                            <div class="student-info">
                                <h3>${student.name}</h3>
                                <p>ID: ${student.studentId} | ${student.email}</p>
                                <p>Department: ${getDepartmentName(student.department)}</p>
                            </div>
                        </div>
                        <div class="student-books-empty">
                            <p>No books borrowed yet</p>
                        </div>
                    </div>
                `;
            }

            // Sort by date (newest first)
            const sortedHistory = [...studentHistory].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

            const borrowedBooks = sortedHistory.filter(r => r.status === 'active');
            const returnedBooks = sortedHistory.filter(r => r.status === 'returned');

            return `
                <div class="student-detail-card">
                    <div class="student-card-header">
                        <div class="student-avatar">👨‍🎓</div>
                        <div class="student-info">
                            <h3>${student.name}</h3>
                            <p>ID: ${student.studentId} | ${student.email}</p>
                            <p>Department: ${getDepartmentName(student.department)}</p>
                        </div>
                        <div class="student-stats-summary">
                            <div class="stat-box">
                                <span class="stat-num">${studentHistory.length}</span>
                                <span class="stat-text">Total</span>
                            </div>
                            <div class="stat-box borrowed">
                                <span class="stat-num">${borrowedBooks.length}</span>
                                <span class="stat-text">Holding</span>
                            </div>
                            <div class="stat-box returned">
                                <span class="stat-num">${returnedBooks.length}</span>
                                <span class="stat-text">Returned</span>
                            </div>
                        </div>
                    </div>
                    
                    ${borrowedBooks.length > 0 ? `
                    <div class="books-section">
                        <h4>📚 Currently Borrowed Books</h4>
                        <div class="books-list">
                            ${borrowedBooks.map(record => {
                const daysStatus = getDaysStatus(record.dueDate);
                return `
                                    <div class="book-item ${daysStatus.overdue ? 'overdue' : ''}">
                                        <span class="book-name">📖 ${record.bookTitle}</span>
                                        <span class="book-date">Borrowed: ${formatDate(record.borrowDate)}</span>
                                        <span class="book-due ${daysStatus.overdue ? 'overdue' : ''}">
                                            ${daysStatus.overdue ?
                        `⚠️ Overdue by ${daysStatus.days} days` :
                        `Due: ${formatDate(record.dueDate)} (${daysStatus.days} days left)`
                    }
                                        </span>
                                    </div>
                                `;
            }).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${returnedBooks.length > 0 ? `
                    <div class="books-section returned">
                        <h4>✅ Returned Books</h4>
                        <div class="books-list">
                            ${returnedBooks.map(record => `
                                <div class="book-item returned">
                                    <span class="book-name">📖 ${record.bookTitle}</span>
                                    <span class="book-date">Borrowed: ${formatDate(record.borrowDate)}</span>
                                    <span class="book-returned">Returned: ${formatDate(record.returnDate)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
}

// ===== Student Dashboard =====
async function initStudentDashboard() {
    // Initialize database and books
    await window.dbModule.initDatabase();
    await initializeBooks();

    const user = getCurrentUser();

    // Update UI with student info
    document.getElementById('studentName').textContent = user.name;
    document.getElementById('studentIdBadge').textContent = `👨‍🎓 ${user.studentId}`;

    // Load books
    await loadBooksGrid(false);

    // Load borrowed books
    await loadBorrowedBooks();

    // Load history
    await loadStudentHistoryTimeline();

    // Load profile
    await loadStudentProfile();
}

// Load student history as timeline
async function loadStudentHistoryTimeline() {
    const user = getCurrentUser();
    const history = await getStudentHistory(user.studentId);
    const container = document.getElementById('historyTimeline');
    const statsSpan = document.getElementById('myBorrowings');

    if (statsSpan) {
        statsSpan.textContent = `${history.length} Books Borrowed`;
    }

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📖</div>
                <p>You haven't borrowed any books yet.</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

    container.innerHTML = sortedHistory.map(record => {
        const daysStatus = record.status === 'active' ? getDaysStatus(record.dueDate) : null;
        let statusInfo = '';

        if (record.status === 'returned') {
            statusInfo = `<p style="color: var(--success-color);">✅ Returned on ${formatDateTime(record.returnDate)}</p>`;
        } else if (daysStatus && daysStatus.overdue) {
            statusInfo = `<p style="color: var(--highlight-color);">⚠️ Overdue by ${daysStatus.days} days!</p>`;
        } else {
            statusInfo = `<p style="color: var(--warning-color);">📅 Due in ${daysStatus ? daysStatus.days : 0} days (${formatDate(record.dueDate)})</p>`;
        }

        return `
            <div class="history-item">
                <div class="history-date">
                    <div class="date">${formatDate(record.borrowDate)}</div>
                    <div class="time">${formatTime(record.borrowDate)}</div>
                </div>
                <div class="history-content">
                    <h4>${record.bookTitle}</h4>
                    <p>Borrowed on ${formatDateTime(record.borrowDate)}</p>
                    <p>Due date: ${formatDate(record.dueDate)} (15 days)</p>
                    ${statusInfo}
                    <div class="history-status">
                        <span class="status-badge ${record.status === 'returned' ? 'returned' : (daysStatus && daysStatus.overdue ? 'overdue' : 'active')}">
                            ${record.status === 'returned' ? 'Returned' : (daysStatus && daysStatus.overdue ? 'Overdue' : 'Active')}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load student profile
async function loadStudentProfile() {
    const user = getCurrentUser();
    const stats = await getStudentStats(user.studentId);

    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileDepartment').textContent = user.departmentName || getDepartmentName(user.department);
    document.getElementById('profileId').textContent = `Student ID: ${user.studentId}`;
    document.getElementById('profileTotalBorrowed').textContent = stats.totalBorrowed;
    document.getElementById('profileCurrentlyHolding').textContent = stats.currentlyHolding;

    // Show overdue warning if any
    if (stats.overdue > 0) {
        document.getElementById('profileOverdue').textContent = stats.overdue;
        document.getElementById('overdueSection').style.display = 'block';
    }
}

// ===== Modals =====

// Show borrow modal
async function showBorrowModal(bookId) {
    const book = await getBookById(bookId);
    currentBookToAction = bookId;

    const modal = document.getElementById('borrowModal');
    const details = document.getElementById('modalBookDetails');

    const dueDate = calculateDueDate(new Date().toISOString());
    const bookCover = book.image ?
        `<img src="${book.image}" alt="${book.title}" style="width: 100px; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" onerror="this.onerror=null;this.innerHTML='📖';">` :
        `<div style="font-size: 4rem;">📖</div>`;

    details.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            ${bookCover}
            <h3 style="margin-top: 15px; margin-bottom: 10px;">${book.title}</h3>
            <p style="color: var(--text-secondary);">by ${book.author}</p>
            <p style="margin-top: 15px; padding: 10px; background: rgba(255,193,7,0.2); border-radius: 8px;">
                📅 <strong>Due date:</strong> ${formatDate(dueDate)} (15 days from today)
            </p>
        </div>
        <p style="text-align: center; margin-top: 20px;">
            Are you sure you want to borrow this book?
        </p>
    `;

    document.getElementById('confirmBorrowBtn').onclick = confirmBorrow;
    modal.classList.add('active');
}

// Close borrow modal
function closeModal() {
    document.getElementById('borrowModal').classList.remove('active');
    currentBookToAction = null;
}

// Confirm borrow
async function confirmBorrow() {
    const user = getCurrentUser();
    const result = await borrowBook(currentBookToAction, user);

    closeModal();

    if (result.success) {
        // Refresh the page content
        await loadBooksGrid(false);
        await loadStudentHistoryTimeline();
        await loadStudentProfile();

        // Show success message
        showNotification(result.message, 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// Show return modal
async function showReturnModal(bookId, recordId) {
    const book = await getBookById(bookId);
    currentBookToAction = bookId;
    currentRecordId = recordId;

    const modal = document.getElementById('returnModal');
    const details = document.getElementById('returnModalDetails');

    const bookCover = book.image ?
        `<img src="${book.image}" alt="${book.title}" style="width: 100px; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" onerror="this.onerror=null;this.innerHTML='📖';">` :
        `<div style="font-size: 4rem;">📖</div>`;

    details.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            ${bookCover}
            <h3 style="margin-top: 15px; margin-bottom: 10px;">${book.title}</h3>
            <p style="color: var(--text-secondary);">by ${book.author}</p>
        </div>
        <p style="text-align: center; margin-top: 20px;">
            Are you sure you want to return this book?
        </p>
    `;

    document.getElementById('confirmReturnBtn').onclick = confirmReturn;
    modal.classList.add('active');
}

// Close return modal
function closeReturnModal() {
    document.getElementById('returnModal').classList.remove('active');
    currentBookToAction = null;
    currentRecordId = null;
}

// Confirm return
async function confirmReturn() {
    const result = await returnBook(currentRecordId);

    closeReturnModal();

    if (result.success) {
        // Refresh the page content
        await loadBooksGrid(false);
        await loadStudentHistoryTimeline();
        await loadStudentProfile();

        // Show success message
        showNotification(result.message, 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// ===== Notifications =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        ${type === 'success' ? 'background: linear-gradient(135deg, #00c853, #00e676);' : ''}
        ${type === 'error' ? 'background: linear-gradient(135deg, #e94560, #ff6b6b);' : ''}
        ${type === 'info' ? 'background: linear-gradient(135deg, #667eea, #764ba2);' : ''}
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification animations to the page
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===== Add Books Functionality =====
let selectedBookFile = null;

// Initialize file upload event listeners
function initAddBooksTab() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('bookFileInput');

    if (!fileUploadArea || !fileInput) return;

    // Click to open file dialog
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag and drop handlers
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.remove('dragover');

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    // Load recently added books
    loadRecentlyAddedBooks();
}

// Handle file selection
function handleFileSelection(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/epub+zip'];
    const validExtensions = ['.pdf', '.epub'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        showAddBookMessage('Please select a PDF or EPUB file.', 'error');
        return;
    }

    selectedBookFile = file;

    // Show file info
    document.getElementById('selectedFileName').textContent = file.name;
    document.getElementById('selectedFileSize').textContent = formatFileSize(file.size);
    document.getElementById('selectedFileInfo').style.display = 'block';
    document.getElementById('fileUploadArea').style.display = 'none';

    // Show metadata form
    document.getElementById('bookMetadataForm').style.display = 'block';

    // Try to extract title from filename
    const titleFromFilename = file.name
        .replace(/\.(pdf|epub)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    document.getElementById('bookTitle').value = titleFromFilename;

    // Clear any previous messages
    hideAddBookMessage();
}

// Remove selected file
function removeSelectedFile() {
    selectedBookFile = null;
    document.getElementById('bookFileInput').value = '';
    document.getElementById('selectedFileInfo').style.display = 'none';
    document.getElementById('fileUploadArea').style.display = 'block';
    document.getElementById('bookMetadataForm').style.display = 'none';
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookDepartment').value = '';
    document.getElementById('bookCoverUrl').value = '';
    hideAddBookMessage();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add book to library
async function addBookToLibrary() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const department = document.getElementById('bookDepartment').value;
    const coverUrl = document.getElementById('bookCoverUrl').value.trim();

    // Validation
    if (!title) {
        showAddBookMessage('Please enter a book title.', 'error');
        return;
    }
    if (!author) {
        showAddBookMessage('Please enter an author name.', 'error');
        return;
    }
    if (!department) {
        showAddBookMessage('Please select a department.', 'error');
        return;
    }
    if (!selectedBookFile) {
        showAddBookMessage('Please select a book file.', 'error');
        return;
    }

    try {
        // Convert file to base64 for storage
        const fileData = await fileToBase64(selectedBookFile);

        // Create book object
        const newBook = {
            title: title,
            author: author,
            department: department,
            image: coverUrl || getDefaultCoverImage(department),
            fileName: selectedBookFile.name,
            fileSize: selectedBookFile.size,
            fileType: selectedBookFile.type || 'application/pdf',
            fileData: fileData,
            addedAt: new Date().toISOString(),
            addedBy: 'admin'
        };

        // Add to server database (permanent storage)
        const result = await API.addBook(newBook);

        if (result.success) {
            // Show success message
            showAddBookMessage(`✅ "${title}" has been added to the library permanently!`, 'success');

            // Reset form
            removeSelectedFile();

            // Refresh books grid and recently added
            await loadBooksGrid(true);
            await loadRecentlyAddedBooks();

            // Show notification
            showNotification(`Book "${title}" added to library!`, 'success');
        } else {
            showAddBookMessage(result.message || 'Failed to add book. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Error adding book:', error);
        showAddBookMessage('Failed to add book. Please try again.', 'error');
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Get default cover image based on department
function getDefaultCoverImage(department) {
    const defaultCovers = {
        'computer-science': 'https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg',
        'mechanical': 'https://covers.openlibrary.org/b/isbn/9780073398174-L.jpg',
        'mining': 'https://covers.openlibrary.org/b/isbn/9780873352642-L.jpg'
    };
    return defaultCovers[department] || '';
}

// Load recently added books
async function loadRecentlyAddedBooks() {
    const container = document.getElementById('recentlyAddedList');
    if (!container) return;

    try {
        const allBooks = await getAllBooks();

        // Sort by addedAt date and get last 5
        const recentBooks = allBooks
            .filter(b => b.addedAt)
            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
            .slice(0, 5);

        if (recentBooks.length === 0) {
            container.innerHTML = '<p class="empty-message">No books added recently</p>';
            return;
        }

        container.innerHTML = recentBooks.map(book => {
            const deptIcons = {
                'computer-science': '💻',
                'mechanical': '⚙️',
                'mining': '⛏️'
            };
            const icon = deptIcons[book.department] || '📚';

            return `
                <div class="recent-book-item">
                    <span class="recent-book-icon">📖</span>
                    <div class="recent-book-info">
                        <p class="recent-book-title">${book.title}</p>
                        <p class="recent-book-meta">by ${book.author}</p>
                    </div>
                    <span class="recent-book-dept">${icon}</span>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recently added books:', error);
        container.innerHTML = '<p class="empty-message">Error loading books</p>';
    }
}

// Show add book message
function showAddBookMessage(message, type) {
    const messageBox = document.getElementById('addBookMessage');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
    }
}

// Hide add book message
function hideAddBookMessage() {
    const messageBox = document.getElementById('addBookMessage');
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

// Initialize Add Books tab when switching to it
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on admin dashboard
    if (document.getElementById('addBooksTab')) {
        initAddBooksTab();
    }
});

// ===== Delete Book Functionality =====
let bookToDelete = null;

// Show delete confirmation modal
async function showDeleteModal(bookId) {
    const book = await getBookById(bookId);
    if (!book) {
        showNotification('Book not found.', 'error');
        return;
    }

    // Check if book is currently borrowed
    const isBorrowed = await isBookBorrowed(bookId);

    bookToDelete = bookId;

    const modal = document.getElementById('deleteBookModal');
    const details = document.getElementById('deleteModalDetails');

    const bookCover = book.image ?
        `<img src="${book.image}" alt="${book.title}" class="book-cover-preview" onerror="this.onerror=null;this.src='https://via.placeholder.com/100x150?text=No+Cover';">` :
        `<div style="font-size: 4rem; margin-bottom: 15px;">📖</div>`;

    let warningMessage = '';
    if (isBorrowed) {
        warningMessage = `
            <div class="delete-warning">
                <strong>⚠️ Warning:</strong> This book is currently borrowed by a student. 
                Removing it will also delete the borrowing record.
            </div>
        `;
    }

    details.innerHTML = `
        <div class="delete-book-info">
            ${bookCover}
            <h4>${book.title}</h4>
            <p class="book-author-preview">by ${book.author}</p>
            <p style="margin-top: 10px; color: var(--text-secondary); font-size: 0.9rem;">
                Department: ${getDepartmentName(book.department)}
            </p>
            ${warningMessage}
            <p style="margin-top: 20px; color: var(--text-secondary);">
                Are you sure you want to remove this book from the library?
            </p>
        </div>
    `;

    document.getElementById('confirmDeleteBtn').onclick = confirmDeleteBook;
    modal.classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
    const modal = document.getElementById('deleteBookModal');
    if (modal) {
        modal.classList.remove('active');
    }
    bookToDelete = null;
}

// Confirm delete book - moves to deleted books instead of permanent delete
async function confirmDeleteBook() {
    if (!bookToDelete) {
        closeDeleteModal();
        return;
    }

    try {
        const book = await getBookById(bookToDelete);
        if (!book) {
            closeDeleteModal();
            showNotification('Book not found.', 'error');
            return;
        }

        const bookTitle = book.title;

        // Check if book is borrowed and clean up borrowing records
        const isBorrowed = await isBookBorrowed(bookToDelete);
        if (isBorrowed) {
            // Get all borrowing history and remove records for this book
            const history = await getBorrowingHistory();
            const bookRecords = history.filter(r => r.bookId === bookToDelete);

            for (const record of bookRecords) {
                await window.dbModule.dbDelete('borrowingHistory', record.id);
            }
        }

        // Create a copy for deleted books store
        const deletedBook = {
            ...book,
            originalId: book.id,
            deletedAt: new Date().toISOString()
        };
        delete deletedBook.id; // Remove id so it gets auto-generated in deletedBooks store

        // Add to deleted books store locally
        await window.dbModule.dbAdd('deletedBooks', deletedBook);

        // Delete from active books
        if (window.API && window.API.deleteBook) {
            await window.API.deleteBook(bookToDelete);
        }
        await window.dbModule.dbDelete('books', bookToDelete);

        closeDeleteModal();

        // Refresh all grids
        await loadBooksGrid(true);
        await loadRecentlyAddedBooks();
        await loadBorrowingRecords();
        await loadDeletedBooks();

        // Show success notification
        showNotification(`"${bookTitle}" has been moved to Deleted Books.`, 'success');

    } catch (error) {
        console.error('Error deleting book:', error);
        closeDeleteModal();
        showNotification('Failed to delete book. Please try again.', 'error');
    }
}

// ===== Deleted Books Functionality =====

// Get all deleted books
async function getDeletedBooks() {
    try {
        return await window.dbModule.dbGetAll('deletedBooks');
    } catch (error) {
        console.error('Error getting deleted books:', error);
        return [];
    }
}

// Load deleted books grid
async function loadDeletedBooks() {
    const grid = document.getElementById('deletedBooksGrid');
    const totalSpan = document.getElementById('totalDeletedBooks');

    if (!grid) return;

    try {
        const deletedBooks = await getDeletedBooks();

        if (totalSpan) {
            totalSpan.textContent = `${deletedBooks.length} Deleted Books`;
        }

        if (deletedBooks.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🗑️</div>
                    <p>No deleted books yet</p>
                </div>
            `;
            return;
        }

        // Sort by deletion date (newest first)
        const sortedBooks = [...deletedBooks].sort((a, b) =>
            new Date(b.deletedAt) - new Date(a.deletedAt)
        );

        grid.innerHTML = sortedBooks.map(book => {
            const deptName = getDepartmentName(book.department);
            const deptIcon = book.department === 'computer-science' ? '💻' :
                book.department === 'mechanical' ? '⚙️' : '⛏️';

            const bookCover = book.image ?
                `<img src="${book.image}" alt="${book.title}" class="book-cover-image" onerror="this.onerror=null;this.src='https://via.placeholder.com/120x180?text=No+Cover';">` :
                `<div class="book-icon">📖</div>`;

            const deletedDate = book.deletedAt ? formatDate(book.deletedAt) : 'Unknown';

            return `
                <div class="deleted-book-card">
                    <span class="deleted-badge">🗑️ Deleted</span>
                    <div class="book-department-badge">${deptIcon} ${deptName}</div>
                    ${bookCover}
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <p class="deleted-date">Deleted on: ${deletedDate}</p>
                    <button class="btn-restore" onclick="restoreBook(${book.id})">
                        <span>♻️</span> Re-add to Library
                    </button>
                    <button class="btn-permanent-delete" onclick="permanentDeleteBook(${book.id})">
                        Delete Permanently
                    </button>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading deleted books:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">⚠️</div>
                <p>Error loading deleted books</p>
            </div>
        `;
    }
}

// Restore a deleted book
async function restoreBook(deletedBookId) {
    try {
        // Get the deleted book
        const deletedBook = await window.dbModule.dbGet('deletedBooks', deletedBookId);

        if (!deletedBook) {
            showNotification('Book not found in deleted books.', 'error');
            return;
        }

        const bookTitle = deletedBook.title;

        // Create book object for active books store
        const restoredBook = {
            title: deletedBook.title,
            author: deletedBook.author,
            department: deletedBook.department,
            image: deletedBook.image || '',
            fileName: deletedBook.fileName || '',
            fileSize: deletedBook.fileSize || 0,
            fileType: deletedBook.fileType || '',
            fileData: deletedBook.fileData || '',
            addedAt: new Date().toISOString(),
            restoredAt: new Date().toISOString()
        };

        // Add to active books
        await window.dbModule.dbAdd('books', restoredBook);

        // Remove from deleted books
        await window.dbModule.dbDelete('deletedBooks', deletedBookId);

        // Refresh grids
        await loadBooksGrid(true);
        await loadRecentlyAddedBooks();
        await loadDeletedBooks();

        // Show success notification
        showNotification(`"${bookTitle}" has been restored to the library!`, 'success');

    } catch (error) {
        console.error('Error restoring book:', error);
        showNotification('Failed to restore book. Please try again.', 'error');
    }
}

// Permanently delete a book
async function permanentDeleteBook(deletedBookId) {
    if (!confirm('Are you sure you want to permanently delete this book? This action cannot be undone.')) {
        return;
    }

    try {
        const deletedBook = await window.dbModule.dbGet('deletedBooks', deletedBookId);
        const bookTitle = deletedBook ? deletedBook.title : 'Book';

        // Remove from deleted books permanently
        await window.dbModule.dbDelete('deletedBooks', deletedBookId);

        // Refresh the deleted books grid
        await loadDeletedBooks();

        // Show notification
        showNotification(`"${bookTitle}" has been permanently deleted.`, 'success');

    } catch (error) {
        console.error('Error permanently deleting book:', error);
        showNotification('Failed to delete book permanently. Please try again.', 'error');
    }
}

// ===== Borrowed Books & Book Reader =====

// Load borrowed books for student
async function loadBorrowedBooks() {
    const grid = document.getElementById('borrowedBooksGrid');
    const statsSpan = document.getElementById('currentlyBorrowed');

    if (!grid) return;

    const user = getCurrentUser();
    if (!user) return;

    try {
        const borrowedRecords = await getStudentCurrentBooks(user.studentId);

        if (statsSpan) {
            statsSpan.textContent = `${borrowedRecords.length} Books Currently Borrowed`;
        }

        if (borrowedRecords.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📚</div>
                    <p>You haven't borrowed any books yet</p>
                    <p style="font-size: 0.9rem; margin-top: 10px; color: var(--text-secondary);">
                        Go to "All Books" to borrow your first book!
                    </p>
                </div>
            `;
            return;
        }

        const bookCards = await Promise.all(borrowedRecords.map(async (record) => {
            const book = await getBookById(record.bookId);
            const daysStatus = getDaysStatus(record.dueDate);
            const isOverdue = daysStatus.overdue;

            const bookCover = book && book.image ?
                `<img src="${book.image}" alt="${record.bookTitle}" class="book-cover-image" onerror="this.onerror=null;this.src='https://via.placeholder.com/120x180?text=No+Cover';">` :
                `<div class="book-icon">📖</div>`;

            const dueClass = isOverdue ? 'danger' : (daysStatus.days <= 3 ? 'warning' : '');
            const dueText = isOverdue
                ? `⚠️ Overdue by ${daysStatus.days} days!`
                : `📅 Due in ${daysStatus.days} days (${formatDate(record.dueDate)})`;

            return `
                <div class="borrowed-book-card ${isOverdue ? 'overdue' : ''}">
                    <span class="borrowed-status ${isOverdue ? 'overdue' : 'active'}">
                        ${isOverdue ? '⚠️ Overdue' : '✓ Active'}
                    </span>
                    ${bookCover}
                    <h3 class="book-title">${record.bookTitle}</h3>
                    <p class="book-author">by ${book ? book.author : 'Unknown Author'}</p>
                    <div class="due-info ${dueClass}">
                        ${dueText}
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px;">
                        Borrowed: ${formatDate(record.borrowDate)}
                    </p>
                    <button class="btn-read" onclick="openBookReader(${record.bookId}, ${record.id})">
                        <span>📖</span> Read Book
                    </button>
                    <button class="btn btn-success" style="margin-top: 10px; width: 100%;" onclick="showReturnModal(${record.bookId}, ${record.id})">
                        Return Book
                    </button>
                </div>
            `;
        }));

        grid.innerHTML = bookCards.join('');

    } catch (error) {
        console.error('Error loading borrowed books:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">⚠️</div>
                <p>Error loading borrowed books</p>
            </div>
        `;
    }
}

// Open book reader
async function openBookReader(bookId, recordId) {
    const book = await getBookById(bookId);
    const record = await getBookBorrower(bookId);

    if (!book) {
        showNotification('Book not found.', 'error');
        return;
    }

    const modal = document.getElementById('bookReaderModal');
    const titleEl = document.getElementById('readerBookTitle');
    const authorEl = document.getElementById('readerBookAuthor');
    const bodyEl = document.getElementById('readerBody');
    const dueDateEl = document.getElementById('readerDueDate');

    titleEl.textContent = book.title;
    authorEl.textContent = `by ${book.author}`;

    if (record) {
        const daysStatus = getDaysStatus(record.dueDate);
        dueDateEl.textContent = daysStatus.overdue
            ? `⚠️ Overdue by ${daysStatus.days} days!`
            : `📅 Due: ${formatDate(record.dueDate)} (${daysStatus.days} days left)`;
    }

    // Generate search query for external book sources
    const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
    const titleQuery = encodeURIComponent(book.title);

    // Check if book has file data (PDF)
    if (book.fileData && book.fileType === 'application/pdf') {
        // Convert Data URI to Blob to prevent 404 errors with long URIs
        try {
            const dataUri = book.fileData;
            const byteString = atob(dataUri.split(',')[1]);
            const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const blobUrl = URL.createObjectURL(blob);

            bodyEl.innerHTML = `
                <iframe src="${blobUrl}" style="width:100%; height:600px; border:none;"></iframe>
            `;
        } catch (e) {
            console.error("Error creating PDF blob:", e);
            // Fallback
            bodyEl.innerHTML = `
                <iframe src="${book.fileData}" type="application/pdf"></iframe>
            `;
        }
    } else {
        // Show book preview with external reading links
        const deptName = getDepartmentName(book.department);
        const deptIcon = book.department === 'computer-science' ? '💻' :
            book.department === 'mechanical' ? '⚙️' : '⛏️';

        bodyEl.innerHTML = `
            <div class="book-preview-content">
                <div style="text-align: center; margin-bottom: 25px;">
                    ${book.image ?
                `<img src="${book.image}" alt="${book.title}" style="max-height: 180px; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);" onerror="this.style.display='none';">` :
                `<div style="font-size: 4rem;">📚</div>`
            }
                </div>
                <h2>${book.title}</h2>
                <div class="book-meta">
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Department:</strong> ${deptIcon} ${deptName}</p>
                </div>
                
                <div class="read-online-section" style="margin-top: 25px; padding: 20px; background: #f0f9ff; border-radius: 12px;">
                    <h3 style="color: #1a1a2e; margin-bottom: 15px;">📖 Read This Book Online</h3>
                    <p style="color: #666; margin-bottom: 20px;">Click on any of the links below to read the full book:</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <a href="https://archive.org/search?query=${searchQuery}" target="_blank" 
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📚</span>
                            <div>
                                <strong>Internet Archive</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Free access to millions of books</p>
                            </div>
                        </a>
                        
                        <a href="https://www.google.co.in/books?q=${searchQuery}" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📕</span>
                            <div>
                                <strong>Google Books</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Preview and read books online</p>
                            </div>
                        </a>
                        
                        <a href="https://openlibrary.org/search?q=${searchQuery}" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📗</span>
                            <div>
                                <strong>Open Library</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Borrow and read digital books</p>
                            </div>
                        </a>
                        
                        <a href="https://www.google.com/search?q=${titleQuery}+filetype:pdf" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">🔎</span>
                            <div>
                                <strong>Google PDF Search</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Direct search for PDF files</p>
                            </div>
                        </a>
                        
                        <a href="https://libgen.is/search.php?req=${searchQuery}" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📖</span>
                            <div>
                                <strong>Library Genesis</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Academic books and articles</p>
                            </div>
                        </a>
                    </div>
                </div>
                
                <div class="book-description" style="margin-top: 25px;">
                    <h3>📚 About This Book</h3>
                    <p style="margin-top: 15px;">
                        You have borrowed "<strong>${book.title}</strong>" by <strong>${book.author}</strong>. 
                        Click on any of the links above to read the full content online.
                    </p>
                </div>
            </div>
        `;
    }

    modal.classList.add('active');
}

// Close book reader
function closeBookReader() {
    const modal = document.getElementById('bookReaderModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// View book details (preview without borrowing)
async function viewBookDetails(bookId) {
    const book = await getBookById(bookId);

    if (!book) {
        showNotification('Book not found.', 'error');
        return;
    }

    const modal = document.getElementById('bookReaderModal');
    const titleEl = document.getElementById('readerBookTitle');
    const authorEl = document.getElementById('readerBookAuthor');
    const bodyEl = document.getElementById('readerBody');
    const dueDateEl = document.getElementById('readerDueDate');

    if (!modal) {
        // If modal doesn't exist (admin page), show simple alert
        alert(`Book: ${book.title}\nAuthor: ${book.author}\nDepartment: ${getDepartmentName(book.department)}`);
        return;
    }

    titleEl.textContent = book.title;
    authorEl.textContent = `by ${book.author}`;

    // Check if book is borrowed
    const isBorrowed = await isBookBorrowed(bookId);
    const borrower = isBorrowed ? await getBookBorrower(bookId) : null;

    if (isBorrowed && borrower) {
        dueDateEl.textContent = `📕 Currently borrowed - Due: ${formatDate(borrower.dueDate)}`;
    } else {
        dueDateEl.textContent = '📗 Available for borrowing';
    }

    const deptName = getDepartmentName(book.department);
    const deptIcon = book.department === 'computer-science' ? '💻' :
        book.department === 'mechanical' ? '⚙️' : '⛏️';

    // Generate search query for external book sources
    const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
    const titleQuery = encodeURIComponent(book.title);

    // Check if book has file data (PDF)
    if (book.fileData && book.fileType === 'application/pdf') {
        bodyEl.innerHTML = `
            <iframe src="${book.fileData}" type="application/pdf"></iframe>
        `;
    } else {
        // Show book preview with external reading links
        bodyEl.innerHTML = `
            <div class="book-preview-content">
                <div style="text-align: center; margin-bottom: 30px;">
                    ${book.image ?
                `<img src="${book.image}" alt="${book.title}" style="max-height: 200px; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);" onerror="this.style.display='none';">` :
                `<div style="font-size: 5rem;">📚</div>`
            }
                </div>
                <h2>${book.title}</h2>
                <div class="book-meta">
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Department:</strong> ${deptIcon} ${deptName}</p>
                    <p><strong>Status:</strong> ${isBorrowed ? '📕 Currently Borrowed' : '📗 Available'}</p>
                </div>
                
                <div class="read-online-section" style="margin-top: 25px; padding: 20px; background: #f0f9ff; border-radius: 12px;">
                    <h3 style="color: #1a1a2e; margin-bottom: 15px;">📖 Read This Book Online</h3>
                    <p style="color: #666; margin-bottom: 20px;">Click on any of the links below to read the full book:</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <a href="https://archive.org/search?query=${searchQuery}" target="_blank" 
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📚</span>
                            <div>
                                <strong>Internet Archive</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Free access to millions of books</p>
                            </div>
                        </a>
                        
                        <a href="https://www.google.co.in/books?q=${searchQuery}" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📕</span>
                            <div>
                                <strong>Google Books</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Preview and read books online</p>
                            </div>
                        </a>
                        
                        <a href="https://openlibrary.org/search?q=${searchQuery}" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📗</span>
                            <div>
                                <strong>Open Library</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Borrow and read digital books</p>
                            </div>
                        </a>
                        
                        <a href="https://www.google.com/search?q=${titleQuery}+filetype:pdf" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">🔎</span>
                            <div>
                                <strong>Google PDF Search</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Direct search for PDF files</p>
                            </div>
                        </a>
                        
                        <a href="https://libgen.is/search.php?req=${searchQuery}" target="_blank"
                           style="display: flex; align-items: center; gap: 10px; padding: 15px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; border: 1px solid #e0e0e0; transition: all 0.3s;">
                            <span style="font-size: 1.5rem;">📖</span>
                            <div>
                                <strong>Library Genesis</strong>
                                <p style="font-size: 0.85rem; color: #666; margin: 0;">Academic books and articles</p>
                            </div>
                        </a>
                    </div>
                </div>
                
                <div class="book-description" style="margin-top: 25px;">
                    <h3>📚 About This Book</h3>
                    <p style="margin-top: 15px;">
                        "<strong>${book.title}</strong>" by <strong>${book.author}</strong> is an essential textbook 
                        for students in the ${deptName} department. This book covers fundamental concepts, 
                        practical applications, and advanced topics in the field.
                    </p>
                </div>
                
                <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffc107;">
                    <p style="color: #856404; font-size: 0.9rem; margin: 0;">
                        <strong>💡 Tip:</strong> If you can't find the book online, you can request the admin to upload 
                        the PDF version through the "Add Books" section.
                    </p>
                </div>
            </div>
        `;
    }

    modal.classList.add('active');
}

// ===== Cross-Tab Synchronization =====
// Listen for book list updates from other tabs (e.g., when admin adds a book)
window.addEventListener('storage', async function (e) {
    if (e.key === 'bookListUpdated') {
        console.log('Book list updated in another tab, refreshing...');

        // Check if we're on a student or admin dashboard
        const isAdmin = typeof isAdminLoggedIn === 'function' && isAdminLoggedIn();
        const isStudent = typeof isStudentLoggedIn === 'function' && isStudentLoggedIn();

        if (isStudent || isAdmin) {
            // Reload the books grid
            await loadBooksGrid(isAdmin);

            // Show notification to user
            const notification = document.createElement('div');
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 10px; color: white; font-weight: 500; z-index: 9999; background: linear-gradient(135deg, #667eea, #764ba2);';
            notification.textContent = '📚 Book list updated! New books available.';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
        }
    }
});
