
import React from 'react';
import { CONST_MAP_GOOLE, v_mission_file_extension } from './config/constants.js';
import ReactDOM from "react-dom/client";


import $ from 'jquery';
// eslint-disable-next-line no-unused-vars
import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';


import RecordRTC from 'recordrtc';


import * as js_andruavMessages from './protocol/messages/js_andruavMessages.js'
import * as js_siteConfig from './js_siteConfig'
import * as js_helpers from './js_helpers'
import { js_globals } from './js_globals.js';
import { CONST_MAP_WIND_ARROW_REFRESH_MS } from './config/mapStyle.js';
import { planes_icon, quad_icon, rover_icon, boat_icon, flightPath_colors, swarm_quad_location_icon, swarm_plane_location_icon } from './config/assets.js';
import { EVENTS as js_event } from './events/js_eventList.js'
import { js_speak } from './js_speak'
import * as js_common from './js_common.js'
import * as js_andruavUnit from './js_andruavUnit'
import * as js_andruav_ws from './protocol/server_comm/js_andruav_ws.js'
import * as js_andruav_parser from './protocol/server_comm/js_andruav_parser.js'
import * as js_andruav_facade from './protocol/server_comm/js_andruav_facade.js'
import { ClssAndruavFencePlan } from './js_plan_fence.js'
import { js_andruavAuth } from './protocol/auth/js_andruav_auth'
import { js_leafletmap } from './maps/js_leafletmap.js'
import { js_map3d } from './maps/js_map3d.js'
import { js_eventEmitter } from './events/js_eventEmitter'
import './events/js_eventEmitterConfig' // side-effect: opts telemetry-frequency events into rAF batching
import { js_localStorage } from './js_localStorage'
import { js_webrtcstream } from './js_webrtcthin2.js'
import { js_adsbUnit } from './js_adsbUnit.js'
import { js_adsbManager } from './adsb/js_adsbManager.js'
import { js_windProvider } from './weather/js_windProvider.js'
import { mavlink20 } from './js_mavlink_v2.js'
import { notifyUnitFieldChanged } from './store/unitStore.js'
import { fn_initFacadeSubscriptions } from './core/protocol/runtime.js'
import { js_layout } from './state/layoutStore.js'
import { js_unitUiPrefs } from './state/unitUiPrefs.js'
import { js_unitLayerRegistry } from './services/map/unitLayerRegistry.js'
import { js_geoFenceRegistry } from './services/geo/geoFenceRegistry.js'
import { js_dialogs } from './app/dialogService.js'

import { ClssMainContextMenu } from '../components/popups/jsc_main_context_menu.jsx'
import { ClssWaypointStepContextMenu } from '../components/popups/jsc_waypoint_step_content_menu.jsx'
import ClssMainUnitPopup from '../components/popups/jsc_main_unit_popup.jsx'
// eslint-disable-next-line no-unused-vars
import { js_websocket_bridge } from './CPC/js_websocket_bridge.js'
import i18n from './i18n.js';

var oldAppend = $.fn.append;

$.fn.append = function ($el) {
	let dom = ($el instanceof $) ? $el[0] : $el
	if (dom && dom.tagName === 'SCRIPT') {
		this[0].appendChild(dom)
		return this
	}
	return oldAppend.apply(this, arguments)
}

// ---------------------------------------------------------------------------
// Initialize the runtime's facade event subscriptions (the parser no longer
// imports the facade — its remaining facade calls are event dispatches that
// runtime handles here).
fn_initFacadeSubscriptions();

// ---------------------------------------------------------------------------
// MAVLink FCB field notification (temporary — until #prv_parseUnitMavlinkMessage
// is migrated to core/protocol). The MAVLink path in the old parser mutates
// m_FCBParameters.m_systemID opaquely and dispatches EE_andruavUnitFCBUpdated.
// The reducer's ID ops already notify m_useFCBIMU, m_telemetry_protocol, and
// m_modules.has_fcb via notifyFields, so this subscription only covers the
// MAVLink-only field.
// ---------------------------------------------------------------------------
{
	const mavlinkFcbKey = { __mavlinkFcbBridge: true };
	js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitFCBUpdated, mavlinkFcbKey, (_me, p_unit) => {
		if (!p_unit) return;
		notifyUnitFieldChanged(p_unit.getPartyID(), 'm_FCBParameters.m_systemID');
	});
}

var v_context_busy = false;

var info_unit_context_popup = null;
// eslint-disable-next-line no-unused-vars
var v_lastHighlightedUnit = null;
let selectedMissionFilesToRead = "";
let selectedMissionFilesToWrite = "";

/**
 * Module-level wind-data store, keyed by unit partyID.
 *
 * Unit objects (CAndruavUnit) are frozen / non-extensible, so wind data
 * cannot be attached as `unit.m_windData`. This Map is the mutable side
 * cache that the map-render code writes to and the popup reads from
 * synchronously. Entries are pruned in fn_clearStaleWindArrows below.
 *
 * value shape: { speedMs, directionDeg, gustsMs, level }
 */
const m_windDataByUnitId = new Map();

/**
 * Store wind data for a unit (by partyID). Replaces any previous entry.
 * @param {string} unitId partyID
 * @param {object} wind   { speedMs, directionDeg, gustsMs, level }
 */
export function fn_setWindData(unitId, wind) {
	if (!unitId) return;
	m_windDataByUnitId.set(unitId, wind);
}

/**
 * Synchronous lookup of the latest wind data for a unit.
 * @param {string} unitId partyID
 * @returns {object|null} { speedMs, directionDeg, gustsMs, level } or null
 */
export function fn_getWindData(unitId) {
	if (!unitId) return null;
	return m_windDataByUnitId.get(unitId) || null;
}

/**
 * Remove wind data for one unit (on stale cleanup / removal).
 * @param {string} unitId partyID
 */
export function fn_clearWindData(unitId) {
	if (!unitId) return;
	m_windDataByUnitId.delete(unitId);
}

/**
 * Remove ALL wind data (on feature disable).
 */
export function fn_clearAllWindData() {
	m_windDataByUnitId.clear();
}

/**
 * Updates (or clears) the wind arrows on the leaflet map for ALL units.
 * Called on EE_unitHighlighted (immediate refresh for the selected unit)
 * and on EE_onPreferenceChanged (toggle on/off). Fetches wind from
 * Open-Meteo via js_windProvider (cached per rounded cell + UTC hour).
 * When the wind feature is disabled, all arrows are cleared.
 */
function fn_updateAllWindArrows() {
	if (!js_localStorage.fn_getWindEnabled()) {
		js_leafletmap.fn_clearAllWindArrows();
		fn_clearAllWindData();
		return;
	}
	const units = js_andruavUnit.AndruavUnitList.fn_getUnitsArray();
	if (!units || units.length === 0) {
		js_leafletmap.fn_clearAllWindArrows();
		fn_clearAllWindData();
		return;
	}
	const activeIds = new Set();
	units.forEach(([partyId, unit]) => {
		activeIds.add(partyId);
		// Fire-and-forget: the provider caches per cell+hour, so this is
		// cheap after the first fetch. Wind data is stored in the module
		// map (not on the frozen unit) so the popup can read it
		// synchronously (see jsc_main_unit_popup.jsx).
		js_windProvider.fn_getWindForUnit(unit).then(wind => {
			if (!wind) return;
			fn_setWindData(partyId, wind);
			// Unit may have gone offline between fetch and resolve.
			if (js_andruavUnit.AndruavUnitList.fn_getUnit(partyId)) {
				js_leafletmap.fn_setWindArrow(unit, wind);
			}
		});
	});
	// Remove arrows + wind data for units no longer online (self-cleaning).
	js_leafletmap.fn_clearStaleWindArrows(activeIds);
	for (const id of m_windDataByUnitId.keys()) {
		if (!activeIds.has(id)) m_windDataByUnitId.delete(id);
	}
}

/**
 * Immediate single-unit wind arrow update (used on unit selection so the
 * arrow appears instantly without waiting for the throttle). Also stores
 * wind data in the module map for the popup.
 */
function fn_updateWindArrow(p_andruavUnit) {
	if (!js_localStorage.fn_getWindEnabled()) {
		js_leafletmap.fn_clearAllWindArrows();
		fn_clearAllWindData();
		return;
	}
	if (!p_andruavUnit) return;
	const partyId = p_andruavUnit.getPartyID ? p_andruavUnit.getPartyID() : null;
	js_windProvider.fn_getWindForUnit(p_andruavUnit).then(wind => {
		if (!wind) return;
		fn_setWindData(partyId, wind);
		// Guard against the unit having been removed by the time the
		// (cached) promise resolves.
		if (js_andruavUnit.AndruavUnitList.fn_getUnit(partyId)) {
			js_leafletmap.fn_setWindArrow(p_andruavUnit, wind);
		}
	});
}

/**
 * Throttled refresh of ALL wind arrows on telemetry sync. Telemetry can
 * arrive at 1-10 Hz per unit, but wind data is cached hourly + per ~11km
 * cell, so refreshing faster than CONST_MAP_WIND_ARROW_REFRESH_MS just
 * rebuilds SVG icons for nothing. The fetch is a cache hit (no network),
 * but the throttle avoids the async plumbing + icon rebuild overhead on
 * every packet.
 */
function fn_refreshWindArrowPosition() {
	if (!js_localStorage.fn_getWindEnabled()) return;
	if (Date.now() - js_leafletmap.m_windArrowLastRefresh < CONST_MAP_WIND_ARROW_REFRESH_MS) return;
	fn_updateAllWindArrows();
}

export const setSelectedMissionFilePathToRead = function (p_file_name) {
	selectedMissionFilesToRead = p_file_name;
}

export const setSelectedMissionFilePathToWrite = function (p_file_name) {
	selectedMissionFilesToWrite = p_file_name;
}

export const QueryString = function () {
	let query_string = {};
	let query = window.location.search.substring(1); // Get the query string (excluding the '?')
	let vars = query.split("&"); // Split into individual key-value pairs

	for (let i = 0; i < vars.length; i++) {
		const pair = vars[i].split("="); // Split each pair into key and value
		const key = decodeURIComponent(pair[0]); // Decode the key
		const value = decodeURIComponent(pair[1] || ''); // Decode the value (default to empty string if missing)

		// Skip empty keys (e.g., "?=" or "?&")
		if (key === "") continue;

		// Handle duplicate keys (e.g., "param=1&param=2")
		if (typeof query_string[key] === "undefined") {
			// If this is the first entry with this key, assign the value directly
			query_string[key] = value;
		} else if (typeof query_string[key] === "string") {
			// If this is the second entry with this key, convert to an array
			query_string[key] = [query_string[key], value];
		} else {
			// If this is the third or later entry with this key, push to the array
			query_string[key].push(value);
		}
	}

	// Override the valueOf method to control boolean behavior
	query_string.valueOf = function () {
		// Return false if query_string is {"": ''} or {}
		return !(Object.keys(this).length === 0 || (Object.keys(this).length === 1 && this[""] === ''));
	};

	return query_string; // Return the parsed query string object
}();


/**
 * Retrieves the status of the current browser tab session.
 * 
 * This function checks if the current tab is a new session, a refreshed session,
 * or a duplicate session based on the tab ID stored in sessionStorage and localStorage.
 * 
 * @returns {string} - Returns 'new' if the session is starting for the first time,
 *                     'refresh' if the session is a refresh of an existing tab,
 *                     or 'duplicate' if the tab ID already exists in localStorage.
 */
export function getTabStatus() {
	const tabId = sessionStorage.getItem('tabId') || js_common.fn_generateRandomString(6);
	sessionStorage.setItem('tabId', tabId);

	const isSessionStart = sessionStorage.getItem('isSessionStart') === null;

	if (isSessionStart) {
		sessionStorage.setItem('isSessionStart', 'false'); // Mark session as started
	}

	if (localStorage.getItem(tabId)) {
		return 'duplicate';
	} else {
		localStorage.setItem(tabId, 'active');
		window.addEventListener('beforeunload', () => {
			localStorage.removeItem(tabId);
		});

		if (isSessionStart) {
			return 'new';
		} else {
			return 'refresh';
		}
	}
}



// COULD BE REMOVED I GUESS
function enableDragging() {
	(function ($) {
		$.fn.drags = function (opt) {

			opt = $.extend({ handle: "", cursor: "move" }, opt);
			let $el;
			if (opt.handle === "") {
				$el = this;
			} else {
				$el = this.find(opt.handle);
			}

			return $el.css('cursor', opt.cursor).on("mousedown", function (e) {
				let $drag;
				if (opt.handle === "") {
					$drag = $(this).addClass('draggable');
				} else {
					$drag = $(this).addClass('active-handle').parent().addClass('draggable');
				}
				const z_idx = $drag.css('z-index'),
					drg_h = $drag.outerHeight(),
					drg_w = $drag.outerWidth(),
					pos_y = $drag.offset().top + drg_h - e.pageY,
					pos_x = $drag.offset().left + drg_w - e.pageX;
				$drag.css('z-index', 1000).parents().on("mousemove", function (e) {
					$('.draggable').offset({
						top: e.pageY + pos_y - drg_h,
						left: e.pageX + pos_x - drg_w
					}).on("mouseup", function () {
						$(this).removeClass('draggable').css('z-index', z_idx);
					});
				});
				e.preventDefault(); // disable selection
			}).on("mouseup", function () {
				if (opt.handle === "") {
					$(this).removeClass('draggable');
				} else {
					$(this).removeClass('active-handle').parent().removeClass('draggable');
				}
			});
		}
	})($);


	//$("[data-bs-toggle=tooltip]").tooltip(); REACT2
	//$("[data-bs-toggle=tooltip]").drags();  REACT2
}


/**
 * Handles keyboard events for the application.
 * 
 * This function sets up a keydown event listener on the body element to handle
 * various keyboard shortcuts and prevent default behaviors for specific keys.
 * 
 * - If the `Alt` key is pressed, no specific action is taken.
 * - If the `Ctrl` key is pressed along with the `R` key, the default browser
 *   refresh behavior is prevented.
 * - If the target element is not a textarea, text input, email input, or password
 *   input, the following shortcuts are handled:
 *   - Pressing the `M` key (case insensitive) triggers the `fn_showMap` function.
 *   - Pressing the `R` key (case insensitive) triggers the `fn_showVideoMainTab` function.
 * 
 * @function fn_handleKeyBoard
 */
function fn_handleKeyBoard() {

	if (js_globals.CONST_MAP_EDITOR === true) {
		return;
	}

	$('body').on('keydown', function (p_event) {
		const key = p_event.key;
		p_event = p_event || window.event;
		if (key === null || key === undefined) return;

		if (p_event.type === "keydown") {
			if (p_event.altKey === true) {
				// no-op

			}

			if (p_event.ctrlKey) {
				const c = p_event.which || p_event.keyCode;
				if (c === 82) {
					p_event.preventDefault();
					p_event.stopPropagation();
				}
			}

			if ((p_event.target.type !== 'textarea')
				&& (p_event.target.type !== 'text')
				&& (p_event.target.type !== 'email')
				&& (p_event.target.type !== 'password')
				&& (p_event.target.type !== 'number')) {
				if (key.toLowerCase() === 'm') {
					fn_showMap();
				}

				if (key.toLowerCase() === 'r') {
					fn_showVideoMainTab();
				}

				if (key >= '1' && key <= '6') {
					js_localStorage.fn_setDisplayMode(parseInt(parseInt(key) - 1));
					fn_applyControl(parseInt(key));
				}

				if (key === 'Escape') {
					fn_showSettings();
				}
			}
		}
	});

}




export function fn_do_modal_confirmation(p_title, p_message, p_callback, p_yesCaption, p_style, p_noCaption) {
	js_dialogs.fn_showConfirmationDialog({
		p_title: p_title,
		p_message: p_message,
		p_callback: p_callback,
		p_yesCaption: p_yesCaption,
		p_noCaption: p_noCaption,
		p_style: p_style
	});
}

export function fn_do_modal_alert(p_title, p_message, p_callback, p_okCaption, p_style) {
	js_dialogs.fn_showAlertDialog({
		p_title: p_title,
		p_message: p_message,
		p_callback: p_callback,
		p_okCaption: p_okCaption,
		p_style: p_style
	});
}


export function fn_do_modal_apply_all(p_mission) {
	if (p_mission === null || p_mission === undefined) return;

	js_dialogs.fn_showApplyAllDialog({
		p_mission: p_mission
	});
}


export function fn_do_modal_mission_load(p_missions, p_callback) {
	js_dialogs.fn_showMissionLoadDialog({
		p_missions: p_missions,
		p_callback: p_callback
	});
}


export function fn_takeLocalImage(p_andruavUnit, videoTrackID) {
	const v_videoctrl = '#videoObject' + videoTrackID;
	const v_video = $(v_videoctrl)[0];
	const v_canvas = document.createElement('canvas');
	v_canvas.width = v_video.videoWidth;
	v_canvas.height = v_video.videoHeight;
	const ctx = v_canvas.getContext('2d');

	//draw image to canvas. scale to target dimensions
	ctx.drawImage(v_video, 0, 0);

	//convert to desired file format
	let dataURI = v_canvas.toDataURL("image/png"); // can also use 'image/png'
	js_helpers.fn_saveData(dataURI, 'image/png');
}


export function fn_startrecord(v_andruavUnit, v_videoTrackID) {

	const v_talk = v_andruavUnit.m_Video.m_videoactiveTracks[v_videoTrackID];
	const recorder = RecordRTC(v_talk.stream, {
		type: 'video'
	});

	// Start recording
	recorder.startRecording();

	//   // Stop recording after 10 seconds
	//   setTimeout(() => {
	// 	recorder.stopRecording(() => {
	// 	  // Get the recorded video blob
	// 	  const videoBlob = recorder.getBlob();

	// 	  // Do something with the recorded video, e.g., upload it to a server
	// 	  console.log('Recorded video blob:', videoBlob);
	// 	});
	//   }, 10000);

	v_talk.videoRecording = true;
	v_talk.recorderObject = recorder;
	js_eventEmitter.fn_dispatch(js_event.EE_videoStreamRedraw, { 'andruavUnit': v_andruavUnit, 'v_track': v_videoTrackID });

}




function fn_doGimbalCtrlStep(unit, stepPitch, stepRoll, stepYaw) {
	js_globals.v_andruavFacade.API_do_GimbalCtrl(unit,
		stepPitch,
		stepRoll,
		stepYaw, false);
}

// eslint-disable-next-line no-unused-vars
function fn_doGimbalCtrl(unit, pitch, roll, yaw) {
	js_globals.v_andruavFacade.API_do_GimbalCtrl(unit, pitch, roll, yaw, true);
}


export function fn_showVideoMainTab() {
	js_layout.fn_showVideo();
	js_map3d.fn_hide();
}


