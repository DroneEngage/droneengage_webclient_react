import $ from 'jquery';

import React from 'react';

import {js_globals} from '../js/js_globals.js';
import {js_eventEmitter} from '../js/js_eventEmitter'

import { js_andruavAuth } from '../js/js_andruavAuth'
import { js_localStorage } from '../js/js_localStorage'

import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

// Registration and Regeneration Control
export default class ClssLoginControl extends React.Component {
    constructor() {
        super();
        this.state = {
            is_connected: false,
            btnConnectText: 'Login',
            initialized: false,
            accessCode: '', // Added state for the access code value
        };

        this.m_emailRef = React.createRef();
        this.m_chk_fullctrl = React.createRef();
        this.m_chk_readonlyctrl = React.createRef();

        js_eventEmitter.fn_subscribe(js_globals.EE_Auth_Account_Created, this, this.fn_EE_permissionReceived);
        js_eventEmitter.fn_subscribe(js_globals.EE_Auth_Account_BAD_Operation, this, this.fn_EE_permissionBadLogin);
		js_eventEmitter.fn_subscribe(js_globals.EE_Auth_Account_Regenerated, this, this.fn_EE_permissionReceived);
    }

	componentWillUnmount ()
    {
		js_eventEmitter.fn_unsubscribe(js_globals.EE_Auth_Account_Created, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_Auth_Account_BAD_Operation, this);
		js_eventEmitter.fn_unsubscribe(js_globals.EE_Auth_Account_Regenerated, this);
	}

    fn_EE_permissionReceived(me, params) {
        // Update the state with the received access code
        me.setState({ accessCode: params.pwd });
    }

    fn_EE_permissionBadLogin(me, params) {
        alert("Error: " + params.em);
    }

    fn_EE_permissionDeleted(me, params) {
        js_andruavAuth.fn_retrieveLogin(this.m_emailRef.current.value, $('#txtAccessCode').val());
    }


    fn_validateCaptcha(callback) {
        let user_captcha = document.getElementById('user_captcha_input').value;

        if (validateCaptcha(user_captcha) === true) {
            alert('Captcha Matched');

            document.getElementById('user_captcha_input').value = "";

            
        }

        else {
            alert('Captcha Does Not Match');
            document.getElementById('user_captcha_input').value = "";
        }

        if (callback !== null) callback();
    }

    fn_clickConnect(e) {

        this.fn_validateCaptcha(() => {
            const v_permission = '0xffffffff';
            js_andruavAuth.fn_generateAccessCode(this.m_emailRef.current.value, v_permission);
        });
    }

    fn_clickRegenerate(e) {
        this.fn_validateCaptcha(() => {
           
            // Check which radio button is selected
            let v_permission = 0x0;
            if (this.m_chk_fullctrl.current.checked) {
                v_permission = '0xffffffff';
            } else if (this.m_chk_readonlyctrl.current.checked) {
                v_permission = '0xffff00ff';
            } else {
                v_permission = '0xffffffff';
            }

            js_andruavAuth.fn_regenerateAccessCode(this.m_emailRef.current.value, v_permission);
        });
    }



    
    componentDidMount() {

        if (this.state.initialized === true) {
            return;
        }

        this.state.initialized = true;

        $('#txtEmail').val(js_localStorage.fn_getEmail());
        loadCaptchaEnginge(6);
    }





    render() {
        let login = "Access Code Generator";
        if (this.state.is_connected === true) {
            login += "ed - As " + this.m_emailRef.current.value;
        }

        return (
            <div>
                <p className="bg-success  text-center"><strong>{login}</strong></p>
                <div id='login_form' >
                    <div className="form-group al_l">
                        <label htmlFor="txtEmail" id="email">Email</label>
                        <input type="email" id="txtEmail" ref={this.m_emailRef} name="txtEmail" className="form-control" defaultValue={js_localStorage.fn_getEmail()} />
                         {/* Display the access code as a styled label */}
                        {this.state.accessCode ? (
                            <label
                                className="d-block m-1 text-warning text-bg-secondary h3"
                            >
                                {this.state.accessCode}
                            </label>
                        ) : null}
                    </div>

                    <br />
                </div>

                <div className="form-check">
                    <input className="form-check-input" ref={this.m_chk_fullctrl} type="radio" value="" id="input_fullctrl" name='grp_permission' />
                    <label className="form-check-label" htmlFor="myCheckbox">
                        Full Control
                    </label>
                </div>
                <div className="form-check">
                    <input className="form-check-input" ref={this.m_chk_readonlyctrl} type="radio" value="" id="input_readonlyctrl" name='grp_permission' />
                    <label className="form-check-label" htmlFor="myCheckbox">
                        Read Only
                    </label>
                </div>

                <div className="container">
                    <div className="form-group">

                        <div className="col mt-3">
                            <LoadCanvasTemplate />
                        </div>

                        <div className="col mt-3">
                            <div><input placeholder="Enter Captcha Value" id="user_captcha_input" name="user_captcha_input" type="text"></input></div>
                        </div>

                        <div className="col mt-3">
                            <div className="row">
                                <div className="col-6 al_l">
                                    <a href="#" id='login_btn' className="btn btn-primary" onClick={(e) => this.fn_clickConnect(e)}><span className="glyphicon glyphicon-download-alt"  ></span> AccessCode</a>
                                </div>
                                <div className="col-6 al_l">
                                    <a href="#" id='regenerate_btn' className="btn btn-danger" onClick={(e) => this.fn_clickRegenerate(e)}><span className="glyphicon glyphicon-retweet"></span> Regenerate</a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        );
    }
}
