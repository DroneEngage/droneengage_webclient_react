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
import { js_globals } from '../../js_globals.js';
import { EVENTS as js_event } from '../../events/js_eventList.js'
import * as js_helpers from '../../js_helpers.js';
import * as js_andruavUnit from '../../js_andruavUnit.js';
import * as js_andruavMessages from '../messages/js_andruavMessages.js';

import * as js_common from '../../js_common.js'
import { js_eventEmitter } from '../../events/js_eventEmitter.js'
import { fn_getOrCreateUnit } from '../../model/unitRegistry.js'
import { js_websocket_bridge } from '../../CPC/js_websocket_bridge.js';
import { js_callbackRegistry } from '../callbackRegistry.js';


import { mavlink20, MAVLink20Processor } from '../../js_mavlink_v2.js'
// WAYPOINT_NO_CHUNK/WAYPOINT_LAST_CHUNK moved to core/protocol/reduce.js.


// Tasks Scope
const CONST_TASK_SCOPE_GLOBAL = 0;
const CONST_TASK_SCOPE_GLOBAL_ACCOUNT = 1;
const CONST_TASK_SCOPE_LOCALGROUP = 2;
const CONST_TASK_SCOPE_PARTYID = 3;




class CAndruavClientParser {
    constructor() {
        // waypoint cache moved to js_waypointCache (services/waypoint/waypointCache.js).
        // callback registry moved to js_callbackRegistry (protocol/callbackRegistry.js).
        // signalling callback moved to EE_andruavSignalling event subscription.
        this.fn_init();
        //this.m_mavlinkFTPProtocol = new C_MavlinkFTPProtocol();

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
                    js_eventEmitter.fn_dispatch('__facadeGetHomeLocation', unit);
                }
                if (timeSinceLastActive > js_andruavMessages.CONST_checkStatus_Interverl0) {
                    js_eventEmitter.fn_dispatch('__facadeRequestID', unit.getPartyID());
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

        // m_andruavGeoFences removed — moved to js_geoFenceRegistry (services/geo/geoFenceRegistry.js).
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

    // The parser callback registry (single-shot request/reply) moved to
    // js_callbackRegistry (protocol/callbackRegistry.js). The facade registers
    // via js_callbackRegistry.fn_register; the reduce path signals
    // __callbackReply, runtime calls js_callbackRegistry.fn_fireOnce. The
    // CONFIG_STATUS case (still in this switch until TASK-02.5) calls
    // js_callbackRegistry.fn_fireOnce directly.

    // #prv_parseFenceInfo removed — its pure body moved to fn_parseFenceInfo
    // in core/protocol/reduce.js. The GeoFence/ExternalGeoFence reducers wrap
    // its output in an EE_andruavUnitGeoFenceUpdated event.


    // #prv_onNewUnitAdded removed — the 3 facade calls moved to
    // reduceIDEffects (effects.js) as Command objects, dispatched by runtime.


    parseCommunicationMessage(Me, msg, evt) {

        let p_jmsg = msg;
        const isIDMessage = (msg.messageType === js_andruavMessages.CONST_TYPE_AndruavMessage_ID);
        const { unit: p_unit, shouldRequestID } = fn_getOrCreateUnit(p_jmsg.senderName, !isIDMessage);
        if (shouldRequestID) {
            js_eventEmitter.fn_dispatch('__facadeRequestID', msg.senderName);
        }

        p_unit.m_Messages.fn_addMsg(msg.messageType);
        p_unit.m_Messages.m_received_msg++;
        p_unit.m_Messages.m_received_bytes += evt.data.length;
        p_unit.m_Messages.m_lastActiveTime = Date.now();

        switch (msg.messageType) {

            // CONFIG_STATUS removed — migrated to core/protocol/reduce.js
            // (reduceConfigStatus) + runtime.js (__configStatusReply).

            case js_andruavMessages.CONST_TYPE_AndruavMessage_TargetTracking_STATUS: {
                p_jmsg = msg.msgPayload;
                p_unit.m_tracker.fn_updateTrackerStatus(p_jmsg);
                js_eventEmitter.fn_dispatch(js_event.EE_onTrackingStatusChanged, p_unit);
            }
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_STATUS: {
                p_jmsg = msg.msgPayload;
                switch (p_jmsg.a) {
                    case js_andruavMessages.CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST:
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

            case js_andruavMessages.CONST_TYPE_AndruavMessage_Chat: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) {
                    p_jmsg = JSON.parse(p_jmsg);
                }
                js_eventEmitter.fn_dispatch(js_event.EE_onChatMessage, { unit: p_unit, message: p_jmsg });
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

            // CameraList / SOUND_LIST removed — migrated to core/protocol/reduce.js
            // (reduceCameraList / reduceSoundList) + runtime.js (__callbackReply).

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
                if (p_jmsg.op != null) p_unit.m_SignalStatus.m_operatorName = p_jmsg.op;
                if (p_jmsg.c != null)  p_unit.m_SignalStatus.m_countryIso = p_jmsg.c;
                if (p_jmsg.ds != null) p_unit.m_SignalStatus.m_dataState = p_jmsg.ds;
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


            case js_andruavMessages.CONST_TYPE_AndruavMessage_ID:
                // Migrated to core/protocol/reduce.js — handled by fn_handleFrame
                // before this switch is reached. Dead code fallthrough marker.
                break;

            case js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION:
            case js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_INFO:
            case js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute:
                // Migrated to core/protocol/reduce.js — handled by fn_handleFrame
                // before this switch is reached. Dead code fallthrough markers.
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

            // SearchTargetList / TargetTrackingtLocation removed — migrated to
            // core/protocol/reduce.js. The experimental-feature gate is checked
            // in runtime.js (fn_handleFrame) before reduce runs.

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

            case js_andruavMessages.CONST_TYPE_AndruavMessage_TELNET_STATUS: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) {
                    p_jmsg = JSON.parse(msg.msgPayload);
                }
                js_eventEmitter.fn_dispatch(js_event.EE_unitTelnetStatus, { unit: p_unit, msg: p_jmsg });
            }
                break;


            // Signaling removed — migrated to core/protocol/reduce.js
            // (reduceSignaling) + EE_andruavSignalling event subscription
            // in js_webrtcthin2.js.

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

            // WayPoints message removed — migrated to core/protocol/reduce.js
            // (reduceWayPoints) + runtime.js (chunk assembly via js_waypointCache).

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


            case js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_STATUS: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) { // backword compatible
                    p_jmsg = JSON.parse(msg.msgPayload); // Internal message JSON
                }
                
                switch (p_jmsg.a) {
                    case js_andruavMessages.VIEWLINK_STATUS_GIMBAL_ATTITUDE: {
                        // Handle gimbal attitude status with yaw, pitch, roll fields
                        console.log (p_jmsg);
                        const payload = {
                            gm: {
                                y: p_jmsg.y ?? 0,
                                p: p_jmsg.p ?? 0,
                                r: p_jmsg.r ?? 0
                            }
                        };
                        p_unit.m_Gimbal.setOrientation(p_jmsg.y ?? 0, p_jmsg.p ?? 0, p_jmsg.r ?? 0);
                        js_eventEmitter.fn_dispatch(js_event.EE_viewLinkGimbalAttitude, payload);
                        break;
                    }
                    case js_andruavMessages.VIEWLINK_STATUS_ALL: {
                        // Handle gimbal attitude status with yaw, pitch, roll fields
                        console.log (p_jmsg);
                        const gmSrc = p_jmsg.gm || {};
                        p_unit.m_Gimbal.setOrientation(gmSrc.y ?? 0, gmSrc.p ?? 0, gmSrc.r ?? 0);
                        
                        const lrt = p_jmsg.lrf || {};
                        p_unit.m_Gimbal.setLRF(lrt.d, lrt.a)
                        const statusPayload = {
                            gm: {
                                y: gmSrc.y ?? 0,
                                p: gmSrc.p ?? 0,
                                r: gmSrc.r ?? 0
                            },
                            tr: p_jmsg.tr || p_jmsg.tracking || {},
                            lrf: p_jmsg.lrf || {},
                            ai: p_jmsg.ai || {},
                            g: p_jmsg.g  || {}
                        };
                        p_unit.m_Gimbal.setOrientation(gmSrc.y ?? 0, gmSrc.p ?? 0, gmSrc.r ?? 0);
                        js_eventEmitter.fn_dispatch(js_event.EE_viewLinkGimbalAttitude, statusPayload);
                        break;
                    }
                }
            }
                break;


