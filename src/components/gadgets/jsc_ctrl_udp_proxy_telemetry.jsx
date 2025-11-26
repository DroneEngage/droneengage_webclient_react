import React from 'react';
import { withTranslation } from 'react-i18next';
import { js_globals } from '../../js/js_globals';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter';
import { js_andruavAuth } from '../../js/js_andruav_auth';

class ClssCtrlUDPPoxyTelemetry extends React.Component {
  constructor(props) {
    super(props);
    this.telemetry_level = ["OFF", "1", "2", "3"];
    this.state = {
      m_message: [],
      m_update: 0,
    };

    this.m_flag_mounted = false;

    js_eventEmitter.fn_subscribe(js_event.EE_onProxyInfoUpdated, this, this.fn_onProxyInfoUpdated);
    js_eventEmitter.fn_subscribe(js_event.EE_Language_Changed, this, this.fn_updateLanguage);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const update = this.state.m_update !== nextState.m_update;
    return update;
  }

  componentWillUnmount() {
    js_eventEmitter.fn_unsubscribe(js_event.EE_Language_Changed, this);
    js_eventEmitter.fn_unsubscribe(js_event.EE_onProxyInfoUpdated, this);
  }

  componentDidMount() {
    this.m_flag_mounted = true;
  }

  fn_updateLanguage(p_me) {
    if (p_me.m_flag_mounted === false) return;
    p_me.setState({ m_update: p_me.state.m_update + 1 });
  }

