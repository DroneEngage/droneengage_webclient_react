/**
 *
 * SITE Configuration File
 *
 * Auth: Mohammad Hefny
 *
 */

import { js_localStorage } from '../state/js_localStorage.js';


/**
 * Communication Server
 */


// Default Configuration
// NOTE: These values are overwritten at runtime by /public/config.json
// and /public/config.local.json (local has higher priority) via fn_loadConfig()/fn_applyRuntimeConfig().
export let CONST_TEST_MODE = false;
export let CONST_PROD_MODE_IP = 'airgap.local';
export let CONST_PROD_MODE_PORT = '19408';
export let CONST_TEST_MODE_IP = '127.0.0.1';
export let CONST_TEST_MODE_PORT = '19408';
export let CONST_TEST_MODE_ENABLE_LOG = true;
export let CONST_TITLE = 'Drone Engage';

export let CONST_WEBCONNECTOR_CONFIG = {
    ENABLED: true,
    AUTH_PORT: 9211,
    WS_PORT: 9212,
    APIKEY: 'your-secure-api-key-here',
    TOKEN: '',
    // Auto fallback to cloud login when plugin is unreachable (true=enable fallback, false=plugin only)
    AUTO_FALLBACK: false,
    BASE_PATH: ''
};

/**
 * Links that are used in Header
 */
export let CONST_HOME_URL = "https://cloud.ardupilot.org/";
export let CONST_MANUAL_URL = "https://cloud.ardupilot.org/";
export let CONST_FAQ_URL = "https://cloud.ardupilot.org/de-faq.html";
export let CONST_CONTACT_URL = "https://droneengage.com";
export let CONST_ANDRUAV_URL = "https://cloud.ardupilot.org/andruav-how-to-compile.html#apk-download";
export let CONST_ANDRUAV_URL_ENABLE = true;
export let CONST_ACCOUNT_URL_ENABLE = true;
export let CONST_DEBUG_CONTROL_PAGE = true;

export let CONST_WEBSOCKET_BRIDGE_PORT = 8812;

/**
 * WS authentication transport (security item 2.1).
 *
 * Credentials are always sent as a JSON auth frame (the first WS message after
 * onopen) instead of in the URL query string, which would leak into proxy/access
 * logs and browser history. The client waits for an auth-ack frame before
 * sending any other traffic.
 *
 * The auth frame format (client -> server, first message after open):
 *   {"ty":"s","mt":"de_auth","f":"<authKey>","s":"<partyID>","at":"g","k":"<apiKey?>"}
 * The auth-ack frame (server -> client):
 *   {"ty":"s","mt":"de_auth_ack","r":"ok"}   -- success
 *   {"ty":"s","mt":"de_auth_ack","r":"fail","em":"<reason>"}  -- failure (server then closes)
 *
 * NOTE: The WebConnector plugin runs on localhost and does not understand the
 * de_auth frame, so plugin mode still uses query-string auth (the localhost
 * leak risk is negligible).
 */

// CHOOSE YOUR MAP SOURCE
// The URL template carries its own auth query-param name via a {token}
// placeholder, so each provider can use its own param name (key=, api_key=,
// apikey=, apiKey=, access_token=, ...) without any extra config field.
// Legacy templates without {token} (e.g. "...?access_token=") still work -
// the token is appended. See fn_resolveTileUrl in js_leafletmap.js.
export let CONST_MAP_LEAFLET_ACCESS_TOKEN = "mapbox-YOUR-TOKEN-HERE";
export let CONST_MAP_LEAFLET_URL_MAP = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token={token}";
//export let CONST_MAP_LEAFLET_URL_MAP = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
//export let CONST_MAP_LEAFLET_URL_MAP = "https://airgap.local:88/sat_{x}_{y}_{z}.png"; // LOCAL MAP
//export let CONST_MAP_LEAFLET_URL_MAP = "https://api.maptiler.com/maps/satellite/{z}/{x}/{y}@2x.jpg?key={token}";
//export let CONST_MAP_LEAFLET_URL_MAP = "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}@2x.png?api_key={token}";





export let CONST_MAPBOX_3D_ACCESS_TOKEN = '';
export let CONST_MAPBOX_STYLE = 'mapbox://styles/mapbox/standard';

/**
 * IndexedDB-backed cache for Leaflet raster tiles (src/js/maps/js_tileCache.js).
 * Cache-first: reduces repeated tile requests, keeps previously-seen tiles
 * available offline, and speeds up reloads of the same area. Requires the
 * tile server to allow CORS (falls back to an uncached <img src> otherwise).
 * MAX_TILES caps the number of cached tiles (LRU eviction).
 */
export let CONST_MAP_TILE_CACHE = {
    ENABLED: true,
    MAX_TILES: 2000,
};

