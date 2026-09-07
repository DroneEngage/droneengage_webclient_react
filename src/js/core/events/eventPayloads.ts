/**
 * TASK-03 / TASK-06 — typed payload factories for surviving domain events.
 *
 * The old event bus had no payload contract: `_fn_extractUnitKey` had to
 * sniff four different payload shapes at runtime to find a per-unit key.
 * These factories give every surviving domain event a **guaranteed
 * `partyID` field** so the key extraction collapses to a single lookup.
 *
 * One factory per event family. Dispatch sites call the factory instead of
 * building a bare object literal, so the payload shape is centralized and
 * greppable. TASK-06 promotes the factories from JSDoc-typed .js to real
 * TypeScript so the payload contracts are enforced at compile time.
 */

import type { CAndruavUnit } from '../model/unit';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Anything that carries a partyID: a unit with getPartyID(), or a plain
 *  object with a .partyID field. Used internally by the factories so they
 *  can accept either shape. */
export type PartyIDCarrier =
    | { getPartyID(): string }
    | { partyID: string | number };

/**
 * Extract a partyID from anything that carries one: a unit object with
 * getPartyID(), or a plain object with a .partyID field.
 */
function pidOf(p_unitOrObj: PartyIDCarrier | null | undefined): string | null {
    if (p_unitOrObj == null) return null;
    if (typeof (p_unitOrObj as any).getPartyID === 'function') return (p_unitOrObj as any).getPartyID();
    if ((p_unitOrObj as any).partyID != null) return String((p_unitOrObj as any).partyID);
    return null;
}

// ---------------------------------------------------------------------------
// Batched telemetry-frequency events (opted into rAF coalescing).
// Every payload carries partyID so _fn_extractUnitKey can key on it
// instead of sniffing for track_id / unit.getPartyID().
// ---------------------------------------------------------------------------

/** WebRTC video statistics payload. */
export interface VideoStatsEvent {
    partyID: string | null;
    unit: CAndruavUnit;
    fps: number;
    rx: number;
    /** Kept for subscriber backward compatibility (jsc_ctrl_video_fps_control.jsx reads track_id). */
    track_id: string;
}

/**
 * WebRTC video statistics. The old payload was
 * `{ unit, fps, rx, track_id }` with no partyID, forcing a special
 * `track_id` branch in _fn_extractUnitKey. The factory adds partyID
 * and keeps track_id for subscriber backward compatibility.
 */
export const fn_videoStatsEvent = (
    p_unit: CAndruavUnit,
    p_trackId: string,
    p_stats: { fps: number; rx: number },
): VideoStatsEvent => ({
    partyID: pidOf(p_unit),
    unit: p_unit,
    fps: p_stats.fps,
    rx: p_stats.rx,
    track_id: p_trackId,
});

// ---------------------------------------------------------------------------
// Domain events — discrete, past tense, worth broadcasting.
// ---------------------------------------------------------------------------

/** Unit error / alert payload. FORBIDDEN_BATCHED — must stay immediate. */
export interface UnitErrorEvent {
    partyID: string | null;
    unit: CAndruavUnit;
    err: { errorNo?: number; infoType?: number; notification_Type: number; Description: string; [key: string]: any };
}

/**
 * Unit error / alert. FORBIDDEN_BATCHED — must stay immediate.
 */
export const fn_unitError = (
    p_unit: CAndruavUnit,
    p_err: UnitErrorEvent['err'],
): UnitErrorEvent => ({
    partyID: pidOf(p_unit),
    unit: p_unit,
    err: p_err,
});

/** Waypoints received from a unit. */
export interface WaypointsEvent {
    partyID: string | null;
    unit: CAndruavUnit;
    wps: any[];
}

/**
 * Waypoints received from a unit.
 */
export const fn_waypointsEvent = (
    p_unit: CAndruavUnit,
    p_wps: any[],
): WaypointsEvent => ({
    partyID: pidOf(p_unit),
    unit: p_unit,
    wps: p_wps,
});