export function fn_applyControl(v_small_mode) {
	let v_display_mode = js_localStorage.fn_getDisplayMode();

	if (v_display_mode == null) v_display_mode = 0;

	// The store is the single source of truth for layout. It computes the
	// profile (row visibility, column classes, pane visibility, button
	// visibility) from displayMode + smallMode, persists the mode, and
	// dispatches EE_LayoutChanged so React re-renders the layout.
	js_layout.fn_setDisplayMode(v_display_mode, v_small_mode === true);

	// Map lifecycle: every old fn_activate* hid the 3D map and invalidated
	// the 2D map's size after the column layout changed.
	js_map3d.fn_hide();

	// js_layout.fn_setDisplayMode() only dispatches EE_LayoutChanged; the
	// column-width classes it drives are applied by React on its next
	// commit, not synchronously here. Calling invalidateSize() immediately
	// makes Leaflet measure the pre-resize container and lock in a
	// half-width tile grid (visible as a white/map split down the middle).
	// Same fix as js_map3d.fn_show()'s doResizeAndSync: defer past the
	// commit + reflow with a double rAF.
	requestAnimationFrame(() => requestAnimationFrame(() => {
		js_leafletmap.fn_invalidateSize();
	}));
}

export function fn_showControl(v_small_mode) {
	js_localStorage.fn_setDisplayMode(parseInt(js_localStorage.fn_getDisplayMode()) + 1);
	fn_applyControl(v_small_mode);
}




export function fn_showMap() {
	js_layout.fn_showMap();
	js_map3d.fn_hide();

	// Same React-commit-timing issue as fn_applyControl() above: the
	// container isn't resized until React re-renders, so defer.
	requestAnimationFrame(() => requestAnimationFrame(() => {
		js_leafletmap.fn_invalidateSize();
	}));
}

export function fn_showMap3D() {
	js_layout.fn_showMap3D();
	js_map3d.fn_show();

	// Sync the 3D map's start location to the leaflet map's current center so
	// it does not stay stuck at its hardcoded initial center.
	const center = js_leafletmap.fn_getCenter();
	if (center) {
		js_map3d.fn_syncCenter(center.lat, center.lng);
	}
}

function fn_onMap3dDblClick(p_lat, p_lng) {
	if (js_globals.CONST_MAP_EDITOR === true) return;
	// Draw a ground-draped circle with a + crosshair at the clicked point
	// (instead of a DOM marker pin), then immediately show the context
	// popup — the 3D map's dblclick UX has always opened the popup directly.
	js_map3d.fn_drawTargetMarker(p_lat, p_lng);
	fn_generateContextMenuHTML(p_lat, p_lng);
}

export function fn_showSettings() {
	$('#andruavUnits_in').toggle();

	$([document.documentElement, document.body]).animate({
		scrollTop: $("#row_2").offset().top
	}, 100);
}

function onWEBRTCSessionStarted(c_talk) {
	let v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(c_talk.number);
	if (v_andruavUnit === null || v_andruavUnit === undefined) return;
	v_andruavUnit.m_Video.m_videoactiveTracks[c_talk.targetVideoTrack] = c_talk;
	js_eventEmitter.fn_dispatch(js_event.EE_videoStreamStarted, { 'andruavUnit': v_andruavUnit, 'talk': c_talk });
	js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, v_andruavUnit);
}

function onWEBRTCSessionEnded(c_talk) {
	let v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(c_talk.number);
	if (v_andruavUnit === null || v_andruavUnit === undefined) return;

	v_andruavUnit.m_Video.m_videoactiveTracks[c_talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
	js_eventEmitter.fn_dispatch(js_event.EE_videoStreamStopped, { 'andruavUnit': v_andruavUnit, 'talk': c_talk });
	js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, v_andruavUnit);
}


function onWEBRTCSessionOrphanEnded(c_number) {
	let v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(c_number);
	if (v_andruavUnit === null || v_andruavUnit === undefined) return;
	v_andruavUnit.m_Video.m_videoactiveTracks[c_number].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
	js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, v_andruavUnit);
}






function fn_WEBRTC_login(v_partyID, v_trackID) {

	js_webrtcstream.onOrphanDisconnect = onWEBRTCSessionOrphanEnded;

	js_webrtcstream.joinStream(
		{

			'number': v_partyID,
			'targetVideoTrack': v_trackID,
			'v_andruavClient': js_globals.v_andruavClient,
			onDisplayVideo: onWEBRTCSessionStarted,
			onError: function (v_talk, v_errormsg) { js_speak.fn_speak(v_errormsg); },
			onRemovestream: function () {
			},
			onDisconnected: onWEBRTCSessionEnded,

		}
	);
}


export function fn_VIDEO_login(v_andruavVideo, v_trackId) {

	let len = v_andruavVideo.m_unit.m_Video.m_videoTracks.length;
	for (let i = 0; i < len; ++i) {
		if (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].id === v_trackId) {
			switch (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].p) {
				case js_andruavMessages.CONST_EXTERNAL_CAMERA_TYPE_RTCWEBCAM:
					fn_WEBRTC_login(v_andruavVideo.m_unit.getPartyID(), v_trackId);
					break;

				case js_andruavMessages.CONST_EXTERNAL_CAMERA_TYPE_FFMPEGWEBCAM:
					//NOT USED
					break;

				default:
					break;
			}
			break;
		}
	}
}


/*
	Video Recording
*/
export function fn_VIDEO_Record(v_andruavVideo, v_trackId, p_Start) {

	if (v_andruavVideo === null || v_andruavVideo === undefined) return;

	var len = v_andruavVideo.m_unit.m_Video.m_videoTracks.length;
	for (let i = 0; i < len; ++i) {
		if (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].id === v_trackId) {
			js_globals.v_andruavFacade.API_CONST_RemoteCommand_recordVideo(v_andruavVideo.m_unit.getPartyID(), v_trackId, p_Start);
		}
	}
}


export function fn_doYAW(p_andruavUnit, targetAngle, turnRate, isClockwise, isRelative) {
	js_globals.v_andruavFacade.API_do_YAW(p_andruavUnit, targetAngle, turnRate, isClockwise, isRelative);
}

// eslint-disable-next-line no-unused-vars
function fn_getadsbIcon(_obj, droneAltitude) {
	if (_obj.Help) {
		return '/images/station-in-action-icon.png';
	}

	var degIndex = parseInt(_obj.Heading / 22);


	if (_obj.Ground) {
		switch (degIndex) {
			case 15:
			case 0:
				return '/images/blure/adrone_gr_32x32.png';
			case 1:
			case 2:
				return '/images/blure/adrone_gr_32x32x45d.png';
			case 3:
			case 4:
				return '/images/blure/adrone_gr_32x32x90d.png';
			case 5:
			case 6:
				return '/images/blure/adrone_gr_32x32x135d.png';
			case 7:
			case 8:
				return '/images/blure/adrone_gr_32x32x180d.png';
			case 9:
			case 10:
				return '/images/blure/adrone_gr_32x32x225d.png';
			case 11:
			case 12:
				return '/images/blure/adrone_gr_32x32x270d.png';
			case 13:
			case 14:
				return '/images/blure/adrone_gr_32x32x315d.png';
			default: // NAN if Heading is null
				return '/images/blure/adrone_gr_32x32.png';
		}
	}



	if ((_obj.Alt) < 500) {
		// if plane under drone by any difference, or heigher by 500 then alert
		switch (degIndex) {
			case 15:
			case 0:
				return '/images/blure/adrone_br_32x32.png';
			case 1:
			case 2:
				return '/images/blure/adrone_br_32x32x45d.png';
			case 3:
			case 4:
				return '/images/blure/adrone_br_32x32x90d.png';
			case 5:
			case 6:
				return '/images/blure/adrone_br_32x32x135d.png';
			case 7:
			case 8:
				return '/images/blure/adrone_br_32x32x180d.png';
			case 9:
			case 10:
				return '/images/blure/adrone_br_32x32x225d.png';
			case 11:
			case 12:
				return '/images/blure/adrone_br_32x32x270d.png';
			case 13:
			case 14:
				return '/images/blure/adrone_br_32x32x315d.png';
			default: // NAN if Heading is null
				return '/images/blure/adrone_br_32x32.png';
		}
	}
	else {
		switch (degIndex) {
			case 15:
			case 0:
				return '/images/blure/adrone_bk_32x32.png';
			case 1:
			case 2:
				return '/images/blure/adrone_bk_32x32x45d.png';
			case 3:
			case 4:
				return '/images/blure/adrone_bk_32x32x90d.png';
			case 5:
			case 6:
				return '/images/blure/adrone_bk_32x32x135d.png';
			case 7:
			case 8:
				return '/images/blure/adrone_bk_32x32x180d.png';
			case 9:
			case 10:
				return '/images/blure/adrone_bk_32x32x225d.png';
			case 11:
			case 12:
				return '/images/blure/adrone_bk_32x32x270d.png';
			case 13:
			case 14:
				return '/images/blure/adrone_bk_32x32x315d.png';
			default: // NAN if Heading is null
				return '/images/blure/adrone_bk_32x32.png';
		}
	}
}

// eslint-disable-next-line no-unused-vars
function fn_handleADSBPopup(p_obj) {

}

// Persistent Leaflet circle showing the ADSB query coverage area.
let v_adsbQueryCircle = null;
// Non-null when the ADSB provider is in an error state (e.g. HTTP 500 from
// OpenSky). The query circle turns red to surface the problem on the map.
let v_adsbError = null;

/**
 * Create / update / remove the dotted ADSB query-area circle on the map.
 * Called on every ADSB exchange tick and when ADSB is disabled.
 * The circle turns red when v_adsbError is set (provider fetch failure).
 */
function fn_updateAdsbQueryCircle() {
	const area = js_adsbManager.fn_getQueryArea();
	if (js_adsbManager.fn_isRunning() && area) {
		const color = v_adsbError ? '#FF0000' : '#FFA500';
		if (v_adsbQueryCircle) {
			// Update existing circle in place.
			v_adsbQueryCircle.setLatLng([area.lat, area.lng]);
			v_adsbQueryCircle.setRadius(Math.round(area.radiusKm * 1000));
			v_adsbQueryCircle.setStyle({ color });
		} else {
			v_adsbQueryCircle = js_leafletmap.fn_drawAdsbQueryCircle(
				area.lat, area.lng, area.radiusKm, color);
		}
	} else if (v_adsbQueryCircle) {
		js_leafletmap.fn_hideItem(v_adsbQueryCircle);
		v_adsbQueryCircle = null;
	}
}

/**
 * EE_adsbError handler — sets/clears the ADSB error state and recolors
 * the query circle red when the provider reports a fetch failure.
 * @param {*} me - listener (this)
 * @param {string|null} p_msg - error message (truthy = error, null = cleared)
 */
function fn_onAdsbError(me, p_msg) {
	v_adsbError = p_msg || null;
	fn_updateAdsbQueryCircle();
}

// eslint-disable-next-line no-unused-vars
function fn_adsbExpiredUpdate(me) {
	// Use the same timeout as the ADSB manager's purge window so markers
	// stay hidden/purged in sync. Default is 4x the refresh rate (240s at
	// 60s refresh) so a plane survives ~4 missed polls.
	const ADSB_OBJECT_TIMEOUT =
		(js_adsbManager && js_adsbManager.fn_getObjectTimeoutMs && js_adsbManager.fn_getObjectTimeoutMs()) || 240000;
	const count = js_adsbUnit.count;
	const now = new Date();
	const p_keys = Object.keys(js_adsbUnit.List);

	for (let i = 0; i < count; ++i) {
		let adsb_obj = js_adsbUnit.List[p_keys[i]];

		if ((now - adsb_obj.m_last_access) > ADSB_OBJECT_TIMEOUT) {
			if (adsb_obj.p_marker !== null && adsb_obj.p_marker !== undefined) {
				js_leafletmap.fn_hideItem(adsb_obj.p_marker);
			}
			js_map3d.fn_removeAdsbMarker(adsb_obj);
			if (v_adsbMap3dSelectedIcao === adsb_obj.m_icao_address) {
				fn_clearAdsbMap3dSelection();
			}
		}
	}

	// Push the (now shorter) 3D tether/ground/altitude-circle feature lists
	// to Mapbox in a single batch rather than once per removed aircraft.
	js_map3d.fn_flushAdsbTethers();

	fn_updateAdsbQueryCircle();
}

/**
 * Remove every ADSB marker from both the 2D Leaflet map and the 3D
 * Mapbox map, clear the registry, hide the query-area circle, and drop
 * any 3D selection. Called when ADSB is disabled (EE_adsbCleared) so
 * stale aircraft don't linger on the map after the polling loop stops.
 */
function fn_clearAdsbFromMap() {
	const list = (js_adsbUnit && js_adsbUnit.List) ? js_adsbUnit.List : null;
	if (list) {
		const keys = Object.keys(list);
		for (let i = 0; i < keys.length; ++i) {
			const adsb_obj = list[keys[i]];
			if (!adsb_obj) continue;
			if (adsb_obj.p_marker) {
				js_leafletmap.fn_hideItem(adsb_obj.p_marker);
				adsb_obj.p_marker = null;
			}
			js_map3d.fn_removeAdsbMarker(adsb_obj);
		}
	}
	fn_clearAdsbMap3dSelection();
	js_map3d.fn_flushAdsbTethers();
	js_adsbUnit.fn_clear();

	// Hide the dotted ADSB query-area circle as well.
	if (v_adsbQueryCircle) {
		js_leafletmap.fn_hideItem(v_adsbQueryCircle);
		v_adsbQueryCircle = null;
	}
	v_adsbError = null;
}

// Cap on live ADSB Leaflet markers, as a last-resort safety net for a
// single view that's genuinely dense with traffic (see fn_renderAdsbMarkers
// - viewport culling handles the common case). Each rendered aircraft is an
// individually hit-testable interactive marker; the default 850km query
// radius (js_adsbManager.js) can return hundreds of aircraft over busy
// airspace, and an unbounded marker count makes every mouse move over the
// map pay for hit-testing all of them - measured as the dominant
// main-thread cost during map pan/hover (unrelated to tile caching or
// React rendering: HitTest against #mapid alone was taking 11-74ms per
// mousemove).
const CONST_ADSB_MAX_RENDERED_MARKERS = 50;
// Pad the viewport used for culling by this fraction of its own size (in
// each direction) so a marker just past the visible edge doesn't pop its
// DOM node in/out on every tiny pan.
const CONST_ADSB_VIEWPORT_PAD_RATIO = 0.25;

