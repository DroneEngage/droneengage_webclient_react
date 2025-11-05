
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


		this.v_EnableADSB = false;
		this.v_en_Drone = true;
		this.v_en_GCS = true;
		this.v_enable_tabs_display = false;
		this.v_enable_unit_sort = true;
		this.v_enable_gcs_display = false;
		this.v_gamePadMode = 2;

		// GamePad Functions Assignment
		this.v_gamepad_function_array = ["undefined", "THR", "ALE", "RUD", "ELE", "SRV9", "SRV10", "SRV11", "SRV12", "SRV13", "SRV14", "SRV15", "SRV16"];
		this.v_gamepad_button_function_array = ["undefined", "ARM", "RTL", "Land", "Auto", "Brake", "Loiter", "Guided", "TGT", "SRV9", "SRV10", "SRV11", "SRV12", "SRV13", "SRV14", "SRV15", "SRV16"];
		this.v_gamepad_configuration = ["1", "2", "3", "4", "5"];
		this.v_gamepad_button_types = ['on/off', 'press', 'long latch'];
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
		this.LS_EMAIL = '_vEmail;'
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



		this.CONST_MAX_SDR_SPECTRUM_LENGTH = 100;
		this.CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH = 100;

		this.CONST_EXPERIMENTAL_FEATURES_ENABLED = true; // KEEP it above code block and keep it unchanged



		this.CONST_MAP_GOOLE_PLUGIN = false;
		this.CONST_MAP_GOOLE = false;
		this.CONST_MAP_EDITOR = false;


		this.CONST_DISABLE_ADSG = true;

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