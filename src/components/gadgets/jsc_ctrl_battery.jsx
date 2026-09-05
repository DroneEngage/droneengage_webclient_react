import React, { useState, useCallback } from 'react';

import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js'


function hlp_getFCBBatteryCSSClass(v_battery)
{
    let v_battery_display_fcb_div = "";
    let v_battery_src = "/public/images/battery_gy_32x32.png";

    let v_remainingBat = v_battery.FCB_BatteryRemaining;
    let v_bat1 = " ";

    if (v_battery.p_hasPowerInfo === false)
    {
        v_battery_display_fcb_div = " hidden ";
        v_battery_src = "/public/images/battery_gy_32x32.png";
    }

    if (parseInt(v_remainingBat,0) > 80)
    {
        v_bat1 += ' battery_4 ';
        v_battery_src = "/public/images/battery_g_32x32.png";
    }
    else if (parseInt(v_remainingBat,0) > 50)
    {
        v_bat1 += ' battery_3 ';
        v_battery_src = "/public/images/battery_rg_32x32.png";
    }
    else if (parseInt(v_remainingBat,0) > 25)
    {
        v_bat1 += ' battery_2 ';
        v_battery_src = "/public/images/battery_rg_3_32x32.png";
    }
    else
    {
        v_bat1 += ' battery_1 ';
        v_battery_src = "/public/images/battery_r_32x32.png";
    }

    return { m_battery_src: v_battery_src, css: v_bat1, level: v_remainingBat, charging: 'unknown', v_battery_display_fcb_div: v_battery_display_fcb_div };
}

/**
 * Note: this component reads m_battery/m_title for rendering, and p_unit
 * (optional) to filter EE_unitPowUpdated by party ID. Without p_unit, the
 * callback falls back to the original unfiltered behavior (any unit's
 * power update ticks this gadget) for backward compatibility.
 */
export function ClssCtrlBattery({ className, m_title, m_battery, p_unit }) {
    const [isCompact, setIsCompact] = useState(true);
    const [, setTick] = useState(0);
    const key = useState(() => Math.random().toString())[0];

    const fn_update = useCallback((p_andruavUnit) => {
        // Filter by party ID when p_unit is available so a power update
        // from unit A doesn't re-render unit B's battery gadget. Without
        // p_unit, fall back to the original unfiltered behavior.
        if (p_unit && p_andruavUnit && p_andruavUnit.getPartyID) {
            if (p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;
        }
        setTick((t) => t + 1);
    }, [p_unit]);

    const fn_toggle_global = useCallback((p_compact) => {
        setIsCompact(p_compact);
    }, []);

    useEventSubscription(js_event.EE_unitPowUpdated, fn_update);
    useEventSubscription(js_event.EE_BattViewToggle, fn_toggle_global);

    const fn_toggle = () => setIsCompact((c) => !c);

    const v_battery_display_fcb = hlp_getFCBBatteryCSSClass(m_battery);

    if (isCompact === true)
    {
        return (
            <div key={'bat_com_m' + key} className={className + ' row  css_margin_zero fss-4 txt-theme-aware cursor_hand'} onClick={fn_toggle}>
                <div key={'bat_com_m1' + key} className={'col-3  css_margin_zero ' + v_battery_display_fcb.css}><span className="text-warning">{m_title}</span></div>
                <div key={'bat_com_m2' + key} className={'col-3  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{(m_battery.FCB_BatteryVoltage/1000).toFixed(1).toString()} <span className="text-warning">v</span></div>
                <div key={'bat_com_m3' + key} className={'col-3  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{(m_battery.FCB_BatteryCurrent/1000).toFixed(0).toString()} <span className="text-warning">A</span></div>
                <div key={'bat_com_m4' + key} className={'col-3  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{parseFloat(m_battery.FCB_BatteryRemaining).toFixed(0)} <span className="text-warning">%</span></div>
            </div>
        );
    }
    else
    {
        return (
        <div key={'bat_ncom_m' + key} className={className + ' row  css_margin_zero fss-4 '} onClick={fn_toggle}>
                <div key={'bat_ncom_m5' + key} className={'col-2  css_margin_zero ' + v_battery_display_fcb.css}><span className="text-warning">{m_title}</span></div>
                <div key={'bat_ncom_m6' + key} className={'col-2  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{(m_battery.FCB_BatteryVoltage/1000).toFixed(1).toString()} <span className="text-warning">v</span></div>
                <div key={'bat_ncom_m7' + key} className={'col-2  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{(m_battery.FCB_BatteryCurrent/1000).toFixed(0).toString()} <span className="text-warning">A</span></div>
                <div key={'bat_ncom_m8' + key} className={'col-2  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{parseFloat(m_battery.FCB_BatteryRemaining).toFixed(0)} <span className="text-warning">%</span></div>
                <div key={'bat_ncom_m9' + key} className={'col-2  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{(m_battery.FCB_TotalCurrentConsumed/1000).toFixed(0).toString()} <span className="text-warning">AH</span></div>
                <div key={'bat_ncom_m10' + key} className={'col-2  css_margin_zero txt-theme-aware' + v_battery_display_fcb.css}>{(m_battery.FCB_BatteryTemprature/1000).toFixed(1).toString()} <span className="text-warning">C</span></div>
        </div>
        );
    }
}
