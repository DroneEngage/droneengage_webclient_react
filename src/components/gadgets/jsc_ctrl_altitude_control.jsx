import React from 'react';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import * as js_helpers from '../../js/js_helpers.js'
import {js_globals} from '../../js/js_globals.js';
import { js_speak } from '../../js/js_speak.js'
import * as js_common from '../../js/js_common.js'
import {js_localStorage} from '../../js/js_localStorage'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'

import { fn_changeAltitude, fn_convertToMeter } from '../../js/js_main.js'
import ClssCVideoCanvasLabel from '../video/jsc_videoCanvasLabel.jsx'


export class ClssCtrlDrone_Altitude_Ctrl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update: 0,
            m_opacity: 0.8
        };
    };

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


    fn_doChangeAltitudeByStep (p_AltitudeInMeter)
    {
        const p_andruavUnit = this.props.p_unit;

        js_common.fn_console_log ("fn_doChangeAltitudeByStep:" + p_AltitudeInMeter);
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
        
        if ((p_AltitudeInMeter === null || p_AltitudeInMeter === undefined) || (p_AltitudeInMeter < js_globals.CONST_DEFAULT_ALTITUDE_min)) return ;

        let v_speak;
        
        if (js_globals.v_useMetricSystem === true) {
            v_speak = p_AltitudeInMeter.toFixed(1) + "meters";
        }
        else {
            v_speak = (p_AltitudeInMeter * js_helpers.CONST_METER_TO_FEET).toFixed(1) + "feet";
        }

        
        if (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE)
        {
            v_speak = "change depth to " + v_speak;

            js_globals.v_andruavFacade.API_do_ChangeAltitude(p_andruavUnit, -p_AltitudeInMeter);
        }
        else
        {
            v_speak = "change altitude to " + v_speak;
            
            js_globals.v_andruavFacade.API_do_ChangeAltitude(p_andruavUnit, p_AltitudeInMeter);
        }

        js_speak.fn_speak(v_speak);

    }
    

    render() {
        const v_andruavUnit = this.props.p_unit;
        if (!v_andruavUnit) return null;

        let v_alt_title, v_alt_remark;
        let v_unit_text = js_globals.v_useMetricSystem ? 'm' : 'ft';

        if (v_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE) {
            v_alt_title = 'depth:';
            v_alt_remark = 'depth';
        } else {
            v_alt_title = 'Alt:';
            v_alt_remark = 'Alt ';
        }

        v_alt_remark += 'display: relative/absolute ... step: ' + js_localStorage.fn_getDefaultAltitude();
        v_alt_remark += js_globals.v_useMetricSystem ? " m" : " feet";

        let v_alt_rel_val = v_andruavUnit.m_Nav_Info.p_Location.alt_relative;
        let v_alt_abs_val = v_andruavUnit.m_Nav_Info.p_Location.alt_abs;
        
        let v_alt_rel_str = 'NA';
        let v_alt_abs_str = 'NA';

        if (v_alt_rel_val !== null && v_alt_rel_val !== undefined) {
             if (js_globals.v_useMetricSystem) {
                 v_alt_rel_str = v_alt_rel_val.toFixed(0);
             } else {
                 v_alt_rel_str = (v_alt_rel_val * js_helpers.CONST_METER_TO_FEET).toFixed(0);
             }
        }

        if (v_alt_abs_val !== null && v_alt_abs_val !== undefined) {
             if (js_globals.v_useMetricSystem) {
                 v_alt_abs_str = v_alt_abs_val.toFixed(0);
             } else {
                 v_alt_abs_str = (v_alt_abs_val * js_helpers.CONST_METER_TO_FEET).toFixed(0);
             }
        }

        // HUD MODE
        if (this.props.isHUD === true) {
             const displayValue = `${v_alt_rel_str}/${v_alt_abs_str}`;
             
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
                    
                    p_title={{ text: v_alt_title, color: '#eee3e3ff' }}
                    p_value={{ text: displayValue, color: '#05f826ff' }}
                    p_unit={{ text: v_unit_text, color: '#00FF00' }}
                />
             );
        }

        // Standard Rendering
        const legacy_rel = v_alt_rel_str === 'NA' ? 'NA' : (v_alt_rel_str + v_unit_text);
        const legacy_abs = v_alt_abs_str === 'NA' ? 'NA' : (v_alt_abs_str + v_unit_text);
        const v_altitude_text = legacy_rel + '/' + legacy_abs;    

        return (
                <p id='alt' className={this.props.className + ' rounded-3 cursor_hand textunit_att_btn text-warning '} >
                    <span title={"decrease altitude"} onClick={(e) => this.fn_doChangeAltitudeByStep(v_andruavUnit.m_Nav_Info.p_Location.alt_relative - fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()))}>
                        <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                        </svg>
                    </span>

                    <span title={v_alt_remark} onClick={(e) => fn_changeAltitude(v_andruavUnit)}>
                        <small><b>{v_alt_title + v_altitude_text + ' '}</b></small>
                    </span>

                    <span title="increase altitude" onClick={(e) => this.fn_doChangeAltitudeByStep(v_andruavUnit.m_Nav_Info.p_Location.alt_relative + fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()))}>
                        <svg className="bi bi-caret-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                        </svg>
                    </span>
                </p>
        );
    };
    
}; 