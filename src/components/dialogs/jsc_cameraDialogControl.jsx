import $ from 'jquery'; 
import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import * as js_andruavMessages from '../../js/js_andruavMessages.js'

import {fn_VIDEO_login, fn_VIDEO_Record, fn_gotoUnit_byPartyID} from '../../js/js_main.js';

class Clss_CameraDevice extends React.Component {

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
        fn_VIDEO_login (this.props.prop_session, this.state.v_track.id);
        js_eventEmitter.fn_dispatch (js_globals.EE_hideStreamDlgForm);
    }

    fn_videoRecord(p_startRecord)
    {
        fn_VIDEO_Record (this.props.prop_session, this.state.v_track.id, p_startRecord);
    }

    fn_oneShot ()
    {
        if (this.props.prop_session == null) return ;
        var camera_index;
        if (this.props.prop_session.m_unit.m_isDE === true) {
            camera_index = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id;
        }
        else {
            camera_index = js_andruavMessages.CONST_CAMERA_SOURCE_MOBILE;
        }


        js_globals.v_andruavClient.API_CONST_RemoteCommand_takeImage2(this.props.prop_session.m_unit.partyID,
            this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id,
            1,
            0, 
            0);
    }

    fn_shot()
    {
        if (this.props.prop_session == null) return ;
        var camera_index;
        if (this.props.prop_session.m_unit.m_isDE === true) {
            camera_index = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id;
        }
        else {
            camera_index = js_andruavMessages.CONST_CAMERA_SOURCE_MOBILE;
        }

        js_globals.v_andruavClient.API_CONST_RemoteCommand_takeImage2(this.props.prop_session.m_unit.partyID, 
            this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id,
            this.props.prop_parent.fn_getNumOfShots(),
            this.props.prop_parent.fn_getInterval(), 
            0);
    }

    

    componentDidMount () 
    {
        this.state.v_track = this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number];
        
    }

    render ()  {
        var v_unit = this.props.prop_session.m_unit;
        if ((v_unit == null) || (this.state.v_track == null))
        {
            
            return (
                <div></div>
            );
        }
        else
        {
            
            var v_cam_class = 'btn-warning';
            var v_record_class = 'btn-primary';
            
            return (
                    <div key={'cam_dev' + this.props.prop_session.m_unit.m_Video.m_videoTracks[this.props.prop_track_number].id} className="row al_l css_margin_zero">
                            <div className= "col-8   si-09x css_margin_zero text-white">
                            <label>{this.state.v_track.ln}</label>
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

export default class Clss_CameraDialog extends React.Component
{
    constructor()
    {
        super();
        this.state = {
			'm_update': 0,
            
		};
        
        
        this._isMounted = false;
        
        js_eventEmitter.fn_subscribe(js_globals.EE_displayCameraDlgForm,this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_globals.EE_hideCameraDlgForm,this, this.fn_closeDialog);
    }


    fn_displayDialog (p_me, p_session)
    {
        var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_session.m_unit.partyID);
		if (p_andruavUnit == null) {
		    return;
		}
        
        if (p_me._isMounted!==true) return ;
        
		p_me.setState({'p_session':p_session,'m_update': p_me.state.m_update +1});
        $('#modal_ctrl_cam').show();
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    fn_gotoUnitPressed()
    {
        if (this.state.p_session == null) return ;
        fn_gotoUnit_byPartyID(this.state.p_session.m_unit.partyID);

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
        $('#modal_ctrl_cam').draggable();
        $('#modal_ctrl_cam').index('mouseover', function () {
            $('#modal_ctrl_cam').css('opacity', '1.0');
        });
        $('#modal_ctrl_cam').on('mouseout', function () {
            if ($('#modal_ctrl_cam').attr('opacity') == null) {
                $('#modal_ctrl_cam').css('opacity', '0.4');
            }
        });
        
        $('#modal_ctrl_cam').find('#btnShot').on('click', function () {
            // assume what there is attribute partyID in the control used to pass parameter
            js_globals.v_andruavClient.API_CONST_RemoteCommand_takeImage2($('#modal_ctrl_cam').attr('partyID'), js_andruavMessages.CONST_CAMERA_SOURCE_MOBILE, 1, 0, 0);
        });
        $('#modal_ctrl_cam').find('#btnSwitchCam').on('click', function () {
            // assume what there is attribute partyID in the control used to pass parameter
            const c_partyID = $('#modal_ctrl_cam').attr('partyID');
            js_globals.v_andruavClient.API_SwitchCamera(c_partyID,c_partyID);
        });
        $('#modal_ctrl_cam').find('#btnTakeImage').on('click', function () {
            // assume what there is attribute partyID in the control used to pass parameter
            js_globals.v_andruavClient.API_CONST_RemoteCommand_takeImage2($('#modal_ctrl_cam').attr('partyID'), js_andruavMessages.CONST_CAMERA_SOURCE_MOBILE, $('#modal_ctrl_cam').find('#txt_TotalImages').val(), $('#modal_ctrl_cam').find('#txt_ShootingInterval').val(), 0);
        });
        $('#modal_ctrl_cam').find('#btnFCBTakeImage').on('click', function () {
            // assume what there is attribute partyID in the control used to pass parameter
            js_globals.v_andruavClient.API_CONST_RemoteCommand_takeImage2($('#modal_ctrl_cam').attr('partyID'), js_andruavMessages.CONST_CAMERA_SOURCE_FCB, $('#modal_ctrl_cam').find('#txt_TotalImages').val(), $('#modal_ctrl_cam').find('#txt_ShootingInterval').val(), 0);
        });

        $('#modal_ctrl_cam').find('#txt_TotalImages').bind("mousedown", function () {
            $(this).parents('tr').removeClass('draggable');
        });
        $('#modal_ctrl_cam').find('#txt_ShootingInterval').bind("mousedown", function () {
            $(this).parents('tr').removeClass('draggable');
        });
        $('#modal_ctrl_cam').hide();
        
    }

    fn_closeDialog()
    {
	    $('#modal_ctrl_cam').attr('opacity', null);
        $('#modal_ctrl_cam').hide();
        if ((this.state !== null && this.state !== undefined) && (this.state.hasOwnProperty('p_session') === true))
        {
            this.state.p_session = null;            
        }
    }

    fn_opacityDialog()
    {
        if ($('#modal_ctrl_cam').attr('opacity') == null) {
            $('#modal_ctrl_cam').attr('opacity', '1.0');
            $('#modal_ctrl_cam').css('opacity', '1.0');
        }
        else {
            $('#modal_ctrl_cam').attr('opacity', null);
        }
    }

    componentWillUnmount ()
    {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe(js_globals.EE_displayCameraDlgForm,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_hideCameraDlgForm,this);
    } 

    componentDidMount () {
        this._isMounted = true;
        
        $('#txt_ShootingInterval').val(1);
        $('#txt_TotalImages').val(1);
        this.fn_initDialog();
    }


    render ()
    {

        
        var p_session;
        var v_streanms = [];
        var v_unitName;

        if ((this.state.hasOwnProperty('p_session')) && (this.state.p_session !== null && this.state.p_session !== undefined))
        {
            p_session = this.state.p_session;
            
            js_globals.fn_console_log ("Debug:", p_session.m_unit.m_Video.m_videoTracks.length);

            for (var i = 0; i < p_session.m_unit.m_Video.m_videoTracks.length; ++i) {
                v_streanms.push(<Clss_CameraDevice key={p_session.m_unit.m_Video.m_videoTracks[i].id+'cd'} prop_session={p_session} prop_track_number={i} prop_parent={this} />);
            }
            v_unitName = p_session.m_unit.m_unitName
        }


        
        

        return (
            <div key='modal_ctrl_cam' id="modal_ctrl_cam" title="Camera Control" data-toggle="tooltip"  className="card width_fit_max css_ontop border-light p-2 ">
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
                            <div className="col-6 col-sm-6 col-lg-6">
                                    <div className="form-group">
                                    <div>
                                        <label htmlFor="txt_ShootingInterval" className="text-primary"><small>Each&nbsp;N&nbsp;sec</small></label>
                                        <input id="txt_ShootingInterval" type="number"  className="form-control input-xs input-sm"   />
                                    </div>
                                    </div>
                            </div>
                            <div className="col-6 col-sm-6 col-lg-6">
                                    <div className="form-group">
                                        <div>
                                        <label htmlFor="txt_TotalImages" className="text-primary"><small>Total&nbsp;Img</small></label>
                                        <input id="txt_TotalImages" type="number"  className="form-control input-xs input-sm"  />
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </div>
                    </div>        
                    <div id="modal_ctrl_cam_footer" className="form-group text-center localcontainer css_ontop">
                        <div className= "row">
                            <div className= "col-md-6">
                            <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" data-toggle="button" aria-pressed="false" autoComplete="off" onClick={(e) => this.fn_opacityDialog()}>opaque</button>
                            </div>
                            <div className= "col-md-6">
                                <button id="btnGoto" type="button" className="btn btn-sm btn-success" onClick={(e) => this.fn_gotoUnitPressed()}>Goto</button>
                            </div>
                            {/* <div className= "col-md-4">
                                <button id="btnShot" type="button" className="btn btn-sm btn-warning"  onClick={ (e) => this.fn_oneShot()}>One Shot</button>
                            </div> */}
                        </div>
                    </div>
            </div>
            );
    }

}


       
