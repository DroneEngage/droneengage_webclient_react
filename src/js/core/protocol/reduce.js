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
         CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST } from '../../protocol/messages/js_andruavMessages.js';

import { EVENTS as js_event } from '../../events/js_eventList.js';

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
        || type === CONST_TYPE_AndruavMessage_AI_Recognition_STATUS;
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
        }],
    };
}
