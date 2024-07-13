import * as  js_siteConfig from './js_siteConfig.js'


export const build_number = "20240703-01";



// auto connect variables
export var v_connectState 	 = false;  	
export var v_connectRetries  = 5;  	

export var v_map_shapes = [];

export var v_vehicle_gui = {};

export var planes_icon = [ './images/planetracker_r_0d_.png',
					'./images/planetracker_y_0d_.png',
					'./images/planetracker_g_0d_.png',
					'./images/planetracker_b_0d_.png'];
					

export var quad_icon   = [ './images/drone_qq_1_0d.png',
					'./images/drone_qq_2_0d.png',
					'./images/drone_qq_3_0d.png',
					'./images/drone_qq_4_0d.png'];


export var rover_icon  = [ './images/car1.png',
					'./images/car2.png',
					'./images/car3.png',
					'./images/car4.png'];


export var boat_icon  = [ './images/boat1.png',
					'./images/boat2.png',
					'./images/boat3.png',
					'./images/boat4.png'];


export var flightPath_colors = [
							'#75A4D3',
							'#75D3A4',
							'#A475D3',
							'#A4D375',
							'#D3A475',
							'#D375A4'
					];


export var swarm_location_icon = [
				'./images/drone_q1_32x32.png',
				'./images/drone_q2_32x32.png',
				'./images/drone_q3_32x32.png',
				'./images/drone_q4_32x32.png',
				];



export const CONST_DFM_FAR                 = 3000; // more than 10 Km is far.
export const CONST_DFM_SAFE                = 1000; // less than 1 Km is safe.
export const CONST_MAX_MESSAGE_LOG         = 100; 

export var v_displayMode                   = 0;
export var active_gamepad_index            = 0;

// Metric System        
export var v_useMetricSystem               = true;

export var CONST_DEFAULT_ALTITUDE          = 100;  // 100 m
export var CONST_DEFAULT_RADIUS            = 50;   // 50 m
export var CONST_DEFAULT_ALTITUDE_min      = 1;    //  m		
export var CONST_DEFAULT_ALTITUDE_STEP     = 3;    //  m		
export var CONST_DEFAULT_RADIUS_min        = 5;    //  m
export var CONST_DEFAULT_SPEED_MIN         = 5;    //  m/s
export var CONST_DEFAULT_SPEED_STEP        = 1;    //  m/s
export var CONST_DEFAULT_VOLUME            = 50;
// GUI 
export const CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT = 40;


export var v_EnableADSB     = false;
export var v_en_Drone       = true;
export var v_en_GCS         = true;
export var v_enable_tabs_display = false;
export var v_enable_unit_sort = true;
export var v_enable_gcs_display = false;
export var v_gamePadMode = 2;


// map Color Selection
export const v_colorDrawPathes = ['#D9524F', '#337AB7', '#62D284', '#F0AD4E'];

//////////////////////////////////
//LOCAL EVENTS
export const EE_WS_OPEN                            = "EVT_1";
export const EE_WS_CLOSE                           = "EVT_2";
export const EE_onDeleted                          = "EVT_3";
export const EE_msgFromUnit_GPS                    = "EVT_4";
export const EE_msgFromUnit_IMG                    = "EVT_5";
export const EE_andruavUnitAdded                   = "EVT_6";
export const EE_HomePointChanged                   = "EVT_7";
export const EE_DistinationPointChanged            = "EVT_8";
export const EE_andruavUnitError                   = "EVT_9";
export const EE_andruavUnitGeoFenceUpdated         = "EVT_10";
export const EE_andruavUnitGeoFenceHit             = "EVT_11";
export const EE_msgFromUnit_WayPoints              = "EVT_12";
export const EE_msgFromUnit_WayPointsUpdated       = "EVT_13";
export const EE_andruavUnitArmedUpdated            = "EVT_14";
export const EE_andruavUnitGeoFenceBeforeDelete    = "EVT_15";
export const EE_andruavUnitFCBUpdated              = "EVT_16";
export const EE_andruavUnitFlyingUpdated           = "EVT_17";
export const EE_andruavUnitFightModeUpdated        = "EVT_18";
export const EE_andruavUnitVehicleTypeUpdated      = "EVT_19";

