/*************************************************************************************
 * 
 *   A N D R U A V - G A M E P A D       JAVASCRIPT  LIB
 * 
 *   Author: Mohammad S. Hefny
 * 
 *   Date:   06 March 2020
 * 
 *  Description: This class handles gamepad technically reading raw data 
 *              and translates it to correct virtual channels.
 * 
 *************************************************************************************/


import * as js_andruavMessages from './js_andruavMessages'
import * as js_helpers from '../js/js_helpers'
import { js_globals } from './js_globals'
import { EVENTS as js_event } from './js_eventList.js'
import { js_localStorage } from './js_localStorage'
import { js_eventEmitter } from './js_eventEmitter'
import * as js_common from './js_common.js'
import { js_gamepadButtonFunctions } from './js_gamepad_button_functions.js'


const GAME_GENERIC = 0;
const GAME_XBOX_360_MICROSOFT = 1;
const GAME_XBOX_360_MICROSOFT_VENDOR = ["045e", "054c", "054c", "054c"];
const GAME_XBOX_360_MICROSOFT_PRODUCT = ["028e", "0ce6", "09cc", "05c4"];
const GAME_PAD_WAILLY_PPM = 2;
const GAME_COR_CTRL_MICROSOFT = 3;

class fn_Obj_padStatus {
    constructor() {
        this.p_ctrl_type = GAME_GENERIC;

        js_gamepadButtonFunctions.fn_init();

        /**
         * IMPORTANT
         * THIS IS TRUE VALUES OF VIRTUAL GAMEPAD REGARDLESS OF MODE [RUD, THR, ALE, ELE]
         */
        this.p_unified_virtual_axis = [-1, 0, 0, 0]; // Rudder, Throttle, Aileron, Elevator
        this.m_gamepad_mode_index = 0;
        /**
        * m_button_routing index represents buttons on the virtual GamePad on screen.
        * each cell value represents the source button of the Button index of 
        * the source physical GamePad.
        */
        this.m_button_routing = new Array(10).fill(0); // Preallocate and initialize
        this.p_buttons = new Array(js_globals.v_total_gampad_buttons).fill().map(() => ({
            m_pressed: false,
            m_timestamp: 0,
            m_longPress: false
        }));
        this.p_connected = false;
        this.p_vibration = false;
    }
}

class CAndruavGamePad {
    constructor() {
        this.c_haveEvents = 'GamepadEvent' in window;
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
        this.m_channel_routing = []; // RUD,THR,ROLL,PITCH
        this.m_channel_axis_reverse = new Array(10).fill(1);
        
        /**
         * m_button_routing index represents buttons on the virtual GamePad on screen.
         * each cell value represents the source button of the Button index of 
         * the source physical GamePad.
         */
        this.m_button_routing = new Array(10).fill(0);
        
        this.m_other_channel_routing = [];

        this.m_gamepad_mode_index = 0;
        this.m_gamepad_config_index = js_localStorage.fn_getGamePadConfigIndex();
        this.fn_extractGamePadConfigMapping();

        js_eventEmitter.fn_subscribe(js_event.EE_GamePad_Config_Index_Changed, this, this.fn_gamePadConfigChanged);

        if (this.c_haveEvents) {
            window.addEventListener('gamepadconnected', (e) => this.fn_onConnect(e));
            window.addEventListener('gamepaddisconnected', (e) => this.fn_onDisconnect(e));
        } else {
            setTimeout(() => this.fn_scanGamePads(), 500);
        }

        window.addEventListener('storage', (event) => {
            // Check if the event is related to the specific field you care about
            if (event.key.includes('gamepad_config')) {
                js_eventEmitter.fn_dispatch(js_event.EE_GamePad_Config_Index_Changed);
            }
        });

    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_GamePad_Config_Index_Changed, this);
        if (this.v_animationFrameId) {
            window.cancelAnimationFrame(this.v_animationFrameId);
            this.v_animationFrameId = null;
        }
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
    fn_extractGamePadConfigMapping() {
        if (!js_globals?.STICK_MODE_MAPPING) {
            console.error("js_globals.STICK_MODE_MAPPING is not defined");
            return false;
        }

        /**
         * Based on TX mode 1,2,3,4
         * the cells into m_channel_routing changes its function.
         * for example in mode-2 mapping is [RUD, THR, ALE, ELE, AXI1, AXI2]
         * and the value of each cell represents the Axis index of the source 
         * of the gamepad.
         */
        this.m_channel_routing = [];

        /**
         * m_button_routing index represents buttons on the virtual GamePad on screen.
         * each cell value represents the source button of the Button index of 
         * the source physical GamePad.
         */
        this.m_button_routing = new Array(10).fill(0);
        const config = js_localStorage.fn_getGamePadConfig(this.m_gamepad_config_index);

        if (!config) return false;

        const json_config = JSON.parse(config);
        if (!json_config?.functionMappings) return false;

        const { functionMappings, mode, axisReversed, buttonsFunction } = json_config;
        this.m_gamepad_mode_index = mode - 1;
        const functions_per_mode = js_globals.STICK_MODE_MAPPING[this.m_gamepad_mode_index];

        this.m_channel_axis_reverse = axisReversed?.length ? axisReversed : (new Array(10).fill(1));
        this.m_button_routing = buttonsFunction || this.m_button_routing;
        this.m_button_routing = this.m_button_routing.map(item => item === 'undefined' ? 0 : item);

        const mappings = [
            { key: 'RUD', index: functions_per_mode.RUD },
            { key: 'THR', index: functions_per_mode.THR },
            { key: 'ALE', index: functions_per_mode.ALE },
            { key: 'ELE', index: functions_per_mode.ELE }
        ];

        // Create a Set of keys from mappings for efficient lookup
        const mappingKeys = new Set(mappings.map(({ key }) => key));

        mappings.forEach(({ key, index }) => {
            const mapping = functionMappings[key];
            if (mapping?.type === "axis") {
                this.m_channel_routing[index] = mapping.index;
            }
        });
        
        this.m_other_channel_routing = [];

        // Populate m_other_channel_routing with unused axis mappings
        for (const item in functionMappings) {
            if (functionMappings[item]?.type === "axis" && !mappingKeys.has(item)) {
                this.m_other_channel_routing.push({
                    key: item,
                    index: functionMappings[item].index
                });
            }
        }

        return true;
    }

