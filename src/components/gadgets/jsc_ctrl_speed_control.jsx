import React from 'react';

import * as js_helpers from '../../js/js_helpers.js'

import {js_globals} from '../../js/js_globals.js';
import {js_speak} from '../../js/js_speak'


import {fn_changeSpeed} from '../../js/js_main.js'


export class ClssCTRL_Drone_Speed_Ctrl extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            m_update: 0,
        };

        this.key = Math.random().toString();
        
    };

    fn_changeSpeed (e, p_andruavUnit, p_speed)
    {
        if (fn_changeSpeed === false) return ; // no speed info
      fn_changeSpeed (p_andruavUnit);
    }

    fn_changeSpeedByStep (e, p_andruavUnit, p_step)
    {
        let p_speed = p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed;
        if (p_speed === 0)
        {
            p_speed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
        }
        p_speed = parseFloat(p_speed) + p_step;
        if (p_speed === null || p_speed === undefined) return ;
        
        if (p_speed <= 0 )
        {
            // BAD SPEED
            // TODO: Put a popup message here.
            js_speak.fn_speak('speed cannot be zero');
            return ;
        }

        if (isNaN(p_speed ) === true)
        {
            js_speak.fn_speak('set speed to 5m/s');
            p_speed = 5.0
        }
        
        let v_speak = "change speed to ";
        // save target speed as indication.
		p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed = parseFloat(p_speed);
        
        
        if (js_globals.v_useMetricSystem === true) {
            v_speak = v_speak + p_speed.toFixed(1) + " meter per second";
        }
        else {
            v_speak = v_speak + (p_speed * js_helpers.CONST_METER_TO_MILE).toFixed(1) + "mile per hour";
        }

        js_speak.fn_speak(v_speak);

        js_globals.v_andruavClient.API_do_ChangeSpeed2(p_andruavUnit, parseFloat(p_speed));
    }


    render() {
        const v_andruavUnit = this.props.p_unit;

        let v_targetspeed = parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed).toFixed(2) + " m/s";
        if (js_globals.v_useMetricSystem === false) {
            // value stored in meters per seconds so convert it to miles per hour
            v_targetspeed = (parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed) * js_helpers.CONST_METER_TO_MILE).toFixed(2) + " mph";
        }

        let v_speed_text = "";	
		
        if (v_andruavUnit.m_Nav_Info.p_Location.ground_speed === null || v_andruavUnit.m_Nav_Info.p_Location.ground_speed === undefined) 
            {
                v_speed_text = 'NA'; 
            }else
            { 
                v_speed_text = v_andruavUnit.m_Nav_Info.p_Location.ground_speed;
                v_andruavUnit.m_gui.speed_link = true;
                if (js_globals.v_useMetricSystem === true)
                {
                    v_speed_text = v_speed_text.toFixed(0) + ' m/s';
                }
                else
                {
                    v_speed_text = ( v_speed_text * js_helpers.CONST_METER_TO_MILE).toFixed(0) + ' mph';
                }
                
            }

            
        return (
            <p key={this.key + 'spd_ctrl'}className={this.props.className + ' rounded-3 text-warning cursor_hand textunit_w135'} title='Ground Speed'>
                <span title={"decrease speed"} onClick={(e) => this.fn_changeSpeedByStep(e, v_andruavUnit, - js_globals.CONST_DEFAULT_SPEED_STEP)}>
                    <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                    </svg>
                </span>
                <span id='speed' title={"target: " + v_targetspeed} onClick={(e) => this.fn_changeSpeed(e, v_andruavUnit, v_andruavUnit.m_Nav_Info.p_Location.ground_speed != null ? v_andruavUnit.m_Nav_Info.p_Location.ground_speed : v_andruavUnit.m_gui.speed_link)}>
                    <small><b>&nbsp;
                        {'GS: ' + v_speed_text}
                        &nbsp;</b></small>
                </span>
                <span title="increase speed" onClick={(e) => this.fn_changeSpeedByStep(e, v_andruavUnit, + js_globals.CONST_DEFAULT_SPEED_STEP)}>
                    <svg className="bi bi-caret-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                    </svg>
                </span>
            </p>
        );
    }
}; 