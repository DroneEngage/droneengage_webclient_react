/*************************************************************************************
 * 
 *   A N D R U A V - C L I E N T       JAVASCRIPT  LIB
 * 
 *   Author: Mohammad S. Hefny
 * 
 *   Date:   06 December 2015
 * 
 *   Date    21 Jun 2016:   GeoFence
 * 
 *   Date 23 Jul 2016
 * 
 *   Date 29 Mar 2017:		Smaller commands, web Telemetry
 * 
 *************************************************************************************/

/*jshint esversion: 6 */
"use strict";


const WAYPOINT_NO_CHUNK = 0;
const WAYPOINT_CHUNK = 1;
const WAYPOINT_LAST_CHUNK = 999;

// Command Types either System or Communication
const CMDTYPE_SYS = 's'; // system command
const CMDTYPE_COMM = 'c';// 'c';

// Communication Commands
const CMD_COMM_GROUP = '2971'._fn_hexDecode();//'g'; // group broadcast
const CMD_COMM_INDIVIDUAL = '2b11'._fn_hexDecode(); 'i';
// individual broadcast

// System Commands:
const CMD_SYS_PING = 'ping'; //'ping'; // group broadcast
const CMD_SYS_TASKS = 'tsk'; //'tsk'; // group broadcast

const CONST_TARGETS_GCS = '_GCS_';
const CONST_TARGETS_DRONES = '_AGN_';

// SOCKET STATUS
const CONST_SOCKET_STATUS_FREASH = 1; // socket is new
const CONST_SOCKET_STATUS_CONNECTING = 2; // connecting to WS
const CONST_SOCKET_STATUS_DISCONNECTING = 3; // disconnecting from WS
const CONST_SOCKET_STATUS_DISCONNECTED = 4; // disconnected  from WS
const CONST_SOCKET_STATUS_CONNECTED = 5; // connected to WS
const CONST_SOCKET_STATUS_REGISTERED = 6; // connected and executed AddMe
const CONST_SOCKET_STATUS_UNREGISTERED = 7; // connected but not registred
const CONST_SOCKET_STATUS_ERROR = 8; // Error

const c_SOCKET_STATUS = [
    'Fresh',
    'Connecting',
    'Disconnecting',
    'Disconnected',
    'Connected',
    'Registered',
    'UnRegistered',
    'Error'
];


// Tasks Scope
const CONST_TASK_SCOPE_GLOBAL = 0;
const CONST_TASK_SCOPE_GLOBAL_ACCOUNT = 1;
const CONST_TASK_SCOPE_LOCALGROUP = 2;
const CONST_TASK_SCOPE_PARTYID = 3;

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
const CONST_WayPoint_TYPE_EKLA3 = 22; // same as mavlink
const CONST_WayPoint_TYPE_HOBOOT = 21; // same as mavlink
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
var Me;


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
    

class CAndruavClient {
    constructor() {
        this.v_waypointsCache = {};
        this.v_callbackListeners = {};
        this.fn_init();
        this.m_mavlinkFTPProtocol = new C_MavlinkFTPProtocol();
    }

