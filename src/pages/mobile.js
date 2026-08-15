import '../css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '../css/bootstrap-icons/font/bootstrap-icons.css';
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_header_responsive.css';
import '../css/css_gamepad.css';
import '../css/css_mobile.css';

import 'jquery-ui-dist/jquery-ui.min.js';
import 'jquery-knob/dist/jquery.knob.min.js';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation, withTranslation } from 'react-i18next';

import { js_globals } from '../js/js_globals.js';
import * as js_siteConfig from '../js/js_siteConfig.js';
import { js_eventEmitter } from '../js/js_eventEmitter';
import { EVENTS as js_event } from '../js/js_eventList.js';
import { CONST_VIDEOSTREAMING_ON } from '../js/js_andruavUnit.js';
import { hlp_getFlightMode, fn_gotoUnit_byPartyID, fn_on_ready, fn_showMap, toggleVideo } from '../js/js_main';
import { fn_stopVideo } from '../js/mobile/js_mobile_commands.js';
import { ClssCtrlMobileFlightControl } from '../components/flight_controllers/jsc_ctrl_mobile_flightControl.jsx';

import ClssConfirmationDialog from '../components/dialogs/jsc_confirmationDialog.jsx';
import ClssAlertDialog from '../components/dialogs/jsc_alertDialog.jsx';
import { ClssCVideoControl } from '../components/video/jsc_videoDisplayComponent.jsx';
import ClssAndruavUnitListArray from '../components/unit_controls/jsc_unitControlArrayView.jsx';
import ClssFpvDialog from '../components/dialogs/jsc_fpvDialog.jsx';
import ClssAltitudeDialog from '../components/dialogs/jsc_altitudeDialog.jsx';
import ClssSpeedDialog from '../components/dialogs/jsc_speedDialog.jsx';
import ClssUnitInfoDialog from '../components/dialogs/jsc_unitInfoDialog.jsx';
import ClssMissionLoadDialog from '../components/dialogs/jsc_missionLoadDialog.jsx';
import ClssCameraDialog from '../components/dialogs/jsc_cameraDialogControl.jsx';
import ClssStreamDialog from '../components/dialogs/jsc_streamDialogControl.jsx';
import ClssYawDialog from '../components/dialogs/jsc_yawDialogControl.jsx';
import ClssLidarInfoDialog from '../components/dialogs/jsc_lidarInfoDialogControl.jsx';
import ClssServoControl from '../components/dialogs/jsc_servoDialogControl.jsx';
import ClssUnitParametersList from '../components/dialogs/jsc_unitParametersList.jsx';
import ClssViewLinkGimbal from '../components/dialogs/jsc_viewLinkGimbalControl.jsx';
import ClssModuleDetails from '../components/gadgets/jsc_ctrl_unit_module_details.jsx';
import ClssGamePadControl from '../components/gamepad/jsc_gamepadControl.jsx';
import ClssConfigGenerator from '../components/jsc_config_generator.jsx';
import ClssGCSChat from '../components/jsc_gcs_chat.jsx';
import MobileLoginPanel from '../components/jsc_mobileLogin.jsx';
import ClssMobileTelemetryPanel from '../components/gadgets/mobile/jsc_mobile_telemetry_panel.jsx';
import ClssMobileModuleDetailsPanel from '../components/gadgets/mobile/jsc_mobile_module_details_panel.jsx';
import ClssMobileTelemetryGrid from '../components/gadgets/mobile/jsc_mobile_telemetry_grid.jsx';
import { js_andruavAuth } from '../js/protocol/auth/js_andruav_auth';
import { js_speak } from '../js/js_speak.js';
import { js_localStorage } from '../js/js_localStorage';


