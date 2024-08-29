import $ from 'jquery';

import React from 'react';

import * as js_andruavMessages from '../../../js/js_andruavMessages.js'
import * as js_common from '../../../js/js_common.js'

import {
    fn_requestWayPoints,
    fn_clearWayPoints, fn_putWayPoints
} from '../../../js/js_main.js'

import { js_mapmission_planmanager } from '../../../js/js_mapmissionPlanManager.js'
import { js_globals } from '../../../js/js_globals.js';
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'
import { js_leafletmap } from '../../../js/js_leafletmap.js'

import { ClssMission_Control_Bar } from './jsc_ctrl_mission_control_bar.jsx'

import { ClssAndruavUnit_DropDown_List } from '../../gadgets/jsc_ctrl_unit_drop_down_list.jsx'
import { ClssMissionStep } from './jsc_ctrl_mission_step.jsx'

class MissionControlPanel extends React.Component {


    constructor() {
        super();
        this.state = {
            m_deleted: false,
            m_partyID: 0
        };

        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_globals.EE_mapMissionUpdate, this, this.fn_missionUpdated);
    }


    fn_onSocketStatus(me, params) {

        if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
            me.setState({ is_connected: true });
        }
        else {
            me.setState({ is_connected: false });
        }
    }


    fn_missionUpdated(me) {
        me.forceUpdate();
    }

    fn_deleteMission() {
        if (this.props.p_mission == null) return;
        js_mapmission_planmanager.fn_deleteMission(this.props.p_mission.m_id);
        this.setState({ m_deleted: true });
    }


    fn_changeColor() {
        if (this.props.p_ParentCtrl.props.p_missionPlan != null) {
            const c_path_color = $('#cp_' + this.props.p_mission.m_id).val();
            this.props.p_mission.fn_drawStyle(c_path_color);
            this.props.p_mission.fn_updatePath(true);
        }
        $('#pc_' + this.props.p_mission.m_id).css("background-color", $('#cp_' + this.props.p_mission.m_id).val());
    }

    /**
     * Close Mission Panel Control
     * @param {*} e 
     */
    fn_collabseMe(e) {
        if ((this.props.p_ParentCtrl.props.p_missionPlan.m_hidden === true) && (this.props.p_ParentCtrl.props.p_isCurrent === false)) {
            // display path if group is going to be activated and was hidden.
            this.fn_togglePath(e);
        }

        js_eventEmitter.fn_dispatch(js_globals.EE_onMissionItemToggle, { p_isCurrent: this.props.p_ParentCtrl.props.p_isCurrent, p_mission: this.props.p_ParentCtrl.props.p_missionPlan });
    }


    /**
     * hide or display pathes on Google Map.
     * @param {*} e 
     */
    fn_togglePath(e) {
        js_common.fn_console_log(e);
        this.props.p_ParentCtrl.props.p_missionPlan.fn_togglePath();
        if (this.props.p_ParentCtrl.props.p_missionPlan.m_hidden === true) {
            $('#ph_' + this.props.p_mission.m_id).addClass('text-muted');
            $('#ph_' + this.props.p_mission.m_id).removeClass('text-success');
            $('#ph_' + this.props.p_mission.m_id).addClass('border-muted');
            $('#ph_' + this.props.p_mission.m_id).removeClass('border-success');
        }
        else {
            $('#ph_' + this.props.p_mission.m_id).addClass('text-success');
            $('#ph_' + this.props.p_mission.m_id).removeClass('text-muted');
            $('#ph_' + this.props.p_mission.m_id).addClass('border-success');
            $('#ph_' + this.props.p_mission.m_id).removeClass('border-muted');
        }
    }

    /**
     * simulate click on color button
     * @param {*} e 
     */
    fn_simClick(e) {
        $('#cp_' + this.props.p_mission.m_id).click();
    }

    fn_onSelectUnit(e) {
        this.setState({ 'm_partyID': e.target.value });

    }


    fn_requestWayPoints(fromFCB) {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.m_partyID);
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;
        js_globals.v_andruavClient.API_requestWayPoints(v_andruavUnit, fromFCB);
    }

    componentWillUnmount() {
        js_eventEmitter.unsubscribe(js_globals.EE_mapMissionUpdate, this);
    }

    componentDidMount() {
        $('#pc_' + this.props.p_mission.m_id).css("background-color", this.props.p_mission.m_pathColor);
    }


    componentDidUpdate() {
        if ((this.props.p_ParentCtrl.props.p_missionPlan.m_hidden === true) && (this.props.p_ParentCtrl.props.p_isCurrent === true)) {
            // display path if group is ACVTIE NOW and was hidden.
            this.fn_togglePath();
        }
    }

    render() {

        if (this.state.m_deleted === true) return (<div className=" margin_zero " />);

        if (this.props.p_mission === null || this.props.p_mission === undefined) {
            return (<div className=" margin_zero " />);
        }

        let v_item2 = [];
        let v_partyIDCtrl = [];





        if (this.props.p_isCurrent === true) {
            const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.m_partyID);


            v_item2.push(


                <div id="geofence" key={'mp1' + this.props.p_mission.m_id + this.key} className="btn-group  css_margin_top_small" >
                    <ClssMission_Control_Bar p_mission={this.props.p_mission} m_selected_unit={this.state.m_partyID} />
                </div>

            );


            if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
                v_partyIDCtrl.push(
                    <div id="geofence" key={'mp2' + this.props.p_mission.m_id} className="row margin_zero css_margin_top_small">
                        <div className="col-12">
                            <ClssAndruavUnit_DropDown_List m_partyID={this.state.m_partyID} onSelectUnit={(e) => this.fn_onSelectUnit(e)} />
                        </div>

                    </div>
                );
            }

            if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === true) {
                // overwrite with this if public version 
                v_partyIDCtrl = [];

            }

        }

        let v_class = (this.props.p_isCurrent === true) ? "w-100 text-warning border border-warning rounded text-center cursor_hand padding_zero" : "w-100  text-light border  border-secondry rounded text-center cursor_hand padding_zero"
        return (
            <div key={"plan" + this.props.p_mission.m_id} id="m_hdr" className="col  col-sm-12 margin_zero" >
                <div className="form-inline  margin_zero padding_zero">
                    <div className="card-header text-center d-flex">
                        <label onClick={(e) => this.fn_collabseMe(e)} className={v_class}><strong>{'Mission #' + this.props.p_mission.m_id + ' Panel (' + (this.props.p_mission.fn_getMissionDistance() / 1000.0).toFixed(1) + ' km)'}</strong></label>
                        <input type='color' className="border hidden" id={'cp_' + this.props.p_mission.m_id} onChange={(e) => this.fn_changeColor()} />
                        <p id={'pc_' + this.props.p_mission.m_id} onClick={(e) => this.fn_simClick(e)} className="btn  btn-sm css_margin_left_5 text-light border border-primary rounded text-center cursor_hand" title="Change Plan color path"  >C</p>
                        <p id={'ph_' + this.props.p_mission.m_id} onClick={(e) => this.fn_togglePath(e)} className="btn  btn-sm  text-success border border-success rounded text-center cursor_hand" title="Hide/Display plan on Map"  >H</p>
                    </div>
                </div>

                {v_item2}

                {v_partyIDCtrl}
                <hr />
            </div>
        );
    }
}