    fn_gamePadConfigChanged(p_me) {
        p_me.m_gamepad_config_index = js_localStorage.fn_getGamePadConfigIndex();
        p_me.fn_extractGamePadConfigMapping();
        console.log("js_event.EE_GAMEPAD_CONTROL_UPDATE:", js_event.EE_GAMEPAD_CONTROL_UPDATE);
        js_eventEmitter.fn_dispatch(js_event.EE_GAMEPAD_CONTROL_UPDATE);
    }

    fn_getGamePad(index) {
        return !isNaN(index) ? this.v_controllers[index] : undefined;
    }

    fn_isGamePadDefined() {
        return Object.keys(this.v_controllers).length > 0;
    }

    fn_makeVibration(p_duration) {
        if (isNaN(p_duration)) return;
        p_duration = Math.min(Math.max(p_duration, 0), 2000); // Clamp duration between 0 and 2000ms

        const pads = navigator.getGamepads();
        const gamepad = pads[0]; // Get the first connected gamepad

        if (!gamepad) return; // Exit if no gamepad is connected

        // Try the modern vibrationActuator API (Chrome, Edge, etc.)
        if (gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: p_duration,
                weakMagnitude: 0.5,
                strongMagnitude: 0.5
            }).catch(() => { }); // Handle potential errors silently
        }
        // Fallback to the older vibrate API (some older browsers)
        else if (gamepad.vibrate) {
            gamepad.vibrate(p_duration);
        }
    }

    fn_onConnect(e) {
        js_common.fn_console_log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
            e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
        this.fn_addGamePad(this, e.gamepad);
        js_eventEmitter.fn_dispatch(js_event.EE_GamePad_Connected, e.gamepad);
    }

    fn_onDisconnect(e) {
        this.fn_removeGamepad(this, e.gamepad);
        js_eventEmitter.fn_dispatch(js_event.EE_GamePad_Disconnected, e.gamepad);
    }

    fn_updateStatus() {
        this.fn_scanGamePads();
        this.v_animationFrameId = window.requestAnimationFrame(() => this.fn_updateStatus());
    }

    fn_addGamePad(me, p_gamepad) {
        const v_padStatus = new fn_Obj_padStatus();
        let vendorNumber, productNumber;

        if (js_helpers.fn_isFireFox()) {
            const match = /^([^-]+)-([^-]+)/.exec(p_gamepad.id);
            if (match) {
                [vendorNumber, productNumber] = match.slice(1);
            }
        } else if (js_helpers.fn_isChrome()) {
            const vendorMatch = /Vendor:\s+(\w+)/i.exec(p_gamepad.id);
            const productMatch = /Product:\s+(\w+)/i.exec(p_gamepad.id);
            vendorNumber = vendorMatch?.[1];
            productNumber = productMatch?.[1];
        }

        v_padStatus.id = p_gamepad.id;
        me.v_controllers[p_gamepad.index] = v_padStatus;
        v_padStatus.p_connected = true;
        v_padStatus.p_vibration = !!p_gamepad.vibrationActuator;

        if (!me.v_animationFrameId) {
            me.v_animationFrameId = window.requestAnimationFrame(() => me.fn_updateStatus());
        }
    }

    fn_removeGamepad(me, p_gamepad) {
        if (p_gamepad && me.v_controllers[p_gamepad.index]) {
            delete me.v_controllers[p_gamepad.index];
        }
        // Cancel the animation frame loop if no gamepads are connected
        if (Object.keys(me.v_controllers).length === 0 && me.v_animationFrameId) {
            window.cancelAnimationFrame(me.v_animationFrameId);
            me.v_animationFrameId = null;
        }
    }

    fn_scanGamePads() {
        const c_gamepads = navigator.getGamepads?.() || navigator.webkitGetGamepads?.() || [];
        for (let i = 0, len = c_gamepads.length; i < len; i++) {
            const gamepad = c_gamepads[i];
            if (gamepad) {
                if (!(gamepad.index in this.v_controllers)) {
                    this.fn_addGamePad(this, gamepad);
                } else if (i === js_globals.active_gamepad_index && gamepad) {
                    this.fn_universalPad(gamepad);
                }
            }
        }
    }

    fn_universalPad(p_gamepad) {
        const c_padStatus = this.v_controllers[p_gamepad.index];
        c_padStatus.p_connected = true;

        let v_axesChanged = false;
        const c_now = Date.now();
        /**
             * RDR - 0 
             * THR - 1
             * ALE - 2
             * ELE - 3
        */
        const channel_routing = this.m_channel_routing;
        if (channel_routing.length === 0 ) return ;
        
        const functions_per_mode = js_globals.STICK_MODE_MAPPING[this.m_gamepad_mode_index];

        if (!p_gamepad.axes || channel_routing.some(val => val === undefined)) {
            return;
        }

        const mappings = [
            { axis: js_globals.STICK_LEFT_HORIZONTAL, routing: functions_per_mode.RUD },
            { axis: js_globals.STICK_LEFT_VERTICAL, routing: functions_per_mode.THR },
            { axis: js_globals.STICK_RIGHT_HORIZONTAL, routing: functions_per_mode.ALE },
            { axis: js_globals.STICK_RIGHT_VERTICAL, routing: functions_per_mode.ELE }
        ];

        mappings.forEach(({ axis, routing }) => {
            const val = Math.max(-1, Math.min(1, p_gamepad.axes[channel_routing[routing]] || 0))
                .toFixed(2) * this.m_channel_axis_reverse[channel_routing[routing]];
            if (c_padStatus.p_unified_virtual_axis[axis] !== val) {
                c_padStatus.p_unified_virtual_axis[axis] = val;
                v_axesChanged = true;
            }
        });

        this.m_other_channel_routing.forEach((item) => {
            // {key, index}
            const index = item.index;
            const val = Math.max(-1, Math.min(1, p_gamepad.axes[index] || 0))
                .toFixed(2) * this.m_channel_axis_reverse[index];
                if (item.val !== val)
                {
                    v_axesChanged = true;
                    item.val = val;
                }
        });

        if (v_axesChanged) {
            js_eventEmitter.fn_dispatch(js_event.EE_GamePad_Axes_Updated);
            this.v_lastUpdateSent = c_now;
        }

        const len = p_gamepad.buttons.length;
        let button_indicies = [];
        for (let i = 0; i < len; ++i) {
            if (this.m_button_routing[i] === 0) continue; // skip unmapped button.
            const c_pressed = p_gamepad.buttons[i].pressed;
            const button = c_padStatus.p_buttons[i];
            button.m_assigned_function = this.m_button_routing[i];
            if (button.m_pressed !== c_pressed) {
                button.m_pressed = c_pressed;
                button.m_timestamp = c_now;
                button.m_longPress = false;
                button_indicies.push(i);
            } else if (c_pressed && !button.m_longPress && (c_now - button.m_timestamp) > js_andruavMessages.CONST_GAMEPAD_LONG_PRESS) {
                button.m_longPress = true;
                button_indicies.push(i);
                js_common.fn_console_log(`button ${i} long press`);
            }
        }

        if (button_indicies.length > 0) {
            js_eventEmitter.fn_dispatch(js_event.EE_GamePad_Button_Updated, {
                p_buttonIndex: button_indicies,
                p_buttons: c_padStatus.p_buttons
            });
        }
    }
}

export const js_andruav_gamepad = CAndruavGamePad.getInstance();