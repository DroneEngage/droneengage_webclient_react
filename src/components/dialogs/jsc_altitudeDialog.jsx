import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import { js_globals } from '../../js/js_globals.js';
import { CONST_METER_TO_FEET } from '../../js/js_helpers.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssAltitudeDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            p_andruavUnit: null,
            altitude_value: '',
            style: 'bg-warning',
        };
        this.m_flag_mounted = false;
        this.key = Math.random().toString();
        this.modalRef = React.createRef();
        this.altitudeInputRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_displayAltitudeDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayAltitudeDialog, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted) return;
        
        const { p_andruavUnit, p_onApply, p_style } = p_params;
        let initAltitude = '';
        
        if (p_andruavUnit && p_andruavUnit.m_Nav_Info && p_andruavUnit.m_Nav_Info.p_Location) {
            if (p_andruavUnit.m_Nav_Info.p_Location.alt_relative !== undefined) {
                initAltitude = p_andruavUnit.m_Nav_Info.p_Location.alt_relative.toString();
            } else if (p_andruavUnit.m_Nav_Info.p_Location.alt_abs !== undefined) {
                initAltitude = p_andruavUnit.m_Nav_Info.p_Location.alt_abs.toString();
            }
        }
        
        p_me.setState({ 
            p_andruavUnit: p_andruavUnit,
            altitude_value: initAltitude,
            style: p_style || 'bg-warning',
            is_open: true,
            m_update: p_me.state.m_update + 1 
        });
        p_me.p_onApply = p_onApply;

        setTimeout(() => {
            if (p_me.altitudeInputRef.current) {
                p_me.altitudeInputRef.current.focus();
            }
        }, 100);
    }

    fn_isCompact() {
        return this.props.p_compact === true;
    }

    fn_closeDialog() {
        this.setState({ is_open: false, p_andruavUnit: null });
    }

    fn_getCurrentPartyID() {
        if (this.state.p_andruavUnit) {
            return this.state.p_andruavUnit.getPartyID();
        }
        return null;
    }

    fn_onApply() {
        if (!this.state.p_andruavUnit) return;
        
        const altitude = this.altitudeInputRef.current.value;
        if (this.p_onApply) {
            this.p_onApply(this.state.p_andruavUnit, altitude);
        }
        this.fn_closeDialog();
    }

    fn_onCancel() {
        this.fn_closeDialog();
    }

    fn_onPresetAltitude(p_meters) {
        const isMetric = js_globals.v_useMetricSystem;
        const value = isMetric ? p_meters : Math.round(p_meters * CONST_METER_TO_FEET);
        if (this.altitudeInputRef.current) {
            this.altitudeInputRef.current.value = value.toString();
        }
    }

    render() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        
        let unitName = 'Unknown';
        if (this.state.p_andruavUnit) {
            unitName = this.state.p_andruavUnit.m_unitName;
        }

        const isMetric = js_globals.v_useMetricSystem;
        const unitLabel = isMetric ? 'm' : 'ft';
        const isCompact = this.fn_isCompact();

        const presetButtons = (
            <div className="d-flex flex-wrap gap-1 mt-2 mb-2 pe-1 ps-1">
                {[1, 3, 5, 50, 100].map((meters) => {
                    const value = isMetric ? meters : Math.round(meters * CONST_METER_TO_FEET);
                    return (
                        <button
                            key={meters}
                            type="button"
                            className="btn btn-outline-primary btn-sm flex-fill"
                            onClick={() => this.fn_onPresetAltitude(meters)}
                        >
                            {value}{unitLabel}
                        </button>
                    );
                })}
            </div>
        );

        const inputField = (
            <div className="input-group">
                <input
                    id="txtAltitude"
                    type="text"
                    className="form-control"
                    placeholder={tFunc('home:modal.altitude.placeholder', 'Enter altitude')}
                    aria-describedby="basic-addon2"
                    ref={this.altitudeInputRef}
                    defaultValue={this.state.altitude_value}
                />
                <span className="input-group-addon ms-2">{unitLabel}</span>
            </div>
        );

        const actionButtons = (
            <div className="btn-group w-100 d-flex flex-wrap">
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => this.fn_onCancel()}
                >
                    {tFunc('home:modal.altitude.cancel', 'Cancel')}
                </button>
                <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => this.fn_onApply()}
                >
                    {tFunc('home:modal.altitude.go', 'Go')}
                </button>
            </div>
        );

        // Compact mode: render as mobile bottom sheet
        if (isCompact) {
            if (!this.state.is_open) return null;

            return this.fn_renderInPortal(
                <div className="mobile-sheet-backdrop" onClick={() => this.fn_onCancel()}>
                    <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-sheet-handle" />
                        <div className="mobile-sheet-header">
                            <span className="mobile-sheet-title">
                                <i className="bi bi-arrow-up-circle" /> {tFunc('home:modal.altitude.title', 'Change Altitude of ' + unitName)}
                            </span>
                            <button className="mobile-sheet-close" onClick={() => this.fn_onCancel()}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <div className="mobile-sheet-body">
                            {inputField}
                            {presetButtons}
                            {actionButtons}
                        </div>
                    </div>
                </div>
            );
        }

        // Desktop mode: render as modal dialog
        return this.fn_renderInPortal(
            <>
                {this.state.is_open && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
                <div
                    className={this.state.is_open ? "modal fade show" : "modal fade"}
                    style={{ display: this.state.is_open ? 'block' : 'none', zIndex: 1055 }}
                    id="altitude_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                <div className="modal-dialog">
                    <div className="modal-content">
                        {this.fn_renderDialogHeader(tFunc('home:modal.altitude.title', 'Change Altitude of ' + unitName), this.state.style)}
                        <div className="modal-body">
                            {inputField}
                        </div>
                        {presetButtons}
                        <div className="modal-footer">
                            {actionButtons}
                        </div>
                    </div>
                </div>
                </div>
            </>
        );
    }
}

export default withTranslation('home')(ClssAltitudeDialog);
