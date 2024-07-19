import $ from 'jquery'; 
import React    from 'react';

import * as js_helpers from '../js/js_helpers'
import * as js_siteConfig from '../js/js_siteConfig'
import {js_globals} from '../js/js_globals.js';
import {js_eventEmitter} from '../js/js_eventEmitter'
import {js_speak} from '../js/js_speak'
import {js_andruavAuth} from '../js/js_andruavAuth'

import * as js_andruavUnit from '../js/js_andruavUnit.js';
import * as js_andruavMessages from '../js/js_andruavMessages'
import {js_localStorage} from '../js/js_localStorage'
import {js_leafletmap} from '../js/js_leafletmap'

import {fn_changeSpeed, fn_do_modal_confirmation,
     getVehicleIcon, fn_gotoUnit_byPartyID, fn_changeUnitInfo,
      hlp_getFlightMode,
      fn_isBadFencing, fn_switchGPS, fn_openFenceManager,
      fn_convertToMeter, fn_putWayPoints, fn_changeAltitude,
      toggleVideo, toggleRecrodingVideo} from '../js/js_main'


import { mavlink20 } from '../js/js_mavlink_v2.js';

import {Clss_CTRL_SETTINGS} from './gadgets/jsc_ctrl_settingsControl.jsx'
import {Clss_CTRL_P2P} from './gadgets/jsc_ctrl_p2p.jsx'

import {Clss_CTRL_UDP_PROXY_TELEMETRY} from './gadgets/jsc_ctrl_udp_proxy_telemetry.jsx'
import {Clss_MESSAGE_LOG} from './gadgets/jsc_ctrl_messagesControl.jsx' // add extension to allow encryptor to see it as same as file name.
import {Clss_CTRL_HUD} from './gadgets/jsc_ctrl_hudControl.jsx'
import {Clss_CTRL_DIRECTIONS} from './gadgets/jsc_ctrl_directionsControl.jsx'
import {Clss_CTRL_ARDUPILOT_FLIGHT_CONTROL} from './flight_controllers/jsc_ctrl_ardupilot_flightControl.jsx'
import {Clss_CTRL_PX4_FLIGHT_CONTROL} from './flight_controllers/jsc_ctrl_px4_flightControl.jsx'
import {Clss_CTRL_SWARM} from './gadgets/jsc_ctrl_swarm.jsx'
import {Clss_CTRL_AUDIO} from './gadgets/jsc_ctrl_audio.jsx'

class Clss_AndruavUnit extends React.Component {
    constructor(props)
	{
		super (props);
		this.state = {
		    'm_update': 0,
            'm_IsGCS':this.props.m_unit.m_IsGCS,
		};

        this._isMounted = false;
        
        js_eventEmitter.fn_subscribe(js_globals.EE_unitUpdated,this,this.fn_unitUpdated);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitNavUpdated,this,this.fn_unitUpdated);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitTelemetryOn,this,this.fn_unitTelemetryOn);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitTelemetryOff,this,this.fn_unitTelemetryOFF);
        
    }

    fn_unitUpdated (me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.m_unit.partyID) 
        {
          //  js_globals.fn_console_log ('err: This is not me ' + p_andruavUnit.partyID);
            return ; // not me
        }

      

        if (p_andruavUnit.m_IsGCS !== me.props.m_unit.m_IsGCS)
        {
            // Drone converted to GCS or other type... class is not valid now and an add new should be created.
          // js_globals.fn_console_log ('err: Convert Me ' + p_andruavUnit.partyID);
           
           js_eventEmitter.fn_dispatch(js_globals.EE_unitAdded,p_andruavUnit);
	
        }

        var v_date = p_andruavUnit.date;
        if (v_date === null || v_date === undefined)
        {
            p_andruavUnit.date = new Date();
        }
        else
        {
            var n = new Date();
            if ((n - p_andruavUnit.date) < 300)
            {
                return ;
            }
            p_andruavUnit.date = new Date();
        }

       // js_globals.fn_console_log ('err: Force Update ' + p_andruavUnit.partyID);
          
       if (me._isMounted!==true) return ;
        
       me.setState({'m_update': me.state.m_update +1});
       //me.state.m_update += 1;
       //me.forceUpdate();
       
    }

    fn_unitTelemetryOn (me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.m_unit.partyID) 
        {
          //  js_globals.fn_console_log ('err: This is not me ' + p_andruavUnit.partyID);
            return ; // not me
        }
        
        me.forceUpdate();
    }

    fn_unitTelemetryOFF(me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.m_unit.partyID) 
        {
          //  js_globals.fn_console_log ('err: This is not me ' + p_andruavUnit.partyID);
            return ; // not me
        }
        
        me.forceUpdate();
    }

   
    childcomponentWillMount() {};
    childcomponentWillUnmount() {};

    
    componentDidMount() 
    {
        this._isMounted = true;
        
        this.childcomponentWillMount();
    }

    componentWillUnmount () {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe(js_globals.EE_unitUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitNavUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitTelemetryOn,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitTelemetryOff,this);
        this.childcomponentWillUnmount();
    }

    

    fn_changeSpeed (e, p_andruavUnit, p_speed)
    {
        if (fn_changeSpeed === false) return ; // no speed info
      fn_changeSpeed (p_andruavUnit);
    }

    fn_changeSpeedByStep (e, p_andruavUnit, p_step)
    {
        var p_speed = p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed;
        if (p_speed === 0)
        {
            p_speed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
        }
        p_speed = parseFloat(p_speed) + p_step;
        if (p_speed === null || p_speed === undefined) return ;
        
        if (p_speed <= 0 )
        {
            // BAD SPEED
            // TODO: Put a popup message here.
            js_speak.fn_speak('speed cannot be zero');
            return ;
        }

        if (isNaN(p_speed ) === true)
        {
            js_speak.fn_speak('set speed to 5m/s');
            p_speed = 5.0
        }
        
        var v_speak = "change speed to ";
        // save target speed as indication.
		p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed = parseFloat(p_speed);
        
        
        if (js_globals.v_useMetricSystem === true) {
            v_speak = v_speak + p_speed.toFixed(1) + " meter per second";
        }
        else {
            v_speak = v_speak + (p_speed * js_helpers.CONST_METER_TO_MILE).toFixed(1) + "mile per hour";
        }

        js_speak.fn_speak(v_speak);

        js_globals.v_andruavClient.API_do_ChangeSpeed1(p_andruavUnit, parseFloat(p_speed));
    }

    fn_takeTXCtrl (e,p_andruavUnit)
    {
        p_andruavUnit.m_Telemetry.m_rxEngaged = true;
        js_globals.v_andruavClient.API_TXCtrl (p_andruavUnit, js_andruavMessages.CONST_TX_SIGNAL_FREEZE_ALL);
        js_eventEmitter.fn_dispatch (js_globals.EE_requestGamePad, p_andruavUnit);
            
    }

    fn_releaseTXCtrl (p_andruavUnit)
    {
        p_andruavUnit.m_Telemetry.m_rxEngaged = false;
        js_globals.v_andruavClient.API_TXCtrl (p_andruavUnit, js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED);
        js_eventEmitter.fn_dispatch (js_globals.EE_requestGamePadreleaseGamePad, p_andruavUnit);
            
    }


    fn_sendParametersToGCS(p_andruavUnit)
    {
        if (js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) return;
        
        // if (p_andruavUnit.m_Telemetry._isActive === true) {
        //     js_globals.v_andruavClient.sendParametersValuesToGCS(p_andruavUnit);
        // }

        js_eventEmitter.fn_dispatch(js_globals.EE_requestGamePaddisplayParameters, p_andruavUnit);
    }


    fn_gotoUnit_byPartyID (e,v_andruavUnit)
    {
        //js_globals.v_andruavClient.API_requestID(p_partyID);
        fn_gotoUnit_byPartyID(v_andruavUnit.partyID);
        js_globals.v_andruavClient.API_do_GetHomeLocation(v_andruavUnit);
    }

    fn_changeUnitInfo (v_andruavUnit)
    {
        if ((js_siteConfig.CONST_FEATURE.hasOwnProperty('DISABLE_UNIT_NAMING')) && (js_siteConfig.CONST_FEATURE.DISABLE_UNIT_NAMING===true)) return ;
        fn_changeUnitInfo (v_andruavUnit);
    }

    fn_toggleCamera(p_andruavUnit)
    {
        function fn_callback (p_session)
        {
            if ((p_session !== null && p_session !== undefined) && (p_session.status === 'connected')) 
            {
                js_eventEmitter.fn_dispatch(js_globals.EE_displayCameraDlgForm, p_session);
            }
        }
        
        js_globals.v_andruavClient.API_requestCameraList(p_andruavUnit, fn_callback);

    }

}

