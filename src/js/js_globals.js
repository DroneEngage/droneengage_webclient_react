
class GLOBALS {

	constructor () 
	{
		this.myposition = null;
		this.v_andruavClient = null;
		this.m_andruavUnitList = null;
 		// auto connect variables
		this.v_connectRetries  = 5;  	

		this.v_map_shapes = [];

		this.v_vehicle_gui = {};
		this.m_markGuided = null;

		this.planes_icon = [ './images/planetracker_r_0d_.png',
							'./images/planetracker_y_0d_.png',
							'./images/planetracker_g_0d_.png',
							'./images/planetracker_b_0d_.png'];
							

		this.quad_icon   = [ './images/drone_qq_1_0d.png',
							'./images/drone_qq_2_0d.png',
							'./images/drone_qq_3_0d.png',
							'./images/drone_qq_4_0d.png'];


		this.rover_icon  = [ './images/car1.png',
							'./images/car2.png',
							'./images/car3.png',
							'./images/car4.png'];


		this.boat_icon  = [ './images/boat1.png',
							'./images/boat2.png',
							'./images/boat3.png',
							'./images/boat4.png'];


		this.flightPath_colors = [
									'#75A4D3',
									'#75D3A4',
									'#A475D3',
									'#A4D375',
									'#D3A475',
									'#D375A4'
							];


		this.swarm_location_icon = [
						'./images/drone_q1_32x32.png',
						'./images/drone_q2_32x32.png',
						'./images/drone_q3_32x32.png',
						'./images/drone_q4_32x32.png',
						];



		this.CONST_DFM_FAR                 = 3000; // more than 10 Km is far.
		this.CONST_DFM_SAFE                = 1000; // less than 1 Km is safe.
		this.CONST_MAX_MESSAGE_LOG         = 100; 

		this.v_displayMode                   = 0;
		this.active_gamepad_index            = 0;

		// Metric System        
		this.v_useMetricSystem               = true;

		this.CONST_DEFAULT_ALTITUDE          = 100;  // 100 m
		this.CONST_DEFAULT_RADIUS            = 50;   // 50 m
		this.CONST_DEFAULT_ALTITUDE_min      = 1;    //  m		
		this.CONST_DEFAULT_ALTITUDE_STEP     = 3;    //  m		
		this.CONST_DEFAULT_RADIUS_min        = 5;    //  m
		this.CONST_DEFAULT_SPEED_MIN         = 5;    //  m/s
		this.CONST_DEFAULT_SPEED_STEP        = 1;    //  m/s
		this.CONST_DEFAULT_VOLUME            = 50;
		// GUI 
		this.CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT = 40;


		this.v_EnableADSB     = false;
		this.v_en_Drone       = true;
		this.v_en_GCS         = true;
		this.v_enable_tabs_display = false;
		this.v_enable_unit_sort = true;
		this.v_enable_gcs_display = false;
		this.v_gamePadMode = 2;


		// map Color Selection
		this.v_colorDrawPathes = ['#D9524F', '#337AB7', '#62D284', '#F0AD4E'];

		//////////////////////////////////
		//LOCAL EVENTS
		this.EE_WS_OPEN                            = "EVT_1";
		this.EE_WS_CLOSE                           = "EVT_2";
		this.EE_onDeleted                          = "EVT_3";
		this.EE_msgFromUnit_GPS                    = "EVT_4";
		this.EE_msgFromUnit_IMG                    = "EVT_5";
		this.EE_andruavUnitAdded                   = "EVT_6";
		this.EE_HomePointChanged                   = "EVT_7";
		this.EE_DistinationPointChanged            = "EVT_8";
		this.EE_andruavUnitError                   = "EVT_9";
		this.EE_andruavUnitGeoFenceUpdated         = "EVT_10";
		this.EE_andruavUnitGeoFenceHit             = "EVT_11";
		this.EE_msgFromUnit_WayPoints              = "EVT_12";
		this.EE_msgFromUnit_WayPointsUpdated       = "EVT_13";
		this.EE_andruavUnitArmedUpdated            = "EVT_14";
		this.EE_andruavUnitGeoFenceBeforeDelete    = "EVT_15";
		this.EE_andruavUnitFCBUpdated              = "EVT_16";
		this.EE_andruavUnitFlyingUpdated           = "EVT_17";
		this.EE_andruavUnitFightModeUpdated        = "EVT_18";
		this.EE_andruavUnitVehicleTypeUpdated      = "EVT_19";
		this.EE_onProxyInfoUpdated		   		   = "EVT_20";
		this.EE_onAndruavUnitSwarmUpdated		   = "EVT_21";
		this.EE_onMessage                  = "EE_onMessage";    
		this.EE_onModuleUpdated			   = "EE_onModuleUpdated";
		this.EE_onPreferenceChanged        = "EE_onPreferenceChanged";
		this.EE_unitAdded                  = "EE_unitAdded";
		this.EE_unitUpdated                = "EE_unitUpdated";
		this.EE_unitHighlighted            = "EE_unitHighlighted";
		this.EE_unitOnlineChanged          = "EE_unitOnlineChanged";
		this.EE_unitPowUpdated             = "EE_unitPowUpdated";
		this.EE_unitP2PUpdated             = "EE_unitP2PUpdated";
		this.EE_unitSDRUpdated             = "EE_unitSDRUpdated";
		this.EE_unitSDRSpectrum            = "EE_unitSDRSpectrum";
		this.EE_unitNavUpdated             = "EE_unitNavUpdated";
		this.EE_onSocketStatus             = "EE_onSocketStatus";
		this.EE_onSocketStatus2            = "EE_onSocketStatus2";
		this.EE_onGUIMessage               = "EE_onGUIMessage";
		this.EE_onGUIMessageHide           = "EE_onGUIMessageHide";
		this.EE_updateLogin                = "EE_updateLogin";
		this.EE_videoStreamStarted         = "EE_videoStreamStarted";
		this.EE_videoStreamRedraw          = "EE_videoStreamRedraw";
		this.EE_videoStreamStopped         = "EE_videoStreamStopped";
		this.EE_unitTelemetryOn            = "EE_unitTelemetryOn";
		this.EE_unitTelemetryOff           = "EE_unitTelemetryOff";
		this.EE_BattViewToggle             = "EE_BattViewToggle";
		this.EE_EKFViewToggle              = "EE_EKFViewToggle";
		this.EE_adsbExchangeReady          = "EE_adsbExchangeReady";
		this.EE_displayGeoForm             = "EE_displayGeoForm";
		this.EE_onShapeCreated             = "EE_onShapeCreated";
		this.EE_onShapeSelected            = "EE_onShapeSelected";
		this.EE_onShapeEdited              = "EE_onShapeEdited";
		this.EE_onShapeDeleted             = "EE_onShapeDeleted";
		this.EE_mapMissionUpdate           = "EE_mapMissionUpdate";
		this.EE_displayServoForm           = "EE_displayServoForm";
		this.EE_servoOutputUpdate          = "EE_servoOutputUpdate";
		this.EE_DetectedTarget             = "EE_DetectedTarget";
		this.EE_SearchableTarget           = "EE_SearchableTarget";

		this.EE_cameraZoomChanged          = "EE_cameraZoomChanged";
		this.EE_cameraFlashChanged         = "EE_cameraFlashChanged";

		this.EE_displayParameters          = "EE_displayParameters";
		this.EE_updateParameters           = "EE_updateParameters";

		this.EE_requestGamePad             = "EE_requestGamePad";
		this.EE_releaseGamePad             = "EE_releaseGamePad";

		this.EE_GamePad_Connected           = "EE_GamePad_Connected";
		this.EE_GamePad_Disconnected        = "EE_GamePad_Disconnected";
		this.EE_GamePad_Axes_Updated		 = "EE_GamePad_Axes_Updated";
		this.EE_GamePad_Button_Updated		 = "EE_GamePad_Button_Updated";


		this.EE_displayStreamDlgForm        = "EE_displayStreamDlgForm";
		this.EE_hideStreamDlgForm           = "EE_hideStreamDlgForm";

		this.EE_displayCameraDlgForm        = "EE_displayCameraDlgForm";
		this.EE_hideCameraDlgForm           = "EE_hideCameraDlgForm";

		this.EE_onMissionItemToggle         = "EE_onMissionItemToggle";

		this.EE_onAdvancedMode              = "_MS_96A4ED6B1E5_";
		this.EE_ErrorMessage                = "_E_A642XYZB4E4_";
		this.EE_adsbExpiredUpdate           = "_E_XXAZQD6B3E4_";


		this.EE_Auth_Logined      		 	 = "_EA_96A4ED6B1E1_";
		this.EE_Auth_BAD_Logined      		 = "_EA_96A4ED6B1E2_";
		this.EE_Auth_Account_Created		 = "_EA_96A4ED6B1E3_";
		this.EE_Auth_Account_Regenerated	 = "_EA_96A4ED6B1E4_";
		this.EE_Auth_Account_BAD_Operation	 = "_EA_96A4ED6B1E5_";
		

		// EOF LOCAL EVENTS


		this.CONST_MAX_SDR_SPECTRUM_LENGTH = 100;				
		this.CONST_EXPERIMENTAL_FEATURES_ENABLED = false; // KEEP it above code block and keep it unchanged



		this.CONST_MAP_GOOLE_PLUGIN   = false; 
		this.CONST_MAP_GOOLE   = false; 
		this.CONST_MAP_EDITOR  = false;


		// CHOOSE YOUR MAP SOURCE
		this.VAR_MAP_LEAFLET_URL = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaHNhYWQiLCJhIjoiY2tqZnIwNXRuMndvdTJ4cnV0ODQ4djZ3NiJ9.LKojA3YMrG34L93jRThEGQ";
		//VAR_MAP_LEAFLET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
		//VAR_MAP_LEAFLET_URL = "https://airgap.droneengage.com:88/{x}_{y}_{z}.jpeg" //LOCAL MAP
		//VAR_MAP_LEAFLET_URL = "http://127.0.0.1:9991/{x}_{y}_{z}.jpeg" //LOCAL MAP

		this.CONST_PRO_VERSION = false;
		this.CONST_DISABLE_ADSG = true;
		
	}

	static getInstance() {
        if (!GLOBALS.instance) {
            GLOBALS.instance = new GLOBALS();
        }
        return GLOBALS.instance;
    }

    




	

	fn_date_now()
	{
		return Date.now();
	}

		
}

export var js_globals = GLOBALS.getInstance();