            case js_andruavMessages.CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS: {
                p_jmsg = msg.msgPayload;
                if (typeof p_jmsg === 'string' || p_jmsg instanceof String) {
                    p_jmsg = JSON.parse(msg.msgPayload);
                }

                // Store health data on the unit's module health map, keyed by
                // module_key (field "k"). de_comm itself sends with k="comm".
                // Modules send with their own module key.
                if (p_jmsg && p_jmsg.k) {
                    p_unit.m_moduleHealth[p_jmsg.k] = {
                        rss: p_jmsg.rs,
                        vmpeak: p_jmsg.pk,
                        vmswap: p_jmsg.sw,
                        threads: p_jmsg.th,
                        slope: p_jmsg.sl,
                        trend: p_jmsg.tr,
                        status: p_jmsg.hs,
                        uptime: p_jmsg.up,
                        timestamp: Date.now()
                    };
                    js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, p_unit);
                }
            }
                break;


        };

    };





    // _handleUnitIDMessage removed — ID message migrated to core/protocol/reduce.js
    // (reduceID). The facade calls (3 new-unit requests, delayed P2P/SDR) are now
    // Command objects returned by reduceIDEffects and dispatched by runtime.js.


    /**
    * Parse mavlink messages and try to extract information similar to Andruav Protocol to save traffic.
    * @param p_unit: never equal null.
    * @param p_mavlinkPacket: should be a mavlink message.
    */
    #prv_parseUnitMavlinkMessage(p_unit, p_mavlinkPacket) {
        js_websocket_bridge.sendMessage(p_mavlinkPacket);
            
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

            case js_andruavMessages.CONST_TYPE_AndruavMessage_TELNET_DATA: {
                // Binary pty output from the de_telnet module.
                // andruavCMD.ms contains {a, i} where i is the session_id.
                // The bytes after the JSON header are the raw terminal output.
                const binaryPayload = data.buffer.slice(v_internalCommandIndexByteBased);
                const textPayload = new TextDecoder().decode(binaryPayload);
                js_eventEmitter.fn_dispatch(js_event.EE_unitTelnetData, {
                    unit: v_unit,
                    session_id: andruavCMD.ms ? andruavCMD.ms.i : '',
                    data: textPayload
                });
            }
                break;

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
