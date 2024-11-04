import $ from 'jquery';

import React from 'react';

import * as js_andruavMessages from '../../../js/js_andruavMessages.js'
import * as js_common from '../../../js/js_common.js'


import { js_mapmission_planmanager } from '../../../js/js_mapmissionPlanManager.js'
import { js_globals } from '../../../js/js_globals.js';
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'
import { js_leafletmap } from '../../../js/js_leafletmap.js'
import {ClssSingle_Mission_Container} from './jsc_ctrl_single_mission_container.jsx'
import {setSelectedMissionFilePathToRead, fn_readMissionFile} from '../../../js/js_main.js'

/**
 * Main Class for Mission 
 * You can add mission controls
 */
export default class ClssMission_Container extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            p_plans: [],
            is_connected: false
        };


        this.mission_file_ref = React.createRef();

        js_eventEmitter.fn_subscribe(js_globals.EE_onSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_globals.EE_onMissionItemToggle, this, this.fn_onMissionItemToggle);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeCreated, this, this.fn_onShapeCreated);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeSelected, this, this.fn_onShapeSelected);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeEdited, this, this.fn_onShapeEdited);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeDeleted, this, this.fn_onShapeDeleted);
        
    }

    componentDidMount () {
        this.state.m_update = 1;
    }

    fn_handleFileChange (e)
    {
        setSelectedMissionFilePathToRead(this.mission_file_ref.current.files);
    }

    fn_onSocketStatus(me, p_params) {

        if (p_params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
            me.setState({ is_connected: true });
        }
        else {
            me.setState({ is_connected: false });
        }
    }

    fn_onMissionItemToggle(me, p_params) {

        if (p_params.p_switch_next === true) {
            // switch to next
            js_mapmission_planmanager.fn_activateNextMission(p_params.p_mission.m_id);
        }
        else {
            // make this the current
            js_mapmission_planmanager.fn_setCurrentMission(p_params.p_mission.m_id);
        }
        
        if (me.state.m_update === 0) return ;
        me.setState({'m_update': me.state.m_update +1});
    }


    fn_onShapeCreated(me, p_shape) {
        js_common.fn_console_log("fn_onShapeCreated: " + p_shape);

        if (p_shape.pm.xshape !== 'Marker') return;

        let v_mission = js_mapmission_planmanager.fn_getCurrentMission();
        v_mission.fn_addMarker(p_shape);
    }


    /**
     * 
     * @param {*} me 
     * @param {*} p_event 
     *      p_event
            { 
                latlng: { lat, lng}
                target: shape
            }
    */
    fn_onShapeSelected(me, p_event) {

    }

    fn_onShapeEdited(me, p_shape) {
        if (p_shape.m_main_de_mission == null) return; // geo fence not mission
        p_shape.m_main_de_mission.fn_updatePath(true);
    }

    fn_onShapeDeleted(me, p_shape) {
        if (p_shape.m_main_de_mission == null) return; // geo fence not mission
        p_shape.m_main_de_mission.fn_deleteMe(p_shape);
    }

    fn_addNewPathPlan(e) {
        var v_missionPlan = js_mapmission_planmanager.fn_createNewMission();
        js_mapmission_planmanager.fn_setCurrentMission(v_missionPlan.m_id);
        js_leafletmap.fn_enableDrawMarker(true);
        this.setState({ p_plans: this.state.p_plans.concat([v_missionPlan]) });
    }




    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onSocketStatus, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onMissionItemToggle, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onShapeCreated, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onShapeSelected, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onShapeEdited, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onShapeDeleted, this);

    }

    render() {

        var item = [];


        let v_mission1 = js_mapmission_planmanager.fn_getCurrentMission();

        if ((this.state.is_connected === false) || (this.state.p_plans === null || this.state.p_plans === undefined) || (this.state.p_plans.length === 0)) {
            item.push(<h4 key="mi"></h4>);
        }
        else {
            this.state.p_plans.map(function (v_plan) {


                item.push(
                    <ClssSingle_Mission_Container key={'umc' + v_plan.m_id} p_missionPlan={v_plan} p_isCurrent={v_plan.m_id === v_mission1.m_id} />
                );
            });


        }

        let v_ctrl = [];

        if (this.state.is_connected === true) {
            v_ctrl.push(
                <div key='fsc' className="width_100">
                    <div key={this.key + 'v_uploadFile0'} className="row width_100 margin_zero css_margin_top_small ">
                        <div  key={this.key + 'v_uploadFile1'} className={"col-12 "}>
                        <div key={this.key + 'v_uploadFile2'} className="form-inline">
                            <div key={this.key + 'v_uploadFile3'} className="form-group">
                                <label htmlFor="btn_filesWP" className="user-select-none text-white mt-2"><small>Global&nbsp;Mission&nbsp;File</small></label>
                                <input type="file" id="btn_filesWP" name="file" className="form-control input-xs input-sm css_margin_left_5 line-height-normal" ref={this.mission_file_ref} onChange={(e)=>this.fn_handleFileChange(e)}/>
                            </div>
                        </div>
                        </div>
                    </div>
                    <div className="row margin_zero">
                        <div className="col-11 text-warning">
                            <p>Add New Mission </p>
                        </div>
                        <div className="col-1">
                            <button className="btn-primary btn-sm float-left" title="Add New Mission Plan" onClick={(e) => this.fn_addNewPathPlan(e)} >+</button>
                        </div>
                    </div>
                    <div className="row margin_zero width_100">
                        {item}
                    </div>
                </div>
            );
        }
        else {
            v_ctrl.push(
                <div key='fsc' ><h4> </h4></div>
            );
        }


        return (
            <div key='ClssCMissionsContainer' className="width_100">{v_ctrl}</div>
        );
    }
};

