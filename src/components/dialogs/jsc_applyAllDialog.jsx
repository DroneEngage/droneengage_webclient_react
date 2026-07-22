import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssApplyAllDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            override_existing: false,
            apply_altitude: true,
            apply_frametype: false,
            apply_speed: false,
            altitude_value: 30,
            frametype_value: 3,
            speed_value: 5,
        };
        this.p_mission = null;
        this.p_callback = null;
        this.m_flag_mounted = false;
        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_displayApplyAllDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayApplyAllDialog, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted || !p_params) return;

        const { p_mission, p_callback } = p_params;
        p_me.p_mission = p_mission;
        p_me.p_callback = p_callback;

        // Get current values from first mission item if available
        const missionItems = p_mission.m_all_mission_items_shaps;
        let altitudeValue = 30;
        let frametypeValue = 3;
        let speedValue = 5;

        if (missionItems && missionItems.length > 0) {
            const firstItem = missionItems[0];
            if (firstItem.m_missionItem) {
                altitudeValue = firstItem.m_missionItem.alt || 30;
                frametypeValue = firstItem.m_missionItem.m_frameType || 3;
                if (firstItem.m_missionItem.m_speedRequired) {
                    speedValue = firstItem.m_missionItem.speed || 5;
                }
            }
        }

        p_me.setState({
            override_existing: false,
            apply_altitude: true,
            apply_frametype: false,
            apply_speed: false,
            altitude_value: altitudeValue,
            frametype_value: frametypeValue,
            speed_value: speedValue,
            is_open: true,
            m_update: p_me.state.m_update + 1,
        });
    }

    fn_closeDialog() {
        this.setState({ is_open: false });
    }

    fn_onConfirm() {
        if (!this.p_mission) return;

        const overrideExisting = this.state.override_existing;
        const applyAltitude = this.state.apply_altitude;
        const applyFrameType = this.state.apply_frametype;
        const applySpeed = this.state.apply_speed;

        const altitudeValue = parseFloat(this.state.altitude_value);
        const frameTypeValue = parseInt(this.state.frametype_value);
        const speedValue = parseFloat(this.state.speed_value);

        const defaultAltitude = 30;
        const missionItems = this.p_mission.m_all_mission_items_shaps;

        if (missionItems && missionItems.length > 0) {
            missionItems.forEach(marker => {
                if (marker.m_missionItem) {
                    if (applyAltitude && !isNaN(altitudeValue)) {
                        if (overrideExisting || marker.m_missionItem.alt === defaultAltitude) {
                            marker.m_missionItem.alt = altitudeValue;
                        }
                    }
                    if (applyFrameType) {
                        if (overrideExisting || marker.m_missionItem.m_frameType === undefined) {
                            marker.m_missionItem.m_frameType = frameTypeValue;
                        }
                    }
                    if (applySpeed && !isNaN(speedValue)) {
                        if (overrideExisting || !marker.m_missionItem.m_speedRequired) {
                            marker.m_missionItem.speed = speedValue;
                            marker.m_missionItem.m_speedRequired = true;
                        }
                    }
                }
            });

            this.p_mission.fn_updatePath(true);
        }

        if (this.p_callback) {
            this.p_callback();
        }
        this.fn_closeDialog();
    }

    fn_onCancel() {
        this.fn_closeDialog();
    }

    render() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;

        return this.fn_renderInPortal(
            <>
                {this.state.is_open && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
                <div
                    className={this.state.is_open ? "modal fade show" : "modal fade"}
                    style={{ display: this.state.is_open ? 'block' : 'none', zIndex: 1055 }}
                    id="apply_all_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            {this.fn_renderDialogHeader(tFunc('home:modal.applyAll.title', 'Apply Settings to All Mission Items'), 'bg-success')}
                            <div className="modal-body text-white">
                                <p className="text-warning">{tFunc('home:modal.applyAll.message', 'Select which settings to apply to all mission items:')}</p>
                                <div className="form-check mb-3 border-bottom pb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="chk_override_existing"
                                        checked={this.state.override_existing}
                                        onChange={(e) => this.setState({ override_existing: e.target.checked })}
                                    />
                                    <label className="form-check-label text-danger" htmlFor="chk_override_existing">
                                        <strong>{tFunc('home:modal.applyAll.override', 'Override existing values')}</strong>
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="chk_apply_altitude"
                                        checked={this.state.apply_altitude}
                                        onChange={(e) => this.setState({ apply_altitude: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="chk_apply_altitude">
                                        {tFunc('home:modal.applyAll.altitude', 'Altitude')}
                                    </label>
                                    <input
                                        type="number"
                                        id="txt_apply_altitude"
                                        className="form-control form-control-sm mt-1"
                                        placeholder={tFunc('home:modal.applyAll.altitudePlaceholder', 'Altitude (m)')}
                                        value={this.state.altitude_value}
                                        onChange={(e) => this.setState({ altitude_value: e.target.value })}
                                    />
                                </div>
                                <div className="form-check mt-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="chk_apply_frametype"
                                        checked={this.state.apply_frametype}
                                        onChange={(e) => this.setState({ apply_frametype: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="chk_apply_frametype">
                                        {tFunc('home:modal.applyAll.frameType', 'Frame Type')}
                                    </label>
                                    <select
                                        id="sel_apply_frametype"
                                        className="form-control form-control-sm mt-1"
                                        value={this.state.frametype_value}
                                        onChange={(e) => this.setState({ frametype_value: e.target.value })}
                                    >
                                        <option value="0">{tFunc('home:modal.applyAll.absolute', 'Absolute (MSL)')}</option>
                                        <option value="3">{tFunc('home:modal.applyAll.relative', 'Relative to Home')}</option>
                                        <option value="10">{tFunc('home:modal.applyAll.terrain', 'Terrain')}</option>
                                    </select>
                                </div>
                                <div className="form-check mt-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="chk_apply_speed"
                                        checked={this.state.apply_speed}
                                        onChange={(e) => this.setState({ apply_speed: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="chk_apply_speed">
                                        {tFunc('home:modal.applyAll.speed', 'Speed')}
                                    </label>
                                    <input
                                        type="number"
                                        id="txt_apply_speed"
                                        className="form-control form-control-sm mt-1"
                                        placeholder={tFunc('home:modal.applyAll.speedPlaceholder', 'Speed (m/s)')}
                                        value={this.state.speed_value}
                                        onChange={(e) => this.setState({ speed_value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    id="btnApplyAllCancel"
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => this.fn_onCancel()}
                                >
                                    {tFunc('home:modal.applyAll.cancel', 'Cancel')}
                                </button>
                                <button
                                    id="btnApplyAllConfirm"
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => this.fn_onConfirm()}
                                >
                                    {tFunc('home:modal.applyAll.apply', 'Apply to All')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default withTranslation('home')(ClssApplyAllDialog);
