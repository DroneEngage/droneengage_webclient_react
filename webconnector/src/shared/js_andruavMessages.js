/**
 * Constants for Andruav/Ardupilot-Cloud client-side authentication and communication.
 * Aligns with backend's global.c_CONSTANTS for API interactions.
 * Extracted from provided server and client code.
 */

/**
 * API endpoint paths.
 */
export const CONST_LOGOUT_COMMAND = 'logout'; // Added for logout endpoint

/**
 * Request parameter keys.
 */
export const CONST_APP_GROUP_PARAMETER = 'gr'; // from fn_newLoginCard, js_router_web.js
export const CONST_APP_NAME_PARAMETER = 'app'; // from fn_newLoginCard, js_router_web.js
export const CONST_APP_VER_PARAMETER = 'ver'; // from fn_newLoginCard, js_router_web.js
export const CONST_EXTRA_PARAMETER = 'ex'; // from fn_newLoginCard, js_router_web.js
export const CONST_PERMISSION = 'per'; // from fn_generateLoginReplyToParty
export const CONST_PERMISSION2 = 'prm'; // from fn_generateLoginReplyToParty
export const CONST_COMM_SERVER = 'cs'; // from fn_handleLoginResponses
export const CONST_CS_SERVER_PUBLIC_HOST = 'g'; // from fn_handleLoginResponses
export const CONST_CS_SERVER_PORT = 'h'; // from fn_handleLoginResponses
export const CONST_CS_LOGIN_TEMP_KEY = 'f'; // from fn_handleLoginResponses
export const CONST_CS_REQUEST_ID = 'r'; // from fn_handleLoginResponses, fn_requestCommunicationLogin
export const CONST_CS_ACCOUNT_ID = 'a'; // from fn_requestCommunicationLogin
export const CONST_CS_GROUP_ID = 'gr'; // from fn_requestCommunicationLogin
export const CONST_CS_SENDER_ID = 's'; // from fn_removePartyCommunicationSession
export const CONST_INSTANCE_LIMIT = 'il'; // from fn_requestCommunicationLogin

/**
 * Command values for account operations.
 */
export const CONST_CMD_GET_ACCOUNT_NAME = 'gan'; // from fn_accountOperation
export const CONST_CMD_VERIFY_HARDWARE_BY_ID = 'vhw'; // from fn_hardwareOperationFromAgent

/**
 * Error codes.
 */
export const CONST_ERROR_NON = 0; // from fn_createLoginCard, fn_accountOperation
export const CONST_ERROR_ACCOUNT_NOT_FOUND = 1; // Implied from fn_createLoginCard
export const CONST_ERROR_NO_PERMISSION = 2; // from fn_newLoginCard
export const CONST_ERROR_OLD_APP_VERSION = 3; // from fn_checkAppVersion
export const CONST_ERROR_SERVER_NOT_AVAILABLE = 4; // from fn_handleLoginResponses
export const CONST_ERROR_SESSION_NOT_FOUND = 5; // from fn_hardwareOperationFromAgent
export const CONST_ERROR_HARDWARE_NOT_FOUND = 6; // from fn_do_verifyHardwareByAccountSID
export const CONST_ERROR_DATA_UNKNOWN_ERROR = 7; // from fn_sendSubscriptionEmail



/**
 * Command values for communication server messages.
 */
export const CONST_CS_CMD_INFO = 'i'; // from fn_handleServerInfo
export const CONST_CS_CMD_LOGIN_REQUEST = 'lr'; // from fn_handleLoginResponses
export const CONST_CS_CMD_LOGOUT_REQUEST = 'lo'; // from fn_removePartyCommunicationSession

/**
 * Other constants.
 */
export const CONST_COMMAND = 'c'; // from fn_checkAppVersion, js_router_web.js
// 
// Params of AUTH

export const CONST_HEALTH_FUNCTION = "/h";
export const CONST_WEB_FUNCTION = "/w";
export const CONST_WEB_LOGIN_COMMAND = "/wl/";
export const CONST_WEB_LOGOUT_COMMAND = "/wo/";
export const CONST_ACCOUNT_MANAGMENT = "/am/";
export const CONST_CMD_CREATE_ACCESSCODE = "c";
export const CONST_CMD_REGENERATE_ACCESSCODE = "r";

export const CONST_ACCOUNT_NAME_PARAMETER = "acc";
export const CONST_ACCESS_CODE_PARAMETER = "pwd";
export const CONST_ACCOUNT_ID_PARAMETER = "aid";
export const CONST_LOGIN_ID_PARAMETER = "lid";
export const CONST_SUB_COMMAND = "scm";
export const CONST_ERROR_MSG = "em";
export const CONST_ACTOR_TYPE = "at";
export const CONST_SESSION_ID = "sid";
export const CONST_PERMISSION_PARAMETER = "prm";

