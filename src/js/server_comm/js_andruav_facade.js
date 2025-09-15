/*************************************************************************************
 * 
 *   A N D R U A V - C L I E N T       JAVASCRIPT  LIB
 * 
 *   Author: Mohammad S. Hefny
 * 
 *   Date:   06 December 2015
 * 
 *   Date    21 Jun 2016:   GeoFence
 * 
 *   Date 23 Jul 2016
 * 
 *   Date 29 Mar 2017:		Smaller commands, web Telemetry
 * 
 *************************************************************************************/

/*jshint esversion: 6 */
import { js_globals } from '../js_globals.js';
import { EVENTS as js_event } from '../js_eventList.js'
import * as js_helpers from '../js_helpers.js';
import * as js_siteConfig from '../js_siteConfig.js';
//import {CADSBObject, CADSBObjectList} from 'js_adsbUnit.js';
import { js_andruav_gamepad } from '../js_andruav_gamepad.js'
import * as js_andruavUnit from '../js_andruavUnit.js';
import * as js_andruavMessages from '../js_andruavMessages.js';

import * as js_common from '../js_common.js'
import { js_eventEmitter } from '../js_eventEmitter.js'
import { CCommandAPI } from '../js_commands_api.js'

import * as js_andruav_ws from './js_andruav_ws.js';
import * as js_andruav_parser from './js_andruav_parser.js'


import { mavlink20 } from '../js_mavlink_v2.js'
const WAYPOINT_NO_CHUNK = 0;
const WAYPOINT_CHUNK = 1;
const WAYPOINT_LAST_CHUNK = 999;




// Tasks Scope
const CONST_TASK_SCOPE_GLOBAL = 0;
const CONST_TASK_SCOPE_GLOBAL_ACCOUNT = 1;
const CONST_TASK_SCOPE_LOCALGROUP = 2;
const CONST_TASK_SCOPE_PARTYID = 3;



class CAndruavClientFacade {
    constructor() {


        this.v_axes = null;
        this.v_sendAxes = false;
        this.v_sendAxes_skip = 0;

        this.fn_init();

        js_eventEmitter.fn_subscribe(js_event.EE_GamePad_Axes_Updated, this, this.#fn_sendAxes);
    }

    static getInstance() {
        if (!CAndruavClientFacade.instance) {
            CAndruavClientFacade.instance = new CAndruavClientFacade();
        }
        return CAndruavClientFacade.instance;
    }


    fn_init() {
        const Me = this;
        if (this.fn_timerID_sendRXChannels === null || this.fn_timerID_sendRXChannels === undefined) {
            this.fn_timerID_sendRXChannels = setInterval(function () {
                Me.#fn_sendRXChannels(Me)
            }, js_andruavMessages.CONST_sendRXChannels_Interval);
        }

    }


    fn_destroy() {
        // Clear timer if it exists
        if (this.fn_timerID_sendRXChannels) {
            clearInterval(this.fn_timerID_sendRXChannels);
            this.fn_timerID_sendRXChannels = null;
        }

        // Safely unsubscribe from events
        try {
            this.eventEmitter.fn_unsubscribe(js_event.EE_GamePad_Axes_Updated, this.#fn_sendAxes);
        } catch (error) {
            this.common.fn_console_log(`Error during unsubscription: ${error.message}`);
        }

        // Reset other resources
        this.v_axes = null;
        this.v_sendAxes = false;
    }

    // EVENT HANDLER AREA
    #fn_sendRXChannels(p_me) {
        if (p_me.v_sendAxes === false) {
            p_me.v_sendAxes_skip++;
            if (p_me.v_sendAxes_skip % 4 !== 0) return;
        }

        p_me.v_sendAxes = false;
        const c_currentEngagedUnitRX = js_globals.m_andruavUnitList.getEngagedUnitRX();
        if (!c_currentEngagedUnitRX) return;

        if (this.v_axes !== null) this.#API_sendRXChannels(c_currentEngagedUnitRX, this.v_axes);
    }

    /**
    * 
    * @param {*} p_partyID is partyID not a unit object.
    */
    API_requestID(p_partyID) {
        const cmd = CCommandAPI.API_requestID();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_partyID, cmd.mt, cmd.ms);
    }


