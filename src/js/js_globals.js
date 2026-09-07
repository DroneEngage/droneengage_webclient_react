
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

		// Preferences (v_useMetricSystem, v_displayMode, v_en_*, v_enable_*,
		// v_gamePadMode, active_gamepad_index, CONST_DEFAULT_*,
		// CONST_MAP_EDITOR) moved to src/js/state/preferences.js

		// GamePad mapping tables moved to src/js/config/gamepadMap.js

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