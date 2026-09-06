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
         CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST,
         CONST_TASHKEEL_SERB_NO_SWARM,
         CONST_Unknown_Telemetry } from '../../protocol/messages/js_andruavMessages.js';

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
        case CONST_TYPE_AndruavMessage_ID:
            return reduceID(unit, msg);
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
        || type === CONST_TYPE_AndruavMessage_ID;
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
                T: p.T, AP: p.AP, VT: p.VT, GS: p.GS, UD: p.UD, DS: p.DS, p: p.p } });
        }
    }

    // Phase 3: modules.
    if (p.m1) {
        triggers.onModuleChanged = p.m1.length !== unit.m_modules.m_list.length;
        ops.push({ op: 'method', method: 'm_modules.addModules', arg: p.m1 });
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
