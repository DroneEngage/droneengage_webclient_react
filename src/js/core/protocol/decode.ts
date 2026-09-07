/**
 * TASK-02 / TASK-06 — fn_decode: pure transport decode.
 *
 * Takes the frame object produced by js_andruav_ws.js#prv_parseJSONMessage
 * (already JSON.parsed at the WS layer) and normalizes it into a Message.
 *
 * The 22 `typeof x === 'string' || x instanceof String` backward-compatibility
 * branches from the old switch live HERE. Old units still send stringified
 * payloads for a known set of message types; fn_decode JSON.parses those so
 * reduce.ts never sees a string. Types that historically did NOT do the check
 * are left untouched to preserve exact behavior.
 *
 * PURE: no facade, no globals, no DOM, no Date.now (receivedAt is passed in).
 */

import { CONST_TYPE_AndruavMessage_GPS,
         CONST_TYPE_AndruavMessage_POW,
         CONST_TYPE_AndruavMessage_Chat,
         CONST_TYPE_AndruavMessage_NAV_INFO,
         CONST_TYPE_AndruavMessage_CameraFlash,
         CONST_TYPE_AndruavMessage_CameraZoom,
         CONST_TYPE_AndruavMessage_CameraList,
         CONST_TYPE_AndruavMessage_SOUND_LIST,
         CONST_TYPE_AndruavMessage_HomeLocation,
         CONST_TYPE_AndruavMessage_DistinationLocation,
         CONST_TYPE_AndruavMessage_GeoFence,
         CONST_TYPE_AndruavMessage_GeoFenceAttachStatus,
         CONST_TYPE_AndruavMessage_GEOFenceHit,
         CONST_TYPE_AndruavMessage_DroneReport,
         CONST_TYPE_AndruavMessage_Signaling,
         CONST_TYPE_AndruavMessage_Error,
         CONST_TYPE_AndruavMessage_WayPoints,
         CONST_TYPE_AndruavMessage_RemoteExecute,
         CONST_TYPE_AndruavMessage_ExternalGeoFence,
         CONST_TYPE_AndruavMessage_TELNET_STATUS,
         CONST_TYPE_AndruavMessage_Viewlink_STATUS,
         CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS,
         CONST_TYPE_AndruavMessage_AI_Recognition_STATUS } from '../../protocol/messages/js_andruavMessages.js';
import type { Message } from './types';

/**
 * Message types whose payload was historically stringified by old units and
 * therefore run through `JSON.parse` in the old switch. This is the exact set
 * of the 22 backward-compat branches — moved, not removed.
 */
const STRING_PAYLOAD_TYPES = new Set<number>([
    CONST_TYPE_AndruavMessage_GPS,
    CONST_TYPE_AndruavMessage_POW,
    CONST_TYPE_AndruavMessage_Chat,
    CONST_TYPE_AndruavMessage_NAV_INFO,
    CONST_TYPE_AndruavMessage_CameraFlash,
    CONST_TYPE_AndruavMessage_CameraZoom,
    CONST_TYPE_AndruavMessage_CameraList,
    CONST_TYPE_AndruavMessage_SOUND_LIST,
    CONST_TYPE_AndruavMessage_HomeLocation,
    CONST_TYPE_AndruavMessage_DistinationLocation,
    CONST_TYPE_AndruavMessage_GeoFence,
    CONST_TYPE_AndruavMessage_GeoFenceAttachStatus,
    CONST_TYPE_AndruavMessage_GEOFenceHit,
    CONST_TYPE_AndruavMessage_DroneReport,
    CONST_TYPE_AndruavMessage_Signaling,
    CONST_TYPE_AndruavMessage_Error,
    CONST_TYPE_AndruavMessage_WayPoints,
    CONST_TYPE_AndruavMessage_RemoteExecute,
    CONST_TYPE_AndruavMessage_ExternalGeoFence,
    CONST_TYPE_AndruavMessage_TELNET_STATUS,
    CONST_TYPE_AndruavMessage_Viewlink_STATUS,
    CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS,
    // AI_Recognition_STATUS: the old switch does NOT string-check its payload,
    // but the inner CLASS_LIST path reads p_jmsg.c which can arrive stringified
    // on very old units. Listed here for safety; the check is a no-op for
    // already-object payloads.
    CONST_TYPE_AndruavMessage_AI_Recognition_STATUS,
]);

/** The frame object shape produced by #prv_parseJSONMessage. */
interface WireFrame {
    _ty?: number;
    groupID?: string;
    senderName: string;
    msgPayload: unknown;
    messageType: number;
    [key: string]: unknown;
}

/**
 * Decode a parsed WS frame into a normalized Message.
 *
 * @param p_frame - the object from #prv_parseJSONMessage
 *        ({ _ty, groupID, senderName, msgPayload, messageType }).
 * @param p_receivedAt - timestamp; defaults to Date.now() at call site (runtime).
 */
export function fn_decode(p_frame: WireFrame, p_receivedAt: number): Message {
    const type = p_frame.messageType;
    let payload = p_frame.msgPayload;

    if (STRING_PAYLOAD_TYPES.has(type)) {
        if (typeof payload === 'string' || payload instanceof String) {
            payload = JSON.parse(payload as string);
        }
    }

    return {
        type,
        senderID: p_frame.senderName,
        payload,
        receivedAt: p_receivedAt,
        raw: p_frame,
    };
}
