import React from 'react';
import { withTranslation } from 'react-i18next';

import * as js_andruavMessages from '../js/js_andruavMessages';
import * as js_common from '../js/js_common.js';
import { EVENTS as js_event } from '../js/js_eventList.js';
import { js_localStorage } from '../js/js_localStorage';
import { js_eventEmitter } from '../js/js_eventEmitter';
import { js_speak } from '../js/js_speak';
import { QueryString, fn_connect, fn_logout, getTabStatus } from '../js/js_main';

const CONST_NOT_CONNECTION_OFFLINE = 0;
const CONST_NOT_CONNECTION_IN_PROGRESS = 1;
const CONST_NOT_CONNECTION_ONLINE = 2;

class ClssLoginControl extends React.Component {
  constructor() {
    super();
    this.state = {
      is_connected: CONST_NOT_CONNECTION_OFFLINE,
      m_update: 0,
    };

    this.key = Math.random().toString();
    this.txtEmailRef = React.createRef();
    this.txtAccessCodeRef = React.createRef();
    this.txtUnitIDRef = React.createRef();
    this.btnConnectRef = React.createRef();
    this.txtGroupNameRef = React.createRef();

    js_eventEmitter.fn_subscribe(js_event.EE_onSocketStatus, this, this.fn_onSocketStatus);
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Login_In_Progress, this, this.fn_onAuthInProgress);
  }

  fn_onSocketStatus(me, params) {
    const { t } = me.props; // Access t function
    js_common.fn_console_log('REACT:' + JSON.stringify(params));

    if (me.m_flag_mounted === false) return;

    if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
      me.state.is_connected = CONST_NOT_CONNECTION_ONLINE;
      me.state.username = me.txtUnitIDRef.current.value;
      js_speak.fn_speak(t('connectedSpeech')); // Translate "Connected"
    } else {
      me.state.is_connected = CONST_NOT_CONNECTION_OFFLINE;
      me.setState({ m_update: me.state.m_update + 1 });
    }
  }

  fn_onAuthInProgress(me) {
    if (me.m_flag_mounted === false) return;
    me.state.is_connected = CONST_NOT_CONNECTION_IN_PROGRESS;
    me.setState({ m_update: me.state.m_update + 1 });
  }

  clickConnect(e) {
    if (this.state.is_connected !== CONST_NOT_CONNECTION_OFFLINE) {
      // online or connecting
      fn_logout();
      this.setState({ is_connected: CONST_NOT_CONNECTION_OFFLINE });
    } else {
      // offline
      this.setState({ m_update: this.state.m_update + 1 });

      js_localStorage.fn_setEmail(this.txtEmailRef.current.value);
      js_localStorage.fn_setAccessCode(this.txtAccessCodeRef.current.value);
      let s = this.txtUnitIDRef.current.value;
      if (s !== null) {
        js_localStorage.fn_setUnitID(s);
      }
      js_localStorage.fn_setGroupName(this.txtGroupNameRef.current.value);

      fn_connect(this.txtEmailRef.current.value, this.txtAccessCodeRef.current.value);
    }
  }

  componentWillUnmount() {
    js_eventEmitter.fn_unsubscribe(js_event.EE_onSocketStatus, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Login_In_Progress, this);
  }

  componentDidMount() {
    this.setState({ m_update: 1 });

    const tabStatus = getTabStatus();

    switch (tabStatus) {
      case 'new':
        console.log('This is a newly opened tab.');
        break;
      case 'refresh':
        console.log('This tab was refreshed.');
        break;
      case 'duplicate':
        console.log('This tab is a duplicate.');
        js_localStorage.fn_resetUnitID();
        break;
      default:
        console.log('Unknown tab status.');
    }

    const queryParams = QueryString;

    const hasRequiredParams =
      queryParams.accesscode !== undefined ||
      queryParams.email !== undefined ||
      queryParams.groupName !== undefined ||
      queryParams.unitName !== undefined;

    if (hasRequiredParams && this.txtAccessCodeRef.current) {
      this.txtAccessCodeRef.current.value = queryParams.accesscode || '';
      this.txtEmailRef.current.value = queryParams.email || '';
      this.txtGroupNameRef.current.value = queryParams.groupName || '';
      this.txtUnitIDRef.current.value = queryParams.unitName || '';
    } else {
      this.txtEmailRef.current.value = js_localStorage.fn_getEmail();
      this.txtAccessCodeRef.current.value = js_localStorage.fn_getAccessCode();
      this.txtGroupNameRef.current.value = js_localStorage.fn_getGroupName();
      this.txtUnitIDRef.current.value = js_localStorage.fn_getUnitID();
    }

    if (queryParams.connect !== undefined) {
      this.clickConnect(null);
    }
  }

  render() {
    const { t } = this.props; // Access t function
    let control = [];
    let title;
    let css = 'bg-success';

    let ctrls = [];
    let ctrls2 = [];
	const dir = this.props.i18n.language === 'ar' ? 'al_r' : 'al_l';
    switch (this.state.is_connected) {
      case CONST_NOT_CONNECTION_OFFLINE:
        title = t('title.login'); 
        ctrls.push(
          <div key={'div_login' + this.key} className="">
			<div className={`form-group ${dir}`}>
              <label key={'txtEmail1' + this.key} htmlFor="txtEmail" id="email" className="text-white">
                {t('label.email')} 
              </label>
              <input
                type="email"
                id="txtEmail"
                name="txtEmail"
                ref={this.txtEmailRef}
                className="form-control"
                defaultValue={
                  QueryString.email != null ? QueryString.email : js_localStorage.fn_getEmail()
                }
              />
            </div>
            <div className={`form-group ${dir}`}>
              <label htmlFor="txtAccessCode" id="account" className="text-white" title={t('tooltip.accessCode')}>
                {t('label.password')} 
              </label>
              <input
                type="password"
                id="txtAccessCode"
                title={t('tooltip.accessCode')} 
                name="txtAccessCode"
                ref={this.txtAccessCodeRef}
                className="form-control"
                defaultValue={
                  QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()
                }
              />
            </div>
            <div className="form-group al_l hidden">
              <label htmlFor="txtGroupName" id="group" className="text-white">
                {t('label.groupName')}
              </label>
              <input
                type="text"
                id="txtGroupName"
                name="txtGroupName"
                ref={this.txtGroupNameRef}
                className="form-control"
                defaultValue={
                  QueryString.groupName != null ? QueryString.groupName : js_localStorage.fn_getGroupName()
                }
              />
            </div>
            <div className={`form-group ${dir}`}>
              <label htmlFor="txtUnitID" id="unitID" className="text-muted">
                {t('label.gcsId')}
              </label>
              <input
                type="text"
                id="txtUnitID"
                name="txtUnitID"
                ref={this.txtUnitIDRef}
                className="form-control"
                defaultValue={
                  QueryString.unitName != null ? QueryString.unitName : js_localStorage.fn_getUnitID()
                }
              />
            </div>
            <br />
          </div>
        );
        break;
      case CONST_NOT_CONNECTION_ONLINE:
        title = t('title.logout'); // "Logout"
        css = 'bg-danger';
        ctrls2.push(
          <div key={'div_logout' + this.key} className=" ">
            <div className="form-group al_l">
              <span key={'txtEmail2' + this.key} className="text-muted">
                {t('label.email')} {/* "Email" */}
              </span>
              <p>{js_localStorage.fn_getEmail()}</p>
            </div>
            <div className="form-group al_l">
              <p className="text-muted">{t('label.gcsId')}</p> {/* "GCS ID" */}
              <p>{js_localStorage.fn_getUnitID()}</p>
            </div>
          </div>
        );
        break;
      case CONST_NOT_CONNECTION_IN_PROGRESS:
        title = t('title.connecting'); // "Connecting.."
        css = 'bg-warning';
        ctrls.push(
          <div key={'div_connecting' + this.key} className="">
            <div className={`form-group ${dir}`}>
              <label key={'txtEmail1' + this.key} htmlFor="txtEmail" id="email" className="text-white">
                {t('label.email')} {/* "Email" */}
              </label>
              <input
                type="email"
                id="txtEmail"
                name="txtEmail"
                ref={this.txtEmailRef}
                className="form-control"
                defaultValue={
                  QueryString.email != null ? QueryString.email : js_localStorage.fn_getEmail()
                }
                disabled
              />
            </div>
            <div className={`form-group ${dir}`}>
              <label htmlFor="txtAccessCode" id="account" className="text-white" title={t('tooltip.accessCode')}>
                {t('label.password')} 
              </label>
              <input
                type="password"
                id="txtAccessCode"
                title={t('tooltip.accessCode')} 
                name="txtAccessCode"
                ref={this.txtAccessCodeRef}
                className="form-control"
                defaultValue={
                  QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()
                }
                disabled
              />
            </div>
            <div className="form-group al_l hidden">
              <label htmlFor="txtGroupName" id="group" className="text-white">
                {t('label.groupName')} {/* "Group Name" */}
              </label>
              <input
                type="text"
                id="txtGroupName"
                name="txtGroupName"
                ref={this.txtGroupNameRef}
                className="form-control"
                defaultValue={
                  QueryString.groupName != null ? QueryString.groupName : js_localStorage.fn_getGroupName()
                }
                disabled
              />
            </div>
            <div className={`form-group ${dir}`}>
              <label htmlFor="txtUnitID" id="unitID" className="text-muted">
                {t('label.gcsId')} {/* "GCS ID" */}
              </label>
              <input
                type="text"
                id="txtUnitID"
                name="txtUnitID"
                ref={this.txtUnitIDRef}
                className="form-control"
                defaultValue={
                  QueryString.unitName != null ? QueryString.unitName : js_localStorage.fn_getUnitID()
                }
                disabled
              />
            </div>
            <br />
          </div>
        );
        break;
    }

    control.push(
      <div key={'ClssLoginControl_complex' + this.key} className="dropdown">
        <button
          className={'btn btn-secondary dropdown-toggle btn-sm mt-1 ' + css}
          type="button"
          id="dropdownMenuButton1"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {title}
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
          <div id="login_form" className="card-body">
            {ctrls}
            <button
              id="btnConnect"
              className={'btn button_large rounded-3 m-2 user-select-none ' + css + ' p-0'}
              title={this.state.username}
              onClick={(e) => this.clickConnect(e)}
              ref={this.btnConnectRef}
            >
              {title}
            </button>
            {ctrls2}
          </div>
        </div>
      </div>
    );

    return control;
  }
}

export default withTranslation()(ClssLoginControl);