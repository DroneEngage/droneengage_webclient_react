/*************************************************************************************
 * 
 *   A N D R U A V - G A M E P A D       JAVASCRIPT  LIB
 * 
 *   Author: Mohammad S. Hefny
 * 
 *   Date:   06 March 2020
 * 
 * 
 * 
 *************************************************************************************/


import * as js_andruavMessages from './js_andruavMessages'
import * as js_helpers from '../js/js_helpers'
import {js_globals} from './js_globals'
import {js_eventEmitter} from './js_eventEmitter'
import * as js_common from './js_common.js'

const GAME_XBOX_360_MICROSOFT   = 1;
const GAME_XBOX_360_MICROSOFT_VENDOR  = ["045e","054c","054c","054c"];
const GAME_XBOX_360_MICROSOFT_PRODUCT = ["028e","0ce6","09cc","05c4"];
const GAME_PAD_WAILLY_PPM       = 2;
const GAME_COR_CTRL_MICROSOFT   = 3;
class fn_Obj_padStatus {
    constructor() 
    {
    this.p_ctrl_type = GAME_XBOX_360_MICROSOFT;
    this.p_axes = [-1, 0, 0, 0];

    this.p_buttons = [];

    this.p_connected = false;

    this.p_vibration = false;

    for (let i = 0; i < 6; ++ i) {
        let v_obj = {};
        v_obj.m_pressed = false;
        v_obj.m_timestamp = 0;
        v_obj.m_longPress = false;
        this.p_buttons.push(v_obj);
    }
    }
};

class CAndruavGamePad {

    constructor() {
        this.c_haveEvents = 'GamepadEvent'; 
        this.v_lastUpdateSent = Date.now();
        this.v_controllers = {};
        

        if (this.c_haveEvents) {
            window.addEventListener('gamepadconnected', this.fn_onConnect);
            window.addEventListener('gamepaddisconnected', this.fn_onDisconnect);
            
        } else {
            setInterval(this.fn_scangamepads, 500);
        }

    }

    

    static getInstance() {
        if (!CAndruavGamePad.instance) {
            CAndruavGamePad.instance = new CAndruavGamePad();
        }
        return CAndruavGamePad.instance;
    }

    fn_getGamePad(index) {
        if (isNaN(index)) 
            return;
        
        return this.v_controllers[index];
    }


    /**
         * true if a gamepad is defined in v_controller.
         * note that a gamePad might be connected but not yet detected so v_controller is empty.
         */
    fn_isGamePadDefined() {
        return Object.keys(this.v_controllers).length >= 1;
    }

