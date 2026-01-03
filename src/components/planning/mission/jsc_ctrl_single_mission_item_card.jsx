import React    from 'react';

import * as js_siteConfig from '../../../js/js_siteConfig.js'

import {EVENTS as js_event} from '../../../js/js_eventList.js'
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'

import {CWayPointLocation} from './jsc_ctrl_waypoint_location.jsx'
import {CWayPointAction} from './jsc_ctrl_waypoint_actions.jsx'

import {ClssSDR_Planning} from '../modules/jsc_ctrl_sdr_planning.jsx'
import {ClssP2P_Planning} from '../modules/jsc_ctrl_p2p_planning.jsx'
import {ClssGPIO_Planning} from '../modules/jsc_ctrl_gpio_planning.jsx'

/**
 * This is a complete Single Mission Plan.
 */
export class ClssSingle_Mission_Item_Card extends React.Component {

    constructor()
    {
        super ();
        this.state = {
        };

        this.key = Math.random().toString();
        this.mission_id_txt = React.createRef(); // Added ref for mission ID input
        
    }

    fn_prevMissionItem()
    {
        if (!this.props.p_shape) return ;
        const c_mission = this.props.p_shape.m_main_de_mission;
        const c_shape = c_mission.fn_activateMissionItem(this.props.p_shape.id, 'prev');
        js_eventEmitter.fn_dispatch(js_event.EE_onShapeSelected, c_shape);
    }

    fn_nextMissionItem()
    {
        if (!this.props.p_shape) return ;
        const c_mission = this.props.p_shape.m_main_de_mission;
        const c_shape = c_mission.fn_activateMissionItem(this.props.p_shape.id, 'next');
        js_eventEmitter.fn_dispatch(js_event.EE_onShapeSelected, c_shape);
    }

    fn_editShape ()
    {
        this.m_waypoint_location.fn_editShape();
        this.m_waypoint_actions.fn_editShape();
        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false))
        {
            this.p2p.fn_editShape();
        }
        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false))
        {
            this.sdr.fn_editShape();
        }
        if ((js_siteConfig.CONST_FEATURE.DISABLE_GPIO !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_GPIO !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_GPIO===false))
        {
            this.gpio.fn_editShape();
        }
        if (this.mission_id_txt.current) { // Check if mission_id_txt is not null
            this.props.p_shape.order = parseInt(this.mission_id_txt.current.value);
        }
        this.props.p_shape.m_main_de_mission.fn_updatePath(true);
                
        return ;
    }

    componentDidUpdate() 
    {
        if (this.props.p_shape !== null && this.mission_id_txt.current) { // Check if mission_id_txt is not null
            this.mission_id_txt.current.value = this.props.p_shape.order; 
        }
    }
    
    render ()
    {
        if ((this.props.p_shape === null || this.props.p_shape === undefined)  || (this.props.p_isCurrent === false) || (this.props.p_isCollapsed === true))
        {
            return (<div/>);
        }

        if (this.props.p_shape.m_main_de_mission === null || this.props.p_shape.m_main_de_mission === undefined)
        {   // mission has been deleted.
            return (<div/>);
        }

        let tabs = [];
        let ctrl = [];

        tabs.push(<li id={'h' + this.key} key={'h_main' + this.key} className="nav-item nav-units">
                    <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_main" + this.key}>Action</a>
                    </li>);
        
        ctrl.push(<div key={'tab_main' + this.key} className="tab-pane fade" id={"tab_main"+this.key}>
            <CWayPointAction p_shape= {this.props.p_shape}  ref={instance => {this.m_waypoint_actions = instance}}/>
            </div>);


        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false))
        {
            tabs.push(<li id={'h' + this.key} key={'h_p2p' + this.key} className="nav-item nav-units">
                    <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_p2p" + this.key}>P2P</a>
                    </li>);
        
            ctrl.push(<div key={'tab_p2p' + this.key} className="tab-pane fade" id={"tab_p2p"+this.key}>
                    <ClssP2P_Planning p_shape={this.props.p_shape} p_unit={this.props.p_unit} ref={instance => {this.p2p = instance}}/>
                    </div>);
        }
    

        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false))
        {
            tabs.push(<li id={'h' + this.key} key={'h_sdr' + this.key} className="nav-item nav-units">
                    <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_sdr" + this.key}>SDR</a>
                    </li>);
        
            ctrl.push(<div key={'tab_sdr' + this.key} className="tab-pane fade" id={"tab_sdr"+this.key}>
                    <ClssSDR_Planning p_shape= {this.props.p_shape} p_unit={this.props.p_unit} ref={instance => {this.sdr = instance}}/>
                    </div>);
        }
    
        if ((js_siteConfig.CONST_FEATURE.DISABLE_GPIO !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_GPIO !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_GPIO===false))
        {
            tabs.push(<li id={'h' + this.key} key={'h_gpio' + this.key} className="nav-item nav-units">
                    <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_gpio" + this.key}>GPIO</a>
                    </li>);

            ctrl.push(<div key={'tab_gpio' + this.key} className="tab-pane fade" id={"tab_gpio"+this.key}>
                    <ClssGPIO_Planning p_shape= {this.props.p_shape} p_unit={this.props.p_unit} ref={instance => {this.gpio = instance}}/>
                    </div>);
        }

    
        const ordernum_id = 'txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id;
        return (
            <div key={"ms_o" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id} id="m_hdr" className="card text-white bg-primary mb-3 css_mission_item_card">
                <div className="card-header text-center"> 
                    <h4><strong>{"Mission Item #" + this.props.p_shape.order}</strong></h4>
                </div>    
                <div className="card-body">
        
                    <div className='row justify-content-center'>
                        <div className='col-2'>
                            <button className="btn btn-sm btn-primary css_margin_top_small" id='btn'  onClick={ (e) => this.fn_prevMissionItem()}>{"<<"}</button>
                        </div>
                        <div className='col-6'>
                                <input type='text' id={ordernum_id} className="form-control css_margin_top_small input-sm" disabled="disabled" ref={this.mission_id_txt}/>
                        </div>
                        <div className='col-2'>
                            <button className="btn btn-sm btn-primary css_margin_top_small" id='btn'  onClick={ (e) => this.fn_nextMissionItem()}>{">>"}</button>
                        </div>
                    </div>
                    <div key={this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id} id="m_bdy" className="geo_fence ">
                        <CWayPointLocation p_shape= {this.props.p_shape}  ref={instance => {this.m_waypoint_location = instance}}/>
                        <button className="btn border-white btn-primary css_margin_top_small" id='btn'  onClick={ (e) => this.fn_editShape()}>Apply</button>
                    </div>
                    
                    <ul key={'unit_header_div'} className="nav nav-tabs mt-2">
                            {tabs}
                    </ul>
                    <div key={'unit_details_div'} id="myTabContent1" className="tab-content padding_zero"> 
                            {ctrl}
                    </div>
                </div>
            </div>
        );
    }
}