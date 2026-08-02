import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import { js_globals } from '../../js/js_globals.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssMissionLoadDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            missions: [],
            selectedMissionId: null,
        };
        this.p_callback = null;
        this.p_deleteCallback = null;
        this.m_flag_mounted = false;
        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_displayMissionLoadDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayMissionLoadDialog, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted || !p_params) return;

        const { p_missions, p_callback, p_deleteCallback } = p_params;
        p_me.p_callback = p_callback;
        p_me.p_deleteCallback = p_deleteCallback || null;
        p_me.setState({
            missions: p_missions || [],
            selectedMissionId: null,
            is_open: true,
            m_update: p_me.state.m_update + 1,
        });
    }

    fn_closeDialog() {
        this.setState({ is_open: false });
    }

    fn_onSelect(missionId) {
        this.setState({ selectedMissionId: missionId });
    }

    fn_onLoad() {
        if (this.state.selectedMissionId == null) return;
        const mission = this.state.missions.find(m => m.id === this.state.selectedMissionId);
        if (mission && this.p_callback) {
            this.p_callback(mission);
        }
        this.fn_closeDialog();
    }

    fn_onCancel() {
        this.fn_closeDialog();
    }

    fn_onDelete(missionId) {
        const Me = this;
        const mission = this.state.missions.find(m => m.id === missionId);
        if (mission == null) return;

        const missionName = mission.name || mission.id;

        // Use confirmation via event dispatch to avoid importing js_main circular dep
        js_eventEmitter.fn_dispatch(js_event.EE_displayConfirmationDialog, {
            p_title: 'Delete Mission',
            p_message: 'Are you sure you want to delete "' + missionName + '" from cloud storage?',
            p_callback: function (p_approved) {
                if (p_approved === false) return;

                // Call delete API
                js_globals.v_andruavFacade.API_deleteMission(missionId);

                // Remove from local list immediately for responsive UI
                const remaining = Me.state.missions.filter(m => m.id !== missionId);
                Me.setState({
                    missions: remaining,
                    selectedMissionId: Me.state.selectedMissionId === missionId ? null : Me.state.selectedMissionId
                });

                if (Me.p_deleteCallback) {
                    Me.p_deleteCallback(missionId);
                }
            },
            p_yesCaption: 'Delete',
            p_style: 'bg-danger txt-theme-aware'
        });
    }

    fn_formatDate(timestamp) {
        if (!timestamp) return '';
        try {
            const d = new Date(timestamp * 1000);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        } catch {
            return '';
        }
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
                    id="mission_load_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            {this.fn_renderDialogHeader(tFunc('home:modal.missionLoad.title', 'Load Mission from Cloud'), 'bg-info')}
                            <div className="modal-body text-white">
                                {this.state.missions.length === 0 ? (
                                    <p className="text-warning">{tFunc('home:modal.missionLoad.noMissions', 'No saved missions found.')}</p>
                                ) : (
                                    <>
                                        <p className="text-warning mb-2">{tFunc('home:modal.missionLoad.selectPrompt', 'Select a mission to load:')}</p>
                                        <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {this.state.missions.map((mission) => (
                                                <div
                                                    key={mission.id}
                                                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${this.state.selectedMissionId === mission.id ? 'active' : ''}`}
                                                    onClick={() => this.fn_onSelect(mission.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex w-100 justify-content-between">
                                                            <strong>{mission.name || mission.id}</strong>
                                                            <small>{this.fn_formatDate(mission.created_at)}</small>
                                                        </div>
                                                        {mission.version != null && (
                                                            <small className="text-muted">v{mission.version}</small>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm ms-2"
                                                        onClick={(e) => { e.stopPropagation(); this.fn_onDelete(mission.id); }}
                                                        title="Delete this mission"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <div className="btn-group w-100 d-flex flex-wrap">
                                    <button
                                        id="btnMissionLoadCancel"
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => this.fn_onCancel()}
                                    >
                                        {tFunc('home:modal.missionLoad.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        id="btnMissionLoadConfirm"
                                        type="button"
                                        className="btn btn-info btn-sm"
                                        onClick={() => this.fn_onLoad()}
                                        disabled={this.state.selectedMissionId == null}
                                    >
                                        {tFunc('home:modal.missionLoad.load', 'Load')}
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

export default withTranslation('home')(ClssMissionLoadDialog);
