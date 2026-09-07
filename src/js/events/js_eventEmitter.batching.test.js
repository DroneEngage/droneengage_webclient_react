/*jshint esversion: 6 */
/**
 * Unit tests for the per-event animation-frame batching in js_eventEmitter.
 *
 * Covers the two acceptance criteria that matter:
 *   1. Per-unit coalescing: dispatching a batched event for unit A and unit
 *      B synchronously in the same tick must deliver BOTH units' payloads
 *      after the next requestAnimationFrame (no unit is dropped).
 *   2. Immediate exclusion: events NOT opted into batching (e.g.
 *      EE_onMessage) still call listeners synchronously before fn_dispatch
 *      returns — no await/rAF needed to observe the effect.
 *
 * Importing js_eventEmitterConfig runs the real startup wiring (the same
 * side effect js_main.js triggers), so these tests exercise the actual
 * batched-event set rather than a hand-picked stub.
 */

import './js_eventEmitterConfig'; // side-effect: opts telemetry events into batching
import { js_eventEmitter } from './js_eventEmitter';
import { EVENTS as js_event } from './js_eventList';
import { fn_videoStatsEvent } from '../core/events/eventPayloads';

// Minimal stand-in for a js_andruavUnit payload: the batched events all
// dispatch the unit object, whose per-unit identity comes from getPartyID().
const makeUnit = (partyID) => ({
    getPartyID: () => partyID,
});

const nextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

describe('js_eventEmitter per-event rAF batching', () => {
    test('batched event coalesces per-unit: both units delivered after one frame', async () => {
        const unitA = makeUnit('party-A');
        const unitB = makeUnit('party-B');
        const calls = [];
        const listener = { id: 'listener-1' };

        js_eventEmitter.fn_subscribe(
            js_event.EE_unitUpdated,
            listener,
            (_l, data) => calls.push(data.getPartyID())
        );

        try {
            // Two units emit the same batched event synchronously in one tick.
            // A naive (eventName -> lastPayload) coalescer would drop unit A.
            js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, unitA);
            js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, unitB);

            // Batched dispatch must NOT fire synchronously.
            expect(calls).toEqual([]);

            await nextFrame();

            // Both units survive, each delivered exactly once, in dispatch order.
            expect(calls).toEqual(['party-A', 'party-B']);
        } finally {
            js_eventEmitter.fn_unsubscribe(js_event.EE_unitUpdated, listener);
        }
    });

    test('batched event coalesces same unit: only latest payload survives', async () => {
        const listener = { id: 'listener-2' };
        const calls = [];

        js_eventEmitter.fn_subscribe(
            js_event.EE_unitNavUpdated,
            listener,
            (_l, data) => calls.push(data.seq)
        );

        try {
            // The SAME unit (same partyID) dispatches 3 times in one tick.
            // Coalescing is keyed by partyID, so only the latest payload lands.
            const sameUnit = (seq) => ({ getPartyID: () => 'party-X', seq });
            js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, sameUnit(1));
            js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, sameUnit(2));
            js_eventEmitter.fn_dispatch(js_event.EE_unitNavUpdated, sameUnit(3));

            expect(calls).toEqual([]);
            await nextFrame();

            expect(calls).toEqual([3]);
        } finally {
            js_eventEmitter.fn_unsubscribe(js_event.EE_unitNavUpdated, listener);
        }
    });

    test('excluded event stays synchronous: listener fires before dispatch returns', () => {
        // EE_onMessage is deliberately excluded from the batched set (alerts/log).
        const listener = { id: 'listener-3' };
        let fired = null;

        js_eventEmitter.fn_subscribe(
            js_event.EE_onMessage,
            listener,
            (_l, data) => { fired = data; }
        );

        try {
            js_eventEmitter.fn_dispatch(js_event.EE_onMessage, { msg: 'hello' });
            // No rAF/await: the effect must be observable immediately.
            expect(fired).toEqual({ msg: 'hello' });
        } finally {
            js_eventEmitter.fn_unsubscribe(js_event.EE_onMessage, listener);
        }
    });

    test('per-listener error isolation still holds for batched dispatch', async () => {
        const listenerOk = { id: 'listener-ok' };
        const listenerBad = { id: 'listener-bad' };
        const okCalls = [];

        js_eventEmitter.fn_subscribe(
            js_event.EE_unitPowUpdated,
            listenerBad,
            () => { throw new Error('boom'); }
        );
        js_eventEmitter.fn_subscribe(
            js_event.EE_unitPowUpdated,
            listenerOk,
            (_l, data) => okCalls.push(data.getPartyID())
        );

        // Silence the expected console.error from the throwing listener.
        const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
            js_eventEmitter.fn_dispatch(js_event.EE_unitPowUpdated, makeUnit('party-P'));
            await nextFrame();

            // The good listener still ran despite the bad one throwing.
            expect(okCalls).toEqual(['party-P']);
            expect(consoleErr).toHaveBeenCalled();
        } finally {
            consoleErr.mockRestore();
            js_eventEmitter.fn_unsubscribe(js_event.EE_unitPowUpdated, listenerBad);
            js_eventEmitter.fn_unsubscribe(js_event.EE_unitPowUpdated, listenerOk);
        }
    });

    test('factory payload with partyID field coalesces per-unit (no track_id branch)', async () => {
        // After TASK-03, fn_videoStatsEvent produces { partyID, unit, fps, rx,
        // track_id }. _fn_extractUnitKey no longer has a track_id branch — it
        // keys on partyID. Two different units' stats in the same frame must
        // both survive.
        const unitA = makeUnit('stats-A');
        const unitB = makeUnit('stats-B');
        const calls = [];
        const listener = { id: 'listener-stats' };

        js_eventEmitter.fn_subscribe(
            js_event.EE_onWebRTC_Video_Statistics,
            listener,
            (_l, data) => calls.push(data.partyID)
        );

        try {
            js_eventEmitter.fn_dispatch(
                js_event.EE_onWebRTC_Video_Statistics,
                fn_videoStatsEvent(unitA, 'track-1', { fps: 30, rx: 1000 })
            );
            js_eventEmitter.fn_dispatch(
                js_event.EE_onWebRTC_Video_Statistics,
                fn_videoStatsEvent(unitB, 'track-2', { fps: 24, rx: 2000 })
            );

            expect(calls).toEqual([]);
            await nextFrame();

            // Both units survive, keyed by partyID (not track_id).
            expect(calls).toEqual(['stats-A', 'stats-B']);
        } finally {
            js_eventEmitter.fn_unsubscribe(js_event.EE_onWebRTC_Video_Statistics, listener);
        }
    });
});
