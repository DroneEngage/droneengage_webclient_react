import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter';
import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth';

const TELEMETRY_LEVEL_LABEL = ['OFF', '1', '2', '3'];

const ClssMobileTelemetryPanel = ({ p_unit, p_isOpen, p_onClose }) => {
  const { t } = useTranslation('udpProxyTelemetry');
  const [, forceUpdate] = useState(0);
  const [copiedField, setCopiedField] = useState(null);
  const tickRef = useRef(0);
  const listenerObj = useRef({}).current;

  const refresh = useCallback(() => {
    tickRef.current++;
    forceUpdate(tickRef.current);
  }, []);

  useEffect(() => {
    const handleProxyInfo = (listener, p_andruavUnit) => {
      if (!p_unit || !p_andruavUnit || p_andruavUnit.getPartyID() !== p_unit.getPartyID()) return;
      refresh();
    };
    js_eventEmitter.fn_subscribe(js_event.EE_onProxyInfoUpdated, listenerObj, handleProxyInfo);
    return () => {
      js_eventEmitter.fn_unsubscribe(js_event.EE_onProxyInfoUpdated, listenerObj);
    };
  }, [p_unit, refresh, listenerObj]);

  useEffect(() => {
    if (p_isOpen && p_unit && js_globals.v_andruavFacade) {
      js_globals.v_andruavFacade.API_requestUdpProxyStatus(p_unit);
    }
  }, [p_isOpen, p_unit]);

  if (!p_isOpen) return null;

  const fn_stop = (e) => e.stopPropagation();

  if (!p_unit || !js_andruavAuth.fn_do_canControl()) {
    return (
      <div className="mobile-sheet-backdrop" onClick={p_onClose}>
        <div className="mobile-sheet" onClick={fn_stop}>
          <div className="mobile-sheet-handle" />
          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title"><i className="bi bi-broadcast" /> {t('smartTelemetry')}</span>
            <button className="mobile-sheet-close" onClick={p_onClose}><i className="bi bi-x-lg" /></button>
          </div>
          <div className="mobile-sheet-empty">No unit selected or no permission</div>
        </div>
      </div>
    );
  }

  const telemetry = p_unit.m_Telemetry;
  const isActive = telemetry.m_udpProxy_active === true;
  const isPaused = telemetry.m_udpProxy_paused === true;

  const fn_requestStatus = () => {
    js_globals.v_andruavFacade.API_requestUdpProxyStatus(p_unit);
  };

  const fn_toggleOnOff = () => {
    if (isPaused) {
      js_globals.v_andruavFacade.API_resumeTelemetry(p_unit);
    } else {
      js_globals.v_andruavFacade.API_pauseTelemetry(p_unit);
    }
    fn_requestStatus();
  };

  const fn_changeLevel = (step) => {
    let next = telemetry.m_telemetry_level + step;
    if (next < 0) next = 0;
    if (next > 3) next = 3;
    js_globals.v_andruavFacade.API_adjustTelemetryDataRate(p_unit, next);
    telemetry.m_telemetry_level = next;
    fn_requestStatus();
  };

  const fn_copy = (text, field) => {
    if (text === null || text === undefined || text === '') return;
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1500);
    }, () => {});
  };

  return (
    <div className="mobile-sheet-backdrop" onClick={p_onClose}>
      <div className="mobile-sheet" onClick={fn_stop}>
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-header">
          <span className="mobile-sheet-title"><i className="bi bi-broadcast" /> {t('smartTelemetry')}</span>
          <button className="mobile-sheet-close" onClick={p_onClose}><i className="bi bi-x-lg" /></button>
        </div>

        {!isActive ? (
          <button className="mobile-sheet-btn primary full" onClick={fn_requestStatus}>
            {t('udpRefresh')}
          </button>
        ) : (
          <>
            <button
              className={`mobile-sheet-btn full ${isPaused ? 'success' : 'warning'}`}
              onClick={fn_toggleOnOff}
              title={isPaused ? t('activateTitle') : t('pauseTitle')}
            >
              <i className="bi bi-power" /> {isPaused ? 'OFF — Tap to Enable' : 'ON — Tap to Disable'}
            </button>

            <div className="mobile-sheet-row">
              <span className="mobile-sheet-label">{t('ip')}</span>
              <span className="mobile-sheet-value">{telemetry.m_udpProxy_ip}</span>
              <button className="mobile-sheet-copy" onClick={() => fn_copy(telemetry.m_udpProxy_ip, 'ip')}>
                <i className={`bi ${copiedField === 'ip' ? 'bi-check-lg' : 'bi-clipboard'}`} />
              </button>
            </div>
            <div className="mobile-sheet-row">
              <span className="mobile-sheet-label">{t('port')}</span>
              <span className="mobile-sheet-value">{telemetry.m_udpProxy_port}</span>
              <button className="mobile-sheet-copy" onClick={() => fn_copy(telemetry.m_udpProxy_port, 'port')}>
                <i className={`bi ${copiedField === 'port' ? 'bi-check-lg' : 'bi-clipboard'}`} />
              </button>
            </div>

            <div className="mobile-sheet-row">
              <span className="mobile-sheet-label">Rate</span>
              <div className="mobile-sheet-stepper">
                <button onClick={() => fn_changeLevel(-1)} title={t('decreaseTitle')}>
                  <i className="bi bi-dash-lg" />
                </button>
                <span>{t('levelLabel', { level: TELEMETRY_LEVEL_LABEL[telemetry.m_telemetry_level] })}</span>
                <button onClick={() => fn_changeLevel(1)} title={t('increaseTitle')}>
                  <i className="bi bi-plus-lg" />
                </button>
              </div>
            </div>

            <button className="mobile-sheet-btn secondary full" onClick={fn_requestStatus} title={t('refreshTitle')}>
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClssMobileTelemetryPanel;
