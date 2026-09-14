import React from 'react';
import * as js_session from '../../../js/state/session.js';
import { EventBridge } from '../../../js/hooks/EventBridge.jsx';
import { EVENTS as js_event } from '../../../js/events/js_eventList.js';
import * as js_andruavMessages from '../../../js/protocol/messages/js_andruavMessages.js';

import { js_localStorage } from '../../../js/state/js_localStorage.js'

const SMS_RESULT_TIMEOUT_MS = 12000;
const SMS_RESULT_DISPLAY_MS = 5000;

export class ClssCtrlAndruavCtrl extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_flashActive: false,
            m_sirenActive: false,
            m_smsPending: false,
            m_smsResult: null,
            m_smsResultText: null
        };

        this.m_flag_mounted = false;

        this.m_smsNumberRef = React.createRef();
        this.m_smsTimeoutId = null;
        this.m_smsResultTimeoutId = null;

        // NOTE: this component previously subscribed to EE_BattViewToggle
        // with this.fn_toggle_global, but fn_toggle_global was never
        // defined here (copy-paste from jsc_ctrl_battery.jsx), so the
        // subscription was a no-op (fn_subscribe guards against a null
        // callback). Removed rather than migrated to useEventSubscription.
    }


    componentDidMount() {
        this.m_flag_mounted = true;
        if (this.m_smsNumberRef.current) {
            this.m_smsNumberRef.current.value = js_localStorage.fn_getSMSPhoneNumber();
        }
    }

    componentWillUnmount () {
        this.m_flag_mounted = false;
        if (this.m_smsTimeoutId !== null) clearTimeout(this.m_smsTimeoutId);
        if (this.m_smsResultTimeoutId !== null) clearTimeout(this.m_smsResultTimeoutId);
    }

    fn_makeFlash(p_andruavUnit) {
        js_session.fn_getAndruavFacade().API_makeFlash(p_andruavUnit);
        this.setState((s) => ({ m_flashActive: !s.m_flashActive }));
    }

    fn_makeSiren(p_andruavUnit) {
        js_session.fn_getAndruavFacade().API_makeSiren(p_andruavUnit);
        this.setState((s) => ({ m_sirenActive: !s.m_sirenActive }));
    }

    fn_sendSMS(p_andruavUnit) {
        const p_phoneNumber = this.m_smsNumberRef.current.value;
        js_session.fn_getAndruavFacade().API_sendSMSLocation(p_andruavUnit, p_phoneNumber);

        if (this.m_smsTimeoutId !== null) clearTimeout(this.m_smsTimeoutId);
        if (this.m_smsResultTimeoutId !== null) clearTimeout(this.m_smsResultTimeoutId);
        this.setState({ m_smsPending: true, m_smsResult: null, m_smsResultText: null });
        this.m_smsTimeoutId = setTimeout(() => {
            this.m_smsTimeoutId = null;
            if (this.m_flag_mounted) {
                this.setState({ m_smsPending: false, m_smsResult: 'timeout', m_smsResultText: 'no reply' });
                this.m_smsResultTimeoutId = setTimeout(() => {
                    this.m_smsResultTimeoutId = null;
                    if (this.m_flag_mounted) this.setState({ m_smsResult: null, m_smsResultText: null });
                }, SMS_RESULT_DISPLAY_MS);
            }
        }, SMS_RESULT_TIMEOUT_MS);
    }

    fn_onRemoteExecuteResult(p_andruavUnit, p_data) {
        if ((p_data === null) || (p_data === undefined)) return;
        if ((p_data.unit === null) || (p_data.unit === undefined)) return;
        if (p_data.unit.getPartyID() !== p_andruavUnit.getPartyID()) return;
        if ((p_data.result === null) || (p_data.result === undefined)) return;
        if (p_data.result.C !== js_andruavMessages.CONST_RemoteCommand_SMSwGPS) return;
        if (this.state.m_smsPending !== true) return;

        if (this.m_smsTimeoutId !== null) {
            clearTimeout(this.m_smsTimeoutId);
            this.m_smsTimeoutId = null;
        }
        const v_ok = (p_data.result.er === 0);
        this.setState({
            m_smsPending: false,
            m_smsResult: v_ok ? 'ok' : 'error',
            m_smsResultText: v_ok ? 'sent' : ((p_data.result.DS !== null && p_data.result.DS !== undefined) ? p_data.result.DS : 'error')
        });
        this.m_smsResultTimeoutId = setTimeout(() => {
            this.m_smsResultTimeoutId = null;
            if (this.m_flag_mounted) this.setState({ m_smsResult: null, m_smsResultText: null });
        }, SMS_RESULT_DISPLAY_MS);
    }

    fn_saveSMSNumber() {
        js_localStorage.fn_setSMSPhoneNumber(this.m_smsNumberRef.current.value);
    }

    render() {
        const v_andruavUnit = this.props.p_unit;
        const id = v_andruavUnit.getPartyID() + "_ctl_andruav_ctrl";
        const smsBtnClass = this.state.m_smsPending ? "btn-warning"
            : (this.state.m_smsResult === 'ok') ? "btn-success"
            : (this.state.m_smsResult === 'error') ? "btn-danger"
            : "btn-primary";
        return (
            <div id={id} key={id} className="ms-1">
                <EventBridge eventName={js_event.EE_unitRemoteExecuteResult} onEvent={(p_data) => this.fn_onRemoteExecuteResult(v_andruavUnit, p_data)} />
                <div className="row mt-2 mb-3">
                    <div className="col-12 d-flex align-items-center gap-2 flex-wrap">
                        <button type="button"
                            className={"btn btn-sm " + (this.state.m_flashActive ? "btn-warning active" : "btn-outline-warning")}
                            title='Toggle Flash'
                            aria-pressed={this.state.m_flashActive}
                            onClick={() => this.fn_makeFlash(v_andruavUnit)}>Flash</button>

                        <button type="button"
                            className={"btn btn-sm " + (this.state.m_sirenActive ? "btn-danger active" : "btn-outline-danger")}
                            title='Toggle Siren'
                            aria-pressed={this.state.m_sirenActive}
                            onClick={() => this.fn_makeSiren(v_andruavUnit)}>Siren</button>

                        <input type="text"
                            ref={this.m_smsNumberRef}
                            className="form-control form-control-sm"
                            style={{ maxWidth: '180px' }}
                            placeholder="Phone number"
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onChange={() => this.fn_saveSMSNumber()}
                            onBlur={() => this.fn_saveSMSNumber()} />

                        <button type="button"
                            className={"btn btn-sm " + smsBtnClass}
                            title='Send SMS with GPS location'
                            disabled={this.state.m_smsPending}
                            onClick={() => this.fn_sendSMS(v_andruavUnit)}>Send SMS</button>

                        {(this.state.m_smsPending === true || this.state.m_smsResultText !== null) &&
                            <span className={"small " + (this.state.m_smsPending ? "text-warning"
                                : (this.state.m_smsResult === 'ok') ? "text-success"
                                : (this.state.m_smsResult === 'error') ? "text-danger"
                                : "text-muted")}>
                                {this.state.m_smsPending ? "sending…" : this.state.m_smsResultText}
                            </span>}
                    </div>
                </div>
            </div>
        );
    }
}
