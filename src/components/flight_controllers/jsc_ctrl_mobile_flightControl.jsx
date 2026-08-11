import React    from 'react';
import { withTranslation } from 'react-i18next';
import {js_globals} from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter'
import {mavlink20} from '../../js/js_mavlink_v2.js';
import {js_andruavAuth} from '../../js/protocol/auth/js_andruav_auth.js';
import * as js_andruavUnit from '../../js/js_andruavUnit.js';
import {fn_do_modal_confirmation} from '../../js/js_main';

export class ClssCtrlMobileFlightControl extends React.Component {
    constructor(props)
	{
		super (props);
		    const p_andruavUnit = this.props.v_andruavUnit;
		    this.state = {
		        m_VehicleType: p_andruavUnit ? p_andruavUnit.m_VehicleType : null,
		        m_is_ready_to_arm: p_andruavUnit ? p_andruavUnit.m_is_ready_to_arm : false,
		        m_isArmed: p_andruavUnit ? p_andruavUnit.m_isArmed : false,
		        m_autoPilot: p_andruavUnit ? p_andruavUnit.m_autoPilot : null,
		        m_flightMode: p_andruavUnit ? p_andruavUnit.m_flightMode : null,
		        m_isGCSBlocked: p_andruavUnit ? p_andruavUnit.m_Telemetry.m_isGCSBlocked : false,
			};
    }

    shouldComponentUpdate(nextProps, nextState) {
        const s = this.state;
        const { v_andruavUnit } = nextProps;
        if (v_andruavUnit === null || v_andruavUnit === undefined) return false;

        const update = (s.m_VehicleType != v_andruavUnit.m_VehicleType
            || s.m_is_ready_to_arm != v_andruavUnit.m_is_ready_to_arm
            || s.m_isArmed != v_andruavUnit.m_isArmed
            || s.m_autoPilot != v_andruavUnit.m_autoPilot
            || s.m_flightMode != v_andruavUnit.m_flightMode
            || s.m_isGCSBlocked != v_andruavUnit.m_Telemetry.m_isGCSBlocked
        );

        return update;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { v_andruavUnit } = nextProps;
        if (v_andruavUnit === null || v_andruavUnit === undefined) return null;

        if (v_andruavUnit.m_VehicleType !== prevState.m_VehicleType ||
            v_andruavUnit.m_is_ready_to_arm !== prevState.m_is_ready_to_arm ||
            v_andruavUnit.m_isArmed !== prevState.m_isArmed ||
            v_andruavUnit.m_autoPilot !== prevState.m_autoPilot ||
            v_andruavUnit.m_flightMode !== prevState.m_flightMode ||
            v_andruavUnit.m_Telemetry.m_isGCSBlocked !== prevState.m_isGCSBlocked) {
            return {
                m_VehicleType: v_andruavUnit.m_VehicleType,
                m_is_ready_to_arm: v_andruavUnit.m_is_ready_to_arm,
                m_isArmed: v_andruavUnit.m_isArmed,
                m_autoPilot: v_andruavUnit.m_autoPilot,
                m_flightMode: v_andruavUnit.m_flightMode,
                m_isGCSBlocked: v_andruavUnit.m_Telemetry.m_isGCSBlocked,
            };
        }
        return null;
    }

    hlp_isPX4 ()
    {
        return this.state.m_autoPilot === mavlink20.MAV_AUTOPILOT_PX4;
    }

    hlp_isCopter ()
    {
        const vt = this.state.m_VehicleType;
        return vt === js_andruavUnit.VEHICLE_QUAD || vt === js_andruavUnit.VEHICLE_TRI;
    }

    hlp_isRoverOrBoat ()
    {
        const vt = this.state.m_VehicleType;
        return vt === js_andruavUnit.VEHICLE_ROVER || vt === js_andruavUnit.VEHICLE_BOAT;
    }

    hlp_ardupilotHasTakeoff ()
    {
        const vt = this.state.m_VehicleType;
        return vt === js_andruavUnit.VEHICLE_PLANE
            || vt === js_andruavUnit.VEHICLE_VTOL
            || vt === js_andruavUnit.VEHICLE_SUBMARINE;
    }

    hlp_canConnect ()
    {
        return js_globals.v_andruavFacade !== null && js_globals.v_andruavFacade !== undefined;
    }

    hlp_isBlocked ()
    {
        return this.state.m_isGCSBlocked === true;
    }

