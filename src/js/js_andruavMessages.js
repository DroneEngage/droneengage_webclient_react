"use strict";

// AndruaveMessageID

const CONST_TYPE_AndruavMessage_GPS                         = 1002;
const CONST_TYPE_AndruavMessage_POW                         = 1003;
const CONST_TYPE_AndruavMessage_ID                          = 1004;
const CONST_TYPE_AndruavMessage_RemoteExecute               = 1005;
const CONST_TYPE_AndruavMessage_Telemetry                   = 1007;
const CONST_TYPE_AndruavMessage_Error                       = 1008;
const CONST_TYPE_AndruavMessage_FlightControl               = 1010;
const CONST_TYPE_AndruavMessage_VideoFrame                  = 1014;
const CONST_TYPE_AndruavMessage_IMG                         = 1006;
const CONST_TYPE_AndruavMessage_CameraList                  = 1012; // RX: {"tg":"GCS1","sd":"zxcv","ty":"c","gr":"1","cm":"i","mt":1012,"ms":"{\"E\":2,\"P\":0,\"I\":\"zxcv\"}"}
const CONST_TYPE_AndruavMessage_IMU                         = 1013;
const CONST_TYPE_AndruavMessage_BinaryIMU                   = 1013;
const CONST_TYPE_AndruavMessage_IMUStatistics               = 1016;
const CONST_TYPE_AndruavMessage_DroneReport                 = 1020;
const CONST_TYPE_AndruavMessage_HomeLocation                = 1022;
const CONST_TYPE_AndruavMessage_GeoFence                    = 1023;
const CONST_TYPE_AndruavMessage_ExternalGeoFence            = 1024;
const CONST_TYPE_AndruavMessage_GEOFenceHit                 = 1025;
const CONST_TYPE_AndruavMessage_WayPoints                   = 1027;
const CONST_TYPE_AndruavMessage_ExternalCommand_WayPoints   = 1028;
const CONST_TYPE_AndruavMessage_GeoFenceAttachStatus        = 1029;
const CONST_TYPE_AndruavMessage_Arm                         = 1030;
const CONST_TYPE_AndruavMessage_ChangeAltitude              = 1031;
const CONST_TYPE_AndruavMessage_Land                        = 1032;
const CONST_TYPE_AndruavMessage_DoYAW                       = 1035;
const CONST_TYPE_AndruavMessage_Signaling                   = 1021;
const CONST_TYPE_AndruavMessage_GuidedPoint                 = 1033;
const CONST_TYPE_AndruavMessage_CirclePoint                 = 1034;
const CONST_TYPE_AndruavMessage_NAV_INFO                    = 1036;
const CONST_TYPE_AndruavMessage_DistinationLocation         = 1037;
const CONST_TYPE_AndruavMessage_ChangeSpeed                 = 1040;
const CONST_TYPE_AndruavMessage_Ctrl_Camera                 = 1041;
// CODEBLOCK_START
const CONST_TYPE_AndruavMessage_TrackingTarget              = 1042;
const CONST_TYPE_AndruavMessage_TrackingTargetLocation      = 1043;
const CONST_TYPE_AndruavMessage_TargetLost                  = 1044;
// CODEBLOCK_END
const CONST_TYPE_AndruavMessage_GimbalCtrl                  = 1045;
const CONST_TYPE_AndruavMessage_UploadWayPoints             = 1046;
const CONST_TYPE_AndruavMessage_RemoteControlSettings       = 1047;
const CONST_TYPE_AndruavMessage_SetHomeLocation             = 1048;
const CONST_TYPE_AndruavMessage_CameraZoom                  = 1049;
const CONST_TYPE_AndruavMessage_CameraSwitch                = 1050;
const CONST_TYPE_AndruavMessage_CameraFlash                 = 1051;
const CONST_TYPE_AndruavMessage_RemoteControl2              = 1052;
const CONST_TYPE_AndruavMessage_SensorsStatus               = 1053;
// CODEBLOCK_START
const CONST_TYPE_AndruavMessage_FollowHim_Request           = 1054;
const CONST_TYPE_AndruavMessage_FollowMe_Guided             = 1055;
const CONST_TYPE_AndruavMessage_MakeSwarm                   = 1056;
const CONST_TYPE_AndruavMessage_SwarmReport                 = 1057;
const CONST_TYPE_AndruavMessage_UpdateSwarm                 = 1058;
// CODEBLOCK_END

