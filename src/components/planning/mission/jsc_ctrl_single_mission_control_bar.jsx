import React    from 'react';

import * as js_helpers from '../../../js/js_helpers.js'
import {js_globals} from '../../../js/js_globals.js';
import {EVENTS as js_event} from '../../../js/js_eventList.js'
import {js_andruavAuth} from '../../../js/protocol/auth/js_andruav_auth.js'
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'
import { js_mapmission_planmanager } from '../../../js/js_mapmissionPlanManager.js'

import {
    fn_requestWayPoints,
    fn_clearWayPoints, 
    fn_do_modal_confirmation,
    fn_do_modal_alert,
    fn_readMissionFile,
    fn_do_modal_apply_all,
    fn_do_modal_mission_load
    } from '../../../js/js_main.js'






/**
 * Control bar component for single mission operations.
 * Provides buttons for mission management: export, reset, upload, read, clear, load, and apply settings.
 */
export class ClssSingleMissionControlBar extends React.Component {
    constructor(props)
	{
		super (props);
        this.state = {
            m_update: 0,
        };

        this.m_flag_mounted = false;
        
        this.key = Math.random().toString();
        
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
        this.m_missionLoadedCallback = (p_listener, p_payload) => {
            this.fn_onMissionLoaded(p_payload);
        };
        js_eventEmitter.fn_subscribe(js_event.EE_Mission_Loaded, this, this.m_missionLoadedCallback);
    }

    componentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_Mission_Loaded, this);
    }

    /**
     * Handle mission loaded from cloud storage.
     * If a list of missions is returned, shows a selection dialog.
     * If a single mission is returned, imports it directly.
     * Imports the selected mission data into the current mission plan and displays it on the map.
     */
    fn_onMissionLoaded(p_payload) {
        if (p_payload == null || p_payload.mission == null) return;
        if (this.props.p_mission == null) return;

        const Me = this;

        if (Array.isArray(p_payload.mission)) {
            if (p_payload.mission.length === 0) {
                fn_do_modal_mission_load([], null);
                return;
            }
            fn_do_modal_mission_load(p_payload.mission, function (p_selectedMission) {
                Me.fn_importMissionData(p_selectedMission.data);
            });
            return;
        }

        if (p_payload.mission.data != null) {
            this.fn_importMissionData(p_payload.mission.data);
        }
    }

    /**
     * Import mission data into the current mission plan and display on map.
     */
    fn_importMissionData(missionData) {
        if (missionData == null) return;
        if (this.props.p_mission == null) return;

        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);

        this.props.p_mission.fn_deleteAll();
        this.props.p_mission.fn_importAsDE_V1(v_andruavUnit, missionData);
        this.props.p_mission.fn_updatePath(true);
        js_eventEmitter.fn_dispatch(js_event.EE_mapMissionUpdate, { mission: this.props.p_mission });
    }


    /**
     * Export the current mission to a file in DroneEngage V1 format.
     * The file is saved with a timestamped filename.
     */
    fn_exportMission ()
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        const c_mission_text = this.props.p_mission.fn_exportToDE_V1 (v_andruavUnit);
        js_helpers.fn_saveAs (c_mission_text,"Mission" + Date.now() + js_globals.v_mission_file_extension,"text/plain;charset=utf-8");
    }

    /**
     * Upload the current mission to the selected unit.
     * @param {boolean} p_eraseFirst - If true, erase existing waypoints before uploading.
     * Shows a confirmation dialog before proceeding.
     */
    fn_putWayPoints(p_eraseFirst)
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        if (v_andruavUnit===null) {
            fn_do_modal_alert("Upload Mission", "Please select a drone unit first.");
            return ;
        }

        const c_mission_text = this.props.p_mission.fn_exportToDE_V1 (v_andruavUnit);
        
        fn_do_modal_confirmation("Upload Mission for " + v_andruavUnit.m_unitName,
            "Are you sure you want to upload mission?", function (p_approved) {
                if (p_approved === false) return;
                
                js_globals.v_andruavFacade.API_uploadDEMission(v_andruavUnit, p_eraseFirst, JSON.parse(c_mission_text));

            }, "YES", "bg-danger txt-theme-aware");
        
    }

    /**
     * Load mission waypoints from a file into the current mission editor.
     */
    fn_loadWayPointsFromFile()
    {
        fn_readMissionFile(this.props.p_mission, this.props.m_selected_unit);
    }

    /**
     * Request the current mission waypoints from the selected unit's flight controller.
     * @param {boolean} p_fromFCB - Flag indicating request is from flight controller board.
     */
    fn_requestWayPoints(p_fromFCB)
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        if (v_andruavUnit===null) return ;
        fn_requestWayPoints(v_andruavUnit, p_fromFCB);
    }

    /**
     * Clear/delete all waypoints from the selected unit.
     */
    fn_clearWayPoints()
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        if (v_andruavUnit===null) return ;
        fn_clearWayPoints(v_andruavUnit);
    }

    /**
     * Save the current mission to the database as a task.
     * (Only available when experimental features are disabled)
     */
    fn_saveDBMission ()
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        const c_mission_text = this.props.p_mission.fn_exportToDE_V1 ();
        this.props.p_mission.fn_exportToJSONAndruav (c_mission_text, v_andruavUnit);
    }

    /**
     * Delete any related mission tasks from the system for the selected unit.
     * (Only available when experimental features are disabled)
     */
    fn_deleteDBMission()
    {
        js_globals.v_andruavFacade.API_disableWayPointTasks(js_andruavAuth.m_username,js_globals.v_andruavWS.m_groupName,this.props.m_selected_unit);
    }

    /**
     * Reset/remove the mission from the map.
     * Deletes the mission from the plan manager and dispatches a reset event.
     */
    fn_deleteMission() {
        if (this.props.p_mission == null) return;
        js_mapmission_planmanager.fn_deleteMission(this.props.p_mission.m_id);
        this.setState({ m_deleted: true });
        js_eventEmitter.fn_dispatch(js_event.EE_onMissionReset);
    }

    /**
     * Open a modal dialog to apply settings (altitude, speed, etc.) to all mission items.
     */
    fn_applyToAll() {
        if (this.props.p_mission == null) return;
        fn_do_modal_apply_all(this.props.p_mission);
    }

    /**
     * Save the current mission to cloud storage.
     * If a drone is selected, uses the drone name. Otherwise prompts for a name.
     */
    fn_saveMissionToCloud() {
        if (this.props.p_mission == null) return;

        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        const c_mission_text = this.props.p_mission.fn_exportToDE_V1(v_andruavUnit);

        if (v_andruavUnit !== null) {
            fn_do_modal_confirmation("Save Mission to Cloud",
                "Save mission for " + v_andruavUnit.m_unitName + " to cloud storage?", function (p_approved) {
                    if (p_approved === false) return;

                    const missionId = v_andruavUnit.getPartyID() + '_' + Date.now();
                    const missionName = v_andruavUnit.m_unitName + ' Mission ' + new Date().toISOString().slice(0, 10);
                    const missionData = JSON.parse(c_mission_text);

                    js_globals.v_andruavFacade.API_saveMission(v_andruavUnit.getPartyID(), missionId, missionName, missionData);
                }, "YES", "bg-info txt-theme-aware");
        } else {
            const missionName = window.prompt("Enter mission name:", "Mission " + new Date().toISOString().slice(0, 10));
            if (missionName === null || missionName === "") return;

            const missionId = '_general_' + '_' + Date.now();
            const missionData = JSON.parse(c_mission_text);

            js_globals.v_andruavFacade.API_saveMission('_general_', missionId, missionName, missionData);
        }
    }

    /**
     * Load a mission from cloud storage.
     * Shows a confirmation dialog before proceeding.
     * If a drone is selected, loads missions for that drone. Otherwise loads general missions.
     * The most recent mission will be imported and displayed on the map.
     */
    fn_loadMissionFromCloud() {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        const unitId = (v_andruavUnit !== null) ? v_andruavUnit.getPartyID() : '_general_';

        fn_do_modal_confirmation("Load Mission from Cloud",
            "Are you sure you want to load mission from cloud storage? Current mission will be replaced.", function (p_approved) {
                if (p_approved === false) return;

                js_globals.v_andruavFacade.API_loadMission(unitId);
            }, "YES", "bg-info txt-theme-aware");
    }

    /**
     * List missions from cloud storage without loading.
     * Fetches all saved missions for the selected drone (or general) and shows
     * a selection dialog. The user can then pick one to load.
     */
    fn_listMissionsFromCloud() {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.m_selected_unit);
        const unitId = (v_andruavUnit !== null) ? v_andruavUnit.getPartyID() : '_general_';

        js_globals.v_andruavFacade.API_loadMission(unitId);
    }

    render ()
    {
        const c_key = this.key;

        let v_saveAsTask = [];
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED===false)
        {
                v_saveAsTask.push (<button  key={'mp1bst1' + this.props.p_mission.m_id  + this.key}  id="geo_btn_geosave_db"  className="btn btn-danger btn-sm ctrlbtn" title ="Save into System" type="button" onClick={ (e) => this.fn_saveDBMission(e) } >Save</button>);
                v_saveAsTask.push (<button  key={'mp1bst2' + this.props.p_mission.m_id  + this.key} id="geo_btn_geodelete_db_me"  className="btn btn-danger btn-sm ctrlbtn" title ="Delete Any Related Mission from System for this Unit" type="button" onClick={ (e) => this.fn_deleteDBMission(e) } >Delete</button>);
        }
        
            
        return (
            <div id="geofence" key={'m_c_b' + c_key} className="d-flex flex-wrap gap-1 css_margin_top_small" >
                <button  id='pre_geo_btn_generate' key={'mp1b1' + c_key} className='btn btn-primary btn-sm ctrlbtn'   title ="Export Mission as File" type="button "  onClick={ (e) => this.fn_exportMission() } >Export</button>
                <button  id='geo_btn_georeset'  key={'mp1b2' + c_key} className="btn btn-warning btn-sm ctrlbtn" title ="Reset Mission on Map" type="button" onClick={ (e) => this.fn_deleteMission() } >Reset</button>
                <button  id='geo_btn_geoupload'  key={'mp1b3' + c_key} className="btn btn-danger btn-sm ctrlbtn" title ="Save Mission on Unit" type="button" onClick={ (e) => this.fn_putWayPoints(true)}  >Upload</button>
                <button  id='geo_btn_georead'  key={'mp1b4' + c_key} className="btn btn-warning btn-sm ctrlbtn" title ="Read Mission from Unit" type="button" onClick={ (e) => this.fn_requestWayPoints(true)} >Read</button>
                <button  id='geo_btn_geoclear'  key={'mp1b5' + c_key} className="btn btn-danger btn-sm ctrlbtn" title ="Delete Mission from Unit" type="button" onClick={ (e) => this.fn_clearWayPoints() } >Clear</button>
                <button  id='geo_btn_geoload'  key={'mp1b6' + c_key} className="btn btn-danger btn-sm ctrlbtn" title ="Delete Mission from Unit" type="button" onClick={ (e) => this.fn_loadWayPointsFromFile() } >Load</button>
                <button  id='geo_btn_applyall'  key={'mp1b7' + c_key} className="btn btn-success btn-sm ctrlbtn" title ="Apply settings to all mission items" type="button" onClick={ (e) => this.fn_applyToAll() } >Apply All</button>
                <button  id='geo_btn_cloud_save'  key={'mp1b8' + c_key} className="btn btn-info btn-sm ctrlbtn" title ="Save Mission to Cloud Storage" type="button" onClick={ (e) => this.fn_saveMissionToCloud() } >Cloud Save</button>
                <button  id='geo_btn_cloud_list'  key={'mp1b9' + c_key} className="btn btn-info btn-sm ctrlbtn" title ="List Missions from Cloud Storage" type="button" onClick={ (e) => this.fn_listMissionsFromCloud() } >List Cloud</button>
                <button  id='geo_btn_cloud_load'  key={'mp1b10' + c_key} className="btn btn-info btn-sm ctrlbtn" title ="Load Mission from Cloud Storage" type="button" onClick={ (e) => this.fn_loadMissionFromCloud() } >Cloud Load</button>
                {v_saveAsTask}
            </div>
        );
    }
}