// AndruaveMessageID

export const CONST_TYPE_AndruavMessage_GPS = 1002;
export const CONST_TYPE_AndruavMessage_POW = 1003;
export const CONST_TYPE_AndruavMessage_ID = 1004;
export const CONST_TYPE_AndruavMessage_RemoteExecute = 1005;
export const CONST_TYPE_AndruavMessage_Telemetry = 1007;
export const CONST_TYPE_AndruavMessage_Error = 1008;
export const CONST_TYPE_AndruavMessage_FlightControl = 1010;
export const CONST_TYPE_AndruavMessage_VideoFrame = 1014;
export const CONST_TYPE_AndruavMessage_IMG = 1006;
export const CONST_TYPE_AndruavMessage_CameraList = 1012; // RX: {"tg":"GCS1","sd":"zxcv","ty":"c","gr":"1","cm":"i","mt":1012,"ms":"{\"E\":2,\"P\":0,\"I\":\"zxcv\"}"}
export const CONST_TYPE_AndruavMessage_IMU = 1013;
export const CONST_TYPE_AndruavMessage_BinaryIMU = 1013;
export const CONST_TYPE_AndruavMessage_IMUStatistics = 1016;
export const CONST_TYPE_AndruavMessage_DroneReport = 1020;
export const CONST_TYPE_AndruavMessage_HomeLocation = 1022;
export const CONST_TYPE_AndruavMessage_GeoFence = 1023;
export const CONST_TYPE_AndruavMessage_ExternalGeoFence = 1024;
export const CONST_TYPE_AndruavMessage_GEOFenceHit = 1025;
export const CONST_TYPE_AndruavMessage_WayPoints = 1027;
export const CONST_TYPE_AndruavMessage_ExternalCommand_WayPoints = 1028;
export const CONST_TYPE_AndruavMessage_GeoFenceAttachStatus = 1029;
export const CONST_TYPE_AndruavMessage_Arm = 1030;
export const CONST_TYPE_AndruavMessage_ChangeAltitude = 1031;
export const CONST_TYPE_AndruavMessage_Land = 1032;
export const CONST_TYPE_AndruavMessage_DoYAW = 1035;
export const CONST_TYPE_AndruavMessage_Signaling = 1021;
export const CONST_TYPE_AndruavMessage_GuidedPoint = 1033;
export const CONST_TYPE_AndruavMessage_CirclePoint = 1034;
export const CONST_TYPE_AndruavMessage_NAV_INFO = 1036;
export const CONST_TYPE_AndruavMessage_DistinationLocation = 1037;
export const CONST_TYPE_AndruavMessage_ChangeSpeed = 1040;
export const CONST_TYPE_AndruavMessage_Ctrl_Camera = 1041;
// CODEBLOCK_START
export const CONST_TYPE_AndruavMessage_TargetTracking_ACTION = 1042;
export const CONST_TYPE_AndruavMessage_TargetTrackingtLocation = 1043;
export const CONST_TYPE_AndruavMessage_TargetTracking_STATUS = 1044;
// CODEBLOCK_END
export const CONST_TYPE_AndruavMessage_GimbalCtrl = 1045;
export const CONST_TYPE_AndruavMessage_UploadWayPoints = 1046;
export const CONST_TYPE_AndruavMessage_RemoteControlSettings = 1047;
export const CONST_TYPE_AndruavMessage_SetHomeLocation = 1048;
export const CONST_TYPE_AndruavMessage_CameraZoom = 1049;
export const CONST_TYPE_AndruavMessage_CameraSwitch = 1050;
export const CONST_TYPE_AndruavMessage_CameraFlash = 1051;
export const CONST_TYPE_AndruavMessage_RemoteControl2 = 1052;
export const CONST_TYPE_AndruavMessage_SensorsStatus = 1053;

export const CONST_TYPE_AndruavMessage_FollowHim_Request = 1054;
export const CONST_TYPE_AndruavMessage_FollowMe_Guided = 1055;
export const CONST_TYPE_AndruavMessage_MakeSwarm = 1056;
export const CONST_TYPE_AndruavMessage_SwarmReport = 1057;
export const CONST_TYPE_AndruavMessage_UpdateSwarm = 1058;


