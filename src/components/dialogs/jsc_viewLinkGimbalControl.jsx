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
import { Class_2D_Joystick } from '../micro_gadgets/jsc_mctrl_2d_joystick';
import {
    VIEWLINK_CAMERA_ACTIVATE_EO,
    VIEWLINK_CAMERA_ACTIVATE_IR,
    VIEWLINK_CAMERA_ACTIVATE_PIP,
    VIEWLINK_CAMERA_ACTIVATE_PIP_IR,
    VIEWLINK_TRACKER_OFF,
    VIEWLINK_TRACKER_ON,
    VIEWLINK_AI_OFF,
    VIEWLINK_AI_ON,
    VIEWLINK_LASER_OFF,
    VIEWLINK_LASER_ON,
    VIEWLINK_CAMERA_SET_IR_DIGITAL_ZOOM_LEVEL
} from '../../js/protocol/js_andruavMessages.js';

class ClssViewLinkGimbal extends React.Component {

    constructor() {
        super();
        this.state = {
            'm_update': 0,
            'laser_on': VIEWLINK_LASER_OFF,
            'tracker_on': VIEWLINK_TRACKER_OFF,
            'ai_on': VIEWLINK_AI_OFF,
            'current_vertical': 0,
            'current_horizontal': 0,
            'target_drone': null,
            'current_view_mode': 'EO', // EO, IR, PIP, PIP_IR
            'ir_hot': 'WHITE',
            'zoomLevel': 1.0,
            'irDigitalZoomLevel': 1.0,
            'gimbal_yaw': 0,
            'gimbal_pitch': 0,
            'gimbal_roll': 0,
            'lrf_distance_m': 0,
            'lrf_age_seconds': 0,
            'lrf_status_text': '',
            'tracking_status': 0,
            'tracking_status_text': '',
            'tracking_target_type': 0,
            'tracking_target_type_text': ''
        };

        this.m_flag_mounted = false;

        this.key = Math.random().toString();

        this.modal_ctrl_gimbal_dlg = React.createRef();

        // Replaced interval variables with range input

        js_eventEmitter.fn_subscribe(js_event.EE_displayViewLinkGimbal, this, this.fn_displayDialog);
        js_eventEmitter.fn_subscribe(js_event.EE_hideViewLinkGimbal, this, this.fn_closeDialog);
        js_eventEmitter.fn_subscribe(js_event.EE_viewLinkGimbalAttitude, this, this.fn_onGimbalAttitude);


    }


    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayViewLinkGimbal, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_hideViewLinkGimbal, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_viewLinkGimbalAttitude, this);
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
            laser_on: VIEWLINK_LASER_OFF,
            tracker_on: VIEWLINK_TRACKER_OFF,
            ai_on: VIEWLINK_AI_OFF,
            target_drone: null,
            current_vertical: 0,
            current_horizontal: 0,
            current_view_mode: 'EO',
            zoomLevel: 1.0,
            irDigitalZoomLevel: 1.0
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
        const new_laser_state = this.state.laser_on === VIEWLINK_LASER_OFF ? VIEWLINK_LASER_ON : VIEWLINK_LASER_OFF;
        this.setState({ laser_on: new_laser_state });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Laser_Control(p_andruavUnit, new_laser_state);
        }
    }

    fn_toggleTracker() {
        const new_tracker_state = this.state.tracker_on === VIEWLINK_TRACKER_OFF ? VIEWLINK_TRACKER_ON : VIEWLINK_TRACKER_OFF;
        this.setState({ tracker_on: new_tracker_state });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Tracker_Control(p_andruavUnit, new_tracker_state);
        }
    }

    fn_toggleAI() {
        const new_ai_state = this.state.ai_on === VIEWLINK_AI_OFF ? VIEWLINK_AI_ON : VIEWLINK_AI_OFF;
        this.setState({ ai_on: new_ai_state });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_AI_Control(p_andruavUnit, new_ai_state);
        }
    }

    fn_toggleIRHot() {
        const new_ir_hot_state = this.state.ir_hot === 'WHITE' ? 'BLACK' : 'WHITE';
        this.setState({ ir_hot: new_ir_hot_state });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Set_IR_HOT(p_andruavUnit, new_ir_hot_state === 'WHITE');
        }
    }

    fn_toggleViewMode() {
        const viewModes = ['EO', 'IR', 'PIP', 'PIP_IR'];
        const viewModeConstants = {
            'EO': VIEWLINK_CAMERA_ACTIVATE_EO,
            'IR': VIEWLINK_CAMERA_ACTIVATE_IR,
            'PIP': VIEWLINK_CAMERA_ACTIVATE_PIP,
            'PIP_IR': VIEWLINK_CAMERA_ACTIVATE_PIP_IR
        };

        const currentIndex = viewModes.indexOf(this.state.current_view_mode);
        const nextIndex = (currentIndex + 1) % viewModes.length;
        const nextMode = viewModes[nextIndex];
        const nextModeConstant = viewModeConstants[nextMode];

        this.setState({ current_view_mode: nextMode });
        js_common.fn_console_log('View mode changed to:', nextMode, 'Constant:', nextModeConstant);

        // Send view mode command to drone
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Camera_Control(p_andruavUnit, nextModeConstant);
        }
    }

    fn_getGimbalPosition() {
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Get_Status_Gimbal_Attitude(p_andruavUnit);
        }
    }

    fn_getAllStatus() {
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Get_Status_All(p_andruavUnit);
        }
    }

    fn_getViewModeButtonColor() {
        const colorMap = {
            'EO': 'btn-primary',
            'IR': 'btn-warning',
            'PIP': 'btn-info',
            'PIP_IR': 'btn-success'
        };
        return colorMap[this.state.current_view_mode] || 'btn-primary';
    }

    fn_onGimbalAttitude(p_me, p_status) {
        if (p_me.m_flag_mounted === false) return;
        
        const c_gimbal = (p_status && p_status.gm) ? p_status.gm : p_status;
        p_me.setState({
            gimbal_yaw: c_gimbal.y,
            gimbal_pitch: c_gimbal.p,
            gimbal_roll: c_gimbal.r
        });
        const LRF = (p_status && p_status.lrf) ? p_status.lrf : {};
        const lrf_age_seconds = LRF.a;
        const lrf_distance_m = LRF.d;
        const lrf_status_text = LRF.s;

        const ai = (p_status && p_status.ai) ? p_status.ai : {};
        const ai_targets_len = ai.tc;
        const ai_targets = ai.t;
        
        const tracking = (p_status && p_status.tr) ? p_status.tr : {};
        const tracking_status = tracking.s;
        const tracking_status_text = tracking.st;
        const tracking_target_type = tracking.tt;
        const tracking_target_type_text = tracking.ttt;

        p_me.setState({
            lrf_distance_m: lrf_distance_m,
            lrf_age_seconds: lrf_age_seconds,
            lrf_status_text: lrf_status_text,
            tracking_status: tracking_status,
            tracking_status_text: tracking_status_text,
            tracking_target_type: tracking_target_type,
            tracking_target_type_text: tracking_target_type_text
        });

        console.log('LRF', LRF);
        console.log('ai', ai);
    }

    fn_setIRDigitalZoomLevel(irDigitalZoomLevel) {
        this.setState({ irDigitalZoomLevel: irDigitalZoomLevel });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Camera_IR_Digital_Zoom_Control(p_andruavUnit, irDigitalZoomLevel);
        }
    }

    handleIRDigitalZoomMouseUp = (e) => {
        const irDigitalZoomLevel = parseFloat(e.target.value);
        this.fn_setIRDigitalZoomLevel(irDigitalZoomLevel);
    }

    handleIRDigitalZoomChange = (e) => {
        this.setState({ irDigitalZoomLevel: parseFloat(e.target.value) });
    }

    fn_setZoomLevel(zoomLevel) {
        this.setState({ zoomLevel: zoomLevel });
        const p_andruavUnit = this.state.p_session ? js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID()) : null;
        if (p_andruavUnit) {
            js_globals.v_andruavFacade.API_do_ViewLink_Camera_Zoom_Control(p_andruavUnit, zoomLevel);
        }
    }

    handleZoomMouseUp = (e) => {
        const zoomLevel = parseFloat(e.target.value);
        this.fn_setZoomLevel(zoomLevel);
    }

    handleZoomChange = (e) => {
        this.setState({ zoomLevel: parseFloat(e.target.value) });
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

    handleJoystickDrag = (horizontal, vertical) => {
        // Map joystick coordinates to gimbal control (keep float precision)
        // Joystick X = horizontal, Y = vertical
        this.setState({
            current_horizontal: horizontal,
            current_vertical: vertical
        });
    }

    handleJoystickRelease = (horizontal, vertical) => {
        // Update state and send orientation when joystick is released (keep float precision)
        this.setState({
            current_horizontal: horizontal,
            current_vertical: vertical
        });
        this.sendOrientation(horizontal, vertical);
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
            js_globals.v_andruavFacade.API_do_ViewLink_Gimbal_Control_Absolute_Position(targetUnit, horizontal, vertical);
        }
    }

    render() {
        const { t } = this.props;
        let p_andruavUnit = null;

        if (this.state.p_session) {
            p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.p_session.m_unit.getPartyID());
        }

        const isNoUnit = p_andruavUnit === null;

        const lrfAgeDisplay = Number.isFinite(this.state.lrf_age_seconds)
            ? (this.state.lrf_age_seconds > 99
                ? 'X'
                : Math.max(0, Math.floor(this.state.lrf_age_seconds)).toString().padStart(2, '0'))
            : 'X';

        const lrfDistanceDisplay = Number.isFinite(this.state.lrf_distance_m)
            ? this.state.lrf_distance_m.toFixed(2)
            : '-';

        const trackingStatusClass = (this.state.tracking_status_text && this.state.tracking_status_text.toLowerCase() === 'stopped')
            ? 'bg-success'
            : 'bg-danger';

        const trackingTypeClass = (this.state.tracking_target_type_text && this.state.tracking_target_type_text.toLowerCase() === 'none')
            ? 'bg-secondary'
            : 'bg-info';

        const v_units = (js_globals.m_andruavUnitList && js_globals.m_andruavUnitList.fn_getUnitValues()) ? js_globals.m_andruavUnitList.fn_getUnitValues() : [];
        const len = v_units.length;
        const c_items = [];

        for (let i = 0; i < len; ++i) {
            const v_unit = v_units[i];

            // Don't show the currently selected unit in the dropdown for sending if it's the exact same unit.
            // Actually, we probably do want to allow sending to any existing unit since Gimbal Control
            // may not be "bound" to a target out of the box. But we follow the standard logic:
            c_items.push(
                <li key={"drone_" + v_unit.getPartyID()}>
                    <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            this.fn_setTargetDrone(v_unit);
                        }}
                    >
                        {v_unit.m_unitName}
                    </a>
                </li>
            );
        }

        return (
            <Draggable nodeRef={this.modal_ctrl_gimbal_dlg} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
                <div key={this.key + "modal_ctrl_gimbal_dlg"} id="modal_ctrl_gimbal_dlg" title={t('gimbal_control')} className="card css_ontop border-light p-2 position-fixed" ref={this.modal_ctrl_gimbal_dlg} style={{ zIndex: 1050, top: '100px', left: '100px' }}>
                    <div className="card-header text-center js-draggable-handle">
                        <div className="row">
                            <div className="col-10">
                                <h5 className="text-success text-start mb-0">
                                    {isNoUnit
                                        ? t('gimbal_control')
                                        : `${t('gimbal_control')} ${this.state.p_session?.m_unit.m_unitName}`}
                                </h5>
                            </div>
                            <div className="col-2 text-end">
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
                                    <div className="btn-group w-100 mb-3">
                                        <button
                                            id="btn_laser_toggle"
                                            type="button"
                                            className={`btn btn-sm bi bi-asterisk me-1 ${this.state.laser_on === VIEWLINK_LASER_ON ? 'btn-danger' : 'border-danger'}`}
                                            onClick={() => this.fn_toggleLaser()}
                                        >
                                            {this.state.laser_on === VIEWLINK_LASER_OFF ? t('laser_off') : t('laser_on')}
                                        </button>

                                        <button
                                            id="btn_tracker_toggle"
                                            type="button"
                                            className={`btn btn-sm bi bi-chevron-bar-contract me-1 ${this.state.tracker_on === VIEWLINK_TRACKER_ON ? 'btn-warning' : 'border-warning'}`}
                                            onClick={() => this.fn_toggleTracker()}
                                        >
                                            {this.state.tracker_on === VIEWLINK_TRACKER_OFF ? t('tracker_off') : t('tracker_on')}
                                        </button>

                                        <button
                                            id="btn_ai_toggle"
                                            type="button"
                                            className={`btn btn-sm  bi bi-cpu ${this.state.ai_on === VIEWLINK_AI_ON ? 'btn-success' : 'border-success'}`}
                                            onClick={() => this.fn_toggleAI()}
                                        >
                                            {this.state.ai_on === VIEWLINK_AI_OFF ? t('ai_off') : t('ai_on')}
                                        </button>
                                    </div>

                                    {/* 2D Joystick Control with EO/IR/PIP buttons and Zoom Control */}
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">{t('gimbal_control')}</label>
                                        <div className="d-flex justify-content-center align-items-center">
                                            {/* View Mode Toggle Button */}
                                            <div className="me-3" style={{ width: '80px' }}>
                                                <div className="d-flex flex-column gap-1">
                                                    <button
                                                        id="btn_ir_hot_toggle"
                                                        type="button"
                                                        className={`btn btn-sm ${this.state.ir_hot === 'WHITE' ? 'btn-light' : 'btn-secondary'}`}
                                                        onClick={() => this.fn_toggleIRHot()}
                                                    >
                                                        {this.state.ir_hot}
                                                    </button>
                                                    <button
                                                        id="btn_view_mode_toggle"
                                                        type="button"
                                                        className={`btn btn-sm ${this.fn_getViewModeButtonColor()}`}
                                                        onClick={() => this.fn_toggleViewMode()}
                                                    >
                                                        {this.state.current_view_mode}
                                                    </button>
                                                    <button
                                                        id="btn_get_position"
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => this.fn_getGimbalPosition()}
                                                    >
                                                        Pos
                                                    </button>
                                                    <button
                                                        id="btn_status_all"
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => this.fn_getAllStatus()}
                                                    >
                                                        {t('status')}
                                                    </button>
                                                </div>
                                            </div>
                                            <Class_2D_Joystick
                                                width={200}
                                                height={200}
                                                rangeX={1}
                                                rangeY={1}
                                                labelX={t('horizontal')}
                                                labelY={t('vertical')}
                                                circleRadius={15}
                                                initialX={this.state.current_horizontal}
                                                initialY={this.state.current_vertical}
                                                sendOnReleaseOnly={true}
                                                onDrag={this.handleJoystickDrag}
                                                onRelease={this.handleJoystickRelease}
                                            />
                                            <div className="ms-3 d-flex flex-column align-items-center justify-content-between" style={{ height: '200px', width: '24px' }}>
                                                <style>{`
                                                    .zoom-slider-vertical { writing-mode: bt-lr; -webkit-appearance: slider-vertical; width: 24px; height: 200px; background: transparent; outline: none; }
                                                    .zoom-slider-vertical::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #0d6efd; border: none; }
                                                    .zoom-slider-vertical::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #0d6efd; border: none; }
                                                    .ir-zoom-slider-vertical { writing-mode: bt-lr; -webkit-appearance: slider-vertical; width: 24px; height: 200px; background: transparent; outline: none; }
                                                    .ir-zoom-slider-vertical::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #dc3545; border: none; }
                                                    .ir-zoom-slider-vertical::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #dc3545; border: none; }
                                                `}</style>
                                                <input
                                                    id="zoom_slider"
                                                    type="range"
                                                    orient="vertical"
                                                    className="form-range zoom-slider-vertical"
                                                    min={js_globals.CONST_OPTICAL_ZOOM_MIN}
                                                    max={js_globals.CONST_OPTICAL_ZOOM_MAX}
                                                    step={0.05}
                                                    value={this.state.zoomLevel}
                                                    onChange={this.handleZoomChange}
                                                    onMouseUp={this.handleZoomMouseUp}
                                                    onTouchEnd={this.handleZoomMouseUp}
                                                />
                                                <small className="text-muted text-center">EO-Z: {this.state.zoomLevel.toFixed(2)}</small>
                                            </div>
                                            <div className="ms-3 d-flex flex-column align-items-center justify-content-between" style={{ height: '200px', width: '24px' }}>
                                                <input
                                                    id="ir_digital_zoom_slider"
                                                    type="range"
                                                    orient="vertical"
                                                    className="form-range zoom-slider-vertical"
                                                    min={js_globals.CONST_IR_DIGITAL_ZOOM_MIN}
                                                    max={js_globals.CONST_IR_DIGITAL_ZOOM_MAX}
                                                    step={0.05}
                                                    value={this.state.irDigitalZoomLevel}
                                                    onChange={this.handleIRDigitalZoomChange}
                                                    onMouseUp={this.handleIRDigitalZoomMouseUp}
                                                    onTouchEnd={this.handleIRDigitalZoomMouseUp}
                                                />
                                                <small className="text-muted text-center">IR-Z: {this.state.irDigitalZoomLevel.toFixed(2)}</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class='d-flex w-100 justify-content-start'>
                                    <div className="mb-3 w-25 me-2 ">
                                        <label className="form-label fw-bold">LRF</label>
                                        <div className="card ">
                                            <div className="card-body py-2">
                                                <div className="d-grid align-items-center">
                                                        <div className="d-block text-center">
                                                            <label className="">Distance</label>
                                                            <span className="badge bg-primary d-block "> {lrfDistanceDisplay}</span>
                                                        </div>
                                                        <div className="d-block text-center">
                                                            
                                                            <label className="">Status</label>
                                                            <span className="badge bg-success d-block">{this.state.lrf_status_text}</span>
                                                        </div>
                                                        <div className="d-block text-center">
                                                            
                                                            <label className="">Age</label>
                                                            <span className="badge bg-warning d-block">{lrfAgeDisplay}s</span>
                                                        </div>
                                                    
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3 w-25 me-2 ">
                                        <label className="form-label fw-bold">Tracking</label>
                                        <div className="card ">
                                            <div className="card-body py-2">
                                                <div className="align-items-center">
                                                        <span className={`badge d-block ${trackingStatusClass} m-1  p-1 rounded-2 w-100`}>{this.state.tracking_status_text} {this.state.tracking_status}</span>
                                                </div>
                                                <div className="align-items-center">
                                                        <span className={`badge d-block ${trackingTypeClass} m-1  p-1 rounded-2 w-100`}>{this.state.tracking_target_type_text} {this.state.tracking_target_type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gimbal Attitude Display */}
                                    <div className="mb-3 w-25 me-2 ">
                                        <label className="form-label fw-bold">{t('gimbal_attitude')}</label>
                                        <div className="card ">
                                            <div className="card-body py-2">
                                                <div className="d-grid">
                                                        <div className="align-items-center">
                                                            <span className="badge bg-primary d-block mb-1">Y: {this.state.gimbal_yaw.toFixed(1)}°</span>
                                                        </div>
                                                        <div className="align-items-center">
                                                            <span className="badge bg-success d-block mb-1">P: {this.state.gimbal_pitch.toFixed(1)}°</span>
                                                        </div>
                                                        <div className="align-items-center">
                                                            <span className="badge bg-warning d-block mb-1">R: {this.state.gimbal_roll.toFixed(1)}°</span>
                                                        </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                    {/* Read Orientation and Target Drone Selector Buttons */}
                                    <div className="mb-3">
                                        <div className="d-flex gap-2">
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
                                                <ul className="dropdown-menu">
                                                    {c_items}
                                                    <li><hr className="dropdown-divider"/></li>
                                                    <li><a className="dropdown-item text-danger" href="#" onClick={() => this.setState({ target_drone: null })}>{t('clear_selection')}</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isNoUnit && (
                        <div id="modal_gimbal_footer" className="text-center ">
                            <div className="btn-group w-100 d-flex flex-wrap">
                                <button id="opaque_btn" type="button" className="btn btn-primary" onClick={() => this.fn_opacityDialog()}>{t('opaque')}</button>
                                <button id="btnGoto" type="button" className="btn btn-success" onClick={() => this.fn_gotoUnit()}>{t('goto', 'Goto')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </Draggable>
        );
    }
}

export default withTranslation('viewLinkGimbalControl')(ClssViewLinkGimbal);
