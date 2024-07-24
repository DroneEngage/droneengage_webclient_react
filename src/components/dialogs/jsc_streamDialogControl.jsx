import $ from 'jquery'; 
import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';

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
			
		};
    
        this._isMounted = false;
        
        js_eventEmitter.fn_subscribe(js_globals.EE_displayStreamDlgForm,this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_globals.EE_hideStreamDlgForm,this, this.fn_closeDialog);
    }


    fn_displayDialog (p_me, p_session)
    {
        if (p_me._isMounted !== true) return ;
        
        p_me.setState({'p_session':p_session});
        p_me.forceUpdate();
        $('#modal_ctrl_stream_dlg').show();
    }

    fn_initDialog()
    {
        $('#modal_ctrl_stream_dlg').draggable();
        $('#modal_ctrl_stream_dlg').on("mouseover", function () {
            $('#modal_ctrl_stream_dlg').css('opacity', '1.0');
        });
        $('#modal_ctrl_stream_dlg').on("mouseout", function () {
            if ($('#modal_ctrl_stream_dlg').attr('opacity') == null) {
                $('#modal_ctrl_stream_dlg').css('opacity', '0.4');
            }
        });
        $('#modal_ctrl_stream_dlg').hide();
    }

    fn_gotoUnitPressed()
    {
        fn_gotoUnit_byPartyID(this.state.p_session.m_unit.partyID);

    }

    fn_closeDialog()
    {
        $('#modal_ctrl_stream_dlg').hide();
        $('#modal_ctrl_stream_dlg').attr('opacity', null);
        if ((this.state !== null && this.state !== undefined) && (this.state.hasOwnProperty('p_session') === true))
        {
            this.state.p_session = null;            
        }
    }

    fn_opacityDialog()
    {
        if ($('#modal_ctrl_stream_dlg').attr('opacity') == null) {
            $('#modal_ctrl_stream_dlg').attr('opacity', '1.0');
            $('#modal_ctrl_stream_dlg').css('opacity', '1.0');
        }
        else 
        {
            $('#modal_ctrl_stream_dlg').attr('opacity', null);
        }
    }

    
    componentWillUnmount ()
    {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe(js_globals.EE_displayStreamDlgForm,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_hideStreamDlgForm,this);
    } 

    componentDidMount () {
        this._isMounted = true;
        this.fn_initDialog();
    }

    render ()
    {
        var p_andruavUnit = null;
        if ((this.state.hasOwnProperty('p_session')) && (this.state.p_session !== null && this.state.p_session !== undefined))
        {
            p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.partyID);
        }

        if (p_andruavUnit === null || p_andruavUnit === undefined)
        {
            js_common.fn_console_log ("stream:  NULL")
            
            return (
                <div id="modal_ctrl_stream_dlg" title="Streaming Video" className="card width_fit_max css_ontop border-light p-2" >
                            
                    <div className="card-header text-center">
						<div className="row">
						  <div className="col-10">
							<h4 className="text-success text-start">No Streams </h4>
						  </div>
						  <div className="col-2 float-right">
						  <button id="btnclose" type="button" className="btn-close" onClick={(e)=>this.fn_closeDialog()}></button>
						   </div>
						</div>
				    </div>
                    <div key='stream-card-body' id="stream-card-body"   className="card-body ">
                        {/* <div className = "row">
                            <div className = "col-md-4">
                                <button id="opaque_btn" type="button" className="btn  btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off">opaque</button>
                            </div>    
                            <div className = "col-md-4">
                                <button id="btnGoto" type="button" className="btn  btn-sm btn-success">Goto</button>
                            </div>
                            <div className = "col-md-4">
                                <button id="btnHelp" type="button" className="btn  btn-sm btn-primary">Help</button>
                            </div>
                        </div> */}
                    </div>
                </div>
            );
        }
        else
        {
            var p_session;
            var v_streanms = [];
            var v_unitName;

            if ((this.state.hasOwnProperty('p_session')) && (this.state.p_session !== null && this.state.p_session !== undefined))
            {
                p_session = this.state.p_session;

                for (var i = 0; i < p_session.m_unit.m_Video.m_videoTracks.length; ++i) {
                    v_streanms.push(<ClssStreamChannel key={i} prop_session={p_session} prop_track_number={i} />);
                }
                v_unitName = p_session.m_unit.m_unitName;
            }

            return (
                <div key="modal_ctrl_stream_dlg" id="modal_ctrl_stream_dlg" title="Streaming Video" data-bs-toggle="tooltip"  className="card width_fit_max css_ontop border-light p-2" >
                            
                <div key='stream_dlg_hdr' className="card-header text-center">
                    <div className="row">
                        <div className="col-10">
                            <h4 className="text-success text-start">Streams of' {v_unitName} </h4>
                        </div>
                        <div className="col-2 float-right">
                            <button id="btnclose" type="button" className="btn-close" onClick={(e)=>this.fn_closeDialog()}></button>
                        </div>
                    </div>
                </div>    
                <div id="modal_ctrl_stream_footer" className="card-body ">
                            <div className='row'>
                                {v_streanms}
                            </div>
                            </div>
                            <div id="modal_ctrl_stream_footer" className="form-group text-center localcontainer">
                                <div className = "btn-group">
                                        <button id="opaque_btn" type="button" className="btn  btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off" onClick={(e)=>this.fn_opacityDialog()}>opaque</button>
                                        <button id="btnGoto" type="button" className="btn  btn-sm btn-success" onClick={(e)=>this.fn_gotoUnitPressed()}>Goto</button>
                                        <button id="btnHelp" type="button" className="btn  btn-sm btn-primary">Help</button>
                                    
                                </div>
                            </div>
                        </div>
            );
        }
    }
}


