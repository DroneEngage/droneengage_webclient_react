/**
 * TASK-02.6 dead-man switch — Layer 3: startup audit.
 *
 * At init time, enumerate every CONST_TYPE_AndruavMessage_* constant and
 * classify it:
 *   - migrated   → in fn_isMigrated (handled by reduce/runtime)
 *   - binary     → handled by parseBinaryAndruavMessage
 *   - old-switch → has a live case in parseCommunicationMessage
 *   - UNHANDLED  → in none of the above — a missed case
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

// Types that have a live case in parseCommunicationMessage (the old switch).
// These are the fallback bodies for earlier-migrated types. If the switch
// is deleted, remove this set.
const OLD_SWITCH_TYPES = new Set([
    js_andruavMessages.CONST_TYPE_AndruavMessage_TargetTracking_STATUS,
    js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_STATUS,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Chat,
    js_andruavMessages.CONST_TYPE_AndruavMessage_UdpProxy_Info,
    js_andruavMessages.CONST_TYPE_AndruavMessage_GPS,
    js_andruavMessages.CONST_TYPE_AndruavMessage_CameraFlash,
    js_andruavMessages.CONST_TYPE_AndruavMessage_CameraZoom,
    js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_InRange_Node,
    js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_InRange_BSSID,
    js_andruavMessages.CONST_TYPE_AndruavMessage_CommSignalsStatus,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Communication_Line_Status,
    js_andruavMessages.CONST_TYPE_AndruavMessage_ID,
    js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
    js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_INFO,
    js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
    js_andruavMessages.CONST_TYPE_AndruavMessage_POW,
    js_andruavMessages.CONST_TYPE_AndruavMessage_HomeLocation,
    js_andruavMessages.CONST_TYPE_AndruavMessage_DistinationLocation,
    js_andruavMessages.CONST_TYPE_AndruavMessage_GEOFenceHit,
    js_andruavMessages.CONST_TYPE_AndruavMessage_DroneReport,
    js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_STATUS,
    js_andruavMessages.CONST_TYPE_AndruavMessage_TELNET_STATUS,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Error,
    js_andruavMessages.CONST_TYPE_AndruavMessage_NAV_INFO,
    js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_STATUS,
    js_andruavMessages.CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS,
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
    const oldSwitch = [];
    const unhandled = [];

    for (const { name, value } of all) {
        if (fn_isMigrated(value)) {
            migrated.push(name);
        } else if (BINARY_TYPES.has(value)) {
            binary.push(name);
        } else if (OLD_SWITCH_TYPES.has(value)) {
            oldSwitch.push(name);
        } else {
            unhandled.push(name);
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        console.info(`[parser-audit] ${all.length} message types: ${migrated.length} migrated, ${binary.length} binary, ${oldSwitch.length} old-switch, ${unhandled.length} unhandled`);
        if (unhandled.length > 0) {
            console.warn(`[parser-audit] unhandled types (likely outbound commands or missed cases):`, unhandled);
        }
    }

    return { total: all.length, migrated, binary, oldSwitch, unhandled };
}
