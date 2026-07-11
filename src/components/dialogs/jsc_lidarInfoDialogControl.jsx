import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

import {ClssCtrlLidarDevice} from '../gadgets/jsc_ctrl_lidar_device.jsx'
import ClssDialogBase from './jsc_dialog_base.jsx';

export default class ClssLidarInfoDialog extends ClssDialogBase
{
    constructor()
    {
        super();
        this.state = {
			...this.state,
			'm_update': 0,
		};
        
        this.m_flag_mounted = false;

        this.key = Math.random().toString();
        this.rotation_ticks = 0;

        this.modal_ctrl_lidar_info = React.createRef();
        
        js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitLidarShow,this, this.fn_displayDialog);
        
        
    
    }

    componentDidMount () {
        this.modalRef = this.modal_ctrl_lidar_info;
        super.componentDidMount();
        this.m_flag_mounted = true;
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


    fn_initDialog() {
        this.modal_ctrl_lidar_info.current.style.display = 'none';
        super.fn_initDialog();
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



    fn_getCurrentPartyID() {
        if (this.p_andruavUnit) {
            return this.p_andruavUnit.getPartyID();
        }
        return null;
    }

    render()
    {
        let unitname = '';
        if (this.p_andruavUnit !== null && this.p_andruavUnit !== undefined)
        {
            unitname = this.p_andruavUnit.m_unitName;
        }    

        return (
            <Draggable nodeRef={this.modal_ctrl_lidar_info} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
                <div  key={this.key + "m0"} id="modal_ctrl_lidar_info" title="Lidar Control" className="card css_ontop border-light p-2" ref={this.modal_ctrl_lidar_info}>
					{this.fn_renderDialogHeader('Lidar - ' + unitname)}
					{!this.state.isMinimized && (
					<div key={this.key + "m2"} className="card-body">
						<ClssCtrlLidarDevice p_unit={this.p_andruavUnit} rotation_ticks={this.rotation_ticks} follow_unit={this.follow_unit}/>
					</div>
					)}
					<div id="modal_ctrl_lidar_info_footer" key={this.key + "m3"}>
                        {this.fn_renderDialogFooter(
                            <>
                            <button id="btnFollow" type="button" className="btn btn-sm btn-danger" onClick={(e) => this.fn_follow(true)}>Follow</button>
                            <button id="btnReset" type="button" className="btn btn-sm btn-warning" onClick={(e) => this.fn_follow(false)}>Reset</button>
                            </>
                        )}
					</div>
				</div>
            </Draggable>
        );
    }

}