import $ from 'jquery'; 
import React    from 'react';

import * as js_helpers from '../js/js_helpers.js'
import * as js_siteConfig from '../js/js_siteConfig.js'

import * as js_common from '../js/js_common.js'
import {js_globals} from '../js/js_globals.js';
import {js_eventEmitter} from '../js/js_eventEmitter.js'
import {js_andruavAuth} from '../js/js_andruavAuth.js'
import { mavlink20 } from '../js/js_mavlink_v2.js';

import {fn_do_modal_confirmation, 
     fn_gotoUnit_byPartyID,
     fn_putWayPoints, 
     toggleVideo, toggleRecrodingVideo} from '../js/js_main.js'

import * as js_andruavUnit from '../js/js_andruavUnit.js';
import * as js_andruavMessages from '../js/js_andruavMessages.js'


import {ClssMESSAGE_LOG} from './gadgets/jsc_ctrl_messagesControl.jsx' // add extension to allow encryptor to see it as same as file name.
import {ClssCTRL_SETTINGS} from './gadgets/jsc_ctrl_settingsControl.jsx'
import {ClssCTRL_P2P} from './modules/p2p/jsc_ctrl_p2p.jsx'
import {ClssCTRL_SDR} from './modules/sdr/jsc_ctrl_sdr.jsx'


import {ClssCtrlArdupilotFlightController} from './flight_controllers/jsc_ctrl_ardupilot_flightControl.jsx'
import {ClssCtrlPx4FlightControl} from './flight_controllers/jsc_ctrl_px4_flightControl.jsx'
import {ClssCTRL_AUDIO} from './gadgets/jsc_ctrl_audio.jsx'
import {ClssCTRL_Drone_IMU} from './jsc_unit_control_imu.jsx'
import {ClssAndruavUnitBase} from './jsc_unit_control_base.jsx'
import {ClssCTRL_Unit_Icon} from './gadgets/jsc_ctrl_unit_icon.jsx'

export class ClssAndruavUnit_Drone extends ClssAndruavUnitBase {
    constructor(props)
	{
		super (props);
        this.state = {
            m_update: 0,
            tab_main: this.props.tab_main,
            tab_log: this.props.tab_log,
            tab_details: this.props.tab_details,
            tab_module: this.props.tab_module,
        };

        this.props.m_unit.m_gui.speed_link = false;
    }

    
    componentDidMount () 
    {
        this.state.m_update = 1;
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
        
        if (me.state.m_update === 0) return ;
        me.setState({'m_update': me.state.m_update +1});
    }

