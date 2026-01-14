// API Integration Bridge - Makes existing code use the backend API
// This file bridges the old IndexedDB code with the new API calls

// Override database functions to use API instead
(function () {
    // Wait for API to be available
    if (typeof API === 'undefined') {
        console.error('API not loaded! Make sure api.js is included before this file.');
        return;
    }

    // Store original functions
    const original = {
        getAllBooks: window.dbModule ? window.dbModule.dbGetAll : null,
        addBook: window.dbModule ? window.dbModule.dbAdd : null
    };

    // Override getAllBooks to use API
    async function getAllBooks() {
        console.log('📡 Fetching books from API...');
        try {
            const books = await API.getBooks();
            console.log(`✅ Loaded ${books.length} books from server`);
            return books;
        } catch (error) {
            console.error('Error loading books from API:', error);
            // Fallback to IndexedDB if available
            if (original.getAllBooks && window.dbModule) {
                return await window.dbModule.dbGetAll('books');
            }
            return [];
        }
    }

    // Override addBook to use API
    async function addBook(bookData) {
        console.log('📡 Adding book via API...');
        try {
            const result = await API.addBook(bookData);
            if (result.success) {
                console.log('✅ Book added successfully');
                // Trigger refresh event
                window.dispatchEvent(new CustomEvent('bookAdded', { detail: result }));
            }
            return result.bookId;
        } catch (error) {
            console.error('Error adding book via API:', error);
            // Fallback to IndexedDB if available
            if (original.addBook && window.dbModule) {
                return await window.dbModule.dbAdd('books', bookData);
            }
            throw error;
        }
    }

    // Make functions globally available
    window.getAllBooks = getAllBooks;
    window.addBook = addBook;

    // Also update dbModule if it exists
    if (window.dbModule) {
        window.dbModule.dbGetAll = async function (store) {
            if (store === 'books') {
                return await getAllBooks();
            }
            // For other stores, use original functionality
            return original.getAllBooks ? await original.getAllBooks(store) : [];
        };

        window.dbModule.dbAdd = async function (store, data) {
            if (store === 'books') {
                return await addBook(data);
            }
            // For other stores, use original functionality
            return original.addBook ? await original.addBook(store, data) : null;
        };
    }

    console.log('✅ API bridge installed - Books will sync via server!');
    console.log('   Admin uploads → Server → All students see it!');

    // Auto-refresh books every 5 seconds when viewing
    let refreshInterval = null;

    // Start auto-refresh when books tab is active
    window.startBookSync = function () {
        if (refreshInterval) return; // Already running

        refreshInterval = setInterval(async () => {
            // Check if we're on books tab
            const booksTab = document.getElementById('booksGrid');
            if (booksTab && booksTab.offsetParent !== null) {
                console.log('🔄 Auto-refreshing books from server...');
                const isAdmin = API.isAdmin();
                if (typeof loadBooksGrid === 'function') {
                    await loadBooksGrid(isAdmin);
                }
            }
        }, 5000); // Every 5 seconds

        console.log('✅ Auto-sync enabled - Books refresh every 5 seconds');
    };

    //Stop auto-refresh
    window.stopBookSync = function () {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            console.log('⏸️ Auto-sync stopped');
        }
    };

    // Start auto-sync when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => window.startBookSync(), 2000);
        });
    } else {
        setTimeout(() => window.startBookSync(), 2000);
    }

})();
