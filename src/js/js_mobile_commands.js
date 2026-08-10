/*
    Vehicle/autopilot-aware flight command map for the mobile field-mode page.
    Mirrors the mode numbers used by components/flight_controllers/jsc_ctrl_ardupilot_flightControl.jsx
    and jsc_ctrl_px4_flightControl.jsx so mobile taps send the same messages desktop buttons do.
*/
import { js_globals } from './js_globals.js';
import { mavlink20 } from './js_mavlink_v2.js';
import { js_andruavAuth } from './protocol/auth/js_andruav_auth.js';
import * as js_andruavUnit from './js_andruavUnit.js';
import { fn_VIDEO_login } from './js_main.js';

function fn_isPX4(p_unit) {
    return p_unit.m_autoPilot === mavlink20.MAV_AUTOPILOT_PX4;
}

function fn_isCopter(p_unit) {
    return p_unit.m_VehicleType === js_andruavUnit.VEHICLE_QUAD || p_unit.m_VehicleType === js_andruavUnit.VEHICLE_TRI;
}

function fn_isRoverOrBoat(p_unit) {
    return p_unit.m_VehicleType === js_andruavUnit.VEHICLE_ROVER || p_unit.m_VehicleType === js_andruavUnit.VEHICLE_BOAT;
}

// Matches hlp_getflightButtonStyles() in jsc_ctrl_ardupilot_flightControl.jsx: TAKEOFF is only
// a real flight mode for plane/VTOL/submarine — copters, rovers/boats and unknown types hide it.
function fn_ardupilotHasTakeoff(p_unit) {
    return p_unit.m_VehicleType === js_andruavUnit.VEHICLE_PLANE
        || p_unit.m_VehicleType === js_andruavUnit.VEHICLE_VTOL
        || p_unit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE;
}

function fn_canConnect() {
    return js_globals.v_andruavFacade !== null && js_globals.v_andruavFacade !== undefined;
}

function fn_isBlocked(p_unit) {
    return p_unit.m_Telemetry.m_isGCSBlocked === true;
}

function fn_baseEnabled(p_unit) {
    return fn_canConnect() && !fn_isBlocked(p_unit) && js_andruavAuth.fn_do_canControlModes();
}

function fn_doArm(p_unit) {
    js_globals.v_andruavFacade.API_do_Arm(p_unit, !p_unit.m_isArmed, false);
}

function fn_doTakeoff(p_unit) {
    const flightMode = fn_isPX4(p_unit)
        ? js_andruavUnit.CONST_FLIGHT_PX4_AUTO_TAKEOFF
        : js_andruavUnit.CONST_FLIGHT_CONTROL_TAKEOFF;
    js_globals.v_andruavFacade.API_do_FlightMode(p_unit, flightMode);
}

function fn_doAuto(p_unit) {
    const flightMode = fn_isPX4(p_unit)
        ? js_andruavUnit.CONST_FLIGHT_PX4_AUTO_MISSION
        : js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO;
    js_globals.v_andruavFacade.API_do_FlightMode(p_unit, flightMode);
}

function fn_doBrake(p_unit) {
    let flightMode;
    if (fn_isPX4(p_unit)) {
        flightMode = js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD;
    }
    else if (fn_isRoverOrBoat(p_unit)) {
        flightMode = js_andruavUnit.CONST_FLIGHT_CONTROL_HOLD;
    }
    else if (fn_isCopter(p_unit)) {
        flightMode = js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE;
    }
    else {
        // plane / vtol / submarine / unknown
        flightMode = js_andruavUnit.CONST_FLIGHT_CONTROL_LOITER;
    }
    js_globals.v_andruavFacade.API_do_FlightMode(p_unit, flightMode);
}

function fn_doLand(p_unit) {
    if (fn_isPX4(p_unit)) {
        js_globals.v_andruavFacade.API_do_FlightMode(p_unit, js_andruavUnit.CONST_FLIGHT_PX4_AUTO_LAND);
    }
    else {
        js_globals.v_andruavFacade.API_do_Land(p_unit);
    }
}

