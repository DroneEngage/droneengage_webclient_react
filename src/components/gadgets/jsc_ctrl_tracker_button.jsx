import React from 'react';

import { js_globals } from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter'
import * as js_andruavMessages from '../../js/protocol/js_andruavMessages'
import * as js_siteConfig from '../../js/js_siteConfig.js'


export default class ClssCtrlObjectTracker extends React.Component {
    constructor(props) {
            super(props);
            this.state = {
                m_update: 0,
                m_tracker_gui_enabled: false,
                m_ai_driver_pending: false,
                m_ai_driver_local_state: false,
            };
    
            this.key = Math.random().toString();
            
            js_eventEmitter.fn_subscribe(js_event.EE_onTrackingStatusChanged, this, this.fn_onTrackStatusUpdated);
            
        }
    
        // --- Core Change: Preventing re-renders from parent props ---
        shouldComponentUpdate(nextProps, nextState) {
            // Only re-render if the internal m_update state has changed.
            // This effectively ignores prop changes from the parent.
            return nextState.m_update !== this.state.m_update;
        }
        
    
        componentDidMount() {
            this.m_flag_mounted = true;
            this.setState({ m_update: 1 });
    
        }
    
        componentWillUnmount() {
            js_eventEmitter.fn_unsubscribe (js_event.EE_onTrackingStatusChanged,this);
        }
    
        
        fn_onTrackStatusUpdated(p_me,p_unit) {
            
            if (p_me.props.p_unit.getPartyID() !== p_unit.getPartyID()) return ;
            if (p_me.m_flag_mounted === false)return;
            
            // Clear pending state and sync local state with actual status
            p_me.setState({ 
                'm_update': p_me.state.m_update +1,
                'm_ai_driver_pending': false,
                'm_ai_driver_local_state': p_unit.m_tracker.m_ai_driven 
            });
        }
        
        fnl_trackerOnOff(e) {
            if (this.props.p_unit.m_tracker.m_enable_gui_tracker===true)
            {
                js_globals.v_andruavFacade.API_PauseTracking(this.props.p_unit);
            }
            else
            {
                js_globals.v_andruavFacade.API_EnableTracking(this.props.p_unit);
            }
            
            js_eventEmitter.fn_dispatch(js_event.EE_onTrackingStatusChanged, this.props.p_unit);
            
        }

        fn_tracking_ai_driverOnOff(e) {
            // Toggle local state and set pending to show yellow
            const new_local_state = !this.state.m_ai_driver_local_state;
            this.setState({ 
                m_ai_driver_pending: true,
                m_ai_driver_local_state: new_local_state,
                m_update: this.state.m_update + 1  // Force re-render
            });
            
            // Send the toggled command
            js_globals.v_andruavFacade.API_EnableTracking_AIDriver(this.props.p_unit, new_local_state);
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

            // Determine tracker button styling
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
                if (this.props.p_unit.m_tracker.m_active)
                {
                    css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand text-warning txt-theme-aware';
                    css_Track_title += ' enable tracking ';
                    this.state.m_tracker_gui_enabled = false;
                }
                else
                {
                    css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand ';
                    css_Track_title += ' enable tracking ';
                    this.state.m_tracker_gui_enabled = false;
                }
                
            }

            // Determine AI driver button styling
            let css_ai_driver = '';
            let css_ai_driver_title = 'AI Driver';
            
            if (this.state.m_ai_driver_pending) {
                // Always show yellow while waiting for feedback
                css_ai_driver = ' bi bi-cpu css_large_icon cursor_hand text-warning ';
                css_ai_driver_title += ' processing... ';
            } else {
                // Use actual status from unit when not pending
                if (this.props.p_unit.m_tracker.m_ai_driven) {
                    css_ai_driver = ' bi bi-cpu css_large_icon cursor_hand text-success ';
                    css_ai_driver_title += ' disable AI driver ';
                } else {
                    css_ai_driver = ' bi bi-cpu css_large_icon cursor_hand ';
                    css_ai_driver_title += ' enable AI driver ';
                }
            }
            
            // Check if text display is requested
            if (this.props.displayText) {
                // Remove css_large_icon for smaller icons when text is displayed
                const css_Track_small = css_Track.replace('css_large_icon', '').trim();
                const css_ai_driver_small = css_ai_driver.replace('css_large_icon', '').trim();
                return (
                    <span id={this.props.id?this.props.id:this.key} key={this.key} className={`${this.props.className}`}>
                        <span title={css_Track_title} onClick={(e) => this.fnl_trackerOnOff(e)} className='pe-1' >
                            <i className={css_Track_small}></i>
                            &nbsp;{this.props.displayText}
                        </span>
                        
                        <span title={css_ai_driver_title}  className='ps-2' onClick={(e) => this.fn_tracking_ai_driverOnOff(e)}>
                            <i className={css_ai_driver_small}></i>
                            &nbsp;AI Driver
                        </span>
                    </span>
                );
            }
            else {
                return (
                    <span id={this.props.id?this.props.id:this.key} key={this.key} className={this.props.className}>
                        <i className={css_Track} title={css_Track_title} onClick={(e) => this.fnl_trackerOnOff(e)}></i>
                        &nbsp;
                        <i className={css_ai_driver} title={css_ai_driver_title} onClick={(e) => this.fn_tracking_ai_driverOnOff(e)}></i>
                    </span>
                );
            }
        }
    
    }