import * as js_session from '../state/session.js';
// Thin reactive wrapper around the existing js_session.fn_getAndruavUnitList().
// Does NOT replace the unit model — CAndruavUnit instances stay exactly
// as they are today. This only adds a subscribe/getSnapshot surface so
// React can read individual fields reactively instead of via the coarse
// event-emitter + manual dirty-flag pattern.
//
// Field-level subscriptions are keyed by `${partyId}:${fieldPath}` where
// fieldPath is a dot-path string (e.g. "m_tracker.m_active"). A listener
// is notified only when that specific field is announced as changed, so a
// component reading battery voltage does not re-render on a GPS-only update.

const fieldListeners = new Map(); // `${partyId}:${fieldPath}` -> Set<() => void>

function keyFor(partyId, fieldPath) {
    return `${partyId}:${fieldPath}`;
}

/**
 * Notify all subscribers of a single (partyId, fieldPath) that the value
 * may have changed. Called by the event->store bridge in js_main.js in
 * response to coarse events (EE_onTrackingStatusChanged, etc.).
 *
 * @param {string} partyId - unit party id
 * @param {string} fieldPath - dot-path into the unit object, e.g. "m_tracker.m_active"
 */
export function notifyUnitFieldChanged(partyId, fieldPath) {
    const key = keyFor(partyId, fieldPath);
    const listeners = fieldListeners.get(key);
    if (!listeners) return;
    listeners.forEach((l) => l());
}

/**
 * Subscribe to changes of a single (partyId, fieldPath). Returns an
 * unsubscribe function. Intended to be used by useSyncExternalStore's
 * subscribe callback (see useUnitField).
 *
 * @param {string} partyId - unit party id
 * @param {string} fieldPath - dot-path into the unit object
 * @param {() => void} onChange - called when the field is announced changed
 * @returns {() => void} unsubscribe
 */
export function subscribeUnitField(partyId, fieldPath, onChange) {
    const key = keyFor(partyId, fieldPath);
    if (!fieldListeners.has(key)) fieldListeners.set(key, new Set());
    fieldListeners.get(key).add(onChange);
    return () => {
        const set = fieldListeners.get(key);
        if (!set) return;
        set.delete(onChange);
        if (set.size === 0) fieldListeners.delete(key);
    };
}
