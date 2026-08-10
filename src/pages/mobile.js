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
import { CONST_METER_TO_FEET } from '../js/js_helpers.js';
import { js_eventEmitter } from '../js/js_eventEmitter';
import { EVENTS as js_event } from '../js/js_eventList.js';
import { CONST_VIDEOSTREAMING_ON } from '../js/js_andruavUnit.js';
import { hlp_getFlightMode, fn_gotoUnit_byPartyID, fn_on_ready, fn_do_modal_confirmation, fn_showMap, fn_VIDEO_login, toggleVideo } from '../js/js_main';
import { fn_getMobileActions, fn_startVideo, fn_stopVideo } from '../js/js_mobile_commands.js';

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
import ClssMobileTelemetryPanel from '../components/gadgets/jsc_mobile_telemetry_panel.jsx';
import { js_andruavAuth } from '../js/protocol/auth/js_andruav_auth';


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
  const [videoTrackPicker, setVideoTrackPicker] = useState(null); // { session, tracks } | null
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
    const units = js_globals.m_andruavUnitList
      ? js_globals.m_andruavUnitList.fn_getUnitValues()
      : null;
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
      fn_startVideo(selectedUnit, (session, tracks) => setVideoTrackPicker({ session, tracks }));
    }
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

  const handleSelectVideoTrack = (track) => {
    if (videoTrackPicker) {
      fn_VIDEO_login(videoTrackPicker.session, track.id);
    }
    setVideoTrackPicker(null);
  };

  const runAction = (action) => {
    if (!selectedUnit || !action.enabled) return;
    fn_do_modal_confirmation(
      action.confirmTitle,
      action.confirmMessage,
      (approved) => {
        if (approved) action.run(selectedUnit);
      },
      'CONFIRM',
      'bg-danger txt-theme-aware',
      'Cancel'
    );
  };

  // Telemetry helpers
  const getBatteryPct = (unit) => {
    if (!unit) return null;
    const batt = unit.m_Power._FCB.p_Battery;
    if (batt.p_hasPowerInfo) {
      return batt.FCB_BatteryRemaining;
    }
    const mobileBatt = unit.m_Power._Mobile.p_Battery;
    if (mobileBatt.p_hasPowerInfo && mobileBatt.BatteryLevel != null) {
      return mobileBatt.BatteryLevel;
    }
    return null;
  };

  const getGPSInfo = (unit) => {
    if (!unit) return { fix: 'No GPS', sats: 0, valid: false };
    const gps = unit.m_GPS_Info1;
    if (!gps.m_isValid) return { fix: 'No GPS', sats: 0, valid: false };
    const fixTexts = { 0: 'No Fix', 1: 'No Fix', 2: '2D', 3: '3D', 4: 'DGPS', 5: 'RTK-F', 6: 'RTK-F', 7: 'Static', 8: 'PPP' };
    return {
      fix: fixTexts[gps.GPS3DFix] || 'No Fix',
      sats: gps.m_satCount || 0,
      valid: true,
    };
  };

  const getAltitude = (unit) => {
    if (!unit || unit.m_Nav_Info.p_Location.alt_relative == null) return null;
    const alt = unit.m_Nav_Info.p_Location.alt_relative;
    if (isMetricSystem) return { value: alt.toFixed(0), unit: 'm' };
    return { value: (alt * CONST_METER_TO_FEET).toFixed(0), unit: 'ft' };
  };

  const getSpeed = (unit) => {
    if (!unit || unit.m_Nav_Info.p_Location.ground_speed == null) return null;
    const spd = unit.m_Nav_Info.p_Location.ground_speed;
    if (isMetricSystem) return { value: spd.toFixed(0), unit: 'm/s' };
    return { value: (spd * CONST_METER_TO_FEET).toFixed(0), unit: 'ft/s' };
  };

  const getSignalInfo = (unit) => {
    if (!unit) return { text: 'N/A', level: 0 };
    const sig = unit.m_SignalStatus;
    if (sig.m_mobile) {
      const networkTypes = ['NA', '2G', '2.5G', '2.75G', '3G', '3.5G', '3.75G', '3.9G', '4G'];
      const netType = networkTypes[sig.m_mobileNetworkTypeRank] || 'Unknown';
      const bars = sig.m_mobileSignalLevel || 0;
      const barStr = '▮'.repeat(Math.min(bars, 4)) + '▯'.repeat(Math.max(0, 4 - bars));
      return { text: `${netType} ${barStr}`, level: bars };
    }
    if (sig.m_wifi) return { text: 'WiFi', level: 3 };
    if (sig.m_websocket) return { text: 'WS', level: 2 };
    return { text: 'N/A', level: 0 };
  };

  const getWaypointInfo = (unit) => {
    if (!unit) return { current: 0, count: 0 };
    const target = unit.m_Nav_Info._Target;
    return { current: target.wp_num || 0, count: target.wp_count || 0 };
  };

  const getFlightModeText = (unit) => {
    if (!unit) return 'N/A';
    if (unit.m_telemetry_protocol === 0) return 'NC';
    return hlp_getFlightMode(unit);
  };

  const isUnitOnline = (unit) => {
    return unit && unit.m_IsDisconnectedFromGCS !== true && unit.m_IsShutdown !== true;
  };

  const batteryPct = getBatteryPct(selectedUnit);
  const gpsInfo = getGPSInfo(selectedUnit);
  const altitude = getAltitude(selectedUnit);
  const speed = getSpeed(selectedUnit);
  const signalInfo = getSignalInfo(selectedUnit);
  const wpInfo = getWaypointInfo(selectedUnit);
  const flightModeText = getFlightModeText(selectedUnit);
  const drones = getDroneUnits();
  const mobileActions = selectedUnit ? fn_getMobileActions(selectedUnit) : [];
  const isBlocked = selectedUnit && selectedUnit.m_Telemetry.m_isGCSBlocked === true;
  const isTelemetryOn = selectedUnit && selectedUnit.m_Telemetry.m_udpProxy_active === true && selectedUnit.m_Telemetry.m_udpProxy_paused === false;
  const isVideoActive = !!(selectedUnit && selectedUnit.m_Video.fn_getVideoStreaming() === CONST_VIDEOSTREAMING_ON);

  const batteryClass = batteryPct == null ? '' : batteryPct <= 20 ? 'danger' : batteryPct <= 40 ? 'warn' : 'success';
  const gpsClass = !gpsInfo.valid ? 'danger' : gpsInfo.fix === 'No Fix' || gpsInfo.fix === 'No GPS' ? 'danger' : gpsInfo.fix === '2D' ? 'warn' : 'success';

  return (
    <div className="mobile-page">
      {/* Status bar */}
      <div className="mobile-status-bar">
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
              <button
                className={`mobile-telemetry-toggle ${isTelemetryOn ? 'active' : ''}`}
                onClick={() => setShowTelemetrySheet(true)}
                title="Smart Telemetry"
              >
                <i className="bi bi-broadcast" />
              </button>
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
                  className={`mobile-unit-dot ${
                    unit.m_isArmed ? 'armed' : isUnitOnline(unit) ? 'online' : 'offline'
                  }`}
                />
                <span>{unit.m_unitName}</span>
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
          <button className="mobile-view-toggle" onClick={() => setShowControls((s) => !s)} title="Toggle Controls">
            <i className={`bi ${showControls ? 'bi-sliders2' : 'bi-sliders2-vertical'}`} />
          </button>
        </div>

        {/* Video track picker sheet */}
        {videoTrackPicker && (
          <div className="mobile-sheet-backdrop" onClick={() => setVideoTrackPicker(null)}>
            <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-sheet-handle" />
              <div className="mobile-sheet-header">
                <span className="mobile-sheet-title"><i className="bi bi-camera-video" /> Select Camera</span>
                <button className="mobile-sheet-close" onClick={() => setVideoTrackPicker(null)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              {videoTrackPicker.tracks.map((track) => (
                <div
                  key={track.id}
                  className="mobile-sheet-row mobile-sheet-row-clickable"
                  onClick={() => handleSelectVideoTrack(track)}
                >
                  <span className="mobile-sheet-value">{track.ln}</span>
                  <i className="bi bi-chevron-right" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Telemetry grid - hidden when not logged in or controls hidden */}
      {isLoggedIn && showControls && (
      <div className="mobile-telemetry">
        <div className={`mobile-telemetry-item ${batteryClass}`}>
          <span className="mobile-tel-label">Battery</span>
          <span className="mobile-tel-value">
            {batteryPct != null ? `${batteryPct}%` : 'N/A'}
          </span>
        </div>
        <div className={`mobile-telemetry-item ${gpsClass}`}>
          <span className="mobile-tel-label">GPS</span>
          <span className="mobile-tel-value">{gpsInfo.fix}</span>
          <span className="mobile-tel-unit">{gpsInfo.sats > 0 ? `${gpsInfo.sats} sats` : ''}</span>
        </div>
        <div className="mobile-telemetry-item">
          <span className="mobile-tel-label">Signal</span>
          <span className="mobile-tel-value">{signalInfo.text}</span>
        </div>
        <div className="mobile-telemetry-item">
          <span className="mobile-tel-label">Altitude</span>
          <span className="mobile-tel-value">
            {altitude ? altitude.value : 'N/A'}
          </span>
          {altitude && <span className="mobile-tel-unit">{altitude.unit}</span>}
        </div>
        <div className="mobile-telemetry-item">
          <span className="mobile-tel-label">Speed</span>
          <span className="mobile-tel-value">
            {speed ? speed.value : 'N/A'}
          </span>
          {speed && <span className="mobile-tel-unit">{speed.unit}</span>}
        </div>
        <div className="mobile-telemetry-item">
          <span className="mobile-tel-label">Waypoint</span>
          <span className="mobile-tel-value">
            {wpInfo.current > 0 ? `#${wpInfo.current}` : '--'}
          </span>
          {wpInfo.count > 0 && <span className="mobile-tel-unit">/ {wpInfo.count}</span>}
        </div>
      </div>
      )}

      {/* Action buttons or Login panel */}
      {isLoggedIn ? (
        showControls && (
          isBlocked ? (
            <div className="mobile-blocked-banner">
              <i className="bi bi-exclamation-triangle-fill" /> BLOCKED By RC in the Field
            </div>
          ) : (
            <div className="mobile-actions">
              {mobileActions.map((action) => (
                <button
                  key={action.id}
                  className={`mobile-action-btn ${action.style}`}
                  onClick={() => runAction(action)}
                  disabled={!action.enabled}
                >
                  <span className="mobile-btn-icon">
                    <i className={`bi ${action.icon}`} />
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
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
          <ClssFpvDialog />
          <ClssAltitudeDialog />
          <ClssSpeedDialog />
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
