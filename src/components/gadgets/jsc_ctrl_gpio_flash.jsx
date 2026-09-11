import React, { useState } from 'react';
import * as js_session from '../../js/state/session.js';

import { useUnitField } from '../../js/hooks/useUnitField.js'
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
 * through useUnitField's return value. Field-granular: re-render only when
 * this unit's m_GPIOs.m_gpios changes, replacing the coarse
 * EE_unitGPIOUpdated event (matches jsc_ctrl_gpio.jsx).
 */
export default function ClssCtrlGPIO_Flash({ id, className, title, p_unit }) {
    const key = useState(() => Math.random().toString())[0];

    useUnitField(p_unit?.getPartyID(), 'm_GPIOs.m_gpios');

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
