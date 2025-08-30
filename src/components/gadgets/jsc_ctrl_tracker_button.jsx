import React from 'react';

import { js_globals } from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
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
            
            js_eventEmitter.fn_subscribe(js_event.EE_onTrackingStatusChanged, this, this.fn_onTrackStatusUpdated);
            
        }
    
        // --- Core Change: Preventing re-renders from parent props ---
        shouldComponentUpdate(nextProps, nextState) {
            // Only re-render if the internal m_update state has changed.
            // This effectively ignores prop changes from the parent.
            return nextState.m_update !== this.state.m_update;
        }
        
    
        componentDidMount() {
            this.setState({ m_update: 1 });
    
        }
    
        componentWillUnmount() {
            js_eventEmitter.fn_unsubscribe (js_event.EE_onTrackingStatusChanged,this);
        }
    
        
        fn_onTrackStatusUpdated(p_me,p_unit) {
            
            if (p_me.props.p_unit.getPartyID() !== p_unit.getPartyID()) return ;
            if (p_me.m_flag_mounted === false)return;
            
            p_me.setState({'m_update': p_me.state.m_update +1});
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
                if (this.props.p_unit.m_tracker.m_active)
                {
                    css_Track = ' bi bi-chevron-bar-contract css_large_icon cursor_hand text-warning text-white';
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
            
                
            return (
                <i id={this.props.id?this.props.id:this.key} key={this.key} className={css_Track + " css_large_icon " + this.props.className} title={css_Track_title} onClick={(e) => this.fnl_trackerOnOff(e)}></i>
            );
        }
    
    }