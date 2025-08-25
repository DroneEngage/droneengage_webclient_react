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
import {js_localStorage} from './js_localStorage'
import {js_eventEmitter} from './js_eventEmitter'
import * as js_common from './js_common.js'

const GAME_GENERIC = 0;
const GAME_XBOX_360_MICROSOFT   = 1;
const GAME_XBOX_360_MICROSOFT_VENDOR  = ["045e","054c","054c","054c"];
const GAME_XBOX_360_MICROSOFT_PRODUCT = ["028e","0ce6","09cc","05c4"];
const GAME_PAD_WAILLY_PPM       = 2;
const GAME_COR_CTRL_MICROSOFT   = 3;

class fn_Obj_padStatus {
    constructor() 
    {
    this.p_ctrl_type = GAME_GENERIC;
    this.p_unified_virtual_axis = [-1, 0, 0, 0];

    this.p_buttons = [];

    this.p_connected = false;

    this.p_vibration = false;

    for (let i = 0; i < js_globals.v_total_gampad_buttons; ++ i) {
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
        this.v_animationFrameId = null; // Add a property to store the animation frame ID

        /**
         * m_channel_routing represents input source index - 
         *                  where [0] contains the index of the input axis that streams data to STICK LEFT - HORIZONTAL
         *                  where [1] contains the index of the input axis that streams data to STICK LEFT - VERTICAL
         *                  where [2] contains the index of the input axis that streams data to STICK RIGHT - HORIZONTAL
         *                  where [3] contains the index of the input axis that streams data to STICK RIGHT - HORIZONTAL
         */
        this.m_channel_routing = [-1,-1,-1,-1]; // RUD,THR,ROLL,PITCH
        this.m_channel_axis_reverse = [1, 1, 1, 1, 1, 1, 1];
        this.m_gamepad_config_index = js_localStorage.fn_getGamePadConfigIndex();
        this.fn_extractGamePadConfigMapping();

        js_eventEmitter.fn_subscribe(js_globals.EE_GamePad_Config_Index_Changed,this, this.fn_gamePadConfigChanged);

        if (this.c_haveEvents) {
            window.addEventListener('gamepadconnected', this.fn_onConnect);
            window.addEventListener('gamepaddisconnected', this.fn_onDisconnect);
            
        } else {
            setTimeout(this.fn_scangamepads, 500);
        }

        window.addEventListener('storage', (event) => {
        // Check if the event is related to the specific field you care about
        if (event.key.includes ('gamepad_config')) {
            js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Config_Index_Changed);        }
        });
        
    }

    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_GamePad_Config_Index_Changed, this);
    }

    static getInstance() {
        if (!CAndruavGamePad.instance) {
            CAndruavGamePad.instance = new CAndruavGamePad();
        }
        return CAndruavGamePad.instance;
    }

    /**
     * Reads GamePad configurations from app storage and parses them.
     * @returns 
     */
    fn_extractGamePadConfigMapping()
    {
          
            // Check if js_globals and STICK_MODE_MAPPING are defined
    if (!js_globals || !js_globals.STICK_MODE_MAPPING) {
        console.error("js_globals.STICK_MODE_MAPPING is not defined");
        return false;
    }

    

        this.m_channel_routing = [-1,-1,-1,-1]; // regardless of mode this maps sticks. ()
        this.m_channel_axis_reverse = [1, 1, 1, 1, 1, 1, 1];
        const config = js_localStorage.fn_getGamePadConfig(this.m_gamepad_config_index);
        if (!config) return;
        const json_config = JSON.parse(config);
        if (json_config["functionMappings"])
        {
            const function_mappings = json_config["functionMappings"];
            
            js_globals.m_gamepad_mode_index = json_config.mode - 1;
            this.m_channel_axis_reverse = json_config.axisReversed;
            // yaw is always index 
            const yaw = function_mappings.RUD
            if (yaw && yaw.type=="axis") this.m_channel_routing[js_globals.STICK_MODE_MAPPING[js_globals.m_gamepad_mode_index].RUD] = yaw.index; // copy index of rudder gamepad input axis to Rudder Slot based on RX-MODE (1,2,3,4).

            // thr is always index 
            const thr = function_mappings.THR
            if (thr && thr.type=="axis") this.m_channel_routing[js_globals.STICK_MODE_MAPPING[js_globals.m_gamepad_mode_index].THR] = thr.index; // copy index of THR gamepad input axis to THR Slot based on RX-MODE (1,2,3,4).

            // roll is always index 
            const roll = function_mappings.ALE
            if (roll && roll.type=="axis") this.m_channel_routing[js_globals.STICK_MODE_MAPPING[js_globals.m_gamepad_mode_index].ALE] = roll.index; // copy index of ALE gamepad input axis to ALE Slot based on RX-MODE (1,2,3,4).

            // pitch is always index 
            const pitch = function_mappings.ELE;
            if (pitch && pitch.type=="axis") this.m_channel_routing[js_globals.STICK_MODE_MAPPING[js_globals.m_gamepad_mode_index].ELE] = pitch.index; // copy index of ELE gamepad input axis to ELE Slot based on RX-MODE (1,2,3,4).

            // so m_channel_routing contains the input axis index that corresponds to each STICK in the remote based on RX-MODE and Function.
        }
        
        return true;
    }

    fn_gamePadConfigChanged(p_me)
    {
        console.log ("INDEX CHANGED");
        p_me.m_gamepad_config_index = js_localStorage.fn_getGamePadConfigIndex();
        p_me.fn_extractGamePadConfigMapping();
        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Control_Update);
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
        // The previous requestAnimationFrame call is cancelled before a new one is made.
        // This ensures that the function is only scheduled once per frame.
        CAndruavGamePad.getInstance().v_animationFrameId = window.requestAnimationFrame(CAndruavGamePad.getInstance().fn_updateStatus);
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

        // if ((vendorNumber === '06f7') && (productNumber === '0003'))
        // {
        //     v_padStatus.p_ctrl_type = GAME_PAD_WAILLY_PPM;
        // }else
        // if ((vendorNumber === '0e6f') && (productNumber === 'f501'))
        // {
        //     if (p_gamepad.axes.length === 4)
        //     {  // just in case this 'bug' exists
        //         v_padStatus.p_ctrl_type = GAME_XBOX_360_MICROSOFT;
        //     }
        //     else
        //     {   
        //         v_padStatus.p_ctrl_type = GAME_COR_CTRL_MICROSOFT;
        //     }

        // }else
        // if ((GAME_XBOX_360_MICROSOFT_VENDOR.includes(vendorNumber) === true) && (GAME_XBOX_360_MICROSOFT_PRODUCT.includes(productNumber) === true))
        // {
        //     if (p_gamepad.axes.length === 4)
        //     {
        //         v_padStatus.p_ctrl_type = GAME_XBOX_360_MICROSOFT;
        //     }
        //     else
        //     {   // on firefox I found it can be detected as GAME_COR_CTRL_MICROSOFT
        //         v_padStatus.p_ctrl_type = GAME_COR_CTRL_MICROSOFT;
        //     }
        // }
        
        v_padStatus.id = p_gamepad.id;
        
        me.v_controllers[p_gamepad.index] = v_padStatus;
        v_padStatus.p_connected = true;
        v_padStatus.p_vibration = (p_gamepad.vibrationActuator !== null && p_gamepad.vibrationActuator !== undefined);
        
        // Start the animation frame loop
        if (!me.v_animationFrameId) {
            me.v_animationFrameId = window.requestAnimationFrame(me.fn_updateStatus);
        }
    }

    fn_removeGamepad(me, p_gamepad) {
        if ((p_gamepad !== null && p_gamepad !== undefined) && (me.v_controllers[p_gamepad.index] !== null && me.v_controllers[p_gamepad.index] !== undefined)) {
            delete me.v_controllers[p_gamepad.index];
        }

        // Cancel the animation frame loop if no gamepads are connected
        if (Object.keys(me.v_controllers).length === 0 && me.v_animationFrameId) {
            window.cancelAnimationFrame(me.v_animationFrameId);
            me.v_animationFrameId = null;
        }
    }

    fn_scangamepads() {
        const c_gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (let i = 0; i < c_gamepads.length; i++) {
            if (c_gamepads[i]) {
                if (!(c_gamepads[i].index in this.v_controllers)) {
                    this.fn_addgamepad(this, c_gamepads[i]);
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
        
        if (c_padStatus.p_ctrl_type ===  GAME_GENERIC)
        {
            /**
             * RDR - 0 
             * THR - 1
             * ALE - 2
             * ELE - 3
             */
            const channel_routing = this.m_channel_routing;
            // Ensure axes and channel routing are valid
            if (!p_gamepad.axes || channel_routing[0] === undefined || channel_routing[1] === undefined ||
                channel_routing[2] === undefined || channel_routing[3] === undefined) {
                return; // Skip processing if axes or routing is invalid
            }
            
            const functions_per_mode = js_globals.STICK_MODE_MAPPING[js_globals.m_gamepad_mode_index];
            // Rudder
            let val = p_gamepad.axes[channel_routing[functions_per_mode.RUD]];
            val = Math.max(-1, Math.min(1, val)).toFixed(2) * this.m_channel_axis_reverse[channel_routing[functions_per_mode.RUD]]; // Clamp and format
            if (c_padStatus.p_unified_virtual_axis[js_globals.STICK_LEFT_HORIZONTAL] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[js_globals.STICK_LEFT_HORIZONTAL] = val;
            }
            // Throttle
            val = p_gamepad.axes[channel_routing[functions_per_mode.THR]];
            val = Math.max(-1, Math.min(1, val)).toFixed(2) * this.m_channel_axis_reverse[channel_routing[functions_per_mode.THR]];
            if (c_padStatus.p_unified_virtual_axis[js_globals.STICK_LEFT_VERTICAL] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[js_globals.STICK_LEFT_VERTICAL] = val;
            }
            // Aleron-Roll Stick
            val = p_gamepad.axes[channel_routing[functions_per_mode.ALE]];
            val = Math.max(-1, Math.min(1, val)).toFixed(2) * this.m_channel_axis_reverse[channel_routing[functions_per_mode.ALE]];
            if (c_padStatus.p_unified_virtual_axis[js_globals.STICK_RIGHT_HORIZONTAL] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[js_globals.STICK_RIGHT_HORIZONTAL] = val;
            }
            // Elevator-Pitch Stick
            val = p_gamepad.axes[channel_routing[functions_per_mode.ELE]];
            val = Math.max(-1, Math.min(1, val)).toFixed(2) * this.m_channel_axis_reverse[channel_routing[functions_per_mode.ELE]];
            if (c_padStatus.p_unified_virtual_axis[js_globals.STICK_RIGHT_VERTICAL] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[js_globals.STICK_RIGHT_VERTICAL] = val;
            }


            if ((v_axesChanged === true) ) {
                js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Axes_Updated);
                this.v_lastUpdateSent = c_now;
            }


            let v_buttonChanged = false;


            c_padStatus.p_buttons[0].m_pressed = true; // p_gamepad.buttons[i].pressed;
            c_padStatus.p_buttons[0].m_timestamp = Date.now();
            c_padStatus.p_buttons[0].m_longPress = false;
            v_buttonChanged = true;
            
            if (v_buttonChanged === true) {
                let v_Packet = {};
                v_Packet.p_buttonIndex = 0;
                v_Packet.p_buttons = c_padStatus.p_buttons;
                js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Button_Updated, v_Packet);
            }

        }
        else if (c_padStatus.p_ctrl_type === GAME_PAD_WAILLY_PPM)
        {
            // Rudder
            let val = (p_gamepad.axes[5]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_unified_virtual_axis[0] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[0] = val;
                
            }
            // Throttlr
            val = (p_gamepad.axes[2]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_unified_virtual_axis[1] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[1] = val;
                
            }
            // ROLL
            val = (p_gamepad.axes[0]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_unified_virtual_axis[2] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[2] = val;
                
            }
            // PITCH
            val = -(p_gamepad.axes[1]*2).toFixed(2);
            if (val>1) val = 1;
            if (val<-1) val = -1;
            if (c_padStatus.p_unified_virtual_axis[3] !== val) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[3] = val;
                
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
                if (c_padStatus.p_unified_virtual_axis[j] !== p_gamepad.axes[j]) {
                    v_axesChanged = true;
                    c_padStatus.p_unified_virtual_axis[j] = p_gamepad.axes[j].toFixed(2);
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
                    const v_Packet = {
                        p_buttonIndex: i,
                        p_buttons: c_padStatus.p_buttons
                    };
                    js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Button_Updated, v_Packet);
                } else {
                    if ((c_pressed === true) && (!c_padStatus.p_buttons[i].m_longPress) 
                        && ((Date.now() - c_padStatus.p_buttons[i].m_timestamp) > js_andruavMessages.CONST_GAMEPAD_LONG_PRESS)) { // long press
                
                        c_padStatus.p_buttons[i].m_longPress = true;  // Set long press flag
                
                        const v_Packet = {
                            p_buttonIndex: i,
                            p_buttons: c_padStatus.p_buttons
                        };
                        
                        js_eventEmitter.fn_dispatch(js_globals.EE_GamePad_Button_Updated, v_Packet);
                        js_common.fn_console_log("button " + i + " long press");
                    }
                }
            }
        }
        else if (c_padStatus.p_ctrl_type === GAME_COR_CTRL_MICROSOFT)
        {

            if (c_padStatus.p_unified_virtual_axis[0] !== p_gamepad.axes[0]) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[0] = p_gamepad.axes[0].toFixed(2);
            }
            if (c_padStatus.p_unified_virtual_axis[1] !== p_gamepad.axes[1]) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[1] = p_gamepad.axes[1].toFixed(2);
            }
            if (c_padStatus.p_unified_virtual_axis[2] !== p_gamepad.axes[3]) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[2] = p_gamepad.axes[3].toFixed(2);
            }
            if (c_padStatus.p_unified_virtual_axis[3] !== p_gamepad.axes[4]) {
                v_axesChanged = true;
                c_padStatus.p_unified_virtual_axis[3] = p_gamepad.axes[4].toFixed(2);
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

export var js_localGamePad= CAndruavGamePad.getInstance();
