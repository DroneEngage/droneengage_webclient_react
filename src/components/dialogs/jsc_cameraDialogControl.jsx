import $ from 'jquery'; 
import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import {js_globals} from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import * as js_andruavMessages from '../../js/protocol/js_andruavMessages'
import * as js_common from '../../js/js_common.js'

import {fn_VIDEO_login, fn_VIDEO_Record, fn_gotoUnit_byPartyID} from '../../js/js_main.js';

class ClssCameraDevice extends React.Component {

    constructor ()
    {
        super ();
        this.state =
        {
            v_track: null,
        };
    }

    fn_videoStream()
    {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        fn_VIDEO_login (this.props.prop_session, v_track.id);
        js_eventEmitter.fn_dispatch (js_event.EE_hideStreamDlgForm);
    }

    fn_videoRecord(p_startRecord)
    {
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        
        fn_VIDEO_Record (this.props.prop_session, v_track.id, p_startRecord);
    }

    fn_oneShot ()
    {
        if (this.props.prop_session == null) return ;
        let camera_index;
        if (this.props.prop_session.m_unit.fn_getIsDE() === true) {
            camera_index = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id;
        }
        else {
            camera_index = js_andruavMessages.CONST_CAMERA_SOURCE_MOBILE;
        }


        js_globals.v_andruavFacade.API_CONST_RemoteCommand_takeImage2(this.props.prop_session.m_unit.getPartyID(),
            camera_index,
            1,
            0, 
            0);
    }

    fn_shot()
    {
        if (this.props.prop_session == null) return ;
        let camera_index;
        if (this.props.prop_session.m_unit.fn_getIsDE() === true) {
            camera_index = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id;
        }
        else {
            camera_index = js_andruavMessages.CONST_CAMERA_SOURCE_MOBILE;
        }

        js_globals.v_andruavFacade.API_CONST_RemoteCommand_takeImage2(this.props.prop_session.m_unit.getPartyID(), 
            this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id,
            this.props.prop_parent.fn_getNumOfShots(),
            this.props.prop_parent.fn_getInterval(), 
            0);
    }

    

    componentDidMount () 
    {
        
    }

    render ()  {
        const v_unit = this.props.prop_session.m_unit;
        const v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        
        if ((v_unit == null) || (v_track == null))
        {
            
            return (
                <div></div>
            );
        }
        else
        {
            
            const v_cam_class = 'btn-warning';
            const v_record_class = 'btn-primary';
            
            return (
                    <div key={'cam_dev' + this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id} className="row al_l css_margin_zero">
                            <div className= "col-8   si-09x css_margin_zero txt-theme-aware">
                            <label>{v_track.ln}</label>
                            </div>
                            <div className= "col-2   si-09x css_margin_zero css_padding_2">
                                <button type="button" className={"btn btn-sm " + v_cam_class}  onClick={ (e) => this.fn_oneShot()}>One Shot</button>
                            </div>
                            <div className= "col-2   si-09x css_margin_zero css_padding_2">
                                <button type="button" className={"btn btn-sm " + v_record_class} onClick={ (e) => this.fn_shot()}>Multi Shot</button>
                            </div>
                    </div>
                
            );
        }
    };
};

export default class ClssCameraDialog extends React.Component
{
    constructor()
    {
        super();
        this.state = {
			'm_update': 0,
		};
        
        this.m_flag_mounted = false;
        
        this.key = Math.random().toString();
        
        this.opaque_clicked = false;
        this.modal_ctrl_cam = React.createRef();
        this.txt_TotalImages = React.createRef();
        this.txt_ShootingInterval = React.createRef();
        

        js_eventEmitter.fn_subscribe(js_event.EE_displayCameraDlgForm,this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_event.EE_hideCameraDlgForm,this, this.fn_closeDialog);
    }


