import $ from 'jquery';

import React from 'react';

import * as js_andruavMessages from '../../../js/js_andruavMessages.js'
import * as js_common from '../../../js/js_common.js'


import { js_globals } from '../../../js/js_globals.js';
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'

import { ClssSingle_Mission_Control_Bar } from './jsc_ctrl_single_mission_control_bar.jsx'
import { ClssAndruavUnit_DropDown_List } from '../../gadgets/jsc_ctrl_unit_drop_down_list.jsx'



/**
 * props:
 * p_ParentCtrl
 * p_mission
 * p_missionPlan
 * 
 * onClick
 * onSelectUnit
 * 
 */
export class ClssSingle_Mission_Header extends React.Component {


    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_deleted: false,
            m_partyID: 0,
            is_connected: false,
            //is_collapsed: false,
            css_pc: "btn  btn-sm css_margin_left_5 text-light border border-primary rounded text-center cursor_hand",
            css_ph: "btn  btn-sm  text-success border border-success rounded text-center cursor_hand"
        };

        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_globals.EE_mapMissionUpdate, this, this.fn_missionUpdated);
    }


    componentDidMount () {
        this.state.m_update = 1;
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
        if (me.state.m_update === 0) return ;
        me.setState({'m_update': me.state.m_update +1});
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
    fn_onClick(e) {
        if (this.props.onHeaderClick === null || this.props.onClick === undefined) return ;

        // if (this.state.is_collapsed === true)
        // {
        //     this.setState({is_collapsed: false});
        // }
        // else
        // {
        //     this.setState({is_collapsed: true});
        // }
        this.props.onClick(e);
    }


    /**
     * hide or display pathes on Google Map.
     * @param {*} e 
     */
    fn_togglePath(e) {
        js_common.fn_console_log(e);
        this.props.p_ParentCtrl.props.p_missionPlan.fn_togglePath();
        if (this.props.p_ParentCtrl.props.p_missionPlan.m_hidden === true) {
            this.setState({css_ph:"btn  btn-sm  text-success border border-success rounded text-center cursor_hand"});
        }
        else {
            this.setState({css_ph:"btn  btn-sm  text-muted border border-muted rounded text-center cursor_hand"});
        }
    }

    /**
     * simulate click on color button
     * @param {*} e 
     */
    fn_simClick(e) {
        $('#cp_' + this.props.p_mission.m_id).trigger( "click" ); 
    }

    fn_onSelectUnit(partyID) {
        this.setState({ 'm_partyID': partyID });
        if (this.props.onSelectUnit !== null && this.props.onSelectUnit !== undefined)
        {
            this.props.onSelectUnit(partyID);
        }
    }


    fn_requestWayPoints(fromFCB) {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.m_partyID);
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;
        js_globals.v_andruavClient.API_requestWayPoints(v_andruavUnit, fromFCB);
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_mapMissionUpdate, this);
    }

    componentDidMount() {
        $('#pc_' + this.props.p_mission.m_id).css("background-color", this.props.p_mission.m_pathColor);
    }


    componentDidUpdate() {
        // if ((this.props.p_mission.m_hidden === true) && (this.props.p_isCurrent === true)) {
        //     // display path if group is ACVTIE NOW and was hidden.
        //     //this.fn_togglePath();
        // }
    }

    render() {

        if (this.state.m_deleted === true) return (<div className=" margin_zero " />);

        if (this.props.p_mission === null || this.props.p_mission === undefined) {
            return (<div className=" margin_zero " />);
        }

        let v_item = [];
        let v_partyIDCtrl = [];





        if (this.props.p_isCurrent === true && this.props.p_isCollapsed === false) {
           // const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.m_partyID);


            v_item.push(


                <div id="geofence" key={'mp1' + this.props.p_mission.m_id + this.key} className="btn-group  css_margin_top_small" >
                    <ClssSingle_Mission_Control_Bar p_mission={this.props.p_mission} m_selected_unit={this.state.m_partyID} />
                </div>

            );


            if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === true) {
                v_partyIDCtrl.push(
                    <div id="geofence" key={'mp2' + this.props.p_mission.m_id} className="row margin_zero css_margin_top_small">
                        <div className="col-12">
                            <ClssAndruavUnit_DropDown_List p_label={"Drone"} p_partyID={this.state.m_partyID} onSelectUnit={(partyID) => this.fn_onSelectUnit(partyID)} />
                        </div>

                    </div>
                );
            }

            if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
                // overwrite with this if public version 
                v_partyIDCtrl = [];

            }

        }


        let v_class = (this.props.p_isCurrent === true) ? "w-100 text-warning border border-warning rounded text-center cursor_hand padding_zero" : "w-100  text-light border  border-secondry rounded text-center cursor_hand padding_zero"
        return (
            <div key={"plan" + this.props.p_mission.m_id} id="m_hdr" className="col  col-sm-12 margin_zero" >
                <div className="form-inline  margin_zero padding_zero">
                    <div className="card-header text-center d-flex">
                        <p onClick={(e) => this.fn_onClick(e)} className={v_class}>{this.props.p_isCollapsed===true?'+   ':'-   '}<strong>{'Mission #' + this.props.p_mission.m_id + ' Panel (' + (this.props.p_mission.fn_getMissionDistance() / 1000.0).toFixed(1) + ' km)'}</strong></p>
                        <input type='color' className="border hidden" id={'cp_' + this.props.p_mission.m_id} onChange={(e) => this.fn_changeColor()} />
                        <p id={'pc_' + this.props.p_mission.m_id} onClick={(e) => this.fn_simClick(e)} className={this.state.css_pc} title="Change Plan color path"  >C</p>
                        <p id={'ph_' + this.props.p_mission.m_id} onClick={(e) => this.fn_togglePath(e)} className={this.state.css_ph} title="Hide/Display plan on Map" ref={instance => this.btn_toggle_path = instance}  >H</p>
                    </div>
                </div>

                {v_item}

                {v_partyIDCtrl}
                <hr />
            </div>
        );
    }
}


