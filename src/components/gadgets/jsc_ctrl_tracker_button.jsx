import React, { useState, useEffect, useCallback } from 'react';
import * as js_session from '../../js/state/session.js';

import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import { js_eventEmitter } from '../../js/events/js_eventEmitter'
import * as js_siteConfig from '../../js/config/js_siteConfig.js'
import { useUnitField } from '../../js/hooks/useUnitField.js'


/**
 * Object tracker toggle button + AI driver toggle.
 *
 * Migrated from the class + shouldComponentUpdate(m_update counter) +
 * manual fn_subscribe/fn_unsubscribe pattern to useUnitField, which
 * re-renders only when the specific tracker fields change — not on every
 * coarse EE_onTrackingStatusChanged for unrelated units/fields.
 *
 * Local UI state (m_ai_driver_pending / m_ai_driver_local_state) stays as
 * ordinary useState — it is genuinely local to this component and is not
 * shared unit telemetry.
 */
function ClssCtrlObjectTracker({ p_unit, title, displayText, className, id }) {
    const partyId = p_unit && p_unit.getPartyID ? p_unit.getPartyID() : undefined;
    const trackerGuiEnabled = useUnitField(partyId, 'm_tracker.m_enable_gui_tracker');
    const trackerActive = useUnitField(partyId, 'm_tracker.m_active');
    const aiDriven = useUnitField(partyId, 'm_tracker.m_ai_driven');

    // Local UI state: optimistic toggle + pending flag while waiting for
    // the unit to confirm the AI-driver toggle.
    const [aiDriverPending, setAiDriverPending] = useState(false);
    const [aiDriverLocalState, setAiDriverLocalState] = useState(false);
    const key = useState(() => Math.random().toString())[0];

    // When the real m_ai_driven value arrives (via EE_onTrackingStatusChanged
    // -> unitStore bridge -> useUnitField), clear the pending flag and sync
    // the local optimistic state to the actual status. Replaces the old
    // fn_onTrackStatusUpdated handler's pending/local_state sync.
    useEffect(() => {
        setAiDriverPending(false);
        setAiDriverLocalState(aiDriven === true);
    }, [aiDriven]);

    const fnl_trackerOnOff = useCallback((e) => {
        if (p_unit.m_tracker.m_enable_gui_tracker === true) {
            js_session.fn_getAndruavFacade().API_PauseTracking(p_unit);
        } else {
            js_session.fn_getAndruavFacade().API_EnableTracking(p_unit);
        }
        js_eventEmitter.fn_dispatch(js_event.EE_onTrackingStatusChanged, p_unit);
    }, [p_unit]);

    const fn_tracking_ai_driverOnOff = useCallback((e) => {
        // Toggle local state and set pending to show yellow
        const new_local_state = !aiDriverLocalState;
        setAiDriverPending(true);
        setAiDriverLocalState(new_local_state);
        // Send the toggled command
        js_session.fn_getAndruavFacade().API_EnableTracking_AIDriver(p_unit, new_local_state);
    }, [p_unit, aiDriverLocalState]);

    if ((js_siteConfig.CONST_FEATURE.DISABLE_TRACKING != null)
                && (js_siteConfig.CONST_FEATURE.DISABLE_TRACKING === false)
                && (!p_unit.m_modules.has_tracking))
                {
                    return (
                        <div className="disabled hidden"/>
                    );
                }

    // Determine tracker button styling
    let css_Track = '';
    let css_Track_title = title ? title : 'object tracker';
    if (trackerGuiEnabled)
    {
        css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand text-danger ';
        css_Track_title += ' disable tracking ';
    }
    else
    {
        if (trackerActive)
        {
            css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand text-warning txt-theme-aware';
            css_Track_title += ' enable tracking ';
        }
        else
        {
            css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand ';
            css_Track_title += ' enable tracking ';
        }

    }

    // Determine AI driver button styling
    let css_ai_driver = '';
    let css_ai_driver_title = 'AI Driver';

    if (aiDriverPending) {
        // Always show yellow while waiting for feedback
        css_ai_driver = ' bi bi-cpu css_large_icon cursor_hand text-warning ';
        css_ai_driver_title += ' processing... ';
    } else {
        // Use actual status from unit when not pending
        if (aiDriven) {
            css_ai_driver = ' bi bi-cpu css_large_icon cursor_hand text-success ';
            css_ai_driver_title += ' disable AI driver ';
        } else {
            css_ai_driver = ' bi bi-cpu css_large_icon cursor_hand ';
            css_ai_driver_title += ' enable AI driver ';
        }
    }

    // Check if text display is requested
    if (displayText) {
        // Remove css_large_icon for smaller icons when text is displayed
        const css_Track_small = css_Track.replace('css_large_icon', '').trim();
        const css_ai_driver_small = css_ai_driver.replace('css_large_icon', '').trim();
        return (
            <span id={"trackerOnOff_" + id?id:key} key={key} className={`${className} gap-5 `}>
                <span title={css_Track_title} onClick={(e) => fnl_trackerOnOff(e)} className='pe-1 ' >
                    <i className={`${css_Track_small} btn_bi_fixer`}></i>
                    {displayText}
                </span>

                <span id={"ai_" + id?id:key} title={css_ai_driver_title}  className='ps-2' onClick={(e) => fn_tracking_ai_driverOnOff(e)}>
                    <i className={`${css_ai_driver_small} btn_bi_fixer`}></i>
                    AI Driver
                </span>
            </span>
        );
    }
    else {
        return (
            <span id={"trackerOnOff_" + id?id:key} key={key} className={className}>
                <i className={css_Track} title={css_Track_title} onClick={(e) => fnl_trackerOnOff(e)}></i>
                &nbsp;
                <i className={css_ai_driver} title={css_ai_driver_title} onClick={(e) => fn_tracking_ai_driverOnOff(e)}></i>
            </span>
        );
    }
}

export default ClssCtrlObjectTracker;
