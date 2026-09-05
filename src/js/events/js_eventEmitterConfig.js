/*jshint esversion: 6 */
/**
 * Startup configuration for js_eventEmitter's per-event batching.
 *
 * Telemetry-frequency events (fire multiple times per second per unit under
 * normal flight) are opted into animation-frame coalescing here. Everything
 * else — connect/disconnect, dialogs, auth, mission load/save, chat,
 * alarms/errors, and the discrete state-transition events explicitly listed
 * below — stays synchronous/immediate, since batching a "unit disconnected"
 * or "geofence hit" alert by even one frame is the wrong tradeoff for a GCS.
 *
 * This module is imported once for its side effect (see the import in
 * js_main.js). It runs at module-load time, before any dispatch, so the
 * batched set is populated before the first telemetry packet arrives.
 *
 * Deliberately EXCLUDED (discrete events / user-facing alerts — keep immediate):
 *   EE_andruavUnitArmedUpdated, EE_andruavUnitFlyingUpdated,
 *   EE_andruavUnitFightModeUpdated, EE_unitOnlineChanged,
 *   EE_andruavUnitGeoFenceHit, EE_onMessage, EE_onChatMessage,
 *   all EE_Auth_ events, all EE_display / EE_hide dialog events.
 * If profiling shows one of these firing at telemetry rate in practice,
 * reconsider it individually — but default to immediate for anything
 * resembling a discrete event or user-facing alert.
 */

import { js_eventEmitter } from './js_eventEmitter';
import { EVENTS as js_event } from './js_eventList';

// Events that must NEVER be batched. Batching delays dispatch by one
// animation frame, which is unacceptable for safety-critical / discrete
// alerts: geofence breach, arming & flight-mode transitions, unit
// online/offline, auth, chat, mission load/save, and error/alarm messages.
// Listed here as a guard so a future edit to BATCHED_EVENTS is caught at
// startup if it accidentally introduces one-frame latency on a
// user-facing / safety event. See the doc comment above for the rationale.
const FORBIDDEN_BATCHED = Object.freeze([
    js_event.EE_andruavUnitArmedUpdated,
    js_event.EE_andruavUnitFlyingUpdated,
    js_event.EE_andruavUnitFightModeUpdated,
    js_event.EE_unitOnlineChanged,
    js_event.EE_andruavUnitGeoFenceHit,
    js_event.EE_andruavUnitError,
    js_event.EE_onMessage,
    js_event.EE_onChatMessage,
    js_event.EE_ErrorMessage,
    js_event.EE_Mission_Loaded,
    js_event.EE_Mission_Saved,
    js_event.EE_Mission_Deleted,
    js_event.EE_Auth_Login_In_Progress,
    js_event.EE_Auth_Logined,
    js_event.EE_Auth_BAD_Logined,
    js_event.EE_Auth_Account_Created,
    js_event.EE_Auth_Account_Regenerated,
    js_event.EE_Auth_Account_BAD_Operation,
    js_event.EE_onGUIMessage,
    js_event.EE_onGUIMessageHide,
]);

// Every dialog show/hide event (EE_display*, EE_hide*) is inherently a
// discrete UI toggle, never continuous telemetry, so all of them must stay
// immediate — matching the "all EE_display / EE_hide dialog events" rule
// documented at the top of this file. Derived by NAME PATTERN, not
// hand-enumerated, so a dialog event added to js_eventList.js later is
// automatically protected without anyone having to remember to update this
// file too. js_event's values are opaque "EVT_n" ids (see js_eventList.js),
// so the pattern must be matched against the KEYS and then mapped to values.
const DIALOG_EVENT_NAME_PATTERN = /^EE_(display|hide)/;
const FORBIDDEN_BATCHED_BY_NAME_PATTERN = Object.freeze(
    Object.keys(js_event)
        .filter((name) => DIALOG_EVENT_NAME_PATTERN.test(name))
        .map((name) => js_event[name])
);

const BATCHED_EVENTS = Object.freeze([
    js_event.EE_unitUpdated,
    js_event.EE_unitNavUpdated,
    js_event.EE_unitPowUpdated,
    js_event.EE_unitSDRUpdated,
    js_event.EE_unitSDRSpectrum,
    js_event.EE_msgFromUnit_GPS,
    js_event.EE_andruavUnitFCBUpdated,
    js_event.EE_GamePad_Axes_Updated,
    js_event.EE_GamePad_Other_Axes_Updated,
    js_event.EE_onWebRTC_Video_Statistics,
]);

// Startup validation:
//   - every batched entry must resolve to a defined, non-empty event id
//     (catches typos / stale refs after a js_eventList.js refactor that
//     would otherwise silently add `undefined` to the batched set and
//     leave the real event un-batched);
//   - no batched entry may appear in FORBIDDEN_BATCHED or match the dialog
//     name pattern (catches a safety-critical or dialog event being
//     accidentally opted into one-frame-delayed dispatch).
// Both are programmer errors introduced by edits to this file or
// js_eventList.js, so fail fast at module load rather than silently
// degrading GCS alerting behavior.
const _forbiddenSet = new Set([
    ...FORBIDDEN_BATCHED,
    ...FORBIDDEN_BATCHED_BY_NAME_PATTERN,
]);

BATCHED_EVENTS.forEach((evt) => {
    if (typeof evt !== 'string' || evt.length === 0) {
        throw new Error(
            `[js_eventEmitterConfig] refusing to batch an invalid event id (${String(evt)}). ` +
            `Check that the entry still exists in js_eventList.js.`
        );
    }
    if (_forbiddenSet.has(evt)) {
        throw new Error(
            `[js_eventEmitterConfig] refusing to batch safety-critical event "${evt}". ` +
            `Batching delays dispatch by one animation frame; discrete/alert events must stay immediate.`
        );
    }
    js_eventEmitter.fn_setBatched(evt);
});