function fn_haversineKm(lat1, lng1, lat2, lng2) {
	const R = 6371;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Render/cull live ADSB markers against js_adsbUnit's registry directly
 * (not a passed-in snapshot), so the same pass can run both on a fresh
 * ADSB fetch (fn_adsbObjectUpdate) and on every map pan/zoom
 * (EE_mapViewChanged) with no data of its own.
 *
 * Two layers of defense against unbounded marker count, both aimed at the
 * same measured problem (Chrome's HitTest cost against #mapid scales with
 * the number of interactive DOM markers, not just the ones under the
 * cursor):
 *  1. Viewport culling: only aircraft within the current map bounds
 *     (padded) are candidates for a live marker at all. This is what
 *     fixes the "the more I zoom in, the more it hangs" symptom - without
 *     it, aircraft scattered across the full 850km query radius sit at
 *     increasingly extreme pixel offsets as you zoom in tight on one
 *     spot, since a fixed real-world distance maps to more screen pixels
 *     at every zoom level, while remaining live (off-screen) DOM nodes.
 *  2. Distance cap: if a single view is still dense with traffic (e.g. a
 *     busy airport at low zoom), only the nearest CONST_ADSB_MAX_RENDERED_MARKERS
 *     to the query center get a marker.
 * Aircraft that lose their marker keep updating silently in the registry
 * and reappear immediately once they're back in view/among the nearest.
 *
 * @param {boolean} [isDataUpdate=false] - true when called from a fresh
 *        ADSB fetch (EE_adsbExchangeReady): every visible aircraft gets a
 *        full re-render (position, heading, popup content updated).
 *        false when called from a view change (EE_mapViewChanged): only
 *        newly-visible aircraft that don't have a marker yet get one
 *        created; aircraft that already have a live marker are left alone
 *        (Leaflet repositions them automatically via its pane transform,
 *        so calling setLatLng again is redundant DOM work — and with 150
 *        markers that's 450 style/innerHTML mutations per zoom end, the
 *        remaining dominant cost during pan/zoom after the m_isVisible
 *        guard on the 3D map).
 */
function fn_renderAdsbMarkers(isDataUpdate) {
	const list = (js_adsbUnit && js_adsbUnit.List) ? js_adsbUnit.List : null;
	if (!list) return;

	const all = Object.values(list).filter(
		(o) => o && o.m_lat !== null && o.m_lat !== undefined
	);

	const bounds = js_leafletmap.fn_getBounds();
	const padded = bounds ? bounds.pad(CONST_ADSB_VIEWPORT_PAD_RATIO) : null;

	let visible = padded
		? all.filter((o) => padded.contains([o.m_lat, o.m_lon]))
		: all;

	if (visible.length > CONST_ADSB_MAX_RENDERED_MARKERS) {
		const area = js_adsbManager.fn_getQueryArea();
		if (area) {
			visible = visible.slice().sort((a, b) =>
				fn_haversineKm(area.lat, area.lng, a.m_lat, a.m_lon) -
				fn_haversineKm(area.lat, area.lng, b.m_lat, b.m_lon)
			);
		}
		visible = visible.slice(0, CONST_ADSB_MAX_RENDERED_MARKERS);
	}
	const visibleSet = new Set(visible);

	for (let i = 0; i < all.length; ++i) {
		const p_adsbObject = all[i];
		if (visibleSet.has(p_adsbObject)) {
			if (isDataUpdate || !p_adsbObject.p_marker) {
				// Fresh data, or this aircraft just scrolled into view and
				// needs a marker created — do the full render (position,
				// heading, popup). On a pure view change, aircraft that
				// already have a live marker are skipped: Leaflet moves
				// them automatically when the map pans/zooms, so
				// setLatLng/setRotationAngle would just repeat that work
				// as redundant DOM style mutations.
				fn_renderSingleAdsb(p_adsbObject);
			}
		} else if (p_adsbObject.p_marker) {
			// Off-screen or beyond the cap - drop the live marker so it
			// stops costing hit-test/layout time. fn_renderSingleAdsb
			// re-creates it the moment this aircraft is back in the
			// visible set.
			js_leafletmap.fn_hideItem(p_adsbObject.p_marker);
			p_adsbObject.p_marker = null;
		}
	}
}

function fn_adsbObjectUpdate() {
	// The ADSB manager dispatches EE_adsbExchangeReady once per fetch;
	// fn_renderAdsbMarkers reads the current registry itself (see its doc
	// comment) so no data needs to be threaded through here. Pass true so
	// every visible aircraft gets a full re-render (position/heading/popup
	// updated from the fresh data).
	//
	// When the 3D map is the active view the 2D leaflet map is hidden
	// (display:none), so fn_getBounds() returns degenerate zero-size bounds
	// and fn_renderAdsbMarkers culls every aircraft — including the
	// fn_syncAdsbObject mirror inside fn_renderSingleAdsb, so no 3D markers
	// are ever created. Use the dedicated fn_syncAdsbToMap3D path (which
	// iterates the whole registry without 2D culling) instead. This fixes
	// the case where the user starts on the 3D map and enables ADSB
	// afterwards: EE_map3dShown already fired on an empty registry, so the
	// per-poll path is the only chance to create 3D markers.
	if (js_layout.fn_getMapMode() === '3d') {
		fn_syncAdsbToMap3D();
	} else {
		fn_renderAdsbMarkers(true);
	}

	// Keep the query-area circle in sync with the current coverage.
	fn_updateAdsbQueryCircle();
}

// Sync all ADSB aircraft from the registry onto the 3D map, bypassing the
// 2D viewport culling in fn_renderAdsbMarkers. Called when the 3D map
// becomes visible (EE_map3dShown): fn_syncAdsbObject early-returns while
// the 3D view is hidden, so m_adsbMarkers is empty until this runs. The 2D
// leaflet map is display:none at this point, so fn_getBounds() returns
// degenerate bounds and fn_renderAdsbMarkers would cull everything — hence
// this dedicated path that iterates the whole registry and pushes each
// aircraft straight to the 3D map (the 3D map does its own LOD/zoom
// culling via minzoom on the model layer).
function fn_syncAdsbToMap3D() {
	const list = (js_adsbUnit && js_adsbUnit.List) ? js_adsbUnit.List : null;
	if (!list) return;
	let all = Object.values(list).filter(
		(o) => o && Number.isFinite(o.m_lat) && Number.isFinite(o.m_lon)
	);
	if (all.length === 0) return;
	// Cap to the same limit as the 2D path (fn_renderAdsbMarkers) so we don't
	// create hundreds of Mapbox markers + terrain-elevation queries at once.
	// Sort by distance from the query-area center (same heuristic as the 2D
	// path's cap) so the closest aircraft are kept when the registry is large.
	if (all.length > CONST_ADSB_MAX_RENDERED_MARKERS) {
		const area = js_adsbManager.fn_getQueryArea();
		if (area) {
			all = all.slice().sort((a, b) =>
				fn_haversineKm(area.lat, area.lng, a.m_lat, a.m_lon) -
				fn_haversineKm(area.lat, area.lng, b.m_lat, b.m_lon)
			);
		}
		all = all.slice(0, CONST_ADSB_MAX_RENDERED_MARKERS);
	}
	for (let i = 0; i < all.length; ++i) {
		const o = all[i];
		let icon;
		switch (parseInt(o.m_emitter_type)) {
			case mavlink20.ADSB_EMITTER_TYPE_ROTOCRAFT:
				icon = '/images/heli_1_32x32.png';
				break;
			default:
				icon = '/images/Plane_Track.png';
				break;
		}
		js_map3d.fn_syncAdsbObject(o, icon, fn_onAdsbMap3dMarkerClick);
	}
	js_map3d.fn_flushAdsbTethers();
}

// Re-render ADSB markers when the unit system (metric/imperial) changes so
// tooltips switch between m/km/h and ft/mph immediately. Only refreshes
// aircraft that already have a live marker - culled/off-screen aircraft
// (see fn_renderAdsbMarkers) must NOT be force-rendered here, or every unit
// toggle would undo the viewport/distance culling.
function fn_adsbUnitSystemChanged() {
	const list = (js_adsbUnit && js_adsbUnit.List) ? js_adsbUnit.List : null;
	if (!list) return;
	const keys = Object.keys(list);
	for (let i = 0; i < keys.length; ++i) {
		const p_adsbObject = list[keys[i]];
		if (!p_adsbObject || !p_adsbObject.p_marker) continue;
		fn_renderSingleAdsb(p_adsbObject);
	}
}

function fn_renderSingleAdsb(p_adsbObject) {
	console.log('ADSB13b fn_renderSingleAdsb', { icao: p_adsbObject.m_icao_address, hasMarker: !!p_adsbObject.p_marker });
	var icon;
	switch (parseInt(p_adsbObject.m_emitter_type)) {
		case mavlink20.ADSB_EMITTER_TYPE_NO_INFO:
			// Most aircraft don't broadcast category — default to plane icon.
			icon = '/images/Plane_Track.png';
			break;
		case mavlink20.ADSB_EMITTER_TYPE_ROTOCRAFT:
			// Helicopter / rotorcraft.
			icon = '/images/heli_1_32x32.png';
			break;
		default:
			// All other types (light, small, large, glider, UAV, etc.)
			// use the plane icon.
			icon = '/images/Plane_Track.png';
			break;
	}

	var v_marker = p_adsbObject.p_marker;
	if (v_marker === null || v_marker === undefined) {
		var v_label = p_adsbObject.m_callsign || p_adsbObject.m_icao_address;
		var v_htmladsb = "<p class='text-warning margin_zero'>" + v_label + "</p>";

		// TEMP DEBUG: create ADSB markers as non-interactive to eliminate
		// Chrome hit-test cost during pan/zoom (the dominant hang cause with
		// many interactive markers). Click handling is via map-level delegation.
		var v_image = js_leafletmap.fn_createIcon(icon, v_label, null, false, false, v_htmladsb, [32, 32]);
		v_marker = window.L.marker([0, 0], {
			icon: v_image,
			title: v_label,
			draggable: false,
			interactive: false,
			keyboard: false,
			zIndexOffset: 0
		}).addTo(js_leafletmap.m_Map);
		p_adsbObject.p_marker = v_marker;
	}

	js_leafletmap.fn_setPosition_bylatlng(p_adsbObject.p_marker, p_adsbObject.m_lat, p_adsbObject.m_lon, p_adsbObject.m_heading);
	js_leafletmap.fn_showItem(p_adsbObject.p_marker);

	// Mirror the same aircraft on the 3D map. Clicking it selects it (shows
	// the tether/rings + a popup), same UX as clicking the leaflet marker.
	js_map3d.fn_syncAdsbObject(p_adsbObject, icon, fn_onAdsbMap3dMarkerClick);

	var v_popup = fn_buildAdsbPopupHtml(p_adsbObject);

	// Remove any leftover tooltip from older code, then bind/update popup.
	// The icon label (callsign) is always visible; popup shows on click.
	if (typeof p_adsbObject.p_marker.unbindTooltip === 'function' && p_adsbObject.p_marker.getTooltip && p_adsbObject.p_marker.getTooltip()) {
		p_adsbObject.p_marker.unbindTooltip();
	}
	if (p_adsbObject.p_marker.getPopup && p_adsbObject.p_marker.getPopup()) {
		p_adsbObject.p_marker.setPopupContent(v_popup);
	} else if (typeof p_adsbObject.p_marker.bindPopup === 'function') {
		p_adsbObject.p_marker.bindPopup(v_popup, { closeButton: false });
	}

	// If this aircraft is the one currently selected on the 3D map, refresh
	// its popup content/position too (it moves every update).
	if (v_adsbMap3dSelectedIcao === p_adsbObject.m_icao_address && v_adsbMap3dPopup) {
		js_map3d.fn_bindPopup(v_adsbMap3dPopup, v_popup, p_adsbObject.m_lat, p_adsbObject.m_lon);
	}
}

/**
 * Builds the HTML content for an ADSB aircraft's info popup (speed,
 * altitude, heading, etc.), shared between the leaflet and 3D maps.
 */
function fn_buildAdsbPopupHtml(p_adsbObject) {
	// Velocity is stored in m/s, altitude in meters. OpenSky may return null
	// for any of these, so guard against null/undefined before formatting.
	// Respect js_globals.v_useMetricSystem for unit display.
	var v_speedMs = Number(p_adsbObject.m_velocity) || 0;
	var v_altM = Number(p_adsbObject.m_altitude) || 0;
	var v_geoAltM = Number(p_adsbObject.m_geo_altitude) || 0;
	var v_vsiMs = Number(p_adsbObject.m_vertical_rate) || 0;
	var v_headingDeg = Number(p_adsbObject.m_heading) * 180 / Math.PI || 0;
	var v_callsign = p_adsbObject.m_callsign || p_adsbObject.m_icao_address;
	var v_icao = p_adsbObject.m_icao_address || '';
	var v_country = p_adsbObject.m_origin_country || '';
	var v_squawk = p_adsbObject.m_squawk || '';
	var v_onGround = p_adsbObject.m_on_ground;
	var v_spi = p_adsbObject.m_spi;
	var v_posSrc = p_adsbObject.m_position_source;
	var v_lat = Number(p_adsbObject.m_lat) || 0;
	var v_lon = Number(p_adsbObject.m_lon) || 0;

	var v_speedStr, v_altStr, v_geoAltStr, v_vsiStr;
	if (js_globals.v_useMetricSystem === true) {
		v_speedStr = (v_speedMs * 3.6).toFixed(0) + " km/h";
		v_altStr = v_altM.toFixed(0) + " m";
		v_geoAltStr = v_geoAltM > 0 ? v_geoAltM.toFixed(0) + " m" : "—";
		v_vsiStr = v_vsiMs.toFixed(1) + " m/s";
	} else {
		v_speedStr = (v_speedMs * js_helpers.CONST_METER_TO_MILE).toFixed(0) + " mph";
		v_altStr = (v_altM * js_helpers.CONST_METER_TO_FEET).toFixed(0) + " ft";
		v_geoAltStr = v_geoAltM > 0 ? (v_geoAltM * js_helpers.CONST_METER_TO_FEET).toFixed(0) + " ft" : "—";
		v_vsiStr = (v_vsiMs * js_helpers.CONST_METER_TO_FEET * 60).toFixed(0) + " ft/min";
	}

	// Position source label
	var v_posSrcStr = "—";
	if (v_posSrc === 0) v_posSrcStr = "ADS-B";
	else if (v_posSrc === 1) v_posSrcStr = "ASTERIX";
	else if (v_posSrc === 2) v_posSrcStr = "MLAT";
	else if (v_posSrc === 3) v_posSrcStr = "FLARM";

	return "<div style='font-size:12px; line-height:1.5; min-width:140px'>" +
		"<b style='font-size:13px'>" + v_callsign + "</b>" +
		(v_onGround ? " <span style='color:#28a745'>(on ground)</span>" : "") +
		(v_spi ? " <span style='color:#dc3545'>(SPI)</span>" : "") +
		"<br/>" +
		"ICAO: " + v_icao + "<br/>" +
		(v_country ? "Country: " + v_country + "<br/>" : "") +
		(v_squawk ? "Squawk: " + v_squawk + "<br/>" : "") +
		"SPD: " + v_speedStr + "<br/>" +
		"ALT: " + v_altStr + "<br/>" +
		"Geo ALT: " + v_geoAltStr + "<br/>" +
		"HDG: " + v_headingDeg.toFixed(0) + "°<br/>" +
		"V/S: " + v_vsiStr + "<br/>" +
		"Pos: " + v_lat.toFixed(4) + ", " + v_lon.toFixed(4) + "<br/>" +
		"Src: " + v_posSrcStr +
		"</div>";
}

// ---- 3D map ADSB selection (click aircraft -> show tether/rings + popup) ----
let v_adsbMap3dSelectedIcao = null;
let v_adsbMap3dPopup = null;

function fn_onAdsbMap3dMarkerClick(p_adsbObject) {
	const icao = p_adsbObject.m_icao_address;

	// Clicking the already-selected aircraft toggles it off.
	const wasSelected = (v_adsbMap3dSelectedIcao === icao);
	fn_clearAdsbMap3dSelection();
	if (wasSelected) return;

	v_adsbMap3dSelectedIcao = icao;
	js_map3d.fn_setSelectedAdsbAircraft(icao);
	js_map3d.fn_flushAdsbTethers();

	// Place the popup at the aircraft's altitude above the terrain (same
	// computation as fn_syncAdsbObject) so it points at the 3D model/icon
	// rather than sitting on the ground.
	const terrainElev = js_map3d.fn_getRawTerrainElevation(p_adsbObject.m_lat, p_adsbObject.m_lon);
	const altAboveGround = Math.max((Number(p_adsbObject.m_altitude) || 0) - terrainElev, 0);
	v_adsbMap3dPopup = js_map3d.fn_showInfoWindow(
		null, fn_buildAdsbPopupHtml(p_adsbObject), p_adsbObject.m_lat, p_adsbObject.m_lon, altAboveGround);
}

function fn_clearAdsbMap3dSelection() {
	if (v_adsbMap3dPopup) {
		js_map3d.fn_hideInfoWindow(v_adsbMap3dPopup);
		v_adsbMap3dPopup = null;
	}
	if (v_adsbMap3dSelectedIcao !== null) {
		v_adsbMap3dSelectedIcao = null;
		js_map3d.fn_setSelectedAdsbAircraft(null);
		js_map3d.fn_flushAdsbTethers();
	}
}

// eslint-disable-next-line no-unused-vars
function fn_adsbUpdated(p_caller, p_data) {

}


export function gui_toggleUnits(dontflip) {

	// use current metric as other browser could change it and you will lose the SYNC
	// Scenario: if two browsers one is meter and the other is feet, the last one that switch
	// will record the value and ubunts in the storage. if you changed from other browser then 
	// the values and unit of the latest browser will overwrite the saved one... but if you refresh
	// the browser instead of changing the units the latter will take the values of the first one.
	js_localStorage.fn_setMetricSystem(js_globals.v_useMetricSystem);

	if (js_localStorage.fn_getMetricSystem() === true) {
		if (dontflip !== true) js_globals.v_useMetricSystem = false;

		js_localStorage.fn_setMetricSystem(false);
		js_globals.CONST_DEFAULT_ALTITUDE = (js_helpers.CONST_METER_TO_FEET * js_globals.CONST_DEFAULT_ALTITUDE).toFixed(0);
		js_globals.CONST_DEFAULT_RADIUS = (js_helpers.CONST_METER_TO_FEET * js_globals.CONST_DEFAULT_RADIUS).toFixed(0);

		js_globals.CONST_DEFAULT_ALTITUDE_min = js_globals.CONST_DEFAULT_ALTITUDE_min * js_helpers.CONST_METER_TO_FEET;
		js_globals.CONST_DEFAULT_RADIUS_min = js_globals.CONST_DEFAULT_RADIUS_min * js_helpers.CONST_METER_TO_FEET;

		js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = (js_helpers.CONST_METER_TO_FEET * js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE).toFixed(0);
		js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = (js_helpers.CONST_METER_TO_FEET * js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE).toFixed(0);

		js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN = js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN * js_helpers.CONST_METER_TO_FEET;
		js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN = js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN * js_helpers.CONST_METER_TO_FEET;
	}
	else {
		if (dontflip !== true) js_globals.v_useMetricSystem = true;

		js_localStorage.fn_setMetricSystem(true);
		js_globals.CONST_DEFAULT_ALTITUDE = (js_helpers.CONST_FEET_TO_METER * js_globals.CONST_DEFAULT_ALTITUDE).toFixed(1);
		js_globals.CONST_DEFAULT_RADIUS = (js_helpers.CONST_FEET_TO_METER * js_globals.CONST_DEFAULT_RADIUS).toFixed(1);

		js_globals.CONST_DEFAULT_ALTITUDE_min = js_globals.CONST_DEFAULT_ALTITUDE_min * js_helpers.CONST_FEET_TO_METER;
		js_globals.CONST_DEFAULT_RADIUS_min = js_globals.CONST_DEFAULT_RADIUS_min * js_helpers.CONST_FEET_TO_METER;

		js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = (js_helpers.CONST_FEET_TO_METER * js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE).toFixed(1);
		js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = (js_helpers.CONST_FEET_TO_METER * js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE).toFixed(1);

		js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN = js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN * js_helpers.CONST_FEET_TO_METER;
		js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN = js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN * js_helpers.CONST_FEET_TO_METER;
	}
	js_localStorage.fn_setDefaultAltitude(js_globals.CONST_DEFAULT_ALTITUDE);
	js_localStorage.fn_setDefaultRadius(js_globals.CONST_DEFAULT_RADIUS);
	
	// Dispatch event to notify components of unit system change
	js_eventEmitter.fn_dispatch('EE_UnitSystemChanged', { isMetric: js_globals.v_useMetricSystem });
};

export function fn_convertToMeter(value) {
	if (isNaN(value)) return 0;
	if (js_localStorage.fn_getMetricSystem() === true) {
		return value;
	}
	else {
		return value * js_helpers.CONST_FEET_TO_METER;
	}
};

function gui_initGlobalSection() {
	// REACT
	$("#yaw_knob").dial({
		fgColor: "#3671AB"
		, bgColor: "#36AB36"
		, thickness: .3
		, cursor: 10
		, displayPrevious: true
	})
		.css({ display: 'inline', padding: '0px 10px' });

	// unsolved: https://stackoverflow.com/questions/39152877/consider-marking-event-handler-as-passive-to-make-the-page-more-responsive
	$("#yaw_knob").knob({
		'change': function () {
			// Your change event handler code
		},
		'mousewheel': function (event) {
			event.preventDefault();
		},
		'touchstart': function (event) {
			event.preventDefault();
		},
	}, {
		'passive': true // Add the passive option to make the event listeners passive
	});



	$('#andruavUnitGlobals').hide();


};

function fn_setLapout() {
	if ((QueryString.displaymode !== null && QueryString.displaymode !== undefined) || (parseInt(QueryString.displaymode))) {
		fn_applyControl(QueryString.displaymode);
	}
	else {
		fn_applyControl(0);
	}
}

function fn_gps_getLocation() {

	function setPosition(position) {

		js_globals.myposition = position;
		if (!(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_ADSB === true)) {
			js_adsbManager.fn_changeDefaultLocation(
				js_globals.myposition.coords.latitude,
				js_globals.myposition.coords.longitude);
		}
		js_leafletmap.fn_PanTo_latlng(
			js_globals.myposition.coords.latitude,
			js_globals.myposition.coords.longitude);

		js_leafletmap.fn_setZoom(8);
	}

	if (QueryString.lat !== null && QueryString.lat !== undefined) {
		js_leafletmap.fn_PanTo_latlng(
			QueryString.lat,
			QueryString.lng);

		js_leafletmap.fn_setZoom(QueryString.zoom);

		return;
	}

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(setPosition, gps_showError);
	} else {
		// "Geolocation is not supported by this browser.";
	}
}

// function fn_gps_showPosition(position) {
// 	var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
// 	map.panTo(latlng);
// 	map.setZoom(8);
// }


function gps_showError(p_error) {

	js_globals.myposition = null;

	// Notify the ADSB manager that geolocation is unavailable so it can
	// fall back to the swarm area (or stop scanning if no drones are online).
	if (!(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_ADSB === true)) {
		js_adsbManager.fn_geolocationDenied();
	}

	switch (p_error.code) {
		case p_error.PERMISSION_DENIED:
			//x.innerHTML = "User denied the request for Geolocation."
			break;
		case p_error.POSITION_UNAVAILABLE:
			//x.innerHTML = "Location information is unavailable."
			break;
		case p_error.TIMEOUT:
			//x.innerHTML = "The request to get user location timed out."
			break;
		case p_error.UNKNOWN_ERROR:
			//x.innerHTML = "An unknown p_error occurred."
			break;
		default:
			break;
	}
}

