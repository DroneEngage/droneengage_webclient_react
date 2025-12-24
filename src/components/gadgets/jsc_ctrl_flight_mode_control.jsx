import React from 'react';
import { withTranslation } from 'react-i18next';
import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import { hlp_getFlightMode } from '../../js/js_main.js';
import * as js_andruavMessages from '../../js/protocol/js_andruavMessages';
import ClssCVideoCanvasLabel from '../video/jsc_videoCanvasLabel.jsx';

class ClssCtrlDrone_FlightMode_Ctrl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update: 0,
            m_opacity: 0.8
        };
        this.key = Math.random().toString();
    }

    componentDidMount() {
        js_eventEmitter.fn_subscribe(js_event.EE_unitNavUpdated, this, this.fn_update);
        js_eventEmitter.fn_subscribe(js_event.EE_Opacity_Control, this, this.fn_EE_changeOpacity);
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitNavUpdated, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_Opacity_Control, this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.m_update !== nextState.m_update) return true;
        if (this.state.m_opacity !== nextState.m_opacity) return true;
        
        if (this.props.p_unit !== nextProps.p_unit) return true;
        if (this.props.isHUD !== nextProps.isHUD) return true;

        return false;
    }

    fn_update(p_me, p_andruavUnit) {
        if (p_me.props.p_unit && p_andruavUnit.getPartyID() === p_me.props.p_unit.getPartyID()) {
            p_me.setState({ m_update: p_me.state.m_update + 1 });
        }
    }

    fn_EE_changeOpacity(me, params) {
        if (params && params.opacity !== undefined) {
            me.setState({ 'm_opacity': params.opacity });
        }
    }

    fn_connectToFCB(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        js_globals.v_andruavFacade.API_connectToFCB(p_andruavUnit);
    }

    render() {
        const { t, p_unit } = this.props;
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
            case js_andruavMessages.CONST_TelemetryProtocol_CONST_Unknown_Telemetry:
                const mode = hlp_getFlightMode(p_unit);
                v_flight_mode_text = t('unit_control_imu:telemetry.mode', { mode: mode });
                v_flight_mode_class = "bg-info text-white";
                v_fcb_mode_title = t('unit_control_imu:telemetry.flightModeTitle');
                v_flight_mode_val = mode;
                break;
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
        if (this.props.isHUD === true) {
             return (
                <ClssCVideoCanvasLabel
                    x={this.props.x}
                    y={this.props.y}
                    width={this.props.width}
                    height={this.props.height}
                    style={this.props.style}
                    css_class={this.props.css_class}
                    
                    backgroundColor={this.props.backgroundColor || 'rgba(177, 175, 175, 0.89)'}
                    opacity={this.state.m_opacity}
                    borderRadius={this.props.borderRadius || '6px'}
                    padding={this.props.padding}
                    pointerEvents={this.props.pointerEvents || 'none'}
                    
                    p_title={{ text: 'mode -', color: '#eee3e3ff' }}
                    p_value={{ text: v_flight_mode_val, color: '#05f826ff' }}
                    p_unit={{ text: '', color: '#00FF00' }}
                />
             );
        }

        return (
            <p
                id={this.props.id || "fcb_mode"}
                className={this.props.className || ('rounded-3 textunit_att_btn text-center p-1 ' + v_flight_mode_class)}
                title={v_fcb_mode_title}
                onClick={(e) => this.fn_connectToFCB(p_unit)}
            >
                {v_flight_mode_text}
            </p>
        );
    }
}

export default withTranslation('unit_control_imu')(ClssCtrlDrone_FlightMode_Ctrl);
