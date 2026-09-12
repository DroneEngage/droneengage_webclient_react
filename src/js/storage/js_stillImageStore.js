/**
 * Still Image Store — IndexedDB-backed session storage for still images
 * received from drone camera modules.
 *
 * Images are stored as Blobs with metadata (partyId, timestamp, lat, lng,
 * alt, description). They persist for the browser session until explicitly
 * cleared via fn_clearImages(). The store dispatches EE_stillImagesChanged
 * via js_eventEmitter whenever images are added or cleared, so subscribed
 * UI components (e.g. ClssCameraDialog) can refresh their gallery.
 *
 * Usage:
 *   import { js_stillImageStore } from './js_stillImageStore.js';
 *   js_stillImageStore.fn_addImage(partyId, blob, { lat, lng, alt });
 *   const images = await js_stillImageStore.fn_getImages(partyId);
 *   js_stillImageStore.fn_clearImages(partyId);
 */

import { EVENTS as js_event } from '../events/js_eventList.js';
import { js_eventEmitter } from '../events/js_eventEmitter.js';

const DB_NAME = 'de_still_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let _db = null;
let _initPromise = null;

/**
 * Open (or create) the IndexedDB database. Returns a promise that
 * resolves to the IDBDatabase instance. Subsequent calls return the
 * cached connection.
 */
function fn_initDB() {
    if (_db) return Promise.resolve(_db);
    if (_initPromise) return _initPromise;

    _initPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB not supported'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('partyId', 'partyId', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            _db = event.target.result;
            _initPromise = null;
            resolve(_db);
        };

        request.onerror = (event) => {
            _initPromise = null;
            reject(event.target.error);
        };
    });

    return _initPromise;
}

/**
 * Store a still image in IndexedDB and dispatch EE_stillImagesChanged.
 *
 * @param {string} partyId  — the unit party ID the image belongs to
 * @param {Blob}   blob     — the JPEG blob
 * @param {object}  [metadata] — { lat, lng, alt, description, timestamp }
 * @returns {Promise<number>} the auto-incremented id of the stored record
 */
async function fn_addImage(partyId, blob, metadata = {}) {
    const db = await fn_initDB();

    const record = {
        partyId: partyId || '',
        blob: blob,
        timestamp: metadata.timestamp || Date.now(),
        lat: metadata.lat || 0,
        lng: metadata.lng || 0,
        alt: metadata.alt || 0,
        description: metadata.description || '',
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(record);

        request.onsuccess = () => {
            const id = request.result;
            js_eventEmitter.fn_dispatch(js_event.EE_stillImagesChanged, {
                partyId: partyId,
                action: 'add',
                id: id,
            });
            resolve(id);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieve all still images for a given party ID, ordered by timestamp
 * ascending (oldest first).
 *
 * @param {string} partyId — the unit party ID (empty string for all)
 * @returns {Promise<Array<{id, partyId, blob, timestamp, lat, lng, alt, description}>>}
 */
async function fn_getImages(partyId) {
    const db = await fn_initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('partyId');
        const range = partyId ? IDBKeyRange.only(partyId) : null;
        const request = range ? index.getAll(range) : store.getAll();

        request.onsuccess = () => {
            const results = request.result || [];
            results.sort((a, b) => a.timestamp - b.timestamp);
            resolve(results);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Clear all still images for a given party ID (or all images if partyId
 * is falsy). Dispatches EE_stillImagesChanged.
 *
 * @param {string} [partyId] — unit party ID, or omit/null to clear all
 * @returns {Promise<void>}
 */
async function fn_clearImages(partyId) {
    const db = await fn_initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        let request;
        if (partyId) {
            const index = store.index('partyId');
            request = index.openCursor(IDBKeyRange.only(partyId));
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
        } else {
            request = store.clear();
        }

        tx.oncomplete = () => {
            js_eventEmitter.fn_dispatch(js_event.EE_stillImagesChanged, {
                partyId: partyId || '',
                action: 'clear',
            });
            resolve();
        };

        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Get the count of stored images for a party ID (or all if omitted).
 *
 * @param {string} [partyId]
 * @returns {Promise<number>}
 */
async function fn_getImageCount(partyId) {
    const db = await fn_initDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);

        if (partyId) {
            const index = store.index('partyId');
            const request = index.count(IDBKeyRange.only(partyId));
            request.onsuccess = () => resolve(request.result || 0);
            request.onerror = () => reject(request.error);
        } else {
            const request = store.count();
            request.onsuccess = () => resolve(request.result || 0);
            request.onerror = () => reject(request.error);
        }
    });
}

export const js_stillImageStore = {
    fn_addImage,
    fn_getImages,
    fn_clearImages,
    fn_getImageCount,
};
