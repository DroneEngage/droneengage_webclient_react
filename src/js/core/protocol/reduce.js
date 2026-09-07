/**
 * TASK-02 — fn_reduce: pure model mutation as data.
 *
 * Takes a unit and a decoded Message, returns the field-level patches and
 * coarse events that the old switch would have produced. Does NOT mutate the
 * unit, does NOT call the facade, does NOT touch globals or the DOM. The
 * runtime applies the patches and dispatches the events.
 *
 * Return shape: { patches: FieldPatch[], events: Dispatch[] }
 * Returns null for message types not yet migrated so the runtime can fall
 * through to the old switch (incremental migration, TASK-02 step 2).
 *
 * MIGRATED: GPS, POW, NAV_INFO, CommSignalsStatus, Communication_Line_Status.
 */

import { CONST_TYPE_AndruavMessage_GPS,
         CONST_TYPE_AndruavMessage_POW,
         CONST_TYPE_AndruavMessage_NAV_INFO,
         CONST_TYPE_AndruavMessage_CommSignalsStatus,
         CONST_TYPE_AndruavMessage_Communication_Line_Status,
         CONST_TYPE_AndruavMessage_Chat,
         CONST_TYPE_AndruavMessage_UdpProxy_Info,
         CONST_TYPE_AndruavMessage_TargetTracking_STATUS,
         CONST_TYPE_AndruavMessage_AI_Recognition_STATUS,
         CONST_TYPE_AndruavMessage_ID,
         CONST_TYPE_AndruavMessage_HomeLocation,
         CONST_TYPE_AndruavMessage_CameraFlash,
         CONST_TYPE_AndruavMessage_CameraZoom,
         CONST_TYPE_AndruavMessage_DroneReport,
         CONST_TYPE_AndruavMessage_GPIO_STATUS,
         CONST_TYPE_AndruavMessage_TELNET_STATUS,
         CONST_TYPE_AndruavMessage_Error,
         CONST_TYPE_AndruavMessage_GEOFenceHit,
         CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS,
         CONST_TYPE_AndruavMessage_P2P_InRange_Node,
         CONST_TYPE_AndruavMessage_P2P_InRange_BSSID,
         CONST_TYPE_AndruavMessage_P2P_INFO,
         CONST_TYPE_AndruavMessage_SDR_ACTION,
         CONST_TYPE_AndruavMessage_RemoteExecute,
         CONST_TYPE_AndruavMessage_DistinationLocation,
         CONST_TYPE_AndruavMessage_Viewlink_STATUS,
         CONST_TYPE_AndruavMessage_TargetTrackingtLocation,
         CONST_TYPE_AndruavMessage_SearchTargetList,
         CONST_TYPE_AndruavMessage_CameraList,
         CONST_TYPE_AndruavMessage_SOUND_LIST,
         CONST_TYPE_AndruavMessage_CONFIG_STATUS,
         CONST_TYPE_AndruavMessage_Signaling,
         CONST_TYPE_AndruavMessage_GeoFence,
         CONST_TYPE_AndruavMessage_ExternalGeoFence,
         CONST_TYPE_AndruavMessage_GeoFenceAttachStatus,
         CONST_TYPE_AndruavMessage_WayPoints,
         CONST_TYPE_LinearFence,
         CONST_TYPE_PolygonFence,
         CONST_TYPE_CylinderFence,
         CONST_WayPoint_TYPE_WAYPOINTSTEP,
         CONST_WayPoint_TYPE_SPLINE,
         CONST_WayPoint_TYPE_TAKEOFF,
         CONST_WayPoint_TYPE_LANDING,
         CONST_WayPoint_TYPE_RTL,
         CONST_WayPoint_TYPE_CAMERA_TRIGGER,
         CONST_WayPoint_TYPE_CAMERA_CONTROL,
         CONST_WayPoint_TYPE_GUIDED,
         CONST_WayPoint_TYPE_ChangeAlt,
         CONST_WayPoint_TYPE_CMissionAction_CONTINUE_AND_CHANGE_ALT,
         CONST_WayPoint_TYPE_CIRCLE,
         CONST_SDR_ACTION_SDR_INFO,
         CONST_SDR_ACTION_LIST_SDR_DEVICES,
         CONST_SDR_ACTION_TRIGGER,
         VIEWLINK_STATUS_GIMBAL_ATTITUDE,
         VIEWLINK_STATUS_ALL,
         CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST,
         CONST_TASHKEEL_SERB_NO_SWARM,
         CONST_Unknown_Telemetry } from '../../protocol/messages/js_andruavMessages.js';

import { EVENTS as js_event } from '../../events/js_eventList.js';

// Chunked waypoint assembly constants (shared with runtime.js).
// WAYPOINT_NO_CHUNK: full message (no chunking). WAYPOINT_LAST_CHUNK: final
// chunk index that triggers the merged dispatch.
export const WAYPOINT_NO_CHUNK = 0;
export const WAYPOINT_LAST_CHUNK = 999;

/**
 * @param {object} unit
 * @param {import('./types.js').Message} msg
 * @returns {{patches: import('./types.js').FieldPatch[], events: import('./types.js').Dispatch[]} | null}
 */
export function fn_reduce(unit, msg) {
    if (!fn_isMigrated(msg.type)) {
        // Not yet migrated — runtime falls through to the old switch.
        return null;
    }
    switch (msg.type) {
        case CONST_TYPE_AndruavMessage_GPS:
            return reduceGPS(unit, msg);
        case CONST_TYPE_AndruavMessage_POW:
            return reducePOW(unit, msg);
        case CONST_TYPE_AndruavMessage_NAV_INFO:
            return reduceNavInfo(unit, msg);
        case CONST_TYPE_AndruavMessage_CommSignalsStatus:
            return reduceCommSignalsStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_Communication_Line_Status:
            return reduceCommLineStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_Chat:
            return reduceChat(unit, msg);
        case CONST_TYPE_AndruavMessage_UdpProxy_Info:
            return reduceUdpProxyInfo(unit, msg);
        case CONST_TYPE_AndruavMessage_TargetTracking_STATUS:
            return reduceTrackingStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_AI_Recognition_STATUS:
            return reduceAIRecognition(unit, msg);
        case CONST_TYPE_AndruavMessage_ID:
            return reduceID(unit, msg);
        case CONST_TYPE_AndruavMessage_CameraFlash:
            return reduceCameraFlash(unit, msg);
        case CONST_TYPE_AndruavMessage_CameraZoom:
            return reduceCameraZoom(unit, msg);
        case CONST_TYPE_AndruavMessage_HomeLocation:
            return reduceHomeLocation(unit, msg);
        case CONST_TYPE_AndruavMessage_DistinationLocation:
            return reduceDistinationLocation(unit, msg);
        case CONST_TYPE_AndruavMessage_DroneReport:
            return reduceDroneReport(unit, msg);
        case CONST_TYPE_AndruavMessage_GPIO_STATUS:
            return reduceGPIOStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_TELNET_STATUS:
            return reduceTelnetStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_Error:
            return reduceError(unit, msg);
        case CONST_TYPE_AndruavMessage_GEOFenceHit:
            return reduceGeoFenceHit(unit, msg);
        case CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS:
            return reduceModuleHealthStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_P2P_InRange_Node:
            return reduceP2PInRangeNode(unit, msg);
        case CONST_TYPE_AndruavMessage_P2P_InRange_BSSID:
            return reduceP2PInRangeBSSID(unit, msg);
        case CONST_TYPE_AndruavMessage_P2P_INFO:
            return reduceP2PInfo(unit, msg);
        case CONST_TYPE_AndruavMessage_SDR_ACTION:
            return reduceSDRAction(unit, msg);
        case CONST_TYPE_AndruavMessage_RemoteExecute:
            return reduceRemoteExecute(unit, msg);
        case CONST_TYPE_AndruavMessage_Viewlink_STATUS:
            return reduceViewlinkStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_GeoFence:
            return reduceGeoFence(unit, msg);
        case CONST_TYPE_AndruavMessage_ExternalGeoFence:
            return reduceExternalGeoFence(unit, msg);
        case CONST_TYPE_AndruavMessage_GeoFenceAttachStatus:
            return reduceGeoFenceAttachStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_WayPoints:
            return reduceWayPoints(unit, msg);
        case CONST_TYPE_AndruavMessage_SearchTargetList:
            return reduceSearchTargetList(unit, msg);
        case CONST_TYPE_AndruavMessage_TargetTrackingtLocation:
            return reduceTargetTrackingLocation(unit, msg);
        case CONST_TYPE_AndruavMessage_CameraList:
            return reduceCameraList(unit, msg);
        case CONST_TYPE_AndruavMessage_SOUND_LIST:
            return reduceSoundList(unit, msg);
        case CONST_TYPE_AndruavMessage_CONFIG_STATUS:
            return reduceConfigStatus(unit, msg);
        case CONST_TYPE_AndruavMessage_Signaling:
            return reduceSignaling(unit, msg);
        default:
            return null;
    }
}

