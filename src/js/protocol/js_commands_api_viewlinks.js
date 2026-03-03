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

    static API_do_ViewLink_Camera_Control(p_optical_zoom) {
        /*
            the physical value of level can be from 1 to 20:
            1.0 = 1x zoom (minimum)
            20.0 = 20x zoom (maximum for EO optical zoom)
            Values are in 0.1x increments (e.g., 2.5 = 2.5x)
        */
        
        // Clamp optical zoom value to valid range
        if (typeof p_optical_zoom !== 'number') {
            return ;
        } else {
            p_optical_zoom = Math.max(1.0, Math.min(20.0, p_optical_zoom));
        }
        
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_CAMERA_CONTROL,
                b: p_optical_zoom
            }
        };

        return msg;
    }


    static API_do_ViewLink_Camera_Zoom_Control(p_optical_zoom) {
        /*
            the physical value of level can be from 1 to 20:
            1.0 = 1x zoom (minimum)
            20.0 = 20x zoom (maximum for EO optical zoom)
            Values are in 0.1x increments (e.g., 2.5 = 2.5x)
        */
        
        // Clamp optical zoom value to valid range
        if (typeof p_optical_zoom !== 'number') {
            return ;
        } else {
            p_optical_zoom = Math.max(1.0, Math.min(20.0, p_optical_zoom));
        }
        
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_CAMERA_CONTROL,
                b: js_andruavMessages.VIEWLINK_CAMERA_SET_OPTICAL_ZOOM_LEVEL,
                c: p_optical_zoom
            }
        };

        return msg;
    }

    static API_do_ViewLink_Gimbal_Control_Absolute_Position(p_pitch, p_yaw) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_GIMBAL_CONTROL,
                b: js_andruavMessages.VIEWLINK_GIMBAL_ABSOLUTE_POSITION,
                p: p_pitch,
                y: p_yaw
            }
        };

        return msg;
    }


    static API_do_ViewLink_Gimbal_Control_Incremental_Adjust(p_pitch_step, p_yaw_step) {
        const msg = {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Viewlink_ACTION,
            'ms': {
                a: js_andruavMessages.CONST_VIEWLINK_ACTION_GIMBAL_CONTROL,
                b: js_andruavMessages.VIEWLINK_GIMBAL_INCREMENTAL_ADJUST,
                p: p_pitch_step,
                y: p_yaw_step
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