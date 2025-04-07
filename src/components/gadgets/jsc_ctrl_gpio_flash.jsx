import $ from 'jquery';
import React from 'react';

import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter'
import * as js_andruavMessages from '../../js/js_andruavMessages'



export default class ClssCtrlGPIO_Flash extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update: 0,
        };

        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_globals.EE_unitGPIOUpdated, this, this.fnl_gpioFlashChanged);
    }

    componentDidMount() {
        this.setState({ m_update: 1 });
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitGPIOUpdated, this);
    }

    componentWillUnmount() {
    }
    fnl_gpioFlashChanged(p_me, p_unit) {
        const gpio_flash = p_unit.m_GPIOs.getGPIOByName(js_andruavMessages.GPIO_CAMERA_FLASH_NAME);
        p_me.state.m_gpio_flashes_enabled = p_me.fn_isGPIOFlashAllON(gpio_flash);
        p_me.setState({ 'm_update': p_me.state.m_update + 1 });
    }

    fn_isGPIOFlashAllON(gpio_flash) {
        let count = 0;

        gpio_flash.forEach(element => {
            if (element.pin_value === 1) {
                count++;

            }
        });
        return (count === gpio_flash.length);
    }

    fnl_gpioFlashOnOff(e) {
        //TODO: p_obj.v_unit should be a unit not partyID 
        
        const gpio_flash = this.props.p_unit.m_GPIOs.getGPIOByName(js_andruavMessages.GPIO_CAMERA_FLASH_NAME);
        const target_status = this.state.m_gpio_flashes_enabled? 0 : 1;
        gpio_flash.forEach(element => {
            if (element.pin_value) {

            } else {

            }
            js_globals.v_andruavClient.API_writeGPIO(this.props.p_unit, element.pin_module_key, element.pin_number, target_status);
        });
    }

    render() {

        let css_flashGPIO = ' bi bi-sun ';
     
        const gpio_flash = this.props.p_unit.m_GPIOs.getGPIOByName(js_andruavMessages.GPIO_CAMERA_FLASH_NAME);

        if (gpio_flash.length > 0) {
            this.state.m_gpio_flashes_enabled = this.fn_isGPIOFlashAllON(gpio_flash);
            
            if (this.state.m_gpio_flashes_enabled === true) {
                css_flashGPIO = " bi bi-sun-fill text-danger ";
            }
            else {
                css_flashGPIO = " bi bi-sun text-success ";
            }
            
        }
        else {
            css_flashGPIO = " bi bi-sun text-light ";
            this.m_gpio_flashes_enabled = false;
        }

        return (
            <i id={this.props.id?this.props.id:this.key} key={this.key} className={css_flashGPIO + " cursor_hand css_large_icon"} title={this.props.title?this.props.title:'flash light'} onClick={(e) => this.fnl_gpioFlashOnOff(e)}></i>
        );
    }

}