export const CONST_TYPE_AndruavMessage_CommSignalsStatus = 1059;
export const CONST_TYPE_AndruavMessage_Sync_EventFire = 1061;
export const CONST_TYPE_AndruavMessage_SearchTargetList = 1062;
export const CONST_TYPE_AndruavMessage_UdpProxy_Info = 1071;
export const CONST_TYPE_AndruavMessage_Unit_Name = 1072;
export const CONST_TYPE_AndruavMessage_Ping_Unit = 1073;

export const CONST_TYPE_AndruavMessage_Upload_DE_Mission = 1075;

export const CONST_TYPE_AndruavMessage_AI_Recognition_ACTION = 1076;
export const CONST_TYPE_AndruavMessage_AI_Recognition_STATUS = 1077;

export const CONST_TYPE_AndruavMessage_Viewlink_ACTION = 1079;
export const CONST_TYPE_AndruavMessage_Viewlink_STATUS = 1080;

export const CONST_TYPE_AndruavMessage_DEPilot_Control = 1081;
export const CONST_TYPE_AndruavMessage_Chat = 1082;

// Binary Messages
export const CONST_TYPE_AndruavMessage_LightTelemetry = 2022;

// new Andruav Messages 2019
export const CONST_TYPE_AndruavMessage_ServoChannel = 6001;
export const CONST_TYPE_AndruavBinaryMessage_ServoOutput = 6501;
export const CONST_TYPE_AndruavBinaryMessage_Mavlink = 6502;
export const CONST_TYPE_AndruavBinaryMessage_SWARM_Mavlink = 6503;
export const CONST_TYPE_AndruavMessage_P2P_ACTION = 6505;
export const CONST_TYPE_AndruavMessage_P2P_STATUS = 6506;
export const CONST_TYPE_AndruavMessage_P2P_InRange_BSSID = 6507;
export const CONST_TYPE_AndruavMessage_P2P_InRange_Node = 6508;
export const CONST_TYPE_AndruavMessage_Set_Communication_Line = 6509;
export const CONST_TYPE_AndruavMessage_Communication_Line_Status = 6510;
export const CONST_TYPE_AndruavMessage_SOUND_TEXT_TO_SPEECH = 6511;
export const CONST_TYPE_AndruavMessage_SOUND_PLAY_FILE = 6512;

export const CONST_TYPE_AndruavMessage_SDR_TRIGGER = 6513;
export const CONST_TYPE_AndruavMessage_SDR_ACTION = 6514;
export const CONST_TYPE_AndruavMessage_SDR_REMOTE_EXECUTE = 6515;
export const CONST_TYPE_AndruavMessage_SDR_SPECTRUM = 6516;
export const CONST_TYPE_AndruavMessage_P2P_INFO = 6517;

export const CONST_TYPE_AndruavMessage_Mission_Item_Sequence = 6518;


export const CONST_TYPE_AndruavMessage_GPIO_ACTION = 6519;
export const CONST_TYPE_AndruavMessage_GPIO_STATUS = 6520;
export const CONST_TYPE_AndruavMessage_GPIO_REMOTE_EXECUTE = 6521;


/**
 * @brief Set IP/Port of Local Communication Server.
 * current fields are:
 * [u]: url/ip
 * [p]: port
 */
export const CONST_TYPE_AndruavMessage_LocalServer_ACTION = 6522;
export const CONST_TYPE_AndruavMessage_LocalServer_STATUS = 6523;
export const CONST_TYPE_AndruavMessage_LocalServer_REMOTE_EXECUTE = 6524;

export const CONST_TYPE_AndruavMessage_CONFIG_ACTION = 6525;
export const CONST_TYPE_AndruavMessage_CONFIG_STATUS = 6526;


// System Messages
export const CONST_TYPE_AndruavSystem_LoadTasks = 9001;
export const CONST_TYPE_AndruavSystem_SaveTasks = 9002;
export const CONST_TYPE_AndruavSystem_DeleteTasks = 9003;
export const CONST_TYPE_AndruavSystem_DisableTasks = 9004;
export const CONST_TYPE_AndruavSystem_LogoutCommServer = 9006;
export const CONST_TYPE_AndruavSystem_ConnectedCommServer = 9007;


export const CONST_TYPE_SWARM_FOLLOW = 1;
export const CONST_TYPE_SWARM_UNFOLLOW = 2;

export const CONST_ALLOW_GCS = 0x00000001;
export const CONST_ALLOW_UNIT = 0x00000010;
export const CONST_ALLOW_GCS_FULL_CONTROL = 0x00000f00;
export const CONST_ALLOW_GCS_WP_CONTROL = 0x00000100;
export const CONST_ALLOW_GCS_MODES_CONTROL = 0x00000200;
export const CONST_ALLOW_GCS_VIDEO = 0x0000f000;

