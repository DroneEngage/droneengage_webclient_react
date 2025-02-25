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

 export const CONST_TEST_MODE = true;
 export const CONST_PROD_MODE_IP = 'airgap.droneengage.com'; 
 export const CONST_PROD_MODE_PORT = '19408';
 
 export const CONST_TEST_MODE_IP = '127.0.0.1';
 export const CONST_TEST_MODE_PORT = '19408';
 
 export const CONST_TEST_MODE_ENABLE_LOG = false;  // should be used together with CONST_TEST_MODE
 export const CONST_TITLE = 'Drone Engage';

/**
 * Links that are used in Header
 */
 export const CONST_HOME_URL = "https://cloud.ardupilot.org/";
 export const CONST_MANUAL_URL = "https://cloud.ardupilot.org/";
 export const CONST_FAQ_URL = "https://cloud.ardupilot.org/de-faq.html";
 export const CONST_CONTACT_URL = "https://droneengage.com/contact.html";

/**
 * Location of GCS are not sent over network. Only The existence of connected GCS are shared.
 */
export const CONST_DONT_BROADCAST_TO_GCSs = false;


/**
 * This is for disable experimental features.
 * If a feature is not explicitly mentioned or has a value of true, it is considered to be enabled.
 */
export const CONST_FEATURE = 
{
    DISABLE_UNIT_NAMING: false,
    DISABLE_UDPPROXY_UPDATE: false,
    DISABLE_SWARM: false,
    DISABLE_SWARM_DESTINATION_PONTS: false,
    DISABLE_P2P: false,
    DISABLE_SDR: false,
    DISABLE_GPIO: false,
    DISABLE_VOICE: false,
};

export const CONST_ICE_SERVERS =  [
    {urls: 'turn:cloud.ardupilot.org', 'credential':'1234', 'username':'andruav_ap'},
    {urls: "stun:stun1.l.google.com:19302"},
    ];

