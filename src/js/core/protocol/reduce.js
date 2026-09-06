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
         CONST_TYPE_AndruavMessage_Communication_Line_Status } from '../../protocol/messages/js_andruavMessages.js';

import { EVENTS as js_event } from '../../events/js_eventList.js';

/**
 * @param {object} unit
 * @param {import('./types.js').Message} msg
 * @returns {{patches: import('./types.js').FieldPatch[], events: import('./types.js').Dispatch[]} | null}
 */
export function fn_reduce(unit, msg) {
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
        default:
            // Not yet migrated — runtime falls through to the old switch.
            return null;
    }
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
