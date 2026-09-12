import React, { useState, useEffect, useCallback } from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';

import * as js_siteConfig from '../../js/config/js_siteConfig.js'
import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import { js_eventEmitter } from '../../js/events/js_eventEmitter'
import { useUnitField } from '../../js/hooks/useUnitField.js'


/**
 * props:
 * p_unit
 *
 * events:
 * onMakeSwarm
 * onRequestToFollow
 *
 * Migrated from the class + shouldComponentUpdate(m_update counter) +
 * manual fn_subscribe/fn_unsubscribe pattern to useUnitField, which
 * re-renders only when the specific tracker-AI fields change — not on
 * every coarse EE_onTrackingAIStatusChanged / EE_onTrackingAIObjectListUpdate
 * for unrelated units/fields.
 *
 * Local UI state (m_selectedUnits) stays as ordinary useState — it is
 * genuinely local to this component and is not shared unit telemetry.
 */
function ClssCtrlObjectTrackerAIList({ p_unit, title, className, t }) {
    const partyId = p_unit && p_unit.getPartyID ? p_unit.getPartyID() : undefined;
    const trackerAiActive = useUnitField(partyId, 'm_tracker_ai.m_active');
    const trackerAiDetected = useUnitField(partyId, 'm_tracker_ai.m_detected');
    const objectList = useUnitField(partyId, 'm_tracker_ai.m_object_list');

    // Local UI state: which detected-object indices are selected.
    const [selectedUnits, setSelectedUnits] = useState([]);

    const key = useState(() => Math.random().toString())[0];

    // Request the AI class list once on mount (was in the constructor).
    useEffect(() => {
        js_session.fn_getAndruavFacade().API_GetTrackingAIClassList(p_unit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fnl_trackerAIOff = useCallback(() => {
        js_session.fn_getAndruavFacade().API_DisableTrackingAI(p_unit);
    }, [p_unit]);

    const fnl_trackerAIOnOff = useCallback((e) => {
        if (p_unit.m_tracker_ai.m_active === true)
        {
            fnl_trackerAIOff();
        }
        else
        {
            js_session.fn_getAndruavFacade().API_EnableTrackingAI(p_unit);
            if (selectedUnits.length == 0) return ; // nothing to select
            js_session.fn_getAndruavFacade().API_SendTrackAISelect(p_unit, selectedUnits);
        }

        js_eventEmitter.fn_dispatch(js_event.EE_onTrackingAIStatusChanged, p_unit);
    }, [p_unit, selectedUnits, fnl_trackerAIOff]);

    const fnl_unSelectAll = useCallback((e) => {
        setSelectedUnits([]);
        fnl_trackerAIOff();
    }, [fnl_trackerAIOff]);

    const fnl_selectAll = useCallback((e) => {
        const v_units = p_unit.m_tracker_ai.m_object_list;
        const len = v_units.length;

        const newSelectedUnits = [];
        for (let i = 0; i < len; ++i) {
            newSelectedUnits.push(i);
        }

        if (newSelectedUnits.length === 0) return; // nothing to select

        js_session.fn_getAndruavFacade().API_SendTrackAISelect(p_unit, newSelectedUnits);

        setSelectedUnits(newSelectedUnits);
    }, [p_unit]);

    const fnl_handleCheckboxChange = useCallback((event, unitIndex) => {
        let newSelectedUnits;

        if (event.target.checked) {
            newSelectedUnits = [...selectedUnits, unitIndex];
        } else {
            newSelectedUnits = selectedUnits.filter(index => index !== unitIndex);
        }

        // Update the selection and then immediately trigger the search.
        // (Mirrors the original setState callback behavior: the API receives
        // the newly computed list.)
        setSelectedUnits(newSelectedUnits);
        if (newSelectedUnits.length > 0) { // Only send if there are selected units
            js_session.fn_getAndruavFacade().API_SendTrackAISelect(p_unit, newSelectedUnits);
        } else {
            // Optionally, if no items are selected, you might want to pause tracking
            fnl_trackerAIOff();
        }
        js_eventEmitter.fn_dispatch(js_event.EE_onTrackingAIStatusChanged, p_unit);
    }, [p_unit, selectedUnits, fnl_trackerAIOff]);


    if ((js_siteConfig.CONST_FEATURE.DISABLE_TRACKING_AI === false)
           && (!p_unit.m_modules.has_ai_recognition))
    {
        return (
                    <div className="disabled hidden"/>
                );
    }
    if (p_unit === null || p_unit === undefined) return;

    //CODEBLOCK_START
    const v_units = objectList || [];
    const len = v_units.length;
    const c_items = [];

    let v_follower_class = "bg-secondry";

    let css_Track = '';
    let css_Track_title = title ? title : 'object tracker';
    if (trackerAiActive === true)
    {
        if (trackerAiDetected)
        {
            css_Track = ' text-danger ';
            css_Track_title += ' disable tracking ';
        }
        else
        {
            css_Track = ' text-warning ';
            css_Track_title += ' disable tracking ';
        }

    }
    else
    {
        css_Track = ' txt-theme-aware ';
        css_Track_title += ' enable tracking ';
    }


    for (let i = 0; i < len; ++i) {
        const v_unit = v_units[i];
        const unitIndex = i; // Get the index of the current unit
        c_items.push(
                    <div key={v_unit + key} className="dropdown-item">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                value={v_unit}
                                id={`checkbox-${v_unit}`}
                                checked={selectedUnits.includes(unitIndex)} // Check if index is in selectedUnits
                                onChange={(e) => fnl_handleCheckboxChange(e, unitIndex)}
                            />
                            <label className="form-check-label" htmlFor={`checkbox-${v_unit}`}>
                                {v_unit}
                            </label>
                        </div>
                    </div>
                );
        }

        return (
                <div id={'aiq_1' + key} key={'aiq_1' + key} className={"btn-group flgtctrlbtn_icon_w " + className} role="group" aria-label="Button group with nested dropdown">
                    <button
                        type="button"
                        className={"btn btn-sm  bi bi-eye-fill " + css_Track}
                        title={css_Track_title}
                        onClick={(e) => fnl_trackerAIOnOff(e)}></button>
                    <div key={'aiq_12' + key} className="btn-group" role="group">
                        <button
                            id={"btnGroupDrop2"+ key}
                            type="button"
                            className={"btn  btn-sm dropdown-toggle " + v_follower_class}
                            data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
                        <div
                            key={'aiq_121' + key}
                            className="dropdown-menu"
                            aria-labelledby={"btnGroupDrop2"+ key}
                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                        >
                            <a className="dropdown-item " href="#" onClick={(e) => fnl_unSelectAll(e)}>{t('unselectAll')}</a>
                            <a className="dropdown-item " href="#" onClick={(e) => fnl_selectAll(e)}>{t('selectAll')}</a>
                            {c_items}

                        </div>
                    </div>
                </div>
        );


}

export default withTranslation('trackerAIList')(ClssCtrlObjectTrackerAIList);