/**
 * Whether a message type is handled by the new reduce path. Runtime checks
 * this BEFORE doing getOrCreateUnit / message accounting so unmigrated types
 * fall through to the old switch with zero side effects (no double accounting).
 * @param {number} type
 * @returns {boolean}
 */
export function fn_isMigrated(type) {
    return type === CONST_TYPE_AndruavMessage_GPS
        || type === CONST_TYPE_AndruavMessage_POW
        || type === CONST_TYPE_AndruavMessage_NAV_INFO
        || type === CONST_TYPE_AndruavMessage_CommSignalsStatus
        || type === CONST_TYPE_AndruavMessage_Communication_Line_Status
        || type === CONST_TYPE_AndruavMessage_Chat
        || type === CONST_TYPE_AndruavMessage_UdpProxy_Info
        || type === CONST_TYPE_AndruavMessage_TargetTracking_STATUS
        || type === CONST_TYPE_AndruavMessage_AI_Recognition_STATUS
        || type === CONST_TYPE_AndruavMessage_ID
        || type === CONST_TYPE_AndruavMessage_CameraFlash
        || type === CONST_TYPE_AndruavMessage_CameraZoom
        || type === CONST_TYPE_AndruavMessage_HomeLocation
        || type === CONST_TYPE_AndruavMessage_DistinationLocation
        || type === CONST_TYPE_AndruavMessage_DroneReport
        || type === CONST_TYPE_AndruavMessage_GPIO_STATUS
        || type === CONST_TYPE_AndruavMessage_TELNET_STATUS
        || type === CONST_TYPE_AndruavMessage_Error
        || type === CONST_TYPE_AndruavMessage_GEOFenceHit
        || type === CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS
        || type === CONST_TYPE_AndruavMessage_P2P_InRange_Node
        || type === CONST_TYPE_AndruavMessage_P2P_InRange_BSSID
        || type === CONST_TYPE_AndruavMessage_P2P_INFO
        || type === CONST_TYPE_AndruavMessage_SDR_ACTION
        || type === CONST_TYPE_AndruavMessage_RemoteExecute
        || type === CONST_TYPE_AndruavMessage_Viewlink_STATUS
        || type === CONST_TYPE_AndruavMessage_GeoFence
        || type === CONST_TYPE_AndruavMessage_ExternalGeoFence
        || type === CONST_TYPE_AndruavMessage_GeoFenceAttachStatus
        || type === CONST_TYPE_AndruavMessage_WayPoints
        || type === CONST_TYPE_AndruavMessage_SearchTargetList
        || type === CONST_TYPE_AndruavMessage_TargetTrackingtLocation
        || type === CONST_TYPE_AndruavMessage_CameraList
        || type === CONST_TYPE_AndruavMessage_SOUND_LIST
        || type === CONST_TYPE_AndruavMessage_CONFIG_STATUS
        || type === CONST_TYPE_AndruavMessage_Signaling;
}

// ---------------------------------------------------------------------------
// GPS — highest frequency, simplest. Pure field writes + one dispatch.
// Matches js_andruav_parser.js CONST_TYPE_AndruavMessage_GPS exactly.
// ---------------------------------------------------------------------------
function reduceGPS(unit, msg) {
    const p = msg.payload;
    const patches = [];

    const isValid = (p.la !== null && p.la !== undefined);
    patches.push({ path: 'm_GPS_Info1.m_isValid', value: isValid });
    patches.push({ path: 'm_GPS_Info1.GPS3DFix', value: p['3D'] });
    patches.push({ path: 'm_GPS_Info1.m_satCount', value: p.SC });
    patches.push({ path: 'm_GPS_Info1.accuracy', value: p.hasOwnProperty('c') ? p.c : 0 });
    patches.push({ path: 'm_GPS_Info1.provider', value: p.p });

    patches.push({ path: 'm_Nav_Info.p_Location.lat', value: p.la });
    patches.push({ path: 'm_Nav_Info.p_Location.lng', value: p.ln });
    patches.push({ path: 'm_Nav_Info.p_Location.alt_abs', value: parseFloat(p.a) });
    patches.push({ path: 'm_Nav_Info.p_Location.alt_relative', value: parseFloat(p.r) });
    patches.push({ path: 'm_Nav_Info.p_Location.time', value: p.hasOwnProperty('t') ? p.t : msg.receivedAt });

    if (p.hasOwnProperty('s')) {
        patches.push({ path: 'm_Nav_Info.p_Location.ground_speed', value: parseFloat(p.s) });
    }
    if (p.hasOwnProperty('b')) {
        patches.push({ path: 'm_Nav_Info.p_Location.bearing', value: parseFloat(p.b) });
    }

    return { patches, events: [{ name: js_event.EE_msgFromUnit_GPS, payload: unit }] };
}