export const CONST_DESTINATION_GUIDED_POINT = 0;
export const CONST_DESTINATION_SWARM_MY_LOCATION = 1;

// Camera_List_Specification Field
export const CONST_CAMERA_SUPPORT_ZOOMING = 0x1;
export const CONST_CAMERA_SUPPORT_ROTATION = 0x2;
export const CONST_CAMERA_SUPPORT_RECORDING = 0x4;
export const CONST_CAMERA_SUPPORT_PHOTO = 0x8;
export const CONST_CAMERA_SUPPORT_DUAL_CAM = 0x10;
export const CONST_CAMERA_SUPPORT_FLASHING = 0x20;

// SWARM FORMATION
export const CONST_TASHKEEL_SERB_NO_SWARM = 0;
export const CONST_TASHKEEL_SERB_THREAD = 1;
export const CONST_TASHKEEL_SERB_ARROW = 2; // requires angle
export const CONST_TASHKEEL_SERB_VECTOR = 3;
export const CONST_TASHKEEL_SERB_COUNT = 2;


// Tracking Target Action TYPE_AndruavMessage_TargetTracking_ACTION
export const CONST_TargetTracking_ACTION_TRACKING_POINT = 0;
export const CONST_TargetTracking_ACTION_TRACKING_REGION = 1;
export const CONST_TargetTracking_ACTION_TRACKING_STOP = 2;
export const CONST_TargetTracking_ACTION_TRACKING_PAUSE = 3;
export const CONST_TargetTracking_ACTION_TRACKING_ENABLE = 4;
export const CONST_TargetTracking_ACTION_TRACKING_CONFIG = 5;
export const CONST_TargetTracking_ACTION_TRACKING_AI_DRIVER_ENABLE = 6;
export const CONST_TargetTracking_ACTION_TRACKING_AI_DRIVER_DISABLE = 7;

// Tracking Target Action TYPE_AndruavMessage_TargetTracking_STATUS
export const CONST_TargetTracking_STATUS_TRACKING_LOST = 0;
export const CONST_TargetTracking_STATUS_TRACKING_DETECTED = 1;
export const CONST_TargetTracking_STATUS_TRACKING_ENABLED = 2;
export const CONST_TargetTracking_STATUS_TRACKING_STOPPED = 3;


// TYPE_AndruavMessage_AI_Recognition_ACTION
export const CONST_TargetTracking_ACTION_AI_Recognition_POINT = 0;
export const CONST_TargetTracking_ACTION_AI_Recognition_SEARCH = 1;
export const CONST_TargetTracking_ACTION_AI_Recognition_DISABLE = 2;
export const CONST_TargetTracking_ACTION_AI_Recognition_ENABLE = 3;
export const CONST_TargetTracking_ACTION_AI_Recognition_CLASS_LIST = 4;

// Tracking Target Action TYPE_AndruavMessage_AI_Recognition_STATUS
export const CONST_TargetTracking_STATUS_AI_Recognition_LOST = 0;
export const CONST_TargetTracking_STATUS_AI_Recognition_DETECTED = 1;
export const CONST_TargetTracking_STATUS_AI_Recognition_ENABLED = 2;
export const CONST_TargetTracking_STATUS_AI_Recognition_DISABLED = 3;
export const CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST = 4;

// AndruavMessage_RemoteExecute Commands
export const CONST_RemoteCommand_MAKETILT = 100;
export const CONST_RemoteCommand_TAKEIMAGE = 102;
export const CONST_RemoteCommand_MAKEBEEP = 103;
export const CONST_RemoteCommand_SENDSMS = 104;
export const CONST_RemoteCommand_ROTATECAM = 105;
export const CONST_RemoteCommand_IMUCTRL = 106;
export const CONST_RemoteCommand_TELEMETRYCTRL = 108;
export const CONST_RemoteCommand_NOTIFICATION = 109;
export const CONST_RemoteCommand_STREAMVIDEO = 110;
export const CONST_RemoteCommand_RECORDVIDEO = 111;
export const CONST_RemoteCommand_STREAMVIDEORESUME = 112;
export const CONST_RemoteCommand_SWITCHCAM = 114;
export const CONST_RemoteCommand_SET_GPS_SOURCE = 115;
export const CONST_RemoteCommand_CONNECT_FCB = 118;
export const CONST_RemoteCommand_GET_WAY_POINTS = 500;
export const CONST_RemoteCommand_RELOAD_WAY_POINTS_FROM_FCB = 501;
export const CONST_RemoteCommand_CLEAR_WAY_POINTS = 502;
export const CONST_RemoteCommand_CLEAR_FENCE_DATA = 503;
export const CONST_RemoteCommand_SET_START_MISSION_ITEM = 504;
export const CONST_RemoteCommand_REQUEST_PARAM_LIST = 505;
export const CONST_RemoteCommand_SET_UDPPROXY_CLIENT_PORT = 506;
export const CONST_RemoteCommand_MISSION_COUNT = 507;
export const CONST_RemoteCommand_MISSION_CURRENT = 508;

