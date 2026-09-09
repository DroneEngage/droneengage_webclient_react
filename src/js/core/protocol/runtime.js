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

import { fn_decode } from './decode';
import * as js_session from '../../state/session.js';
import { CONST_EXPERIMENTAL_FEATURES_ENABLED } from '../../config/constants.js';
import { fn_reduce, fn_isMigrated, WAYPOINT_NO_CHUNK, WAYPOINT_LAST_CHUNK } from './reduce';
import { fn_effects } from './effects';
import { fn_setByPath, fn_getByPath } from './path.js';
import { COMMANDS } from './types';

import { fn_getOrCreateUnit } from '../../model/unitRegistry.js';
import { notifyUnitFieldChanged } from '../../store/unitStore.js';
import { js_eventEmitter } from '../../events/js_eventEmitter.js';
import { EVENTS as js_event } from '../../events/js_eventList.js';
import { fn_unitError, fn_waypointsEvent } from '../../events/eventPayloads.js';
import * as js_andruav_facade from '../../protocol/server_comm/js_andruav_facade.js';
import * as js_helpers from '../../js_helpers.js';
import { js_geoFenceRegistry } from '../../services/geo/geoFenceRegistry.js';
import { js_waypointCache } from '../../services/waypoint/waypointCache.js';
import { js_callbackRegistry } from '../../protocol/callbackRegistry.js';
import { fn_auditMessageTypes } from '../../protocol/parserAudit.js';
import { CONST_TYPE_AndruavMessage_CommSignalsStatus,
         CONST_TYPE_AndruavMessage_ExternalGeoFence,
         CONST_TYPE_AndruavMessage_SearchTargetList,
         CONST_TYPE_AndruavMessage_TargetTrackingtLocation,
         CONST_TYPE_AndruavMessage_CONFIG_STATUS } from '../../protocol/messages/js_andruavMessages.js';

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
        // Dead-man switch detection (Layer 1): warn in dev mode for any
        // unmigrated type. If this fires AND the old switch's default fires
        // (Layer 2), the type is truly unhandled — a missed case.
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[parser] type ${msg.type} not migrated — falling through to old switch`);
        }
        return false;
    }

    // ExternalGeoFence: transport-level senderName guard. Only '_sys_' is
    // allowed to send external fences; anything else is dropped (matches the
    // old switch's early `return;`). Checked here so reduce stays pure.
    if (msg.type === CONST_TYPE_AndruavMessage_ExternalGeoFence && msg.senderID !== '_sys_') {
        return true;
    }

    // SearchTargetList / TargetTrackingtLocation: experimental-feature gate.
    // When the flag is off, the old switch returns early (drops the message).
    // Return false so the old switch runs its early-return — no double side
    // effect. Once the old cases are deleted this guard still drops cleanly.
    if ((msg.type === CONST_TYPE_AndruavMessage_SearchTargetList
            || msg.type === CONST_TYPE_AndruavMessage_TargetTrackingtLocation)
        && CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
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
    notifyUnitFieldChanged(unit.getPartyID(), 'm_Messages.m_messages_in');
    notifyUnitFieldChanged(unit.getPartyID(), 'm_Messages.m_received_msg');

    const result = fn_reduce(unit, msg);
    if (result === null) {
        // Should not happen (fn_isMigrated passed) but guard anyway.
        return false;
    }

    // If the reduce result uses ordered ops (ID message), execute them in
    // order — this preserves the exact interleaving of field writes, unit
    // method calls (e.g. fn_resetOnBoardConnection), and event dispatches.
    // Otherwise apply patches + events as before.
    if (result.ops) {
        fn_executeOps(unit, result.ops);
    } else {
        fn_applyPatches(unit, result.patches);

        // CommSignalsStatus: compute the network-type rank (needs js_helpers).
        if (msg.type === CONST_TYPE_AndruavMessage_CommSignalsStatus) {
            const rank = js_helpers.fn_getNetworkType(msg.payload.s);
            fn_setByPath(unit, 'm_SignalStatus.m_mobileNetworkTypeRank', rank);
            notifyUnitFieldChanged(unit.getPartyID(), 'm_SignalStatus.m_mobileNetworkTypeRank');
        }

        // Dispatch coarse events. If an event carries a `method`, call it on
        // the unit (or sub-object) before dispatching. If it carries
        // notifyFields, notify the store for each field after the method runs
        // (replaces the js_main.js __unitStoreBridge).
        for (const ev of result.events) {
            if (ev.method) {
                callUnitMethod(unit, ev.method, ev.methodArg);
            }
            if (ev.notifyFields) {
                const pid = unit.getPartyID();
                for (const fp of ev.notifyFields) {
                    notifyUnitFieldChanged(pid, fp);
                }
            }
            // Runtime-only pseudo-events (prefixed __) are handled here, not
            // dispatched through the event emitter.
            if (ev.name === '__geoFenceAttach') {
                fn_handleGeoFenceAttach(ev.payload);
                continue;
            }
            if (ev.name === '__callbackReply') {
                js_callbackRegistry.fn_fireOnce(ev.payload.messageType, ev.payload.session);
                continue;
            }
            if (ev.name === '__configStatusReply') {
                fn_handleConfigStatusReply(ev.payload);
                continue;
            }
            js_eventEmitter.fn_dispatch(ev.name, ev.payload);
        }
    }

    // WayPoints: chunked waypoint assembly. reduce returns the decoded
    // { wps, isChunk }; runtime owns the cache and the dispatch decision.
    // Full message dispatches immediately; chunked dispatches only on the
    // last chunk; a new full message clears any stale partial cache.
    if (result.waypoints) {
        const { wps, isChunk } = result.waypoints;
        if (isChunk === WAYPOINT_NO_CHUNK) {
            js_waypointCache.fn_clear(unit.getPartyID());
            js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_WayPoints, fn_waypointsEvent(unit, wps));
        } else {
            const cached = js_waypointCache.fn_get(unit.getPartyID());
            for (const wp of wps) cached.push(wp);
            if (isChunk === WAYPOINT_LAST_CHUNK) {
                js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_WayPoints, fn_waypointsEvent(unit, cached));
                js_waypointCache.fn_clear(unit.getPartyID());
            }
        }
    }

    // Effects run AFTER ops/patches so unit state (module flags etc.) is
    // current. The reduce result is passed for ID (isNewUnit).
    const cmds = fn_effects(unit, msg, result);

    // Dispatch outbound commands (the ONLY place the facade is called).
    fn_dispatchCommands(unit, cmds);

    return true;
}

// ---------------------------------------------------------------------------
// One-time subscriptions for facade calls that were moved out of the parser
// as event dispatches (the parser no longer imports the facade). These are
// permanent app-lifetime subscriptions.
// ---------------------------------------------------------------------------
let _facadeSubscriptionsInitialized = false;
export function fn_initFacadeSubscriptions() {
    if (_facadeSubscriptionsInitialized) return;
    _facadeSubscriptionsInitialized = true;

    // Dead-man switch Layer 3: startup audit of all message types.
    fn_auditMessageTypes();

    // From _fn_checkStatus in the parser.
    js_eventEmitter.fn_subscribe('__facadeGetHomeLocation', { __runtimeFacade: true }, (_me, unit) => {
        js_andruav_facade.AndruavClientFacade.API_do_GetHomeLocation(unit);
    });
    js_eventEmitter.fn_subscribe('__facadeRequestID', { __runtimeFacade: true }, (_me, partyId) => {
        js_andruav_facade.AndruavClientFacade.API_requestID(partyId);
    });

    // From GeoFenceAttachStatus in the parser (parser-instance fence registry).
    js_eventEmitter.fn_subscribe('__facadeRequestGeoFences', { __runtimeFacade: true }, (_me, data) => {
        js_andruav_facade.AndruavClientFacade.API_requestGeoFences(data.unit, data.fenceName);
    });
}

function callUnitMethod(unit, methodPath, arg) {
    const lastDot = methodPath.lastIndexOf('.');
    const parentPath = lastDot >= 0 ? methodPath.slice(0, lastDot) : '';
    const methodName = methodPath.slice(lastDot + 1);
    const parent = parentPath ? fn_getByPath(unit, parentPath) : unit;
    if (parent && typeof parent[methodName] === 'function') {
        if (Array.isArray(arg)) parent[methodName](...arg);
        else parent[methodName](arg);
    }
}

// CONFIG_STATUS reply: resolve the module, set its template, fire the
// callback once. Mirrors the old parser case exactly.
function fn_handleConfigStatusReply(payload) {
    const { unit, moduleKey, template } = payload;
    const module = unit.m_modules.getModuleByKey(moduleKey);
    if (!module) return; // PUBLISH ERROR (old case returned without callback)
    module.template = template;
    js_callbackRegistry.fn_fireOnce(CONST_TYPE_AndruavMessage_CONFIG_STATUS, { p_unit: unit, p_module: module });
}

// GeoFenceAttachStatus: apply attach/detach intent to the shared registry.
// Mirrors the old parser case exactly: attach adds the unit if the fence
// exists (or requests it if missing); detach removes the unit.
function fn_handleGeoFenceAttach(payload) {
    const { unit, fenceName, isAttached } = payload;
    const fence = js_geoFenceRegistry.fn_get(fenceName);
    if (isAttached === true) {
        if (fence === null) {
            js_eventEmitter.fn_dispatch('__facadeRequestGeoFences', { unit, fenceName });
            return;
        }
        if (js_geoFenceRegistry.fn_getUnit(fenceName, unit.getPartyID()) === null) {
            const geoFenceInfo = {
                hasValue: false,
                fenceName: fence.m_geoFenceName,
                m_inZone: false,
                distance: Number.NaN,
                m_shouldKeepOutside: fence.m_shouldKeepOutside,
            };
            js_geoFenceRegistry.fn_addUnit(fenceName, unit.getPartyID(), geoFenceInfo);
        }
    } else {
        if (fence !== null) {
            js_geoFenceRegistry.fn_removeUnit(fenceName, unit.getPartyID());
        }
    }
}

function fn_executeOps(unit, ops) {
    for (const op of ops) {
        switch (op.op) {
            case 'set':
                fn_setByPath(unit, op.path, op.value);
                notifyUnitFieldChanged(unit.getPartyID(), op.path);
                break;
            case 'method':
                callUnitMethod(unit, op.method, op.arg);
                if (op.notifyFields) {
                    const pid = unit.getPartyID();
                    for (const fp of op.notifyFields) {
                        notifyUnitFieldChanged(pid, fp);
                    }
                }
                break;
            case 'dispatch':
                // Internal pseudo-events (prefixed __) are runtime concerns
                // that don't go through the event emitter.
                if (op.name === '__listAdd') {
                    js_session.fn_getAndruavUnitList().Add(unit.getPartyID(), unit);
                } else if (op.name === '__listPutUnit') {
                    js_session.fn_getAndruavUnitList().putUnit(unit.getPartyID(), unit);
                } else if (op.name === '__delayedVersionNotice') {
                    const payload = op.payload;
                    setTimeout(() => {
                        js_eventEmitter.fn_dispatch(js_event.EE_andruavUnitError, fn_unitError(payload.unit, { notification_Type: 5, Description: payload.label }));
                    }, 1000);
                } else {
                    js_eventEmitter.fn_dispatch(op.name, op.payload);
                }
                break;
        }
    }
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
