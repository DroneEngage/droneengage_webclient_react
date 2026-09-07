
class GLOBALS {

	constructor() {
		this.myposition = null;
		this.v_andruavClient = null;
		this.m_andruavUnitList = null;
		// auto connect variables
		this.v_connectRetries = 5;

		this.v_map_shapes = [];

		this.m_markGuided = null;

		// waypoint cache moved to js_waypointCache (services/waypoint/waypointCache.js).

		this.m_current_tab_status = 'unknown';

		// icon/colour arrays moved to src/js/config/assets.js



		this.CONST_DFM_FAR = 3000; // more than 10 Km is far.
		this.CONST_DFM_SAFE = 1000; // less than 1 Km is safe.
		this.CONST_MAX_MESSAGE_LOG = 100;

		this.v_displayMode = 0;

		// Metric System        
		this.v_useMetricSystem = true;

		this.CONST_DEFAULT_ALTITUDE = 100;  //  m
		this.CONST_DEFAULT_RADIUS = 50;   //  m
		this.CONST_DEFAULT_ALTITUDE_min = 1;    //  m		
		this.CONST_DEFAULT_ALTITUDE_STEP = 3;    //  m		
		this.CONST_DEFAULT_RADIUS_min = 5;    //  m
		this.CONST_DEFAULT_SPEED_MIN = 5;    //  m/s
		this.CONST_DEFAULT_SPEED_STEP = 1;    //  m/s
		this.CONST_DEFAULT_VOLUME = 50;
		this.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = 30; // m
		this.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = 5; // m
		this.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN = 10; // m
		this.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN = 2; // m

		// GUI 
		this.CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT = 40;


		this.v_en_Drone = true;
		this.v_en_GCS = true;
		this.v_enable_tabs_display = false;
		this.v_enable_unit_sort = true;
		this.v_enable_gcs_display = false;
		this.v_enable_wind = false;          // wind arrow for selected unit (toggled in Preferences)
		this.v_gamePadMode = 2;

		// GamePad mapping tables moved to src/js/config/gamepadMap.js
		this.active_gamepad_index = 0;

		// Mission File Extension
		this.v_mission_file_extension = '.de';

		// map Color Selection moved to src/js/config/assets.js

		// LOCAL STORAGE keys moved to src/js/storage/keys.js



		this.CONST_MAX_SDR_SPECTRUM_LENGTH = 100;
		this.CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH = 100;

		this.CONST_EXPERIMENTAL_FEATURES_ENABLED = true; // KEEP it above code block and keep it unchanged



		this.CONST_MAP_GOOLE = false;
		this.CONST_MAP_EDITOR = false;

		// Debug: Show white dot at anchor point of icons
		this.CONST_DEBUG_SHOW_ANCHOR_DOTS = false;

		// Map3D + wind-arrow constants moved to src/js/config/mapStyle.js

		this.CONST_DISABLE_ADSG = true;

		// VIEW LINK Gimbal Zoom range constants
		this.CONST_OPTICAL_ZOOM_MIN = 1.0;
		this.CONST_OPTICAL_ZOOM_MAX = 40.0; // A40TR-Pro
		this.CONST_IR_DIGITAL_ZOOM_MIN = 1.0;
		this.CONST_IR_DIGITAL_ZOOM_MAX = 32.0; // A40TR-Pro

		// Dialog Icons moved to src/js/config/assets.js

	}

	static getInstance() {
		if (!GLOBALS.instance) {
			GLOBALS.instance = new GLOBALS();
		}
		return GLOBALS.instance;
	}








	fn_date_now() {
		return Date.now();
	}


}

export const js_globals = GLOBALS.getInstance();