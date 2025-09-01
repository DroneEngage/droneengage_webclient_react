import * as js_andruavUnit from './js_andruavUnit'
import { js_andruav_gamepad } from './js_andruav_gamepad.js'
import * as js_andruavMessages from './js_andruavMessages';
import * as js_common from './js_common.js'

import { js_globals } from './js_globals.js';
import { EVENTS as js_event } from './js_eventList.js'
import { js_eventEmitter } from './js_eventEmitter.js'

class CGamePadAxisFunctions {
    constructor() {

        // js_eventEmitter.fn_subscribe(js_event.EE_GamePad_Other_Axes_Updated, this, this.fn_executeAxis);

        this.m_axisActions = {
            [js_andruavUnit.VEHICLE_UNKNOWN]: {
                'SRV9': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "9", (parseFloat(val) + 1) * 500 + 1000)
                },
                'SRV10': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "10", (parseFloat(val) + 1) * 500 + 1000)
                },
                'SRV11': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "11", (parseFloat(val) + 1) * 500 + 1000)
                },
                'SRV12': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "12", (parseFloat(val) + 1) * 500 + 1000)
                },
                'SRV13': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "13", (parseFloat(val) + 1) * 500 + 1000)
                },
                'SRV14': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "14", (parseFloat(val) + 1) * 500 + 1000)
                },
                'SRV15': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "15", (parseFloat(val) + 1) * 500 + 1000)
                },
                'SRV16': {
                    execute: (unit, val) => js_globals.v_andruavFacade.API_do_ServoChannel(unit, "16", (parseFloat(val) + 1) * 500 + 1000)
                }
            },
            [js_andruavUnit.VEHICLE_TRI]: {},
            [js_andruavUnit.VEHICLE_QUAD]: {

            }
        };
    }

    static getInstance() {
        if (!CGamePadAxisFunctions.instance) {
            CGamePadAxisFunctions.instance = new CGamePadAxisFunctions();
        }
        return CGamePadAxisFunctions.instance;
    }

    fn_destroy() {
        try {
            // this.eventEmitter.fn_unsubscribe(js_event.EE_GamePad_Other_Axes_Updated, this.#fn_executeAxis);
        } catch (error) {
            js_common.fn_console_log(`Error during unsubscription: ${error.message}`);
        }
    }


    fn_executeAxis() {
        const c_currentEngagedUnitRX = js_globals.m_andruavUnitList.getEngagedUnitRX();

        // Exit if no engaged unit
        if (!c_currentEngagedUnitRX) {
            js_common.fn_console_log("No engaged unit found.");
            return;
        }

        const c_controller = js_andruav_gamepad.fn_getGamePad(js_globals.active_gamepad_index);
        // Exit if no valid controller
        if (!c_controller) {
            js_common.fn_console_log("No valid gamepad controller found.");
            return;
        }

        const vehicleType = c_currentEngagedUnitRX.m_VehicleType;
        // Determine effective vehicle type, default to VEHICLE_UNKNOWN if not found
        const effectiveVehicleType = this.m_axisActions[vehicleType] ? vehicleType : js_andruavUnit.VEHICLE_UNKNOWN;

        const other_channel_routing = c_controller.p_other_channel_routing; // Array of objects with key property

        // Iterate over channel routing and execute corresponding action
        other_channel_routing.forEach((item) => {
            if (!item || !item.key) {
                js_common.fn_console_log("Invalid item or key in other_channel_routing.");
                return;
            }

            // Try the effective vehicle type first
            let actionConfig = this.m_axisActions[effectiveVehicleType]?.[item.key];

            // Fall back to VEHICLE_UNKNOWN if action not found for effectiveVehicleType
            if (!actionConfig && effectiveVehicleType !== js_andruavUnit.VEHICLE_UNKNOWN) {
                actionConfig = this.m_axisActions[js_andruavUnit.VEHICLE_UNKNOWN]?.[item.key];
            }

            // Exit if no action is defined
            if (!actionConfig) {
                js_common.fn_console_log(`No action defined for key: ${item.key} in vehicle type: ${effectiveVehicleType} or VEHICLE_UNKNOWN`);
                return;
            }

            try {
                // Call the execute function for the corresponding key
                actionConfig.execute(c_currentEngagedUnitRX, item.val);
                js_common.fn_console_log(`Executed action for key: ${item.key}`);
            } catch (error) {
                js_common.fn_console_log(`Error executing action for key ${item.key}: ${error.message}`);
            }
        });
    }

}


Object.seal(CGamePadAxisFunctions.prototype);
export const js_gamepadAxisFunctions = CGamePadAxisFunctions.getInstance();