import React from 'react';
import Draggable from "react-draggable";
import * as js_siteConfig from '../../js/js_siteConfig.js'

import { js_globals } from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import {fn_helpPage, fn_gotoUnit_byPartyID} from '../../js/js_main.js';


class ClssServoUnit extends React.Component {

    constructor(props) {
        super(props);

        this.key = Math.random().toString();
        this.state = {
            pendingButton: null, // Can be 'min', 'med', 'max', 'slider', or null
            sliderValue: 1500 // Default slider value
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleSliderChange = this.handleSliderChange.bind(this);
        this.handleSliderRelease = this.handleSliderRelease.bind(this);
    }

    // This lifecycle method is called after every render, perfect for reacting to prop changes
    componentDidUpdate(prevProps) {
        // If the prop_value has changed, it means we've received an update from the vehicle.
        // Clear the pending state and sync slider value.
        if (this.props.prop_value !== prevProps.prop_value) {
            const newState = {};
            if (this.state.pendingButton !== null) {
                newState.pendingButton = null;
            }
            // Sync slider with actual servo value (clamp to 1000-2000 range)
            if (this.props.prop_value !== null && this.props.prop_value !== undefined) {
                const clampedValue = Math.max(1000, Math.min(2000, this.props.prop_value));
                newState.sliderValue = clampedValue;
            }
            if (Object.keys(newState).length > 0) {
                this.setState(newState);
            }
        }
    }

    handleClick(buttonType, servoValue) {
        if (!this.btn_disabled) {
            this.setState({ pendingButton: buttonType });
            js_globals.v_andruavFacade.API_do_ServoChannel(this.props.prop_party, this.props.prop_channel, servoValue);
        }
    }

    handleSliderChange(e) {
        this.setState({ sliderValue: parseInt(e.target.value, 10) });
    }

    handleSliderRelease() {
        if (!this.btn_disabled) {
            this.setState({ pendingButton: 'slider' });
            js_globals.v_andruavFacade.API_do_ServoChannel(this.props.prop_party, this.props.prop_channel, this.state.sliderValue);
        }
    }

    render() {
        let btn_min_css = '';
        let btn_med_css = '';
        let btn_max_css = '';

        let btn_disabled = false; // Single disabled flag for all buttons
        this.btn_disabled = false; // Store on instance for handleClick access

        // If prop_value or prop_party are null/undefined, all buttons are disabled and styled neutrally
        if ((this.props.prop_value === null || this.props.prop_value === undefined) || (this.props.prop_party === null || this.props.prop_party === undefined)) {
            btn_min_css = ' btn-outline-secondary ';
            btn_med_css = ' btn-outline-secondary ';
            btn_max_css = ' btn-outline-secondary ';
            btn_disabled = true; // Buttons should be disabled if no valid props
            this.btn_disabled = true;
        } else {
            // Determine active button based on prop_value
            if (this.props.prop_value <= 1200) {
                btn_min_css = ' css_servo_selected bg-danger txt-theme-aware ';
                btn_med_css = ' css_servo_clickable bg-success txt-theme-aware ';
                btn_max_css = ' css_servo_clickable bg-success txt-theme-aware ';
            } else if (this.props.prop_value >= 1800) {
                btn_min_css = ' css_servo_clickable bg-success txt-theme-aware ';
                btn_med_css = ' css_servo_clickable bg-success txt-theme-aware ';
                btn_max_css = ' css_servo_selected bg-danger txt-theme-aware ';
            } else {
                btn_min_css = ' css_servo_clickable bg-success txt-theme-aware ';
                btn_med_css = ' css_servo_selected bg-danger txt-theme-aware ';
                btn_max_css = ' css_servo_clickable bg-success txt-theme-aware ';
            }

            // Apply pending (yellow) state if applicable
            if (this.state.pendingButton === 'min') {
                btn_min_css = ' css_servo_selected bg-warning text-dark ';
            } else if (this.state.pendingButton === 'med') {
                btn_med_css = ' css_servo_selected bg-warning text-dark ';
            } else if (this.state.pendingButton === 'max') {
                btn_max_css = ' css_servo_selected bg-warning text-dark ';
            }
            
            this.state.pendingButton = null;
        }

        // Calculate slider position percentage for visual indicator
        const currentValue = this.props.prop_value || 1500;
        const sliderPercent = ((currentValue - 1000) / 1000) * 100;

        return (
            <div id='servoblk' key={this.key} className='row margin_zero bg-secondary border rounded-3' title={'value: ' + this.props.prop_value} >
                <div className='row margin_zero small'>
                    <div className='col-8'>
                        <div className='col-12 margin_zero'>
                            <div className='margin_zero  pt-2'>
                                <p
                                    id={'max' + this.props.prop_channel}
                                    className={'label rounded-1 ' + btn_max_css + (btn_disabled ? ' disabled' : '')}
                                    onClick={() => this.handleClick('max', 9999)}
                                >
                                    MAX
                                </p>
                            </div>
                        </div>
                        <div className='col-12 margin_zero'>
                            <div className='margin_zero'>
                                <p
                                    id={'med' + this.props.prop_channel}
                                    className={'label rounded-1 ' + btn_med_css + (btn_disabled ? ' disabled' : '')}
                                    onClick={() => this.handleClick('med', 1500)}
                                >
                                    MED
                                </p>
                            </div>
                        </div>
                        <div className='col-12 margin_zero'>
                            <div className='margin_zero'>
                                <p
                                    id={'min' + this.props.prop_channel}
                                    className={'label rounded-1 ' + btn_min_css + (btn_disabled ? ' disabled' : '')}
                                    onClick={() => this.handleClick('min', 0)}
                                >
                                    MIN
                                </p>
                            </div>
                        </div>
                        <div className='col-12 margin_zero'>
                            <div className='margin_zero si-09x'>
                                {this.props.prop_name}
                            </div>
                        </div>
                    </div>
                    <div className='col-4 d-flex flex-column align-items-center justify-content-center py-2'>
                        <span className='si-07x text-light'>2000</span>
                        <input
                            type='range'
                            min='1000'
                            max='2000'
                            step='10'
                            value={this.state.sliderValue}
                            onChange={this.handleSliderChange}
                            onMouseUp={this.handleSliderRelease}
                            onTouchEnd={this.handleSliderRelease}
                            disabled={btn_disabled}
                            className='css_servo_slider'
                            style={{
                                writingMode: 'vertical-lr',
                                direction: 'rtl',
                                height: '80px',
                                width: '20px',
                                cursor: btn_disabled ? 'not-allowed' : 'pointer'
                            }}
                            title={`Set PWM: ${this.state.sliderValue}`}
                        />
                        <span className='si-07x text-light'>1000</span>
                        <span className='si-07x text-warning mt-1'>{this.state.sliderValue}</span>
                    </div>
                </div>
            </div>
        );
    }
}


export default class ClssServoControl extends React.Component {
    static defaultProps = {
        startServo: 5,
        endServo: 16
    };

