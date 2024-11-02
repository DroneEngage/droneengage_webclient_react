import $ from 'jquery'; 
import React    from 'react';

import * as js_siteConfig from '../../js/js_siteConfig.js'

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import {js_andruavAuth} from '../../js/js_andruavAuth.js'
import { mavlink20 } from '../../js/js_mavlink_v2.js';

import {fn_do_modal_confirmation, 
    fn_requestWayPoints,
    fn_clearWayPoints, fn_putWayPoints 
     } from '../../js/js_main.js'

import * as js_andruavMessages from '../../js/js_andruavMessages.js'


import {ClssCTRL_Unit_Log} from './jsc_ctrl_log_tab.jsx' // add extension to allow encryptor to see it as same as file name.
import {ClssCTRL_Unit_Details} from './jsc_ctrl_details_tab.jsx'
import {ClssCTRL_P2P} from '../modules/p2p/jsc_ctrl_p2p.jsx'
import {ClssCTRL_SDR} from '../modules/sdr/jsc_ctrl_sdr.jsx'


import {ClssCtrlArdupilotFlightController} from '../flight_controllers/jsc_ctrl_ardupilot_flightControl.jsx'
import {ClssCtrlPx4FlightControl} from '../flight_controllers/jsc_ctrl_px4_flightControl.jsx'
import {ClssCTRL_AUDIO} from '../gadgets/jsc_ctrl_audio.jsx'
import {ClssCTRL_Drone_IMU} from './jsc_unit_control_imu.jsx'
import {ClssAndruavUnitBase} from './jsc_unit_control_base.jsx'
import {ClssCTRL_Unit_Main_Bar} from './jsc_ctrl_unit_main_bar.jsx'
import {ClssCTRL_Unit_Planning_Bar} from './jsc_ctrl_unit_planning_bar.jsx'

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
export class ClssAndruavUnit_Drone extends ClssAndruavUnitBase {
    constructor(props)
	{
		super (props);
        this.state = {
            tab_planning: this.props.tab_planning,
            tab_main: this.props.tab_main,
            tab_log: this.props.tab_log,
            tab_details: this.props.tab_details,
            tab_module: this.props.tab_module,
            tab_collapsed: this.props.tab_collapsed
        };

        this.props.p_unit.m_gui.speed_link = false;
    
    }

    componentDidMount () 
    {
        super.componentDidMount();
        this.state.m_update = 1;
    }


   
    
    fn_requestGamePad(me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.p_unit.partyID) 
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
    





    hlp_getflightButtonStyles (p_andruavUnit)
	{
	    let res = {};
        res.btn_takeCTRL_class          = "";
        res.btn_releaseCTRL_class       = "";
        res.btn_sendParameters_class    = " disabled hidden ";
        res.btn_lidar_info_class        = ""
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


        if (p_andruavUnit.m_lidar_info.anyValidDataExists ())
        {
            res.btn_lidar_info_class    = "btn-warning";
        }
        else
        {
            res.btn_lidar_info_class    = "btn-muted";
        }
        // for now this feature is disabled.
        //res.btn_rx_class   = "hidden disabled"; 
        res.btn_save_wp_class       = "btn-danger";
        res.btn_clear_wp_class      = "btn-danger";
        res.btn_load_wp_class       = "btn-primary";

        

	    return res;
	}

    

