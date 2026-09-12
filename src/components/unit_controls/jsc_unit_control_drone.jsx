import React from 'react';
import * as js_session from '../../js/state/session.js';
import { CONST_EXPERIMENTAL_FEATURES_ENABLED } from '../../js/config/constants.js';
import { withTranslation } from 'react-i18next';

import * as js_siteConfig from '../../js/config/js_siteConfig.js'

import { EVENTS as js_event } from '../../js/events/js_eventList.js'
import { js_eventEmitter } from '../../js/events/js_eventEmitter.js'
import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth.js'
import { mavlink20 } from '../../js/js_mavlink_v2.js';

import {
    fn_requestWayPoints,
    fn_clearWayPoints, fn_putWayPoints
} from '../../js/js_main.js'
import { js_unitUiPrefs } from '../../js/state/unitUiPrefs.js'

import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'


import { ClssCtrlUnitLog } from './jsc_ctrl_log_tab.jsx' // add extension to allow encryptor to see it as same as file name.
import { ClssCtrlUnitDetails } from './jsc_ctrl_details_tab.jsx'
import { ClssCtrlP2P } from '../modules/p2p/jsc_ctrl_p2p.jsx'
import { ClssCtrlSDR } from '../modules/sdr/jsc_ctrl_sdr.jsx'
import { ClssCtrlGPIO } from '../modules/gpio/jsc_ctrl_gpio.jsx'
import { ClssCtrlExperimental } from '../modules/experimental/jsc_ctrl_experimental.jsx';


