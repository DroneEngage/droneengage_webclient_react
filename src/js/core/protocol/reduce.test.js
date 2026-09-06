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
         CONST_TYPE_AndruavMessage_Communication_Line_Status } from '../../protocol/messages/js_andruavMessages.js';
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