    /**
    * 
    * @param {*} p_target is partyID not a unit object.
    */
    API_sendID(p_target) {
        let msg = {
            VT: js_andruavUnit.CONST_VEHICLE_GCS, // VehicleType
            GS: js_andruav_ws.AndruavClientWS.m_andruavUnit.m_IsGCS, // IsCGS
            VR: 0, // VideoRecording [OPTIONAL in later Andruav versions]
            //FI: js_andruav_ws.AndruavClientWS.m_andruavUnit.m_useFCBIMU, // useFCBIMU
            //AR: js_andruav_ws.AndruavClientWS.m_andruavUnit.m_isArmed, // m_isArmed
            //FL: js_andruav_ws.AndruavClientWS.m_andruavUnit.m_isFlying, // m_isFlying
            SD: js_andruav_ws.AndruavClientWS.m_andruavUnit.m_IsShutdown,
            //TP: js_andruav_ws.AndruavClientWS.m_andruavUnit.m_telemetry_protocol,
            UD: js_andruav_ws.AndruavClientWS.m_andruavUnit.m_unitName,
            DS: js_andruav_ws.AndruavClientWS.m_andruavUnit.Description,
            p: js_andruav_ws.AndruavClientWS.m_permissions
        };

        // embedding messages - new technique.
        if ((js_globals.myposition !== null)
            && (js_siteConfig.CONST_DONT_BROADCAST_GCS_LOCATION === false)
        ) {
            const loc = js_globals.myposition.coords;
            const cmd = CCommandAPI.API_do_SendHomeLocation(null, loc.latitude, loc.longitude, loc.altitude, loc.accuracy, loc.altitudeAccuracy);
            msg[cmd.mt] = cmd.ms;
        }


        js_andruav_ws.AndruavClientWS.API_sendCMD(p_target, js_andruavMessages.CONST_TYPE_AndruavMessage_ID, msg);
    };

    API_requestP2P(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_requestP2P(p_andruavUnit);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }


    API_requestSDR(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_requestSDR(p_andruavUnit);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }


    API_scanSDRDrivers(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_scanSDRDrivers(p_andruavUnit);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_scanSDRFreq(p_andruavUnit, p_on_off) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_scanSDRFreq(p_on_off);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_requestGPIOStatus(p_andruavUnit, p_module_key, p_pin_number) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_requestGPIOStatus(p_andruavUnit, p_module_key, p_pin_number);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_writeGPIO(p_andruavUnit, p_module_key, p_pin_number, p_pin_value_new) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_writeGPIO(p_andruavUnit, p_module_key, p_pin_number, p_pin_value_new);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_writeGPIO_PWM(p_andruavUnit, p_module_key, p_pin_number, p_pin_value_new, p_pin_pwm_width_new) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_writeGPIO_PWM(p_andruavUnit, p_module_key, p_pin_number, p_pin_value_new, p_pin_pwm_width_new);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_soundTextToSpeech(p_andruavUnit, p_text, p_language, p_pitch, p_volume) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_soundTextToSpeech(p_andruavUnit, p_text, p_language, p_pitch, p_volume);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }


    API_scanP2P(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_scanP2P();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }


