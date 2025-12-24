import React from 'react';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import * as js_helpers from '../../js/js_helpers.js'
import { js_globals } from '../../js/js_globals.js';
import { js_speak } from '../../js/js_speak'
import { fn_changeSpeed } from '../../js/js_main.js'
import ClssCVideoCanvasLabel from '../video/jsc_videoCanvasLabel.jsx'


export class ClssCtrlDrone_Speed_Ctrl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            m_update: 0,
            m_opacity: ClssCVideoCanvasLabel.defaultProps.opacity
        };

        this.key = Math.random().toString();
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

    fn_changeSpeed(e, p_andruavUnit, p_speed) {
        if (fn_changeSpeed === false) return; // no speed info
        fn_changeSpeed(p_andruavUnit);
    }

    fn_changeSpeedByStep(e, p_andruavUnit, p_step) {
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


        if (js_globals.v_useMetricSystem === true) {
            v_speak = v_speak + p_speed.toFixed(1) + " meter per second";
        }
        else {
            v_speak = v_speak + (p_speed * js_helpers.CONST_METER_TO_MILE).toFixed(1) + "mile per hour";
        }

        js_speak.fn_speak(v_speak);

        js_globals.v_andruavFacade.API_do_ChangeSpeed2(p_andruavUnit, parseFloat(p_speed));
    }


    render() {
        const v_andruavUnit = this.props.p_unit;
        if (!v_andruavUnit) return null;

        let v_unit_text = js_globals.v_useMetricSystem ? 'm/s' : 'mph';

        let v_targetspeed = parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed).toFixed(2) + " " + v_unit_text;
        if (js_globals.v_useMetricSystem === false) {
            // value stored in meters per seconds so convert it to miles per hour
            v_targetspeed = (parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed) * js_helpers.CONST_METER_TO_MILE).toFixed(2) + " " + v_unit_text;
        }

        let v_speed_val = 'NA';

        if (v_andruavUnit.m_Nav_Info.p_Location.ground_speed !== null && v_andruavUnit.m_Nav_Info.p_Location.ground_speed !== undefined) {
            let speed = v_andruavUnit.m_Nav_Info.p_Location.ground_speed;
            v_andruavUnit.m_gui.speed_link = true;
            if (js_globals.v_useMetricSystem === true) {
                v_speed_val = speed.toFixed(0);
            }
            else {
                v_speed_val = (speed * js_helpers.CONST_METER_TO_MILE).toFixed(0);
            }
        }

        // HUD MODE
        if (this.props.isHUD === true) {
             return (
                <ClssCVideoCanvasLabel
                    x={this.props.x}
                    y={this.props.y}
                    originX={this.props.originX}
                    originY={this.props.originY}
                    width={this.props.width}
                    height={this.props.height}
                    style={this.props.style}
                    css_class={this.props.css_class}
                    
                    backgroundColor={this.props.backgroundColor || ClssCVideoCanvasLabel.defaultProps.background_color}
                    opacity={this.state.m_opacity}
                    borderRadius={this.props.borderRadius || '6px'}
                    padding={this.props.padding}
                    pointerEvents={this.props.pointerEvents || 'none'}
                    
                    p_title={{ text: 'GS:', color: ClssCVideoCanvasLabel.defaultProps.title_color }}
                    p_value={{ text: v_speed_val, color: ClssCVideoCanvasLabel.defaultProps.value_color }}
                    p_unit={{ text: v_unit_text, color: ClssCVideoCanvasLabel.defaultProps.unit_color }}
                />
             );
        }

        // Standard Rendering
        const v_speed_text = v_speed_val === 'NA' ? 'NA' : (v_speed_val + ' ' + v_unit_text);

        return (
            <p key={this.key + 'spd_ctrl'} className={this.props.className + ' rounded-3 text-warning cursor_hand textunit_w135'} title='Ground Speed'>
                <span title={"decrease speed"} onClick={(e) => this.fn_changeSpeedByStep(e, v_andruavUnit, - js_globals.CONST_DEFAULT_SPEED_STEP)}>
                    <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                    </svg>
                </span>
                <span id='speed' title={"target speed: " + v_targetspeed} onClick={(e) => this.fn_changeSpeed(e, v_andruavUnit, v_andruavUnit.m_Nav_Info.p_Location.ground_speed != null ? v_andruavUnit.m_Nav_Info.p_Location.ground_speed : v_andruavUnit.m_gui.speed_link)}>
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