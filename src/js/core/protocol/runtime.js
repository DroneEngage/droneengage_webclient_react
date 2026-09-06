/**
 * TASK-02 — runtime: the only impure part of the inbound path.
 *
 * fn_handleFrame is wired into js_andruav_ws.js BEHIND the existing switch
 * (TASK-02 step 2). It runs decode + reduce + effects; if the message type is
 * migrated it applies patches, dispatches events, and dispatches commands,
 * then returns true so the caller skips the old switch. If not migrated it
 * returns false and the caller falls through to parseCommunicationMessage.
 *
 * This is the ONLY module under core/protocol that imports the facade, the
 * event emitter, and the unit registry. reduce/effects/decode stay pure.
 */

import { fn_decode } from './decode.js';
import { fn_reduce, fn_isMigrated } from './reduce.js';
import { fn_effects } from './effects.js';
import { fn_setByPath, fn_getByPath } from './path.js';
import { COMMANDS } from './types.js';

import { fn_getOrCreateUnit } from '../../model/unitRegistry.js';
import { notifyUnitFieldChanged } from '../../store/unitStore.js';
import { js_eventEmitter } from '../../events/js_eventEmitter.js';
import * as js_andruav_facade from '../../protocol/server_comm/js_andruav_facade.js';
import * as js_helpers from '../../js_helpers.js';
import { CONST_TYPE_AndruavMessage_CommSignalsStatus } from '../../protocol/messages/js_andruavMessages.js';

/**
 * Handle one inbound frame. Returns true if the message type was migrated
 * (caller should skip the old switch), false otherwise (caller falls through).
 *
 * @param {object} p_frame - the object from #prv_parseJSONMessage
 * @param {object} evt - the original WS event (for byte-length accounting)
 * @returns {boolean}
 */
export function fn_handleFrame(p_frame, evt) {
    const receivedAt = Date.now();
    const msg = fn_decode(p_frame, receivedAt);

    // Bail out BEFORE any side effects for unmigrated types, so the old switch
    // runs cleanly with no double getOrCreateUnit / message accounting.
    if (!fn_isMigrated(msg.type)) {
        return false;
    }

    const isIDMessage = (msg.type === 1004 /* CONST_TYPE_AndruavMessage_ID */);
    const { unit, shouldRequestID } = fn_getOrCreateUnit(msg.senderID, !isIDMessage);
    if (shouldRequestID) {
        js_andruav_facade.AndruavClientFacade.API_requestID(msg.senderID);
    }

    // Message accounting — mirrors the top of parseCommunicationMessage.
    unit.m_Messages.fn_addMsg(msg.type);
    unit.m_Messages.m_received_msg++;
    unit.m_Messages.m_received_bytes += evt.data.length;
    unit.m_Messages.m_lastActiveTime = receivedAt;

    const result = fn_reduce(unit, msg);
    if (result === null) {
        // Should not happen (fn_isMigrated passed) but guard anyway.
        return false;
    }

    const cmds = fn_effects(unit, msg);

    // Apply patches + field-level notifications.
    fn_applyPatches(unit, result.patches);

    // CommSignalsStatus: compute the network-type rank (needs js_helpers).
    if (msg.type === CONST_TYPE_AndruavMessage_CommSignalsStatus) {
        const rank = js_helpers.fn_getNetworkType(msg.payload.s);
        fn_setByPath(unit, 'm_SignalStatus.m_mobileNetworkTypeRank', rank);
        notifyUnitFieldChanged(unit.getPartyID(), 'm_SignalStatus.m_mobileNetworkTypeRank');
    }

    // Dispatch coarse events. If an event carries a `method`, call it on the
    // unit (or sub-object) before dispatching — this handles unit methods like
    // m_tracker.fn_updateTrackerStatus that reduce declares as data.
    for (const ev of result.events) {
        if (ev.method) {
            const lastDot = ev.method.lastIndexOf('.');
            const parentPath = lastDot >= 0 ? ev.method.slice(0, lastDot) : '';
            const methodName = ev.method.slice(lastDot + 1);
            const parent = parentPath ? fn_getByPath(unit, parentPath) : unit;
            if (parent && typeof parent[methodName] === 'function') {
                parent[methodName](ev.methodArg);
            }
        }
        js_eventEmitter.fn_dispatch(ev.name, ev.payload);
    }

    // Dispatch outbound commands (the ONLY place the facade is called).
    fn_dispatchCommands(unit, cmds);

    return true;
}

function fn_applyPatches(unit, patches) {
    for (const patch of patches) {
        fn_setByPath(unit, patch.path, patch.value);
        notifyUnitFieldChanged(unit.getPartyID(), patch.path);
    }
}

function fn_dispatchCommands(unit, cmds) {
    for (const cmd of cmds) {
        const target = cmd.target || unit.getPartyID();
        switch (cmd.kind) {
            case COMMANDS.REQUEST_ID:
                js_andruav_facade.AndruavClientFacade.API_requestID(target);
                break;
            case COMMANDS.SEND_ID:
                js_andruav_facade.AndruavClientFacade.API_sendID();
                break;
            case COMMANDS.REQUEST_GEOFENCE_STATUS:
                js_andruav_facade.AndruavClientFacade.API_requestGeoFencesAttachStatus(unit);
                break;
            case COMMANDS.REQUEST_UDP_PROXY_STATUS:
                js_andruav_facade.AndruavClientFacade.API_requestUdpProxyStatus(unit);
                break;
            case COMMANDS.REQUEST_WAYPOINTS:
                js_andruav_facade.AndruavClientFacade.API_requestWayPoints(unit);
                break;
            case COMMANDS.REQUEST_GEOFENCES:
                js_andruav_facade.AndruavClientFacade.API_requestGeoFences(unit, cmd.args && cmd.args.fenceName);
                break;
            case COMMANDS.REQUEST_P2P:
                if (cmd.delayMs) {
                    if (unit.m_delayedTimeout) clearTimeout(unit.m_delayedTimeout);
                    unit.m_delayedTimeout = setTimeout(() => js_andruav_facade.AndruavClientFacade.API_requestP2P(unit), cmd.delayMs);
                } else {
                    js_andruav_facade.AndruavClientFacade.API_requestP2P(unit);
                }
                break;
            case COMMANDS.REQUEST_SDR:
                if (cmd.delayMs) {
                    if (unit.m_delayedTimeout) clearTimeout(unit.m_delayedTimeout);
                    unit.m_delayedTimeout = setTimeout(() => js_andruav_facade.AndruavClientFacade.API_requestSDR(unit.getPartyID()), cmd.delayMs);
                } else {
                    js_andruav_facade.AndruavClientFacade.API_requestSDR(unit.getPartyID());
                }
                break;
            case COMMANDS.GET_HOME_LOCATION:
                js_andruav_facade.AndruavClientFacade.API_do_GetHomeLocation(unit);
                break;
            default:
                break;
        }
    }
}