function saveData(fileURL, fileName) {
	//http://muaz-khan.blogspot.com.eg/2012/10/save-files-on-disk-using-javascript-or.html
	// for non-IE
	if (!window.ActiveXObject) {
		var save = document.createElement('a');
		save.href = fileURL;
		save.target = '_blank';
		save.download = fileName || 'unknown';
		save.click();
	}
}



export function fn_openFenceManager(p_partyID) {
	let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
	if (p_andruavUnit === null || p_andruavUnit === undefined) {
		return;
	}

	window.open('mapeditor?zoom=18&lat=' + p_andruavUnit.m_Nav_Info.p_Location.lat + '&lng=' + p_andruavUnit.m_Nav_Info.p_Location.lng);
	return false;
}

export function fn_switchGPS(p_andruavUnit) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) {
		return;
	}

	js_globals.v_andruavFacade.API_setGPSSource(p_andruavUnit, (p_andruavUnit.m_GPS_Info1.gpsMode + 1) % 3)
}



// eslint-disable-next-line no-unused-vars
function gui_camCtrl(p_partyID) {
	// var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
	// if (p_andruavUnit === null || p_andruavUnit === undefined) {
	// 	return;
	// }

	// $('#modal_ctrl_cam').attr('partyID', p_partyID);
	// $('#modal_ctrl_cam').attr('data-original-title', 'Camera Control - ' + p_andruavUnit.m_unitName);
	// $('#modal_ctrl_cam').show();

}

export function gui_doYAW(p_partyID, p_onApply) {


	let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);

	if (p_andruavUnit === null || p_andruavUnit === undefined) {
		return;
	}

	js_dialogs.fn_showYaw(p_andruavUnit, p_onApply);
}


export function fn_doCircle2(p_partyID, latitude, longitude, altitude, radius, turns) {

	let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;
	if ((p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_ROVER)
		|| (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_BOAT)) return;

	function fn_doCircle2_prv() {
		js_speak.fn_speak('point recieved');
		js_globals.v_andruavFacade.API_do_CircleHere(p_partyID, latitude, longitude, altitude, radius, turns);
	}

	fn_doCircle2_prv(p_partyID);
}


export function fn_doSetHome(p_partyID, p_latitude, p_longitude, p_altitude) {

	let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
	if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
		fn_do_modal_confirmation("Set Home Location for  " + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT,
			"Changing Home Location changes RTL destination. Are you Sure?", function (p_approved) {
				if (p_approved === false) return;
				js_speak.fn_speak('home sent');
				js_globals.v_andruavFacade.API_do_SetHomeLocation(p_partyID, p_latitude, p_longitude, p_altitude);

			}, "YES");
	}
}

export function fn_doFlyHere(p_partyID, p_latitude, p_longitude, altitude) {
	let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
	if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
		js_speak.fn_speak('point recieved');
		js_globals.v_andruavFacade.API_do_FlyHere(p_partyID, p_latitude, p_longitude, altitude);
	}
}


export function fn_doStartMissionFrom(p_partyID, p_missionNumber) {
	let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
	if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
		js_speak.fn_speak(String(p_missionNumber) + ' is a start point');
		js_globals.v_andruavFacade.API_do_StartMissionFrom(p_andruavUnit, p_missionNumber);
	}
}

/**
   Goto Unit on map
**/

export function fn_gotoUnit_byPartyID(p_partyID) {
	const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	fn_gotoUnit(p_andruavUnit);

	js_globals.v_andruavFacade.API_do_GetHomeLocation(p_andruavUnit);
}

export function fn_gotoUnit(p_andruavUnit) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	const layers = js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID());
	let marker = layers?.m_marker;
	if (marker !== null && marker !== undefined) {
		const mapAdapter = (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;
		const v_loc = marker.getLatLng()
		mapAdapter.fn_PanTo_latlng(v_loc.lat, v_loc.lng);
		// commented because zoom need to be after pan is completed otherwise map pans to wrong location.
		// if (js_leafletmap.fn_getZoom() < 16) {
		// 	js_leafletmap.fn_setZoom(17);
		// }
	}
}

export function fn_helpPage(p_url) {
	window.open(p_url, '_blank');
}

export function fn_changeUnitInfo(p_andruavUnit) {
	if ((js_siteConfig.CONST_FEATURE.hasOwnProperty('DISABLE_UNIT_NAMING')) && (js_siteConfig.CONST_FEATURE.DISABLE_UNIT_NAMING === true)) return;

	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	js_dialogs.fn_showUnitInfo(p_andruavUnit);
}

export function fn_changeAltitude(p_andruavUnit, p_onApply) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	let v_altitude_val = p_andruavUnit.m_Nav_Info.p_Location.alt_relative != null ? (p_andruavUnit.m_Nav_Info.p_Location.alt_relative).toFixed(1) : 0;
	if (v_altitude_val < js_globals.CONST_DEFAULT_ALTITUDE_min) {
		v_altitude_val = fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()).toFixed(1);
	}

	if (js_globals.v_useMetricSystem === false) {
		v_altitude_val = (v_altitude_val * js_helpers.CONST_METER_TO_FEET).toFixed(1);
	}

	const applyCallback = (p_unit, p_value) => {
		let v_alt = p_value;
		if (v_alt === '' || v_alt === undefined || isNaN(v_alt)) return;
		if (js_globals.v_useMetricSystem === false) {
			v_alt = (parseFloat(v_alt) * js_helpers.CONST_FEET_TO_METER).toFixed(1);
		}
		let v_alt_cmd;
		if (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE) {
			v_alt_cmd = -v_alt;
		}
		else {
			v_alt_cmd = v_alt;
		}
		if (typeof p_onApply === 'function') {
			p_onApply(p_andruavUnit, parseFloat(v_alt_cmd));
		}
		else {
			js_globals.v_andruavFacade.API_do_ChangeAltitude(p_andruavUnit, v_alt_cmd);
		}
	};

	js_dialogs.fn_showAltitude({
		p_andruavUnit: p_andruavUnit,
		p_onApply: applyCallback
	});
}

/**
 Open Change Speed Modal
**/
export function fn_changeSpeed(p_andruavUnit, p_initSpeed, p_onApply) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	let v_speed_val = p_initSpeed;
	if (v_speed_val === null || v_speed_val === undefined) {
		const ground_speed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
		if (ground_speed !== null && ground_speed !== undefined) {
			v_speed_val = parseFloat(ground_speed);
		}
		else {
			v_speed_val = 0;
		}
	}

	if (v_speed_val === null || v_speed_val === undefined) {
		return;
	}

	if (js_globals.v_useMetricSystem === true) {
		v_speed_val = v_speed_val.toFixed(1);
	}
	else {
		v_speed_val = (v_speed_val * js_helpers.CONST_METER_TO_MILE).toFixed(1);
	}

	const applyCallback = (p_unit, p_value) => {
		let v_speed = p_value;
		if (v_speed === '' || v_speed === undefined || isNaN(v_speed)) return;
		if (js_globals.v_useMetricSystem === false) {
			v_speed = parseFloat(v_speed) * js_helpers.CONST_MILE_TO_METER;
		}
		const v_speed_cmd = parseFloat(v_speed);
		p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed = v_speed_cmd;
		if (typeof p_onApply === 'function') {
			p_onApply(p_andruavUnit, v_speed_cmd);
		}
		else {
			js_globals.v_andruavFacade.API_do_ChangeSpeed2(p_andruavUnit, v_speed_cmd);
		}
	};

	js_dialogs.fn_showSpeed({
		p_andruavUnit: p_andruavUnit,
		p_initValue: v_speed_val,
		p_onApply: applyCallback,
		p_dialogType: 'speed'
	});
}

export function fn_changeUDPPort(p_andruavUnit, init_pot) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	let v_port_val = init_pot;
	if (v_port_val === null || v_port_val === undefined) {
		v_port_val = p_andruavUnit.m_Telemetry.m_udpProxy_port;
	}

	const applyCallback = (p_unit, p_value) => {
		let v_port_val = p_value;
		if (v_port_val === '' || v_port_val === undefined || isNaN(v_port_val) || v_port_val >= 0xffff) return;
		js_globals.v_andruavFacade.API_setUdpProxyClientPort(p_andruavUnit, parseInt(v_port_val));
	};

	js_dialogs.fn_showSpeed({
		p_andruavUnit: p_andruavUnit,
		p_initValue: v_port_val,
		p_onApply: applyCallback,
		p_dialogType: 'port'
	});
}

/**
   Switch Video OnOff
*/
export function toggleVideo(p_andruavUnit) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;
	fn_retreiveCamerasList(p_andruavUnit);
}


function fn_retreiveCamerasList(p_andruavUnit) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	function fn_callback(p_session) {
		if ((p_session !== null && p_session !== undefined) && (p_session.status === 'connected')) {
			if ((p_session.m_unit.fn_getIsDE() === false) && (p_session.m_unit.m_Video.m_videoTracks.length < 2)) {
				fn_VIDEO_login(p_session, p_session.m_unit.m_Video.m_videoTracks[0].id);
				return;
			}
			else {
				js_dialogs.fn_showStream(p_session);
			}
		}
	}

	js_globals.v_andruavFacade.API_requestCameraList(p_andruavUnit, fn_callback);
}


/**
   Switch Video OnOff
*/
export function toggleRecrodingVideo(p_andruavUnit) {

	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	function fn_callback(p_session) {
		if ((p_session !== null && p_session !== undefined) && (p_session.status === 'connected')) {

			if ((p_session.m_unit.fn_getIsDE() === false) && (p_session.m_unit.m_Video.m_videoTracks.length < 2)) {
				// backward compatibility ANdruav style.
				fn_VIDEO_Record(p_session, p_session.m_unit.m_Video.m_videoTracks[0].id, (p_session.m_unit.m_Video.m_videoTracks[0].r !== true));
				return;
			}
			else {
				js_dialogs.fn_showStream(p_session);
			}
		}
	}

	js_globals.v_andruavFacade.API_requestCameraList(p_andruavUnit, fn_callback);
}


/**
   return should be good & bad in the same time for different fences.
*/
export function fn_isBadFencing(p_andruavUnit) {
	// !TODO CREATE A CONTROL.

	if (js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) return 0b00;

	const keys = js_geoFenceRegistry.fn_keys();
	const size = js_geoFenceRegistry.fn_size();

	/*
		bit 0: out of green zone
		bit 1: in bad zone
		bit 2: in good zone
	*/
	let v_res = 0b00; // bit 1 is good & bit 0 is for bad
	for (let i = 0; i < size; ++i) {
		let fence = js_geoFenceRegistry.fn_get(keys[i]);

		if ((fence.Units !== null && fence.Units !== undefined) && (fence.Units.hasOwnProperty(p_andruavUnit.getPartyID()))) {
			let geoFenceHitInfo = fence.Units[p_andruavUnit.getPartyID()].geoFenceHitInfo;
			if (geoFenceHitInfo !== null && geoFenceHitInfo !== undefined) {

				if (geoFenceHitInfo.hasValue === true) {
					if (geoFenceHitInfo.m_inZone && geoFenceHitInfo.m_shouldKeepOutside) {
						// violation
						v_res = v_res | 0b010; //bad
					}
					if (geoFenceHitInfo.m_inZone && !geoFenceHitInfo.m_shouldKeepOutside) {  // this is diddferent than commented one ... if in zone & should be m_inZone then ok
						// no Violation
						v_res = v_res | 0b100; // good
					}
					if (!geoFenceHitInfo.m_inZone && !geoFenceHitInfo.m_shouldKeepOutside) {  // this is diddferent than commented one ... if in zone & should be m_inZone then ok
						// no Violation
						v_res = v_res | 0b001; // not in greed zone   
					}
				}
				else {

					if (geoFenceHitInfo.m_shouldKeepOutside === true) {
						// because no HIT Event is sent when Drone is away of a Restricted Area.
						// it is only send when it cross it in or out or being in at first.
						// for green area a hit command is sent when being out for every green area.
						v_res = v_res | 0b100;
					}
				}
			}
		}
	}
	return v_res;
}

function deleteWayPointsofDrone(p_andruavUnit, p_wayPointArray) {
	gui_hideOldWayPointOfDrone(p_andruavUnit);
	p_andruavUnit.m_wayPoint = {};
	p_andruavUnit.m_wayPoint.wayPointPath = p_wayPointArray;
	const layers = js_unitLayerRegistry.fn_getOrCreate(p_andruavUnit.getPartyID());
	layers.m_wayPoint_markers = [];
	layers.m_wayPoint_polygons = [];
}

/***
* Hide but does not delete 
***/
function gui_hideOldWayPointOfDrone(p_andruavUnit) {
	if (p_andruavUnit.m_wayPoint === null || p_andruavUnit.m_wayPoint === undefined) return;
	const layers = js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID());
	const markers = layers?.m_wayPoint_markers;
	if (markers === null || markers === undefined) return;

	let count = markers.length;
	for (let i = 0; i < count; i++) {
		const marker = markers[i];
		js_leafletmap.fn_hideItem(marker);
	}

	const polygons = layers?.m_wayPoint_polygons;
	if (polygons !== null && polygons !== undefined) {
		count = polygons.length;
		for (let i = 0; i < count; i++) {
			const polygon = polygons[i];
			js_leafletmap.fn_hideItem(polygon);
		}
	}

	const polylines = p_andruavUnit.m_wayPoint.polylines;
	if (polylines !== null && polylines !== undefined) {
		js_leafletmap.fn_hideItem(p_andruavUnit.m_wayPoint.polylines);
		//p_andruavUnit.m_wayPoint.polylines.setMap(null);
	}

	// Mirror the clear on the 3D map (markers, elevated path, loiter rings).
	js_map3d.fn_clearMissionWaypoints(p_andruavUnit);
}
// eslint-disable-next-line no-unused-vars
function gui_setVisibleMarkersByVehicleType(vehicleType, visible) {
	// fn_getUnitKeys() returns undefined once v_andruavClient is cleared
	// (e.g. on logout); guard so the loop does not crash.
	const keys = (js_globals.m_andruavUnitList && js_globals.m_andruavUnitList.fn_getUnitKeys()) || [];
	const size = keys.length;

	for (let i = 0; i < size; ++i) {

		let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(keys[i]);
		if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
			if (p_andruavUnit.m_VehicleType === vehicleType) {
				const marker = js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID())?.m_marker;
				if (marker !== null && marker !== undefined) {
					marker.setVisible(visible);
				}
			}
		}
	}
}


export function hlp_getFlightMode(p_andruavUnit) {
	//These are Andruav flight modes not Ardupilot flight modes. They are mapped in mavlink plugin
	let text = "undefined";
	if (p_andruavUnit.m_flightMode !== null && p_andruavUnit.m_flightMode !== undefined) {
		switch (p_andruavUnit.m_flightMode) {
			case js_andruavUnit.CONST_FLIGHT_CONTROL_RTL:
				text = "RTL";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_SMART_RTL:
				text = "Smart RTL";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_FOLLOW_ME:
				text = "Follow Me";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_FOLLOW_UNITED:
				text = "Follow Me";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO:
				text = "Auto";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_STABILIZE:
				text = "Stabilize";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_ALT_HOLD:
				text = "Alt-H";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_MANUAL:
				text = "Manual";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_ACRO:
				text = "Acro";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_TAKEOFF:
				text = "Takeoff";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED:
				text = "Guided";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED_NO_GPS:
				text = "Guided-NG";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_LOITER:
				text = "Loiter";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_POSTION_HOLD:
				text = "Pos-Hold";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_LAND:
				text = "Land";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_CIRCLE:
				text = "Circle";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_CRUISE:
				text = "Cruise";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_FBWA:
				text = "FBW A";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_FBWB:
				text = "FBW B";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE:
				text = "Brake";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_HOLD:
				text = "Hold";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_SURFACE:
				text = "Surface";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_QHOVER:
				text = "QHover";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_QLOITER:
				text = "QLoiter";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_QSTABILIZE:
				text = "QStabilize";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_QLAND:
				text = "QLand";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_QRTL:
				text = "QRTL";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_INITIALIZE:
				text = "Initializing";
				break;
			case js_andruavUnit.CONST_FLIGHT_MOTOR_DETECT:
				text = "Motor Detect";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_MANUAL:
				text = "Manual";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_ALT_HOLD:
				text = "Alt-Hold";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_TAKEOFF:
				text = "Takeoff";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_MISSION:
				text = "Mission";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD:
				text = "Hold";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_RTL:
				text = "RTL";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_LAND:
				text = "Land";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_FOLLOW_TARGET:
				text = "Follow";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_PRECLAND:
				text = "Precland";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_VTOL_TAKEOFF:
				text = "VT-Takeoff";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_ACRO:
				text = "Acro";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_STABILIZE:
				text = "Stabilize";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_OFF_BOARD:
				text = "Off-Board";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_RATTITUDE:
				text = "R-ATT";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_POSCTL_POSCTL:
				text = "Pos-Ctrl";
				break;
			case js_andruavUnit.CONST_FLIGHT_PX4_POSCTL_ORBIT:
				text = "Orbit";
				break;
			case js_andruavUnit.CONST_FLIGHT_CONTROL_UNKNOWN:
			default:
				text = "Unknown";
				break;
		}
	}
	return i18n.t(`general:fightMode.${text.toLowerCase()}`, { defaultValue: text });
}


// eslint-disable-next-line no-unused-vars
function hlp_generateFlyHereMenu(lat, lng) {

	return "<div id='context_menu_here' class='margin_zero padding_zero row'/>";
}


