import React from 'react';
import * as js_preferences from '../../js/state/preferences.js';
import { withTranslation } from 'react-i18next';
import * as js_siteConfig from '../../js/config/js_siteConfig.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { js_eventEmitter } from '../../js/events/js_eventEmitter';
import {EventBridge} from '../../js/hooks/EventBridge.jsx';
import { js_localStorage } from '../../js/state/js_localStorage.js';
import { js_adsbManager } from '../../js/adsb/js_adsbManager.js';
import { CPasswordReveal } from '../micro_gadgets/jsc_mctrl_password_reveal.jsx';

/**
 * ADSB settings tab.
 *
 * Hosts the ADSB enable toggle + scan-radius slider (moved here from
 * ClssPreferences) and the editable OpenSky provider config: PROVIDER,
 * REFRESH_RATE_MS, OPENSKY.CLIENT_ID and OPENSKY.CLIENT_SECRET.
 *
 * Value priority (same pattern as the Map settings tab):
 *   localStorage  >  config.local.json / config.json  >  js_siteConfig defaults
 *
 * `fn_applyRuntimeConfig` already folds localStorage overrides into
 * `CONST_ADSB_CONFIG`, so reading from `js_siteConfig.CONST_ADSB_CONFIG`
 * here reflects the full priority chain. Edits are persisted to
 * localStorage, mirrored onto `CONST_ADSB_CONFIG` in place, and applied
 * live via `js_adsbManager.fn_reloadProvider()` so the next poll uses the
 * new credentials/refresh rate without a page reload.
 */
class ClssAdsbSettings extends React.Component {
  constructor() {
    super();
    this.key = Math.random().toString();
    this.m_enableADSBRef = React.createRef();
    this.m_adsbRadiusRef = React.createRef();
    this.m_providerRef = React.createRef();
    this.m_refreshRateRef = React.createRef();
    this.m_clientIdRef = React.createRef();
    this.m_clientSecretRef = React.createRef();
    this.state = {
      adsbRadiusKm: js_localStorage.fn_getAdsbRadiusKm() ||
        (js_siteConfig.CONST_ADSB_CONFIG && js_siteConfig.CONST_ADSB_CONFIG.RADIUS_KM) || 850,
      isMetric: js_preferences.fn_getUseMetricSystem(),
    };
    this._boundOnUnitSystemChanged = this._onUnitSystemChanged.bind(this);
    this._boundOnPreferenceChanged = this._onPreferenceChanged.bind(this);
  }

  _onUnitSystemChanged() {
    this.setState({ isMetric: js_preferences.fn_getUseMetricSystem() });
  }

  // Re-sync the enable checkbox from localStorage when the ADSB preference
  // changes from outside this tab (e.g. the map toggle button). The checkbox
  // is uncontrolled (ref-based), so without this it stays stale.
  _onPreferenceChanged() {
    if (this.m_enableADSBRef.current) {
      this.m_enableADSBRef.current.checked = js_localStorage.fn_getADSBEnabled();
    }
  }

  componentDidMount() {
    // Event subscriptions are owned by EventBridge siblings rendered
    // below (see render()), which auto-unsubscribe on unmount via
    // useEventSubscription.
    const cfg = js_siteConfig.CONST_ADSB_CONFIG || {};

    if (this.m_enableADSBRef.current) {
      this.m_enableADSBRef.current.checked = js_localStorage.fn_getADSBEnabled();
    }
    if (this.m_adsbRadiusRef.current) {
      const stored = js_localStorage.fn_getAdsbRadiusKm();
      this.m_adsbRadiusRef.current.value = stored !== null ? stored : (cfg.RADIUS_KM) || 850;
    }
    if (this.m_providerRef.current) {
      this.m_providerRef.current.value = (cfg.PROVIDER) || 'opensky';
    }
    if (this.m_refreshRateRef.current) {
      this.m_refreshRateRef.current.value = (cfg.REFRESH_RATE_MS) || 60000;
    }
    if (this.m_clientIdRef.current) {
      this.m_clientIdRef.current.value = (cfg.OPENSKY && cfg.OPENSKY.CLIENT_ID) || '';
    }
    if (this.m_clientSecretRef.current) {
      this.m_clientSecretRef.current.value = (cfg.OPENSKY && cfg.OPENSKY.CLIENT_SECRET) || '';
    }
  }

  componentWillUnmount() {
    // Unsubscription is handled automatically by the EventBridge
    // siblings (useEventSubscription) on unmount.
  }

  fn_enableADSB(e) {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setADSBEnabled(enabled);
    js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
  }

  // Live preview of the slider value (label only) while dragging.
  fn_changeAdsbRadius(e) {
    const km = parseInt(e.currentTarget.value);
    const max = (js_siteConfig.CONST_ADSB_CONFIG && js_siteConfig.CONST_ADSB_CONFIG.RADIUS_KM) || 850;
    if (isNaN(km) || km < 2 || km > max) return;
    this.setState({ adsbRadiusKm: km });
  }

  // On mouse-up / touch-end: persist, reset ADSB, and redraw the circle.
  fn_applyAdsbRadius(e) {
    const km = parseInt(e.currentTarget.value);
    const max = (js_siteConfig.CONST_ADSB_CONFIG && js_siteConfig.CONST_ADSB_CONFIG.RADIUS_KM) || 850;
    if (isNaN(km) || km < 2 || km > max) return;
    js_localStorage.fn_setAdsbRadiusKm(km);
    this.setState({ adsbRadiusKm: km });
    js_adsbManager.fn_setGeolocationRadiusKm(km);
  }

