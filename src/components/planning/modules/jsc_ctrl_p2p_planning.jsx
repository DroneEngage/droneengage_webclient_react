import React from 'react';
import ClssModulePlanningBase from './jsc_ctrl_dynamic_base.jsx';

import * as js_andruavMessages from '../../../js/js_andruavMessages';
import { js_globals } from '../../../js/js_globals.js';
import { CCommandAPI } from '../../../js/js_commands_api.js'

export class ClssP2P_Planning extends ClssModulePlanningBase {
  constructor(props) {
    super(props);
    this.moduleName = 'p2p';
  }

  fn_editShape() {
    // Call parent fn_editShape if needed
    super.fn_editShape();
    const req_cmd = this.m_output.fieldNameOutput;
    let cmd_msgs = [];
    if (req_cmd.swr_leader === true) {
      console.log('want to be a leader');
    }

    if (req_cmd.hasOwnProperty('swr_leader')) {

      let cmd;
      const is_leader = req_cmd.swr_leader;
      if (is_leader) {
        const formation = req_cmd.hasOwnProperty('swr_leader_formation') ? req_cmd.swr_leader_formation : js_andruavMessages.CONST_TASHKEEL_SERB_THREAD;

        cmd = CCommandAPI.API_makeSwarm(
          this.props.p_unit,
          formation,
          js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE,
          js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE
        );
      }
      else {
        // un-leader
        cmd = CCommandAPI.API_makeSwarm(
          this.props.p_unit,
          js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM,
          js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE,
          js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE
        );
      }
      cmd_msgs.push(cmd);
    }

    if (req_cmd.hasOwnProperty('tel_cmd')) {
      let cmd;
      const telemetry_cmd = req_cmd.tel_cmd;
      if (telemetry_cmd) {
        cmd = CCommandAPI.API_resumeTelemetry(this.props.p_unit);
      }
      else {
        cmd = CCommandAPI.API_pauseTelemetry(this.props.p_unit);
      }

      cmd_msgs.push(cmd);
    }


    if (req_cmd.hasOwnProperty('srv_cmd')) {
      let cmd;
      const comm_server_cmd = req_cmd.srv_cmd;
      cmd = CCommandAPI.API_SetCommunicationChannel(this.props.p_unit, comm_server_cmd);
      cmd_msgs.push(cmd);
    }

    if (req_cmd.hasOwnProperty('swr_leader')) {
      let cmd;
      const swr_leader = req_cmd.swr_leader;
      cmd = CCommandAPI.API_requestFromDroneToFollowAnother(this.props.p_unit, 0, swr_leader, js_andruavMessages.CONST_TYPE_SWARM_FOLLOW);
      cmd_msgs.push(cmd);
    }

    this.props.p_shape.m_missionItem.modules[this.moduleName] =
    {
      'cmds': this.m_output,
      'cmd_msgs': cmd_msgs
    };
      
    // this.props.p_shape.m_missionItem.modules[this.moduleName] =
    // {
    //   'cmds': cmd_msgs, 
    //   'current_values': this.m_output.fieldNameOutput,
    // };
  }
}
