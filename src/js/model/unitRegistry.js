import * as js_session from '../state/session.js';
import { CAndruavUnitObject, CONST_VEHICLE_GCS } from '../js_andruavUnit.js';
import { CONST_TYPE_AndruavMessage_ID, CONST_Unknown_Telemetry } from '../protocol/messages/js_andruavMessages.js';

/**
 * Single place where a remote CAndruavUnitObject is looked up or created.
 * Replaces the duplicated lookup/create block in the WS and parser layers.
 *
 * This module deliberately does NOT import the protocol/facade layer.
 * Requesting the unit ID is a side-effect that callers perform themselves
 * based on the returned `shouldRequestID` flag.
 *
 * @param {string} p_partyID
 * @param {boolean} p_requestIdIfNew - false when the triggering message is itself
 *        an ID message (the parser case), true otherwise (the binary/WS case).
 * @returns {{unit: CAndruavUnitObject, isNew: boolean, shouldRequestID: boolean}}
 */
export function fn_getOrCreateUnit(p_partyID, p_requestIdIfNew) {
    let v_unit = js_session.fn_getAndruavUnitList().fn_getUnit(p_partyID);
    let isNew = false;
    let shouldRequestID = false;

    if (!v_unit) {
        isNew = true;
        v_unit = new CAndruavUnitObject();
        v_unit.m_IsMe = false;
        v_unit.m_defined = false;
        v_unit.setPartyID(p_partyID);
        v_unit.m_index = js_session.fn_getAndruavUnitList().count;
        js_session.fn_getAndruavUnitList().Add(v_unit.getPartyID(), v_unit);

        if (p_requestIdIfNew) {
            if (v_unit.m_Messages.fn_sendMessageAllowed(CONST_TYPE_AndruavMessage_ID)) {
                shouldRequestID = true;
                v_unit.m_Messages.fn_doNotRepeatMessageBefore(CONST_TYPE_AndruavMessage_ID, 1000, new Date());
            }
        }
    }

    return { unit: v_unit, isNew, shouldRequestID };
}

/**
 * Single place where the local GCS ("me") unit is constructed.
 * Replaces the inline construction in CAndruavClientWS.API_addMe2 so that
 * every `new CAndruavUnitObject()` lives in this module.
 *
 * @param {string} p_partyID
 * @param {string} p_unitName
 * @param {string} p_groupName
 * @returns {CAndruavUnitObject}
 */
export function fn_createSelfUnit(p_partyID, p_unitName, p_groupName) {
    const v_unit = new CAndruavUnitObject();
    v_unit.m_IsMe = true;
    v_unit.m_IsGCS = true;
    v_unit.m_unitName = p_unitName;
    v_unit.setPartyID(p_partyID);
    v_unit.m_groupName = p_groupName;
    v_unit.m_telemetry_protocol = CONST_Unknown_Telemetry;
    v_unit.m_VehicleType = CONST_VEHICLE_GCS;
    return v_unit;
}
