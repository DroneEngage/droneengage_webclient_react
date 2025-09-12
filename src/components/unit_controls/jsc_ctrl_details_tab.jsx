import React from 'react';

import * as js_siteConfig from '../../js/js_siteConfig.js'
import { EVENTS as js_event } from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import { js_andruavAuth } from '../../js/js_andruav_auth.js'
import { fn_changeUDPPort } from '../../js/js_main.js'

import { ClssRX_MESSAGE } from '../gadgets/jsc_ctrl_rx_messageControl.jsx'

export class ClssCtrlUnitDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            m_traffic_monitor: false,
            m_message: [],
            m_update: 0
        };

        this.m_flag_mounted = false;
        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_unitUpdated, this, this.fn_unitUpdated);
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitUpdated, this);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    fn_unitUpdated(p_me, p_andruavUnit) {
        if (p_me.props.p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;
        if (p_me.m_flag_mounted === false) return;
        p_me.setState({ 'm_update': p_me.state.m_update + 1 });
    }

    fn_changeTelemetryPort(p_andruavUnit) {
        if (p_andruavUnit == null) return;

        fn_changeUDPPort(p_andruavUnit);
    }

    fn_resetMsgCounter(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;


        p_andruavUnit.m_Messages.fn_reset();
    }

    fn_toggleTrafficMonitor() {
        this.setState({ 'm_traffic_monitor': !this.state.m_traffic_monitor });
    }

    render() {

        const v_andruavUnit = this.props.p_unit;
        let module_version = [];

        if (v_andruavUnit.m_isDE === false) {
            module_version.push(<span key={this.key + 'set_andruav'} >Andruav</span>);
        } else {
            module_version.push(<span key={this.key + 'set_dev'} className=''>DE&nbsp;version:&nbsp;{v_andruavUnit.m_version}</span>);

            if (v_andruavUnit.m_modules.m_list.length === 0) {
                module_version.push(<span key={this.key + 'set_nm'} className='text-warning'>&nbsp;( no modules connected ) </span>);
            } else {
                // This is the correct way to replace the 'for' loop with 'map'
                const modules = v_andruavUnit.m_modules.m_list.map((module) => {
                    if (module.d === true) {
                        return (
                            <span key={this.key + module.i}>
                                &nbsp;-&nbsp;
                                <span className='text-danger'>{module.i}&nbsp;{module.v}</span>
                                <span className='blink_alert animate_iteration_5s'>OFFLINE</span>
                            </span>
                        );
                    } else {
                        return (
                            <span key={this.key + module.i}>
                                &nbsp;-&nbsp;
                                <span
                                    className={module.z === -1 ? 'text-warning' : 'text-success'}
                                    title={module.z === -1 ? 'Module needs to be upgraded.' : 'version OK'}
                                >
                                    {module.i}&nbsp;{module.v}
                                    {module.z === -1 && <>&nbsp;<i className="bi-exclamation-circle-fill"></i></>}
                                </span>
                            </span>
                        );
                    }
                });
                // Push the resulting array of modules to the module_version array
                module_version.push(...modules);
            }
        }

        let cmd_btns = [];
        if (js_siteConfig.CONST_FEATURE.DISABLE_UDPPROXY_UPDATE !== true)
            if (js_andruavAuth.fn_do_canControl()) {
                cmd_btns.push(<div key={this.key + 'settings_cb1'} className='row css_margin_zero padding_zero border-top border-secondary'>

                    <div key={this.key + 'settings_cb11'} className="col-12 mt-1">
                        <div key={this.key + 'settings_cb12'} className='row al_l css_margin_zero d-flex '>
                            <div key={this.key + 'settings_cb121'} className='col-6 col-sm-3 user-select-none '>
                                <p key={this.key + 'settings_cb1211'} className=' rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c' title='Change UDP Proxy Port' onClick={() => this.fn_changeTelemetryPort(v_andruavUnit)}>Proxy Port</p>
                            </div>
                            <div key={this.key + 'settings_cb122'} className='col-6 col-sm-3 user-select-none '>
                                <p key={this.key + 'settings_cb1221'} className=' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c' title='Reset Counters' onClick={() => this.fn_resetMsgCounter(v_andruavUnit)}>Reset</p>
                            </div>
                        </div>
                    </div>
                </div>);
            }

        let cmd_data = [];
        if (this.state.m_traffic_monitor === true) {
            cmd_data.push(<div key={this.key + 'settings_cd1'} className='row css_margin_zero padding_zero border-top border-secondary'>
                <div key={this.key + 'settings_cd11'} className="col-12 mt-1">
                    <ClssRX_MESSAGE key={this.key + 'settings_cd111'} p_unit={v_andruavUnit} />
                </div>
            </div>
            );
        }

        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));

        return (
            <div key={v_andruavUnit.getPartyID() + 'settings'}>
                <div key={v_andruavUnit.getPartyID() + 'settings_1'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'settings_01'} className="col-4 cursor_hand">
                        <p key={v_andruavUnit.getPartyID() + 'settings_011'} className="textunit_w135 user-select-all m-0 no-wrap" onClick={(e) => this.fn_toggleTrafficMonitor(e)}><span><small><b>Received&nbsp;
                            <span className='text-warning'>
                                {v_andruavUnit.m_Messages.m_received_bytes > 1024 * 1024
                                    ? (v_andruavUnit.m_Messages.m_received_bytes / (1024 * 1024)).toFixed(2) + ' MB'
                                    : (v_andruavUnit.m_Messages.m_received_bytes / 1024).toFixed(2) + ' KB'}
                            </span></b></small></span>
                        </p>
                    </div>

                    <div key={v_andruavUnit.getPartyID() + 'settings_11'} className="col-4 cursor_hand">
                        <p key={v_andruavUnit.getPartyID() + 'settings_111'} className="textunit_w135 user-select-all m-0 no-wrap" onClick={(e) => this.fn_toggleTrafficMonitor(e)}><span><small><b>Video Data&nbsp;
                            <span className='text-warning'>
                                {v_andruavUnit.m_Video.m_total_transfer_bytes > 1024 * 1024
                                    ? (v_andruavUnit.m_Video.m_total_transfer_bytes / (1024 * 1024)).toFixed(2) + ' MB'
                                    : (v_andruavUnit.m_Video.m_total_transfer_bytes / 1024).toFixed(2) + ' KB'}
                            </span>
                        </b></small></span>
                        </p>
                    </div>

                    <div key={v_andruavUnit.getPartyID() + 'settings_12'} className="col-4 cursor_hand">
                        <p className="textunit_w135 user-select-all m-0 no-wrap" key={v_andruavUnit.getPartyID() + 'SC_51'} onClick={(e) => this.fn_toggleTrafficMonitor(e)}><span><small><b>Received <span className='text-warning'>{v_andruavUnit.m_Messages.m_received_msg} </span>msgs</b></small></span></p>
                    </div>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'settings_2'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'settings_21'} className="col-12 ">
                        <p key={v_andruavUnit.getPartyID() + 'settings_211'} className="textunit user-select-all m-0"><span><small><b>{module_version}</b></small></span></p>
                    </div>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'settings_3'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'settings_31'} className="col-12">
                        <p key={v_andruavUnit.getPartyID() + 'settings_311'} className="textunit user-select-all m-0"><span><small><b>Last Active <span className='text-warning' ><small><b>{v_date.toUTCString()}</b></small></span> </b></small></span></p>
                    </div>
                </div>
                {cmd_btns}
                {cmd_data}
            </div>

        )
    }
}