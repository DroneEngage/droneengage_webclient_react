import * as js_andruavUnit from './js_andruavUnit'
import * as js_andruavMessages from './js_andruavMessages';
import * as js_common from './js_common.js'

import { js_globals } from './js_globals.js';
import { EVENTS as js_event } from './js_eventList.js'
import { js_eventEmitter } from './js_eventEmitter.js'


class CGamePadButtonFunctions {
    constructor() {

        this.m_lastgamePadCommandTime = [0, 0, 0, 0];

        js_eventEmitter.fn_subscribe(js_event.EE_GamePad_Button_Updated, this, this.fn_sendButtons);

        this.buttonActions = {
            [js_andruavUnit.VEHICLE_UNKNOWN]: {

            },
            [js_andruavUnit.VEHICLE_TRI]: {
                2: { // BLUE
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit.partyID, js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                0: { // GREEN
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_Land(unit),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                1: { // RED
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit.partyID, js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                3: { // YELLOW
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit.partyID, js_andruavUnit.CONST_FLIGHT_CONTROL_RTL),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                5: { // RB
                    onRelease: (unit) => js_globals.v_andruavFacade.API_SendTrackPoint(unit, 0.5, 0.5, 30)
                },
                4: { // LB
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                }
            },
            [js_andruavUnit.VEHICLE_QUAD]: {
                2: { // BLUE
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit.partyID, js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                0: { // GREEN
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_Land(unit),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                1: { // RED
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit.partyID, js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                3: { // YELLOW
                    longPress: (unit) => js_globals.v_andruavFacade.API_do_FlightMode(unit.partyID, js_andruavUnit.CONST_FLIGHT_CONTROL_RTL),
                    debounceTime: js_andruavMessages.CONST_GAMEPAD_REPEATED
                },
                5: { // RB
                    onRelease: (unit) => js_globals.v_andruavFacade.API_SendTrackPoint(unit, 0.5, 0.5, 30)
                },
                4: { // LB
                    onPress: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 9999),
                    onRelease: (unit) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", 0)
                }
            }
        };
    }

    static getInstance() {
        if (!CGamePadButtonFunctions.instance) {
            CGamePadButtonFunctions.instance = new CGamePadButtonFunctions();
        }
        return CGamePadButtonFunctions.instance;
    }

    fn_init() {

    }

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

        const vehicleType = c_currentEngagedUnitRX.m_VehicleType;
        const buttonIndexes = p_packet.p_buttonIndex; // Now an array

        if (!Array.isArray(buttonIndexes)) return;

        const now = Date.now();

        buttonIndexes.forEach(buttonIndex => {
            const buttonConfig = p_me.buttonActions[vehicleType]?.[buttonIndex];
            if (!buttonConfig) return;

            const button = p_packet.p_buttons[buttonIndex];

            if (button.m_longPress && buttonConfig.longPress) {
                if (now - (p_me.m_lastgamePadCommandTime[buttonIndex] || 0) > buttonConfig.debounceTime) {
                    buttonConfig.longPress(c_currentEngagedUnitRX);
                    p_me.m_lastgamePadCommandTime[buttonIndex] = now;
                }
            } else if (!button.m_longPress && buttonConfig.onPress && button.m_pressed) {
                buttonConfig.onPress(c_currentEngagedUnitRX);
            } else if (!button.m_longPress && buttonConfig.onRelease && !button.m_pressed) {
                buttonConfig.onRelease(c_currentEngagedUnitRX);
            }

            js_common.fn_console_log("fn_sendButtons", buttonIndex);
        });
    }


    fn_handleButtonPress() {

    }
}


Object.seal(CGamePadButtonFunctions.prototype);
export const js_gamepadButtonFunctions = CGamePadButtonFunctions.getInstance();

