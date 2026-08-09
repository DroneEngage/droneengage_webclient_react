import React from 'react';

import { EVENTS as js_event } from '../js/js_eventList.js';
import { js_eventEmitter } from '../js/js_eventEmitter';
import { js_andruavAuth } from '../js/protocol/auth/js_andruav_auth';
import { js_localStorage } from '../js/js_localStorage';
import { fn_connect, fn_logout } from '../js/js_main';

import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

const CONST_OFFLINE = 0;
const CONST_IN_PROGRESS = 1;
const CONST_ONLINE = 2;
const CONST_FAILED = 3;

class MobileLoginPanel extends React.Component {
  constructor() {
    super();
    this.state = {
      is_connected: CONST_OFFLINE,
      accessCode: '',
      errorMessage: '',
      successMessage: '',
      showGenPanel: false,
    };

    this.m_loginNameRef = React.createRef();
    this.m_accessCodeRef = React.createRef();
    this.m_chk_fullctrl = React.createRef();
    this.m_chk_readonlyctrl = React.createRef();

    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_Created, this, this.fn_onAccessCodeGenerated);
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_BAD_Operation, this, this.fn_onAccessCodeError);
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_Regenerated, this, this.fn_onAccessCodeGenerated);
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Login_In_Progress, this, this.fn_onAuthInProgress);
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_BAD_Logined, this, this.fn_onAuthBad);
    js_eventEmitter.fn_subscribe(js_event.EE_onSocketStatus, this, this.fn_onSocketStatus);
  }

  componentWillUnmount() {
    this.m_flag_mounted = false;
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Account_Created, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Account_BAD_Operation, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Account_Regenerated, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Login_In_Progress, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_BAD_Logined, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_onSocketStatus, this);
  }

  componentDidMount() {
    this.m_flag_mounted = true;
    const stored = js_localStorage.fn_getLoginName();
    if (stored && this.m_loginNameRef.current) {
      this.m_loginNameRef.current.value = stored;
    }
    const storedCode = js_localStorage.fn_getAccessCode();
    if (storedCode && this.m_accessCodeRef.current) {
      this.m_accessCodeRef.current.value = storedCode;
    }
    if (js_andruavAuth.fn_logined() === true) {
      this.setState({ is_connected: CONST_ONLINE });
    }
  }

  fn_onSocketStatus(me, params) {
    if (me.m_flag_mounted === false) return;
    if (params.status === 'registered') {
      me.setState({ is_connected: CONST_ONLINE, errorMessage: '', successMessage: '' });
    } else {
      me.setState({ is_connected: CONST_OFFLINE });
    }
  }

  fn_onAuthInProgress(me) {
    me.setState({ is_connected: CONST_IN_PROGRESS, errorMessage: '' });
  }

  fn_onAuthBad(me, data) {
    me.setState({
      is_connected: CONST_FAILED,
      errorMessage: data && data.em ? data.em : 'Login failed',
      successMessage: '',
    });
  }

  fn_onAccessCodeGenerated(me, params) {
    me.setState({
      accessCode: params.accessCode || '',
      successMessage: 'Access code generated. Copy it and use it to login.',
      errorMessage: '',
    });
  }

  fn_onAccessCodeError(me, params) {
    me.setState({
      errorMessage: params && params.em ? params.em : 'Error generating access code',
      successMessage: '',
    });
    loadCaptchaEnginge(6);
  }

  fn_validateCaptcha(callback) {
    let user_captcha = document.getElementById('user_captcha_input');
    if (!user_captcha) {
      if (callback) callback();
      return;
    }
    let val = user_captcha.value;
    if (validateCaptcha(val) === true) {
      user_captcha.value = '';
      this.setState({ errorMessage: '' });
      if (callback) callback();
    } else {
      this.setState({
        errorMessage: 'Captcha does not match',
        successMessage: '',
      });
      user_captcha.value = '';
      loadCaptchaEnginge(6);
    }
  }

  fn_clickLogin(e) {
    if (e) e.preventDefault();
    const email = this.m_loginNameRef.current.value.trim();
    const accessCode = this.m_accessCodeRef.current.value.trim();
    if (!email || !accessCode) {
      this.setState({ errorMessage: 'Enter email and access code' });
      return;
    }
    js_localStorage.fn_setLoginName(email);
    js_localStorage.fn_setAccessCode(accessCode);
    fn_connect(email, accessCode);
  }

  fn_clickLogout(e) {
    if (e) e.preventDefault();
    fn_logout();
    this.setState({ is_connected: CONST_OFFLINE });
  }

  fn_clickGenerate(e) {
    if (e) e.preventDefault();
    this.fn_validateCaptcha(() => {
      const v_permission = '0xffffffff';
      js_andruavAuth.fn_generateAccessCode(this.m_loginNameRef.current.value, v_permission);
    });
  }

  fn_clickRegenerate(e) {
    if (e) e.preventDefault();
    this.fn_validateCaptcha(() => {
      let v_permission = '0xffffffff';
      if (this.m_chk_readonlyctrl.current && this.m_chk_readonlyctrl.current.checked) {
        v_permission = '0xffff00ff';
      }
      js_andruavAuth.fn_regenerateAccessCode(this.m_loginNameRef.current.value, v_permission);
    });
  }

  fn_copyToClipboard() {
    if (!this.state.accessCode) return;
    navigator.clipboard.writeText(this.state.accessCode).then(() => {
      this.setState({ successMessage: 'Access code copied to clipboard!' });
    }, (err) => {
      console.error('Could not copy: ', err);
    });
  }

  fn_toggleGenPanel() {
    const next = !this.state.showGenPanel;
    this.setState({ showGenPanel: next });
    if (next === true) {
      setTimeout(() => loadCaptchaEnginge(6), 50);
    }
  }

  render() {
    const { is_connected, errorMessage, successMessage, accessCode, showGenPanel } = this.state;

    if (is_connected === CONST_ONLINE) {
      return (
        <div className="mobile-login-panel">
          <div className="mobile-login-connected">
            <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem' }} />
            <span>Connected</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              {js_localStorage.fn_getLoginName()}
            </span>
          </div>
          <button
            className="mobile-action-btn logout"
            onClick={(e) => this.fn_clickLogout(e)}
          >
            <span className="mobile-btn-icon">
              <i className="bi bi-box-arrow-right" />
            </span>
            Logout
          </button>
        </div>
      );
    }

    const isConnecting = is_connected === CONST_IN_PROGRESS;

    return (
      <div className="mobile-login-panel">
        <div className="mobile-login-title">
          {isConnecting ? 'Connecting...' : 'Login'}
        </div>

        {errorMessage && (
          <div className="mobile-login-error">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="mobile-login-success">{successMessage}</div>
        )}

        <input
          type="email"
          ref={this.m_loginNameRef}
          placeholder="Email / Login ID"
          className="mobile-login-input"
          disabled={isConnecting}
        />
        <input
          type="password"
          ref={this.m_accessCodeRef}
          placeholder="Access Code"
          className="mobile-login-input"
          disabled={isConnecting}
        />

        {accessCode && (
          <div className="mobile-login-accesscode-box">
            <label>Generated Access Code:</label>
            <div className="mobile-login-accesscode-row">
              <input
                type="text"
                className="mobile-login-input"
                value={accessCode}
                readOnly
              />
              <button
                className="mobile-login-copy-btn"
                onClick={() => this.fn_copyToClipboard()}
              >
                <i className="bi bi-clipboard" />
              </button>
            </div>
          </div>
        )}

        <button
          className="mobile-action-btn login"
          onClick={(e) => this.fn_clickLogin(e)}
          disabled={isConnecting}
        >
          <span className="mobile-btn-icon">
            <i className={`bi ${isConnecting ? 'bi-hourglass-split' : 'bi-box-arrow-in-right'}`} />
          </span>
          {isConnecting ? 'Connecting...' : 'Login'}
        </button>

        <button
          className="mobile-login-gen-toggle"
          onClick={() => this.fn_toggleGenPanel()}
        >
          <i className="bi bi-key" /> Need an Access Code?
        </button>

        {showGenPanel && (
          <div className="mobile-login-gen-panel">
            <div className="mobile-login-permissions">
              <label>
                <input
                  type="radio"
                  ref={this.m_chk_fullctrl}
                  name="mob_permission"
                  defaultChecked
                />
                Full Control
              </label>
              <label>
                <input
                  type="radio"
                  ref={this.m_chk_readonlyctrl}
                  name="mob_permission"
                />
                Read Only
              </label>
            </div>

            <div className="mobile-login-captcha">
              <LoadCanvasTemplate />
            </div>
            <input
              type="text"
              id="user_captcha_input"
              placeholder="Enter Captcha"
              className="mobile-login-input"
            />

            <div className="mobile-login-gen-buttons">
              <button
                className="mobile-login-gen-btn primary"
                onClick={(e) => this.fn_clickGenerate(e)}
              >
                <i className="bi bi-download" /> Generate
              </button>
              <button
                className="mobile-login-gen-btn secondary"
                onClick={(e) => this.fn_clickRegenerate(e)}
              >
                <i className="bi bi-arrow-repeat" /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default MobileLoginPanel;
