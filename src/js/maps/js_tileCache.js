/* ********************************************************************************
*   Tile cache provider
*
*   IndexedDB-backed, cache-first tile store for Leaflet raster tile layers.
*   Design mirrors the ImageCache used by github.com/HefnySco/Mavlink3DMap
*   (frontend/src/js/js_image_cache.js): tiles are fetched as Blobs, persisted
*   in an IndexedDB object store keyed by `${providerId}_${z}_${x}_${y}`, and
*   evicted least-recently-used once the tile count exceeds MAX_TILES.
*
*   Goals: fewer repeated tile requests (bandwidth/cost), resilience on
*   spotty connections (previously-seen tiles stay available), and faster
*   reloads of the same area.
*
*   Tiles are fetched via `fetch()` so the cache can read the response body,
*   which requires the tile server to allow CORS. If the fetch fails (CORS,
*   network, disabled feature, IndexedDB unavailable), fn_getTile resolves to
*   null and the caller is expected to fall back to loading the tile URL
*   directly (uncached) so a misconfigured/CORS-restricted tile source never
*   breaks the map.
*
*********************************************************************************** */

import * as js_siteConfig from '../js_siteConfig.js';

const DB_NAME = 'DroneEngageTileCache';
const DB_VERSION = 1;
const STORE_TILES = 'tiles';
const STORE_META = 'metadata';
const LRU_KEY = 'lru';
const DEFAULT_MAX_TILES = 2000;

class CTileCache {

    constructor() {
        this.m_db = null;
        this.m_dbPromise = null;
        // Counters so we can tell, from the console, whether the IndexedDB
        // cache is actually shortcutting network requests - the browser's
        // own HTTP/disk cache (what you see as "(disk cache)" in devtools
        // Network panel) is a separate, independent layer and will still
        // show tiles as cached there even when this cache is a MISS.
        this.m_stats = { hits: 0, misses: 0, bypassed: 0, errors: 0 };
    }

    static getInstance() {
        if (!CTileCache.m_instance) {
            CTileCache.m_instance = new CTileCache();
        }
        return CTileCache.m_instance;
    }

    fn_isEnabled() {
        return (js_siteConfig.CONST_MAP_TILE_CACHE?.ENABLED !== false) && (typeof indexedDB !== 'undefined');
    }

    fn_getMaxTiles() {
        return js_siteConfig.CONST_MAP_TILE_CACHE?.MAX_TILES ?? DEFAULT_MAX_TILES;
    }

    #fn_initDB() {
        if (this.m_dbPromise) return this.m_dbPromise;

        this.m_dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_TILES)) {
                    db.createObjectStore(STORE_TILES, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(STORE_META)) {
                    db.createObjectStore(STORE_META);
                }
            };
            request.onsuccess = (event) => {
                this.m_db = event.target.result;
                resolve(this.m_db);
            };
            request.onerror = (event) => {
                console.error('[tileCache] IndexedDB initialization failed:', event.target.error);
                reject(event.target.error);
            };
        });

        return this.m_dbPromise;
    }

    /**
     * Cache-first tile fetch.
     * @param {string} p_url - tile URL to fetch on a cache miss
     * @param {string} p_providerId - identifies the tile source so different
     *        basemaps don't collide on the same z/x/y (e.g. 'leaflet-basemap')
     * @param {number} p_z
     * @param {number} p_x
     * @param {number} p_y
     * @returns {Promise<string|null>} an object URL to assign to `<img>.src`
     *          (caller must release it via fn_releaseTileUrl once removed),
     *          or null if the caller should fall back to loading p_url directly.
     */
    async fn_getTile(p_url, p_providerId, p_z, p_x, p_y) {
        if (!this.fn_isEnabled()) {
            this.m_stats.bypassed++;
            return null;
        }

        try {
            await this.#fn_initDB();
        } catch {
            this.m_stats.errors++;
            return null;
        }

        const key = `${p_providerId}_${p_z}_${p_x}_${p_y}`;

        const cachedBlob = await this.#fn_readTile(key);
        if (cachedBlob) {
            this.#fn_touchLru(key);
            this.m_stats.hits++;
            return URL.createObjectURL(cachedBlob);
        }

        let blob;
        try {
            const response = await fetch(p_url, { mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            blob = await response.blob();
        } catch {
            this.m_stats.errors++;
            return null;
        }

        this.m_stats.misses++;

        this.#fn_writeTile(key, blob).catch((error) => {
            console.warn('[tileCache] Failed to persist tile:', key, error);
        });

        return URL.createObjectURL(blob);
    }

    fn_getHitRatePct() {
        const total = this.m_stats.hits + this.m_stats.misses;
        return total === 0 ? 0 : Math.round((this.m_stats.hits / total) * 100);
    }

    fn_getStats() {
        return { ...this.m_stats, hitRatePct: this.fn_getHitRatePct() };
    }

    fn_releaseTileUrl(p_objectUrl) {
        if (p_objectUrl) {
            URL.revokeObjectURL(p_objectUrl);
        }
    }

    async clearCache() {
        if (this.m_db) {
            this.m_db.close();
            this.m_db = null;
        }
        this.m_dbPromise = null;

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
            request.onblocked = () => reject(new Error('Tile cache deletion blocked.'));
        });
    }

    #fn_readTile(p_key) {
        return new Promise((resolve) => {
            const tx = this.m_db.transaction([STORE_TILES], 'readonly');
            const store = tx.objectStore(STORE_TILES);
            const request = store.get(p_key);
            request.onsuccess = () => resolve(request.result?.blob ?? null);
            request.onerror = () => resolve(null);
        });
    }

    // Fire-and-forget LRU bump on a cache hit.
    #fn_touchLru(p_key) {
        try {
            const tx = this.m_db.transaction([STORE_META], 'readwrite');
            const metaStore = tx.objectStore(STORE_META);
            const lruRequest = metaStore.get(LRU_KEY);
            lruRequest.onsuccess = () => {
                let lruList = Array.isArray(lruRequest.result) ? lruRequest.result : [];
                lruList = [p_key, ...lruList.filter(k => k !== p_key)];
                metaStore.put(lruList, LRU_KEY);
            };
        } catch (error) {
            console.warn('[tileCache] LRU update skipped:', error);
        }
    }

    #fn_writeTile(p_key, p_blob) {
        return new Promise((resolve, reject) => {
            const tx = this.m_db.transaction([STORE_TILES, STORE_META], 'readwrite');
            const tileStore = tx.objectStore(STORE_TILES);
            const metaStore = tx.objectStore(STORE_META);

            tileStore.put({ key: p_key, blob: p_blob });

            const lruRequest = metaStore.get(LRU_KEY);
            lruRequest.onsuccess = () => {
                let lruList = Array.isArray(lruRequest.result) ? lruRequest.result : [];
                lruList = [p_key, ...lruList.filter(k => k !== p_key)];

                const maxTiles = this.fn_getMaxTiles();
                while (lruList.length > maxTiles) {
                    const evictKey = lruList.pop();
                    if (evictKey) tileStore.delete(evictKey);
                }
                metaStore.put(lruList, LRU_KEY);
            };

            tx.oncomplete = () => resolve();
            tx.onerror = (event) => reject(event.target.error);
        });
    }
}

export const js_tileCache = CTileCache.getInstance();

// Expose for manual inspection from the browser console, e.g.
// window.__tileCache.fn_getStats() -> { hits, misses, bypassed, errors, hitRatePct }
if (typeof window !== 'undefined') {
    window.__tileCache = js_tileCache;
}
