import React from 'react';
import * as js_preferences from '../../js/state/preferences.js';
import { withTranslation } from 'react-i18next';
import * as js_siteConfig from '../../js/config/js_siteConfig.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { js_eventEmitter } from '../../js/events/js_eventEmitter';
import { js_speak } from '../../js/js_speak';
import { js_localStorage } from '../../js/state/js_localStorage.js';
import { js_websocket_bridge } from '../../js/CPC/js_websocket_bridge.js';

class ClssPreferences extends React.Component {
  constructor() {
    super();
    this.key = Math.random().toString();
    js_preferences.fn_setEnableTabsDisplay(js_localStorage.fn_getTabsDisplayEnabled());
    this.m_volumeRangeRef = React.createRef();
    this.m_enableSpeechRef = React.createRef();
    this.m_advancedRef = React.createRef();
    this.m_ws2wsRef = React.createRef();
    this.m_gcsDisplayRef = React.createRef();
    this.m_gcsShowMeRef = React.createRef();
    this.m_enableAISStreamRef = React.createRef();
    this.m_enableWindRef = React.createRef();
  }

  componentDidMount() {
    // Initial values are set via defaultChecked / defaultValue in render
    // so they survive parent re-renders (ClssGlobalSettings calls setState
    // in its own componentDidMount which re-renders this component).
  }

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

  fn_enableWS2WS(e)
  {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setWS2WSEnabled(enabled);
    
    if (enabled === true)
    {
      js_websocket_bridge.fn_init();
    }
    else
    {
      js_websocket_bridge.fn_uninit();
    }
  }

  fn_GCSShowMe(e) {
    const enabled = e.currentTarget.checked;
    js_preferences.fn_setEnableTabsDisplay(enabled);
    js_localStorage.fn_setGCSShowMe(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  fn_enableGCS(e) {
    const enabled = e.currentTarget.checked;
    js_preferences.fn_setEnableGcsDisplay(enabled);
    js_localStorage.fn_setGCSDisplayEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  fn_enableAISStream(e) {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setAISStreamEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  fn_enableWind(e) {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setWindEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  fn_enableSmoothMovement(e) {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setSmoothMovementEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  render() {
    const { t } = this.props;
    const dir = this.props.i18n.language === 'ar' ? 'al_r' : 'al_l';
    let v_speech_disabled = 'false';
    if (js_localStorage.fn_getSpeechEnabled() === false) {
      v_speech_disabled = 'true';
    }

    // AISStream feature exists only when the site flag
    // CONST_FEATURE.DISABLE_AISStream is not true.
    const v_aisStreamFeatureEnabled = !(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_AISStream === true);

    // Wind arrow feature exists only when the site flag
    // CONST_FEATURE.DISABLE_WIND is not true.
    const v_windFeatureEnabled = !(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_WIND === true);

    return (
      <fieldset dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div id='preference_settings' className="row mb-12 align-items-center flex-nowrap">
          <label htmlFor="check_enable_speech" className={`col-sm-4 col-form-label${dir}`}>
            {t('globalSettings:enableSpeechLabel')}
          </label>
          <input
            className="form-check-input col-sm-4"
            ref={this.m_enableSpeechRef}
            type="checkbox"
            id="check_enable_speech"
            defaultChecked={js_localStorage.fn_getSpeechEnabled()}
            onClick={(e) => this.fn_enableSpeech(e)}
          />
          <label htmlFor="volume_range" className="col-sm-4 col-form-label al_c">
            {t('globalSettings:volumeLabel')}
          </label>
          <input
            type="range"
            className="form-range  col"
            id="volume_range"
            ref={this.m_volumeRangeRef}
            defaultValue={js_localStorage.fn_getVolume()}
            disabled={v_speech_disabled === 'true' }
            onChange={(e) => this.fn_changeVolume(e)}
            onMouseUp={(e) => this.fn_handleMouseUp(e)}
          />
        </div>
        <div className="row mb-12 align-items-center">
          <label htmlFor="check_gcs_display" className={`col-sm-4 col-form-label ${dir}`}>
            {t('globalSettings:gcsDisplayLabel')}
          </label>
          <input
            className="form-check-input col-sm-8"
            type="checkbox"
            id="check_gcs_display"
            ref={this.m_gcsDisplayRef}
            defaultChecked={js_localStorage.fn_getGCSDisplayEnabled()}
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
            defaultChecked={js_localStorage.fn_getGCSShowMe()}
            onClick={(e) => this.fn_GCSShowMe(e)}
          />
        </div>
        <div className="row mb-12 align-items-center">
          <label htmlFor="check_advanced" className={`col-sm-4 col-form-label ${dir}`}>
            {t('globalSettings:advancedOptionsLabel')}
          </label>
          <input
            className="form-check-input col-sm-8"
            type="checkbox"
            id="check_advanced"
            ref={this.m_advancedRef}
            defaultChecked={js_localStorage.fn_getAdvancedOptionsEnabled()}
            onClick={(e) => this.fn_enableAdvanced(e)}
          />
          <label htmlFor="check_advanced" className="col-sm-4 col-form-label al_r">
            Mavlink3D
          </label>
          <input
            className="form-check-input col-sm-8"
            type="checkbox"
            id="enable_ws2ws_socket"
            ref={this.m_ws2wsRef}
            defaultChecked={js_localStorage.fn_getWS2WSEnabled()}
            onClick={(e) => this.fn_enableWS2WS(e)}
          />
        </div>
        {v_aisStreamFeatureEnabled && (
          <div className="row mb-12 align-items-center">
            <label htmlFor="check_enable_aisstream" className={`col-sm-4 col-form-label ${dir}`}>
              {t('globalSettings:enableAISStreamLabel')}
            </label>
            <input
              className="form-check-input col-sm-8"
              type="checkbox"
              id="check_enable_aisstream"
              ref={this.m_enableAISStreamRef}
              defaultChecked={js_localStorage.fn_getAISStreamEnabled()}
              onClick={(e) => this.fn_enableAISStream(e)}
            />
          </div>
        )}
        {v_windFeatureEnabled && (
          <div className="row mb-12 align-items-center">
            <label htmlFor="check_enable_wind" className={`col-sm-4 col-form-label ${dir}`}>
              {t('globalSettings:enableWindLabel')}
            </label>
            <input
              className="form-check-input col-sm-8"
              type="checkbox"
              id="check_enable_wind"
              ref={this.m_enableWindRef}
              defaultChecked={js_localStorage.fn_getWindEnabled()}
              onClick={(e) => this.fn_enableWind(e)}
            />
          </div>
        )}
        <div className="row mb-12 align-items-center">
          <label htmlFor="check_enable_smooth_movement" className={`col-sm-4 col-form-label ${dir}`}>
            {t('globalSettings:enableSmoothMovementLabel')}
          </label>
          <input
            className="form-check-input col-sm-8"
            type="checkbox"
            id="check_enable_smooth_movement"
            defaultChecked={js_localStorage.fn_getSmoothMovementEnabled()}
            onClick={(e) => this.fn_enableSmoothMovement(e)}
          />
        </div>
      </fieldset>
    );
  }
}

export default withTranslation(['', 'globalSettings'])(ClssPreferences);
