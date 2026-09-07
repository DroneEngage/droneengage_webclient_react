/**
 * TASK-02 — reduce.test.js
 *
 * The "real acceptance test" for TASK-02: fn_decode + fn_reduce run with
 * captured raw frames as string literals, assert the exact FieldPatch[],
 * and open NO socket and NO DOM.
 *
 * Frames below are reconstructed from the exact wire format documented in
 * js_andruav_parser.js (the field keys `la`, `ln`, `a`, `r`, `3D`, `SC`, ...)
 * — the shared protocol with de_comm and Android clients, unchanged.
 */
import { fn_decode } from './decode.js';
import { fn_reduce } from './reduce.js';
import { fn_setByPath, fn_getByPath } from './path.js';

import { CAndruavUnitObject } from '../../js_andruavUnit.js';
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
         CONST_TYPE_AndruavMessage_GeoFence,
         CONST_TYPE_AndruavMessage_ExternalGeoFence,
         CONST_TYPE_AndruavMessage_GeoFenceAttachStatus,
         CONST_TYPE_AndruavMessage_WayPoints,
         CONST_TYPE_AndruavMessage_SearchTargetList,
         CONST_TYPE_AndruavMessage_TargetTrackingtLocation,
         CONST_TYPE_AndruavMessage_CameraList,
         CONST_TYPE_AndruavMessage_SOUND_LIST,
         CONST_TYPE_AndruavMessage_CONFIG_STATUS,
         CONST_TYPE_AndruavMessage_Signaling,
         CONST_TYPE_LinearFence,
         CONST_TYPE_PolygonFence,
         CONST_TYPE_CylinderFence,
         CONST_WayPoint_TYPE_WAYPOINTSTEP,
         CONST_WayPoint_TYPE_TAKEOFF,
         CONST_WayPoint_TYPE_CIRCLE,
         CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST,
         CONST_TASHKEEL_SERB_NO_SWARM,
         CONST_Unknown_Telemetry } from '../../protocol/messages/js_andruavMessages.js';
import { EVENTS as js_event } from '../../events/js_eventList.js';

function makeUnit() {
    const u = new CAndruavUnitObject();
    u.init();
    u.setPartyID('party-test');
    return u;
}

// A WS frame as produced by #prv_parseJSONMessage: {messageType, senderName, msgPayload, ...}
function frame(messageType, senderName, payload) {
    return { _ty: 2, groupID: 'g', senderName, messageType, msgPayload: payload };
}