/**
 * Location of GCS are not sent over network. Only The existence of connected GCS are shared.
 */
export let CONST_DONT_BROADCAST_TO_GCSs = false;
export let CONST_DONT_BROADCAST_GCS_LOCATION = false;

export let CONST_MODULE_VERSIONS = {
    
    };


/**
 * This is for disable features.
 * If a feature is not explicitly mentioned or has a value of true, it is considered to be enabled.
 */
export let CONST_FEATURE = {
    DISABLE_AISStream: false,
    DISABLE_ADSB: false,
    DISABLE_WIND: false,
    DISABLE_UNIT_NAMING: false,
    DISABLE_UDPPROXY_UPDATE: false,
    DISABLE_SWARM: false,
    DISABLE_SWARM_DESTINATION_PONTS: false,
    DISABLE_P2P: false,
    DISABLE_SDR: false,
    DISABLE_GPIO: false,
    DISABLE_VOICE: false,
    DISABLE_TRACKING: false,
    DISABLE_TRACKING_AI: false,
    DISABLE_EXPERIMENTAL: true,
    DISABLE_DE_PILOT: true,
    DISABLE_3D_MAP: false,
    DISABLE_VERSION_NOTIFICATION: false,
    DISABLE_TELNET: false,
    DISABLE_SENDING_NEWS: false
};

/**
 * Notice yoy cannot define new languages here.
 * Only languages with locale files can be used.
 */
export let CONST_LANGUAGE = {
  ENABLED_LANGUAGES: [
    { code: 'en', label: 'English', className: '' },
    { code: 'ar', label: 'عربى', className: 'rtl' },
    { code: 'fr', label: 'Français', className: '' },
    { code: 'es', label: 'Español', className: '' },
    { code: 'ru', label: 'Русский', className: '' }
  ],
  DEFAULT_LANGUAGE: 'en'
};

/**
 * WEBRTC Video Streaming Settings
 */
export let CONST_ICE_SERVERS = [];

/**
 * ADSB provider configuration.
 *
 * The WebClient talks to a normalized ADSB layer (src/js/adsb/) so different
 * providers can be selected here without code changes.
 *
 *   PROVIDER: 'opensky' | 'aisstream'
 *   REFRESH_RATE_MS: polling interval (OpenSky anonymous tier is credit-limited,
 *                    so the default is conservative; for aisstream this is the
 *                    flush interval for buffered push messages)
 *   OBJECT_TIMEOUT_MS: how long an aircraft is kept after it last appears in
 *                      a response. Measured from receive time (not the
 *                      provider's last_contact), so this is the exact absence
 *                      tolerance. Should be a multiple of REFRESH_RATE_MS so a
 *                      plane survives several missed polls (OpenSky
 *                      intermittently drops aircraft from responses). Default
 *                      4x the refresh rate (240000 at 60s refresh).
 *   OPENSKY: { CLIENT_ID, CLIENT_SECRET } enable OAuth2 for higher limits; leave
 *            empty for anonymous (bounding-box) mode.
 *   AISSTREAM: { URL, REFRESH_RATE_MS } AIS maritime data via the DroneEngage
 *              server plugin (aisstream.io). The API key stays server-side.
 *   RADIUS_KM: ADSB scan radius — used both as the margin added around the
 *              swarm bounding circle when drones are online, and as the scan
 *              radius when no drones are online (default 850)
 */
export let CONST_ADSB_CONFIG = {
    PROVIDER: 'opensky',
    REFRESH_RATE_MS: 60000,
    OBJECT_TIMEOUT_MS: 130000,
    RADIUS_KM: 850,
    OPENSKY: {
        URL: '',
        TOKEN_URL: '',
        CLIENT_ID: '',
        CLIENT_SECRET: '',
    },
    AISSTREAM: {
        URL: '',
        REFRESH_RATE_MS: 5000,
    },
};

/**
 * Wind arrow configuration.
 *
 * The WebClient fetches wind data from Open-Meteo (free, no API key) via
 * js_windProvider.js and draws a wind arrow next to the currently selected
 * DroneEngage unit on the map. See config/mapStyle.js CONST_MAP_WIND_ARROW_* for
 * the visual constants.
 *
 *   ENABLED:        default state (overridable from Preferences + localStorage)
 *   CELL_ROUNDING:  decimal places to round lat/lng to for cache cell key
 *                   (1 = ~11 km, the Open-Meteo grid resolution)
 *   REFRESH_RATE_MS: minimum interval between re-fetches for the same cell
 *                   (the cache is also keyed by UTC hour, so this is a
 *                   safety cap on top of the hourly key change)
 */
export let CONST_WIND_CONFIG = {
    ENABLED: false,
    CELL_ROUNDING: 1,
    REFRESH_RATE_MS: 3600000,
};