// ---------------------------------------------------------------------------
// POW — power/battery. Mobile + optional FCB battery block.
// ---------------------------------------------------------------------------
function reducePOW(unit, msg) {
    const p = msg.payload;
    const patches = [];

    patches.push({ path: 'm_Power._Mobile.p_Battery.BatteryLevel', value: p.BL });
    patches.push({ path: 'm_Power._Mobile.p_Battery.Voltage', value: p.V });
    patches.push({ path: 'm_Power._Mobile.p_Battery.BatteryTemperature', value: p.BT });
    patches.push({ path: 'm_Power._Mobile.p_Battery.Health', value: p.H });
    patches.push({ path: 'm_Power._Mobile.p_Battery.PlugStatus', value: p.PS });
    patches.push({ path: 'm_Power._Mobile.p_Battery.p_hasPowerInfo', value: true });

    if (p.hasOwnProperty('FV')) {
        patches.push({ path: 'm_Power._FCB.p_Battery.p_hasPowerInfo', value: true });
        patches.push({ path: 'm_Power._FCB.p_Battery.FCB_BatteryVoltage', value: p.FV });
        patches.push({ path: 'm_Power._FCB.p_Battery.FCB_BatteryCurrent', value: p.FI });
        patches.push({ path: 'm_Power._FCB.p_Battery.FCB_BatteryRemaining', value: p.FR });
        if (p.hasOwnProperty('T')) {
            patches.push({ path: 'm_Power._FCB.p_Battery.FCB_BatteryTemprature', value: p.T });
        }
        if (p.hasOwnProperty('C')) {
            patches.push({ path: 'm_Power._FCB.p_Battery.FCB_TotalCurrentConsumed', value: p.C });
        }
    } else {
        patches.push({ path: 'm_Power._FCB.p_Battery.p_hasPowerInfo', value: false });
    }

    return { patches, events: [{ name: js_event.EE_unitPowUpdated, payload: unit }] };
}

// ---------------------------------------------------------------------------
// NAV_INFO — orientation + target nav data.
// ---------------------------------------------------------------------------
function reduceNavInfo(unit, msg) {
    const p = msg.payload;
    const patches = [];

    patches.push({ path: 'm_Nav_Info._Target.target_bearing', value: parseFloat(p.d) });
    patches.push({ path: 'm_Nav_Info._Target.wp_dist', value: parseFloat(p.e) });
    patches.push({ path: 'm_Nav_Info.p_Orientation.roll', value: parseFloat(p.a) });
    patches.push({ path: 'm_Nav_Info.p_Orientation.pitch', value: parseFloat(p.b) });
    patches.push({ path: 'm_Nav_Info.p_Orientation.yaw', value: parseFloat(p.y) });
    patches.push({ path: 'm_Nav_Info._Target.alt_error', value: parseFloat(p.f) });

    return { patches, events: [{ name: js_event.EE_unitNavUpdated, payload: unit }] };
}

// ---------------------------------------------------------------------------
// CommSignalsStatus — mobile signal info. No event dispatch in the original.
// m_mobileNetworkTypeRank requires js_helpers.fn_getNetworkType; that helper
// is imported by runtime (not reduce) to keep reduce free of globals. The rank
// patch is added by runtime after reduce returns.
// ---------------------------------------------------------------------------
function reduceCommSignalsStatus(unit, msg) {
    const p = msg.payload;
    const patches = [];

    patches.push({ path: 'm_SignalStatus.m_mobile', value: true });
    patches.push({ path: 'm_SignalStatus.m_mobileSignalLevel', value: p.r });
    patches.push({ path: 'm_SignalStatus.m_mobileNetworkType', value: p.s });
    if (p.op != null) patches.push({ path: 'm_SignalStatus.m_operatorName', value: p.op });
    if (p.c != null) patches.push({ path: 'm_SignalStatus.m_countryIso', value: p.c });
    if (p.ds != null) patches.push({ path: 'm_SignalStatus.m_dataState', value: p.ds });

    return { patches, events: [] };
}

// ---------------------------------------------------------------------------
// Communication_Line_Status — websocket + p2p line status. No event dispatch.
// ---------------------------------------------------------------------------
function reduceCommLineStatus(unit, msg) {
    const p = msg.payload;
    const patches = [];

    if (p.ws != null) patches.push({ path: 'm_SignalStatus.m_websocket', value: p.ws });
    if (p.p2p != null) patches.push({ path: 'm_P2P.m_p2p_disabled', value: !p.p2p });

    return { patches, events: [] };
}

// ---------------------------------------------------------------------------
// Chat — dispatch only, no field writes. Payload may be stringified (decode
// handles that). Original dispatches { unit, message: p_jmsg }.
// ---------------------------------------------------------------------------
function reduceChat(unit, msg) {
    return {
        patches: [],
        events: [{ name: js_event.EE_onChatMessage, payload: { unit, message: msg.payload } }],
    };
}

// ---------------------------------------------------------------------------
// UdpProxy_Info — telemetry proxy fields + one dispatch.
// ---------------------------------------------------------------------------
function reduceUdpProxyInfo(unit, msg) {
    const p = msg.payload;
    const patches = [];

    patches.push({ path: 'm_Telemetry.m_udpProxy_ip', value: p.a });
    patches.push({ path: 'm_Telemetry.m_udpProxy_port', value: p.p });
    patches.push({ path: 'm_Telemetry.m_telemetry_level', value: p.o });
    patches.push({ path: 'm_Telemetry.m_udpProxy_active', value: p.en });
    patches.push({ path: 'm_Telemetry.m_udpProxy_paused', value: p.hasOwnProperty('z') ? p.z : false });

    return { patches, events: [{ name: js_event.EE_onProxyInfoUpdated, payload: unit }] };
}

// ---------------------------------------------------------------------------
// TargetTracking_STATUS — calls unit.m_tracker.fn_updateTrackerStatus(payload)
// then dispatches EE_onTrackingStatusChanged. The method call is declared as
// a Dispatch with a `method` field; runtime calls it before dispatching.
// ---------------------------------------------------------------------------
function reduceTrackingStatus(unit, msg) {
    return {
        patches: [],
        events: [{
            name: js_event.EE_onTrackingStatusChanged,
            payload: unit,
            method: 'm_tracker.fn_updateTrackerStatus',
            methodArg: msg.payload,
            notifyFields: ['m_tracker.m_enable_gui_tracker', 'm_tracker.m_active', 'm_tracker.m_ai_driven'],
        }],
    };
}

// ---------------------------------------------------------------------------
// AI_Recognition_STATUS — two sub-cases:
//  CLASS_LIST: calls m_tracker_ai.fn_addObjectClass(p_jmsg.c) + EE_onTrackingAIObjectListUpdate
//  default:    calls m_tracker_ai.fn_updateTrackerStatus(p_jmsg.a) + EE_onTrackingAIStatusChanged
// ---------------------------------------------------------------------------
function reduceAIRecognition(unit, msg) {
    const p = msg.payload;
    if (p.a === CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST) {
        return {
            patches: [],
            events: [{
                name: js_event.EE_onTrackingAIObjectListUpdate,
                payload: unit,
                method: 'm_tracker_ai.fn_addObjectClass',
                methodArg: p.c,
                notifyFields: ['m_tracker_ai.m_object_list'],
            }],
        };
    }
    return {
        patches: [],
        events: [{
            name: js_event.EE_onTrackingAIStatusChanged,
            payload: unit,
            method: 'm_tracker_ai.fn_updateTrackerStatus',
            methodArg: p.a,
            notifyFields: ['m_tracker_ai.m_active', 'm_tracker_ai.m_detected'],
        }],
    };
}

