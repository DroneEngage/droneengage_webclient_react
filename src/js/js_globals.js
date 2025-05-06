
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


		this.swarm_quad_location_icon = [
						'./images/drone_q1_32x32.png',
						'./images/drone_q2_32x32.png',
						'./images/drone_q3_32x32.png',
						'./images/drone_q4_32x32.png',
						];
		
		this.swarm_plane_location_icon = [
							'./images/drone_1_32x32.png',
							'./images/drone_2_32x32.png',
							'./images/drone_3_32x32.png',
							'./images/drone_4_32x32.png',
							];
	


		this.CONST_DFM_FAR                 					= 3000; // more than 10 Km is far.
		this.CONST_DFM_SAFE                					= 1000; // less than 1 Km is safe.
		this.CONST_MAX_MESSAGE_LOG         					= 100; 

		this.v_displayMode                   				= 0;
		this.active_gamepad_index            				= 0;

		// Metric System        
		this.v_useMetricSystem               				= true;

		this.CONST_DEFAULT_ALTITUDE          				= 100;  //  m
		this.CONST_DEFAULT_RADIUS            				= 50;   //  m
		this.CONST_DEFAULT_ALTITUDE_min      				= 1;    //  m		
		this.CONST_DEFAULT_ALTITUDE_STEP     				= 3;    //  m		
		this.CONST_DEFAULT_RADIUS_min        				= 5;    //  m
		this.CONST_DEFAULT_SPEED_MIN         				= 5;    //  m/s
		this.CONST_DEFAULT_SPEED_STEP        				= 1;    //  m/s
		this.CONST_DEFAULT_VOLUME            				= 50;
		this.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE 		= 10; // m
		this.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE   		= 2; // m
		this.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN 	= 10; // m
		this.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN   	= 2; // m

		// GUI 
		this.CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT 			= 40;


		this.v_EnableADSB     			= false;
		this.v_en_Drone      			= true;
		this.v_en_GCS         			= true;
		this.v_enable_tabs_display 		= false;
		this.v_enable_unit_sort 		= true;
		this.v_enable_gcs_display 		= false;
		this.v_gamePadMode 				= 2;

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

		//////////////////////////////////
		//LOCAL EVENTS
		this.EE_WS_OPEN                            	= "EVT_1";
		this.EE_WS_CLOSE                           	= "EVT_2";
		this.EE_onDeleted                          	= "EVT_3";
		this.EE_msgFromUnit_GPS                    	= "EVT_4";
		this.EE_msgFromUnit_IMG                    	= "EVT_5";
		this.EE_andruavUnitAdded                   	= "EVT_6";
		this.EE_HomePointChanged                   	= "EVT_7";
		this.EE_DistinationPointChanged            	= "EVT_8";
		this.EE_andruavUnitError                   	= "EVT_9";
		this.EE_andruavUnitGeoFenceUpdated         	= "EVT_10";
		this.EE_andruavUnitGeoFenceHit             	= "EVT_11";
		this.EE_msgFromUnit_WayPoints              	= "EVT_12";
		this.EE_msgFromUnit_WayPointsUpdated       	= "EVT_13";
		this.EE_andruavUnitArmedUpdated            	= "EVT_14";
		this.EE_andruavUnitGeoFenceBeforeDelete    	= "EVT_15";
		this.EE_andruavUnitFCBUpdated              	= "EVT_16";
		this.EE_andruavUnitFlyingUpdated           	= "EVT_17";
		this.EE_andruavUnitFightModeUpdated        	= "EVT_18";
		this.EE_andruavUnitVehicleTypeUpdated      	= "EVT_19";
		this.EE_onProxyInfoUpdated		   		   	= "EVT_20";
		this.EE_onAndruavUnitSwarmUpdated		   	= "EVT_21";
		this.EE_andruavUnitLidarInfo			   	= "EVT_22";
		this.EE_andruavUnitLidarShow   	   	       	= "EVT_23";
		this.EE_onMessage                  			= "EVT_24";    
		this.EE_onModuleUpdated			   			= "EVT_25";
		this.EE_onPreferenceChanged        			= "EVT_26";
		this.EE_unitAdded                  			= "EVT_27";
		this.EE_unitUpdated                			= "EVT_28";
		this.EE_unitHighlighted            			= "EVT_29";
		this.EE_unitOnlineChanged          			= "EVT_30";
		this.EE_unitPowUpdated             			= "EVT_31";
		this.EE_unitP2PUpdated             			= "EVT_32";
		this.EE_unitSDRUpdated             			= "EVT_33";
		this.EE_unitSDRSpectrum            			= "EVT_34";
		this.EE_unitSDRTrigger						= "EVT_35";
		this.EE_unitNavUpdated             			= "EVT_36";
		this.EE_onSocketStatus             			= "EVT_37";
		this.EE_onSocketStatus2            			= "EVT_38";
		this.EE_onGUIMessage               			= "EVT_39";
		this.EE_onGUIMessageHide           			= "EVT_40";
		this.EE_updateLogin                			= "EVT_41";
		this.EE_videoStreamStarted         			= "EVT_42";
		this.EE_videoStreamRedraw          			= "EVT_43";
		this.EE_videoStreamStopped         			= "EVT_44";
		this.EE_unitTelemetryOn            			= "EVT_45";
		this.EE_unitTelemetryOff           			= "EVT_46";
		this.EE_BattViewToggle             			= "EVT_47";
		this.EE_EKFViewToggle              			= "EVT_48";
		this.EE_adsbExchangeReady         			= "EVT_49";
		this.EE_displayGeoForm             			= "EVT_50";
		this.EE_onShapeCreated             			= "EVT_51";
		this.EE_onShapeSelected            			= "EVT_52";
		this.EE_onMissionReset            			= "EVT_53";
		this.EE_onShapeEdited              			= "EVT_54";
		this.EE_onShapeDeleted             			= "EVT_55";
		this.EE_mapMissionUpdate           			= "EVT_56";
		this.EE_displayServoForm           			= "EVT_57";
		this.EE_servoOutputUpdate          			= "EVT_58";
		this.EE_DetectedTarget             			= "EVT_59";
		this.EE_SearchableTarget           			= "EVT_60";

		this.EE_cameraZoomChanged          			= "EVT_61";
		this.EE_cameraFlashChanged         			= "EVT_62";

		this.EE_displayParameters          			= "EVT_63";
		this.EE_updateParameters           			= "EVT_64";

		this.EE_requestGamePad             			= "EVT_65";
		this.EE_releaseGamePad             			= "EVT_66";

		this.EE_GamePad_Connected          	 		= "EVT_67";
		this.EE_GamePad_Disconnected        		= "EVT_68";
		this.EE_GamePad_Axes_Updated		 		= "EVT_69";
		this.EE_GamePad_Button_Updated		 		= "EVT_70";


		this.EE_displayStreamDlgForm        		= "EVT_71";
		this.EE_hideStreamDlgForm           		= "EVT_72";

		this.EE_displayYawDlgForm					= "EVT_73";
		this.EE_displayCameraDlgForm        		= "EVT_74";
		this.EE_hideCameraDlgForm           		= "EVT_75";

		this.EE_onPlanToggle         				= "EVT_76";
		this.EE_onAdvancedMode              		= "EVT_77";
		this.EE_ErrorMessage                		= "EVT_78";
		this.EE_adsbExpiredUpdate           		= "EVT_79";


		this.EE_Auth_Login_In_Progress				= "EVT_80";
		this.EE_Auth_Logined      		 	 		= "EVT_81";
		this.EE_Auth_BAD_Logined      		 		= "EVT_82";
		this.EE_Auth_Account_Created		 		= "EVT_83";
		this.EE_Auth_Account_Regenerated	 		= "EVT_84";
		this.EE_Auth_Account_BAD_Operation	 		= "EVT_85";
		
		this.EE_Video_State_Change           		= "EVT_86";
		this.EE_unitGPIOUpdated             		= "EVT_87";
		
		this.EE_onMissionItemToggle					= "EVT_88"; 
		
		// EOF LOCAL EVENTS


		this.CONST_MAX_SDR_SPECTRUM_LENGTH = 100;				
		this.CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH = 100;

		this.CONST_EXPERIMENTAL_FEATURES_ENABLED = true; // KEEP it above code block and keep it unchanged



		this.CONST_MAP_GOOLE_PLUGIN   = false; 
		this.CONST_MAP_GOOLE   = false; 
		this.CONST_MAP_EDITOR  = false;


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

export const js_globals = GLOBALS.getInstance();