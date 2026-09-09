import React, { useState, useCallback } from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js';
import { useUnitField } from '../../js/hooks/useUnitField.js';
import { hlp_getFlightMode } from '../../js/js_main.js';
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages';
import ClssCVideoCanvasLabel from '../video/jsc_videoCanvasLabel.jsx';

function ClssCtrlDrone_FlightMode_Ctrl({ t, p_unit, isHUD, id, className, x, y, originX, originY, width, height, style, css_class, backgroundColor, borderRadius, padding, pointerEvents }) {
    const [opacity, setOpacity] = useState(ClssCVideoCanvasLabel.defaultProps.opacity);

    // Field-granular re-render: only re-render when the displayed flight-mode
    // fields change, not on every coarse EE_unitNavUpdated for the whole unit.
    const _partyId = p_unit?.getPartyID();
    useUnitField(_partyId, 'm_flightMode');
    useUnitField(_partyId, 'm_telemetry_protocol');

    const fn_EE_changeOpacity = useCallback((params) => {
        if (params && params.opacity !== undefined) {
            setOpacity(params.opacity);
        }
    }, []);

    useEventSubscription(js_event.EE_Opacity_Control, fn_EE_changeOpacity);

    const fn_connectToFCB = (p_andruavUnit) => {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        js_session.fn_getAndruavFacade().API_connectToFCB(p_andruavUnit);
    };

    if (!p_unit) return null;

    let v_flight_mode_text;
    let v_flight_mode_class = " ";
    let v_fcb_mode_title;
    let v_flight_mode_val = ""; // For HUD

    switch (p_unit.m_telemetry_protocol) {
        case js_andruavMessages.CONST_TelemetryProtocol_CONST_No_Telemetry:
            v_flight_mode_text = t('unit_control_imu:telemetry.noFCB');
            v_flight_mode_class = "bg-warning";
            v_fcb_mode_title = t('unit_control_imu:telemetry.connectTitle');
            v_flight_mode_val = "No FCB";
            break;
        case js_andruavMessages.CONST_TelemetryProtocol_CONST_Andruav_Telemetry:
        case js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry:
        case js_andruavMessages.CONST_TelemetryProtocol_CONST_MW_Telemetry:
        case js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry:
        case js_andruavMessages.CONST_TelemetryProtocol_DJI_Telemetry:
        case js_andruavMessages.CONST_TelemetryProtocol_CONST_Unknown_Telemetry: {
            const mode = hlp_getFlightMode(p_unit);
            v_flight_mode_text = t('unit_control_imu:telemetry.mode', { mode: mode });
            v_flight_mode_class = "bg-info text-white";
            v_fcb_mode_title = t('unit_control_imu:telemetry.flightModeTitle');
            v_flight_mode_val = mode;
            break;
        }
        default:
             // Fallback
            v_flight_mode_text = "Unknown";
            v_flight_mode_class = "bg-secondary text-white";
            v_fcb_mode_title = "";
            v_flight_mode_val = "UNK";
            break;
    }

    v_flight_mode_class += " cursor_hand";

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

                p_title={{ text: 'mode -', color: ClssCVideoCanvasLabel.defaultProps.title_color }}
                p_value={{ text: v_flight_mode_val, color: ClssCVideoCanvasLabel.defaultProps.value_color }}
                p_unit={{ text: '', color: ClssCVideoCanvasLabel.defaultProps.unit_color }}
            />
         );
    }

    return (
        <p
            id={id || "fcb_mode"}
            className={className || ('rounded-3 textunit_att_btn text-center p-1 ' + v_flight_mode_class)}
            title={v_fcb_mode_title}
            onClick={() => fn_connectToFCB(p_unit)}
        >
            {v_flight_mode_text}
        </p>
    );
}

export default withTranslation('unit_control_imu')(ClssCtrlDrone_FlightMode_Ctrl);