// ---------------------------------------------------------------------------
// ID — the most complex message. Uses ordered `ops` to preserve the exact
// interleaving of field writes, fn_resetOnBoardConnection, unit-method calls,
// and event dispatches from _handleUnitIDMessage.
//
// The facade calls (#prv_onNewUnitAdded's 3 requests, delayed REQUEST_P2P,
// delayed REQUEST_SDR) are returned as effects Commands — see reduceIDEffects
// which effects.js delegates to.
// ---------------------------------------------------------------------------
export function reduceID(unit, msg) {
    const p = msg.payload;
    const ops = [];
    const triggers = {
        onVehicleBlocked: false, onFlying: false, onArmed: false,
        onFCB: false, onFlightMode: false, onModuleChanged: false,
        onHomePointChanged: false, onVehicleChanged: false,
        onSwarmStatus: false, onSwarmStatus2: false,
        onBackOnline: false, onDEPilotChanged: false,
    };

    const isNewUnit = !unit.m_defined;
    const oldVehicleType = unit.m_VehicleType;
    const oldUseFCBIMU = unit.m_useFCBIMU;
    const oldIsDE = unit.fn_getIsDE ? unit.fn_getIsDE() : false;

    // Phase 1: initial field writes (lines 1197-1212).
    ops.push({ op: 'set', path: 'm_IsMe', value: false });
    ops.push({ op: 'set', path: 'm_IsGCS', value: p.GS });
    ops.push({ op: 'set', path: 'm_unitName', value: p.UD });
    ops.push({ op: 'set', path: 'Description', value: p.DS });
    ops.push({ op: 'set', path: 'm_VehicleType', value: p.VT });
    ops.push({ op: 'set', path: 'm_Video.VideoRecording', value: p.VR });
    ops.push({ op: 'set', path: 'm_GPS_Info1.gpsMode', value: p.GM });
    ops.push({ op: 'set', path: 'm_Permissions', value: p.p });
    ops.push({ op: 'set', path: 'm_IsDisconnectedFromGCS', value: false });
    ops.push({ op: 'set', path: 'm_useFCBIMU', value: p.FI ?? false });
    ops.push({ op: 'set', path: 'm_telemetry_protocol', value: p.TP ?? CONST_Unknown_Telemetry });
    ops.push({ op: 'set', path: 'm_time_sync', value: p.T ?? unit.m_time_sync });
    ops.push({ op: 'set', path: 'm_autoPilot', value: p.AP ?? unit.m_autoPilot });

    // Phase 2: new vs existing unit.
    if (isNewUnit) {
        ops.push({ op: 'set', path: 'm_defined', value: true });
        // setPartyID + list.Add are runtime concerns (impure on the registry).
        // #prv_onNewUnitAdded -> 3 commands (handled by effects).
        ops.push({ op: 'method', method: 'setPartyID', arg: p.senderName ?? msg.senderID });
        ops.push({ op: 'dispatch', name: '__listAdd', payload: unit });
    } else {
        triggers.onVehicleChanged = oldVehicleType !== p.VT;
        triggers.onFCB = oldUseFCBIMU !== (p.FI ?? false) || unit.m_telemetry_protocol !== (p.TP ?? CONST_Unknown_Telemetry);
        if (!oldUseFCBIMU && (p.FI ?? false)) {
            // fn_resetOnBoardConnection wipes the unit then re-applies currentValues.
            // MUST happen here (after phase-1 writes, before phase-3 writes) to
            // match the original exactly.
            ops.push({ op: 'method', method: 'fn_resetOnBoardConnection', arg: {
                FI: p.FI ?? false, TP: p.TP ?? CONST_Unknown_Telemetry,
                T: p.T, AP: p.AP, VT: p.VT, GS: p.GS, UD: p.UD, DS: p.DS, p: p.p },
                notifyFields: ['m_useFCBIMU', 'm_telemetry_protocol', 'm_VehicleType', 'm_autoPilot'] });
        }
    }

    // Phase 3: modules.
    if (p.m1) {
        triggers.onModuleChanged = p.m1.length !== unit.m_modules.m_list.length;
        ops.push({ op: 'method', method: 'm_modules.addModules', arg: p.m1, notifyFields: ['m_modules.has_fcb', 'm_modules.has_viewlink', 'm_modules.has_ai_recognition', 'm_modules.has_p2p', 'm_modules.has_sdr'] });
    }

    // Phase 4: home location sub-message.
    const sub = p[CONST_TYPE_AndruavMessage_HomeLocation];
    if (sub) {
        ops.push({ op: 'method', method: 'm_Geo_Tags.fn_addHomePoint', arg: { T: sub.T, O: sub.O, A: sub.A, R: sub.R, H: sub.H } });
        triggers.onHomePointChanged = true;
    }

    // Phase 5: DE/Andruav version detection.
    if (p.dv) {
        ops.push({ op: 'method', method: 'fn_setIsDE', arg: true });
        if (unit.fn_getVersion && unit.fn_getVersion() !== p.dv) {
            ops.push({ op: 'method', method: 'fn_setVersion', arg: p.dv });
            ops.push({ op: 'dispatch', name: '__delayedVersionNotice', payload: { unit, label: `DE SW ver: ${p.dv}` } });
        }
    } else {
        ops.push({ op: 'method', method: 'fn_setIsDE', arg: false });
        if (p.av && unit.fn_getVersion && unit.fn_getVersion() !== p.av) {
            ops.push({ op: 'method', method: 'fn_setVersion', arg: p.av });
            ops.push({ op: 'dispatch', name: '__delayedVersionNotice', payload: { unit, label: `Andruav version: ${p.av}` } });
        }
    }
    if (oldIsDE !== (p.dv ? true : false)) {
        triggers.onVehicleChanged = true;
    }

    // Phase 6: GCS blocked, telemetry, shutdown, flight mode.
    if (p.hasOwnProperty('B')) {
        triggers.onVehicleBlocked = unit.m_Telemetry.m_isGCSBlocked !== p.B;
        ops.push({ op: 'set', path: 'm_Telemetry.m_isGCSBlocked', value: p.B });
    }
    ops.push({ op: 'method', method: 'm_Telemetry.fn_updateTelemetry', arg: p.hasOwnProperty('C') ? p.C : 0 });
    if (p.hasOwnProperty('SD')) {
        triggers.onBackOnline = unit.m_IsShutdown !== p.SD;
        ops.push({ op: 'set', path: 'm_IsShutdown', value: p.SD });
    }
    if (p.hasOwnProperty('FM')) {
        triggers.onFlightMode = unit.m_flightMode !== p.FM;
        ops.push({ op: 'set', path: 'm_flightMode', value: p.FM });
    }

    // Phase 7: arming.
    let is_armed = false, is_ready_to_arm = false;
    if (typeof p.AR === 'boolean') {
        is_armed = p.AR; is_ready_to_arm = p.AR;
    } else if (typeof p.AR === 'number') {
        is_armed = (p.AR & 0b0010) === 0b10;
        is_ready_to_arm = (p.AR & 0b0001) === 0b1;
    }
    triggers.onArmed = unit.m_isArmed !== is_armed || unit.m_is_ready_to_arm !== is_ready_to_arm;
    ops.push({ op: 'set', path: 'm_isArmed', value: is_armed });
    ops.push({ op: 'set', path: 'm_is_ready_to_arm', value: is_ready_to_arm });

    // Phase 8: flying + durations.
    if (p.hasOwnProperty('FL')) {
        triggers.onFlying = unit.m_isFlying !== p.FL;
        ops.push({ op: 'set', path: 'm_isFlying', value: p.FL });
    }
    if (p.z) ops.push({ op: 'set', path: 'm_FlyingLastStartTime', value: p.z / 1000 });
    if (p.a) ops.push({ op: 'set', path: 'm_FlyingTotalDuration', value: p.a / 1000 });

    // Phase 9: DE Pilot.
    if (p.hasOwnProperty('DE') || p.hasOwnProperty('DO')) {
        const old_de = unit.m_de_pilot_enabled;
        const old_op = unit.m_de_pilot_operation;
        if (p.hasOwnProperty('DE')) ops.push({ op: 'set', path: 'm_de_pilot_enabled', value: p.DE });
        if (p.hasOwnProperty('DO')) ops.push({ op: 'set', path: 'm_de_pilot_operation', value: p.DO });
        triggers.onDEPilotChanged = old_de !== (p.DE ?? old_de) || old_op !== (p.DO ?? old_op);
    }

    // Phase 10: swarm.
    if (p.n && p.n !== CONST_TASHKEEL_SERB_NO_SWARM) {
        triggers.onSwarmStatus = unit.m_Swarm.m_formation_as_follower !== p.n;
        ops.push({ op: 'set', path: 'm_Swarm.m_formation_as_follower', value: p.n });
    } else {
        triggers.onSwarmStatus = unit.m_Swarm.m_formation_as_follower !== CONST_TASHKEEL_SERB_NO_SWARM;
        ops.push({ op: 'set', path: 'm_Swarm.m_formation_as_follower', value: CONST_TASHKEEL_SERB_NO_SWARM });
    }
    if (p.o && p.o !== CONST_TASHKEEL_SERB_NO_SWARM) {
        triggers.onSwarmStatus = unit.m_Swarm.m_isLeader !== true;
        ops.push({ op: 'set', path: 'm_Swarm.m_isLeader', value: true });
        ops.push({ op: 'set', path: 'm_Swarm.m_formation_as_leader', value: p.o });
    } else {
        triggers.onSwarmStatus = unit.m_Swarm.m_isLeader !== false;
        ops.push({ op: 'set', path: 'm_Swarm.m_isLeader', value: false });
        ops.push({ op: 'set', path: 'm_Swarm.m_formation_as_leader', value: CONST_TASHKEEL_SERB_NO_SWARM });
    }
    if (p.q && p.q !== '') {
        triggers.onSwarmStatus2 = unit.m_Swarm.m_following !== p.q;
        ops.push({ op: 'set', path: 'm_Swarm.m_following', value: p.q });
    } else {
        triggers.onSwarmStatus2 = unit.m_Swarm.m_following != null;
        ops.push({ op: 'set', path: 'm_Swarm.m_following', value: null });
    }

    // Phase 11: list update + coarse events.
    if (!isNewUnit) {
        ops.push({ op: 'dispatch', name: '__listPutUnit', payload: unit });
        ops.push({ op: 'dispatch', name: js_event.EE_unitUpdated, payload: unit });
    } else {
        ops.push({ op: 'dispatch', name: js_event.EE_andruavUnitAdded, payload: unit });
    }

    // Phase 12: trigger events (mirrors the old eventMap).
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
        onHomePointChanged: js_event.EE_HomePointChanged,
        onDEPilotChanged: js_event.EE_onDroneEngagePilotChanged,
    };
    Object.keys(triggers).forEach(key => {
        if (triggers[key] && eventMap[key]) {
            ops.push({ op: 'dispatch', name: eventMap[key], payload: unit });
        }
    });

    return { patches: [], events: [], ops, triggers, isNewUnit };
}

