import $ from 'jquery';

import React from 'react';

import { EVENTS as js_event } from '../js/js_eventList.js'
import { js_eventEmitter } from '../js/js_eventEmitter'

import { js_andruavAuth } from '../js/js_andruav_auth'
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
            errorMessage: '',
            successMessage: '',
        };

        this.m_emailRef = React.createRef();
        this.m_chk_fullctrl = React.createRef();
        this.m_chk_readonlyctrl = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_Created, this, this.fn_EE_permissionReceived);
        js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_BAD_Operation, this, this.fn_EE_permissionBadLogin);
        js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_Regenerated, this, this.fn_EE_permissionReceived);
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Account_Created, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Account_BAD_Operation, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Account_Regenerated, this);
    }

    fn_EE_permissionReceived(me, params) {
        // Update the state with the received access code
        me.setState({ 
            accessCode: params.pwd,
            successMessage: "Access Code Generated Successfully. Please check your email as well.",
            errorMessage: ''
        });
    }

    fn_EE_permissionBadLogin(me, params) {
        me.setState({ 
            errorMessage: "Error: " + params.em,
            successMessage: ''
        });
        loadCaptchaEnginge(6); 
    }

    fn_validateCaptcha(callback) {
        let user_captcha = document.getElementById('user_captcha_input').value;

        if (validateCaptcha(user_captcha) === true) {
            document.getElementById('user_captcha_input').value = "";
            this.setState({ errorMessage: '' }); // Clear previous captcha errors
            if (callback !== null) callback();

        } else {
            this.setState({ 
                errorMessage: 'Captcha Does Not Match',
                successMessage: ''
            });
            document.getElementById('user_captcha_input').value = "";
            loadCaptchaEnginge(6);
        }
    }

    fn_clickConnect(e) {
        e.preventDefault(); // Prevent default anchor behavior
        this.fn_validateCaptcha(() => {
            const v_permission = '0xffffffff';
            js_andruavAuth.fn_generateAccessCode(this.m_emailRef.current.value, v_permission);
        });
    }

    fn_clickRegenerate(e) {
        e.preventDefault(); // Prevent default anchor behavior
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

    fn_copyToClipboard() {
        if (!this.state.accessCode) return;
        navigator.clipboard.writeText(this.state.accessCode).then(() => {
            // Optional: You could add a temporary "Copied!" message here if desired
            this.setState({ successMessage: "Access Code copied to clipboard!" });
            setTimeout(() => {
                 this.setState({ successMessage: "Access Code Generated Successfully. Please check your email as well." });
            }, 3000);
        }, (err) => {
            console.error('Async: Could not copy text: ', err);
            this.setState({ errorMessage: "Failed to copy to clipboard" });
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
        
        return (
            <div>
                <p className="bg-success txt-theme-aware text-center p-2"><strong>{login}</strong></p>
                
                {this.state.errorMessage && (
                    <div className="alert alert-danger" role="alert">
                        {this.state.errorMessage}
                    </div>
                )}
                
                {this.state.successMessage && (
                    <div className="alert alert-success" role="alert">
                        {this.state.successMessage}
                    </div>
                )}

                <div id='login_form' >
                    <div className="form-group al_l">
                        <label htmlFor="txtEmail" id="email" className="form-label">Email</label>
                        <input type="email" id="txtEmail" ref={this.m_emailRef} name="txtEmail" className="form-control" defaultValue={js_localStorage.fn_getEmail()} />
                        
                        {/* Display the access code as a styled label */}
                        {this.state.accessCode && (
                            <div className="mt-3">
                                <label className="form-label">Access Code:</label>
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="form-control text-warning bg-secondary fw-bold" 
                                        value={this.state.accessCode} 
                                        readOnly 
                                    />
                                    <button 
                                        className="btn btn-outline-secondary" 
                                        type="button" 
                                        onClick={() => this.fn_copyToClipboard()}
                                        title="Copy to clipboard"
                                    >
                                        <i className="bi bi-clipboard"></i> Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <br />
                </div>

                <div className="mb-3">
                    <label className="form-label d-block">Permissions:</label>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" ref={this.m_chk_fullctrl} type="radio" value="" id="input_fullctrl" name='grp_permission' defaultChecked />
                        <label className="form-check-label" htmlFor="input_fullctrl">
                            Full Control
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" ref={this.m_chk_readonlyctrl} type="radio" value="" id="input_readonlyctrl" name='grp_permission' />
                        <label className="form-check-label" htmlFor="input_readonlyctrl">
                            Read Only
                        </label>
                    </div>
                </div>

                <div className="container p-0">
                    <div className="form-group">

                        <div className="col mt-3">
                            <LoadCanvasTemplate />
                        </div>

                        <div className="col mt-3">
                            <div><input className="form-control" placeholder="Enter Captcha Value" id="user_captcha_input" name="user_captcha_input" type="text"></input></div>
                        </div>

                        <div className="col mt-3">
                            <div className="row g-2">
                                <div className="col-6">
                                    <button id='login_btn' className="btn btn-primary w-100" onClick={(e) => this.fn_clickConnect(e)}>
                                        <i className="bi bi-download"></i> AccessCode
                                    </button>
                                </div>
                                <div className="col-6">
                                    <button id='regenerate_btn' className="btn btn-danger w-100" onClick={(e) => this.fn_clickRegenerate(e)}>
                                        <i className="bi bi-arrow-repeat"></i> Regenerate
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        );
    }
}