class Clss_AndruavUnit_GCS extends Clss_AndruavUnit {
    constructor(props)
	{
		super (props);
    }

    render ()
    {
        var v_andruavUnit = this.props.m_unit; 
        var v_hidden = "";
        if (this.props.v_en_GCS === false)
        {
            v_hidden = 'hidden';
        } 
        if (v_andruavUnit === null || v_andruavUnit === undefined) return ;
        
        return (
         <div id={v_andruavUnit.partyID + "__FAKE"}  className={v_hidden + " row mb-1 mt-0 me-0 ms-0 pt-1 IsGCS_" + v_andruavUnit.m_IsGCS + " IsShutdown_" + v_andruavUnit.m_IsShutdown}>
            <div className='col-11 css_margin_zero padding_zero'>
                <div className='col-1' ><img className='gcs IsGCS_true cursor_hand' src={getVehicleIcon(v_andruavUnit)} alt='GCS' onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)} /> </div>
                <div className='col-11'><p id='id' className='text-right text-warning cursor_hand'> GCS [<strong>{v_andruavUnit.m_unitName}</strong>]</p></div>
            </div>
        </div>
        );
    }
}


class Clss_AndruavUnit_Drone extends Clss_AndruavUnit {
    constructor(props)
	{
		super (props);
        this.localvars={};
        this.localvars.speed_link = false;	
		this.telemetry_level=["OFF","1","2","3"];
    }

    

    fn_requestGamePad(me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.m_unit.partyID) 
        {
           // someone else wanta GamePad, I will release it if I have it.
            return ; // not me
        }
                
        p_andruavUnit.m_Telemetry.m_rxEngaged = true;
        