const CONST_TYPE_AndruavMessage_CommSignalsStatus           = 1059;
const CONST_TYPE_AndruavMessage_Sync_EventFire              = 1061;
const CONST_TYPE_AndruavMessage_SearchTargetList            = 1062;
const CONST_TYPE_AndruavMessage_UdpProxy_Info               = 1071;
const CONST_TYPE_AndruavMessage_Unit_Name                   = 1072;
const CONST_TYPE_AndruavMessage_Ping_Unit                   = 1073;
const CONST_TYPE_AndruavMessage_P2P_INFO                    = 1074;


// Binary Messages
const CONST_TYPE_AndruavMessage_LightTelemetry              = 2022;

// new Andruav Messages 2019
const CONST_TYPE_AndruavMessage_ServoChannel                = 6001;
const CONST_TYPE_AndruavBinaryMessage_ServoOutput           = 6501;
const CONST_TYPE_AndruavBinaryMessage_Mavlink               = 6502;
const CONST_TYPE_AndruavBinaryMessage_SWARM_Mavlink         = 6503;
const CONST_TYPE_AndruavMessage_P2P_ACTION                  = 6505;
const CONST_TYPE_AndruavMessage_P2P_STATUS                  = 6506;
const CONST_TYPE_AndruavMessage_P2P_InRange_BSSID           = 6507;
const CONST_TYPE_AndruavMessage_P2P_InRange_Node            = 6508;
const CONST_TYPE_AndruavMessage_Set_Communication_Line      = 6509;
const CONST_TYPE_AndruavMessage_Communication_Line_Status   = 6510;
const CONST_TYPE_AndruavMessage_SOUND_TEXT_TO_SPEECH        = 6511;
const CONST_TYPE_AndruavMessage_SOUND_PLAY_FILE             = 6512;

// System Messages
const CONST_TYPE_AndruavSystem_LoadTasks                    = 9001;
const CONST_TYPE_AndruavSystem_SaveTasks                    = 9002;
const CONST_TYPE_AndruavSystem_DeleteTasks                  = 9003;
const CONST_TYPE_AndruavSystem_DisableTasks                 = 9004;
const CONST_TYPE_AndruavSystem_LogoutCommServer             = 9006;
const CONST_TYPE_AndruavSystem_ConnectedCommServer          = 9007;


const CONST_TYPE_SWARM_FOLLOW                               = 1;
const CONST_TYPE_SWARM_UNFOLLOW                             = 2;

const CONST_ALLOW_GCS                                       = 0x00000001;
const CONST_ALLOW_UNIT                                      = 0x00000010;
const CONST_ALLOW_GCS_FULL_CONTROL                          = 0x00000f00;
const CONST_ALLOW_GCS_WP_CONTROL                            = 0x00000100;
const CONST_ALLOW_GCS_MODES_CONTROL                         = 0x00000200;
const CONST_ALLOW_GCS_VIDEO                                 = 0x0000f000;



const CONST_DESTINATION_GUIDED_POINT                        = 0;
const CONST_DESTINATION_SWARM_MY_LOCATION                   = 1;


// Camera_List_Specification Field
const CONST_CAMERA_SUPPORT_ZOOMING                     = 0x1;
const CONST_CAMERA_SUPPORT_ROTATION                    = 0x2;
const CONST_CAMERA_SUPPORT_RECORDING                   = 0x4;
const CONST_CAMERA_SUPPORT_PHOTO                       = 0x8;
const CONST_CAMERA_SUPPORT_DUAL_CAM                    = 0x10;
const CONST_CAMERA_SUPPORT_FLASHING                    = 0x20;


// SWARM FORMATION
const CONST_TASHKEEL_SERB_NO_SWARM                          = 0;
const CONST_TASHKEEL_SERB_THREAD                            = 1;
const CONST_TASHKEEL_SERB_VECTOR                            = 2; // requires angle
const CONST_TASHKEEL_SERB_VECTOR_180                        = 3;