    /**
         * Generate vibration if supported
         */
    fn_makeVibration(p_duration) {
        if (isNaN(p_duration)) 
            return;
        

        p_duration = Math.min(Math.max(p_duration, 0), 2000);
        if (this.c_padStatus.p_vibration === true) {
            let pads = navigator.getGamepads();
            pads[0].vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: p_duration,
                weakMagnitude: 0.5,
                strongMagnitude: 0.5
            });
        }
    }

    fn_onConnect(e) {
        js_common.fn_console_log(e);

        let gp = navigator.getGamepads()[e.gamepad.index];
        js_common.fn_console_log("Gamepad connected at index %d: %s. %d buttons, %d axes.", gp.index, gp.id, gp.buttons.length, gp.axes.length);

        CAndruavGamePad.getInstance().fn_addgamepad(CAndruavGamePad.getInstance(),e.gamepad);
        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Connected, e.gamepad);
    };


    fn_onDisconnect(e) {
        js_common.fn_console_log(e);
        CAndruavGamePad.getInstance().fn_removeGamepad(CAndruavGamePad.getInstance(),e.gamepad);
        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Disconnected, e.gamepad);
    }

    fn_updateStatus() {
        CAndruavGamePad.getInstance().fn_scangamepads();
        window.requestAnimationFrame(CAndruavGamePad.getInstance().fn_updateStatus);
    }

    fn_addgamepad(me, p_gamepad) {
        let v_padStatus = new fn_Obj_padStatus();

        js_common.fn_console_log(p_gamepad.id);
        let vendorNumber;
        let productNumber;
        if (js_helpers.fn_isFireFox())
        {
            const regex = /^([^-]+)-([^-]+)/;
            const match = regex.exec(p_gamepad.id);
            if (match) {
                vendorNumber = match[1];
                productNumber = match[2];
            }
        }
        else if (js_helpers.fn_isChrome())
        {
            let regex = /Vendor:\s+(\w+)/i;
            let match = regex.exec(p_gamepad.id);
            if (match) {
            vendorNumber = match[1];
            
            }
            regex = /Product:\s+(\w+)/i;
            match = regex.exec(p_gamepad.id);
            if (match) {
            productNumber = match[1];
            
            }
        }

        js_common.fn_console_log("vendorNumber:" + vendorNumber + " ::: productNumber:" + productNumber);

        if ((vendorNumber === '06f7') && (productNumber === '0003'))
        {
            v_padStatus.p_ctrl_type = GAME_PAD_WAILLY_PPM;
        }else
        if ((vendorNumber === '0e6f') && (productNumber === 'f501'))
        {
            if (p_gamepad.axes.length === 4)
            {  // just in case this 'bug' exists
                v_padStatus.p_ctrl_type = GAME_XBOX_360_MICROSOFT;
            }
            else
            {   
                v_padStatus.p_ctrl_type = GAME_COR_CTRL_MICROSOFT;
            }

        }else
        if ((GAME_XBOX_360_MICROSOFT_VENDOR.includes(vendorNumber) === true) && (GAME_XBOX_360_MICROSOFT_PRODUCT.includes(productNumber) === true))
        {
            if (p_gamepad.axes.length === 4)
            {
                v_padStatus.p_ctrl_type = GAME_XBOX_360_MICROSOFT;
            }
            else
            {   // on firefox I found it can be detected as GAME_COR_CTRL_MICROSOFT
                v_padStatus.p_ctrl_type = GAME_COR_CTRL_MICROSOFT;
            }
            
            
        }
        
        v_padStatus.id = p_gamepad.id;
        
        me.v_controllers[p_gamepad.index] = v_padStatus;
        v_padStatus.p_connected = true;
        v_padStatus.p_vibration = (p_gamepad.vibrationActuator !== null && p_gamepad.vibrationActuator !== undefined);
        window.requestAnimationFrame(me.fn_updateStatus);
    }

    fn_removeGamepad(me, p_gamepad) {
        if ((p_gamepad !== null && p_gamepad !== undefined) && (me.v_controllers[p_gamepad.index] !== null && me.v_controllers[p_gamepad.index] !== undefined)) {
            delete me.v_controllers[p_gamepad.index];
        }
    }

    fn_scangamepads() {
        const c_gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (let i = 0; i < c_gamepads.length; i++) {
            if (c_gamepads[i]) {
                if (!(c_gamepads[i].index in this.v_controllers)) {
                    this.addgamepad(this,c_gamepads[i]);
                } else {
                    let v_ctrl = this.v_controllers[c_gamepads[i].index];
                    if (v_ctrl === null || v_ctrl === undefined) {
                        v_ctrl = c_gamepads[i];
                    }
                    if (i === js_globals.active_gamepad_index) 
                    {
                        if (c_gamepads[i] === null || c_gamepads[i] === undefined) return; 
                        this.fn_universalPad(c_gamepads[i]);
                    }
                }
            }
        }
    }

    fn_universalPad(p_gamepad) {
        const c_padStatus = this.v_controllers[p_gamepad.index];
        c_padStatus.p_connected = true;

        let v_axesChanged = false;
        const c_now = Date.now();
        //console.log ("xx",p_gamepad.axes);
        if (c_padStatus.p_ctrl_type === GAME_PAD_WAILLY_PPM)
        {
            // Rudder
            let val = (p_gamepad.axes[5]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_axes[0] !== val) {
                v_axesChanged = true;
                c_padStatus.p_axes[0] = val;
                
            }
            // Throttlr
            val = (p_gamepad.axes[2]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_axes[1] !== val) {
                v_axesChanged = true;
                c_padStatus.p_axes[1] = val;
                
            }
            // ROLL
            val = (p_gamepad.axes[0]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_axes[2] !== val) {
                v_axesChanged = true;
                c_padStatus.p_axes[2] = val;
                
            }
            // PITCH
            val = -(p_gamepad.axes[1]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_axes[3] !== val) {
                v_axesChanged = true;
                c_padStatus.p_axes[3] = val;
                
            }

            // send if there are changes or not sending for more than a second then send to avoid timeout from vehicle.
            // the 1000 defines the maximum delay between messages. 
            // minimum delay between messages are defined in js_andruavclient2.js CONST_sendRXChannels_Interval
            if ((v_axesChanged === true) || ((c_now - this.v_lastUpdateSent) > 1000)) {
                js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Axes_Updated);
                this.v_lastUpdateSent = c_now;
            }
        }
        else if (c_padStatus.p_ctrl_type === GAME_XBOX_360_MICROSOFT)
        {

            for (let j = 0; j < 4; ++ j) {
                if (c_padStatus.p_axes[j] !== p_gamepad.axes[j]) {
                    v_axesChanged = true;
                    c_padStatus.p_axes[j] = p_gamepad.axes[j].toFixed(2);
                }
            }

            if ((v_axesChanged === true) ) {
                js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Axes_Updated);
                this.v_lastUpdateSent = c_now;
            }

            let v_buttonChanged = false;

            for (let i = 0; i <= 5; ++ i) {
                const c_pressed = p_gamepad.buttons[i].pressed;
                if (c_padStatus.p_buttons[i].m_pressed !== c_pressed) {
                    v_buttonChanged = true;
                    c_padStatus.p_buttons[i].m_pressed = p_gamepad.buttons[i].pressed;
                    c_padStatus.p_buttons[i].m_timestamp = Date.now();
                    c_padStatus.p_buttons[i].m_longPress = false;
                    if (v_buttonChanged === true) {
                        let v_Packet = {};
                        v_Packet.p_buttonIndex = i;
                        v_Packet.p_buttons = c_padStatus.p_buttons;
                        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Button_Updated, v_Packet);
                    }
                } else {
                    if ((c_pressed === true) && (c_padStatus.p_buttons[i].m_longPress === false) && ((Date.now() - c_padStatus.p_buttons[i].m_timestamp) > js_andruavMessages.CONST_GAMEPAD_LONG_PRESS)) { // long press
                        let v_Packet = {};
                        v_Packet.p_buttonIndex = i;
                        v_Packet.p_buttons = c_padStatus.p_buttons;
                        c_padStatus.p_buttons[i].m_longPress = true;
                        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Button_Updated, v_Packet);
                        js_common.fn_console_log("button " + i + " long press");
                    }
                }
            }
        }
        else if (c_padStatus.p_ctrl_type === GAME_COR_CTRL_MICROSOFT)
        {

            if (c_padStatus.p_axes[0] !== p_gamepad.axes[0]) {
                v_axesChanged = true;
                c_padStatus.p_axes[0] = p_gamepad.axes[0].toFixed(2);
            }
            if (c_padStatus.p_axes[1] !== p_gamepad.axes[1]) {
                v_axesChanged = true;
                c_padStatus.p_axes[1] = p_gamepad.axes[1].toFixed(2);
            }
            if (c_padStatus.p_axes[2] !== p_gamepad.axes[3]) {
                v_axesChanged = true;
                c_padStatus.p_axes[2] = p_gamepad.axes[3].toFixed(2);
            }
            if (c_padStatus.p_axes[3] !== p_gamepad.axes[4]) {
                v_axesChanged = true;
                c_padStatus.p_axes[3] = p_gamepad.axes[4].toFixed(2);
            }

            if ((v_axesChanged === true) ) {
                js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Axes_Updated);
                this.v_lastUpdateSent = c_now;
            }

            let v_buttonChanged = false;

            for (let i = 0; i <= 5; ++ i) {
                const c_pressed = p_gamepad.buttons[i].pressed;
                if (c_padStatus.p_buttons[i].m_pressed !== c_pressed) {
                    v_buttonChanged = true;
                    c_padStatus.p_buttons[i].m_pressed = p_gamepad.buttons[i].pressed;
                    c_padStatus.p_buttons[i].m_timestamp = Date.now();
                    c_padStatus.p_buttons[i].m_longPress = false;
                    if (v_buttonChanged === true) {
                        let v_Packet = {};
                        v_Packet.p_buttonIndex = i;
                        v_Packet.p_buttons = c_padStatus.p_buttons;
                        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Button_Updated, v_Packet);
                    }
                } else {
                    if ((c_pressed === true) && (c_padStatus.p_buttons[i].m_longPress === false) && ((Date.now() - c_padStatus.p_buttons[i].m_timestamp) > js_andruavMessages.CONST_GAMEPAD_LONG_PRESS)) { // long press
                        let v_Packet = {};
                        v_Packet.p_buttonIndex = i;
                        v_Packet.p_buttons = c_padStatus.p_buttons;
                        c_padStatus.p_buttons[i].m_longPress = true;
                        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Button_Updated, v_Packet);
                        js_common.fn_console_log("button " + i + " long press");
                    }
                }
            }

        }
    }


};

// var AndruavLibs = AndruavLibs || {
//     REVISION: 'BETA'
// };

// (function (lib) {
//     "use strict";
//     if (typeof module === "undefined" || typeof module.exports === "undefined") {
//         CAndruavGamePad.getInstance() = lib; // in ordinary browser attach library to window
//     } else {
//         module.exports = lib; // in nodejs
//     }
// })(new CAndruavGamePad());



export var js_localGamePad= CAndruavGamePad.getInstance();
