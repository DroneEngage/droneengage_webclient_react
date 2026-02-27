/* ********************************************************************************
*   Mohammad Hefny
*
*   28 Feb 2026
*
* This class gather APIs for ViewLinks in one class.
* This class creates the JSON command itself.
*********************************************************************************** */


import * as js_andruavMessages from './js_andruavMessages.js';
import * as js_common from '../js_common.js'
import { mavlink20 } from '../js_mavlink_v2.js'

export class CCommandAPI_ViewLink {

    constructor() {

    }


    static API_do_ViewLink_Laser_Control(p_laser_cmd) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_LASER_CONTROL,
                b: p_laser_cmd
            }
        };

        return msg;
    }


    static API_do_ViewLink_Tracker_Control(p_tracker_cmd) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_TRACKER_CONTROL,
                b: p_tracker_cmd
            }
        };

        return msg;
    }

    static API_do_ViewLink_AI_Control(p_ai_cmd) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_AI_CONTROL,
                b: p_ai_cmd
            }
        };

        return msg;
    }

    static API_do_ViewLink_Camera_Control(p_camera_cmd) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_CAMERA_CONTROL,
                b: p_camera_cmd
            }
        };

        return msg;
    }

    static API_do_ViewLink_Gimbal_Control(p_gimbal_cmd, p_pitch, p_yaw, p_roll) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_GIMBAL_CONTROL,
                b: p_gimbal_cmd,
                p: p_pitch,
                y: p_yaw,
                r: p_roll
            }
        };

        return msg;
    }

    static API_do_ViewLink_Get_Status() {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_GET_STATUS
            }
        };

        return msg;
    }
}