import { ClssCtrlArdupilotFlightController } from '../flight_controllers/jsc_ctrl_ardupilot_flightControl.jsx'
import { ClssCtrlPx4FlightControl } from '../flight_controllers/jsc_ctrl_px4_flightControl.jsx'
import { ClssCtrlAUDIO } from '../gadgets/jsc_ctrl_audio.jsx'
import { ClssCtrlTelnet } from '../modules/telnet/jsc_ctrl_telnet.jsx'
import { ClssCtrlAndruavCtrl } from '../modules/andruav/jsc_ctrl_andruav_ctrl.jsx'
import ClssCtrlDroneIMU from './jsc_unit_control_imu.jsx'
import { ClssAndruavUnitBase } from './jsc_unit_control_base.jsx'
import ClssCtrlUnitMainBar from './jsc_ctrl_unit_main_bar.jsx'
import ClssCtrlUnitPlanningBar from './jsc_ctrl_unit_planning_bar.jsx'
import {EventBridge} from '../../js/hooks/EventBridge.jsx'
import { subscribeUnitField } from '../../js/store/unitStore.js';

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

        
        js_unitUiPrefs.fn_setUnitPref(this.props.p_unit.getPartyID(), 'speed_link', false);
        this.key = Math.random().toString();
        this.m_unsubs = [];

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.

    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;

        // Field-granular replacement for the old unfiltered EE_OldModule
        // bump (TASK-16): this row only renders its OWN unit's module/
        // version info (createTabs()'s had_disconnected_module,
        // had_version_warning, and the m_modules.has_* tab-visibility
        // checks all read this.props.p_unit.m_modules), so a per-unit
        // subscription is strictly more correct than the old global event.
        // 'm_modules.m_list' is notified unconditionally on every
        // m_modules.addModules() call (see reduce.ts), which is the same
        // function that sets has_p2p/has_sdr/has_gpio/has_sound/has_telnet/
        // has_tracking/m_old_version, so one subscription covers all of
        // them even though only some are in that op's notifyFields list.
        const partyId = this.props.p_unit?.getPartyID();
        if (partyId) {
            this.m_unsubs.push(subscribeUnitField(partyId, 'm_modules.m_list', () => this.fn_update()));
            this.m_unsubs.push(subscribeUnitField(partyId, 'm_version', () => this.fn_update()));
        }
    }


    fn_update()
    {
        if (this.m_flag_mounted === false) return;
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_requestGamePad(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.getPartyID() !== this.props.p_unit.getPartyID()) {
            // someone else wanta GamePad, I will release it if I have it.
            return; // not me
        }

        p_andruavUnit.m_Telemetry.m_rxEngaged = true;

        if (this.m_flag_mounted === false) return;
        this.setState({ 'm_update': this.state.m_update + 1 });
    }

    fn_webRX_toggle(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.m_Telemetry.m_rxEngaged === true) {
            // API_disengageRX already dispatches EE_releaseGamePad.
            // The previous fn_dispatch(EE_requestGamePadreleaseGamePad) used
            // an event name that was never added to js_eventList.js, so it
            // resolved to `undefined` and collided with the unit lists'
            // EE_requestGamePadonSocketStatus subscription (also `undefined`),
            // reaching fn_onSocketStatus with a unit object as params and
            // clearing the Online Units list. Removed.
            js_session.fn_getAndruavFacade().API_disengageRX(p_andruavUnit);
            p_andruavUnit.m_Telemetry.m_rxEngaged = false;

        }
        else {
            js_session.fn_getAndruavFacade().API_engageRX(p_andruavUnit);
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

        if (CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
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
            res.btn_rx_class = " btn-primary bi bi-dpad";
            res.btn_rx_text = "R/C Off";
            res.btn_rx_title = "Press to take control using Web - TX";
        }

        else if ((p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() === js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS)
            || (p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() === js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED)) {

            if (p_andruavUnit.m_Telemetry.m_rxEngaged === true) {
                res.btn_rx_class = " btn-danger bi bi-dpad";
                res.btn_rx_text = " R/C On";
                res.btn_rx_title = " You control this drone using Web - TX";

            }
            else {
                res.btn_rx_class = " btn-outline-warning bi bi-dpad";
                res.btn_rx_text = " R/C Off";
                res.btn_rx_title = "Drone is being controller by another GCS";
            }
        }
        else {
            if (p_andruavUnit.m_Telemetry.m_rxEngaged === true) {
                res.btn_rx_class = " btn-danger bi bi-dpad";
                res.btn_rx_text = " R/C On";
                res.btn_rx_title = " You control this drone using Web - TX";

            }
            else {
                res.btn_rx_class = " btn-outline-warning hidden bi bi-dpad";
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
        const had_disconnected_module = Array.isArray(v_andruavUnit.m_modules.m_list) && v_andruavUnit.m_modules.m_list.some((module) => module && module.d === true);
        const expected_main_version = v_andruavUnit.m_module_version_info?.version;
        const current_main_version = v_andruavUnit.fn_getVersion();
        let main_module_version_warning = false;
        if (expected_main_version && current_main_version != null && current_main_version !== 'unknown') {
            const main_version_comparison = v_andruavUnit.m_modules.compareVersions(current_main_version, expected_main_version);
            main_module_version_warning = main_version_comparison < 0;
        }
        const had_version_warning = (!js_siteConfig.CONST_FEATURE.DISABLE_VERSION_NOTIFICATION) && ((v_andruavUnit.m_modules.m_old_version === true) || main_module_version_warning);

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
                <a className={`nav-link  user-select-none bi bi-pci-card ${had_disconnected_module ? 'text-danger' : (had_version_warning ? 'text-warning' : 'txt-theme-aware')}`} data-bs-toggle="tab" href={"#details" + v_andruavUnit.getPartyID()} title='Details'></a>
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

        if ((js_siteConfig.CONST_FEATURE.DISABLE_TELNET != null)
            && (js_siteConfig.CONST_FEATURE.DISABLE_TELNET === false)
            && (this.state.tab_module === true)
            && (v_andruavUnit.m_modules.has_telnet === true)) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li7tel'} className="nav-item">
                <a className="nav-link user-select-none bi bi-terminal txt-theme-aware " data-bs-toggle="tab" href={"#telnet" + v_andruavUnit.getPartyID()} title='Telnet'></a>
            </li>);
        }

        if (v_andruavUnit.fn_isAndruav() === true) {
            container_tabs.push(<li key={v_andruavUnit.getPartyID() + 'li6ctrl'} className="nav-item">
                <a className="nav-link user-select-none bi bi-sliders txt-theme-aware " data-bs-toggle="tab" href={"#andruavctrl" + v_andruavUnit.getPartyID()} title='Andruav Ctrl'></a>
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

        if (((js_siteConfig.CONST_FEATURE.DISABLE_VOICE != null)
            && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE === false)
            && (this.state.tab_module === true)
            && (v_andruavUnit.m_modules.has_sound === true))
            || (v_andruavUnit.fn_getIsDE() === false))// de already has audio
        {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlAUDIO'} className="tab-pane fade pt-2" id={"audio" + v_andruavUnit.getPartyID()}>
                <ClssCtrlAUDIO p_unit={v_andruavUnit} />
            </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_TELNET === false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_telnet === true)) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlTELNET'} className="tab-pane fade pt-2" id={"telnet" + v_andruavUnit.getPartyID()}>
                <ClssCtrlTelnet p_unit={v_andruavUnit} />
            </div>);
        }

        if (v_andruavUnit.fn_isAndruav() === true) {
            container_controls.push(<div key={v_andruavUnit.getPartyID() + 'myTabClssCtrlAndruavCtrl'} className="tab-pane fade pt-2" id={"andruavctrl" + v_andruavUnit.getPartyID()}>
                <ClssCtrlAndruavCtrl p_unit={v_andruavUnit} />
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
        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }

    childcomponentWillUnmount() {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }


    componentWillUnmount() {
        super.componentWillUnmount();
        this.m_flag_mounted = false;
        for (const fn of this.m_unsubs) fn();
        this.m_unsubs = [];
        // Unsubscription of the EventBridge siblings (useEventSubscription)
        // below is handled automatically on unmount.
    }

    // createTabs()/renderControl()/hlp_getflightButtonStyles() also read
    // several fields not yet migrated to field-store (m_isArmed,
    // m_useFCBIMU, m_autoPilot, m_Telemetry.*, m_lidar_info, IsGCS,
    // IsShutdown, IsDisconnectedFromGCS...) — full migration of this row is
    // out of TASK-16's scope (only the EE_OldModule bump was targeted).
    // This coarse, partyID-filtered fallback keeps those fields live until
    // a future pass migrates them individually.
    fn_onCoarseUpdate(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.getPartyID() !== this.props.p_unit.getPartyID()) return; // not me
        this.fn_update();
    }


    fn_connectToFCB (p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (js_session.fn_getAndruavFacade() === null || js_session.fn_getAndruavFacade() === undefined) return;
        js_session.fn_getAndruavFacade().API_connectToFCB(p_andruavUnit);
    }


    renderControl(p_andruavUnit) {

        if (p_andruavUnit.m_useFCBIMU !== true) {
            const isAndruav = p_andruavUnit.fn_isAndruav();
            return (
                <div id='ctrl_k' className='text-center'>
                    <p
                        className={"text-warning bg-black user-select-none bi bi-exclamation-diamond" + (isAndruav ? " cursor_hand" : "")}
                        title={isAndruav ? "Click to connect to FCB if not active" : ""}
                        onClick={isAndruav ? () => this.fn_connectToFCB(p_andruavUnit) : undefined}
                    >
                        &nbsp;Flight Control Board is not Connected
                    </p>
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




        ctrl2_1.push(<div key={p_andruavUnit.getPartyID() + "rc3"} id='rc33' className='col-12  al_l ctrldiv'><div className='btn-group w-100 d-flex flex-wrap '>
            <button id='btn_refreshwp' key={this.key + 'btn_refreshwp'} type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_load_wp_class} onClick={(e) => fn_requestWayPoints(p_andruavUnit, true)} title="Read Waypoints from Drone">&nbsp;R-WP</button>
            <button id='btn_writewp' key={this.key + 'btn_writewp'} type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_save_wp_class} onClick={(e) => fn_putWayPoints(p_andruavUnit, true)} title="Write Waypoints into Drone">&nbsp;W-WP</button>
            <button id='btn_clearwp' key={this.key + 'btn_clearwp'} type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_clear_wp_class} onClick={(e) => fn_clearWayPoints(p_andruavUnit)} title="Clear Waypoints" >&nbsp;C-WP</button>
            <button id='btn_webRX' key={this.key + 'btn_webRX'} type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_rx_class} onClick={(e) => this.fn_webRX_toggle(p_andruavUnit)} title={`${btn.btn_rx_text}--${btn.btn_rx_title}`}>&nbsp;RX</button>
            <button id='btn_freezerx' key={this.key + 'btn_freezerx'} type='button' title="Freeze RemoteControl -DANGER-" className={'hidden btn btn-sm flgtctrlbtn ' + btn.btn_takeCTRL_class + cls_ctrl_modes} onClick={(e) => this.fn_takeTXCtrl(e, p_andruavUnit)}>&nbsp;TX-Frz&nbsp;</button>
            <button id='btn_releaserx' key={this.key + 'btn_releaserx'} type='button' title="Release Control" className={'btn btn-sm flgtctrlbtn ' + btn.btn_releaseCTRL_class + cls_ctrl_modes} onClick={(e) => this.fn_releaseTXCtrl(p_andruavUnit)}>&nbsp;TX-Rel&nbsp;</button>
            <button id='btn_inject_param' key={this.key + 'btn_inject_param'} type='button' title="Send Parameters to GCS" className={'btn btn-sm flgtctrlbtn ' + btn.btn_sendParameters_class} onClick={(e) => this.fn_displayParamsDialog(p_andruavUnit)}>&nbsp;PARM&nbsp;</button>
            <button id='btn_lidar_info' key={this.key + 'btn_lidar_info'} type='button' title="Display Lidar Info" className={'btn btn-sm flgtctrlbtn ' + btn.btn_lidar_info_class} onClick={(e) => this.fn_displayLidarDialog(p_andruavUnit)}>&nbsp;LIDAR</button>
        </div></div>);

        
        return (
            <div key={'ctrl_flight_controller'} id='ctrl_k' className='ps-2 pb-2 pe-2'>
                <div className='row'>
                    {ctrl_flight_controller}
                </div>
                <div key={'ctrl2_1'} className='row'>
                    {ctrl2_1}
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

                {super.render()}
                <EventBridge eventName={js_event.EE_unitUpdated} onEvent={(p_andruavUnit) => this.fn_onCoarseUpdate(p_andruavUnit)} />
                <EventBridge eventName={js_event.EE_unitNavUpdated} onEvent={(p_andruavUnit) => this.fn_onCoarseUpdate(p_andruavUnit)} />
                <EventBridge eventName={js_event.EE_requestGamePad} onEvent={(p_andruavUnit) => this.fn_requestGamePad(p_andruavUnit)} />

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

export default withTranslation()(ClssAndruavUnitDrone);