import React from 'react';
import * as js_session from '../../js/state/session.js';

import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import * as js_helpers from '../../js/helpers/js_helpers.js'
import * as js_andruavUnit from '../../js/model/js_andruavUnit.js'

import { fn_showVideoMainTab } from '../../js/js_main.js'
import ClssCVideoScreen from './jsc_videoScreenComponent.jsx'
import {EventBridge} from '../../js/hooks/EventBridge.jsx'


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

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }

    
    componentDidMount() {
        this.m_flag_mounted = true;
    }
    
    componentDidUpdate() {
        // Activate the new tab after render if needed
        if (this.state.needsTabActivation && this.state.lastadded) {
            const v_obj = this.state.m_videoScreens[this.state.lastadded];
            if (v_obj) {
                const andruavUnit = js_session.fn_getAndruavUnitList().fn_getUnit(v_obj.v_unit);
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
    
    
    fn_videoStarted(p_obj) {
        p_obj.andruavUnit.m_Video.m_videoactiveTracks[p_obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_ON;

        let vid = p_obj.andruavUnit.getPartyID() + p_obj.talk.targetVideoTrack;
        if (this.state.m_videoScreens.hasOwnProperty(vid) === false) {
            this.state.m_videoScreens[vid] = {};
            const c_screen = this.state.m_videoScreens[vid];
            c_screen.v_unit = p_obj.andruavUnit.getPartyID();
            c_screen.v_track = p_obj.talk.targetVideoTrack;
            c_screen.v_index = js_helpers.fn_findWithAttributeIndex(p_obj.andruavUnit.m_Video.m_videoTracks, "id", p_obj.talk.targetVideoTrack);
            this.state.lastadded = vid;
            this.state.needsTabActivation = true; // Flag to activate tab after render
        }

        if (this.props.p_compact === true) {
            // Compact (mobile) view only ever shows one camera at a time. Keeping more than
            // one tab-pane mounted is what was flickering: each pane runs its own live WebRTC
            // <video>, and the active/show classes get juggled between React props and the
            // imperative DOM patch in componentDidUpdate. Closing the others removes the
            // second pane instead of just hiding it.
            this.fn_closeOtherScreens(vid);
        }

        fn_showVideoMainTab();

        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});

    }


    fn_closeOtherScreens(p_keepVid) {
        Object.keys(this.state.m_videoScreens).forEach((v_key) => {
            if (v_key === p_keepVid) return;
            const v_screen = this.state.m_videoScreens[v_key];
            if (!v_screen) return;

            const andruavUnit = js_session.fn_getAndruavUnitList().fn_getUnit(v_screen.v_unit);
            if (andruavUnit) {
                const talk = andruavUnit.m_Video.m_videoactiveTracks[v_screen.v_track];
                if (talk) {
                    talk.hangup(true);
                    js_session.fn_getAndruavFacade().API_CONST_RemoteCommand_streamVideo(andruavUnit, false, talk.number, v_screen.v_track);
                }
                andruavUnit.m_Video.VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
            }

            delete this.state.m_videoScreens[v_key];
            if (this.state.lastadded === v_key) {
                this.state.lastadded = null;
            }
        });
    }


    fn_closeVideoTab(p_obj) {
        const vid = p_obj.unitPartyID + p_obj.trackID;
        if (this.state.m_videoScreens.hasOwnProperty(vid)) {
            delete this.state.m_videoScreens[vid];
        }

        if (this.state.lastadded === vid) {
            this.state.lastadded = null;
            this.state.needsTabActivation = false;
        }

        if (this.m_flag_mounted === false) return;
        this.setState({'m_update': this.state.m_update + 1});
    }


    fn_videoStopped(obj) {

        obj.andruavUnit.m_Video.m_videoactiveTracks[obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
        const vid = obj.andruavUnit.getPartyID() + obj.talk.targetVideoTrack;
        if (this.state.m_videoScreens.hasOwnProperty(vid)) {
            delete this.state.m_videoScreens[vid];
        }

        if (this.state.lastadded === vid) {
            this.state.lastadded = null;
            this.state.needsTabActivation = false;
        }

        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }


    componentWillUnmount() {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }


    render() {
        const arr = Object.keys(this.state.m_videoScreens).filter((k) => {
            const v_obj = this.state.m_videoScreens[k];
            return (v_obj !== null && v_obj !== undefined);
        });

        let len = arr.length;

        if (len === 0) {
            return (
                <div className="container-fluid localcontainer">
                    <EventBridge eventName={js_event.EE_videoStreamStarted} onEvent={(p_obj) => this.fn_videoStarted(p_obj)} />
                    <EventBridge eventName={js_event.EE_videoStreamStopped} onEvent={(obj) => this.fn_videoStopped(obj)} />
                    <EventBridge eventName={js_event.EE_videoTabClose} onEvent={(p_obj) => this.fn_closeVideoTab(p_obj)} />
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100px' }}>
                        <div> No Camera Active</div>
                    </div>
                </div>
            );
        }

        let out_h = [];
        let out_b = [];
        for (let i = 0; i < len; ++i) {

            let _first = "";
            const v_key = arr[i];
            const v_obj = this.state.m_videoScreens[v_key];
            if (v_obj !== null && v_obj !== undefined) {
                const andruavUnit = js_session.fn_getAndruavUnitList().fn_getUnit(v_obj.v_unit);

                if (this.state.lastadded === v_key) {
                    _first = "active show";
                }
                else {
                    _first = "";
                }

                out_h.push(<li key={'h' + v_key} className="nav-item">
                    <a className={"nav-link user-select-none  txt-theme-aware  " + _first} data-bs-toggle="tab" href={'#cam_' + andruavUnit.getPartyID() + v_obj.v_track}>{andruavUnit.m_unitName + ' #' + v_obj.v_index}</a>
                </li>);
                out_b.push(<ClssCVideoScreen key={v_key} first={_first} obj={v_obj} p_compact={this.props.p_compact} />);
            }
        }


        return (
            <div className="container-fluid localcontainer">
                <EventBridge eventName={js_event.EE_videoStreamStarted} onEvent={(p_obj) => this.fn_videoStarted(p_obj)} />
                <EventBridge eventName={js_event.EE_videoStreamStopped} onEvent={(obj) => this.fn_videoStopped(obj)} />
                <EventBridge eventName={js_event.EE_videoTabClose} onEvent={(p_obj) => this.fn_closeVideoTab(p_obj)} />
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

