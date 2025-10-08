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
import { js_globals } from '../js_globals.js';
import { EVENTS as js_event } from '../js_eventList.js'
import * as js_helpers from '../js_helpers.js';
import * as js_andruavUnit from '../js_andruavUnit.js';
import * as js_andruavMessages from '../js_andruavMessages.js';

import * as js_common from '../js_common.js'
import { js_eventEmitter } from '../js_eventEmitter.js'
import * as js_andruav_facade from './js_andruav_facade.js'


import { mavlink20, MAVLink20Processor } from '../js_mavlink_v2.js'
const WAYPOINT_NO_CHUNK = 0;
const WAYPOINT_CHUNK = 1;
const WAYPOINT_LAST_CHUNK = 999;


// Tasks Scope
const CONST_TASK_SCOPE_GLOBAL = 0;
const CONST_TASK_SCOPE_GLOBAL_ACCOUNT = 1;
const CONST_TASK_SCOPE_LOCALGROUP = 2;
const CONST_TASK_SCOPE_PARTYID = 3;




class CAndruavClientParser {
    constructor() {
        js_globals.v_waypointsCache = {};
        this.v_callbackListeners = {};
        this.fn_init();
        //this.m_mavlinkFTPProtocol = new C_MavlinkFTPProtocol();

        this.EVT_andruavSignalling = {}

        Object.seal(this);
    }

    static getInstance() {
        if (!CAndruavClientParser.instance) {
            CAndruavClientParser.instance = new CAndruavClientParser();
        }
        return CAndruavClientParser.instance;
    }



    _fn_checkStatus() {
        const now = Date.now();
        const units = js_globals.m_andruavUnitList.fn_getUnitValues();
        if (!units) return;

        for (const unit of units) {
            if (unit.m_IsDisconnectedFromGCS) continue;
            const timeSinceLastActive = now - unit.m_Messages.m_lastActiveTime;

            if (!unit.m_IsShutdown) {
                if (!unit.m_Geo_Tags.p_HomePoint.m_isValid) {
                    js_andruav_facade.AndruavClientFacade.API_do_GetHomeLocation(unit);
                }
                if (timeSinceLastActive > js_andruavMessages.CONST_checkStatus_Interverl0) {
                    js_andruav_facade.AndruavClientFacade.API_requestID(unit.getPartyID());
                }
            }

            if (timeSinceLastActive > js_andruavMessages.CONST_checkStatus_Interverl1 && !unit.m_IsDisconnectedFromGCS) {
                unit.m_IsDisconnectedFromGCS = true;
                js_eventEmitter.fn_dispatch(js_event.EE_unitOnlineChanged, unit);
            }
        }
    }




    fn_init() {

        this.m_lastparamatersUpdateTime = 0;

        this.m_andruavGeoFences = {}; // list of fences each fence ha s list of attached units.
        this.videoFrameCount = 0;
        this.mavlinkProcessor = new MAVLink20Processor(null, 0, 0);






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
        this.EVT_andruavUnitGeoFenceDeleted = function () { };


        js_globals.m_andruavUnitList = js_andruavUnit.AndruavUnitList;
        js_globals.m_andruavUnitList.fn_resetList();
        //this.m_adsbObjectList = new CADSBObjectList(); REACT2
        const Me = this;
        if (this.fn_timerID_checkStatus === null || this.fn_timerID_checkStatus === undefined) {

            this.fn_timerID_checkStatus = setInterval(function () {
                Me._fn_checkStatus()
            }, js_andruavMessages.CONST_checkStatus_Interverl0);
        }

    };




    /*
        This function is used by some messages to call back modules when the message 
        is received. For now only one function can wait per mission and newer request overwrite older.
    */
    fn_callbackOnMessageID = function (p_callback, p_messageID) {
        this.v_callbackListeners[p_messageID] = p_callback;
    }

    fn_callbackOnMessageID_Answer(p_messageID, v_session) {
        if (this.v_callbackListeners.hasOwnProperty(p_messageID) === true) {
            this.v_callbackListeners[p_messageID](v_session);
            delete this.v_callbackListeners[p_messageID];
        }
    }

    #prv_parseFenceInfo(p_andruavUnit, p_jmsg) {
        let fencetype;
        let m_shouldKeepOutside = false;
        // var jmsg 				= msg.msgPayload;

        let v_geoFenceName = p_jmsg.n;
        let v_maximumDistance = (p_jmsg.hasOwnProperty('r')) ? p_jmsg.r : 0; // optional
        if (p_jmsg.hasOwnProperty('o')) { // 1 if restricted area
            if (typeof p_jmsg.o === 'number') {
                // p_jmsg.o is an integer [backward compatibility]
                m_shouldKeepOutside = (p_jmsg.o === 1);
            } else if (typeof p_jmsg.o === 'boolean') {
                // p_jmsg.o is a boolean
                m_shouldKeepOutside = p_jmsg.o;
            }
        }
        if (p_jmsg.hasOwnProperty('t')) { // 1 if restricted area
            switch (p_jmsg.t) {
                case 1: fencetype = js_andruavMessages.CONST_TYPE_LinearFence;
                    break;

                case 2: fencetype = js_andruavMessages.CONST_TYPE_PolygonFence;
                    break;

                case 3: fencetype = js_andruavMessages.CONST_TYPE_CylinderFence;
                    break;
            }
        }
        let geoFenceInfo = {};
        let LngLatPoints = [];

        let count = (fencetype === js_andruavMessages.CONST_TYPE_CylinderFence) ? 1 : p_jmsg.c;

