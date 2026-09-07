
class GLOBALS {

	constructor() {
		// All fields have been dissolved into focused modules:
		//   src/js/config/constants.js    — immutable constants
		//   src/js/config/mapStyle.js     — Map3D / wind-arrow constants
		//   src/js/config/assets.js       — icon/colour arrays, DIALOG_ICONS
		//   src/js/config/gamepadMap.js   — stick/button mapping tables
		//   src/js/storage/keys.js        — LS_* localStorage key strings
		//   src/js/state/session.js       — mutable runtime state (accessors)
		//   src/js/state/preferences.js   — user preferences (accessors)
	}

	static getInstance() {
		if (!GLOBALS.instance) {
			GLOBALS.instance = new GLOBALS();
		}
		return GLOBALS.instance;
	}

}

export const js_globals = GLOBALS.getInstance();