    componentDidMount () {
        
        this.m_flag_mounted = true;
        
        this.txt_ShootingInterval.current.value = 1;
        this.txt_TotalImages.current.value = 1;
        this.fn_initDialog();
    }


    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayCameraDlgForm,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_hideCameraDlgForm,this);
    } 

    
    fn_displayDialog (p_me, p_session)
    {
        const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_session.m_unit.getPartyID());
		if (p_andruavUnit == null) {
		    return;
		}
        
        if (p_me.m_flag_mounted === false)return ;
        
        p_me.state.p_session = p_session;
		
        p_me.setState({'m_update': p_me.state.m_update +1});
        
        p_me.modal_ctrl_cam.current.style.display = 'block';
    }

    fn_gotoUnitPressed()
    {
        if (this.m_flag_mounted === false)return ;
        fn_gotoUnit_byPartyID(this.state.p_session.m_unit.getPartyID());

    }

   fn_getInterval()
    {
        return $('#txt_ShootingInterval').val();
    }

    fn_getNumOfShots()
    {
        return $('#txt_TotalImages').val();
    }

    fn_initDialog()
    {
        const me = this;
        //this.modal_ctrl_cam.current.draggable = true;
        this.modal_ctrl_cam.current.onmousedown = function (e) {
            me.modal_ctrl_cam.current.style.opacity = '1.0';
        };
        this.modal_ctrl_cam.current.onmouseover = function (e) {
            me.modal_ctrl_cam.current.style.opacity = '1.0';
        };
        this.modal_ctrl_cam.current.onmouseout =function (e) {
            if (me.opaque_clicked === false) {
                me.modal_ctrl_cam.current.style.opacity = '0.4';
            }
        };
        
        this.txt_TotalImages.current.onmousedown = function () {
            $(this).parents('tr').removeClass('draggable');
        };
        this.txt_ShootingInterval.current.onmousedown = function () {
            $(this).parents('tr').removeClass('draggable');
        };
        
        this.modal_ctrl_cam.current.style.display = 'none';
        
    }

    fn_closeDialog()
    {
	    this.modal_ctrl_cam.current.style.opacity = '';
        this.modal_ctrl_cam.current.style.display = 'none';
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
            this.modal_ctrl_cam.current.style.opacity = '1.0';
        }
    }

    render ()
    {
        let p_session;
        let v_streanms = [];
        let v_unitName = 'undefined';

        if ((this.state.hasOwnProperty('p_session')) && (this.state.p_session !== null && this.state.p_session !== undefined))
        {
            p_session = this.state.p_session;
            
            js_common.fn_console_log ("Debug:", p_session.m_unit.m_Video.m_videoTracks.length);

            for (let i = 0; i < p_session.m_unit.m_Video.m_videoTracks.length; ++i) {
                v_streanms.push(<ClssCameraDevice key={p_session.m_unit.m_Video.m_videoTracks[i].id+'cd'} prop_session={p_session} prop_track_number={i} prop_parent={this} />);
            }
            v_unitName = p_session.m_unit.m_unitName
        }


        
        

        return (
            <Draggable nodeRef={this.modal_ctrl_cam} handle=".card-header" cancel="button, input, textarea, select, option, a">
            <div key={this.key + 'modal_ctrl_cam'} id="modal_ctrl_cam" title="Camera Control" data-bs-toggle="tooltip"  className="card  css_ontop border-light p-2 " ref={this.modal_ctrl_cam}>
                <div key='camera_hdr' className="card-header text-center">
					<div className="row">
				        <div className="col-10">
						    <h4 className="text-success text-start">Still Image of' {v_unitName} </h4>
						</div>
						<div className="col-2 float-right">
						    <button id="btnclose" type="button" className="btn-close" onClick={(e)=>this.fn_closeDialog()}></button>
						</div>
					</div>
				</div>
                      
                <div key='camera_body'  id="camera-card-body" className="card-body">
                    <div key='camera_v_streanms'  className='row'>
                                {v_streanms}
                    </div>
                    <div className="tab-content">
                        <div className="row margin_5px">
                            <div className="col-6">
                                    <div className="form-group">
                                    <div>
                                        <label htmlFor="txt_ShootingInterval" className="text-primary"><small>Each&nbsp;N&nbsp;sec</small></label>
                                        <input id="txt_ShootingInterval" type="number"  className="form-control input-xs input-sm"  ref={this.txt_ShootingInterval} />
                                    </div>
                                    </div>
                            </div>
                            <div className="col-6">
                                    <div className="form-group">
                                        <div>
                                        <label htmlFor="txt_TotalImages" className="text-primary"  ><small>Total&nbsp;Img</small></label>
                                        <input id="txt_TotalImages" type="number"  className="form-control input-xs input-sm" ref={this.txt_TotalImages} />
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </div>
                    </div>        
                    <div id="modal_ctrl_cam_footer" className="form-group text-center localcontainer css_ontop">
                        <div className= "row">
                            <div className= "col-md-6">
                            <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off" onClick={(e) => this.fn_opacityDialog()}>opaque</button>
                            </div>
                            <div className= "col-md-6">
                                <button id="btnGoto" type="button" className="btn btn-sm btn-success" onClick={(e) => this.fn_gotoUnitPressed()}>Goto</button>
                            </div>
                        </div>
                    </div>
            </div>
            </Draggable>
            );
    }

}


       