/**
 * This function load overrides values from config.json in public folder.
 */
function fn_parseConfigJsonText(jsonText) {
    let jsonString = jsonText;
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
    jsonString = jsonString.replace(/(^|\s)\/\/.*/g, '');
    return JSON.parse(jsonString);
}

export function fn_applyRuntimeConfig(data) {
    try {
        if (!data) return;

        if (data.CONST_TEST_MODE !== undefined) CONST_TEST_MODE = data.CONST_TEST_MODE;
        if (data.CONST_PROD_MODE_IP !== undefined) CONST_PROD_MODE_IP = data.CONST_PROD_MODE_IP;
        if (data.CONST_PROD_MODE_PORT !== undefined) CONST_PROD_MODE_PORT = data.CONST_PROD_MODE_PORT;

        if (data.CONST_TEST_MODE_IP !== undefined) CONST_TEST_MODE_IP = data.CONST_TEST_MODE_IP;
        if (data.CONST_TEST_MODE_PORT !== undefined) CONST_TEST_MODE_PORT = data.CONST_TEST_MODE_PORT;

        if (data.CONST_WEBCONNECTOR_CONFIG !== undefined) CONST_WEBCONNECTOR_CONFIG = { ...CONST_WEBCONNECTOR_CONFIG, ...data.CONST_WEBCONNECTOR_CONFIG };

        if (data.CONST_ANDRUAV_URL !== undefined) CONST_ANDRUAV_URL = data.CONST_ANDRUAV_URL;
        if (data.CONST_ANDRUAV_URL_ENABLE !== undefined) CONST_ANDRUAV_URL_ENABLE = data.CONST_ANDRUAV_URL_ENABLE;
        if (data.CONST_ACCOUNT_URL_ENABLE !== undefined) CONST_ACCOUNT_URL_ENABLE = data.CONST_ACCOUNT_URL_ENABLE;

        if (data.CONST_MAP_LEAFLET_URL_MAP !== undefined) CONST_MAP_LEAFLET_URL_MAP = data.CONST_MAP_LEAFLET_URL_MAP;
        if (data.CONST_MAP_LEAFLET_ACCESS_TOKEN !== undefined) CONST_MAP_LEAFLET_ACCESS_TOKEN = data.CONST_MAP_LEAFLET_ACCESS_TOKEN;
        if (data.CONST_MAPBOX_3D_ACCESS_TOKEN !== undefined) CONST_MAPBOX_3D_ACCESS_TOKEN = data.CONST_MAPBOX_3D_ACCESS_TOKEN;
        if (data.CONST_MAPBOX_STYLE !== undefined) CONST_MAPBOX_STYLE = data.CONST_MAPBOX_STYLE;
        if (data.CONST_MAP_TILE_CACHE !== undefined) CONST_MAP_TILE_CACHE = { ...CONST_MAP_TILE_CACHE, ...data.CONST_MAP_TILE_CACHE };
        if (data.CONST_DONT_BROADCAST_TO_GCSs !== undefined) CONST_DONT_BROADCAST_TO_GCSs = data.CONST_DONT_BROADCAST_TO_GCSs;
        if (data.CONST_DONT_BROADCAST_GCS_LOCATION !== undefined) CONST_DONT_BROADCAST_GCS_LOCATION = data.CONST_DONT_BROADCAST_GCS_LOCATION;
        if (data.CONST_FEATURE !== undefined) CONST_FEATURE = { ...CONST_FEATURE, ...data.CONST_FEATURE };
        if (data.CONST_ICE_SERVERS !== undefined) CONST_ICE_SERVERS = data.CONST_ICE_SERVERS;
        if (data.CONST_ADSB_CONFIG !== undefined) CONST_ADSB_CONFIG = { ...CONST_ADSB_CONFIG, ...data.CONST_ADSB_CONFIG };
        if (data.CONST_WIND_CONFIG !== undefined) CONST_WIND_CONFIG = { ...CONST_WIND_CONFIG, ...data.CONST_WIND_CONFIG };

        // Apply localStorage overrides for ADSB config (localStorage has
        // highest priority, then config.local/config.json, then defaults
        // above). Mirrors the map-settings override pattern. Only non-empty
        // localStorage values win; an empty stored value is ignored so the
        // config/default still applies.
        const lsAdsbProvider = js_localStorage.fn_getAdsbProvider();
        if (lsAdsbProvider) CONST_ADSB_CONFIG.PROVIDER = lsAdsbProvider;

        const lsAdsbRefresh = js_localStorage.fn_getAdsbRefreshRateMs();
        if (lsAdsbRefresh) CONST_ADSB_CONFIG.REFRESH_RATE_MS = lsAdsbRefresh;

        const lsClientId = js_localStorage.fn_getAdsbOpenSkyClientId();
        if (lsClientId) CONST_ADSB_CONFIG.OPENSKY = { ...CONST_ADSB_CONFIG.OPENSKY, CLIENT_ID: lsClientId };

        const lsClientSecret = js_localStorage.fn_getAdsbOpenSkyClientSecret();
        if (lsClientSecret) CONST_ADSB_CONFIG.OPENSKY = { ...CONST_ADSB_CONFIG.OPENSKY, CLIENT_SECRET: lsClientSecret };
        if (data.CONST_MODULE_VERSIONS !== undefined) CONST_MODULE_VERSIONS = { ...CONST_MODULE_VERSIONS, ...data.CONST_MODULE_VERSIONS };
        if (data.CONST_LANGUAGE !== undefined) CONST_LANGUAGE = { ...CONST_LANGUAGE, ...data.CONST_LANGUAGE };

        // Apply localStorage overrides for map settings (localStorage has highest priority)
        const localStorageLeafletToken = js_localStorage.fn_getMapLeafletAccessToken();
        if (localStorageLeafletToken) CONST_MAP_LEAFLET_ACCESS_TOKEN = localStorageLeafletToken;

        const localStorageLeafletUrl = js_localStorage.fn_getMapLeafletUrlMap();
        if (localStorageLeafletUrl) CONST_MAP_LEAFLET_URL_MAP = localStorageLeafletUrl;

        const localStorage3DToken = js_localStorage.fn_getMapbox3DAccessToken();
        if (localStorage3DToken) CONST_MAPBOX_3D_ACCESS_TOKEN = localStorage3DToken;

        const localStorageStyle = js_localStorage.fn_getMapboxStyle();
        if (localStorageStyle) CONST_MAPBOX_STYLE = localStorageStyle;

        // Apply localStorage override for the tile-cache enable flag.
        // Unlike the token/url overrides above, this is a boolean, so it
        // is applied unconditionally — a stored `false` is a valid,
        // intentional override and must win over the config/default.
        CONST_MAP_TILE_CACHE.ENABLED = js_localStorage.fn_getMapTileCacheEnabled();
    } catch (error) {
        console.error('Error applying config:', error);
    }
}

