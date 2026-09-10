import React from 'react';

import { EVENTS as js_event } from '../../js/events/js_eventList.js'
import EventBridge from '../../js/hooks/EventBridge.jsx';

import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth.js'
import { js_localStorage } from '../../js/js_localStorage.js'

import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

// Registration and Regeneration Control
export default class ClssLoginControl extends React.Component {
    constructor() {
        super();
        this.state = {
            is_connected: false,
            btnConnectText: 'Login',
            initialized: false,
            accountId: '',
            loginId: '',
            accessCode: '',
            errorMessage: '',
            successMessage: '',
        };

        this.m_loginNameRef = React.createRef();

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }

    componentWillUnmount() {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }

    fn_EE_permissionReceived(params) {
        // Update the state with the received account info
        this.setState({
            accountId: params.accountId || '',
            loginId: params.loginId || '',
            accessCode: params.accessCode || '',
            successMessage: "Access code generated successfully. Please save your AccountID, LoginID and AccessCode.",
            errorMessage: ''
        });
    }

    fn_EE_permissionBadLogin(params) {
        this.setState({ 
            errorMessage: "Error: " + params.em,
            successMessage: ''
        });
        loadCaptchaEnginge(6); 
    }

    fn_EE_authInProgress() {
        this.setState({
            errorMessage: '',
            successMessage: 'Connecting...',
        });
    }

    fn_EE_authBadLogin(params) {
        const msg = params && params.em ? params.em : 'Login failed';
        this.setState({
            errorMessage: 'Login Error: ' + msg,
            successMessage: '',
        });
    }

    fn_EE_socketStatus(params) {
        if (params && params.status === 'registered') {
            this.setState({
                errorMessage: '',
                successMessage: 'Connected Successfully',
            });
        }
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
            js_andruavAuth.fn_generateAccessCode(this.m_loginNameRef.current.value, v_permission);
        });
    }

    fn_clickRegenerate(e) {
        e.preventDefault(); // Prevent default anchor behavior
        this.fn_validateCaptcha(() => {
            // Public deployment always creates a Full Control (admin) account.
            const v_permission = '0xffffffff';
            js_andruavAuth.fn_regenerateAccessCode(this.m_loginNameRef.current.value, v_permission);
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

        // #txtLoginName is rendered below with ref={this.m_loginNameRef};
        // seed it from localStorage via the ref instead of jQuery. (The
        // input also has defaultValue=fn_getLoginName(), so this is the
        // matching imperative set on mount.)
        if (this.m_loginNameRef.current) {
            this.m_loginNameRef.current.value = js_localStorage.fn_getLoginName();
        }
        loadCaptchaEnginge(6);
    }


    render() {
        let login = "Access Code Generator";
        
        return (
            <div>
                <EventBridge eventName={js_event.EE_Auth_Account_Created} onEvent={(data) => this.fn_EE_permissionReceived(data)} />
                <EventBridge eventName={js_event.EE_Auth_Account_BAD_Operation} onEvent={(data) => this.fn_EE_permissionBadLogin(data)} />
                <EventBridge eventName={js_event.EE_Auth_Account_Regenerated} onEvent={(data) => this.fn_EE_permissionReceived(data)} />
                <EventBridge eventName={js_event.EE_Auth_Login_In_Progress} onEvent={() => this.fn_EE_authInProgress()} />
                <EventBridge eventName={js_event.EE_Auth_BAD_Logined} onEvent={(data) => this.fn_EE_authBadLogin(data)} />
                <EventBridge eventName={js_event.EE_onSocketStatus} onEvent={(data) => this.fn_EE_socketStatus(data)} />
                <p className="bg-success txt-theme-aware text-center p-2"><strong>{login}</strong></p>
                
                {this.state.errorMessage && (
                    <div className="alert alert-danger text-center" role="alert">
                        {this.state.errorMessage}
                    </div>
                )}
                
                {this.state.successMessage && (
                    <div className="alert alert-success text-center" role="alert">
                        {this.state.successMessage}
                    </div>
                )}

                <div id='login_form' >
                    <div className="form-group al_l">
                        <label htmlFor="txtLoginName" id="loginName" className="form-label">Email (LoginID)</label>
                        <input type="email" id="txtLoginName" ref={this.m_loginNameRef} name="txtLoginName" className="form-control" defaultValue={js_localStorage.fn_getLoginName()} />

                        {/* Display the generated account details */}
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
                    <p className="text-warning small mb-0">
                        <i className="bi bi-shield-check me-1"></i>
                        This creates a new TeamID with a single Admin (Full Control) account.
                    </p>
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
                                    <button id='login_btn' className="btn btn-sm btn-primary w-100" onClick={(e) => this.fn_clickConnect(e)}>
                                        <i className="bi bi-download"></i> AccessCode
                                    </button>
                                </div>
                                <div className="col-6">
                                    <button id='regenerate_btn' className="btn btn-sm btn-danger w-100" onClick={(e) => this.fn_clickRegenerate(e)}>
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
