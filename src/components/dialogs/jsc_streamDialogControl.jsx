import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import {js_globals} from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'

import {fn_VIDEO_login, fn_VIDEO_Record} from '../../js/js_main.js';
import ClssDialogBase from './jsc_dialog_base.jsx';

class ClssStreamChannel extends React.Component {

    constructor (props)
    {
        super (props);
        
        this.state = {
            m_update: 0
        };

        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe (js_event.EE_videoStreamStarted, this, this.fn_videoStarted);
        js_eventEmitter.fn_subscribe (js_event.EE_videoStreamStopped, this, this.fn_videoStopped);
        js_eventEmitter.fn_subscribe (js_event.EE_unitUpdated, this, this.fn_unitUpdated);

    }

    componentDidMount () {
        this.m_flag_mounted = true;
    }

    fn_videoStarted(p_me,p_obj)
    {
        // p_obj.talk
        // p_obj.andruavUnit
        if (p_me.props.prop_session.m_unit.getPartyID() !== p_obj.andruavUnit.getPartyID()) return ;
        if (p_me.props.prop_session.m_unit.m_Video.m_videoTracks[p_me.props.prop_track_number].id !== p_obj.talk.stream.id) return ;

        p_me.setState({'m_update': p_me.state.m_update +1});

        console.log ("video started");

    }

    fn_videoStopped(p_me,p_obj)
    {
        // p_obj.talk
        // p_obj.andruavUnit
        if (p_me.props.prop_session.m_unit.getPartyID() !== p_obj.andruavUnit.getPartyID()) return ;
        if (p_me.props.prop_session.m_unit.m_Video.m_videoTracks[p_me.props.prop_track_number].id !== p_obj.talk.stream.id) return ;

        p_me.setState({'m_update': p_me.state.m_update +1});

        console.log ("video stopped");
    }

    fn_unitUpdated(p_me,p_obj)
    {
        // p_obj.andruavUnit
        if (p_me.props.prop_session.m_unit.getPartyID() !== p_obj.getPartyID()) return ;

        p_me.setState({'m_update': p_me.state.m_update +1});
    }

   

    fn_videoStream()
    {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        fn_VIDEO_login (this.props.prop_session, v_track.id);
    }

    fn_videoRecord(p_startRecord)
    {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        fn_VIDEO_Record (this.props.prop_session, v_track.id, p_startRecord);
    }

    componentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_videoStreamStarted,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_videoStreamStopped,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitUpdated,this);
    }

    render ()  {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        const v_unit = this.props.prop_session.m_unit;
        if ((v_unit == null) || (v_track == null))
        {
            
            return (
                <div></div>
            );
        }
        else
        {
            
            let v_stream_class = 'btn-primary';
            let v_record_class = 'btn-primary';
            let v_startRecord = true;
            let actual_fps = 0;
            const active_track_id  = v_unit.m_Video.m_videoactiveTracks[v_track.id];
            const track_id  = v_unit.m_Video.m_videoTracks[this.props.prop_track_number];
            if ((active_track_id !== null && active_track_id !== undefined) && (active_track_id.VideoStreaming !== js_andruavUnit.CONST_VIDEOSTREAMING_OFF))
            {
                actual_fps = track_id.a>=0?track_id.a:0;
                v_stream_class = 'btn-danger';
            }
            if ((track_id.r !== null && track_id.r !== undefined) 
                && (track_id.r === true))
            { // recording
                v_record_class = 'btn-danger';
                v_startRecord = false;
            }
            
            return (
                    <div className="row al_l css_margin_zero">
                            <div className= "col-8   si-09x css_margin_zero txt-theme-aware">
                            <label>{`${v_track.ln} ${actual_fps>0?` - ${actual_fps} fps`:''}`}</label>
                            </div>
                            <div className= "col-2   si-09x css_margin_zero css_padding_2">
                                <button type="button" className={"btn btn-sm " + v_stream_class}  onClick={ (e) => this.fn_videoStream()}>stream</button>
                            </div>
                            <div className= "col-2   si-09x css_margin_zero css_padding_2">
                                <button type="button" className={"btn btn-sm " + v_record_class} onClick={ (e) => this.fn_videoRecord(v_startRecord)}>record</button>
                            </div>
                        </div>
            );
        }
    };
};


export default class ClssStreamDialog extends ClssDialogBase
{
    
    constructor()
	{
		super ();
		this.state = {
			...this.state,
			'm_update': 0,
		};
    
        this.m_flag_mounted = false;

        this.key = Math.random().toString();
        
        this.modal_ctrl_stream_dlg  = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_displayStreamDlgForm,this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_event.EE_hideStreamDlgForm,this, this.fn_closeDialog);

        
    }


    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayStreamDlgForm,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_hideStreamDlgForm,this);
    } 

    componentDidMount () {
        this.modalRef = this.modal_ctrl_stream_dlg;
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    fn_displayDialog (p_me, p_session)
    {
        if (p_me.m_flag_mounted === false)return ;
        
        p_me.state.p_session = p_session;
        
        p_me.setState({'m_update': p_me.state.m_update +1});
        
        p_me.modal_ctrl_stream_dlg.current.style.display = 'block';
    }

    fn_initDialog() {
        this.modal_ctrl_stream_dlg.current.style.display = 'none';
        super.fn_initDialog();
    }

    fn_getCurrentPartyID() {
        if (this.state.p_session && this.state.p_session.m_unit) {
            return this.state.p_session.m_unit.getPartyID();
        }
        return null;
    }

    fn_closeDialog()
    {
        this.modal_ctrl_stream_dlg.current.style.opacity = '';
        this.modal_ctrl_stream_dlg.current.style.display = 'none';
        if ((this.state !== null && this.state !== undefined) && (this.state.hasOwnProperty('p_session') === true))
        {
            this.state.p_session = null;            
        }
    }


    

    render() {
        let p_andruavUnit = null;
        
        if (this.state.p_session) {
            p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID());
        }

        const isNoStreams = p_andruavUnit === null;

        return (
            <Draggable nodeRef={this.modal_ctrl_stream_dlg} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
            <div
                id="modal_ctrl_stream_dlg"
                title="Streaming Video"
                className="card css_ontop border-light p-2"
                ref={this.modal_ctrl_stream_dlg} // Set the ref here
            >
                {this.fn_renderDialogHeader(isNoStreams ? 'No Streams' : 'Streams of ' + this.state.p_session?.m_unit.m_unitName)}

                {!this.state.isMinimized && (
                <div className="card-body">
                    {isNoStreams ? (
                        <div key='stream-card-body'>
                            {/* No additional content required */}
                        </div>
                    ) : (
                        <div className='row'>
                            {this.state.p_session.m_unit.m_Video.m_videoTracks.map((_, i) => (
                                <ClssStreamChannel key={i} prop_session={this.state.p_session} prop_track_number={i} />
                            ))}
                        </div>
                    )}
                </div>
                )}

                {!isNoStreams && (
                    <div className="form-group text-center localcontainer">
                        {this.fn_renderDialogFooter(
                            <button id="btnHelp" type="button" className="btn btn-sm btn-primary">Help</button>
                        )}
                    </div>
                )}
            </div>
            </Draggable>
        );
    }
}


