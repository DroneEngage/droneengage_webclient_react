import React from 'react';

import { js_globals } from '../../../js/js_globals.js';
import { EVENTS as js_event } from '../../../js/js_eventList.js'
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'
import { js_localStorage } from '../../../js/js_localStorage.js'

export class ClssCtrlAndruavCtrl extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_flashActive: false,
            m_sirenActive: false
        };

        this.m_flag_mounted = false;

        this.m_smsNumberRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_BattViewToggle, this, this.fn_toggle_global);
    }


    componentDidMount() {
        this.m_flag_mounted = true;
        if (this.m_smsNumberRef.current) {
            this.m_smsNumberRef.current.value = js_localStorage.fn_getSMSPhoneNumber();
        }
    }

    fn_makeFlash(p_andruavUnit) {
        js_globals.v_andruavFacade.API_makeFlash(p_andruavUnit);
        this.setState((s) => ({ m_flashActive: !s.m_flashActive }));
    }

    fn_makeSiren(p_andruavUnit) {
        js_globals.v_andruavFacade.API_makeSiren(p_andruavUnit);
        this.setState((s) => ({ m_sirenActive: !s.m_sirenActive }));
    }

    fn_sendSMS(p_andruavUnit) {
        const p_phoneNumber = this.m_smsNumberRef.current.value;
        js_globals.v_andruavFacade.API_sendSMSLocation(p_andruavUnit, p_phoneNumber);
    }

    fn_saveSMSNumber() {
        js_localStorage.fn_setSMSPhoneNumber(this.m_smsNumberRef.current.value);
    }

    render() {
        const v_andruavUnit = this.props.p_unit;
        const id = v_andruavUnit.getPartyID() + "_ctl_andruav_ctrl";
        return (
            <div id={id} key={id} className="ms-1">
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
                            className="btn btn-sm btn-primary"
                            title='Send SMS with GPS location'
                            onClick={() => this.fn_sendSMS(v_andruavUnit)}>Send SMS</button>
                    </div>
                </div>
            </div>
        );
    }
}