// P2P Actions
export const CONST_P2P_ACTION_RESTART_TO_MAC = 0;
export const CONST_P2P_ACTION_CONNECT_TO_MAC = 1;
export const CONST_P2P_ACTION_CANDICATE_MAC = 2;
export const CONST_P2P_ACTION_SCAN_NETWORK = 3;
export const CONST_P2P_ACTION_ACCESS_TO_MAC = 4;

// SDR Actions
export const CONST_SDR_ACTION_CONNECT = 0;
export const CONST_SDR_ACTION_DISCONNECT = 1;
export const CONST_SDR_ACTION_LIST_SDR_DEVICES = 2;
export const CONST_SDR_ACTION_SET_CONFIG = 3;
export const CONST_SDR_ACTION_READ_DATA = 4;
export const CONST_SDR_ACTION_PAUSE_DATA = 5;
export const CONST_SDR_ACTION_SDR_INFO = 6;
export const CONST_SDR_ACTION_TRIGGER = 7;

// SDR STATUS
export const CONST_SDR_STATUS_NOT_CONNECTED = 0;
export const CONST_SDR_STATUS_CONNECTED = 1;
export const CONST_SDR_STATUS_STREAMING_ONCE = 2;
export const CONST_SDR_STATUS_STREAMING_INTERVALS = 3;
export const CONST_SDR_STATUS_ERROR = 999;


// GPIO Messages for CONST_TYPE_AndruavMessage_GPIO_ACTION
export const CONST_GPIO_ACTION_PORT_CONFIG = 0;
export const CONST_GPIO_ACTION_INFO = 1;
export const CONST_GPIO_ACTION_PORT_WRITE = 2;
export const CONST_GPIO_ACTION_PORT_READ = 3;

// LinkView Actions
export const CONST_VIEWLINK_ACTION_LASER_CONTROL = 1;
export const CONST_VIEWLINK_ACTION_TRACKER_CONTROL = 2;
export const CONST_VIEWLINK_ACTION_AI_CONTROL = 3;
export const CONST_VIEWLINK_ACTION_CAMERA_CONTROL = 4;
export const CONST_VIEWLINK_ACTION_GIMBAL_CONTROL = 5;
export const CONST_VIEWLINK_ACTION_GET_STATUS = 6;

//CONST_VIEWLINK_ACTION_LASER_CONTROL
export const VIEWLINK_LASER_ON = 1;
export const VIEWLINK_LASER_OFF = 2;
export const VIEWLINK_LASER_SYSTEM_AUTOCHECK = 0x03;
export const VIEWLINK_LASER_ZOOM_OUT = 0x04;
export const VIEWLINK_LASER_ZOOM_IN = 0x05;
export const VIEWLINK_LASER_ZOOM_AUTO_SYNC = 0x06;
export const VIEWLINK_LASER_ZOOM_MANUAL = 0x07;
export const VIEWLINK_LASER_ZOOM_STOP = 0x08;
export const VIEWLINK_LASER_FLASHING_MODE = 0x09;
export const VIEWLINK_LASER_BRIGHTNESS_ADJ = 0x0A;
export const VIEWLINK_LASER_FLASH_FREQ = 0x0B;
export const VIEWLINK_LASER_ELEVATION_PROTECT_OFF = 0x0E;
export const VIEWLINK_LASER_ELEVATION_PROTECT_ON = 0x0F;
export const VIEWLINK_LASER_SINGLE_RANGE_FINDER_ON = 0x10;
export const VIEWLINK_LASER_CONTINUOUS_RANGE_FINDER_ON = 0x11;
export const VIEWLINK_LASER_LPCL_CONTINUOUS_RANGING_FINDER_ON = 0x12;
export const VIEWLINK_LASER_RANGE_FINDER_OFF = 0x13;

