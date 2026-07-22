import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import { js_globals } from '../../js/js_globals.js';
import { CONST_METER_TO_FEET } from '../../js/js_helpers.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssSpeedDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            p_andruavUnit: null,
            speed_value: '',
            dialog_type: 'speed', // 'speed' or 'port'
        };
        this.m_flag_mounted = false;
        this.key = Math.random().toString();
        this.modalRef = React.createRef();
        this.speedInputRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_displaySpeedDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displaySpeedDialog, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted) return;
        
        const { p_andruavUnit, p_initValue, p_onApply, p_dialogType } = p_params;
        let initSpeed = p_initValue || '';
        
        if (p_andruavUnit && !p_initValue) {
            if (p_andruavUnit.m_Nav_Info && p_andruavUnit.m_Nav_Info.p_UserDesired && p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed !== undefined) {
                initSpeed = p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed.toString();
            } else if (p_andruavUnit.m_Nav_Info && p_andruavUnit.m_Nav_Info.p_Location && p_andruavUnit.m_Nav_Info.p_Location.ground_speed !== undefined) {
                initSpeed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed.toString();
            }
        }
        
        p_me.setState({ 
            p_andruavUnit: p_andruavUnit,
            speed_value: initSpeed,
            dialog_type: p_dialogType || 'speed',
            is_open: true,
            m_update: p_me.state.m_update + 1 
        });
        p_me.p_onApply = p_onApply;

        setTimeout(() => {
            if (p_me.speedInputRef.current) {
                p_me.speedInputRef.current.focus();
            }
        }, 100);
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
        
        const value = this.speedInputRef.current.value;
        if (this.p_onApply) {
            this.p_onApply(this.state.p_andruavUnit, value);
        }
        this.fn_closeDialog();
    }

    fn_onCancel() {
        this.fn_closeDialog();
    }

    fn_handlePresetClick(p_value) {
        if (this.speedInputRef.current) {
            this.speedInputRef.current.value = p_value;
        }
    }

    fn_getSpeedPresets() {
        const isMetric = js_globals.v_useMetricSystem;
        if (isMetric) {
            return [
                { value: '5', label: '5m/s' },
                { value: '10', label: '10m/s' },
                { value: '15', label: '15m/s' },
                { value: '20', label: '20m/s' }
            ];
        } else {
            return [
                { value: '10', label: '10ft/s' },
                { value: '20', label: '20ft/s' },
                { value: '30', label: '30ft/s' },
                { value: '40', label: '40ft/s' }
            ];
        }
    }

    render() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        
        let unitName = 'Unknown';
        let title = 'Change Speed';
        let unitLabel = 'm/s';
        let placeholder = 'Enter speed';
        let showPresets = true;

        if (this.state.p_andruavUnit) {
            unitName = this.state.p_andruavUnit.m_unitName;
        }

        if (this.state.dialog_type === 'port') {
            title = 'Change Port';
            unitLabel = '';
            placeholder = 'Enter port';
            showPresets = false;
        } else {
            const isMetric = js_globals.v_useMetricSystem;
            unitLabel = isMetric ? 'm/s' : 'ft/s';
            placeholder = 'Enter speed';
            showPresets = true;
        }

        const presets = showPresets ? this.fn_getSpeedPresets() : [];

        return this.fn_renderInPortal(
            <>
                {this.state.is_open && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
                <div
                    className={this.state.is_open ? "modal fade show" : "modal fade"}
                    style={{ display: this.state.is_open ? 'block' : 'none', zIndex: 1055 }}
                    id="speed_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                <div className="modal-dialog">
                    <div className="modal-content">
                        {this.fn_renderDialogHeader(title + ' of ' + unitName, 'bg-warning')}
                        <div className="modal-body">
                            <div className="input-group">
                                <input
                                    id="txtSpeed"
                                    type="text"
                                    className="form-control rounded-3 me-3"
                                    placeholder={placeholder}
                                    aria-describedby="basic-addon2"
                                    ref={this.speedInputRef}
                                    defaultValue={this.state.speed_value}
                                />
                                {unitLabel && (
                                    <span id="txtSpeedUnit" className="input-group-addon">
                                        {unitLabel}
                                    </span>
                                )}
                            </div>
                            {showPresets && (
                                <div className="mt-2 d-flex flex-wrap gap-2">
                                    {presets.map((preset, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="btn btn-outline-primary btn-sm speed-preset"
                                            onClick={() => this.fn_handlePresetClick(preset.value)}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <div className="btn-group w-100 d-flex flex-wrap">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => this.fn_onCancel()}
                                >
                                    {tFunc('home:modal.speed.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    onClick={() => this.fn_onApply()}
                                >
                                    {tFunc('home:modal.speed.go', 'Go')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </>
        );
    }
}

export default withTranslation('home')(ClssSpeedDialog);