    createTabs ()
    {
        const v_andruavUnit = this.props.p_unit; 
   
        let container_tabs=[];
        let container_controls=[];
         

        if (this.state.tab_main === true)
        {
            let css = 'nav-link user-select-none ';
            if (this.state.tab_collapsed !== true)
            {
                css += 'active ';
            }
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li1'} className="nav-item">
                        <a className={css} data-bs-toggle="tab" href={"#main" + v_andruavUnit.partyID}>Main</a>
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


        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P != null) 
            && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false) 
            && (this.state.tab_module === true) 
            && (v_andruavUnit.m_modules.has_p2p === true)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li4'} className="nav-item">
            <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#p2p" + v_andruavUnit.partyID}>P2P</a>
            </li>);
        }
       
        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR!=null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false) && (this.state.tab_module === true) &&(v_andruavUnit.m_modules.has_sdr === true)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li5'} className="nav-item">
                <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#sdr" + v_andruavUnit.partyID}>SDR</a>
            </li>);
        }
           
        if ((js_siteConfig.CONST_FEATURE.DISABLE_VOICE != null) 
            && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE === false) 
            && (this.state.tab_module === true) 
            && (v_andruavUnit.m_modules.has_sound === true)  
            || (v_andruavUnit.m_isDE === false)) 
        {
            container_tabs.push(<li key={v_andruavUnit.partyID + 'li6'} className="nav-item">
            <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#audio" + v_andruavUnit.partyID}>Audio</a>
            </li>);
        }
           
    

        // Adding an empty tab
        if (container_tabs.length!==0)
        {
            let css = 'nav-link user-select-none text-dark ';
            if (this.state.tab_collapsed === true)
            {
                css += 'active ';
            }
            container_tabs.push(<li key={v_andruavUnit.partyID + 'liempty'} className="nav-item">  
                        <a className={css} data-bs-toggle="tab" href={"#empty" + v_andruavUnit.partyID}>Collapse</a>
                        </li>);
        }
        
        // TAB Controls 
        if (this.state.tab_main === true)
        {
            let css ='tab-pane fade pt-2 ';
            if (this.state.tab_collapsed !== true)
            {
                css += 'active show ';
            }
                
            container_controls.push(<div key={v_andruavUnit.partyID + 'myTabContent_1'} className={css} id={"main" + v_andruavUnit.partyID}>
                            <ClssCTRL_Drone_IMU p_unit={v_andruavUnit} />
                            {this.renderControl(v_andruavUnit)}
                    </div>);
        }
        if (this.state.tab_log === true)
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssMESSAGE_LOG'} className="tab-pane fade pt-2" id={"log" + v_andruavUnit.partyID}>
                            <ClssCTRL_Unit_Log  p_unit={v_andruavUnit} />
                    </div>);
        }
        
        if (this.state.tab_details === true)
        {
            container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_SETTINGS'} className="tab-pane fade  pt-2" id={"details" + v_andruavUnit.partyID}>
                            <ClssCTRL_Unit_Details p_unit={v_andruavUnit}/>
                    </div>);
        }
       
        if ((js_siteConfig.CONST_FEATURE.DISABLE_P2P !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_P2P===false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_p2p === true)) 
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_P2P'} className="tab-pane fade pt-2" id={"p2p" + v_andruavUnit.partyID}>
                            <ClssCTRL_P2P p_unit={v_andruavUnit}/>
                    </div>);
        }

        if ((js_siteConfig.CONST_FEATURE.DISABLE_SDR !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_SDR===false) && (this.state.tab_module === true) && (v_andruavUnit.m_modules.has_sdr === true)) 
        {
                container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_SDR'} className="tab-pane fade pt-2" id={"sdr" + v_andruavUnit.partyID}>
                            <ClssCTRL_SDR p_unit={v_andruavUnit}/>
                     </div>);
        }
    
        if ((js_siteConfig.CONST_FEATURE.DISABLE_VOICE !== undefined) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE !==null) && (js_siteConfig.CONST_FEATURE.DISABLE_VOICE===false) && (this.state.tab_module === true) && ((v_andruavUnit.m_modules.has_sound === true) || (v_andruavUnit.m_isDE === false))) 
        {
            container_controls.push(<div key={v_andruavUnit.partyID + 'myTabClssCTRL_AUDIO'} className="tab-pane fade pt-2" id={"audio" + v_andruavUnit.partyID}>
                <ClssCTRL_AUDIO p_unit={v_andruavUnit}/>
            </div>);
        }
        
        if (container_controls.length !== 0)
        {
            // Adding an empty tab
            let css ='tab-pane fade ';
            if (this.state.tab_collapsed === true)
            {
                css += 'active show ';
            }
                
            container_controls.push(<div className={css} key={v_andruavUnit.partyID + 'myTabClssCTRL_empty'} id={"empty" + v_andruavUnit.partyID}>
                    </div>);
        }


        return {container_tabs, container_controls};
    }

    componentDidUpdate() {
        // var cam = $(".dropdown-menu li a");
        // if (cam !== null && cam !== undefined) 
        // {
        //     cam.on('click', function(){
        //         var selText = $(this).attr('data-value');
        //         $(this).parents('.btn-group').siblings('.menu').html(selText)
        //     });
        // }
        
     }
    
   
    childcomponentWillMount () {
        js_eventEmitter.fn_subscribe(js_globals.EE_requestGamePad,this,this.fn_requestGamePad);
    }

    childcomponentWillUnmount () {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_requestGamePad,this);
    }

    
    componentWillUnmount () {
        super.componentWillUnmount();
    }


    renderControl (p_andruavUnit)
    {

        if (p_andruavUnit.m_useFCBIMU !== true) 
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

        let btn = this.hlp_getflightButtonStyles(p_andruavUnit);
        let ctrl_flight_controller=[];
        let ctrl2=[];
        let cls_ctrl_modes = '  ';
        let cls_ctrl_wp = '  ';
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
                    <button id='btn_refreshwp' type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_load_wp_class}   onClick={ (e) => fn_requestWayPoints(p_andruavUnit,true)} title="Read Waypoints from Drone">R-WP</button>
                    <button id='btn_writewp'  type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_save_wp_class}   onClick={ (e) => fn_putWayPoints(p_andruavUnit,true)} title="Write Waypoints into Drone">W-WP</button>
                    <button id='btn_clearwp'   type='button' className={'btn btn-sm flgtctrlbtn ' + cls_ctrl_wp + btn.btn_clear_wp_class}   onClick={ (e) => fn_clearWayPoints(p_andruavUnit,true)} title="Clear Waypoints" >C-WP</button>
                    <button id='btn_webRX'      type='button' className={'btn btn-sm flgtctrlbtn ' + btn.btn_rx_class}   onClick={ (e) => this.fn_webRX_toggle(p_andruavUnit)} title={btn.btn_rx_title}>{btn.btn_rx_text}</button>
                    <button id='btn_freezerx' type='button' title="Freeze RemoteControl -DANGER-" className={'hidden btn btn-sm flgtctrlbtn ' + btn.btn_takeCTRL_class + cls_ctrl_modes} onClick={ (e) => this.fn_takeTXCtrl(e,p_andruavUnit)}>&nbsp;TX-Frz&nbsp;</button>
                    <button id='btn_releaserx' type='button' title="Release Control" className={'btn btn-sm flgtctrlbtn ' + btn.btn_releaseCTRL_class + cls_ctrl_modes} onClick={ (e) => this.fn_releaseTXCtrl(p_andruavUnit)}>&nbsp;TX-Rel&nbsp;</button>
                    <button id='btn_inject_param' type='button' title="Send Parameters to GCS" className={'btn btn-sm flgtctrlbtn ' + btn.btn_sendParameters_class } onClick={ (e) => this.fn_displayParamsDialog(p_andruavUnit)}>&nbsp;PARM&nbsp;</button>
                    <button id='btn_lidar_info' type='button' title="Display Lidar Info" className={'btn btn-sm flgtctrlbtn ' + btn.btn_lidar_info_class } onClick={ (e) => this.fn_displayLidarDialog(p_andruavUnit)}>&nbsp;Lidar&nbsp;</button>
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

    createMainBar()
    {
        let bars = [];
        const v_andruavUnit = this.props.p_unit; 
   
        
        if (this.state.tab_main === true)
        {
            bars.push(
                <ClssCTRL_Unit_Main_Bar key={v_andruavUnit+'c_c_u_m_b'} p_unit={v_andruavUnit} />);
        }

        if (this.state.tab_planning === true)
        {
            bars.push(
                <ClssCTRL_Unit_Planning_Bar  key={v_andruavUnit+'c_c_u_p_b'} p_unit={v_andruavUnit} />);
        }

        return bars;
    }


    render ()
    {

        const v_andruavUnit = this.props.p_unit; 
   
        if (v_andruavUnit === null || v_andruavUnit === undefined) return ;

        const id = v_andruavUnit.partyID + "__u_c_d";
        
        const tabs = this.createTabs();

        const main_bar = this.createMainBar();
     return (
            
             <div  key={id +"1"} id={id} className={"row mb-1 mt-0 me-0 ms-0 pt-1 user-select-none IsGCS_" + v_andruavUnit.m_IsGCS + " card border-light IsShutdown_" + v_andruavUnit.m_IsShutdown}>
                
                {main_bar}

                <ul key={id + 'ul'} className="nav nav-tabs">
                    {tabs.container_tabs}
                </ul>
                <div key={id + 'myTabContent'} id="myTabContent" className="tab-content padding_zero">
                    {tabs.container_controls}
                </div>
            </div>		
       );
    }
}