/**
 * TASK-02 — shared typedefs for the inbound decode/reduce/effects split.
 *
 * These mirror the outbound direction already built in
 * src/js/protocol/messages/js_commands_api.js: data in, data out, no side
 * effects. reduce.js and effects.js must NOT import the facade, globals, or
 * touch the DOM — that inversion (returning what should be sent instead of
 * sending it) is what breaks the parser<->facade import cycle.
 */

/**
 * A decoded inbound message.
 *
 * @typedef {Object} Message
 * @property {number}  type        - Andruav message-type constant (CONST_TYPE_AndruavMessage_*).
 * @property {string}  senderID    - sender party id (msg.senderName from the WS layer).
 * @property {object}  payload     - decoded message payload (stringified payloads are JSON.parsed by fn_decode).
 * @property {number}  receivedAt  - timestamp the frame was received (set by runtime; used by reduce instead of Date.now()).
 * @property {object}  [raw]       - the original parsed frame object from #prv_parseJSONMessage, for handlers that need envelope fields.
 */

/**
 * A single field-level mutation to apply to a unit.
 *
 * @typedef {Object} FieldPatch
 * @property {string} path  - dot-path into the unit, e.g. "m_Nav_Info.p_Location.lat".
 *                            The SAME path format useUnitField / notifyUnitFieldChanged consume.
 * @property {*}      value - the new value.
 */

/**
 * A coarse event the runtime should dispatch after applying patches.
 * This keeps the 60 fn_dispatch calls declarative: reduce declares which
 * events fire for a message type, runtime performs the actual dispatch.
 *
 * @typedef {Object} Dispatch
 * @property {string} name    - event name from js_eventList (e.g. "EE_msgFromUnit_GPS").
 * @property {*}      payload - payload to pass to fn_dispatch (usually the unit).
 * @property {string} [method]     - optional dot-path to a unit method to call BEFORE
 *                                   dispatching (e.g. "m_tracker.fn_updateTrackerStatus").
 * @property {*}      [methodArg]  - single argument passed to the method.
 * @property {string[]} [notifyFields] - optional field paths to notify via
 *                                   notifyUnitFieldChanged after the method runs.
 *                                   Used when a method mutates fields opaquely
 *                                   (e.g. tracker methods) so the bridge in
 *                                   js_main.js is not needed.
 */

/**
 * An outbound action the runtime should perform after applying patches.
 *
 * @typedef {Object} Command
 * @property {string}  kind      - a name from the COMMANDS map below, e.g. 'REQUEST_WAYPOINTS'.
 * @property {string}  [target]  - target party id (or unit, resolved by runtime).
 * @property {object}  [args]    - extra arguments for the command.
 * @property {number}  [delayMs] - replaces inline setTimeout(...) calls in the old parser.
 */

/**
 * An ordered operation for messages that interleave field writes, unit-method
 * calls, and event dispatches (notably the ID message, where
 * fn_resetOnBoardConnection must run between specific field writes).
 * Runtime executes ops in array order. For 'set' it writes + notifies; for
 * 'method' it calls the unit method; for 'dispatch' it fires the event.
 *
 * @typedef {Object} Op
 * @property {'set'|'method'|'dispatch'} op
 * @property {string} [path]      - for 'set': dot-path into the unit.
 * @property {*}      [value]     - for 'set': the new value.
 * @property {string} [method]    - for 'method': dot-path to a unit method.
 * @property {*}      [arg]       - for 'method': single argument.
 * @property {string} [name]      - for 'dispatch': event name.
 * @property {*}      [payload]   - for 'dispatch': event payload.
 */

/**
 * Frozen map of command kind -> identifier. effects.js returns these names;
 * runtime.js maps them to the single facade call site. This is the ONLY place
 * the set of allowed commands is defined, so the cycle-breaking invariant is
 * enforceable by grep (reduce/effects must not reference the facade).
 */
export const COMMANDS = Object.freeze({
    REQUEST_ID: 'REQUEST_ID',
    SEND_ID: 'SEND_ID',
    REQUEST_GEOFENCE_STATUS: 'REQUEST_GEOFENCE_STATUS',
    REQUEST_UDP_PROXY_STATUS: 'REQUEST_UDP_PROXY_STATUS',
    REQUEST_WAYPOINTS: 'REQUEST_WAYPOINTS',
    REQUEST_GEOFENCES: 'REQUEST_GEOFENCES',
    REQUEST_P2P: 'REQUEST_P2P',
    REQUEST_SDR: 'REQUEST_SDR',
    GET_HOME_LOCATION: 'GET_HOME_LOCATION',
});
