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
export let CONST_TEST_MODE = false;
export let CONST_PROD_MODE_IP = 'airgap.droneengage.com';
export let CONST_PROD_MODE_PORT = '19408';
export let CONST_TEST_MODE_IP = '127.0.0.1';
export let CONST_TEST_MODE_PORT = '19408';
export let CONST_TEST_MODE_ENABLE_LOG = false;
export let CONST_TITLE = 'Drone Engage';

/**
 * Links that are used in Header
 */
export let CONST_HOME_URL = "https://cloud.ardupilot.org/";
export let CONST_MANUAL_URL = "https://cloud.ardupilot.org/";
export let CONST_FAQ_URL = "https://cloud.ardupilot.org/de-faq.html";
export let CONST_CONTACT_URL = "https://droneengage.com/contact.html";


// CHOOSE YOUR MAP SOURCE
export let CONST_MAP_LEAFLET_URL = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaHNhYWQiLCJhIjoiY2tqZnIwNXRuMndvdTJ4cnV0ODQ4djZ3NiJ9.LKojA3YMrG34L93jRThEGQ";
//export let CONST_MAP_LEAFLET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
//export let CONST_MAP_LEAFLET_URL = "https://airgap.droneengage.com:88/{x}_{y}_{z}.jpeg" //LOCAL MAP
//export let CONST_MAP_LEAFLET_URL = "http://127.0.0.1:9991/{x}_{y}_{z}.jpeg" //LOCAL MAP


/**
 * Location of GCS are not sent over network. Only The existence of connected GCS are shared.
 */
export let CONST_DONT_BROADCAST_TO_GCSs = false;
export let CONST_DONT_BROADCAST_GCS_LOCATION = false;

/**
 * This is for disable experimental features.
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
    DISABLE_EXPERIMENTAL: false,
};

/**
 * WEBRTC Video Streaming Settings
 */
export let CONST_ICE_SERVERS = [
    { urls: 'turn:cloud.ardupilot.org', credential: '1234', username: 'andruav_ap' },
    { urls: "stun:stun1.l.google.com:19302" },
];

function loadConfigSync() {
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/config.json', false); // Synchronous request
        xhr.send(null);

        if (xhr.status === 200) {
            let jsonString = xhr.responseText;

            // Remove multi-line comments
            jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');

            // Remove single-line comments
            jsonString = jsonString.replace(/(^|\s)\/\/.*/g, '');

            const data = JSON.parse(jsonString);
            
            // Update the exported constants
            if (data.CONST_TEST_MODE !== undefined) CONST_TEST_MODE = data.CONST_TEST_MODE;
            if (data.CONST_PROD_MODE_IP !== undefined) CONST_PROD_MODE_IP = data.CONST_PROD_MODE_IP;
            if (data.CONST_PROD_MODE_PORT !== undefined) CONST_PROD_MODE_PORT = data.CONST_PROD_MODE_PORT;
            
            if (data.CONST_TEST_MODE_IP !== undefined) CONST_TEST_MODE_IP = data.CONST_TEST_MODE_IP;
            if (data.CONST_TEST_MODE_PORT !== undefined) CONST_TEST_MODE_PORT = data.CONST_TEST_MODE_PORT;
            
            if (data.CONST_MAP_LEAFLET_URL !== undefined) CONST_MAP_LEAFLET_URL = data.CONST_MAP_LEAFLET_URL;
            if (data.CONST_DONT_BROADCAST_TO_GCSs !== undefined) CONST_DONT_BROADCAST_TO_GCSs = data.CONST_DONT_BROADCAST_TO_GCSs;
            if (data.CONST_DONT_BROADCAST_GCS_LOCATION !== undefined) CONST_DONT_BROADCAST_GCS_LOCATION = data.CONST_DONT_BROADCAST_GCS_LOCATION;
            
            if (data.CONST_FEATURE !== undefined) CONST_FEATURE = { ...CONST_FEATURE, ...data.CONST_FEATURE };
            if (data.CONST_ICE_SERVERS !== undefined) CONST_ICE_SERVERS = data.CONST_ICE_SERVERS;

        } else {
            console.error('Error loading config:', xhr.status);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

loadConfigSync(); // Load the config synchronously