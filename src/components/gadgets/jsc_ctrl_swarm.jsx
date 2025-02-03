import $ from 'jquery';
import React from 'react';

import * as js_siteConfig from '../../js/js_siteConfig.js'
import * as js_common from '../../js/js_common.js'
import * as js_andruavMessages from '../../js/js_andruavMessages'
import { js_globals } from '../../js/js_globals.js';
import { js_localStorage } from '../../js/js_localStorage'
import { js_eventEmitter } from '../../js/js_eventEmitter'
import { CCommandAPI } from '../../js/js_commands_api.js'



/**
 * props:
 * p_unit
 * 
 * events:
 * onMakeSwarm
 * onRequestToFollow
 */
export class ClssCTRL_SWARM extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            'm_update': 0,

        };

        this.key = Math.random().toString();
        
        js_eventEmitter.fn_subscribe(js_globals.EE_onAndruavUnitSwarmUpdated, this, this.fn_onSwarmUpdate);

    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onAndruavUnitSwarmUpdated, this);
    }




    componentDidMount() {
        this.state.m_update = 1;
    }


    fn_onSwarmUpdate(p_me) {
        if (p_me.state.m_update === 0) return;

        p_me.setState({ 'm_update': p_me.state.m_update + 1 });
    }

    fn_toggleMakeSwarm(p_formationID) {
        if (this.props.p_unit === null || this.props.p_unit === undefined) return;

        if (this.props.onRequestToFollow !== undefined) {
            this.props.onMakeSwarm(p_formationID);
        }

        if (this.props.p_unit.m_Swarm.m_isLeader === true) {   // make not a leader
            js_globals.v_andruavClient.API_makeSwarm(this.props.p_unit, js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM);
        }
        else {   // make leader and set formation.
            js_globals.v_andruavClient.API_makeSwarm(this.props.p_unit, p_formationID);
        }

    }

    fn_requestToFollow(p_unit) {
        if (this.props.p_unit === null || this.props.p_unit === undefined) return;

        if (this.props.onRequestToFollow !== undefined) {
            this.props.onRequestToFollow(p_unit);
        }

        let v_partyID = null;
        let v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_UNFOLLOW;
        if (p_unit !== null && p_unit !== undefined) {
            v_partyID = p_unit.partyID;
            v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_FOLLOW;
        }
        js_globals.v_andruavClient.API_requestFromDroneToFollowAnother(this.props.p_unit, -1, v_partyID, v_do_follow);

    }


    onChange(e) {
        if (this.props.p_unit === null || this.props.p_unit === undefined) return;
        if (e.target.value) {
            if (e.target.value === "NA") {
                // do not follow
                js_globals.v_andruavClient.API_requestFromDroneToFollowAnother(this.props.p_unit, -1, null);
            }
            else {
                js_globals.v_andruavClient.API_requestFromDroneToFollowAnother(this.props.p_unit, -1, e.target.value);
            }
        }
    }

    componentDidUpdate() {
        if (this.props.p_unit === null || this.props.p_unit === undefined) return;
        if (this.props.p_unit.m_Swarm.m_following !== null && this.props.p_unit.m_Swarm.m_following !== undefined) {
            const leaderUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.p_unit.m_Swarm.m_following);
            if (leaderUnit !== null && leaderUnit !== undefined) {
                $("#" + this.props.p_unit.partyID + "dldrselsel").val(leaderUnit.partyID);
            }
            else {
                $("#" + this.props.p_unit.partyID + "dldrselsel").val("NA");
            }
        }
        else {
            $("#" + this.props.p_unit.partyID + "dldrselsel").val("NA");
        }
    }


    render() {
        if ((js_siteConfig.CONST_FEATURE.DISABLE_SWARM === true) || (js_localStorage.fn_getAdvancedOptionsEnabled() !== true)) {
            return (
                <div></div>
            )
        }
        else {



            if (this.props.p_unit === null || this.props.p_unit === undefined) return;

            //CODEBLOCK_START
            const v_units = js_globals.m_andruavUnitList.fn_getUnitValues();
            const len = v_units.length;
            const c_items = [];

            let v_leader_class = "btn-secondry";
            let v_follower_class = "bg-secondry";
            let v_leader_title_leader = "not leader";
            let v_leader_title_follower = "none";
            let v_leader_dropdown_class = "bg-secondry";
            let v_swarm_class = ' text-light';

            let v_class_follower = '  hidden  ';
            let v_class_formation_as_leader = ' hidden  ';
            let v_class_formation_as_follower = ' hidden ';


            if (this.props.p_unit.m_Swarm.m_following != null) {

                v_follower_class = "bg-danger";
                //v_leader_class = "btn-success"; // this state can be overwritten if it is a leader. 
                v_leader_dropdown_class = "bg-success text-white";
                const v_leaderUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.p_unit.m_Swarm.m_following);

                if (v_leaderUnit != null) {   // display name of party_id as a temp solution untill name is available.
                    // [v_leaderUnit==null] maybe the web is loading and this unit has not been received yet.
                    v_leader_title_follower = v_leaderUnit.m_unitName;
                }
                else {
                    v_leader_title_follower = this.props.p_unit.m_Swarm.m_following; // add party_id
                }

                v_class_formation_as_follower = '';
                v_class_follower = '';

            }
            else {

                v_follower_class = "bg-secondry";
            }

            if (this.props.p_unit.m_Swarm.m_isLeader === true) {
                v_leader_class = "btn-danger";
                v_leader_dropdown_class = "bg-danger text-white";
                v_leader_title_leader = "LEADER";
                v_class_formation_as_leader = '';
            }


            for (let i = 0; i < len; ++i) {
                const v_unit = v_units[i];

                /*
                    It is not Me.
                    It is a leader i.e. can be followed.
                    It is not following me. -as leaders can be followers but should not be following me-.
                    Notice: deeper circulaar error can be made and not handled here.
                */
                if ((this.props.p_unit.partyID !== v_unit.partyID)
                    && (v_unit.m_Swarm.m_isLeader === true)
                    && (this.props.p_unit.m_Swarm.m_following !== v_unit.partyID)) {
                    // var v_out = v_unit; // need a local copy 
                    // list drones that are not me and are leaders.
                    c_items.push(
                        <a key={v_unit.m_unitName + "s"} className="dropdown-item" href="#" onClick={(unit => {
                            return () => this.fn_requestToFollow(unit);
                        })(v_unit)}>{v_unit.m_unitName}</a>
                    );
                }
            }

            return (
                <div key={'swr_' + this.key} className={this.props.className} >
                    <div key={'swr_1' + this.key} className="btn-group" role="group" aria-label="Button group with nested dropdown">
                        <button key={'swr_11' + this.key}  id={this.props.p_unit.partyID + "_ldr"}
                            type="button"
                            className={"btn btn-sm " + v_leader_class}
                            title={v_leader_title_leader + " / folowing:" + v_leader_title_follower}
                            onClick={() => this.fn_toggleMakeSwarm(js_andruavMessages.CONST_TASHKEEL_SERB_THREAD)}>Leader</button>
                        <div key={'swr_12' + this.key} className="btn-group" role="group">
                            <button id="btnGroupDrop2"
                                type="button"
                                className={"btn  btn-sm dropdown-toggle " + v_follower_class}
                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
                            <div key={'swr_121' + this.key} className="dropdown-menu" aria-labelledby="btnGroupDrop2">
                                {c_items}
                                <a className="dropdown-item " href="#" onClick={() => this.fn_requestToFollow()}>unfollow</a>
                            </div>
                        </div>
                    </div>
                    <div key={'swr_2' + this.key} className="row al_l css_margin_zero">
                        <div key={'swr_21' + this.key} className={' col-12   padding_zero text-warning ' + v_swarm_class}>
                            <p key={'swr_211' + this.key} className={' si-07x css_margin_zero user-select-none text-danger' + v_class_follower} title='leader I am following'><i className="bi bi-chevron-double-right text-danger"></i> {' ' + v_leader_title_follower}</p>
                            <p key={'swr_212' + this.key} className={' si-07x css_margin_zero css_user_select_text text-warning' + v_class_formation_as_follower} title='formation of my leader'><i className="bi bi-dice-5 text-warning"></i> {' ' + js_andruavMessages.swarm_formation_names[this.props.p_unit.m_Swarm.m_formation_as_follower]}</p>
                            <p key={'swr_213' + this.key} className={' si-07x css_margin_zero css_user_select_text text-success' + v_class_formation_as_leader} title='formation as a leader'><i className="bi bi-dice-5 text-success"></i> {' ' + js_andruavMessages.swarm_formation_names[this.props.p_unit.m_Swarm.m_formation_as_leader]}</p>
                        </div>
                    </div>
                </div>
            );
            //CODEBLOCK_END


        }
    }
}