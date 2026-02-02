import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import {fn_gotoUnit_byPartyID} from '../../js/js_main.js'

import {ClssCtrlLidarDevice} from '../gadgets/jsc_ctrl_lidar_device.jsx'

export default class ClssLidarInfoDialog extends React.Component
{
    constructor()
    {
        super();
        this.state = {
			'm_update': 0,
		};
        
        this.m_flag_mounted = false;

        this.key = Math.random().toString();
        this.rotation_ticks = 0;

        this.opaque_clicked = false;
        
        this.modal_ctrl_lidar_info = React.createRef(); // Assuming you need this ref as well
        
        js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitLidarShow,this, this.fn_displayDialog);
        
        
    
    }

    componentDidMount () {
        
        this.m_flag_mounted = true;
        
        this.fn_initDialog();
    }


    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_andruavUnitLidarShow,this);
    } 


    fn_displayDialog(p_me, p_andruavUnit)
    {
        if (p_andruavUnit == null) {
		    return;
		}
        
        p_me.p_andruavUnit = p_andruavUnit;

        if (p_me.m_flag_mounted === false)return ;
        
        p_me.setState({'m_update': p_me.state.m_update +1});
        
        p_me.modal_ctrl_lidar_info.current.style.display = 'block';
    }


    fn_initDialog()
    {
        const me = this;
        //this.modal_ctrl_lidar_info.current.draggable = true;
        this.modal_ctrl_lidar_info.current.onmousedown = function (e) {
            me.modal_ctrl_lidar_info.current.style.opacity = '1.0';
        };
        this.modal_ctrl_lidar_info.current.onmouseover = function (e) {
            me.modal_ctrl_lidar_info.current.style.opacity = '1.0';
        };
        this.modal_ctrl_lidar_info.current.onmouseout =function (e) {
            if (me.opaque_clicked === false) {
                me.modal_ctrl_lidar_info.current.style.opacity = '0.4';
            }
        };

		this.modal_ctrl_lidar_info.current.style.display = 'none';		
    }
    
    fn_tick(p_dir)
    {
        this.rotation_ticks += p_dir;
        
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_follow (p_on_off)
    {
        this.follow_unit = p_on_off;

        this.setState({'m_update': this.state.m_update +1});
    }

    fn_closeDialog()
    {
	    this.modal_ctrl_lidar_info.current.style.opacity = '';
        this.modal_ctrl_lidar_info.current.style.display = 'none';
    }



    fn_gotoUnit()
    {
        fn_gotoUnit_byPartyID(this.p_andruavUnit.getPartyID())
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
            this.modal_ctrl_lidar_info.current.style.opacity = '1.0';
        }
    }

    render()
    {
        let unitname = '';
        if (this.p_andruavUnit !== null && this.p_andruavUnit !== undefined)
        {
            unitname = this.p_andruavUnit.m_unitName;
        }    

        return (
            <Draggable nodeRef={this.modal_ctrl_lidar_info} handle=".card-header" cancel="button, input, textarea, select, option, a">
                <div  key={this.key + "m0"} id="modal_ctrl_lidar_info" title="Lidar Control" className="card css_ontop border-light p-2" ref={this.modal_ctrl_lidar_info}>
					<div key={this.key + "m1"} className="card-header text-center">
						<div className="row">
						<div className="col-10">
						<h3 className="text-success text-start">{'Lidar - ' + unitname}</h3>
						</div>
						<div className="col-2 float-right">
						<button id="btnclose" type="button" className="btn-close" onClick={(e)=>this.fn_closeDialog()}></button>
						</div>
						</div>
					</div>
					<div key={this.key + "m2"} className="card-body">
						<ClssCtrlLidarDevice p_unit={this.p_andruavUnit} rotation_ticks={this.rotation_ticks} follow_unit={this.follow_unit}/>
					</div>
					<div id="modal_ctrl_lidar_info_footer" key={this.key + "m3"} className="form-group text-center ">
                        <div className= "row">
                            <div className= "col-md-3">
                            <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off" onClick={(e) => this.fn_opacityDialog()}>opaque</button>
                            </div>
                            
                            <div className= "col-md-3">
                                <button id="btnGoto" type="button" className="btn btn-sm btn-success" onClick={(e) => this.fn_gotoUnit()}>Goto</button>
                            </div>
                            
                            <div className= "col-md-3">
                                <button id="btnFollow" type="button" className="btn btn-sm btn-danger" onClick={(e) => this.fn_follow(true)}>Follow</button>
                            </div>
                            <div className= "col-md-3">
                                <button id="btnReset" type="button" className="btn btn-sm btn-warning" onClick={(e) => this.fn_follow(false)}>Reset</button>
                            </div>
                            
                        </div>
					</div>
				</div>
            </Draggable>
        );
    }

}