// ---------------------------------------------------------------------------
// CameraFlash / CameraZoom — dispatch only with {p_unit, p_jmsg} payload.
// ---------------------------------------------------------------------------
function reduceCameraFlash(unit, msg) {
    return { patches: [], events: [{ name: js_event.EE_cameraFlashChanged, payload: { p_unit: unit, p_jmsg: msg.payload } }] };
}
function reduceCameraZoom(unit, msg) {
    return { patches: [], events: [{ name: js_event.EE_cameraZoomChanged, payload: { p_unit: unit, p_jmsg: msg.payload } }] };
}

// ---------------------------------------------------------------------------
// HomeLocation — field writes + EE_HomePointChanged.
// ---------------------------------------------------------------------------
function reduceHomeLocation(unit, msg) {
    const p = msg.payload;
    return {
        patches: [
            { path: 'm_Geo_Tags.p_HomePoint.m_isValid', value: true },
            { path: 'm_Geo_Tags.p_HomePoint.lat', value: p.T },
            { path: 'm_Geo_Tags.p_HomePoint.lng', value: p.O },
            { path: 'm_Geo_Tags.p_HomePoint.alt', value: p.A },
        ],
        events: [{ name: js_event.EE_HomePointChanged, payload: unit }],
    };
}

// ---------------------------------------------------------------------------
// DistinationLocation — method call fn_addDestinationPoint + dispatch.
// ---------------------------------------------------------------------------
function reduceDistinationLocation(unit, msg) {
    const p = msg.payload;
    let destination_type = 0; // CONST_DESTINATION_GUIDED_POINT
    if (p.P !== null && p.P !== undefined) destination_type = p.P;
    return {
        patches: [{ path: 'm_Geo_Tags.p_DestinationPoint.m_isValid', value: true }],
        events: [{
            name: js_event.EE_DistinationPointChanged,
            payload: unit,
            method: 'm_Geo_Tags.fn_addDestinationPoint',
            methodArg: [p.T, p.O, p.A, destination_type],
        }],
    };
}

// ---------------------------------------------------------------------------
// DroneReport — dispatch EE_msgFromUnit_WayPointsUpdated.
// ---------------------------------------------------------------------------
function reduceDroneReport(unit, msg) {
    return {
        patches: [],
        events: [{ name: js_event.EE_msgFromUnit_WayPointsUpdated, payload: { unit, mir: msg.payload.P, status: msg.payload.R } }],
    };
}

// ---------------------------------------------------------------------------
// GPIO_STATUS — method call m_GPIOs.addGPIO + dispatch.
// ---------------------------------------------------------------------------
function reduceGPIOStatus(unit, msg) {
    return {
        patches: [],
        events: [{
            name: js_event.EE_unitGPIOUpdated,
            payload: unit,
            method: 'm_GPIOs.addGPIO',
            methodArg: msg.payload.s,
        }],
    };
}

// ---------------------------------------------------------------------------
// TELNET_STATUS — dispatch only.
// ---------------------------------------------------------------------------
function reduceTelnetStatus(unit, msg) {
    return {
        patches: [],
        events: [{ name: js_event.EE_unitTelnetStatus, payload: { unit, msg: msg.payload } }],
    };
}

// ---------------------------------------------------------------------------
// Error — dispatch EE_andruavUnitError.
// ---------------------------------------------------------------------------
function reduceError(unit, msg) {
    const p = msg.payload;
    return {
        patches: [],
        events: [{
            name: js_event.EE_andruavUnitError,
            payload: { unit, err: { errorNo: p.EN, infoType: p.IT, notification_Type: p.NT, Description: p.DS } },
        }],
    };
}

