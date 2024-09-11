import React from 'react';


import * as js_andruavMessages from '../../../js/js_andruavMessages'

import {js_globals} from '../../../js/js_globals.js';
import { CCommandAPI } from '../../../js/js_commands_api.js'
import {ClssCTRL_SWARM} from '../../gadgets/jsc_ctrl_swarm.jsx'
import { ClssAndruavUnit_DropDown_List } from '../../gadgets/jsc_ctrl_unit_drop_down_list.jsx'


export class ClssP2P_Planning extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_action: 0,
            m_enable_p2p: false,
            m_enable_telemetry: false,
            m_enable_servercomm: false,
            m_follow_partyID: 0,
            m_swarm_leader: false,
        };

        this.key = Math.random().toString();
        
        this.m_enabled_ctrl = false;

        this.enable_Ref = React.createRef();
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
            this.fn_process_enable (false);

            this.props.p_shape.m_missionItem.modules.p2p =
            {
                tel: this.state.m_enable_telemetry,
                p2p: this.state.m_enable_p2p,
                srv: this.state.m_enable_servercomm,
                swr: this.state.m_follow_partyID,
                swr_leader: this.state.m_swarm_leader,
            };
            
        }
        else {
            // copy saved data
            this.fn_process_enable (true); 
            
            const p2p = this.props.p_shape.m_missionItem.modules.p2p;

            this.state.m_enable_telemetry = p2p.tel;
            this.state.m_enable_p2p = p2p.p2p;
            this.state.m_enable_servercomm = p2p.srv;
            this.state.m_follow_partyID = p2p.swr;
            this.state.m_swarm_leader = p2p.swr_leader;

            this.telemetry_Ref.current.checked = p2p.tel;
            this.p2p_Ref.current.checked = p2p.p2p;
            this.servercomm_Ref.current.checked = p2p.srv;
            this.swarm_Ref.current.m_partyID = p2p.swr;
            this.swrm_leader_Ref.current.checked = p2p.swr_leader;
        }

        this.setState({m_update: this.state.m_update +1});
    }

    fn_process_enable (enabled)
    {
        this.enable_Ref.current.checked = enabled;
        this.m_enabled_ctrl = enabled;
        
        if (enabled === true) {
            this.telemetry_Ref.current.disabled = false;
            this.p2p_Ref.current.disabled = false;
            this.servercomm_Ref.current.disabled = false;
            this.swarm_Ref.current.disabled = false;
            this.swrm_leader_Ref.current.disabled = false;
        }
        else {
            this.telemetry_Ref.current.disabled = true;
            this.p2p_Ref.current.disabled = true;
            this.servercomm_Ref.current.disabled = true;
            this.swarm_Ref.current.disabled = true;
            this.swrm_leader_Ref.current.disabled = true;
        }
    }

    fn_editShape() {

        if (this.m_enabled_ctrl !== true) {
            this.props.p_shape.m_missionItem.modules.p2p = undefined;

            return;
        }
        

        const srv = CCommandAPI.API_SetCommunicationChannel(null, this.state.m_enable_servercomm, null, null, null);
        const p2p = CCommandAPI.API_SetCommunicationChannel(null, null, this.state.m_enable_p2p, null, null);
        let tel = null;
        if (this.state.m_enable_telemetry === true) {
            tel = CCommandAPI.API_resumeTelemetry();
        }
        else {
            tel = CCommandAPI.API_pauseTelemetry();
        }

        const swr_cmd = this.fn_callRequestToFollow(this.state.m_follow_partyID);
        const swr_leader = this.fn_callMakeSwarm();
        
        this.props.p_shape.m_missionItem.modules.p2p =
        {
            cmds: {
                'tel_cmd': tel,
                'p2p_cmd': p2p,
                'srv_cmd': srv,
                'swr_cmd': swr_cmd,
                'swr_leader': swr_leader
            },
            tel: this.state.m_enable_telemetry,
            p2p: this.state.m_enable_p2p,
            srv: this.state.m_enable_servercomm,
            swr: this.state.m_follow_partyID,
            swr_leader: this.state.m_swarm_leader
        };

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

    fn_enableTelemetry(e) {
        this.state.m_enable_telemetry = e.currentTarget.checked;
    }

    fn_enableP2P(e) {
        this.state.m_enable_p2p = e.currentTarget.checked;
    }

    fn_enableServerComm(e) {
        this.state.m_enable_servercomm = e.currentTarget.checked;
    }

    fn_enableSwarmLeader(e) {
        this.state.m_swarm_leader = e.currentTarget.checked;
    }

    fn_requestToFollow(p_partyID)
    {
        this.state.m_follow_partyID = p_partyID;
    }

    fn_callRequestToFollow(p_partyID)
    {
        if (this.props.p_unit === null || this.props.p_unit === undefined ) return ;
        
        let v_partyID = null;
        let v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_UNFOLLOW;
        if (p_partyID !== null && p_partyID !== undefined && p_partyID !== 0)
        {
            v_partyID = p_partyID;
            v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_FOLLOW;
        }
        
        return CCommandAPI.API_requestFromDroneToFollowAnother(this.props.p_unit, -1, v_partyID, v_do_follow);
    }


    fn_callMakeSwarm()
    {
        if (this.props.p_unit === null || this.props.p_unit === undefined ) return ;
        
        let cmd = null;
        if (this.props.p_unit.m_Swarm.m_isLeader === true) {   // make not a leader
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
                        <div key={this.key + 'p2pp_011'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={this.key + "m_enable_ctrl"} className="col-8 al_l " ><small>Enabled</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_ctrl"}  ref={this.enable_Ref} onChange={(e) => this.fn_enableCtrl(e)} />
                        </div>
                    </div>
                </div>
                <div key={this.key + 'p2pp_1'} className='row css_margin_zero padding_zero '>
                    <div key={this.key + 'p2pp_11'} className="col-6 pt-2">

                        <div key={this.key + 'p2pp_111'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={this.key + "m_enable_servercomm"} className="col-8 al_l " ><small>Server Comm</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_servercomm"} ref={this.servercomm_Ref} onChange={(e) => this.fn_enableServerComm(e)} />
                        </div>
                        <div key={this.key + 'p2pp_113'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={this.key + "m_enable_telemetry"} className="col-8 al_l " ><small>Enable Telemetry</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_telemetry"} ref={this.telemetry_Ref} onChange={(e) => this.fn_enableTelemetry(e)} />
                        </div>

                    </div>
                    <div key={this.key + 'p2pp_21'} className="col-6 ">

                        <div key={this.key + 'p2pp_212'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={"m_enable_p2p" + this.key } className="col-8 al_l " ><small>Enable P2P</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={"m_enable_p2p" + this.key } ref={this.p2p_Ref} onChange={(e) => this.fn_enableP2P(e)} />
                        </div>

                        <div key={this.key + 'p2pp_213'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={"m_enable_swarm_leader" + this.key } className="col-8 al_l " ><small>Swarm Leader</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={"m_enable_swarm_leader" + this.key } ref={this.swrm_leader_Ref} onChange={(e) => this.fn_enableSwarmLeader(e)} />
                        </div>

                        <ClssAndruavUnit_DropDown_List className='row css_margin_zero padding_zero ' m_partyID={this.state.m_follow_partyID}  ref={this.swarm_Ref} onSelectUnit={(e) => this.fn_requestToFollow(e)} />
                    </div>
                    
                </div>
            </div>
        );
    }
}