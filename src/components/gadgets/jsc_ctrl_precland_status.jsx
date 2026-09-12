import React, { useState, useCallback } from 'react';
import * as js_session from '../../js/state/session.js';

import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages.js'
import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth.js'
import { useUnitField } from '../../js/hooks/useUnitField.js'


/**
 * Precision-landing status widget + enable/disable control.
 *
 * Shows the de_precland state badge (DISABLED / SEARCHING / LOCKED /
 * DEGRADED / ERROR) with a dropdown holding the landing-safety details:
 * slant range, fused tag count, reprojection RMSE, fps, and the gate/error
 * reason. LOCKED and DEGRADED are deliberately high-contrast — this is
 * landing-safety information, not decoration.
 *
 * The enable/disable items are gated by js_andruavAuth.fn_do_canTracking()
 * (view mode and missing CONST_ALLOW_TRACKING hide the controls).
 */
function ClssCtrlPreclandStatus({ p_unit, title, className, id }) {
    const partyId = p_unit && p_unit.getPartyID ? p_unit.getPartyID() : undefined;
    const hasFeedback = useUnitField(partyId, 'm_precland.m_valid_unit_feedback');
    const state = useUnitField(partyId, 'm_precland.m_state');
    const enabled = useUnitField(partyId, 'm_precland.m_enabled');
    const fps = useUnitField(partyId, 'm_precland.m_fps');
    const rmsePx = useUnitField(partyId, 'm_precland.m_rmse_px');
    const rangeM = useUnitField(partyId, 'm_precland.m_range_m');
    const tagIds = useUnitField(partyId, 'm_precland.m_tag_ids');
    const reason = useUnitField(partyId, 'm_precland.m_reason');

    const key = useState(() => Math.random().toString())[0];
    const canControl = js_andruavAuth.fn_do_canTracking();

    const fnl_preclandOnOff = useCallback(() => {
        if (canControl !== true) return;
        js_session.fn_getAndruavFacade().API_PrecisionLanding(p_unit, !(enabled === true));
    }, [p_unit, enabled, canControl]);

    const fnl_preclandSelfTest = useCallback(() => {
        if (canControl !== true) return;
        js_session.fn_getAndruavFacade().API_PrecisionLandingSelfTest(p_unit);
    }, [p_unit, canControl]);

    if (p_unit === null || p_unit === undefined) return;
    if (!p_unit.m_modules.has_precision_landing)
    {
        return (
            <div className="disabled hidden"/>
        );
    }

    let css_state = ' txt-theme-aware ';
    let css_state_title = title ? title : 'precision landing';
    let state_text = 'DISABLED';
    switch (state)
    {
        case js_andruavMessages.CONST_PRECLAND_STATUS_SEARCHING:
            css_state = ' text-info ';
            state_text = 'SEARCHING';
            break;
        case js_andruavMessages.CONST_PRECLAND_STATUS_LOCKED:
            css_state = ' bg-success text-white fw-bold ';
            state_text = 'LOCKED';
            break;
        case js_andruavMessages.CONST_PRECLAND_STATUS_DEGRADED:
            css_state = ' bg-warning text-dark fw-bold ';
            state_text = 'DEGRADED';
            break;
        case js_andruavMessages.CONST_PRECLAND_STATUS_ERROR:
            css_state = ' bg-danger text-white fw-bold ';
            state_text = 'ERROR';
            break;
        default:
            state_text = (hasFeedback === true) ? 'DISABLED' : 'N/A';
            break;
    }
    css_state_title += ' ' + state_text;

    const tag_count = (tagIds != null) ? tagIds.length : 0;
    const range_text = (rangeM != null) ? rangeM.toFixed(1) + ' m' : '--';
    const rmse_text = (rmsePx != null) ? rmsePx.toFixed(2) + ' px' : '--';
    const fps_text = (fps != null) ? fps + ' fps' : '--';

    return (
        <div id={'pl_' + (id ? id : key)} key={'pl_' + key} className={"btn-group flgtctrlbtn_icon_w " + className} role="group" aria-label="Precision landing">
            <button
                type="button"
                className={"btn btn-sm bi bi-bullseye " + css_state}
                title={css_state_title}
                onClick={(e) => fnl_preclandOnOff(e)}>
                {' ' + state_text}
            </button>
            <div key={'pl_d' + key} className="btn-group" role="group">
                <button
                    id={"btnGroupDropPL" + key}
                    type="button"
                    className={"btn btn-sm dropdown-toggle " + css_state}
                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
                <div
                    key={'pl_dm' + key}
                    className="dropdown-menu"
                    aria-labelledby={"btnGroupDropPL" + key}
                >
                    <span className="dropdown-item-text"><strong>Precision Landing</strong></span>
                    <span className={"dropdown-item-text " + css_state}>State: {state_text}</span>
                    <span className="dropdown-item-text">Range: {range_text}</span>
                    <span className="dropdown-item-text">Tags: {tag_count}{(tag_count > 0) ? ' [' + tagIds.join(', ') + ']' : ''}</span>
                    <span className="dropdown-item-text">RMSE: {rmse_text}</span>
                    <span className="dropdown-item-text">FPS: {fps_text}</span>
                    {(reason != null) && (reason !== '') &&
                        <span className="dropdown-item-text text-danger">Reason: {reason}</span>
                    }
                    {(canControl === true) &&
                        <div className="dropdown-divider"></div>
                    }
                    {(canControl === true) &&
                        <a className="dropdown-item" href="#" onClick={(e) => fnl_preclandOnOff(e)}>
                            {(enabled === true) ? 'Disable' : 'Enable'}
                        </a>
                    }
                    {(canControl === true) &&
                        <a className="dropdown-item" href="#" onClick={(e) => fnl_preclandSelfTest(e)}>Self-Test</a>
                    }
                </div>
            </div>
        </div>
    );
}

export default ClssCtrlPreclandStatus;
