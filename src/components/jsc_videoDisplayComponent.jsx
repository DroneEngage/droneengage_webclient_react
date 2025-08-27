import $ from 'jquery';

import React from 'react';

import FileSaver from 'file-saver';

import { js_globals } from '../js/js_globals.js';
import { js_eventEmitter } from '../js/js_eventEmitter'
import {EVENTS as js_event} from '../js/js_eventList.js'
import * as js_helpers from '../js/js_helpers'
import * as js_andruavUnit from '../js/js_andruavUnit'

import { fn_showMap, fn_gotoUnit_byPartyID, fn_takeLocalImage, fn_startrecord, fn_showVideoMainTab } from '../js/js_main'
import ClssCVideoScreen from './jsc_videoScreenComponent.jsx'


export class ClssCVideoControl extends React.Component {
    constructor() {
        super();
        this.state = {
            m_videoScreens: {},
            lastadded: null,
            'm_update': 0
        };

        js_eventEmitter.fn_subscribe(js_event.EE_videoStreamStarted, this, this.fn_videoStarted);
        js_eventEmitter.fn_subscribe(js_event.EE_videoStreamStopped, this, this.fn_videoStopped);
    }

    
    componentDidMount() {
        this.state.m_update = 1;
    }
    
    
    fn_videoStarted(p_me, p_obj) {
        p_obj.andruavUnit.m_Video.m_videoactiveTracks[p_obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_ON;

        let vid = p_obj.andruavUnit.partyID + p_obj.talk.targetVideoTrack;
        if (p_me.state.m_videoScreens.hasOwnProperty(vid) === false) {
            p_me.state.m_videoScreens[vid] = {};
            const c_screen = p_me.state.m_videoScreens[vid];
            c_screen.v_unit = p_obj.andruavUnit.partyID;
            c_screen.v_track = p_obj.talk.targetVideoTrack;
            c_screen.v_index = js_helpers.fn_findWithAttributeIndex(p_obj.andruavUnit.m_Video.m_videoTracks, "id", p_obj.talk.targetVideoTrack);
            p_me.state.lastadded = vid;
        }

        fn_showVideoMainTab();

        if (p_me.state.m_update === 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});

        // SIMULATE a click to activate the link.
        // bug: if the tab is already selected then click will not be effective.
        // you need to deactivate the tab in case it is active
        // eq(0) is another bug as using [0] will return a DOM object and you need a JQuery object.
        $('#div_video_control ul li a[href="#cam_' + p_obj.andruavUnit.partyID + p_me.state.m_videoScreens[vid].v_track + '"]').eq(0).parent().removeClass("active");

    }


    fn_videoStopped(p_me, obj) {

        obj.andruavUnit.m_Video.m_videoactiveTracks[obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
        if (p_me.state.m_videoScreens.hasOwnProperty(obj.andruavUnit.partyID) === false) {
            p_me.state.m_videoScreens[obj.andruavUnit.partyID] = undefined;
        }

        if (p_me.state.m_update === 0) return ;
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
                    <a className={"nav-link user-select-none  " + _first} data-bs-toggle="tab" href={'#cam_' + andruavUnit.partyID + v_obj.v_track}>{andruavUnit.m_unitName + ' #' + v_obj.v_index}</a>
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

