/**
 * TASK-02.6 dead-man switch — Layer 3: startup audit.
 *
 * At init time, enumerate every CONST_TYPE_AndruavMessage_* constant and
 * classify it:
 *   - migrated   → in fn_isMigrated (handled by reduce/runtime)
 *   - binary     → handled by parseBinaryAndruavMessage
 *   - outbound   → GCS→drone commands sent via API_sendCMD / 'mt': fields
 *   - old-switch → (empty — parseCommunicationMessage was deleted)
 *   - known-noop → inbound but intentionally not processed by the GCS
 *                  (deprecated aliases, old telemetry variants, module-
 *                  specific status with no GCS UI)
 *   - UNHANDLED  → in none of the above — a potentially missed inbound case
 *
 * In dev mode, logs the classification summary + any unhandled types.
 * In production, silent (the runtime Layer 1 + Layer 2 warnings still fire
 * if an unhandled type actually arrives on the wire).
 *
 * Called once from fn_initFacadeSubscriptions in runtime.js.
 */
import * as js_andruavMessages from './messages/js_andruavMessages.js';
import { fn_isMigrated } from '../core/protocol/reduce';

// Binary-path types handled by parseBinaryAndruavMessage, not the JSON switch.
const BINARY_TYPES = new Set([
    js_andruavMessages.CONST_TYPE_AndruavMessage_TELNET_DATA,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_SPECTRUM,
    js_andruavMessages.CONST_TYPE_AndruavMessage_IMG,
]);

// Outbound command types — sent by the GCS to the drone via API_sendCMD
// or constructed message objects with 'mt' fields. These should never
// arrive as inbound messages on the WebClient; if they do, the runtime
// Layer 1/Layer 2 warnings will fire.
const OUTBOUND_TYPES = new Set([
    js_andruavMessages.CONST_TYPE_AndruavMessage_Arm,
    js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_CameraSwitch,
    js_andruavMessages.CONST_TYPE_AndruavMessage_ChangeAltitude,
    js_andruavMessages.CONST_TYPE_AndruavMessage_ChangeSpeed,
    js_andruavMessages.CONST_TYPE_AndruavMessage_CirclePoint,
    js_andruavMessages.CONST_TYPE_AndruavMessage_CONFIG_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Ctrl_Camera,
    js_andruavMessages.CONST_TYPE_AndruavMessage_DEPilot_Control,
    js_andruavMessages.CONST_TYPE_AndruavMessage_DoYAW,
    js_andruavMessages.CONST_TYPE_AndruavMessage_ExternalCommand_WayPoints,
    js_andruavMessages.CONST_TYPE_AndruavMessage_FlightControl,
    js_andruavMessages.CONST_TYPE_AndruavMessage_FollowHim_Request,
    js_andruavMessages.CONST_TYPE_AndruavMessage_GimbalCtrl,
    js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_REMOTE_EXECUTE,
    js_andruavMessages.CONST_TYPE_AndruavMessage_GuidedPoint,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Land,
    js_andruavMessages.CONST_TYPE_AndruavMessage_LocalServer_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_MakeSwarm,
    js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteControl2,
    js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteControlSettings,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_REMOTE_EXECUTE,
    js_andruavMessages.CONST_TYPE_AndruavMessage_ServoChannel,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SetHomeLocation,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Set_Communication_Line,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Sync_EventFire,
    js_andruavMessages.CONST_TYPE_AndruavMessage_TargetTracking_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_TELNET_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_TELNET_REMOTE_EXECUTE,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Unit_Name,
    js_andruavMessages.CONST_TYPE_AndruavMessage_UploadWayPoints,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Upload_DE_Mission,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SOUND_PLAY_FILE,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SOUND_TEXT_TO_SPEECH,
    js_andruavMessages.CONST_TYPE_AndruavMessage_FollowMe_Guided,
    js_andruavMessages.CONST_TYPE_AndruavMessage_LocalServer_REMOTE_EXECUTE,
]);

// parseCommunicationMessage was deleted in TASK-02.6. There is no old
// switch fallback. This set is kept empty for the classification logic.
const OLD_SWITCH_TYPES = new Set([]);