// ---------------------------------------------------------------------------
// GEOFenceHit — dispatch EE_andruavUnitGeoFenceHit.
// ---------------------------------------------------------------------------
function reduceGeoFenceHit(unit, msg) {
    const p = msg.payload;
    let m_shouldKeepOutside = false;
    if (typeof p.o === 'number') m_shouldKeepOutside = (p.o === 1);
    else if (typeof p.o === 'boolean') m_shouldKeepOutside = p.o;
    const geoFenceHitInfo = {
        hasValue: true, fenceName: p.n, m_inZone: p.z, m_shouldKeepOutside,
        distance: p.hasOwnProperty('d') ? p.d : Number.NaN,
    };
    return {
        patches: [],
        events: [{ name: js_event.EE_andruavUnitGeoFenceHit, payload: { unit, fenceHit: geoFenceHitInfo } }],
    };
}

// ---------------------------------------------------------------------------
// MODULE_HEALTH_STATUS — field writes + EE_unitUpdated.
// ---------------------------------------------------------------------------
function reduceModuleHealthStatus(unit, msg) {
    const p = msg.payload;
    if (!p || !p.k) return { patches: [], events: [] };
    return {
        patches: [{
            path: `m_moduleHealth.${p.k}`,
            value: { rss: p.rs, vmpeak: p.pk, vmswap: p.sw, threads: p.th, slope: p.sl, trend: p.tr, status: p.hs, uptime: p.up, timestamp: msg.receivedAt },
        }],
        events: [{ name: js_event.EE_unitUpdated, payload: unit }],
    };
}

// ---------------------------------------------------------------------------
// P2P_InRange_Node — merge detected nodes into m_P2P.m_detected_node.
// ---------------------------------------------------------------------------
function reduceP2PInRangeNode(unit, msg) {
    const p = msg.payload;
    if (!p || typeof p !== 'object') return { patches: [], events: [] };
    const node = {};
    try {
        Object.entries(p).forEach(([partyID, n]) => {
            n.t = n.t ?? 0;
            node[partyID] = { mac: n.m, partyID: n.p, connected: n.c, last_time: n.t };
        });
    } catch (e) { /* ignore */ }
    return {
        patches: [{ path: 'm_P2P.m_detected_node', value: { ...(unit.m_P2P.m_detected_node || {}), ...node } }],
        events: [{ name: js_event.EE_unitP2PUpdated, payload: unit }],
    };
}

// ---------------------------------------------------------------------------
// P2P_InRange_BSSID — merge detected BSSIDs into m_P2P.m_detected_bssid.
// ---------------------------------------------------------------------------
function reduceP2PInRangeBSSID(unit, msg) {
    const p = msg.payload;
    if (!p) return { patches: [], events: [] };
    const bssid = {};
    try {
        Object.entries(p).forEach(([partyID, b]) => {
            bssid[partyID] = { partyID: b.p, bssid: b.b, ssid: b.s, channel: b.c, rssi: b.r, last_time: b.t };
        });
    } catch (e) { /* ignore */ }
    return {
        patches: [{ path: 'm_P2P.m_detected_bssid', value: { ...(unit.m_P2P.m_detected_bssid || {}), ...bssid } }],
        events: [{ name: js_event.EE_unitP2PUpdated, payload: unit }],
    };
}

// ---------------------------------------------------------------------------
// P2P_INFO — field writes + EE_unitP2PUpdated.
// ---------------------------------------------------------------------------
function reduceP2PInfo(unit, msg) {
    const p = msg.payload;
    const patches = [
        { path: 'm_P2P.m_initialized', value: true },
        { path: 'm_P2P.m_connection_type', value: p.c },
        { path: 'm_P2P.m_address_1', value: p.a1 },
        { path: 'm_P2P.m_address_2', value: p.a2 },
        { path: 'm_P2P.m_wifi_channel', value: p.wc },
        { path: 'm_P2P.m_wifi_password', value: p.wp },
        { path: 'm_P2P.m_parent_address', value: p.pa },
        { path: 'm_P2P.m_parent_connected', value: p.pc },
        { path: 'm_P2P.m_logical_parent_address', value: p.lp },
        { path: 'm_P2P.m_firmware', value: p.f },
        { path: 'm_P2P.m_driver_connected', value: p.a },
        { path: 'm_P2P.m_p2p_connected', value: p.o },
        { path: 'm_P2P.m_p2p_disabled', value: (p.d !== null && p.d !== undefined) ? p.d : false },
    ];
    return { patches, events: [{ name: js_event.EE_unitP2PUpdated, payload: unit }] };
}

// ---------------------------------------------------------------------------
// SDR_ACTION — sub-switch with 3 cases. No facade call (the old null-unit
// requestID is dead code — fn_getOrCreateUnit always returns a unit).
// ---------------------------------------------------------------------------
function reduceSDRAction(unit, msg) {
    const p = msg.payload;
    switch (p.a) {
        case CONST_SDR_ACTION_SDR_INFO: {
            const patches = [
                { path: 'm_SDR.m_initialized', value: true },
                { path: 'm_SDR.m_center_frequency', value: p.fc },
                { path: 'm_SDR.m_display_bars', value: p.r },
                { path: 'm_SDR.m_gain', value: p.g },
                { path: 'm_SDR.m_sample_rate', value: p.s },
                { path: 'm_SDR.m_driver', value: p.n },
                { path: 'm_SDR.m_status', value: p.c },
                { path: 'm_SDR.m_interval', value: p.t },
                { path: 'm_SDR.m_trigger_level', value: p.l },
            ];
            return { patches, events: [{ name: js_event.EE_unitSDRUpdated, payload: unit }] };
        }
        case CONST_SDR_ACTION_LIST_SDR_DEVICES: {
            const patches = [{ path: 'm_SDR.m_available_drivers', value: p.dr === null ? [] : p.dr }];
            return { patches, events: [{ name: js_event.EE_unitSDRUpdated, payload: unit }] };
        }
        case CONST_SDR_ACTION_TRIGGER: {
            // addDetectedSignal is an impure unit method — use method dispatch.
            return {
                patches: [],
                events: [{
                    name: js_event.EE_unitSDRTrigger,
                    payload: unit,
                    method: 'm_SDR.addDetectedSignal',
                    methodArg: [p.f, p.v, p.ln, p.la, p.A, p.r, p.d],
                }],
            };
        }
        default:
            return { patches: [], events: [] };
    }
}

// ---------------------------------------------------------------------------
// RemoteExecute — sub-switch. The ID case calls API_sendID (facade) -> Command.
// ---------------------------------------------------------------------------
function reduceRemoteExecute(unit, msg) {
    const p = msg.payload;
    // The only live case in the sub-switch is CONST_TYPE_AndruavMessage_ID ->
    // API_sendID. That becomes a Command returned by effects.
    return { patches: [], events: [], remoteExecuteC: p.C };
}