const Mobile = () => {
  useTranslation('home');
  const [, forceUpdate] = useState(0);
  const [isMetricSystem, setIsMetricSystem] = useState(js_globals.v_useMetricSystem);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'video'
  const [showUnitList, setShowUnitList] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(js_andruavAuth.fn_logined() === true);
  const [showControls, setShowControls] = useState(true);
  const [showTelemetrySheet, setShowTelemetrySheet] = useState(false);
  const [showModuleDetailsSheet, setShowModuleDetailsSheet] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(js_localStorage.fn_getSpeechEnabled() === true);
  const tickRef = useRef(0);
  const unitSystemListenerRef = useRef({});

  const refresh = useCallback(() => {
    tickRef.current++;
    forceUpdate(tickRef.current);
  }, []);

  useEffect(() => {
    js_globals.CONST_MAP_EDITOR = false;
    fn_on_ready();

    document.body.classList.add('mobile-mode');
    return () => {
      document.body.classList.remove('mobile-mode');
    };
  }, []);

  // Mobile autoplay is now handled inside ClssCVideoScreen via its p_compact prop:
  // muted + playsInline on the <video> element and an explicit play() call in fn_lnkVideo()
  // after srcObject is assigned - no external MutationObserver needed.

  useEffect(() => {
    const handleUnitSystemChange = (listener, data) => {
      setIsMetricSystem(data.isMetric);
    };

    const unitSystemListener = unitSystemListenerRef.current;
    js_eventEmitter.fn_subscribe('EE_UnitSystemChanged', unitSystemListener, handleUnitSystemChange);

    const events = [
      js_event.EE_unitAdded,
      js_event.EE_unitUpdated,
      js_event.EE_unitNavUpdated,
      js_event.EE_unitPowUpdated,
      js_event.EE_msgFromUnit_GPS,
      js_event.EE_andruavUnitFlyingUpdated,
      js_event.EE_andruavUnitFightModeUpdated,
      js_event.EE_andruavUnitArmedUpdated,
      js_event.EE_andruavUnitVehicleTypeUpdated,
      js_event.EE_unitOnlineChanged,
      js_event.EE_onSocketStatus,
      js_event.EE_videoStreamStarted,
      js_event.EE_videoStreamStopped,
      js_event.EE_OldModule,
    ];

    const listenerObj = {};
    events.forEach((evt) => {
      js_eventEmitter.fn_subscribe(evt, listenerObj, refresh);
    });

    // Track login state changes
    const authObj = {};
    const handleAuthLogined = () => setIsLoggedIn(true);
    const handleAuthBadLogined = () => setIsLoggedIn(false);
    const handleSocketStatus = (listener, params) => {
      if (params && params.status === 'registered') setIsLoggedIn(true);
      // Do NOT set isLoggedIn=false on other statuses —
      // that would hide action buttons during connection transitions.
      // Logout/bad-login events handle the false case.
    };
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Logined, authObj, handleAuthLogined);
    js_eventEmitter.fn_subscribe(js_event.EE_Auth_BAD_Logined, authObj, handleAuthBadLogined);
    js_eventEmitter.fn_subscribe(js_event.EE_onSocketStatus, authObj, handleSocketStatus);

    setIsMetricSystem(js_globals.v_useMetricSystem);

    return () => {
      js_eventEmitter.fn_unsubscribe('EE_UnitSystemChanged', unitSystemListener);
      events.forEach((evt) => {
        js_eventEmitter.fn_unsubscribe(evt, listenerObj);
      });
      js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_Logined, authObj);
      js_eventEmitter.fn_unsubscribe(js_event.EE_Auth_BAD_Logined, authObj);
      js_eventEmitter.fn_unsubscribe(js_event.EE_onSocketStatus, authObj);
    };
  }, [refresh]);

  const getDroneUnits = () => {
    // Use fn_getUnitsSorted() — same method ClssAndruavUnitList uses in home.js.
    // Unlike fn_getUnitValues(), it does not guard on js_globals.v_andruavClient,
    // which can be unset during reconnection/session-restore and cause the mobile
    // status bar to show "No Unit" even when units exist in the global list.
    if (!js_globals.m_andruavUnitList) return [];
    const units = js_globals.m_andruavUnitList.fn_getUnitsSorted();
    if (!units) return [];
    return units.filter((u) => u && u.m_defined === true && u.m_IsGCS === false);
  };

  const getSelectedUnit = () => {
    const drones = getDroneUnits();
    if (drones.length === 0) return null;
    if (selectedPartyId) {
      const found = drones.find((u) => u.getPartyID() === selectedPartyId);
      if (found) return found;
    }
    return drones[0];
  };

  const selectedUnit = getSelectedUnit();

  const handleSelectUnit = (partyId) => {
    setSelectedPartyId(partyId);
    setShowUnitList(false);
    const unit = js_globals.m_andruavUnitList
      ? js_globals.m_andruavUnitList.fn_getUnit(partyId)
      : null;
    if (unit && js_globals.v_andruavFacade) {
      js_globals.v_andruavFacade.API_requestID(partyId);
      fn_gotoUnit_byPartyID(partyId);
    }
  };

  const retryVideo = () => {
    if (selectedUnit) {
      toggleVideo(selectedUnit);
    }
  };

  const openCameraDialog = () => {
    if (!selectedUnit) return;
    js_globals.v_andruavFacade.API_requestCameraList(selectedUnit, (p_session) => {
      if (p_session && p_session.status === 'connected') {
        js_eventEmitter.fn_dispatch(js_event.EE_displayCameraDlgForm, p_session);
      }
    });
  };

  const toggleView = () => {
    if (viewMode === 'map') {
      retryVideo();
      setViewMode('video');
    } else {
      if (selectedUnit) {
        fn_stopVideo(selectedUnit);
      }
      fn_showMap();
      setViewMode('map');
    }
  };


  // Telemetry helpers
  const getFlightModeText = (unit) => {
    if (!unit) return 'N/A';
    if (unit.m_telemetry_protocol === 0) return 'NC';
    return hlp_getFlightMode(unit);
  };

  const isUnitOnline = (unit) => {
    return unit && unit.m_IsDisconnectedFromGCS !== true && unit.m_IsShutdown !== true;
  };

  const getSignalInfo = (unit) => {
    if (!unit) return null;
    const sig = unit.m_SignalStatus;
    if (!sig) return null;
    if (sig.m_mobile) {
      const networkTypes = ['NA', '2G', '2.5G', '2.75G', '3G', '3.5G', '3.75G', '3.9G', '4G'];
      const netType = networkTypes[sig.m_mobileNetworkTypeRank] || 'Unknown';
      const bars = Math.min(sig.m_mobileSignalLevel || 0, 4);
      return { text: netType, icon: `bi-reception-${bars}`, level: bars };
    }
    if (sig.m_wifi) return { text: 'WiFi', icon: 'bi-wifi', level: 3 };
    if (sig.m_websocket) return { text: 'WS', icon: 'bi-broadcast', level: 2 };
    return null;
  };

  const flightModeText = getFlightModeText(selectedUnit);
  const signalInfo = getSignalInfo(selectedUnit);
  const drones = getDroneUnits();
  const isBlocked = selectedUnit && selectedUnit.m_Telemetry.m_isGCSBlocked === true;
  const isTelemetryOn = selectedUnit && selectedUnit.m_Telemetry.m_udpProxy_active === true && selectedUnit.m_Telemetry.m_udpProxy_paused === false;
  const isVideoActive = !!(selectedUnit && selectedUnit.m_Video.fn_getVideoStreaming() === CONST_VIDEOSTREAMING_ON);

  // Module version / connection status - mirrors the logic in
  // ClssAndruavUnitDrone.createTabs() for the desktop details tab icon.
  const had_disconnected_module = !!(selectedUnit
    && Array.isArray(selectedUnit.m_modules.m_list)
    && selectedUnit.m_modules.m_list.some((module) => module && module.d === true));
  const expected_main_version = selectedUnit ? selectedUnit.m_module_version_info?.version : undefined;
  const current_main_version = selectedUnit ? selectedUnit.fn_getVersion() : null;
  let main_module_version_warning = false;
  if (expected_main_version && current_main_version != null && current_main_version !== 'unknown') {
    const main_version_comparison = selectedUnit.m_modules.compareVersions(current_main_version, expected_main_version);
    main_module_version_warning = main_version_comparison < 0;
  }
  const had_version_warning = !!(selectedUnit
    && !js_siteConfig.CONST_FEATURE.DISABLE_VERSION_NOTIFICATION
    && ((selectedUnit.m_modules.m_old_version === true) || main_module_version_warning));
  const moduleIconClass = had_disconnected_module
    ? 'text-danger'
    : (had_version_warning ? 'text-warning' : 'mobile-status-icon-ok');

  return (
    <div className="mobile-page">
      {/* Status bar */}
      <div id='mobile-status-bar' className="mobile-status-bar">
        {isLoggedIn ? (
          <>
            <div className="mobile-unit-name" onClick={() => setShowUnitList(!showUnitList)}>
              <span
                className={`mobile-connection-dot ${
                  selectedUnit && isUnitOnline(selectedUnit) ? 'connected' : 'disconnected'
                }`}
              />
              <span>{selectedUnit ? selectedUnit.m_unitName : 'No Unit'}</span>
              {drones.length > 1 && <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }} />}
            </div>
            <div className="mobile-status-bar-right">
              <i
                className={`bi bi-megaphone mobile-telemetry-toggle${speechEnabled ? ' active' : ''}`}
                title={speechEnabled ? 'Speech Enabled - click to disable' : 'Speech Disabled - click to enable'}
                onClick={() => {
                  const next = !speechEnabled;
                  js_localStorage.fn_setSpeechEnabled(next);
                  js_speak.fn_updateSettings();
                  if (next) {
                    js_speak.fn_speak('speech enabled');
                  } else {
                    if (window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    js_speak.fn_stopSpeaking();
                  }
                  setSpeechEnabled(next);
                }}
              />
              <i
                className={`bi bi-pci-card mobile-module-toggle ${moduleIconClass}`}
                title={
                  had_disconnected_module
                    ? 'Module(s) offline - tap for details'
                    : (had_version_warning ? 'Module version warning - tap for details' : 'Module details')
                }
                onClick={() => setShowModuleDetailsSheet(true)}
              />
              {signalInfo && (
                <span className="mobile-signal-info" title={`Signal: ${signalInfo.text}`}>
                  <i className={`bi ${signalInfo.icon}`} />
                  <span className="mobile-signal-text">{signalInfo.text}</span>
                </span>
              )}
              <div className="mobile-flight-mode">
                {selectedUnit && selectedUnit.m_isArmed === true ? (
                  <span className="text-danger">ARMED</span>
                ) : null}{' '}
                {flightModeText}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mobile-unit-name">
              <span className="mobile-connection-dot disconnected" />
              <span>DroneEngage</span>
            </div>
            <div className="mobile-flight-mode text-warning">Not Connected</div>
          </>
        )}
      </div>

      {/* Unit selector dropdown */}
      {showUnitList && (
        <div className="mobile-unit-list-panel visible">
          {drones.length === 0 ? (
            <div className="mobile-no-units">No online units</div>
          ) : (
            drones.map((unit) => (
              <div
                key={unit.getPartyID()}
                className="mobile-unit-list-item"
                onClick={() => handleSelectUnit(unit.getPartyID())}
              >
                <span
                  className={`mobile-unit-dot ${isUnitOnline(unit) ? 'online' : 'offline'}`}
                />
                <span>{unit.m_unitName}</span>
                {unit.m_isArmed === true ? <span className="mobile-unit-armed">ARMED</span> : null}
              </div>
            ))
          )}
        </div>
      )}

      {/* Map / FPV center */}
      <div className="mobile-center">
        <div className={`mobile-map-container ${viewMode === 'video' ? 'hidden' : ''}`}>
          <div id="mapid" className="fullscreen" />
        </div>
        <div className={`mobile-video-container ${viewMode === 'map' ? 'hidden' : ''}`}>
          <ClssCVideoControl p_compact={true} />
          {viewMode === 'video' && selectedUnit && !isVideoActive && (
            <button className="mobile-video-retry-btn" onClick={() => toggleVideo(selectedUnit)}>
              <i className="bi bi-arrow-repeat" />
              Tap to Start Camera
            </button>
          )}
        </div>

        <div className="mobile-top-toggles">
          <button className="mobile-view-toggle" onClick={toggleView} title="Toggle Map/Video">
            <i className={`bi ${viewMode === 'map' ? 'bi-camera-video' : 'bi-map'}`} />
          </button>
          <button className="mobile-view-toggle" onClick={openCameraDialog} title="Camera" disabled={!selectedUnit}>
            <i className="bi bi-camera" />
          </button>
          <button
            className={`mobile-view-toggle ${isTelemetryOn ? 'active' : ''}`}
            onClick={() => setShowTelemetrySheet(true)}
            title="Smart Telemetry"
            disabled={!selectedUnit}
          >
            <i className="bi bi-broadcast" />
          </button>
          <button className="mobile-view-toggle" onClick={() => setShowControls((s) => !s)} title="Toggle Controls">
            <i className={`bi ${showControls ? 'bi-sliders2' : 'bi-sliders2-vertical'}`} />
          </button>
        </div>

      </div>

      {/* Telemetry grid - hidden when not logged in or controls hidden */}
      <ClssMobileTelemetryGrid
        p_unit={selectedUnit}
        p_isMetricSystem={isMetricSystem}
        p_visible={isLoggedIn && showControls}
      />

      {/* Action buttons or Login panel */}
      {isLoggedIn ? (
        showControls && (
          isBlocked ? (
            <div className="mobile-blocked-banner">
              <i className="bi bi-exclamation-triangle-fill" /> BLOCKED By RC in the Field
            </div>
          ) : (
            <ClssCtrlMobileFlightControl
              v_andruavUnit={selectedUnit}
            />
          )
        )
      ) : (
        <MobileLoginPanel />
      )}

      {/* Smart Telemetry bottom sheet */}
      <ClssMobileTelemetryPanel
        p_unit={selectedUnit}
        p_isOpen={showTelemetrySheet}
        p_onClose={() => setShowTelemetrySheet(false)}
      />

      {/* Module details bottom sheet */}
      <ClssMobileModuleDetailsPanel
        p_unit={selectedUnit}
        p_isOpen={showModuleDetailsSheet}
        p_onClose={() => setShowModuleDetailsSheet(false)}
      />

      {/* Hidden but mounted: essential dialogs and infrastructure */}
      <div style={{ display: 'none' }}>
        <div id="andruav_unit_list_array_fixed" className="css_ontop andruav_unit_list_array">
          <ClssAndruavUnitListArray
            prop_speed={true}
            prop_battery={true}
            prob_ekf={true}
            prob_alt={true}
            prob_ws={false}
            prob_wp={false}
          />
        </div>
        <div id="andruav_unit_list_array_float" className="css_ontop andruav_unit_list_array_float">
          <ClssAndruavUnitListArray
            prop_speed={true}
            prop_battery={true}
            prob_ekf={true}
            prob_alt={true}
            prob_ws={true}
            prob_wp={true}
          />
        </div>
        <div id="gcs_chat_container" className="gcs-chat-container">
          <ClssGCSChat />
        </div>
        <div id="div_cmp_hud" />
        <div className="monitorview" id="message_notification" style={{ display: 'none' }}>
          &nbsp;
        </div>
        <div className="monitorview" id="div_map3d_view" style={{ display: 'none' }}>
          <div id="mapid3d" className="org_border fullscreen" />
        </div>
        {/* fn_on_ready()/initMap() -> fn_setLapout() -> fn_applyControl() assume the desktop
            layout's #row_1/#row_2 exist (fn_activateClassicalView() reads $('#row_2').offset().top).
            Without them jQuery returns an empty selection, .offset() is undefined, and the .top
            access throws - silently caught by initMap()'s try/catch, but that also skips the rest
            of its try block (fn_gps_getLocation(), and fn_applyControl()'s own trailing
            js_leafletmap.fn_invalidateSize()) on every mobile page load. */}
        <div id="row_1" />
        <div id="row_2" />
      </div>

      {/* Dialogs - rendered in a portal to document.body so the draggable
          cards (position: absolute) escape .mobile-page's overflow: hidden
          and are not clipped on mobile screens. */}
      {ReactDOM.createPortal(
        <>
          <ClssConfirmationDialog />
          <ClssAlertDialog />
          <ClssFpvDialog p_compact={true} />
          <ClssAltitudeDialog p_compact={true} />
          <ClssSpeedDialog p_compact={true} />
          <ClssUnitInfoDialog />
          <ClssMissionLoadDialog />
          <ClssCameraDialog p_compact={true} />
          <ClssStreamDialog p_compact={true} />
          <ClssYawDialog />
          <ClssLidarInfoDialog />
          <ClssServoControl />
          <ClssUnitParametersList />
          <ClssViewLinkGimbal />
          <ClssModuleDetails />
          <ClssConfigGenerator />
          <ClssGamePadControl p_index={js_globals.active_gamepad_index} />
        </>,
        document.body
      )}
    </div>
  );
};

export default withTranslation('home')(Mobile);