//CONST_VIEWLINK_ACTION_TRACKER_CONTROL
export const VIEWLINK_TRACKER_ON = 1;
export const VIEWLINK_TRACKER_OFF = 2;
export const VIEWLINK_TRACKER_SEARCH = 3;
export const VIEWLINK_TRACKING_SPEED_ADJUSTMENT = 4;
export const VIEWLINK_ADJUST_CROSS_POSITION = 5;
//CONST_VIEWLINK_ACTION_AI_CONTROL
export const VIEWLINK_AI_ON = 1;
export const VIEWLINK_AI_OFF = 2;
//CONST_VIEWLINK_ACTION_CAMERA_CONTROL
export const VIEWLINK_CAMERA_ACTIVATE_EO = 1;
export const VIEWLINK_CAMERA_ACTIVATE_IR = 2;
export const VIEWLINK_CAMERA_ACTIVATE_PIP = 3;
export const VIEWLINK_CAMERA_ACTIVATE_PIP_IR = 4;
export const VIEWLINK_CAMERA_START_RECORDING = 5;
export const VIEWLINK_CAMERA_STOP_RECORDING = 6;
export const VIEWLINK_CAMERA_TAKE_PHOTO = 7;
export const VIEWLINK_CAMERA_SET_OPTICAL_ZOOM_LEVEL = 8;
export const VIEWLINK_CAMERA_SET_IR_DIGITAL_ZOOM_LEVEL = 9;
export const VIEWLINK_CAMERA_ACTIVATE_IR_HOT_WHITE = 10
export const VIEWLINK_CAMERA_ACTIVATE_IR_HOT_BLACK = 11
//CONST_VIEWLINK_ACTION_GIMBAL_CONTROL
export const VIEWLINK_GIMBAL_MOTOR_ON = 1;
export const VIEWLINK_GIMBAL_MOTOR_OFF = 2;
export const VIEWLINK_GIMBAL_CENTER = 3;
export const VIEWLINK_GIMBAL_ABSOLUTE_POSITION = 4;
export const VIEWLINK_GIMBAL_INCREMENTAL_ADJUST = 5;
export const VIEWLINK_STATUS_GIMBAL_ATTITUDE = 6;
export const VIEWLINK_STATUS_ALL = 7;


// Module Config 
export const CONST_TYPE_CONFIG_ACTION_Restart = 0;
export const CONST_TYPE_CONFIG_ACTION_APPLY_CONFIG = 1;
export const CONST_TYPE_CONFIG_REQUEST_FETCH_CONFIG_TEMPLATE = 2;
export const CONST_TYPE_CONFIG_REQUEST_FETCH_CONFIG = 3;
export const CONST_TYPE_CONFIG_ACTION_SHUT_DOWN_HW = 4;
export const CONST_TYPE_CONFIG_ACTION_RESTART_HW = 5;

export const CONST_TYPE_CONFIG_STATUS_FETCH_CONFIG_TEMPLATE = 0;
export const CONST_TYPE_CONFIG_STATUS_FETCH_CONFIG = 1;


// FenceType
export const CONST_TYPE_LinearFence = 1;
export const CONST_TYPE_PolygonFence = 2;
export const CONST_TYPE_CylinderFence = 3;

// Camera source
export const CONST_CAMERA_SOURCE_MOBILE = 1;
export const CONST_CAMERA_SOURCE_FCB = 2;

// WayPoints
export const CONST_WAYPOINT_SIZE = 41; // size of bytes of a waypoint

export const CONST_WayPoint_TYPE_WAYPOINTSTEP_DE = -1; // same as mavlink
export const CONST_WayPoint_TYPE_WAYPOINTSTEP = 16; // same as mavlink
export const CONST_WayPoint_TYPE_TAKEOFF = 22; // same as mavlink
export const CONST_WayPoint_TYPE_LANDING = 21; // same as mavlink
export const CONST_WayPoint_TYPE_RTL = 20; // same as mavlink
export const CONST_WayPoint_TYPE_CIRCLE = 18; // same as mavlink MAV_CMD_NAV_LOITER_TURNS
export const CONST_WayPoint_TYPE_GUIDED = 92; // same as mavlink MAV_CMD_NAV_LOITER_TURNS
export const CONST_WayPoint_TYPE_SPLINE = 6;
export const CONST_WayPoint_TYPE_SPEED = 178; // same as amvlink
export const CONST_WayPoint_TYPE_CMissionAction_CONTINUE_AND_CHANGE_ALT = 30; // same as amvlink
export const CONST_WayPoint_TYPE_ChangeAlt = 113; // same as amvlink
export const CONST_WayPoint_TYPE_YAW = 115; // same as mavlink
export const CONST_WayPoint_TYPE_FIRE_EVENT = 9;
export const CONST_WayPoint_TYPE_WAIT_EVENT = 10;
export const CONST_WayPoint_TYPE_CAMERA_CONTROL = 203; // same as mavlink
export const CONST_WayPoint_TYPE_CAMERA_TRIGGER = 206; // same as mavlink