/**
 * Contains a Single Mission All Cootrols
 */
class UnitMissionContainer extends React.Component {

    constructor() {
        super();
        this.state = {
        };

        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeSelected, this, this.displayGeoForm);
        js_eventEmitter.fn_subscribe(js_globals.EE_onMissionItemToggle, this, this.fn_onMissionItemToggle);
    }


    displayGeoForm(me, p_event) {
        // not a marker
        if (p_event.target.m_mission === null || p_event.target.m_mission === undefined) {
            js_common.fn_console_log("MISSION:NULL HERE");
            return;
        }

        if (me.props.p_missionPlan.m_id !== p_event.target.m_mission.m_id) {
            js_common.fn_console_log("Not Me");
            return;
        }

        if (me.props.p_isCurrent === false) {
            js_eventEmitter.fn_dispatch(js_globals.EE_onMissionItemToggle, { p_isCurrent: me.props.p_isCurrent, p_mission: me.props.p_missionPlan });
        }

        me.setState({ s_shape: p_event.target });


        js_common.fn_console_log("REACT:displayGeoForm");

        me.forceUpdate();

    }


    fn_onMissionItemToggle(me, p_params) {
        js_common.fn_console_log(p_params);


        me.forceUpdate();
    }




    componentWillUnmount() {
        js_eventEmitter.unsubscribe(js_globals.EE_onShapeSelected, this);
        js_eventEmitter.unsubscribe(js_globals.EE_onMissionItemToggle, this);
    }

    render() {

        var c_borderStyle;

        if (this.props.p_isCurrent === true) {
            c_borderStyle = 'css_missionMapSelected';
        }


        let item = [];

        if (this.props.p_missionPlan == null) {
            item.push(<h4 key="mi"></h4>);
        }
        else {
            if (this.state.shape != null) {
                this.state.shape.setLabel({
                    text: this.state.shape.order.toString(), // string
                    color: "#977777",
                    fontSize: "12px",
                    fontWeight: "bold"
                });
            }
            item.push(<div key={"mstp" + this.props.p_missionPlan.m_id} id="missionstep" className={"container-fluid localcontainer " + c_borderStyle}>
                <MissionControlPanel p_mission={this.props.p_missionPlan} p_ParentCtrl={this} p_isCurrent={this.props.p_isCurrent} />
                <ClssMissionStep p_shape={this.state.s_shape} p_isCurrent={this.props.p_isCurrent} />
            </div>);
        }

        return (
            <div key='fsc' className="margin_zero width_100">

                <div className="row margin_zero">
                    {item}
                </div>
            </div>
        );
    }
};



