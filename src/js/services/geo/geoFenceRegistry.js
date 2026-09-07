/**
 * TASK-02.1 — Single owner of geofence definitions.
 *
 * Replaces CAndruavClientParser.m_andruavGeoFences. The registry's lifetime
 * is the app's, not the parser's. js_main.js reads/writes here instead of
 * js_globals.v_andruavClient.m_andruavGeoFences.
 *
 * Each fence is keyed by name and holds:
 *   { m_geoFenceName, m_shouldKeepOutside, fencetype, LngLatPoints,
 *     m_maximumDistance, isEditable, flightPath,  // Leaflet layer, added by js_main
 *     Units: { [partyID]: { geoFenceInfo, geoFenceHitInfo } } }
 */
class CGeoFenceRegistry {
    constructor() {
        this.m_fences = {};
    }

    /** @returns {object|null} fence or null */
    fn_get(p_name) {
        const f = this.m_fences[p_name];
        return (f === undefined) ? null : f;
    }

    /** @returns {boolean} */
    fn_has(p_name) {
        return this.m_fences.hasOwnProperty(p_name);
    }

    /** insert/replace a fence by name */
    fn_set(p_name, p_fence) {
        this.m_fences[p_name] = p_fence;
    }

    /** detach a unit from a fence (no-op if fence or unit missing) */
    fn_removeUnit(p_name, p_partyID) {
        const fence = this.m_fences[p_name];
        if (fence && fence.Units && fence.Units.hasOwnProperty(p_partyID)) {
            delete fence.Units[p_partyID];
        }
    }

    /** attach a unit to a fence with the given geoFenceInfo */
    fn_addUnit(p_name, p_partyID, p_geoFenceInfo) {
        let fence = this.m_fences[p_name];
        if (!fence) return;
        if (!fence.Units) fence.Units = {};
        fence.Units[p_partyID] = {};
        fence.Units[p_partyID].geoFenceInfo = p_geoFenceInfo;
    }

    /** @returns {object|null} { geoFenceInfo } | null */
    fn_getUnit(p_name, p_partyID) {
        const fence = this.m_fences[p_name];
        if (!fence || !fence.Units) return null;
        const u = fence.Units[p_partyID];
        return (u === undefined) ? null : u;
    }

    /** @returns {string[]} fence names (replaces Object.keys in js_main) */
    fn_keys() {
        return Object.keys(this.m_fences);
    }

    /** @returns {number} */
    fn_size() {
        return Object.keys(this.m_fences).length;
    }

    fn_clear() {
        this.m_fences = {};
    }
}

export const js_geoFenceRegistry = new CGeoFenceRegistry();
