import React from 'react';
import { withTranslation } from 'react-i18next';
import * as js_andruav_facade from '../../js/protocol/server_comm/js_andruav_facade.js';
import { js_globals } from '../../js/js_globals.js';
import { DIALOG_ICONS } from '../../js/config/assets.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { js_eventEmitter } from '../../js/events/js_eventEmitter';
import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth';
import { ClssFireEvent } from '../micro_gadgets/jsc_mctrl_fire_event.jsx';
import { setSelectedMissionFilePathToWrite } from '../../js/js_main.js';

import ClssDefault from './ClssDefault.jsx';
import ClssPreferences from './ClssPreferences.jsx';
import ClssMapAdsbSettings from './ClssMapAdsbSettings.jsx';

class ClssGlobalSettings extends React.Component {
  constructor() {
    super();
    this.state = {
      m_update: 0,
      isMinimized: false,
    };
    this.key = Math.random().toString();
    this.mission_file_ref = React.createRef();
    this.defaultTabRef = React.createRef();
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Logined, this, this.fn_onAuthStatus);
    js_eventEmitter.fn_subscribe(js_event.EE_Language_Changed, this, this.fn_updateLanguage);

  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.CONST_DEFAULT_ALTITUDE !== nextState.CONST_DEFAULT_ALTITUDE) {
      return true;
    }
    if (this.state.CONST_DEFAULT_RADIUS !== nextState.CONST_DEFAULT_RADIUS) {
      return true;
    }
    if (this.state.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE !== nextState.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE) {
      return true;
    }
    if (this.state.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE !== nextState.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE) {
      return true;
    }
    if (this.state.m_unitText !== nextState.m_unitText) {
      return true;
    }
    if (this.state.m_update !== nextState.m_update) {
      return true;
    }
    if (this.state.isMinimized !== nextState.isMinimized) {
      return true;
    }
    return false;
  }

  fn_updateLanguage(p_me) {
    if (p_me.m_flag_mounted === false) return;
    p_me.setState({ m_update: p_me.state.m_update + 1 });
  }

  fn_handleFileChange(e) {
    setSelectedMissionFilePathToWrite(this.mission_file_ref.current.files);
  }

  fn_onAuthStatus(me, res) {
    if (me.m_flag_mounted === false) return;
    me.setState({ m_update: me.state.m_update + 1 });
  }

  componentDidMount() {
    if (this.defaultTabRef.current) {
      this.defaultTabRef.current.classList.add('active');
    }
    this.setState({ m_update: this.state.m_update + 1 });
  }

  componentWillUnmount() {
    this.state.m_update = 0;
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Logined, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_Language_Changed, this);
  }

  fn_fireDeEvent(value) {
    js_andruav_facade.AndruavClientFacade.API_FireDeEvent(null, value);
  }

  fn_toggleMinimize() {
    this.setState(prevState => ({ isMinimized: !prevState.isMinimized }));
  }

  render() {
    const { t } = this.props;
    let v_gadgets = [];
    let v_uploadFile = [];
    let v_telemetryModes = [];

    v_uploadFile.push(
      <div
        key={this.key + 'v_uploadFile0'}
        className="row width_100 margin_zero css_margin_top_small"
        dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div key={this.key + 'v_uploadFile1'} className="col-12">
          <div key={this.key + 'v_uploadFile2'} className="form-inline">
            <div key={this.key + 'v_uploadFile3'} className="form-group">
              <label htmlFor="btn_filesWP" className="user-select-none txt-theme-aware mt-2">
                <small>{t('globalSettings:missionFileLabel')}</small>
              </label>
              <input
                type="file"
                id="btn_filesWP"
                name="file"
                className="form-control input-xs input-sm css_margin_left_5 line-height-normal"
                ref={this.mission_file_ref}
                onChange={(e) => this.fn_handleFileChange(e)}
              />
            </div>
          </div>
        </div>
      </div>
    );

    let cls_ctrl_wp = '';
    if (!js_andruavAuth.fn_do_canControlWP()) {
      cls_ctrl_wp = ' hidden disabled ';
    }

    return (
      <div key={this.key + 'g1'} className="row margin_zero" dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="card txt-theme-aware border-light mb-3 padding_zero">
          <div className="card-header text-center user-select-none">
            <strong>{t('globalSettings:settingsTitle')}</strong>
            <button type="button" className="btn btn-sm btn-link txt-theme-aware float-end p-0 ms-2" onClick={() => this.fn_toggleMinimize()}>
              {this.state.isMinimized ? DIALOG_ICONS.MAXIMIZE : DIALOG_ICONS.MINIMIZE}
            </button>
          </div>
          <div className="card-body" style={{ display: this.state.isMinimized ? 'none' : 'block' }}>
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <a className="nav-link user-select-none txt-theme-aware" data-bs-toggle="tab" href="#settings_home" ref={this.defaultTabRef}>
                  {t('globalSettings:defaultsTab')}
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={'nav-link user-select-none txt-theme-aware ' + cls_ctrl_wp}
                  data-bs-toggle="tab"
                  href="#settings_profile"
                >
                  {t('globalSettings:missionTab')}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link user-select-none txt-theme-aware" data-bs-toggle="tab" href="#settings_preference">
                  {t('globalSettings:preferencesTab')}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link user-select-none txt-theme-aware" data-bs-toggle="tab" href="#settings_map_adsb">
                  Map &amp; ADSB
                </a>
              </li>
            </ul>
            <div id="main_settings_tab" className="tab-content">
              <div className="tab-pane fade active show pt-2" id="settings_home">
                <ClssDefault t={t} i18n={this.props.i18n} />
                {v_telemetryModes}
              </div>
              <div className={'tab-pane fade pt-2' + cls_ctrl_wp} id="settings_profile">
                {v_uploadFile}
                <ClssFireEvent
                  label={t('globalSettings:eventDroneEngageLabel')}
                  onClick={(value) => this.fn_fireDeEvent(value)}
                />
              </div>
              <div className="tab-pane fade" id="settings_preference">
                <ClssPreferences t={t} i18n={this.props.i18n} />
              </div>
              <div className="tab-pane fade" id="settings_map_adsb">
                <ClssMapAdsbSettings t={t} i18n={this.props.i18n} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation(['', 'globalSettings'])(ClssGlobalSettings);