function fn_generateContextMenuHTML(v_lat, v_lng) {
	if (v_context_busy === true) return;

	const mapAdapter = (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;

	v_context_busy = true;
	// Create a temporary container for the popup content
	const tempContainer = document.createElement('div');

	const root = ReactDOM.createRoot(tempContainer);
	root.render(
		<ClssMainContextMenu
			p_lat={v_lat}
			p_lng={v_lng}
			OnComplete={() => {

				// Create a DIV in leaflet popup 
				const htmlContent = tempContainer.innerHTML;

				// REACT POPUP LIMITATION: This creates static HTML content
				// Interactive React elements (links, buttons, events) will not work
				// See documentation in fn_generateContextMenuHTML_MainUnitPopup for details
				info_unit_context_popup = mapAdapter.fn_showInfoWindow(null, htmlContent, v_lat, v_lng);

				// now add your div that contains ReactDOM to it.
				info_unit_context_popup = mapAdapter.fn_bindPopup(info_unit_context_popup, tempContainer, v_lat, v_lng);

				// now your ReactDom div is under the active popup

				info_unit_context_popup.on('remove', function () {
					info_unit_context_popup = null;
					tempContainer.remove();
				});
				v_context_busy = false;
			}}
		/>
	);
}

function fn_generateContextMenuHTML_MissionItem(v_lat, v_lng, p_wayPointStep, p_andruavUnit) {
	if (v_context_busy === true) return;

	const mapAdapter = (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;

	v_context_busy = true;
	// Create a temporary container for the popup content
	const tempContainer = document.createElement('div');

	const root = ReactDOM.createRoot(tempContainer);
	root.render(
		<ClssWaypointStepContextMenu
			p_unit={p_andruavUnit}
			p_waypoint={p_wayPointStep}
			p_lat={v_lat} p_lng={v_lng}
			OnComplete={() => {

				// Create a DIV in leaflet popup 
				const htmlContent = tempContainer.innerHTML;

				// REACT POPUP LIMITATION: This creates static HTML content
				// Interactive React elements (links, buttons, events) will not work
				// See documentation in fn_generateContextMenuHTML_MainUnitPopup for details
				info_unit_context_popup = mapAdapter.fn_showInfoWindow(null, htmlContent, v_lat, v_lng);

				// now add your div that contains ReactDOM to it.
				info_unit_context_popup = mapAdapter.fn_bindPopup(info_unit_context_popup, tempContainer, v_lat, v_lng);

				// now your ReactDom div is under the active popup

				info_unit_context_popup.on('remove', function () {
					info_unit_context_popup = null;
					tempContainer.remove();
				});
				v_context_busy = false;
			}}
		/>
	);
}



function fn_generateContextMenuHTML_MainUnitPopup(v_lat, v_lng, v_andruavUnit, v_ignore) {


	if (v_context_busy === true) return;

	const mapAdapter = (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;

	v_context_busy = true;
	// Create a temporary container for the popup content
	const tempContainer = document.createElement('div');


	const root = ReactDOM.createRoot(tempContainer);
	root.render(
		<ClssMainUnitPopup
			p_unit={v_andruavUnit}
			p_lat={v_lat}
			p_lng={v_lng}

			OnComplete={() => {
				// Step 3: Extract the HTML
				const htmlContent = tempContainer.innerHTML;

				// IMPORTANT: React popup limitation
				// This approach creates a static HTML snapshot for Leaflet popups.
				// - React event handlers and interactive elements will NOT work after tempContainer.remove()
				// - Links, buttons, and other interactive elements become non-functional
				// - This is intentional for display-only popups to avoid React/Leaflet integration complexity
				// 
				// FUTURE: If interactive popups are needed, consider:
				// 1. Using Leaflet's popupopen/popupclose events to mount/unmount React components
				// 2. Implementing a React portal system for Leaflet popups
				// 3. Using a React-Leaflet integration library
				//
				// Current limitation documented: Static popup content only
				tempContainer.remove();  // the HTML is not linked to REACT object anymore so links will not be working.

				info_unit_context_popup = mapAdapter.fn_showInfoWindow(null, htmlContent, v_lat, v_lng);
				if (v_ignore === true) {
					info_unit_context_popup.m_ignoreMouseOut = true;
				}
				info_unit_context_popup.on('remove', function () {
					info_unit_context_popup = null;
				});
				v_context_busy = false;
			}}
		/>
	);

}



export function fn_contextMenu(p_position) {
	// use JS Dom methods to create the menu
	// use event.pixel.x and event.pixel.y
	// to position menu at mouse position

	if (js_globals.m_markGuided !== null && js_globals.m_markGuided !== undefined) {
		js_leafletmap.fn_hideItem(js_globals.m_markGuided);
		js_globals.m_markGuided = null;
	}

	js_globals.m_markGuided = js_leafletmap.fn_CreateMarker('/images/waypoint_bg_32x32.png', 'target', [16, 32], true, true);
	js_leafletmap.fn_setPosition(js_globals.m_markGuided, p_position);

	js_leafletmap.fn_addListenerOnClickMarker(js_globals.m_markGuided,

		function (p_lat, p_lng) {

			fn_generateContextMenuHTML(p_lat, p_lng);
		});

	//fn_generateContextMenuHTML(js_leafletmap.fn_getLocationObjectBy_latlng(p_lat, p_lng));
};

/////////////////////////////////////////////////////////////////////////////// MAP Functions
var infowindow = null;
function initMap() {
	try {
		js_leafletmap.fn_initMap('mapid');
		if (document.getElementById('mapid3d')) {
			// fn_initMap is async (loads Mapbox SDK from CDN, then creates the
			// Map). Don't await it — fn_setLapout/fn_gps_getLocation below must
			// run immediately so the 2D map and ADSB geolocation aren't blocked
			// by the 3D map's CDN load. Catch async rejections so they don't
			// surface as unhandled Promise rejections.
			js_map3d.fn_initMap('mapid3d').catch((e) => {
				console.warn('[map3d] fn_initMap failed:', e);
			});
			js_map3d.fn_addListenerOnDblClickMap(fn_onMap3dDblClick);
			// Clicking the map background deselects the highlighted ADSB aircraft.
			js_map3d.fn_addListenerOnMapClick(fn_clearAdsbMap3dSelection);
		}
		fn_setLapout();
		fn_gps_getLocation();
	}
	catch (e) {
		console.error('[initMap] failed — js_leafletmap.m_Map is', js_leafletmap.m_Map, e);
	}

};


// eslint-disable-next-line no-unused-vars
function resetzoom() {
	js_leafletmap.setZoom(2);
}

/////////////////////////////////////////////////////////////////////////////// Events from AndruavClientParser

// Websocket Connection established
var EVT_onOpen = function () {
	$('#andruavUnitGlobals').show();

	js_globals.v_connectRetries = 0;
}

// called when Websocket Closed
var EVT_onClose = function () {


	if (js_globals.v_andruavWS !== null && js_globals.v_andruavWS !== undefined) {
		js_globals.v_andruavWS.fn_disconnect();
		js_globals.v_andruavWS = null;
	}

	if (js_globals.v_connectState === true) {

		js_globals.v_connectRetries += 1;
		if (js_globals.v_connectRetries >= 5) {
			js_speak.fn_speak('Disconnected');
		}
		setTimeout(fn_connect, 4000);
	}
	else {
		js_speak.fn_speak('Disconnected');
	}
};



function fn_onSocketStatus(me, event) {
	const status = event.status;
	js_eventEmitter.fn_dispatch(js_event.EE_onSocketStatus, event);

	if (status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
		js_speak.fn_speak('Connected');

		if (js_globals.CONST_MAP_EDITOR === true) {
			js_globals.v_andruavFacade.API_loadGeoFence(js_andruavAuth.m_username, js_globals.v_andruavWS.m_groupName, null, '_drone_', 1);
		}
	}
	else {
		// no-op
	}
};

export function fn_requestWayPoints(p_andruavUnit, fromFCB) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;
	js_globals.v_andruavFacade.API_do_GetHomeLocation(p_andruavUnit);
	js_globals.v_andruavFacade.API_requestWayPoints(p_andruavUnit, fromFCB);
	js_globals.v_andruavFacade.API_requestGeoFencesAttachStatus(p_andruavUnit);
}

export function fn_clearWayPoints(p_andruavUnit) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	fn_do_modal_confirmation("Delete Mission for " + p_andruavUnit.m_unitName,
		"Are you sure you want to delete mission & geo-fences", function (p_approved) {
			if (p_approved === false) return;
			js_globals.v_andruavFacade.API_requestDeleteWayPoints(p_andruavUnit);
			js_globals.v_andruavFacade.API_requestDeleteFenceByName(p_andruavUnit);
		}, "YES", "bg-danger text-white");
}


export function fn_readMissionFile(p_mission, p_andruavUnit) {
	if (p_mission === null || p_mission === undefined) return;

	if (!selectedMissionFilesToRead.length) {
		fn_do_modal_alert(null, 'Please select a file!');
		return;
	}

	const file = selectedMissionFilesToRead[0];


	const is_de_file = (file.name.indexOf(v_mission_file_extension) !== -1);
	const reader = new FileReader();

	// If we use onloadend, we need to check the readyState.
	reader.onloadend = function (evt) {
		if (evt.target.readyState === FileReader.DONE) { // DONE == 2
			try {
				const plan_text = new TextDecoder("utf-8").decode(evt.target.result); // Convert to string
				if (is_de_file === true) {
					p_mission.fn_importAsDE_V1(p_andruavUnit, JSON.parse(plan_text));
				}
				else {
					fn_do_modal_alert(null, 'Please select a valid file!');
				}

			}
			catch (e) {
				fn_do_modal_alert(null, 'Please select a valid file!');
			}

		}
	};

	if (js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) return;

	reader.readAsArrayBuffer(file);
}

/**
 * 
 * @param {*} p_me 
 * @param {*} p_data [unit, bool(erase_first)]
 */
export function fn_putWayPoints(p_andruavUnit, p_erase_first) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	fn_do_modal_confirmation("Upload Mission for " + p_andruavUnit.m_unitName,
		"Are you sure you want to upload mission?", function (p_approved) {
			if (p_approved === false) return;
			fn_putWayPoints_direct(p_andruavUnit, p_erase_first, selectedMissionFilesToWrite);

		}, "YES", "bg-danger text-white");

}

export function fn_putWayPoints_direct(p_andruavUnit, p_eraseFirst, p_files) {

	if (p_andruavUnit === null || p_andruavUnit === undefined) return;

	if (!p_files.length) {
		fn_do_modal_alert(null, 'Please select a file!');
		return;
	}

	const file = p_files[0];

	const is_de_file = (file.name.indexOf(v_mission_file_extension) !== -1);
	const reader = new FileReader();

	// If we use onloadend, we need to check the readyState.
	reader.onloadend = function (evt) {
		if (evt.target.readyState === FileReader.DONE) { // DONE == 2
			try {
				const plan_text = new TextDecoder("utf-8").decode(evt.target.result); // Convert to string
				if (is_de_file === true) {
					js_globals.v_andruavFacade.API_uploadDEMission(p_andruavUnit, p_eraseFirst, JSON.parse(plan_text));
				}
				else {
					js_globals.v_andruavFacade.API_uploadWayPoints(p_andruavUnit, p_eraseFirst, plan_text);
				}

			}
			catch {
				//TODO:  failed to upload Mission
			}

		}
	};

	if (js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) return;

	reader.readAsArrayBuffer(file);
}


var EVT_onDeleted = function () {
	js_globals.v_andruavWS.fn_disconnect();
	js_globals.v_andruavClient = null;
	js_globals.v_andruavFacade = null;
	js_globals.v_andruavWS = null;

};



var EVT_msgFromUnit_WayPointsUpdated = function (me, data) {

	// Live update is not allowed in Map Editor
	if (js_globals.CONST_MAP_EDITOR === true) return;

	const p_andruavUnit = data.unit;
	const missionIndexReached = data.mir;
	const status = data.status;

	if (p_andruavUnit.m_wayPoint === null || p_andruavUnit.m_wayPoint === undefined) {
		//no waypoint attached ... send asking for update
		js_globals.v_andruavFacade.API_requestWayPoints(p_andruavUnit);

		return;
	}

	const layers_wp = js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID());
	if (layers_wp?.m_wayPoint_markers !== null && layers_wp?.m_wayPoint_markers !== undefined) {
		const c_mission_index = missionIndexReached;
		var v_marker = layers_wp.m_wayPoint_markers[c_mission_index];
		if (v_marker !== null && v_marker !== undefined) {
			v_marker.waypoint_status = status;
			if ((p_andruavUnit.m_wayPoint.wayPointPath[c_mission_index] === js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_TRIGGER)
				|| (p_andruavUnit.m_wayPoint.wayPointPath[c_mission_index] === js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_CONTROL)) {
				switch (status) {
					case js_andruavMessages.CONST_Report_NAV_ItemReached:
						js_leafletmap.fn_setVehicleIcon(v_marker, '/images/camera_24x24.png', null, null, false, false, null, [16, 16]);
						break;
					case js_andruavMessages.CONST_Report_NAV_ItemUnknown:
						js_leafletmap.fn_setVehicleIcon(v_marker, '/images/camera_gy_32x32.png', null, null, false, false, null, [16, 16]);
						break;
					case js_andruavMessages.CONST_Report_NAV_ItemExecuting:
						js_leafletmap.fn_setVehicleIcon(v_marker, '/images/camera_bg_32x32.png', null, null, false, false, null, [16, 16]);
						break;
					default:
						break;
				}
			}
			else {
				switch (status) {
					case js_andruavMessages.CONST_Report_NAV_ItemReached:
						p_andruavUnit.m_Nav_Info._Target.wp_num = c_mission_index + 1;
						js_leafletmap.fn_setVehicleIcon(v_marker, '/images/location_gy_32x32.png', null, [16, 24], false, false, null, [32, 32]);
						break;
					case js_andruavMessages.CONST_Report_NAV_ItemUnknown:
						js_leafletmap.fn_setVehicleIcon(v_marker, '/images/location_bb_32x32.png', null, [16, 24], false, false, null, [32, 32]);
						break;
					case js_andruavMessages.CONST_Report_NAV_ItemExecuting:
						js_leafletmap.fn_setVehicleIcon(v_marker, '/images/location_bg_32x32.png', null, [16, 24], false, false, null, [32, 32]);
						break;
					default:
						break;
				}
			}
		}
	}
}

var EVT_msgFromUnit_WayPoints = function (me, data) {

	// dont upload waypoints in map editor mode. -- for now TEMP
	if (js_globals.CONST_MAP_EDITOR) return;

	const p_andruavUnit = data.unit;
	const wayPointArray = data.wps;


	// TODO HERE >>> DELETE OLD WAYPOINTS AND HIDE THEM FROM MAP
	var LngLatPoints = [];

	deleteWayPointsofDrone(p_andruavUnit, wayPointArray);
	const layers = js_unitLayerRegistry.fn_getOrCreate(p_andruavUnit.getPartyID());

	if (wayPointArray.length === 0) return;
	let latlng = null;
	for (let i = 0; i < wayPointArray.length; ++i) {
		let subIcon = false;
		let wayPointStep = wayPointArray[i];
		let icon_img = '/images/location_bb_32x32.png';
		switch (wayPointStep.waypointType) {
			case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
				latlng = js_leafletmap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
				icon_img = '/images/location_bb_32x32.png';
				wayPointStep.m_label = "WP";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_SPLINE:
				latlng = js_leafletmap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
				icon_img = '/images/location_bb_32x32.png';
				wayPointStep.m_label = "Spline";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
				wayPointStep.m_label = "Takeoff";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
				wayPointStep.m_label = "Land";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_GUIDED:
				wayPointStep.m_label = "Guided";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
				wayPointStep.m_label = "RTL";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_TRIGGER:
				latlng = js_leafletmap.fn_getLocationObjectBy_latlng(latlng.lat + 0.00001, latlng.lng + 0.00001);
				icon_img = '/images/camera_gy_32x32.png';
				subIcon = true;
				wayPointStep.m_label = "CAM";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_CONTROL:
				latlng = js_leafletmap.fn_getLocationObjectBy_latlng(latlng.lat + 0.00001, latlng.lng + 0.00001);
				icon_img = '/images/camera_gy_32x32.png';
				subIcon = true;
				wayPointStep.m_label = "CAM";
				break;
			case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
				latlng = js_leafletmap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
				icon_img = '/images/location_bb_32x32.png';
				wayPointStep.m_label = "Loiter in Circles";
				var v_circleMission = js_leafletmap.fn_drawMissionCircle(latlng, wayPointStep.m_Radius);
				// var circleMission = new google.maps.Circle({
				// 	fillColor: '#3232CD',
				// 	strokeOpacity: 1.0,
				// 	strokeWeight: 0,
				// 	map: map,
				// 	fillOpacity: 0.25,
				// 	center: latlng,
				// 	radius: parseInt(wayPointStep.m_Radius)
				// });
				// circleMission.setMap(map);
				layers.m_wayPoint_polygons.push(v_circleMission);
				break;
			default:
				continue;

		}


		if (latlng !== null && latlng !== undefined) {
			let v_iconsize = [32, 32];
			if (subIcon === true) {
				v_iconsize = [16, 16];
			}
			let v_mark = js_leafletmap.fn_CreateMarker(icon_img, p_andruavUnit.m_unitName + "  step: " + wayPointStep.m_Sequence, [16, 24], false, false, null, v_iconsize);
			js_leafletmap.fn_setPosition(v_mark, latlng);
			layers.m_wayPoint_markers.push(v_mark);
			v_mark.wayPointStep = wayPointStep;

			if (js_globals.CONST_MAP_EDITOR) {
				// add to shapes list.
				v_mark.pm.m_shape_type = 'Marker';
				v_mark.on('click', function (p_event) {
					if (p_event.originalEvent.ctrlKey === false) {
						js_eventEmitter.fn_dispatch(js_event.EE_onShapeSelected, p_event.target);
					}
					else {
						js_eventEmitter.fn_dispatch(js_event.EE_onShapeDeleted, p_event);
					}
				});
				js_eventEmitter.fn_dispatch(js_event.EE_onShapeCreated, v_mark)
				js_globals.v_map_shapes.push(v_mark);

			}


			function fn_clickHandler(p_wayPointStep, p_andruavUnit) {
				js_leafletmap.fn_addListenerOnClickMarker(v_mark,
					function (p_lat, p_lng) {
						fn_generateContextMenuHTML_MissionItem(p_lat, p_lng, p_wayPointStep, p_andruavUnit);
					});
			}

			fn_clickHandler(wayPointStep, p_andruavUnit);

			if (subIcon === false) {
				LngLatPoints.push(latlng);
			}
		}


	}

	if (LngLatPoints.length > 0) {
		p_andruavUnit.m_wayPoint.polylines = js_leafletmap.fn_drawMissionPolyline(LngLatPoints, flightPath_colors[p_andruavUnit.m_index % 4]);
	}

	// Mirror the mission on the 3D map (markers + elevated path + loiter rings).
	js_map3d.fn_syncMissionWaypoints(p_andruavUnit, wayPointArray, flightPath_colors[p_andruavUnit.m_index % 4]);
}



function EVT_andruavUnitFCBUpdated(me, p_andruavUnit) {
	if (p_andruavUnit.m_IsGCS === true) {
		return;
	}
	if (p_andruavUnit.m_useFCBIMU === true) {
		js_speak.fn_speak(p_andruavUnit.m_unitName + ' connected to flying board');
	}
	else {
		js_speak.fn_speak(p_andruavUnit.m_unitName + ' disconnected from flying board');
	}
}

function EVT_andruavUnitFlyingUpdated(me, p_andruavUnit) {
	if (p_andruavUnit.m_isFlying === true) {
		js_speak.fn_speak(p_andruavUnit.m_unitName + ' is Flying');
	}
	else {
		js_speak.fn_speak(p_andruavUnit.m_unitName + ' is on ground');
	}
}




function EVT_andruavUnitFightModeUpdated(me, p_andruavUnit) {
	if (p_andruavUnit.m_IsGCS !== true) {
		const text = hlp_getFlightMode(p_andruavUnit);
		js_speak.fn_speak(p_andruavUnit.m_unitName + ' flight mode is ' + text);
	}
}


