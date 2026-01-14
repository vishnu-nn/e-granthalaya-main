// ===== Database Module (IndexedDB) =====

const DB_NAME = 'eGranthalayaDB';
const DB_VERSION = 2; // Incremented to add deletedBooks store
let db = null;

// Initialize IndexedDB
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open database');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Students store
            if (!database.objectStoreNames.contains('students')) {
                const studentsStore = database.createObjectStore('students', { keyPath: 'studentId' });
                studentsStore.createIndex('email', 'email', { unique: true });
                studentsStore.createIndex('department', 'department', { unique: false });
            }

            // Books store
            if (!database.objectStoreNames.contains('books')) {
                const booksStore = database.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
                booksStore.createIndex('department', 'department', { unique: false });
                booksStore.createIndex('title', 'title', { unique: false });
            }

            // Borrowing History store
            if (!database.objectStoreNames.contains('borrowingHistory')) {
                const historyStore = database.createObjectStore('borrowingHistory', { keyPath: 'id', autoIncrement: true });
                historyStore.createIndex('studentId', 'studentId', { unique: false });
                historyStore.createIndex('bookId', 'bookId', { unique: false });
                historyStore.createIndex('status', 'status', { unique: false });
            }

            // Deleted Books store (new in version 2)
            if (!database.objectStoreNames.contains('deletedBooks')) {
                const deletedBooksStore = database.createObjectStore('deletedBooks', { keyPath: 'id', autoIncrement: true });
                deletedBooksStore.createIndex('department', 'department', { unique: false });
                deletedBooksStore.createIndex('title', 'title', { unique: false });
                deletedBooksStore.createIndex('deletedAt', 'deletedAt', { unique: false });
            }

            console.log('Database schema created/updated');
        };
    });
}

// Generic database operations
function dbAdd(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbPut(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbGet(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbGetAll(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbGetByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function dbDelete(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function dbClear(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Check if database is initialized
function isDatabaseReady() {
    return db !== null;
}

// Export for use in other modules
window.dbModule = {
    initDatabase,
    dbAdd,
    dbPut,
    dbGet,
    dbGetAll,
    dbGetByIndex,
    dbDelete,
    dbClear,
    isDatabaseReady
};