// AndruavMessage_RemoteExecute Commands
const CONST_RemoteCommand_MAKETILT                          = 100;
const CONST_RemoteCommand_TAKEIMAGE                         = 102;
const CONST_RemoteCommand_MAKEBEEP                          = 103;
const CONST_RemoteCommand_SENDSMS                           = 104;
const CONST_RemoteCommand_ROTATECAM                         = 105;
const CONST_RemoteCommand_IMUCTRL                           = 106;
const CONST_RemoteCommand_TELEMETRYCTRL                     = 108;
const CONST_RemoteCommand_NOTIFICATION                      = 109;
const CONST_RemoteCommand_STREAMVIDEO                       = 110;
const CONST_RemoteCommand_RECORDVIDEO                       = 111;
const CONST_RemoteCommand_STREAMVIDEORESUME                 = 112;
const CONST_RemoteCommand_SWITCHCAM                         = 114;
const CONST_RemoteCommand_SET_GPS_SOURCE                    = 115;
const CONST_RemoteCommand_CONNECT_FCB                       = 118;
const CONST_RemoteCommand_GET_WAY_POINTS                    = 500;
const CONST_RemoteCommand_RELOAD_WAY_POINTS_FROM_FCB        = 501;
const CONST_RemoteCommand_CLEAR_WAY_POINTS                  = 502;
const CONST_RemoteCommand_CLEAR_FENCE_DATA                  = 503;
const CONST_RemoteCommand_SET_START_MISSION_ITEM            = 504;
const CONST_RemoteCommand_REQUEST_PARAM_LIST                = 505;
const CONST_RemoteCommand_SET_UDPPROXY_CLIENT_PORT          = 506;
const CONST_RemoteCommand_MISSION_COUNT                     = 507;
const CONST_RemoteCommand_MISSION_CURRENT                   = 508;

// P2P Actions
const CONST_P2P_ACTION_RESTART_TO_MAC                        = 0;
const CONST_P2P_ACTION_CONNECT_TO_MAC                        = 1;
const CONST_P2P_ACTION_CANDICATE_MAC                         = 2;
const CONST_P2P_ACTION_SCAN_NETWORK                          = 3;


// FenceType
const CONST_TYPE_LinearFence = 1;
const CONST_TYPE_PolygonFence = 2;
const CONST_TYPE_CylinderFence = 3;

// Camera source
const CONST_CAMERA_SOURCE_MOBILE = 1;
const CONST_CAMERA_SOURCE_FCB = 2;


// WayPoints
const CONST_WAYPOINT_SIZE = 41; // size of bytes of a waypoint

const CONST_WayPoint_TYPE_WAYPOINTSTEP = 16; // same as mavlink
const CONST_WayPoint_TYPE_TAKEOFF = 22; // same as mavlink
const CONST_WayPoint_TYPE_LANDING = 21; // same as mavlink
const CONST_WayPoint_TYPE_RTL = 20; // same as mavlink
const CONST_WayPoint_TYPE_CIRCLE = 18; // same as mavlink MAV_CMD_NAV_LOITER_TURNS
const CONST_WayPoint_Guided_Enabled = 92 // same as mavlink MAV_CMD_NAV_LOITER_TURNS
const CONST_WayPoint_TYPE_SPLINE = 6;
const CONST_WayPoint_TYPE_SPEED = 178; // same as amvlink
const CONST_WayPoint_TYPE_CMissionAction_CONTINUE_AND_CHANGE_ALT = 30; // same as amvlink
const CONST_WayPoint_TYPE_ChangeAlt = 113; // same as amvlink
const CONST_WayPoint_TYPE_YAW = 115; // same as mavlink
const CONST_WayPoint_TYPE_FIRE_EVENT = 9;
const CONST_WayPoint_TYPE_WAIT_EVENT = 10;
const CONST_WayPoint_TYPE_CAMERA_CONTROL = 203; // same as mavlink
const CONST_WayPoint_TYPE_CAMERA_TRIGGER = 206; // same as mavlink





const CONST_TelemetryProtocol_CONST_No_Telemetry = 0;
const CONST_TelemetryProtocol_CONST_Andruav_Telemetry = 1;
const CONST_TelemetryProtocol_CONST_Mavlink_Telemetry = 2;
const CONST_TelemetryProtocol_CONST_MW_Telemetry = 3;
const CONST_TelemetryProtocol_DroneKit_Telemetry = 4;
const CONST_TelemetryProtocol_DJI_Telemetry = 5;
const CONST_TelemetryProtocol_CONST_Unknown_Telemetry = 999;

const CONST_TelemetryProtocol_SOURCE_LOCAL = 1;
const CONST_TelemetryProtocol_Source_REMOTE = 2;
const CONST_TelemetryProtocol_SOURCE_SIMULATED = 3;

// AndruavResala_DroneReport Commands
const CONST_Report_NAV_ItemUnknown = 0;
const CONST_Report_NAV_ItemReached = 1;
const CONST_Report_NAV_ItemExecuting = 2;

// CONST_TYPE_AndruavMessage_CameraList
const EXTERNAL_CAMERATYPE_RTCWEBCAM = 2;