export function fn_getMobileActions(p_unit) {
    if (!p_unit) return [];

    const canControl = fn_baseEnabled(p_unit);
    const canArm = canControl && js_andruavAuth.fn_do_canControl();
    const isArmed = p_unit.m_isArmed === true;

    // TAKEOFF is shown for all PX4 vehicles; for ArduPilot only plane/VTOL/submarine have a
    // TAKEOFF flight mode (copters, rovers/boats and unknown types hide it, per the desktop panel).
    const showTakeoff = fn_isPX4(p_unit) || fn_ardupilotHasTakeoff(p_unit);

    const actions = [
        {
            id: 'arm',
            label: isArmed ? 'DISARM' : 'ARM',
            icon: isArmed ? 'bi-stop-circle-fill' : 'bi-play-circle-fill',
            style: isArmed ? 'danger' : (p_unit.m_is_ready_to_arm === true ? 'arm-ready' : 'arm'),
            enabled: canArm,
            confirmTitle: isArmed ? 'DISARM ' + p_unit.m_unitName : 'ARM ' + p_unit.m_unitName,
            confirmMessage: isArmed
                ? 'STOP all MOTORS. If airborne the vehicle will CRASH. Are you sure?'
                : 'Arm the vehicle motors. Are you sure?',
            run: fn_doArm,
        },
    ];

    if (showTakeoff) {
        actions.push({
            id: 'takeoff',
            label: 'TAKEOFF',
            icon: 'bi-airplane-fill',
            style: 'takeoff',
            enabled: canControl && isArmed,
            confirmTitle: 'TAKEOFF ' + p_unit.m_unitName,
            confirmMessage: 'Command the vehicle to take off. Are you sure?',
            run: fn_doTakeoff,
        });
    }

    actions.push(
        {
            id: 'auto',
            label: 'AUTO',
            icon: 'bi-signpost-split-fill',
            style: 'auto',
            enabled: canControl && isArmed,
            confirmTitle: 'AUTO ' + p_unit.m_unitName,
            confirmMessage: 'Switch to AUTO mission mode. Are you sure?',
            run: fn_doAuto,
        },
        {
            id: 'brake',
            label: 'BRAKE',
            icon: 'bi-stop-btn',
            style: 'brake',
            enabled: canControl && isArmed,
            confirmTitle: 'BRAKE ' + p_unit.m_unitName,
            confirmMessage: 'Stop the vehicle in place. Are you sure?',
            run: fn_doBrake,
        },
        {
            id: 'land',
            label: 'LAND',
            icon: 'bi-arrow-down-circle-fill',
            style: 'land',
            enabled: canControl && isArmed,
            confirmTitle: 'LAND ' + p_unit.m_unitName,
            confirmMessage: 'Command the vehicle to land. Are you sure?',
            run: fn_doLand,
        },
    );

    return actions;
}

// PartyIDs with a camera-list round trip currently in flight for fn_startVideo(). Guards
// against firing a second `joinme` on top of one whose SDP/ICE negotiation hasn't finished yet -
// mobile.js's own toggle/retry button can only ever queue one call at a time by itself, but the
// mobile page re-renders far more often than the desktop one (it also refreshes on every nav/pow
// telemetry tick), so any accidental double-invocation here would otherwise tear down and restart
// a still-negotiating join (joinStream() treats "not yet connected" as stale) - never letting it
// finish, i.e. camera shows as active on the drone side while nothing ever renders on the page.
const v_pendingVideoRequests = new Set();

/**
 * Starts video for a unit. If the unit has a single camera track it logs in directly.
 * If it has multiple tracks, p_onTracks(session, tracks) is called so the caller can
 * present a picker instead of opening the desktop draggable stream dialog.
 */
export function fn_startVideo(p_andruavUnit, p_onTracks) {
    if (!p_andruavUnit || !fn_canConnect()) return;

    const partyID = p_andruavUnit.getPartyID();
    if (v_pendingVideoRequests.has(partyID)) return;
    v_pendingVideoRequests.add(partyID);

    function fn_callback(p_session) {
        v_pendingVideoRequests.delete(partyID);

        if (!p_session || p_session.status !== 'connected') return;

        const tracks = p_session.m_unit.m_Video.m_videoTracks;
        if (!tracks || tracks.length === 0) return;

        if (tracks.length === 1) {
            fn_VIDEO_login(p_session, tracks[0].id);
            return;
        }

        if (p_onTracks) {
            p_onTracks(p_session, tracks);
        }
    }

    js_globals.v_andruavFacade.API_requestCameraList(p_andruavUnit, fn_callback);
}

/**
 * Stops any live/negotiating video session(s) for a unit - mirrors the desktop video panel's
 * close button (fnl_stopVideo in jsc_videoScreenComponent.jsx) so navigating away from the
 * mobile video view doesn't leave a stream (and the drone's camera) running unattended in the
 * background, and so re-entering video view later starts a clean join instead of racing whatever
 * was left behind.
 */
export function fn_stopVideo(p_andruavUnit) {
    if (!p_andruavUnit || !fn_canConnect()) return;

    v_pendingVideoRequests.delete(p_andruavUnit.getPartyID());

    const activeTracks = p_andruavUnit.m_Video.m_videoactiveTracks;
    Object.keys(activeTracks).forEach((trackId) => {
        const talk = activeTracks[trackId];
        if (!talk) return;
        talk.hangup(true);
        js_globals.v_andruavFacade.API_CONST_RemoteCommand_streamVideo(p_andruavUnit, false, talk.number, trackId);
    });
}
