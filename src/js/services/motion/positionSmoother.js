/*jshint esversion: 11 */
/**
 * positionSmoother — shared, engine-agnostic interpolation layer that both
 * the Leaflet (2D) and Mapbox (3D) map adapters render through.
 *
 * Both maps currently snap each unit/ADS-B marker straight to its latest raw
 * telemetry position on every tick, which reads as visible jumps rather than
 * motion. This service animates between two *known* samples (interpolation
 * only, never extrapolation) using a single shared `requestAnimationFrame`
 * loop, so motion glides between ticks instead of snapping. A user-facing
 * toggle (Settings → "Smooth movement") disables it when raw, undelayed
 * positions matter more than smoothness.
 *
 * Framework-free: no Mapbox/Leaflet/React imports — only `js_eventEmitter`,
 * `js_eventList`, `js_localStorage`. Mirrors `mapPopupService.js`'s style:
 * plain exported `fn_*` functions plus a bundled export object.
 *
 * Per-entity state:
 *   { fromLat, fromLng, fromYaw, toLat, toLng, toYaw, tStart, tEnd, renderFn }
 * Idle entities (no active animation) keep a minimal
 *   { lastLat, lastLng, lastYaw, renderFn }
 * so the next `fn_pushSample` has a `from` to interpolate from.
 *
 * Yaw is interpolated via shortest-path angle interpolation (handles the
 * ±180° wrap — naive linear lerp on raw degrees breaks near due north).
 * Altitude is NOT interpolated here — it is computed once per real tick in
 * `fn_syncUnit`/`fn_syncAdsbObject` and left as-is (see TASK-11's "Do not
 * interpolate altitude" note).
 */

import { js_eventEmitter } from '../../events/js_eventEmitter.js';
import { EVENTS as js_event } from '../../events/js_eventList.js';
import { js_localStorage } from '../../state/js_localStorage.js';

// Min/max interpolation window (ms). A floor so even back-to-back ticks get
// *some* animation; a ceiling so a long stall doesn't leave the marker
// crawling for a second or more.
const DURATION_MIN_MS = 150;
const DURATION_MAX_MS = 800;

// Per-entity state map: id -> entity state object (active or idle).
const m_entities = new Map();

// Single shared rAF handle. Lazily started on first active entity, stopped
// when no entities are active.
let m_rafId = null;

// Unique listener sentinel used as the subscription key (avoids referencing
// the `positionSmoother` export const before its declaration at module load).
const m_prefListener = {};

// Global enabled flag, initialized from localStorage and re-read on
// EE_onPreferenceChanged so the toggle takes effect without a reload.
let m_enabled = js_localStorage.fn_getSmoothMovementEnabled();

js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged, m_prefListener, () => {
    m_enabled = js_localStorage.fn_getSmoothMovementEnabled();
    if (!m_enabled) {
        // Snap every in-flight entity straight to its most recent target so
        // nothing is left half-interpolated at the moment of toggling off.
        for (const entity of m_entities.values()) {
            if (entity.renderFn && Number.isFinite(entity.toLat)) {
                entity.renderFn(entity.toLat, entity.toLng, entity.toYaw);
            }
            // Collapse to idle state carrying the final target values.
            entity.lastLat = entity.toLat;
            entity.lastLng = entity.toLng;
            entity.lastYaw = entity.toYaw;
            delete entity.fromLat;
            delete entity.fromLng;
            delete entity.fromYaw;
            delete entity.toLat;
            delete entity.toLng;
            delete entity.toYaw;
            delete entity.tStart;
            delete entity.tEnd;
        }
        fn_stopLoop();
    }
});

/**
 * @returns {boolean} whether smoothing is currently enabled.
 */
export function fn_isEnabled() {
    return m_enabled;
}

/**
 * Enables/disables smoothing globally. Disabling snaps every in-flight
 * entity straight to its most recent target (via its stored renderFn) so
 * nothing is left half-interpolated.
 * @param {boolean} enabled
 */
