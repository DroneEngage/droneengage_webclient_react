import React from 'react';

import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import {EVENTS as js_event} from '../../js/js_eventList.js'
import * as js_helpers from '../../js/js_helpers.js'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'

import { fn_showVideoMainTab } from '../../js/js_main.js'
import ClssCVideoScreen from './jsc_videoScreenComponent.jsx'


export class ClssCVideoControl extends React.Component {
    constructor() {
        super();
        this.state = {
            m_videoScreens: {},
            lastadded: null,
            needsTabActivation: false,
            'm_update': 0
        };


        this.key = Math.random().toString();
        
        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe(js_event.EE_videoStreamStarted, this, this.fn_videoStarted);
        js_eventEmitter.fn_subscribe(js_event.EE_videoStreamStopped, this, this.fn_videoStopped);
    }

    
    componentDidMount() {
        this.m_flag_mounted = true;
    }
    
    componentDidUpdate() {
        // Activate the new tab after render if needed
        if (this.state.needsTabActivation && this.state.lastadded) {
            const v_obj = this.state.m_videoScreens[this.state.lastadded];
            if (v_obj) {
                const andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(v_obj.v_unit);
                const tabPaneId = 'cam_' + andruavUnit.getPartyID() + v_obj.v_track;
                const tabSelector = 'a[href="#' + tabPaneId + '"]';
                
                // Manually activate the tab by manipulating classes
                // Deactivate all tabs and panes
                const allTabs = document.querySelectorAll('#div_video_control .nav-link');
                const allPanes = document.querySelectorAll('#div_video_control .tab-pane');
                
                allTabs.forEach(tab => {
                    tab.classList.remove('active', 'show');
                    tab.setAttribute('aria-selected', 'false');
                });
                
                allPanes.forEach(pane => {
                    pane.classList.remove('active', 'show', 'in');
                    pane.classList.add('fade');
                });
                
                // Activate the new tab
                const tabElement = document.querySelector(tabSelector);
                const paneElement = document.getElementById(tabPaneId);
                
                if (tabElement && paneElement) {
                    tabElement.classList.add('active', 'show');
                    tabElement.setAttribute('aria-selected', 'true');
                    paneElement.classList.add('active', 'show', 'in');
                }
            }
            // Reset the flag
            this.setState({ needsTabActivation: false });
        }
    }
    
    
    fn_videoStarted(p_me, p_obj) {
        p_obj.andruavUnit.m_Video.m_videoactiveTracks[p_obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_ON;

        let vid = p_obj.andruavUnit.getPartyID() + p_obj.talk.targetVideoTrack;
        if (p_me.state.m_videoScreens.hasOwnProperty(vid) === false) {
            p_me.state.m_videoScreens[vid] = {};
            const c_screen = p_me.state.m_videoScreens[vid];
            c_screen.v_unit = p_obj.andruavUnit.getPartyID();
            c_screen.v_track = p_obj.talk.targetVideoTrack;
            c_screen.v_index = js_helpers.fn_findWithAttributeIndex(p_obj.andruavUnit.m_Video.m_videoTracks, "id", p_obj.talk.targetVideoTrack);
            p_me.state.lastadded = vid;
            p_me.state.needsTabActivation = true; // Flag to activate tab after render
        }

        fn_showVideoMainTab();

        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});

    }


    fn_videoStopped(p_me, obj) {

        obj.andruavUnit.m_Video.m_videoactiveTracks[obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
        if (p_me.state.m_videoScreens.hasOwnProperty(obj.andruavUnit.getPartyID()) === false) {
            p_me.state.m_videoScreens[obj.andruavUnit.getPartyID()] = undefined;
        }

        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }


    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_videoStreamStarted, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_videoStreamStopped, this);
    }


    render() {
        const arr = Object.keys(this.state.m_videoScreens);

        let len = arr.length;

        if (len === 0) {
            return (
                <div> Please press camera icon to start streaming to see video.</div>
            );
        }

        let out_h = [];
        let out_b = [];
        for (let i = 0; i < len; ++i) {

            let _first = "";
            const v_key = arr[i];
            const v_obj = this.state.m_videoScreens[v_key];
            if (v_obj !== null && v_obj !== undefined) {
                const andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(v_obj.v_unit);

                if (this.state.lastadded === v_key) {
                    _first = "active show";
                }
                else {
                    _first = "";
                }

                out_h.push(<li key={'h' + v_key} className="nav-item">
                    <a className={"nav-link user-select-none  " + _first} data-bs-toggle="tab" href={'#cam_' + andruavUnit.getPartyID() + v_obj.v_track}>{andruavUnit.m_unitName + ' #' + v_obj.v_index}</a>
                </li>);
                out_b.push(<ClssCVideoScreen key={v_key} first={_first} obj={v_obj} />);
            }
        }


        return (
            <div className="container-fluid localcontainer">
                <ul className="nav  nav-tabs">
                    {out_h}
                </ul>
                <div id={this.key + "videoTabContent"} className="tab-content">
                    {out_b}
                </div>
            </div>
        )
    }

}

