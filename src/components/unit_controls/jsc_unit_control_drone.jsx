import React from 'react';

import * as js_siteConfig from '../../js/js_siteConfig.js'

import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import { js_andruavAuth } from '../../js/js_andruav_auth.js'
import { mavlink20 } from '../../js/js_mavlink_v2.js';

import {
    fn_requestWayPoints,
    fn_clearWayPoints, fn_putWayPoints
} from '../../js/js_main.js'

import * as js_andruavMessages from '../../js/protocol/js_andruavMessages'


import { ClssCtrlUnitLog } from './jsc_ctrl_log_tab.jsx' // add extension to allow encryptor to see it as same as file name.
import { ClssCtrlUnitDetails } from './jsc_ctrl_details_tab.jsx'
import { ClssCtrlP2P } from '../modules/p2p/jsc_ctrl_p2p.jsx'
import { ClssCtrlSDR } from '../modules/sdr/jsc_ctrl_sdr.jsx'
import { ClssCtrlGPIO } from '../modules/gpio/jsc_ctrl_gpio.jsx'
import { ClssCtrlExperimental } from '../modules/experimental/jsc_ctrl_experimental.jsx';


import { ClssCtrlArdupilotFlightController } from '../flight_controllers/jsc_ctrl_ardupilot_flightControl.jsx'
import { ClssCtrlPx4FlightControl } from '../flight_controllers/jsc_ctrl_px4_flightControl.jsx'
import { ClssCtrlAUDIO } from '../gadgets/jsc_ctrl_audio.jsx'
import ClssCtrlDroneIMU from './jsc_unit_control_imu.jsx'
import { ClssAndruavUnitBase } from './jsc_unit_control_base.jsx'
import ClssCtrlUnitMainBar from './jsc_ctrl_unit_main_bar.jsx'
import ClssCtrlUnitPlanningBar from './jsc_ctrl_unit_planning_bar.jsx'
import ClssCtrlObjectTracker from '../gadgets/jsc_ctrl_tracker_button.jsx'
import ClssCtrlObjectTrackerAIList from '../gadgets/jsc_ctrl_tracker_ai_list.jsx'

/**
 * This class is full control of Drone.
 * 
 * Properties:
 * tab_planning: display planning tab... true in planner.
 * tab_main: display main bar control.... true in mnormal operation
 * tab_log: log tab that lists messages.
 * tab_details: detailed tab that display version, attached modules, received messages ....etc.
 * tab_modules: true to display any other module such as SDR,P2P,Audio ...etc.
 */
export class ClssAndruavUnitDrone extends ClssAndruavUnitBase {
    constructor(props) {
        super(props);
        this.state = {
            tab_planning: this.props.tab_planning,
            tab_main: this.props.tab_main,
            tab_log: this.props.tab_log,
            tab_details: this.props.tab_details,
            tab_module: this.props.tab_module,
            tab_collapsed: this.props.tab_collapsed,

            m_update: 0
        };

        
        this.props.p_unit.m_gui.speed_link = false;
        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe (js_event.EE_OldModule,this,this.fn_update);
        
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }


    fn_update(p_me)
    {
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    fn_requestGamePad(me, p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.getPartyID() !== me.props.p_unit.getPartyID()) {
            // someone else wanta GamePad, I will release it if I have it.
            return; // not me
        }

        p_andruavUnit.m_Telemetry.m_rxEngaged = true;

        if (me.m_flag_mounted === false) return;
        me.setState({ 'm_update': me.state.m_update + 1 });
    }