// Inbound message types the GCS intentionally does NOT process. These are
// either deprecated aliases (e.g. BinaryIMU = IMU), old telemetry variants
// superseded by migrated types (Telemetry → NAV_INFO/GPS), or module-
// specific telemetry/status the web client has no UI for (IMU raw data,
// IR camera status, MAVLink events, P2P status, etc.). They arrive on the
// wire but are silently dropped — classifying them here keeps the audit
// useful for genuinely missed cases instead of warning about known no-ops.
const KNOWN_NOOP_TYPES = new Set([
    js_andruavMessages.CONST_TYPE_AndruavMessage_Telemetry,          // old, superseded by NAV_INFO/GPS
    js_andruavMessages.CONST_TYPE_AndruavMessage_VideoFrame,         // video handled by WebRTC, not the parser
    js_andruavMessages.CONST_TYPE_AndruavMessage_IMU,               // raw IMU, GCS doesn't display
    js_andruavMessages.CONST_TYPE_AndruavMessage_BinaryIMU,          // deprecated alias for IMU (same value)
    js_andruavMessages.CONST_TYPE_AndruavMessage_IMUStatistics,     // IMU stats, not displayed
    js_andruavMessages.CONST_TYPE_AndruavMessage_SensorsStatus,     // sensor status, not displayed
    js_andruavMessages.CONST_TYPE_AndruavMessage_SwarmReport,        // swarm report, not handled
    js_andruavMessages.CONST_TYPE_AndruavMessage_UpdateSwarm,        // swarm update, not handled
    js_andruavMessages.CONST_TYPE_AndruavMessage_Ping_Unit,         // ping, transport-level
    js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_Telemetry,// viewlink telemetry, not displayed
    js_andruavMessages.CONST_TYPE_AndruavMessage_LightTelemetry,    // lightweight telemetry variant
    js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_STATUS,        // P2P status, not displayed
    js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_TRIGGER,       // SDR trigger, module-internal
    js_andruavMessages.CONST_TYPE_AndruavMessage_Mission_Item_Sequence, // mission item sequence, not handled
    js_andruavMessages.CONST_TYPE_AndruavMessage_LocalServer_STATUS,// local server status, not displayed
    js_andruavMessages.CONST_TYPE_AndruavMessage_MAVLINK_EVENTS,    // MAVLink events, not displayed
    js_andruavMessages.CONST_TYPE_AndruavMessage_IR_CAMERA_MI48_ACTION, // IR camera action, module-internal
    js_andruavMessages.CONST_TYPE_AndruavMessage_IR_CAMERA_MI48_STATUS, // IR camera status, not displayed
]);

export function fn_auditMessageTypes() {
    const all = [];
    for (const [name, value] of Object.entries(js_andruavMessages)) {
        if (name.startsWith('CONST_TYPE_AndruavMessage_') && typeof value === 'number') {
            all.push({ name, value });
        }
    }

    const migrated = [];
    const binary = [];
    const outbound = [];
    const oldSwitch = [];
    const knownNoop = [];
    const unhandled = [];

    for (const { name, value } of all) {
        if (fn_isMigrated(value)) {
            migrated.push(name);
        } else if (BINARY_TYPES.has(value)) {
            binary.push(name);
        } else if (OUTBOUND_TYPES.has(value)) {
            outbound.push(name);
        } else if (OLD_SWITCH_TYPES.has(value)) {
            oldSwitch.push(name);
        } else if (KNOWN_NOOP_TYPES.has(value)) {
            knownNoop.push(name);
        } else {
            unhandled.push(name);
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        console.info(`[parser-audit] ${all.length} message types: ${migrated.length} migrated, ${binary.length} binary, ${outbound.length} outbound, ${oldSwitch.length} old-switch, ${knownNoop.length} known-noop, ${unhandled.length} unhandled`);
        if (unhandled.length > 0) {
            console.warn(`[parser-audit] unhandled types (deprecated or missed inbound cases):`, unhandled);
        }
    }

    return { total: all.length, migrated, binary, outbound, oldSwitch, knownNoop, unhandled };
}