export const EE_onMessage                  = "EE_onMessage";    
export const EE_onPreferenceChanged        = "EE_onPreferenceChanged";
export const EE_unitAdded                  = "EE_unitAdded";
export const EE_unitUpdated                = "EE_unitUpdated";
export const EE_unitP2PUpdated             = "EE_unitP2PUpdated";
export const EE_unitNavUpdated             = "EE_unitNavUpdated";
export const EE_onSocketStatus             = "EE_onSocketStatus";
export const EE_onSocketStatus2            = "EE_onSocketStatus2";
export const EE_onGUIMessage               = "EE_onGUIMessage";
export const EE_onGUIMessageHide           = "EE_onGUIMessageHide";
export const EE_updateLogin                = "EE_updateLogin";
export const EE_videoStreamStarted         = "EE_videoStreamStarted";
export const EE_videoStreamRedraw          = "EE_videoStreamRedraw";
export const EE_videoStreamStopped         = "EE_videoStreamStopped";
export const EE_unitTelemetryOn            = "EE_unitTelemetryOn";
export const EE_unitTelemetryOff           = "EE_unitTelemetryOff";
export const EE_BattViewToggle             = "EE_BattViewToggle";
export const EE_EKFViewToggle              = "EE_EKFViewToggle";
export const EE_adsbExchangeReady          = "EE_adsbExchangeReady";
export const EE_displayGeoForm             = "EE_displayGeoForm";
export const EE_onShapeCreated             = "EE_onShapeCreated";
export const EE_onShapeSelected            = "EE_onShapeSelected";
export const EE_onShapeEdited              = "EE_onShapeEdited";
export const EE_onShapeDeleted             = "EE_onShapeDeleted";
export const EE_mapMissionUpdate           = "EE_mapMissionUpdate";
export const EE_displayServoForm           = "EE_displayServoForm";
export const EE_servoOutputUpdate          = "EE_servoOutputUpdate";
export const EE_DetectedTarget             = "EE_DetectedTarget";
export const EE_SearchableTarget           = "EE_SearchableTarget";
export const EE_cameraZoomChanged          = "EE_cameraZoomChanged";
export const EE_cameraFlashChanged         = "EE_cameraFlashChanged";

export const EE_displayParameters          = "EE_displayParameters";
export const EE_updateParameters           = "EE_updateParameters";

export const EE_requestGamePad             = "EE_requestGamePad";
export const EE_releaseGamePad             = "EE_releaseGamePad";

export const EE_GamePad_Connected           = "EE_GamePad_Connected";
export const EE_GamePad_Disconnected        = "EE_GamePad_Disconnected";
export const EE_GamePad_Axes_Updated		 = "EE_GamePad_Axes_Updated";
export const EE_GamePad_Button_Updated		 = "EE_GamePad_Button_Updated";


export const EE_displayStreamDlgForm        = "EE_displayStreamDlgForm";
export const EE_hideStreamDlgForm           = "EE_hideStreamDlgForm";

export const EE_displayCameraDlgForm        = "EE_displayCameraDlgForm";
export const EE_hideCameraDlgForm           = "EE_hideCameraDlgForm";

export const EE_onMissionItemToggle         = "EE_onMissionItemToggle";

export const EE_onAdvancedMode              = "_MS_96A4ED6B1E5_";
export const EE_ErrorMessage                = "_E_A642XYZB4E4_";
export const EE_adsbExpiredUpdate           = "_E_XXAZQD6B3E4_";




// EOF LOCAL EVENTS



export var v_smart_Telemetry_Level     = -1;
export var v_security_key              = "dynamic_event";


export var CONST_EXPERIMENTAL_FEATURES_ENABLED = false; // KEEP it above code block and keep it unchanged



// export const CONST_MAP_GOOLE   = true;
// export const CONST_MAP_LEAFLET = false;



export var CONST_MAP_GOOLE_PLUGIN   = false; 
export var CONST_MAP_GOOLE   = false; 
export var CONST_MAP_EDITOR  = false;

export var VAR_MAP_LEAFLET_URL;

// CHOOSE YOUR MAP SOURCE
VAR_MAP_LEAFLET_URL = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaHNhYWQiLCJhIjoiY2tqZnIwNXRuMndvdTJ4cnV0ODQ4djZ3NiJ9.LKojA3YMrG34L93jRThEGQ";
//VAR_MAP_LEAFLET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
//VAR_MAP_LEAFLET_URL = "https://airgap.droneengage.com:88/{x}_{y}_{z}.jpeg" //LOCAL MAP
//VAR_MAP_LEAFLET_URL = "http://127.0.0.1:9991/{x}_{y}_{z}.jpeg" //LOCAL MAP

export const CONST_PRO_VERSION = false;
export const CONST_DISABLE_ADSG = true;



export function fn_console_log(p_txt)
{
    //CODEBLOCK_START
    if ((js_siteConfig.CONST_TEST_MODE == true)  && (js_siteConfig.CONST_TEST_MODE_ENABLE_LOG == true))
    {
        console.log (p_txt);
    }
    //CODEBLOCK_END
}

export function fn_date_now()
{
    return Date.now();
}




export var v_andruavClient = null;
		