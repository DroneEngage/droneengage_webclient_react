import * as js_andruavUnit from './js_andruavUnit'
import * as js_andruavMessages from './js_andruavMessages';
import * as js_common from './js_common.js'

import { js_globals } from './js_globals.js';
import { EVENTS as js_event } from './js_eventList.js'
import { js_eventEmitter } from './js_eventEmitter.js'
import { js_andruav_gamepad } from './js_andruav_gamepad.js'

class CGamePadButtonFunctions {
    constructor() {
        this.m_lastgamePadCommandTime = {};

        js_eventEmitter.fn_subscribe(js_event.EE_GamePad_Button_Updated, this, this.#fn_sendButtons);

        this.m_buttonActions = {
            [js_andruavUnit.VEHICLE_UNKNOWN]: {
                'ARM': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_Arm(unit, true, false),
                },
                'RTL': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit, js_andruavUnit.CONST_FLIGHT_CONTROL_RTL),
                },
                'Land': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_Land(unit),
                },
                'Auto': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit, js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO),
                },
                'Brake': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit, js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE),
                },
                'Guided': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit, js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED),
                },
                'TGT': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_SendTrackPoint(unit, 0.5, 0.5, 30),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_SendTrackPoint(unit, 0.5, 0.5, 30)
                },
                'SRV9': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                },
                'SRV10': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "10", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "10", 0)
                },
                'SRV11': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "11", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "11", 0)
                },
                'SRV12': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "12", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "12", 0)
                },
                'SRV13': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "13", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "13", 0)
                },
                'SRV14': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "14", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "14", 0)
                },
                'SRV15': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "15", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "15", 0)
                },
                'SRV16': {
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "16", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "16", 0)
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

    fn_destroy() {
        try {
            this.eventEmitter.fn_unsubscribe(js_event.EE_GamePad_Button_Updated, this.#fn_sendButtons);
        } catch (error) {
            js_common.fn_console_log(`Error during unsubscription: ${error.message}`);
        }
    }

    #fn_sendButtons(p_me, p_packet) {
        const c_currentEngagedUnitRX = js_globals.m_andruavUnitList.getEngagedUnitRX();

        if (!c_currentEngagedUnitRX) return;

        // Default to VEHICLE_UNKNOWN if vehicleType is null, undefined, or not defined in m_buttonActions
        const vehicleType = c_currentEngagedUnitRX.m_VehicleType;
        const effectiveVehicleType = (vehicleType && p_me.m_buttonActions[vehicleType])
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
            let buttonConfig = p_me.m_buttonActions[effectiveVehicleType]?.[buttonFunction];

            // Fall back to VEHICLE_UNKNOWN if buttonFunction not found for effectiveVehicleType
            if (!buttonConfig && effectiveVehicleType !== js_andruavUnit.VEHICLE_UNKNOWN) {
                buttonConfig = p_me.m_buttonActions[js_andruavUnit.VEHICLE_UNKNOWN]?.[buttonFunction];
            }

            if (!buttonConfig) return;

            if (button.m_pressed === true) {
                js_common.fn_console_log({ tag: 'BTN_ACTION', when: now, idx: buttonIndex, func: buttonFunction, action: 'press' });
                if (typeof buttonConfig.onPress === 'function') {
                    buttonConfig.onPress(c_currentEngagedUnitRX);
                }
            }
            else {
                js_common.fn_console_log({ tag: 'BTN_ACTION', when: now, idx: buttonIndex, func: buttonFunction, action: 'release' });
                if (typeof buttonConfig.onRelease === 'function') {
                    buttonConfig.onRelease(c_currentEngagedUnitRX);
                }
            }
        });
    }

    fn_handleButtonPress() { }
}

Object.seal(CGamePadButtonFunctions.prototype);
export const js_gamepadButtonFunctions = CGamePadButtonFunctions.getInstance();