    _fn_checkStatus() {

        
        var now = Date.now();
        var len = this.m_andruavUnitList.fn_getUnitCount();
        var arr = this.m_andruavUnitList.fn_getUnitValues();
        var v_unit;
        for (var i = 0; i < len; ++ i) {
            v_unit = arr[i];
            if (v_unit.m_IsMe == false) {
                if ((now - v_unit.m_NetworkStatus.m_lastActiveTime) > CONST_checkStatus_Interverl1) {
                    v_unit.m_IsShutdown = true;
                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, v_unit);
                } else if ((now - v_unit.m_NetworkStatus.m_lastActiveTime) > CONST_checkStatus_Interverl0) { // less time
                    this.API_requestID(v_unit.partyID);
                } else {
                    if (v_unit.m_IsShutdown == false) { // received a message from a v_unit that where marked off
                        v_unit.m_IsShutdown = false;
                        window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, v_unit);
                    }
                }
            }
        }
    }

    // EVENT HANDLER AREA
    _fn_sendRXChannels(p_me) {
        if (p_me.v_sendAxes === false) 
        {
            p_me.v_sendAxes_skip++;
            if (p_me.v_sendAxes_skip%4 !=0) return;
        }
        

        p_me.v_sendAxes = false;
        if (this.v_axes!=null) p_me.API_sendRXChannels(this.v_axes);
    }


    fn_init() {
        this.ws = null;
        this.m_andruavUnit = null;
        this.m_gamePadUnit = null;
        this.m_lastgamePadCommandTime = [0, 0, 0, 0];
        this.m_lastparamatersUpdateTime = 0;

        this.v_axes = null;
        this.v_sendAxes = false;
        this.v_sendAxes_skip = 0;
        this.andruavGeoFences = {};
        this.videoFrameCount = 0;
        this.socketStatus = CONST_SOCKET_STATUS_FREASH;
        this.fn_onSocketStatus = function (status, statusName) {}; // ovveride to read socket status
        this.EVT_onError = function (err) {};
        this.EVT_onOpen = function () {};
        this.EVT_onClose = function () {};
        this.EVT_onMessage = function (evt) {};
        this.EVT_onSend = function (msg) {};
        this.EVT_onLog = function (msg) {};
        this.EVT_msgFromUnit_GPS = function () {};
        this.EVT_andruavSignalling = function () {};
        this.EVT_msgFromUnit_WayPoints = function () {};
        this.EVT_msgFromUnit_WayPointsUpdated = function () {};
        this.EVT_onDeleted = function () {};
        this.EVT_msgFromUnit_NavInfo = function () {};
        this.EVT_BadMavlink = function () {};
        this.EVT_msgFromUnit_IMG = function () {};
        this.EVT_msgFromUnit_IMUStatistics = function () {};
        this.EVT_videoStateChanged = function () {};
        this.EVT_msgFromUnit_VIDEO = function () {};
        this.EVT_andruavUnitAdded = function () {};
        this.EVT_andruavUnitArmedUpdated = function () {};
        this.EVT_andruavUnitFightModeUpdated = function () {};
        this.EVT_andruavUnitFlyingUpdated = function () {};
        this.EVT_andruavUnitFCBUpdated = function () {};
        
        // CODEBLOCK_START
        this.EVT_andruavUnitSwarmUpdated2 = function () {};
        this.EVT_andruavUnitSwarmUpdated = function () {};
        // CODEBLOCK_END

        this.EVT_HomePointChanged = function () {};
        this.EVT_DistinationPointChanged = function () {};
        this.EVT_andruavUnitVehicleTypeUpdated = function () {};
        this.EVT_andruavUnitModuleUpdated = function () {};
        /**
			 * 	Received when a notification sent by remote UNIT.
			 * 	It could be error, warning or notification.
			 * 
 
			Received when a notification sent by remote UNIT.
			It could be error, warning or notification.
			*******************
			errorNo 			: 
									NOTIFICATIONTYPE_ERROR 		= 1
									NOTIFICATIONTYPE_WARNING	= 2
									NOTIFICATIONTYPE_NORMAL		= 3
									NOTIFICATIONTYPE_GENERIC	= 4
			infoType			:
									ERROR_CAMERA 	= 1
									ERROR_BLUETOOTH	= 2
									ERROR_USBERROR	= 3
									ERROR_KMLERROR	= 4
			notification_Type	:
									NOTIFICATIONTYPE_ERROR 		= 1;
									NOTIFICATIONTYPE_WARNING 	= 2;
									NOTIFICATIONTYPE_NORMAL 	= 3;
									NOTIFICATIONTYPE_GENERIC 	= 0;
			Description			: 
									Message
			*/
        this.EVT_andruavUnitError = function () {};
        this.EVT_andruavUnitGeoFenceDeleted = function () {};
        this.EVT_andruavUnitGeoFenceBeforeDelete = function () {};
        this.EVT_andruavUnitGeoFenceUpdated = function () {};
        this.EVT_andruavUnitGeoFenceHit = function () {};


        this.m_andruavUnitList = new CAndruavUnitList();
        this.m_adsbObjectList = new CADSBObjectList();
        var Me = this;
        if (this.fn_timerID_checkStatus == null) {

            this.fn_timerID_checkStatus = setInterval(function () {
                Me._fn_checkStatus()
            }, CONST_checkStatus_Interverl0);
        }

        if (this.fn_timerID_sendRXChannels == null) {
            this.fn_timerID_sendRXChannels = setInterval(function () {
                Me._fn_sendRXChannels(Me)
            }, CONST_sendRXChannels_Interval);
        }

        window.AndruavLibs.EventEmitter.fn_subscribe(EE_GamePad_Axes_Updated, this, this.fn_sendAxes);
        window.AndruavLibs.EventEmitter.fn_subscribe(EE_GamePad_Button_Updated, this, this.fn_sendButtons);
        window.AndruavLibs.EventEmitter.fn_subscribe(EE_requestGamePad, this, this.fn_requestGamePad);
        window.AndruavLibs.EventEmitter.fn_subscribe(EE_releaseGamePad, this, this.fn_releaseGamePad);


    };


    // receives event from gamepad and store it for sending.
    fn_sendAxes(p_me) { // game pad should be attached to a unit.
        if (p_me.m_gamePadUnit == null) 
            return;
        

        const c_controller = window.AndruavLibs.AndruavGamePad.fn_getGamePad(active_gamepad_index);
        if (c_controller == null) 
            return;
        
        // read gamepad values
        p_me.v_axes = c_controller.p_axes;
        p_me.v_sendAxes = true;

        fn_console_log("fn_sendAxes");
    }

    fn_sendButtons(p_me, p_packet) { // game pad should be attached to a unit.
        if (p_me.m_gamePadUnit == null) 
            return;
        

        fn_console_log("fn_sendButtons ", p_packet.p_buttonIndex);
        const c_now = Date.now();

        switch (p_me.m_gamePadUnit.m_VehicleType) {
            case VEHICLE_TRI:
            case VEHICLE_QUAD:
                // if ((p_packet.p_buttonIndex==4) || (p_packet.p_buttonIndexi==5))
                // {
                // if (p_packet.p_buttons[p_packet.p_buttonIndex].m_longPress === true)
                // {
                // p_me.API_do_Arm (p_me.m_gamePadUnit.partyID, true, false);
                // return ;
                // }
                // }

                if (p_packet.p_buttonIndex == 2) { // BLUE
                    if (p_packet.p_buttons[p_packet.p_buttonIndex].m_longPress === true) {
                        if (c_now - p_me.m_lastgamePadCommandTime[2] > CONST_GAMEPAD_REPEATED) {
                            p_me.API_do_FlightMode(p_me.m_gamePadUnit.partyID, CONST_FLIGHT_CONTROL_GUIDED);
                            p_me.m_lastgamePadCommandTime[2] = c_now;
                            return;
                        }

                    }
                }

                if (p_packet.p_buttonIndex == 0) { // Green
                    if (p_packet.p_buttons[p_packet.p_buttonIndex].m_longPress === true) {
                        if (c_now - p_me.m_lastgamePadCommandTime[0] > CONST_GAMEPAD_REPEATED) {
                            p_me.API_do_Land(p_me.m_gamePadUnit);
                            p_me.m_lastgamePadCommandTime[0] = c_now;
                            return;
                        }
                    }
                }

                if (p_packet.p_buttonIndex == 1) { // RED
                    if (p_packet.p_buttons[p_packet.p_buttonIndex].m_longPress === true) {
                        if (c_now - p_me.m_lastgamePadCommandTime[1] > CONST_GAMEPAD_REPEATED) {
                            p_me.API_do_FlightMode(p_me.m_gamePadUnit.partyID, CONST_FLIGHT_CONTROL_BRAKE);
                            p_me.m_lastgamePadCommandTime[1] = c_now;
                            return;
                        }
                    }
                }

                if (p_packet.p_buttonIndex == 3) { // Yellow
                    if (p_packet.p_buttons[p_packet.p_buttonIndex].m_longPress === true) {
                        if (c_now - p_me.m_lastgamePadCommandTime[3] > CONST_GAMEPAD_REPEATED) {
                            p_me.API_do_FlightMode(p_me.m_gamePadUnit.partyID, CONST_FLIGHT_CONTROL_RTL);
                            p_me.m_lastgamePadCommandTime[3] = c_now;
                            return;
                        }
                    }
                }

                break;
        }

        // CODEBLOCK_START
        if (CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
            return;
        }

        if (p_packet.p_buttonIndex == 5) { // RB
            if (p_packet.p_buttons[p_packet.p_buttonIndex].m_longPress === true) {} else { // when unpress
                if (p_packet.p_buttons[p_packet.p_buttonIndex].m_pressed === false) {
                    p_me.API_SendTrackPoint(p_me.m_gamePadUnit, 0.5, 0.5, 30);
                }
            }
        }


        if (p_packet.p_buttonIndex == 4) { // LB
            if (p_packet.p_buttons[p_packet.p_buttonIndex].m_longPress === true) {} else {
                if (p_packet.p_buttons[p_packet.p_buttonIndex].m_pressed) {
                    p_me.API_do_ServoChannel(p_me.m_gamePadUnit.partyID, "9", 9999);
                } else {
                    p_me.API_do_ServoChannel(p_me.m_gamePadUnit.partyID, "9", 0);
                }
            }
        }
        // CODEBLOCK_END
    }

    fn_requestGamePad(p_me, p_andruavUnit) {
        p_me.m_gamePadUnit = p_andruavUnit;
    }

    fn_releaseGamePad(p_me, p_andruavUnit) {
        p_me.m_gamePadUnit = null;
    }


    fn_isRegistered() {
        return(this.socketStatus == CONST_SOCKET_STATUS_REGISTERED);

    }


    /*
		This function is used by some messages to call back modules when the message 
		is received. For now only one function can wait per mission and newer request overwrite older.
	*/
    fn_callbackOnMessageID = function (p_callback, p_messageID) {
        this.v_callbackListeners[p_messageID] = p_callback;
    }

    fn_callbackOnMessageID_Answer (p_messageID, v_session)
    {
        if (this.v_callbackListeners.hasOwnProperty(p_messageID) === true) {
            this.v_callbackListeners[p_messageID](v_session);
            delete this.v_callbackListeners[p_messageID];
        }
    }

    API_addMe2() {
        if ((this.partyID == null) || (this.m_groupName == null)) 
            return;
        

        var v_unit = new CAndruavUnitObject();
        v_unit.m_IsMe = true;
        v_unit.m_IsGCS = true;
        v_unit.m_unitName = this.unitID;
        v_unit.partyID = this.partyID;
        v_unit.m_groupName = this.m_groupName;
        v_unit.m_telemetry_protocol = CONST_Unknown_Telemetry;
        v_unit.m_VehicleType = CONST_VEHICLE_GCS;

        this.m_andruavUnit = v_unit;
    };


    API_delMe() {
        const c_msg = {};

        this._API_sendSYSCMD(CONST_TYPE_AndruavSystem_LogoutCommServer, c_msg);
    };

    API_sendCMD(p_target, msgType, msg) {
        var v_rountingMsg;
        if (p_target != null) {
            v_rountingMsg = CMD_COMM_INDIVIDUAL;
        } else { // if you want to prevent GCS to GCS.
            if ((p_target == null) && (CONST_DONT_BROADCAST_TO_GCSs === true)) {
                p_target = CONST_TARGETS_DRONES;
                v_rountingMsg = CMD_COMM_INDIVIDUAL;
            } else {
                v_rountingMsg = CMD_COMM_GROUP;
            }
        }

        if (this.ws != null) {
            this.ws.sendex(this.fn_generateJSONMessage(this.partyID, p_target, v_rountingMsg, msgType, msg));
        } else { // send a warning
        }
    };


    API_sendBinCMD(targetName, msgType, data) {
        var v_msgRouting;
        if (targetName != null) {
            v_msgRouting = CMD_COMM_INDIVIDUAL;
        } else {
            v_msgRouting = CMD_COMM_GROUP;
        }

        var h = fn_str2ByteArray(this.fn_generateJSONMessage(this.partyID, targetName, v_msgRouting, msgType));
        var ws = this.ws;
        
        const msgx = fn_concatBuffers(h, data, true);
        ws.sendex(msgx, true);
    };


    _API_sendSYSCMD(p_msgID, p_msg) {
        if (this.ws != null) {
            this.ws.sendex(this.fn_generateJSONMessage(this.partyID, null, CMDTYPE_SYS, p_msgID, p_msg));
        }
    };


    API_saveGeoFenceTasks(p_accountID, m_groupName, p_partyID, p_receiver, isPermanent, m_geofenceInfo) {
        if (p_partyID == null) 
            p_partyID = '_any_';
        
        if (m_groupName == null) 
            m_groupName = '_any_';
        
        const c_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: m_groupName,
            s: this.partyID,
            r: p_receiver,
            mt: CONST_TYPE_AndruavMessage_ExternalGeoFence,
            ip: isPermanent,
            t: m_geofenceInfo
        }

        this._API_sendSYSCMD(CONST_TYPE_AndruavSystem_SaveTasks, c_msg);
    }


    API_loadGeoFence(p_accountID, m_groupName, p_partyID, p_receiver, isPermanent) {
        if (p_partyID == null) 
            p_partyID = '_any_';
        
        if (m_groupName == null) 
            m_groupName = '_any_';
        
        const c_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: m_groupName,
            // sender: this.partyID,
            r: p_receiver,
            mt: CONST_TYPE_AndruavMessage_ExternalGeoFence,
            ip: isPermanent
        }

        this._API_sendSYSCMD(CONST_TYPE_AndruavSystem_LoadTasks, c_msg);
    }

    API_disableGeoFenceTasks(p_accountID, m_groupName, p_partyID, p_receiver, isPermanent) {
        if (p_partyID == null) 
            p_partyID = '_any_';
        
        if (m_groupName == null) 
            m_groupName = '_any_';
        

        const c_msg = {
            ai: p_accountID,
            // party_sid: partyID,
            gn: m_groupName,
            // sender: this.partyID,
            // receiver: p_receiver,
            mt: CONST_TYPE_AndruavMessage_ExternalGeoFence,
            ip: isPermanent,
            enabled: 1
        }

        this._API_sendSYSCMD(CONST_TYPE_AndruavSystem_DisableTasks, c_msg);
    };



    API_setUnitName (p_andruavUnit, p_name, p_description)
    {
        if ((p_name==null) || (p_name=="") || (p_description==null) || (p_description=="")) return ;
        
        var msg = {
            UN:p_name,
            DS:p_description,
            PR:true // reset partyID
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_Unit_Name, msg);
    }

    /***
    * Tell drone I will send you control -gamepad- info.
	*/
    API_engageRX(p_andruavUnit) {
        if ((this.m_currentEngagedRX != null) && (this.m_currentEngagedRX.partyID != p_andruavUnit.partyID)) { // This webGCS is already engaged with another Drone. so Tell Drone I am no longer controlling you.
            this.API_disengageRX(this.m_currentEngagedRX);
        }

        this.API_engageGamePad(p_andruavUnit);
    };

    /***
	* Tells drone I am no longer sending you control -gamepad- info.
	* @param {*} p_andruavUnit 
    */
    API_disengageRX(p_andruavUnit) {
        this.m_currentEngagedRX = undefined; // it might be already null and not synch-ed
        p_andruavUnit.m_Telemetry.m_rxEngaged = false;
        this.API_TXCtrl(p_andruavUnit, CONST_RC_SUB_ACTION_RELEASED);
        window.AndruavLibs.EventEmitter.fn_dispatch(EE_releaseGamePad, p_andruavUnit);

    };


    API_engageGamePad(p_andruavUnit) {
        let p_msg = {
            'b': CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS
            // rcSubAction
            // 'b':CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED
        };
        p_andruavUnit.m_Telemetry.m_rxEngaged = true;
        this.m_currentEngagedRX = p_andruavUnit;
        // it might be already null and not synch-ed
        // window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitTelemetryOff,p_andruavUnit);  // ????
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteControlSettings, p_msg);

        window.AndruavLibs.EventEmitter.fn_dispatch(EE_requestGamePad, p_andruavUnit);
    }


    API_WriteAllParameters(p_andruavUnit) 
    {
        if (p_andruavUnit == null) return ;

        const c_list = p_andruavUnit.m_FCBParameters.m_list_by_index_shadow;
        const c_keys = Object.keys(c_list);
        const c_len = c_keys.length;
        
        
        for (var i =0; i<c_len; ++i) 
        {
            const c_parameter_message = c_list[c_keys[i]];

            if ((c_parameter_message.is_valid === true)
            && (c_parameter_message.is_dirty === true))
            {
                this.API_WriteParameter(p_andruavUnit, c_parameter_message);
            }
        }

    }

    /**
     * Sends parameter to write to Andruav Unit in MAVlink.
     * @param {*} p_andruavUnit 
     * @param {*} p_mavlink_param 
     */
     API_WriteParameter (p_andruavUnit, p_mavlink_param) {
        p_mavlink_param.param_value = p_mavlink_param.modified_value;
        var p_param_set = new mavlink20.messages.param_set(
            p_mavlink_param.target_system, p_mavlink_param.target_component, 
            p_mavlink_param.param_id, p_mavlink_param.param_value, 
            p_mavlink_param.param_type
        );
        var x = p_param_set.pack(p_param_set);
        var z = array_to_ArrayBuffer(x);
        this.API_sendBinCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavBinaryMessage_Mavlink, z);
        p_mavlink_param.is_dirty = false;
    };


    // CODEBLOCK_START
    API_SendTrackCRegion(p_andruavUnit, p_corner1_x, p_corner1_y, p_corner2_x, p_corner2_y) {
        var msg = {
            a: p_corner1_x,
            b: p_corner1_y,
            c: p_corner2_x,
            d: p_corner2_y
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_TrackingTarget, msg);
    };
    // CODEBLOCK_END

    // CODEBLOCK_START
    API_SendTrackPoint(p_andruavUnit, p_center_x, p_center_y, p_radius) {
        var msg = {
            a: p_center_x,
            b: p_center_y,
            r: p_radius
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_TrackingTarget, msg);
    };

    API_StopTracking(p_andruavUnit) {
        var msg = {
            s: true
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_TrackingTarget, msg);
    };
    // CODEBLOCK_END

    API_requestIMU(p_andruavUnit, on_off) {

        var msg = {
            C: CONST_RemoteCommand_IMUCTRL,
            Act: on_off
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    }




    API_resumeTelemetry(p_andruavUnit,lvl) {
        if (p_andruavUnit == null) 
            return;
        

        var msg = {
            C: CONST_RemoteCommand_TELEMETRYCTRL,
            Act: CONST_TELEMETRY_REQUEST_RESUME
        };
        if ((lvl != null) && (lvl != -1)) {
            msg.LVL = lvl;
        }

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };


    API_pauseTelemetry(p_andruavUnit) {
        if (p_andruavUnit == null) 
            return;
        
        var msg = {
            C: CONST_RemoteCommand_TELEMETRYCTRL,
            Act: CONST_TELEMETRY_REQUEST_PAUSE
        };
        
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };

    API_adjustTelemetryDataRate(p_andruavUnit, lvl) {
        if (p_andruavUnit == null) 
            return;
        
        var msg = {
            C: CONST_RemoteCommand_TELEMETRYCTRL,
            Act: CONST_TELEMETRY_ADJUST_RATE
        };
        if ((lvl != null) && (lvl != -1)) {
            msg.LVL = lvl;
        }

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };

    
    
    API_stopTelemetry(p_andruavUnit) {

        var msg = {
            C: CONST_RemoteCommand_TELEMETRYCTRL,
            Act: CONST_TELEMETRY_REQUEST_END
        };

        this.currentTelemetryUnit = undefined; // it might be already null and not synch-ed
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);

        p_andruavUnit.m_Telemetry._isActive = false;
        window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitTelemetryOff, p_andruavUnit);
    };

    


    API_SendTelemetryData(p_andruavUnit, data) {
        // var msg = {};
        // msg.src = CONST_TELEMETRY_SOURCE_GCS;
        var me = this;
        var reader = new FileReader();
        reader.onload = function (event) {
            const contents = event.target.result;
                
            if (me.prv_parseGCSMavlinkMessage (p_andruavUnit, contents) !== true) 
            {
                me.API_sendBinCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_LightTelemetry, contents);
            }

            // Cleanup the reader object
            reader.abort();
            reader = null;
					
            return;
            
        }
        reader.readAsArrayBuffer(data);
        

    };

    /**
     * 
     * @param {*} p_target is partyID not a unit object.
     */
    API_sendID(p_target) {
        var msg = {
            VT: CONST_VEHICLE_GCS, // VehicleType
            GS: this.m_andruavUnit.m_IsGCS, // IsCGS
            VR: 0, // VideoRecording [OPTIONAL in later Andruav versions]
            FI: this.m_andruavUnit.m_useFCBIMU, // useFCBIMU
            AR: this.m_andruavUnit.m_isArmed, // m_isArmed
            FL: this.m_andruavUnit.m_isFlying, // m_isFlying
            SD: this.m_andruavUnit.m_IsShutdown,
            TP: this.m_andruavUnit.m_telemetry_protocol,
            UD: this.m_andruavUnit.m_unitName,
            DS: this.m_andruavUnit.Description,
            p: this._permissions_
        };
        
        this.API_sendCMD(p_target, CONST_TYPE_AndruavMessage_ID, msg);
    };

    /**
     * 
     * @param {*} p_partyID is partyID not a unit object.
     */
    API_requestID(p_partyID) {
        var msg = {
            C: CONST_TYPE_AndruavMessage_ID
        };
        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };


    // CODEBLOCK_START
    API_makeSwarm(p_partyID, p_formationID) {
        let p_msg = {
            a: p_formationID, // m_formation_as_leader
            b: p_partyID // Leader
        };

        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_MakeSwarm, p_msg);
    }
    // CODEBLOCK_END

    // CODEBLOCK_START
    API_updateSwarm(p_partyID, p_action, p_slaveIndex, p_leaderPartyID) {
        let p_msg = {
            a: p_action, // m_formation as a follower
            b: p_slaveIndex, // index ... could be -1 to take available location.
            c: p_leaderPartyID, // LeaderPartyID
            d: p_partyID // SlavePartyID
        };

        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_UpdateSwarm, p_msg);
    };
    // CODEBLOCK_END


    // CODEBLOCK_START
    API_requestFromDroneToFollowAnother(partyID, slaveIndex, leaderPartyID, do_follow) {

        let p_msg = {
            a: slaveIndex, // index ... could be -1 to take available location.
            c: partyID, // slave
            f: do_follow
        };

        if (leaderPartyID != null) {
            p_msg.b = leaderPartyID;
        }

        this.API_sendCMD(partyID, CONST_TYPE_AndruavMessage_FollowHim_Request, p_msg);
    };
    // CODEBLOCK_END


    API_sendRXChannels(p_axes) {
        var v_axis = [0, 1, 2, 3];
        if ((this.m_gamePadUnit == null) || (this.m_gamePadUnit.partyID == null)) 
            return;
        

        switch (window.AndruavLibs.LocalStorage.fn_getGamePadMode()) {
            case 1: v_axis = [0, 3, 2, 1]; // PITCH3  _ RUDD0        #    THR1    _  ROLL2
                break;
            case 2: v_axis = [0, 1, 2, 3]; // THR1    _ RUDD0        #    PITCH3  _  ROLL2
                break;
            case 3: v_axis = [2, 3, 0, 1]; // PITCH3  _ ROLL2        #    THR1    _  RUDD0
                break;
            case 4: v_axis = [2, 1, 0, 3]; // THR1    _ ROLL2        #    PITCH3  _  RUDD0 
                break;

        }

        // IMPORTANT: Convert [-1,1] to [0,1000] IMPORTANT: -1 means channel release so min is 0
        let p_msg = {
            'R': parseInt(parseFloat(p_axes[v_axis[0]]) * 500 + 500),  // Rudder
            'T': parseInt(-parseFloat(p_axes[v_axis[1]]) * 500 + 500), // Throttle
            'A': parseInt(parseFloat(p_axes[v_axis[2]]) * 500 + 500),  // Aileron
            'E': parseInt(parseFloat(p_axes[v_axis[3]]) * 500 + 500),  // Elevator
        };

        fn_console_log(p_msg);
        this.API_sendCMD(this.m_gamePadUnit.partyID, CONST_TYPE_AndruavMessage_RemoteControl2, p_msg);
    };


    /**
		 * 
		 */
    API_do_ServoChannel(p_partyID, p_channelNum, p_value) {

        var msg = {
            n: parseInt(p_channelNum),
            v: parseInt(p_value)
        };
        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_ServoChannel, msg);
    }

    // Very Danger to expose [emergencyDisarm]
    API_do_Arm(p_andruavUnit, param_toArm, param_emergencyDisarm) {
        if (p_andruavUnit.partyID == null) return ;
        var msg = {
            A: param_toArm,
            D: param_emergencyDisarm
        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_Arm, msg);
    }


    API_do_ChangeAltitude(p_andruavUnit, param_altitude) {
        if ((p_andruavUnit == null) ||(p_andruavUnit.partyID == null)) return ;
        var msg = {
            a: parseInt(param_altitude)
        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_ChangeAltitude, msg);
    }


    API_do_YAW(p_andruavUnit, var_targetAngle, var_turnRate, var_isClockwise, var_isRelative) {
        if ((p_andruavUnit == null) ||(p_andruavUnit.partyID == null)) return ;
        var msg = {
            A: parseFloat(var_targetAngle),
            R: parseFloat(var_turnRate),
            C: var_isClockwise,
            L: var_isRelative

        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_DoYAW, msg);
    }


    API_do_SetHomeLocation(p_partyID, p_lat, p_lng, p_alt) {
        if (p_partyID == null) return ;
        if (p_alt == null) {
            p_alt = 0;
        }

        let p_msg = {
            T: p_lat,
            O: p_lng,
            A: p_alt

        };

        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_SetHomeLocation, p_msg);
    }

    API_do_GetHomeLocation (p_andruavUnit)
    {
        if (p_andruavUnit.partyID == null) return ;
        var v_msg = {
            C: CONST_TYPE_AndruavMessage_HomeLocation
        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };
    


    API_do_GimbalCtrl(p_andruavUnit, p_pitch, p_roll, p_yaw, p_isAbsolute) {
        if (p_andruavUnit.partyID == null) return ;
        var v_msg = {
            A: Math.round(p_pitch),
            B: Math.round(p_roll),
            C: Math.round(p_yaw),
            D: p_isAbsolute

        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_GimbalCtrl, v_msg);
    }


    API_do_ChangeSpeed1(p_andruavUnit, p_speed) {
        this.API_do_ChangeSpeed2(p_andruavUnit, p_speed);
    }


    API_do_ChangeSpeed2(p_andruavUnit, p_speed, p_isGroundSpeed, p_throttle, p_isRelative) {
        if (p_andruavUnit.partyID == null) return ;
        var v_msg = {
            a: p_speed,
            b: p_isGroundSpeed == null ? true : p_isGroundSpeed,
            c: p_throttle == null ? -1 : p_throttle,
            d: p_isRelative == null ? false : p_isRelative

        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_ChangeSpeed, v_msg);
    }

    API_do_Land(p_andruavUnit) {
        if (p_andruavUnit.partyID == null) return ;
        var v_msg = {};
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_Land, v_msg);
    }

    //TODO: change p_partyID to p_andruavUnit
    API_do_FlightMode(p_partyID, flightMode) {
        var v_msg = {
            F: flightMode
        };
        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_FlightControl, v_msg);
    }


    API_setGPSSource(p_andruavUnit, p_source) { // (p_andruavUnit,OnOff)

        if (p_andruavUnit.partyID == null) return ;
        var v_msg = {
            C: CONST_RemoteCommand_SET_GPS_SOURCE,
            s: p_source
        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };


    API_WebRTC_Signalling(p_partyID, p_webrtcMsg) {
        var v_msg = {
            w: p_webrtcMsg
        };
        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_Signaling, v_msg);

    }

    API_CONST_RemoteCommand_streamVideo(p_andruavUnit, p_OnOff, p_number, p_channel) {

        if (p_andruavUnit.partyID == null) return ;
        var v_msg = {
            C: CONST_RemoteCommand_STREAMVIDEO,
            Act: p_OnOff
        };

        if (p_OnOff == false) {
            v_msg.CH = p_channel;
            v_msg.N = p_number;
        }

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
        this.EVT_videoStateChanged(p_andruavUnit, p_OnOff);
    };


    /**
		 * 
		 * 
		 * @param {any} p_partyID
		 * @param {any} latitude
		 * @param {any} longitude
		 * @param {any} altitude
		 * @param {any} xVel : this can be null in this case all velocity parameters will be ignored
		 * @param {any} yVel
		 * @param {any} zVel
		 */
    API_do_FlyHere(p_partyID, p_latitude, p_longitude, p_altitude, p_xVel, p_yVel, p_zVel) {
        var v_msg = {
            a: p_latitude,
            g: p_longitude,
            l: p_altitude
        };
        if (p_xVel != null) {
            v_msg.x = p_xVel;
            v_msg.y = p_yVel;
            v_msg.z = p_zVel;
        }

        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_GuidedPoint, v_msg);
    }


    API_do_CircleHere(p_partyID, p_latitude, p_longitude, p_altitude, p_radius, p_turns) {
        var v_msg = {
            a: p_latitude,
            g: p_longitude,
            l: p_altitude,
            r: p_radius,
            t: p_turns
        };

        this.API_sendCMD(p_partyID, CONST_TYPE_AndruavMessage_CirclePoint, v_msg);
    }


    API_requestReloadLocalGroupGeoFenceTasks(v_target) {
        this._API_requestReloadLocalGroupTasks(v_target, CONST_TASK_SCOPE_LOCALGROUP, CONST_TYPE_AndruavMessage_ExternalGeoFence);
    }


    // local function
    _API_requestReloadLocalGroupTasks(v_target, v_taskscope, v_tasktype) {
        var v_msg = {
            C: CONST_TYPE_AndruavSystem_LoadTasks, // hardcoded here
            ts: v_taskscope
        };

        if (v_tasktype != null) 
            v_msg.tp = v_tasktype;
        

        this.API_sendCMD(v_target, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };


    API_requestGeoFences(p_andruavUnit, p_fenceName) {
        var v_msg = {
            C: CONST_TYPE_AndruavMessage_GeoFence

        };
        if ((p_fenceName !== undefined) || (p_fenceName !== null)) {
            v_msg.fn = p_fenceName;
        }

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };


    API_requestGeoFencesAttachStatus(p_andruavUnit, p_fenceName) {


        var v_msg = {
            C: CONST_TYPE_AndruavMessage_GeoFenceAttachStatus

        };
        if ((p_fenceName !== undefined) || (p_fenceName !== null)) {
            v_msg.fn = p_fenceName;
        }

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);


    };


    API_requestDeleteGeoFences(p_andruavUnit, p_fenceName) {


        var v_msg = {
            C: CONST_RemoteCommand_CLEAR_FENCE_DATA

        };
        if (p_fenceName != null) {
            v_msg.fn = p_fenceName;
        }


        this.API_sendCMD((p_andruavUnit != null) ? p_andruavUnit.partyID : null, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);


    };


    API_uploadWayPoints(p_andruavUnit, p_eraseFirst, p_textMission) { // eraseFirst NOT IMPLEMENTED YET
        if (p_andruavUnit.partyID == null) return ;
        
        var v_msg = {};

        v_msg.a = p_textMission;

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_UploadWayPoints, v_msg);


    };

    API_saveWayPointTasks (p_accountID, m_groupName, p_partyID, p_receiver, isPermanent, p_missionV110) {
        if ((p_partyID == null) || (p_partyID == ""))
            p_partyID = '_any_';
    
        if ((m_groupName == null) || (m_groupName == "")) 
            m_groupName = '_any_';
        
        const c_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: m_groupName,
            s: this.partyID,
            r: p_receiver,
            mt: CONST_TYPE_AndruavMessage_UploadWayPoints,
            ip: isPermanent,
            t: {'a':p_missionV110}
        }

        this._API_sendSYSCMD(CONST_TYPE_AndruavSystem_SaveTasks, c_msg);
    }

    API_clearWayPoints(p_andruavUnit, p_enableFCB) {

        if (p_andruavUnit.partyID == null) return ;
        
        var v_msg = {
            C: CONST_RemoteCommand_CLEAR_WAY_POINTS

        };
        if (p_enableFCB === false) 
            return;
        

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);

    };


    /**
		 * 
		 * @param {*} p_andruavUnit 
		 * @param {*} p_missionNumber mission is zero based - zero is home position
		 */
    API_do_StartMissionFrom(p_andruavUnit, p_missionNumber) {

        if (p_andruavUnit.partyID == null) return ;
        
        if (p_missionNumber < 0) 
            p_missionNumber = 0;
        
        var p_msg = {};

        p_msg.C = CONST_RemoteCommand_SET_START_MISSION_ITEM;
        p_msg.n = p_missionNumber;

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, p_msg);


    };

    API_FireEvent(p_andruavUnit, p_event_id)
    {
        const c_party = p_andruavUnit!=null?p_andruavUnit.partyID:null;
        
        if (CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
            return;
        }

        var p_msg = {
            a: parseInt(p_event_id)
        };

        this.API_sendCMD(c_party, CONST_TYPE_AndruavMessage_Sync_EventFire, p_msg);
    }

    // CODEBLOCK_START
    API_requestSearchableTargets(p_andruavUnit) {
        if (p_andruavUnit.partyID == null) return ;
        if (CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
            return;
        }

        var p_msg = {};
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_SearchTargetList, p_msg);
    }
    // CODEBLOCK_END

    API_requestUdpProxyStatus (p_andruavUnit)
    {
        if (p_andruavUnit.partyID == null) return ;
        var msg = {
            C: CONST_TYPE_AndruavMessage_UdpProxy_Info
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
       
    }

    API_setUdpProxyClientPort (p_andruavUnit, p_clientPort)
    {
        if (p_andruavUnit.partyID == null) return ;
        var msg = {
            C: CONST_RemoteCommand_SET_UDPPROXY_CLIENT_PORT,
            P: p_clientPort
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
       
    }
    
    API_requestMissionCount (p_andruavUnit)
    {
        if (p_andruavUnit.partyID == null) return ;
        var msg = {
            C: CONST_RemoteCommand_MISSION_COUNT
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
       
    }
    
    API_requestWayPoints(p_andruavUnit, p_enableFCB) 
    {
        if (p_andruavUnit.partyID == null) return ;
        var msg = {};
        if (p_enableFCB == true) {
            msg.C = CONST_RemoteCommand_RELOAD_WAY_POINTS_FROM_FCB;
        } else {
            msg.C = CONST_RemoteCommand_GET_WAY_POINTS;
        }

        if (this.v_waypointsCache.hasOwnProperty(p_andruavUnit.partyID) === true) {
            // ! due to disconnection or repeated request this array could be filled of an incomplete previous request.
            // ! this value will be reset each time load wp is called.
            delete this.v_waypointsCache[p_andruavUnit.partyID];
        }
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };


    API_requestParamList(p_andruavUnit) 
    {
        if (p_andruavUnit.partyID == null) return ;
        
        var msg = {};
        msg.C = CONST_RemoteCommand_REQUEST_PARAM_LIST;
        
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };


    API_requestCameraList(p_andruavUnit, p_callback) {
        if (p_andruavUnit.partyID == null) return ;
        if (p_callback != null) {
            this.fn_callbackOnMessageID(p_callback, CONST_TYPE_AndruavMessage_CameraList);
        }

        var p_msg = {
            C: CONST_TYPE_AndruavMessage_CameraList
        };

        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, p_msg);
    };


    API_requestDeleteWayPoint(p_PartyID, p_fenceName) {

        var p_msg = {
            C: CONST_RemoteCommand_CLEAR_WAY_POINTS

        };
        if (p_fenceName != null) {
            p_msg.fn = p_fenceName;
        }


        this.API_sendCMD(p_PartyID, CONST_TYPE_AndruavMessage_RemoteExecute, p_msg);
    };


    /*
        * Disable Geo Fence info to Offline Tasks
        * */
    API_disableWayPointTasks(p_accountID, p_groupName, p_partyID, p_receiver, p_isPermanent) {
        if (p_partyID == null) 
            p_partyID = '_any_';
        
        if (p_groupName == null) 
            p_groupName = '_any_';
        
        let p_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: p_groupName,
            // sender: this.partyID,
            // receiver: receiver,
            mt: CONST_TYPE_AndruavMessage_ExternalCommand_WayPoints,
            ip: p_isPermanent,
            enabled: 1
        }

        this._API_sendSYSCMD(CMD_SYS_TASKS, CONST_TYPE_AndruavSystem_DisableTasks, p_msg);
    };


    API_TXCtrl(p_andruavUnit, p_subAction) {
        if (p_andruavUnit.partyID == null) return ;
        var p_msg = {
            b: p_subAction

        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteControlSettings, p_msg);

    }


    API_connectToFCB(p_andruavUnit) {
        if (p_andruavUnit.partyID == null) return ;
        var p_msg = {
            C: CONST_RemoteCommand_CONNECT_FCB

        };
        this.API_sendCMD(p_andruavUnit.partyID, CONST_TYPE_AndruavMessage_RemoteExecute, p_msg);
    }


    API_SwitchCamera(p_target, p_cameraUniqueName) {
        var msg = {
            u: p_cameraUniqueName
        };

        this.API_sendCMD(p_target, CONST_TYPE_AndruavMessage_CameraSwitch, msg);
    };


    API_TurnMobileFlash(p_target, p_flashOn, p_cameraUniqueName) {
        var msg = {
            f: p_flashOn,
            u: p_cameraUniqueName
        };

        this.API_sendCMD(p_target, CONST_TYPE_AndruavMessage_CameraFlash, msg);
    };


    API_CONST_RemoteCommand_zoomCamera(p_target, p_cameraUniqueName, p_isZoomeIn, p_zoomValue, p_zoomValueStep) {
        var msg = {
            u: p_cameraUniqueName,
            a: p_isZoomeIn
        };

        if (p_zoomValue != null) 
            msg.b = p_zoomValue;
        
        if (p_zoomValueStep != null) 
            msg.c = p_zoomValueStep;
        


        this.API_sendCMD(p_target, CONST_TYPE_AndruavMessage_CameraZoom, msg);
    };


    API_CONST_RemoteCommand_takeImage2(p_target, _cameraSource, _numberofImages, _timeBetweenShots, _distanceBetweenShots) {
        var msg = {
            a: _cameraSource,
            b: parseInt(_numberofImages),
            c: parseFloat(_timeBetweenShots),
            d: parseFloat(_distanceBetweenShots)
        };
        this.API_sendCMD(p_target, CONST_TYPE_AndruavMessage_Ctrl_Camera, msg);
    };


    API_CONST_RemoteCommand_recordVideo(p_target, p_trackId, p_OnOff) {
        var v_unit = this.m_andruavUnitList.fn_getUnit(p_target);
        if (v_unit == null) { // you may declare an error message or send for ID Request
            return;
        }

        var v_OnOff;

        if (p_OnOff != null) {
            v_OnOff = p_OnOff;
        } else {
            v_OnOff = ! v_unit.m_Video.VideoRecording
        }

        var v_msg = {
            C: CONST_RemoteCommand_RECORDVIDEO,
            // New field here
            T: p_trackId,
            Act: v_OnOff
        };
        this.API_sendCMD(p_target, CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
        this.EVT_videoStateChanged(v_unit, v_OnOff);
    };


    prv_parseFenceInfo(p_andruavUnit, p_jmsg) {
        var fencetype;
        var m_shouldKeepOutside = false;
        // var jmsg 				= msg.msgPayload;

        var v_geoFenceName = p_jmsg.n;
        var v_maximumDistance = (p_jmsg.hasOwnProperty('r')) ? p_jmsg.r : 0; // optional
        if (p_jmsg.hasOwnProperty('o')) { // 1 if restricted area
            m_shouldKeepOutside = (p_jmsg.o == 1); // optional
        }
        if (p_jmsg.hasOwnProperty('t')) { // 1 if restricted area
            switch (p_jmsg.t) {
                case 1: fencetype = CONST_TYPE_LinearFence;
                    break;

                case 2: fencetype = CONST_TYPE_PolygonFence;
                    break;

                case 3: fencetype = CONST_TYPE_CylinderFence;
                    break;
            }
        }
        var geoFenceInfo = {};
        var LngLatPoints = [];

        var count = (fencetype == CONST_TYPE_CylinderFence) ? 1 : p_jmsg.c;

        for (var i = 0; i < count; ++ i) {
            var lnglat = {};
            lnglat.lat = parseFloat(p_jmsg[i].a);
            lnglat.lng = parseFloat(p_jmsg[i].g);
            if (p_jmsg[i].hasOwnProperty('l')) 
                lnglat.alt = parseFloat(p_jmsg[i].l);
             else 
                lnglat.alt = 0;
             // altitude
            LngLatPoints.push(lnglat);
        }
        geoFenceInfo.m_shouldKeepOutside = m_shouldKeepOutside;
        geoFenceInfo.fencetype = fencetype;
        geoFenceInfo.LngLatPoints = LngLatPoints;
        geoFenceInfo.m_geoFenceName = v_geoFenceName;
        geoFenceInfo.m_maximumDistance = v_maximumDistance;

        geoFenceInfo.isEditable = (p_andruavUnit == null);
        this.EVT_andruavUnitGeoFenceUpdated(p_andruavUnit, geoFenceInfo);
    };

    // please move it out side
    fn_generateJSONMessage(p_senderID, p_targetID, p_msgRouting, p_msgID, p_msg) { // prepare json data
        var p_jmsg = {
            ty: p_msgRouting,
            // MSGRrouting,
            // cm: cm, //cmd, DEPRECATED
            sd: p_senderID, // p_senderID,
            st: 'w', // senderType Web,
            tg: p_targetID,
            mt: p_msgID, // msgID,
            ms: p_msg

        };


        fn_console_log("out:" + JSON.stringify(p_jmsg));

        return JSON.stringify(p_jmsg);
    };


    _fn_onNewUnitAdded(target) { // this.API_requestGeoFences (p_andruavUnit);
        this.API_requestGeoFencesAttachStatus(target);
        this.API_requestUdpProxyStatus(target);
        this.API_requestWayPoints(target);

        
        if (CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
            return;
        }

        
        
    };

    fn_parseJSONMessage(JsonMessage) {

        var p_jmsg = JSON.parse(JsonMessage); // PHP sends Json data

        var message = {
            _ty: p_jmsg.ty,
            // command type
            // _cd 		: p_jmsg.cm,                 //main-command DEPRECATED
            groupID: p_jmsg.gr, // group name
            senderName: p_jmsg.sd, // sender name
            msgPayload: p_jmsg.ms
        };

        if (p_jmsg.hasOwnProperty('mt')) {
            message.messageType = p_jmsg.mt;
        }

        return message;
    };


    prv_parseCommunicationMessage(Me, msg, evt) {

        var p_jmsg;
        var p_unit = this.m_andruavUnitList.fn_getUnit(msg.senderName);

        if (p_unit == null)
        {
            
            p_unit = new CAndruavUnitObject();
            // p_unit.m_defined = false; define it as incomplete
            p_unit.m_IsMe = false;
            p_unit.m_defined = false;
            p_unit.partyID = msg.senderName;
            p_unit.m_index = Me.m_andruavUnitList.count;
            Me.m_andruavUnitList.Add(p_unit.partyID, p_unit);
            if (msg.messageType != CONST_TYPE_AndruavMessage_ID) 
            {
                if (p_unit.m_Messages.fn_sendMessageAllowed(CONST_TYPE_AndruavMessage_ID) === true)
                {
                    // it is already identifying itself.
                    Me.API_requestID(msg.senderName);
                    p_unit.m_Messages.fn_doNotRepeatMessageBefore(CONST_TYPE_AndruavMessage_ID,1000,new Date())
                }
                else
                {
                    console.log ("skip");
                }
            }
        }

        p_unit.m_Messages.fn_addMsg(msg.messageType);
        p_unit.m_NetworkStatus.m_received_msg++;
        p_unit.m_NetworkStatus.m_received_bytes += evt.data.length;
        p_unit.m_NetworkStatus.m_lastActiveTime = Date.now();
        
        switch (msg.messageType) {

            case CONST_TYPE_AndruavMessage_UdpProxy_Info: {
                p_jmsg = msg.msgPayload;
                p_unit.m_Telemetry.m_udpProxy_ip        = p_jmsg.a;
                p_unit.m_Telemetry.m_udpProxy_port      = p_jmsg.p;
                p_unit.m_Telemetry.m_telemetry_level    = p_jmsg.o;
                p_unit.m_Telemetry.m_udpProxy_active    = p_jmsg.en;
                if (p_jmsg.hasOwnProperty('z')) {
                    p_unit.m_Telemetry.m_udpProxy_paused    = p_jmsg.z;
                }
                else
                {
                    p_unit.m_Telemetry.m_udpProxy_paused = false;
                }
                
                window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, p_unit);
                
                }
                break;

            case CONST_TYPE_AndruavMessage_GPS: 
                p_jmsg = msg.msgPayload;
                
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                p_unit.m_GPS_Info1.m_isValid = true;
                p_unit.m_GPS_Info1.GPS3DFix = p_jmsg['3D'];
                p_unit.m_GPS_Info1.m_satCount = p_jmsg.SC;
                if (p_jmsg.hasOwnProperty('c')) {
                    p_unit.m_GPS_Info1.accuracy = p_jmsg.c;
                } else {
                    p_unit.m_GPS_Info1.accuracy = 0;
                } p_unit.m_GPS_Info1.provider = p_jmsg.p;

                if (p_jmsg.la == null) {
                    p_unit.m_GPS_Info1.m_isValid = false;
                } else {
                    p_unit.m_GPS_Info1.m_isValid = true;
                } 
                p_unit.m_Nav_Info.p_Location.lat = p_jmsg.la;
                p_unit.m_Nav_Info.p_Location.lng = p_jmsg.ln
                p_unit.m_Nav_Info.p_Location.alt = parseFloat(p_jmsg.a);
                p_unit.m_Nav_Info.p_Location.time = p_jmsg.t;
                if (p_jmsg.hasOwnProperty('s')) {
                    p_unit.m_Nav_Info.p_Location.ground_speed = parseFloat(p_jmsg.s); // can be null
                }

                if (p_jmsg.hasOwnProperty('b')) {
                    p_unit.m_Nav_Info.p_Location.bearing = parseFloat(p_jmsg.b); // can be null
                }
                Me.EVT_msgFromUnit_GPS(p_unit);
                break;

            case CONST_TYPE_AndruavMessage_CameraFlash: {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    const c_obj = {};
                    c_obj.p_unit = p_unit;
                    c_obj.p_jmsg = p_jmsg;
                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_cameraFlashChanged, c_obj);
                }
                break;

            case CONST_TYPE_AndruavMessage_CameraZoom: {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    const c_obj = {};
                    c_obj.p_unit = p_unit;
                    c_obj.p_jmsg = p_jmsg;
                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_cameraZoomChanged, c_obj);
                }
                break;

            case CONST_TYPE_AndruavMessage_CameraList: {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    
                    var v_session = {};
                    v_session.status = 'connected';
                    v_session.m_unit = p_unit;

                    if (p_jmsg.T.length != 0) { /*
								jsonVideoSource[CAMERA_SUPPORT_VIDEO "v"]           = true;
								jsonVideoSource[CAMERA_LOCAL_NAME "ln"]             = deviceInfo.local_name;
								jsonVideoSource[CAMERA_UNIQUE_NAME "id"]            = deviceInfo.unique_name;
								jsonVideoSource[CAMERA_ACTIVE "active"]             = deviceInfo.active;
								jsonVideoSource[CAMERA_TYPE "p"]                    = EXTERNAL_CAMERA_TYPE_RTCWEBCAM;
								jsonVideoSource[CAMERA_TYPE "f"]                    = ANDROID_DUAL_CAM; facing/rearing (true,false)
								jsonVideoSource[CAMERA_TYPE "z"]					= Support Zooming 
								jsonVideoSource[CAMERA_TYPE "r"]					= video recording now
							*/
                        p_unit.m_Video.m_videoTracks = p_jmsg.T;

                        if (p_jmsg.R === true) { // this is a reply to request.
                            // if (this.v_callbackListeners.hasOwnProperty(CONST_TYPE_AndruavMessage_CameraList) === true) {
                            //     this.v_callbackListeners[CONST_TYPE_AndruavMessage_CameraList](v_session);
                            //     delete this.v_callbackListeners[CONST_TYPE_AndruavMessage_CameraList];
                            // }
                            this.fn_callbackOnMessageID_Answer(CONST_TYPE_AndruavMessage_CameraList, v_session);
                        }
                    } else {
                        // NO AVAILABLE CAMERA
                        // error: received emprty session.
                    }
                }
                break;

            case CONST_TYPE_AndruavMessage_CommSignalsStatus: {
                    p_jmsg = msg.msgPayload;
                    
                    p_unit.m_SignalStatus.m_mobile = true;
                    p_unit.m_SignalStatus.m_mobileSignalLevel = p_jmsg.r;
                    p_unit.m_SignalStatus.m_mobileNetworkType = p_jmsg.s;
                    p_unit.m_SignalStatus.m_mobileNetworkTypeRank = fn_getNetworkType(p_jmsg.s);
                }
                break;

            case CONST_TYPE_AndruavMessage_ID: {
                    var v_trigger_on_vehicleblocked = false;
                    var v_trigger_on_flying = false;
                    var v_trigger_on_armed = false;
                    var v_trigger_on_FCB = false;
                    var v_trigger_on_flightMode = false;
                    var v_trigger_on_module_changed = false;
                    var v_trigger_on_vehiclechanged = false;
                    var v_trigger_on_swarm_status = false,
                        v_trigger_on_swarm_status2 = false;

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }

                    if ((p_unit != null) && (p_unit.m_defined === true)){
                        p_unit.m_IsMe = false;
                        p_unit.m_IsGCS = p_jmsg.GS;
                        p_unit.m_unitName = p_jmsg.UD;
                        p_unit.Description = p_jmsg.DS;
                        p_unit.m_telemetry_protocol = p_jmsg.TP;
                        v_trigger_on_vehiclechanged = (p_unit.m_VehicleType != p_jmsg.VT);
                        p_unit.m_VehicleType = p_jmsg.VT;
                        p_unit.m_Video.VideoRecording = p_jmsg.VR; // ON DRONE RECORDING
                        p_unit.m_GPS_Info1.gpsMode = p_jmsg.GM;
                        p_unit.m_Permissions = p_jmsg.p;
                        
                        if (p_jmsg.hasOwnProperty('m1') == true) {
                            if (p_jmsg.m1.length != p_unit.m_modules.length)
                            {
                                v_trigger_on_module_changed = true;
                            }
                            p_unit.m_modules = p_jmsg.m1;
                        }

                        
                        if (p_jmsg.hasOwnProperty('dv') === true) {
                            p_unit.m_isDE = true;
                            if(p_unit.m_version != p_jmsg['dv'])
                            {
                                p_unit.m_version = p_jmsg['dv'];
                                Me.EVT_andruavUnitError (p_unit, {
                                    notification_Type:5,
                                    Description: "DE SW ver:" + p_unit.m_version
                                });
                            }
                        }
                        
                        if (p_jmsg.hasOwnProperty('B') === true) {
                            v_trigger_on_vehicleblocked = (p_unit.m_Telemetry.m_isGCSBlocked !== p_jmsg.B)

                            p_unit.m_Telemetry.m_isGCSBlocked = p_jmsg.B;
                        }

                        if (p_jmsg.hasOwnProperty('C') === true) { 
                            p_unit.m_Telemetry.fn_updateTelemetry(p_jmsg.C);
                        }

                        if (p_jmsg.hasOwnProperty('FI') !== true) {
                            p_jmsg.FI = false;
                        }
                        p_unit.m_useFCBIMU = p_jmsg.FI;

                        if (p_jmsg.hasOwnProperty('SD') !== true) {
                            p_jmsg.SD = false;
                        }
                        p_unit.m_IsShutdown = p_jmsg.SD;

                        if (p_jmsg.hasOwnProperty('AP') === true) {
                            p_unit.m_autoPilot = p_jmsg.AP;
                        }
                        

                        if (p_jmsg.hasOwnProperty('FM') !== true) {
                            p_jmsg.FM = false;
                        }
                        v_trigger_on_flightMode = (p_unit.m_flightMode != p_jmsg.FM);
                        p_unit.m_flightMode = p_jmsg.FM;

                        if (p_jmsg.hasOwnProperty('AR') !== true) {
                            p_jmsg.AR = false;
                        }
                        v_trigger_on_armed = (p_unit.m_isArmed != p_jmsg.AR);
                        p_unit.m_isArmed = p_jmsg.AR;

                        if (p_jmsg.hasOwnProperty('FL') !== true) {
                            p_jmsg.FL = false;
                        }
                        v_trigger_on_flying = (p_unit.m_isFlying != p_jmsg.FL);
                        p_unit.m_isFlying = p_jmsg.FL;

                        if (p_jmsg.hasOwnProperty('z') === true) {
                            p_unit.m_FlyingLastStartTime = p_jmsg.z / 1000; // to seconds
                        }

                        if (p_jmsg.hasOwnProperty('a') == true) {
                            p_unit.m_FlyingTotalDuration = p_jmsg.a  / 1000; // to seconds
                        }

                        if ((p_jmsg.hasOwnProperty('n') === true) && (p_jmsg.n != CONST_TASHKEEL_SERB_NO_SWARM)) { // SwarmMemberLeaderFormation
                            v_trigger_on_swarm_status = (p_unit.m_Swarm.m_formation_as_follower != CONST_TASHKEEL_SERB_NO_SWARM);
                            p_unit.m_Swarm.m_formation_as_follower = p_jmsg.n;
                        } else {
                            v_trigger_on_swarm_status = (p_unit.m_Swarm.m_formation_as_follower != CONST_TASHKEEL_SERB_NO_SWARM);
                            p_unit.m_Swarm.m_formation_as_follower = CONST_TASHKEEL_SERB_NO_SWARM;
                        }

                        if ((p_jmsg.hasOwnProperty('o') === true) && (p_jmsg.o != CONST_TASHKEEL_SERB_NO_SWARM)) { // SwarmMemberLeaderFormation
                            v_trigger_on_swarm_status = (p_unit.m_Swarm.m_isLeader != true);
                            p_unit.m_Swarm.m_isLeader = true;
                            p_unit.m_Swarm.m_formation_as_leader = p_jmsg.o;
                        } else {
                            v_trigger_on_swarm_status = (p_unit.m_Swarm.m_isLeader != false);
                            p_unit.m_Swarm.m_isLeader = false;
                            p_unit.m_Swarm.m_formation_as_leader = CONST_TASHKEEL_SERB_NO_SWARM;
                        }

                        if ((p_jmsg.hasOwnProperty('q') === true) && (p_jmsg.q != "")){
                            v_trigger_on_swarm_status2 = (p_unit.m_Swarm.m_following != p_jmsg.q);
                            p_unit.m_Swarm.m_following = p_jmsg.q;
                        } else {
                            v_trigger_on_swarm_status2 = (p_unit.m_Swarm.m_following  != null);
                            p_unit.m_Swarm.m_following = null;
                        } 
                        this.m_andruavUnitList.putUnit(p_unit.partyID, p_unit);
                        window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, p_unit);
                    } else {
                        p_unit.m_defined = true;
                        p_unit.m_NetworkStatus.m_lastActiveTime = Date.now();
                        p_unit.m_IsMe = false;
                        p_unit.m_IsGCS = p_jmsg.GS;
                        p_unit.m_unitName = p_jmsg.UD;
                        p_unit.partyID = msg.senderName;
                        p_unit.Description = p_jmsg.DS;
                        p_unit.m_telemetry_protocol = p_jmsg.TP;
                        p_unit.m_VehicleType = p_jmsg.VT;
                        p_unit.m_Video.VideoRecording = p_jmsg.VR;
                        p_unit.m_Permissions = p_jmsg.p;
                        p_unit.m_GPS_Info1.gpsMode = p_jmsg.GM;
                        v_trigger_on_FCB = (p_unit.m_useFCBIMU != p_jmsg.FI);
                        p_unit.m_useFCBIMU = p_jmsg.FI;
                        
                        if (p_jmsg.hasOwnProperty('m1') == true) {
                            p_unit.m_modules = p_jmsg.m1;
                        }

                        if (p_jmsg.hasOwnProperty('dv') == true) {
                            p_unit.m_isDE = true;
                            p_unit.m_version = p_jmsg['dv'];
                            setTimeout(function () {
                                Me.EVT_andruavUnitError (p_unit, {
                                    notification_Type:5,
                                    Description: "DE SW ver:" + p_unit.m_version
                                });
                
                            }, 1000);
                        }
                        
                        if (p_jmsg.hasOwnProperty('B') == true) {
                            p_unit.m_Telemetry.m_isGCSBlocked = p_jmsg.B;
                        }
                        
                        if (p_jmsg.hasOwnProperty('SD') == true) {
                            p_unit.m_IsShutdown = p_jmsg.SD;
                        }
                        if (p_jmsg.hasOwnProperty('FM') == true) {
                            v_trigger_on_flightMode = (p_unit.m_flightMode != p_jmsg.FM);
                            p_unit.m_flightMode = p_jmsg.FM;
                        }
                        if (p_jmsg.hasOwnProperty('AP') === true) {
                            p_unit.m_autoPilot = p_jmsg.AP;
                        }
                        if (p_jmsg.hasOwnProperty('AR') == true) {
                            v_trigger_on_armed = (p_unit.m_isArmed != p_jmsg.AR);
                            p_unit.m_isArmed = p_jmsg.AR;
                        }
                        if (p_jmsg.hasOwnProperty('FL') == true) {
                            v_trigger_on_flying = (p_unit.m_isFlying != p_jmsg.FL);
                            p_unit.m_isFlying = p_jmsg.FL;
                        }
                        if (p_jmsg.hasOwnProperty('z') == true) {
                            p_unit.m_FlyingLastStartTime = p_jmsg.z;
                        }
                        if (p_jmsg.hasOwnProperty('a') == true) {
                            p_unit.m_FlyingTotalDuration = p_jmsg.a;
                        }

                        if ((p_jmsg.hasOwnProperty('n') === true) && (p_jmsg.n != CONST_TASHKEEL_SERB_NO_SWARM)) { // SwarmMemberLeaderFormation
                            p_unit.m_Swarm.m_formation_as_follower = p_jmsg.n;
                        } else {
                            p_unit.m_Swarm.m_formation_as_follower = CONST_TASHKEEL_SERB_NO_SWARM;
                        }
                        
                        if ((p_jmsg.hasOwnProperty('o') == true) && (p_jmsg.o != 0)) { // SwarmMemberLeaderFormation
                            p_unit.m_Swarm.m_isLeader = true;
                            p_unit.m_Swarm.m_formation_as_leader = p_jmsg.o;
                        } else {
                            p_unit.m_Swarm.m_isLeader = false;
                            p_unit.m_Swarm.m_formation_as_leader = CONST_TASHKEEL_SERB_NO_SWARM;

                        }

                        if ((p_jmsg.hasOwnProperty('q') == true) && (p_jmsg.q != "")){
                            p_unit.m_Swarm.m_following = p_jmsg.q;
                        } else {
                            p_unit.m_Swarm.m_following = null;
                        }
                        
                        this.m_andruavUnitList.Add(p_unit.partyID, p_unit);
                        this._fn_onNewUnitAdded(p_unit);

                        this.EVT_andruavUnitAdded(p_unit);
                    }
                    // CODEBLOCK_START
                    if (v_trigger_on_swarm_status) 
                        this.EVT_andruavUnitSwarmUpdated(p_unit)
                    
                    if (v_trigger_on_swarm_status2) 
                        this.EVT_andruavUnitSwarmUpdated2(p_unit)
                    
                    // CODEBLOCK_END
                    if (v_trigger_on_FCB) 
                        this.EVT_andruavUnitFCBUpdated(p_unit);
                    
                    if (v_trigger_on_armed) 
                        this.EVT_andruavUnitArmedUpdated(p_unit);
                    
                    if (v_trigger_on_flying) 
                        this.EVT_andruavUnitFlyingUpdated(p_unit);
                    
                    if (v_trigger_on_flightMode) 
                        this.EVT_andruavUnitFightModeUpdated(p_unit);
                    
                    if (v_trigger_on_vehiclechanged) 
                        this.EVT_andruavUnitVehicleTypeUpdated(p_unit);
                        
                    if (v_trigger_on_module_changed)
                        this.EVT_andruavUnitModuleUpdated(p_unit);
                }

                break;

            case CONST_TYPE_AndruavMessage_RemoteExecute: if (p_unit == null) { // p_unit not defined here ... send a request for ID
                    Me.API_requestID(msg.senderName);
                    return;
                }

                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                switch (p_jmsg.C) {
                    case CONST_TYPE_AndruavMessage_ID:
                        // request send ID
                        Me.API_sendID();
                        break;


                    case CONST_RemoteCommand_CLEAR_FENCE_DATA:
                        // ////var jmsg = JSON.parse(msg.msgPayload);
                        if (p_jmsg.hasOwnProperty('fn')) { // fence name
                            var fenceName = p_jmsg.n;
                            Me.andruavGeoFences[fenceName];


                            var keys = Object.keys(GeoLinearFences); //TODO: BUG HERE .. VARIABLE IS NOT USED ELSEWHERE.
                            var size = Object.keys(GeoLinearFences).length;


                            for (var i = 0; i < size; ++ i) {
                                if (keys[i] == fenceName) {
                                    Me.EVT_andruavUnitGeoFenceBeforeDelete(Me.andruavGeoFences[keys[i]]);
                                    Me.andruavGeoFences.splice(i, 1);
                                    break;
                                }
                            }
                        } else { /*
									* if you need to keep the original array because you have other references to it that should be updated too, you can clear it without creating a new array by setting its length to zero:
									*/
                            Me.EVT_andruavUnitGeoFenceBeforeDelete();
                            Me.andruavGeoFences = [];
                            Me.andruavGeoFences.length = 0;
                        }
                        break;
                }
                break;

            case CONST_TYPE_AndruavMessage_POW: 
                
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                p_unit.m_Power._Mobile.p_Battery.BatteryLevel = p_jmsg.BL;
                p_unit.m_Power._Mobile.p_Battery.Voltage = p_jmsg.V;
                p_unit.m_Power._Mobile.p_Battery.BatteryTemperature = p_jmsg.BT;
                p_unit.m_Power._Mobile.p_Battery.Health = p_jmsg.H;
                p_unit.m_Power._Mobile.p_Battery.PlugStatus = p_jmsg.PS;
                p_unit.m_Power._Mobile.p_Battery.p_hasPowerInfo = true;

                if (p_jmsg.hasOwnProperty('FV')) {
                    p_unit.m_Power._FCB.p_Battery.p_hasPowerInfo = true;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryVoltage = p_jmsg.FV;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryCurrent = p_jmsg.FI;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryRemaining = p_jmsg.FR;

                    if (p_jmsg.hasOwnProperty('T')) { // version uavos_2021
                        p_unit.m_Power._FCB.p_Battery.FCB_BatteryTemprature = p_jmsg.T;
                    }
                    if (p_jmsg.hasOwnProperty('C')) { // version uavos_2021
                        p_unit.m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed = p_jmsg.C;
                    }
                } else {
                    p_unit.m_Power._FCB.p_Battery.p_hasPowerInfo = false;
                }

                window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, p_unit);
                break;
            case CONST_TYPE_AndruavMessage_ExternalGeoFence: {
                    if (msg.senderName != '_sys_') 
                        return;
                    
                    // this is a system command
                    var fencetype;
                    var m_shouldKeepOutside = false;
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    this.prv_parseFenceInfo(null, p_jmsg);

                }
                break;

            case CONST_TYPE_AndruavMessage_HomeLocation: 
                {

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }p_unit.m_Geo_Tags.p_HomePoint.m_isValid = true;
                    p_unit.m_Geo_Tags.p_HomePoint.lat = p_jmsg.T;
                    p_unit.m_Geo_Tags.p_HomePoint.lng = p_jmsg.O;
                    p_unit.m_Geo_Tags.p_HomePoint.alt = p_jmsg.A;

                    this.EVT_HomePointChanged(p_unit);
                }
                break;

            case CONST_TYPE_AndruavMessage_DistinationLocation: 
                {

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    p_unit.m_Geo_Tags.p_DestinationPoint.m_isValid = true;
                    var destination_type = CONST_DESTINATION_GUIDED_POINT;
                    if (p_jmsg.P != null)
                    {
                        destination_type = p_jmsg.P;
                    }
                    
                    p_unit.m_Geo_Tags.fn_addDestinationPoint(p_jmsg.T, p_jmsg.O, p_jmsg.A, destination_type);

                    this.EVT_DistinationPointChanged(p_unit);
                }
                break;

            case CONST_TYPE_AndruavMessage_GeoFence: {

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    this.prv_parseFenceInfo(p_unit, p_jmsg); //msg.msgPayload);
                }
                break;


            case CONST_TYPE_AndruavMessage_GeoFenceAttachStatus: {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    var geoFenceAttachStatus = {};
                    geoFenceAttachStatus.fenceName = p_jmsg.n;
                    geoFenceAttachStatus.isAttachedToFence = p_jmsg.a;
                    var fence = Me.andruavGeoFences[geoFenceAttachStatus.fenceName];

                    if (geoFenceAttachStatus.isAttachedToFence == true) { /*
						* If Action Attach:
						*  // we need to
							// 1- Make sure we have this fence --- if not then ask for it from this drone.
							// 2- Add this Drone to the fence
						*/
                        if ((fence == undefined) || (fence == null)) {
                            Me.API_requestGeoFences(p_unit, geoFenceAttachStatus.fenceName);
                            return;
                        } else {
                            if (fence.Units[p_unit.partyID] == null) { // not added to this fence .. attach p_unit to fence with missing measures.
                                var geoFenceInfo = {};
                                geoFenceInfo.hasValue = false;
                                geoFenceInfo.fenceName = fence.m_geoFenceName;
                                geoFenceInfo.m_inZone = false; // remember isValid = false
                                geoFenceInfo.distance = Number.NaN;
                                geoFenceInfo.m_shouldKeepOutside = fence.m_shouldKeepOutside;

                                fence.Units[p_unit.partyID] = {};
                                fence.Units[p_unit.partyID].geoFenceInfo = geoFenceInfo;
                            }
                            // else every thig already is there
                        }
                    } else { /*
						* If Action DeAttach:
						// 1- Deattach Drone from fence... if we dont have this fence then we DONT want IT
						// If another drone uses it we will know and ask for it from that drone.
						* 			
						* */
                        if ((fence != undefined) && (fence != null)) {
                            if (fence.Units[p_unit.partyID] != null) {
                                delete fence.Units[p_unit.partyID];
                            }
                        }
                    }
                }
                break;


            case CONST_TYPE_AndruavMessage_GEOFenceHit: {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    var geoFenceHitInfo = {
                        hasValue: true,
                        fenceName: p_jmsg.n,
                        m_inZone: p_jmsg.z,
                        m_shouldKeepOutside: (p_jmsg.o == 1)
                    };
                    if (p_jmsg.hasOwnProperty('d')) 
                        geoFenceHitInfo.distance = p_jmsg.d;
                     else 
                        geoFenceHitInfo.distance = Number.NaN;
                     Me.EVT_andruavUnitGeoFenceHit(p_unit, geoFenceHitInfo);
                }
                break;

                // CODEBLOCK_START
            case CONST_TYPE_AndruavMessage_SearchTargetList: {
                    if (CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
                        return;
                    }

                    p_jmsg = msg.msgPayload;
                    if (! p_jmsg.hasOwnProperty('t')) 
                        break;
                    
                    const c_len = p_jmsg.t.length;
                    for (var i = 0; i < c_len; ++ i) {
                        const c_targetItem = p_jmsg.t[i];
                        var c_search_target = {};
                        c_search_target.m_name = c_targetItem.n;
                        if (c_targetItem.hasOwnProperty('t')) {
                            c_search_target.m_type = c_targetItem.t;
                        } else {
                            c_search_target.m_type = "na";
                        } p_unit.m_DetectedTargets.m_searchable_targets[c_search_target.m_name] = c_search_target;
                    }
                    fn_console_log(JSON.stringify(p_jmsg));
                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_SearchableTarget, p_unit);
                }
                // CODEBLOCK_END

                // CODEBLOCK_START
            case CONST_TYPE_AndruavMessage_TrackingTargetLocation: {
                    if (CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
                        return;
                    }

                    p_jmsg = msg.msgPayload.t;
                    const c_len = p_jmsg.length;
                    p_unit.m_DetectedTargets.m_targets.m_list = [];
                    for (var i = 0; i < c_len; ++ i) {
                        const c_targetItem = p_jmsg[i];
                        var c_target = {};
                        c_target.x1 = c_targetItem.a;
                        c_target.y1 = c_targetItem.b;
                        if (c_targetItem.hasOwnProperty('r')) {
                            c_target.m_radius = c_targetItem.r;
                        } else {
                            c_target.x2 = c_targetItem.c;
                            c_target.y2 = c_targetItem.d;
                        }
                        if (c_targetItem.hasOwnProperty('p')) {
                            c_target.m_propability = c_targetItem.p;
                        }
                        if (c_targetItem.hasOwnProperty('n')) {
                            c_target.m_name = c_targetItem.n;
                        } else {
                            c_target.m_name = 'default';
                        } c_target.lastUpdate = Date.now();

                        p_unit.m_DetectedTargets.m_targets.m_list.push(c_target);
                    }
                    fn_console_log(JSON.stringify(p_jmsg));
                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_DetectedTarget, p_unit);
                }
                break;
                // CODEBLOCK_END

            case CONST_TYPE_AndruavMessage_DroneReport: {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }Me.EVT_msgFromUnit_WayPointsUpdated(p_unit, p_jmsg.P, p_jmsg.R);


                }
                break;

            case CONST_TYPE_AndruavMessage_Signaling: {
                    
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    var signal = p_jmsg.w || p_jmsg;
                    Me.EVT_andruavSignalling(p_unit, signal);
                }
                break;

            case CONST_TYPE_AndruavMessage_Error: {
                    var v_error = {};
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    v_error.errorNo = p_jmsg.EN;
                    v_error.infoType = p_jmsg.IT;
                    v_error.notification_Type = p_jmsg.NT;
                    v_error.Description = p_jmsg.DS;
                    Me.EVT_andruavUnitError(p_unit, v_error);


                }
                break;

            case CONST_TYPE_AndruavMessage_WayPoints: {

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }

                    var v_isChunck = WAYPOINT_NO_CHUNK;
                    if (p_jmsg.hasOwnProperty("i")) { // message is INCOMPLETE
                        v_isChunck = p_jmsg.i;
                    }
                    var numberOfRecords = p_jmsg.n;
                    var wayPoint = [];

                    if (v_isChunck !== WAYPOINT_NO_CHUNK) {
                        if (this.v_waypointsCache.hasOwnProperty(p_unit.partyID) === false) {
                            // ! due to disconnection or repeated request this array could be filled of an incomplete previous request.
                            // ! this value will be reset each time load wp is called.
                            this.v_waypointsCache[p_unit.partyID] = [];
                        }

                        wayPoint = this.v_waypointsCache[p_unit.partyID];
                    } else { // if this is a full message of the same unit then delete any possible old partial messages -cleaning up-.
                        delete this.v_waypointsCache[p_unit.partyID];
                    }

                    for (var i = 0; i < numberOfRecords; ++ i) {
                        if (p_jmsg[i] != null) {
                            var wayPointStep = {};
                            wayPointStep.waypointType = p_jmsg[i].t;

                            switch (wayPointStep.waypointType) {
                                case CONST_WayPoint_TYPE_WAYPOINTSTEP:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    wayPointStep.Longitude = p_jmsg[i].g;
                                    wayPointStep.Latitude = p_jmsg[i].a;
                                    wayPointStep.Altitude = p_jmsg[i].l;
                                    wayPointStep.Heading = p_jmsg[i].h;
                                    wayPointStep.TimeToStay = p_jmsg[i].y;
                                    break;

                                case CONST_WayPoint_TYPE_SPLINE:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    wayPointStep.Longitude = p_jmsg[i].g;
                                    wayPointStep.Latitude = p_jmsg[i].a;
                                    wayPointStep.Altitude = p_jmsg[i].l;
                                    wayPointStep.TimeToStay = p_jmsg[i].y;
                                    break;

                                case CONST_WayPoint_TYPE_EKLA3:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    wayPointStep.Altitude = p_jmsg[i].l;
                                    wayPointStep.Pitch = p_jmsg[i].p;
                                    break;

                                case CONST_WayPoint_TYPE_HOBOOT:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    break;

                                case CONST_WayPoint_TYPE_RTL:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    break;

                                case CONST_WayPoint_TYPE_CAMERA_TRIGGER:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    break;
                                case CONST_WayPoint_TYPE_CAMERA_CONTROL:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    break;
                                case CONST_WayPoint_Guided_Enabled:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    wayPointStep.Enable = p_jmsg[i].e;
                                    break;

                                case CONST_WayPoint_TYPE_ChangeAlt:
                                    wayPointStep.m_Sequence = p_jmsg[i].s;
                                    wayPointStep.AscentDescentRate = p_jmsg[i].r;
                                    break;

                                case CONST_WayPoint_TYPE_CMissionAction_CONTINUE_AND_CHANGE_ALT: wayPointStep.m_Sequence = p_jmsg[i].s;
                                    /**
										 * 0 = Neutral, command completes when within 5m of this command's altitude, 
										 * 1 = Climbing, command completes when at or above this command's altitude,
										 * 2 = Descending, command completes when at or below this command's altitude.
										 */
                                    wayPointStep.AscentorDescent = p_jmsg[i].c;
                                    wayPointStep.DesiredAltitude = p_jmsg[i].a;
                                    break;

                                case CONST_WayPoint_TYPE_CIRCLE: wayPointStep.m_Sequence = p_jmsg[i].s;
                                    wayPointStep.Longitude = p_jmsg[i].g;
                                    wayPointStep.Latitude = p_jmsg[i].a;
                                    wayPointStep.Altitude = p_jmsg[i].l;
                                    if (p_jmsg[i].hasOwnProperty("q")) {
                                        wayPointStep.m_Header_Required = p_jmsg[i].q;
                                    } else {
                                        wayPointStep.m_Header_Required = false;
                                    }
                                    if (p_jmsg[i].hasOwnProperty("x")) {
                                        wayPointStep.m_Xtrack_Location = p_jmsg[i].x;
                                    } else {
                                        wayPointStep.m_Xtrack_Location = 0;
                                    } wayPointStep.m_Radius = p_jmsg[i].r;
                                    wayPointStep.m_Turns = p_jmsg[i].n;
                                    break;

                            }

                            wayPoint.push(wayPointStep);
                        }
                    }
                    if (v_isChunck === WAYPOINT_NO_CHUNK) { // old format message is not a chunk
                        this.EVT_msgFromUnit_WayPoints(p_unit, wayPoint);
                    } else if (v_isChunck === WAYPOINT_LAST_CHUNK) { // end of chunks
                        this.EVT_msgFromUnit_WayPoints(p_unit, wayPoint);
                        delete this.v_waypointsCache[p_unit.partyID];
                    }
                }
                break;

            case CONST_TYPE_AndruavMessage_NAV_INFO: {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }

                    /*var navInfo = { nav_roll: jmsg.a,
								nav_pitch       : jmsg.b,
								target_bearing  : jmsg.d,
								wp_dist         : jmsg.e,
								alt_error       : jmsg.f	
							}
						*/
                    p_unit.m_Nav_Info._Target.target_bearing = parseFloat(p_jmsg.d);
                    p_unit.m_Nav_Info._Target.wp_dist = parseFloat(p_jmsg.e);
                    p_unit.m_Nav_Info.p_Orientation.roll = parseFloat(p_jmsg.a); // in radiuas
                    p_unit.m_Nav_Info.p_Orientation.pitch = parseFloat(p_jmsg.b); // in radiuas
                    p_unit.m_Nav_Info.p_Orientation.yaw = parseFloat(p_jmsg.y);
                    p_unit.m_Nav_Info._Target.alt_error = parseFloat(p_jmsg.f);

                    this.EVT_msgFromUnit_NavInfo(p_unit);
                }
                break;


        };

    };

    setSocketStatus(status) {
        this.socketStatus = status;

        if (status == CONST_SOCKET_STATUS_CONNECTED) {
            this.API_addMe2(); // (v_andruavClient.groupname,v_andruavClient.unitID);
        }

        if (status == CONST_SOCKET_STATUS_REGISTERED) {


            this.API_sendID(); // send now important
            var Me = this;
            this.timerID = setInterval(function () {
                Me.API_sendID();
                window.AndruavLibs.EventEmitter.fn_dispatch(EE_adsbExpiredUpdate, null);
            }, CONST_sendID_Interverl);

            // request IDfrom all units
            this.API_requestID();

        } else {
            clearInterval(this.timerID);
        }
        this.fn_onSocketStatus(status, c_SOCKET_STATUS[status - 1]);
    };


    prv_parseSystemMessage(Me, msg) {
        if (msg.messageType == CONST_TYPE_AndruavSystem_ConnectedCommServer) {
            if (msg.msgPayload.s.indexOf('OK:connected') != -1) {
                Me.setSocketStatus(CONST_SOCKET_STATUS_CONNECTED);
                Me.setSocketStatus(CONST_SOCKET_STATUS_REGISTERED);

            } else { /*Me.onLog ("connection refused");*/
            }

            return;
        }

        if (msg.messageType === CONST_TYPE_AndruavSystem_LogoutCommServer) {
            if (msg.msgPayload.s.indexOf('OK:del') != -1) {
                Me.setSocketStatus(CONST_SOCKET_STATUS_FREASH);
                Me.EVT_onDeleted();
            } else { /*Me.onLog ("refused to delete, maybe not existed. pls use dell instead of del to enforce addition.");*/
            }
            return;
        }
    };


    /**
     * Parse Mavlink messages received as binary messages from GCS via AndruavWebPlugin
     * @param {*} p_unit 
     * @param {*} p_mavlinkPacket 
     * @returns 
     */
    prv_parseGCSMavlinkMessage(p_unit, p_mavlinkPacket) 
    {
        let p_mavlinkGCSProcessor = new MAVLink20Processor(null, 0, 0);
        const p_mavlinkMessages = p_mavlinkGCSProcessor.parseBuffer(new Uint8Array(p_mavlinkPacket));
        const len = p_mavlinkMessages.length;
        for (var i = 0; i < len; ++ i) {
            const c_mavlinkMessage = p_mavlinkMessages[i];
            if (c_mavlinkMessage.id == -1)
            {
                // bad mavlink ... make sure you are using MAVLINK V2
                // dont notify as some times GCS tries both protocols.
                //this.EVT_BadMavlink();
                return ;
            }
            fn_console_log ("PARAM_GCS:" + c_mavlinkMessage.name);
                       
            switch (c_mavlinkMessage.header.msgId) {
                case mavlink20.MAVLINK_MSG_ID_HEARTBEAT:
                    return true;
                break;
                case mavlink20.MAVLINK_MSG_ID_PARAM_REQUEST_READ:
                    // BUG HERE WHEN COMMENTED IT WORKS
                    var  c_mst = null;
                    if (c_mavlinkMessage.param_id[0]=='\x00')
                    {
                        c_mst = p_unit.m_FCBParameters.m_list_by_index[c_mavlinkMessage.param_index];
                    }
                    else
                    {
                        c_mst = p_unit.m_FCBParameters.m_list[c_mavlinkMessage.param_id];
                    }
                     
                    
                    // if (c_mst == null) return false; 
                    // c_mst.header.seq = c_mavlinkMessage.header.seq + 1;
                    // fn_console_log ("PARAM_GCS:" + c_mst.param_id);
                    // c_mst.srcSystem=p_unit.m_FCBParameters.m_systemID;
                    // //c_mst.srcComponent=0; //p_unit.m_FCBParameters.m_componentID;
                    // return true;
                break;

                case mavlink20.MAVLINK_MSG_ID_FILE_TRANSFER_PROTOCOL:
                {
                    // fn_console_log ("PARAMGCS: FTP " + c_mavlinkMessage.payload);
                    // const c_keys = Object.keys(p_unit.m_FCBParameters.m_list);
                    // const c_len = c_keys.length;
                    // const c_list = p_unit.m_FCBParameters.m_list;
                    // var Me = this;
                    // if (this.m_mavlinkFTPProtocol.parseMavlinkGCS(c_mavlinkMessage,
                    //     function (p_payload) 
                    //     {
                    //         var ftp = new mavlink20.messages.file_transfer_protocol(0, -1, -66);
                    //         ftp.payload = p_payload;
                    //         ftp.srcSystem=1;
                    //         ftp.srcComponent=1;
                    //     }) === true) 
                    // {
                    //     return false;
                    // }
                    
                    return false;
                    
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_REQUEST_DATA_STREAM:
                    return true;
                
            }
        }
        fn_console_log ("PARAM----API_sendBinCMD" + p_mavlinkMessages[0]);
            
        return false;
    }

    /**
	* Parse mavlink messages and try to extract information similar to Andruav Protocol to save traffic.
	* @param p_unit: never equal null.
	* @param p_mavlinkPacket: should be a mavlink message.
	*/
    prv_parseUnitMavlinkMessage(p_unit, p_mavlinkPacket) {
        const p_mavlinkProcessor = new MAVLink20Processor(null, 0, 0);
        const p_mavlinkMessages = p_mavlinkProcessor.parseBuffer(new Int8Array(p_mavlinkPacket));
        const len = p_mavlinkMessages.length;
        for (var i = 0; i < len; ++ i) {
            let c_mavlinkMessage = p_mavlinkMessages[i];
            if (c_mavlinkMessage.id == -1)
            {
                // bad mavlink ... make sure you are using MAVLINK V2
                //this.EVT_BadMavlink();
                console.log("BAD MAVLINK");
                continue;
            }
            p_unit.m_Messages.fn_addMavlinkMsg(c_mavlinkMessage);
            switch (c_mavlinkMessage.header.msgId) {
                case mavlink20.MAVLINK_MSG_ID_HEARTBEAT:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_FCBParameters.m_componentID = c_mavlinkMessage.header.srcComponent;
                }
                break;
                
                case mavlink20.MAVLINK_MSG_ID_ATTITUDE:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_Nav_Info.p_Orientation.roll = c_mavlinkMessage.roll; // in radiuas
                    p_unit.m_Nav_Info.p_Orientation.pitch = c_mavlinkMessage.pitch; // in radiuas
                    p_unit.m_Nav_Info.p_Orientation.yaw = c_mavlinkMessage.yaw;
                    p_unit.m_Nav_Info.p_Orientation.roll_speed = c_mavlinkMessage.rollspeed; // in radiuas
                    p_unit.m_Nav_Info.p_Orientation.pitch_speed = c_mavlinkMessage.pitchspeed; // in radiuas
                    p_unit.m_Nav_Info.p_Orientation.yaw_speed = c_mavlinkMessage.yawspeed;
                    this.EVT_msgFromUnit_NavInfo(p_unit);
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_Nav_Info.p_Desired.nav_roll = c_mavlinkMessage.nav_roll;
                    p_unit.m_Nav_Info.p_Desired.nav_pitch = c_mavlinkMessage.nav_pitch;
                    p_unit.m_Nav_Info.p_Desired.nav_bearing = c_mavlinkMessage.nav_bearing;
                    p_unit.m_Nav_Info._Target.target_bearing = c_mavlinkMessage.target_bearing;
                    p_unit.m_Nav_Info._Target.wp_dist = c_mavlinkMessage.wp_dist;
                    p_unit.m_Nav_Info._Target.alt_error = c_mavlinkMessage.alt_error;
                    this.EVT_msgFromUnit_NavInfo(p_unit);
                }
                    break;

                case mavlink20.MAVLINK_MSG_ID_BATTERY_STATUS:
                {
                    p_unit.m_Power._FCB.p_Battery.p_hasPowerInfo = true;
                    let v_voltage = 0;
                    for (let i = 0; i < 10; ++ i) {
                        const cel_voltage = c_mavlinkMessage.voltages[i];
                        if ((cel_voltage < 0) || (cel_voltage == 65535))
                            break;
                        
                        v_voltage += cel_voltage;
                    }
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryVoltage = v_voltage;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryCurrent = c_mavlinkMessage.current_battery * 10;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryRemaining = c_mavlinkMessage.battery_remaining;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryTemprature = c_mavlinkMessage.temperature;
                    p_unit.m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed = c_mavlinkMessage.current_consumed;
                }
                break;
                case mavlink20.MAVLINK_MSG_ID_BATTERY2:
                {
                    p_unit.m_Power._FCB.p_Battery2.p_hasPowerInfo = true;
                    p_unit.m_Power._FCB.p_Battery2.FCB_BatteryVoltage = c_mavlinkMessage.voltage;
                    p_unit.m_Power._FCB.p_Battery2.FCB_BatteryCurrent = c_mavlinkMessage.current_battery * 10;
                }
                break;
                case mavlink20.MAVLINK_MSG_ID_GPS_RAW_INT:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_GPS_Info1.GPS3DFix = c_mavlinkMessage.fix_type;
                    p_unit.m_GPS_Info1.m_satCount = c_mavlinkMessage.satellites_visible;
                    p_unit.m_GPS_Info1.accuracy = c_mavlinkMessage.h_acc;
                    p_unit.m_GPS_Info1.lat = c_mavlinkMessage.lat * 0.0000001;
                    p_unit.m_GPS_Info1.lng = c_mavlinkMessage.lon * 0.0000001;
                    p_unit.m_Nav_Info.p_Location.ground_speed = c_mavlinkMessage.vel / 100.0; // we should depend on VFR
                    p_unit.m_Nav_Info.p_Location.bearing = c_mavlinkMessage.yaw;
                    p_unit.m_GPS_Info1.m_isValid = true;
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_MISSION_COUNT:
                {
                    p_unit.m_Nav_Info._Target.wp_count= c_mavlinkMessage.count;
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_MISSION_CURRENT:
                {
                    if ((c_mavlinkMessage.mission_type==null) || (c_mavlinkMessage.mission_type==mavlink20.MAV_MISSION_TYPE_MISSION))
                    {
                        p_unit.m_Nav_Info._Target.wp_num = c_mavlinkMessage.seq;
                    }
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_TERRAIN_REPORT:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_Terrain_Info.add (new C_TerrainEntry(c_mavlinkMessage.lat * 0.0000001, c_mavlinkMessage.lon * 0.0000001,
                             c_mavlinkMessage.spacing, c_mavlinkMessage.terrain_height, 
                             c_mavlinkMessage.current_height));
                }
                break; 
                case mavlink20.MAVLINK_MSG_ID_GPS2_RAW:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_GPS_Info2.GPS3DFix = c_mavlinkMessage.fix_type;
                    p_unit.m_GPS_Info2.m_satCount = c_mavlinkMessage.satellites_visible;
                    p_unit.m_GPS_Info2.accuracy = c_mavlinkMessage.h_acc;
                    p_unit.m_GPS_Info2.lat = c_mavlinkMessage.lat * 0.0000001;
                    p_unit.m_GPS_Info2.lng = c_mavlinkMessage.lon * 0.0000001;
                    p_unit.m_Nav_Info.p_Location.ground_speed = c_mavlinkMessage.vel / 100.0; // we should depend on VFR
                    p_unit.m_Nav_Info.p_Location.bearing = c_mavlinkMessage.yaw;
                    p_unit.m_GPS_Info2.m_isValid = true;
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_WIND:
                {
                    p_unit.m_WindSpeed = c_mavlinkMessage.speed;
                    p_unit.m_WindSpeed_z = c_mavlinkMessage.speed_z;
                    p_unit.m_WindDirection = c_mavlinkMessage.direction;
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_DISTANCE_SENSOR:
                {
                    var distance_Sensor = p_unit.m_DistanceSensors[c_mavlinkMessage.orientation];
                    distance_Sensor.m_min_distance = c_mavlinkMessage.min_distance * 0.01; // convert to m
                    distance_Sensor.m_max_distance = c_mavlinkMessage.max_distance * 0.01; // convert to m
                    distance_Sensor.m_current_distance = c_mavlinkMessage.current_distance * 0.01; // convert to m
                    distance_Sensor.m_last_access = new Date();
                    distance_Sensor.m_isValid = true;
                }
                break;
    
                case mavlink20.MAVLINK_MSG_ID_VFR_HUD:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_Nav_Info.p_Location.ground_speed = c_mavlinkMessage.groundspeed ;
                    p_unit.m_Nav_Info.p_Location.air_speed = c_mavlinkMessage.airspeed ;
                    p_unit.m_Throttle = c_mavlinkMessage.throttle; //Current throttle setting (0 to 100).
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_GLOBAL_POSITION_INT:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_Nav_Info.p_Location.lat = (c_mavlinkMessage.lat * 0.0000001)  ;
                    p_unit.m_Nav_Info.p_Location.lng = (c_mavlinkMessage.lon * 0.0000001);
                    p_unit.m_Nav_Info.p_Location.alt_abs = c_mavlinkMessage.alt * 0.001;
                    p_unit.m_Nav_Info.p_Location.alt = c_mavlinkMessage.relative_alt * 0.001;
                    this.EVT_msgFromUnit_GPS(p_unit);
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_EKF_STATUS_REPORT:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_EKF.m_isValid = true;
                    p_unit.m_EKF.m_flags = c_mavlinkMessage.flags;
                    p_unit.m_EKF.m_velocity_variance = c_mavlinkMessage.velocity_variance;
                    p_unit.m_EKF.m_pos_horiz_variance = c_mavlinkMessage.pos_horiz_variance;
                    p_unit.m_EKF.m_pos_vert_variance = c_mavlinkMessage.pos_vert_variance;
                    p_unit.m_EKF.m_compass_variance = c_mavlinkMessage.compass_variance;
                    p_unit.m_EKF.m_terrain_alt_variance = c_mavlinkMessage.terrain_alt_variance;
                    p_unit.m_EKF.m_airspeed_variance = c_mavlinkMessage.airspeed_variance;
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_VIBRATION:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_Vibration.m_vibration_x = c_mavlinkMessage.vibration_x;
                    p_unit.m_Vibration.m_vibration_y = c_mavlinkMessage.vibration_y;
                    p_unit.m_Vibration.m_vibration_z = c_mavlinkMessage.vibration_z;
                    p_unit.m_Vibration.m_clipping_0 = c_mavlinkMessage.clipping_0;
                    p_unit.m_Vibration.m_clipping_1 = c_mavlinkMessage.clipping_1;
                    p_unit.m_Vibration.m_clipping_2 = c_mavlinkMessage.clipping_2;
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_ADSB_VEHICLE:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    
                    var adsb_object = window.AndruavLibs.ADSBObjectList.fn_getADSBObject(c_mavlinkMessage.ICAO_address);
                    if (adsb_object==null)
                    {
                        adsb_object = new CADSBObject(c_mavlinkMessage.ICAO_address);
                        window.AndruavLibs.ADSBObjectList.Add(c_mavlinkMessage.ICAO_address,adsb_object);
                    }
                    
                    adsb_object.m_lat           = c_mavlinkMessage.lat * 0.0000001;
                    adsb_object.m_lon           = c_mavlinkMessage.lon * 0.0000001;
                    adsb_object.m_altitude_type = c_mavlinkMessage.altitude_type;
                    adsb_object.m_altitude      = c_mavlinkMessage.altitude;
                    adsb_object.m_heading       = c_mavlinkMessage.heading * 0.01   * CONST_DEGREE_TO_RADIUS;
                    adsb_object.m_hor_velocity  = c_mavlinkMessage.hor_velocity;
                    adsb_object.m_ver_velocity  = c_mavlinkMessage.ver_velocity;
                    adsb_object.m_emitter_type  = c_mavlinkMessage.emitter_type;
                    adsb_object.m_squawk        = c_mavlinkMessage.squawk;
                    
                    adsb_object.m_last_access   = new Date();

                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_adsbExchangeReady, adsb_object);
                }
                break;

                case mavlink20.MAVLINK_MSG_ID_PARAM_VALUE:
                {
                    const p_old_param = p_unit.m_FCBParameters.m_list[c_mavlinkMessage.param_id];
                    
                    if (p_old_param != null)
                    {
                        // if I am here then this is a reread mode or rerequest all parameters
                        //    
                        // param index is corrupted when re-reading param after param_set.
                        c_mavlinkMessage.param_index = p_old_param.param_index;
                    }
                    
                    p_unit.m_FCBParameters.m_list[c_mavlinkMessage.param_id] = c_mavlinkMessage;
                    p_unit.m_FCBParameters.m_list_by_index[c_mavlinkMessage.param_index] = c_mavlinkMessage;
                    p_unit.m_FCBParameters.m_list_by_index_shadow[c_mavlinkMessage.param_index] = c_mavlinkMessage;

                    if (p_old_param != null)
                    {
                        var now = Date.now();
                        if (now - this.m_lastparamatersUpdateTime > CONST_PARAMETER_REPEATED)
                        {
                            this.m_lastparamatersUpdateTime = now;
                            window.AndruavLibs.EventEmitter.fn_dispatch(EE_updateParameters, p_unit);
                        }
                        
                    }
                }
                    break;

                case mavlink20.MAVLINK_MSG_ID_FILE_TRANSFER_PROTOCOL:
                    fn_console_log ("PARAM: FTP " + c_mavlinkMessage.payload);
                    break;

                case mavlink20.MAVLINK_MSG_ID_HIGH_LATENCY:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_FCBParameters.m_componentID = c_mavlinkMessage.header.srcComponent;
                    p_unit.m_Nav_Info.p_Location.lat = (c_mavlinkMessage.latitude * 0.0000001)  ;
                    p_unit.m_Nav_Info.p_Location.lng = (c_mavlinkMessage.longitude * 0.0000001);
                    p_unit.m_Nav_Info.p_Location.alt_abs = c_mavlinkMessage.altitude_amsl;
                    p_unit.m_Nav_Info.p_Location.alt_sp = c_mavlinkMessage.altitude_sp;
                    p_unit.m_Nav_Info.p_Location.ground_speed = c_mavlinkMessage.groundspeed;
                    p_unit.m_Nav_Info.p_Location.air_speed = c_mavlinkMessage.airspeed;
                    p_unit.m_Nav_Info.p_Orientation.roll = c_mavlinkMessage.roll * 0.01 * CONST_DEGREE_TO_RADIUS;
                    p_unit.m_Nav_Info.p_Orientation.pitch = c_mavlinkMessage.pitch  * 0.01  * CONST_DEGREE_TO_RADIUS;
                    p_unit.m_Nav_Info.p_Orientation.yaw = c_mavlinkMessage.heading  * 0.01   * CONST_DEGREE_TO_RADIUS;
                    p_unit.m_Nav_Info.p_Desired.nav_bearing = c_mavlinkMessage.heading * 0.01 ; // deg
                    p_unit.m_Nav_Info._Target.target_bearing = c_mavlinkMessage.heading_sp * 0.01 ; //deg
                    p_unit.m_Nav_Info._Target.wp_dist = c_mavlinkMessage.wp_distance;
                    p_unit.m_Nav_Info._Target.wp_num = c_mavlinkMessage.wp_num;
                    p_unit.m_GPS_Info1.GPS3DFix = c_mavlinkMessage.gps_fix_type;
                    p_unit.m_GPS_Info1.m_satCount = c_mavlinkMessage.gps_nsat;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryRemaining = c_mavlinkMessage.battery_remaining;
                    
                    p_unit.m_GPS_Info1.m_isValid = true;
                    this.EVT_msgFromUnit_NavInfo(p_unit);
                    this.EVT_msgFromUnit_GPS(p_unit);
                }
                    break;

                case mavlink20.MAVLINK_MSG_ID_HIGH_LATENCY2:
                {
                    p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                    p_unit.m_FCBParameters.m_componentID = c_mavlinkMessage.header.srcComponent;
                    p_unit.m_Nav_Info.p_Location.lat = (c_mavlinkMessage.latitude * 0.0000001)  ;
                    p_unit.m_Nav_Info.p_Location.lng = (c_mavlinkMessage.longitude * 0.0000001);
                    p_unit.m_Nav_Info.p_Location.alt_abs = (c_mavlinkMessage.altitude );
                    p_unit.m_Nav_Info.p_Orientation.yaw = c_mavlinkMessage.heading * 0.02   * CONST_DEGREE_TO_RADIUS;
                    p_unit.m_Nav_Info.p_Desired.nav_bearing = c_mavlinkMessage.heading * 0.02   * CONST_DEGREE_TO_RADIUS;
                    p_unit.m_Nav_Info._Target.target_bearing = c_mavlinkMessage.target_heading * 0.02   * CONST_DEGREE_TO_RADIUS;
                    p_unit.m_Nav_Info._Target.wp_dist = c_mavlinkMessage.target_distance;
                    p_unit.m_Nav_Info._Target.wp_num = c_mavlinkMessage.wp_num;
                    p_unit.m_Power._FCB.p_Battery.FCB_BatteryRemaining = c_mavlinkMessage.battery;
                    
                    p_unit.m_GPS_Info1.m_isValid = true;
                    this.EVT_msgFromUnit_NavInfo(p_unit);
                    this.EVT_msgFromUnit_GPS(p_unit);
                }
                    break;
                
                
            }
        }
    };

    /**
     * Parse message after extract it from the binary part
     * @param {*} v_unit 
     * @param {*} andruavCMD 
     * @param {*} data 
     * @param {*} v_internalCommandIndexByteBased 
     * @param {*} byteLength 
     */
    prv_parseBinaryAndruavMessage(v_unit, andruavCMD, data, v_internalCommandIndexByteBased, byteLength) {


        switch (andruavCMD.mt) {

            case CONST_TYPE_AndruavBinaryMessage_Mavlink: {

                    var v_andruavMessage = {
                        'src': CONST_TelemetryProtocol_Source_REMOTE,
                        'data': data.buffer.slice(v_internalCommandIndexByteBased)
                    };

                    this.prv_parseUnitMavlinkMessage(v_unit, v_andruavMessage.data);
                }
                break;

            case CONST_TYPE_AndruavBinaryMessage_ServoOutput: 
                var v_servoOutputs = {};
                /*
							 String message could be of any length and no padding applied.
							 when reading getUint32 the system assumes that data is paded in 4 bytes 
							 so it is better to slice data again.
							 NOTE THAT when reading getUnit16 the index will be different.
				*/
                var v_binaryData = data.buffer.slice(v_internalCommandIndexByteBased, data.buffer.byteLength);
                var v_values = new Int32Array(v_binaryData);
                v_servoOutputs.m_servo1 = v_values[0];
                v_servoOutputs.m_servo2 = v_values[1];
                v_servoOutputs.m_servo3 = v_values[2];
                v_servoOutputs.m_servo4 = v_values[3];
                v_servoOutputs.m_servo5 = v_values[4];
                v_servoOutputs.m_servo6 = v_values[5];
                v_servoOutputs.m_servo7 = v_values[6];
                v_servoOutputs.m_servo8 = v_values[7];
                v_unit.m_Servo.m_values = v_servoOutputs;
                window.AndruavLibs.EventEmitter.fn_dispatch(EE_servoOutputUpdate, v_unit);
                break;

            case CONST_TYPE_AndruavMessage_IMG: {
                    var out = prv_extractString(data, v_internalCommandIndexByteBased, byteLength);
                    var v_andruavMessage;
                    if (andruavCMD.hasOwnProperty('ms')===false)
                    {   // backward compatibility with ANDRUAV   
                        try {
                            v_andruavMessage = JSON.parse(out.text);
                        } catch (err) {
                            fn_console_log(err);
                            v_andruavMessage = new Object();
                        }
                    }
                    else
                    {
                        v_andruavMessage = andruavCMD.ms;
                        v_andruavMessage.lat = v_andruavMessage.lat * 0.0000001;
                        v_andruavMessage.lng = v_andruavMessage.lng * 0.0000001;
                    }

                    v_andruavMessage.img = data.subarray(out.nextIndex, byteLength);
                    const des=v_andruavMessage.des!=null?v_andruavMessage.des:"no description";
                    const prv=v_andruavMessage.des!=null?v_andruavMessage.prv:"not defined";
                    const spd=v_andruavMessage.spd!=null?v_andruavMessage.spd:0;
                    const ber=v_andruavMessage.des!=null?v_andruavMessage.ber:0;
                    const acc=v_andruavMessage.des!=null?v_andruavMessage.acc:-1;
                    this.EVT_msgFromUnit_IMG(v_unit, v_andruavMessage.img, des, v_andruavMessage.lat, v_andruavMessage.lng, prv, v_andruavMessage.tim, v_andruavMessage.alt, spd, ber, acc);

                }
                break;
        }
    };


    prv_extractBinaryPacket(evt) {
        var andruavCMD;
        var p_jmsg;
        var v_unit;
        var byteLength;

        const Me = this;
        var reader = new FileReader();
        reader.onload = function (event) {
            var contents = event.target.result;
            var data= new Uint8Array(contents);
            byteLength = contents.byteLength;
            var out = prv_extractString(data, 0, byteLength);
            // extract command:
            andruavCMD = JSON.parse(out.text);
            p_jmsg = Me.fn_parseJSONMessage(out.text);
            v_unit = Me.m_andruavUnitList.fn_getUnit(fn_getFullName(p_jmsg.groupID, p_jmsg.senderName));
            if (v_unit == null) {
                v_unit = new CAndruavUnitObject();
                // p_unit.m_defined = false; define it as incomplete
                v_unit.m_IsMe = false;
                v_unit.m_defined = false;
                v_unit.partyID = p_jmsg.senderName;
                v_unit.m_index = Me.m_andruavUnitList.count;
                Me.m_andruavUnitList.Add(v_unit.partyID, v_unit);
                        
                if (v_unit.m_Messages.fn_sendMessageAllowed(CONST_TYPE_AndruavMessage_ID) === true)
                {
                    // it is already identifying itself.
                    Me.API_requestID(p_jmsg.senderName);
                    v_unit.m_Messages.fn_doNotRepeatMessageBefore(CONST_TYPE_AndruavMessage_ID,1000,new Date())
                }
                else
                {
                    console.log ("skip");
                }
    
                // Cleanup the reader object
                data = null;
                reader.abort();
                reader = null;
				return;
            }
        
            v_unit.m_Messages.fn_addMsg(p_jmsg.messageType);
            v_unit.m_NetworkStatus.m_received_msg++;
            v_unit.m_NetworkStatus.m_received_bytes +=data.length;
            v_unit.m_NetworkStatus.m_lastActiveTime = Date.now();
            Me.prv_parseBinaryAndruavMessage(v_unit, andruavCMD, data, out.nextIndex, byteLength);
            
            data = null;
            reader.abort();
            reader = null;
					
        };

        reader.onerror = function (event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };

        reader.readAsArrayBuffer(evt.data);
    }; // EOF - prv_extractBinary


    fn_disconnect(p_accesscode) {

        this.ws.close();
        this.ws = null;

    };

    fn_connect(p_accesscode) {

        if (p_accesscode == null) {
            alert("Bad Login");
            this.EVT_onError('accesscode cannot be null');
            return;
        }

        this.server_accessCode = p_accesscode;

        var url = null;
        if (location.protocol == 'https:') {
            // f: CONST_CS_LOGIN_TEMP_KEY
            // g: CONST_CS_SERVER_PUBLIC_HOST
            // s: SID
            url = 'wss://' + this.m_server_ip + ':' + this.m_server_port_ss + '?f=' + this.server_AuthKey + '&s=' + this.partyID;

        } else {
            url = 'ws://' + this.m_server_ip + ':' + this.m_server_port + '?f=' + this.server_AuthKey + '&s=' + this.partyID;

        } url = url;

        if ("WebSocket" in window) {

            this.ws = new WebSocket(url);
            this.ws.parent = this;
            this.ws.sendex = function (msg, isbinary) {
                if (isbinary == null) {
                    isbinary = false;
                }
                Me.EVT_onSend(msg);
                Me.ws.send(msg, {binary: isbinary});
            };
            // OnOpen callback of Websocket
            var Me = this;
            this.ws.onopen = function () {
                Me.EVT_onOpen();

            };

            // OnMessage callback of websocket
            this.ws.onmessage = function (evt) {
                if (typeof evt.data == "string") { // This is a text message
                    var p_jmsg = Me.fn_parseJSONMessage(evt.data);
                    switch (p_jmsg._ty) {
                        case CMDTYPE_SYS: Me.prv_parseSystemMessage(Me, p_jmsg);
                            break;

                        case CMD_COMM_GROUP:
                        case CMD_COMM_INDIVIDUAL: 
                            Me.prv_parseCommunicationMessage(Me, p_jmsg ,evt);
                            break;
                    }
                    Me.EVT_onMessage(evt);
                    fn_console_log('msg:' + JSON.stringify(p_jmsg)); // evt.data));
                } else {

                    Me.prv_extractBinaryPacket(evt);
                } // else-if
            };

            // OnClose callback of websocket
            this.ws.onclose = function () {
                Me.setSocketStatus(CONST_SOCKET_STATUS_DISCONNECTED);
                Me.EVT_onClose();
            };

            this.ws.onerror = function (err) {
                Me.setSocketStatus(CONST_SOCKET_STATUS_ERROR);
                Me.EVT_onError(err);
            };
        } else { // The browser doesn't support WebSocket
            alert("WebSocket NOT supported by your Browser!");
        }
    };

};


/*jshint esversion: 6 */
window.AndruavLibs = window.AndruavLibs || {
    REVISION: 'BETA'
};

(function (lib) {
    "use strict";
    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        window.AndruavLibs.AndruavClient = lib; // in ordinary browser attach library to window
    } else {
        module.exports = lib; // in nodejs
    }
})(new CAndruavClient());
