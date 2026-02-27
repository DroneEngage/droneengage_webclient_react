import 'jquery-ui-dist/jquery-ui.min.js';

import React from 'react';
import Draggable from "react-draggable";
import { withTranslation } from 'react-i18next';

import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'
import * as js_common from '../../js/js_common.js'
import { fn_gotoUnit_byPartyID } from '../../js/js_main.js'

class ClssViewLinkGimbal extends React.Component {

    constructor() {
        super();
        this.state = {
            'm_update': 0,
            'laser_on': false,
            'tracker_on': false,
            'ai_on': false,
            'current_vertical': 0,
            'current_horizontal': 0,
            'target_drone': null,
            'pending_vertical': 0,
            'pending_horizontal': 0,
        };

        this.m_flag_mounted = false;

        this.key = Math.random().toString();

        this.modal_ctrl_gimbal_dlg = React.createRef();

        // Replaced interval variables with range input

        js_eventEmitter.fn_subscribe(js_event.EE_displayViewLinkGimbal, this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_event.EE_hideViewLinkGimbal, this, this.fn_closeDialog);


    }


    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayViewLinkGimbal, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_hideViewLinkGimbal, this);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        this.fn_initDialog();
    }

    fn_displayDialog(p_me, p_session) {
        if (p_me.m_flag_mounted === false) return;

        p_me.state.p_session = p_session;

        p_me.setState({ 'm_update': p_me.state.m_update + 1 });

        p_me.modal_ctrl_gimbal_dlg.current.style.display = 'block';
    }

    fn_initDialog() {
        const me = this;
        this.modal_ctrl_gimbal_dlg.current.onmousedown = function (e) {
            me.modal_ctrl_gimbal_dlg.current.style.opacity = '1.0';
        };
        this.modal_ctrl_gimbal_dlg.current.onmouseover = function (e) {
            me.modal_ctrl_gimbal_dlg.current.style.opacity = '1.0';
        };
        this.modal_ctrl_gimbal_dlg.current.onmouseout = function (e) {
            if (me.opaque_clicked === false) {
                me.modal_ctrl_gimbal_dlg.current.style.opacity = '0.4';
            }
        };
        this.modal_ctrl_gimbal_dlg.current.style.display = 'none';
    }

    fn_closeDialog() {
        this.modal_ctrl_gimbal_dlg.current.style.opacity = '';
        this.modal_ctrl_gimbal_dlg.current.style.display = 'none';
        if ((this.state !== null && this.state !== undefined) && (this.state.hasOwnProperty('p_session') === true)) {
            this.state.p_session = null;
        }

        this.setState({
            laser_on: false,
            tracker_on: false,
            ai_on: false,
            target_drone: null,
            pending_vertical: null,
            pending_horizontal: null
        });
    }

    fn_opacityDialog() {
        if (this.opaque_clicked === true) {
            this.opaque_clicked = false;
        }
        else {
            this.opaque_clicked = true;
            this.modal_ctrl_gimbal_dlg.current.style.opacity = '1.0';
        }
    }

    fn_toggleLaser() {
        const new_laser_state = !this.state.laser_on;
        this.setState({ laser_on: new_laser_state });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Laser_Control(p_andruavUnit, 1, new_laser_state ? 1 : 0); 
        }
    }

    fn_toggleTracker() {
        const new_tracker_state = !this.state.tracker_on;
        this.setState({ tracker_on: new_tracker_state });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Tracker_Control(p_andruavUnit, 1, new_tracker_state ? 1 : 0); 
        }
    }

    fn_toggleAI() {
        const new_ai_state = !this.state.ai_on;
        this.setState({ ai_on: new_ai_state });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_AI_Control(p_andruavUnit, 1, new_ai_state ? 1 : 0); 
        }
    }

    fn_setTargetDrone(p_unit) {
        this.setState({ target_drone: p_unit });
    }

    fn_gotoUnit() {
        if (this.state.p_session && this.state.p_session.m_unit) {
            fn_gotoUnit_byPartyID(this.state.p_session.m_unit.getPartyID());
        }
    }

    // Removed progress functions for range inputs

    handleVerticalChange(e) {
        const val = parseInt(e.target.value, 10);
        this.setState({ current_vertical: val, pending_vertical: val });
    }

    handleHorizontalChange(e) {
        const val = parseInt(e.target.value, 10);
        this.setState({ current_horizontal: val, pending_horizontal: val });
    }

    handleVerticalRelease() {
        if (this.state.pending_vertical !== null) {
            this.sendOrientation(this.state.pending_vertical, this.state.current_horizontal);
            this.setState({ pending_vertical: null });
        }
    }

    handleHorizontalRelease() {
        if (this.state.pending_horizontal !== null) {
            this.sendOrientation(this.state.current_vertical, this.state.pending_horizontal);
            this.setState({ pending_horizontal: null });
        }
    }

    fn_readCurrentOrientation() {
        // This function reads the current orientation
        // For now, I'll just log the current values
        js_common.fn_console_log('Current Orientation - Vertical:', this.state.current_vertical, 'Horizontal:', this.state.current_horizontal);

        // You can add additional logic here to actually read from hardware or API
        // For example:
        // js_globals.v_andruavFacade.API_ReadLaserOrientation(this.state.p_session?.m_unit);
    }

    sendOrientation(vertical, horizontal) {
        // This function sends the orientation values
        js_common.fn_console_log('Sending Orientation - Vertical:', vertical, 'Horizontal:', horizontal);

        // Send to target drone if selected, otherwise send to current unit
        const targetUnit = this.state.target_drone || (this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null);
        if (targetUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Gimbal_Control(targetUnit, 1, vertical, horizontal, 0); 
        }
    }

    render() {
        const { t } = this.props;
        let p_andruavUnit = null;

        if (this.state.p_session) {
            p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID());
        }

        const isNoUnit = p_andruavUnit === null;

        const v_units = (js_globals.m_andruavUnitList && js_globals.m_andruavUnitList.fn_getUnitValues()) ? js_globals.m_andruavUnitList.fn_getUnitValues() : [];
        const len = v_units.length;
        const c_items = [];

        for (let i = 0; i < len; ++i) {
            const v_unit = v_units[i];

            // Don't show the currently selected unit in the dropdown for sending if it's the exact same unit.
            // Actually, we probably do want to allow sending to any existing unit since Gimbal Control
            // may not be "bound" to a target out of the box. But we follow the standard logic:
            c_items.push(
                <a
                    key={"drone_" + v_unit.getPartyID()}
                    className="dropdown-item"
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        this.fn_setTargetDrone(v_unit);
                    }}
                >
                    {v_unit.m_unitName}
                </a>
            );
        }

        return (
            <Draggable nodeRef={this.modal_ctrl_gimbal_dlg} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
                <div key={this.key + "modal_ctrl_gimbal_dlg"} id="modal_ctrl_gimbal_dlg" title={t('gimbal_control')} className="card css_ontop border-light p-2" ref={this.modal_ctrl_gimbal_dlg}>
                    <div className="card-header text-center js-draggable-handle">
                        <div className="row">
                            <div className="col-10">
                                <h4 className="text-success text-start">
                                    {isNoUnit
                                        ? t('gimbal_control')
                                        : `${t('gimbal_control')} ${this.state.p_session?.m_unit.m_unitName}`}
                                </h4>
                            </div>
                            <div className="col-2 float-right">
                                <button id="btnclose" type="button" className="btn-close" onClick={() => this.fn_closeDialog()}></button>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        {isNoUnit ? (
                            <div key='laser-card-body'>
                                <p>{t('no_unit_selected')}</p>
                            </div>
                        ) : (
                            <div className='row'>
                                <div className="col-12">
                                    {/* Action Buttons Row */}
                                    <div className="form-group mb-3 d-flex gap-2 justify-content-between">
                                        {/* Laser On/Off Button */}
                                        <button
                                            id="btn_laser_toggle"
                                            type="button"
                                            className={`btn flex-fill ${this.state.laser_on ? 'btn-danger' : 'btn-success'}`}
                                            onClick={() => this.fn_toggleLaser()}
                                        >
                                            {this.state.laser_on ? t('laser_off') : t('laser_on')}
                                        </button>

                                        {/* Tracker On/Off Button */}
                                        <button
                                            id="btn_tracker_toggle"
                                            type="button"
                                            className={`btn flex-fill ${this.state.tracker_on ? 'btn-danger' : 'btn-success'}`}
                                            onClick={() => this.fn_toggleTracker()}
                                        >
                                            {this.state.tracker_on ? t('tracker_off') : t('tracker_on')}
                                        </button>

                                        {/* AI On/Off Button */}
                                        <button
                                            id="btn_ai_toggle"
                                            type="button"
                                            className={`btn flex-fill ${this.state.ai_on ? 'btn-danger' : 'btn-success'}`}
                                            onClick={() => this.fn_toggleAI()}
                                        >
                                            {this.state.ai_on ? t('ai_off') : t('ai_on')}
                                        </button>
                                    </div>

                                    {/* Current Orientation Display */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">{t('current_orientation')}</label>
                                        <div className="row">
                                            <div className="col-6">
                                                <small className="text-muted">{t('vertical')} {this.state.current_vertical}</small>
                                            </div>
                                            <div className="col-6">
                                                <small className="text-muted">{t('horizontal')} {this.state.current_horizontal}</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vertical Control */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">{t('vertical_control')}</label>
                                        <input
                                            type="range"
                                            className="form-range"
                                            min="-500"
                                            max="500"
                                            value={this.state.current_vertical}
                                            onChange={this.handleVerticalChange.bind(this)}
                                            onMouseUp={this.handleVerticalRelease.bind(this)}
                                            onTouchEnd={this.handleVerticalRelease.bind(this)}
                                            style={{ width: "100%" }}
                                        />
                                    </div>

                                    {/* Horizontal Control */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">{t('horizontal_control')}</label>
                                        <input
                                            type="range"
                                            className="form-range"
                                            min="-500"
                                            max="500"
                                            value={this.state.current_horizontal}
                                            onChange={this.handleHorizontalChange.bind(this)}
                                            onMouseUp={this.handleHorizontalRelease.bind(this)}
                                            onTouchEnd={this.handleHorizontalRelease.bind(this)}
                                            style={{ width: "100%" }}
                                        />
                                    </div>

                                    {/* Read Orientation and Target Drone Selector Buttons */}
                                    <div className="form-group mb-3 d-flex gap-2">
                                        <button
                                            id="btn_read_orientation"
                                            type="button"
                                            className="btn btn-info flex-fill"
                                            onClick={() => this.fn_readCurrentOrientation()}
                                        >
                                            {t('read_current_orientation')}
                                        </button>

                                        <div className="btn-group flex-fill" role="group" aria-label="Send to Drone">
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => {
                                                    if (this.state.target_drone) {
                                                        this.sendOrientation(this.state.current_vertical, this.state.current_horizontal);
                                                    }
                                                }}
                                            >
                                                {t('send_to')}{this.state.target_drone ? this.state.target_drone.m_unitName : t('drone')}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary dropdown-toggle dropdown-toggle-split"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                            ></button>
                                            <div className="dropdown-menu">
                                                {c_items}
                                                <div className="dropdown-divider"></div>
                                                <a className="dropdown-item text-danger" href="#" onClick={() => this.setState({ target_drone: null })}>
                                                    {t('clear_selection')}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isNoUnit && (
                        <div id="modal_gimbal_footer" className="form-group text-center">
                            <div className="row">
                                <div className="btn-group w-100 d-flex flex-wrap">
                                    <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" onClick={() => this.fn_opacityDialog()}>{t('opaque')}</button>
                                    <button id="btnGoto" type="button" className="btn btn-sm btn-success" onClick={(e) => this.fn_gotoUnit(e)}>{t('goto', 'Goto')}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Draggable>
        );
    }
}

export default withTranslation('viewLinkGimbalControl')(ClssViewLinkGimbal);
