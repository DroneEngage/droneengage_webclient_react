
import React    from 'react';

import { js_globals } from '../../js/js_globals.js';
import {js_speak} from '../../js/js_speak'

import {fn_do_modal_confirmation, fn_changeAltitude, gui_doYAW} from '../../js/js_main'
import * as js_andruavUnit from '../../js/js_andruavUnit.js';

export class Clss_CTRL_PX4_FLIGHT_CONTROL extends React.Component {
    constructor()
	{
		super ();
		    this.state = {
		};
    }

    hlp_getflightButtonStyles (p_andruavUnit)
	{
	    var res = {};
		res.btn_arm_class                   = "";
        res.btn_takeoff_class               = "";
		res.btn_climb_text                  = "Climb";
		res.btn_manual_ctl_class            = "";
        res.btn_acro_ctl_class              = "";
        res.btn_stabilize_class             = "";
        res.btn_alt_ctl_class               = "";
        res.btn_r_attd_class                = "";
        res.btn_auto_takeoff_class          = "";
        res.btn_auto_land_class             = "";
        res.btn_auto_hold_class 	        = "";
        res.btn_auto_mission_class          = "";
        res.btn_auto_rtl_class              = "";
        res.btn_auto_vtol_takeoff_class     = "";
        res.btn_pos_ctl_class               = "";
        res.btn_pos_orbit_class             = "";
        res.btn_yaw_class                   = "";

		if (p_andruavUnit.m_isArmed==true) 
		{
            switch (p_andruavUnit.m_VehicleType)
            {
                case js_andruavUnit.VEHICLE_BOAT:
				case js_andruavUnit.VEHICLE_ROVER:
                    res.btn_arm_class                   = " btn-danger ";
                    res.btn_manual_ctl_class            = " btn-primary ";
                    res.btn_yaw_class                   = " disabled hidden ";
		            res.btn_climb_class 	            = " disabled hidden ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " disabled hidden ";
                    res.btn_alt_ctl_class               = " disabled hidden ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " disabled hidden ";
                    res.btn_auto_land_class             = " disabled hidden ";
                    res.btn_auto_hold_class             = " disabled hidden ";
                    res.btn_auto_mission_class          = " btn-primary ";
                    res.btn_auto_rtl_class              = " disabled hidden ";
                    res.btn_auto_vtol_takeoff_class     = " disabled hidden ";
                    res.btn_pos_ctl_class               = " disabled hidden ";
                    res.btn_pos_orbit_class             = " disabled hidden ";
                break;
                    
                case js_andruavUnit.VEHICLE_TRI:
                case js_andruavUnit.VEHICLE_QUAD:
                    res.btn_arm_class                   = " btn-danger ";
                    res.btn_yaw_class                   = " btn-success ";
		            res.btn_climb_class 	            = " btn-warning  ";
                    res.btn_manual_ctl_class            = " btn-danger ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " btn-danger ";
                    res.btn_alt_ctl_class               = " btn-danger ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " btn-warning ";
                    res.btn_auto_land_class             = " btn-warning ";
                    res.btn_auto_hold_class             = " btn-primary ";
                    res.btn_auto_mission_class          = " btn-primary ";
                    res.btn_auto_rtl_class              = " btn-primary ";
                    res.btn_auto_vtol_takeoff_class     = " btn-outline-light disabled hidden ";
                    res.btn_pos_ctl_class               = " btn-primary ";
                    res.btn_pos_orbit_class             = " btn-primary ";
                break;

                case js_andruavUnit.VEHICLE_SUBMARINE:
                    res.btn_arm_class                   = " btn-danger ";
                    res.btn_yaw_class                   = " btn-success ";
		            res.btn_climb_text                  = "Dive";
			        res.btn_climb_class 	            = " disabled hidden ";
                    res.btn_takeoff_class               = " disabled hidden ";
		            res.btn_manual_ctl_class            = " disabled hidden ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " disabled hidden ";
                    res.btn_alt_ctl_class               = " disabled hidden ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " disabled hidden ";
                    res.btn_auto_land_class             = " disabled hidden ";
                    res.btn_auto_hold_class             = " disabled hidden ";
                    res.btn_auto_mission_class          = " disabled hidden ";
                    res.btn_auto_rtl_class              = " disabled hidden ";
                    res.btn_auto_vtol_takeoff_class     = " disabled hidden ";
                    res.btn_pos_ctl_class               = " disabled hidden ";
                    res.btn_pos_orbit_class             = " disabled hidden ";
                break;
                
                case  js_andruavUnit.VEHICLE_PLANE:
                    res.btn_arm_class                   = " btn-danger ";
                    res.btn_yaw_class                   = " disabled hidden ";
		            res.btn_climb_class 	            = " disabled hidden ";
                    res.btn_manual_ctl_class            = " btn-primary ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " btn-danger ";
                    res.btn_alt_ctl_class               = " btn-danger  ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " btn-warning ";
                    res.btn_auto_land_class             = " btn-warning ";
                    res.btn_auto_hold_class             = " btn-primary ";
                    res.btn_auto_mission_class          = " btn-primary ";
                    res.btn_auto_rtl_class              = " btn-primary ";
                    res.btn_auto_vtol_takeoff_class     = " btn-warning ";
                    res.btn_pos_ctl_class               = " btn-primary ";
                    res.btn_pos_orbit_class             = " btn-primary ";
                break; 

                default:
                    res.btn_arm_class                   = " disabled hidden ";
                    res.btn_yaw_class                   = " disabled hidden ";
		            res.btn_climb_class 	            = " disabled hidden ";
                    res.btn_manual_ctl_class            = " disabled hidden ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " disabled hidden ";
                    res.btn_alt_ctl_class               = " disabled hidden ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " disabled hidden ";
                    res.btn_auto_land_class             = " disabled hidden ";
                    res.btn_auto_hold_class             = " disabled hidden ";
                    res.btn_auto_mission_class          = " disabled hidden ";
                    res.btn_auto_rtl_class              = " disabled hidden ";
                    res.btn_auto_vtol_takeoff_class     = " disabled hidden ";
                    res.btn_pos_ctl_class               = " disabled hidden ";
                    res.btn_pos_orbit_class             = " disabled hidden ";
                break;
            }				
							
		}
		else
		{
            // NOT ARMED

			switch (p_andruavUnit.m_VehicleType)
            {
                case js_andruavUnit.VEHICLE_SUBMARINE:
                    res.btn_arm_class                   = " btn-danger ";
                    res.btn_yaw_class                   = " btn-outline-light ";
		            res.btn_climb_class 	            = " btn-outline-light ";
                    res.btn_climb_text                  = "Dive";
                    res.btn_manual_ctl_class            = " disabled hidden ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " disabled hidden ";
                    res.btn_alt_ctl_class               = " disabled hidden ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " disabled hidden ";
                    res.btn_auto_land_class             = " disabled hidden ";
                    res.btn_auto_hold_class             = " disabled hidden ";
                    res.btn_auto_mission_class          = " disabled hidden ";
                    res.btn_auto_rtl_class              = " disabled hidden ";
                    res.btn_auto_vtol_takeoff_class     = " disabled hidden ";
                    res.btn_pos_ctl_class               = " disabled hidden ";
                    res.btn_pos_orbit_class             = " disabled hidden ";
                    break;

                case js_andruavUnit.VEHICLE_BOAT:
                case js_andruavUnit.VEHICLE_ROVER:
                    res.btn_arm_class                   = " btn-outline-light ";
                    res.btn_yaw_class                   = " disabled hidden  ";
		            res.btn_manual_ctl_class            = " btn-outline-light ";
                    res.btn_climb_class 	            = " disabled hidden ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " disabled hidden ";
                    res.btn_alt_ctl_class               = " disabled hidden ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " disabled hidden ";
                    res.btn_auto_land_class             = " disabled hidden ";
                    res.btn_auto_hold_class             = " disabled hidden ";
                    res.btn_auto_mission_class          = " btn-outline-light ";
                    res.btn_auto_rtl_class              = " disabled hidden ";
                    res.btn_auto_vtol_takeoff_class     = " disabled hidden ";
                    res.btn_pos_ctl_class               = " disabled hidden ";
                    res.btn_pos_orbit_class             = " disabled hidden ";
                    break;


                case js_andruavUnit.VEHICLE_TRI:
                case js_andruavUnit.VEHICLE_QUAD:
                    res.btn_arm_class                   = " btn-danger ";
                    res.btn_yaw_class                   = " btn-outline-light ";
		            res.btn_climb_class 	            = " btn-outline-light ";
                    res.btn_manual_ctl_class            = " btn-outline-light ";
                    res.btn_acro_ctl_class              = " btn-outline-light ";
                    res.btn_stabilize_class             = " btn-outline-light ";
                    res.btn_alt_ctl_class               = " btn-outline-light ";
                    res.btn_r_attd_class                = " btn-outline-light ";
                    res.btn_auto_takeoff_class          = " btn-outline-light ";
                    res.btn_auto_land_class             = " btn-outline-light ";
                    res.btn_auto_hold_class             = " btn-outline-light ";
                    res.btn_auto_mission_class          = " btn-outline-light ";
                    res.btn_auto_rtl_class              = " btn-outline-light ";
                    res.btn_auto_vtol_takeoff_class     = " disabled hidden ";
                    res.btn_pos_ctl_class               = " btn-outline-light ";
                    res.btn_pos_orbit_class             = " btn-outline-light ";
                    break;

                case  js_andruavUnit.VEHICLE_PLANE:
                    res.btn_arm_class                   = " btn-danger ";
                    res.btn_yaw_class                   = " disabled hidden ";
		            res.btn_climb_class 	            = " btn-outline-light ";
                    res.btn_manual_ctl_class            = " btn-outline-light ";
                    res.btn_acro_ctl_class              = " disabled hidden ";
                    res.btn_stabilize_class             = " btn-outline-light ";
                    res.btn_alt_ctl_class               = " btn-outline-light ";
                    res.btn_r_attd_class                = " disabled hidden ";
                    res.btn_auto_takeoff_class          = " btn-outline-light ";
                    res.btn_auto_land_class             = " btn-outline-light ";
                    res.btn_auto_hold_class             = " btn-outline-light ";
                    res.btn_auto_mission_class          = " btn-outline-light ";
                    res.btn_auto_rtl_class              = " btn-outline-light ";
                    res.btn_auto_vtol_takeoff_class     = " btn-outline-light ";
                    res.btn_pos_ctl_class               = " btn-outline-light ";
                    res.btn_pos_orbit_class             = " btn-outline-light ";
                    break;
        
                default: 
                    break;
            } 				

		}

        return res;
	}

