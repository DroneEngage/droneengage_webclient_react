/**
 * TASK-03 — Typed payload factories for surviving domain events.
 *
 * The old event bus had no payload contract: `_fn_extractUnitKey` had to
 * sniff four different payload shapes at runtime to find a per-unit key.
 * These factories give every surviving domain event a **guaranteed
 * `partyID` field** so the key extraction collapses to a single lookup.
 *
 * One factory per event family. Dispatch sites call the factory instead of
 * building a bare object literal, so the payload shape is centralized and
 * greppable.
 */

/**
 * Extract a partyID from anything that carries one: a unit object with
 * getPartyID(), or a plain object with a .partyID field. Used internally
 * by the factories so they can accept either shape.
 * @param {*} p_unitOrObj
 * @returns {string|null}
 */
function pidOf(p_unitOrObj) {
    if (p_unitOrObj == null) return null;
    if (typeof p_unitOrObj.getPartyID === 'function') return p_unitOrObj.getPartyID();
    if (p_unitOrObj.partyID != null) return String(p_unitOrObj.partyID);
    return null;
}

// ---------------------------------------------------------------------------
// Batched telemetry-frequency events (opted into rAF coalescing).
// Every payload carries partyID so _fn_extractUnitKey can key on it
// instead of sniffing for track_id / unit.getPartyID().
// ---------------------------------------------------------------------------

/**
 * WebRTC video statistics. The old payload was
 * `{ unit, fps, rx, track_id }` with no partyID, forcing a special
 * `track_id` branch in _fn_extractUnitKey. The factory adds partyID
 * and keeps track_id for subscriber backward compatibility
 * (jsc_ctrl_video_fps_control.jsx reads p_obj.track_id).
 * @param {object} p_unit - unit object with getPartyID()
 * @param {string} p_trackId - video track id
 * @param {{ fps: number, rx: number }} p_stats - statistics snapshot
 * @returns {{ partyID: string, unit: object, fps: number, rx: number, track_id: string }}
 */
export const fn_videoStatsEvent = (p_unit, p_trackId, p_stats) => ({
    partyID: pidOf(p_unit),
    unit: p_unit,
    fps: p_stats.fps,
    rx: p_stats.rx,
    track_id: p_trackId,
});

// ---------------------------------------------------------------------------
// Domain events — discrete, past tense, worth broadcasting.
// ---------------------------------------------------------------------------

/**
 * Unit error / alert. FORBIDDEN_BATCHED — must stay immediate.
 * @param {object} p_unit - unit object with getPartyID()
 * @param {object} p_err - error info
 * @returns {{ partyID: string, unit: object, err: object }}
 */
export const fn_unitError = (p_unit, p_err) => ({
    partyID: pidOf(p_unit),
    unit: p_unit,
    err: p_err,
});

/**
 * Waypoints received from a unit.
 * @param {object} p_unit - unit object with getPartyID()
 * @param {Array} p_wps - waypoint array
 * @returns {{ partyID: string, unit: object, wps: Array }}
 */
export const fn_waypointsEvent = (p_unit, p_wps) => ({
    partyID: pidOf(p_unit),
    unit: p_unit,
    wps: p_wps,
});
