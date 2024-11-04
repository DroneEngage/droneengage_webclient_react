import $ from 'jquery'; 
import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'
import * as js_common from '../../js/js_common.js'

import {fn_VIDEO_login, fn_VIDEO_Record, fn_gotoUnit_byPartyID} from '../../js/js_main.js';

class ClssStreamChannel extends React.Component {

    constructor ()
    {
        super ();
        // this.state =
        // {
        //     v_track: null,
        // };
    }

    fn_videoStream()
    {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        fn_VIDEO_login (this.props.prop_session, v_track.id);
        js_eventEmitter.fn_dispatch (js_globals.EE_hideStreamDlgForm); // if you do not hide then you need to request camera list status to update track video streaming
    }

    fn_videoRecord(p_startRecord)
    {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        fn_VIDEO_Record (this.props.prop_session, v_track.id, p_startRecord);
        js_eventEmitter.fn_dispatch (js_globals.EE_hideStreamDlgForm); // if you do not hide then you need to request camera list status to update track recording status
    }

    componentDidMount () 
    {
        
    }

    render ()  {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        var v_unit = this.props.prop_session.m_unit;
        if ((v_unit == null) || (v_track == null))
        {
            
            return (
                <div></div>
            );
        }
        else
        {
            
            var v_stream_class = 'btn-primary';
            var v_record_class = 'btn-primary';
            var v_startRecord = true;
            const active_track_id  = v_unit.m_Video.m_videoactiveTracks[v_track.id];
            if ((active_track_id !== null && active_track_id !== undefined) && (active_track_id.VideoStreaming !== js_andruavUnit.CONST_VIDEOSTREAMING_OFF))
            {
                v_stream_class = 'btn-danger';
            }
            const track_id  = v_unit.m_Video.m_videoTracks[this.props.prop_track_number];
            if ((track_id.r !== null && track_id.r !== undefined) 
                && (track_id.r === true))
            { // recording
                v_record_class = 'btn-danger';
                v_startRecord = false;
            }
            return (
                    <div className="row al_l css_margin_zero">
                            <div className= "col-8   si-09x css_margin_zero text-white">
                            <label>{v_track.ln}</label>
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


export default class ClssStreamDialog extends React.Component
{
    
    constructor()
	{
		super ();
		this.state = {
			'm_update': 0,
		};
    
        this.key = Math.random().toString();
        
        this.modal_ctrl_stream_dlg  = React.createRef();

        js_eventEmitter.fn_subscribe(js_globals.EE_displayStreamDlgForm,this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_globals.EE_hideStreamDlgForm,this, this.fn_closeDialog);
    }


    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_displayStreamDlgForm,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_hideStreamDlgForm,this);
    } 

    componentDidMount () {
        this.state.m_update = 1;
        this.fn_initDialog();
    }

    fn_displayDialog (p_me, p_session)
    {
        if (p_me.state.m_update === 0) return ;
        
        p_me.state.p_session = p_session;
        
        p_me.setState({'m_update': p_me.state.m_update +1});
        
        p_me.modal_ctrl_stream_dlg.current.style.display = 'block';
    }

    fn_initDialog()
    {
        var me = this;
        this.modal_ctrl_stream_dlg.current.onmouseover = function (e) {
            me.modal_ctrl_stream_dlg.current.style.opacity = '1.0';
        };
        this.modal_ctrl_stream_dlg.current.onmouseout = function (e) {
            if (me.opaque_clicked === false) {
                me.modal_ctrl_stream_dlg.current.style.opacity = '0.4';
            }
        };
        this.modal_ctrl_stream_dlg.current.style.display = 'none';
    }

    fn_gotoUnitPressed()
    {
        fn_gotoUnit_byPartyID(this.state.p_session.m_unit.partyID);

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

    fn_opacityDialog()
    {
        if (this.opaque_clicked === true)
        {
            this.opaque_clicked = false;
        }
        else
        {
            this.opaque_clicked = true;
            this.modal_ctrl_stream_dlg.current.style.opacity = '1.0';
        }
    }

    

    render() {
        let p_andruavUnit = null;
        
        if (this.state.p_session) {
            p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.partyID);
        }

        const isNoStreams = p_andruavUnit === null;

        return (
            <Draggable nodeRef={this.modal_ctrl_stream_dlg}>
            <div
                id="modal_ctrl_stream_dlg"
                title="Streaming Video"
                className="card width_fit_max css_ontop border-light p-2"
                ref={this.modal_ctrl_stream_dlg} // Set the ref here
            >
                <div className="card-header text-center">
                    <div className="row">
                        <div className="col-10">
                            <h4 className="text-success text-start">
                                {isNoStreams 
                                    ? "No Streams" 
                                    : `Streams of ${this.state.p_session?.m_unit.m_unitName}`}
                            </h4>
                        </div>
                        <div className="col-2 float-right">
                            <button id="btnclose" type="button" className="btn-close" onClick={() => this.fn_closeDialog()}></button>
                        </div>
                    </div>
                </div>

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

                {!isNoStreams && (
                    <div className="form-group text-center localcontainer">
                        <div className="btn-group">
                            <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" onClick={() => this.fn_opacityDialog()}>Opaque</button>
                            <button id="btnGoto" type="button" className="btn btn-sm btn-success" onClick={() => this.fn_gotoUnitPressed()}>Goto</button>
                            <button id="btnHelp" type="button" className="btn btn-sm btn-primary">Help</button>
                        </div>
                    </div>
                )}
            </div>
            </Draggable>
        );
    }
}


