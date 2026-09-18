import React, { useState, useCallback } from 'react';
import * as js_session from '../../js/state/session.js';
import * as js_preferences from '../../js/state/preferences.js';
import { CONST_DEFAULT_SPEED_STEP } from '../../js/config/constants.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js';
import { useUnitField } from '../../js/hooks/useUnitField.js';
import { notifyUnitFieldChanged } from '../../js/store/unitStore.js';
import * as js_helpers from '../../js/helpers/js_helpers.js'
import { js_speak } from '../../js/js_speak'
import { fn_changeSpeed as fn_changeSpeed_main } from '../../js/app/js_main.js'
import { js_unitUiPrefs } from '../../js/state/unitUiPrefs.js'
import ClssCVideoCanvasLabel from '../video/jsc_videoCanvasLabel.jsx'


export function ClssCtrlDrone_Speed_Ctrl({ p_unit, isHUD, p_tile, id, className, x, y, originX, originY, width, height, style, css_class, backgroundColor, borderRadius, padding, pointerEvents }) {
    const [opacity, setOpacity] = useState(ClssCVideoCanvasLabel.defaultProps.opacity);
    const key = useState(() => Math.random().toString())[0];

    // Field-granular re-render: only re-render when the displayed speed
    // fields change, not on every coarse EE_unitNavUpdated for the whole unit.
    const _partyId = p_unit?.getPartyID();
    useUnitField(_partyId, 'm_Nav_Info.p_Location.ground_speed');
    useUnitField(_partyId, 'm_Nav_Info.p_UserDesired.m_NavSpeed');

    const fn_EE_changeOpacity = useCallback((params) => {
        if (params && params.opacity !== undefined) {
            setOpacity(params.opacity);
        }
    }, []);

    useEventSubscription(js_event.EE_Opacity_Control, fn_EE_changeOpacity);

    const fn_changeSpeed = (e, p_andruavUnit, p_speed) => {
        if (fn_changeSpeed_main === false) return; // no speed info
        fn_changeSpeed_main(p_andruavUnit);
    };

    const fn_changeSpeedByStep = (e, p_andruavUnit, p_step) => {
        let p_speed = p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed;
        if (p_speed === 0) {
            p_speed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
        }
        p_speed = parseFloat(p_speed) + p_step;
        if (p_speed === null || p_speed === undefined) return;

        if (p_speed <= 0) {
            // BAD SPEED
            // TODO: Put a popup message here.
            js_speak.fn_speak('speed cannot be zero');
            return;
        }

        if (isNaN(p_speed) === true) {
            js_speak.fn_speak('set speed to 5m/s');
            p_speed = 5.0
        }

        let v_speak = "change speed to ";
        // save target speed as indication.
        p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed = parseFloat(p_speed);
        notifyUnitFieldChanged(p_andruavUnit.getPartyID(), 'm_Nav_Info.p_UserDesired.m_NavSpeed');


        if (js_preferences.fn_getUseMetricSystem() === true) {
            v_speak = v_speak + p_speed.toFixed(1) + " meter per second";
        }
        else {
            v_speak = v_speak + (p_speed * js_helpers.CONST_METER_TO_MILE).toFixed(1) + "mile per hour";
        }

        js_speak.fn_speak(v_speak);

        js_session.fn_getAndruavFacade().API_do_ChangeSpeed2(p_andruavUnit, parseFloat(p_speed));
    };


    const v_andruavUnit = p_unit;
    if (!v_andruavUnit) return null;

    let v_unit_text = js_preferences.fn_getUseMetricSystem() ? 'm/s' : 'mph';

    let v_targetspeed = parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed).toFixed(2) + " " + v_unit_text;
    if (js_preferences.fn_getUseMetricSystem() === false) {
        // value stored in meters per seconds so convert it to miles per hour
        v_targetspeed = (parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed) * js_helpers.CONST_METER_TO_MILE).toFixed(2) + " " + v_unit_text;
    }

    let v_speed_val = 'NA';

    if (v_andruavUnit.m_Nav_Info.p_Location.ground_speed !== null && v_andruavUnit.m_Nav_Info.p_Location.ground_speed !== undefined) {
        let speed = v_andruavUnit.m_Nav_Info.p_Location.ground_speed;
        js_unitUiPrefs.fn_setUnitPref(v_andruavUnit.getPartyID(), 'speed_link', true);
        if (js_preferences.fn_getUseMetricSystem() === true) {
            v_speed_val = speed.toFixed(0);
        }
        else {
            v_speed_val = (speed * js_helpers.CONST_METER_TO_MILE).toFixed(0);
        }
    }

    // HUD MODE
    if (isHUD === true) {
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

                p_title={{ text: 'GS:', color: ClssCVideoCanvasLabel.defaultProps.title_color }}
                p_value={{ text: v_speed_val, color: ClssCVideoCanvasLabel.defaultProps.value_color }}
                p_unit={{ text: v_unit_text, color: ClssCVideoCanvasLabel.defaultProps.unit_color }}
            />
         );
    }

    // Standard Rendering
    const v_speed_text = v_speed_val === 'NA' ? 'NA' : (v_speed_val + ' ' + v_unit_text);

    // TILE MODE: renders as a css_imu_railseg inside an IMU rail strip.
    if (p_tile === true) {
        return (
            <div key={key + 'spd_ctrl'} className='css_imu_railseg acc-warning cursor_hand' title='Ground Speed'>
                <span className="t_label">GS</span>
                <span className="t_value">
                    <span title={"decrease speed"} onClick={(e) => fn_changeSpeedByStep(e, v_andruavUnit, - CONST_DEFAULT_SPEED_STEP)}>
                        <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                        </svg>
                    </span>
                    <span id='speed' title={"target speed: " + v_targetspeed} onClick={(e) => fn_changeSpeed(e, v_andruavUnit, v_andruavUnit.m_Nav_Info.p_Location.ground_speed != null ? v_andruavUnit.m_Nav_Info.p_Location.ground_speed : js_unitUiPrefs.fn_getUnitPrefs(v_andruavUnit.getPartyID()).speed_link)}>
                        <b>&nbsp;{v_speed_text}&nbsp;</b>
                    </span>
                    <span title="increase speed" onClick={(e) => fn_changeSpeedByStep(e, v_andruavUnit, + CONST_DEFAULT_SPEED_STEP)}>
                        <svg className="bi bi-caret-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                        </svg>
                    </span>
                </span>
                <span className="t_sub" title={"target speed: " + v_targetspeed}>{v_targetspeed}</span>
            </div>
        );
    }

    return (
        <p key={key + 'spd_ctrl'} className={className + ' rounded-3 text-warning cursor_hand textunit_w135'} title='Ground Speed'>
            <span title={"decrease speed"} onClick={(e) => fn_changeSpeedByStep(e, v_andruavUnit, - CONST_DEFAULT_SPEED_STEP)}>
                <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                </svg>
            </span>
            <span id='speed' title={"target speed: " + v_targetspeed} onClick={(e) => fn_changeSpeed(e, v_andruavUnit, v_andruavUnit.m_Nav_Info.p_Location.ground_speed != null ? v_andruavUnit.m_Nav_Info.p_Location.ground_speed : js_unitUiPrefs.fn_getUnitPrefs(v_andruavUnit.getPartyID()).speed_link)}>
                <small><b>&nbsp;
                    {'GS: ' + v_speed_text}
                    &nbsp;</b></small>
            </span>
            <span title="increase speed" onClick={(e) => fn_changeSpeedByStep(e, v_andruavUnit, + CONST_DEFAULT_SPEED_STEP)}>
                <svg className="bi bi-caret-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                </svg>
            </span>
        </p>
    );
}