export const CONST_TelemetryProtocol_CONST_No_Telemetry = 0;
export const CONST_TelemetryProtocol_CONST_Andruav_Telemetry = 1;
export const CONST_TelemetryProtocol_CONST_Mavlink_Telemetry = 2;
export const CONST_TelemetryProtocol_CONST_MW_Telemetry = 3;
export const CONST_TelemetryProtocol_DroneKit_Telemetry = 4;
export const CONST_TelemetryProtocol_DJI_Telemetry = 5;
export const CONST_TelemetryProtocol_CONST_Unknown_Telemetry = 999;

export const CONST_TelemetryProtocol_SOURCE_LOCAL = 1;
export const CONST_TelemetryProtocol_Source_REMOTE = 2;
export const CONST_TelemetryProtocol_SOURCE_SIMULATED = 3;

// AndruavResala_DroneReport Commands
export const CONST_Report_NAV_ItemUnknown = 0;
export const CONST_Report_NAV_ItemReached = 1;
export const CONST_Report_NAV_ItemExecuting = 2;

// CONST_TYPE_AndruavMessage_CameraList
const EXTERNAL_CAMERATYPE_RTCWEBCAM = 2;

// Andruav Constants
const Default_Video_FrameResumeSize = 20;

// CONST_TYPE_AndruavMessage_CameraList
export const CONST_EXTERNAL_CAMERA_TYPE_UNKNOWN = 0;
export const CONST_EXTERNAL_CAMERA_TYPE_IPWEBCAM = 1;
export const CONST_EXTERNAL_CAMERA_TYPE_RTCWEBCAM = 2;
export const CONST_EXTERNAL_CAMERA_TYPE_FFMPEGWEBCAM = 3;

// CONST_TYPE_AndruavMessage_RemoteControlSettingsParams:
export const CONST_TX_SIGNAL_CENTER_ALL = 1;
export const CONST_TX_SIGNAL_FREEZE_ALL = 2;

// Info Types
export const CONST_INFOTYPE_RCCONTROL = 12;
export const CONST_INFOTYPE_TELEMETRY = 33;
export const CONST_INFOTYPE_PROTOCOL = 44;
export const CONST_INFOTYPE_CAMERA = 55;
export const CONST_INFOTYPE_KMLFILE = 66;
export const CONST_INFOTYPE_Lo7etTa7akom = 77;
export const CONST_INFOTYPE_GEOFENCE = 88;

// Telemetry Commands:
export const CONST_TELEMETRY_REQUEST_START = 1;
export const CONST_TELEMETRY_REQUEST_END = 2;
export const CONST_TELEMETRY_REQUEST_RESUME = 3;
export const CONST_TELEMETRY_ADJUST_RATE = 4;
export const CONST_TELEMETRY_REQUEST_PAUSE = 5;

// ENUM_TelemetryProtocol
export const CONST_No_Telemetry = 0;
export const CONST_Andruav_Telemetry = 1;
export const CONST_Mavlink_Telemetry = 2;
export const CONST_MW_Telemetry = 3;
export const CONST_Unknown_Telemetry = 999;

export const CONST_TELEMETRY_SOURCE_UNKNOWN = 0;
export const CONST_TELEMETRY_SOURCE_FCB = 1;
export const CONST_TELEMETRY_SOURCE_GCS = 2;

export const CONST_checkStatus_Interverl0 = 15000;
export const CONST_checkStatus_Interverl1 = 20000;
export const CONST_sendID_Interverl = 13000;
export const CONST_sendRXChannels_Interval = 250;
export const CONST_GAMEPAD_LONG_PRESS = 1250;
export const CONST_GAMEPAD_REPEATED = 3000;
export const CONST_PARAMETER_REPEATED = 500;

// P2P Connection Type
export const CONST_TYPE_UNKNOWN = 0;
export const CONST_TYPE_ESP32_MESH = 1;

// AndruavMessage_RemoteControlSettings
export const CONST_RC_ACTION_TAKE_CONTROL = 0;
export const CONST_RC_ACTION_RELEASE_CONTROL = 1;
// ------------------------------------------
export const CONST_RC_SUB_ACTION_RELEASED = 0;
export const CONST_RC_SUB_ACTION_CENTER_CHANNELS = 1;
export const CONST_RC_SUB_ACTION_FREEZE_CHANNELS = 2;
export const CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS = 4;
export const CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED = 8;

