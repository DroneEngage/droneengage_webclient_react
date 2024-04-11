"use strict";

// AndruaveMessageID

const CONST_TYPE_AndruavMessage_ID                          = 1004;
const CONST_TYPE_AndruavMessage_RemoteExecute               = 1005;
const CONST_TYPE_AndruavMessage_Telemetry                   = 1007;
const CONST_TYPE_AndruavMessage_Error                       = 1008;
const CONST_TYPE_AndruavMessage_FlightControl               = 1010;
const CONST_TYPE_AndruavMessage_VideoFrame                  = 1014;
const CONST_TYPE_AndruavMessage_IMG                         = 1006;
const CONST_TYPE_AndruavMessage_GPS                         = 1002;
const CONST_TYPE_AndruavMessage_POW                         = 1003;
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
const CONST_TYPE_AndruavMessage_UdpProxy_Info               = 1071
const CONST_TYPE_AndruavMessage_Unit_Name                   = 1072


// Binary Messages
const CONST_TYPE_AndruavMessage_LightTelemetry              = 2022;

// new Andruav Messages 2019
const CONST_TYPE_AndruavMessage_ServoChannel                = 6001;
const CONST_TYPE_AndruavBinaryMessage_ServoOutput           = 6501;
const CONST_TYPE_AndruavBinaryMessage_Mavlink               = 6502;
const CONST_TYPE_AndruavBinaryMessage_SWARM_Mavlink         = 6503;
const CONST_TYPE_AndruavMessage_P2P_ACTION                  = 6505
const CONST_TYPE_AndruavMessage_P2P_STATUS                  = 6506

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



var message_names = {
    1002: "GPS",
    1003: "POW",
    1004: "ID",
    1005: "Remote Execute",
    1006: "Image",
    1008: "Message",
    1012: "CameraList",
    1020: "Drone Report",
    1021: "WBRTC Signaling",
    1022: "Home Location",
    1027: "WayPoints",
    1036: "NAV_INFO",
    1037: "Distination Location",
    1049: "Camera Zoom",
    1050: "Camera Switch",
    1051: "Camera Flash",
    1013: "BinaryIMU",
    1016: "IMUStatistics",
    1052: "RemoteControl2",
    1071: "UdpProxy_Info",
    6001: "ServoChannel",
    6501: "ServoOutput",
    6502: "Mavlink",
    6503: "SWARM"
};

var swarm_formation_names = {
    0 : 'None',
    1 : 'Thread',
    2 : 'V-Shape',
    3 : 'V-Shape2'
};