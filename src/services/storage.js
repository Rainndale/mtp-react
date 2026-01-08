const DB_NAME = 'Voyager_V4';
const STORE_NAME = 'expeditions';
const COLLAPSE_KEY = 'voyager_collapsed_days';
const THEME_KEY = 'voyager_theme';

let db = null;

export const initDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
    };
    request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
    };
    request.onerror = (event) => {
        console.error('DB Error', event.target.error);
        reject(event.target.error);
    };
});

export const saveToDB = (data) => {
    if (!db) return Promise.reject("DB not initialized");
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data);
    return new Promise((r) => tx.oncomplete = r);
};

export const deleteFromDB = (id) => {
    if (!db) return Promise.reject("DB not initialized");
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    return new Promise((r) => tx.oncomplete = r);
};

export const loadAll = () => new Promise((r) => {
    if (!db) { r([]); return; }
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    req.onsuccess = () => r(req.result);
});

export { COLLAPSE_KEY, THEME_KEY };
