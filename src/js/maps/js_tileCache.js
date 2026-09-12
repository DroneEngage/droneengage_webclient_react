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
*   LRU tracking: each tile record carries its own `lastAccessed` timestamp
*   (indexed), so a cache hit/write only ever touches ONE record. Eviction
*   runs a cursor scan over that index, and only when the store is actually
*   over its cap. This replaced an earlier design that kept a single
*   array-valued "LRU list" record and rewrote the whole array (up to
*   MAX_TILES entries) on every single tile touch — under a rapid zoom
*   gesture (dozens of tiles touched within ~1s), that meant dozens of
*   full-array IndexedDB transactions queued against the same object store
*   (writes to one store serialize), which was the main cause of the
*   "pauses when zooming in/out" this file was rewritten to fix.
*
*********************************************************************************** */

import * as js_siteConfig from '../config/js_siteConfig.js';

const DB_NAME = 'DroneEngageTileCache';
const DB_VERSION = 2; // v2: per-tile lastAccessed index replaces the v1 array-based LRU record
const STORE_TILES = 'tiles';
const STORE_META_LEGACY = 'metadata'; // v1 store name, dropped on upgrade
const DEFAULT_MAX_TILES = 2000;
// Eviction trims down to this fraction of MAX_TILES rather than deleting
// exactly one tile at a time, so it doesn't run on nearly every write once
// the cache is near capacity.
const EVICT_TARGET_RATIO = 0.9;

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
                // This is a pure cache (no data that must survive a schema
                // change), so a version bump resets it rather than migrating
                // rows into the new shape - simpler and avoids leaving old
                // records that predate the lastAccessed index invisible to
                // eviction's cursor scan.
                if (db.objectStoreNames.contains(STORE_META_LEGACY)) {
                    db.deleteObjectStore(STORE_META_LEGACY);
                }
                if (db.objectStoreNames.contains(STORE_TILES)) {
                    db.deleteObjectStore(STORE_TILES);
                }
                const tileStore = db.createObjectStore(STORE_TILES, { keyPath: 'key' });
                tileStore.createIndex('by_lastAccessed', 'lastAccessed');
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
     * Cache-first tile fetch, decode-decoupled from caching.
     *
     * Cache HIT: resolves with an object URL for the cached blob (fast, no
     * network) after a single-record IndexedDB read.
     *
     * Cache MISS: resolves to null right away (as soon as the IndexedDB
     * lookup comes back empty) so the caller falls back to loading p_url
     * directly - exactly as fast as an uncached tile load. The network
     * fetch + cache write for next time happens afterward, in the
     * background, and does not delay the caller's fallback. This matters
     * because zooming to a new level is mostly cache misses, and the
     * previous design awaited fetch()+blob() (which buffers the whole
     * image before the browser can even start decoding it, unlike a plain
     * `<img src>` which streams/decodes progressively) before the tile
     * could display at all - making a first-time load slower than having
     * no cache.
     *
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

        const cached = await this.#fn_readTile(key);
        if (cached) {
            this.m_stats.hits++;
            // Fire-and-forget: a single-record timestamp bump, not a
            // rewrite of every cached tile's key.
            this.#fn_touchLastAccessed(key, cached.blob);
            return URL.createObjectURL(cached.blob);
        }

        this.m_stats.misses++;
        // Fire-and-forget: fetch + cache in the background. The caller
        // already has its answer (null) and will load p_url directly.
        this.#fn_fetchAndCache(p_url, key).catch((error) => {
            console.warn('[tileCache] Background fetch/cache failed:', key, error);
        });

        return null;
    }

    async #fn_fetchAndCache(p_url, p_key) {
        let blob;
        try {
            const response = await fetch(p_url, { mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            blob = await response.blob();
        } catch {
            this.m_stats.errors++;
            return;
        }
        await this.#fn_writeTile(p_key, blob);
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
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    }

    // O(1) timestamp bump on a cache hit - replaces the old design where
    // every hit rewrote a shared array of up to MAX_TILES keys.
    #fn_touchLastAccessed(p_key, p_blob) {
        try {
            const tx = this.m_db.transaction([STORE_TILES], 'readwrite');
            tx.objectStore(STORE_TILES).put({ key: p_key, blob: p_blob, lastAccessed: Date.now() });
        } catch (error) {
            console.warn('[tileCache] lastAccessed touch skipped:', error);
        }
    }

    #fn_writeTile(p_key, p_blob) {
        return new Promise((resolve) => {
            const tx = this.m_db.transaction([STORE_TILES], 'readwrite');
            tx.objectStore(STORE_TILES).put({ key: p_key, blob: p_blob, lastAccessed: Date.now() });
            tx.oncomplete = () => {
                // Best-effort, non-blocking eviction check - never delays
                // the write itself resolving.
                this.#fn_maybeEvict().catch((error) => {
                    console.warn('[tileCache] Eviction pass failed:', error);
                });
                resolve();
            };
            tx.onerror = () => resolve(); // cache write is best-effort; never reject on the caller
        });
    }

    /**
     * Runs a batched LRU eviction pass via a cursor over the
     * by_lastAccessed index, only when the store is actually over its
     * configured cap - and trims down to EVICT_TARGET_RATIO of the cap
     * rather than evicting one tile at a time, so this doesn't run on
     * nearly every write once the cache is near capacity.
     */
    #fn_maybeEvict() {
        return new Promise((resolve, reject) => {
            const countTx = this.m_db.transaction([STORE_TILES], 'readonly');
            const countRequest = countTx.objectStore(STORE_TILES).count();
            countRequest.onsuccess = () => {
                const total = countRequest.result;
                const maxTiles = this.fn_getMaxTiles();
                if (total <= maxTiles) {
                    resolve();
                    return;
                }

                const target = Math.floor(maxTiles * EVICT_TARGET_RATIO);
                const toDelete = total - target;

                const evictTx = this.m_db.transaction([STORE_TILES], 'readwrite');
                const index = evictTx.objectStore(STORE_TILES).index('by_lastAccessed');
                let deleted = 0;
                index.openCursor().onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (!cursor || deleted >= toDelete) return;
                    cursor.delete();
                    deleted++;
                    cursor.continue();
                };
                evictTx.oncomplete = () => resolve();
                evictTx.onerror = (event) => reject(event.target.error);
            };
            countRequest.onerror = (event) => reject(event.target.error);
        });
    }
}

export const js_tileCache = CTileCache.getInstance();

// Expose for manual inspection from the browser console, e.g.
// window.__tileCache.fn_getStats() -> { hits, misses, bypassed, errors, hitRatePct }
if (typeof window !== 'undefined') {
    window.__tileCache = js_tileCache;
}
