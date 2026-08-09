import React from 'react';
import * as js_andruavMessages from '../../../js/protocol/messages/js_andruavMessages';
import * as js_common from '../../../js/js_common.js';
import { js_mapmission_planmanager } from '../../../js/js_mapmissionPlanManager.js';
import {EVENTS as js_event} from '../../../js/js_eventList.js'
import { js_eventEmitter } from '../../../js/js_eventEmitter.js';
import { js_leafletmap } from '../../../js/js_leafletmap.js';
import { ClssSinglePlanContainer } from './jsc_ctrl_single_plan_container.jsx';
import { setSelectedMissionFilePathToRead } from '../../../js/js_main.js';
import ClssFence_Shape_Control from '../fence/jsc_fence_shape_control.jsx';

const CONST_FENCE_TAB_ID = 'fences';

export default class ClssMission_Container extends React.Component {
    constructor() {
        super();
        this.state = {
            m_update: 0,
            p_plans: [],
            p_fences: [],
            is_connected: false
        };

        // active tab is either a mission plan id, or CONST_FENCE_TAB_ID for the shared fence editor
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

        // Missions and fences now live in one combined list: enable all draw
        // tools together instead of gating them behind separate tabs.
        js_leafletmap.fn_enableDrawMarker(true);
        js_leafletmap.fn_enableDrawLine(true);
        js_leafletmap.fn_enableDrawCircle(true);
        js_leafletmap.fn_enableDrawPolygon(true);
        js_leafletmap.fn_enableDrawRectangle(true);

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

        if (p_shape.pm.m_shape_type !== 'Marker') {
            // A fence shape was drawn: add it to the combined list and select it.
            me.setState({ p_fences: [...me.state.p_fences, p_shape] });
            me.m_active_id = CONST_FENCE_TAB_ID;
            return;
        }

        let v_mission = js_mapmission_planmanager.fn_getCurrentMission();
        v_mission.fn_addMarker(p_shape);
    }

    fn_onFenceTabClick(p_shape) {
        this.m_active_id = CONST_FENCE_TAB_ID;
        js_eventEmitter.fn_dispatch(js_event.EE_onShapeSelected, p_shape);
        if (this.m_flag_mounted === false) return;
        this.setState({ m_update: this.state.m_update + 1 });
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
        // A fence shape was selected directly on the map (not via the sidebar
        // tab list): switch the active tab to Fences so its editor becomes visible.
        if (p_event == null || p_event.pm == null) return;
        if (p_event.pm.m_shape_type === 'Marker') return;

        me.m_active_id = CONST_FENCE_TAB_ID;
        if (me.m_flag_mounted === false) return;
        me.setState({ m_update: me.state.m_update + 1 });
    }

    fn_onShapeEdited(me, p_shape) {
        if (p_shape.m_main_de_mission == null) return; // geo fence not mission
        p_shape.m_main_de_mission.fn_updatePath(true);
    }

    fn_onShapeDeleted(me, p_shape) {
        if (p_shape === null || p_shape === undefined ) return ;
        if (p_shape.m_main_de_mission == null) {
            // a fence shape was removed: drop it from the combined list.
            me.setState({ p_fences: me.state.p_fences.filter(x => x !== p_shape) });
            return;
        }
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
                            <span className={c_active ? 'animate_iteration_3s blink_warning' : 'txt-theme-aware'}>
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

        // Single shared tab for all fence shapes (fences don't need their own
        // container per-shape; the fence editor already reacts to selection).
        {
            const c_fenceActive = this.m_active_id === CONST_FENCE_TAB_ID;
            const c_fenceCount = this.state.p_fences.length;

            item_header.push(
                <li key="mstpt_fences" className="nav-item">
                    <a
                        className={`nav-link ${c_fenceActive ? 'active' : ''}`}
                        data-bs-toggle="tab"
                        data-bs-target="#mstpd_fences"
                        href="#mstpd_fences"
                        onClick={() => this.fn_onFenceTabClick(this.state.p_fences[0])}
                    >
                        <i className="bi bi-hexagon location-icon"></i>
                        <span className={c_fenceActive ? 'animate_iteration_3s blink_warning' : 'txt-theme-aware'}>
                            {`Fences (${c_fenceCount})`}
                        </span>
                    </a>
                </li>
            );

            item_details.push(
                <div
                    key="mstpd_fences"
                    id="mstpd_fences"
                    className={`tab-pane fade ${c_fenceActive ? 'show active' : ''}`}
                >
                    {c_fenceCount === 0 ? (
                        <p className="txt-theme-aware">Draw a shape on the map to add a fence.</p>
                    ) : (
                        <ul className="nav nav-pills css_margin_top_small">
                            {this.state.p_fences.map((v_fence, idx) => (
                                <li key={'fence' + idx} className="nav-item">
                                    <a
                                        className="nav-link"
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); this.fn_onFenceTabClick(v_fence); }}
                                    >
                                        {(v_fence.m_geofenceInfo && v_fence.m_geofenceInfo.m_geoFenceName) || `${v_fence.pm.m_shape_type} ${idx + 1}`}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                    <ClssFence_Shape_Control />
                </div>
            );
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

        // Fences are edited locally on the map and don't require a connected
        // unit, so their tab/content must render regardless of is_connected.
        // Only mission-specific controls (file upload, add-mission button)
        // stay gated behind a live connection.
        let v_ctrl = [];

        v_ctrl.push(
            <div key="fsc" className="width_100">
                {this.state.is_connected && (
                    <React.Fragment>
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
                                <p>Add New Mission Plan (draw a shape on the map to add a Fence)</p>
                            </div>
                            <div className="col-1">
                                <button className="btn-primary btn-sm float-left" title="Add New Mission Plan" onClick={(e) => this.fn_addNewPathPlan(e)}>
                                    +
                                </button>
                            </div>
                        </div>
                    </React.Fragment>
                )}
                <div className="row margin_zero width_100">
                    {item}
                </div>
            </div>
        );

        return (
            <div key="ClssCMissionsContainer" className="width_100">
                {v_ctrl}
            </div>
        );
    }
};