        for (let i = 0; i < count; ++i) {
            let lnglat = {};
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

        geoFenceInfo.isEditable = (p_andruavUnit === null || p_andruavUnit === undefined);
        js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitGeoFenceUpdated, { unit: p_andruavUnit, fence: geoFenceInfo });
    };




    #prv_onNewUnitAdded(target) {
        js_andruav_facade.AndruavClientFacade.API_requestGeoFencesAttachStatus(target);
        js_andruav_facade.AndruavClientFacade.API_requestUdpProxyStatus(target);
        js_andruav_facade.AndruavClientFacade.API_requestWayPoints(target);
        //js_andruav_facade.AndruavClientFacade.API_requestIMU (target,true);  // NOT USED
    };


    parseCommunicationMessage(Me, msg, evt) {

        let p_jmsg;
        let p_unit = js_globals.m_andruavUnitList.fn_getUnit(msg.senderName);

        if (!p_unit) {
            p_unit = new js_andruavUnit.CAndruavUnitObject();
            p_unit.m_IsMe = false;
            p_unit.m_defined = false;
            p_unit.setPartyID(msg.senderName);
            p_unit.m_index = js_globals.m_andruavUnitList.count;
            js_globals.m_andruavUnitList.Add(p_unit.getPartyID(), p_unit);
            if (msg.messageType !== js_andruavMessages.CONST_TYPE_AndruavMessage_ID) {
                if (p_unit.m_Messages.fn_sendMessageAllowed(js_andruavMessages.CONST_TYPE_AndruavMessage_ID)) {
                    js_andruav_facade.AndruavClientFacade.API_requestID(msg.senderName);
                    p_unit.m_Messages.fn_doNotRepeatMessageBefore(js_andruavMessages.CONST_TYPE_AndruavMessage_ID, 1000, new Date());
                } else {
                    js_common.fn_console_log("skip");
                }
            }
        }

        p_unit.m_Messages.fn_addMsg(msg.messageType);
        p_unit.m_Messages.m_received_msg++;
        p_unit.m_Messages.m_received_bytes += evt.data.length;
        p_unit.m_Messages.m_lastActiveTime = Date.now();

        switch (msg.messageType) {

            case js_andruavMessages.CONST_TYPE_AndruavMessage_CONFIG_STATUS: {
               console.log("CONST_TYPE_AndruavMessage_Target_STATUS");
               p_jmsg = msg.msgPayload;
               
               if (p_jmsg.R === true) { // this is a reply to request.
                        // if (this.v_callbackListeners.hasOwnProperty(js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList) === true) {
                        //     this.v_callbackListeners[js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList](v_session);
                        //     delete this.v_callbackListeners[js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList];
                        // }

                        const c_module  = p_unit.m_modules.getModuleByKey(p_jmsg.k)
                        if (!c_module) 
                        {
                            // PUBLISH ERROR
                            return ;
                        }
                        c_module.template = p_jmsg.b;
             
                        this.fn_callbackOnMessageID_Answer(msg.messageType, {p_unit:p_unit , p_module:c_module});
                }
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_Target_STATUS: {
                console.log("CONST_TYPE_AndruavMessage_Target_STATUS");
                p_jmsg = msg.msgPayload;
                p_unit.m_tracker.fn_updateTrackerStatus(p_jmsg.a);
                js_eventEmitter.fn_dispatch(js_event.EE_onTrackingStatusChanged, p_unit);
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_STATUS: {
                console.log("CONST_TYPE_AndruavMessage_AI_Recognition_STATUS");
                p_jmsg = msg.msgPayload;
                switch (p_jmsg.a) {
                    case js_andruavMessages.CONST_TrackingTarget_STATUS_AI_Recognition_CLASS_LIST:
                        p_unit.m_tracker_ai.fn_addObjectClass(p_jmsg.c);
                        js_eventEmitter.fn_dispatch(js_event.EE_onTrackingAIObjectListUpdate, p_unit);
                        break;

                    default:
                        p_unit.m_tracker_ai.fn_updateTrackerStatus(p_jmsg.a);
                        js_eventEmitter.fn_dispatch(js_event.EE_onTrackingAIStatusChanged, p_unit);
                        break;
                }
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_UdpProxy_Info: {
                p_jmsg = msg.msgPayload;
                p_unit.m_Telemetry.m_udpProxy_ip = p_jmsg.a;
                p_unit.m_Telemetry.m_udpProxy_port = p_jmsg.p;
                p_unit.m_Telemetry.m_telemetry_level = p_jmsg.o;
                p_unit.m_Telemetry.m_udpProxy_active = p_jmsg.en;
                if (p_jmsg.hasOwnProperty('z')) {
                    p_unit.m_Telemetry.m_udpProxy_paused = p_jmsg.z;
                }
                else {
                    p_unit.m_Telemetry.m_udpProxy_paused = false;
                }

                js_eventEmitter.fn_dispatch(js_event.EE_onProxyInfoUpdated, p_unit);

            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_GPS:
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

                if (p_jmsg.la === null || p_jmsg.la === undefined) {
                    p_unit.m_GPS_Info1.m_isValid = false;
                } else {
                    p_unit.m_GPS_Info1.m_isValid = true;
                }
                p_unit.m_Nav_Info.p_Location.lat = p_jmsg.la;
                p_unit.m_Nav_Info.p_Location.lng = p_jmsg.ln
                p_unit.m_Nav_Info.p_Location.alt_abs = parseFloat(p_jmsg.a);
                p_unit.m_Nav_Info.p_Location.alt_relative = parseFloat(p_jmsg.r);


                if (p_jmsg.hasOwnProperty('t')) {
                    p_unit.m_Nav_Info.p_Location.time = p_jmsg.t;
                }
                else {
                    p_unit.m_Nav_Info.p_Location.time = Date.now();
                }

                if (p_jmsg.hasOwnProperty('s')) {
                    p_unit.m_Nav_Info.p_Location.ground_speed = parseFloat(p_jmsg.s); // can be null
                }

                if (p_jmsg.hasOwnProperty('b')) {
                    p_unit.m_Nav_Info.p_Location.bearing = parseFloat(p_jmsg.b); // can be null
                }

                js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_GPS, p_unit);

                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_CameraFlash: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                const c_obj = {};
                c_obj.p_unit = p_unit;
                c_obj.p_jmsg = p_jmsg;
                js_eventEmitter.fn_dispatch(js_event.EE_cameraFlashChanged, c_obj);
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_CameraZoom: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                const c_obj = {};
                c_obj.p_unit = p_unit;
                c_obj.p_jmsg = p_jmsg;
                js_eventEmitter.fn_dispatch(js_event.EE_cameraZoomChanged, c_obj);
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }

                let v_session = {};
                v_session.status = 'connected';
                v_session.m_unit = p_unit;

                if (p_jmsg.T.length !== 0) { /*
								jsonVideoSource[CAMERA_SUPPORT_VIDEO "v"]           = true;
								jsonVideoSource[CAMERA_LOCAL_NAME "ln"]             = deviceInfo.local_name;
								jsonVideoSource[CAMERA_UNIQUE_NAME "id"]            = deviceInfo.unique_name;
								jsonVideoSource[CAMERA_ACTIVE "active"]             = deviceInfo.active;
								jsonVideoSource[CAMERA_TYPE "p"]                    = EXTERNAL_CAMERA_TYPE_RTCWEBCAM;
								// [deprecated] jsonVideoSource[CAMERA_TYPE "f"]                    = ANDROID_DUAL_CAM; facing/rearing (true,false)
								// [deprecated] jsonVideoSource[CAMERA_TYPE "z"]					= Support Zooming 
								jsonVideoSource[CAMERA_TYPE "r"]					= video recording now
                                jsonVideoSource[CAMERA_TYPE "s"]					= SUPPORT ZOOMING/RECORDING/ROTATION/DUALCAM/FLASHING
							*/


                    p_unit.m_Video.m_videoTracks = p_jmsg.T;

                    if (p_jmsg.R === true) { // this is a reply to request.
                        // if (this.v_callbackListeners.hasOwnProperty(js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList) === true) {
                        //     this.v_callbackListeners[js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList](v_session);
                        //     delete this.v_callbackListeners[js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList];
                        // }
                        this.fn_callbackOnMessageID_Answer(js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList, v_session);
                    }
                } else {
                    // NO AVAILABLE CAMERA
                    // error: received emprty session.
                }
            }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_InRange_Node:
                p_jmsg = msg.msgPayload;
                if (!p_jmsg || typeof p_jmsg !== 'object') break;
                p_unit.m_P2P = p_unit.m_P2P || {};
                p_unit.m_P2P.m_detected_node = p_unit.m_P2P.m_detected_node || {};
                try {
                    Object.entries(p_jmsg).forEach(([partyID, inrange_node]) => {
                        inrange_node.t = inrange_node.t ?? 0;
                        p_unit.m_P2P.m_detected_node[partyID] = {
                            mac: inrange_node.m,
                            partyID: inrange_node.p,
                            connected: inrange_node.c,
                            last_time: inrange_node.t
                        };
                    });
                }
                catch (e) {
                    console.log('Error processing P2P message:', e);
                }

                js_eventEmitter.fn_dispatch(js_event.EE_unitP2PUpdated, p_unit);
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_InRange_BSSID: {
                p_jmsg = msg.msgPayload;
                if (!p_jmsg) break;
                try {
                    Object.entries(p_jmsg).forEach(([partyID, inrange_bssid]) => {
                        p_unit.m_P2P.m_detected_bssid[partyID] = {
                            'partyID': inrange_bssid.p,
                            'bssid': inrange_bssid.b,
                            'ssid': inrange_bssid.s,
                            'channel': inrange_bssid.c,
                            'rssi': inrange_bssid.r,
                            'last_time': inrange_bssid.t
                        };
                    });
                }
                catch (e) {
                    console.log(e);
                }

                js_eventEmitter.fn_dispatch(js_event.EE_unitP2PUpdated, p_unit);
            }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_CommSignalsStatus: {
                p_jmsg = msg.msgPayload;

                p_unit.m_SignalStatus.m_mobile = true;
                p_unit.m_SignalStatus.m_mobileSignalLevel = p_jmsg.r;
                p_unit.m_SignalStatus.m_mobileNetworkType = p_jmsg.s;
                p_unit.m_SignalStatus.m_mobileNetworkTypeRank = js_helpers.fn_getNetworkType(p_jmsg.s);
            }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_Communication_Line_Status: {
                p_jmsg = msg.msgPayload;
                if (p_jmsg.ws != null) {
                    p_unit.m_SignalStatus.m_websocket = p_jmsg.ws;
                }
                if (p_jmsg.p2p != null) {
                    p_unit.m_P2P.m_p2p_disabled = !p_jmsg.p2p;
                }
            }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_ID: {
                p_jmsg = msg.msgPayload;
                this._handleUnitIDMessage(p_unit, { ...p_jmsg, senderName: msg.senderName }, !p_unit.m_defined);
                break;
            }

            case js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION: {
                if (p_unit === null || p_unit === undefined) { // p_unit not defined here ... send a request for ID
                    js_andruav_facade.AndruavClientFacade.API_requestID(msg.senderName);
                    return;
                }

                p_jmsg = msg.msgPayload;
                switch (p_jmsg.a) {
                    case js_andruavMessages.CONST_SDR_ACTION_SDR_INFO:
                        p_jmsg = msg.msgPayload;
                        p_unit.m_SDR.m_initialized = true;
                        p_unit.m_SDR.m_center_frequency = p_jmsg.fc;
                        p_unit.m_SDR.m_display_bars = p_jmsg.r;
                        p_unit.m_SDR.m_gain = p_jmsg.g;
                        p_unit.m_SDR.m_sample_rate = p_jmsg.s;
                        p_unit.m_SDR.m_driver = p_jmsg.n;
                        p_unit.m_SDR.m_status = p_jmsg.c;
                        p_unit.m_SDR.m_interval = p_jmsg.t;
                        p_unit.m_SDR.m_trigger_level = p_jmsg.l;

                        js_eventEmitter.fn_dispatch(js_event.EE_unitSDRUpdated, p_unit);
                        break;

                    case js_andruavMessages.CONST_SDR_ACTION_LIST_SDR_DEVICES:
                        if (p_jmsg.dr === null) {
                            p_unit.m_SDR.m_available_drivers = [];
                        }
                        else {
                            p_unit.m_SDR.m_available_drivers = p_jmsg.dr;
                        }
                        js_eventEmitter.fn_dispatch(js_event.EE_unitSDRUpdated, p_unit);
                        break;

                    case js_andruavMessages.CONST_SDR_ACTION_TRIGGER:
                        console.log(p_jmsg);
                        p_unit.m_SDR.addDetectedSignal(
                            p_jmsg.f, p_jmsg.v,
                            p_jmsg.ln, p_jmsg.la,
                            p_jmsg.A,
                            p_jmsg.r,
                            p_jmsg.d
                        )
                        js_eventEmitter.fn_dispatch(js_event.EE_unitSDRTrigger, p_unit);
                        break;
                }

            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_INFO: {
                if (p_unit === null || p_unit === undefined) { // p_unit not defined here ... send a request for ID
                    js_andruav_facade.AndruavClientFacade.API_requestID(msg.senderName);
                    return;
                }
                p_jmsg = msg.msgPayload;
                // p2p communication is available.
                p_unit.m_P2P.m_initialized = true;
                p_unit.m_P2P.m_connection_type = p_jmsg.c;
                p_unit.m_P2P.m_address_1 = p_jmsg.a1;
                p_unit.m_P2P.m_address_2 = p_jmsg.a2;
                p_unit.m_P2P.m_wifi_channel = p_jmsg.wc;
                p_unit.m_P2P.m_wifi_password = p_jmsg.wp;
                p_unit.m_P2P.m_parent_address = p_jmsg.pa;
                p_unit.m_P2P.m_parent_connected = p_jmsg.pc;
                p_unit.m_P2P.m_logical_parent_address = p_jmsg.lp;
                p_unit.m_P2P.m_firmware = p_jmsg.f;
                p_unit.m_P2P.m_driver_connected = p_jmsg.a;
                p_unit.m_P2P.m_p2p_connected = p_jmsg.o;
                if (p_jmsg.d !== null && p_jmsg.d !== undefined) { // remove the if in release and keep the m_p2p_disabled field.
                    p_unit.m_P2P.m_p2p_disabled = p_jmsg.d;
                }
                else {   // backward compatibility
                    p_unit.m_P2P.m_p2p_disabled = false;
                }

                js_eventEmitter.fn_dispatch(js_event.EE_unitP2PUpdated, p_unit);

            }
                break;
            case js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute:
                {
                    if (p_unit === null || p_unit === undefined) { // p_unit not defined here ... send a request for ID
                        js_andruav_facade.AndruavClientFacade.API_requestID(msg.senderName);
                        return;
                    }

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    switch (p_jmsg.C) {
                        case js_andruavMessages.CONST_TYPE_AndruavMessage_ID:
                            // request send ID
                            js_andruav_facade.AndruavClientFacade.API_sendID();
                            break;


                        // case js_andruavMessages.CONST_RemoteCommand_CLEAR_FENCE_DATA:
                        //     if (p_jmsg.hasOwnProperty('fn')) { // fence name
                        //         var fenceName = p_jmsg.n;
                        //         Me.m_andruavGeoFences[fenceName];


                        //         var keys = Object.keys(GeoLinearFences); //TODO: BUG HERE .. VARIABLE IS NOT USED ELSEWHERE.
                        //         var size = Object.keys(GeoLinearFences).length;


                        //         for (var i = 0; i < size; ++ i) {
                        //             if (keys[i] === fenceName) {
                        //                 js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitGeoFenceBeforeDelete, Me.m_andruavGeoFences[keys[i]]);

                        //                 Me.m_andruavGeoFences.splice(i, 1);
                        //                 break;
                        //             }
                        //         }
                        //     } else { /*
                        // 				* if you need to keep the original array because you have other references to it that should be updated too, you can clear it without creating a new array by setting its length to zero:
                        // 				*/
                        //         Me.EVT_andruavUnitGeoFenceBeforeDelete();
                        //         Me.m_andruavGeoFences = [];
                        //         Me.m_andruavGeoFences.length = 0;
                        //     }
                        //     break;
                    }
                }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_POW:
                {

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

                    js_eventEmitter.fn_dispatch(js_event.EE_unitPowUpdated, p_unit);
                }
                break;
            case js_andruavMessages.CONST_TYPE_AndruavMessage_ExternalGeoFence: {
                if (msg.senderName !== '_sys_')
                    return;

                // this is a system command
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                this.#prv_parseFenceInfo(null, p_jmsg);

            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_HomeLocation:
                {

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    } p_unit.m_Geo_Tags.p_HomePoint.m_isValid = true;
                    p_unit.m_Geo_Tags.p_HomePoint.lat = p_jmsg.T;
                    p_unit.m_Geo_Tags.p_HomePoint.lng = p_jmsg.O;
                    p_unit.m_Geo_Tags.p_HomePoint.alt = p_jmsg.A;

                    js_eventEmitter.fn_dispatch(js_event.EE_HomePointChanged, p_unit);

                }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_DistinationLocation:
                {

                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    p_unit.m_Geo_Tags.p_DestinationPoint.m_isValid = true;
                    let destination_type = js_andruavMessages.CONST_DESTINATION_GUIDED_POINT;
                    if (p_jmsg.P !== null && p_jmsg.P !== undefined) {
                        destination_type = p_jmsg.P;
                    }

                    p_unit.m_Geo_Tags.fn_addDestinationPoint(p_jmsg.T, p_jmsg.O, p_jmsg.A, destination_type);

                    js_eventEmitter.fn_dispatch(js_event.EE_DistinationPointChanged, p_unit);

                }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_GeoFence:
                {
                    p_jmsg = msg.msgPayload;
                    if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                        p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                    }
                    this.#prv_parseFenceInfo(p_unit, p_jmsg); //msg.msgPayload);
                }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_GeoFenceAttachStatus: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                const geoFenceAttachStatus = {};
                geoFenceAttachStatus.fenceName = p_jmsg.n;
                geoFenceAttachStatus.isAttachedToFence = p_jmsg.a;
                const fence = Me.m_andruavGeoFences[geoFenceAttachStatus.fenceName];

                if (geoFenceAttachStatus.isAttachedToFence === true) { /*
						* If Action Attach:
						*  // we need to
							// 1- Make sure we have this fence --- if not then ask for it from this drone.
							// 2- Add this Drone to the fence
						*/
                    if (fence === null || fence === undefined) {
                        Me.API_requestGeoFences(p_unit, geoFenceAttachStatus.fenceName);
                        return;
                    } else {
                        if (fence.Units[p_unit.getPartyID()] === null || fence.Units[p_unit.getPartyID()] === undefined) { // not added to this fence .. attach p_unit to fence with missing measures.
                            let geoFenceInfo = {};
                            geoFenceInfo.hasValue = false;
                            geoFenceInfo.fenceName = fence.m_geoFenceName;
                            geoFenceInfo.m_inZone = false; // remember isValid = false
                            geoFenceInfo.distance = Number.NaN;
                            geoFenceInfo.m_shouldKeepOutside = fence.m_shouldKeepOutside;

                            fence.Units[p_unit.getPartyID()] = {};
                            fence.Units[p_unit.getPartyID()].geoFenceInfo = geoFenceInfo;
                        }
                        // else every thig already is there
                    }
                } else { /*
						* If Action DeAttach:
						// 1- Deattach Drone from fence... if we dont have this fence then we DONT want IT
						// If another drone uses it we will know and ask for it from that drone.
						* 			
						* */
                    if ((fence !== null && fence !== undefined)) {
                        if (fence.Units[p_unit.getPartyID()] !== null && fence.Units[p_unit.getPartyID()] !== undefined) {
                            delete fence.Units[p_unit.getPartyID()];
                        }
                    }
                }
            }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_GEOFenceHit: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }

                // info about status of unit vs fence. from the unit perspective.
                // inZone & shouldKeepOutside are the most important.
                let geoFenceHitInfo = {
                    hasValue: true,
                    fenceName: p_jmsg.n,
                    m_inZone: p_jmsg.z,
                    m_shouldKeepOutside: false
                };
                if (typeof p_jmsg.o === 'number') {
                    // p_jmsg.o is an integer [backward compatibility]
                    geoFenceHitInfo.m_shouldKeepOutside = (p_jmsg.o === 1);
                } else if (typeof p_jmsg.o === 'boolean') {
                    // p_jmsg.o is a boolean
                    geoFenceHitInfo.m_shouldKeepOutside = p_jmsg.o;
                }
                if (p_jmsg.hasOwnProperty('d'))
                    geoFenceHitInfo.distance = p_jmsg.d;
                else
                    geoFenceHitInfo.distance = Number.NaN;

                js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitGeoFenceHit, { unit: p_unit, fenceHit: geoFenceHitInfo });
            }
                break;

            // CODEBLOCK_START
            case js_andruavMessages.CONST_TYPE_AndruavMessage_SearchTargetList: {
                if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
                    return;
                }

                p_jmsg = msg.msgPayload;
                if (!p_jmsg.hasOwnProperty('t'))
                    break;

                const c_len = p_jmsg.t.length;
                for (let i = 0; i < c_len; ++i) {
                    const c_targetItem = p_jmsg.t[i];
                    let c_search_target = {};
                    c_search_target.m_name = c_targetItem.n;
                    if (c_targetItem.hasOwnProperty('t')) {
                        c_search_target.m_type = c_targetItem.t;
                    } else {
                        c_search_target.m_type = "na";
                    } p_unit.m_DetectedTargets.m_searchable_targets[c_search_target.m_name] = c_search_target;
                }
                js_common.fn_console_log(JSON.stringify(p_jmsg));
                js_eventEmitter.fn_dispatch(js_event.EE_SearchableTarget, p_unit);
            }
            // CODEBLOCK_END

            // CODEBLOCK_START
            case js_andruavMessages.CONST_TYPE_AndruavMessage_TrackingTargetLocation: {
                if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
                    return;
                }

                p_jmsg = msg.msgPayload.t;
                const c_len = p_jmsg.length;
                p_unit.m_DetectedTargets.m_targets.m_list = [];
                for (let i = 0; i < c_len; ++i) {
                    const c_targetItem = p_jmsg[i];
                    let c_target = {};
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
                js_common.fn_console_log(JSON.stringify(p_jmsg));
                js_eventEmitter.fn_dispatch(js_event.EE_DetectedTarget, p_unit);
            }
                break;
            // CODEBLOCK_END

            case js_andruavMessages.CONST_TYPE_AndruavMessage_DroneReport: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }

                js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_WayPointsUpdated, { unit: p_unit, mir: p_jmsg.P, status: p_jmsg.R });
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_STATUS: {
                // This message can contain complete or sub data
                // sub data is used to update a single port status.
                p_jmsg = msg.msgPayload;
                p_unit.m_GPIOs.addGPIO(p_jmsg.s);
                js_eventEmitter.fn_dispatch(js_event.EE_unitGPIOUpdated, p_unit);
            }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_Signaling: {

                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                let signal = p_jmsg.w || p_jmsg;
                this.EVT_andruavSignalling(p_unit, signal);
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_Error: {
                let v_error = {};
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                v_error.errorNo = p_jmsg.EN;
                v_error.infoType = p_jmsg.IT;
                v_error.notification_Type = p_jmsg.NT;
                v_error.Description = p_jmsg.DS;
                js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitError, { unit: p_unit, err: v_error });


            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_WayPoints: {

                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }

                let v_isChunck = WAYPOINT_NO_CHUNK;
                if (p_jmsg.hasOwnProperty("i")) { // message is INCOMPLETE
                    v_isChunck = p_jmsg.i;
                }
                let numberOfRecords = p_jmsg.n;
                let wayPoint = [];

                if (v_isChunck !== WAYPOINT_NO_CHUNK) {
                    if (js_globals.v_waypointsCache.hasOwnProperty(p_unit.getPartyID()) === false) {
                        // ! due to disconnection or repeated request this array could be filled of an incomplete previous request.
                        // ! this value will be reset each time load wp is called.
                        js_globals.v_waypointsCache[p_unit.getPartyID()] = [];
                    }

                    wayPoint = js_globals.v_waypointsCache[p_unit.getPartyID()];
                } else { // if this is a full message of the same unit then delete any possible old partial messages -cleaning up-.
                    delete js_globals.v_waypointsCache[p_unit.getPartyID()];
                }

                for (let i = 0; i < numberOfRecords; ++i) {
                    if (p_jmsg[i] !== null && p_jmsg[i] !== undefined) {
                        let wayPointStep = {};
                        wayPointStep.waypointType = p_jmsg[i].t;

                        switch (wayPointStep.waypointType) {
                            case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                wayPointStep.Longitude = p_jmsg[i].g;
                                wayPointStep.Latitude = p_jmsg[i].a;
                                wayPointStep.Altitude = p_jmsg[i].l;
                                wayPointStep.Heading = p_jmsg[i].h;
                                wayPointStep.TimeToStay = p_jmsg[i].y;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_SPLINE:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                wayPointStep.Longitude = p_jmsg[i].g;
                                wayPointStep.Latitude = p_jmsg[i].a;
                                wayPointStep.Altitude = p_jmsg[i].l;
                                wayPointStep.TimeToStay = p_jmsg[i].y;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                wayPointStep.Altitude = p_jmsg[i].l;
                                wayPointStep.Pitch = p_jmsg[i].p;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_TRIGGER:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                break;
                            case js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_CONTROL:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                break;
                            case js_andruavMessages.CONST_WayPoint_TYPE_GUIDED:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                wayPointStep.Enable = p_jmsg[i].e;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_ChangeAlt:
                                wayPointStep.m_Sequence = p_jmsg[i].s;
                                wayPointStep.AscentDescentRate = p_jmsg[i].r;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_CMissionAction_CONTINUE_AND_CHANGE_ALT: wayPointStep.m_Sequence = p_jmsg[i].s;
                                /**
                                     * 0 = Neutral, command completes when within 5m of this command's altitude, 
                                     * 1 = Climbing, command completes when at or above this command's altitude,
                                     * 2 = Descending, command completes when at or below this command's altitude.
                                     */
                                wayPointStep.AscentorDescent = p_jmsg[i].c;
                                wayPointStep.DesiredAltitude = p_jmsg[i].a;
                                break;

                            case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE: wayPointStep.m_Sequence = p_jmsg[i].s;
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
                    js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_WayPoints, { unit: p_unit, wps: wayPoint });
                } else if (v_isChunck === WAYPOINT_LAST_CHUNK) { // end of chunks
                    js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_WayPoints, { unit: p_unit, wps: wayPoint });
                    delete js_globals.v_waypointsCache[p_unit.getPartyID()];
                }
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_NAV_INFO: {
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

                js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, p_unit);
            }
                break;


        };

    };




    _handleUnitIDMessage(p_unit, p_jmsg, isNewUnit) {
        const triggers = {
            onVehicleBlocked: false,
            onFlying: false,
            onArmed: false,
            onFCB: false,
            onFlightMode: false,
            onModuleChanged: false,
            onHomePointChanged: false,
            onVehicleChanged: false,
            onSwarmStatus: false,
            onSwarmStatus2: false,
            onBackOnline: false
        };

        p_unit.m_IsMe = false;
        p_unit.m_IsGCS = p_jmsg.GS;
        p_unit.m_unitName = p_jmsg.UD;
        p_unit.Description = p_jmsg.DS;
        p_unit.m_VehicleType = p_jmsg.VT;
        p_unit.m_Video.VideoRecording = p_jmsg.VR;
        p_unit.m_GPS_Info1.gpsMode = p_jmsg.GM;
        p_unit.m_Permissions = p_jmsg.p;
        p_unit.m_IsDisconnectedFromGCS = false;
        p_unit.m_useFCBIMU = p_jmsg.FI ?? false;
        p_unit.m_telemetry_protocol = p_jmsg.TP ?? js_andruavMessages.CONST_Unknown_Telemetry;
        p_unit.m_time_sync = p_jmsg.T ?? p_unit.m_time_sync;
        p_unit.m_autoPilot = p_jmsg.AP ?? p_unit.m_autoPilot;

        if (isNewUnit) {
            p_unit.m_defined = true;
            p_unit.setPartyID(p_jmsg.senderName);
            js_globals.m_andruavUnitList.Add(p_unit.getPartyID(), p_unit);
            this.#prv_onNewUnitAdded(p_unit);
            js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitAdded, p_unit);
        } else {
            triggers.onVehicleChanged = p_unit.m_VehicleType !== p_jmsg.VT;
            triggers.onFCB = p_unit.m_useFCBIMU !== p_jmsg.FI || p_unit.m_telemetry_protocol !== p_jmsg.TP;
        }

        if (p_jmsg.m1) {
            triggers.onModuleChanged = p_jmsg.m1.length !== p_unit.m_modules.m_list.length;
            p_unit.m_modules.addModules(p_jmsg.m1);
        }

        if (p_jmsg[js_andruavMessages.CONST_TYPE_AndruavMessage_HomeLocation]) {
            const sub_jmsg = p_jmsg[js_andruavMessages.CONST_TYPE_AndruavMessage_HomeLocation];
            p_unit.m_Geo_Tags.fn_addHomePoint(sub_jmsg.T, sub_jmsg.O, sub_jmsg.A, sub_jmsg.R, sub_jmsg.H);
            triggers.onHomePointChanged = true;
        }

        if (p_jmsg.dv) {
            // .dv meanse DRONEENGAGE-VERSION
            p_unit.fn_setIsDE(true);
            if (p_unit.fn_getVersion() !== p_jmsg.dv) {
                p_unit.fn_setVersion(p_jmsg.dv);
                setTimeout(() => {
                    js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitError, {
                        unit: p_unit,
                        err: { notification_Type: 5, Description: `DE SW ver: ${p_jmsg.dv}` }
                    });
                }, 1000);
            }
        } else {

            p_unit.fn_setIsDE(false);  // backward compatibility

            if (p_jmsg.av) {
                // .av means ANDRUAV-VERSION
                if (p_unit.fn_getVersion() !== p_jmsg.av) {
                    p_unit.fn_setVersion(p_jmsg.av);
                    setTimeout(() => {
                        js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitError, {
                            unit: p_unit,
                            err: { notification_Type: 5, Description: `Andruav version: ${p_jmsg.av}` }
                        });
                    }, 1000);
                }
            }
        }

        if (p_jmsg.hasOwnProperty('B')) {
            triggers.onVehicleBlocked = p_unit.m_Telemetry.m_isGCSBlocked !== p_jmsg.B;
            p_unit.m_Telemetry.m_isGCSBlocked = p_jmsg.B;
        }

        if (p_jmsg.C) {
            p_unit.m_Telemetry.fn_updateTelemetry(p_jmsg.C);
        }

        if (p_jmsg.hasOwnProperty('SD')) {
            triggers.onBackOnline = p_unit.m_IsShutdown !== p_jmsg.SD;
            p_unit.m_IsShutdown = p_jmsg.SD;
        }

        if (p_jmsg.hasOwnProperty('FM')) {
            triggers.onFlightMode = p_unit.m_flightMode !== p_jmsg.FM;
            p_unit.m_flightMode = p_jmsg.FM;
        }

        let is_armed = false;
        let is_ready_to_arm = p_unit.fn_getIsDE() ? true : false;
        if (typeof p_jmsg.AR === 'boolean') {
            is_armed = p_jmsg.AR;
            is_ready_to_arm = p_jmsg.AR;
        } else if (typeof p_jmsg.AR === 'number') {
            is_armed = (p_jmsg.AR & 0b0010) === 0b10;
            is_ready_to_arm = (p_jmsg.AR & 0b0001) === 0b1;
        }
        triggers.onArmed = p_unit.m_isArmed !== is_armed || p_unit.m_is_ready_to_arm !== is_ready_to_arm;
        p_unit.m_isArmed = is_armed;
        p_unit.m_is_ready_to_arm = is_ready_to_arm;

        if (p_jmsg.hasOwnProperty('FL')) {
            triggers.onFlying = p_unit.m_isFlying !== p_jmsg.FL;
            p_unit.m_isFlying = p_jmsg.FL;
        }

        if (p_jmsg.z) p_unit.m_FlyingLastStartTime = p_jmsg.z / 1000;
        if (p_jmsg.a) p_unit.m_FlyingTotalDuration = p_jmsg.a / 1000;

        if (p_jmsg.n && p_jmsg.n !== js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM) {
            triggers.onSwarmStatus = p_unit.m_Swarm.m_formation_as_follower !== p_jmsg.n;
            p_unit.m_Swarm.m_formation_as_follower = p_jmsg.n;
        } else {
            triggers.onSwarmStatus = p_unit.m_Swarm.m_formation_as_follower !== js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM;
            p_unit.m_Swarm.m_formation_as_follower = js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM;
        }

        if (p_jmsg.o && p_jmsg.o !== js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM) {
            triggers.onSwarmStatus = p_unit.m_Swarm.m_isLeader !== true;
            p_unit.m_Swarm.m_isLeader = true;
            p_unit.m_Swarm.m_formation_as_leader = p_jmsg.o;
        } else {
            triggers.onSwarmStatus = p_unit.m_Swarm.m_isLeader !== false;
            p_unit.m_Swarm.m_isLeader = false;
            p_unit.m_Swarm.m_formation_as_leader = js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM;
        }

        if (p_jmsg.q && p_jmsg.q !== '') {
            triggers.onSwarmStatus2 = p_unit.m_Swarm.m_following !== p_jmsg.q;
            p_unit.m_Swarm.m_following = p_jmsg.q;
        } else {
            triggers.onSwarmStatus2 = p_unit.m_Swarm.m_following != null;
            p_unit.m_Swarm.m_following = null;
        }

        if (!isNewUnit) {
            js_globals.m_andruavUnitList.putUnit(p_unit.getPartyID(), p_unit);
            js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, p_unit);
        }

        if (p_unit.m_modules.has_p2p && !p_unit.m_P2P.m_initialized) {
            if (p_unit.m_delayedTimeout) clearTimeout(p_unit.m_delayedTimeout);
            p_unit.m_delayedTimeout = setTimeout(() => js_andruav_facade.AndruavClientFacade.API_requestP2P(p_unit), 1000);
        }

        if (p_unit.m_modules.has_sdr && !p_unit.m_SDR.m_initialized) {
            if (p_unit.m_delayedTimeout) clearTimeout(p_unit.m_delayedTimeout);
            p_unit.m_delayedTimeout = setTimeout(() => js_andruav_facade.AndruavClientFacade.API_requestSDR(p_unit.getPartyID()), 1000);
        }

        const eventMap = {
            onSwarmStatus: js_event.EE_onAndruavUnitSwarmUpdated,
            onSwarmStatus2: js_event.EE_onAndruavUnitSwarmUpdated,
            onFCB: js_event.EE_andruavUnitFCBUpdated,
            onArmed: js_event.EE_andruavUnitArmedUpdated,
            onFlying: js_event.EE_andruavUnitFlyingUpdated,
            onFlightMode: js_event.EE_andruavUnitFightModeUpdated,
            onVehicleChanged: js_event.EE_andruavUnitVehicleTypeUpdated,
            onBackOnline: js_event.EE_unitOnlineChanged,
            onModuleChanged: js_event.EE_onModuleUpdated,
            onHomePointChanged: js_event.EE_HomePointChanged
        };
        Object.keys(triggers).forEach(key => {
            if (triggers[key] && eventMap[key]) {
                js_eventEmitter.fn_dispatch(eventMap[key], p_unit);
            }
        });
    }


    /**
    * Parse mavlink messages and try to extract information similar to Andruav Protocol to save traffic.
    * @param p_unit: never equal null.
    * @param p_mavlinkPacket: should be a mavlink message.
    */
    #prv_parseUnitMavlinkMessage(p_unit, p_mavlinkPacket) {
        const messages = this.mavlinkProcessor.parseBuffer(new Int8Array(p_mavlinkPacket));
        for (const c_mavlinkMessage of messages) {
            if (c_mavlinkMessage.id === -1) {
                js_common.fn_console_log("BAD MAVLINK");
                continue;
            }
            p_unit.m_Messages.fn_addMavlinkMsg(c_mavlinkMessage);
            switch (c_mavlinkMessage.header.msgId) {
                case mavlink20.MAVLINK_MSG_ID_HEARTBEAT:
                    {
                        const v_trigger_on_FCB = (p_unit.m_FCBParameters.m_systemID !== c_mavlinkMessage.header.srcSystem);
                        p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                        p_unit.m_FCBParameters.m_componentID = c_mavlinkMessage.header.srcComponent;
                        if (v_trigger_on_FCB === true) {
                            js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitFCBUpdated, p_unit);
                        }
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_SERVO_OUTPUT_RAW:
                    {

                        let v_servoOutputs = {};
                        v_servoOutputs.m_servo1 = c_mavlinkMessage.servo1_raw;
                        v_servoOutputs.m_servo2 = c_mavlinkMessage.servo2_raw;
                        v_servoOutputs.m_servo3 = c_mavlinkMessage.servo3_raw;
                        v_servoOutputs.m_servo4 = c_mavlinkMessage.servo4_raw;
                        v_servoOutputs.m_servo5 = c_mavlinkMessage.servo5_raw;
                        v_servoOutputs.m_servo6 = c_mavlinkMessage.servo6_raw;
                        v_servoOutputs.m_servo7 = c_mavlinkMessage.servo7_raw;
                        v_servoOutputs.m_servo8 = c_mavlinkMessage.servo8_raw;
                        v_servoOutputs.m_servo9 = c_mavlinkMessage.servo9_raw;
                        v_servoOutputs.m_servo10 = c_mavlinkMessage.servo10_raw;
                        v_servoOutputs.m_servo11 = c_mavlinkMessage.servo11_raw;
                        v_servoOutputs.m_servo12 = c_mavlinkMessage.servo12_raw;
                        v_servoOutputs.m_servo13 = c_mavlinkMessage.servo13_raw;
                        v_servoOutputs.m_servo14 = c_mavlinkMessage.servo14_raw;
                        v_servoOutputs.m_servo15 = c_mavlinkMessage.servo15_raw;
                        v_servoOutputs.m_servo16 = c_mavlinkMessage.servo16_raw;


                        p_unit.m_Servo.m_values = v_servoOutputs;

                        js_eventEmitter.fn_dispatch(js_event.EE_servoOutputUpdate, p_unit);

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
                        js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, p_unit);

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
                        js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, p_unit);
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_BATTERY_STATUS:
                    {
                        p_unit.m_Power._FCB.p_Battery.p_hasPowerInfo = true;
                        let v_voltage = 0;
                        for (let i = 0; i < 10; ++i) {
                            const cel_voltage = c_mavlinkMessage.voltages[i];
                            if ((cel_voltage < 0) || (cel_voltage === 65535))
                                break;

                            v_voltage += cel_voltage;
                        }
                        p_unit.m_Power._FCB.p_Battery.FCB_BatteryVoltage = v_voltage;
                        p_unit.m_Power._FCB.p_Battery.FCB_BatteryCurrent = c_mavlinkMessage.current_battery * 10;
                        p_unit.m_Power._FCB.p_Battery.FCB_BatteryRemaining = c_mavlinkMessage.battery_remaining;
                        p_unit.m_Power._FCB.p_Battery.FCB_BatteryTemprature = c_mavlinkMessage.temperature;
                        p_unit.m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed = c_mavlinkMessage.current_consumed;

                        js_eventEmitter.fn_dispatch(js_event.EE_unitPowUpdated, p_unit);
                    }
                    break;
                case mavlink20.MAVLINK_MSG_ID_BATTERY2:
                    {
                        p_unit.m_Power._FCB.p_Battery2.p_hasPowerInfo = true;
                        p_unit.m_Power._FCB.p_Battery2.FCB_BatteryVoltage = c_mavlinkMessage.voltage;
                        p_unit.m_Power._FCB.p_Battery2.FCB_BatteryCurrent = c_mavlinkMessage.current_battery * 10;

                        js_eventEmitter.fn_dispatch(js_event.EE_unitPowUpdated, p_unit);

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
                        p_unit.m_Nav_Info._Target.wp_count = c_mavlinkMessage.count; // including home location
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_MISSION_CURRENT:
                    {
                        if ((c_mavlinkMessage.mission_type === null || c_mavlinkMessage.mission_type === undefined) || (c_mavlinkMessage.mission_type === mavlink20.MAV_MISSION_TYPE_MISSION)) {
                            p_unit.m_Nav_Info._Target.wp_num = c_mavlinkMessage.seq;
                            p_unit.m_Nav_Info._Target.mission_state = c_mavlinkMessage.mission_state;
                            //p_unit.m_Nav_Info._Target.mission_mode = c_mavlinkMessage.mission_mode;  todo: later
                            //p_unit.m_Nav_Info._Target.wp_count= c_mavlinkMessage.total; // without home location todo: later
                        }
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_TERRAIN_REPORT:
                    {
                        p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                        p_unit.m_Terrain_Info.add(new js_andruavUnit.C_TerrainEntry(c_mavlinkMessage.lat * 0.0000001, c_mavlinkMessage.lon * 0.0000001,
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
                        p_unit.m_lidar_info.update(c_mavlinkMessage);
                        js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitLidarInfo, p_unit);
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_VFR_HUD:
                    {
                        p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                        p_unit.m_Nav_Info.p_Location.ground_speed = c_mavlinkMessage.groundspeed;
                        p_unit.m_Nav_Info.p_Location.air_speed = c_mavlinkMessage.airspeed;
                        p_unit.m_Throttle = c_mavlinkMessage.throttle; //Current throttle setting (0 to 100).
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_GLOBAL_POSITION_INT:
                    {
                        p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                        p_unit.m_Nav_Info.p_Location.lat = (c_mavlinkMessage.lat * 0.0000001);
                        p_unit.m_Nav_Info.p_Location.lng = (c_mavlinkMessage.lon * 0.0000001);
                        p_unit.m_Nav_Info.p_Location.alt_abs = c_mavlinkMessage.alt * 0.001;
                        p_unit.m_Nav_Info.p_Location.alt_relative = c_mavlinkMessage.relative_alt * 0.001;
                        js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_GPS, p_unit);
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

                case mavlink20.MAVLINK_MSG_ID_OBSTACLE_DISTANCE:
                    {   // TODO: not implemented
                        // https://mavlink.io/en/messages/common.html#MAV_DISTANCE_SENSOR
                        p_unit.m_Obstacles.fn_addObstacle(c_mavlinkMessage.sensor_type,
                            c_mavlinkMessage.distances, c_mavlinkMessage.max_distance, c_mavlinkMessage.min_distance,
                            c_mavlinkMessage.increment_f, c_mavlinkMessage.angle_offset
                        );
                    }
                    break;


                // case mavlink20.MAVLINK_MSG_ID_ADSB_VEHICLE: REACT2
                // {
                //     p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;

                //     var adsb_object = window.AndruavLibs.ADSBObjectList.fn_getADSBObject(c_mavlinkMessage.ICAO_address);
                //     if (adsb_object==null)
                //     {
                //         adsb_object = new CADSBObject(c_mavlinkMessage.ICAO_address);
                //         window.AndruavLibs.ADSBObjectList.Add(c_mavlinkMessage.ICAO_address,adsb_object);
                //     }

                //     adsb_object.m_lat           = c_mavlinkMessage.lat * 0.0000001;
                //     adsb_object.m_lon           = c_mavlinkMessage.lon * 0.0000001;
                //     adsb_object.m_altitude_type = c_mavlinkMessage.altitude_type;
                //     adsb_object.m_altitude      = c_mavlinkMessage.altitude;
                //     adsb_object.m_heading       = c_mavlinkMessage.heading * 0.01   * js_helpers.CONST_DEGREE_TO_RADIUS;
                //     adsb_object.m_hor_velocity  = c_mavlinkMessage.hor_velocity;
                //     adsb_object.m_ver_velocity  = c_mavlinkMessage.ver_velocity;
                //     adsb_object.m_emitter_type  = c_mavlinkMessage.emitter_type;
                //     adsb_object.m_squawk        = c_mavlinkMessage.squawk;

                //     adsb_object.m_last_access   = new Date();

                //     js_eventEmitter.fn_dispatch(js_event.EE_adsbExchangeReady, adsb_object);
                // }
                // break;

                case mavlink20.MAVLINK_MSG_ID_PARAM_VALUE:
                    {
                        const p_old_param = p_unit.m_FCBParameters.m_list[c_mavlinkMessage.param_id];

                        if (p_old_param !== null && p_old_param !== undefined) {
                            // if I am here then this is a reread mode or rerequest all parameters
                            //    
                            // param index is corrupted when re-reading param after param_set.
                            c_mavlinkMessage.param_index = p_old_param.param_index;
                        }

                        p_unit.m_FCBParameters.m_list[c_mavlinkMessage.param_id] = c_mavlinkMessage;
                        p_unit.m_FCBParameters.m_list_by_index[c_mavlinkMessage.param_index] = c_mavlinkMessage;
                        p_unit.m_FCBParameters.m_list_by_index_shadow[c_mavlinkMessage.param_index] = c_mavlinkMessage;

                        if (p_old_param !== null && p_old_param !== undefined) {
                            const now = Date.now();
                            if (now - this.m_lastparamatersUpdateTime > js_andruavMessages.CONST_PARAMETER_REPEATED) {
                                this.m_lastparamatersUpdateTime = now;
                                js_eventEmitter.fn_dispatch(js_event.EE_updateParameters, p_unit);
                            }

                        }
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_FILE_TRANSFER_PROTOCOL:
                    js_common.fn_console_log("PARAM: FTP " + c_mavlinkMessage.payload);
                    break;

                case mavlink20.MAVLINK_MSG_ID_HIGH_LATENCY:
                    {
                        p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                        p_unit.m_FCBParameters.m_componentID = c_mavlinkMessage.header.srcComponent;
                        p_unit.m_Nav_Info.p_Location.lat = (c_mavlinkMessage.latitude * 0.0000001);
                        p_unit.m_Nav_Info.p_Location.lng = (c_mavlinkMessage.longitude * 0.0000001);
                        p_unit.m_Nav_Info.p_Location.alt_abs = c_mavlinkMessage.altitude_amsl;
                        p_unit.m_Nav_Info.p_Location.alt_sp = c_mavlinkMessage.altitude_sp;
                        p_unit.m_Nav_Info.p_Location.ground_speed = c_mavlinkMessage.groundspeed;
                        p_unit.m_Nav_Info.p_Location.air_speed = c_mavlinkMessage.airspeed;
                        p_unit.m_Nav_Info.p_Orientation.roll = c_mavlinkMessage.roll * 0.01 * js_helpers.CONST_DEGREE_TO_RADIUS;
                        p_unit.m_Nav_Info.p_Orientation.pitch = c_mavlinkMessage.pitch * 0.01 * js_helpers.CONST_DEGREE_TO_RADIUS;
                        p_unit.m_Nav_Info.p_Orientation.yaw = c_mavlinkMessage.heading * 0.01 * js_helpers.CONST_DEGREE_TO_RADIUS;
                        p_unit.m_Nav_Info.p_Desired.nav_bearing = c_mavlinkMessage.heading * 0.01; // deg
                        p_unit.m_Nav_Info._Target.target_bearing = c_mavlinkMessage.heading_sp * 0.01; //deg
                        p_unit.m_Nav_Info._Target.wp_dist = c_mavlinkMessage.wp_distance;
                        p_unit.m_Nav_Info._Target.wp_num = c_mavlinkMessage.wp_num;
                        p_unit.m_GPS_Info1.GPS3DFix = c_mavlinkMessage.gps_fix_type;
                        p_unit.m_GPS_Info1.m_satCount = c_mavlinkMessage.gps_nsat;
                        p_unit.m_Power._FCB.p_Battery.FCB_BatteryRemaining = c_mavlinkMessage.battery_remaining;

                        p_unit.m_GPS_Info1.m_isValid = true;

                        js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, p_unit);
                        js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_GPS, p_unit);
                        js_eventEmitter.fn_dispatch(js_event.EE_unitPowUpdated, p_unit);
                    }
                    break;

                case mavlink20.MAVLINK_MSG_ID_HIGH_LATENCY2:
                    {
                        p_unit.m_FCBParameters.m_systemID = c_mavlinkMessage.header.srcSystem;
                        p_unit.m_FCBParameters.m_componentID = c_mavlinkMessage.header.srcComponent;
                        p_unit.m_Nav_Info.p_Location.lat = (c_mavlinkMessage.latitude * 0.0000001);
                        p_unit.m_Nav_Info.p_Location.lng = (c_mavlinkMessage.longitude * 0.0000001);
                        p_unit.m_Nav_Info.p_Location.alt_abs = (c_mavlinkMessage.altitude);
                        p_unit.m_Nav_Info.p_Orientation.yaw = c_mavlinkMessage.heading * 0.02 * js_helpers.CONST_DEGREE_TO_RADIUS;
                        p_unit.m_Nav_Info.p_Desired.nav_bearing = c_mavlinkMessage.heading * 0.02 * js_helpers.CONST_DEGREE_TO_RADIUS;
                        p_unit.m_Nav_Info._Target.target_bearing = c_mavlinkMessage.target_heading * 0.02 * js_helpers.CONST_DEGREE_TO_RADIUS;
                        p_unit.m_Nav_Info._Target.wp_dist = c_mavlinkMessage.target_distance;
                        p_unit.m_Nav_Info._Target.wp_num = c_mavlinkMessage.wp_num;
                        p_unit.m_Power._FCB.p_Battery.FCB_BatteryRemaining = c_mavlinkMessage.battery;

                        p_unit.m_GPS_Info1.m_isValid = true;

                        js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, p_unit);
                        js_eventEmitter.fn_dispatch(js_event.EE_unitPowUpdated, p_unit);
                        js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_GPS, p_unit);
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
    parseBinaryAndruavMessage(v_unit, andruavCMD, data, v_internalCommandIndexByteBased, byteLength) {


        switch (andruavCMD.mt) {

            case js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_SPECTRUM: {
                // Extract the float data
                let floatData = new Float32Array(data.buffer.slice(v_internalCommandIndexByteBased));
                v_unit.m_SDR.addSpectrumData(andruavCMD.ms, floatData)
                js_eventEmitter.fn_dispatch(js_event.EE_unitSDRSpectrum, v_unit);

                for (let i = 0; i < floatData.length; i++) {
                    js_common.fn_console_log(`Float value at index ${i}: ${floatData[i]}`);
                }
                js_common.fn_console_log(andruavCMD);
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavBinaryMessage_Mavlink: {

                let v_andruavMessage = {
                    'src': js_andruavMessages.CONST_TelemetryProtocol_Source_REMOTE,
                    'data': data.buffer.slice(v_internalCommandIndexByteBased)
                };

                this.#prv_parseUnitMavlinkMessage(v_unit, v_andruavMessage.data);
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavBinaryMessage_ServoOutput:
                {
                    // OBSOLETE as a report message and has been with replaced mavlink message.

                    let v_servoOutputs = {};
                    /*
                                 String message could be of any length and no padding applied.
                                 when reading getUint32 the system assumes that data is paded in 4 bytes 
                                 so it is better to slice data again.
                                 NOTE THAT when reading getUnit16 the index will be different.
                    */
                    let v_binaryData = data.buffer.slice(v_internalCommandIndexByteBased, data.buffer.byteLength);
                    let v_values = new Int32Array(v_binaryData);
                    v_servoOutputs.m_servo1 = v_values[0];
                    v_servoOutputs.m_servo2 = v_values[1];
                    v_servoOutputs.m_servo3 = v_values[2];
                    v_servoOutputs.m_servo4 = v_values[3];
                    v_servoOutputs.m_servo5 = v_values[4];
                    v_servoOutputs.m_servo6 = v_values[5];
                    v_servoOutputs.m_servo7 = v_values[6];
                    v_servoOutputs.m_servo8 = v_values[7];
                    v_unit.m_Servo.m_values = v_servoOutputs;
                    js_eventEmitter.fn_dispatch(js_event.EE_servoOutputUpdate, v_unit);
                }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_IMG: {
                let v_andruavMessage;
                if (andruavCMD.hasOwnProperty('ms') === false) {   // backward compatibility with ANDRUAV   
                    try {
                        let out = js_helpers.fn_extractString(data, v_internalCommandIndexByteBased, byteLength);
                        v_internalCommandIndexByteBased = out.nextIndex;
                        v_andruavMessage = JSON.parse(out.text);
                    } catch (err) {
                        js_common.fn_console_log(err);
                        v_andruavMessage = {}; //new Object();
                    }
                }
                else {
                    v_andruavMessage = andruavCMD.ms;
                    v_andruavMessage.lat = v_andruavMessage.lat * 0.0000001;
                    v_andruavMessage.lng = v_andruavMessage.lng * 0.0000001;
                }

                v_andruavMessage.img = data.subarray(v_internalCommandIndexByteBased, byteLength);
                const des = v_andruavMessage.des != null ? v_andruavMessage.des : "no description";
                const prv = v_andruavMessage.des != null ? v_andruavMessage.prv : "not defined";
                const spd = v_andruavMessage.spd != null ? v_andruavMessage.spd : 0;
                const ber = v_andruavMessage.des != null ? v_andruavMessage.ber : 0;
                const acc = v_andruavMessage.des != null ? v_andruavMessage.acc : -1;
                js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_IMG,
                    { v_unit: v_unit, img: v_andruavMessage.img, des: des, lat: v_andruavMessage.lat, lng: v_andruavMessage.lng, prv: prv, tim: v_andruavMessage.tim, alt: v_andruavMessage.alt, spd: spd, ber: ber, acc: acc });

            }
                break;
        }
    };



};

Object.seal(CAndruavClientParser.prototype);
export const AndruavClientParser = CAndruavClientParser.getInstance();
