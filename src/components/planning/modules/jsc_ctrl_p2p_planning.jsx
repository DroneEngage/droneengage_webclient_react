import React from 'react';


import { CCommandAPI } from '../../../js/js_commands_api.js'

export class ClssP2P_Planning extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_action: 0,
            m_enable_p2p: false,
            m_enable_telemetry: false,
            m_enable_servercomm: false
        };

        this.key = Math.random().toString();
        this.m_enabled_ctrl = false;
        this.p2p_Ref = React.createRef();
        this.telemetry_Ref = React.createRef();
        this.servercomm_Ref = React.createRef();
    }

    componentDidMount() {
        this.state.m_update = 1;
        if (this.props.p_shape.m_missionItem.modules.p2p === undefined) {
            this.fn_process_enable (false);

            this.props.p_shape.m_missionItem.modules.p2p =
            {
                tel: this.state.m_enable_telemetry,
                p2p: this.state.m_enable_p2p,
                srv: this.state.m_enable_servercomm,
            };
            
        }
        else {
            this.fn_process_enable (true); 
            
            const p2p = this.props.p_shape.m_missionItem.modules.p2p;

            this.state.m_enable_telemetry = p2p.tel;
            this.state.m_enable_p2p = p2p.p2p;
            this.state.m_enable_servercomm = p2p.srv;

            this.telemetry_Ref.current.checked = p2p.tel;
            this.p2p_Ref.current.checked = p2p.p2p;
            this.servercomm_Ref.current.checked = p2p.srv;
        }


    }

    fn_process_enable (enabled)
    {
        if (enabled === true) {
            this.m_enabled_ctrl = true;
            this.telemetry_Ref.current.disabled = false;
            this.p2p_Ref.current.disabled = false;
            this.servercomm_Ref.current.disabled = false;
        }
        else {
            this.m_enabled_ctrl = false;
            this.telemetry_Ref.current.disabled = true;
            this.p2p_Ref.current.disabled = true;
            this.servercomm_Ref.current.disabled = true;
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
        this.props.p_shape.m_missionItem.modules.p2p =
        {
            cmds: {
                'tel_cmd': tel,
                'p2p_cmd': p2p,
                'srv_cmd': srv,
            },
            tel: this.state.m_enable_telemetry,
            p2p: this.state.m_enable_p2p,
            srv: this.state.m_enable_servercomm,

        };

    }


    fn_enableCtrl(e) {
        if (e.currentTarget.checked === true) {
            this.m_enabled_ctrl = true;
            this.telemetry_Ref.current.disabled = false;
            this.p2p_Ref.current.disabled = false;
            this.servercomm_Ref.current.disabled = false;
        }
        else {
            this.m_enabled_ctrl = false;
            this.telemetry_Ref.current.disabled = true;
            this.p2p_Ref.current.disabled = true;
            this.servercomm_Ref.current.disabled = true;
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

    render() {
        return (
            <div key={this.key + "_ctl_p2pp"} className={this.props.className}>
                <div key={this.key + 'p2pp_0'} className='row css_margin_zero padding_zero '>
                    <div key={this.key + 'p2pp_01'} className="col-6 pt-2">
                        <div key={this.key + 'p2pp_011'} className='row css_margin_zero padding_zero '>
                            <label htmlFor="m_enable_servercomm" className="col-8 al_l " ><small>Enabled</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_ctrl"} ref={this.servercomm_Ref} onChange={(e) => this.fn_enableCtrl(e)} />
                        </div>
                    </div>
                </div>
                <div key={this.key + 'p2pp_1'} className='row css_margin_zero padding_zero '>
                    <div key={this.key + 'p2pp_11'} className="col-6 pt-2">
                        <div key={this.key + 'p2pp_111'} className='row css_margin_zero padding_zero '>
                            <label htmlFor="m_enable_servercomm" className="col-8 al_l " ><small>Server Comm</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_servercomm"} ref={this.servercomm_Ref} onChange={(e) => this.fn_enableServerComm(e)} />
                        </div>
                        <div key={this.key + 'p2pp_113'} className='row css_margin_zero padding_zero '>
                            <label htmlFor="m_enable_telemetry" className="col-8 al_l " ><small>Enable Telemetry</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_telemetry"} ref={this.telemetry_Ref} onChange={(e) => this.fn_enableTelemetry(e)} />
                        </div>
                    </div>
                    <div key={this.key + 'p2pp_21'} className="col-6 ">

                        <div key={this.key + 'p2pp_212'} className='row css_margin_zero padding_zero '>
                            <label htmlFor="m_enable_p2p" className="col-8 al_l " ><small>Enable P2P</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_p2p"} ref={this.p2p_Ref} onChange={(e) => this.fn_enableP2P(e)} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}