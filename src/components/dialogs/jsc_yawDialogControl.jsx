import $ from 'jquery'; 
import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import {fn_gotoUnit_byPartyID, fn_doYAW} from '../../js/js_main.js'
import * as js_helpers from '../../js/js_helpers.js';

export default class ClssYawDialog extends React.Component
{
    constructor()
    {
        super();
        this.state = {
			'm_update': 0,
		};
        
        this.key = Math.random().toString();
        
        this.opaque_clicked = false;
        this.modal_ctrl_yaw = React.createRef();
        this.yaw_knob = React.createRef();

        js_eventEmitter.fn_subscribe(js_globals.EE_displayYawDlgForm,this, this.fn_displayDialog);
        
    }


    componentDidMount () {
        
        this.state.m_update = 1;
        
        this.fn_initDialog();
    }


    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_displayYawDlgForm,this);
    } 

    
    fn_displayDialog(p_me, p_andruavUnit)
    {
        if (p_andruavUnit == null) {
		    return;
		}
        
        p_me.p_andruavUnit = p_andruavUnit;

        if (p_me.state.m_update === 0) return ;
        
        p_me.setState({'m_update': p_me.state.m_update +1});
        
        p_me.modal_ctrl_yaw.current.style.display = 'block';
    }


    fn_initDialog()
    {
        var me = this;
        //this.modal_ctrl_yaw.current.draggable = true;
        this.modal_ctrl_yaw.current.onmousedown = function (e) {
            me.modal_ctrl_yaw.current.style.opacity = '1.0';
        };
        this.modal_ctrl_yaw.current.onmouseover = function (e) {
            me.modal_ctrl_yaw.current.style.opacity = '1.0';
        };
        this.modal_ctrl_yaw.current.onmouseout =function (e) {
            if (me.opaque_clicked === false) {
                me.modal_ctrl_yaw.current.style.opacity = '0.4';
            }
        };

        this.yaw_knob.current.value = 0;
		this.modal_ctrl_yaw.current.style.display = 'none';		
    }

    fn_gotoUnit()
    {
        fn_gotoUnit_byPartyID(this.p_andruavUnit.partyID)
    }

    fn_onYaw(e)
    {
        const target_angle_deg = parseInt(this.yaw_knob.current.value);
        const current_angle_deg = (js_helpers.CONST_RADIUS_TO_DEGREE * ((this.p_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1);
		let direction = js_helpers.isClockwiseAngle (current_angle_deg, target_angle_deg);
		fn_doYAW(this.p_andruavUnit, $('#yaw_knob').val(), 0, !direction, false);
			
    }

    fn_Reset()
    {
        this.yaw_knob.current.value = 0;
    }

    fn_closeDialog()
    {
	    this.modal_ctrl_yaw.current.style.opacity = '';
        this.modal_ctrl_yaw.current.style.display = 'none';
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
            this.modal_ctrl_yaw.current.style.opacity = '1.0';
        }
    }

    render ()
    {
        return (
            <Draggable nodeRef={this.modal_ctrl_yaw}>
                <div key={this.key + "modal_ctrl_yaw"} id="modal_ctrl_yaw" title="YAW Control" className="card css_ontop border-light p-2" ref={this.modal_ctrl_yaw}>
					<div className="card-header text-center">
						<div className="row">
						<div className="col-10">
						<h3 className="text-success text-start">YAW</h3>
						</div>
						<div className="col-2 float-right">
						<button id="btnclose" type="button" className="btn-close" onClick={(e)=>this.fn_closeDialog()}></button>
						</div>
						</div>
					</div>
					<div className="card-body">
						<div id="yaw_knob_out" className="form-group text-centermodal_dialog_style">
						<input id="yaw_knob" className=" input-sm dial" data-width="180" data-height="180" data-min="0"
							data-max="360" defaultValue="0"
                            ref = {this.yaw_knob} />
						</div> 
					</div>
					<div id="modal_yaw_knob_footer" className="form-group text-center ">
						<div className= "row">
						<div className="btn-group">
							<button id="opaque_btn" type="button" className="btn btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off" onClick={(e) => this.fn_opacityDialog()}>opaque</button>
							<button id="btnGoto" type="button" className="btn btn-sm btn-success" onClick={(e)=>this.fn_gotoUnit(e)}>Goto</button>
							<button id="btnYaw" type="button" className="btn btn-sm btn-danger" onClick={(e)=>this.fn_onYaw(e)}>YAW</button>
							<button id="btnResetYaw" type="button" className="btn btn-sm btn-warning" onClick={(e)=>this.fn_Reset(e)}>reset YAW</button>
						</div>
						</div>
					</div>
				</div>
            </Draggable>
        );
    }
}