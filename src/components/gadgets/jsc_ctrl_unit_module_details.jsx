import React from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';

import * as js_siteConfig from '../../js/config/js_siteConfig.js';
import { js_dialogs } from '../../js/app/dialogService.js';
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'

import {
    fn_do_modal_confirmation,
    fn_do_modal_alert
    } from '../../js/js_main.js'

export default class ClssModuleDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            m_update: 0
        };

        this.popupRef = React.createRef();
        this.key = Math.random().toString();

        this.fn_shutdownModule = this.fn_shutdownModule.bind(this);
        this.fn_configModule = this.fn_configModule.bind(this);
        this.fn_shutDownBoard = this.fn_shutdownBoard.bind(this);
        this.fn_rebootBoard = this.fn_rebootBoard.bind(this);
    }

    fn_shutdownModule(p_module_key) {
        const c_module_key = p_module_key;
        const me  = this;
            fn_do_modal_confirmation(this.props.t('warning_config_change', {unitName: this.props.p_unit.m_unitName}),
              this.props.t('are_you_sure_apply_settings'), function (p_approved) {
                if (p_approved === false) return;
        
                js_session.fn_getAndruavFacade().API_doModuleConfigAction(me.props.p_unit, c_module_key, js_andruavMessages.CONST_TYPE_CONFIG_ACTION_Restart);

            
                console.log('Submitted:', me.state.output);
                fn_do_modal_alert(null, "data submitted. you need to restart the module.");
                
              }, this.props.t('yes'), "bg-danger text-white");
    }

    fn_shutdownBoard(p_module_key) {

        const v_andruavUnit = this.props.p_unit;
                
        fn_do_modal_confirmation("VERY DANGEROUS ACTION! - Completely ShutDown Board - NO Restart" + v_andruavUnit.m_unitName,
                    "Are you sure you want to completly shutdown the BOARD?", function (p_approved) {
                        if (p_approved === false) return;
                        js_session.fn_getAndruavFacade().API_doModuleConfigAction(v_andruavUnit, p_module_key, js_andruavMessages.CONST_TYPE_CONFIG_ACTION_SHUT_DOWN_HW);
                    }, this.props.t('yes'), "bg-danger text-white");
    }

    fn_rebootBoard(p_module_key) {

        const v_andruavUnit = this.props.p_unit;
                
        fn_do_modal_confirmation("VERY DANGEROUS ACTION! - Completely Reboot Board" + v_andruavUnit.m_unitName,
                    "Are you sure you want to completly reboot the BOARD?", function (p_approved) {
                        if (p_approved === false) return;
                        js_session.fn_getAndruavFacade().API_doModuleConfigAction(v_andruavUnit, p_module_key, js_andruavMessages.CONST_TYPE_CONFIG_ACTION_RESTART_HW);
                    }, this.props.t('yes'), "bg-danger text-white");
    }

    fn_configModule(p_module) {

        function fn_callback(p_params) {
            js_dialogs.fn_showConfigGenerator({ 'p_unit': p_params.p_unit, 'module': p_params.p_module });
        }
        js_session.fn_getAndruavFacade().API_fetchConfigJSON(this.props.p_unit, p_module, fn_callback);
    }

    render() {
        if (js_siteConfig.CONST_FEATURE.DISABLE_VERSION_NOTIFICATION === true)
            return (<></>)

        const { module, t } = this.props;
        if (!this.props.isExpanded) return null;

        // Health data for this module (if any). de_comm sends with k="comm",
        // modules send with their own module key stored in module.k.
        // The main module (de_comm core) has no k, so use "comm".
        const healthKey = module.k ? module.k : 'comm';
        const health = this.props.p_unit.m_moduleHealth ? this.props.p_unit.m_moduleHealth[healthKey] : null;

        const trendIcon = health ? (health.trend === 1 ? 'bi-arrow-up text-warning' : health.trend === 2 ? 'bi-arrow-down text-success' : 'bi-arrow-left-right text-muted') : null;
        const statusColor = health ? (health.status === 2 ? 'text-danger' : health.status === 1 ? 'text-warning' : 'text-success') : null;
        const statusText = health ? (health.status === 2 ? t('critical') : health.status === 1 ? t('warning') : t('ok')) : null;

        return (
            <div id={`MD${this.key}`} key={`MD${this.key}`} className="row css_margin_zero padding_zero mt-1 w-100 cursor_default">
                <div className="col-12">
                    <div className="card border-secondary mb-0 bg-theme-aware">
                        <div className="card-body p-2">
                            <div className="row align-items-center mb-0">
                                <div className="col-12 mb-1 d-flex align-items-center justify-content-between">
                                    <p className="card-title mb-1 cursor_hand me-2">
                                        <strong>{module.i}</strong>
                                    </p>
                                    {this.props.p_unit.fn_getIsDE() && <div id={`MD_CB${this.key}`} className='d-flex'>
                                        <button id={this.key + 'restart'} key={this.key + 'restart'} className='btn al_c btn-danger cursor_hand text-white textunit_nowidth me-2' onClick={(e) => this.fn_shutdownModule(module.k)}>{this.props.t('restart')}</button>
                                        {
                                            // Config Button
                                            (module.c && module.c !== 'comm') && (
                                                <button
                                                    id={this.key + 'config'}
                                                    key={this.key + 'config'}
                                                    className='btn al_c btn-success cursor_hand text-white textunit_nowidth'
                                                    onClick={(e) => this.fn_configModule(module)}
                                                    title={this.props.t('configure_module')}
                                                >
                                                    {this.props.t('config')}
                                                </button>
                                            )
                                        }
                                        {
                                            (!module.c ) && (
                                                <button
                                                    id={this.key + 'shutdown'}
                                                    key={this.key + 'shutdown'}
                                                    className='btn al_c btn-danger cursor_hand text-white textunit_nowidth me-2'
                                                    onClick={(e) => this.fn_shutDownBoard(module.k)}
                                                    title='Shutdown Board Completly'
                                                >
                                                    shutdown
                                                </button>
                                            )
                                        }
                                        {
                                            (!module.c ) && (
                                                <button
                                                    id={this.key + 'reboot'}
                                                    key={this.key + 'reboot'}
                                                    className='btn al_c btn-danger cursor_hand text-white textunit_nowidth'
                                                    onClick={(e) => this.fn_rebootBoard(module.k)}
                                                    title='Reboot Board'
                                                >
                                                    reboot
                                                </button>
                                            )
                                        }
                                    </div>}
                                </div>
                                <div className="col-6">
                                    <div className="d-flex align-items-center">
                                        <small className="text-muted me-2 text-capitalize">{t('version_colon')}</small>
                                        <span className={`fw-bold ${module.z === -1 ? 'text-danger bold' : module.z === 1?'txt-theme-aware':'text-success'}`}>{module.v}</span>
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
                                <div className="col-12">
                                    <div className="d-flex align-items-center">
                                        {module.version_info && module.version_info.help ? (
                                            <>
                                                <small className="text-muted me-2 text-capitalize">{t('help_colon')}</small>
                                                <span className="fw-bold text-primary bold">
                                                    <a
                                                        href={module.version_info.help}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-success"
                                                    >
                                                        {module.version_info.help}
                                                    </a>
                                                </span>
                                            </>
                                        ) : (
                                            <span className="fw-bold text-secondary">
                                                &nbsp;-&nbsp;{module.help ? (module.version_info && module.version_info.help) || 'unknown' : 'unknown'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {health && (
                                    <>
                                        <div className="col-6">
                                            <div className="d-flex align-items-center">
                                                <small className="text-muted me-2 text-capitalize">{t('memory_colon')}</small>
                                                <span className={`fw-bold ${statusColor}`}>
                                                    {health.rss != null ? `${health.rss.toFixed(1)} MB` : '-'}
                                                </span>
                                                {trendIcon && <i className={`bi ${trendIcon} ms-1`} />}
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="d-flex align-items-center">
                                                <small className="text-muted me-2 text-capitalize">{t('health_colon')}</small>
                                                <span className={`fw-bold ${statusColor}`}>{statusText}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="d-flex align-items-center">
                                                <small className="text-muted me-2 text-capitalize">{t('peak_colon')}</small>
                                                <span className="fw-bold text-muted">{health.peak != null ? `${health.peak.toFixed(1)} MB` : '-'}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="d-flex align-items-center">
                                                <small className="text-muted me-2 text-capitalize">{t('swap_colon')}</small>
                                                <span className={`fw-bold ${health.vmswap > 0 ? 'text-warning' : 'text-muted'}`}>
                                                    {health.vmswap != null ? `${health.vmswap.toFixed(1)} MB` : '-'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="d-flex align-items-center">
                                                <small className="text-muted me-2 text-capitalize">{t('threads_colon')}</small>
                                                <span className="fw-bold text-muted">{health.threads ?? '-'}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="d-flex align-items-center">
                                                <small className="text-muted me-2 text-capitalize">{t('uptime_colon')}</small>
                                                <span className="fw-bold text-muted">
                                                    {health.uptime != null ? `${Math.floor(health.uptime / 60)}m ${health.uptime % 60}s` : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


const ClssModuleDetailsTranslated = withTranslation()(ClssModuleDetails);
export { ClssModuleDetailsTranslated as ClssModuleDetails };