    constructor(props) {
        super(props);
        this.state = {
            is_connected: false,
            initialized: false,
            partyID: null
        };

        this.key = Math.random().toString();
        
        this.modal_ctrl_srv = React.createRef();
        this.titleRef = React.createRef();
        this.ctrlMainRef = React.createRef();
        this.footerRef = React.createRef();
        this.btnCloseRef = React.createRef();
        this.opaqueBtnRef = React.createRef();
        

        js_eventEmitter.fn_subscribe(js_event.EE_servoOutputUpdate, this, this.fn_updateData);
        js_eventEmitter.fn_subscribe(js_event.EE_displayServoForm, this, this.fn_displayForm);
    }


    fn_displayForm(p_me, p_partyID) {
        p_me.setState({ 'partyID': p_partyID });
        if (p_me.modal_ctrl_srv.current) {
            p_me.modal_ctrl_srv.current.style.display = 'block';

            const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
            if (!p_andruavUnit) return ;
            js_globals.v_andruavFacade.API_requestMavlinkServoChannel(p_andruavUnit); 
        }
    }

    fn_updateData(p_me, p_andruavUnit) {
        p_me.setState({ 'partyID': p_andruavUnit.getPartyID() });
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_servoOutputUpdate, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayServoForm, this);
    }

    componentDidMount() {
        if (this.modal_ctrl_srv.current) {
            this.modal_ctrl_srv.current.style.display = 'none';

            // While React doesn't directly support jQuery UI draggable,
            // if you absolutely need this functionality, you'd integrate it
            // outside of React's lifecycle or use a React-specific draggable library.
            // For now, I'm just removing the jQuery references.
            // $(this.modal_ctrl_srv.current).draggable(); 

            this.modal_ctrl_srv.current.onmouseover = () => {
                if (this.modal_ctrl_srv.current) {
                    this.modal_ctrl_srv.current.style.opacity = '1.0';
                }
            };
            this.modal_ctrl_srv.current.onmouseout = () => {
                if (this.modal_ctrl_srv.current) {
                    const val = this.modal_ctrl_srv.current.getAttribute('opacity');
                    if (val === null || val === undefined) {
                        this.modal_ctrl_srv.current.style.opacity = '0.4';
                    }
                }
            };
        }

        if (this.btnCloseRef.current) {
            this.btnCloseRef.current.onclick = () => {
                if (this.modal_ctrl_srv.current) {
                    this.modal_ctrl_srv.current.style.display = 'none';
                    this.modal_ctrl_srv.current.removeAttribute('opacity');
                    this.modal_ctrl_srv.current.removeAttribute('partyID');
                }
            };
        }

        if (this.opaqueBtnRef.current) {
            this.opaqueBtnRef.current.onclick = () => {
                if (this.modal_ctrl_srv.current) {
                    const val = this.modal_ctrl_srv.current.getAttribute('opacity');
                    if (val === null || val === undefined) {
                        this.modal_ctrl_srv.current.setAttribute('opacity', '1.0');
                        this.modal_ctrl_srv.current.style.opacity = '1.0';
                    } else {
                        this.modal_ctrl_srv.current.removeAttribute('opacity');
                    }
                }
            };
        }

        
    }

