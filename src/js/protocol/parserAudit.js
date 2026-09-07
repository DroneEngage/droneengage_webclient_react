/**
 * TASK-02.6 dead-man switch — Layer 3: startup audit.
 *
 * At init time, enumerate every CONST_TYPE_AndruavMessage_* constant and
 * classify it:
 *   - migrated   → in fn_isMigrated (handled by reduce/runtime)
 *   - binary     → handled by parseBinaryAndruavMessage
 *   - outbound   → GCS→drone commands sent via API_sendCMD / 'mt': fields
 *   - old-switch → (empty — parseCommunicationMessage was deleted)
 *   - UNHANDLED  → in none of the above — a potentially missed inbound case
 *
 * In dev mode, logs the classification summary + any unhandled types.
 * In production, silent (the runtime Layer 1 + Layer 2 warnings still fire
 * if an unhandled type actually arrives on the wire).
 *
 * Called once from fn_initFacadeSubscriptions in runtime.js.
 */
import * as js_andruavMessages from './messages/js_andruavMessages.js';
import { fn_isMigrated } from '../core/protocol/reduce.js';

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
    js_andruavMessages.CONST_TYPE_AndruavMessage_Unit_Name,
    js_andruavMessages.CONST_TYPE_AndruavMessage_UploadWayPoints,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Upload_DE_Mission,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SOUND_PLAY_FILE,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SOUND_TEXT_TO_SPEECH,
]);

// parseCommunicationMessage was deleted in TASK-02.6. There is no old
// switch fallback. This set is kept empty for the classification logic.
const OLD_SWITCH_TYPES = new Set([]);

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
        } else {
            unhandled.push(name);
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        console.info(`[parser-audit] ${all.length} message types: ${migrated.length} migrated, ${binary.length} binary, ${outbound.length} outbound, ${oldSwitch.length} old-switch, ${unhandled.length} unhandled`);
        if (unhandled.length > 0) {
            console.warn(`[parser-audit] unhandled types (deprecated or missed inbound cases):`, unhandled);
        }
    }

    return { total: all.length, migrated, binary, outbound, oldSwitch, unhandled };
}