    fn_webRX_toggle (p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
        if (p_andruavUnit.m_Telemetry.m_rxEngaged === true)
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


  


    
   



    fn_connectToFCB (p_andruavUnit)
	{
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
		js_globals.v_andruavClient.API_connectToFCB(p_andruavUnit);
	}


    

    hlp_getBatteryCSSClass (p_andruavUnit)
	{
        const p_Power = p_andruavUnit.m_Power;

        if ((p_andruavUnit.m_IsShutdown === true) || (p_Power._Mobile.p_Battery.p_hasPowerInfo === false)) 
            return { v_battery_src:"./images/battery_gy_32x32.png", css:"battery_inactive",level:0, charging:' ', temp:' '};
        
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
			 
        var temp_res = ' ? °C';
        if (p_Power._Mobile.p_Battery.BatteryTemperature !== null && p_Power._Mobile.p_Battery.BatteryTemperature !== undefined)
        {
            temp_res = ' ' + p_Power._Mobile.p_Battery.BatteryTemperature + '°C';
        }
			 
        var charging_res = ' ';
        if (p_Power._Mobile.p_Battery.PlugStatus !== null && p_Power._Mobile.p_Battery.PlugStatus !== undefined)
        {
            charging_res = p_Power._Mobile.p_Battery.PlugStatus
        }
		return { m_battery_src: v_battery_src, css:v_bat,level:batteryLevel, charging: charging_res, temp: temp_res}; 
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
            

		if (p_andruavUnit.m_isArmed === true) 
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

    
    


    renderControl (p_andruavUnit)
    {

        if (p_andruavUnit.m_useFCBIMU !== true) 
        // ||((p_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry)
        //     && (p_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry)))
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
                    ctrl_flight_controller.push(<ClssCtrlPx4FlightControl  key={p_andruavUnit.partyID + "_ctrl_fc"} id={p_andruavUnit.partyID + "_ctrl_fc"} v_andruavUnit={p_andruavUnit}/>);
                break;
                default:
                    ctrl_flight_controller.push(<ClssCtrlArdupilotFlightController  key={p_andruavUnit.partyID + "_ctrl_fc"} id={p_andruavUnit.partyID + "_ctrl_fc"} v_andruavUnit={p_andruavUnit}/>);
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
                    <button id='btn_inject_param' type='button' title="Send Parameters to GCS" className={'btn btn-sm flgtctrlbtn ' + btn.btn_sendParameters_class } onClick={ (e) => this.fn_displayParamsDialog(p_andruavUnit)}>&nbsp;PARM&nbsp;</button>
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

        let v_andruavUnit = this.props.m_unit; 
   
        if (v_andruavUnit === null || v_andruavUnit === undefined) return ;

        var online_comment ="no signal info";
        var online_class ;
        var online_class2 ;
        var online_text ;
        var camera_class            = " camera_inactive ";
        var camera_src              = " ./images/camera_gy_32x32.png ";
        var video_class             = " video_inactive ";
		var video_src               = " ./images/videocam_gr_32x32.png";
		var recvideo_class          = "recvideo_inactive ";
        var recvideo_src            = "./images/video_recording_disabled_32x32.png";
        var v_battery_display_fcb  	= this.hlp_getFCBBatteryCSSClass(v_andruavUnit); 
        var v_battery_display 		= this.hlp_getBatteryCSSClass(v_andruavUnit);
        const id = v_andruavUnit.partyID + "__FAKE";
        
        const module_version = v_andruavUnit.module_version();
                
        if ( v_andruavUnit.m_IsShutdown === true)
        {
                online_class2 =" blink_offline ";
                online_class = " blink_offline ";
                online_text  = "offline";
        }
        else
        {
            if (v_andruavUnit.m_isArmed === true) 
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
            if (v_andruavUnit.fn_canCamera === true)
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
                if (v_andruavUnit.fn_canVideo === true)
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
        js_common.fn_console_log ("online_comment:" + online_comment);
        var rows=[];
        var sys_id = "";
        if (v_andruavUnit.m_FCBParameters.m_systemID !== 0)
        {
            sys_id=':' + v_andruavUnit.m_FCBParameters.m_systemID + ' ';
        }
        if ((v_andruavUnit.m_IsShutdown === false) && (v_andruavUnit.m_Power._FCB.p_Battery.p_hasPowerInfo === true))
        {
            if (v_andruavUnit.m_isDE !== true) 
            {
                rows.push (<div key={id +"__5"} className= 'col-1  padding_zero'><img className={v_battery_display.css}  src={v_battery_display.m_battery_src} title={'Andruav batt: ' + v_battery_display.level +'% ' + v_battery_display.charging +  v_battery_display.temp }/></div>);
            }
            // add FCB battery
            rows.push (<div  key={id +"fc1"} className= "col-1 padding_zero"><img className= {v_battery_display_fcb.css}   src={v_battery_display_fcb.m_battery_src}  title={"fcb batt: " +  parseFloat(v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryRemaining).toFixed(1) +  '% ' + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryVoltage/1000).toFixed(2).toString() + "v " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryCurrent/1000).toFixed(1).toString() + "A " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed).toFixed(1).toString() + " mAh " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryTemprature/1000).toFixed(1).toString() + '°C'} /></div>);
            rows.push (<div  key={id +"fc2"} className= "col-1 padding_zero"  onClick={ (e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ></div>);
            rows.push (<div  key={id +"fc3"} className= "col-4 padding_zero text-end" onClick={ (e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ><p id='id' className={'cursor_hand text-right ' + online_class2 } title={module_version} onClick={ (e)=> this.fn_changeUnitInfo(v_andruavUnit)} ><strong>{v_andruavUnit.m_unitName } </strong> {sys_id}<span className={' ' + online_class}>{online_text}</span></p></div>);
        }
        else
        {
            if (v_andruavUnit.m_isDE !== true) 
            {
                rows.push (<div key={id +"__5"} className= 'col-1  padding_zero'><img className={v_battery_display.css}  src={v_battery_display.m_battery_src} title={'Andruav batt: ' + v_battery_display.level + '% ' + v_battery_display.charging +  v_battery_display.temp }/></div>);
            }
            // add FCB battery
            rows.push (<div key={id +"fc4"} className= "col-2 padding_zero"  onClick={ (e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ></div>);
            rows.push (<div key={id +"fc5"} className= "col-4 padding_zero text-end"  onClick={ (e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ><p id='id' className={'cursor_hand text-right ' + online_class2 } title={module_version}  onClick={ (e)=> this.fn_changeUnitInfo(v_andruavUnit)}><strong>{v_andruavUnit.m_unitName + " "}</strong><span className={' ' + online_class}>{online_text}</span></p></div>);
        }

        /* TABS ---- START */
        // Tab Labels
        var container_tabs=[];
        var container_controls=[];
         

        if (this.state.tab_main === true)
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li1'} className="nav-item">
                        <a className="nav-link user-select-none active" data-bs-toggle="tab" href={"#home" + v_andruavUnit.partyID}>Main</a>
                        </li>);
        }

        if (this.state.tab_log === true)
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li2'} className="nav-item">
                        <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#log" + v_andruavUnit.partyID}>Log</a>
                        </li>);
        }
        
        if (this.state.tab_details === true)
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li3'} className="nav-item">
                        <a className="nav-link  user-select-none " data-bs-toggle="tab" href={"#details" + v_andruavUnit.partyID}>Details</a>
                        </li>);
        }


        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_p2p === true)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li4'} className="nav-item">
            <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#p2p" + v_andruavUnit.partyID}>P2P</a>
            </li>);
        }
       
        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false) && (this.state.tab_module === true) &&(v_andruavUnit.m_modules.has_sdr === true)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li4'} className="nav-item">
                <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#sdr" + v_andruavUnit.partyID}>SDR</a>
            </li>);
        }
           
        if ((js_siteConfig.CONST_FEATURE.DISABLE_VOICE!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE===false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_sound === true)  || (v_andruavUnit.m_isDE === false)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li5'} className="nav-item">
            <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#audio" + v_andruavUnit.partyID}>Audio</a>
            </li>);
        }
           
    

        // Adding an empty tab
        if (container_tabs.length!==0)
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'liempty'} className="nav-item">  
                        <a className="nav-link user-select-none text-dark" data-bs-toggle="tab" href={"#empty" + v_andruavUnit.partyID}>Collapse</a>
                        </li>);
        }
        
        // TAB Controls 
        if (this.state.tab_main === true)
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabContent_1'} className="tab-pane fade  active show pt-2" id={"home" + v_andruavUnit.partyID}>
                            <ClssCTRL_Drone_IMU p_unit={v_andruavUnit} />
                            {this.renderControl(v_andruavUnit)}
                    </div>);
        }
        if (this.state.tab_log === true)
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssMESSAGE_LOG'} className="tab-pane fade pt-2" id={"log" + v_andruavUnit.partyID}>
                            <ClssMESSAGE_LOG  p_unit={v_andruavUnit} />
                    </div>);
        }
        
        if (this.state.tab_details === true)
        {
            container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_SETTINGS'} className="tab-pane fade  pt-2" id={"details" + v_andruavUnit.partyID}>
                            <ClssCTRL_SETTINGS p_unit={v_andruavUnit}/>
                    </div>);
        }
       
        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_p2p === true)) 
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_P2P'} className="tab-pane fade pt-2" id={"p2p" + v_andruavUnit.partyID}>
                            <ClssCTRL_P2P p_unit={v_andruavUnit}/>
                    </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_sdr === true)) 
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_SDR'} className="tab-pane fade pt-2" id={"sdr" + v_andruavUnit.partyID}>
                            <ClssCTRL_SDR p_unit={v_andruavUnit}/>
                     </div>);
        }
    
        if ((js_siteConfig.CONST_FEATURE.DISABLE_VOICE!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE===false) && (this.state.tab_module === true) && ((v_andruavUnit.m_modules.has_sound === true) || (v_andruavUnit.m_isDE === false))) 
        {
            container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_AUDIO'} className="tab-pane fade pt-2" id={"audio" + v_andruavUnit.partyID}>
                <ClssCTRL_AUDIO p_unit={v_andruavUnit}/>
            </div>);
        }
        
        if (container_controls.length !== 0)
        {
            // Adding an empty tab
            container_controls.push(<div className="tab-pane fade" key={v_andruavUnit.partyID + 'myTabClssCTRL_empty'} id={"empty" + v_andruavUnit.partyID}>
                    </div>);
        }
        ////////////////////////////////////TABS ---- END

     return (
            
             <div  key={id +"1"} id={id} className={"row mb-1 mt-0 me-0 ms-0 pt-1 user-select-none IsGCS_" + v_andruavUnit.m_IsGCS + " card border-light IsShutdown_" + v_andruavUnit.m_IsShutdown}>
             <div  key={id +"_1"} id={v_andruavUnit.partyID + "_1"} className='row margin_2px padding_zero user-select-none '>        	
                <div key={id +"__1"} className= 'col-1  padding_zero d-flex '><ClssCTRL_Unit_Icon m_unit={v_andruavUnit}/></div>
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