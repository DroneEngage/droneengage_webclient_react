import React    from 'react';

import * as js_siteConfig from '../../../js/js_siteConfig.js'
import {CWayPointLocation} from './jsc_ctrl_waypoint_location.jsx'
import {CWayPointAction} from './jsc_ctrl_waypoint_actions.jsx'

import {ClssSDR_Planning} from '../modules/jsc_ctrl_sdr_planning.jsx'
import {ClssP2P_Planning} from '../modules/jsc_ctrl_p2p_planning.jsx'

/**
 * This is a complete Single Mission Plan.
 */
export class ClssSingle_Mission_Card extends React.Component {

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
        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false))
        {
            this.p2p.fn_editShape();
        }
        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false))
        {
            this.sdr.fn_editShape();
        }
        this.props.p_shape.order = parseInt(this.mission_id_txt.value);
        
        this.props.p_shape.m_mission.fn_updatePath(true)
        return ;
    }

    componentDidUpdate() 
    {
        if (this.props.p_shape !== null && (this.mission_id_txt !== null && this.mission_id_txt !== undefined))
        {
            this.mission_id_txt.value=this.props.p_shape.order; 
        }
    }
    
    render ()
    {
        if ((this.props.p_shape === null || this.props.p_shape === undefined)  || (this.props.p_isCurrent === false) || (this.props.p_isCollapsed === true))
        {
            return (<div/>);
        }

        let tabs = [];
        tabs.push(<li id={'h' + this.key} key={'h_main' + this.key} className="nav-item nav-units">
                    <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_main" + this.key}>Action</a>
                    </li>);
        
        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false))
        {
            tabs.push(<li id={'h' + this.key} key={'h_p2p' + this.key} className="nav-item nav-units">
                    <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_p2p" + this.key}>P2P</a>
                    </li>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false))
        {
            tabs.push(<li id={'h' + this.key} key={'h_sdr' + this.key} className="nav-item nav-units">
                    <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_sdr" + this.key}>SDR</a>
                    </li>);
        }

        let ctrl = [];

        ctrl.push(<div key={'tab_main' + this.key} className="tab-pane fade" id={"tab_main"+this.key}>
                    <CWayPointAction p_shape= {this.props.p_shape}  ref={instance => {this.ma = instance}}/>
                    </div>);
        
        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false))
        {
            ctrl.push(<div key={'tab_p2p' + this.key} className="tab-pane fade" id={"tab_p2p"+this.key}>
                    <ClssP2P_Planning p_shape={this.props.p_shape} p_unit={this.props.p_unit} ref={instance => {this.p2p = instance}}/>
                    </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false))
        {
            ctrl.push(<div key={'tab_sdr' + this.key} className="tab-pane fade" id={"tab_sdr"+this.key}>
                    <ClssSDR_Planning p_shape= {this.props.p_shape} p_unit={this.props.p_unit} ref={instance => {this.sdr = instance}}/>
                    </div>);
        }

        const ordernum_id = 'txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id;
        return (
            <div key={"ms_o" + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} id="m_hdr" className="card text-white bg-primary mb-3">
                <div className="card-header text-center"> 
                    <h4><strong>{"Mission Item #" + this.props.p_shape.order}</strong></h4>
                </div>    
                <div className="card-body">
        
                    <div className="form-group text-left">
                        <label htmlfor={ordernum_id} className="text-primary">ID
                        <input type='text' id={ordernum_id} className="form-control input-sm" ref={instance => {this.mission_id_txt = instance}}/>
                        </label>
                    </div>
                    <div key={this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} id="m_bdy" className="geo_fence ">
                        <CWayPointLocation p_shape= {this.props.p_shape}  ref={instance => {this.wp = instance}}/>
                        <button className="button btn-primary css_margin_top_small" id='btn'  onClick={ (e) => this.fn_editShape()}>Apply</button>
                    </div>
                    
                    <ul key={'unit_header_div'} className="nav nav-tabs">
                            {tabs}
                    </ul>
                    <div key={'unit_details_div'} id="myTabContent" className="tab-content padding_zero"> 
                            {ctrl}
                    </div>
                </div>
            </div>
        );
    }
}