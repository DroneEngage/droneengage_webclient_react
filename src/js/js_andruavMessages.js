// Params of AUTH

export const CONST_WEB_FUNCTION = "/w";
export const CONST_WEB_LOGIN_COMMAND = "/wl/";
export const CONST_ACCOUNT_MANAGMENT = "/am/";
export const CONST_CMD_CREATE_ACCESSCODE = "c";
export const CONST_CMD_REGENERATE_ACCESSCODE = "r";

export const CONST_ACCOUNT_NAME_PARAMETER = "acc";
export const CONST_ACCESS_CODE_PARAMETER = "pwd";
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
export const CONST_TYPE_AndruavMessage_TrackingTarget = 1042;
export const CONST_TYPE_AndruavMessage_TrackingTargetLocation = 1043;
export const CONST_TYPE_AndruavMessage_TargetLost = 1044;
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
// CODEBLOCK_START
export const CONST_TYPE_AndruavMessage_FollowHim_Request = 1054;
export const CONST_TYPE_AndruavMessage_FollowMe_Guided = 1055;
export const CONST_TYPE_AndruavMessage_MakeSwarm = 1056;
export const CONST_TYPE_AndruavMessage_SwarmReport = 1057;
export const CONST_TYPE_AndruavMessage_UpdateSwarm = 1058;
// CODEBLOCK_END

export const CONST_TYPE_AndruavMessage_CommSignalsStatus = 1059;
export const CONST_TYPE_AndruavMessage_Sync_EventFire = 1061;
export const CONST_TYPE_AndruavMessage_SearchTargetList = 1062;
export const CONST_TYPE_AndruavMessage_UdpProxy_Info = 1071;
export const CONST_TYPE_AndruavMessage_Unit_Name = 1072;
export const CONST_TYPE_AndruavMessage_Ping_Unit = 1073;
export const CONST_TYPE_AndruavMessage_P2P_INFO = 1074;

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
export const CONST_TASHKEEL_SERB_VECTOR = 2; // requires angle
export const CONST_TASHKEEL_SERB_VECTOR_180 = 3;

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

// FenceType
export const CONST_TYPE_LinearFence = 1;
export const CONST_TYPE_PolygonFence = 2;
export const CONST_TYPE_CylinderFence = 3;

// Camera source
export const CONST_CAMERA_SOURCE_MOBILE = 1;
export const CONST_CAMERA_SOURCE_FCB = 2;

// WayPoints
export const CONST_WAYPOINT_SIZE = 41; // size of bytes of a waypoint

export const CONST_WayPoint_TYPE_WAYPOINTSTEP = 16; // same as mavlink
export const CONST_WayPoint_TYPE_TAKEOFF = 22; // same as mavlink
export const CONST_WayPoint_TYPE_LANDING = 21; // same as mavlink
export const CONST_WayPoint_TYPE_RTL = 20; // same as mavlink
export const CONST_WayPoint_TYPE_CIRCLE = 18; // same as mavlink MAV_CMD_NAV_LOITER_TURNS
export const CONST_WayPoint_Guided_Enabled = 92; // same as mavlink MAV_CMD_NAV_LOITER_TURNS
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

export const message_names = {
  1002: "GPS - 1002",
  1003: "POW - 1003",
  1004: "ID - 1004",
  1005: "Remote Execute - 1005",
  1006: "Image - 1006",
  1008: "Message - 1008",
  1012: "CameraList - 1012",
  1013: "BinaryIMU - 1013",
  1016: "IMUStatistics - 1016",
  1020: "Drone Report - 1020",
  1021: "WBRTC Signaling - 1021",
  1022: "Home Location - 1022",
  1027: "WayPoints - 1027",
  1036: "NAV_INFO - 1036",
  1037: "Distination Location - 1037",
  1049: "Camera Zoom - 1049",
  1050: "Camera Switch - 1050",
  1051: "Camera Flash - 1051",
  1052: "RemoteControl2 - 1052",
  1071: "UdpProxy_Info - 1071",
  1073: "Ping Unit - 1073",
  1074: "P2P Info - 1074",
  6001: "ServoChannel - 6001",
  6501: "ServoOutput - 6501",
  6502: "Mavlink - 6502",
  6503: "SWARM - 6503",
  6506: "P2P Status - 6506",
  6507: "P2P in Range - 6507",
};

export const swarm_formation_names = {
  0: "None",
  1: "Thread",
  2: "V-Shape",
  3: "V-Shape2",
};

export const TYPE_MODULE_CLASS_COMM = "comm";
export const TYPE_MODULE_CLASS_FCB = "fcb";
export const TYPE_MODULE_CLASS_VIDEO = "camera";
export const TYPE_MODULE_CLASS_P2P = "p2p";
export const TYPE_MODULE_CLASS_SOUND = "snd";
export const TYPE_MODULE_CLASS_GPIO = "gpio";
export const TYPE_MODULE_CLASS_GENERIC = "gen";