    fn_webRX_toggle(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.m_Telemetry.m_rxEngaged === true) {
            js_globals.v_andruavFacade.API_disengageRX(p_andruavUnit);
            js_eventEmitter.fn_dispatch(js_event.EE_requestGamePadreleaseGamePad, p_andruavUnit);
            p_andruavUnit.m_Telemetry.m_rxEngaged = false;

        }
        else {
            js_globals.v_andruavFacade.API_engageRX(p_andruavUnit);
        }
    }






    hlp_getflightButtonStyles(p_andruavUnit) {
        let res = {};
        res.btn_takeCTRL_class = "";
        res.btn_releaseCTRL_class = "";
        res.btn_sendParameters_class = " disabled hidden ";
        res.btn_lidar_info_class = ""
        res.btn_tele_class = "";
        res.btn_load_wp_class = "";
        res.btn_object_tracking_class = " disabled hidden ";
        res.btn_object_ai_tracking_class = " disabled hidden ";


        res.btn_servo_class = " btn-success ";

        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
            res.btn_servo_class = " disabled hidden ";
        }


        const c_manualTXBlockedSubAction = p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction();


        if (p_andruavUnit.m_isArmed === true) {
            res.btn_takeCTRL_class = ((c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_CENTER_CHANNELS) || (c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_FREEZE_CHANNELS)) ? " btn-danger   " : " btn-primary   ";
            res.btn_releaseCTRL_class = c_manualTXBlockedSubAction !== js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED ? " btn-danger   " : " btn-primary   ";
        }
        else {
            // NOT ARMED

            res.btn_takeCTRL_class = ((c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_CENTER_CHANNELS) || (c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_FREEZE_CHANNELS)) ? " btn-danger   " : " btn-primary   ";
            res.btn_releaseCTRL_class = c_manualTXBlockedSubAction !== js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED ? " btn-danger   " : " btn-primary   ";
        }


        if (p_andruavUnit.fn_getIsDE() === true) {
            res.btn_sendParameters_class = " btn-primary  bi bi-toggles ";
            if ((js_siteConfig.CONST_FEATURE.DISABLE_TRACKING != null)
                && (js_siteConfig.CONST_FEATURE.DISABLE_TRACKING === false)) {
                if (this.props.p_unit.m_modules.has_tracking) {
                    res.btn_object_tracking_class = " btn-primary   ";
                }

                if (this.props.p_unit.m_modules.has_ai_recognition) {
                    res.btn_object_ai_tracking_class = " btn-primary   ";
                }


            }
        }

        if ((p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() !== js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS)
            && (p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() !== js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED)) {
            res.btn_rx_class = " btn-primary bi bi-controller";
            res.btn_rx_text = "R/C Off";
            res.btn_rx_title = "Press to take control using Web - TX";
        }

        else if ((p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() === js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS)
            || (p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() === js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED)) {

            if (p_andruavUnit.m_Telemetry.m_rxEngaged === true) {
                res.btn_rx_class = " btn-danger bi bi-controller";
                res.btn_rx_text = " R/C On";
                res.btn_rx_title = " You control this drone using Web - TX";

            }
            else {
                res.btn_rx_class = " btn-outline-warning bi bi-controller";
                res.btn_rx_text = " R/C Off";
                res.btn_rx_title = "Drone is being controller by another GCS";
            }
        }
        else {
            if (p_andruavUnit.m_Telemetry.m_rxEngaged === true) {
                res.btn_rx_class = " btn-danger bi bi-controller";
                res.btn_rx_text = " R/C On";
                res.btn_rx_title = " You control this drone using Web - TX";

            }
            else {
                res.btn_rx_class = " btn-outline-warning hidden bi bi-controller";
                res.btn_rx_text = " R/C Off";
                res.btn_rx_title = "Drone is being controller by another GCS";
            }
        }


        if (p_andruavUnit.m_lidar_info.anyValidDataExists()) {
            res.btn_lidar_info_class = "btn-warning bi bi-rulers";
        }
        else {
            res.btn_lidar_info_class = "btn-muted bi bi-rulers";
        }
        // for now this feature is disabled.
        //res.btn_rx_class   = "hidden disabled"; 
        res.btn_save_wp_class = "btn-danger  bi bi-journal-arrow-up";
        res.btn_clear_wp_class = "btn-danger bi bi-journal-x";
        res.btn_load_wp_class = "btn-primary  bi bi-journal-arrow-down";



        return res;
    }



    createTabs() {
        const v_andruavUnit = this.props.p_unit;

        let container_tabs = [];
        let container_controls = [];


        if (this.state.tab_main === true) {
            let css = 'nav-link user-select-none ';
            if (this.state.tab_collapsed !== true) {
                css += 'active ';
            }
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li1'} className="nav-item">
                <a className={css + ' bi bi-send-fill txt-theme-aware '} data-bs-toggle="tab" href={"#main" + v_andruavUnit.getPartyID()} title='Main'></a>
            </li>);
        }

        if (this.state.tab_log === true) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li2'} className="nav-item">
                <a className="nav-link user-select-none bi bi-list-columns txt-theme-aware " data-bs-toggle="tab" href={"#log" + v_andruavUnit.getPartyID()} title='Log'></a>
            </li>);
        }

        if (this.state.tab_details === true) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li3'} className="nav-item">
                <a className={`nav-link  user-select-none bi bi-pci-card ${(!js_siteConfig.CONST_FEATURE.DISABLE_VERSION_NOTIFICATION) && ((v_andruavUnit.m_modules.m_old_version===true)||(v_andruavUnit.m_module_version_comparison<0))?'text-warning':'txt-theme-aware'}`} data-bs-toggle="tab" href={"#details" + v_andruavUnit.getPartyID()} title='Details'></a>
            </li>);
        }


        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P != null)
            && (js_siteConfig.CONST_FEATURE.DISABLE_P2P === false)
            && (this.state.tab_module === true)
            && (v_andruavUnit.m_modules.has_p2p === true)) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li4'} className="nav-item">
                <a className="nav-link user-select-none txt-theme-aware  " data-bs-toggle="tab" href={"#p2p" + v_andruavUnit.getPartyID()}>P2P</a>
            </li>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR != null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR === false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_sdr === true)) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li5'} className="nav-item">
                <a className="nav-link user-select-none bi bi-activity txt-theme-aware " data-bs-toggle="tab" href={"#sdr" + v_andruavUnit.getPartyID()} title='SDR'></a>
            </li>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_GPIO != null) && (js_siteConfig.CONST_FEATURE.DISABLE_GPIO === false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_gpio === true)) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li6'} className="nav-item">
                <a className="nav-link user-select-none bi bi-arrow-down-up txt-theme-aware " data-bs-toggle="tab" href={"#gpio" + v_andruavUnit.getPartyID()} title='GPIO'></a>
            </li>);
        }

        if (((js_siteConfig.CONST_FEATURE.DISABLE_VOICE != null)
            && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE === false)
            && (this.state.tab_module === true)
            && (v_andruavUnit.m_modules.has_sound === true))
            || (v_andruavUnit.fn_getIsDE() === false))// de already has audio
        {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li6'} className="nav-item">
                <a className="nav-link user-select-none bi bi-megaphone-fill txt-theme-aware " data-bs-toggle="tab" href={"#audio" + v_andruavUnit.getPartyID()} title='Audio'></a>
            </li>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_EXPERIMENTAL != null)
            && (js_siteConfig.CONST_FEATURE.DISABLE_EXPERIMENTAL === false)
            && (this.state.tab_module === true)) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'lie'} className="nav-item">
                <a className="nav-link user-select-none bi bi-bug txt-theme-aware " data-bs-toggle="tab" href={"#exp" + v_andruavUnit.getPartyID()} title='DEBUG'></a>
            </li>);
        }



        // Adding an empty tab
        if (container_tabs.length !== 0) {
            let css = 'nav-link user-select-none text-dark ';
            if (this.state.tab_collapsed === true) {
                css += 'active ';
            }
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'liempty'} className="nav-item">
                <a className={css + ' txt-theme-faint'} data-bs-toggle="tab" href={"#empty" + v_andruavUnit.getPartyID()}>Collapse</a>
            </li>);
        }

        // TAB Controls 
        if (this.state.tab_main === true) {
            let css = 'tab-pane fade pt-2 ';
            if (this.state.tab_collapsed !== true) {
                css += 'active show ';
            }

            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabContent_1'} className={css} id={"main" + v_andruavUnit.getPartyID()}>
                <ClssCtrlDroneIMU p_unit={v_andruavUnit} />
                {this.renderControl(v_andruavUnit)}
            </div>);
        }
        if (this.state.tab_log === true) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssMESSAGE_LOG'} className="tab-pane fade pt-2" id={"log" + v_andruavUnit.getPartyID()}>
                <ClssCtrlUnitLog p_unit={v_andruavUnit} />
            </div>);
        }

        if (this.state.tab_details === true) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlSETTINGS'} className="tab-pane fade  pt-2" id={"details" + v_andruavUnit.getPartyID()}>
                <ClssCtrlUnitDetails p_unit={v_andruavUnit} />
            </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P !== null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P === false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_p2p === true)) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlP2P'} className="tab-pane fade pt-2" id={"p2p" + v_andruavUnit.getPartyID()}>
                <ClssCtrlP2P p_unit={v_andruavUnit} />
            </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR === false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_sdr === true)) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlSDR'} className="tab-pane fade pt-2" id={"sdr" + v_andruavUnit.getPartyID()}>
                <ClssCtrlSDR p_unit={v_andruavUnit} />
            </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_GPIO === false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_gpio === true)) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlGPIO'} className="tab-pane fade pt-2" id={"gpio" + v_andruavUnit.getPartyID()}>
                <ClssCtrlGPIO p_unit={v_andruavUnit} />
            </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_VOICE !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE !== null) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE === false) && (this.state.tab_module === true) && ((v_andruavUnit.m_modules.has_sound === true) || (v_andruavUnit.fn_getIsDE() === false))) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlAUDIO'} className="tab-pane fade pt-2" id={"audio" + v_andruavUnit.getPartyID()}>
                <ClssCtrlAUDIO p_unit={v_andruavUnit} />
            </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_EXPERIMENTAL === false) && (this.state.tab_module === true) && (v_andruavUnit.fn_getIsDE() === true)) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlAUDIO'} className="tab-pane fade pt-2" id={"exp" + v_andruavUnit.getPartyID()}>
                <ClssCtrlExperimental p_unit={v_andruavUnit} />
            </div>);
        }

        if (container_controls.length !== 0) {
            // Adding an empty tab
            let css = 'tab-pane fade ';
            if (this.state.tab_collapsed === true) {
                css += 'active show ';
            }

            container_controls.push(<div className={css} key={v_andruavUnit.getPartyID() + 'myTabClssCtrlempty'} id={"empty" + v_andruavUnit.getPartyID()}>
            </div>);
        }


        return { container_tabs, container_controls };
    }

    childcomponentWillMount() {
        js_eventEmitter.fn_subscribe(js_event.EE_requestGamePad, this, this.fn_requestGamePad);
    }

    childcomponentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_requestGamePad, this);
    }


    componentWillUnmount() {
        super.componentWillUnmount();
        js_eventEmitter.fn_unsubscribe (js_event.EE_OldModule, this);
    }


    renderControl(p_andruavUnit) {

        if (p_andruavUnit.m_useFCBIMU !== true) {
            return (
                <div id='ctrl_k' className='text-center'>
                    <p className="text-warning bg-black user-select-none bi bi-exclamation-diamond "> Flight Control Board is not Connected</p>
                </div>
            );
        }

        if (p_andruavUnit.m_Telemetry.m_isGCSBlocked === true) {

            return (
                <div id='ctrl_k' className='text-center '>
                    <p className="text-danger bg-black user-select-none">BLOCKED By RC in the Field</p>
                </div>
            );
        }

        let btn = this.hlp_getflightButtonStyles(p_andruavUnit);
        let ctrl_flight_controller = [];
        let ctrl2_1 = [];
        let ctrl2_2 = [];
        let cls_ctrl_modes = '  ';
        let cls_ctrl_wp = '  ';
        if (!js_andruavAuth.fn_do_canControlWP()) {   // no permission
            cls_ctrl_wp = ' hidden disabled ';
        }
        if (js_andruavAuth.fn_do_canControlModes()) {
            switch (p_andruavUnit.m_autoPilot) {
                case mavlink20.MAV_AUTOPILOT_PX4:
                    ctrl_flight_controller.push(<ClssCtrlPx4FlightControl key={p_andruavUnit.getPartyID() + "_ctrl_fc"} id={p_andruavUnit.getPartyID() + "_ctrl_fc"} v_andruavUnit={p_andruavUnit} />);
                    break;
                default:
                    ctrl_flight_controller.push(<ClssCtrlArdupilotFlightController key={p_andruavUnit.getPartyID() + "_ctrl_fc"} id={p_andruavUnit.getPartyID() + "_ctrl_fc"} v_andruavUnit={p_andruavUnit} />);
                    break;
            }
        }
        else {   // no permission
            cls_ctrl_modes = ' hidden disabled ';
        }




        ctrl2_1.push(<div key={p_andruavUnit.getPartyID() + "rc3"} id='rc33' className='col-12  al_l ctrldiv'><div className='btn-group flex-wrap '>
            <button id='btn_refreshwp' key={this.key + 'btn_refreshwp'} type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_load_wp_class} onClick={(e) => fn_requestWayPoints(p_andruavUnit, true)} title="Read Waypoints from Drone">&nbsp;R-WP</button>
            <button id='btn_writewp' key={this.key + 'btn_writewp'} type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_save_wp_class} onClick={(e) => fn_putWayPoints(p_andruavUnit, true)} title="Write Waypoints into Drone">&nbsp;W-WP</button>
            <button id='btn_clearwp' key={this.key + 'btn_clearwp'} type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_clear_wp_class} onClick={(e) => fn_clearWayPoints(p_andruavUnit)} title="Clear Waypoints" >&nbsp;C-WP</button>
            <button id='btn_webRX' key={this.key + 'btn_webRX'} type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_rx_class} onClick={(e) => this.fn_webRX_toggle(p_andruavUnit)} title={`${btn.btn_rx_text}--${btn.btn_rx_title}`}>&nbsp;RX</button>
            <button id='btn_freezerx' key={this.key + 'btn_freezerx'} type='button' title="Freeze RemoteControl -DANGER-" className={'hidden btn btn-sm flgtctrlbtn ' + btn.btn_takeCTRL_class + cls_ctrl_modes} onClick={(e) => this.fn_takeTXCtrl(e, p_andruavUnit)}>&nbsp;TX-Frz&nbsp;</button>
            <button id='btn_releaserx' key={this.key + 'btn_releaserx'} type='button' title="Release Control" className={'btn btn-sm flgtctrlbtn ' + btn.btn_releaseCTRL_class + cls_ctrl_modes} onClick={(e) => this.fn_releaseTXCtrl(p_andruavUnit)}>&nbsp;TX-Rel&nbsp;</button>
            <button id='btn_inject_param' key={this.key + 'btn_inject_param'} type='button' title="Send Parameters to GCS" className={'btn btn-sm flgtctrlbtn ' + btn.btn_sendParameters_class} onClick={(e) => this.fn_displayParamsDialog(p_andruavUnit)}>&nbsp;PARM&nbsp;</button>
            <button id='btn_lidar_info' key={this.key + 'btn_lidar_info'} type='button' title="Display Lidar Info" className={'btn btn-sm flgtctrlbtn ' + btn.btn_lidar_info_class} onClick={(e) => this.fn_displayLidarDialog(p_andruavUnit)}>&nbsp;LIDAR</button>
        </div></div>);

        ctrl2_2.push(<div key={p_andruavUnit.getPartyID() + "rc3_1"} id='rc33' className='col-12  al_l ctrldiv'><div className='btn-group flex-wrap '>
            <button id='btn_tracking' key={this.key + 'btn_tracking'} type='button' title="Send Parameters to GCS" className={'btn btn-sm flgtctrlbtn ' + btn.btn_object_tracking_class} ><ClssCtrlObjectTracker className='vstack' p_unit={p_andruavUnit} title='object tracker' /></button>
            <ClssCtrlObjectTrackerAIList className={'btn btn-sm ' + btn.btn_object_ai_tracking_class} p_unit={p_andruavUnit} title='object AI tracker' />
        </div></div>);

        return (
            <div key={'ctrl_flight_controller'} id='ctrl_k' className='ps-2 pb-2'>
                <div className='row'>
                    {ctrl_flight_controller}
                </div>
                <div key={'ctrl2_1'} className='row'>
                    {ctrl2_1}
                </div>
                <div key={'ctrl2_2'} className='row'>
                    {ctrl2_2}
                </div>
                <div key={'ctrl3'} className='row'>
                </div>
            </div>
        );
    }

    createMainBar() {
        let bars = [];
        const v_andruavUnit = this.props.p_unit;


        if (this.state.tab_main === true) {
            bars.push(
                <ClssCtrlUnitMainBar key={v_andruavUnit + 'c_c_u_m_b'} p_unit={v_andruavUnit} />);
        }

        if (this.state.tab_planning === true) {
            bars.push(
                <ClssCtrlUnitPlanningBar key={v_andruavUnit + 'c_c_u_p_b'} p_unit={v_andruavUnit} />);
        }

        return bars;
    }


    render() {

        const v_andruavUnit = this.props.p_unit;

        if (v_andruavUnit === null || v_andruavUnit === undefined) return;

        const id = v_andruavUnit.getPartyID() + "__u_c_d";

        const tabs = this.createTabs();

        const main_bar = this.createMainBar();
        return (

            <div key={id + "1"} id={id} className={"row mb-1 mt-0 me-0 ms-0 pt-1 user-select-none IsGCS_" + v_andruavUnit.m_IsGCS + " card border-light IsShutdown_" + (v_andruavUnit.m_IsShutdown || v_andruavUnit.m_IsDisconnectedFromGCS)}>

                {main_bar}

                <ul key={id + 'ul'} className="nav nav-tabs">
                    {tabs.container_tabs}
                </ul>
                <div key={id + 'myTabContent2'} id="myTabContent2" className="tab-content padding_zero">
                    {tabs.container_controls}
                </div>
            </div>
        );
    }
}