// Andruav Constants
const Default_Video_FrameResumeSize = 20;

// CONST_TYPE_AndruavMessage_CameraList
const CONST_EXTERNAL_CAMERA_TYPE_UNKNOWN = 0;
const CONST_EXTERNAL_CAMERA_TYPE_IPWEBCAM = 1;
const CONST_EXTERNAL_CAMERA_TYPE_RTCWEBCAM = 2;
const CONST_EXTERNAL_CAMERA_TYPE_FFMPEGWEBCAM = 3;


// CONST_TYPE_AndruavMessage_RemoteControlSettingsParams:
const CONST_TX_SIGNAL_CENTER_ALL = 1;
const CONST_TX_SIGNAL_FREEZE_ALL = 2;


// Info Types
const CONST_INFOTYPE_RCCONTROL = 12;
const CONST_INFOTYPE_TELEMETRY = 33;
const CONST_INFOTYPE_PROTOCOL = 44;
const CONST_INFOTYPE_CAMERA = 55;
const CONST_INFOTYPE_KMLFILE = 66;
const CONST_INFOTYPE_Lo7etTa7akom = 77;
const CONST_INFOTYPE_GEOFENCE = 88;


// Telemetry Commands:
const CONST_TELEMETRY_REQUEST_START     = 1;
const CONST_TELEMETRY_REQUEST_END       = 2;
const CONST_TELEMETRY_REQUEST_RESUME    = 3;
const CONST_TELEMETRY_ADJUST_RATE       = 4;
const CONST_TELEMETRY_REQUEST_PAUSE     = 5;

const CONST_TELEMETRY_SOURCE_UNKNOWN = 0;
const CONST_TELEMETRY_SOURCE_FCB = 1;
const CONST_TELEMETRY_SOURCE_GCS = 2;


const CONST_checkStatus_Interverl0 = 15000;
const CONST_checkStatus_Interverl1 = 20000;
const CONST_sendID_Interverl = 13000;
const CONST_sendRXChannels_Interval = 250;
const CONST_GAMEPAD_LONG_PRESS = 1250;
const CONST_GAMEPAD_REPEATED = 3000;
const CONST_PARAMETER_REPEATED = 500;



// AndruavMessage_RemoteControlSettings
const CONST_RC_ACTION_TAKE_CONTROL = 0;
const CONST_RC_ACTION_RELEASE_CONTROL = 1;
// ------------------------------------------
const CONST_RC_SUB_ACTION_RELEASED = 0;
const CONST_RC_SUB_ACTION_CENTER_CHANNELS = 1;
const CONST_RC_SUB_ACTION_FREEZE_CHANNELS = 2;
const CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS = 4;
const CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED = 8;

// FLASH STATUS of MEssage CONST_TYPE_AndruavMessage_CameraFlash
const CONST_FLASH_OFF = 0;
const CONST_FLASH_ON = 1;
const CONST_FLASH_DISABLED = 999;

// FENCE TYPES
const FENCETYPE_LinearFence         = 1;
const FENCETYPE_PolygonFence        = 2;
const FENCETYPE_CylindersFence      = 3;
    
// SOCKET STATUS
const CONST_SOCKET_STATUS_FREASH = 1; // socket is new
const CONST_SOCKET_STATUS_CONNECTING = 2; // connecting to WS
const CONST_SOCKET_STATUS_DISCONNECTING = 3; // disconnecting from WS
const CONST_SOCKET_STATUS_DISCONNECTED = 4; // disconnected  from WS
const CONST_SOCKET_STATUS_CONNECTED = 5; // connected to WS
const CONST_SOCKET_STATUS_REGISTERED = 6; // connected and executed AddMe
const CONST_SOCKET_STATUS_UNREGISTERED = 7; // connected but not registred
const CONST_SOCKET_STATUS_ERROR = 8; // Error

var message_names = {
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
    6507: "P2P in Range - 6507"
};

var swarm_formation_names = {
    0 : 'None',
    1 : 'Thread',
    2 : 'V-Shape',
    3 : 'V-Shape2'
};


const TYPE_MODULE_CLASS_COMM                       = "comm";
const TYPE_MODULE_CLASS_FCB                        = "fcb";
const TYPE_MODULE_CLASS_VIDEO                      = "camera";
const TYPE_MODULE_CLASS_P2P                        = "p2p";
const TYPE_MODULE_CLASS_SOUND                      = "snd";
const TYPE_MODULE_CLASS_GPIO                       = "gpio";
const TYPE_MODULE_CLASS_GENERIC                    = "gen";