// eslint-disable-next-line no-unused-vars
function changedeg(element, degree) {
	if (navigator.userAgent.match("Chrome")) {
		element.style.WebkitTransform = "rotate(" + degree + "deg)";
	}
	else if (navigator.userAgent.match("Firefox")) {
		element.style.MozTransform = "rotate(" + degree + "deg)";
	}
	else if (navigator.userAgent.match("MSIE")) {
		element.style.msTransform = "rotate(" + degree + "deg)";
	}
	else if (navigator.userAgent.match("Opera")) {
		element.style.OTransform = "rotate(" + degree + "deg)";
	}
	else {
		element.style.transform = "rotate(" + degree + "deg)";
	}
}

function EVT_andruavUnitVehicleTypeUpdated(me, p_andruavUnit) {
	// The layer registry is keyed by partyID and survives unit recreation,
	// so the marker is no longer lost when fn_resetOnBoardConnection recreates the unit.
	const layers = js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID());
	if (layers?.m_marker === null || layers?.m_marker === undefined) {
		console.warn(`Marker not found for unit ${p_andruavUnit.getPartyID()}, skipping icon update`);
		return;
	}

	const v_htmlTitle = "<p class='text-white margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
	const v_image = getVehicleIcon(p_andruavUnit, (CONST_MAP_GOOLE === true));
	js_leafletmap.fn_setVehicleIcon(layers.m_marker, v_image, p_andruavUnit.m_unitName, null, false, false, v_htmlTitle, [64, 64]);

	const marker3d = js_map3d.fn_getUnitMarker(p_andruavUnit);
	if (marker3d) {
		js_map3d.fn_setMarkerIcon(marker3d, v_image);
	}
}


function EVT_andruavUnitSDRTrigger(me, p_andruavUnit) {
	const detected_signal = p_andruavUnit.m_SDR.getLastDetectedSignal();
	if (detected_signal === null || detected_signal === undefined) return;
	//const v_htmlTitle = "<p class='text-white margin_zero fs-6'>" + detected_signal.frequency + 
	//"</p> <p class='text-white margin_zero fs-6'>" + detected_signal.signal_value + "</p>";
	const v_marker = js_leafletmap.fn_CreateMarker('/images/signal_r_32.png', 'image');
	const latlng = js_leafletmap.fn_getLocationObjectBy_latlng(detected_signal.latitude, detected_signal.longitude);
	js_leafletmap.fn_setPosition(v_marker, latlng);
}


function EVT_andruavUnitArmedUpdated(me, p_andruavUnit) {

	if (p_andruavUnit.m_isArmed) {
		js_speak.fn_speak('ARMED');
	}
	else {
		js_speak.fn_speak('Disarmed');
	}

	js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, p_andruavUnit);
}


function getDestinationPointIcon(p_andruavUnit) {
	const c_point_type = p_andruavUnit.m_Geo_Tags.p_DestinationPoint.type;
	const c_vehicle_index = p_andruavUnit.m_index % 4;
	switch (c_point_type) {
		case js_andruavMessages.CONST_DESTINATION_GUIDED_POINT:
			return '/images/destination_bg_32x32.png';
		case js_andruavMessages.CONST_DESTINATION_SWARM_MY_LOCATION:
			{
				switch (p_andruavUnit.m_VehicleType) {
					case js_andruavUnit.VEHICLE_PLANE:
						return swarm_plane_location_icon[c_vehicle_index];
					case js_andruavUnit.VEHICLE_TRI:
					case js_andruavUnit.VEHICLE_QUAD:
					case js_andruavUnit.VEHICLE_VTOL:
					case js_andruavUnit.VEHICLE_ROVER:
					default:
						return swarm_quad_location_icon[c_vehicle_index];
				}
			}
		default:
			break;
	}
}


// eslint-disable-next-line no-unused-vars
export function getVehicleIcon(p_andruavUnit, applyBearing) {
	if (p_andruavUnit === null || p_andruavUnit === undefined) {
		return '/images/drone_3_32x32.png';
	}
	if (p_andruavUnit.m_IsGCS === true) {
		return '/images/map_gcs_3_32x32.png';
	} else {
		switch (p_andruavUnit.m_VehicleType) {
			case js_andruavUnit.VEHICLE_TRI:
				p_andruavUnit.m_VehicleType_TXT = "Tricopter";
				return quad_icon[p_andruavUnit.m_index % 4];
			case js_andruavUnit.VEHICLE_QUAD:
				p_andruavUnit.m_VehicleType_TXT = "Quadcopter";
				return quad_icon[p_andruavUnit.m_index % 4];
			case js_andruavUnit.VEHICLE_VTOL:
				p_andruavUnit.m_VehicleType_TXT = "VTOL Wings";
				return planes_icon[p_andruavUnit.m_index % 4];
			case js_andruavUnit.VEHICLE_PLANE:
				p_andruavUnit.m_VehicleType_TXT = "Fixed Wings";
				return planes_icon[p_andruavUnit.m_index % 4];
			case js_andruavUnit.VEHICLE_HELI:
				p_andruavUnit.m_VehicleType_TXT = "Heli";
				return '/images/heli_1_32x32.png';
			case js_andruavUnit.VEHICLE_ROVER:
				p_andruavUnit.m_VehicleType_TXT = "Rover";
				return rover_icon[p_andruavUnit.m_index % 4];
			case js_andruavUnit.VEHICLE_BOAT:
				p_andruavUnit.m_VehicleType_TXT = "Boat";
				return boat_icon[p_andruavUnit.m_index % 4];
			case js_andruavUnit.VEHICLE_SUBMARINE:
				p_andruavUnit.m_VehicleType_TXT = "Submarine";
				return '/images/submarine_gb_32x32.png';
			case js_andruavUnit.CONTROL_UNIT:
				p_andruavUnit.m_VehicleType_TXT = "Control Unit";
				return '/images/tower_cl_32x32.png';
			default:
				return '/images/drone_3_32x32.png';
		}
	}
}

/**
   Called when message [js_andruavMessages.CONST_TYPE_AndruavMessage_GPS] is received from a UNIT or GCS holding IMU Statistics
 */
