
class GLOBALS {

	constructor() {
		this.myposition = null;
		this.v_andruavClient = null;
		this.m_andruavUnitList = null;
		// auto connect variables
		this.v_connectRetries = 5;

		this.v_map_shapes = [];

		this.v_vehicle_gui = {};
		this.m_markGuided = null;

		this.v_waypointsCache = {};

		this.m_current_tab_status = 'unknown';
		
		this.planes_icon = ['/images/planetracker_r_0d_.png',
			'/images/planetracker_y_0d_.png',
			'/images/planetracker_g_0d_.png',
			'/images/planetracker_b_0d_.png'];


		this.quad_icon = ['/images/drone_qq_1_0d.png',
			'/images/drone_qq_2_0d.png',
			'/images/drone_qq_3_0d.png',
			'/images/drone_qq_4_0d.png'];


		this.rover_icon = ['/images/car1.png',
			'/images/car2.png',
			'/images/car3.png',
			'/images/car4.png'];


		this.boat_icon = ['/images/boat1.png',
			'/images/boat2.png',
			'/images/boat3.png',
			'/images/boat4.png'];


		this.flightPath_colors = [
			'#75A4D3',
			'#75D3A4',
			'#A475D3',
			'#A4D375',
			'#D3A475',
			'#D375A4'
		];


		this.swarm_quad_location_icon = [
			'/images/drone_q1_32x32.png',
			'/images/drone_q2_32x32.png',
			'/images/drone_q3_32x32.png',
			'/images/drone_q4_32x32.png',
		];

		this.swarm_plane_location_icon = [
			'/images/drone_1_32x32.png',
			'/images/drone_2_32x32.png',
			'/images/drone_3_32x32.png',
			'/images/drone_4_32x32.png',
		];



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

		// GamePad Functions Assignment
		this.v_gamepad_function_array = ["undefined", "THR", "ALE", "RUD", "ELE", "SRV9", "SRV10", "SRV11", "SRV12", "SRV13", "SRV14", "SRV15", "SRV16"];
		this.v_gamepad_button_function_array = ["undefined", "ARM", "RTL", "Land", "Auto", "Brake", "Loiter", "Guided", "TGT", "SRV9", "SRV10", "SRV11", "SRV12", "SRV13", "SRV14", "SRV15", "SRV16"];
		this.v_gamepad_configuration = ["1", "2", "3", "4", "5"];
		this.v_gamepad_button_types = ['on/off', 'press', 'long on/off'];
		this.active_gamepad_index = 0;
		this.v_total_gampad_buttons = 12;

		this.STICK_LEFT_HORIZONTAL = 0;
		this.STICK_LEFT_VERTICAL = 1;
		this.STICK_RIGHT_HORIZONTAL = 2;
		this.STICK_RIGHT_VERTICAL = 3;

		this.STICK_MODE_RUD = "RUD";
		this.STICK_MODE_ELE = "ELE";
		this.STICK_MODE_ALE = "ALE";
		this.STICK_MODE_THR = "THR";
		this.STICK_MODE_AX1 = "AX1";
		this.STICK_MODE_AX2 = "AX2";

		this.STICK_MODE_MAPPING =
			[
				{ "RUD": 0, "ELE": 1, "ALE": 2, "THR": 3, "AX1": 4, "AX2": 5 },		// MODE 1
				{ "RUD": 0, "THR": 1, "ALE": 2, "ELE": 3, "AX1": 4, "AX2": 5 },    	// MODE 2
				{ "ALE": 0, "ELE": 1, "RUD": 2, "THR": 3, "AX1": 4, "AX2": 5 },		// MODE 3
				{ "ALE": 0, "THR": 1, "RUD": 2, "ELE": 3, "AX1": 4, "AX2": 5 }		// MODE 4

			];

		this.STICK_MODE_MAPPING_NAMES =
			[
				["RUD", "ELE", "ALE", "THR", "AX1", "AX2"],    	// MODE 1
				["RUD", "THR", "ALE", "ELE", "AX1", "AX2"],		// MODE 2
				["ALE", "ELE", "RUD", "THR", "AX1", "AX2"],		// MODE 3
				["ALE", "THR", "RUD", "ELE", "AX1", "AX2"]		// MODE 4

			];

		this.BUTTON_FUNTION_UNUSED = 0;
		this.BUTTON_FUNTION_ARM = 1;
		this.BUTTON_FUNTION_RTL = 2;
		this.BUTTON_FUNTION_LAND = 3;
		this.GP_EPSILON_CHANGE = 0.02;
		this.GP_SUDDEN_CHANGE = 0.20;
		this.GP_MIN_GAP_FAST_MS = 80;
		this.GP_HEARTBEAT_MS = 2500;

		
		// Mission File Extension
		this.v_mission_file_extension = '.de';

		// map Color Selection
		this.v_colorDrawPathes = [
			'#FF5733', // Vivid Orange-Red (XYZ)
			'#33FF57', // Bright Lime Green (ZYX)
			'#5733FF', // Deep Blue-Violet (YZX)
			'#FF33C7', // Magenta-Pink (XZY)
			'#33C7FF', // Cyan-Blue (ZXY)
			'#C7FF33', // Chartreuse Yellow (YXZ)
			'#FFC733', // Golden Yellow
			'#33FFC7', // Sea Green
			'#C733FF', // Purple
			'#3357FF', // Darker Blue
			'#FF3357', // Darker Red
			'#57FF33'  // Lighter Green
		];

		// LOCAL STORAGE
		this.LS_UNIT_ID = '_vUnitID';
		this.LS_UNIT_ID_SHARED = '_vUnitIDShared';
		this.LS_EMAIL = '_vEmail;'
		this.LS_LOGIN_NAME = '_vLoginName;'
		this.LS_GROUP_NAME = '_vGroupName;'
		this.LS_LANG = '_vLang';
		this.LS_WEB_GCS = 'WEB_GCS_';
		this.LS_ACCESS_CODE = '_vAccessCode';
		this.LS_DISPLAY_MODE = '_vDisplayMode';
		this.LS_GAME_PAD_MODE = 'gamepad_mode_';
		this.LS_GAME_PAD_CONFIG_PREFIX = 'gamepad_config_';
		this.LS_GAME_PAD_CONFIG_INDEX = '_vv_gamePadConfigIndex';
		this.LS_DEFAULT_ALT = '_vDefaultAltitude';
		this.LS_ENABLE_SPEECH = '_vv_speechEnabled';
		this.LS_DEFAULT_VOLUME = '_vDefaultVolume';
		this.LS_TAB_DISPLAY_ENABLED = '_vTabsDisplayEnabled';
		this.LS_METRIC_SYS = '_vv_useMetricSystem';
		this.LS_SHOW_ME_GCS = '_vGCSShowMe';
		this.LS_UNIT_SORTED_ENABLED = '_vUnitSortEnabled';
		this.LS_SELECTED_THEME = '_vSelectedTheme';
		this.LS_WEBCONNECTOR_ENABLED = '_vWSPluginEnabled';
		this.LS_SMS_PHONE_NUMBER = '_vSMSPhoneNumber';
		this.LS_ENABLE_ADSB = '_vADSBEnabled';
		this.LS_ENABLE_AISSTREAM = '_vAISStreamEnabled';
		this.LS_ENABLE_WIND = '_vWindEnabled';
		this.LS_ADSB_RADIUS_KM = '_vADSBRadiusKm';
		// ADSB provider config overrides (editable from the ADSB settings tab).
		// localStorage has highest priority, then config.local/config.json,
		// then the defaults in js_siteConfig.CONST_ADSB_CONFIG.
		this.LS_ADSB_PROVIDER = '_vADSBProvider';
		this.LS_ADSB_REFRESH_RATE_MS = '_vADSBRefreshRateMs';
		this.LS_ADSB_OPENSKY_CLIENT_ID = '_vADSBOpenSkyClientId';
		this.LS_ADSB_OPENSKY_CLIENT_SECRET = '_vADSBOpenSkyClientSecret';



		this.CONST_MAX_SDR_SPECTRUM_LENGTH = 100;
		this.CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH = 100;

		this.CONST_EXPERIMENTAL_FEATURES_ENABLED = true; // KEEP it above code block and keep it unchanged



		this.CONST_MAP_GOOLE = false;
		this.CONST_MAP_EDITOR = false;

		// Debug: Show white dot at anchor point of icons
		this.CONST_DEBUG_SHOW_ANCHOR_DOTS = false;

		// ---- Map3D (Mapbox 3D) visual constants ----
		// Tether/ground/altitude/trail colors per unit index (cycled).
		this.CONST_MAP3D_TETHER_COLORS = ['#503508', '#094709', '#510c31', '#127577'];
		// Line thickness (pixels) for the 3D overlay layers.
		this.CONST_MAP3D_CIRCLE_WIDTH = 2;     // ground + altitude rings
		this.CONST_MAP3D_TRAIL_WIDTH = 5;      // flight path trail
		this.CONST_MAP3D_MISSION_DROP_WIDTH = 1;  // waypoint drop-to-ground line
		this.CONST_MAP3D_GATE_RADIUS = 10;        // vertical gate ring radius (meters)
		this.CONST_MAP3D_GATE_WIDTH = 3;          // vertical gate ring line width
		this.CONST_MAP3D_WP_GROUND_RADIUS = 5;    // ground circle radius at waypoint drop base (meters)
		this.CONST_MAP3D_ADSB_TETHER_COLOR = '#ff0000'; // ADSB aircraft tether/ground/altitude ring color
		this.CONST_MAP3D_ADSB_TETHER_OPACITY = 0.95;    // ADSB tether cylinder fill opacity

		// ---- Map3D tether width (dynamic, altitude-based) ----
		// The vertical tether width scales linearly from MIN to MAX as the
		// object's altitude above ground goes from 0 to MAX_ALT, then stays
		// at MAX for higher altitudes. Applies to both DroneEngage units
		// (line width in pixels) and ADSB aircraft (cylinder radius in meters).
		this.CONST_MAP3D_TETHER_MIN = 2;        // minimum tether width (at ground level)
		this.CONST_MAP3D_TETHER_MAX = 100;       // maximum tether width (at MAX_ALT and above)
		this.CONST_MAP3D_TETHER_MAX_ALT = 1000;  // altitude (meters AGL) at which MAX is reached

		// ---- Map3D 3D-model (glTF) icon LOD ----
		// Below this zoom (i.e. more Zoom out) the flat billboard <div> marker is shown (constant
		// screen size, no 3D tilt); at/above it we swap to a real glTF model
		// (arrow.glb / plane.glb) that tilts with roll/pitch in 3D. This
		// avoids the "too small / too big" problem of scaling a real-world
		// sized 3D model across the full zoom range (see js_map3d.js).
		this.CONST_MAP3D_MODEL_ZOOM_THRESHOLD = 8;
		// model-scale [x,y,z] applied to arrow.glb/plane.glb *at
		// CONST_MAP3D_MODEL_SCALE_REFERENCE_ZOOM*. Mapbox's model-scale paint
		// property doesn't support zoom expressions on a GeoJSON source, so
		// js_map3d.js recomputes this manually on every 'zoom' event: scale
		// is multiplied by 2^(referenceZoom - currentZoom) * exponent, the
		// same meters-per-pixel relationship tiles use.
		this.CONST_MAP3D_MODEL_SCALE = [2, 2, 2];
		this.CONST_MAP3D_MODEL_SCALE_REFERENCE_ZOOM = 22;
		// Pixel-constant compensation exponent. Mapbox model-scale is in
		// real-world meters; each zoom level halves meters-per-pixel, so to
		// hold a CONSTANT on-screen (icon-like) size the real-world scale
		// must grow by 2× per zoom level you zoom out, and shrink by 2× per
		// level you zoom in. That is exactly:
		//   factor = 2^((refZoom - zoom) * exponent)
		// exponent = 1.0 → true pixel-constant (model keeps the SAME screen
		//   size at every zoom, just like a billboard/icon — this is the
		//   desired "icon" behaviour).
		// exponent > 1.0 → over-compensates, model visibly grows on screen
		//   as you zoom out.
		// exponent < 1.0 → under-compensates, model shrinks on screen as
		//   you zoom out.
		this.CONST_MAP3D_MODEL_SCALE_ZOOM_EXPONENT = 1;
		// Clamp the zoom-compensation factor so scale can't blow up/collapse
		// to a degenerate size at extreme zoom. MIN_FACTOR is set low so the
		// model CAN shrink (factor < 1) when you zoom in past the reference
		// zoom — that shrinkage is what holds the on-screen size constant at
		// high zoom (icon behaviour across the full range, not just below
		// the reference). MAX_FACTOR caps the growth at extreme zoom-out.
		this.CONST_MAP3D_MODEL_SCALE_MIN_FACTOR = 1;
		this.CONST_MAP3D_MODEL_SCALE_MAX_FACTOR = 200;

		// ---- Map3D model size multiplier range (ModelSizeControl +/- buttons) ----
		// The user-facing size multiplier (applied on top of the zoom-
		// compensated factor in fn_computeModelScale) is stepped with +/-
		// buttons between MIN and MAX. STEP is the increment per single
		// click, STEP_BIG is the increment per double-click. Default start
		// value is 1 (no extra magnification).
		this.CONST_MAP3D_MODEL_SIZE_MIN = 0.1;
		this.CONST_MAP3D_MODEL_SIZE_MAX = 5;
		this.CONST_MAP3D_MODEL_SIZE_STEP = 0.1;
		this.CONST_MAP3D_MODEL_SIZE_STEP_BIG = 0.5;

		// ---- Map3D ADSB traffic render mode ----
		// Unlike drone units (which always use the icon/GLB LOD hybrid
		// above), ADSB aircraft can number in the hundreds, so instead of an
		// automatic zoom-based swap this is a single global switch:
		//   'icon' — flat DOM billboard markers only (current default).
		//   'glb'  — real glTF models only ('drone-plane'), with the same
		//            dynamic zoom-scaling (CONST_MAP3D_MODEL_SCALE_*) applied.
		// See js_map3d.js fn_syncAdsbObject.
		this.CONST_MAP3D_ADSB_RENDER_MODE_ICON = 'icon';
		this.CONST_MAP3D_ADSB_RENDER_MODE_GLB = 'glb';
		this.CONST_MAP3D_ADSB_RENDER_MODE = this.CONST_MAP3D_ADSB_RENDER_MODE_GLB;

		// ---- Chase-cam / follow mode (3D map) ----
		// When enabled, the 3D map camera trails behind the followed unit on
		// every telemetry tick: center on the unit, bearing = yaw so the drone
		// always flies "up" the screen, and a raised pitch for a chase view.
		// The follow zoom is altitude-aware: it interpolates linearly from
		// ZOOM_AT_GROUND (drone at 0 m AGL) to ZOOM_AT_HIGH (drone at/above
		// ALT_REF m AGL), so a high drone pulls the camera back and a low
		// one pushes it in — keeping the drone at a comfortable on-screen
		// size regardless of altitude. See fn_computeFollowZoom.
		this.CONST_MAP3D_FOLLOW_PITCH = 60;          // camera pitch (deg) while following
		this.CONST_MAP3D_FOLLOW_ZOOM = 16;           // initial zoom applied once when follow starts
		this.CONST_MAP3D_FOLLOW_DURATION_MS = 1500;  // easeTo duration per tick (smooths between packets)
		this.CONST_MAP3D_FOLLOW_ZOOM_AT_GROUND = 17; // zoom when drone is at 0 m AGL (closer)
		this.CONST_MAP3D_FOLLOW_ZOOM_AT_HIGH = 14;   // zoom when drone is at/above ALT_REF m AGL (farther)
		this.CONST_MAP3D_FOLLOW_ALT_REF = 200;       // altitude (m AGL) at which ZOOM_AT_HIGH is reached

		// ---- Wind arrow (selected unit) visual constants ----
		// A single wind arrow is drawn next to the currently selected
		// DroneEngage unit on the map (leaflet 2D now, map3d later). It
		// points DOWNWIND (the direction the wind blows TO), and its length
		// grows with wind speed. See js_windProvider.js for the data source
		// (Open-Meteo, free, no key).
		this.CONST_MAP_WIND_ARROW_COLOR = '#ffff00';        // arrow color (yellow, visible on most basemaps)
		this.CONST_MAP_WIND_ARROW_LENGTH_PER_MS = 8;       // SVG path length units per 1 m/s of wind speed
		this.CONST_MAP_WIND_ARROW_MAX_LENGTH = 80;         // clamp max path length (units)
		this.CONST_MAP_WIND_ARROW_MIN_LENGTH = 24;         // clamp min path length (so 0 m/s is still visible)
		this.CONST_MAP_WIND_ARROW_BASE_LENGTH_MS = 0;      // base length added regardless of speed
		// Minimum interval between wind-arrow visual refreshes. Telemetry can
		// arrive at 1-10 Hz; refreshing the arrow on every packet rebuilds the
		// SVG icon + fires async plumbing for nothing (wind data is cached
		// hourly + per ~11km cell, so it barely changes). This throttle makes
		// the arrow "follow" the drone at a smooth, human-perceptible rate.
		this.CONST_MAP_WIND_ARROW_REFRESH_MS = 10000;

		this.CONST_DISABLE_ADSG = true;

		// VIEW LINK Gimbal Zoom range constants
		this.CONST_OPTICAL_ZOOM_MIN = 1.0;
		this.CONST_OPTICAL_ZOOM_MAX = 40.0; // A40TR-Pro
		this.CONST_IR_DIGITAL_ZOOM_MIN = 1.0;
		this.CONST_IR_DIGITAL_ZOOM_MAX = 32.0; // A40TR-Pro

		// Dialog Icons
		this.DIALOG_ICONS = {
			GOTO: '↗',
			CLOSE: '×',
			MINIMIZE: '▼',
			MAXIMIZE: '▲',
			OPAQUE: '●',
			TRANSPARENT: '○',
		};

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