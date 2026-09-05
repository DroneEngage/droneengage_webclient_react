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

[
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
].forEach(js_eventEmitter.fn_setBatched.bind(js_eventEmitter));
