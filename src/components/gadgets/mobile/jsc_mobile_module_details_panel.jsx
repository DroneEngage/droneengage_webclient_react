import React, { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../../js/events/js_eventList.js';
import { useEventSubscription } from '../../../js/hooks/useEventSubscription.js';

/**
 * Compact mobile bottom-sheet that displays module version information for a
 * selected unit. Mirrors the logic of ClssCtrlUnitDetails (desktop details tab)
 * and ClssModuleDetails but rendered in the mobile-sheet pattern used by
 * ClssMobileTelemetryPanel.
 *
 * Each module row is collapsible: tapping a row expands it to reveal version,
 * status, latest-version and help-link details - the same fields shown by
 * ClssModuleDetails in the desktop details tab.
 */
const ClssMobileModuleDetailsPanel = ({ p_unit, p_isOpen, p_onClose }) => {
  const { t } = useTranslation();
  const [, forceUpdate] = useState(0);
  const [expandedModule, setExpandedModule] = useState(null);
  const tickRef = useRef(0);

  const refresh = useCallback(() => {
    tickRef.current++;
    forceUpdate(tickRef.current);
  }, []);

  // Filter EE_unitUpdated by party ID so a telemetry tick from unit A
  // doesn't re-render unit B's module details panel. EE_OldModule is not
  // unit-filtered in the original (it's a global module-list change event),
  // so it stays unfiltered here.
  const refreshIfUnit = useCallback((p_andruavUnit) => {
    if (p_unit && p_andruavUnit && p_andruavUnit.getPartyID
        && p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;
    refresh();
  }, [p_unit, refresh]);

  useEventSubscription(js_event.EE_OldModule, refresh);
  useEventSubscription(js_event.EE_unitUpdated, refreshIfUnit);

  if (!p_isOpen) return null;

  const fn_stop = (e) => e.stopPropagation();

  if (!p_unit) {
    return (
      <div className="mobile-sheet-backdrop" onClick={p_onClose}>
        <div className="mobile-sheet" onClick={fn_stop}>
          <div className="mobile-sheet-handle" />
          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title"><i className="bi bi-pci-card" /> Details</span>
            <button className="mobile-sheet-close" onClick={p_onClose}><i className="bi bi-x-lg" /></button>
          </div>
          <div className="mobile-sheet-empty">No unit selected</div>
        </div>
      </div>
    );
  }

  const v_andruavUnit = p_unit;

  // Build the main module entry (Andruav / DroneEngage core) - same logic as
  // jsc_ctrl_details_tab.jsx so the mobile sheet matches the desktop tab.
  const mainModule = {
    i: (v_andruavUnit.fn_getIsDE() === false) ? 'Andruav' : 'Drone Engage',
    v: v_andruavUnit.fn_getVersion(),
    d: false,
    z: 0,
    k: null,
    c: null,
    version_info: v_andruavUnit.m_module_version_info
  };
  const expected_main_version = mainModule.version_info?.version;
  if (expected_main_version && mainModule.v != null && mainModule.v !== 'unknown') {
    mainModule.z = v_andruavUnit.m_modules.compareVersions(mainModule.v, expected_main_version);
  }

  const subModules = Array.isArray(v_andruavUnit.m_modules.m_list) ? v_andruavUnit.m_modules.m_list : [];
  const modules = [mainModule, ...subModules];

  const fn_toggleExpand = (id) => {
    setExpandedModule(prev => prev === id ? null : id);
  };

  return (
    <div className="mobile-sheet-backdrop" onClick={p_onClose}>
      <div className="mobile-sheet" onClick={fn_stop}>
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-header">
          <span className="mobile-sheet-title"><i className="bi bi-pci-card" /> Details</span>
          <button className="mobile-sheet-close" onClick={p_onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <div className="mobile-sheet-body">
          {modules.length === 0 ? (
            <div className="mobile-sheet-empty">{t('no_modules_connected')}</div>
          ) : (
            modules.map((module, index) => {
              const rowId = `${module.i}_${index}`;
              const isExpanded = expandedModule === rowId;
              const isOffline = module.d === true;
              const needsUpgrade = module.z === -1;
              const statusColor = isOffline ? 'text-danger' : (needsUpgrade ? 'text-warning' : 'text-success');

              // Health data for this module
              // The main module (de_comm core) has no k, so use "comm".
              const healthKey = module.k ? module.k : 'comm';
              const health = v_andruavUnit.m_moduleHealth ? v_andruavUnit.m_moduleHealth[healthKey] : null;
              const healthTrendIcon = health ? (health.trend === 1 ? 'bi-arrow-up text-warning' : health.trend === 2 ? 'bi-arrow-down text-success' : 'bi-arrow-left-right text-muted') : null;
              const healthStatusColor = health ? (health.status === 2 ? 'text-danger' : health.status === 1 ? 'text-warning' : 'text-success') : null;
              const healthStatusText = health ? (health.status === 2 ? t('critical') : health.status === 1 ? t('warning') : t('ok')) : null;

              return (
                <div key={rowId} className="mobile-module-row">
                  <div className="mobile-module-row-header" onClick={() => fn_toggleExpand(rowId)}>
                    <span className={`mobile-module-status-dot ${isOffline ? 'offline' : 'online'}`} />
                    <span className="mobile-module-name">{module.i}</span>
                    <span className={`mobile-module-version ${statusColor}`}>{module.v}</span>
                    {isOffline && <span className="mobile-module-offline-badge">{t('offline')}</span>}
                    {needsUpgrade && !isOffline && <i className="bi bi-exclamation-circle-fill text-warning" title={t('module_needs_upgrade')} />}
                    <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} mobile-module-chevron`} />
                  </div>
                  {isExpanded && (
                    <div className="mobile-module-details">
                      <div className="mobile-module-detail-row">
                        <span className="mobile-sheet-label">{t('version_colon')}</span>
                        <span className={`mobile-sheet-value ${statusColor}`}>{module.v}</span>
                      </div>
                      <div className="mobile-module-detail-row">
                        <span className="mobile-sheet-label">{t('status_colon')}</span>
                        <span className={`mobile-sheet-value ${isOffline ? 'text-danger' : 'text-success'}`}>
                          {isOffline ? t('offline') : t('connected')}
                        </span>
                      </div>
                      <div className="mobile-module-detail-row">
                        <span className="mobile-sheet-label">{t('latest_version_colon')}</span>
                        <span className={`mobile-sheet-value ${needsUpgrade ? 'text-danger bold' : 'text-success'}`}>
                          {module.version_info ? module.version_info.version : 'unknown-version'}
                        </span>
                      </div>
                      {module.version_info && module.version_info.url && (
                        <div className="mobile-module-detail-row">
                          <span className="mobile-sheet-label">URL</span>
                          <a href={module.version_info.url} target="_blank" rel="noopener noreferrer" className="mobile-sheet-value text-primary">
                            {module.version_info.url}
                          </a>
                        </div>
                      )}
                      {module.version_info && module.version_info.help && (
                        <div className="mobile-module-detail-row">
                          <span className="mobile-sheet-label">{t('help_colon')}</span>
                          <a href={module.version_info.help} target="_blank" rel="noopener noreferrer" className="mobile-sheet-value text-success">
                            {module.version_info.help}
                          </a>
                        </div>
                      )}
                      {health && (
                        <>
                          <div className="mobile-module-detail-row">
                            <span className="mobile-sheet-label">{t('memory_colon')}</span>
                            <span className={`mobile-sheet-value ${healthStatusColor}`}>
                              {health.rss != null ? `${health.rss.toFixed(1)} MB` : '-'}
                              {healthTrendIcon && <i className={`bi ${healthTrendIcon} ms-1`} />}
                            </span>
                          </div>
                          <div className="mobile-module-detail-row">
                            <span className="mobile-sheet-label">{t('health_colon')}</span>
                            <span className={`mobile-sheet-value ${healthStatusColor}`}>{healthStatusText}</span>
                          </div>
                          <div className="mobile-module-detail-row">
                            <span className="mobile-sheet-label">{t('peak_colon')}</span>
                            <span className="mobile-sheet-value text-muted">{health.vmpeak != null ? `${health.vmpeak.toFixed(1)} MB` : '-'}</span>
                          </div>
                          <div className="mobile-module-detail-row">
                            <span className="mobile-sheet-label">{t('swap_colon')}</span>
                            <span className={`mobile-sheet-value ${health.vmswap > 0 ? 'text-warning' : 'text-muted'}`}>
                              {health.vmswap != null ? `${health.vmswap.toFixed(1)} MB` : '-'}
                            </span>
                          </div>
                          <div className="mobile-module-detail-row">
                            <span className="mobile-sheet-label">{t('threads_colon')}</span>
                            <span className="mobile-sheet-value text-muted">{health.threads ?? '-'}</span>
                          </div>
                          <div className="mobile-module-detail-row">
                            <span className="mobile-sheet-label">{t('uptime_colon')}</span>
                            <span className="mobile-sheet-value text-muted">
                              {health.uptime != null ? `${Math.floor(health.uptime / 60)}m ${health.uptime % 60}s` : '-'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ClssMobileModuleDetailsPanel;