    hlp_baseEnabled ()
    {
        return this.hlp_canConnect() && !this.hlp_isBlocked() && js_andruavAuth.fn_do_canControlModes();
    }

    hlp_getMobileButtonStyles (p_andruavUnit)
	{
	    let res = {};

        const isPX4       = this.hlp_isPX4();
        const isArmed     = p_andruavUnit.m_isArmed === true;
        const canControl  = this.hlp_baseEnabled();
        const canArm      = canControl && js_andruavAuth.fn_do_canControl();
        const showTakeoff = isPX4 || this.hlp_ardupilotHasTakeoff();

        // ARM / DISARM
        res.btn_arm_label          = isArmed ? 'DISARM' : 'ARM';
        res.btn_arm_icon           = isArmed ? 'bi-stop-circle-fill' : 'bi-play-circle-fill';
        res.btn_arm_style          = isArmed ? 'danger' : (p_andruavUnit.m_is_ready_to_arm === true ? 'arm-ready' : 'arm');
        res.btn_arm_enabled        = canArm;
        res.btn_arm_confirmTitle   = isArmed ? 'DISARM ' + p_andruavUnit.m_unitName : 'ARM ' + p_andruavUnit.m_unitName;
        res.btn_arm_confirmMessage = isArmed
            ? 'STOP all MOTORS. If airborne the vehicle will CRASH. Are you sure?'
            : 'Arm the vehicle motors. Are you sure?';

        // TAKEOFF
        res.btn_takeoff_show           = showTakeoff;
        res.btn_takeoff_style          = 'takeoff';
        res.btn_takeoff_enabled        = canControl && isArmed;
        res.btn_takeoff_confirmTitle   = 'TAKEOFF ' + p_andruavUnit.m_unitName;
        res.btn_takeoff_confirmMessage = 'Command the vehicle to take off. Are you sure?';

        // AUTO
        res.btn_auto_style          = 'auto';
        res.btn_auto_enabled        = canControl && isArmed;
        res.btn_auto_confirmTitle   = 'AUTO ' + p_andruavUnit.m_unitName;
        res.btn_auto_confirmMessage = 'Switch to AUTO mission mode. Are you sure?';

        // BRAKE
        res.btn_brake_style          = 'brake';
        res.btn_brake_enabled        = canControl && isArmed;
        res.btn_brake_confirmTitle   = 'BRAKE ' + p_andruavUnit.m_unitName;
        res.btn_brake_confirmMessage = 'Stop the vehicle in place. Are you sure?';

        // LAND
        res.btn_land_style          = 'land';
        res.btn_land_enabled        = canControl && isArmed;
        res.btn_land_confirmTitle   = 'LAND ' + p_andruavUnit.m_unitName;
        res.btn_land_confirmMessage = 'Command the vehicle to land. Are you sure?';

	    return res;
	}

    fn_doConfirm (p_title, p_message, p_callback)
    {
        fn_do_modal_confirmation(
            p_title,
            p_message,
            function (p_approved) {
                if (p_approved === false) return;
                p_callback();
            },
            'CONFIRM',
            'bg-danger txt-theme-aware',
            'Cancel'
        );
    }

    fn_doArm ()
    {
        const v_andruavUnit = this.props.v_andruavUnit;
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;

        const btn = this.hlp_getMobileButtonStyles(v_andruavUnit);
        const me = this;
        this.fn_doConfirm(btn.btn_arm_confirmTitle, btn.btn_arm_confirmMessage, function () {
            js_globals.v_andruavFacade.API_do_Arm(v_andruavUnit, !v_andruavUnit.m_isArmed, false);
        });
    }

    fn_doTakeoff ()
    {
        const v_andruavUnit = this.props.v_andruavUnit;
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;

        const btn = this.hlp_getMobileButtonStyles(v_andruavUnit);
        const me = this;
        this.fn_doConfirm(btn.btn_takeoff_confirmTitle, btn.btn_takeoff_confirmMessage, function () {
            const flightMode = me.hlp_isPX4()
                ? js_andruavUnit.CONST_FLIGHT_PX4_AUTO_TAKEOFF
                : js_andruavUnit.CONST_FLIGHT_CONTROL_TAKEOFF;
            js_globals.v_andruavFacade.API_do_FlightMode(v_andruavUnit, flightMode);
        });
    }

