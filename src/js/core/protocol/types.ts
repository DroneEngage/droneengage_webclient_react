/**
 * TASK-02 / TASK-06 — shared types for the inbound decode/reduce/effects split.
 *
 * Promoted from JSDoc typedefs to real TypeScript interfaces so the layer
 * boundary (reduce/effects must not import the facade, globals, or DOM) is
 * enforced at compile time. These mirror the outbound direction already
 * built in src/js/protocol/messages/js_commands_api.js: data in, data out,
 * no side effects.
 */

/**
 * A decoded inbound message.
 */
export interface Message {
    /** Andruav message-type constant (CONST_TYPE_AndruavMessage_*). */
    type: number;
    /** sender party id (msg.senderName from the WS layer). */
    senderID: string;
    /** decoded message payload (stringified payloads are JSON.parsed by fn_decode). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
    /** timestamp the frame was received (set by runtime; used by reduce instead of Date.now()). */
    receivedAt: number;
    /** the original parsed frame object from #prv_parseJSONMessage, for handlers that need envelope fields. */
    raw?: object;
}

/**
 * A single field-level mutation to apply to a unit.
 */
export interface FieldPatch {
    /** dot-path into the unit, e.g. "m_Nav_Info.p_Location.lat". The SAME path format useUnitField / notifyUnitFieldChanged consume. */
    path: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
}

/**
 * A coarse event the runtime should dispatch after applying patches.
 * This keeps the 60 fn_dispatch calls declarative: reduce declares which
 * events fire for a message type, runtime performs the actual dispatch.
 */
export interface Dispatch {
    /** event name from js_eventList (e.g. "EE_msgFromUnit_GPS"). */
    name: string;
    /** payload to pass to fn_dispatch (usually the unit). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
    /** optional dot-path to a unit method to call BEFORE dispatching (e.g. "m_tracker.fn_updateTrackerStatus"). */
    method?: string;
    /** single argument passed to the method. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    methodArg?: any;
    /** optional field paths to notify via notifyUnitFieldChanged after the method runs. Used when a method mutates fields opaquely (e.g. tracker methods) so the bridge in js_main.js is not needed. */
    notifyFields?: string[];
}

/**
 * An outbound action the runtime should perform after applying patches.
 */
export interface Command {
    /** a name from the COMMANDS map below, e.g. 'REQUEST_WAYPOINTS'. */
    kind: CommandKind;
    /** target party id (or unit, resolved by runtime). */
    target?: string;
    /** extra arguments for the command. */
    args?: { fenceName?: string; [key: string]: unknown };
    /** replaces inline setTimeout(...) calls in the old parser. */
    delayMs?: number;
}

/**
 * An ordered operation for messages that interleave field writes, unit-method
 * calls, and event dispatches (notably the ID message, where
 * fn_resetOnBoardConnection must run between specific field writes).
 * Runtime executes ops in array order. For 'set' it writes + notifies; for
 * 'method' it calls the unit method; for 'dispatch' it fires the event.
 */
export interface Op {
    op: 'set' | 'method' | 'dispatch';
    /** for 'set': dot-path into the unit. */
    path?: string;
    /** for 'set': the new value. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any;
    /** for 'method': dot-path to a unit method. */
    method?: string;
    /** for 'method': single argument. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arg?: any;
    /** for 'dispatch': event name. */
    name?: string;
    /** for 'dispatch': event payload. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
    /** optional field paths to notify after a 'method' op runs. */
    notifyFields?: string[];
}

/**
 * Result of fn_reduce. Either the classic { patches, events } shape, or the
 * ordered-ops shape (ID message), plus optional waypoint/chunked data and
 * ID-specific fields consumed by effects.
 */
export interface ReduceResult {
    patches: FieldPatch[];
    events: Dispatch[];
    /** ordered operations (ID message); when present, runtime executes ops instead of patches+events. */
    ops?: Op[];
    /** ID-message trigger flags consumed by reduceIDEffects. */
    triggers?: { [key: string]: boolean };
    /** ID-message: whether the unit was newly created. */
    isNewUnit?: boolean;
    /** WayPoints: decoded waypoints + chunk indicator; runtime owns the cache + dispatch. */
    waypoints?: { wps: WayPointStep[]; isChunk: number };
    /** RemoteExecute: the inner C field, used by effects to decide SEND_ID. */
    remoteExecuteC?: number;
}

/**
 * A decoded waypoint step (output of fn_decodeWaypointStep). Fields vary by
 * waypointType; only the fields set for a given type are populated.
 */
export interface WayPointStep {
    waypointType: number;
    m_Sequence?: number;
    Longitude?: number;
    Latitude?: number;
    Altitude?: number;
    Heading?: number;
    TimeToStay?: number;
    Pitch?: number;
    Enable?: boolean;
    AscentDescentRate?: number;
    AscentorDescent?: number;
    DesiredAltitude?: number;
    m_Header_Required?: boolean;
    m_Xtrack_Location?: number;
    m_Radius?: number;
    m_Turns?: number;
    [key: string]: unknown;
}

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
} as const);

export type CommandKind = typeof COMMANDS[keyof typeof COMMANDS];
