import React    from 'react';

import * as js_helpers from '../js/js_helpers.js'

import {js_globals} from '../js/js_globals.js';
import {js_eventEmitter} from '../js/js_eventEmitter.js'
import {js_localStorage} from '../js/js_localStorage.js'


import {
     hlp_getFlightMode,
     fn_isBadFencing, fn_switchGPS, fn_openFenceManager,
     fn_convertToMeter, fn_changeAltitude} from '../js/js_main.js'
     
import * as js_andruavUnit from '../js/js_andruavUnit.js';
import * as js_andruavMessages from '../js/js_andruavMessages.js'



import {ClssCTRL_UDP_PROXY_TELEMETRY} from './gadgets/jsc_ctrl_udp_proxy_telemetry.jsx'
import {ClssCTRL_HUD} from './gadgets/jsc_ctrl_hudControl.jsx'
import {ClssCtrlDirections} from './gadgets/jsc_ctrl_directionsControl.jsx'
import {ClssCTRL_SWARM} from './gadgets/jsc_ctrl_swarm.jsx'
import {ClssCTRL_Drone_Speed_Ctrl} from './gadgets/jsc_ctrl_speed_control.jsx'
import {ClssCTRL_Drone_Altitude_Ctrl} from './gadgets/jsc_ctrl_altitude_control.jsx'
export class ClssCTRL_Drone_IMU extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
            m_update : 0
        };
        
        this.telemetry_level=["OFF","1","2","3"];
    };

    componentWillUnmount () {
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
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

    
    renderIMU (v_andruavUnit)
    {
        var v_fence_text = "unknown";
		var v_fence_class = "text-muted";
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
        const c_delta = v_andruavUnit.m_FlyingLastStartTime === 0?0.0:v_andruavUnit.m_FlyingLastStartTime;
        v_totalFlyingTime = js_helpers.fn_getTimeDiffDetails_Shortest ( (c_delta + v_andruavUnit.m_FlyingTotalDuration));
        
        
        // if (v_andruavUnit.m_Nav_Info.p_Location.ground_speed==null) 
        // {
        //     v_speed_text = 'NA'; 
        // }else
        // { 
        //     v_speed_text = v_andruavUnit.m_Nav_Info.p_Location.ground_speed;
		//     v_andruavUnit.m_gui.speed_link = true;
        //     if (js_globals.v_useMetricSystem==true)
        //     {
        //         v_speed_text = v_speed_text.toFixed(0) + ' m/s';
        //     }
        //     else
        //     {
        //         v_speed_text = ( v_speed_text * js_helpers.CONST_METER_TO_MILE).toFixed(0) + ' mph';
        //     }
            
        // }

        // Set Telemetry Status
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
            if (js_globals.v_useMetricSystem === true) 
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
            v_yaw_knob.push(<ClssCTRL_HUD key={v_andruavUnit.partyID + "_hud"} id={v_andruavUnit.partyID + "_hud"} v_pitch={c_pitch} v_roll={c_roll} v_yaw={c_yaw}  title ='Pitch: {v_pitch}'/>);
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
            const c_target = v_andruavUnit.m_Nav_Info._Target.target_bearing ; 
            const c_bearing = v_andruavUnit.m_Nav_Info.p_Desired.nav_bearing ;
            v_bearing_knob.push(<ClssCtrlDirections key={v_andruavUnit.partyID + "_tb"} id={v_andruavUnit.partyID + "_tb"} v_target={c_target} v_bearing={c_bearing} />);

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
            
            
            if (js_globals.v_useMetricSystem === true)
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
						
		const res = fn_isBadFencing (v_andruavUnit);
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

       
        const gps = this.hlp_getGPS (v_andruavUnit);

        // let v_targetspeed = parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed).toFixed(2) + " m/s";
        // if (js_globals.v_useMetricSystem === false) {
        //     // value stored in meters per seconds so convert it to miles per hour
        //     v_targetspeed = (parseFloat(v_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed) * js_helpers.CONST_METER_TO_MILE).toFixed(2) + " mph";
        // }

        let imu=[];
        // https://icons.getbootstrap.com/icons/caret-down-fill/
        imu.push (
                <div key={'imu_1' + v_andruavUnit.partyID} id='imu_1' className= 'row al_l  css_margin_zero'>
                    <div className = 'row al_l css_margin_zero d-flex '>
                        <div className= 'col-6 col-md-3 user-select-none  p-1'>
                                <ClssCTRL_Drone_Speed_Ctrl m_unit={v_andruavUnit}/>
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
                                  <ClssCTRL_Drone_Altitude_Ctrl m_unit={v_andruavUnit}/>
                              
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
                        <ClssCTRL_UDP_PROXY_TELEMETRY key={'ctele' + v_andruavUnit.partyID} p_unit={v_andruavUnit} /> </div>
                        <div key={'swarm' + v_andruavUnit.partyID} className= 'col-2   padding_zero'>
                        <ClssCTRL_SWARM   key={'cswarm' + v_andruavUnit.partyID}  m_unit={v_andruavUnit}/>
                        </div>
                        
                    </div>

                </div>);
        
        
					
        return imu;
    }

    render ()
    {
        return this.renderIMU(this.props.p_unit);
    }


    
    
};