        me.forceUpdate();
    }

    fn_webRX_toggle (p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
        if (p_andruavUnit.m_Telemetry.m_rxEngaged==true)
        {
            js_globals.v_andruavClient.API_disengageRX(p_andruavUnit);        
            js_eventEmitter.fn_dispatch (js_globals.EE_requestGamePadreleaseGamePad, p_andruavUnit);
            p_andruavUnit.m_Telemetry.m_rxEngaged = false;
            
        }
        else
        {
            js_globals.v_andruavClient.API_engageRX(p_andruavUnit);	
        }
    }
    
    fn_clearWayPoints(p_andruavUnit, p_fromFCB) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;

        fn_do_modal_confirmation("Delete Mission for " + p_andruavUnit.m_unitName,
            "Are you sure you want to delete mission?", function (p_approved) {
                if (p_approved === false) return;
				js_globals.v_andruavClient.API_clearWayPoints(p_andruavUnit, p_fromFCB);

            }, "YES", "bg-danger text-white");
    }


    fn_requestWayPoints(p_andruavUnit, fromFCB) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        js_globals.v_andruavClient.API_requestWayPoints(p_andruavUnit, fromFCB);
    }


  


    fn_doChangeAltitudeByStep (p_andruavUnit, p_AltitudeInMeter)
    {
        js_globals.fn_console_log ("fn_doChangeAltitudeByStep:" + p_AltitudeInMeter);
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
        
        if ((p_AltitudeInMeter === null || p_AltitudeInMeter === undefined) || (p_AltitudeInMeter < js_globals.CONST_DEFAULT_ALTITUDE_min)) return ;

        var v_speak;
        
        if (js_globals.v_useMetricSystem === true) {
            v_speak = p_AltitudeInMeter.toFixed(1) + "meters";
        }
        else {
            v_speak = (p_AltitudeInMeter * js_helpers.CONST_METER_TO_FEET).toFixed(1) + "feet";
        }

        
        if (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE)
        {
            v_speak = "change depth to " + v_speak;

            js_globals.v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, -p_AltitudeInMeter);
        }
        else
        {
            v_speak = "change altitude to " + v_speak;
            
            js_globals.v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, p_AltitudeInMeter);
        }

        js_speak.fn_speak(v_speak);

    }
   



    fn_connectToFCB (p_andruavUnit)
	{
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
		js_globals.v_andruavClient.API_connectToFCB(p_andruavUnit);
	}


    hlp_getGPS (p_andruavUnit)
    {
        var res = {
        m_gps_class: "",
        m_gps_text: "",
        m_gps_text2: "",
        m_gps_status: "",
        m_gps_source: ""
        }

        res.m_gps_class = "bg-danger text-white text-center";
        if (p_andruavUnit.m_GPS_Info1.m_isValid === true)
        {
            switch (p_andruavUnit.m_GPS_Info1.GPS3DFix)
            {
                case 1:
                    res.m_gps_text = "No Fix";
                    res.m_gps_class = "bg-danger text-white text-center";
                break;

                case 2:
                    res.m_gps_class = "bg-warning";
                break;

                case 3:
                    res.m_gps_class = "bg-info text-white text-center";
                    res.m_gps_text  ="3D Fix";
                break;
                case 4:
                    res.m_gps_class = ' bg-primary ';
                    res.m_gps_text  =' DGPS ';
                break;
                case 5:
                    res.m_gps_class = ' bg-primary ';
                    res.m_gps_text  =' RTK-Fl ';
                break;
                case 6:
                    res.m_gps_class = ' bg-primary ';
                    res.m_gps_text  =' RTK-Fx ';
                break;
                case 7:
                    res.m_gps_class = ' bg-primary ';
                    res.m_gps_text  =' static ';
                break;
                case 8:
                    res.m_gps_class = ' bg-primary ';
                    res.m_gps_text  =' ppp ';
                break;
            }

            switch (p_andruavUnit.m_GPS_Info1.gpsMode)
            {
                case 0:
                    res.m_gps_status = 'GPS Auto';
                    res.m_gps_source = "A-gps: ";
                    break;
                case 1:
                    res.m_gps_status = 'GPS From Mobile';
                    res.m_gps_source = "M-gps: ";
                    break;
                case 2:
                    res.m_gps_status = 'GPS From FCB';
                    res.m_gps_source = "F-gps: ";
                    break;
        }

            res.m_gps_text2 = " [" + p_andruavUnit.m_GPS_Info1.m_satCount + " sats]";

           
        }
        else
        {
            
            res.m_gps_text  =" No GPS";
            res.m_gps_status = "GPS Status";
            res.m_gps_source = "?-gps: ";        
        }

       
        return res;
    }

    hlp_getBatteryCSSClass (p_andruavUnit)
	{
        const p_Power = p_andruavUnit.m_Power;

        if ((p_andruavUnit.m_IsShutdown === true) || (p_Power._Mobile.p_Battery.p_hasPowerInfo === false)) 
            return { v_battery_src:"./images/battery_gy_32x32.png", css:"battery_inactive",level:0, charging:"unknown"};
        
        var v_bat = p_Power._Mobile.p_Battery.PlugStatus + " ";
		const batteryLevel = p_Power._Mobile.p_Battery.BatteryLevel;
        var v_battery_src = "./images/battery_gy_32x32.png";
        if (parseInt(batteryLevel,0) > 80)
		{
            v_bat += ' battery_4 ';
            v_battery_src = "./images/battery_g_32x32.png";
		}
		else if (parseInt(batteryLevel,0) > 50)
		{
		    v_bat += ' battery_3 ';
            v_battery_src = "./images/battery_rg_32x32.png";
		
		}
		else if (parseInt(batteryLevel,0) > 25)
		{
		    v_bat += ' battery_2 ';
            v_battery_src = "./images/battery_rg_3_32x32.png";
		
		}
		else 
		{
		    v_bat += ' battery_1 ';
            v_battery_src = "./images/battery_r_32x32.png";
		
		}
			 
		return { m_battery_src: v_battery_src, css:v_bat,level:batteryLevel, charging: p_Power._Mobile.p_Battery.PlugStatus}; 
	}


	hlp_getFCBBatteryCSSClass (p_andruavUnit)
	{
        var v_battery_display_fcb_div = "";
        var v_battery_src = "./images/battery_gy_32x32.png";
        const p_Power = p_andruavUnit.m_Power;

	    var v_remainingBat = p_Power._FCB.p_Battery.FCB_BatteryRemaining;
		var v_bat = " ";
			 
		if ((p_andruavUnit.m_IsShutdown === true) || (p_andruavUnit.m_Power._FCB.p_Battery.p_hasPowerInfo === false))
        {
            v_battery_display_fcb_div = " hidden ";
            return { v_battery_src:"./images/battery_gy_32x32.png", css:v_bat,level:v_remainingBat, charging: 'unknown', v_battery_display_fcb_div: v_battery_display_fcb_div};
        }

		if (p_Power._FCB.p_Battery.p_hasPowerInfo === false) return null;

        if (parseInt(v_remainingBat,0) > 80)
		{
		    v_bat += ' battery_4 ';
            v_battery_src = "./images/battery_g_32x32.png";
		}
		else if (parseInt(v_remainingBat,0) > 50)
		{
		    v_bat += ' battery_3 ';
            v_battery_src = "./images/battery_rg_32x32.png";
		}
		else if (parseInt(v_remainingBat,0) > 25)
		{
		    v_bat += ' battery_2 ';
            v_battery_src = "./images/battery_rg_3_32x32.png";
		}
		else 
		{
		    v_bat += ' battery_1 ';
            v_battery_src = "./images/battery_r_32x32.png";
		}
			 
	    return { m_battery_src:v_battery_src, css:v_bat, level:v_remainingBat, charging: 'unknown', v_battery_display_fcb_div: v_battery_display_fcb_div}; 
	}

    hlp_getflightButtonStyles (p_andruavUnit)
	{
	    var res = {};
        res.btn_takeCTRL_class          = "";
        res.btn_releaseCTRL_class       = "";
        res.btn_sendParameters_class    = " disabled hidden ";
        res.btn_tele_class              = "";
        res.btn_load_wp_class           = "";
        
        res.btn_servo_class         = " btn-success ";

        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false )
        {
            res.btn_servo_class = " disabled hidden ";
        }
        
            
        const  c_manualTXBlockedSubAction = p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction();
            

		if (p_andruavUnit.m_isArmed==true) 
		{
            res.btn_takeCTRL_class      = ((c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_CENTER_CHANNELS) || (c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_FREEZE_CHANNELS))?" btn-danger   ":" btn-primary   ";
            res.btn_releaseCTRL_class 	= c_manualTXBlockedSubAction !== js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED?" btn-danger   ":" btn-primary   ";
		}
		else
		{
            // NOT ARMED

			res.btn_takeCTRL_class      = ((c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_CENTER_CHANNELS) || (c_manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_FREEZE_CHANNELS))?" btn-danger   ":" btn-primary   ";
            res.btn_releaseCTRL_class 	= c_manualTXBlockedSubAction !== js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED?" btn-danger   ":" btn-primary   ";
		}


        if (p_andruavUnit.m_isDE === true)
        {
            res.btn_sendParameters_class = " btn-primary  ";
        }
        
        if ((p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() !== js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS)
        && (p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() !== js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED))
        {   
            res.btn_rx_class          = " btn-primary ";
            res.btn_rx_text           = "R/C Off";
            res.btn_rx_title          = "Press to take control using Web - TX";
        }

        else if ((p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() === js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS)
        || (p_andruavUnit.m_Telemetry.fn_getManualTXBlockedSubAction() === js_andruavMessages.CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS_GUIDED))
        {

            if (p_andruavUnit.m_Telemetry.m_rxEngaged === true)
            {
                res.btn_rx_class          = " btn-danger ";
                res.btn_rx_text           = " R/C On";
                res.btn_rx_title          = " You control this drone using Web - TX";

            }
            else   
            {
                res.btn_rx_class          = " btn-outline-warning ";
                res.btn_rx_text           = " R/C Off";
                res.btn_rx_title          = "Drone is being controller by another GCS";
            }
        }
        else
        {  
            if (p_andruavUnit.m_Telemetry.m_rxEngaged === true)
            {
                res.btn_rx_class          = " btn-danger ";
                res.btn_rx_text           = " R/C On";
                res.btn_rx_title          = " You control this drone using Web - TX";

            }
            else   
            {
                res.btn_rx_class          = " btn-outline-warning hidden";
                res.btn_rx_text           = " R/C Off";
                res.btn_rx_title          = "Drone is being controller by another GCS";
            }
        }

        // for now this feature is disabled.
        //res.btn_rx_class   = "hidden disabled"; 
        res.btn_save_wp_class  = "btn-danger";
        res.btn_clear_wp_class = "btn-danger";
        res.btn_load_wp_class  = "btn-primary";

	    return res;
	}

    componentDidUpdate() {
        var cam = $(".dropdown-menu li a");
        if (cam !== null && cam !== undefined) 
        {
            cam.on('click', function(){
                var selText = $(this).attr('data-value');
                $(this).parents('.btn-group').siblings('.menu').html(selText)
            });
        }
        
     }
    
   
    childcomponentWillMount () {
        js_eventEmitter.fn_subscribe(js_globals.EE_requestGamePad,this,this.fn_requestGamePad);
    }

    childcomponentWillUnmount () {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_requestGamePad,this);
    }

    
    renderIMU (v_andruavUnit)
    {
        var v_fence_text = "unknown";
		var v_fence_class = "text-muted";
		var v_altitude_text = "";
		var v_speed_text = "";	
		var v_yaw_text;
        var v_yaw_knob = [];
        var v_fcb_mode_title;		
		var v_bearing_text;
        var v_bearing_knob = [];
        var v_bearingTarget_text;
        var v_bearingTarget_knob = [];
        var v_flight_mode_text;
        var v_flight_mode_class = ' ';
        var v_distanceToMe_text;
        var v_distanceToMe_class;
        var v_flight_status_text;
        var v_flight_status_class;
        var distanceToWP_class;
        var wpdst_text;
        var v_flyingTime = " ";
        var v_totalFlyingTime = " ";
        var v_now = (new Date()).valueOf() ;
        
        
        if (v_andruavUnit.m_isFlying === true) 
        {
            if ((v_andruavUnit.m_FlyingLastStartTime !== null && v_andruavUnit.m_FlyingLastStartTime !== undefined) || (v_andruavUnit.m_FlyingLastStartTime === 0))
            {
                /**
                 * You need to depend on board. cannot assume that board Local Time is the same so you neeed to rely
                 * on second difference. however you can make local counter to update time untill second update received from vehicle
                 * so that vehilce does not need to send many messages just to update time.
                 */
                v_flyingTime = js_helpers.fn_getTimeDiffDetails_Shortest ( v_andruavUnit.m_FlyingLastStartTime ); 
            }
            if (v_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE)
            {
                v_flight_status_text = 'Diving';
            }
            else
            {
                v_flight_status_text = 'Flying';
            }
            v_flight_status_class = 'bg-danger text-white cursor_hand ';
        }
        else
        {
            v_flight_status_text = 'On Ground';
            v_flight_status_class = 'bg-success text-white';
        }

        // calculate Total Time
        const c_delta = v_andruavUnit.m_FlyingLastStartTime==0?0.0:v_andruavUnit.m_FlyingLastStartTime;
        v_totalFlyingTime = js_helpers.fn_getTimeDiffDetails_Shortest ( (c_delta + v_andruavUnit.m_FlyingTotalDuration));
        
        
        if (v_andruavUnit.m_Nav_Info.p_Location.ground_speed==null) 
        {
            v_speed_text = 'NA'; 
        }else
        { 
            v_speed_text = v_andruavUnit.m_Nav_Info.p_Location.ground_speed;
		    this.localvars.speed_link = true;
            if (js_globals.v_useMetricSystem==true)
            {
                v_speed_text = v_speed_text.toFixed(0) + ' m/s';
            }
            else
            {
                v_speed_text = ( v_speed_text * js_helpers.CONST_METER_TO_MILE).toFixed(0) + ' mph';
            }
            
        }


        switch (v_andruavUnit.m_telemetry_protocol)
        {
            case js_andruavMessages.CONST_TelemetryProtocol_CONST_No_Telemetry:
                v_flight_mode_text = 'No FCB Connected';
                v_flight_mode_class = ' bg-warning ';
                
                v_fcb_mode_title = 'Click to connect to FCB if not active';
            break;
            case js_andruavMessages.CONST_TelemetryProtocol_CONST_Andruav_Telemetry:
            case js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry:
            case js_andruavMessages.CONST_TelemetryProtocol_CONST_MW_Telemetry:
            case js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry:
            case js_andruavMessages.CONST_TelemetryProtocol_DJI_Telemetry:
            case js_andruavMessages.CONST_TelemetryProtocol_CONST_Unknown_Telemetry:
                v_flight_mode_text = "mode - " + hlp_getFlightMode(v_andruavUnit);
                v_flight_mode_class = ' bg-info text-white ';
                v_fcb_mode_title = 'Flight Mode';

            break;
        }

        v_flight_mode_class += ' cursor_hand ';

        if (v_andruavUnit.m_Nav_Info.p_Location.lat === null || v_andruavUnit.m_Nav_Info.p_Location.lat === undefined)
        {
            v_distanceToMe_class = ' bg-danger text-white cursor_hand ';
            v_distanceToMe_text = 'No Unit GPS';
        }
        else if (js_globals.myposition === null || js_globals.myposition === undefined)
        {
            v_distanceToMe_text = 'No GCS GPS';
            v_distanceToMe_class = ' bg-danger text-white cursor_hand ';
        }
        else
        {
            var v_lat2 = v_andruavUnit.m_Nav_Info.p_Location.lat;
            var v_lng2 = v_andruavUnit.m_Nav_Info.p_Location.lng;
            var distance = js_helpers.fn_calcDistance (js_globals.myposition.coords.latitude,js_globals.myposition.coords.longitude,v_lat2,v_lng2) ;
            if (js_globals.v_useMetricSystem==true) 
            {
                v_distanceToMe_text = Number(distance.toFixed(0)).toLocaleString() + " m";
            }
            else
            {
                v_distanceToMe_text = Number((distance * js_helpers.CONST_METER_TO_FEET).toFixed(0)).toLocaleString() + " ft";
            }

            if (distance > js_globals.CONST_DFM_FAR)
            {
                v_distanceToMe_class = ' bg-danger text-white  cursor_hand ';
            }
            else if (distance > js_globals.CONST_DFM_SAFE)
            {
                v_distanceToMe_class = 'bg-info  text-white';
            }
            else
            {
                v_distanceToMe_class = 'bg-success text-white';
            }
           
        }


        var v_alt_title, v_alt_remark;

        if (v_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE)
        {
            v_alt_title ='depth:';
            v_alt_remark = 'depth';
        }
        else
        {
            v_alt_title = 'Alt:';
            v_alt_remark = 'Alt ';
        }    
        
        v_alt_remark += 'display: relative/absolute ... step: ' + js_localStorage.fn_getDefaultAltitude();

        if (js_globals.v_useMetricSystem === true) {
            v_alt_remark += " m";
        }
        else
        {
            v_alt_remark += " feet";
        }

        
		var v_altitude = v_andruavUnit.m_Nav_Info.p_Location.alt;
		if (v_altitude==null) 
        {
            v_altitude = 'NA';
        } 
        else 
        {
            if (js_globals.v_useMetricSystem==true)
            {
                v_altitude = v_altitude.toFixed(0).toString() + "m";
            }
            else
            {
                v_altitude = (v_altitude * js_helpers.CONST_METER_TO_FEET).toFixed(0) + "ft";
            }
        }

        var v_altitude_abs = v_andruavUnit.m_Nav_Info.p_Location.alt_abs;
		if (v_altitude_abs==null) 
        {
            v_altitude_abs = 'NA';
        } 
        else 
        {
            if (js_globals.v_useMetricSystem==true)
            {
                v_altitude_abs = v_altitude_abs.toFixed(0).toString() + "m";
            }
            else
            {
                v_altitude_abs = (v_altitude_abs * js_helpers.CONST_METER_TO_FEET).toFixed(0) + "ft";
            }
        }

        v_altitude_text = v_altitude + '/' + v_altitude_abs;    

        // if (js_globals.v_useMetricSystem==true)
        //     {
        //         v_altitude_text = v_altitude_text.toFixed(0).toString();
                
        //         if (v_andruavUnit.m_Nav_Info.p_Location.alt_abs!= null) 
        //         {
        //             v_altitude_text += '/' + v_andruavUnit.m_Nav_Info.p_Location.alt_abs.toFixed(0).toString();
        //         }
                
        //         v_altitude_text += " m";

        //     }
        //     else
        //     {
        //         v_altitude_text = (v_altitude_text * js_helpers.CONST_METER_TO_FEET).toFixed(0);
                
        //         if (v_andruavUnit.m_Nav_Info.p_Location.alt_abs!= null) 
        //         {
        //             v_altitude_text += '/' + (v_andruavUnit.m_Nav_Info.p_Location.alt_abs * js_helpers.CONST_METER_TO_FEET).toFixed(0).toString();
        //         }
                
        //         v_altitude_text += " ft";

        //     }
        //}
						
		if (v_andruavUnit.m_Nav_Info.p_Orientation.yaw==null)
        {
             v_yaw_text = 'HUD - unknown';
             v_yaw_knob = '';
        }
        else 
        {
            const c_yaw = (js_helpers.CONST_RADIUS_TO_DEGREE * ((v_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1);
            const c_pitch = ((js_helpers.CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.pitch) ).toFixed(1);
            const c_roll = ((js_helpers.CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.roll) ).toFixed(1);
            v_yaw_text = 'HUD';
            v_yaw_knob.push(<Clss_CTRL_HUD key={v_andruavUnit.partyID + "_hud"} id={v_andruavUnit.partyID + "_hud"} v_pitch={c_pitch} v_roll={c_roll} v_yaw={c_yaw}  title ='Pitch: {v_pitch}'/>);
          }

        if (v_andruavUnit.m_Nav_Info.p_Location.bearing==null)
        {
              v_bearing_text = 'bearing/target';
              v_bearing_knob = '';
              v_bearingTarget_knob = '';

        }
        else
        {
            v_bearing_text = 'bearing/target';
            //v_andruavUnit.m_Nav_Info._Target.target_bearing = 90.0;
            //v_andruavUnit.m_Nav_Info.p_Desired.nav_bearing = 10.0;
            const c_target = v_andruavUnit.m_Nav_Info._Target.target_bearing ; // ) % js_helpers.CONST_PTx2)).toFixed(1);
            const c_bearing = v_andruavUnit.m_Nav_Info.p_Desired.nav_bearing ;
            v_bearing_knob.push(<Clss_CTRL_DIRECTIONS key={v_andruavUnit.partyID + "_tb"} id={v_andruavUnit.partyID + "_tb"} v_target={c_target} v_bearing={c_bearing} />);

        }

        const target = v_andruavUnit.m_Nav_Info._Target;

		if ((target.wp_dist === null || target.wp_dist === undefined) 
        || (target.wp_dist < 0 ))
        {
            wpdst_text = "na";
            distanceToWP_class = ' text-light ';
            
        }
        else
        {
            
            
            if (js_globals.v_useMetricSystem==true)
            {
                wpdst_text =   Number(target.wp_dist.toFixed(1)).toLocaleString()  + ' m'; // >' + v_andruavUnit.m_Nav_Info._Target.wp_num;
            }
            else
            {
                wpdst_text =  Number(target.wp_dist * js_helpers.CONST_METER_TO_FEET).toFixed(1).toLocaleString() + ' ft'; // >' + v_andruavUnit.m_Nav_Info._Target.wp_num;
            }

            wpdst_text += " >> " + target.wp_num + "/" + target.wp_count;

            if (target.wp_dist > js_globals.CONST_DFM_FAR)
            {
                distanceToWP_class = ' bg-danger text-white cursor_hand ';
            }
            else if (target.wp_dist > js_globals.CONST_DFM_SAFE)
            {
                distanceToWP_class = ' bg-warning cursor_hand ';
            }
            else
            {
                distanceToWP_class = ' bg-info text-white cursor_hand ';
            }
        }				
						
		var res = fn_isBadFencing (v_andruavUnit);
		v_andruavUnit.m_fencestatus = res;

        if (v_andruavUnit.m_fencestatus !== null && v_andruavUnit.m_fencestatus !== undefined)
		{
		    var status;
			if ((v_andruavUnit.m_fencestatus & 0b010) === 0b010) //bad
			{
			    v_fence_text = 'fence - bad';
				v_fence_class = 'bg-danger text-white';
			}
			else if ((v_andruavUnit.m_fencestatus & 0b110) === 0b100) // good & no violation
			{ // unknown
			    v_fence_text = 'fence - good';
				v_fence_class = 'bg-success text-white';
			}
			else if ((v_andruavUnit.m_fencestatus  & 0b111) === 0b001) // out of greed areas .... display as bad
			{ // unknown
			    v_fence_text = 'fence - bad';
				v_fence_class = 'bg-danger text-white';
			}
			else
			{ // good
			    v_fence_text = 'fence - no violation';
				v_fence_class = 'bg-warning';
			}
		}

       
        var gps = this.hlp_getGPS (v_andruavUnit);

        var v_targetspeed = parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed).toFixed(2) + " m/s";
        if (js_globals.v_useMetricSystem === false) {
            // value stored in meters per seconds so convert it to miles per hour
            v_targetspeed = (parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed) * js_helpers.CONST_METER_TO_MILE).toFixed(2) + " mph";
        }

        var imu=[];
        // https://icons.getbootstrap.com/icons/caret-down-fill/
        imu.push (
                <div key={'imu_1' + v_andruavUnit.partyID} id='imu_1' className= 'row al_l  css_margin_zero'>
                    <div className = 'row al_l css_margin_zero d-flex '>
                        <div className= 'col-6 col-md-3 user-select-none  p-1'>
                                <p className=' rounded-3 text-warning cursor_hand textunit_w135' title ='Ground Speed'>
                                <span title={"decrease speed"} onClick={ (e) => this.fn_changeSpeedByStep(e,v_andruavUnit, - js_globals.CONST_DEFAULT_SPEED_STEP )}>
                                    <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                                    </svg>
                                </span>
                                <span id='speed'  title={"target: "+v_targetspeed}onClick={ (e) => this.fn_changeSpeed(e,v_andruavUnit,v_andruavUnit.m_Nav_Info.p_Location.ground_speed!=null?v_andruavUnit.m_Nav_Info.p_Location.ground_speed:this.localvars.speed_link)}>
                                <small><b>&nbsp;
                                 {'GS: ' + v_speed_text}
                                 &nbsp;</b></small>
                                </span>
                                <span title="increase speed" onClick={ (e) => this.fn_changeSpeedByStep(e,v_andruavUnit, + js_globals.CONST_DEFAULT_SPEED_STEP )}>
                                    <svg className="bi bi-caret-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z"/>
                                    </svg>
                                </span>
                                </p>
                                
                        </div>
                        <div key='gps' className= 'col-6 col-md-3 user-select-none  p-1'>
                                <p id='gps' className={' rounded-3 textunit_att_btn text-center cursor_hand p-1 ' + gps.m_gps_class} title ={gps.m_gps_status} onClick={ (e) => fn_switchGPS(v_andruavUnit)} >{gps.m_gps_source + gps.m_gps_text + ' ' + gps.m_gps_text2}</p>
                        </div>
                        <div key='DFM' className= 'col-6 col-md-3 user-select-none p-1'>
                                  <p id='DFM' className={' rounded-3 text-center textunit_att_btn p-1  ' + v_distanceToMe_class} title ="Unit's distance from Me (Browser Location)" >{"DFM: " + v_distanceToMe_text}</p>
                         </div>
                        <div key='fence' className= 'col-6 col-md-3 user-select-none p-1'>
                        <p id='fence' className={'rounded-3 textunit_att_btn text-center cursor_hand p-1 ' + v_fence_class} title ='Fence Violation Status' onClick={ (e) => fn_openFenceManager(v_andruavUnit.partyID)} >{v_fence_text}</p>
                        </div>
                    </div>

                    <div key={'alt_ctrl' + v_andruavUnit.partyID}   className = 'row al_l css_margin_zero d-flex '>
                        <div key='alt_ctrl1'  className= 'col-6 col-md-3 user-select-none  p-1'>
                                  <p id='alt'   className=' rounded-3 cursor_hand textunit_att_btn text-warning ' >
                                        <span title={"decrease altitude"} onClick={ (e) => this.fn_doChangeAltitudeByStep(v_andruavUnit, v_andruavUnit.m_Nav_Info.p_Location.alt - fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()) )}>
                                            <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                                            </svg>
                                        </span>

                                        <span title ={v_alt_remark} onClick={ (e) => fn_changeAltitude(v_andruavUnit)}>
                                            <small><b>{ v_alt_title + v_altitude_text + ' '}</b></small>
                                        </span>

                                        <span title="increase altitude" onClick={ (e) => this.fn_doChangeAltitudeByStep(v_andruavUnit, v_andruavUnit.m_Nav_Info.p_Location.alt + fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()) )}>
                                            <svg className="bi bi-caret-up" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z"/>
                                            </svg>
                                        </span>  
                                  </p>
                              
                        </div>
                        <div key={'alt_ctrl2'  + v_andruavUnit.partyID} className= 'col-6 col-md-3 css_margin_zero user-select-none  p-1'>
                                <p id='fstatus'   className={' rounded-3  textunit_att_btn text-center p-1 ' + v_flight_status_class} title = {'Total Flying: ' + v_totalFlyingTime}>
                                {v_flight_status_text + " "}   <small> {v_flyingTime}</small>
                                </p>
                        </div>
                        <div key={'wpd_ctrl3' + v_andruavUnit.partyID}  className= 'col-6 col-md-3 css_margin_zero user-select-none  p-1'>
                            <p id='wpd' className={' rounded-3 textunit_att_btn text-center p-1 ' + distanceToWP_class} title ='Distance to next waypoint' >{'wp: '+ wpdst_text}</p>
                            
                        </div>
                        <div key={'fcb_mode_ctrl4'  + v_andruavUnit.partyID}className= 'col-6 col-md-3 css_margin_zero user-select-none  p-1'>
                        <p id='fcb_mode'  className={' rounded-3 textunit_att_btn   text-center p-1 ' + v_flight_mode_class} title ={v_fcb_mode_title} onClick={ (e) => this.fn_connectToFCB(v_andruavUnit,true)}> {v_flight_mode_text } </p>
                        </div>
                    </div>

                    <div key={'yaw_ctrl'  + v_andruavUnit.partyID} className = 'row al_l bg-gradient css_margin_zero user-select-none '>
                        <div key='yaw_ctrl1' className= 'col-4   padding_zero'>
                                <p id='yaw' className=' rounded-3 text-white css_margin_zero '><small>{v_yaw_text}</small></p><div id ='imu_v_yaw_knob'>{v_yaw_knob}</div>
                        </div>
                        <div key='yaw_ctrl2' className= 'col-3  padding_zero'>
                                <p id='bearing' className=' rounded-3 text-white css_margin_zero '><small>{v_bearing_text}</small></p>
                                <div id='bearing_main' className='css_margin_zero'>
                                <div id='bearingknob' >{v_bearing_knob}</div>
                                <div id='bearingtargetknob' >{v_bearingTarget_knob}</div>
                                </div>
                        </div>
                        <div key={'telem' + v_andruavUnit.partyID} className= 'col-3   padding_zero css_user_select_text'>
                        <Clss_CTRL_UDP_PROXY_TELEMETRY key={'ctele' + v_andruavUnit.partyID} p_unit={v_andruavUnit} /> </div>
                        <div key={'swarm' + v_andruavUnit.partyID} className= 'col-2   padding_zero'>
                        <Clss_CTRL_SWARM   key={'cswarm' + v_andruavUnit.partyID}  m_unit={v_andruavUnit}/>
                        </div>
                        
                    </div>

                </div>);
        
        
					
        return imu;
    }


    renderControl (p_andruavUnit)
    {

        if (p_andruavUnit.m_useFCBIMU !== true) 
        // ||((p_andruavUnit.m_telemetry_protocol != js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry)
        //     && (p_andruavUnit.m_telemetry_protocol != js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry)))
        {
            return (
                <div id='ctrl_k' className='text-center'>
                    <p className="text-warning bg-black user-select-none bi bi-exclamation-diamond "> Flight Control Board is not Connected</p> 
                </div>
            );
        }

        if (p_andruavUnit.m_Telemetry.m_isGCSBlocked === true)
        {

            return (
                <div id='ctrl_k' className='text-center '>
                    <p className="text-danger bg-black user-select-none">BLOCKED By RC in the Field</p> 
                </div>
            );
        }

        var btn = this.hlp_getflightButtonStyles(p_andruavUnit);
        var ctrl_flight_controller=[];
        var ctrl2=[];
        var cls_ctrl_modes = '  ';
        var cls_ctrl_wp = '  ';
        if (!js_andruavAuth.fn_do_canControlWP()) 
        {   // no permission
            cls_ctrl_wp = ' hidden disabled ';
        }
        if (js_andruavAuth.fn_do_canControlModes()) 
        {
            switch (p_andruavUnit.m_autoPilot)
            {
                case mavlink20.MAV_AUTOPILOT_PX4:
                    ctrl_flight_controller.push(<Clss_CTRL_PX4_FLIGHT_CONTROL  key={p_andruavUnit.partyID + "_ctrl_fc"} id={p_andruavUnit.partyID + "_ctrl_fc"} v_andruavUnit={p_andruavUnit}/>);
                break;
                default:
                    ctrl_flight_controller.push(<Clss_CTRL_ARDUPILOT_FLIGHT_CONTROL  key={p_andruavUnit.partyID + "_ctrl_fc"} id={p_andruavUnit.partyID + "_ctrl_fc"} v_andruavUnit={p_andruavUnit}/>);
                break;
            }
        }
        else
        {   // no permission
            cls_ctrl_modes = ' hidden disabled ';
        }




        ctrl2.push (<div key={p_andruavUnit.partyID + "rc3"}  id='rc33' className= 'col-12  al_l ctrldiv'><div className='btn-group flex-wrap '>
                    <button id='btn_refreshwp' type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_load_wp_class}   onClick={ (e) => this.fn_requestWayPoints(p_andruavUnit,true)} title="Read Waypoints from Drone">R-WP</button>
                    <button id='btn_writewp'  type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_save_wp_class}   onClick={ (e) => fn_putWayPoints(p_andruavUnit,true)} title="Write Waypoints into Drone">W-WP</button>
                    <button id='btn_clearwp'   type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_clear_wp_class}   onClick={ (e) => this.fn_clearWayPoints(p_andruavUnit,true)} title="Clear Waypoints" >C-WP</button>
                    <button id='btn_webRX'      type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_rx_class}   onClick={ (e) => this.fn_webRX_toggle(p_andruavUnit)} title={btn.btn_rx_title}>{btn.btn_rx_text}</button>
                    <button id='btn_freezerx' type='button' title="Freeze RemoteControl -DANGER-" className={'hidden btn btn-sm flgtctrlbtn ' + btn.btn_takeCTRL_class + cls_ctrl_modes} onClick={ (e) => this.fn_takeTXCtrl(e,p_andruavUnit)}>&nbsp;TX-Frz&nbsp;</button>
                    <button id='btn_releaserx' type='button' title="Release Control" className={'btn btn-sm flgtctrlbtn ' + btn.btn_releaseCTRL_class + cls_ctrl_modes} onClick={ (e) => this.fn_releaseTXCtrl(p_andruavUnit)}>&nbsp;TX-Rel&nbsp;</button>
                    <button id='btn_inject_param' type='button' title="Send Parameters to GCS" className={'btn btn-sm flgtctrlbtn ' + btn.btn_sendParameters_class } onClick={ (e) => this.fn_sendParametersToGCS(p_andruavUnit)}>&nbsp;PARM&nbsp;</button>
                    </div></div>);

        return (
            <div key={'ctrl_flight_controller'} id='ctrl_k' className='ps-2 pb-2'>
            <div className= 'row'>
            {ctrl_flight_controller}
            </div>
            <div  key={'ctrl2'} className= 'row'>
            {ctrl2}
            </div>
            <div key={'ctrl3'} className= 'row'>
            </div>
            </div>
        );
    }

    render ()
    {

        var v_andruavUnit = this.props.m_unit; 
   
        if (v_andruavUnit === null || v_andruavUnit === undefined) return ;

        var online_comment ="no signal info";
        var online_class ;
        var online_class2 ;
        var online_text ;
        var module_version          = "";
        var camera_class            = " camera_inactive ";
        var camera_src              = " ./images/camera_gy_32x32.png ";
        var video_class             = " video_inactive ";
		var video_src               = " ./images/videocam_gr_32x32.png";
		var recvideo_class          = "recvideo_inactive ";
        var recvideo_src            = "./images/video_recording_disabled_32x32.png";
        var v_battery_display_fcb  	= this.hlp_getFCBBatteryCSSClass(v_andruavUnit); 
        var v_battery_display 		= this.hlp_getBatteryCSSClass(v_andruavUnit);
        var id = v_andruavUnit.partyID + "__FAKE";
        
        module_version = (v_andruavUnit.Description+'\n');
                
        if (v_andruavUnit.m_isDE==false)
        {
            module_version += "Andruav";
        }
        else
        {
            module_version += "DE version: " + v_andruavUnit.m_version;
            const len = v_andruavUnit.m_modules.length;
            for (var i=0; i< len; ++i)
            {
                const module = v_andruavUnit.m_modules[i];
                module_version += '\n';
                module_version += module.i + ' ver:' + module.v;
            }
        }

        if ( v_andruavUnit.m_IsShutdown === true)
        {
                online_class2 =" blink_offline ";
                online_class = " blink_offline ";
                online_text  = "offline";
        }
        else
        {
            if (v_andruavUnit.m_isArmed==true) 
            {
                online_class2 =" text-info ";
                online_class = " bg-none blink_alert";
                online_text  = "Armed";
            }
            else
            {
                online_class2 =" text-info ";
                online_class = " blink_success ";
                online_text  = "online";
            }
            if (v_andruavUnit.fn_canCamera()==true)
            {
                camera_class = "cursor_hand camera_active";
                camera_src   = "./images/camera_bg_32x32.png";
            }
            else
            {
                camera_class = "camera_inactive";
                camera_src   = "./images/camera_gy_32x32.png";
            }
            if (v_andruavUnit.m_Video.fn_getVideoStreaming() === js_andruavUnit.CONST_VIDEOSTREAMING_ON)
            {
                video_class = "cursor_hand video_active";
                video_src   = "./images/videocam_active_32x32.png";
            }
            else
            {
                if (v_andruavUnit.fn_canVideo()==true)
                {
                    video_class = "cursor_hand video_ready";
                    video_src   = "./images/videocam_gb_32x32.png";

                    if (v_andruavUnit.m_Video.VideoRecording === js_andruavUnit.CONST_VIDEORECORDING_ON)  // ONDRONE RECORDING
                    {
                        recvideo_class = "cursor_hand css_recvideo_active";
                        recvideo_src   = "./images/video_recording_active_32x32.png";
                    }
                    else
                    {
                        recvideo_class = "cursor_hand css_recvideo_ready";
                        recvideo_src   = "./images/video_recording_enabled_32x32.png";
                    }

                }
                else
                {
                    video_class = "video_inactive";
                    video_src   = "./images/videocam_gr_32x32.png";
                }
            }
                        
            

            if ( v_andruavUnit.m_IsShutdown !== true) 
            {
                if ((v_andruavUnit.m_SignalStatus.mobile === true))
                {
                    //mobileNetworkType
                    //NETWORK_TYPE_LTE
                    let level = v_andruavUnit.m_SignalStatus.mobileSignalLevel;
                    if (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank < js_helpers.CONST_TELEPHONE_400G)
                    {
                        if (level < -100)
                        {
                            online_class = " badge badge-default ";
                        }else if ((level < -95) || (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_200G)) 
                        {
                            online_class = " badge badge-danger ";
                        }else if ((level < -80)  || (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_250G))
                        {  // or condition
                            online_class = " badge badge-warning ";
                        }else if ((level < -70) || (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_300G)) 
                        {
                            online_class = " badge badge-info ";
                        }else if (level < -60)
                        {
                            online_class = " badge badge-primary ";
                        }else 
                        {
                            online_class = " badge badge-success ";
                        }
                    }
                    else 
                    {
                        if (level < -140)
                        {
                            online_class = " badge badge-default ";
                        }else if (level < -124) 
                        {
                            online_class = " badge badge-danger ";
                        }else if (level < -108)
                        {
                            online_class = " badge badge-warning ";
                        }else if (level < -92) 
                        {
                            online_class = " badge badge-info ";
                        }else if (level < -80)
                        {
                            online_class = " badge badge-primary ";
                        }else 
                        {
                            online_class = " badge badge-success ";
                        }
                    }
                 
                    online_comment = js_helpers.v_NETWORK_G_TYPE[v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank] + " [" + js_helpers.v_NETWORK_G_TYPE [v_andruavUnit.m_SignalStatus.mobileNetworkType] + "] "  + level + " dbm";
                    
                }
                else
                {
                    online_comment = "no signal info";
                }
            }
        }
        js_globals.fn_console_log ("online_comment:" + online_comment);
        var rows=[];
        var sys_id = "";
        if (v_andruavUnit.m_FCBParameters.m_systemID!=0)
        {
            sys_id=':' + v_andruavUnit.m_FCBParameters.m_systemID + ' ';
        }
        if ((v_andruavUnit.m_IsShutdown === false) && (v_andruavUnit.m_Power._FCB.p_Battery.p_hasPowerInfo === true))
        {
            if (v_andruavUnit.m_isDE !== true) 
            {
                rows.push (<div key={id +"__5"} className= 'col-1  padding_zero'><img className={v_battery_display.css}  src={v_battery_display.m_battery_src} title={'Andruav batt: ' + v_battery_display.level +'% ' + v_battery_display.charging }/></div>);
            }
            // add FCB battery
            rows.push (<div  key={id +"fc1"} className= "col-1 padding_zero"><img className= {v_battery_display_fcb.css}   src={v_battery_display_fcb.m_battery_src}  title={"fcb batt: " +  parseFloat(v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryRemaining).toFixed(1) + "%  " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryVoltage/1000).toFixed(2).toString() + "v " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryCurrent/1000).toFixed(1).toString() + "A " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed).toFixed(1).toString() + " mAh " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryTemprature/1000).toFixed(1).toString() + "C"} /></div>);
            rows.push (<div  key={id +"fc2"} className= "col-1 padding_zero"  onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)} ></div>);
            rows.push (<div  key={id +"fc3"} className= "col-4 padding_zero text-end" onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)} ><p id='id' className={'cursor_hand text-right ' + online_class2 } title={module_version} onClick={ (e)=> this.fn_changeUnitInfo(v_andruavUnit)} ><strong>{v_andruavUnit.m_unitName } </strong> {sys_id}<span className={' ' + online_class}>{online_text}</span></p></div>);
        }
        else
        {
            if (v_andruavUnit.m_isDE !== true) 
            {
                rows.push (<div key={id +"__5"} className= 'col-1  padding_zero'><img className={v_battery_display.css}  src={v_battery_display.m_battery_src} title={'Andruav batt: ' + v_battery_display.level +'% ' + v_battery_display.charging }/></div>);
            }
            // add FCB battery
            rows.push (<div key={id +"fc4"} className= "col-2 padding_zero"  onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)} ></div>);
            rows.push (<div key={id +"fc5"} className= "col-4 padding_zero text-end"  onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)} ><p id='id' className={'cursor_hand text-right ' + online_class2 } title={module_version}  onClick={ (e)=> this.fn_changeUnitInfo(v_andruavUnit)}><strong>{v_andruavUnit.m_unitName + " "}</strong><span className={' ' + online_class}>{online_text}</span></p></div>);
        }

        ////////////////////////////////////TABS ---- START
        var container_tabs=[];
        var container_controls=[];
         

        container_tabs.push(<li key={v_andruavUnit.partyID + 'li1'} className="nav-item">
                        <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#home" + v_andruavUnit.partyID}>Main</a>
                        </li>);
        container_tabs.push(<li key={v_andruavUnit.partyID + 'li2'} className="nav-item">
                        <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#log" + v_andruavUnit.partyID}>Log</a>
                        </li>);
        container_tabs.push(<li key={v_andruavUnit.partyID + 'li3'} className="nav-item">
                        <a className="nav-link  user-select-none " data-bs-toggle="tab" href={"#details" + v_andruavUnit.partyID}>Details</a>
                        </li>);


        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false) && (v_andruavUnit.m_modules.has_p2p===true)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li4'} className="nav-item">
            <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#p2p" + v_andruavUnit.partyID}>P2P</a>
            </li>);
        }
       
        if ((js_siteConfig.CONST_FEATURE.DISABLE_VOICE!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE===false) && (v_andruavUnit.m_modules.has_sound===true)  || (v_andruavUnit.m_isDE === false)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li5'} className="nav-item">
            <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#audio" + v_andruavUnit.partyID}>Audio</a>
            </li>);
        }
           
    

        // Adding an empty tab
        container_tabs.push(<li key={v_andruavUnit.partyID + 'liempty'} className="nav-item">  
                        <a className="nav-link user-select-none text-dark" data-bs-toggle="tab" href={"#empty" + v_andruavUnit.partyID}>Collapse</a>
                        </li>);
        container_controls.push(<div key={v_andruavUnit.partyID + 'myTabContent_1'} className="tab-pane fade  active show pt-2" id={"home" + v_andruavUnit.partyID}>
                            {this.renderIMU(v_andruavUnit)}
                            {this.renderControl(v_andruavUnit)}
                    </div>);
        container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClss_MESSAGE_LOG'} className="tab-pane fade pt-2" id={"log" + v_andruavUnit.partyID}>
                            <Clss_MESSAGE_LOG  p_unit={v_andruavUnit}/>
                    </div>);
        container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClss_CTRL_SETTINGS'} className="tab-pane fade  pt-2" id={"details" + v_andruavUnit.partyID}>
                            <Clss_CTRL_SETTINGS p_unit={v_andruavUnit}/>
                    </div>);
       
        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false) && (v_andruavUnit.m_modules.has_p2p===true)) 
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClss_CTRL_P2P'} className="tab-pane fade pt-2" id={"p2p" + v_andruavUnit.partyID}>
                <Clss_CTRL_P2P p_unit={v_andruavUnit}/>
                </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_VOICE!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE===false) && ((v_andruavUnit.m_modules.has_sound===true) || (v_andruavUnit.m_isDE === false))) 
        {
            container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClss_CTRL_AUDIO'} className="tab-pane fade pt-2" id={"audio" + v_andruavUnit.partyID}>
                <Clss_CTRL_AUDIO p_unit={v_andruavUnit}/>
            </div>);
        }
            
        // Adding an empty tab
        container_controls.push(<div className="tab-pane fade" key={v_andruavUnit.partyID + 'myTabClss_CTRL_empty'} id={"empty" + v_andruavUnit.partyID}>
                    </div>);
        ////////////////////////////////////TABS ---- END

     return (
            
             <div  key={id +"1"} id={id} className={"row mb-1 mt-0 me-0 ms-0 pt-1 user-select-none IsGCS_" + v_andruavUnit.m_IsGCS + " card border-light IsShutdown_" + v_andruavUnit.m_IsShutdown}>
             <div  key={id +"_1"} id={v_andruavUnit.partyID + "_1"} className='row margin_2px padding_zero user-select-none '>        	
                <div key={id +"__1"} className= 'col-1  padding_zero d-flex '><img className=' cursor_hand gcs IsGCS_false small_icon' src={getVehicleIcon(v_andruavUnit)}  title={module_version}  alt='Vehicle' onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)}/></div>
                <div key={id +"__2"} className= 'col-1  padding_zero d-none d-sm-flex'><img className={camera_class  } src={camera_src} title='Take Photo' onClick={ (e) => this.fn_toggleCamera(v_andruavUnit)}/></div>
                <div key={id +"__3"} className= 'col-1  padding_zero d-none d-sm-flex '><img className={video_class   } src={video_src} title='Start Live Stream' onClick={ (e) => toggleVideo(v_andruavUnit)}/></div>
                <div key={id +"__4"} className= 'col-1  padding_zero d-none d-sm-flex '><img className={recvideo_class} src={recvideo_src} title='Start Recording on Drone' onClick={ (e) => toggleRecrodingVideo(v_andruavUnit)}/></div>
                {rows}
             </div>
             
                <ul key={v_andruavUnit.partyID + 'ul'} className="nav nav-tabs">
                    {container_tabs}
                </ul>
                <div key={v_andruavUnit.partyID + 'myTabContent'} id="myTabContent" className="tab-content padding_zero">
                    {container_controls}
                </div>
            </div>		
       );
    }
}

