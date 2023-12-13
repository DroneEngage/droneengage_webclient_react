var build_number = "20231214-01";


// auto connect variables
var v_connectState 	= false;  	
var v_connectRetries  = 0;  	



const CONST_DFM_FAR                 = 3000; // more than 10 Km is far.
const CONST_DFM_SAFE                = 1000; // less than 1 Km is safe.

var v_displayMode                   = 0;
var active_gamepad_index            = 0;

// Metric System        
var v_useMetricSystem               = true;

var CONST_DEFAULT_ALTITUDE          = 100;  // 100 m
var CONST_DEFAULT_RADIUS            = 50;   // 50 m
var CONST_DEFAULT_ALTITUDE_min      = 1;    //  m		
var CONST_DEFAULT_ALTITUDE_STEP     = 3;    //  m		
var CONST_DEFAULT_RADIUS_min        = 5;    //  m
var CONST_DEFAULT_SPEED_MIN         = 5;    //  m/s
var CONST_DEFAULT_SPEED_STEP        = 1;    //  m/s
var CONST_DEFAULT_VOLUME            = 50;
// GUI 
const CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT = 40;


var v_EnableADSB     = false;
var v_en_Drone       = true;
var v_en_GCS         = true;
var v_enable_tabs_display = false;
var v_enable_gcs_display = false;
var v_gamePadMode = 2;


// map Color Selection
const v_colorDrawPathes = ['#D9524F', '#337AB7', '#62D284', '#F0AD4E'];

//////////////////////////////////
//LOCAL EVENTS
const EE_onMessage                  = "EE_onMessage";    
const EE_onPreferenceChanged        = "EE_onPreferenceChanged";
const EE_unitAdded                  = "EE_unitAdded";
const EE_unitUpdated                = "EE_unitUpdated";
const EE_unitNavUpdated             = "EE_unitNavUpdated";
const EE_onSocketStatus             = "EE_onSocketStatus";
const EE_onGUIMessage               = "EE_onGUIMessage";
const EE_onGUIMessageHide           = "EE_onGUIMessageHide";
const EE_updateLogin                = "EE_updateLogin";
const EE_videoStreamStarted         = "EE_videoStreamStarted";
const EE_videoStreamRedraw          = "EE_videoStreamRedraw";
const EE_videoStreamStopped         = "EE_videoStreamStopped";
const EE_unitTelemetryOn            = "EE_unitTelemetryOn";
const EE_unitTelemetryOff           = "EE_unitTelemetryOff";
const EE_BattViewToggle             = "EE_BattViewToggle";
const EE_EKFViewToggle              = "EE_EKFViewToggle";
const EE_adsbExchangeReady          = "EE_adsbExchangeReady";
const EE_displayGeoForm             = "EE_displayGeoForm";
const EE_onShapeCreated             = "EE_onShapeCreated";
const EE_onShapeSelected            = "EE_onShapeSelected";
const EE_onShapeEdited              = "EE_onShapeEdited";
const EE_onShapeDeleted             = "EE_onShapeDeleted";
const EE_mapMissionUpdate           = "EE_mapMissionUpdate";
const EE_displayServoForm           = "EE_displayServoForm";
const EE_servoOutputUpdate          = "EE_servoOutputUpdate";
const EE_DetectedTarget             = "EE_DetectedTarget";
const EE_SearchableTarget           = "EE_SearchableTarget";
const EE_cameraZoomChanged          = "EE_cameraZoomChanged";
const EE_cameraFlashChanged         = "EE_cameraFlashChanged";

const EE_displayParameters          = "EE_displayParameters";
const EE_updateParameters           = "EE_updateParameters";

const EE_requestGamePad             = "EE_requestGamePad";
const EE_releaseGamePad             = "EE_releaseGamePad";

const EE_GamePad_Connected           = "EE_GamePad_Connected";
const EE_GamePad_Disconnected        = "EE_GamePad_Disconnected";
const EE_GamePad_Axes_Updated		 = "EE_GamePad_Axes_Updated";
const EE_GamePad_Button_Updated		 = "EE_GamePad_Button_Updated";


const EE_displayStreamDlgForm        = "EE_displayStreamDlgForm";
const EE_hideStreamDlgForm           = "EE_hideStreamDlgForm";

const EE_displayCameraDlgForm        = "EE_displayCameraDlgForm";
const EE_hideCameraDlgForm           = "EE_hideCameraDlgForm";

const EE_onMissionItemToggle         = "EE_onMissionItemToggle";

const EE_onAdvancedMode              = "_MS_96A4ED6B1E5_";
const EE_ErrorMessage                = "_E_A642XYZB4E4_";
const EE_adsbExpiredUpdate           = "_E_XXAZQD6B3E4_";




// EOF LOCAL EVENTS



var v_smart_Telemetry_Level     = -1;
var v_security_key              = "dynamic_event";


var CONST_EXPERIMENTAL_FEATURES_ENABLED = false; // KEEP it above code block and keep it unchanged



// const CONST_MAP_GOOLE   = true;
// const CONST_MAP_LEAFLET = false;



var CONST_MAP_GOOLE_PLUGIN   = false; 
var CONST_MAP_GOOLE   = false; 
var CONST_MAP_EDITOR  = false;

var VAR_MAP_LEAFLET_URL;

// CHOOSE YOUR MAP SOURCE
VAR_MAP_LEAFLET_URL = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaHNhYWQiLCJhIjoiY2tqZnIwNXRuMndvdTJ4cnV0ODQ4djZ3NiJ9.LKojA3YMrG34L93jRThEGQ";
//VAR_MAP_LEAFLET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
//VAR_MAP_LEAFLET_URL = "https://airgap.droneengage.com:88/{x}_{y}_{z}.jpeg" //LOCAL MAP
//VAR_MAP_LEAFLET_URL = "http://127.0.0.1:9991/{x}_{y}_{z}.jpeg" //LOCAL MAP

const CONST_PRO_VERSION = false;
const CONST_DISABLE_ADSG = true;



function fn_console_log(p_txt)
{
    //CODEBLOCK_START
    if ((CONST_TEST_MODE == true)  && (CONST_TEST_MODE_ENABLE_LOG == true))
    {
        console.log (p_txt);
    }
    //CODEBLOCK_END
}

function fn_date_now()
{
    return Date.now();
}




var v_andruavClient = null;
		