// ---------------------------------------------------------------------------
// Viewlink_STATUS — gimbal attitude + LRF, method calls + dispatch.
// ---------------------------------------------------------------------------
function reduceViewlinkStatus(unit, msg) {
    const p = msg.payload;
    switch (p.a) {
        case VIEWLINK_STATUS_GIMBAL_ATTITUDE: {
            return {
                patches: [],
                events: [{
                    name: js_event.EE_viewLinkGimbalAttitude,
                    payload: { gm: { y: p.y ?? 0, p: p.p ?? 0, r: p.r ?? 0 } },
                    method: 'm_Gimbal.setOrientation',
                    methodArg: [p.y ?? 0, p.p ?? 0, p.r ?? 0],
                }],
            };
        }
        case VIEWLINK_STATUS_ALL: {
            const gmSrc = p.gm || {};
            const lrt = p.lrf || {};
            const events = [
                { name: js_event.EE_viewLinkGimbalAttitude, payload: { gm: { y: gmSrc.y ?? 0, p: gmSrc.p ?? 0, r: gmSrc.r ?? 0 }, tr: p.tr || p.tracking || {}, lrf: p.lrf || {}, ai: p.ai || {}, g: p.g || {} }, method: 'm_Gimbal.setOrientation', methodArg: [gmSrc.y ?? 0, gmSrc.p ?? 0, gmSrc.r ?? 0] },
                { name: '__viewlinkLRF', payload: unit, method: 'm_Gimbal.setLRF', methodArg: [lrt.d, lrt.a] },
            ];
            return { patches: [], events };
        }
        default:
            return { patches: [], events: [] };
    }
}

// ---------------------------------------------------------------------------
// GeoFence / ExternalGeoFence / GeoFenceAttachStatus
//
// fn_parseFenceInfo is the pure body of the old #prv_parseFenceInfo: it builds
// a geoFenceInfo object from the payload. It does NOT dispatch — the reducer
// wraps its output in an EE_andruavUnitGeoFenceUpdated event.
// ---------------------------------------------------------------------------
function fn_parseFenceInfo(p_jmsg, p_andruavUnit) {
    let fencetype;
    let m_shouldKeepOutside = false;

    let v_geoFenceName = p_jmsg.n;
    let v_maximumDistance = (p_jmsg.hasOwnProperty('r')) ? p_jmsg.r : 0;
    if (p_jmsg.hasOwnProperty('o')) {
        if (typeof p_jmsg.o === 'number') {
            m_shouldKeepOutside = (p_jmsg.o === 1);
        } else if (typeof p_jmsg.o === 'boolean') {
            m_shouldKeepOutside = p_jmsg.o;
        }
    }
    if (p_jmsg.hasOwnProperty('t')) {
        switch (p_jmsg.t) {
            case 1: fencetype = CONST_TYPE_LinearFence; break;
            case 2: fencetype = CONST_TYPE_PolygonFence; break;
            case 3: fencetype = CONST_TYPE_CylinderFence; break;
        }
    }

    let geoFenceInfo = {};
    let LngLatPoints = [];
    let count = (fencetype === CONST_TYPE_CylinderFence) ? 1 : p_jmsg.c;
    for (let i = 0; i < count; ++i) {
        let lnglat = {};
        lnglat.lat = parseFloat(p_jmsg[i].a);
        lnglat.lng = parseFloat(p_jmsg[i].g);
        if (p_jmsg[i].hasOwnProperty('l')) lnglat.alt = parseFloat(p_jmsg[i].l);
        else lnglat.alt = 0;
        LngLatPoints.push(lnglat);
    }
    geoFenceInfo.m_shouldKeepOutside = m_shouldKeepOutside;
    geoFenceInfo.fencetype = fencetype;
    geoFenceInfo.LngLatPoints = LngLatPoints;
    geoFenceInfo.m_geoFenceName = v_geoFenceName;
    geoFenceInfo.m_maximumDistance = v_maximumDistance;
    geoFenceInfo.isEditable = (p_andruavUnit === null || p_andruavUnit === undefined);
    return geoFenceInfo;
}

function reduceGeoFence(unit, msg) {
    const fence = fn_parseFenceInfo(msg.payload, unit);
    return {
        patches: [],
        events: [{ name: js_event.EE_andruavUnitGeoFenceUpdated, payload: { unit, fence } }],
    };
}

function reduceExternalGeoFence(unit, msg) {
    // senderName === '_sys_' guard is a transport-level concern checked by
    // runtime before calling reduce. unit is null -> isEditable = true.
    const fence = fn_parseFenceInfo(msg.payload, null);
    return {
        patches: [],
        events: [{ name: js_event.EE_andruavUnitGeoFenceUpdated, payload: { unit: null, fence } }],
    };
}

// GeoFenceAttachStatus reads/writes the shared fence registry — that is an
// impure runtime concern. The reducer returns a declarative attach/detach
// intent as a runtime-only pseudo-event; runtime applies it to
// js_geoFenceRegistry and dispatches __facadeRequestGeoFences when a fence
// is missing.
function reduceGeoFenceAttachStatus(unit, msg) {
    const p = msg.payload;
    return {
        patches: [],
        events: [{
            name: '__geoFenceAttach',
            payload: { unit, fenceName: p.n, isAttached: p.a },
        }],
    };
}

// ---------------------------------------------------------------------------
// WayPoints — chunked waypoint download.
//
// fn_decodeWaypointStep is the pure 10-case sub-switch over waypointType.
// fn_decodeWaypoints decodes the full payload into { wps, isChunk }.
// reduceWayPoints returns the decoded waypoints; runtime owns the cache
// and the dispatch decision (full message dispatches immediately, chunked
// dispatches only on the last chunk).
// ---------------------------------------------------------------------------
function fn_decodeWaypointStep(item) {
    const wayPointStep = {};
    wayPointStep.waypointType = item.t;
    switch (wayPointStep.waypointType) {
        case CONST_WayPoint_TYPE_WAYPOINTSTEP:
            wayPointStep.m_Sequence = item.s;
            wayPointStep.Longitude = item.g;
            wayPointStep.Latitude = item.a;
            wayPointStep.Altitude = item.l;
            wayPointStep.Heading = item.h;
            wayPointStep.TimeToStay = item.y;
            break;
        case CONST_WayPoint_TYPE_SPLINE:
            wayPointStep.m_Sequence = item.s;
            wayPointStep.Longitude = item.g;
            wayPointStep.Latitude = item.a;
            wayPointStep.Altitude = item.l;
            wayPointStep.TimeToStay = item.y;
            break;
        case CONST_WayPoint_TYPE_TAKEOFF:
            wayPointStep.m_Sequence = item.s;
            wayPointStep.Altitude = item.l;
            wayPointStep.Pitch = item.p;
            break;
        case CONST_WayPoint_TYPE_LANDING:
            wayPointStep.m_Sequence = item.s;
            break;
        case CONST_WayPoint_TYPE_RTL:
            wayPointStep.m_Sequence = item.s;
            break;
        case CONST_WayPoint_TYPE_CAMERA_TRIGGER:
            wayPointStep.m_Sequence = item.s;
            break;
        case CONST_WayPoint_TYPE_CAMERA_CONTROL:
            wayPointStep.m_Sequence = item.s;
            break;
        case CONST_WayPoint_TYPE_GUIDED:
            wayPointStep.m_Sequence = item.s;
            wayPointStep.Enable = item.e;
            break;
        case CONST_WayPoint_TYPE_ChangeAlt:
            wayPointStep.m_Sequence = item.s;
            wayPointStep.AscentDescentRate = item.r;
            break;
        case CONST_WayPoint_TYPE_CMissionAction_CONTINUE_AND_CHANGE_ALT:
            wayPointStep.m_Sequence = item.s;
            wayPointStep.AscentorDescent = item.c;
            wayPointStep.DesiredAltitude = item.a;
            break;
        case CONST_WayPoint_TYPE_CIRCLE:
            wayPointStep.m_Sequence = item.s;
            wayPointStep.Longitude = item.g;
            wayPointStep.Latitude = item.a;
            wayPointStep.Altitude = item.l;
            if (item.hasOwnProperty('q')) {
                wayPointStep.m_Header_Required = item.q;
            } else {
                wayPointStep.m_Header_Required = false;
            }
            if (item.hasOwnProperty('x')) {
                wayPointStep.m_Xtrack_Location = item.x;
            } else {
                wayPointStep.m_Xtrack_Location = 0;
            }
            wayPointStep.m_Radius = item.r;
            wayPointStep.m_Turns = item.n;
            break;
    }
    return wayPointStep;
}

