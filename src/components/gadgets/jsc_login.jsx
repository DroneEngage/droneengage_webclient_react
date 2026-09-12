import React from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';

import { CPasswordReveal } from '../micro_gadgets/jsc_mctrl_password_reveal.jsx';

import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages.js';
import * as js_common from '../../js/helpers/js_common.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { js_localStorage } from '../../js/state/js_localStorage.js';
import * as js_siteConfig from '../../js/config/js_siteConfig.js';
import { js_eventEmitter } from '../../js/events/js_eventEmitter.js';
import EventBridge from '../../js/hooks/EventBridge.jsx';
import { js_speak } from '../../js/js_speak.js';
import { QueryString, fn_connect, fn_logout, getTabStatus, fn_showSecurityDialog, fn_do_modal_confirmation } from '../../js/app/js_main.js';
import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth.js';

const CONST_NOT_CONNECTION_OFFLINE = 0;
const CONST_NOT_CONNECTION_IN_PROGRESS = 1;
const CONST_NOT_CONNECTION_ONLINE = 2;
const CONST_NOT_CONNECTION_OFFLINE_FAILED = 3;

class ClssLoginControl extends React.Component {
  constructor() {
    super();
    this.state = {
      is_connected: CONST_NOT_CONNECTION_OFFLINE,
      m_update: 0,
      use_plugin: false,
      is_chat_visible: true,
      chat_unread: 0,
      is_news_visible: true,
      news_unread: 0,
      errorMessage: '',
      successMessage: '',
    };

    this.m_flag_mounted = false;
    this.key = Math.random().toString();
    this.txtLoginNameRef = React.createRef();
    this.txtAccessCodeRef = React.createRef();
    this.txtUnitIDRef = React.createRef();
    this.btnConnectRef = React.createRef();
    this.txtGroupNameRef = React.createRef();

    this.chkUsePluginRef = React.createRef();

    this.fn_onChatMessage = this.fn_onChatMessage.bind(this);
    this.fn_onChatToggle = this.fn_onChatToggle.bind(this);
    this.fn_toggleChat = this.fn_toggleChat.bind(this);
    this.fn_onNewsPush = this.fn_onNewsPush.bind(this);
    this.fn_onNewsToggle = this.fn_onNewsToggle.bind(this);
    this.fn_toggleNews = this.fn_toggleNews.bind(this);
    this.fn_onWebConnectorNotRunning = this.fn_onWebConnectorNotRunning.bind(this);
  }

  componentDidMount() {
    // Event subscriptions are owned by EventBridge siblings rendered
    // below (see render()), which auto-unsubscribe on unmount via
    // useEventSubscription.
    this.m_flag_mounted = true;

    const tabStatus = getTabStatus();

    const lsPluginEnabled = js_localStorage.fn_getWebConnectorEnabled();
    const usePlugin = js_siteConfig.CONST_WEBCONNECTOR_CONFIG.ENABLED === true ? lsPluginEnabled : false;
    this.setState({ use_plugin: usePlugin });
    if (this.chkUsePluginRef.current) {
      this.chkUsePluginRef.current.checked = usePlugin;
    }
    switch (tabStatus) {
      case 'new':
        js_session.fn_setCurrentTabStatus('new');
        console.log('This is a newly opened tab.');
        break;
      case 'refresh':
        js_session.fn_setCurrentTabStatus('refresh');
        console.log('This tab was refreshed.');
        break;
      case 'duplicate':
        js_session.fn_setCurrentTabStatus('duplicate');
        console.log('This tab is a duplicate.');
        if (usePlugin !== true) {
          js_localStorage.fn_resetUnitID();
        }
        break;
      default:
        js_session.fn_setCurrentTabStatus('unknown');
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
      this.txtLoginNameRef.current.value = queryParams.loginName || queryParams.email || '';
      this.txtGroupNameRef.current.value = queryParams.groupName || '';
      this.txtUnitIDRef.current.value = queryParams.unitName || '';
    } else if (this.txtLoginNameRef.current && this.txtAccessCodeRef.current) {
      this.txtLoginNameRef.current.value = js_localStorage.fn_getLoginName();
      this.txtAccessCodeRef.current.value = js_localStorage.fn_getAccessCode();
      if (this.txtGroupNameRef.current) {
        this.txtGroupNameRef.current.value = js_localStorage.fn_getGroupName();
      }
      if (this.txtUnitIDRef.current) {
        this.txtUnitIDRef.current.value = usePlugin === true ? js_localStorage.fn_getUnitIDShared() : js_localStorage.fn_getUnitID();
      }
    }

    if (queryParams.connect !== undefined) {
      this.clickConnect(null);
    }

    this.setState({ m_update: 1 });
  }