    render() {
        let p_andruavUnit = null;
        if (this.state.partyID !== null && this.state.partyID !== undefined) {
            p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.partyID);
        }

        let servos = [];
        let c_partyID = "";
        let v_unitName = "undefined";
        if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
            c_partyID = p_andruavUnit.getPartyID();
            v_unitName = p_andruavUnit.m_unitName;
            const servo_values = p_andruavUnit.m_Servo.m_values;
            
            // Generate servo units dynamically based on startServo and endServo props
            const { startServo, endServo } = this.props;
            const servoUnits = [];
            for (let i = startServo; i <= endServo; i++) {
                const servoValue = servo_values[`m_servo${i}`];
                servoUnits.push(
                    <div className='col-3 si-07x ' key={this.key + `servo-${i}`}>
                        <ClssServoUnit 
                            prop_party={p_andruavUnit} 
                            prop_channel={String(i)} 
                            prop_value={servoValue} 
                            prop_name={`AP-Srv ${i}`} 
                        />
                    </div>
                );
            }

            // Group servo units into rows of 4
            const rows = [];
            for (let i = 0; i < servoUnits.length; i += 4) {
                rows.push(
                    <div className='row mt-1' key={this.key + `row-${i}`}>
                        {servoUnits.slice(i, i + 4)}
                    </div>
                );
            }

            servos.push(
                <div className='row margin_zero pt-2' key={this.key + 'srvs-keys'}>
                    {rows}
                </div>
            );
        }
            
            return (
                <Draggable nodeRef={this.modal_ctrl_srv}>
                    <div key={this.key + 'modal_ctrl_servo'} id="modal_ctrl_servo" title="SERVO Control" data-bs-toggle="tooltip"  className="card  css_ontop border-light p-2 col-4 " prop_partyid={c_partyID} ref={this.modal_ctrl_srv}>
                        <div key='camera_hdr' className="card-header text-center">
				            <div className="row">
                                <div className="col-10">
                                    <h4 id="title" className="text-success text-start" ref={this.titleRef}>Servo's of' {v_unitName} </h4>
                                </div>
                                <div className="col-2 float-right">
                                    <button key={this.key + 'modal_ctrl_servo_btnclose'} id="modal_ctrl_servo_btnclose" type="btnclose" className="btn-close" ref={this.btnCloseRef}></button>
                                </div>
                            </div>
                        </div>
                        <div id="ctrl_main" className="form-group text-center  modal_dialog_style" ref={this.ctrlMainRef}>
                            {servos}
                        </div>
                        <div id="modal_ctrl_servo_footer" className="form-group text-center localcontainer" ref={this.footerRef}>
                            <div className="row">
                                <div className="col-3">
                                    <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off" ref={this.opaqueBtnRef}>opaque</button>
                                </div>
                                <div className="col-3">
                                    <button id="btnGoto" type="button" className="btn btn-sm btn-success" onClick={(e) => fn_gotoUnit_byPartyID(p_andruavUnit.getPartyID())}>Goto</button>
                                </div>
                                <div className="col-3">
                                    <button id="btnRefresh" type="button" className="btn btn-sm btn-warning" onClick={ (e) => js_globals.v_andruavFacade.API_requestMavlinkServoChannel(p_andruavUnit)} >Refresh</button>
                                </div>
                                <div className="col-3">
                                    <button id="btnHelp" type="button" className="btn btn-sm btn-primary" onClick={ (e) => fn_helpPage(js_siteConfig.CONST_MANUAL_URL)}>Help</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Draggable>
            );
        
    }
};