export async function fn_loadConfig() {
    try {
        const res = await fetch('/config.json', { cache: 'no-store' });
        if (res.status === 404) {
            // config.json is optional — soft notice.
            console.log('[config] config.json not found (skipping)');
        } else if (!res.ok) {
            console.error('%c[config] ERROR loading config.json: HTTP ' + res.status,
                'background:#b00;color:#fff;padding:2px 6px;border-radius:3px;');
            return;
        } else {
            const txt = await res.text();
            let data;
            try {
                data = fn_parseConfigJsonText(txt);
            } catch (parseErr) {
                console.error('%c[config] CONFIG PARSE ERROR in config.json',
                    'background:#b00;color:#fff;font-weight:bold;padding:4px 8px;border-radius:3px;');
                console.error('%c' + parseErr.message,
                    'color:#b00;font-weight:bold;font-size:14px;');
                console.error('Fix the JSON syntax in public/config.json and reload.');
                return;
            }
            fn_applyRuntimeConfig(data);
            console.log('[config] config.json loaded OK');
        }

        // Try to load local config (for sensitive data like tokens)
        // Local config fields overwrite public config fields with the same name.
        // A 404 is fine (file is optional). A parse error on an existing file is
        // a real problem and must be highlighted LOUDLY.
        const localRes = await fetch('/config.local.json', { cache: 'no-store' });
        if (localRes.status === 404) {
            console.log('[config] config.local.json not found (skipping)');
        } else if (!localRes.ok) {
            console.error('%c[config] ERROR loading config.local.json: HTTP ' + localRes.status,
                'background:#b00;color:#fff;padding:2px 6px;border-radius:3px;');
        } else {
            const localTxt = await localRes.text();
            let localData;
            try {
                localData = fn_parseConfigJsonText(localTxt);
            } catch (parseErr) {
                console.error('%c[config] CONFIG PARSE ERROR in config.local.json',
                    'background:#b00;color:#fff;font-weight:bold;padding:4px 8px;border-radius:3px;');
                console.error('%c' + parseErr.message,
                    'color:#b00;font-weight:bold;font-size:14px;');
                console.error('Fix the JSON syntax in public/config.local.json and reload.');
                return;
            }
            fn_applyRuntimeConfig(localData);
            console.log('[config] config.local.json loaded OK');
        }
    } catch (error) {
        console.error('%c[config] ERROR loading config: ' + error.message,
            'background:#b00;color:#fff;padding:2px 6px;border-radius:3px;');
    }
}