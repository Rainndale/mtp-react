import { openDB } from 'idb';

const DB_NAME = 'Voyager_V4';
const STORE_NAME = 'expeditions';

const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

export const loadAllTrips = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const saveTrip = async (trip) => {
    const db = await initDB();
    return db.put(STORE_NAME, trip);
};

export const deleteTrip = async (id) => {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
};