    fn_ToggleArm(v_andruavUnit) { //bug no need to pass parameter
        if (this.props.v_andruavUnit != null) {
            if (this.props.v_andruavUnit.m_isArmed) {
                this.fn_doDisarm(v_andruavUnit);
            }
            else {
                this.fn_doArm(v_andruavUnit);
            }
        }
    }

    fn_doArm(v_andruavUnit) { //bug no need to pass parameter
        if (this.props.v_andruavUnit != null) {
            fn_do_modal_confirmation("DANGEROUS: FORCE ADMING  " + this.props.v_andruavUnit.m_unitName + "   " + this.props.v_andruavUnit.m_VehicleType_TXT,
                "OVERRIDE ARM .. Are You SURE?", function (p_approved) {
                    if (p_approved === false) 
                    {
                        js_globals.v_andruavClient.API_do_Arm(v_andruavUnit, true, false);
                        return;
                    }
                    else
                    {
					    js_speak.fn_speak('DANGEROUS EMERGENCY DISARM');
                        js_globals.v_andruavClient.API_do_Arm(v_andruavUnit, true, true);
                        return ;
                    }
                }, "FORCED-ARM", "bg-danger text-white", "ARM");
        }
    }

    fn_doDisarm(v_andruavUnit) {
        if (this.props.v_andruavUnit != null) {
            fn_do_modal_confirmation("DANGEROUS: EMERGENCY DISARM  " + this.props.v_andruavUnit.m_unitName + "   " + this.props.v_andruavUnit.m_VehicleType_TXT,
                "STOP all MOTORS and if vehicle in air will CRASH. Are You SURE?", function (p_approved) {
                    if (p_approved === false) return;
					js_speak.fn_speak('DANGEROUS EMERGENCY DISARM');
                    js_globals.v_andruavClient.API_do_Arm(this.props.v_andruavUnit, false, true);
                }, "KILL-MOTORS", "bg-danger text-white");


        }
    }

