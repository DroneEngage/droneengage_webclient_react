import React from 'react';
import * as js_preferences from '../../js/state/preferences.js';
import { withTranslation } from 'react-i18next';
import * as js_siteConfig from '../../js/js_siteConfig.js';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import {EventBridge} from '../../js/hooks/EventBridge.jsx';
import { gui_toggleUnits } from '../../js/js_main';
import { js_localStorage } from '../../js/state/js_localStorage.js';

class ClssDefault extends React.Component {
  constructor() {
    super();
    this.state = {
      m_unitText: 'm',
      CONST_DEFAULT_ALTITUDE: js_preferences.fn_getDefaultAltitude(),
      CONST_DEFAULT_RADIUS: js_preferences.fn_getDefaultRadius(),
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

    // Event subscriptions are owned by EventBridge siblings rendered
    // below (see render()), which auto-unsubscribe on unmount via
    // useEventSubscription.
  }

  componentDidMount() {
    this.m_flag_mounted = true;
  }

  componentWillUnmount() {
    // Unsubscription is handled automatically by the EventBridge
    // siblings (useEventSubscription) on unmount.
  }

  fn_advancedMode() {
    if (this.m_flag_mounted === false) return;
    this.setState({ m_update: this.state.m_update + 1 });
  }

  onChange(e) {
    const altitudeValue = parseInt(this.altitudeInputRef.current.value);
    const radiusValue = parseInt(this.radiusInputRef.current.value);

    js_preferences.fn_setDefaultAltitude(altitudeValue);
    js_preferences.fn_setDefaultRadius(radiusValue);

    if (js_preferences.fn_getDefaultAltitude() < js_preferences.fn_getDefaultAltitudeMin())
      js_preferences.fn_setDefaultAltitude(parseInt(js_preferences.fn_getDefaultAltitudeMin()));
    if (js_preferences.fn_getDefaultRadius() < js_preferences.fn_getDefaultRadiusMin())
      js_preferences.fn_setDefaultRadius(parseInt(js_preferences.fn_getDefaultRadiusMin()));

    js_localStorage.fn_setDefaultAltitude(js_preferences.fn_getDefaultAltitude());
    js_localStorage.fn_setDefaultRadius(js_preferences.fn_getDefaultRadius());

    this.setState({ CONST_DEFAULT_ALTITUDE: js_preferences.fn_getDefaultAltitude() });
    this.setState({ CONST_DEFAULT_RADIUS: js_preferences.fn_getDefaultRadius() });
  }

  onChangeSwarm(e) {
    const swarm_horizontal_value = parseInt(this.horizontal_distance.current.value);
    const swarm_vertical_value = parseInt(this.vertical_distance.current.value);

    js_preferences.fn_setDefaultSwarmHorizontalDistance(swarm_horizontal_value);
    js_preferences.fn_setDefaultSwarmVerticalDistance(swarm_vertical_value);

    if (js_preferences.fn_getDefaultSwarmHorizontalDistance() < js_preferences.fn_getDefaultSwarmHorizontalDistanceMin())
      js_preferences.fn_setDefaultSwarmHorizontalDistance(parseInt(js_preferences.fn_getDefaultSwarmHorizontalDistanceMin()));
    if (js_preferences.fn_getDefaultSwarmVerticalDistance() < js_preferences.fn_getDefaultSwarmVerticalDistanceMin())
      js_preferences.fn_setDefaultSwarmVerticalDistance(parseInt(js_preferences.fn_getDefaultSwarmVerticalDistanceMin()));

    js_localStorage.fn_setDefaultSwarmHorizontalDistance(js_preferences.fn_getDefaultSwarmHorizontalDistance());
    js_localStorage.fn_setDefaultSwarmVerticalDistance(js_preferences.fn_getDefaultSwarmVerticalDistance());

    this.setState({ CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE: js_preferences.fn_getDefaultSwarmHorizontalDistance() });
    this.setState({ CONST_DEFAULT_SWARM_VERTICAL_DISTANCE: js_preferences.fn_getDefaultSwarmVerticalDistance() });
  }

  clickToggleUnit(e) {
    gui_toggleUnits();
    if (js_localStorage.fn_getMetricSystem() === true) {
      this.setState({ m_unitText: 'm' });
    } else {
      this.setState({ m_unitText: 'ft' });
    }

    this.setState({ CONST_DEFAULT_ALTITUDE: js_preferences.fn_getDefaultAltitude() });
    this.setState({ CONST_DEFAULT_RADIUS: js_preferences.fn_getDefaultRadius() });
    this.setState({ CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE: js_preferences.fn_getDefaultSwarmHorizontalDistance() });
    this.setState({ CONST_DEFAULT_SWARM_VERTICAL_DISTANCE: js_preferences.fn_getDefaultSwarmVerticalDistance() });
  }

  render() {
    const { t } = this.props;
    let v_gadgets = [];
    v_gadgets.push(
      <EventBridge key={this.key + 'eb'} eventName={js_event.EE_onAdvancedMode} onEvent={() => this.fn_advancedMode()} />
    );
    v_gadgets.push(
      <div key={this.key + '1'} className="row me-0 ms-0" dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="col-xs-6 col-sm-6 col-lg-6">
          <div className="form-inline">
            <div className="form-group">
              <div title={t('globalSettings:altitudeTitle')}>
                <label htmlFor="txt_defaultAltitude" className="user-select-none txt-theme-aware txt_label_width">
                  <small>{t('globalSettings:altitudeLabel')}</small>
                </label>
                <input
                  id="txt_defaultAltitude"
                  type="number"
                  min={parseInt(js_preferences.fn_getDefaultAltitudeMin())}
                  className="form-control input-xs input-sm ms-2"
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
                <label htmlFor="txt_defaultCircle" className="user-select-none txt-theme-aware txt_label_width">
                  <small>{t('globalSettings:radiusLabel')}</small>
                </label>
                <input
                  id="txt_defaultCircle"
                  type="number"
                  min={parseInt(js_preferences.fn_getDefaultRadiusMin())}
                  className="form-control input-xs input-sm ms-2"
                  onChange={(e) => this.onChange(e)}
                  value={this.state.CONST_DEFAULT_RADIUS}
                  ref={this.radiusInputRef}
                />
                <button
                  id="btn_defaultCircle"
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

    if (js_siteConfig.CONST_FEATURE.DISABLE_SWARM === false && js_localStorage.fn_getAdvancedOptionsEnabled() === true) {
      v_gadgets.push(
        <div key={this.key + 's1'} className="row border-top pt-1 border-secondary border-bottom me-0 ms-0">
          <div className="col-xs-6 col-sm-6 col-lg-6">
            <div className="form-inline">
              <div className="form-group">
                <div title={t('globalSettings:swarmHorizontalTitle')}>
                  <label htmlFor="txt_defaultSwarmDistance" className="user-select-none txt-theme-aware txt_label_width">
                    <small>{t('globalSettings:swarmHorizontalLabel')}</small>
                  </label>
                  <input
                    id="txt_defaultSwarmDistance"
                    type="number"
                    min={parseInt(js_preferences.fn_getDefaultSwarmHorizontalDistanceMin())}
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
                  <label htmlFor="txt_defaultSwarmAltDelta" className="user-select-none txt-theme-aware txt_label_width">
                    <small>{t('globalSettings:swarmVerticalLabel')}</small>
                  </label>
                  <input
                    id="txt_defaultSwarmAltDelta"
                    type="number"
                    min={parseInt(js_preferences.fn_getDefaultSwarmVerticalDistanceMin())}
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

export default withTranslation(['', 'globalSettings'])(ClssDefault);
