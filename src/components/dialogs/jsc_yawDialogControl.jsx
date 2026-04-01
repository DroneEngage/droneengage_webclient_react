import $ from 'jquery'; 
import 'jquery-ui-dist/jquery-ui.min.js';
import 'jquery-knob/dist/jquery.knob.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import {EVENTS as js_event} from '../../js/js_eventList.js'
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
        
        this.m_flag_mounted = false;

        this.key = Math.random().toString();
        
        this.opaque_clicked = false;
        this.modal_ctrl_yaw = React.createRef();
        this.yaw_knob = React.createRef();

        this.m_actual_angle_deg = 0;
        this.m_selected_angle_deg = 0;

        js_eventEmitter.fn_subscribe(js_event.EE_displayYawDlgForm,this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_event.EE_unitNavUpdated,this, this.fn_onUnitNavUpdated);
        
    }


    componentDidMount () {
        
        this.m_flag_mounted = true;
        
        this.fn_initDialog();
    }


    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayYawDlgForm,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitNavUpdated,this);
    } 

    
    fn_displayDialog(p_me, p_andruavUnit)
    {
        if (p_andruavUnit == null) {
		    return;
		}
        
        p_me.p_andruavUnit = p_andruavUnit;
        p_me.m_actual_angle_deg = p_me.fn_getCurrentYawDeg(p_andruavUnit);
        p_me.m_selected_angle_deg = p_me.m_actual_angle_deg;

        if (p_me.m_flag_mounted === false)return ;
        
        p_me.setState({'m_update': p_me.state.m_update +1});
        
        p_me.modal_ctrl_yaw.current.style.display = 'block';
		setTimeout(function () {
            p_me.fn_initKnob();
            p_me.fn_setKnobValue(p_me.m_selected_angle_deg);
        }, 0);
    }


    fn_onUnitNavUpdated(p_me, p_andruavUnit)
    {
        if (p_me.m_flag_mounted === false || p_me.p_andruavUnit == null || p_andruavUnit == null) return;
        if (p_me.p_andruavUnit.getPartyID() !== p_andruavUnit.getPartyID()) return;

        p_me.m_actual_angle_deg = p_me.fn_getCurrentYawDeg(p_andruavUnit);

        if (p_me.modal_ctrl_yaw.current != null && p_me.modal_ctrl_yaw.current.style.display === 'block')
        {
            p_me.setState({'m_update': p_me.state.m_update +1});
        }
    }


    fn_getCurrentYawDeg(p_andruavUnit)
    {
        return (js_helpers.CONST_RADIUS_TO_DEGREE * ((p_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2));
    }


    fn_setKnobValue(p_angle)
    {
        if (this.yaw_knob == null || this.yaw_knob.current == null) return;
        const c_angle = parseFloat(p_angle) || 0;
        this.yaw_knob.current.value = c_angle;
        $(this.yaw_knob.current).val(c_angle).trigger('change');
    }


	fn_initKnob()
	{
		if (this.yaw_knob === null || this.yaw_knob === undefined) return;
		if (this.yaw_knob.current === null || this.yaw_knob.current === undefined) return;

		if (this.yaw_knob.current.dataset && this.yaw_knob.current.dataset.knobInitialized === '1') {
			return;
		}

		const $knob = $(this.yaw_knob.current);
		if (typeof $knob.knob !== 'function') return;

		$knob.knob({
			fgColor: "#3671AB",
			bgColor: "#36AB36",
			thickness: 0.3,
			cursor: 10,
			displayPrevious: true,
			format: function (value) {
				return value + '°';
			},
			'mousewheel': function (event) {
				event.preventDefault();
			},
			'touchstart': function (event) {
				event.preventDefault();
			},
			'change': (value) => {
				this.m_selected_angle_deg = parseFloat(value) || 0;
				if (this.m_flag_mounted === true)
				{
					this.setState({'m_update': this.state.m_update +1});
				}
			},
			'release': (value) => {
				this.m_selected_angle_deg = parseFloat(value) || 0;
			}
		});

		$knob.css({ display: 'inline', padding: '0px 10px' });

		if (this.yaw_knob.current.dataset) {
			this.yaw_knob.current.dataset.knobInitialized = '1';
		}
	}


    fn_initDialog()
    {
        const me = this;
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
        fn_gotoUnit_byPartyID(this.p_andruavUnit.getPartyID())
    }

    fn_onYaw(e)
    {
        const target_angle_deg = parseInt(this.yaw_knob.current.value);
        const current_angle_deg = this.fn_getCurrentYawDeg(this.p_andruavUnit).toFixed(1);
		let direction = js_helpers.isClockwiseAngle (current_angle_deg, target_angle_deg);
		fn_doYAW(this.p_andruavUnit, $('#yaw_knob').val(), 0, !direction, false);
			
    }

    fn_Reset()
    {
        this.m_selected_angle_deg = 0;
        this.fn_setKnobValue(0);
        if (this.m_flag_mounted === true)
        {
            this.setState({'m_update': this.state.m_update +1});
        }
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
        const c_actual_angle = this.m_actual_angle_deg;
        const c_rad = (c_actual_angle - 90) * js_helpers.CONST_DEGREE_TO_RADIUS;
        const c_marker_radius = 75;
        const c_center = 100; // Adjusted for jquery-knob padding (90 + 10px)
        const c_marker_size = 15;
        const c_red_left = c_center + (Math.cos(c_rad) * c_marker_radius) - (c_marker_size / 2);
        const c_red_top = c_center + (Math.sin(c_rad) * c_marker_radius) - (c_marker_size / 2);

        return (
            <Draggable nodeRef={this.modal_ctrl_yaw} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
                <div key={this.key + "modal_ctrl_yaw"} id="modal_ctrl_yaw" title="YAW Control" className="card css_ontop border-light p-2" ref={this.modal_ctrl_yaw}>
					<div className="card-header text-center js-draggable-handle">
						<div className="row">
						<div className="col-10">
						<h3 className="text-success text-start">YAW</h3>
						</div>
						<div className="col-2 float-right">
						<button id="btnclose" type="button" className="btn-close smaller" onClick={(e)=>this.fn_closeDialog()}></button>
						</div>
						</div>
					</div>
					<div className="card-body">
						<div id="yaw_knob_out" className="form-group text-centermodal_dialog_style">
						<div style={{position: 'relative', width: '180px', height: '180px', margin: '0 auto'}}>
						<input id="yaw_knob" className=" input-sm dial" data-width="180" data-height="180" data-min="0"
							data-max="360" defaultValue="0"
                            ref = {this.yaw_knob} />
						<div
                                style={{
                                    position: 'absolute',
                                    width: c_marker_size + 'px',
                                    height: c_marker_size + 'px',
                                    borderRadius: '50%',
                                    backgroundColor: '#d9534f',
                                    border: '2px solid #ffffff',
                                    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                                    left: c_red_left + 'px',
                                    top: c_red_top + 'px',
                                    pointerEvents: 'none'
                                }}
                            />
						</div>

						<div className="text-center mt-2">
							<span className="me-3" style={{color: '#3671AB'}}>Selected: {this.m_selected_angle_deg.toFixed(1)}°</span>
							<span style={{color: '#d9534f'}}>Actual: {this.m_actual_angle_deg.toFixed(1)}°</span>
						</div>
						</div> 
					</div>
					<div id="modal_yaw_knob_footer" className="form-group text-center ">
						<div className= "row">
						<div className="btn-group w-100 d-flex flex-wrap">
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