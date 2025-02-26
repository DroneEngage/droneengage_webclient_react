import React from 'react';

import * as js_helpers from '../../js/js_helpers.js'
import {js_globals} from '../../js/js_globals.js';
import { js_speak } from '../../js/js_speak.js'
import * as js_common from '../../js/js_common.js'
import {js_localStorage} from '../../js/js_localStorage'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'

import { fn_changeAltitude, fn_convertToMeter } from '../../js/js_main.js'


export class ClssCtrlDrone_Altitude_Ctrl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update: 0,
        };
    };    


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

            js_globals.v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, -p_AltitudeInMeter);
        }
        else
        {
            v_speak = "change altitude to " + v_speak;
            
            js_globals.v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, p_AltitudeInMeter);
        }

        js_speak.fn_speak(v_speak);

    }
    


    render() {
        const v_andruavUnit = this.props.p_unit;

        let v_altitude_text = "";
		let v_alt_title, v_alt_remark;

        if (v_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE)
        {
            v_alt_title ='depth:';
            v_alt_remark = 'depth';
        }
        else
        {
            v_alt_title = 'Alt:';
            v_alt_remark = 'Alt ';
        }  

        v_alt_remark += 'display: relative/absolute ... step: ' + js_localStorage.fn_getDefaultAltitude();

        if (js_globals.v_useMetricSystem === true) {
            v_alt_remark += " m";
        }
        else
        {
            v_alt_remark += " feet";
        }

        let v_altitude = v_andruavUnit.m_Nav_Info.p_Location.alt_relative;
		if (v_altitude==null) 
        {
            v_altitude = 'NA';
        } 
        else 
        {
            if (js_globals.v_useMetricSystem === true)
            {
                v_altitude = v_altitude.toFixed(0).toString() + "m";
            }
            else
            {
                v_altitude = (v_altitude * js_helpers.CONST_METER_TO_FEET).toFixed(0) + "ft";
            }
        }

        let v_altitude_abs = v_andruavUnit.m_Nav_Info.p_Location.alt_abs;
		if (v_altitude_abs === null || v_altitude_abs === undefined) 
        {
            v_altitude_abs = 'NA';
        } 
        else 
        {
            if (js_globals.v_useMetricSystem === true)
            {
                v_altitude_abs = v_altitude_abs.toFixed(0).toString() + "m";
            }
            else
            {
                v_altitude_abs = (v_altitude_abs * js_helpers.CONST_METER_TO_FEET).toFixed(0) + "ft";
            }
        }

        v_altitude_text = v_altitude + '/' + v_altitude_abs;    


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