/**
 * Main Class for Mission 
 * You can add mission controls
 */
export default class ClssMission_Container extends React.Component {

    constructor() {
        super();
        this.state = {
            p_plans: [],
        };

        js_eventEmitter.fn_subscribe(js_globals.EE_onSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_globals.EE_onMissionItemToggle, this, this.fn_onMissionItemToggle);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeCreated, this, this.fn_onShapeCreated);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeSelected, this, this.fn_onShapeSelected);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeEdited, this, this.fn_onShapeEdited);
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeDeleted, this, this.fn_onShapeDeleted);

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

        if (p_params.p_isCurrent === true) {
            // switch to next
            js_mapmission_planmanager.fn_activateNextMission(p_params.p_mission.m_id);
        }
        else {
            // make this the current
            js_mapmission_planmanager.fn_setCurrentMission(p_params.p_mission.m_id);
        }
        me.forceUpdate();
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
        if (p_shape.m_mission == null) return; // geo fence not mission
        p_shape.m_mission.fn_updatePath(true);
    }

    fn_onShapeDeleted(me, p_shape) {
        if (p_shape.m_mission == null) return; // geo fence not mission
        p_shape.m_mission.fn_deleteMe(p_shape);
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
                    <UnitMissionContainer key={'umc' + v_plan.m_id} p_missionPlan={v_plan} p_isCurrent={v_plan.m_id === v_mission1.m_id} />
                );
            });


        }

        let v_ctrl = [];

        if (this.state.is_connected === true) {
            v_ctrl.push(
                <div key='fsc' className="width_100">
                    <div className="row margin_zero">
                        <div className="col-11 text-warning">
                            <label>Add New Mission </label>
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

