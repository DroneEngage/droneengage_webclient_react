
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

		// Immutable constants moved to src/js/config/constants.js

		this.v_displayMode = 0;

		// Metric System
		this.v_useMetricSystem = true;

		this.CONST_DEFAULT_ALTITUDE = 100;  //  m
		this.CONST_DEFAULT_RADIUS = 50;   //  m
		this.CONST_DEFAULT_ALTITUDE_min = 1;    //  m
		this.CONST_DEFAULT_RADIUS_min = 5;    //  m
		this.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = 30; // m
		this.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = 5; // m
		this.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN = 10; // m
		this.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN = 2; // m

		// GUI constant moved to src/js/config/constants.js

		this.CONST_MAP_EDITOR = false;


		this.v_en_Drone = true;
		this.v_en_GCS = true;
		this.v_enable_tabs_display = false;
		this.v_enable_unit_sort = true;
		this.v_enable_gcs_display = false;
		this.v_enable_wind = false;          // wind arrow for selected unit (toggled in Preferences)
		this.v_gamePadMode = 2;

		// GamePad mapping tables moved to src/js/config/gamepadMap.js
		this.active_gamepad_index = 0;

		// Mission File Extension moved to src/js/config/constants.js

		// map Color Selection moved to src/js/config/assets.js

		// LOCAL STORAGE keys moved to src/js/storage/keys.js

		// SDR + experimental + map + debug constants moved to src/js/config/constants.js

		// Map3D + wind-arrow constants moved to src/js/config/mapStyle.js

		// CONST_DISABLE_ADSG + gimbal zoom constants moved to src/js/config/constants.js

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