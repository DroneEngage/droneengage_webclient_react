import { useSyncExternalStore, useCallback } from 'react';
import { js_globals } from '../js_globals.js';
import { subscribeUnitField } from '../store/unitStore.js';

/**
 * Reactively reads `unit[fieldPath]` (dot-path string, e.g.
 * "m_tracker.m_active") and only re-renders the calling component when
 * THAT field changes — not on every coarse EE_unitUpdated for the whole
 * unit.
 *
 * This replaces the hand-rolled
 *   constructor: fn_subscribe / shouldComponentUpdate(m_update counter) /
 *   componentWillUnmount: fn_unsubscribe
 * pattern duplicated across gadget components. There is no manual dirty
 * flag and no listener to forget to unsubscribe — useSyncExternalStore
 * handles subscribe/unsubscribe and re-render gating by construction.
 *
 * @param {string} partyId - unit party id (p_unit.getPartyID())
 * @param {string} fieldPath - dot-path into the unit object, e.g. "m_tracker.m_active"
 * @returns {*} the current value at unit[fieldPath], or undefined if the
 *   unit is not present / the path does not resolve.
 */
export function useUnitField(partyId, fieldPath) {
    const subscribe = useCallback(
        (onChange) => subscribeUnitField(partyId, fieldPath, onChange),
        [partyId, fieldPath]
    );
    const getSnapshot = useCallback(() => {
        const list = js_globals.m_andruavUnitList;
        if (!list) return undefined;
        const unit = list.fn_getUnit(partyId);
        if (!unit) return undefined;
        return fieldPath.split('.').reduce((obj, key) => (obj == null ? obj : obj[key]), unit);
    }, [partyId, fieldPath]);
    return useSyncExternalStore(subscribe, getSnapshot);
}
