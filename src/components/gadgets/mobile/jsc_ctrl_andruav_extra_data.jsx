import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../../js/js_eventList.js';
import { js_eventEmitter } from '../../../js/js_eventEmitter.js';
import * as js_helpers from '../../../js/js_helpers.js';


class ClssAndruavExtraData extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
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

    /***
     * Returns a bootstrap text-color class based on dBm and network generation.
     * Uses the same thresholds as jsc_ctrl_unit_main_bar.jsx.
     */
    fn_getSignalClass(level, networkTypeRank) {
        if (networkTypeRank < js_helpers.CONST_TELEPHONE_400G) {
            if (level < -100) return 'text-secondary';
            if (level < -95 || networkTypeRank <= js_helpers.CONST_TELEPHONE_200G) return 'text-danger';
            if (level < -80 || networkTypeRank <= js_helpers.CONST_TELEPHONE_250G) return 'text-warning';
            if (level < -70 || networkTypeRank <= js_helpers.CONST_TELEPHONE_300G) return 'text-info';
            if (level < -60) return 'text-primary';
            return 'text-success';
        } else {
            if (level < -140) return 'text-secondary';
            if (level < -124) return 'text-danger';
            if (level < -108) return 'text-warning';
            if (level < -92) return 'text-info';
            if (level < -80) return 'text-primary';
            return 'text-success';
        }
    }

    fn_getDataStateText(dataState) {
        switch (dataState) {
            case 1: return 'Connected';
            case 2: return 'Roaming';
            default: return 'Disconnected';
        }
    }

    fn_getDataStateClass(dataState) {
        switch (dataState) {
            case 1: return 'text-success';
            case 2: return 'text-warning';
            default: return 'text-danger';
        }
    }

    render() {
        const { t } = this.props;
        const v_andruavUnit = this.props.p_unit;
        const sig = v_andruavUnit.m_SignalStatus;

        // Only render if there is mobile signal data
        if (sig.m_mobile !== true) return null;

        const level = sig.m_mobileSignalLevel;
        const networkType = sig.m_mobileNetworkType;
        const networkTypeRank = sig.m_mobileNetworkTypeRank;
        const signalClass = this.fn_getSignalClass(level, networkTypeRank);

        const networkName = js_helpers.v_NETWORK_TYPE[networkType] || 'Unknown';
        const networkGen = js_helpers.v_NETWORK_G_TYPE[networkTypeRank] || 'NA';

        const dataStateText = this.fn_getDataStateText(sig.m_dataState);
        const dataStateClass = this.fn_getDataStateClass(sig.m_dataState);

        return (
            <div key={this.key + 'extra_data'} className='row css_margin_zero padding_zero border-top border-secondary'>
                <div key={this.key + 'extra_data_1'} className="col-4">
                    <p key={this.key + 'extra_data_1p'} className="textunit_w135 user-select-all m-0 no-wrap">
                        <span>
                            <small>
                                <b>{t('signal_colon')}&nbsp;</b>
                                <span className={signalClass}><b>{level} dBm</b></span>
                                &nbsp;<span className='text-warning'>{networkGen}</span>
                                &nbsp;<span className='text-info'>[{networkName}]</span>
                            </small>
                        </span>
                    </p>
                </div>

                <div key={this.key + 'extra_data_2'} className="col-4">
                    <p key={this.key + 'extra_data_2p'} className="textunit_w135 user-select-all m-0 no-wrap">
                        <span>
                            <small>
                                <b>{t('operator_colon')}&nbsp;</b>
                                <span className='text-warning'>{sig.m_operatorName || '—'}</span>
                                {sig.m_countryIso && (
                                    <>&nbsp;<span className='text-info'>({sig.m_countryIso.toUpperCase()})</span></>
                                )}
                            </small>
                        </span>
                    </p>
                </div>

                <div key={this.key + 'extra_data_3'} className="col-4">
                    <p key={this.key + 'extra_data_3p'} className="textunit_w135 user-select-all m-0 no-wrap">
                        <span>
                            <small>
                                <b>{t('data_state_colon')}&nbsp;</b>
                                <span className={dataStateClass}><b>{dataStateText}</b></span>
                            </small>
                        </span>
                    </p>
                </div>
            </div>
        );
    }
}

const ClssAndruavExtraDataTranslated = withTranslation()(ClssAndruavExtraData);
export { ClssAndruavExtraDataTranslated as ClssAndruavExtraData };
