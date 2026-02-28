import React from 'react';

import { js_globals } from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter'
import * as js_andruavMessages from '../../js/protocol/js_andruavMessages'
import * as js_siteConfig from '../../js/js_siteConfig.js'


export default class ClssCtrlViewlinkControl extends React.Component {
    constructor(props) {
            super(props);
            this.state = {
                m_update: 0,
                m_gimbal_enabled: false,
            };
    
            this.key = Math.random().toString();
            this.m_flag_mounted = false;
            
            // Gimbal control modes: disabled, enabled
            this.m_gimbalModeLabels = ["Gimbal Control Disabled", "Gimbal Control Enabled"];
            this.m_gimbalModeIcons = ["bi bi-arrows-expand txt-theme-aware cursor_hand css_large_icon text-muted", "bi bi-crosshair txt-theme-aware cursor_hand css_large_icon text-warning"];
            this.m_gimbalModeIndex = 0;
            
        }
    
        // --- Core Change: Preventing re-renders from parent props ---
        shouldComponentUpdate(nextProps, nextState) {
            // Only re-render if the internal m_update state has changed.
            // This effectively ignores prop changes from the parent.
            return nextState.m_update !== this.state.m_update || nextState.m_gimbal_enabled !== this.state.m_gimbal_enabled;
        }
        
    
        componentDidMount() {
            this.m_flag_mounted = true;
            this.setState({ m_update: 1 });
    
        }
    
        componentWillUnmount() {
            
        }
    
        fnl_showLaserControl(e) {
            const andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.p_unit.getPartyID());
            if (andruavUnit == null) {
                return;
            }
            
            this.m_gimbalModeIndex = (this.m_gimbalModeIndex + 1) % this.m_gimbalModeIcons.length;
            this.setState({ m_gimbal_enabled: this.m_gimbalModeIndex === 1, m_update: this.state.m_update + 1 });
            
            console.log("Gimbal control: " + this.m_gimbalModeLabels[this.m_gimbalModeIndex]);
            
            e.preventDefault();
            
            js_eventEmitter.fn_dispatch(js_event.EE_displayViewLinkGimbal, {
                m_unit: andruavUnit
            });
        }
    
        render() {
            if (!this.props.p_unit.m_modules.has_viewlink) {
                return (
                    <div className="disabled hidden"/>
                );
            }
    
            return (
                <i 
                    id={this.props.id?this.props.id:"btn_laser_control"} 
                    key={this.key} 
                    className={this.m_gimbalModeIcons[this.m_gimbalModeIndex] + " css_large_icon " + this.props.className} 
                    alt={this.m_gimbalModeLabels[this.m_gimbalModeIndex]}
                    title={this.m_gimbalModeLabels[this.m_gimbalModeIndex]} 
                    onClick={(e) => this.fnl_showLaserControl(e)}
                ></i>
            );
        }
    
    }