export function fn_setEnabled(enabled) {
    m_enabled = !!enabled;
    if (!m_enabled) {
        for (const entity of m_entities.values()) {
            if (entity.renderFn && Number.isFinite(entity.toLat)) {
                entity.renderFn(entity.toLat, entity.toLng, entity.toYaw);
            }
            entity.lastLat = entity.toLat;
            entity.lastLng = entity.toLng;
            entity.lastYaw = entity.toYaw;
            delete entity.fromLat;
            delete entity.fromLng;
            delete entity.fromYaw;
            delete entity.toLat;
            delete entity.toLng;
            delete entity.toYaw;
            delete entity.tStart;
            delete entity.tEnd;
        }
        fn_stopLoop();
    }
}

/**
 * Shortest-path linear interpolation between two angles in degrees,
 * handling the ±180° wrap. Returns a value in [0, 360).
 * @param {number} fromDeg
 * @param {number} toDeg
 * @param {number} t  in [0, 1]
 */
function fn_lerpAngle(fromDeg, toDeg, t) {
    let delta = ((toDeg - fromDeg) % 360 + 540) % 360 - 180; // [-180, 180)
    let result = fromDeg + delta * t;
    return (result % 360 + 360) % 360;
}

/**
 * Evaluates the in-flight interpolation for an active entity at `now`,
 * returning { lat, lng, yaw }. If the animation has finished (now >= tEnd),
 * returns the exact `to` values.
 */
function fn_evaluate(entity, now) {
    if (!Number.isFinite(entity.tEnd)) {
        return { lat: entity.toLat, lng: entity.toLng, yaw: entity.toYaw };
    }
    if (now >= entity.tEnd) {
        return { lat: entity.toLat, lng: entity.toLng, yaw: entity.toYaw };
    }
    const t = Math.min(Math.max((now - entity.tStart) / (entity.tEnd - entity.tStart), 0), 1);
    const lat = entity.fromLat + (entity.toLat - entity.fromLat) * t;
    const lng = entity.fromLng + (entity.toLng - entity.fromLng) * t;
    const yaw = fn_lerpAngle(entity.fromYaw, entity.toYaw, t);
    return { lat, lng, yaw };
}

/**
 * The shared rAF loop body. Iterates every active entity, renders the
 * interpolated frame, finalizes finished entities to idle, and stops the
 * loop when nothing is active.
 */
function fn_loop() {
    const now = performance.now();
    let anyActive = false;

    for (const entity of m_entities.values()) {
        if (!Number.isFinite(entity.tEnd)) continue; // idle

        if (now < entity.tEnd) {
            const { lat, lng, yaw } = fn_evaluate(entity, now);
            entity.renderFn(lat, lng, yaw);
            anyActive = true;
        } else {
            // Final call with exact target values, then collapse to idle.
            entity.renderFn(entity.toLat, entity.toLng, entity.toYaw);
            entity.lastLat = entity.toLat;
            entity.lastLng = entity.toLng;
            entity.lastYaw = entity.toYaw;
            delete entity.fromLat;
            delete entity.fromLng;
            delete entity.fromYaw;
            delete entity.toLat;
            delete entity.toLng;
            delete entity.toYaw;
            delete entity.tStart;
            delete entity.tEnd;
        }
    }

    if (anyActive) {
        m_rafId = requestAnimationFrame(fn_loop);
    } else {
        m_rafId = null;
    }
}

function fn_startLoop() {
    if (m_rafId === null) {
        m_rafId = requestAnimationFrame(fn_loop);
    }
}

function fn_stopLoop() {
    if (m_rafId !== null) {
        cancelAnimationFrame(m_rafId);
        m_rafId = null;
    }
}