  fn_onSocketStatus(params) {
    const { t } = this.props; // Access t function
    js_common.fn_console_log('REACT:' + JSON.stringify(params));

    if (this.m_flag_mounted === false) return;

    if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
      const username = this.txtUnitIDRef.current ? this.txtUnitIDRef.current.value : js_localStorage.fn_getUnitID();
      js_speak.fn_speak(t('connectedSpeech')); // Translate "Connected"
      this.setState({ is_connected: CONST_NOT_CONNECTION_ONLINE, username, m_update: this.state.m_update + 1, errorMessage: '', successMessage: 'Connected Successfully' });
    } else {
      this.setState({ is_connected: CONST_NOT_CONNECTION_OFFLINE, m_update: this.state.m_update + 1 });
    }
  }

  fn_onAuthInProgress() {
    if (this.m_flag_mounted === false) return;
    this.setState({ is_connected: CONST_NOT_CONNECTION_IN_PROGRESS, m_update: this.state.m_update + 1, errorMessage: '', successMessage: 'Connecting...' });
  }

  fn_onChatMessage(p_data) {
    if (this.m_flag_mounted === false) return;
    if (!p_data || !p_data.unit) return;

    // Ignore own messages.
    if (js_session.fn_getAndruavWS() && js_session.fn_getAndruavWS().m_andruavUnit) {
      if (p_data.unit.getPartyID() === js_session.fn_getAndruavWS().m_andruavUnit.getPartyID()) {
        return;
      }
    }

    // Increment unread if chat is hidden or minimized
    if (this.state.is_chat_visible === false || p_data.minimized === true) {
      this.setState(prevState => ({ chat_unread: prevState.chat_unread + 1 }));
    }
  }

  fn_onChatToggle(p_data) {
    if (this.m_flag_mounted === false) return;
    const visible = p_data && p_data.visible === true;
    this.setState({ is_chat_visible: visible, chat_unread: visible ? 0 : this.state.chat_unread });
  }

  fn_toggleChat(p_event) {
    if (p_event) {
      p_event.preventDefault();
      p_event.stopPropagation();
    }
    // If there are unread messages, always open the chat regardless of current state
    const nextVisible = this.state.chat_unread > 0 ? true : !this.state.is_chat_visible;
    this.setState({ is_chat_visible: nextVisible, chat_unread: nextVisible ? 0 : this.state.chat_unread });
    js_eventEmitter.fn_dispatch(js_event.EE_onChatToggle, { visible: nextVisible });
  }

  fn_onNewsPush() {
    if (this.m_flag_mounted === false) return;
    if (this.state.is_news_visible === false) {
      this.setState(prevState => ({ news_unread: prevState.news_unread + 1 }));
    }
  }

  fn_onNewsToggle(p_data) {
    if (this.m_flag_mounted === false) return;
    const visible = p_data && p_data.visible === true;
    this.setState({ is_news_visible: visible, news_unread: visible ? 0 : this.state.news_unread });
  }

  fn_toggleNews(p_event) {
    if (p_event) {
      p_event.preventDefault();
      p_event.stopPropagation();
    }
    const nextVisible = this.state.news_unread > 0 ? true : !this.state.is_news_visible;
    this.setState({ is_news_visible: nextVisible, news_unread: nextVisible ? 0 : this.state.news_unread });
    js_eventEmitter.fn_dispatch(js_event.EE_onNewsToggle, { visible: nextVisible });
  }

  fn_onAuthBad(data) {
    if (this.m_flag_mounted === false) return;
    
    // Check if this is an SSL error and show security dialog
    if (data && data.ssl === true) {
      // Extract host and port from the actual probed URL
      let host, port;
      if (data.probedUrl) {
        try {
          const url = new URL(data.probedUrl);
          host = url.hostname;
          port = url.port || (url.protocol === 'https:' ? '443' : '80');
        } catch (e) {
          console.error('Failed to parse probed URL:', data.probedUrl);
          host = 'localhost';
          port = '8080';
        }
      } else if (js_session.fn_getAndruavClient() && js_session.fn_getAndruavClient().v_auth) {
        // Fallback to auth module if probedUrl not available
        const authModule = js_session.fn_getAndruavClient().v_auth;
        host = authModule.m_auth_ip;
        port = authModule._m_auth_port;
      } else {
        // Last resort fallback
        host = 'localhost';
        port = '8080';
      }
      fn_showSecurityDialog(host, port);
      return;
    }
    
    const msg = data && data.em ? data.em : 'Login failed';
    // If the user has already stopped retrying (clicked Login to stop), do not
    // override the green OFFLINE state when an in-flight request finally fails.
    if (js_andruavAuth.m_retry_login === false) {
      this.setState({ is_connected: CONST_NOT_CONNECTION_OFFLINE, m_update: this.state.m_update + 1, errorMessage: '', successMessage: '' });
      return;
    }
    this.setState({ is_connected: CONST_NOT_CONNECTION_OFFLINE_FAILED, m_update: this.state.m_update + 1, errorMessage: 'Login Error: ' + msg, successMessage: '' });
  }

  fn_onWebConnectorNotRunning(data) {
    if (this.m_flag_mounted === false) return;
    
    const autoFallback = data && data.autoFallback === true;
    const fallbackStatus = autoFallback ? 'ENABLED' : 'DISABLED';
    const fallbackClass = autoFallback ? 'text-success' : 'text-danger';
    
    const message = `
      <div class="text-center">
        <h5 class="mb-3">WebConnector is not Reachable</h5>
        <p class="mb-3">The WebConnector service is not available on this machine.</p>
        <div class="alert alert-secondary">
          <strong>AUTO_FALLBACK:</strong> <span class="${fallbackClass}">${fallbackStatus}</span>
        </div>
        ${autoFallback ? 
          '<p class="text-muted">Click OK to proceed with cloud login.</p>' : 
          '<p class="text-warning">Click OK to disable WebConnector and try again.</p>'
        }
      </div>
    `;
    
    fn_do_modal_confirmation(
      'WebConnector Not Running',
      message,
      (confirmed) => {
        if (confirmed) {
          if (autoFallback) {
            // Proceed with cloud login (already in progress)
            console.info('[WebConnector] User confirmed fallback to cloud login');
          } else {
            // Disable WebConnector and retry
            js_localStorage.fn_setWebConnectorEnabled(false);
            this.setState({ use_plugin: false });
            if (this.chkUsePluginRef.current) {
              this.chkUsePluginRef.current.checked = false;
            }
            // Restore UnitID from non-shared storage
            if (this.txtUnitIDRef.current) {
              this.txtUnitIDRef.current.value = js_localStorage.fn_getUnitID();
            }
            console.info('[WebConnector] User disabled WebConnector, retrying...');
            // Trigger connect again with WebConnector disabled
            this.clickConnect(null);
          }
        }
      },
      'OK',
      'bg-warning',
      'Cancel'
    );
  }


  fn_onInputKeyDown(e) {
    if (e && e.key === 'Enter') {
      e.preventDefault();
      this.clickConnect(e);
    }
  }

  clickConnect() {
    if (this.state.is_connected === CONST_NOT_CONNECTION_OFFLINE) {
      // offline (green) - start a new connection
      this.setState({ m_update: this.state.m_update + 1 });

      const usePlugin = (this.chkUsePluginRef.current && this.chkUsePluginRef.current.checked === true);
      js_localStorage.fn_setWebConnectorEnabled(usePlugin);

      js_localStorage.fn_setLoginName(this.txtLoginNameRef.current.value);
      js_localStorage.fn_setAccessCode(this.txtAccessCodeRef.current.value);
      let s = this.txtUnitIDRef.current.value;
      if (s !== null) {
        js_localStorage.fn_setUnitID(s);
        if (usePlugin === true) {
          js_localStorage.fn_setUnitIDShared(s);
        }
      }
      js_localStorage.fn_setGroupName(this.txtGroupNameRef.current.value);

      fn_connect(this.txtLoginNameRef.current.value, this.txtAccessCodeRef.current.value);
    } else {
      // OFFLINE_FAILED (retrying), IN_PROGRESS, or ONLINE
      // Stop retrying and go back to green OFFLINE so the user can edit fields
      fn_logout();
      this.setState({ is_connected: CONST_NOT_CONNECTION_OFFLINE, errorMessage: '', successMessage: '' });
    }
  }

  componentWillUnmount() {
    // Unsubscription is handled automatically by the EventBridge
    // siblings (useEventSubscription) on unmount.
  }

  render() {
    const { t } = this.props; // Access t function
    let control = [];
    let title;
    let css = 'btn-success';

    let ctrls = [];
    let ctrls2 = [];
    const dir = this.props.i18n.language === 'ar' ? 'al_r' : 'al_l';
    switch (this.state.is_connected) {
      
      case CONST_NOT_CONNECTION_OFFLINE_FAILED:
      case CONST_NOT_CONNECTION_OFFLINE:
        title = t('title.login');
        css = this.state.is_connected===CONST_NOT_CONNECTION_OFFLINE_FAILED?'btn-warning':'btn-success';
        ctrls.push(
          <div key={'div_login' + this.key} className="">
            {js_siteConfig.CONST_WEBCONNECTOR_CONFIG.ENABLED && (
              <div className={`form-group ${dir}`}>
                <label className="txt-theme-aware">
                    <input
                    type="checkbox"
                    ref={this.chkUsePluginRef}
                    defaultChecked={this.state.use_plugin === true}
                    onChange={(e) => {
                      const enabled = e.target.checked === true;
                      this.setState({ use_plugin: enabled });
                      js_localStorage.fn_setWebConnectorEnabled(enabled);

                      if (this.txtUnitIDRef.current) {
                        if (enabled === true) {
                          this.txtUnitIDRef.current.value = js_localStorage.fn_getUnitIDShared();
                        } else {
                          js_localStorage.fn_resetUnitID();
                          this.txtUnitIDRef.current.value = js_localStorage.fn_getUnitID();
                        }
                      }
                      try {
                        console.info('[WebConnector] UI toggle', { enabled: enabled });
                      } catch (err) {
                        // ignore console errors
                      }
                    }}
                  />
                  &nbsp;Use WebConnector
                </label>
              </div>
            )}

            <div className={`form-group ${dir}${this.state.use_plugin === true ? ' hidden' : ''}`}>
              <label key={'txtLoginName1' + this.key} htmlFor="txtLoginName" id="loginName" className="txt-theme-aware">
                {t('label.loginName')}
              </label>
              <input
                type="text"
                id="txtLoginName"
                name="txtLoginName"
                pattern="[a-zA-Z0-9]+"
                title="LoginName must be alphanumeric"
                ref={this.txtLoginNameRef}
                className="form-control"
                onKeyDown={(e) => this.fn_onInputKeyDown(e)}
                defaultValue={
                  QueryString.loginName != null ? QueryString.loginName : (QueryString.email != null ? QueryString.email : js_localStorage.fn_getLoginName())
                }
              />
            </div>
            <div className={`form-group ${dir}${this.state.use_plugin === true ? ' hidden' : ''}`}>
              <label htmlFor="txtAccessCode" id="account" className="txt-theme-aware" title={t('tooltip.accessCode')}>
                {t('label.password')}
              </label>
              <CPasswordReveal
                id="txtAccessCode"
                title={t('tooltip.accessCode')}
                name="txtAccessCode"
                ref={this.txtAccessCodeRef}
                onKeyDown={(e) => this.fn_onInputKeyDown(e)}
                defaultValue={
                  QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()
                }
              />
            </div>
            <div className={`form-group ${dir} hidden`}>
              <label htmlFor="txtGroupName" id="group" className="txt-theme-aware">
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
            <div className={`form-group ${dir}${this.state.use_plugin === true ? ' hidden' : ''}`}>
              <label htmlFor="txtUnitID" id="unitID" className="text-muted">
                {t('label.gcsId')}
              </label>
              <input
                type="text"
                id="txtUnitID"
                name="txtUnitID"
                ref={this.txtUnitIDRef}
                className="form-control"
                onKeyDown={(e) => this.fn_onInputKeyDown(e)}
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
        {
        title = t('title.logout'); // "Logout"
          const lsPluginEnabled = js_localStorage.fn_getWebConnectorEnabled();
          const usePlugin = (lsPluginEnabled !== null) ? (lsPluginEnabled === true) : (this.state.use_plugin === true);
          css = usePlugin === true ? 'btn-info' : 'btn-danger';
        ctrls2.push(
          <div key={'div_logout' + this.key} className=" ">
            <div className={`form-group ${dir}`}>
              <span key={'txtLoginName2' + this.key} className="text-muted">
                {t('label.loginName')}
              </span>
              <p>{js_localStorage.fn_getLoginName()}</p>
            </div>
            <div className={`form-group ${dir}`}>
              <p className="text-muted">{t('label.gcsId') + (usePlugin === true ? ' (Plugin)' : '')}</p> 
              <p>{js_localStorage.fn_getUnitID()}</p>
            </div>
          </div>
        );
        }
        break;
      case CONST_NOT_CONNECTION_IN_PROGRESS:
        title = t('title.connecting'); // "Connecting.."
        css = 'bg-warning';
        ctrls.push(
          <div key={'div_connecting' + this.key} className="">
            <div className={`form-group ${dir} ${this.state.use_plugin === true ? ' hidden' : ''}`}>
              <label key={'txtLoginName1' + this.key} htmlFor="txtLoginName" id="loginName" className="txt-theme-aware">
                {t('label.loginName')}
              </label>
              <input
                type="text"
                id="txtLoginName"
                name="txtLoginName"
                pattern="[a-zA-Z0-9]+"
                title="LoginName must be alphanumeric"
                ref={this.txtLoginNameRef}
                className="form-control"
                defaultValue={
                  QueryString.loginName != null ? QueryString.loginName : (QueryString.email != null ? QueryString.email : js_localStorage.fn_getLoginName())
                }
                disabled
              />
            </div>
            <div className={`form-group ${dir}${this.state.use_plugin === true ? ' hidden' : ''}`}>
              <label htmlFor="txtAccessCode" id="account" className="txt-theme-aware" title={t('tooltip.accessCode')}>
                {t('label.password')}
              </label>
              <CPasswordReveal
                id="txtAccessCode"
                title={t('tooltip.accessCode')}
                name="txtAccessCode"
                ref={this.txtAccessCodeRef}
                defaultValue={
                  QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()
                }
                disabled
              />
            </div>
            <div className={`form-group ${dir} hidden`}>
              <label htmlFor="txtGroupName" id="group" className="txt-theme-aware">
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
            <div className={`form-group ${dir}${this.state.use_plugin === true ? ' hidden' : ''}`}>
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
      default:
        break;
    }


    control.push(<EventBridge key="eb_EE_onSocketStatus" eventName={js_event.EE_onSocketStatus} onEvent={(data) => this.fn_onSocketStatus(data)} />);
    control.push(<EventBridge key="eb_EE_Auth_Login_In_Progress" eventName={js_event.EE_Auth_Login_In_Progress} onEvent={() => this.fn_onAuthInProgress()} />);
    control.push(<EventBridge key="eb_EE_Auth_BAD_Logined" eventName={js_event.EE_Auth_BAD_Logined} onEvent={(data) => this.fn_onAuthBad(data)} />);
    control.push(<EventBridge key="eb_EE_onChatMessage" eventName={js_event.EE_onChatMessage} onEvent={(data) => this.fn_onChatMessage(data)} />);
    control.push(<EventBridge key="eb_EE_onChatToggle" eventName={js_event.EE_onChatToggle} onEvent={(data) => this.fn_onChatToggle(data)} />);
    control.push(<EventBridge key="eb_EE_News_Push" eventName={js_event.EE_News_Push} onEvent={() => this.fn_onNewsPush()} />);
    control.push(<EventBridge key="eb_EE_onNewsToggle" eventName={js_event.EE_onNewsToggle} onEvent={(data) => this.fn_onNewsToggle(data)} />);
    control.push(<EventBridge key="eb_EE_WebConnector_Not_Running" eventName={js_event.EE_WebConnector_Not_Running} onEvent={(data) => this.fn_onWebConnectorNotRunning(data)} />);

    const v_chatIconClass = this.state.chat_unread > 0
      ? 'bi-chat-dots-fill text-danger'
      : (this.state.is_chat_visible ? 'bi-chat-dots-fill' : 'bi-chat');
    const v_chatBtnClass = this.state.is_chat_visible ? 'btn-primary' : 'btn-secondary';

    control.push(
      <button
        key={'btn_chat' + this.key}
        type="button"
        className={'btn btn-sm mt-1 ms-1 bi ' + v_chatIconClass + ' btn_bi_fixer me-1 ' + v_chatBtnClass}
        title={this.state.chat_unread > 0 ? 'GCS Chat (' + this.state.chat_unread + ')' : 'GCS Chat'}
        onClick={(e) => this.fn_toggleChat(e)}
      >
      </button>
    );

    const v_newsIconClass = this.state.news_unread > 0
      ? 'bi-megaphone-fill text-danger'
      : (this.state.is_news_visible ? 'bi-megaphone-fill' : 'bi-megaphone');
    const v_newsBtnClass = this.state.is_news_visible ? 'btn-primary' : 'btn-secondary';

    control.push(
      <button
        key={'btn_news' + this.key}
        type="button"
        className={'btn btn-sm mt-1 ms-1 bi ' + v_newsIconClass + ' btn_bi_fixer me-1 ' + v_newsBtnClass}
        title={this.state.news_unread > 0 ? 'News (' + this.state.news_unread + ')' : 'News'}
        onClick={(e) => this.fn_toggleNews(e)}
      >
      </button>
    );

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
        <div className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton1" style={{minWidth: '200px', maxWidth: '90vw'}}>
          <div id="login_form" className="card-body">
            {this.state.errorMessage && (
              <div className="alert alert-danger text-center py-1 px-2 mb-2" role="alert" style={{ fontSize: '0.8rem' }}>
                {this.state.errorMessage}
              </div>
            )}
            {this.state.successMessage && (
              <div className="alert alert-success text-center py-1 px-2 mb-2" role="alert" style={{ fontSize: '0.8rem' }}>
                {this.state.successMessage}
              </div>
            )}
            {ctrls}
            <button
              id="btnConnect"
              className={'btn btn-sm button_large rounded-3 user-select-none w-100 ' + css + ' p-1'}
              title={this.state.username}
              onClick={(e) => this.clickConnect(e)}
              ref={this.btnConnectRef}
            >
              {css.includes('warning') ? t('title.cancelLogging') : title}
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