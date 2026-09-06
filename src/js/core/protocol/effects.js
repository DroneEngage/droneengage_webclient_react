/**
 * TASK-02 — fn_effects: pure outbound-command declaration.
 *
 * Takes a unit and a decoded Message, returns the Commands the runtime should
 * send (via the facade) after applying patches. Does NOT call the facade,
 * does NOT touch globals or the DOM. This inversion — returning what should
 * be sent instead of sending it — is what breaks the parser<->facade cycle.
 *
 * For the currently-migrated types (GPS, POW, NAV_INFO, CommSignalsStatus,
 * Communication_Line_Status) there are NO outbound commands; the facade calls
 * attached to the ID/SDR/P2P message types move here when those types are
 * migrated.
 */

/**
 * @param {object} unit
 * @param {import('./types.js').Message} msg
 * @returns {import('./types.js').Command[]}
 */
export function fn_effects(unit, msg) {
    // No migrated message type produces outbound commands yet.
    // When ID is migrated, the delayed REQUEST_P2P / REQUEST_SDR and the
    // #prv_onNewUnitAdded calls (REQUEST_GEOFENCE_STATUS, REQUEST_UDP_PROXY_STATUS,
    // REQUEST_WAYPOINTS) become Command objects returned here.
    return [];
}