function EVT_msgFromUnit_GPS(me, p_andruavUnit) {
	function getLabel() {
		return p_andruavUnit.m_unitName;
	}


	if ((p_andruavUnit.m_defined === true) && (p_andruavUnit.m_Nav_Info.p_Location.lat !== null && p_andruavUnit.m_Nav_Info.p_Location.lat !== undefined)) {

		// The layer registry is keyed by partyID and survives unit recreation,
		// so no repair-block sync is needed here.
		const layers = js_unitLayerRegistry.fn_getOrCreate(p_andruavUnit.getPartyID());
		let marker = layers.m_marker;

		if (!(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_ADSB === true)) {
			js_adsbManager.fn_getADSBDataForUnit(p_andruavUnit);
		}

		let v_image = getVehicleIcon(p_andruavUnit, (CONST_MAP_GOOLE === true));

		if (marker === null || marker === undefined) {
			// create a buffer for flight path
			p_andruavUnit.m_flightPathHistory.fn_flush();
			js_map3d.fn_flushPath(p_andruavUnit);
			layers.m_flightPath_style = {
				color: flightPath_colors[p_andruavUnit.m_index % 4],
				opacity: 0.8,
				weight: 5,
				dashArray: '5, 5'

			};


			/*
				v_htmlTitle: Valid only for Leaflet
			*/
			const v_htmlTitle = "<p class='text-white margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
			// Add new Vehicle
			layers.m_marker = js_leafletmap.fn_CreateMarker(v_image, getLabel(), [32, 32], false, false, v_htmlTitle, [64, 64]);

			js_leafletmap.fn_addListenerOnClickMarker(layers.m_marker,
				function (p_lat, p_lng) {
					v_lastHighlightedUnit = p_andruavUnit;

					js_eventEmitter.fn_dispatch(js_event.EE_unitHighlighted, p_andruavUnit);

					fn_generateContextMenuHTML_MainUnitPopup(p_lat, p_lng, p_andruavUnit, true);


				});

			js_leafletmap.fn_addListenerOnMouseOverMarker(layers.m_marker,
				function (p_lat, p_lng) {

					if (info_unit_context_popup !== null) return;


					let clickTimer = setTimeout(() => {
						fn_generateContextMenuHTML_MainUnitPopup(p_lat, p_lng, p_andruavUnit, false);
					}, 200);

					// pointer is over then register in event mouseOut
					js_leafletmap.fn_addListenerOnMouseOutMarker(layers.m_marker,
						function () {
							// pointer is out then deregister in mouse-out event.
							js_leafletmap.fn_removeListenerOnMouseOutClickMarker(layers.m_marker);
							clearTimeout(clickTimer);
							if ((info_unit_context_popup == null) || (!info_unit_context_popup.hasOwnProperty('m_ignoreMouseOut')) || (info_unit_context_popup.m_ignoreMouseOut !== true)) {
								// hide me if marked hide.
								const mapAdapter = (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;
								mapAdapter.fn_hideInfoWindow(info_unit_context_popup);
								info_unit_context_popup = null;
							}
						});




				});
		}
		else {
			// DRAW path
			if (p_andruavUnit.m_Nav_Info.p_Location.oldlat !== null && p_andruavUnit.m_Nav_Info.p_Location.oldlat !== undefined) {
				const v_distance = js_helpers.fn_calcDistance(
					p_andruavUnit.m_Nav_Info.p_Location.oldlat,
					p_andruavUnit.m_Nav_Info.p_Location.oldlng,
					p_andruavUnit.m_Nav_Info.p_Location.lat,
					p_andruavUnit.m_Nav_Info.p_Location.lng);
				if (v_distance > 1000) {
					p_andruavUnit.m_Nav_Info.p_Location.oldlat = p_andruavUnit.m_Nav_Info.p_Location.lat;
					p_andruavUnit.m_Nav_Info.p_Location.oldlng = p_andruavUnit.m_Nav_Info.p_Location.lng;
					p_andruavUnit.m_Nav_Info.p_Location.oldalt = p_andruavUnit.m_Nav_Info.p_Location.alt_relative;
				}
				else if (v_distance > 10) {
					const v_flightPath = js_leafletmap.fn_DrawPath(
						p_andruavUnit.m_Nav_Info.p_Location.oldlat,
						p_andruavUnit.m_Nav_Info.p_Location.oldlng,
						p_andruavUnit.m_Nav_Info.p_Location.lat,
						p_andruavUnit.m_Nav_Info.p_Location.lng,
						layers.m_flightPath_style);

					// Add flight path step
					p_andruavUnit.m_flightPathHistory.fn_add(v_flightPath, true,
						function (oldstep) {
							js_leafletmap.fn_hideItem(oldstep);
						});


					p_andruavUnit.m_Nav_Info.m_FlightPath.push(v_flightPath);
					// 3D map: plot a dot at the drone's 3D position (lng, lat, alt)
					// so the trajectory is visible as a 3D trail above the terrain.
					js_map3d.fn_DrawPath(
						p_andruavUnit,
						p_andruavUnit.m_Nav_Info.p_Location.lat,
						p_andruavUnit.m_Nav_Info.p_Location.lng,
						p_andruavUnit.m_Nav_Info.p_Location.alt_relative);

					p_andruavUnit.m_Nav_Info.p_Location.oldlat = p_andruavUnit.m_Nav_Info.p_Location.lat;
					p_andruavUnit.m_Nav_Info.p_Location.oldlng = p_andruavUnit.m_Nav_Info.p_Location.lng;
					p_andruavUnit.m_Nav_Info.p_Location.oldalt = p_andruavUnit.m_Nav_Info.p_Location.alt_relative;
				}
			}
			else {
				p_andruavUnit.m_Nav_Info.p_Location.oldlat = p_andruavUnit.m_Nav_Info.p_Location.lat;
				p_andruavUnit.m_Nav_Info.p_Location.oldlng = p_andruavUnit.m_Nav_Info.p_Location.lng;
				p_andruavUnit.m_Nav_Info.p_Location.oldalt = p_andruavUnit.m_Nav_Info.p_Location.alt_relative;
			}


		}

		js_leafletmap.fn_setPosition_bylatlng(layers.m_marker, p_andruavUnit.m_Nav_Info.p_Location.lat, p_andruavUnit.m_Nav_Info.p_Location.lng, p_andruavUnit.m_Nav_Info.p_Orientation.yaw);
		fn_refreshWindArrowPosition();
		const marker3d = js_map3d.fn_syncUnit(p_andruavUnit, v_image);

		if (marker3d && layers.m_marker3d_events_attached !== true) {
			layers.m_marker3d_events_attached = true;

			js_map3d.fn_addListenerOnClickMarker(marker3d,
				function (p_lat, p_lng) {
					v_lastHighlightedUnit = p_andruavUnit;

					js_eventEmitter.fn_dispatch(js_event.EE_unitHighlighted, p_andruavUnit);

					fn_generateContextMenuHTML_MainUnitPopup(p_lat, p_lng, p_andruavUnit, true);


				});

			js_map3d.fn_addListenerOnMouseOverMarker(marker3d,
				function (p_lat, p_lng) {

					if (info_unit_context_popup !== null) return;


					let clickTimer = setTimeout(() => {
						fn_generateContextMenuHTML_MainUnitPopup(p_lat, p_lng, p_andruavUnit, false);
					}, 200);

					// pointer is over then register in event mouseOut
					js_map3d.fn_addListenerOnMouseOutMarker(marker3d,
						function () {
							// pointer is out then deregister in mouse-out event.
							js_map3d.fn_removeListenerOnMouseOutClickMarker(marker3d);
							clearTimeout(clickTimer);
							if ((info_unit_context_popup == null) || (!info_unit_context_popup.hasOwnProperty('m_ignoreMouseOut')) || (info_unit_context_popup.m_ignoreMouseOut !== true)) {
								// hide me if marked hide.
								const mapAdapter = (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;
								mapAdapter.fn_hideInfoWindow(info_unit_context_popup);
								info_unit_context_popup = null;
							}
						});




				});
		}
		js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, p_andruavUnit);
	}
	else {
		// no-op
	}
}


/**
 Called when message [js_andruavMessages.CONST_TYPE_AndruavMessage_IMG] is received from a UNIT or GCS 
*/
function EVT_msgFromUnit_IMG(me, data) { //,p_andruavUnit, bin, description, latitude, logitude, gpsProvider, time, altitude, speed, bearing, accuracy) {

	if (data.img.length > 0) {
		var blob = new Blob([data.img], { type: 'image/jpeg' });


		var reader = new FileReader();
		reader.onload = function (event) {
			var contents = event.target.result;
			$('#unitImg').data('binaryImage', contents);

			// Cleanup the reader object
			reader.abort();
			reader = null;
			return;
		};

		reader.onerror = function (event) {
			console.p_error("File could not be read! Code " + event.target.p_error.code);
		};

		reader.readAsDataURL(blob);

		const imageSrc = 'data:image/jpeg;base64,' + js_helpers.fn_arrayBufferToBase64(data.img);
		js_dialogs.fn_showFpv({ image_src: imageSrc, party_id: data.v_unit ? data.v_unit.getPartyID() : null });
	}

	const latlng = js_leafletmap.fn_getLocationObjectBy_latlng(data.lat, data.lng);
	$('#unitImg').data('imgLocation', latlng);
	fn_showCameraIcon(latlng);
}

function fn_showCameraIcon(latlng) {
	const v_marker = js_leafletmap.fn_CreateMarker('/images/camera_24x24.png', 'image');
	js_leafletmap.fn_setPosition(v_marker, latlng);
}

// eslint-disable-next-line no-unused-vars
function hlp_saveImage_html() {
	const contents = $('#unitImg').data('binaryImage');
	saveData(contents, 'image.jpg');

}


// eslint-disable-next-line no-unused-vars
function hlp_gotoImage_Map() {
	const location = $('#unitImg').data('imgLocation');
	if (location !== null && location !== undefined) {
		// if (js_leafletmap.fn_getZoom() < 14) {
		// 	js_leafletmap.fn_setZoom(14);
		// }

		const mapAdapter = (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;
		mapAdapter.fn_PanTo_latlng(location.lat, location.lng);
	}
}


/**
  Called when a new unit joins the system.
*/
var EVT_andruavUnitAdded = function (me, p_andruavUnit) {
	// if (p_andruavUnit.m_IsGCS === false) {
	// 	js_unitUiPrefs.fn_setUnitPref(p_andruavUnit.getPartyID(), 'defaultHeight', js_globals.CONST_DEFAULT_ALTITUDE);
	// 	js_unitUiPrefs.fn_setUnitPref(p_andruavUnit.getPartyID(), 'defaultCircleRadius', js_globals.CONST_DEFAULT_RADIUS);
	// }

	js_speak.fn_speak(p_andruavUnit.m_unitName + " unit added");

	js_eventEmitter.fn_dispatch(js_event.EE_unitAdded, p_andruavUnit);
}


var EVT_HomePointChanged = function (me, p_andruavUnit) {
	let v_latlng = js_leafletmap.fn_getLocationObjectBy_latlng(p_andruavUnit.m_Geo_Tags.p_HomePoint.lat, p_andruavUnit.m_Geo_Tags.p_HomePoint.lng);

	const layers = js_unitLayerRegistry.fn_getOrCreate(p_andruavUnit.getPartyID());
	if (layers.m_marker_home === null || layers.m_marker_home === undefined) {
		const v_html = "<p class='text-light margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
		let v_home = js_leafletmap.fn_CreateMarker('/images/home_b_24x24.png', p_andruavUnit.m_unitName, [12, 24], false, false, v_html, [24, 24]);

		js_leafletmap.fn_setPosition(v_home, v_latlng)

		// if (p_andruavUnit.m_IsGCS === true) {
		// 	js_leafletmap.fn_createBootStrapIcon (v_home, 'bi bi-c-circle', '#ffff0000', [32, 32]);
		// }

		let v_circleMission = null;
		if (p_andruavUnit.m_Geo_Tags.p_HomePoint.radius_accuracy) {
			const latlng = js_leafletmap.fn_getLocationObjectBy_latlng(p_andruavUnit.m_Geo_Tags.p_HomePoint.lat, p_andruavUnit.m_Geo_Tags.p_HomePoint.lng);

			v_circleMission = js_leafletmap.fn_drawMissionCircle(latlng, p_andruavUnit.m_Geo_Tags.p_HomePoint.radius_accuracy);
		}


		layers.m_marker_home =
		{
			'home_marker': v_home,
			'radius_marker': v_circleMission
		}

		js_leafletmap.fn_addListenerOnClickMarker(v_home,
			function (p_lat, p_lng) {
				setTimeout(function () {

					showAndruavHomePointInfo(p_lat, p_lng, p_andruavUnit);
				}, 300);
			});
	}

	js_leafletmap.fn_setPosition(layers.m_marker_home.home_marker, v_latlng);



};


var EVT_DistinationPointChanged = function (me, p_andruavUnit) {

	const gui = js_unitLayerRegistry.fn_getOrCreate(p_andruavUnit.getPartyID());

	if (((js_siteConfig.CONST_FEATURE.DISABLE_SWARM_DESTINATION_PONTS === true) || (js_localStorage.fn_getAdvancedOptionsEnabled() !== true))
		&& (p_andruavUnit.m_Geo_Tags.p_DestinationPoint.type === js_andruavMessages.CONST_DESTINATION_SWARM_MY_LOCATION)) {

		if (gui.m_marker_destination !== null && gui.m_marker_destination !== undefined) {
			js_leafletmap.fn_hideItem(gui.m_marker_destination);
			gui.m_marker_destination = null;
			p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon = true;
		}
		return;
	}
	let v_latlng = js_leafletmap.fn_getLocationObjectBy_latlng(p_andruavUnit.m_Geo_Tags.p_DestinationPoint.lat, p_andruavUnit.m_Geo_Tags.p_DestinationPoint.lng);

	if (gui.m_marker_destination === null || gui.m_marker_destination === undefined) {
		gui.m_marker_destination = js_leafletmap.fn_CreateMarker('/images/destination_bg_32x32.png', "Target of: " + p_andruavUnit.m_unitName, [16, 32], false, false, "", [32, 32]);
	}

	if (p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon === true) {
		js_leafletmap.fn_setVehicleIcon(gui.m_marker_destination, getDestinationPointIcon(p_andruavUnit), "Target of: " + p_andruavUnit.m_unitName, [16, 32], false, false, p_andruavUnit.m_unitName, [32, 32]);
		p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon = false;
	}


	js_leafletmap.fn_setPosition(gui.m_marker_destination, v_latlng)
};



/**
  Received when a notification sent by remote UNIT.
  It could be p_error, warning or notification.
  *******************
  errorNo 			: 
								// 0	MAV_SEVERITY_EMERGENCY	System is unusable. This is a "panic" condition.
						// 1	MAV_SEVERITY_ALERT	Action should be taken immediately. Indicates p_error in non-critical systems.
						// 2	MAV_SEVERITY_CRITICAL	Action must be taken immediately. Indicates failure in a primary system.
						// 3	MAV_SEVERITY_ERROR	Indicates an p_error in secondary/redundant systems.
						// 4	MAV_SEVERITY_WARNING	Indicates about a possible future p_error if this is not resolved within a given timeframe. Example would be a low battery warning.
						// 5	MAV_SEVERITY_NOTICE	An unusual event has occurred, though not an p_error condition. This should be investigated for the root cause.
						// 6	MAV_SEVERITY_INFO	Normal operational messages. Useful for logging. No action is required for these messages.
						// 7	MAV_SEVERITY_DEBUG	Useful non-operational messages that can assist in debugging. These should not occur during normal operation.

  infoType			:
						  ERROR_CAMERA 	= 1
						  ERROR_BLUETOOTH	= 2
						  ERROR_USBERROR	= 3
						  ERROR_KMLERROR	= 4
  v_notification_Type	:
						  NOTIFICATIONTYPE_ERROR = 1;
						  NOTIFICATIONTYPE_WARNING = 2;
						  NOTIFICATIONTYPE_NORMAL = 3;
						  NOTIFICATIONTYPE_GENERIC = 0;
  Description	'DS		: 
						  Messag
*/
var EVT_andruavUnitError = function (me, data) {
	const p_andruavUnit = data.unit;
	const p_error = data.err;

	let v_notification_Type;
	let v_cssclass = 'good';
	switch (p_error.notification_Type) {
		case 0:
			v_notification_Type = 'emergency';
			v_cssclass = 'error';
			break;
		case 1:
			v_notification_Type = 'alert';
			v_cssclass = 'error';
			break;
		case 2:
			v_notification_Type = 'critical';
			v_cssclass = 'error';
			break;
		case 3:
			v_notification_Type = 'error';
			v_cssclass = 'error';
			break;
		case 4:
			v_notification_Type = 'warning';
			v_cssclass = 'warning';
			break;
		case 5:
			v_notification_Type = 'notice';
			v_cssclass = 'good';
			break;
		case 6:
			v_notification_Type = 'info';
			v_cssclass = 'good';
			break;
		case 7:
			v_notification_Type = 'debug';
			v_cssclass = 'good';
			break;
		default:
			break;
	}
	const c_msg = {};
	c_msg.m_unit = p_andruavUnit;
	c_msg.m_notification_Type = v_notification_Type;
	c_msg.m_cssclass = v_cssclass;
	c_msg.m_error = p_error;
	js_eventEmitter.fn_dispatch(js_event.EE_onMessage, c_msg);




	$('#message_notification').append("<div class='" + v_cssclass + "'>" + p_andruavUnit.m_unitName + ": " + p_error.Description + "</div>");

	if (p_error.infoType !== js_andruavMessages.CONST_INFOTYPE_GEOFENCE) {
		if (p_error.v_notification_Type <= 3) {
			//http://github.hubspot.com/messenger/docs/welcome/
			// TODO: Replace Messenger REACT2
			// Messenger().post({
			// 	type: v_notification_Type,
			// 	message: p_andruavUnit.m_unitName + ":" + p_error.Description
			// });

			// only speak out errors
			js_speak.fn_speak(p_andruavUnit.m_unitName + ' ' + p_error.Description);
		}
	}
};

// eslint-disable-next-line no-unused-vars
let infowindow2 = null
// eslint-disable-next-line no-unused-vars
let infowindowADSB = null;

// eslint-disable-next-line no-unused-vars
function fn_showAdSBInfo(event, _adsb) {
}


// function fn_showAndruavUnitInfo(p_lat, p_lng, p_andruavUnit) {
// 	let sys_id = "";
// 	if (p_andruavUnit.m_FCBParameters.m_systemID !== 0) {
// 		sys_id = 'sysid:' + p_andruavUnit.m_FCBParameters.m_systemID + ' ';
// 	}
// 	let armedBadge = "";
// 	if (p_andruavUnit.m_isArmed) armedBadge = '<span class="text-danger">&nbsp;<strong>ARMED</strong>&nbsp;</span>';
// 	else armedBadge = '<span class="text-success">&nbsp;disarmed&nbsp;</span>';
// 	if (p_andruavUnit.m_isFlying) armedBadge += '<span class="text-danger">&nbsp;flying&nbsp;</span>';
// 	else armedBadge += '<span class="text-success">&nbsp;on-ground&nbsp;</span>';

// 	let markerContent = "<p class='img-rounded bg-primary text-white'><strong class='css_padding_5'>" + p_andruavUnit.m_unitName + "</strong> <span>" + sys_id + "</span></p>\
// 			  	<style class='img-rounded help-block'>" + p_andruavUnit.Description + "</style>";

// 	if (p_andruavUnit.m_IsGCS === false) {
// 		markerContent += "<span>" + armedBadge + " <span class='text-success'><strong>" + hlp_getFlightMode(p_andruavUnit) + "</strong></span> </span>";
// 	}
// 	else {
// 		markerContent += "<p> <span class='text-success'>Ground Control Station</span> </p>";
// 	}

// 	let vAlt = p_andruavUnit.m_Nav_Info.p_Location.alt_relative;
// 	let vAlt_abs = p_andruavUnit.m_Nav_Info.p_Location.alt_abs;
// 	if (vAlt === null || vAlt === undefined) {
// 		vAlt = '?';
// 	}
// 	else {
// 		vAlt = vAlt.toFixed(0);
// 	}
// 	if (vAlt_abs === null || vAlt_abs === undefined) {
// 		vAlt_abs = '';
// 	}
// 	else {
// 		vAlt_abs = ' <span class="text-primary">abs:</span>' + vAlt_abs.toFixed(0);
// 	}
// 	vAlt = vAlt + vAlt_abs;

// 	let vSpeed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
// 	if (vSpeed === null || vSpeed === undefined) {
// 		vSpeed = '?';
// 	}
// 	else {
// 		vSpeed = vSpeed.toFixed(1);
// 	}
// 	let vAirSpeed = p_andruavUnit.m_Nav_Info.p_Location.air_speed;
// 	if (vAirSpeed === null || vAirSpeed === undefined) {
// 		vAirSpeed = '?';
// 	}
// 	else {
// 		vAirSpeed = vAirSpeed.toFixed(1);
// 	}
// 	js_leafletmap.fn_getElevationForLocation(p_lat, p_lng
// 		, function (p_elevation, p_lat, p_lng) {
// 			if (p_elevation !== null && p_elevation !== undefined) {

// 				if (js_localStorage.fn_getMetricSystem() === false) {
// 					p_elevation = js_helpers.CONST_METER_TO_FEET * p_elevation;
// 				}

// 				if (isNaN(p_elevation) === false) {
// 					p_elevation = p_elevation.toFixed(1);
// 				}
// 				markerContent += `<br><span class="text-primary">lat:<span class="text-success">${(p_lat).toFixed(6)}</span><span class="text-primary">,lng:</span><span class="text-success">${(p_lng).toFixed(6)}</span></br>
// 							<span class="text-primary">alt:</span><span class="text-success">${vAlt}</span><span class="text-primary"> m</span>
// 							<br><span class="text-primary">GS:</span><span class="text-success">${vSpeed} </span><span class="text-primary"> m/s</span>
// 							<span class="text-primary"> AS:</span><span class="text-success">${vAirSpeed} </span><span class="text-primary"> m/s</span>`;

// 				if (p_andruavUnit.m_Swarm.m_isLeader === true) {

// 					markerContent += '<br><span class="text-danger "><strong>Leader</strong></span>'
// 				}
// 				if (p_andruavUnit.m_Swarm.m_following !== null && p_andruavUnit.m_Swarm.m_following !== undefined) {
// 					let v_andruavUnitLeader = js_globals.m_andruavUnitList.fn_getUnit(p_andruavUnit.m_Swarm.m_following);
// 					if (v_andruavUnitLeader != null) {
// 						markerContent += '<br><span class="text-warning ">Following:</span><span class="text-success ">' + v_andruavUnitLeader.m_unitName + '</span>'
// 					}
// 				}

// 				if (CONST_MAP_GOOLE === true) {
// 					markerContent += '<br> sea-lvl alt:' + p_elevation + ' m.</p>';
// 				}
// 			}

// 			infowindow2 = js_leafletmap.fn_showInfoWindow(infowindow2, markerContent, p_lat, p_lng);

// 		});

// }

function showAndruavHomePointInfo(p_lat, p_lng, p_andruavUnit) {
	let _style = "", _icon = "";


	let v_contentString = "<p class='img-rounded bg-primary text-white" + _style + "'><strong> Home of " + p_andruavUnit.m_unitName + _icon + "</strong></p> ";

	infowindow = js_leafletmap.fn_showInfoWindow(infowindow, v_contentString, p_lat, p_lng);
}


function showGeoFenceInfo(p_lat, p_lng, geoFenceInfo) {
	let _style, _icon;
	if (geoFenceInfo.m_shouldKeepOutside === true) {
		_style = "bg-danger";
		_icon = "&nbsp;<span class='glyphicon glyphicon-ban-circle text-danger css_float_right'></span>";
	}
	else {
		_style = "bg-success";
		_icon = "&nbsp;<span class='glyphicon glyphicon-ok-circle text-success css_float_right'></span>";
	}

	let v_contentString = "<p class='img-rounded " + _style + "'><strong>" + geoFenceInfo.m_geoFenceName + _icon + "</strong></p><span class='help-block'>" + p_lat.toFixed(7) + " " + p_lng.toFixed(7) + "</span>";
	v_contentString += "<div class='row'><div class= 'col-sm-12'><p class='cursor_hand bg-success link-white si-07x' onclick=\"window.open('./mapeditor?zoom=" + js_leafletmap.fn_getZoom() + "&lat=" + p_lat + "&lng=" + p_lng + "', '_blank')\"," + js_globals.CONST_DEFAULT_ALTITUDE + "," + js_globals.CONST_DEFAULT_RADIUS + "," + 10 + " )\">Open Geo Fence Here</p></div></div>";

	infowindow = js_leafletmap.fn_showInfoWindow(infowindow, v_contentString, p_lat, p_lng);

}


function EVT_andruavUnitGeoFenceBeforeDelete(me, geoFenceInfo) {
	if (geoFenceInfo !== null && geoFenceInfo !== undefined) {
		if (geoFenceInfo.flightPath !== null) {
			js_leafletmap.fn_hideItem(geoFenceInfo.flightPath);
		}
	}
	else {
		// hide all

		let keys = js_geoFenceRegistry.fn_keys();
		let size = js_geoFenceRegistry.fn_size();

		for (let i = 0; i < size; ++i) {
			geoFenceInfo = js_geoFenceRegistry.fn_get(keys[i]);

			if (geoFenceInfo.flightPath !== null && geoFenceInfo.flightPath !== undefined) {
				js_leafletmap.fn_hideItem(geoFenceInfo.flightPath);
			}

		}
	}
}



function EVT_andruavUnitGeoFenceUpdated(me, data) {
	const geoFenceInfo = data.fence;
	const p_andruavUnit = data.unit;

	let geoFenceCoordinates = geoFenceInfo.LngLatPoints;

	if (js_leafletmap.m_isMapInit === false) { // in case map is not loaded
		setTimeout(function () {
			EVT_andruavUnitGeoFenceUpdated(me, data);
		}, 800);
		return; // Exit to avoid processing before map is initialized
	}

	let v_geoFence = null;
	let oldgeoFenceInfo = js_geoFenceRegistry.fn_get(geoFenceInfo.m_geoFenceName);

	switch (geoFenceInfo.fencetype) {
		case js_andruavMessages.CONST_TYPE_LinearFence:
			v_geoFence = js_leafletmap.fn_drawPolyline(geoFenceCoordinates, geoFenceInfo.m_shouldKeepOutside);
			geoFenceInfo.flightPath = v_geoFence;

			if (!js_geoFenceRegistry.fn_has(geoFenceInfo.m_geoFenceName)) {
				oldgeoFenceInfo = geoFenceInfo;
				oldgeoFenceInfo.Units = {};
			} else {
				if (oldgeoFenceInfo.flightPath) {
					js_leafletmap.fn_hideItem(oldgeoFenceInfo.flightPath); // Corrected to hide old flight path
				}
				geoFenceInfo.Units = oldgeoFenceInfo.Units;
				oldgeoFenceInfo = geoFenceInfo;
			}
			break;

		case js_andruavMessages.CONST_TYPE_PolygonFence:
			v_geoFence = js_leafletmap.fn_drawPolygon(geoFenceCoordinates, geoFenceInfo.m_shouldKeepOutside);
			geoFenceInfo.flightPath = v_geoFence;

			if (!js_geoFenceRegistry.fn_has(geoFenceInfo.m_geoFenceName)) {
				oldgeoFenceInfo = geoFenceInfo;
				oldgeoFenceInfo.Units = {};
			} else {
				if (oldgeoFenceInfo.flightPath) {
					js_leafletmap.fn_hideItem(oldgeoFenceInfo.flightPath); // Corrected to hide old flight path
				}
				geoFenceInfo.Units = oldgeoFenceInfo.Units;
				oldgeoFenceInfo = geoFenceInfo;
			}
			break;

		case js_andruavMessages.CONST_TYPE_CylinderFence:
			v_geoFence = js_leafletmap.fn_drawCircle(geoFenceCoordinates[0], geoFenceInfo.m_maximumDistance, geoFenceInfo.m_shouldKeepOutside);
			geoFenceInfo.flightPath = v_geoFence;

			if (!js_geoFenceRegistry.fn_has(geoFenceInfo.m_geoFenceName)) {
				oldgeoFenceInfo = geoFenceInfo;
				oldgeoFenceInfo.Units = {};
			} else {
				if (oldgeoFenceInfo.flightPath) {
					js_leafletmap.fn_hideItem(oldgeoFenceInfo.flightPath); // Corrected to hide old flight path
				}
				geoFenceInfo.Units = oldgeoFenceInfo.Units;
				oldgeoFenceInfo = geoFenceInfo;
			}
			break;

		default:
			break;
	}

	// IMPORTANT: Update the global geofence storage with the current info.
	// This handler is the sole writer of fn_set (adds Leaflet flightPath + Units).
	js_geoFenceRegistry.fn_set(geoFenceInfo.m_geoFenceName, oldgeoFenceInfo);

	if (v_geoFence !== null) {
		var _dblClickTimer;
		js_leafletmap.fn_addListenerOnDblClickMarker(v_geoFence, function (p_lat, p_lng) {
			clearTimeout(_dblClickTimer);
			_dblClickTimer = null;
			fn_contextMenu(js_leafletmap.fn_getLocationObjectBy_latlng(p_lat, p_lng));
		});

		js_leafletmap.fn_addListenerOnClickMarker(v_geoFence, function (p_lat, p_lng) {
			if (_dblClickTimer !== null) return;
			_dblClickTimer = setTimeout(() => {
				showGeoFenceInfo(p_lat, p_lng, geoFenceInfo);
				_dblClickTimer = null;
			}, 200);
		});
	}

	if (p_andruavUnit) {
		oldgeoFenceInfo.Units[p_andruavUnit.getPartyID()] = {
			geoFenceHitInfo: {
				hasValue: false,
				fenceName: geoFenceInfo.m_geoFenceName,
				m_inZone: false,
				m_shouldKeepOutside: geoFenceInfo.m_shouldKeepOutside
			}
		};
	}
}


function EVT_andruavUnitGeoFenceHit(me, data) {
	const p_andruavUnit = data.unit;
	const geoFenceHitInfo = data.fenceHit;

	var fence = js_geoFenceRegistry.fn_get(geoFenceHitInfo.fenceName);
	if ((fence === undefined) || (fence === null)) {
		js_globals.v_andruavFacade.API_requestGeoFences(p_andruavUnit, geoFenceHitInfo.fenceName);
		return;
	}
	if (fence.Units[p_andruavUnit.getPartyID()] === undefined) fence.Units[p_andruavUnit.getPartyID()] = {};
	fence.Units[p_andruavUnit.getPartyID()].geoFenceHitInfo = geoFenceHitInfo;
	if (js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID())?.m_marker === null || js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID())?.m_marker === undefined) return;   // will be updated later when GPS message is recieved from that drone.
	var typeMsg = "info"; var msg = "OK";
	if (geoFenceHitInfo.m_inZone && geoFenceHitInfo.m_shouldKeepOutside) { typeMsg = 'p_error'; msg = "should be Out fence " + geoFenceHitInfo.fenceName; }
	// eslint-disable-next-line no-unused-vars
	else if (!geoFenceHitInfo.m_inZone && !geoFenceHitInfo.m_shouldKeepOutside) { typeMsg = 'p_error'; msg = "should be In fence " + geoFenceHitInfo.fenceName; }
	// TODO: Replace Messenger REACT2
	// Messenger().post({
	// 	type: typeMsg,
	// 	message: p_andruavUnit.m_unitName + ":" + "GeoFenceHit: " + msg
	// });
	if (msg === "OK") {
		// no-op
	}
	else {
		js_speak.fn_speak("unit " + p_andruavUnit.m_unitName + " " + msg);
	}

	js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, p_andruavUnit);
}


