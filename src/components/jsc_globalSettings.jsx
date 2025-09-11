import React from 'react';
import { withTranslation } from 'react-i18next';
import * as js_siteConfig from '../js/js_siteConfig.js';
import * as js_andruav_facade from '../js/js_andruav_facade.js';
import { js_globals } from '../js/js_globals.js';
import { EVENTS as js_event } from '../js/js_eventList.js';
import { js_eventEmitter } from '../js/js_eventEmitter';
import { js_speak } from '../js/js_speak';
import { gui_toggleUnits } from '../js/js_main';
import { js_localStorage } from '../js/js_localStorage';
import { js_andruavAuth } from '../js/js_andruav_auth';
import { ClssFireEvent } from './micro_gadgets/jsc_mctrl_fire_event.jsx';
import { setSelectedMissionFilePathToWrite } from '../js/js_main.js';

class ClssDefault extends React.Component {
  constructor() {
    super();
    this.state = {
      m_unitText: 'm',
      CONST_DEFAULT_ALTITUDE: js_globals.CONST_DEFAULT_ALTITUDE,
      CONST_DEFAULT_RADIUS: js_globals.CONST_DEFAULT_RADIUS,
      m_update: 0,
    };
    this.m_flag_mounted = false;
    this.key = Math.random().toString();
    this.altitudeInputRef = React.createRef();
    this.radiusInputRef = React.createRef();
    this.horizontal_distance = React.createRef();
    this.vertical_distance = React.createRef();

    if (js_localStorage.fn_getMetricSystem() === true) {
      this.state.m_unitText = 'm';
    } else {
      this.state.m_unitText = 'ft';
    }

    this.state.CONST_DEFAULT_ALTITUDE = js_localStorage.fn_getDefaultAltitude();
    this.state.CONST_DEFAULT_RADIUS = js_localStorage.fn_getDefaultRadius();
    this.state.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = js_localStorage.fn_getDefaultSwarmHorizontalDistance();
    this.state.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = js_localStorage.fn_getDefaultSwarmVerticalDistance();

    js_eventEmitter.fn_subscribe(js_event.EE_onAdvancedMode, this, this.fn_advancedMode);
  }

  componentDidMount() {
    this.m_flag_mounted = true;
  }

  componentWillUnmount() {
    js_eventEmitter.fn_unsubscribe(js_event.EE_onAdvancedMode, this);
  }

  fn_advancedMode(p_me) {
    if (p_me.m_flag_mounted === false) return;
    p_me.setState({ m_update: p_me.state.m_update + 1 });
  }

  onChange(e) {
    const altitudeValue = parseInt(this.altitudeInputRef.current.value);
    const radiusValue = parseInt(this.radiusInputRef.current.value);

    js_globals.CONST_DEFAULT_ALTITUDE = altitudeValue;
    js_globals.CONST_DEFAULT_RADIUS = radiusValue;

    if (js_globals.CONST_DEFAULT_ALTITUDE < js_globals.CONST_DEFAULT_ALTITUDE_min)
      js_globals.CONST_DEFAULT_ALTITUDE = parseInt(js_globals.CONST_DEFAULT_ALTITUDE_min);
    if (js_globals.CONST_DEFAULT_RADIUS < js_globals.CONST_DEFAULT_RADIUS_min)
      js_globals.CONST_DEFAULT_RADIUS = parseInt(js_globals.CONST_DEFAULT_RADIUS_min);

    js_localStorage.fn_setDefaultAltitude(js_globals.CONST_DEFAULT_ALTITUDE);
    js_localStorage.fn_setDefaultRadius(js_globals.CONST_DEFAULT_RADIUS);

    this.setState({ CONST_DEFAULT_ALTITUDE: js_globals.CONST_DEFAULT_ALTITUDE });
    this.setState({ CONST_DEFAULT_RADIUS: js_globals.CONST_DEFAULT_RADIUS });
  }

  onChangeSwarm(e) {
    const swarm_horizontal_value = parseInt(this.horizontal_distance.current.value);
    const swarm_vertical_value = parseInt(this.vertical_distance.current.value);

    js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = swarm_horizontal_value;
    js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = swarm_vertical_value;

    if (js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE < js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN)
      js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = parseInt(js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN);
    if (js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE < js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN)
      js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = parseInt(js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN);

    js_localStorage.fn_setDefaultSwarmHorizontalDistance(js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE);
    js_localStorage.fn_setDefaultSwarmVerticalDistance(js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE);

    this.setState({ CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE });
    this.setState({ CONST_DEFAULT_SWARM_VERTICAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE });
  }

