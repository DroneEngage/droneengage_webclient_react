import React, { useState, useCallback } from 'react';
import * as js_session from '../../js/state/session.js';

import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js'
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'


function fn_isGPIOFlashAllON(gpio_flash) {
    let count = 0;

    gpio_flash.forEach(element => {
        if (element.pin_value === 1) {
            count++;
        }
    });
    return (count === gpio_flash.length);
}

/**
 * GPIO-flash state (on/off/enabled) is derived via a method call
 * (m_GPIOs.getGPIOByName(...)) rather than a plain dot-path field, so it
 * is read fresh at render time (same as the original) rather than routed
 * through useUnitField. The event subscription only needs to force a
 * re-render when this unit's GPIO state changes.
 */
export default function ClssCtrlGPIO_Flash({ id, className, title, p_unit }) {
    const [, setTick] = useState(0);
    const key = useState(() => Math.random().toString())[0];

    const fnl_gpioFlashChanged = useCallback((p_unit_updated) => {
        if (p_unit_updated.getPartyID() !== p_unit.getPartyID()) return;
        setTick((t) => t + 1);
    }, [p_unit]);

    useEventSubscription(js_event.EE_unitGPIOUpdated, fnl_gpioFlashChanged);

    const fnl_gpioFlashOnOff = (e) => {
        const gpio_flash = p_unit.m_GPIOs.getGPIOByName(js_andruavMessages.GPIO_CAMERA_FLASH_NAME);
        if (gpio_flash.length === 0) return; // matches original: only enabled once at least one GPIO exists

        const target_status = fn_isGPIOFlashAllON(gpio_flash) ? 0 : 1;
        gpio_flash.forEach(element => {
            js_session.fn_getAndruavFacade().API_writeGPIO(p_unit, element.pin_module_key, element.pin_number, target_status);
        });
    };

    if (p_unit.fn_getIsDE() === false) {
        return ("");
    }

    let css_flashGPIO = ' bi bi-sun ';

    const gpio_flash = p_unit.m_GPIOs.getGPIOByName(js_andruavMessages.GPIO_CAMERA_FLASH_NAME);

    if (gpio_flash.length > 0) {
        if (fn_isGPIOFlashAllON(gpio_flash) === true) {
            css_flashGPIO = " bi bi-sun-fill text-danger cursor_hand ";
        }
        else {
            css_flashGPIO = " bi bi-sun text-success cursor_hand ";
        }
    }
    else {
        css_flashGPIO = " bi bi-sun txt-theme-aware ";
    }

    return (
        <i id={id ? id : key} key={key} className={css_flashGPIO + " css_large_icon"} title={title ? title : 'flash light'} onClick={fnl_gpioFlashOnOff}></i>
    );
}
