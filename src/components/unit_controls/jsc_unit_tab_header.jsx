import React from 'react';

import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'
import { useUnitField } from '../../js/hooks/useUnitField.js';

/**
 * determine text and style of the tab header of one drone.
 * @param {*} v_andruavUnit
 * @returns classes, text
 */
export function fn_getHeaderInfo(v_andruavUnit) {
    const bad_fcb = (
        (v_andruavUnit.m_modules.has_fcb === true)
        &&
        ((v_andruavUnit.m_useFCBIMU === false)
        ||((v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry)
        && (v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry)))
        );

    let classes = "";
    let text = v_andruavUnit.m_unitName;
    if (v_andruavUnit.m_FCBParameters.m_systemID !== 0)
    {
        text += ":" + v_andruavUnit.m_FCBParameters.m_systemID;
    }
    if ((v_andruavUnit.m_IsDisconnectedFromGCS === true) || (v_andruavUnit.m_IsShutdown === true))
    {
        classes = " blink_offline ";
    }
    else
    {
        if (bad_fcb === true)
        {
                classes = "blink_warning animate_iteration_5s bi bi-exclamation-diamond ";
                text = " " + text;

        }
        else
        if (v_andruavUnit.m_isArmed === true)
        {
            classes = " blink_alert animate_iteration_3s";
        }
        else
        {
            classes += " blink_success animate_iteration_3s ";
        }
    }
    return {
        'classes': classes,
        'text': text
    };
}

/**
 * One unit's <li> tab header in ClssAndruavUnitList.
 *
 * Split out of the parent list's render() so that an armed/FCB/online
 * change for ONE unit only re-renders that unit's header - via useUnitField
 * (bridged from EE_andruavUnitArmedUpdated / EE_andruavUnitFCBUpdated /
 * EE_unitOnlineChanged in js_main.js) - instead of forcing the parent to
 * re-run sortedPartyIDs.map() + getHeaderInfo() for every connected unit on
 * every FCB tick. The parent no longer subscribes to those three events for
 * this purpose.
 */
function ClssUnitTabHeaderItem({ p_unit, active, onSelect }) {
    const partyId = p_unit.getPartyID();

    useUnitField(partyId, 'm_isArmed');
    useUnitField(partyId, 'm_IsDisconnectedFromGCS');
    useUnitField(partyId, 'm_IsShutdown');
    useUnitField(partyId, 'm_useFCBIMU');
    useUnitField(partyId, 'm_telemetry_protocol');
    useUnitField(partyId, 'm_modules.has_fcb');
    useUnitField(partyId, 'm_FCBParameters.m_systemID');

    const header_info = fn_getHeaderInfo(p_unit);

    return (
        <li id={'h' + partyId} className="nav-item nav-units">
            <a
                className={`nav-link user-select-none txt-theme-aware  ${active === true ? 'active' : ''}`}
                data-bs-toggle="tab"
                href={"#tab_" + partyId}
                onClick={onSelect}
            >
                <span className={header_info.classes}> {header_info.text}</span>
            </a>
        </li>
    );
}

export default ClssUnitTabHeaderItem;