    API_resetP2P(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_resetP2P();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_makeSwarm(p_andruavUnit, p_formationID, p_horizontal_distance, p_vertical_distance) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        if (p_formationID === null || p_formationID === undefined) return;

        const cmd = CCommandAPI.API_makeSwarm(p_andruavUnit, p_formationID, p_horizontal_distance, p_vertical_distance);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_setSDRConfig(p_andruavUnit, p_fequency_center, p_fequency,
        p_gain, p_sample_rate,
        p_decode_mode, p_driver_index, p_interval,
        p_display_bars, p_trigger_level
    ) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_setSDRConfig(p_andruavUnit, p_fequency_center, p_fequency,
            p_gain, p_sample_rate,
            p_decode_mode, p_driver_index, p_interval,
            p_display_bars, p_trigger_level
        );
        if (cmd === null || cmd === undefined) return;
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    API_activateSDR(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        let p_msg = {
            'a': js_andruavMessages.CONST_SDR_ACTION_CONNECT
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION, p_msg);
    }

    API_requestFromDroneToFollowAnother(p_andruavUnit, slaveIndex, leaderPartyID, do_follow) {

        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const cmd = CCommandAPI.API_requestFromDroneToFollowAnother(p_andruavUnit, slaveIndex, leaderPartyID, do_follow);


        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };


    #API_sendRXChannels(p_andruavUnit, p_unified_virtual_axis) {
        // IMPORTANT: Convert [-1,1] to [0,1000] IMPORTANT: -1 means channel release so min is 0
        let p_msg = {
            'R': parseInt(parseFloat(p_unified_virtual_axis[0]) * 500 + 500),  // Rudder
            'T': parseInt(-parseFloat(p_unified_virtual_axis[1]) * 500 + 500), // Throttle
            'A': parseInt(parseFloat(p_unified_virtual_axis[2]) * 500 + 500),  // Aileron
            'E': parseInt(parseFloat(p_unified_virtual_axis[3]) * 500 + 500),  // Elevator
        };

        js_common.fn_console_log(p_msg);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteControl2, p_msg);
    };


    /**
    * 
    */
    API_do_ServoChannel(p_andruavUnit, p_channel_num, p_value) {

        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_do_ServoChannel(p_channel_num, p_value);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }


    API_requestServoChannel(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_requestServoChannel();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }

    // Very Danger to expose [emergencyDisarm]
    API_do_Arm(p_andruavUnit, param_toArm, param_emergencyDisarm) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let msg = {
            A: param_toArm,
            D: param_emergencyDisarm
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_Arm, msg);
    }


    API_do_ChangeAltitude(p_andruavUnit, param_altitude) {
        if ((p_andruavUnit === null || p_andruavUnit === undefined) || (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined)) return;
        let msg = {
            a: parseInt(param_altitude)
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_ChangeAltitude, msg);
    }


    API_do_YAW(p_andruavUnit, var_targetAngle, var_turnRate, var_isClockwise, var_isRelative) {
        if ((p_andruavUnit === null || p_andruavUnit === undefined) || (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined)) return;
        let msg = {
            A: parseFloat(var_targetAngle),
            R: parseFloat(var_turnRate),
            C: var_isClockwise,
            L: var_isRelative

        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_DoYAW, msg);
    }


    API_do_SendHomeLocation(p_partyID, p_latitude, p_longitude, p_altitude, p_radius_accuracy, p_altitude_accuracy) {

        if (p_partyID === null || p_partyID === undefined) return;

        const cmd = CCommandAPI.API_do_SendHomeLocation(null, p_latitude, p_longitude, p_altitude, p_radius_accuracy, p_altitude_accuracy);

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_partyID, cmd.mt, cmd.ms);
    }


    API_do_SetHomeLocation(p_partyID, p_latitude, p_longitude, p_altitude) {

        if (p_partyID === null || p_partyID === undefined) return;

        const cmd = CCommandAPI.API_do_SetHomeLocation(null, p_latitude, p_longitude, p_altitude);

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_partyID, cmd.mt, cmd.ms);
    }

    API_do_GetHomeLocation(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let v_msg = {
            C: js_andruavMessages.CONST_TYPE_AndruavMessage_HomeLocation
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };



    API_do_GimbalCtrl(p_andruavUnit, p_pitch, p_roll, p_yaw, p_isAbsolute) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let v_msg = {
            A: Math.round(p_pitch),
            B: Math.round(p_roll),
            C: Math.round(p_yaw),
            D: p_isAbsolute

        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_GimbalCtrl, v_msg);
    }


    API_do_ChangeSpeed2(p_andruavUnit, p_speed, p_isGroundSpeed, p_throttle, p_isRelative) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let v_msg = {
            a: p_speed,
            b: (p_isGroundSpeed === null || p_isGroundSpeed === undefined) ? true : p_isGroundSpeed,
            c: (p_throttle === null || p_throttle === undefined) ? -1 : p_throttle,
            d: (p_isRelative === null || p_isRelative === undefined) ? false : p_isRelative

        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_ChangeSpeed, v_msg);
    }

    API_do_Land(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let v_msg = {};
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_Land, v_msg);
    }

    //TODO: change p_partyID to p_andruavUnit
    API_do_FlightMode(p_andruavUnit, flightMode) {
        let v_msg = {
            F: flightMode
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_FlightControl, v_msg);
    }


    API_setGPSSource(p_andruavUnit, p_source) { // (p_andruavUnit,OnOff)

        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let v_msg = {
            C: js_andruavMessages.CONST_RemoteCommand_SET_GPS_SOURCE,
            s: p_source
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };


    API_WebRTC_Signalling(p_partyID, p_webrtcMsg) {
        let v_msg = {
            w: p_webrtcMsg
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_partyID, js_andruavMessages.CONST_TYPE_AndruavMessage_Signaling, v_msg);

    }

    API_CONST_RemoteCommand_streamVideo(p_andruavUnit, p_OnOff, p_number, p_channel) {

        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let v_msg = {
            C: js_andruavMessages.CONST_RemoteCommand_STREAMVIDEO,
            Act: p_OnOff
        };

        if (p_OnOff === false) {
            v_msg.CH = p_channel;
            v_msg.N = p_number;
        }

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
        js_eventEmitter.fn_dispatch(js_event.EE_Video_State_Change, { unit: p_andruavUnit, onff: p_OnOff });

    };

    API_CONST_RemoteCommand_rotateVideo(p_andruavUnit, p_rotation_angle, p_channel) {

        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let v_msg = {
            C: js_andruavMessages.CONST_RemoteCommand_ROTATECAM,
            r: p_rotation_angle,
            a: p_channel
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);

    };


    /**
         * 
         * 
         * @param {any} p_partyID
         * @param {any} latitude
         * @param {any} longitude
         * @param {any} altitude
         * @param {any} xVel : this can be null in this case all velocity parameters will be ignored
         * @param {any} yVel
         * @param {any} zVel
         */
    API_do_FlyHere(p_partyID, p_latitude, p_longitude, p_altitude, p_xVel, p_yVel, p_zVel) {

        const msg = CCommandAPI.API_do_FlyHere(p_latitude, p_longitude, p_altitude, p_xVel, p_yVel, p_zVel);

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_partyID, msg.mt, msg.ms);
    }


    API_do_CircleHere(p_partyID, p_latitude, p_longitude, p_altitude, p_radius, p_turns) {

        const msg = CCommandAPI.API_do_CircleHere(p_latitude, p_longitude, p_altitude, p_radius, p_turns);

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_partyID, msg.mt, msg.ms);
    }


    API_requestReloadLocalGroupGeoFenceTasks(v_target) {
        this._API_requestReloadLocalGroupTasks(v_target, CONST_TASK_SCOPE_LOCALGROUP, js_andruavMessages.CONST_TYPE_AndruavMessage_ExternalGeoFence);
    }


    // local function
    _API_requestReloadLocalGroupTasks(v_target, v_taskscope, v_tasktype) {
        let v_msg = {
            C: js_andruavMessages.CONST_TYPE_AndruavSystem_LoadTasks, // hardcoded here
            ts: v_taskscope
        };

        if (v_tasktype !== null && v_tasktype !== undefined)
            v_msg.tp = v_tasktype;


        js_andruav_ws.AndruavClientWS.API_sendCMD(v_target, js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };


    API_requestGeoFences(p_andruavUnit, p_fenceName) {
        if (!p_andruavUnit?.getPartyID()) return;

        let v_msg = {
            C: js_andruavMessages.CONST_TYPE_AndruavMessage_GeoFence

        };
        if (p_fenceName !== null && p_fenceName !== undefined) {
            v_msg.fn = p_fenceName;
        }

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };


    API_requestGeoFencesAttachStatus(p_andruavUnit, p_fenceName) {

        const c_party = p_andruavUnit?.getPartyID();
        if (!c_party) return;


        const cmd = CCommandAPI.API_requestGeoFencesAttachStatus(c_party, p_fenceName);

        js_andruav_ws.AndruavClientWS.API_sendCMD(c_party, cmd.mt, cmd.ms);
    };


    API_requestDeleteGeoFences(p_andruavUnit, p_fenceName) {


        let v_msg = {
            C: js_andruavMessages.CONST_RemoteCommand_CLEAR_FENCE_DATA

        };
        if (p_fenceName !== null && p_fenceName !== undefined) {
            v_msg.fn = p_fenceName;
        }


        js_andruav_ws.AndruavClientWS.API_sendCMD((p_andruavUnit !== null && p_andruavUnit !== undefined) ? p_andruavUnit.getPartyID() : null, js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
    };


    API_uploadWayPoints(p_andruavUnit, p_eraseFirst, p_textMission) { // eraseFirst NOT IMPLEMENTED YET
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const v_msg = {
            a: p_textMission
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_UploadWayPoints, v_msg);
    };


    API_uploadDEMission(p_andruavUnit, p_eraseFirst, p_jsonMission) { // eraseFirst NOT IMPLEMENTED YET
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const v_msg = {
            j: p_jsonMission,
            e: p_eraseFirst
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_Upload_DE_Mission, v_msg);
    };

    API_saveWayPointTasks(p_accountID, m_groupName, p_partyID, p_receiver, isPermanent, p_missionV110) {
        if ((p_partyID === null || p_partyID === undefined) || (p_partyID === ""))
            p_partyID = '_any_';

        if ((m_groupName === null || m_groupName === undefined) || (m_groupName === ""))
            m_groupName = '_any_';

        const c_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: m_groupName,
            s: this.partyID,
            r: p_receiver,
            mt: js_andruavMessages.CONST_TYPE_AndruavMessage_UploadWayPoints,
            ip: isPermanent,
            t: { 'a': p_missionV110 }
        }

        js_andruav_ws.AndruavClientWS._API_sendSYSCMD(js_andruavMessages.CONST_TYPE_AndruavSystem_SaveTasks, c_msg);
    }

    API_requestDeleteWayPoints(p_andruavUnit) {

        // DO NOT Send this command globally to all units. It is a unit specific command.
        // TODO: Restrict this from SERVER
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        const c_party = p_andruavUnit != null ? p_andruavUnit.getPartyID() : null;

        const cmd = CCommandAPI.API_requestDeleteWayPoints();
        js_andruav_ws.AndruavClientWS.API_sendCMD(c_party, cmd.mt, cmd.ms);
    };


    API_requestDeleteFenceByName(p_andruavUnit, p_fenceName) {

        const c_party = p_andruavUnit != null ? p_andruavUnit.getPartyID() : null;

        const cmd = CCommandAPI.API_requestDeleteFenceByName(p_fenceName);

        js_andruav_ws.AndruavClientWS.API_sendCMD(c_party, cmd.mt, cmd.ms);

    };


    /**
         * 
         * @param {*} p_andruavUnit 
         * @param {*} p_missionNumber mission is zero based - zero is home position
         */
    API_do_StartMissionFrom(p_andruavUnit, p_missionNumber) {

        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        if (p_missionNumber < 0)
            p_missionNumber = 0;

        const p_msg = {

            C: js_andruavMessages.CONST_RemoteCommand_SET_START_MISSION_ITEM,
            n: p_missionNumber
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, p_msg);


    };


    API_FireDeEvent(p_andruavUnit, p_event_id) {
        const c_party = p_andruavUnit != null ? p_andruavUnit.getPartyID() : null;

        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
            return;
        }

        const cmd = CCommandAPI.API_FireDeEvent(p_andruavUnit, p_event_id);
        js_andruav_ws.AndruavClientWS.API_sendCMD(c_party, cmd.mt, cmd.ms);
    }

    // CODEBLOCK_START
    API_requestSearchableTargets(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { // used to test behavior after removing code and as double check
            return;
        }

        let p_msg = {};
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_SearchTargetList, p_msg);
    }
    // CODEBLOCK_END

    API_requestUdpProxyStatus(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        const msg = {
            C: js_andruavMessages.CONST_TYPE_AndruavMessage_UdpProxy_Info
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);

    }

    API_setUdpProxyClientPort(p_andruavUnit, p_clientPort) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        const msg = {
            C: js_andruavMessages.CONST_RemoteCommand_SET_UDPPROXY_CLIENT_PORT,
            P: p_clientPort
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);

    }

    API_requestMissionCount(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        const msg = {
            C: js_andruavMessages.CONST_RemoteCommand_MISSION_COUNT
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);

    }

    API_requestWayPoints(p_andruavUnit, p_enableFCB) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let msg = {};
        if (p_enableFCB === true) {
            msg.C = js_andruavMessages.CONST_RemoteCommand_RELOAD_WAY_POINTS_FROM_FCB;
        } else {
            msg.C = js_andruavMessages.CONST_RemoteCommand_GET_WAY_POINTS;
        }

        if (js_globals.v_waypointsCache.hasOwnProperty(p_andruavUnit.getPartyID()) === true) {
            // ! due to disconnection or repeated request this array could be filled of an incomplete previous request.
            // ! this value will be reset each time load wp is called.
            delete js_globals.v_waypointsCache[p_andruavUnit.getPartyID()];
        }
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };


    API_requestParamList(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        let msg = {};
        msg.C = js_andruavMessages.CONST_RemoteCommand_REQUEST_PARAM_LIST;

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };


    API_requestCameraList(p_andruavUnit, p_callback) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        if (p_callback !== null && p_callback !== undefined) {
            js_andruav_parser.AndruavClientParser.fn_callbackOnMessageID(p_callback, js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList);
        }

        let p_msg = {
            C: js_andruavMessages.CONST_TYPE_AndruavMessage_CameraList
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, p_msg);
    };


    /*
        * Disable Geo Fence info to Offline Tasks
        * */
    API_disableWayPointTasks(p_accountID, p_groupName, p_partyID, p_receiver, p_isPermanent) {
        if (p_partyID === null || p_partyID === undefined)
            p_partyID = '_any_';

        if (p_groupName === null || p_groupName === undefined)
            p_groupName = '_any_';

        let p_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: p_groupName,
            // sender: this.partyID,
            // receiver: receiver,
            mt: js_andruavMessages.CONST_TYPE_AndruavMessage_ExternalCommand_WayPoints,
            ip: p_isPermanent,
            enabled: 1
        }

        js_andruav_ws.AndruavClientWS._API_sendSYSCMD(js_andruav_ws.CMD_SYS_TASKS, js_andruavMessages.CONST_TYPE_AndruavSystem_DisableTasks, p_msg);
    };


    API_TXCtrl(p_andruavUnit, p_subAction) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let p_msg = {
            b: p_subAction

        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteControlSettings, p_msg);

    }


    API_connectToFCB(p_andruavUnit) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;
        let p_msg = {
            C: js_andruavMessages.CONST_RemoteCommand_CONNECT_FCB

        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, p_msg);
    }


    API_SwitchCamera(p_target, p_cameraUniqueName) {
        let msg = {
            u: p_cameraUniqueName
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_target, js_andruavMessages.CONST_TYPE_AndruavMessage_CameraSwitch, msg);
    };


    API_TurnMobileFlash(p_target, p_flashOn, p_cameraUniqueName) {
        let msg = {
            f: p_flashOn,
            u: p_cameraUniqueName
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_target, js_andruavMessages.CONST_TYPE_AndruavMessage_CameraFlash, msg);
    };


    API_CONST_RemoteCommand_zoomCamera(p_target, p_cameraUniqueName, p_isZoomeIn, p_zoomValue, p_zoomValueStep) {
        let msg = {
            u: p_cameraUniqueName,
            a: p_isZoomeIn
        };

        if (p_zoomValue !== null && p_zoomValue !== undefined)
            msg.b = p_zoomValue;

        if (p_zoomValueStep !== null && p_zoomValueStep !== undefined)
            msg.c = p_zoomValueStep;



        js_andruav_ws.AndruavClientWS.API_sendCMD(p_target, js_andruavMessages.CONST_TYPE_AndruavMessage_CameraZoom, msg);
    };


    API_CONST_RemoteCommand_takeImage2(p_target, _cameraSource, _numberofImages, _timeBetweenShots, _distanceBetweenShots) {
        const msg = {
            a: _cameraSource,
            b: parseInt(_numberofImages),
            c: parseFloat(_timeBetweenShots),
            d: parseFloat(_distanceBetweenShots)
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_target, js_andruavMessages.CONST_TYPE_AndruavMessage_Ctrl_Camera, msg);
    };


    API_CONST_RemoteCommand_recordVideo(p_target, p_trackId, p_OnOff) {
        let v_unit = js_globals.m_andruavUnitList.fn_getUnit(p_target);
        if (v_unit === null || v_unit === undefined) { // you may declare an error message or send for ID Request
            return;
        }

        let v_OnOff;

        if (p_OnOff !== null && p_OnOff !== undefined) {
            v_OnOff = p_OnOff;
        } else {
            v_OnOff = !v_unit.m_Video.VideoRecording
        }

        const v_msg = {
            C: js_andruavMessages.CONST_RemoteCommand_RECORDVIDEO,
            // New field here
            T: p_trackId,
            Act: v_OnOff
        };
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_target, js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, v_msg);
        js_eventEmitter.fn_dispatch(js_event.EE_Video_State_Change, { unit: v_unit, onff: v_OnOff });
    };


    API_saveGeoFenceTasks(p_accountID, m_groupName, p_partyID, p_receiver, isPermanent, m_geofenceInfo) {
        if (p_partyID === null || p_partyID === undefined)
            p_partyID = '_any_';

        if (m_groupName === null || m_groupName === undefined)
            m_groupName = '_any_';

        const c_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: m_groupName,
            s: this.partyID,
            r: p_receiver,
            mt: js_andruavMessages.CONST_TYPE_AndruavMessage_ExternalGeoFence,
            ip: isPermanent,
            t: m_geofenceInfo
        }

        js_andruav_ws.AndruavClientWS._API_sendSYSCMD(js_andruavMessages.CONST_TYPE_AndruavSystem_SaveTasks, c_msg);
    }


    API_loadGeoFence(p_accountID, m_groupName, p_partyID, p_receiver, isPermanent) {
        if (p_partyID === null || p_partyID === undefined)
            p_partyID = '_any_';

        if (m_groupName === null || m_groupName === undefined)
            m_groupName = '_any_';

        const c_msg = {
            ai: p_accountID,
            ps: p_partyID,
            gn: m_groupName,
            // sender: this.partyID,
            r: p_receiver,
            mt: js_andruavMessages.CONST_TYPE_AndruavMessage_ExternalGeoFence,
            ip: isPermanent
        }

        js_andruav_ws.AndruavClientWS._API_sendSYSCMD(js_andruavMessages.CONST_TYPE_AndruavSystem_LoadTasks, c_msg);
    }

    API_disableGeoFenceTasks(p_accountID, m_groupName, p_partyID, p_receiver, isPermanent) {
        if (p_partyID === null || p_partyID === undefined)
            p_partyID = '_any_';

        if (m_groupName === null || m_groupName === undefined)
            m_groupName = '_any_';


        const c_msg = {
            ai: p_accountID,
            // party_sid: partyID,
            gn: m_groupName,
            // sender: this.partyID,
            // receiver: p_receiver,
            mt: js_andruavMessages.CONST_TYPE_AndruavMessage_ExternalGeoFence,
            ip: isPermanent,
            enabled: 1
        }

        js_andruav_ws.AndruavClientWS._API_sendSYSCMD(js_andruavMessages.CONST_TYPE_AndruavSystem_DisableTasks, c_msg);
    };



    API_setUnitName(p_andruavUnit, p_name, p_description) {
        if ((p_name === null) || (p_name === "") || (p_description === null) || (p_description === "")) return;

        const msg = {
            UN: p_name,
            DS: p_description,
            PR: true // reset partyID
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_Unit_Name, msg);
    }

    /***
    * Tell drone I will send you control -gamepad- info.
    */
    API_engageRX(p_andruavUnit) {
        const c_currentEngagedUnitRX = js_globals.m_andruavUnitList.getEngagedUnitRX();
        if ((c_currentEngagedUnitRX) &&
            (c_currentEngagedUnitRX.getPartyID() !== p_andruavUnit.getPartyID())) { // This webGCS is already engaged with another Drone. so Tell Drone I am no longer controlling you.
            this.API_disengageRX(c_currentEngagedUnitRX);
        }

        this.API_engageGamePad(p_andruavUnit);
    };

    /***
    * Tells drone I am no longer sending you control -gamepad- info.
    * @param {*} p_andruavUnit 
    */
    API_disengageRX(p_andruavUnit) {

        js_globals.m_andruavUnitList.disengageUnitRX(p_andruavUnit);
        const cmd = CCommandAPI.API_disengageRX();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);

        js_eventEmitter.fn_dispatch(js_event.EE_releaseGamePad, p_andruavUnit);
    };


    API_engageGamePad(p_andruavUnit) {

        js_globals.m_andruavUnitList.engageUnitRX(p_andruavUnit);
        const cmd = CCommandAPI.API_engageGamePad();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
        js_eventEmitter.fn_dispatch(js_event.EE_requestGamePad, p_andruavUnit);
    }


    API_WriteAllParameters(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const c_list = p_andruavUnit.m_FCBParameters.m_list_by_index_shadow;
        const c_keys = Object.keys(c_list);
        const c_len = c_keys.length;


        for (let i = 0; i < c_len; ++i) {
            const c_parameter_message = c_list[c_keys[i]];

            if ((c_parameter_message.is_valid === true)
                && (c_parameter_message.is_dirty === true)) {
                this.API_WriteParameter(p_andruavUnit, c_parameter_message);
            }
        }

    }

    /**
     * Sends parameter to write to Andruav Unit in MAVlink.
     * @param {*} p_andruavUnit 
     * @param {*} p_mavlink_param 
     */
    API_WriteParameter(p_andruavUnit, p_mavlink_param) {
        p_mavlink_param.param_value = p_mavlink_param.modified_value;
        let p_param_set = new mavlink20.messages.param_set(
            p_mavlink_param.target_system, p_mavlink_param.target_component,
            p_mavlink_param.param_id, p_mavlink_param.param_value,
            p_mavlink_param.param_type
        );
        let x = p_param_set.pack(p_param_set);
        let z = js_helpers.array_to_ArrayBuffer(x);
        this.API_sendBinCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavBinaryMessage_Mavlink, z);
        p_mavlink_param.is_dirty = false;
    };


    API_SendTrackCRegion(p_andruavUnit, p_corner1_x, p_corner1_y, p_corner2_x, p_corner2_y) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        let msg = {
            a: js_andruavMessages.CONST_TrackingTarget_ACTION_TRACKING_REGION,
            b: p_corner1_x,
            c: p_corner1_y,
            d: p_corner2_x,
            e: p_corner2_y
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_TrackingTarget_ACTION, msg);
    };


    API_SendTrackPoint(p_andruavUnit, p_center_x, p_center_y, p_radius) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_SendTrackPoint();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };


    API_StopTracking(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_StopTracking();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };


    API_PauseTracking(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_PauseTracking();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);

    };

    API_EnableTracking(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_EnableTracking();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    }


    API_SendTrackAISelect(p_andruavUnit, selected_object_list) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_SendTrackAISelect(selected_object_list);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };


    API_DisableTrackingAI(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_DisableTrackingAI();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };



    API_EnableTrackingAI(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_EnableTrackingAI();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);

    };


    API_GetTrackingAIClassList(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_GetTrackingAIClassList();
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);

    };


    API_SetCommunicationChannel(p_andruavUnit, comm_on_off, p2p_on_off, comm_on_off_duration, p2p_on_off_duration, comm_local_on_off, comm_local_on_off_duration) {

        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_SetCommunicationChannel(p_andruavUnit, comm_on_off, p2p_on_off, comm_on_off_duration, p2p_on_off_duration, comm_local_on_off, comm_local_on_off_duration);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };


    API_connectToLocalCommServer(p_andruavUnit, p_localCommServerIP, p_localCommServerPort) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_connectToLocalCommServer(p_andruavUnit, p_localCommServerIP, p_localCommServerPort);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };

    API_requestIMU(p_andruavUnit, on_off) {

        let msg = {
            C: js_andruavMessages.CONST_RemoteCommand_IMUCTRL,
            Act: on_off
        };

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    }




    API_resumeTelemetry(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_resumeTelemetry(p_andruavUnit);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };


    API_pauseTelemetry(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        const cmd = CCommandAPI.API_pauseTelemetry(p_andruavUnit);
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), cmd.mt, cmd.ms);
    };

    API_adjustTelemetryDataRate(p_andruavUnit, lvl) {
        if (p_andruavUnit === null || p_andruavUnit === undefined)
            return;

        let msg = {
            C: js_andruavMessages.CONST_RemoteCommand_TELEMETRYCTRL,
            Act: js_andruavMessages.CONST_TELEMETRY_ADJUST_RATE
        };
        if ((lvl !== null && lvl !== undefined) && (lvl !== -1)) {
            msg.LVL = lvl;
        }

        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);
    };



    API_stopTelemetry(p_andruavUnit) {

        let msg = {
            C: js_andruavMessages.CONST_RemoteCommand_TELEMETRYCTRL,
            Act: js_andruavMessages.CONST_TELEMETRY_REQUEST_END
        };

        this.currentTelemetryUnit = undefined; // it might be already null and not synch-ed
        js_andruav_ws.AndruavClientWS.API_sendCMD(p_andruavUnit.getPartyID(), js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute, msg);

        p_andruavUnit.m_Telemetry._isActive = false;
        js_eventEmitter.fn_dispatch(js_event.EE_unitTelemetryOff, p_andruavUnit);
    };


    // receives event from gamepad and store it for sending.
    #fn_sendAxes(p_me) { // game pad should be attached to a unit.
        const c_currentEngagedUnitRX = js_globals.m_andruavUnitList.getEngagedUnitRX();
        if (!c_currentEngagedUnitRX)
            return;


        const c_controller = js_andruav_gamepad.fn_getGamePad(js_globals.active_gamepad_index);
        if (c_controller === null || c_controller === undefined)
            return;

        // read gamepad values
        p_me.v_axes = c_controller.p_unified_virtual_axis;
        p_me.v_sendAxes = true;

        js_common.fn_console_log("fn_sendAxes");
    }
}

Object.seal(CAndruavClientFacade.prototype);
export const AndruavClientFacade = CAndruavClientFacade.getInstance();