    fn_doHold(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD);
    }

    fn_doManual(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_MANUAL);
    }

    fn_doStabilize(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_STABILIZE);
    }

    fn_doAcro(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_ACRO);
    }

    fn_doAltCtl(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_ALT_HOLD);
    }

    fn_doRAttitude(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_RATTITUDE);
    }

    fn_doTakeoff(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_AUTO_TAKEOFF);
    }

    fn_doLand(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_AUTO_LAND);
    }

    fn_doMission(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_AUTO_MISSION);
    }

    fn_doRTL(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_AUTO_RTL);
    }

    fn_doPosCtl(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_POSCTL_POSCTL);
    }

    fn_doPosOrbit(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_POSCTL_ORBIT);
    }

    fn_doVtolTakeOff(v_andruavUnit) {
        js_globals.v_andruavClient.API_do_FlightMode(this.props.v_andruavUnit.partyID, js_andruavUnit.CONST_FLIGHT_PX4_VTOL_TAKEOFF);
    }

    componentDidMount() {
    }

    componentDidUpdate() {
    }

    render ()
    {
        var btn = this.hlp_getflightButtonStyles(this.props.v_andruavUnit);
        var ctrl=[];
        

        switch (this.props.v_andruavUnit.m_VehicleType)
        {
            default:
                ctrl.push(<div key={this.props.id+"rc1"}  id={this.props.id+"rc1"}  className= 'col-12  al_l ctrldiv'><div className='btn-group flex-wrap '>
                    <button id='btn_arm' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_arm_class}  title='ARM / DISARM' onClick={ () => this.fn_ToggleArm(this.props.v_andruavUnit)}>&nbsp;ARM&nbsp;</button>
                    <button id='btn_auto_takeoff' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_auto_takeoff_class}  onClick={ () => this.fn_doTakeoff(this.props.v_andruavUnit)}>&nbsp;Takeoff&nbsp;</button>
                    <button id='btn_auto_vtol_takeoff' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_auto_vtol_takeoff_class}  title='VTOL-Takeoff' onClick={ () => this.fn_doVtolTakeOff(this.props.v_andruavUnit)}>&nbsp;V-TkOff&nbsp;</button>
                    <button id='btn_climb' type='button' className={'btn btn-sm  flgtctrlbtn '  + btn.btn_climb_class } onClick={ (e) => fn_changeAltitude(this.props.v_andruavUnit)}>&nbsp;{btn.btn_climb_text}&nbsp;</button>
                    <button id='btn_manual' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_manual_ctl_class}  title='ARM / DISARM' onClick={ () => this.fn_doManual(this.props.v_andruavUnit)}>&nbsp;Manual&nbsp;</button>
                    <button id='btn_acro_ctl' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_acro_ctl_class}  onClick={ () => this.fn_doAcro(this.props.v_andruavUnit)}>&nbsp;ACRO&nbsp;</button>
                    <button id='btn_stabilize' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_stabilize_class}   onClick={ () => this.fn_doStabilize(this.props.v_andruavUnit)}>&nbsp;Stabilize&nbsp;</button>
                    <button id='btn_alt_ctl' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_alt_ctl_class}  title='Altitude Control' onClick={ () => this.fn_doAltCtl(this.props.v_andruavUnit)}>&nbsp;Alt-CTL&nbsp;</button>
                    <button id='btn_r_attd' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_r_attd_class}  title='R-ATTITUDE' onClick={ () => this.fn_doRAttitude(this.props.v_andruavUnit)}>&nbsp;R-ATT&nbsp;</button>
                    </div></div>);
        
                ctrl.push(<div key={this.props.id+"rc2"}   id={this.props.id+"rc2"}  className= 'col-12  al_l ctrldiv'><div className='btn-group flex-wrap '>
                    <button id='btn_auto_land' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_auto_land_class}   onClick={ () => this.fn_doLand(this.props.v_andruavUnit)}>&nbsp;Land&nbsp;</button>
                    <button id='btn_auto_hold' type='button' className={'btn btn-sm  flgtctrlbtn '  + btn.btn_auto_hold_class } onClick={ (e) => this.fn_doHold(this.props.v_andruavUnit)}>&nbsp;Hold&nbsp;</button>
                    <button id='btn_auto_mission' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_auto_mission_class } onClick={ (e) => this.fn_doMission(this.props.v_andruavUnit)}>&nbsp;Mission&nbsp;</button>
                    <button id='btn_auto_rtl' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_auto_rtl_class}   onClick={ () => this.fn_doRTL(this.props.v_andruavUnit)}>&nbsp;RTL&nbsp;</button>
                    <button id='btn_auto_vtol_takeoff' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_auto_vtol_takeoff_class}  title='VTOL-Takeoff' onClick={ () => this.fn_doVtolTakeOff(this.props.v_andruavUnit)}>&nbsp;V-TkOff&nbsp;</button>
                    <button id='btn_pos_ctl' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_pos_ctl_class}  title='Position Control' onClick={ () => this.fn_doPosCtl(this.props.v_andruavUnit)}>&nbsp;Pos-Ctl&nbsp;</button>
                    <button id='btn_pos_orbit' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_pos_orbit_class}  title='APosition Orbit' onClick={ () => this.fn_doPosOrbit(this.props.v_andruavUnit)}>&nbsp;Orbit&nbsp;</button>
                    <button id='btn_yaw' type='button' className={'btn btn-sm  flgtctrlbtn ' + btn.btn_yaw_class } onClick={ (e) => gui_doYAW(this.props.v_andruavUnit.partyID)}>&nbsp;YAW&nbsp;</button>
                    </div></div>);
                break;
        }
        

        return (<div key={this.props.id+"rc"}   id={this.props.id+"rc"} >
            {ctrl}
            </div>
        );
    }
}
