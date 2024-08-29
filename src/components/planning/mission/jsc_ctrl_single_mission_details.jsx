import $ from 'jquery';

import React    from 'react';

import {CWayPointLocation} from './jsc_ctrl_waypoint_location.jsx'
import {CWayPointAction} from './jsc_ctrl_waypoint_actions.jsx'

import {ClssSDR_Planning} from '../modules/jsc_ctrl_sdr_planning.jsx'

/**
 * This is a complete Single Mission Plan.
 */
export class ClssSingle_Mission_Details extends React.Component {

    constructor()
    {
        super ();
        this.state = {
        };

        this.key = Math.random().toString();
        
    }


    fn_editShape ()
    {
        this.wp.fn_editShape();
        this.ma.fn_editShape();
        this.props.p_shape.order = parseInt($('#txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val());
        
        this.props.p_shape.m_mission.fn_updatePath(true)
        return ;
    }

    componentDidUpdate() 
    {
        if (this.props.p_shape != null)
        {
            $('#txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val(this.props.p_shape.order); 
        }
    }
    
    render ()
    {
        if ((this.props.p_shape === null || this.props.p_shape === undefined)  || (this.props.p_isCurrent === false) || (this.props.p_isCollapsed === true))
        {
            return (<div/>);
        }

        return (
            <div key={"ms_o" + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} id="m_hdr" className="card text-white bg-primary mb-3">
                <div className="card-header text-center"> 
                    <h4><strong>{"Mission Item #" + this.props.p_shape.order}</strong></h4>
                </div>    
                <div className="card-body">
        
                    <div className="form-group text-left">
                        <label className="text-primary">ID</label>
                        <input type='text' id={'txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} className="form-control input-sm"/>
                    </div>
                    <ul key={'unit_header_div'} className="nav nav-tabs">
                            <li id={'h' + this.key} key={'h_sdr' + this.key} className="nav-item nav-units">
                                <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_sdr" + this.key}>SDR</a>
                            </li>
                    </ul>
                    <div key={'unit_details_div'} id="myTabContent" className="tab-content padding_zero"> 
                            <div key={'tab_sdr' + this.key} className="tab-pane fade" id={"tab_sdr"+this.key}>
                                <ClssSDR_Planning />
                            </div>
                    </div>

                    <div key={this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} id="m_bdy" className="geo_fence ">
                        <CWayPointAction p_shape= {this.props.p_shape}  ref={instance => {this.ma = instance}}/>
                        <CWayPointLocation p_shape= {this.props.p_shape}  ref={instance => {this.wp = instance}}/>
                        <button className="button btn-primary css_margin_top_small" id='btn'  onClick={ (e) => this.fn_editShape()}>Apply</button>
                    </div>
                </div>
            </div>
        );
    }
}