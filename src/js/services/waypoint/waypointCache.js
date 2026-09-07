/**
 * TASK-02.2 — Per-unit chunked waypoint assembly cache.
 *
 * Replaces js_globals.v_waypointsCache. A waypoint download arrives as
 * 1..N chunks. This cache holds the in-progress array keyed by partyID,
 * and is cleared on last chunk, on a new download request, or on unit
 * removal.
 */
class CWaypointCache {
    constructor() {
        this.m_cache = {};
    }

    /** @returns {boolean} */
    fn_has(p_partyID) {
        return this.m_cache.hasOwnProperty(p_partyID);
    }

    /** @returns {Array} the in-progress array (creates [] if missing) */
    fn_get(p_partyID) {
        if (!this.m_cache.hasOwnProperty(p_partyID)) {
            this.m_cache[p_partyID] = [];
        }
        return this.m_cache[p_partyID];
    }

    fn_set(p_partyID, p_wps) {
        this.m_cache[p_partyID] = p_wps;
    }

    /** delete one entry */
    fn_clear(p_partyID) {
        delete this.m_cache[p_partyID];
    }

    fn_clearAll() {
        this.m_cache = {};
    }
}

export const js_waypointCache = new CWaypointCache();