export default class Clss_AndruavUnitList extends React.Component {
  
    constructor()
	{
		super ();
		this.state = {
			andruavUnitPartyIDs : [],
            rnd:Math.random(),
		    'm_update': 0
		};

        this._isMounted = false;

        js_eventEmitter.fn_subscribe (js_globals.EE_requestGamePadonPreferenceChanged, this, this.fn_onPreferenceChanged);
        js_eventEmitter.fn_subscribe (js_globals.EE_requestGamePadonSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitAdded,this,this.fn_unitAdded);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitUpdated,this,this.fn_unitUpdated);
        
    }
      
    fn_unitUpdated(me,p_andruavUnit)
    {
        if (me._isMounted!==true) return ;
        
        // render is initiated via updating state
        me.setState({ 'm_update': me.state.m_update+1});
        //me.forceUpdate();
    }

    fn_unitAdded (me,p_andruavUnit)
    {
        if (me._isMounted!==true) return ;
    
        js_globals.fn_console_log ("REACT:fn_unitAdded" );

         if (me.state.andruavUnitPartyIDs.includes(p_andruavUnit.partyID)) return ;
         // http://stackoverflow.com/questions/26253351/correct-modification-of-state-arrays-in-reactjs      
         me.setState({ 
            andruavUnitPartyIDs: me.state.andruavUnitPartyIDs.concat([p_andruavUnit.partyID])
        });
    }

    fn_onSocketStatus (me,params) {
       
        if (me._isMounted!==true) return ;
    
        if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {				
                $('#andruavUnits').show();
        }
        else
        {				
                me.state.andruavUnitPartyIDs = [];
                me.setState({'m_update': me.state.m_update +1});
                //me.forceUpdate();
        }
    }

    componentDidMount() {
        this._isMounted = true;
    
    }

    fn_onPreferenceChanged(me)
    {
        if (me._isMounted!==true) return ;
        me.setState({'m_update': me.state.m_update +1});
        //me.forceUpdate();
    }

    fn_updateMapStatus(p_andruavUnit)
    {
        if (p_andruavUnit.hasOwnProperty("p_marker") === false) return;
        if (
                ((js_globals.v_en_GCS === true ) && (p_andruavUnit.m_IsGCS === true))
             || ((js_globals.v_en_Drone === true ) && (p_andruavUnit.m_IsGCS ===false))
            )
        {
            // if (p_andruavUnit.m_gui != null)
            // {
            //     //p_andruavUnit.p_marker.setMap(p_andruavUnit.m_gui.m_mapObj);
            //     js_leafletmap.setMap(p_andruavUnit.m_gui.m_marker, p_andruavUnit.m_gui.m_mapObj);
            // }   
        }
        else
        {
            js_leafletmap.fn_hideItem(p_andruavUnit.m_gui.m_marker);
        }

        return ;
    }


    componentWillUnmount () {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe (js_globals.EE_requestGamePadonPreferenceChanged,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_requestGamePadonSocketStatus,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitAdded,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitUpdated,this);
    }

    /**
     * determine text and style of tabs of each drone.
     * @param {*} v_andruavUnit 
     * @returns classes, text
     */
    getHeaderInfo(v_andruavUnit)
    {
        var bad_fcb = ((v_andruavUnit.m_useFCBIMU === false) 
        ||((v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry)
            && (v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry)));

        var classes = "";
        var text = v_andruavUnit.m_unitName;
        if (v_andruavUnit.m_FCBParameters.m_systemID!=0)
        {
            text += ":" + v_andruavUnit.m_FCBParameters.m_systemID;
        }
        if ( v_andruavUnit.m_IsShutdown === true)
        {
            classes = " blink_offline ";
        }
        else
        {
            if (bad_fcb === true) 
            {
                    classes = "blink_warning animate_iteration_5s bi bi-exclamation-diamond ";
                    text = " " + text;
                    
            }
            else 
            if (v_andruavUnit.m_isArmed==true) 
            {
                classes = " blink_alert animate_iteration_3s";
            }
            else
            {
                classes += " blink_success animate_iteration_3s ";
            }

            
        }
        return {
            'classes': classes,
            'text': text
        };
    }
    
    render() {
        var unit = [];
        
        var units_header = [];
        var units_details = [];
        var units_gcs = [];

        if (this.state.andruavUnitPartyIDs.length === 0) 
        {

            unit.push (<div key={'no_online_units'} className='text-center' >NO ONLINE UNITS</div>);
        }
        else 
        {
            var me = this;

            var sortedPartyIDs;
            if (js_localStorage.fn_getUnitSortEnabled()===true)
            {
                // Sort the array alphabetically
                // returns array
                sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSortedBy_APID();
            }
            else
            {
                // returns list
                sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSorted();
            }
            
            sortedPartyIDs.map(function (object)
            {
                const partyID = object[0];
                const v_andruavUnit = object[1];
                
                // dont display if unit is not defined yet.
                if ((v_andruavUnit==null) || (v_andruavUnit.m_defined!==true))return ;
                
                if (v_andruavUnit.m_IsGCS===true)
                {
                    units_gcs.push (<Clss_AndruavUnit_GCS key={'Clss_AndruavUnit_GCS' + partyID} v_en_GCS= {js_localStorage.fn_getGCSDisplayEnabled()} m_unit = {v_andruavUnit}/>);
                }
                else 
                if (v_andruavUnit.m_IsGCS===false)
                {
                    // Display Units (Vehicles)
                    if (js_localStorage.fn_getTabsDisplayEnabled() === true)
                    { 
                        // Display in Tabs
                        var header_info = me.getHeaderInfo(v_andruavUnit);
                        units_header.push(
                            <li id={'h' + partyID} key={'h' + partyID} className="nav-item nav-units">
                                <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_" + v_andruavUnit.partyID}><span className={header_info.classes}> {header_info.text}</span> </a>
                            </li>
                        );

                        units_details.push(
                            <div key={'aud' + partyID} className="tab-pane fade" id={"tab_"+v_andruavUnit.partyID}>
                                <Clss_AndruavUnit_Drone m_unit = {v_andruavUnit}/>
                            </div>
                        );
                    }
                    else
                    {   // Display as List
                        units_details.push(<Clss_AndruavUnit_Drone key={'aud2' + partyID}  m_unit = {v_andruavUnit}/>);
                    }
                }

                me.fn_updateMapStatus(v_andruavUnit);

            });
        }
       
        unit.push (<ul key={'unit_header_div'} className="nav nav-tabs"> {units_header} </ul>    );
        unit.push (<div key={'unit_details_div'} id="myTabContent" className="tab-content padding_zero"> {units_details} </div>);
        unit.push (units_gcs);
        
    return (

                <div key='main' className='margin_zero row'>{unit}</div>
            );
    }
};