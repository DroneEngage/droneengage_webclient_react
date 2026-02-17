/**
 * 
 * SITE Configuration File
 * 
 * Auth: Mohammad Hefny
 * 
 */


/**
 * Communication Server
 */


// Default Configuration
export let CONST_TEST_MODE = true;
export let CONST_PROD_MODE_IP = 'airgap.droneengage.com';
export let CONST_PROD_MODE_PORT = '19408';
export let CONST_TEST_MODE_IP = '127.0.0.1';
export let CONST_TEST_MODE_PORT = '19408';
export let CONST_TEST_MODE_ENABLE_LOG = true;
export let CONST_TITLE = 'Drone Engage';

export let CONST_WEBCONNECTOR_ENABLED = false;
export let CONST_WEBCONNECTOR_AUTH_HOST = '127.0.0.1';
export let CONST_WEBCONNECTOR_AUTH_PORT = 9211;
export let CONST_WEBCONNECTOR_WS_PORT = 9212;
export let CONST_WEBCONNECTOR_APIKEY = '';
export let CONST_WEBCONNECTOR_TOKEN = '';
// Auto fallback to cloud login when plugin is unreachable (true=enable fallback, false=plugin only)
export let CONST_WEBCONNECTOR_AUTO_FALLBACK = true;
export let CONST_WEBCONNECTOR_SECURE = true;
export let CONST_WEBCONNECTOR_BASE_PATH = '';

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

export let CONST_WEBSOCKET_BRIDGE_PORT = 8812;

// CHOOSE YOUR MAP SOURCE
export let CONST_MAP_LEAFLET_URL = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaHNhYWQiLCJhIjoiY2tqZnIwNXRuMndvdTJ4cnV0ODQ4djZ3NiJ9.LKojA3YMrG34L93jRThEGQ";
//export let CONST_MAP_LEAFLET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
//export let CONST_MAP_LEAFLET_URL = "https://airgap.local:88/sat_{x}_{y}_{z}.png"; // LOCAL MAP



export let CONST_MAPBOX_ACCESS_TOKEN = '';
export let CONST_MAPBOX_STYLE = 'mapbox://styles/mapbox/standard';

/**
 * Location of GCS are not sent over network. Only The existence of connected GCS are shared.
 */
export let CONST_DONT_BROADCAST_TO_GCSs = false;
export let CONST_DONT_BROADCAST_GCS_LOCATION = false;

// Enable webconnector reverse proxy for local development (true=enable Caddy proxy)
export let CONST_WEBCONNECTOR_ENABLE = false;

export let CONST_DEBUG_CONTROL_PAGE = true;
export let CONST_MODULE_VERSIONS = {
        
    };


/**
 * This is for disable features.
 * If a feature is not explicitly mentioned or has a value of true, it is considered to be enabled.
 */
export let CONST_FEATURE = {
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
    DISABLE_VERSION_NOTIFICATION: true
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
export let CONST_ICE_SERVERS = [
    { urls: 'turn:cloud.ardupilot.org', credential: '1234', username: 'andruav_ap' },
    { urls: "stun:stun1.l.google.com:19302" },
];



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

        if (data.CONST_WEBCONNECTOR_ENABLED !== undefined) CONST_WEBCONNECTOR_ENABLED = data.CONST_WEBCONNECTOR_ENABLED;
        if (data.CONST_WEBCONNECTOR_AUTH_HOST !== undefined) CONST_WEBCONNECTOR_AUTH_HOST = data.CONST_WEBCONNECTOR_AUTH_HOST;
        if (data.CONST_WEBCONNECTOR_AUTH_PORT !== undefined) CONST_WEBCONNECTOR_AUTH_PORT = data.CONST_WEBCONNECTOR_AUTH_PORT;
        if (data.CONST_WEBCONNECTOR_WS_PORT !== undefined) CONST_WEBCONNECTOR_WS_PORT = data.CONST_WEBCONNECTOR_WS_PORT;
        if (data.CONST_WEBCONNECTOR_APIKEY !== undefined) CONST_WEBCONNECTOR_APIKEY = data.CONST_WEBCONNECTOR_APIKEY;
        if (data.CONST_WEBCONNECTOR_TOKEN !== undefined) CONST_WEBCONNECTOR_TOKEN = data.CONST_WEBCONNECTOR_TOKEN;
        if (data.CONST_WEBCONNECTOR_AUTO_FALLBACK !== undefined) CONST_WEBCONNECTOR_AUTO_FALLBACK = data.CONST_WEBCONNECTOR_AUTO_FALLBACK;
        if (data.CONST_WEBCONNECTOR_SECURE !== undefined) CONST_WEBCONNECTOR_SECURE = data.CONST_WEBCONNECTOR_SECURE;
        if (data.CONST_WEBCONNECTOR_BASE_PATH !== undefined) CONST_WEBCONNECTOR_BASE_PATH = data.CONST_WEBCONNECTOR_BASE_PATH;
        if (data.CONST_WEBCONNECTOR_ENABLE !== undefined) CONST_WEBCONNECTOR_ENABLE = data.CONST_WEBCONNECTOR_ENABLE;
        
        if (data.CONST_ANDRUAV_URL_ENABLE !== undefined) CONST_ANDRUAV_URL_ENABLE = data.CONST_ANDRUAV_URL_ENABLE;
        if (data.CONST_ACCOUNT_URL_ENABLE !== undefined) CONST_ACCOUNT_URL_ENABLE = data.CONST_ACCOUNT_URL_ENABLE;

        if (data.CONST_MAP_LEAFLET_URL !== undefined) CONST_MAP_LEAFLET_URL = data.CONST_MAP_LEAFLET_URL;
        if (data.CONST_MAPBOX_ACCESS_TOKEN !== undefined) CONST_MAPBOX_ACCESS_TOKEN = data.CONST_MAPBOX_ACCESS_TOKEN;
        if (data.CONST_MAPBOX_STYLE !== undefined) CONST_MAPBOX_STYLE = data.CONST_MAPBOX_STYLE;
        if (data.CONST_DONT_BROADCAST_TO_GCSs !== undefined) CONST_DONT_BROADCAST_TO_GCSs = data.CONST_DONT_BROADCAST_TO_GCSs;
        if (data.CONST_DONT_BROADCAST_GCS_LOCATION !== undefined) CONST_DONT_BROADCAST_GCS_LOCATION = data.CONST_DONT_BROADCAST_GCS_LOCATION;
        if (data.CONST_FEATURE !== undefined) CONST_FEATURE = { ...CONST_FEATURE, ...data.CONST_FEATURE };
        if (data.CONST_ICE_SERVERS !== undefined) CONST_ICE_SERVERS = data.CONST_ICE_SERVERS;
        if (data.CONST_MODULE_VERSIONS !== undefined) CONST_MODULE_VERSIONS = { ...CONST_MODULE_VERSIONS, ...data.CONST_MODULE_VERSIONS };
        if (data.CONST_LANGUAGE !== undefined) CONST_LANGUAGE = { ...CONST_LANGUAGE, ...data.CONST_LANGUAGE };
    } catch (error) {
        console.error('Error applying config:', error);
    }
}

export async function fn_loadConfig() {
    try {
        const res = await fetch('/config.json', { cache: 'no-store' });
        if (!res.ok) {
            console.error('Error loading config:', res.status);
            return;
        }

        const txt = await res.text();
        const data = fn_parseConfigJsonText(txt);
        fn_applyRuntimeConfig(data);
    } catch (error) {
        console.error('Error loading config:', error);
    }
}