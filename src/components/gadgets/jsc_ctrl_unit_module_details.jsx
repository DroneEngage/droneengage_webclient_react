import React from 'react';
import { withTranslation } from 'react-i18next';

import * as js_siteConfig from '../../js/js_siteConfig.js';
import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter.js';


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
    }

    fn_shutdownModule(p_module_key) {
        console.log(p_module_key);
        js_globals.v_andruavFacade.API_updateConfigRestart(this.props.p_unit, p_module_key);
    }

    fn_configModule(module) {
        const c_me = this;
        js_eventEmitter.fn_dispatch(js_event.EE_displayConfigGenerator, { 'p_unit': c_me.props.p_unit, 'module': module });

    }

    render() {
        if (js_siteConfig.CONST_FEATURE.DISABLE_VERSION_NOTIFICATION === true)
            return (<></>)

        const { module, t } = this.props;
        if (!this.props.isExpanded) return null;

        return (
            <div id={`MD${this.key}`} key={`MD${this.key}`} className="row css_margin_zero padding_zero mt-1 w-100 cursor_default">
                <div className="col-12">
                    <div className="card border-secondary mb-0 bg-secondary">
                        <div className="card-body p-2">
                            <div className="row align-items-center mb-0">
                                <div className="col-12 mb-1 d-flex align-items-center justify-content-between">
                                    <p className="card-title mb-1 cursor_hand me-2">
                                        <strong>{module.i}</strong>
                                    </p>
                                    <div id={`MD_CB${this.key}`} className='d-flex'>
                                        <button id={this.key + 'restart'} key={this.key + 'restart'} className='btn al_c bg-danger cursor_hand text-white textunit_nowidth me-2' onClick={(e) => this.fn_shutdownModule(module.k)}>restart</button>
                                        {
                                            // Config Button
                                        (module.c && module.c !== 'comm') && (
                                            <button
                                                id={this.key + 'config'}
                                                key={this.key + 'config'}
                                                className='btn al_c bg-success cursor_hand text-white textunit_nowidth'
                                                onClick={(e) => this.fn_configModule(module)}
                                            >
                                                config
                                            </button>
                                        )}
                                    </div>
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


const ClssModuleDetailsTranslated = withTranslation()(ClssModuleDetails);
export { ClssModuleDetailsTranslated as ClssModuleDetails };