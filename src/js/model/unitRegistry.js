import { js_globals } from '../js_globals.js';
import { CAndruavUnitObject } from '../js_andruavUnit.js';
import { CONST_TYPE_AndruavMessage_ID } from '../protocol/messages/js_andruavMessages.js';

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
    let v_unit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
    let isNew = false;
    let shouldRequestID = false;

    if (!v_unit) {
        isNew = true;
        v_unit = new CAndruavUnitObject();
        v_unit.m_IsMe = false;
        v_unit.m_defined = false;
        v_unit.setPartyID(p_partyID);
        v_unit.m_index = js_globals.m_andruavUnitList.count;
        js_globals.m_andruavUnitList.Add(v_unit.getPartyID(), v_unit);

        if (p_requestIdIfNew) {
            if (v_unit.m_Messages.fn_sendMessageAllowed(CONST_TYPE_AndruavMessage_ID)) {
                shouldRequestID = true;
                v_unit.m_Messages.fn_doNotRepeatMessageBefore(CONST_TYPE_AndruavMessage_ID, 1000, new Date());
            }
        }
    }

    return { unit: v_unit, isNew, shouldRequestID };
}
