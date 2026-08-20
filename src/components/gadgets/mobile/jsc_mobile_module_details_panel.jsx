import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../../js/js_eventList.js';
import { js_eventEmitter } from '../../../js/js_eventEmitter.js';

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
  const { t } = useTranslation('home');
  const [, forceUpdate] = useState(0);
  const [expandedModule, setExpandedModule] = useState(null);
  const tickRef = useRef(0);
  const listenerObj = useRef({}).current;

  const refresh = useCallback(() => {
    tickRef.current++;
    forceUpdate(tickRef.current);
  }, []);

  useEffect(() => {
    const events = [js_event.EE_OldModule, js_event.EE_unitUpdated];
    events.forEach((evt) => {
      js_eventEmitter.fn_subscribe(evt, listenerObj, refresh);
    });
    return () => {
      events.forEach((evt) => {
        js_eventEmitter.fn_unsubscribe(evt, listenerObj);
      });
    };
  }, [refresh, listenerObj]);

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