function gui_hidesubmenus() {
	$('div#debugpanel').hide();
	$('#btnConnectURL').hide();
}


function fn_gui_init_unitList() {
	$('#andruav_unit_list_array_float').draggable();
	$('#andruav_unit_list_array_float').on("mouseover", function () {
		$('#andruav_unit_list_array_float').css('opacity', '1.0');
	});
	$('#andruav_unit_list_array_float').on("mouseout", function () {
		$('#andruav_unit_list_array_float').css('opacity', '0.8');
	});

}

function fn_gui_init_fpvVtrl() {
	// FPV dialog is now handled by React component ClssFpvDialog
	// This function is kept for backward compatibility but does nothing
}


async function fn_login(p_email, p_access_code) {
	js_andruavAuth.fn_retryLogin(true);
	await js_andruavAuth.fn_do_loginAccount(p_email, p_access_code);
	if (js_andruavAuth.fn_logined() !== true) {
		// note that js_andruavAuth retries internally
		return;
	}
}

// eslint-disable-next-line no-unused-vars
function fn_connectWebSocket(me) {
	// create a group object
	if (js_andruav_ws.AndruavClientWS.getSocketStatus() !== js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {

		if (js_andruavAuth.fn_logined() === false) {
			js_common.fn_console_log("js_andruavAuth.fn_logined() === false");
			return;
		}

		js_globals.v_andruavClient = js_andruav_parser.AndruavClientParser;
		js_globals.v_andruavFacade = js_andruav_facade.AndruavClientFacade;
		js_globals.v_andruavWS = js_andruav_ws.AndruavClientWS;

		js_globals.v_andruavWS.fn_init();
		const authPartyID = js_andruavAuth.fn_getPartyID();
		// Desktop's login form (#txtUnitID) persists whatever the user submits via
		// js_localStorage.fn_setUnitID() before fn_connect() is called, so reading it back
		// from storage here returns the same value the DOM field would have. Pages without
		// that field (e.g. mobile.js's login form) still resolve to a real, persisted ID
		// instead of undefined, which would otherwise register the WS session under a bogus
		// "&s=undefined" SID and silently blackhole any server reply targeted back at us.
		const uiPartyID = js_localStorage.fn_getUnitID();
		const isPluginMode = js_siteConfig.CONST_WEBCONNECTOR_CONFIG.ENABLED && js_localStorage.fn_getWebConnectorEnabled();

		// PartyID rules:
		// - Normal (cloud) mode: partyID is client-determined (UI/localStorage).
		// - Plugin mode: plugin generates a partyId and returns it as `plugin_party_id` in /w/wl/.
		//   In this mode we MUST use the plugin-provided partyId for connecting to plugin WSS.
		if (isPluginMode && authPartyID) {
			js_globals.v_andruavWS.partyID = authPartyID;
			js_globals.v_andruavWS.unitID = authPartyID;
		} else {
			js_globals.v_andruavWS.partyID = authPartyID || uiPartyID;
			js_globals.v_andruavWS.unitID = authPartyID || uiPartyID;
		}

		js_globals.v_andruavWS.m_groupName = js_localStorage.fn_getGroupName();
		console.info('[WS] connecting with partyID', {
			authPartyID: authPartyID,
			uiPartyID: uiPartyID,
			isPluginMode: isPluginMode,
			finalPartyID: js_globals.v_andruavWS.partyID,
		});
		js_globals.v_andruavWS.m_server_ip = js_andruavAuth.m_server_ip;
		js_globals.v_andruavWS.m_server_port = js_andruavAuth.m_server_port;
		js_globals.v_andruavWS.m_server_port_ss = js_andruavAuth.m_server_port;
		js_globals.v_andruavWS.server_AuthKey = js_andruavAuth.server_AuthKey;
		js_globals.v_andruavWS.m_permissions = js_andruavAuth.fn_getPermission();
		js_eventEmitter.fn_subscribe(js_event.EE_WS_OPEN, this, EVT_onOpen);
		js_eventEmitter.fn_subscribe(js_event.EE_WS_CLOSE, this, EVT_onClose);
		js_eventEmitter.fn_subscribe(js_event.EE_onSocketStatus2, this, fn_onSocketStatus);
		js_eventEmitter.fn_subscribe(js_event.EE_onDeleted, this, EVT_onDeleted);
		js_eventEmitter.fn_subscribe(js_event.EE_msgFromUnit_GPS, this, EVT_msgFromUnit_GPS);
		js_eventEmitter.fn_subscribe(js_event.EE_msgFromUnit_IMG, this, EVT_msgFromUnit_IMG);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitAdded, this, EVT_andruavUnitAdded);
		js_eventEmitter.fn_subscribe(js_event.EE_HomePointChanged, this, EVT_HomePointChanged);
		js_eventEmitter.fn_subscribe(js_event.EE_DistinationPointChanged, this, EVT_DistinationPointChanged);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitError, this, EVT_andruavUnitError);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitGeoFenceUpdated, this, EVT_andruavUnitGeoFenceUpdated);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitGeoFenceHit, this, EVT_andruavUnitGeoFenceHit);
		js_eventEmitter.fn_subscribe(js_event.EE_msgFromUnit_WayPoints, this, EVT_msgFromUnit_WayPoints);
		js_eventEmitter.fn_subscribe(js_event.EE_msgFromUnit_WayPointsUpdated, this, EVT_msgFromUnit_WayPointsUpdated);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitArmedUpdated, this, EVT_andruavUnitArmedUpdated);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitGeoFenceBeforeDelete, this, EVT_andruavUnitGeoFenceBeforeDelete);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitFCBUpdated, this, EVT_andruavUnitFCBUpdated);



		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitFlyingUpdated, this, EVT_andruavUnitFlyingUpdated);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitFightModeUpdated, this, EVT_andruavUnitFightModeUpdated);
		js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitVehicleTypeUpdated, this, EVT_andruavUnitVehicleTypeUpdated);

		js_eventEmitter.fn_subscribe(js_event.EE_unitSDRTrigger, this, EVT_andruavUnitSDRTrigger);



		js_eventEmitter.fn_subscribe(js_event.EE_unitHighlighted, this, function (me, p_andruavUnit) {
			js_map3d.fn_focusUnit(p_andruavUnit);
			fn_updateWindArrow(p_andruavUnit);
		});

		// Refresh/clear the wind arrows when the Wind preference toggle
		// changes (EE_onPreferenceChanged is dispatched by the checkbox).
		js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged, this, function () {
			fn_updateAllWindArrows();
		});



		js_globals.v_andruavWS.fn_connect(js_andruavAuth.fn_getSessionID());
	}
}


export function fn_logout() {
	js_andruavAuth.fn_retryLogin(false);
	js_andruavAuth.fn_do_logoutAccount();
	js_andruav_ws.AndruavClientWS.API_delMe();
}

export function fn_connect(p_email, p_access_code) {
	if (js_andruav_ws.AndruavClientWS.isSocketConnectionDone() === true) {
		fn_logout();
	}
	else {
		fn_login(p_email, p_access_code);
	}
};


export function fn_deleteShapesinDB() {
	js_globals.v_andruavFacade.API_disableGeoFenceTasks(js_andruavAuth.m_username, js_globals.v_andruavWS.m_groupName, null, '_drone_', 1);

	js_globals.v_andruavFacade.API_requestDeleteGeoFences(null, null); // deattach drones from all fences in the group
	setTimeout(function () {
		// because it can take time to update database so an early relead in vehicle will be false.
		js_globals.v_andruavFacade.API_requestReloadLocalGroupGeoFenceTasks(null);
	}, 3000);
}



export function fn_submitShapes() {
	const len = js_globals.v_map_shapes.length;

	for (let i = 0; i < len; ++i) {
		if (
			((js_globals.v_map_shapes[i].m_geofenceInfo.m_valid !== true)
				&& (js_globals.v_map_shapes[i].m_geofenceInfo.m_deleted !== true))
		) {
			fn_do_modal_confirmation('Missing Information', 'Please enter missing fence data.');
			js_globals.v_map_shapes[i].setStyle({
				color: '#FE8030'
			});
			return;  // shape is not configured
		}
	}

	js_globals.v_andruavFacade.API_requestDeleteGeoFences(null, null); // deattach drones from all fences in the group
	js_globals.v_andruavFacade.API_disableGeoFenceTasks(js_andruavAuth.m_username, js_globals.v_andruavWS.m_groupName, null, '_drone_', 1);

	// new instance
	const fence_plan = new ClssAndruavFencePlan(1);

	const res = fence_plan.fn_generateAndruavFenceData(js_globals.v_map_shapes);
	const len_res = res.length;
	for (let i = 0; i < len_res; ++i) {
		if ((js_globals.v_andruavClient !== null) && (js_globals.v_andruavWS.fn_isRegistered() === true)) {
			js_globals.v_andruavFacade.API_saveGeoFenceTasks(js_andruavAuth.m_username, js_globals.v_andruavWS.m_groupName, null, '_drone_', 1, res[i]);
		}
	}


	setTimeout(function () {
		js_globals.v_andruavFacade.API_requestReloadLocalGroupGeoFenceTasks(null);
	}, 3000);
}




let fn_on_ready_called = false;
export function fn_on_ready() {

	if (fn_on_ready_called === true) return;
	fn_on_ready_called = true;

	$(function () {
		$('head').append('<link href="/images/de/favicon.ico" rel="shortcut icon" type="image/x-icon" />');
		$(document).prop('title', js_siteConfig.CONST_TITLE);
	});

	if ((typeof (CONST_MAP_GOOLE) == "undefined") || (CONST_MAP_GOOLE === true)) {
		let v_script = window.document.createElement('script');
		v_script.type = 'text/javascript';

		v_script.src = "2a4034903490310033a90d2408a108a12e6924c1310033a9084429713021302129712d9027d924c131002b1133a90844264930212e6908a12e6924c1310033a908a124c131002b1108a12be433a90f812cb927d939310e89108114d13a2424c11ae93931118929710c40110414401a441ef11e4010811189302126491e402be40961384033a937510b642be4234127100af9264927d9297107e91ae91ef1129932c40bd1375105a4264924c12d902d90258424c126492cb90e892b112f442b113490172924c13100"._fn_hexDecode();
		window.document.body.append(v_script);
	}
	else
		if ((typeof (CONST_MAP_GOOLE) !== "undefined") && (CONST_MAP_GOOLE === false)) {
			initMap();
		}

	// ADSB is enabled when CONST_FEATURE.DISABLE_ADSB is not true.
	// This is the single source of truth — no redundant runtime flags.
	if (!(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_ADSB === true)) {
		js_eventEmitter.fn_subscribe(js_event.EE_adsbExchangeReady, this, fn_adsbObjectUpdate);
		js_eventEmitter.fn_subscribe(js_event.EE_adsbExpiredUpdate, this, fn_adsbExpiredUpdate);
		// TEMP DEBUG: delegated click handler for non-interactive ADSB markers.
		// Finds the nearest ADSB marker within a pixel threshold and opens its
		// popup, replacing per-marker click listeners (which made each marker
		// interactive and thus hit-testable on every mousemove).
		// Guard: initMap() can fail (e.g. HMR re-init), leaving m_Map null.
		if (js_leafletmap.m_Map) {
		js_leafletmap.m_Map.on('click', function (e) {
			const clickPt = e.containerPoint;
			const list = (js_adsbUnit && js_adsbUnit.List) ? Object.values(js_adsbUnit.List) : [];
			let best = null;
			let bestDist = 20; // px threshold
			for (let i = 0; i < list.length; i++) {
				const o = list[i];
				if (!o || !o.p_marker) continue;
				const markerPt = js_leafletmap.m_Map.latLngToContainerPoint(o.p_marker.getLatLng());
				const d = Math.hypot(markerPt.x - clickPt.x, markerPt.y - clickPt.y);
				if (d < bestDist) { bestDist = d; best = o; }
			}
			if (best && best.p_marker.getPopup()) {
				best.p_marker.openPopup();
			}
		});
		} // end if (js_leafletmap.m_Map)
		// Re-evaluate which ADSB aircraft are visible whenever the map view
		// changes (pan or zoom) - not just when fresh ADSB data arrives - so
		// aircraft scrolling into view reappear immediately (rather than
		// waiting up to the next ~60s poll) and aircraft scrolling out /
		// piling up at extreme offsets while zooming in get culled right away.
		// Wrapped so isDataUpdate=false is passed (view change only: skip
		// full re-render for markers that already exist, just cull/create).
		js_eventEmitter.fn_subscribe(js_event.EE_mapViewChanged, this, () => fn_renderAdsbMarkers(false));
		// Clear all ADSB markers from the map when ADSB is disabled.
		js_eventEmitter.fn_subscribe(js_event.EE_adsbCleared, this, fn_clearAdsbFromMap);
		// Turn the ADSB query circle red when the provider reports a fetch
		// error, and restore the normal orange color when the error clears.
		js_eventEmitter.fn_subscribe(js_event.EE_adsbError, this, fn_onAdsbError);
		// Re-render all ADSB markers when the unit system (metric/imperial) changes
		// so tooltips switch between m/km/h and ft/mph immediately.
		js_eventEmitter.fn_subscribe('EE_UnitSystemChanged', this, fn_adsbUnitSystemChanged);
		// When the 3D map becomes visible, mirror the existing ADSB registry
		// onto it. fn_syncAdsbObject skips while the 3D view is hidden, so
		// while the user was on the 2D map no 3D ADSB markers were created;
		// without this re-render aircraft would only appear on the next
		// ~60s poll after switching to 3D. Uses fn_syncAdsbToMap3D (not
		// fn_renderAdsbMarkers) because the 2D leaflet map is display:none
		// at this point, so its bounds are degenerate and the 2D viewport
		// culling in fn_renderAdsbMarkers would drop every aircraft.
		js_eventEmitter.fn_subscribe(js_event.EE_map3dShown, this, fn_syncAdsbToMap3D);
	}



	enableDragging();


	fn_showMap();

	if (js_globals.CONST_MAP_EDITOR !== true) {
		gui_hidesubmenus();
		gui_initGlobalSection();

		js_eventEmitter.fn_subscribe(js_event.EE_unitHighlighted, this, function (me, p_andruavUnit) {
			js_map3d.fn_focusUnit(p_andruavUnit);
			fn_updateWindArrow(p_andruavUnit);
		});

		$('#gimbaldiv').find('#btnpitchm').on('click', function () {
			const p = $('#div_video_view').attr('partyID');
			const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
			fn_doGimbalCtrlStep(p_andruavUnit, -2, 0, 0);

		});

		$('#gimbaldiv').find('#btnrollp').on('click', function () {
			const p = $('#div_video_view').attr('partyID');
			const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
			fn_doGimbalCtrlStep(p_andruavUnit, 0, +2, 0);

		});

		$('#gimbaldiv').find('#btnrollm').on('click', function () {
			const p = $('#div_video_view').attr('partyID');
			const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
			fn_doGimbalCtrlStep(p_andruavUnit, 0, -2, 0);

		});

		$('#gimbaldiv').find('#btnyawp').on('click', function () {
			const p = $('#div_video_view').attr('partyID');
			const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
			fn_doGimbalCtrlStep(p_andruavUnit, 0, 0, +2);

		});

		$('#gimbaldiv').find('#btnyawm').on('click', function () {
			const p = $('#div_video_view').attr('partyID');
			const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
			fn_doGimbalCtrlStep(p_andruavUnit, 0, 0, -2);
		});

		fn_gui_init_fpvVtrl();
		fn_gui_init_unitList();
	}
	else {
		// no-op
	}

	if ((QueryString.test !== undefined) && (QueryString.test !== null)) {
		$('.subblock#command').show();
		$('div#debugpanel').show();
	}


	// LOGIN		
	if ((QueryString.email === null || QueryString.email === undefined) || (QueryString.accesscode === null || QueryString.accesscode === undefined)) {
		// window.location.href = "http://example.com";
		//$('#txtUnitID').val('GCSMAP_' + js_common.fn_generateRandomString(3));

	}
	else {
		//http://127.0.0.1:9980/globalarclight.html?accesscode=myown&email=myown@myown.com&m_groupName=1&m_unitName=GCSWeb1

	}

	fn_handleKeyBoard();

	// Refresh the visible map when the viewport size changes (window resize
	// or F11 browser fullscreen toggle). Leaflet/Mapbox don't auto-detect
	// container size changes, so without this the map canvas stays pinned
	// to its old dimensions after the container grows.
	const fn_handleViewportResize = () => {
		// Best-effort immediate refresh, then a guaranteed one after the
		// browser commits the new layout on the next frame.
		js_leafletmap.fn_invalidateSize();
		js_map3d.fn_resize();
		requestAnimationFrame(() => {
			js_leafletmap.fn_invalidateSize();
			js_map3d.fn_resize();
		});
	};
	window.addEventListener('resize', fn_handleViewportResize);
	document.addEventListener('fullscreenchange', fn_handleViewportResize);

	js_eventEmitter.fn_subscribe(js_event.EE_Auth_Logined, this, fn_connectWebSocket);

};  // end of onReady


/**
 * Shows a security dialog for SSL certificate errors with clickable link
 * @param {string} host - The server host
 * @param {number} port - The server port
 */
export function fn_showSecurityDialog(host, port) {
    // Build the HTTPS URL that user needs to visit to accept the certificate
    const protocol = 'https';
    const certUrl = `${protocol}://${host}:${port}`;
    
    // Create a modal dialog with clickable link
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    dialog.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #d32f2f;">Security Connection Error</h3>
        <p style="margin: 10px 0; line-height: 1.5;">
            The connection to <strong>${host}:${port}</strong> uses a self-signed or untrusted SSL certificate.
        </p>
        <p style="margin: 10px 0; line-height: 1.5; color: #666;">
            <em>What's happening?</em> This site requires either a valid SSL certificate, or since you are 
            running it on your own server with no valid SSL, then you need to open the link and approve it 
            by clicking "Advanced" → "Proceed to ${host} (unsafe)".
        </p>
        <p style="margin: 10px 0; font-weight: bold;">To proceed, please:</p>
        <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Visit <a href="${certUrl}" target="_blank" style="color: #1976d2; text-decoration: underline;">${certUrl}</a></li>
            <li>Click "Advanced" → "Proceed to ${host} (unsafe)"</li>
            <li>Return here and try connecting again</li>
        </ol>
        <div style="text-align: center; margin-top: 20px;">
            <button id="security-ok" style="background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">OK</button>
        </div>
    `;
    
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    // Handle OK button click
    document.getElementById('security-ok').onclick = () => {
        document.body.removeChild(modal);
        window.open(certUrl, '_blank');
    };
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            window.open(certUrl, '_blank');
        }
    };
}
