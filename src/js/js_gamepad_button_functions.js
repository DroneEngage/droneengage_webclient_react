import * as js_andruavUnit from './js_andruavUnit'
import * as js_andruavMessages from './js_andruavMessages';
import * as js_common from './js_common.js'

import { js_globals } from './js_globals.js';
import { EVENTS as js_event } from './js_eventList.js'
import { js_eventEmitter } from './js_eventEmitter.js'

class CGamePadButtonFunctions {
    constructor() {
        this.m_lastgamePadCommandTime = {};

        js_eventEmitter.fn_subscribe(js_event.EE_GamePad_Button_Updated, this, this.fn_sendButtons);
        const functions = js_globals.v_gamepad_button_function_array;

        this.buttonActions = {
            [js_andruavUnit.VEHICLE_UNKNOWN]: {
                'ARM': {
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_Arm(unit,true, false),
                },
                'RTL': {
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_Land(unit),
                },
                'Land': {
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_Land(unit),
                },
                'Auto': {
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit, js_andruavUnit.CONST_FLIGHT_CONTROL_RTL),
                },
                'Brake': {
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit, js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE),
                },
                'Guided': {
                    onRelease: (unit) => js_globals.v_andruavFacade.API_SendTrackPoint(unit, 0.5, 0.5, 30)
                },
                'TGT': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV9': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV10': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV11': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV12': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV13': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV14': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV15': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV16': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                }
            },
            [js_andruavUnit.VEHICLE_TRI]: {},
            [js_andruavUnit.VEHICLE_QUAD]: {
                
            }
        };
    }

    static getInstance() {
        if (!CGamePadButtonFunctions.instance) {
            CGamePadButtonFunctions.instance = new CGamePadButtonFunctions();
        }
        return CGamePadButtonFunctions.instance;
    }

    fn_init() { }

    fn_destroy() {
        try {
            this.eventEmitter.fn_unsubscribe(js_event.EE_GamePad_Button_Updated, this.fn_sendButtons);
        } catch (error) {
            js_common.fn_console_log(`Error during unsubscription: ${error.message}`);
        }
    }

    fn_sendButtons(p_me, p_packet) {
        const c_currentEngagedUnitRX = js_globals.m_andruavUnitList.getEngagedUnitRX();

        if (!c_currentEngagedUnitRX) return;

        // Default to VEHICLE_UNKNOWN if vehicleType is null, undefined, or not defined in buttonActions
        const vehicleType = c_currentEngagedUnitRX.m_VehicleType;
        const effectiveVehicleType = (vehicleType && p_me.buttonActions[vehicleType])
            ? vehicleType
            : js_andruavUnit.VEHICLE_UNKNOWN;

        const buttonIndexes = p_packet.p_buttonIndex; // Array of indices
        const buttons = p_packet.p_buttons;

        if (!Array.isArray(buttonIndexes) || !Array.isArray(buttons)) return;

        const now = Date.now();

        buttonIndexes.forEach((buttonIndex, i) => {
            const button = buttons[buttonIndex];
            // Map numeric index to function index using m_assigned_function from p_gamepad.buttons
            const buttonFunction = button.m_assigned_function;

            if (!buttonFunction || buttonFunction === null) return;

            // Try the effective vehicle type first
            let buttonConfig = p_me.buttonActions[effectiveVehicleType]?.[buttonFunction];

            // Fall back to VEHICLE_UNKNOWN if buttonFunction not found for effectiveVehicleType
            if (!buttonConfig && effectiveVehicleType !== js_andruavUnit.VEHICLE_UNKNOWN) {
                buttonConfig = p_me.buttonActions[js_andruavUnit.VEHICLE_UNKNOWN]?.[buttonFunction];
            }

            if (!buttonConfig) return;

            if (button.m_longPress && buttonConfig.longPress) {
                if (now - (p_me.m_lastgamePadCommandTime[buttonFunction] || 0) > js_andruavMessages.CONST_GAMEPAD_REPEATED) {
                    buttonConfig.longPress(c_currentEngagedUnitRX);
                    p_me.m_lastgamePadCommandTime[buttonFunction] = now;
                }
            } else if (!button.m_longPress && buttonConfig.onPress && button.m_pressed) {
                buttonConfig.onPress(c_currentEngagedUnitRX);
            } else if (!button.m_longPress && buttonConfig.onRelease && !button.m_pressed) {
                buttonConfig.onRelease(c_currentEngagedUnitRX);
            }

            js_common.fn_console_log("fn_sendButtons", buttonFunction);
        });
    }

    fn_handleButtonPress() { }
}

Object.seal(CGamePadButtonFunctions.prototype);
export const js_gamepadButtonFunctions = CGamePadButtonFunctions.getInstance();