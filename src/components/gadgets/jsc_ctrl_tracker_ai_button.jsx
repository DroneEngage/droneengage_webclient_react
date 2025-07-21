import React from 'react';

import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import * as js_siteConfig from '../../js/js_siteConfig.js'


export default class ClssCtrlObjectTrackerAI extends React.Component {
    constructor(props) {
            super(props);
            this.state = {
                m_update: 0,
                m_tracker_ai_gui_enabled: false,
            };
    
            this.key = Math.random().toString();
            
            js_eventEmitter.fn_subscribe(js_globals.EE_onTrackingAIStatusChanged, this, this.fn_onTrackStatusUpdated);
            
        }
    
        componentDidMount() {
            this.setState({ m_update: 1 });
    
        }
    
        componentWillUnmount() {
            js_eventEmitter.fn_unsubscribe (js_globals.EE_onTrackingAIStatusChanged,this);
        }
    
        
        fn_onTrackStatusUpdated(me,p_unit) {
            if (me.state.m_update === 0) return;
            me.setState({'m_update': me.state.m_update +1});
        }
        
        fnl_trackerOnOff(e) {
            if (this.props.p_unit.m_tracker_ai.m_enable_gui_tracker===true)
            {
                this.props.p_unit.m_tracker_ai.m_enable_gui_tracker = false;
                js_globals.v_andruavClient.API_PauseTrackingAI(this.props.p_unit);
            }
            else
            {
                this.props.p_unit.m_tracker_ai.m_enable_gui_tracker = true;
                js_globals.v_andruavClient.API_SendTrackAISelect(this.props.p_unit);
            }

           js_eventEmitter.fn_dispatch(js_globals.EE_onTrackingAIStatusChanged, this.props.p_unit);
            
        }
    
        render() {
            if ((js_siteConfig.CONST_FEATURE.DISABLE_TRACKING_AI != null) 
                        && (js_siteConfig.CONST_FEATURE.DISABLE_TRACKING_AI === false)
                        && (!this.props.p_unit.m_modules.has_ai_recognition))
                        {
                            return (
                                <div className="disabled hidden"/>
                            );
                        }
    
            let css_Track = '';                            
            let css_Track_title = this.props.title?this.props.title :'object tracker';
            if (this.props.p_unit.m_tracker_ai.m_enable_gui_tracker)
            {
                css_Track = ' bi bi-eye-fill css_large_icon cursor_hand text-danger ';
                css_Track_title += ' disable tracking ';
                this.state.m_tracker_ai_gui_enabled = true;
                
            }
            else
            {
                css_Track = ' bi bi-eye-fill css_large_icon cursor_hand ';
                css_Track_title += ' enable tracking ';
                this.state.m_tracker_ai_gui_enabled = false;
                
            }
            
                
            return (
                <i id={this.props.id?this.props.id:this.key} key={this.key} className={css_Track + " css_large_icon " + this.props.className} title={css_Track_title} onClick={(e) => this.fnl_trackerOnOff(e)}></i>
            );
        }
    
    }