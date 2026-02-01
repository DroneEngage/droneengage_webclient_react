import React from 'react';
import * as js_andruavMessages from '../../../js/protocol/js_andruavMessages';
import * as js_common from '../../../js/js_common.js';
import { js_mapmission_planmanager } from '../../../js/js_mapmissionPlanManager.js';
import {EVENTS as js_event} from '../../../js/js_eventList.js'
import { js_eventEmitter } from '../../../js/js_eventEmitter.js';
import { js_leafletmap } from '../../../js/js_leafletmap.js';
import { ClssSinglePlanContainer } from './jsc_ctrl_single_plan_container.jsx';
import { setSelectedMissionFilePathToRead } from '../../../js/js_main.js';

export default class ClssMission_Container extends React.Component {
    constructor() {
        super();
        this.state = {
            m_update: 0,
            p_plans: [],
            is_connected: false
        };

        this.m_active_id = 0;
        
        this.mission_file_ref = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_onSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_event.EE_onPlanToggle, this, this.fn_onPlanToggle);
        js_eventEmitter.fn_subscribe(js_event.EE_onShapeCreated, this, this.fn_onShapeCreated);
        js_eventEmitter.fn_subscribe(js_event.EE_onShapeSelected, this, this.fn_onShapeSelected);
        js_eventEmitter.fn_subscribe(js_event.EE_onShapeEdited, this, this.fn_onShapeEdited);
        js_eventEmitter.fn_subscribe(js_event.EE_onShapeDeleted, this, this.fn_onShapeDeleted);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        this.setState({ m_update: 1 });
    }

    fn_handleFileChange(e) {
        setSelectedMissionFilePathToRead(this.mission_file_ref.current.files);
    }

    fn_onSocketStatus(me, p_params) {
        if (p_params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
            me.setState({ is_connected: true });
        } else {
            me.setState({ is_connected: false });
        }
    }

    fn_onPlanToggle(me, p_params) {
        
        const c_mission = p_params.p_mission;

        if (p_params.p_switch_next) {
            // switch to next mission
            js_mapmission_planmanager.fn_activateNextMission(c_mission.m_id);
            me.m_active_id = c_mission.m_id;
        } else {
            // make this the current mission
            js_mapmission_planmanager.fn_setCurrentMission(c_mission.m_id);
            me.m_active_id = c_mission.m_id;
        }

        if (me.m_flag_mounted === false)return;
        me.setState({ m_update: me.state.m_update + 1 });
    }

    fn_onShapeCreated(me, p_shape) {
        js_common.fn_console_log("fn_onShapeCreated: " + p_shape);

        if (p_shape.pm.m_shape_type !== 'Marker') return;

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
        // Handle shape selection
    }

    fn_onShapeEdited(me, p_shape) {
        if (p_shape.m_main_de_mission == null) return; // geo fence not mission
        p_shape.m_main_de_mission.fn_updatePath(true);
    }

    fn_onShapeDeleted(me, p_shape) {
        if (p_shape === null || p_shape === undefined ) return ;
        if (p_shape.m_main_de_mission == null) return; // geo fence not mission
        p_shape.m_main_de_mission.fn_deleteMe(p_shape.id);
    }

    fn_addNewPathPlan(e) {
        let v_missionPlan = js_mapmission_planmanager.fn_createNewMission();
        js_mapmission_planmanager.fn_setCurrentMission(v_missionPlan.m_id);
        js_leafletmap.fn_enableDrawMarker(true);
        this.setState({ p_plans: [...this.state.p_plans, v_missionPlan] });
    }




    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_onSocketStatus, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onPlanToggle, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onShapeCreated, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onShapeSelected, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onShapeEdited, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onShapeDeleted, this);

    }

    // Add this method to handle the tab switch event
    handleTabSwitch = (planId) => {
            //this.m_active_id = planId;
            this.setState({}); //force re-render
            console.log(`Tab switched to plan ID: ${planId}`);
            // Perform any other actions you need here
    };
        
    render() {

        let item = [];
        let item_header = [];
        let item_details = [];

        let v_mission1 = js_mapmission_planmanager.fn_getCurrentMission();

        if (this.state.is_connected && this.state.p_plans && this.state.p_plans.length > 0) {
            this.state.p_plans.forEach((v_plan) => {
                
                const c_id = v_plan.m_id;
                const c_active = c_id === this.m_active_id;
                const targetTabId = "#mstpd_" + c_id; // Add this line to create the target tab ID
    
                item_header.push(
                    <li key={"mstpt" + c_id} className="nav-item">
                        <a
                            className={`nav-link ${c_active ? 'active' : ''}`}
                            data-bs-toggle="tab"
                            data-bs-target={targetTabId} // Add this line
                            href={targetTabId}
                            onClick={() => this.handleTabSwitch(c_id)} // Add this line
                        >
                            <i className="bi bi-geo-alt-fill location-icon" style={{ color: v_plan.m_pathColor }}></i>
                            <span className={c_active ? 'animate_iteration_3s blink_warning' : 'text-light'}>
                                {`P${v_plan.m_id}-(${(v_plan.fn_getMissionDistance() / 1000.0).toFixed(1)} km)`}
                            </span>
                        </a>
                    </li>
                );
    
                item_details.push(
                    <div
                        key={"mstpd" + c_id}
                        id={"mstpd_" + c_id}
                        className={`tab-pane fade ${c_active ? 'show active' : ''}`}
                    >
                        <ClssSinglePlanContainer
                            key={'umc' + v_plan.m_id}
                            p_missionPlan={v_plan}
                            p_isCurrent={v_plan.m_id === v_mission1.m_id}
                        />
                    </div>
                );
            });
        }

        item.push(
            <ul key="unit_header_div" className="nav nav-tabs">
                {item_header}
            </ul>
        );

        item.push(
            <div key="unit_details_div" className="tab-content">
                {item_details}
            </div>
        );

        let v_ctrl = [];

        if (this.state.is_connected) {
            v_ctrl.push(
                <div key="fsc" className="width_100">
                    <div className="row width_100 margin_zero css_margin_top_small">
                        <div className="col-12">
                            <div className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="btn_filesWP" className="user-select-none txt-theme-aware mt-2">
                                        <small>Global Mission File</small>
                                    </label>
                                    <input
                                        type="file"
                                        id="btn_filesWP"
                                        name="file"
                                        className="form-control input-xs input-sm css_margin_left_5 line-height-normal"
                                        ref={this.mission_file_ref}
                                        onChange={(e) => this.fn_handleFileChange(e)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row margin_zero">
                        <div className="col-11 text-warning">
                            <p>Add New Mission</p>
                        </div>
                        <div className="col-1">
                            <button className="btn-primary btn-sm float-left" title="Add New Mission Plan" onClick={(e) => this.fn_addNewPathPlan(e)}>
                                +
                            </button>
                        </div>
                    </div>
                    <div className="row margin_zero width_100">
                        {item}
                    </div>
                </div>
            );
        } else {
            v_ctrl.push(
                <div key="fsc">
                    <h4> </h4>
                </div>
            );
        }

        return (
            <div key="ClssCMissionsContainer" className="width_100">
                {v_ctrl}
            </div>
        );
    }
};

