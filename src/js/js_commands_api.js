/* ********************************************************************************
*   Mohammad Hefny
*
*   01 Sep 2024
*
* This class gather APIs in one class away from WS class.
* This class creates the JSON command itself.
*********************************************************************************** */


import * as js_andruavMessages from './js_andruavMessages.js';
import * as js_common from './js_common.js'

export class CCommandAPI {

    constructor() {

    }

    static API_requestID() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_TYPE_AndruavMessage_ID
            }
        };

        return msg;
    };

    static API_requestP2P() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_INFO
            }
        };

        return msg;
    };

    static API_requestSDR() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_REMOTE_EXECUTE,
            'ms': {
                C: js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
                a: js_andruavMessages.CONST_SDR_ACTION_SDR_INFO
            }
        };

        return msg;
    };


    static API_scanSDRDrivers() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_REMOTE_EXECUTE,
            'ms': {
                C: js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
                a: js_andruavMessages.CONST_SDR_ACTION_LIST_SDR_DEVICES
            }
        };

        return msg;
    };


    static API_scanSDRFreq(p_on_off) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
            'ms': {
                a: p_on_off === true ? js_andruavMessages.CONST_SDR_ACTION_READ_DATA : js_andruavMessages.CONST_SDR_ACTION_PAUSE_DATA
            }
        };

        return msg;
    };

    static API_do_SetHomeLocation(p_andruavUnit, p_latitude, p_longitude, p_altitude) {

        if (p_altitude === null || p_altitude === undefined) {
            p_altitude = 0;
        }

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SetHomeLocation,
            'ms': {
                T: p_latitude,
                O: p_longitude,
                A: p_altitude,
            }
        };

        return msg;
    }

    static API_do_SendHomeLocation(p_andruavUnit, p_latitude, p_longitude, p_altitude, p_radius_accuracy, p_altitude_accuracy) {

        if (p_altitude === null || p_altitude === undefined) {
            p_altitude = 0;
        }

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_HomeLocation,
            'ms': {
                T: p_latitude,
                O: p_longitude,
                A: p_altitude,
                ...((p_radius_accuracy !== null && p_radius_accuracy !== undefined) && { R: p_radius_accuracy }), // Conditional properties
                ...((p_altitude_accuracy !== null && p_altitude_accuracy !== undefined) && { H: p_altitude_accuracy }), // Conditional properties
            }
        };

        return msg;
    }

    static API_requestGPIOStatus(p_andruavUnit, p_module_key, p_pin_number) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        let p_msg = {
            a: js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_STATUS,
        };

        if (p_pin_number !== null && p_pin_number !== undefined) {
            p_msg.p = p_pin_number;
            p_msg.i = p_module_key;
        }

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_REMOTE_EXECUTE,
            'ms': p_msg
        };

        return msg;
    }


    static API_writeGPIO(p_andruavUnit, p_module_key, p_pin_number, p_pin_value_new) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        let p_msg = {
            i: p_module_key,
            a: js_andruavMessages.CONST_GPIO_ACTION_PORT_WRITE,
            //n: pin_name,  // optional if pin_number exists.
            p: p_pin_number,  // optional if pin_name exists.
            v: parseInt(p_pin_value_new),
        };

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_ACTION,
            'ms': p_msg
        };

        return msg;
    }


    static API_writeGPIO_PWM(p_andruavUnit, p_module_key, p_pin_number, p_pin_value_new, p_pin_pwm_width_new) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        let p_msg = {
            i: p_module_key,
            a: js_andruavMessages.CONST_GPIO_ACTION_PORT_WRITE,
            //n: pin_name,  // optional if pin_number exists.
            p: p_pin_number,  // optional if pin_name exists.
            d: p_pin_pwm_width_new, // duty cycle from 0 to 1024
            v: parseInt(p_pin_value_new),
        };

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_GPIO_ACTION,
            'ms': p_msg
        };

        return msg;
    }


    static API_soundTextToSpeech(p_andruavUnit, p_text, p_language, p_pitch, p_volume) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        let p_msg = {
            t: p_text
        };

        if (p_language !== '' && p_language != null && p_language !== undefined) {
            p_msg.l = p_language;
        }

        if (p_pitch !== '' && p_pitch != null && p_pitch !== undefined) {
            p_msg.p = p_pitch;
        }

        if (p_volume !== '' && p_volume != null && p_volume !== undefined) {
            p_msg.v = p_volume;
        }

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SOUND_TEXT_TO_SPEECH,
            'ms': p_msg
        };

        return msg;
    }

    static API_scanP2P() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_P2P_ACTION_SCAN_NETWORK
            }
        };

        return msg;
    };


    static API_resetP2P() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_P2P_ACTION_RESTART_TO_MAC
            }
        };

        return msg;
    };


    static API_makeSwarm(p_andruavUnit, p_formationID, p_horizontal_distance, p_vertical_distance) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        let msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_MakeSwarm,
            'ms': {
                a: p_formationID, // m_formation_as_leader
                b: p_andruavUnit.getPartyID() // Leader
            }
        };

        if (p_formationID !== 0) {
            msg.ms.h = p_horizontal_distance;
            msg.ms.v = p_vertical_distance;
        }

        return msg;
    }

    static API_requestFromDroneToFollowAnother(p_andruavUnit, slaveIndex, leaderPartyID, do_follow) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return;

        if ((do_follow === null || do_follow === undefined)
            && (leaderPartyID === null || leaderPartyID === undefined)) {
            do_follow = js_andruavMessages.CONST_TYPE_SWARM_UNFOLLOW;
        }

        const partyID = p_andruavUnit.getPartyID();
        let p_msg = {
            a: slaveIndex, // index ... could be -1 to take available location.
            c: partyID, // slave
            f: do_follow
        };

        if (leaderPartyID !== null && leaderPartyID !== undefined) {
            p_msg.b = leaderPartyID;
        }


        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_FollowHim_Request,
            'ms': p_msg
        };

        return msg;
    }

    static API_setSDRConfig(p_andruavUnit, p_fequency_center,
        p_gain, p_sample_rate,
        p_decode_mode, p_driver_index, p_interval,
        p_display_bars, p_trigger_level
    ) {
        if (p_andruavUnit.getPartyID() === null || p_andruavUnit.getPartyID() === undefined) return null;

        let p_msg = {
            'a': js_andruavMessages.CONST_SDR_ACTION_SET_CONFIG
        };

        if (p_fequency_center !== null) p_msg.fc = p_fequency_center;
        if (p_gain !== null) p_msg.g = p_gain;
        if (p_sample_rate !== null) p_msg.s = p_sample_rate;
        if (p_decode_mode !== null) p_msg.m = p_decode_mode;
        if (p_driver_index !== null) p_msg.i = p_driver_index;
        if (p_interval !== null) p_msg.t = p_interval; // in milli-seconds - 0 means ignore
        if (p_display_bars !== null) p_msg.r = p_display_bars;
        if (p_trigger_level !== null) p_msg.l = p_trigger_level;

        js_common.fn_console_log(p_msg);

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
            'ms': p_msg
        };

        return msg;

    }


    static API_SetCommunicationChannel(p_andruavUnit, comm_on_off, p2p_on_off, comm_on_off_duration, p2p_on_off_duration, comm_local_on_off, comm_local_on_off_duration) {
        let p_msg = {
        };

        if (comm_on_off != null) {
            p_msg.ws = comm_on_off;
            if (comm_on_off_duration != null) {
                p_msg.wsd = comm_on_off_duration;
            }
        }


        if (comm_local_on_off != null) {
            p_msg.w2 = comm_local_on_off;
            if (comm_local_on_off_duration != null) {
                p_msg.w2d = comm_local_on_off_duration;
            }
        }



        if (p2p_on_off != null) {
            p_msg.p2p = p2p_on_off;
            if (p2p_on_off_duration != null) {
                p_msg.p2pd = p2p_on_off_duration;
            }
        }


        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Set_Communication_Line,
            'ms': p_msg
        };

        return msg;
    }



    static API_connectToLocalCommServer(p_andruavUnit, p_localCommServerIP, p_localCommServerPort) {
        let p_msg = {
            u: p_localCommServerIP,
            p: p_localCommServerPort
        };

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_LocalServer_ACTION,
            'ms': p_msg
        };

        return msg;
    }



    static API_resumeTelemetry() {

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_RemoteCommand_TELEMETRYCTRL,
                Act: js_andruavMessages.CONST_TELEMETRY_REQUEST_RESUME
            }
        };

        return msg;
    };


    static API_pauseTelemetry() {

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_RemoteCommand_TELEMETRYCTRL,
                Act: js_andruavMessages.CONST_TELEMETRY_REQUEST_PAUSE
            }
        };

        return msg;
    };


    static API_do_FlyHere(p_latitude, p_longitude, p_altitude, p_xVel, p_yVel, p_zVel) {

        if (isNaN(p_altitude) === true) p_altitude = 0;

        let v_msg = {
            a: p_latitude,
            g: p_longitude,
            l: p_altitude
        };

        if (p_xVel !== null && p_xVel !== undefined) {
            v_msg.x = p_xVel;
            v_msg.y = p_yVel;
            v_msg.z = p_zVel;
        }

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_GuidedPoint,
            'ms': v_msg
        }

        return msg;
    };

    static API_do_CircleHere(p_latitude, p_longitude, p_altitude, p_radius, p_turns) {

        const v_msg = {
            a: p_latitude,
            g: p_longitude,
            l: p_altitude,
            r: p_radius,
            t: p_turns
        };

        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_CirclePoint,
            'ms': v_msg
        }

        return msg;
    };


    static API_FireDeEvent(p_andruavUnit, p_event_id) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Sync_EventFire,
            'ms': {
                d: p_event_id.toString()
            }
        };

        return msg;
    }


    static API_requestDeleteWayPoints() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_RemoteCommand_CLEAR_WAY_POINTS
            }
        };

        return msg;
    }

    static API_requestDeleteFenceByName(p_fenceName) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_RemoteCommand_CLEAR_FENCE_DATA
            }
        };

        if (p_fenceName !== null && p_fenceName !== undefined) {
            msg.fn = p_fenceName;
        }

        return msg;
    }

    static API_requestGeoFencesAttachStatus(p_andruavUnit, p_fenceName) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_TYPE_AndruavMessage_GeoFenceAttachStatus,
                ...(p_fenceName && { fn: p_fenceName })
            }
        };

        return msg;
    }

    static API_StopTracking() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_TrackingTarget_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_TRACKING_STOP
            }
        };

        return msg;
    }

    static API_SendTrackPoint(p_center_x, p_center_y, p_radius) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_TrackingTarget_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_TRACKING_POINT,
                b: p_center_x,
                c: p_center_y,
                r: p_radius
            }
        };

        return msg;
    }

    static API_PauseTracking() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_TrackingTarget_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_TRACKING_PAUSE
            }
        };

        return msg;
    }


    static API_EnableTracking() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_TrackingTarget_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_TRACKING_ENABLE
            }
        };

        return msg;
    }


    static API_SendTrackAISelect(selected_object_list) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_AI_Recognition_SEARCH,
                i: selected_object_list, // class index not class names
            }
        };

        return msg;
    }


    static API_DisableTrackingAI() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_AI_Recognition_DISABLE
            }
        };

        return msg;
    }


    static API_EnableTrackingAI() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_AI_Recognition_ENABLE
            }
        };

        return msg;
    }

    static API_GetTrackingAIClassList() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_AI_Recognition_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TrackingTarget_ACTION_AI_Recognition_CLASS_LIST
            }
        };

        return msg;
    }

    static API_disengageRX() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteControlSettings,
            'ms': {
                b: js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED
            }
        };

        return msg;
    }

    static API_engageGamePad() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteControlSettings,
            'ms': {
                b: js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS
            }
        };

        return msg;
    }


    static API_do_ServoChannel(p_channel_num, p_value) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_ServoChannel,
            'ms': {
                n: parseInt(p_channel_num),
                v: parseInt(p_value)
            }
        };

        return msg;
    }


    static API_requestServoChannel() {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                C: js_andruavMessages.CONST_TYPE_AndruavMessage_ServoChannel
            }
        };

        return msg;
    }


    static API_updateConfigRestart(p_module_key) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_CONFIG_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TYPE_CONFIG_ACTION_Restart,
            }
        };

        if (p_module_key) {
            msg.ms.b = p_module_key
        }

        return msg;
    }


    static API_updateConfigJSON(p_module_key, p_json_config) {
        const msg =
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_CONFIG_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_TYPE_CONFIG_ACTION_APPLY_CONFIG,
                c: p_json_config
            }
        };

        if (p_module_key) {
            msg.ms.b = p_module_key
        }

        return msg;
    }

}