    fn_doAuto ()
    {
        const v_andruavUnit = this.props.v_andruavUnit;
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;

        const btn = this.hlp_getMobileButtonStyles(v_andruavUnit);
        const me = this;
        this.fn_doConfirm(btn.btn_auto_confirmTitle, btn.btn_auto_confirmMessage, function () {
            const flightMode = me.hlp_isPX4()
                ? js_andruavUnit.CONST_FLIGHT_PX4_AUTO_MISSION
                : js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO;
            js_globals.v_andruavFacade.API_do_FlightMode(v_andruavUnit, flightMode);
        });
    }

    fn_doBrake ()
    {
        const v_andruavUnit = this.props.v_andruavUnit;
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;

        const btn = this.hlp_getMobileButtonStyles(v_andruavUnit);
        const me = this;
        this.fn_doConfirm(btn.btn_brake_confirmTitle, btn.btn_brake_confirmMessage, function () {
            let flightMode;
            if (me.hlp_isPX4()) {
                flightMode = js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD;
            }
            else if (me.hlp_isRoverOrBoat()) {
                flightMode = js_andruavUnit.CONST_FLIGHT_CONTROL_HOLD;
            }
            else if (me.hlp_isCopter()) {
                flightMode = js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE;
            }
            else {
                flightMode = js_andruavUnit.CONST_FLIGHT_CONTROL_LOITER;
            }
            js_globals.v_andruavFacade.API_do_FlightMode(v_andruavUnit, flightMode);
        });
    }

    fn_doLand ()
    {
        const v_andruavUnit = this.props.v_andruavUnit;
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;

        const btn = this.hlp_getMobileButtonStyles(v_andruavUnit);
        const me = this;
        this.fn_doConfirm(btn.btn_land_confirmTitle, btn.btn_land_confirmMessage, function () {
            if (me.hlp_isPX4()) {
                js_globals.v_andruavFacade.API_do_FlightMode(v_andruavUnit, js_andruavUnit.CONST_FLIGHT_PX4_AUTO_LAND);
            }
            else {
                js_globals.v_andruavFacade.API_do_Land(v_andruavUnit);
            }
        });
    }

    render ()
    {
        const p_andruavUnit = this.props.v_andruavUnit;
        if (p_andruavUnit === null || p_andruavUnit === undefined) return null;

        const btn = this.hlp_getMobileButtonStyles(p_andruavUnit);
        let actions = [];

        // ARM / DISARM
        actions.push(
            <button
                key="arm"
                className={`mobile-action-btn ${btn.btn_arm_style}`}
                onClick={() => this.fn_doArm()}
                disabled={!btn.btn_arm_enabled}
            >
                <span className="mobile-btn-icon">
                    <i className={`bi ${btn.btn_arm_icon}`} />
                </span>
                {btn.btn_arm_label}
            </button>
        );

        // TAKEOFF (conditional)
        if (btn.btn_takeoff_show) {
            actions.push(
                <button
                    key="takeoff"
                    className={`mobile-action-btn ${btn.btn_takeoff_style}`}
                    onClick={() => this.fn_doTakeoff()}
                    disabled={!btn.btn_takeoff_enabled}
                >
                    <span className="mobile-btn-icon">
                        <i className="bi bi-airplane-fill" />
                    </span>
                    TAKEOFF
                </button>
            );
        }

        // AUTO
        actions.push(
            <button
                key="auto"
                className={`mobile-action-btn ${btn.btn_auto_style}`}
                onClick={() => this.fn_doAuto()}
                disabled={!btn.btn_auto_enabled}
            >
                <span className="mobile-btn-icon">
                    <i className="bi bi-signpost-split-fill" />
                </span>
                AUTO
            </button>
        );

        // BRAKE
        actions.push(
            <button
                key="brake"
                className={`mobile-action-btn ${btn.btn_brake_style}`}
                onClick={() => this.fn_doBrake()}
                disabled={!btn.btn_brake_enabled}
            >
                <span className="mobile-btn-icon">
                    <i className="bi bi-stop-btn" />
                </span>
                BRAKE
            </button>
        );

        // LAND
        actions.push(
            <button
                key="land"
                className={`mobile-action-btn ${btn.btn_land_style}`}
                onClick={() => this.fn_doLand()}
                disabled={!btn.btn_land_enabled}
            >
                <span className="mobile-btn-icon">
                    <i className="bi bi-arrow-down-circle-fill" />
                </span>
                LAND
            </button>
        );

        return (
            <div className="mobile-actions">
                {actions}
            </div>
        );
    }
}

export default withTranslation()(ClssCtrlMobileFlightControl);
