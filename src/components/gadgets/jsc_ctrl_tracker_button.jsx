import React from 'react';

import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter'
import * as js_andruavMessages from '../../js/js_andruavMessages'
import * as js_siteConfig from '../../js/js_siteConfig.js'


export default class ClssCtrlObjectTracker extends React.Component {
    constructor(props) {
            super(props);
            this.state = {
                m_update: 0,
                m_tracker_gui_enabled: false,
            };
    
            this.key = Math.random().toString();
            
            js_eventEmitter.fn_subscribe(js_globals.EE_unitGPIOUpdated, this, this.fnl_gpioFlashChanged);
        }
    
        componentDidMount() {
            this.setState({ m_update: 1 });
    
        }
    
        componentWillUnmount() {
            js_eventEmitter.fn_unsubscribe(js_globals.EE_unitGPIOUpdated, this);
        }
    
        fnl_gpioFlashChanged(p_me, p_unit) {
            const gpio_flash = p_unit.m_GPIOs.getGPIOByName(js_andruavMessages.GPIO_CAMERA_FLASH_NAME);
            p_me.state.m_gpio_flashes_OnOff = p_me.fn_isGPIOFlashAllON(gpio_flash);
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
    
        fnl_trackerOnOff(e) {
            if (this.props.p_unit.m_tracker.m_enable_gui_tracker===true)
            {
                this.props.p_unit.m_tracker.m_enable_gui_tracker = false;
                js_globals.v_andruavClient.API_PauseTracking(this.props.p_unit);
            }
            else
            {
                this.props.p_unit.m_tracker.m_enable_gui_tracker = true;
            }
            
            this.setState({'m_update': this.state.m_update +1});
        }
    
        render() {
            if ((js_siteConfig.CONST_FEATURE.DISABLE_TRACKING != null) 
                        && (js_siteConfig.CONST_FEATURE.DISABLE_TRACKING === false)
                        && (!this.props.p_unit.m_modules.has_tracking))
                        {
                            return (
                                <div className="disabled hidden"/>
                            );
                        }
    
            let css_Track = '';                            
            let css_Track_title = this.props.title?this.props.title :'object tracker';
            if (this.props.p_unit.m_tracker.m_enable_gui_tracker)
            {
                css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand text-danger ';
                css_Track_title += ' disable tracking ';
                this.state.m_tracker_gui_enabled = true;
                
            }
            else
            {
                css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand ';
                css_Track_title += ' enable tracking ';
                this.state.m_tracker_gui_enabled = false;
                
            }
            
                
            return (
                <i id={this.props.id?this.props.id:this.key} key={this.key} className={css_Track + " css_large_icon"} title={css_Track_title} onClick={(e) => this.fnl_trackerOnOff(e)}></i>
            );
        }
    
    }