function reduceWayPoints(unit, msg) {
    const p = msg.payload;
    const isChunk = p.hasOwnProperty('i') ? p.i : WAYPOINT_NO_CHUNK;
    const count = p.n;
    const wps = [];
    for (let i = 0; i < count; ++i) {
        if (p[i] != null) {
            wps.push(fn_decodeWaypointStep(p[i]));
        }
    }
    // Return the decoded waypoints; runtime owns the cache + dispatch.
    return { patches: [], events: [], waypoints: { wps, isChunk } };
}

// ---------------------------------------------------------------------------
// SearchTargetList / TargetTrackingtLocation — experimental tracking messages.
//
// Both are gated by CONST_EXPERIMENTAL_FEATURES_ENABLED. That flag check is a
// transport-level decision (drop the message before any side effect) and
// lives in runtime.js, not here. reduce stays pure: it uses msg.receivedAt
// instead of the wall clock for lastUpdate.
// ---------------------------------------------------------------------------
function reduceSearchTargetList(unit, msg) {
    const p = msg.payload;
    if (!p.hasOwnProperty('t')) return { patches: [], events: [] };
    const targets = {};
    for (const item of p.t) {
        const c_search_target = {};
        c_search_target.m_name = item.n;
        c_search_target.m_type = item.hasOwnProperty('t') ? item.t : 'na';
        targets[c_search_target.m_name] = c_search_target;
    }
    return {
        patches: [{ path: 'm_DetectedTargets.m_searchable_targets', value: targets }],
        events: [{ name: js_event.EE_SearchableTarget, payload: unit }],
    };
}

function reduceTargetTrackingLocation(unit, msg) {
    const items = msg.payload.t;
    const list = [];
    for (const item of items) {
        const c_target = {};
        c_target.x1 = item.a;
        c_target.y1 = item.b;
        if (item.hasOwnProperty('r')) {
            c_target.m_radius = item.r;
        } else {
            c_target.x2 = item.c;
            c_target.y2 = item.d;
        }
        if (item.hasOwnProperty('p')) {
            c_target.m_propability = item.p;
        }
        c_target.m_name = item.hasOwnProperty('n') ? item.n : 'default';
        c_target.lastUpdate = msg.receivedAt; // pure: use receivedAt, not the wall clock
        list.push(c_target);
    }
    return {
        patches: [{ path: 'm_DetectedTargets.m_targets.m_list', value: list }],
        events: [{ name: js_event.EE_DetectedTarget, payload: unit }],
    };
}

// ---------------------------------------------------------------------------
// CameraList / SOUND_LIST — field writes + dispatch + optional request/reply.
//
// The reply callback (R === true) is an impure runtime concern. The reducer
// signals it as a __callbackReply pseudo-event; runtime calls
// js_callbackRegistry.fn_fireOnce. This keeps reduce pure.
// ---------------------------------------------------------------------------
function reduceCameraList(unit, msg) {
    const p = msg.payload;
    // The old case skips everything when T is empty (no available camera).
    if (!p.T || p.T.length === 0) return { patches: [], events: [] };
    const patches = [{ path: 'm_Video.m_videoTracks', value: p.T }];
    const events = [{ name: js_event.EE_unitUpdated, payload: unit }];
    if (p.R === true) {
        events.push({ name: '__callbackReply', payload: {
            messageType: CONST_TYPE_AndruavMessage_CameraList,
            session: { status: 'connected', m_unit: unit } } });
    }
    return { patches, events };
}

function reduceSoundList(unit, msg) {
    const p = msg.payload;
    const patches = [{ path: 'm_Sound.m_files', value: Array.isArray(p.T) ? p.T : [] }];
    const events = [{ name: js_event.EE_onSoundListUpdated, payload: unit }];
    if (p.R === true) {
        events.push({ name: '__callbackReply', payload: {
            messageType: CONST_TYPE_AndruavMessage_SOUND_LIST,
            session: { status: 'connected', m_unit: unit } } });
    }
    return { patches, events };
}

// ---------------------------------------------------------------------------
// CONFIG_STATUS — request/reply for module config templates.
//
// The reply (R === true) needs the unit's module registry, which is an
// impure runtime concern. The reducer returns a __configStatusReply
// pseudo-event; runtime resolves the module, sets the template, and fires
// the callback once via js_callbackRegistry.
// ---------------------------------------------------------------------------
function reduceConfigStatus(unit, msg) {
    const p = msg.payload;
    if (p.R !== true) return { patches: [], events: [] };
    return {
        patches: [],
        events: [{ name: '__configStatusReply', payload: {
            unit, moduleKey: p.k, template: p.b } }],
    };
}

// Signaling — WebRTC SDP/ICE/hangup delivery. The signal is payload.w when
// present (wrapped form), otherwise the bare payload. Dispatch
// EE_andruavSignalling with { unit, signal }; js_webrtcthin2 subscribes and
// invokes the existing handler.
function reduceSignaling(unit, msg) {
    const p = msg.payload;
    const signal = (p && p.hasOwnProperty('w')) ? p.w : p;
    return {
        patches: [],
        events: [{ name: js_event.EE_andruavSignalling, payload: { unit, signal } }],
    };
}

/**
 * Effects for the ID message — the facade calls that were inline in
 * _handleUnitIDMessage and #prv_onNewUnitAdded. Returns Command[].
 * Takes the reduce result (for isNewUnit) and the post-ops unit (for module
 * flags set by addModules). Called by effects.js (which stays pure).
 */
export function reduceIDEffects(unit, reduceResult) {
    const cmds = [];
    if (reduceResult.isNewUnit) {
        // #prv_onNewUnitAdded: 3 requests.
        cmds.push({ kind: 'REQUEST_GEOFENCE_STATUS' });
        cmds.push({ kind: 'REQUEST_UDP_PROXY_STATUS' });
        cmds.push({ kind: 'REQUEST_WAYPOINTS' });
    }
    // Delayed P2P request if module has p2p and not yet initialized.
    if (unit.m_modules.has_p2p && !unit.m_P2P.m_initialized) {
        cmds.push({ kind: 'REQUEST_P2P', delayMs: 1000 });
    }
    // Delayed SDR request if module has sdr and not yet initialized.
    if (unit.m_modules.has_sdr && !unit.m_SDR.m_initialized) {
        cmds.push({ kind: 'REQUEST_SDR', delayMs: 1000 });
    }
    return cmds;
}
