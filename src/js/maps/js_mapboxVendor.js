/**
 * js_mapboxVendor.js — single point of contact with the Mapbox GL JS
 * vendor API.
 *
 * All `window.mapboxgl` global access and every `new mapboxgl.X(...)`
 * construction call site lives here, so a future SDK version bump or a
 * breaking API change is a one-file diff instead of a hunt through
 * js_map3d.js. The SDK version string exists exactly once
 * (MAPBOX_SDK_VERSION) instead of being duplicated across two CDN URLs.
 *
 * This is intentionally NOT a generic engine-agnostic map abstraction —
 * it only relocates the existing construction call sites. Method calls
 * on already-constructed Map/Marker/Popup instances (addControl,
 * fitBounds, setLngLat, once('idle', ...), etc.) stay in js_map3d.js.
 */

const MAPBOX_SDK_VERSION = 'v3.27.0';

/**
 * Dynamically loads Mapbox GL JS + CSS from the Mapbox CDN if not
 * already present. Moved verbatim from js_map3d.js fn_loadMapboxSdk;
 * the two hardcoded version strings are now built from
 * MAPBOX_SDK_VERSION.
 *
 * @returns {Promise<typeof window.mapboxgl>} the loaded global.
 */
export async function fn_loadMapboxSdk() {
    if (window.mapboxgl) return window.mapboxgl;

    const loadCSS = () => {
        const id = 'mapbox-gl-css';
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_SDK_VERSION}/mapbox-gl.css`;
        document.head.appendChild(link);
    };

    const loadJS = () => new Promise((resolve, reject) => {
        const id = 'mapbox-gl-js';
        if (document.getElementById(id)) {
            const el = document.getElementById(id);
            if (el.dataset.loaded) return resolve();
            el.addEventListener('load', () => { el.dataset.loaded = 'true'; resolve(); }, { once: true });
            el.addEventListener('error', () => reject(new Error('Failed to load Mapbox GL JS')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = id;
        script.src = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_SDK_VERSION}/mapbox-gl.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'));
        document.body.appendChild(script);
    });

    loadCSS();
    await loadJS();
    return window.mapboxgl;
}

/**
 * @returns {typeof window.mapboxgl | null} the loaded global, or null if
 *   the SDK has not been loaded yet.
 */
export function fn_getMapboxGl() {
    return window.mapboxgl || null;
}

/**
 * Sets the Mapbox access token on the loaded global. No-op if the SDK
 * is not yet loaded.
 * @param {string} token
 */
export function fn_setAccessToken(token) {
    if (window.mapboxgl) window.mapboxgl.accessToken = token;
}

/**
 * @param {object} options Mapbox Map constructor options.
 * @returns {mapboxgl.Map}
 */
export function fn_createMap(options) {
    return new window.mapboxgl.Map(options);
}

/**
 * @param {object} options Mapbox Marker constructor options.
 * @returns {mapboxgl.Marker}
 */
export function fn_createMarker(options) {
    return new window.mapboxgl.Marker(options);
}

/**
 * @param {object} options Mapbox Popup constructor options.
 * @returns {mapboxgl.Popup}
 */
export function fn_createPopup(options) {
    return new window.mapboxgl.Popup(options);
}

/**
 * @returns {mapboxgl.LngLatBounds}
 */
export function fn_createLngLatBounds() {
    return new window.mapboxgl.LngLatBounds();
}
