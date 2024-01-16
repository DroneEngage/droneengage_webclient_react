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

const CONST_TEST_MODE = true;
const CONST_PROD_MODE_IP = 'airgap.droneengage.com'; 
const CONST_TEST_MODE_IP = "192.168.1.144";
const CONST_TEST_MODE_ENABLE_LOG = false; 
const CONST_TITLE = "Drone Engage";

/**
 * Links that are used in Header
 */
const CONST_HOME_URL = "https://cloud.ardupilot.org/";
const CONST_MANUAL_URL = "https://cloud.ardupilot.org/";
const CONST_FAQ_URL = "https://cloud.ardupilot.org/de-faq.html";
const CONST_CONTACT_URL = "https://droneengage.com/contact.html";

/**
 * Location of GCS are not sent over network. Only The existence of connected GCS are shared.
 */
const CONST_DONT_BROADCAST_TO_GCSs = false;


/**
 * This is for disable experimental features.
 * If a feature is not explicitly mentioned or has a value of true, it is considered to be enabled.
 */
const CONST_FEATURE = 
{
    DISABLE_UNIT_NAMING: false,
    DISABLE_UDPPROXY_UPDATE: false,
    DISABLE_SWARM: true,
    DISABLE_SWARM_DESTINATION_PONTS: true
};

const CONST_ICE_SERVERS =  [
    {urls: 'turn:cloud.ardupilot.org', 'credential':'1234', 'username':'andruav_ap'},
    {urls: "stun:stun1.l.google.com:19302"},
    ];
