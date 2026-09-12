import React, { useState, useCallback } from 'react';
import * as js_session from '../../js/state/session.js';
import * as js_preferences from '../../js/state/preferences.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js';
import { useUnitField } from '../../js/hooks/useUnitField.js';
import * as js_helpers from '../../js/helpers/js_helpers.js'
import { js_speak } from '../../js/js_speak.js'
import * as js_common from '../../js/helpers/js_common.js'
import {js_localStorage} from '../../js/state/js_localStorage.js'
import * as js_andruavUnit from '../../js/model/js_andruavUnit.js'

import { fn_changeAltitude, fn_convertToMeter } from '../../js/app/js_main.js'
import ClssCVideoCanvasLabel from '../video/jsc_videoCanvasLabel.jsx'


export function ClssCtrlDrone_Altitude_Ctrl({ p_unit, isHUD, x, y, originX, originY, width, height, style, css_class, backgroundColor, borderRadius, padding, pointerEvents, className }) {
    const [opacity, setOpacity] = useState(ClssCVideoCanvasLabel.defaultProps.opacity);

    // Field-granular re-render: only re-render when the displayed altitude
    // fields change, not on every coarse EE_unitNavUpdated for the whole unit.
    const _partyId = p_unit?.getPartyID();
    useUnitField(_partyId, 'm_Nav_Info.p_Location.alt_relative');
    useUnitField(_partyId, 'm_Nav_Info.p_Location.alt_abs');

    const fn_EE_changeOpacity = useCallback((params) => {
        if (params && params.opacity !== undefined) {
            setOpacity(params.opacity);
        }
    }, []);

    useEventSubscription(js_event.EE_Opacity_Control, fn_EE_changeOpacity);

    const fn_doChangeAltitudeByStep = (p_AltitudeInMeter) => {
        const p_andruavUnit = p_unit;

        js_common.fn_console_log ("fn_doChangeAltitudeByStep:" + p_AltitudeInMeter);
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;

        if ((p_AltitudeInMeter === null || p_AltitudeInMeter === undefined) || (p_AltitudeInMeter < js_preferences.fn_getDefaultAltitudeMin())) return ;

        let v_speak;

        if (js_preferences.fn_getUseMetricSystem() === true) {
            v_speak = p_AltitudeInMeter.toFixed(1) + "meters";
        }
        else {
            v_speak = (p_AltitudeInMeter * js_helpers.CONST_METER_TO_FEET).toFixed(1) + "feet";
        }


        if (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE)
        {
            v_speak = "change depth to " + v_speak;

            js_session.fn_getAndruavFacade().API_do_ChangeAltitude(p_andruavUnit, -p_AltitudeInMeter);
        }
        else
        {
            v_speak = "change altitude to " + v_speak;

            js_session.fn_getAndruavFacade().API_do_ChangeAltitude(p_andruavUnit, p_AltitudeInMeter);
        }

        js_speak.fn_speak(v_speak);
    };

    const v_andruavUnit = p_unit;
    if (!v_andruavUnit) return null;

    let v_alt_title, v_alt_remark;
    let v_unit_text = js_preferences.fn_getUseMetricSystem() ? 'm' : 'ft';

    if (v_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE) {
        v_alt_title = 'depth:';
        v_alt_remark = 'depth';
    } else {
        v_alt_title = 'Alt:';
        v_alt_remark = 'Alt ';
    }

    v_alt_remark += 'display: relative/absolute ... step: ' + js_localStorage.fn_getDefaultAltitude();
    v_alt_remark += js_preferences.fn_getUseMetricSystem() ? " m" : " feet";

    let v_alt_rel_val = v_andruavUnit.m_Nav_Info.p_Location.alt_relative;
    let v_alt_abs_val = v_andruavUnit.m_Nav_Info.p_Location.alt_abs;

    let v_alt_rel_str = 'NA';
    let v_alt_abs_str = 'NA';

    if (v_alt_rel_val !== null && v_alt_rel_val !== undefined) {
         if (js_preferences.fn_getUseMetricSystem()) {
             v_alt_rel_str = v_alt_rel_val.toFixed(0);
         } else {
             v_alt_rel_str = (v_alt_rel_val * js_helpers.CONST_METER_TO_FEET).toFixed(0);
         }
    }

    if (v_alt_abs_val !== null && v_alt_abs_val !== undefined) {
         if (js_preferences.fn_getUseMetricSystem()) {
             v_alt_abs_str = v_alt_abs_val.toFixed(0);
         } else {
             v_alt_abs_str = (v_alt_abs_val * js_helpers.CONST_METER_TO_FEET).toFixed(0);
         }
    }

    // HUD MODE
    if (isHUD === true) {
         const displayValue = `${v_alt_rel_str}/${v_alt_abs_str}`;

         return (
            <ClssCVideoCanvasLabel
                x={x}
                y={y}
                originX={originX}
                originY={originY}
                width={width}
                height={height}
                style={style}
                css_class={css_class}

                backgroundColor={backgroundColor || ClssCVideoCanvasLabel.defaultProps.background_color}
                opacity={opacity}
                borderRadius={borderRadius || '6px'}
                padding={padding}
                pointerEvents={pointerEvents || 'none'}

                p_title={{ text: v_alt_title, color: ClssCVideoCanvasLabel.defaultProps.title_color }}
                p_value={{ text: displayValue, color: ClssCVideoCanvasLabel.defaultProps.value_color }}
                p_unit={{ text: v_unit_text, color: ClssCVideoCanvasLabel.defaultProps.unit_color }}
            />
         );
    }

    // Standard Rendering
    const legacy_rel = v_alt_rel_str === 'NA' ? 'NA' : (v_alt_rel_str + v_unit_text);
    const legacy_abs = v_alt_abs_str === 'NA' ? 'NA' : (v_alt_abs_str + v_unit_text);
    const v_altitude_text = legacy_rel + '/' + legacy_abs;

    return (
            <p id='alt' className={className + ' rounded-3 cursor_hand textunit_att_btn text-warning '} >
                <span title={"decrease altitude"} onClick={() => fn_doChangeAltitudeByStep(v_andruavUnit.m_Nav_Info.p_Location.alt_relative - fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()))}>
                    <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                    </svg>
                </span>

                <span title={v_alt_remark} onClick={() => fn_changeAltitude(v_andruavUnit)}>
                    <small><b>{v_alt_title + v_altitude_text + ' '}</b></small>
                </span>

                <span title="increase altitude" onClick={() => fn_doChangeAltitudeByStep(v_andruavUnit.m_Nav_Info.p_Location.alt_relative + fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()))}>
                    <svg className="bi bi-caret-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                    </svg>
                </span>
            </p>
    );
}
