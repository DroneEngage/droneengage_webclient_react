import React from 'react';
import Draggable from "react-draggable";
import * as js_siteConfig from '../../js/js_siteConfig.js'

import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import {fn_helpPage, fn_gotoUnit_byPartyID} from '../../js/js_main.js';



class ClssServoUnit extends React.Component {

    render() {
        let btn_min_css = 'btn-success';
        let btn_max_css = 'btn-danger';

        let btn_min_disabled = false;
        let btn_max_disabled = false;

        if ((this.props.prop_value === null || this.props.prop_value === undefined) || (this.props.prop_party === null || this.props.prop_party === undefined)) {
            btn_min_css = ' btn-outline-secondary ';
            btn_max_css = ' btn-outline-secondary ';
            btn_min_disabled = true;
            btn_max_disabled = true;
        } else {
            if (this.props.prop_value < 1500) {
                btn_min_css = ' css_servo_selected bg-danger text-white ';
                btn_max_css = ' css_servo_clickable bg-success text-white ';
            } else {
                btn_min_css = ' css_servo_clickable bg-success text-white ';
                btn_max_css = ' css_servo_selected bg-danger text-white ';
            }
        }

        return (
            <div id='servoblk' className='row margin_zero' title={'value: ' + this.props.prop_value} >
                <div className='row margin_zero small'>
                    <div className='row margin_zero'>
                        <div className='col-12 margin_zero'>
                            <p id={'min' + this.props.prop_channel} className={'label ' + btn_min_css} onClick={(e) => js_globals.v_andruavClient.API_do_ServoChannel(this.props.prop_party, this.props.prop_channel, 0)} >MIN</p>
                        </div>
                    </div>
                    <div className='row margin_zero'>
                        <div className='col-12 margin_zero si-09x'>
                            {this.props.prop_name}
                        </div>
                    </div>
                    <div className='row margin_zero'>
                        <div className='col-12 margin_zero'>
                            <p id={'min' + this.props.prop_channel} className={'label ' + btn_max_css} onClick={(e) => js_globals.v_andruavClient.API_do_ServoChannel(this.props.prop_party, this.props.prop_channel, 9999)} >MAX</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};


export default class ClssServoControlDialog extends React.Component {
    constructor() {
        super();
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
        this.btnGotoRef = React.createRef();
        this.btnHelpRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_globals.EE_servoOutputUpdate, this, this.fn_updateData);
        js_eventEmitter.fn_subscribe(js_globals.EE_displayServoForm, this, this.fn_displayForm);
    }


    fn_displayForm(p_me, p_partyID) {
        p_me.setState({ 'partyID': p_partyID });
        if (p_me.modal_ctrl_srv.current) {
            p_me.modal_ctrl_srv.current.style.display = 'block';
        }
    }

    fn_updateData(p_me, p_andruavUnit) {
        p_me.setState({ 'partyID': p_andruavUnit.partyID });
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_servoOutputUpdate, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_displayServoForm, this);
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

        if (this.btnGotoRef.current) {
            this.btnGotoRef.current.onclick = () => {
                if (this.modal_ctrl_srv.current) {
                    // Assuming fn_gotoUnit_byPartyID is a globally accessible function or imported
                    // If it's part of js_globals, you'd access it as js_globals.fn_gotoUnit_byPartyID
                    if (typeof fn_gotoUnit_byPartyID === 'function') {
                        fn_gotoUnit_byPartyID(this.state.partyID);
                    } else {
                        console.warn('fn_gotoUnit_byPartyID is not defined or accessible.');
                    }
                }
            };
        }

        if (this.btnHelpRef.current) {
            this.btnHelpRef.current.onclick = () => {
                // Assuming fn_helpPage is a globally accessible function or imported
                // If it's part of js_globals, you'd access it as js_globals.fn_helpPage
                if (typeof fn_helpPage === 'function') {
                    fn_helpPage(js_siteConfig.CONST_MANUAL_URL);
                } else {
                    console.warn('fn_helpPage is not defined or accessible.');
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
            c_partyID = p_andruavUnit.partyID;
            v_unitName = p_andruavUnit.m_unitName;
            const servo_values = p_andruavUnit.m_Servo.m_values;
            servos.push(
                 <div className='row'>
                            <div className='col-md-3 margi'>
                                <ClssServoUnit prop_party={p_andruavUnit} prop_channel='9' prop_value={servo_values.m_servo1} prop_name='Key 1'></ClssServoUnit>
                            </div>
                            <div className='col-md-3'>
                                <ClssServoUnit prop_party={p_andruavUnit} prop_channel='10' prop_value={servo_values.m_servo2} prop_name='Key 2'></ClssServoUnit>
                            </div>
                            <div className='col-md-3'>
                                <ClssServoUnit prop_party={p_andruavUnit} prop_channel='11' prop_value={servo_values.m_servo3} prop_name='Key 3'></ClssServoUnit>
                            </div>
                            <div className='col-md-3'>
                                <ClssServoUnit prop_party={p_andruavUnit} prop_channel='12' prop_value={servo_values.m_servo4} prop_name='Key 4'></ClssServoUnit>
                            </div>
                        </div>
            );
        }
            
            return (
                <Draggable nodeRef={this.modal_ctrl_srv}>
                    <div key={this.key + 'modal_ctrl_servo'} id="modal_ctrl_servo" title="SERVO Control" data-bs-toggle="tooltip"  className="card width_fit_max css_ontop border-light p-2 " prop_partyid={c_partyID} ref={this.modal_ctrl_srv}>
                        <div key='camera_hdr' className="card-header text-center">
				            <div className="row">
                                <div className="col-10">
                                    <h4 id="title" className="text-success text-start" ref={this.titleRef}>Servo's of' {v_unitName} </h4>
                                </div>
                                <div className="col-2 float-right">
                                    <button id="btnclose" type="btnclose" className="btn-close" ref={this.btnCloseRef}></button>
                                </div>
                            </div>
                        </div>
                        <div id="ctrl_main" className="form-group text-center container modal_dialog_style" ref={this.ctrlMainRef}>
                            {servos}
                        </div>
                        <div id="modal_ctrl_servo_footer" className="form-group text-center localcontainer" ref={this.footerRef}>
                            <div className="row">
                                <div className="col-md-4">
                                    <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off" ref={this.opaqueBtnRef}>opaque</button>
                                </div>
                                <div className="col-md-4">
                                    <button id="btnGoto" type="button" className="btn btn-sm btn-success" ref={this.btnGotoRef}>Goto</button>
                                </div>
                                <div className="col-md-4">
                                    <button id="btnHelp" type="button" className="btn btn-sm btn-primary" ref={this.btnHelpRef}>Help</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Draggable>
            );
        
    }
};