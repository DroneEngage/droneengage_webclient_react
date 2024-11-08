import React from 'react';


import * as js_andruavMessages from '../../../js/js_andruavMessages'

import { CCommandAPI } from '../../../js/js_commands_api.js'
import { ClssAndruavUnit_DropDown_List } from '../../gadgets/jsc_ctrl_unit_drop_down_list.jsx'
import {CTriStateChecked} from '../../micro_gadgets/jsc_mctrl_tri_state_check.jsx'


export class ClssP2P_Planning extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_action: 0,
            m_cmd_packet : {
                m_enable_p2p: null,
                m_enable_telemetry: null,
                m_enable_servercomm: null,
                m_follow_partyID: -1, // p_fixed_list={[[-1,'no action', 'text-white'], [0, 'unfollow', 'text-danger']]}
                m_swarm_leader: null
            }
        };

        this.key = Math.random().toString();
        
        this.p2p_Ref = React.createRef();
        this.telemetry_Ref = React.createRef();
        this.servercomm_Ref = React.createRef();
        this.swarm_Ref = React.createRef();
        this.swrm_leader_Ref = React.createRef();
    }

    componentDidMount() {
        this.state.m_update = 1;
        if (this.props.p_shape.m_missionItem.modules.p2p === undefined) {
            // init data
            this.props.p_shape.m_missionItem.modules.p2p =
            {
                tel: this.state.m_cmd_packet.m_enable_telemetry,
                p2p: this.state.m_cmd_packet.m_enable_p2p,
                srv: this.state.m_cmd_packet.m_enable_servercomm,
                swr: this.state.m_cmd_packet.m_follow_partyID,
                swr_leader: this.state.m_cmd_packet.m_swarm_leader,
            };
            
        }
        else {
            // copy saved data
            const p2p = this.props.p_shape.m_missionItem.modules.p2p;

            this.state.m_cmd_packet.m_enable_telemetry = p2p.tel;
            this.state.m_cmd_packet.m_enable_p2p = p2p.p2p;
            this.state.m_cmd_packet.m_enable_servercomm = p2p.srv;
            this.state.m_cmd_packet.m_follow_partyID = p2p.swr;
            this.state.m_cmd_packet.m_swarm_leader = p2p.swr_leader;

            this.telemetry_Ref.current.checked = p2p.tel;
            this.p2p_Ref.current.checked = p2p.p2p;
            this.servercomm_Ref.current.checked = p2p.srv;
            this.swarm_Ref.current.m_partyID = p2p.swr;
            this.swrm_leader_Ref.current.checked = p2p.swr_leader;
        }

        this.setState({m_update: this.state.m_update +1});
    }

    
    fn_editShape() {

        this.props.p_shape.m_missionItem.modules.p2p =
        {
            cmds: {
                'tel_cmd': null,
                'p2p_cmd': null,
                'srv_cmd': null,
                'swr_cmd': null,
                'swr_leader': null
            },
            tel: this.state.m_cmd_packet.m_enable_telemetry,
            p2p: this.state.m_cmd_packet.m_enable_p2p,
            srv: this.state.m_cmd_packet.m_enable_servercomm,
            swr: this.state.m_cmd_packet.m_follow_partyID,
            swr_leader: this.state.m_cmd_packet.m_swarm_leader
        };

        const cmds = this.props.p_shape.m_missionItem.modules.p2p.cmds;

        if (this.state.m_cmd_packet.m_enable_p2p !== null)
        {
            cmds.p2p_cmd = CCommandAPI.API_SetCommunicationChannel(null, null, this.state.m_cmd_packet.m_enable_p2p, null, null);
        }
        
        if (this.state.m_cmd_packet.m_enable_servercomm !== null)
        {
            cmds.srv_cmd = CCommandAPI.API_SetCommunicationChannel(null, this.state.m_cmd_packet.m_enable_servercomm, null, null, null);
        }

        if (this.state.m_cmd_packet.m_enable_telemetry === true) {
            cmds.tel_cmd = CCommandAPI.API_resumeTelemetry();
        }
        else if (this.state.m_cmd_packet.m_enable_telemetry === false) {
            cmds.tel_cmd = CCommandAPI.API_pauseTelemetry();
        }

        if (this.state.m_cmd_packet.m_follow_partyID !== -1)
        {
            cmds.swr_cmd = this.fn_callRequestToFollow(this.state.m_cmd_packet.m_follow_partyID);
        }
        
        
        if (this.state.m_cmd_packet.m_swarm_leader !== null)
        {  // make / unmake leader
            cmds.swr_leader = this.fn_callMakeSwarm(this.state.m_cmd_packet.m_swarm_leader);
        }

        this.props.p_shape.m_missionItem.modules.p2p.cmd_packet = this.state.m_cmd_packet;

    }


    fn_enableCtrl(e) {
        if (e.currentTarget.checked === true) {
            this.m_enabled_ctrl = true;
            this.telemetry_Ref.current.disabled = false;
            this.p2p_Ref.current.disabled = false;
            this.servercomm_Ref.current.disabled = false;
            this.swrm_leader_Ref.current.disabled = false;
        }
        else {
            this.m_enabled_ctrl = false;
            this.telemetry_Ref.current.disabled = true;
            this.p2p_Ref.current.disabled = true;
            this.servercomm_Ref.current.disabled = true;
            this.swrm_leader_Ref.current.disabled = true;
        }
    }

    fn_scan_from(e)
    {

    }

    fn_scan_to(e)
    {

    }


    fn_enableTelemetry(m_disabled, is_checked) {
        if (m_disabled === true)
        {
            this.state.m_cmd_packet.m_enable_telemetry = null;    
        }
        else
        {
            this.state.m_cmd_packet.m_enable_telemetry = is_checked;
        }
    }

    fn_enableP2P(m_disabled, is_checked) {
        if (m_disabled === true)
        {
            this.state.m_cmd_packet.m_enable_p2p = null;    
        }
        else
        {
            this.state.m_cmd_packet.m_enable_p2p = is_checked;
        }
    }

    fn_enableServerComm(m_disabled, is_checked) {
        if (m_disabled === true)
        {
            this.state.m_cmd_packet.m_enable_servercomm = null;    
        }
        else
        {
            this.state.m_cmd_packet.m_enable_servercomm = is_checked;
        }
    }

    fn_enableSwarmLeader(m_disabled, is_checked) {
        if (m_disabled === true)
        {
            this.state.m_cmd_packet.m_swarm_leader = null;    
        }
        else
        {
            this.state.m_cmd_packet.m_swarm_leader = is_checked;
        }
        
    }

    fn_requestToFollow(p_partyID)
    {
        this.state.m_cmd_packet.m_follow_partyID = p_partyID;
    }

    fn_callRequestToFollow(p_partyID)
    {
        if (this.props.p_unit === null || this.props.p_unit === undefined ) return ;
        
        let v_partyID = null;
        let v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_UNFOLLOW;
        if (p_partyID !== null && p_partyID !== undefined && p_partyID !== 0 && p_partyID !== "0")
        {
            v_partyID = p_partyID;
            v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_FOLLOW;
        }
        
        return CCommandAPI.API_requestFromDroneToFollowAnother(this.props.p_unit, -1, v_partyID, v_do_follow);
    }


    fn_callMakeSwarm(is_leader)
    {
        if (this.props.p_unit === null || this.props.p_unit === undefined) return ;
        
        let cmd = null;
        if (is_leader === false) {   // make not a leader
            cmd = CCommandAPI.API_makeSwarm(this.props.p_unit, js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM);
        }
        else {   // make leader and set formation.
            cmd = CCommandAPI.API_makeSwarm(this.props.p_unit, js_andruavMessages.CONST_TASHKEEL_SERB_THREAD);
        }

        return cmd;
    }

    render() {
        return (
            <div key={"ctl_p2pp" + this.key} className={this.props.className}>
                <div key={this.key + 'p2pp_0'} className='row css_margin_zero padding_zero '>
                    <div key={this.key + 'p2pp_01'} className="col-6 pt-2">
                    </div>
                </div>
                <div key={this.key + 'p2pp_1'} className='row css_margin_zero padding_zero '>
                    <div key={this.key + 'p2pp_11'} className="col-6 pt-2">

                        <CTriStateChecked  txtLabel='Server Comm'  disabled={this.state.m_cmd_packet.m_enable_servercomm==null?true:false} checked={this.state.m_cmd_packet.m_enable_servercomm} ref={this.servercomm_Ref}  onChange={(is_enabled, is_checked) => this.fn_enableServerComm(is_enabled, is_checked)} />

                        <CTriStateChecked  txtLabel='Enable Telemetry'  disabled={this.state.m_cmd_packet.m_enable_telemetry==null?true:false} checked={this.state.m_cmd_packet.m_enable_telemetry} ref={this.telemetry_Ref}  onChange={(is_enabled, is_checked) => this.fn_enableTelemetry(is_enabled, is_checked)} />

                    </div>
                    <div key={this.key + 'p2pp_21'} className="col-6 ">

                        <CTriStateChecked  txtLabel='Enable P2P'  disabled={this.state.m_cmd_packet.m_enable_p2p==null?true:false} checked={this.state.m_cmd_packet.m_enable_p2p} ref={this.p2p_Ref}  onChange={(is_enabled, is_checked) => this.fn_enableP2P(is_enabled, is_checked)} />

                        <CTriStateChecked  txtLabel='Swarm Leader'  disabled={this.state.m_cmd_packet.m_swarm_leader==null?true:false} checked={this.state.m_cmd_packet.m_swarm_leader} ref={this.swrm_leader_Ref}  onChange={(is_enabled, is_checked) => this.fn_enableSwarmLeader(is_enabled, is_checked)} />

                    </div>
                </div>
                <div key={this.key + 'p2pp_2'} className="row css_margin_zero padding_zero ">
                        <ClssAndruavUnit_DropDown_List className='col-12 css_margin_zero padding_zero ' p_partyID={this.state.m_cmd_packet.m_follow_partyID}  p_label={"Follow "} p_fixed_list={[[-1,'no action', 'text-white'], [0, 'unfollow', 'text-danger']]} ref={this.swarm_Ref} onSelectUnit={(p_partyID) => this.fn_requestToFollow(p_partyID)} />
                </div>
            </div>
        );
    }
}