describe('TASK-02 fn_decode + fn_reduce (no socket, no DOM)', () => {
    test('GPS: full frame produces exact patches + EE_msgFromUnit_GPS event', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GPS, 'party-uav-1', {
            '3D': 3, SC: 12, c: 1.5, p: 'gps',
            la: 30.05, ln: 31.23, a: '100.5', r: '50.2',
            t: 1700000000000, s: '15.5', b: '90',
        });
        const receivedAt = 1700000001234;
        const msg = fn_decode(raw, receivedAt);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result).not.toBeNull();
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });

        expect(byPath['m_GPS_Info1.m_isValid']).toBe(true);
        expect(byPath['m_GPS_Info1.GPS3DFix']).toBe(3);
        expect(byPath['m_GPS_Info1.m_satCount']).toBe(12);
        expect(byPath['m_GPS_Info1.accuracy']).toBe(1.5);
        expect(byPath['m_GPS_Info1.provider']).toBe('gps');
        expect(byPath['m_Nav_Info.p_Location.lat']).toBe(30.05);
        expect(byPath['m_Nav_Info.p_Location.lng']).toBe(31.23);
        expect(byPath['m_Nav_Info.p_Location.alt_abs']).toBeCloseTo(100.5);
        expect(byPath['m_Nav_Info.p_Location.alt_relative']).toBeCloseTo(50.2);
        expect(byPath['m_Nav_Info.p_Location.time']).toBe(1700000000000);
        expect(byPath['m_Nav_Info.p_Location.ground_speed']).toBeCloseTo(15.5);
        expect(byPath['m_Nav_Info.p_Location.bearing']).toBeCloseTo(90);

        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe(js_event.EE_msgFromUnit_GPS);
    });

    test('GPS: null lat -> m_isValid false; missing optional fields omitted', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GPS, 'u', {
            '3D': 0, SC: 5, p: 'gps',
            la: null, ln: 31.0, a: '10', r: '5',
        });
        const msg = fn_decode(raw, 1234);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });

        expect(byPath['m_GPS_Info1.m_isValid']).toBe(false);
        expect(byPath['m_GPS_Info1.accuracy']).toBe(0); // missing 'c' -> 0
        // missing 't' -> receivedAt
        expect(byPath['m_Nav_Info.p_Location.time']).toBe(1234);
        // missing 's' and 'b' -> no patches for them
        expect(byPath['m_Nav_Info.p_Location.ground_speed']).toBeUndefined();
        expect(byPath['m_Nav_Info.p_Location.bearing']).toBeUndefined();
    });

    test('GPS: stringified payload is JSON.parsed by fn_decode (backward compat)', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GPS, 'u',
            JSON.stringify({ '3D': 3, SC: 8, p: 'gps', la: 1, ln: 2, a: '3', r: '1' }));
        const msg = fn_decode(raw, 1);
        expect(typeof msg.payload).toBe('object');
        expect(msg.payload.SC).toBe(8);
        const result = fn_reduce(makeUnit(), msg);
        expect(result).not.toBeNull();
    });

    test('POW: mobile + FCB battery block', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_POW, 'u', {
            BL: 80, V: 12.5, BT: 35, H: 2, PS: 1,
            FV: 22.2, FI: 1.5, FR: 70, T: 34, C: 500,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });

        expect(byPath['m_Power._Mobile.p_Battery.BatteryLevel']).toBe(80);
        expect(byPath['m_Power._Mobile.p_Battery.Voltage']).toBe(12.5);
        expect(byPath['m_Power._FCB.p_Battery.p_hasPowerInfo']).toBe(true);
        expect(byPath['m_Power._FCB.p_Battery.FCB_BatteryVoltage']).toBe(22.2);
        expect(byPath['m_Power._FCB.p_Battery.FCB_BatteryTemprature']).toBe(34);
        expect(byPath['m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed']).toBe(500);
        expect(result.events[0].name).toBe(js_event.EE_unitPowUpdated);
    });

    test('POW: no FV -> FCB p_hasPowerInfo false', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_POW, 'u', {
            BL: 80, V: 12.5, BT: 35, H: 2, PS: 1,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });
        expect(byPath['m_Power._FCB.p_Battery.p_hasPowerInfo']).toBe(false);
    });

    test('NAV_INFO: orientation + target fields parsed as floats', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_NAV_INFO, 'u', {
            a: '0.1', b: '0.2', y: '1.5', d: '45', e: '120', f: '2.5',
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });

        expect(byPath['m_Nav_Info.p_Orientation.roll']).toBeCloseTo(0.1);
        expect(byPath['m_Nav_Info.p_Orientation.pitch']).toBeCloseTo(0.2);
        expect(byPath['m_Nav_Info.p_Orientation.yaw']).toBeCloseTo(1.5);
        expect(byPath['m_Nav_Info._Target.target_bearing']).toBeCloseTo(45);
        expect(byPath['m_Nav_Info._Target.wp_dist']).toBeCloseTo(120);
        expect(byPath['m_Nav_Info._Target.alt_error']).toBeCloseTo(2.5);
        expect(result.events[0].name).toBe(js_event.EE_unitNavUpdated);
    });

    test('CommSignalsStatus: mobile signal fields, no events', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_CommSignalsStatus, 'u', {
            r: 4, s: 'LTE', op: 'Carrier', c: 'us', ds: 'connected',
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });

        expect(byPath['m_SignalStatus.m_mobile']).toBe(true);
        expect(byPath['m_SignalStatus.m_mobileSignalLevel']).toBe(4);
        expect(byPath['m_SignalStatus.m_mobileNetworkType']).toBe('LTE');
        expect(byPath['m_SignalStatus.m_operatorName']).toBe('Carrier');
        expect(byPath['m_SignalStatus.m_countryIso']).toBe('us');
        expect(byPath['m_SignalStatus.m_dataState']).toBe('connected');
        // rank is computed by runtime (needs js_helpers), not reduce
        expect(result.events).toHaveLength(0);
    });

    test('Communication_Line_Status: websocket + p2p fields', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_Communication_Line_Status, 'u', {
            ws: 1, p2p: true,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });

        expect(byPath['m_SignalStatus.m_websocket']).toBe(1);
        expect(byPath['m_P2P.m_p2p_disabled']).toBe(false);
        expect(result.events).toHaveLength(0);
    });

    test('unmigrated type returns null (fall through to old switch)', () => {
        const raw = frame(99999, 'u', {});
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result).toBeNull();
    });

    test('Chat: dispatch only, no patches', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_Chat, 'u', { text: 'hello' });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);
        expect(result.patches).toHaveLength(0);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe(js_event.EE_onChatMessage);
        expect(result.events[0].payload.unit).toBe(unit);
        expect(result.events[0].payload.message).toEqual({ text: 'hello' });
    });

    test('UdpProxy_Info: fields + EE_onProxyInfoUpdated', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_UdpProxy_Info, 'u', {
            a: '192.168.1.1', p: 14550, o: 2, en: true, z: true,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });
        expect(byPath['m_Telemetry.m_udpProxy_ip']).toBe('192.168.1.1');
        expect(byPath['m_Telemetry.m_udpProxy_port']).toBe(14550);
        expect(byPath['m_Telemetry.m_telemetry_level']).toBe(2);
        expect(byPath['m_Telemetry.m_udpProxy_active']).toBe(true);
        expect(byPath['m_Telemetry.m_udpProxy_paused']).toBe(true);
        expect(result.events[0].name).toBe(js_event.EE_onProxyInfoUpdated);
    });

    test('UdpProxy_Info: missing z -> paused false', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_UdpProxy_Info, 'u', {
            a: '1.1.1.1', p: 1, o: 0, en: false,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const byPath = {};
        result.patches.forEach(p => { byPath[p.path] = p.value; });
        expect(byPath['m_Telemetry.m_udpProxy_paused']).toBe(false);
    });

    test('TargetTracking_STATUS: method dispatch + event', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_TargetTracking_STATUS, 'u', { active: true });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.patches).toHaveLength(0);
        expect(result.events[0].name).toBe(js_event.EE_onTrackingStatusChanged);
        expect(result.events[0].method).toBe('m_tracker.fn_updateTrackerStatus');
        expect(result.events[0].methodArg).toEqual({ active: true });
    });

    test('AI_Recognition_STATUS: class list sub-case', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_AI_Recognition_STATUS, 'u', {
            a: CONST_TargetTracking_STATUS_AI_Recognition_CLASS_LIST, c: ['car', 'person'],
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.events[0].name).toBe(js_event.EE_onTrackingAIObjectListUpdate);
        expect(result.events[0].method).toBe('m_tracker_ai.fn_addObjectClass');
        expect(result.events[0].methodArg).toEqual([['car', 'person']]);
    });

    test('AI_Recognition_STATUS: status sub-case', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_AI_Recognition_STATUS, 'u', { a: 2 });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.events[0].name).toBe(js_event.EE_onTrackingAIStatusChanged);
        expect(result.events[0].method).toBe('m_tracker_ai.fn_updateTrackerStatus');
        expect(result.events[0].methodArg).toBe(2);
    });

    test('ID: new unit produces ordered ops with field writes + EE_andruavUnitAdded', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_ID, 'party-new', {
            GS: false, UD: 'Drone1', DS: 'desc', VT: 1, VR: false, GM: 0,
            p: 7, FI: true, TP: 0, T: 123, AP: 0,
            AR: true, FM: 4, FL: false,
            m1: [{ k: 'mav', n: 'de_mavlink' }],
        });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit(); // m_defined = false -> isNewUnit
        const result = fn_reduce(unit, msg);

        expect(result.ops).toBeDefined();
        expect(result.isNewUnit).toBe(true);

        // First ops are field writes
        const sets = result.ops.filter(o => o.op === 'set');
        const setPaths = sets.map(o => o.path);
        expect(setPaths).toContain('m_unitName');
        expect(setPaths).toContain('m_VehicleType');
        expect(setPaths).toContain('m_isArmed');
        expect(setPaths).toContain('m_defined');

        // setPartyID method call
        const methods = result.ops.filter(o => o.op === 'method');
        expect(methods.some(o => o.method === 'setPartyID')).toBe(true);
        expect(methods.some(o => o.method === 'm_modules.addModules')).toBe(true);

        // EE_andruavUnitAdded for new unit (not EE_unitUpdated)
        const dispatches = result.ops.filter(o => o.op === 'dispatch');
        expect(dispatches.some(o => o.name === js_event.EE_andruavUnitAdded)).toBe(true);
        expect(dispatches.some(o => o.name === js_event.EE_andruavUnitArmedUpdated)).toBe(true);
    });

    test('ID: existing unit with arming change triggers EE_andruavUnitArmedUpdated', () => {
        const unit = makeUnit();
        unit.m_defined = true;
        unit.m_isArmed = false;
        unit.m_is_ready_to_arm = false;
        unit.m_useFCBIMU = true; // no reset triggered
        unit.m_telemetry_protocol = CONST_Unknown_Telemetry;

        const raw = frame(CONST_TYPE_AndruavMessage_ID, 'party-test', {
            GS: false, UD: 'Drone1', DS: 'd', VT: 1, VR: false, GM: 0,
            p: 7, FI: true, TP: CONST_Unknown_Telemetry,
            AR: true, FM: 4,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(unit, msg);

        expect(result.isNewUnit).toBe(false);
        const dispatches = result.ops.filter(o => o.op === 'dispatch');
        // AR changed from false to true -> onArmed trigger
        expect(dispatches.some(o => o.name === js_event.EE_andruavUnitArmedUpdated)).toBe(true);
        // existing unit -> EE_unitUpdated, not EE_andruavUnitAdded
        expect(dispatches.some(o => o.name === js_event.EE_unitUpdated)).toBe(true);
        expect(dispatches.some(o => o.name === js_event.EE_andruavUnitAdded)).toBe(false);
    });

    test('ID: FCB board connection triggers fn_resetOnBoardConnection method', () => {
        const unit = makeUnit();
        unit.m_defined = true;
        unit.m_isArmed = false;
        unit.m_useFCBIMU = false; // board NOT connected
        unit.m_telemetry_protocol = CONST_Unknown_Telemetry;

        const raw = frame(CONST_TYPE_AndruavMessage_ID, 'party-test', {
            GS: false, UD: 'D', DS: 'd', VT: 1, VR: false, GM: 0,
            p: 7, FI: true, TP: 0, // FI changes false->true -> reset
            AR: false, FM: 0,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(unit, msg);

        const methods = result.ops.filter(o => o.op === 'method');
        expect(methods.some(o => o.method === 'fn_resetOnBoardConnection')).toBe(true);
        // onFCB trigger should fire
        const dispatches = result.ops.filter(o => o.op === 'dispatch');
        expect(dispatches.some(o => o.name === js_event.EE_andruavUnitFCBUpdated)).toBe(true);
    });

    test('ID: swarm fields produce EE_onAndruavUnitSwarmUpdated', () => {
        const unit = makeUnit();
        unit.m_defined = true;
        unit.m_isArmed = false;
        unit.m_useFCBIMU = true;
        unit.m_telemetry_protocol = CONST_Unknown_Telemetry;
        unit.m_Swarm.m_formation_as_follower = CONST_TASHKEEL_SERB_NO_SWARM;
        unit.m_Swarm.m_isLeader = false;

        const raw = frame(CONST_TYPE_AndruavMessage_ID, 'u', {
            GS: false, UD: 'D', DS: 'd', VT: 1, VR: false, GM: 0,
            p: 7, FI: true, TP: CONST_Unknown_Telemetry,
            AR: false, FM: 0, n: 1, o: 2, q: 'leader-id',
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(unit, msg);
        const dispatches = result.ops.filter(o => o.op === 'dispatch');
        expect(dispatches.some(o => o.name === js_event.EE_onAndruavUnitSwarmUpdated)).toBe(true);
    });

    // --- TASK-02.1: geofence messages ---

    test('GeoFence: linear fence produces EE_andruavUnitGeoFenceUpdated with fence info', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GeoFence, 'party-uav-1', {
            n: 'fence-linear', t: 1, c: 2, o: 1, r: 500,
            0: { a: '30.05', g: '31.23', l: '100' },
            1: { a: '30.06', g: '31.24', l: '110' },
        });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result.patches).toHaveLength(0);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe(js_event.EE_andruavUnitGeoFenceUpdated);
        const fence = result.events[0].payload.fence;
        expect(fence.m_geoFenceName).toBe('fence-linear');
        expect(fence.fencetype).toBe(CONST_TYPE_LinearFence);
        expect(fence.m_shouldKeepOutside).toBe(true);
        expect(fence.m_maximumDistance).toBe(500);
        expect(fence.isEditable).toBe(false); // unit is non-null
        expect(fence.LngLatPoints).toHaveLength(2);
        expect(fence.LngLatPoints[0].lat).toBeCloseTo(30.05);
        expect(fence.LngLatPoints[0].lng).toBeCloseTo(31.23);
        expect(fence.LngLatPoints[0].alt).toBeCloseTo(100);
        expect(result.events[0].payload.unit).toBe(unit);
    });

    test('GeoFence: polygon fence with boolean o', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GeoFence, 'u', {
            n: 'fence-poly', t: 2, c: 3, o: false,
            0: { a: '1', g: '2' },
            1: { a: '3', g: '4' },
            2: { a: '5', g: '6' },
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const fence = result.events[0].payload.fence;
        expect(fence.fencetype).toBe(CONST_TYPE_PolygonFence);
        expect(fence.m_shouldKeepOutside).toBe(false);
        expect(fence.LngLatPoints).toHaveLength(3);
        // missing 'l' -> alt 0
        expect(fence.LngLatPoints[0].alt).toBe(0);
    });

    test('GeoFence: cylinder fence reads only 1 point', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GeoFence, 'u', {
            n: 'fence-cyl', t: 3, c: 5, r: 200, o: 1,
            0: { a: '10', g: '20', l: '30' },
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const fence = result.events[0].payload.fence;
        expect(fence.fencetype).toBe(CONST_TYPE_CylinderFence);
        expect(fence.m_maximumDistance).toBe(200);
        expect(fence.LngLatPoints).toHaveLength(1); // cylinder: count=1 regardless of c
    });

    test('ExternalGeoFence: unit is null -> isEditable true', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_ExternalGeoFence, '_sys_', {
            n: 'ext-fence', t: 1, c: 1, o: true,
            0: { a: '1', g: '2', l: '3' },
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const fence = result.events[0].payload.fence;
        expect(fence.isEditable).toBe(true);
        expect(result.events[0].payload.unit).toBeNull();
    });

    test('GeoFenceAttachStatus: returns __geoFenceAttach pseudo-event', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GeoFenceAttachStatus, 'u', { n: 'fence-1', a: true });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);
        expect(result.patches).toHaveLength(0);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe('__geoFenceAttach');
        expect(result.events[0].payload.unit).toBe(unit);
        expect(result.events[0].payload.fenceName).toBe('fence-1');
        expect(result.events[0].payload.isAttached).toBe(true);
    });

    test('GeoFenceAttachStatus: detach intent', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_GeoFenceAttachStatus, 'u', { n: 'fence-1', a: false });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.events[0].payload.isAttached).toBe(false);
    });

    // --- TASK-02.2: WayPoints message ---

    test('WayPoints: full (non-chunked) frame with 3 waypoint types', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_WayPoints, 'party-uav-1', {
            n: 3,
            0: { t: CONST_WayPoint_TYPE_WAYPOINTSTEP, s: 1, g: 31.0, a: 30.0, l: 100, h: 45, y: 5 },
            1: { t: CONST_WayPoint_TYPE_TAKEOFF, s: 2, l: 50, p: 10 },
            2: { t: CONST_WayPoint_TYPE_CIRCLE, s: 3, g: 31.1, a: 30.1, l: 80, r: 50, n: 2, q: true, x: 1 },
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);

        expect(result.waypoints).toBeDefined();
        expect(result.waypoints.isChunk).toBe(0); // WAYPOINT_NO_CHUNK
        const wps = result.waypoints.wps;
        expect(wps).toHaveLength(3);

        expect(wps[0].waypointType).toBe(CONST_WayPoint_TYPE_WAYPOINTSTEP);
        expect(wps[0].m_Sequence).toBe(1);
        expect(wps[0].Longitude).toBe(31.0);
        expect(wps[0].Latitude).toBe(30.0);
        expect(wps[0].Altitude).toBe(100);
        expect(wps[0].Heading).toBe(45);
        expect(wps[0].TimeToStay).toBe(5);

        expect(wps[1].waypointType).toBe(CONST_WayPoint_TYPE_TAKEOFF);
        expect(wps[1].Altitude).toBe(50);
        expect(wps[1].Pitch).toBe(10);

        expect(wps[2].waypointType).toBe(CONST_WayPoint_TYPE_CIRCLE);
        expect(wps[2].m_Radius).toBe(50);
        expect(wps[2].m_Turns).toBe(2);
        expect(wps[2].m_Header_Required).toBe(true);
        expect(wps[2].m_Xtrack_Location).toBe(1);
    });

    test('WayPoints: chunked frame returns isChunk from payload.i', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_WayPoints, 'u', {
            i: 1, n: 1,
            0: { t: CONST_WayPoint_TYPE_WAYPOINTSTEP, s: 1, g: 1, a: 2, l: 3, h: 4, y: 5 },
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.waypoints.isChunk).toBe(1);
        expect(result.waypoints.wps).toHaveLength(1);
    });

    test('WayPoints: CIRCLE without q/x uses defaults', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_WayPoints, 'u', {
            n: 1,
            0: { t: CONST_WayPoint_TYPE_CIRCLE, s: 1, g: 1, a: 2, l: 3, r: 25, n: 1 },
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        const wp = result.waypoints.wps[0];
        expect(wp.m_Header_Required).toBe(false);
        expect(wp.m_Xtrack_Location).toBe(0);
    });

    // --- TASK-02.3: tracking messages ---

    test('SearchTargetList: 2 items (one with t, one without -> m_type na)', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_SearchTargetList, 'u', {
            t: [
                { n: 'target-a', t: 'vehicle' },
                { n: 'target-b' },
            ],
        });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result.patches).toHaveLength(1);
        expect(result.patches[0].path).toBe('m_DetectedTargets.m_searchable_targets');
        const targets = result.patches[0].value;
        expect(targets['target-a'].m_type).toBe('vehicle');
        expect(targets['target-b'].m_type).toBe('na');
        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe(js_event.EE_SearchableTarget);
    });

    test('SearchTargetList: missing t -> no patches, no events', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_SearchTargetList, 'u', { n: 'x' });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.patches).toHaveLength(0);
        expect(result.events).toHaveLength(0);
    });

    test('TargetTrackingtLocation: rectangle + radius target, lastUpdate === receivedAt', () => {
        const receivedAt = 1700000005678;
        const raw = frame(CONST_TYPE_AndruavMessage_TargetTrackingtLocation, 'u', {
            t: [
                { a: 10, b: 20, c: 30, d: 40, p: 0.9, n: 'rect' },
                { a: 50, b: 60, r: 15, n: 'circle' },
            ],
        });
        const msg = fn_decode(raw, receivedAt);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result.patches).toHaveLength(1);
        expect(result.patches[0].path).toBe('m_DetectedTargets.m_targets.m_list');
        const list = result.patches[0].value;
        expect(list).toHaveLength(2);

        // rectangle target
        expect(list[0].x1).toBe(10);
        expect(list[0].y1).toBe(20);
        expect(list[0].x2).toBe(30);
        expect(list[0].y2).toBe(40);
        expect(list[0].m_propability).toBe(0.9);
        expect(list[0].m_name).toBe('rect');
        expect(list[0].lastUpdate).toBe(receivedAt);

        // radius target
        expect(list[1].m_radius).toBe(15);
        expect(list[1].x2).toBeUndefined();
        expect(list[1].m_name).toBe('circle');
        expect(list[1].lastUpdate).toBe(receivedAt);

        expect(result.events[0].name).toBe(js_event.EE_DetectedTarget);
    });

    test('TargetTrackingtLocation: default name when n absent', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_TargetTrackingtLocation, 'u', {
            t: [{ a: 1, b: 2, c: 3, d: 4 }],
        });
        const msg = fn_decode(raw, 42);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.patches[0].value[0].m_name).toBe('default');
        expect(result.patches[0].value[0].lastUpdate).toBe(42);
    });

    // --- TASK-02.4: CameraList / SOUND_LIST ---

    test('CameraList: reply (R:true) includes patch, EE_unitUpdated, __callbackReply', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_CameraList, 'u', {
            T: [{ id: 'cam1', v: true }], R: true,
        });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result.patches).toHaveLength(1);
        expect(result.patches[0].path).toBe('m_Video.m_videoTracks');
        expect(result.patches[0].value).toEqual([{ id: 'cam1', v: true }]);

        expect(result.events).toHaveLength(2);
        expect(result.events[0].name).toBe(js_event.EE_unitUpdated);
        expect(result.events[0].payload).toBe(unit);

        expect(result.events[1].name).toBe('__callbackReply');
        expect(result.events[1].payload.messageType).toBe(CONST_TYPE_AndruavMessage_CameraList);
        expect(result.events[1].payload.session.status).toBe('connected');
        expect(result.events[1].payload.session.m_unit).toBe(unit);
    });

    test('CameraList: non-reply (R absent) has no callback pseudo-event', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_CameraList, 'u', {
            T: [{ id: 'cam1' }],
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe(js_event.EE_unitUpdated);
        expect(result.events.find(e => e.name === '__callbackReply')).toBeUndefined();
    });

    test('CameraList: empty T -> no patches, no events', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_CameraList, 'u', { T: [], R: true });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.patches).toHaveLength(0);
        expect(result.events).toHaveLength(0);
    });

    test('SOUND_LIST: empty T -> m_files: [] and EE_onSoundListUpdated', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_SOUND_LIST, 'u', { T: [] });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result.patches).toHaveLength(1);
        expect(result.patches[0].path).toBe('m_Sound.m_files');
        expect(result.patches[0].value).toEqual([]);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe(js_event.EE_onSoundListUpdated);
    });

    test('SOUND_LIST: reply (R:true) includes __callbackReply', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_SOUND_LIST, 'u', {
            T: [{ n: 'beep', f: '/sounds/beep.mp3' }], R: true,
        });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.events).toHaveLength(2);
        expect(result.events[1].name).toBe('__callbackReply');
        expect(result.events[1].payload.messageType).toBe(CONST_TYPE_AndruavMessage_SOUND_LIST);
    });

    test('SOUND_LIST: missing T -> m_files: []', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_SOUND_LIST, 'u', {});
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.patches[0].value).toEqual([]);
    });

    // --- TASK-02.5: CONFIG_STATUS / Signaling ---

    test('CONFIG_STATUS: R:true -> __configStatusReply with moduleKey + template', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_CONFIG_STATUS, 'u', {
            R: true, k: 'video_stream', b: '<template>...</template>',
        });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result.patches).toHaveLength(0);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe('__configStatusReply');
        expect(result.events[0].payload.unit).toBe(unit);
        expect(result.events[0].payload.moduleKey).toBe('video_stream');
        expect(result.events[0].payload.template).toBe('<template>...</template>');
    });

    test('CONFIG_STATUS: R absent -> no events', () => {
        const raw = frame(CONST_TYPE_AndruavMessage_CONFIG_STATUS, 'u', { k: 'x', b: 'y' });
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.patches).toHaveLength(0);
        expect(result.events).toHaveLength(0);
    });

    test('Signaling: wrapped (w) -> event signal is payload.w', () => {
        const innerSignal = { channel: 'ch1', packet: { sdp: 'offer' } };
        const raw = frame(CONST_TYPE_AndruavMessage_Signaling, 'u', { w: innerSignal });
        const msg = fn_decode(raw, 1);
        const unit = makeUnit();
        const result = fn_reduce(unit, msg);

        expect(result.events).toHaveLength(1);
        expect(result.events[0].name).toBe(js_event.EE_andruavSignalling);
        expect(result.events[0].payload.unit).toBe(unit);
        expect(result.events[0].payload.signal).toBe(innerSignal);
    });

    test('Signaling: bare payload -> event signal is the payload itself', () => {
        const bareSignal = { channel: 'ch2', packet: { hangup: true } };
        const raw = frame(CONST_TYPE_AndruavMessage_Signaling, 'u', bareSignal);
        const msg = fn_decode(raw, 1);
        const result = fn_reduce(makeUnit(), msg);
        expect(result.events[0].payload.signal).toBe(bareSignal);
    });
});

describe('TASK-02 fn_setByPath / fn_getByPath', () => {
    test('writes and reads nested dot paths', () => {
        const obj = {};
        fn_setByPath(obj, 'a.b.c', 42);
        expect(fn_getByPath(obj, 'a.b.c')).toBe(42);
        expect(fn_getByPath(obj, 'a.b')).toEqual({ c: 42 });
    });

    test('getByPath returns undefined for missing paths', () => {
        expect(fn_getByPath({}, 'x.y.z')).toBeUndefined();
        expect(fn_getByPath(null, 'x')).toBeUndefined();
    });

    test('setByPath overwrites existing values', () => {
        const obj = { a: { b: 1 } };
        fn_setByPath(obj, 'a.b', 2);
        expect(fn_getByPath(obj, 'a.b')).toBe(2);
    });
});