  // Persist a provider config field to localStorage + CONST_ADSB_CONFIG and
  // reload the provider so the change takes effect on the next poll.
  _persistAndReload() {
    const cfg = js_siteConfig.CONST_ADSB_CONFIG;
    if (!cfg) return;
    const provider = this.m_providerRef.current ? this.m_providerRef.current.value.trim() : cfg.PROVIDER;
    const refresh = parseInt(this.m_refreshRateRef.current ? this.m_refreshRateRef.current.value : cfg.REFRESH_RATE_MS);
    const clientId = this.m_clientIdRef.current ? this.m_clientIdRef.current.value.trim() : '';
    const clientSecret = this.m_clientSecretRef.current ? this.m_clientSecretRef.current.value.trim() : '';

    if (provider) {
      js_localStorage.fn_setAdsbProvider(provider);
      cfg.PROVIDER = provider;
    } else {
      js_localStorage.fn_removeAdsbProvider();
    }

    if (!isNaN(refresh) && refresh >= 1000) {
      js_localStorage.fn_setAdsbRefreshRateMs(refresh);
      cfg.REFRESH_RATE_MS = refresh;
    } else {
      js_localStorage.fn_removeAdsbRefreshRateMs();
    }

    cfg.OPENSKY = { ...cfg.OPENSKY };
    if (clientId) {
      js_localStorage.fn_setAdsbOpenSkyClientId(clientId);
      cfg.OPENSKY.CLIENT_ID = clientId;
    } else {
      js_localStorage.fn_removeAdsbOpenSkyClientId();
      cfg.OPENSKY.CLIENT_ID = '';
    }
    if (clientSecret) {
      js_localStorage.fn_setAdsbOpenSkyClientSecret(clientSecret);
      cfg.OPENSKY.CLIENT_SECRET = clientSecret;
    } else {
      js_localStorage.fn_removeAdsbOpenSkyClientSecret();
      cfg.OPENSKY.CLIENT_SECRET = '';
    }

    js_adsbManager.fn_reloadProvider();
  }

  fn_changeProvider() { this._persistAndReload(); }
  fn_changeRefreshRate() { this._persistAndReload(); }
  fn_changeClientId() { this._persistAndReload(); }
  fn_changeClientSecret() { this._persistAndReload(); }

  render() {
    const { t } = this.props;
    const dir = this.props.i18n.language === 'ar' ? 'al_r' : 'al_l';

    // ADSB feature exists only when the site flag CONST_FEATURE.DISABLE_ADSB
    // is not true. The whole tab content is hidden when the feature is disabled.
    const v_adsbFeatureEnabled = !(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_ADSB === true);

    if (!v_adsbFeatureEnabled) return null;

    return (
      <fieldset dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <EventBridge eventName={'EE_UnitSystemChanged'} onEvent={() => this._onUnitSystemChanged()} />
        <EventBridge eventName={js_event.EE_onPreferenceChanged} onEvent={() => this._onPreferenceChanged()} />
        <div className="row mb-12 align-items-center flex-nowrap">
          <label htmlFor="check_enable_adsb" className={`col-sm-4 col-form-label${dir}`}>
            {t('globalSettings:enableADSBLabel')}
          </label>
          <input
            className="form-check-input col-sm-4"
            type="checkbox"
            id="check_enable_adsb"
            ref={this.m_enableADSBRef}
            onClick={(e) => this.fn_enableADSB(e)}
          />
          <input
            type="range"
            className="form-range col ms-2"
            id="range_adsb_radius"
            min="2"
            max={(js_siteConfig.CONST_ADSB_CONFIG && js_siteConfig.CONST_ADSB_CONFIG.RADIUS_KM) || 850}
            step="1"
            ref={this.m_adsbRadiusRef}
            onChange={(e) => this.fn_changeAdsbRadius(e)}
            onMouseUp={(e) => this.fn_applyAdsbRadius(e)}
            onTouchEnd={(e) => this.fn_applyAdsbRadius(e)}
          />
          <label className="col-sm-2 col-form-label al_l">
            {this.state.isMetric
              ? `${this.state.adsbRadiusKm} km`
              : `${(this.state.adsbRadiusKm * 0.621371).toFixed(0)} mi`}
          </label>
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="sel_adsb_provider" className={`col-sm-4 col-form-label ${dir}`}>
            Provider
          </label>
          <select
            className="form-control col-sm-8"
            id="sel_adsb_provider"
            ref={this.m_providerRef}
            onChange={() => this.fn_changeProvider()}
          >
            <option value="opensky">OpenSky</option>
            <option value="aisstream">AISStream</option>
          </select>
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_adsb_refresh_rate" className={`col-sm-4 col-form-label ${dir}`}>
            Refresh Rate (ms)
          </label>
          <input
            type="number"
            className="form-control col-sm-8"
            id="txt_adsb_refresh_rate"
            min="1000"
            step="1000"
            ref={this.m_refreshRateRef}
            onChange={() => this.fn_changeRefreshRate()}
          />
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_adsb_client_id" className={`col-sm-4 col-form-label ${dir}`}>
            OpenSky Client ID
          </label>
          <input
            type="text"
            className="form-control col-sm-8"
            id="txt_adsb_client_id"
            ref={this.m_clientIdRef}
            onChange={() => this.fn_changeClientId()}
          />
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_adsb_client_secret" className={`col-sm-4 col-form-label ${dir}`}>
            OpenSky Client Secret
          </label>
          <CPasswordReveal
            className="col-sm-8"
            id="txt_adsb_client_secret"
            tokenMode
            ref={this.m_clientSecretRef}
            onChange={() => this.fn_changeClientSecret()}
          />
        </div>
      </fieldset>
    );
  }
}

export default withTranslation(['', 'globalSettings'])(ClssAdsbSettings);
