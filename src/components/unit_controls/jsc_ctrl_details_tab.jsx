import React from 'react';
import { withTranslation } from 'react-i18next';

import * as js_siteConfig from '../../js/js_siteConfig.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import { js_andruavAuth } from '../../js/js_andruav_auth.js';
import { fn_changeUDPPort } from '../../js/js_main.js';
import { ClssRX_MESSAGE } from '../gadgets/jsc_ctrl_rx_messageControl.jsx';


class ModuleDetails extends React.Component {
    render() {
        const { module, t } = this.props;
        if (!this.props.isExpanded) return null;

        return (
            <div className="row css_margin_zero padding_zero mt-1 w-100">
                <div className="col-12">
                    <div className="card border-secondary mb-0 bg-secondary">
                        <div className="card-body p-2">
                            <div className="row align-items-center mb-0">
                                <div className="col-12 mb-1">
                                    <p className="card-title mb-1"><strong>{module.i}</strong></p>
                                </div>
                                <div className="col-6">
                                    <div className="d-flex align-items-center">
                                        <small className="text-muted me-2 text-capitalize">{t('version_colon')}</small>
                                        <span className={`fw-bold ${module.z === -1 ? 'text-danger' : 'text-success'}`}>{module.v}</span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="d-flex align-items-center">
                                        <small className="text-muted me-2 text-capitalize">{t('status_colon')}</small>
                                        <span className={`fw-bold ${module.d ? 'text-danger' : 'text-success'}`}>
                                            {module.d ? t('offline') : t('connected')}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex align-items-center">
                                        <small className="text-muted me-2 text-capitalize">{t('latest_version_colon')}</small>
                                        <span className={`fw-bold ${module.z === -1 ? 'text-danger bold' : 'text-success'}`}>
                                            {module.version_info ? module.version_info.version : 'unknown-version'}
                                        </span>
                                        {module.z === -1 && module.version_info && module.version_info.url ? (
                                            <span className="fw-bold text-primary bold">
                                                &nbsp;-&nbsp;
                                                <a
                                                    href={module.version_info.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary"
                                                >
                                                    {module.version_info.url}
                                                </a>
                                            </span>
                                        ) : (
                                            <span className="fw-bold text-secondary">
                                                &nbsp;-&nbsp;{module.version_info ? module.version_info.url || 'unknown' : 'unknown'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class ClssCtrlUnitDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_traffic_monitor: false,
            m_message: [],
            m_update: 0,
            expandedModule: null // State to track which module is expanded
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

    // Toggle module expansion
    fn_toggleModuleExpansion(i) {
        this.setState(prevState => ({
            expandedModule: prevState.expandedModule === i ? null : i
        }));
    }

    render() {
        const { t } = this.props;
        const v_andruavUnit = this.props.p_unit;
        let module_version = [];

        //module_version.push(<span key={this.key + 'set_andruav'}>Andruav</span>);
        const mainModule = {
            i: (v_andruavUnit.fn_getIsDE() === false) ? 'Andruav' : 'Drone Engage',  // e.g., "Andruav Core" – add 'main_module' to your i18n keys
            v: v_andruavUnit.fn_getVersion(),
            d: false,  // Assume m_isConnected exists; fallback: Date.now() - new Date(v_andruavUnit.m_Messages.m_lastActiveTime) > 30000
            z: v_andruavUnit.m_module_version_comparison,  // Version OK; set to -1 if upgrade check fails
            version_info: v_andruavUnit.m_module_version_info
        };
        const isExpanded = this.state.expandedModule === mainModule.i;
        const main_module = (<div className='row'>
            <div key={this.key + mainModule.i} onClick={() => this.fn_toggleModuleExpansion(mainModule.i)} style={{ width: '100%' }}>
                <span>
                    &nbsp;-&nbsp;
                    {mainModule.d === true ? (
                        <span className='text-danger'>{mainModule.i}&nbsp;{mainModule.v}</span>
                    ) : (
                        <span
                            className={mainModule.z === -1 ? 'text-warning' : 'text-success'}
                            title={mainModule.z === -1 ? t('module_needs_upgrade') : t('version_ok')}
                        >
                            {mainModule.i}&nbsp;{mainModule.v}
                            {mainModule.z === -1 && <>&nbsp;<i className="bi-exclamation-circle-fill"></i></>}
                        </span>
                    )}
                    {mainModule.d === true && <span className='blink_alert animate_iteration_5s'>{t('offline')}</span>}
                </span>

            </div>
            <ModuleDetails key={this.key + 'mod_' + mainModule.i} module={mainModule} isExpanded={isExpanded} t={t} s />
        </div>);
        module_version.push(main_module);

        if (v_andruavUnit.m_modules.m_list.length === 0) {
            module_version.push(<span key={this.key + 'set_nm'} className='text-warning'>&nbsp;{t('no_modules_connected')} </span>);
        } else {
            const modules = v_andruavUnit.m_modules.m_list.map((module) => {
                const isExpanded = this.state.expandedModule === module.i;
                return (
                    <div className='row'>
                        <div key={this.key + module.i} onClick={() => this.fn_toggleModuleExpansion(module.i)} style={{ width: '100%' }}>
                            <span>
                                &nbsp;-&nbsp;
                                {module.d === true ? (
                                    <span className='text-danger'>{module.i}&nbsp;{module.v}</span>
                                ) : (
                                    <span
                                        className={module.z === -1 ? 'text-warning' : 'text-success'}
                                        title={module.z === -1 ? t('module_needs_upgrade') : t('version_ok')}
                                    >
                                        {module.i}&nbsp;{module.v}
                                        {module.z === -1 && <>&nbsp;<i className="bi-exclamation-circle-fill"></i></>}
                                    </span>
                                )}
                                {module.d === true && <span className='blink_alert animate_iteration_5s'>{t('offline')}</span>}
                            </span>

                        </div>
                        <ModuleDetails key={this.key + 'mod_' + module.i} module={module} isExpanded={isExpanded} t={t} />
                    </div>
                );
            });
            module_version.push(...modules);
        }


        let cmd_btns = [];
        if (js_siteConfig.CONST_FEATURE.DISABLE_UDPPROXY_UPDATE !== true) {
            if (js_andruavAuth.fn_do_canControl()) {
                cmd_btns.push(
                    <div key={this.key + 'settings_cb1'} className='row css_margin_zero padding_zero border-top border-secondary'>
                        <div key={this.key + 'settings_cb11'} className="col-12 mt-1">
                            <div key={this.key + 'settings_cb12'} className='row al_l css_margin_zero d-flex '>
                                <div key={this.key + 'settings_cb121'} className='col-6 col-sm-3 user-select-none '>
                                    <p key={this.key + 'settings_cb1211'} className=' rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c' title={t('change_udp_proxy_port')} onClick={() => this.fn_changeTelemetryPort(v_andruavUnit)}>{t('proxy_port')}</p>
                                </div>
                                <div key={this.key + 'settings_cb122'} className='col-6 col-sm-3 user-select-none '>
                                    <p key={this.key + 'settings_cb1221'} className=' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c' title={t('reset_counters')} onClick={() => this.fn_resetMsgCounter(v_andruavUnit)}>{t('reset')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        let cmd_data = [];
        if (this.state.m_traffic_monitor === true) {
            cmd_data.push(
                <div key={this.key + 'settings_cd1'} className='row css_margin_zero padding_zero border-top border-secondary'>
                    <div key={this.key + 'settings_cd11'} className="col-12 mt-1">
                        <ClssRX_MESSAGE key={this.key + 'settings_cd111'} p_unit={v_andruavUnit} />
                    </div>
                </div>
            );
        }

        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));

        return (
            <div key={v_andruavUnit.getPartyID() + 'settings'} style={{ position: 'relative' }}>
                <div key={v_andruavUnit.getPartyID() + 'settings_1'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'settings_01'} className="col-4 cursor_hand">
                        <p key={v_andruavUnit.getPartyID() + 'settings_011'} className="textunit_w135 user-select-all m-0 no-wrap" onClick={(e) => this.fn_toggleTrafficMonitor(e)}>
                            <span>
                                <small>
                                    <b>{t('received_colon')}&nbsp;
                                        <span className='text-warning'>
                                            {v_andruavUnit.m_Messages.m_received_bytes > 1024 * 1024
                                                ? (v_andruavUnit.m_Messages.m_received_bytes / (1024 * 1024)).toFixed(2) + ' MB'
                                                : (v_andruavUnit.m_Messages.m_received_bytes / 1024).toFixed(2) + ' KB'}
                                        </span>
                                    </b>
                                </small>
                            </span>
                        </p>
                    </div>

                    <div key={v_andruavUnit.getPartyID() + 'settings_11'} className="col-4 cursor_hand">
                        <p key={v_andruavUnit.getPartyID() + 'settings_111'} className="textunit_w135 user-select-all m-0 no-wrap" onClick={(e) => this.fn_toggleTrafficMonitor(e)}>
                            <span>
                                <small>
                                    <b>{t('video_data_colon')}&nbsp;
                                        <span className='text-warning'>
                                            {v_andruavUnit.m_Video.m_total_transfer_bytes > 1024 * 1024
                                                ? (v_andruavUnit.m_Video.m_total_transfer_bytes / (1024 * 1024)).toFixed(2) + ' MB'
                                                : (v_andruavUnit.m_Video.m_total_transfer_bytes / 1024).toFixed(2) + ' KB'}
                                        </span>
                                    </b>
                                </small>
                            </span>
                        </p>
                    </div>

                    <div key={v_andruavUnit.getPartyID() + 'settings_12'} className="col-4 cursor_hand">
                        <p className="textunit_w135 user-select-all m-0 no-wrap" key={v_andruavUnit.getPartyID() + 'SC_51'} onClick={(e) => this.fn_toggleTrafficMonitor(e)}>
                            <span>
                                <small>
                                    <b>{t('received_msgs_colon')} <span className='text-warning'>{v_andruavUnit.m_Messages.m_received_msg} </span></b>
                                </small>
                            </span>
                        </p>
                    </div>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'settings_2'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'settings_21'} className="col-12 ">
                        <div key={v_andruavUnit.getPartyID() + 'settings_211'} className="textunit user-select-none cursor_hand m-0">
                            <span><small><b>{module_version}</b></small></span>
                        </div>
                    </div>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'settings_3'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'settings_31'} className="col-12">
                        <p key={v_andruavUnit.getPartyID() + 'settings_311'} className="textunit user-select-all m-0">
                            <span>
                                <small>
                                    <b>{t('last_active_colon')} <span className='text-warning'><small><b>{v_date.toUTCString()}</b></small></span></b>
                                </small>
                            </span>
                        </p>
                    </div>
                </div>
                {cmd_btns}
                {cmd_data}
            </div>
        );
    }
}

const ClssCtrlUnitDetailsTranslated = withTranslation()(ClssCtrlUnitDetails);
const ModuleDetailsTranslated = withTranslation()(ModuleDetails);

export { ClssCtrlUnitDetailsTranslated as ClssCtrlUnitDetails, ModuleDetailsTranslated as ModuleDetails };