  fn_onProxyInfoUpdated(p_me, p_andruavUnit) {
    try {
      if (p_me.props.p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;
      if (p_me.m_flag_mounted === false) return;
      p_me.setState({ m_update: p_me.state.m_update + 1 });
    } catch (ex) {}
  }

  fn_requestUdpProxyStatus(p_andruavUnit) {
    js_globals.v_andruavFacade.API_requestUdpProxyStatus(p_andruavUnit);
  }

  fn_changeTelemetryOptimizationLevel(p_andruavUnit, step) {
    if (p_andruavUnit == null) return;
    let next_step = p_andruavUnit.m_Telemetry.m_telemetry_level + step;
    if (next_step < 0) next_step = 0;
    if (next_step > 3) next_step = 3;
    js_globals.v_andruavFacade.API_adjustTelemetryDataRate(p_andruavUnit, next_step);
    js_globals.v_andruavFacade.API_requestUdpProxyStatus(p_andruavUnit);
    p_andruavUnit.m_Telemetry.m_telemetry_level = next_step;
  }

  fn_pauseTelemetry(p_andruavUnit) {
    if (p_andruavUnit == null) return;
    js_globals.v_andruavFacade.API_pauseTelemetry(p_andruavUnit);
    js_globals.v_andruavFacade.API_requestUdpProxyStatus(p_andruavUnit);
  }

  fn_startTelemetry(p_andruavUnit) {
    if (p_andruavUnit == null) return;
    js_globals.v_andruavFacade.API_resumeTelemetry(p_andruavUnit);
    js_globals.v_andruavFacade.API_requestUdpProxyStatus(p_andruavUnit);
  }

  renderUdpProxy() {
    const { t } = this.props;
    if (!js_andruavAuth.fn_do_canControl()) {
      return <div></div>;
    }

    let v_udpproxy_text_ip = '';
    let v_udpproxy_text_port = '';
    let v_telemetry_lvl_class = 'text-warning';
    const v_andruavUnit = this.props.p_unit;
    let v_udp_data = [];
    let v_udp_on_off = [];

    if (v_andruavUnit.m_Telemetry.m_udpProxy_active === true) {
      v_udpproxy_text_ip = t('udpProxyTelemetry:ip') + ':' + v_andruavUnit.m_Telemetry.m_udpProxy_ip;
      v_udpproxy_text_port = t('udpProxyTelemetry:port') + ':' + v_andruavUnit.m_Telemetry.m_udpProxy_port;

      if (v_andruavUnit.m_Telemetry.m_udpProxy_paused === false) {
        v_telemetry_lvl_class = 'text-warning';
        v_udp_on_off.push(
          <span
            key={v_andruavUnit.getPartyID() + 'pause'}
            title={t('udpProxyTelemetry:pauseTitle')}
            onClick={(e) => this.fn_pauseTelemetry(v_andruavUnit)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-power"
              viewBox="0 0 16 16"
            >
              <path d="M7.5 1v7h1V1h-1z" />
              <path d="M3 8.812a4.999 4.999 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812z" />
            </svg>
          </span>
        );
      } else {
        v_telemetry_lvl_class = 'text-light';
        v_udp_on_off.push(
          <span
            key={v_andruavUnit.getPartyID() + 'active'}
            title={t('udpProxyTelemetry:activateTitle')}
            onClick={(e) => this.fn_startTelemetry(v_andruavUnit)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-power text-light"
              viewBox="0 0 16 16"
            >
              <path d="M7.5 1v7h1V1h-1z" />
              <path d="M3 8.812a4.999 4.999 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812z" />
            </svg>
          </span>
        );
      }

      v_udp_data.push(
        <div
          key={v_andruavUnit.getPartyID() + 'txt'}
          className={'col-12 padding_zero css_user_select_text ' + v_telemetry_lvl_class}
        >
          <p id="udpproxy_t" className="si-07x css_margin_zero user-select-none">
            {t('udpProxyTelemetry:smartTelemetry')}
          </p>
          <p id="udpproxy_a" className="si-07x css_margin_zero css_user_select_text">
            {v_udpproxy_text_ip}
          </p>
          <p id="udpproxy_p" className="si-07x css_margin_zero css_user_select_text">
            {v_udpproxy_text_port}
          </p>
        </div>
      );
    } else {
      v_telemetry_lvl_class = 'text-light';
      v_udp_data.push(
        <div key={v_andruavUnit.getPartyID() + 'refresh'} className="col-12 padding_zero css_user_select_text">
          <div className="css_margin_zero user-select-none">
            <p
              id="udp_get"
              className="bg-warning cursor_hand rounded-3 textunit_w135 text-center user-select-none text-white"
              title={t('udpProxyTelemetry:refreshTitle')}
              onClick={(e) => this.fn_requestUdpProxyStatus(v_andruavUnit)}
            >
              {t('udpProxyTelemetry:udpRefresh')}
            </p>
          </div>
        </div>
      );
    }

    const rows = (
      <div className="row padding_zero css_user_select_text" dir={this.props.i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className={v_telemetry_lvl_class + ' row al_l css_margin_zero'}>
          <div className="col-12 margin_2px padding_zero css_user_select_text">
            <p className="rounded-3 cursor_hand textunit_w135 mb-0" title={t('udpProxyTelemetry:smartTelemetry')}>
              <span
                title={t('udpProxyTelemetry:decreaseTitle')}
                onClick={(e) => this.fn_changeTelemetryOptimizationLevel(v_andruavUnit, -1)}
              >
                <svg
                  className="bi bi-caret-down-fill"
                  width="1em"
                  height="1em"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                </svg>
              </span>
              <span
                id="telemetry_rate"
                className="user-select-none"
                onClick={(e) => this.fn_requestUdpProxyStatus(v_andruavUnit)}
              >
                <small>
                  <b>
                    &nbsp;
                    {t('udpProxyTelemetry:levelLabel', { level: this.telemetry_level[v_andruavUnit.m_Telemetry.m_telemetry_level] })}
                    &nbsp;
                  </b>
                </small>
              </span>
              <span
                title={t('udpProxyTelemetry:increaseTitle')}
                onClick={(e) => this.fn_changeTelemetryOptimizationLevel(v_andruavUnit, +1)}
              >
                <svg
                  className="bi bi-caret-up-fill"
                  width="1em"
                  height="1em"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z" />
                </svg>
              </span>
              {v_udp_on_off}
            </p>
          </div>
        </div>
        <div className="row al_l css_margin_zero css_user_select_text">{v_udp_data}</div>
      </div>
    );

    return rows;
  }

  render() {
    return this.renderUdpProxy();
  }
}

export default withTranslation('udpProxyTelemetry')(ClssCtrlUDPPoxyTelemetry);