/**
 * Pushes a new telemetry sample for `id` and drives `renderFn` with the
 * (possibly interpolated) position.
 *
 * @param {string} id           - caller-namespaced key, e.g. 'unit:'+partyID or 'adsb:'+icao
 * @param {number} lat
 * @param {number} lng
 * @param {number} yawDeg       - degrees, 0-360 (caller converts from radians first)
 * @param {(lat:number, lng:number, yawDeg:number) => void} renderFn
 *   Called at least once synchronously within this call (so a brand-new
 *   entity appears immediately, never waits a frame). If smoothing is
 *   enabled and a prior sample exists for this id, called again on every
 *   animation frame until the interpolation finishes, with a final call
 *   carrying the exact target values.
 */
export function fn_pushSample(id, lat, lng, yawDeg, renderFn) {
    const existing = m_entities.get(id);

    // Disabled, or first-ever sample (nothing to interpolate from): render
    // immediately and store idle state.
    if (!m_enabled || !existing || !Number.isFinite(existing.lastLat)) {
        renderFn(lat, lng, yawDeg);
        const idle = existing || {};
        idle.lastLat = lat;
        idle.lastLng = lng;
        idle.lastYaw = yawDeg;
        idle.renderFn = renderFn;
        // Clear any stale active-animation fields (defensive).
        delete idle.fromLat;
        delete idle.fromLng;
        delete idle.fromYaw;
        delete idle.toLat;
        delete idle.toLng;
        delete idle.toYaw;
        delete idle.tStart;
        delete idle.tEnd;
        m_entities.set(id, idle);
        return;
    }

    // Smoothing enabled with a prior sample: interpolate from the current
    // (possibly mid-flight) position to the new target.
    const now = performance.now();
    let fromLat, fromLng, fromYaw;
    if (Number.isFinite(existing.tEnd) && now < existing.tEnd) {
        // Mid-animation: evaluate the in-flight interpolation at `now` so a
        // new sample arriving mid-animation doesn't cause a discontinuity.
        const cur = fn_evaluate(existing, now);
        fromLat = cur.lat;
        fromLng = cur.lng;
        fromYaw = cur.yaw;
    } else if (Number.isFinite(existing.toLat)) {
        // Animation finished but the rAF loop hasn't finalized this entity
        // to idle yet — use the exact target values as the `from` so we
        // don't snap back to the stale pre-animation `last` position.
        fromLat = existing.toLat;
        fromLng = existing.toLng;
        fromYaw = existing.toYaw;
    } else {
        // Idle (previous animation finalized): use last known position.
        fromLat = existing.lastLat;
        fromLng = existing.lastLng;
        fromYaw = existing.lastYaw;
    }

    // Compute duration from the time since the last sample, clamped.
    // Use the previous tEnd (if mid-flight) or lastLat timestamp surrogate.
    // We don't track an explicit last-sample timestamp; approximate dt from
    // the in-flight window when available, otherwise use the clamp floor.
    let dt = DURATION_MIN_MS;
    if (Number.isFinite(existing.tEnd) && Number.isFinite(existing.tStart)) {
        dt = now - existing.tStart;
    }
    const duration = Math.min(Math.max(dt, DURATION_MIN_MS), DURATION_MAX_MS);

    existing.fromLat = fromLat;
    existing.fromLng = fromLng;
    existing.fromYaw = fromYaw;
    existing.toLat = lat;
    existing.toLng = lng;
    existing.toYaw = yawDeg;
    existing.tStart = now;
    existing.tEnd = now + duration;
    existing.renderFn = renderFn;
    m_entities.set(id, existing);

    fn_startLoop();
}

/**
 * Drops internal state for `id`. Call on entity teardown (e.g. alongside
 * `js_map3d.fn_removeAdsbMarker` when an ADS-B aircraft ages out) so a
 * reappearing aircraft doesn't glide in from a long-gone position.
 * @param {string} id
 */
export function fn_removeEntity(id) {
    m_entities.delete(id);
}

export const positionSmoother = { fn_pushSample, fn_removeEntity, fn_setEnabled, fn_isEnabled };