  clickToggleUnit(e) {
    gui_toggleUnits();
    if (js_localStorage.fn_getMetricSystem() === true) {
      this.setState({ m_unitText: 'm' });
    } else {
      this.setState({ m_unitText: 'ft' });
    }

    this.setState({ CONST_DEFAULT_ALTITUDE: js_globals.CONST_DEFAULT_ALTITUDE });
    this.setState({ CONST_DEFAULT_RADIUS: js_globals.CONST_DEFAULT_RADIUS });
    this.setState({ CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE });
    this.setState({ CONST_DEFAULT_SWARM_VERTICAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE });
  }

  render() {
    const { t } = this.props;
    let v_gadgets = [];
    v_gadgets.push(
      <div key={this.key + '1'} className="row me-0 ms-0" dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="col-xs-6 col-sm-6 col-lg-6">
          <div className="form-inline">
            <div className="form-group">
              <div title={t('globalSettings:altitudeTitle')}>
                <label htmlFor="txt_defaultAltitude" className="user-select-none text-white txt_label_width">
                  <small>{t('globalSettings:altitudeLabel')}</small>
                </label>
                <input
                  id="txt_defaultAltitude"
                  type="number"
                  min={parseInt(js_globals.CONST_DEFAULT_ALTITUDE_min)}
                  className="form-control input-xs input-sm"
                  onChange={(e) => this.onChange(e)}
                  value={this.state.CONST_DEFAULT_ALTITUDE}
                  ref={this.altitudeInputRef}
                />
                <button
                  id="btn_defaultAltitude"
                  className="btn btn-secondary btn-sm mb-1 pt-0 pb-1"
                  type="button"
                  onClick={(e) => this.clickToggleUnit(e)}
                >
                  {t(`distance.${this.state.m_unitText}`)}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xs-6 col-sm-6 col-lg-6">
          <div className="form-inline">
            <div className="form-group">
              <div title={t('globalSettings:radiusTitle')}>
                <label htmlFor="txt_defaultCircle" className="user-select-none text-white txt_label_width">
                  <small>{t('globalSettings:radiusLabel')}</small>
                </label>
                <input
                  id="txt_defaultCircle"
                  type="number"
                  min={parseInt(js_globals.CONST_DEFAULT_RADIUS_min)}
                  className="form-control input-xs input-sm"
                  onChange={(e) => this.onChange(e)}
                  value={this.state.CONST_DEFAULT_RADIUS}
                  ref={this.radiusInputRef}
                />
                <button
                  id="btn_defaultCircle"
                  className="btn btn-secondary btn-sm mb-1 pt-0 pb-1"
                  type="button"
                  onClick={(e) => this.clickToggleUnit(e)}
                >
                  {t(`distance.${this.state.m_unitText}`)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    if (js_siteConfig.CONST_FEATURE.DISABLE_SWARM === false && js_localStorage.fn_getAdvancedOptionsEnabled() === true) {
      v_gadgets.push(
        <div key={this.key + 's1'} className="row border-top pt-1 border-secondary border-bottom me-0 ms-0">
          <div className="col-xs-6 col-sm-6 col-lg-6">
            <div className="form-inline">
              <div className="form-group">
                <div title={t('globalSettings:swarmHorizontalTitle')}>
                  <label htmlFor="txt_defaultSwarmDistance" className="user-select-none text-white txt_label_width">
                    <small>{t('globalSettings:swarmHorizontalLabel')}</small>
                  </label>
                  <input
                    id="txt_defaultSwarmDistance"
                    type="number"
                    min={parseInt(js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN)}
                    className="form-control input-xs input-sm ms-1"
                    onChange={(e) => this.onChangeSwarm(e)}
                    value={this.state.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE}
                    ref={this.horizontal_distance}
                  />
                  <button
                    id="btn_defaultSwarmDistance"
                    className="btn btn-secondary btn-sm mb-1 pt-0 pb-1 ms-1"
                    type="button"
                    onClick={(e) => this.clickToggleUnit(e)}
                  >
                    {t(`distance.${this.state.m_unitText}`)}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xs-6 col-sm-6 col-lg-6">
            <div className="form-inline">
              <div className="form-group">
                <div title={t('globalSettings:swarmVerticalTitle')}>
                  <label htmlFor="txt_defaultSwarmAltDelta" className="user-select-none text-white txt_label_width">
                    <small>{t('globalSettings:swarmVerticalLabel')}</small>
                  </label>
                  <input
                    id="txt_defaultSwarmAltDelta"
                    type="number"
                    min={parseInt(js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN)}
                    className="form-control input-xs input-sm ms-1"
                    onChange={(e) => this.onChangeSwarm(e)}
                    value={this.state.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE}
                    ref={this.vertical_distance}
                  />
                  <button
                    id="btn_defaultSwarmAltDelta"
                    className="btn btn-secondary btn-sm mb-1 pt-0 pb-1 ms-1"
                    type="button"
                    onClick={(e) => this.clickToggleUnit(e)}
                  >
                    {t(`distance.${this.state.m_unitText}`)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return v_gadgets;
  }
}

class ClssPreferences extends React.Component {
  constructor() {
    super();
    this.key = Math.random().toString();
    js_globals.v_enable_tabs_display = js_localStorage.fn_getTabsDisplayEnabled();
    this.m_volumeRangeRef = React.createRef();
    this.m_enableSpeechRef = React.createRef();
    this.m_tabsDisplayeRef = React.createRef();
    this.m_unitSortRef = React.createRef();
    this.m_advancedRef = React.createRef();
    this.m_gcsDisplayRef = React.createRef();
    this.m_gcsShowMeRef = React.createRef();
  }

  componentDidMount() {
    this.m_enableSpeechRef.current.checked = js_localStorage.fn_getSpeechEnabled();
    this.m_volumeRangeRef.current.value = js_localStorage.fn_getVolume();
    this.m_tabsDisplayeRef.current.checked = js_localStorage.fn_getTabsDisplayEnabled();
    this.m_unitSortRef.current.checked = js_localStorage.fn_getUnitSortEnabled();
    this.m_advancedRef.current.checked = js_localStorage.fn_getAdvancedOptionsEnabled();
    this.m_gcsDisplayRef.current.checked = js_localStorage.fn_getGCSDisplayEnabled();
    this.m_gcsShowMeRef.current.checked = js_localStorage.fn_getGCSShowMe();
  }

  componentWillUnmount() {}

  fn_changeVolume(e) {
    js_localStorage.fn_setVolume(e.currentTarget.value);
    js_speak.fn_updateSettings();
  }

  fn_handleMouseUp(e) {
    js_localStorage.fn_setVolume(e.currentTarget.value);
    js_speak.fn_updateSettings();
    js_speak.fn_speakFirst(this.props.t('globalSettings:testVolume'));
  }

  fn_enableSpeech(e) {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setSpeechEnabled(enabled);
    js_speak.fn_updateSettings();
    if (enabled === true) {
      js_speak.fn_speak(this.props.t('globalSettings:speechEnabled'));
      this.m_volumeRangeRef.current.removeAttribute('disabled');
    } else {
      js_speak.fn_stopSpeaking();
      this.m_volumeRangeRef.current.setAttribute('disabled', 'disabled');
    }
  }

  fn_enableAdvanced(e) {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setAdvancedOptionsEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onAdvancedMode);
  }

  fn_enableTabsDisplay(e) {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setTabsDisplayEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  fn_GCSShowMe(e) {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setGCSShowMe(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  fn_sortUnits(e) {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setUnitSortEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  fn_enableGCS(e) {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_gcs_display = enabled;
    js_localStorage.fn_setGCSDisplayEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  render() {
    const { t } = this.props;
    let v_speech_disabled = 'false';
    if (js_localStorage.fn_getSpeechEnabled() === false) {
      v_speech_disabled = 'true';
    }

    return (
      <fieldset dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="row mb-12 align-items-center">
          <label htmlFor="check_enable_speech" className="col-sm-4 col-form-label al_l">
            {t('globalSettings:enableSpeechLabel')}
          </label>
          <input
            className="form-check-input col-sm-4"
            ref={this.m_enableSpeechRef}
            type="checkbox"
            id="check_enable_speech"
            onClick={(e) => this.fn_enableSpeech(e)}
          />
          <label htmlFor="volume_range" className="col-sm-4 col-form-label al_r">
            {t('globalSettings:volumeLabel')}
          </label>
          <input
            type="range"
            className="form-range col-sm-4 width_fit ps-5"
            id="volume_range"
            ref={this.m_volumeRangeRef}
            disabled={v_speech_disabled}
            onChange={(e) => this.fn_changeVolume(e)}
            onMouseUp={(e) => this.fn_handleMouseUp(e)}
          />
        </div>
        <div className="row mb-12 align-items-center">
          <label htmlFor="check_tabs_display" className="col-sm-4 col-form-label al_l">
            {t('globalSettings:tabsDisplayLabel')}
          </label>
          <input
            className="form-check-input col-sm-4"
            type="checkbox"
            id="check_tabs_display"
            ref={this.m_tabsDisplayeRef}
            onClick={(e) => this.fn_enableTabsDisplay(e)}
          />
          <label
            htmlFor="check_unit_sort"
            className="col-sm-4 col-form-label al_r"
            title={t('globalSettings:sortUnitsTitle')}
          >
            {t('globalSettings:sortUnitsLabel')}
          </label>
          <input
            className="form-check-input col-sm-4"
            type="checkbox"
            id="check_unit_sort"
            ref={this.m_unitSortRef}
            onClick={(e) => this.fn_sortUnits(e)}
          />
        </div>
        <div className="row mb-12 align-items-center">
          <label htmlFor="check_gcs_display" className="col-sm-4 col-form-label al_l">
            {t('globalSettings:gcsDisplayLabel')}
          </label>
          <input
            className="form-check-input col-sm-8"
            type="checkbox"
            id="check_gcs_display"
            ref={this.m_gcsDisplayRef}
            onClick={(e) => this.fn_enableGCS(e)}
          />
          <label
            htmlFor="check_gcs_show_me"
            className="col-sm-4 col-form-label al_r"
            title={t('globalSettings:gcsShowMeTitle')}
          >
            {t('globalSettings:gcsShowMeLabel')}
          </label>
          <input
            className="form-check-input col-sm-4"
            type="checkbox"
            id="check_gcs_show_me"
            ref={this.m_gcsShowMeRef}
            onClick={(e) => this.fn_GCSShowMe(e)}
          />
        </div>
        <div className="row mb-12 align-items-center">
          <label htmlFor="check_advanced" className="col-sm-4 col-form-label al_l">
            {t('globalSettings:advancedOptionsLabel')}
          </label>
          <input
            className="form-check-input col-sm-8"
            type="checkbox"
            id="check_advanced"
            ref={this.m_advancedRef}
            onClick={(e) => this.fn_enableAdvanced(e)}
          />
        </div>
      </fieldset>
    );
  }
}

class ClssGlobalSettings extends React.Component {
  constructor() {
    super();
    this.state = {
      m_update: 0,
    };
    this.key = Math.random().toString();
    this.mission_file_ref = React.createRef();
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Logined, this, this.fn_onAuthStatus);
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
    return false;
  }

  fn_handleFileChange(e) {
    setSelectedMissionFilePathToWrite(this.mission_file_ref.current.files);
  }

  fn_onAuthStatus(me, res) {
    if (me.m_flag_mounted === false) return;
    me.setState({ m_update: me.state.m_update + 1 });
  }

  componentDidMount() {
    this.setState({ m_update: this.state.m_update + 1 });
  }

  componentWillUnmount() {
    this.state.m_update = 0;
    js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Logined, this);
  }

  fn_fireDeEvent(value) {
    js_andruav_facade.AndruavClientFacade.API_FireDeEvent(null, value);
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
              <label htmlFor="btn_filesWP" className="user-select-none text-white mt-2">
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
        <div className="card text-white border-light mb-3 padding_zero">
          <div className="card-header text-center user-select-none">
            <strong>{t('globalSettings:settingsTitle')}</strong>
          </div>
          <div className="card-body">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <a className="nav-link user-select-none" data-bs-toggle="tab" href="#settings_home">
                  {t('globalSettings:defaultsTab')}
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={'nav-link user-select-none ' + cls_ctrl_wp}
                  data-bs-toggle="tab"
                  href="#settings_profile"
                >
                  {t('globalSettings:missionTab')}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link user-select-none" data-bs-toggle="tab" href="#settings_preference">
                  {t('globalSettings:preferencesTab')}
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
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation(['','globalSettings'])(ClssGlobalSettings);