// FLASH STATUS of MEssage CONST_TYPE_AndruavMessage_CameraFlash
export const CONST_FLASH_OFF = 0;
export const CONST_FLASH_ON = 1;
export const CONST_FLASH_DISABLED = 999;

// FENCE TYPES
export const FENCETYPE_LinearFence = 1;
export const FENCETYPE_PolygonFence = 2;
export const FENCETYPE_CylindersFence = 3;

// SOCKET STATUS
export const CONST_SOCKET_STATUS_FREASH = 1; // socket is new
export const CONST_SOCKET_STATUS_CONNECTING = 2; // connecting to WS
export const CONST_SOCKET_STATUS_DISCONNECTING = 3; // disconnecting from WS
export const CONST_SOCKET_STATUS_DISCONNECTED = 4; // disconnected  from WS
export const CONST_SOCKET_STATUS_CONNECTED = 5; // connected to WS
export const CONST_SOCKET_STATUS_REGISTERED = 6; // connected and executed AddMe
export const CONST_SOCKET_STATUS_UNREGISTERED = 7; // connected but not registred
export const CONST_SOCKET_STATUS_ERROR = 8; // Error


//DEPILOT MODES
//CONST_TYPE_AndruavMessage_DEPilot_Control
export const  CONST_DEPILOT_OP_DISABLED = 0;        // OFF
export const  CONST_DEPILOT_OP_CHANGE_ALTITUDE = 1; // Changing Altitude
export const  CONST_DEPILOT_OP_STABILIZATION = 2;   // Stabilizing
export const  CONST_DEPILOT_OP_TRACKING = 3;        // Tracking
export const  CONST_DEPILOT_OP_IDLE = 999;          // IDLE


// GPIO Reserved Names
export const GPIO_CAMERA_FLASH_NAME = 'camera_flash';

export const message_names = {
  1002: "GPS - 1002",
  1003: "POW - 1003",
  1004: "ID - 1004",
  1005: "Remote Execute - 1005",
  1006: "Image - 1006",
  1008: "Text Message - 1008",
  1012: "CameraList - 1012",
  1013: "BinaryIMU - 1013",
  1016: "IMUStatistics - 1016",
  1020: "Drone Report - 1020",
  1021: "WBRTC Signaling - 1021",
  1022: "Home Location - 1022",
  1027: "WayPoints - 1027",
  1036: "NAV_INFO - 1036",
  1037: "Distination Location - 1037",
  1042: "TrackingTarget - 1042",
  1043: "TrackingTargetLocation - 1043",
  1044: "TargetStatus - 1044",
  1049: "Camera Zoom - 1049",
  1050: "Camera Switch - 1050",
  1051: "Camera Flash - 1051",
  1052: "RemoteControl2 - 1052",
  1071: "UdpProxy_Info - 1071",
  1073: "Ping Unit - 1073",
  1074: "P2P Info - 1074",
  1075: "Mission Upload - 1075",
  1076: "P2P AI_Action - 1076",
  1077: "AI-Status - 1077",
  1082: "Chat Message - 1082",


  6001: "ServoChannel - 6001",
  6501: "ServoOutput - 6501",
  6502: "Mavlink - 6502",
  6503: "SWARM - 6503",
  6506: "P2P Status - 6506",
  6507: "P2P in Range - 6507",
  6509: "Set Comm Line - 6509",
  6510: "Comm Line Status - 6510",
  6511: "Text to Speech - 6511",
  6512: "Play Sound File - 6512",
  6520: "GPIO Status - 6520",
};

export const swarm_formation_names = {
  0: "None",
  1: "Thread",
  2: "V-Arrow",
  3: "V-Shape",
};

// Pre-process message_names to ensure all keys have a value
export const getMessageName = (key) => {
  if (message_names[key] === undefined) { // Use undefined for a more robust check
    message_names[key] = String(key); // Convert key to string if it's a number
  }
  return message_names[key];
};
export const TYPE_MODULE_CLASS_COMM = "comm";
export const TYPE_MODULE_CLASS_FCB = "fcb";
export const TYPE_MODULE_CLASS_CAMERA = "camera";
export const TYPE_MODULE_CLASS_P2P = "p2p";
export const TYPE_MODULE_CLASS_SDR = "sdr";
export const TYPE_MODULE_CLASS_SOUND = "snd";
export const TYPE_MODULE_CLASS_GPIO = "gpio";
export const TYPE_MODULE_CLASS_TRACKING = "trk";
export const TYPE_MODULE_CLASS_AI_RECOGNITION = "ai_rec";
export const TYPE_MODULE_CLASS_VIEW_LINK = "vlk";
export const TYPE_MODULE_CLASS_GENERIC = "gen";
