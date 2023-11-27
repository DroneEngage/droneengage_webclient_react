import {CLSS_AndruavUnit} from './jsc_andruav_unit.jsx' // add extension to allow encryptor to see it as same as file name.
import {CLSS_CTRL_HUD} from './gadgets/jsc_ctrl_hudControl.jsx'
import {CLSS_CTRL_DIRECTIONS} from './gadgets/jsc_ctrl_directionsControl.jsx'
import {CLSS_CTRL_ARDUPILOT_FLIGHT_CONTROL} from './flight_controllers/jsc_ctrl_ardupilot_flightControl.jsx'
import {CLSS_CTRL_PX4_FLIGHT_CONTROL} from './flight_controllers/jsc_ctrl_px4_flightControl.jsx'
import {CLSS_CTRL_ARDUPILOT_EKF} from './gadgets/jsc_ctrl_ardupilot_ekf.jsx'
import {CLSS_CTRL_VIBRATION} from './gadgets/jsc_ctrl_vibration.jsx'
import {CLSS_CTRL_BATTERY} from './gadgets/jsc_ctrl_battery.jsx'

class CLSS_AndruavUnit_Drone_Header extends React.Component{

    constructor()
	{
		super ();
		    this.state = {
                is_compact_batt : false,
                is_compact_ekf : false
		};

    }

    fn_toggleBattery()
    {
        if (this.state.is_compact === false) this.state.is_compact = true;
        else
        this.state.is_compact = false;

        window.AndruavLibs.EventEmitter.fn_dispatch(EE_BattViewToggle, this.state.is_compact);
    }

    fn_toggleEKF()
    {
        if (this.state.is_compact_ekf === false) this.state.is_compact_ekf = true;
        else
        this.state.is_compact_ekf = false;

        window.AndruavLibs.EventEmitter.fn_dispatch(EE_EKFViewToggle, this.state.is_compact_ekf);
    }

    render()
    {

        var css_speed_enabled = '';
        var css_battery_enabled = '';
        var css_ekf_enabled = '';
        var css_alt_enabled = '';
        var css_ws_enabled = '';
        var css_wp_enabled = '';
        
        if (this.props.prop_speed != true)
        {
            css_speed_enabled = 'd-none';
        }
        
        if (this.props.prop_battery != true)
        {
            css_battery_enabled = 'd-none';
        }
        
        if (this.props.prob_ekf != true)
        {
            css_ekf_enabled = 'd-none';
        }
        
        if (this.props.prob_alt != true)
        {
            css_alt_enabled = 'd-none';
        }

        if (this.props.prob_ws != true)
        {
            css_ws_enabled = 'd-none';
        }
        
        if (this.props.prob_wp != true)
        {
            css_wp_enabled = 'd-none';
        }
        
        return (
            <div className = 'row  d-none d-lg-flex mt-0 me-0 ms-0 mb-2 text-nowrap bg-body border css_padding_zero css_cur_default fss-4 '>
            <div className = 'col-2  col-lg-1  css_margin_zero text-center fw-bold '>ID</div>
            <div className = {'col-2  col-lg-1   css_margin_zero text-center fw-bold '}>MODE</div>
            <div className = {'col-2  col-lg-1 d-none d-lg-block css_margin_zero css_padding_zero cursor_hand fw-bold ' + css_ekf_enabled} onClick={ (e) => this.fn_toggleEKF()}>EKF/VIB</div>
            {/* heading is not there */}
            <div className = 'col-2  col-lg-1   css_margin_zero css_padding_zero fw-bold '>HUD</div>
            <div className = {'col-4  col-lg-2   css_margin_zero css_padding_zero cursor_hand fw-bold ' + css_battery_enabled} onClick={ (e) => this.fn_toggleBattery()}>BATT</div>
            <div className = 'col-4  col-lg-2   d-none d-lg-block  css_margin_zero css_padding_zero fw-bold '>GPS</div>
            <div className = {'col-2  col-lg-1   css_margin_zero css_padding_zero fw-bold ' + css_speed_enabled}  >SPEED</div>
            {/* not important for boat or rover */}
            <div className = {'col-2  col-lg-1   css_margin_zero css_padding_zero fw-bold ' + css_alt_enabled}>ALT</div> 
            {/* not important for boat or rover */}
            <div className = {'col-2  col-lg-1   d-none d-lg-block css_margin_zero css_padding_zero fw-bold '  + css_ws_enabled}>WIND</div>
            {/* always important */}
            <div className = {'col-2  col-lg-1   css_margin_zero css_padding_zero fw-bold '  + css_wp_enabled}>WP</div>
            <div className = 'col-2  col-lg-1  css_margin_zero css_padding_zero fw-bold '></div>
            </div>
            
        );
    }
}

class CLSS_AndruavUnit_Drone_Row extends React.Component{
    constructor()
	{
		super ();
        this.state={
            'm_update': 0
        };
        
        this._isMounted = false;
        
        this.localvars={};
        this.localvars.speed_link = false;	
		this.telemetry_level=["OFF","1","2","3"];
        window.AndruavLibs.EventEmitter.fn_subscribe(EE_unitUpdated,this,this.fn_unitUpdated);
        window.AndruavLibs.EventEmitter.fn_subscribe(EE_unitNavUpdated,this,this.fn_unitUpdated);
        // window.AndruavLibs.EventEmitter.fn_subscribe(EE_unitTelemetryOn,this,this.fn_unitTelemetryOn);
        // window.AndruavLibs.EventEmitter.fn_subscribe(EE_unitTelemetryOff,this,this.fn_unitTelemetryOFF);
        
    }

     
    componentDidMount() {
        this._isMounted = true;
    }

    childcomponentWillUnmount () {
        this._isMounted = false;
        window.AndruavLibs.EventEmitter.fn_unsubscribe(EE_unitUpdated,this,);
        window.AndruavLibs.EventEmitter.fn_unsubscribe(EE_unitNavUpdated,this,);
        //window.AndruavLibs.EventEmitter.fn_unsubscribe(EE_unitTelemetryOn,this,);
        //window.AndruavLibs.EventEmitter.fn_unsubscribe(EE_unitTelemetryOff,this,);
    }


    fn_unitUpdated(p_me,p_andruavUnit)
    {
        if (p_me._isMounted !== true) return ;

        if (p_andruavUnit.partyID != p_me.props.m_unit.partyID) return ;
        if (p_me.state.m_update == 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
        
        //me.forceUpdate();
    }

    
    fn_getFlightMode(v_andruavUnit)
    {
        var v_flight_mode_text = "NC";
        var v_flight_mode_class= " text-warning";
        var v_flight_mode_title= 'flight board is NOT CONNECTED';
        if (v_andruavUnit.m_telemetry_protocol != CONST_TelemetryProtocol_CONST_No_Telemetry)
        {
            v_flight_mode_text = hlp_getFlightMode(v_andruavUnit);
            v_flight_mode_class= " text-white";
            v_flight_mode_title= 'flight mode'
        }
        
        return {
            'css':v_flight_mode_class,
            'txt':v_flight_mode_text,
            'title': v_flight_mode_title
        }
    }


    fn_getHUD(v_andruavUnit)
    {
        //const c_yaw = (CONST_RADIUS_TO_DEGREE * ((v_andruavUnit.m_Nav_Info.p_Orientation.yaw + CONST_PTx2) % CONST_PTx2)).toFixed(1);
        const c_pitch = ((CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.pitch) ).toFixed(1);
        const c_roll = ((CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.roll) ).toFixed(1);
        const c_heading = ((CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.yaw) ).toFixed(1);
        
        return {
            'p':c_pitch,
            'r':c_roll,
            'h':c_heading
        }
    }

    fn_gotoUnit_byPartyID (e,p_partyID)
    {
        v_andruavClient.API_requestID(p_partyID);
        fn_gotoUnit_byPartyID(p_partyID);
    }

    hlp_getGPS (gps_Info)
    {
        var gps = new C_GUI_READING_VALUE();
        
        gps.css = "bg-danger text-white text-center";
        if (gps_Info.m_isValid == true)
        {
            switch (gps_Info.GPS3DFix)
            {
                case 0:
                    gps.value  =" No GPS";
                    gps.css = ' bg-danger ';
                break;

                case 1:
                    gps.css = ' bg-danger text-white text-center ';
                break;

                case 2:
                    gps.css = ' bg-warning ';
                break;

                case 3:
                    gps.css = ' bg-primary ';
                    gps.value  =' 3D Fix ';
                
                break;
                case 4:
                    gps.css = ' bg-primary ';
                    gps.value  =' DGPS ';
                break;
                case 5:
                    gps.css = ' bg-primary ';
                    gps.value  =' RTK-Fl ';
                break;
                case 6:
                    gps.css = ' bg-primary ';
                    gps.value  =' RTK-Fx ';
                break;
                case 7:
                    gps.css = ' bg-primary ';
                    gps.value  =' static ';
                break;
                case 8:
                    gps.css = ' bg-primary ';
                    gps.value  =' ppp ';
                break;
            }
            
            
            gps.value = gps.value + "[" + gps_Info.m_satCount + " sats]";

           
        }
        else
        {
            gps.value  =" No GPS";
            gps.css = ' bg-danger ';
        }

       
        return gps;
    }


    


    getAlt(p_andruavUnit)
    {
        var res= {
            'lidar': new C_GUI_READING_VALUE(),
            'abs': new C_GUI_READING_VALUE(),
            'rel': new C_GUI_READING_VALUE(),
            'terC': new C_GUI_READING_VALUE(),
            'terH': new C_GUI_READING_VALUE(),
        };
        
        if (p_andruavUnit.m_Nav_Info.p_Location.alt_abs==null)
        {
            res.abs.value = 'NA';
            res.abs.css = ' text-muted ';
            res.abs.unit = ' ';
        }
        else
        {
            if (v_useMetricSystem==true)
            {
                res.abs.value = p_andruavUnit.m_Nav_Info.p_Location.alt_abs;
                res.abs.unit = ' m';
            }
            else
            {
                res.abs.value = p_andruavUnit.m_Nav_Info.p_Location.alt_abs * CONST_METER_TO_FEET;
                res.abs.unit = ' ft';
            }

            if (res.abs.value<10) 
            {
                res.abs.value = res.abs.value.toFixed(2);
            }
            else
            {
                res.abs.value = res.abs.value.toFixed(0);
            }
            res.abs.css = ' text-white ';
        }

        if (p_andruavUnit.m_Nav_Info.p_Location.alt==null)
        {
            res.rel.value = 'NA';
            res.rel.css = ' text-muted ';
            res.rel.unit = '';
        }
        else
        {
            if (v_useMetricSystem==true)
            {
                res.rel.value = p_andruavUnit.m_Nav_Info.p_Location.alt;
                res.rel.unit = ' m';
            }
            else
            {
                res.rel.value = p_andruavUnit.m_Nav_Info.p_Location.alt * CONST_METER_TO_FEET;
                res.rel.unit = ' ft';
            }
            res.rel.value = p_andruavUnit.m_Nav_Info.p_Location.alt;
            if (res.rel.value<10) 
            {
                res.rel.value = res.rel.value.toFixed(2);
            }
            else
            {
                res.rel.value = res.rel.value.toFixed(0);
            }
            res.rel.css = ' text-white ';
        }


        if (p_andruavUnit.m_Terrain_Info.last_terrain_entry == null)
        {
            res.terC.value = 'NA';
            res.terC.css = ' text-muted ';
            res.terC.unit = '';
        }
        else
        {
            if (v_useMetricSystem==true)
            {
                res.terC.value = p_andruavUnit.m_Terrain_Info.last_terrain_entry.m_current_height;
                res.terC.unit = ' m';
            }
            else
            {
                res.terC.value = p_andruavUnit.m_Terrain_Info.last_terrain_entry.m_current_height * CONST_METER_TO_FEET;
                res.terC.unit = ' ft';
            }

            if (res.terC.value<10) 
            {
                res.terC.value = res.terC.value.toFixed(2);
            }
            else
            {
                res.terC.value = res.terC.value.toFixed(0);
            }
            res.terC.css = ' text-white ';
        }

        if (p_andruavUnit.m_Terrain_Info.last_terrain_entry == null)
        {
            res.terH.value = 'NA';
            res.terH.css = ' text-muted ';
            res.terH.unit = '';
        }
        else
        {
            if (v_useMetricSystem==true)
            {
                res.terH.value = p_andruavUnit.m_Terrain_Info.last_terrain_entry.m_terrain_height;
                res.terH.unit = ' m';
            }
            else
            {
                res.terH.value = p_andruavUnit.m_Terrain_Info.last_terrain_entry.m_terrain_height * CONST_METER_TO_FEET;
                res.terH.unit = ' ft';
            }

            if (res.terH.value<10) 
            {
                res.terH.value = res.terH.value.toFixed(2);
            }
            else
            {
                res.terH.value = res.terH.value.toFixed(0);
            }
            res.terH.css = ' text-white ';
        }
        
        if (p_andruavUnit.m_DistanceSensors[mavlink20.MAV_SENSOR_ROTATION_PITCH_270].m_isValid!=true)
        {
            res.lidar.value = 'NA';
            res.lidar.css = ' text-muted ';
            res.lidar.unit = ' ';
        }
        else
        {
            var lidar = p_andruavUnit.m_DistanceSensors[mavlink20.MAV_SENSOR_ROTATION_PITCH_270];
            if ((lidar.m_min_distance >= lidar.m_current_distance) || (lidar.m_max_distance <= lidar.m_current_distance))
            {
                res.lidar.value = 'OOR';
                res.lidar.css = ' text-danger fw-strong ';
                res.lidar.unit = ' ';
            }
            else
            {
            
                if (v_useMetricSystem==true)
                {
                    res.lidar.value = lidar.m_current_distance;
                    res.lidar.unit = ' m';
                }
                else
                {
                    res.lidar.value = lidar.m_current_distance * CONST_METER_TO_FEET;
                    res.lidar.unit = ' ft';
                }

                if (res.lidar.value<10) 
                {
                    res.lidar.value = res.lidar.value.toFixed(2);
                }
                else
                {
                    res.lidar.value = res.lidar.value.toFixed(0);
                }
                res.lidar.css = ' text-white ';
            }
        }

        return res;
    }

    getSpeed(p_andruavUnit)
    {
        var res= {
            'GS': new C_GUI_READING_VALUE(),
            'AS': new C_GUI_READING_VALUE()
        };

        res.AS.value = 'na';
        res.GS.value = 'na';

        if (p_andruavUnit.m_Nav_Info.p_Location.ground_speed != null)
        {
            if (v_useMetricSystem==true)
            {
                res.GS.value = p_andruavUnit.m_Nav_Info.p_Location.ground_speed.toFixed(0);
                res.GS.unit = ' m/s';
            }
            else
            {
                res.GS.value = (p_andruavUnit.m_Nav_Info.p_Location.ground_speed * CONST_METER_TO_FEET).toFixed(0);
                res.GS.unit = ' ft/s';
            }
        }

        if (p_andruavUnit.m_Nav_Info.p_Location.air_speed != null)
        {
            if (v_useMetricSystem==true)
            {
                res.AS.value = p_andruavUnit.m_Nav_Info.p_Location.air_speed.toFixed(0);
                res.AS.unit = ' m/s';
            }
            else
            {
                res.AS.value = (p_andruavUnit.m_Nav_Info.p_Location.air_speed * CONST_METER_TO_FEET).toFixed(0);
                res.AS.unit = ' ft/s';
            }
        }

        return res;
    }


    getWind (p_andruavUnit)
    {
        var res= {
            'WS': new C_GUI_READING_VALUE(),
            'WZ': new C_GUI_READING_VALUE(),
            'WD': new C_GUI_READING_VALUE()
        };


        if (p_andruavUnit.m_WindSpeed != null)
        {
            if (v_useMetricSystem==true)
            {
                res.WS.value = p_andruavUnit.m_WindSpeed.toFixed(0);
                res.WS.unit = ' m/s';
            }
            else
            {
                res.WS.value = (p_andruavUnit.m_WindSpeed * CONST_METER_TO_FEET).toFixed(0);
                res.WS.unit = ' ft/s';
            }
            res.WS.css = '';
        }
        else
        {
            res.WS.value = 'na';
            res.WS.unit = '';
            res.WS.css = ' text-muted ';
        }

        if (p_andruavUnit.m_WindSpeed_z != null)
        {
            if (v_useMetricSystem==true)
            {
                res.WZ.value = p_andruavUnit.m_WindSpeed_z.toFixed(0);
                res.WZ.unit = ' m/s';
            }
            else
            {
                res.WZ.value = (p_andruavUnit.m_WindSpeed_z * CONST_METER_TO_FEET).toFixed(0);
                res.WZ.unit = ' ft/s';
            }
            res.WZ.css = '';
        }
        else
        {
            res.WZ.value = 'na';
            res.WZ.unit = '';
            res.WZ.css = ' text-muted ';
        }

        // wind direction
        res.WD.value = p_andruavUnit.m_WindDirection;
        if (res.WD.value!= null) res.WD.value = res.WD.value.toFixed(0);
        res.WD.css == res.WS.css;
        res.WD.unit = ' º';
        
        return res;
    }

    getWP(p_andruavUnit)
    {
        var res= {
            css: ' text-muted ',
            cur: '',
            count: '',
            wp_dist: new C_GUI_READING_VALUE(),
        };

        const target = p_andruavUnit.m_Nav_Info._Target;
        if (target.wp_num>0)
        {
            res.css = ' text-white ';
            res.cur = target.wp_num;
            res.count = target.wp_count
            res.wp_dist.css = ' text-white ';


            if (target.wp_dist > CONST_DFM_FAR)
            {
                res.wp_dist.css = ' bg-danger text-white ';
            }
            else if (target.wp_dist > CONST_DFM_SAFE)
            {
                res.wp_dist.css = ' bg-info  text-white ';
            }
            else
            {
                res.wp_dist.css = ' bg-success text-white ';
            }


            if (v_useMetricSystem==true)
            {
                res.wp_dist.value = target.wp_dist.toFixed(0);
                res.wp_dist.unit = ' m';
                
            }
            else
            {
                res.wp_dist.value = (target.wp_dist * CONST_METER_TO_FEET).toFixed(0);
                res.wp_dist.unit = ' ft';
            }
        }
        else
        {
            res.wp_dist.css = ' text-muted bg-none ';
        }

        return res;
    }

    render()
    {
        const v_andruavUnit = this.props.m_unit;
               
        
        var v_id_class = '';
        var v_id_text = v_andruavUnit.m_unitName;
        var v_id_icon = '';
        var v_armed = {};
        v_armed.text = 'Disarmed';
        v_armed.css = 'text-white';
        var v_mav_id_text = v_andruavUnit.m_FCBParameters.m_systemID;
        const v_flight_mode = this.fn_getFlightMode(v_andruavUnit);
        const v_HUD = this.fn_getHUD(v_andruavUnit);
        const v_gps1 = this.hlp_getGPS(v_andruavUnit.m_GPS_Info1);
        const v_gps2 = this.hlp_getGPS(v_andruavUnit.m_GPS_Info2);
        const v_alt = this.getAlt(v_andruavUnit);
        const v_speed = this.getSpeed(v_andruavUnit);
        const v_wind = this.getWind(v_andruavUnit);
        const v_wp = this.getWP(v_andruavUnit);

        if ( v_andruavUnit.m_IsShutdown === true)
        {
            v_id_class = ' text-muted ';
        }
        else
        {
            if (v_andruavUnit.m_isArmed==true) 
            {
                v_id_class = " bg-danger text-white ";
                v_armed.text ='ARMED';
                v_armed.css = 'bg-danger text-white fw-bold';
                
            }
            else
            {
                v_id_class = " bg-success text-white ";
            }
            if ((v_andruavUnit.m_useFCBIMU === false) 
                ||((v_andruavUnit.m_telemetry_protocol != CONST_TelemetryProtocol_DroneKit_Telemetry)
                && (v_andruavUnit.m_telemetry_protocol != CONST_TelemetryProtocol_CONST_Mavlink_Telemetry)))
            {
                v_id_icon = " bi bi-exclamation-diamond";
                v_id_text = ' ' + v_id_text;
                v_id_class = " bg-warning text-black ";
                
            }
            else
            {

            }
        }
        
        var ctrl_ekf = [];
        switch (v_andruavUnit.m_autoPilot)
        {
            case mavlink20.MAV_AUTOPILOT_PX4:
                ctrl_ekf.push(<div>EKF-PX4</div>);
            break;
            default:
                ctrl_ekf.push(<CLSS_CTRL_ARDUPILOT_EKF key={v_andruavUnit.partyID + "_ctrl_ekf"} id={v_andruavUnit.partyID + "_ctrl_ekf"} m_unit={v_andruavUnit}/>);
            break;
        }

        
        var css_speed_enabled = '';
        var css_battery_enabled = '';
        var css_ekf_enabled = '';
        var css_alt_enabled = '';
        var css_ws_enabled = '';
        var css_wp_enabled = '';

        if (this.props.prop_speed != true)
        {
            css_speed_enabled = 'd-none';
        }
        
        if (this.props.prop_battery != true)
        {
            css_battery_enabled = 'd-none';
        }
        
        if (this.props.prob_ekf != true)
        {
            css_ekf_enabled = 'd-none';
        }
        
        if (this.props.prob_alt != true)
        {
            css_alt_enabled = 'd-none';
        }
        
        if (this.props.prob_ws != true)
        {
            css_ws_enabled = 'd-none';
        }
        
        if (this.props.prob_wp != true)
        {
            css_wp_enabled = 'd-none';
        }
        
        return (
            <div key={this.props.prop_key+'1'} className = 'row  mt-0 me-0 ms-0 mb-2 text-nowrap border-bottom bg-gradient'>
                <div key={this.props.prop_key+'2'} className = {'col-2  col-lg-1   css_margin_zero text-center cursor_hand  si-09x  ' + v_id_class} onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit.partyID)}>
                    <div key={this.props.prop_key+'23'} className = 'row  css_margin_zero '>
                        <div key={this.props.prop_key+'24'} className = {'col-12  css_margin_zero css_padding_zero '+ v_id_icon}>{v_id_text}</div>
                    </div>
                    <div key={this.props.prop_key+'25'} className = 'row  css_margin_zero css_padding_zero'>
                            <div key={this.props.prop_key+'26'} className = 'col-12  css_margin_zero '>{'mavid: ' + v_mav_id_text}</div>
                    </div>
                </div>
                <div key={this.props.prop_key+'3'} className = {'col-2  col-lg-1   css_margin_zero text-center css_padding_zero  si-07x  css_dotted_border  '}>
                    <div key={this.props.prop_key+'31'} className = 'row  css_margin_zero css_padding_zero '>
                        <div key={this.props.prop_key+'32'} className = {'col-12  css_margin_zero css_padding_zero '+ v_flight_mode.css} title ={v_flight_mode.title}>{v_flight_mode.txt}</div>
                    </div>
                    <div key={this.props.prop_key+'33'} className = 'row  css_margin_zero css_padding_zero'>
                        <div key={this.props.prop_key+'34'} className = {'col-12  css_margin_zero css_padding_zero '+ v_armed.css}>{v_armed.text}</div>
                    </div>
                </div>
                <div key={this.props.prop_key+'4'} className = {'col-2  col-lg-1   d-none d-lg-grid css_margin_zero css_padding_zero   si-07x  css_dotted_border  '   + css_ekf_enabled}>
                        <div key={this.props.prop_key+'41'} className = 'row  css_margin_zero  '>
                            {ctrl_ekf}
                        </div>
                        <div key={this.props.prop_key+'42'} className = 'row  css_margin_zero  '>
                            <CLSS_CTRL_VIBRATION key={v_andruavUnit.partyID + "_ctrl_vib"} id={v_andruavUnit.partyID + "_ctrl_vib"} m_unit={v_andruavUnit}/>
                        </div>
                    
                </div>
                <div key={this.props.prop_key+'5'} className = 'col-2  col-lg-1   css_margin_zero css_padding_zero  si-07x css_dotted_border  '>
                        <ul className="css_hud_bullets">
                            <li><span className="text-warning">R:</span><span className="text-white">{v_HUD.r}</span><span className="text-warning">º</span></li>
                            <li><span className="text-warning">P:</span><span className="text-white">{v_HUD.p}</span><span className="text-warning">º</span></li>
                            <li><span className="text-warning">H:</span><span className="text-white">{v_HUD.h}</span><span className="text-warning">º</span></li>
                        </ul>
                </div>
                <div key={this.props.prop_key+'6'} className = {'col-4  col-lg-2   d-grid css_margin_zero  si-07x  css_dotted_border  ' + css_battery_enabled}>
                        <CLSS_CTRL_BATTERY key={v_andruavUnit.partyID + "_ctrl_bat1"} id={v_andruavUnit.partyID + "_ctrl_bat1"} m_title='Batt1' m_battery={v_andruavUnit.m_Power._FCB.p_Battery}/>
                        <CLSS_CTRL_BATTERY key={v_andruavUnit.partyID + "_ctrl_bat2"} id={v_andruavUnit.partyID + "_ctrl_bat2"} m_title='Batt2' m_battery={v_andruavUnit.m_Power._FCB.p_Battery2}/>
                </div>
                <div key={this.props.prop_key+'7'} className = 'col-4  col-lg-2   d-none d-lg-grid css_margin_zero css_padding_zero css_dotted_border  '>
                    <div className = 'row  css_margin_zero css_padding_zero'>
                        <div className = {'col-12  css_margin_zero text-white'+ v_gps1.css}><span className='fss-4'>{v_gps1.value}</span></div>
                    </div>
                    <div className = 'row  css_margin_zero css_padding_zero'>
                    <div className = {'col-12  css_margin_zero text-white '+ v_gps2.css}><span className='fss-4'>{v_gps2.value}</span></div>
                    </div>
                </div>
                <div key={this.props.prop_key+'8'} className = {'col-2  col-lg-1   d-grid css_margin_zero  si-07x css_dotted_border  ' + css_speed_enabled}>
                    <div className = {'row  css_margin_zero' + v_speed.GS.css}>
                        <div className = {'col-12  col-xxl-4  css_margin_zero text-warning' + v_speed.AS.css}>AS:</div>
                        <div className = {'col-12  col-xxl-8  css_margin_zero text-white' + v_speed.AS.css}>{v_speed.AS.value}<span className='text-warning '>{v_speed.AS.unit}</span></div>
                    </div>
                    <div className = {'row  css_margin_zero' + v_speed.GS.css}>
                        <div className = 'col-12  col-xxl-4  css_margin_zero text-warning '>GS:</div>
                        <div className = 'col-12  col-xxl-8  css_margin_zero text-white '>{v_speed.GS.value}<span className='text-warning '>{v_speed.GS.unit}</span></div>
                    </div>
                </div>
                
                <div key={this.props.prop_key+'9'} className = {'col-2  col-lg-1   d-grid css_margin_zero si-07x css_dotted_border padding_zero  '  + css_alt_enabled}>
                    <div className = {'row  css_margin_zero ' + v_alt.rel.css}>
                        <div className = {'col-12  col-xxl-6 css_margin_zero al_c '+ v_alt.abs.css}><span className='text-warning'>A:</span>{v_alt.abs.value}<span className='text-warning si-07x'>{v_alt.abs.unit}</span></div>
                        <div className = {'col-12  col-xxl-6 css_margin_zero al_c '+ v_alt.rel.css}><span className='text-warning'>R:</span>{v_alt.rel.value}<span className='text-warning si-07x'>{v_alt.rel.unit}</span></div>
                    </div>
                    <div className = 'row  css_margin_zero '>
                        <div className = {'col-12  col-xxl-6 css_margin_zero al_c '+ v_alt.terC.css}><span className='text-warning'>TC:</span>{v_alt.terC.value}<span className='text-warning si-07x'>{v_alt.terC.unit}</span></div>
                        <div className = {'col-12  col-xxl-6 css_margin_zero al_c '+ v_alt.lidar.css}><span className='text-warning'>L:</span>{v_alt.lidar.value}<span className='text-warning si-07x'>{v_alt.lidar.unit}</span></div>
                    </div>
                </div>
            
                <div key={this.props.prop_key+'10'} className = {'col-2  col-lg-1   d-none d-lg-grid  css_margin_zero  padding_zero si-07x  css_dotted_border  ' + v_wind.WS.css   + css_ws_enabled}>
                    <div className = 'row  css_margin_zero'>
                        <div className = 'col-12  col-xxl-4 css_margin_zero text-warning al_l'>WS/Z:</div>
                        <div className = 'col-12  col-xxl-8 css_margin_zero text-white al_r' > {v_wind.WS.value} / {v_wind.WZ.value}<span className='text-warning'>{v_wind.WS.unit}</span></div>
                    </div>
                    <div className = {'row  css_margin_zero  ' + v_wind.WD.css}>
                        <div  className = 'col-12  col-xxl-4  css_margin_zero text-warning al_l'>WD:</div>
                        <div  className = 'col-12  col-xxl-8  css_margin_zero text-white al_r'> {v_wind.WD.value}<span className="text-warning">{v_wind.WD.unit}</span></div>
                    </div>
                </div>
                <div key={this.props.prop_key+'11'} className = {'col-2  col-lg-1   d-grid css_margin_zero skinny   si-07x css_dotted_border '  + css_wp_enabled}>
                    <div className = {'row  css_margin_zero padding_zero' + v_wp.wp_dist.css}>
                        <div className = 'col-12  col-xxl-6  css_margin_zero text-white padding_zero '  >{v_wp.wp_dist.value}<span className='text-warning'>{v_wp.wp_dist.unit}</span></div>
                        <div className = {'col-12  col-xxl-6  css_margin_zero text-white padding_zero ' + v_wp.css}>{v_wp.cur}<span className='text-warning'>{'>>'}</span>{v_wp.count}</div>
                    </div>
                </div>
            </div>
            
        );
    }
}

class CLSS_AndruavUnitListArray extends React.Component {
  
    constructor()
	{
		super ();
		this.state = {
			andruavUnitPartyIDs : [],
		    'm_update': 0
		};
        
        this._isMounted = false;
        
        window.AndruavLibs.EventEmitter.fn_subscribe (EE_onPreferenceChanged, this, this.fn_onPreferenceChanged);
        window.AndruavLibs.EventEmitter.fn_subscribe (EE_onSocketStatus, this, this.fn_onSocketStatus);
        window.AndruavLibs.EventEmitter.fn_subscribe(EE_unitAdded,this,this.fn_unitAdded);
        window.AndruavLibs.EventEmitter.fn_subscribe(EE_unitUpdated,this,this.fn_unitUpdated);
	}



    componentDidMount() 
    {
        this._isMounted = true;
    }


    fn_unitUpdated(me,p_andruavUnit)
    {
        if (me._isMounted!==true) return ;
        
        me.setState({'m_update': me.state.m_update +1});
    }

    fn_unitAdded (me,p_andruavUnit)
    {
        if (me._isMounted!==true) return ;
        
        fn_console_log ("REACT:fn_unitAdded" );
         // http://stackoverflow.com/questions/26253351/correct-modification-of-state-arrays-in-reactjs      
         me.setState({ 
            andruavUnitPartyIDs: me.state.andruavUnitPartyIDs.concat([p_andruavUnit.partyID])
        });
    }
    
    fn_onPreferenceChanged(me)
    {
        if (me._isMounted!==true) return ;
        
        me.forceUpdate();
    }

    fn_updateMapStatus(p_andruavUnit)
    {
        if (p_andruavUnit.hasOwnProperty("p_marker") == false) return;
        if (
                ((v_en_GCS === true ) && (p_andruavUnit.m_IsGCS === true))
             || ((v_en_Drone === true ) && (p_andruavUnit.m_IsGCS ===false))
            )
        {
            // if (p_andruavUnit.m_gui != null)
            // {
            //     //p_andruavUnit.m_gui.m_marker.setMap(p_andruavUnit.m_gui.m_mapObj);
            //     AndruavLibs.AndruavMap.setMap(p_andruavUnit.m_gui.m_marker, p_andruavUnit.m_gui.m_mapObj);
            // }   
        }
        else
        {
            AndruavLibs.AndruavMap.fn_hideItem(p_andruavUnit.m_gui.m_marker);
        }

        return ;
    }

    fn_onSocketStatus (me,params) {
       
        if (me._isMounted!==true) return ;
        if (params.status == CONST_SOCKET_STATUS_REGISTERED)
        {				
                $('#andruavUnits').show();
        }
        else
        {				
                if (me._isMounted!==true) return ;
        
                me.setState({andruavUnitPartyIDs:[]});
        }
    }
    componentWillUnmount () {
        this._isMounted = false;
		window.AndruavLibs.EventEmitter.fn_unsubscribe (EE_onPreferenceChanged,this);
        window.AndruavLibs.EventEmitter.fn_unsubscribe (EE_onSocketStatus,this);
        window.AndruavLibs.EventEmitter.fn_unsubscribe(EE_unitAdded,this);
        //window.AndruavLibs.EventEmitter.fn_unsubscribe(EE_unitUpdated,this);
    }

    fn_OnClick()
    {
            if ($('#andruav_unit_list_array_float').attr('opacity') == null) {
                $('#andruav_unit_list_array_float').attr('opacity', '1.0');
                $('#andruav_unit_list_array_float').css('opacity', '1.0');
                $('#andruav_unit_list_array_float').unbind('mouseout');
                $('#andruav_unit_list_array_float #obaq').removeClass('bi-x-diamond');
                $('#andruav_unit_list_array_float #obaq').addClass('bi-x-diamond-fill');
            }
            else {
                $('#andruav_unit_list_array_float').attr('opacity', null);
                $('#andruav_unit_list_array_float').mouseout(function () {
                    $('#andruav_unit_list_array_float').css('opacity', '0.8');
                });
                $('#andruav_unit_list_array_float #obaq').removeClass('bi-x-diamond-fill');
                $('#andruav_unit_list_array_float #obaq').addClass('bi-x-diamond');
                
            }
        
    }

    render() {
        var unit = [];
        
        var units_details = [];
        
        if (this.state.andruavUnitPartyIDs.length == 0) 
        {

            unit.push (<div key={'CLSS_AndruavUnitListArray_unit_length' + this.props.prop_key} className='bg-success'>NO ONLINE UNITS</div>);
        }
        else 
            {
                const me = this;
                units_details.push(<CLSS_AndruavUnit_Drone_Header prop_key={me.props.prop_key} key={'drone_hdr'+ this.props.prop_key} 
                                    prop_speed={me.props.prop_speed}  prop_battery={me.props.prop_battery}  prob_wp={me.props.prob_wp} prob_ekf={me.props.prob_ekf} prob_alt={me.props.prob_alt} prob_ws={me.props.prob_ws}  />);
                this.state.andruavUnitPartyIDs.map(function (partyID)
                {
                    var v_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(partyID);
                    
                    if ((v_andruavUnit==null) || (v_andruavUnit.m_defined!==true))return ;

                    if (v_andruavUnit.m_IsGCS===true)
                    {
                        //units_gcs.push (<CLSS_AndruavUnit_GCS key={partyID} v_en_GCS= {window.AndruavLibs.LocalStorage.fn_getGCSDisplayEnabled()} m_unit = {v_andruavUnit}/>);
                    }
                    else 
                    if (v_andruavUnit.m_IsGCS===false)
                    {
                        units_details.push(<CLSS_AndruavUnit_Drone_Row prop_key={me.props.prop_key+partyID} key={partyID + 'row' + me.props.prop_key} m_unit={v_andruavUnit}
                                            prop_speed={me.props.prop_speed}  prop_battery={me.props.prop_battery}  prob_wp={me.props.prob_wp} prob_ekf={me.props.prob_ekf} prob_alt={me.props.prob_alt} prob_ws={me.props.prob_ws}  />);
                    }

                    me.fn_updateMapStatus(v_andruavUnit);

                });
            }
        
            //unit.push (<ul className="row"> {units_header} </ul>    );
            //unit.push (<div id="myTabContent" className="tab-content padding_zero"> {units_details} </div>);
            //unit.push (units_gcs);
        
            unit.push (<div key={'CLSS_AndruavUnitListArray1' + this.props.prop_key} className="card-header text-center">
                            <div className="row">
                                <div className="col-11">
                                    <h3 className="text-success text-start">Units</h3>
                                </div>
                                <div key={'CLSS_AndruavUnitListArray2' + this.props.prop_key} className="col-1 float-right">
                                    <span key={'CLSS_AndruavUnitListArray3' + this.props.prop_key} id ='obaq' className="cursor_hand bi bi-x-diamond" onClick={ (e) => this.fn_OnClick()}></span>
                                </div>
							</div>
                            {units_details} 
						</div>);

        return (
            <div key={'CLSS_AndruavUnitListArray_main' + this.props.prop_key} className='margin_zero padding_zero row'>{unit}</div>
        );
    }
};


if (CONST_TEST_MODE === true)
{
    if ($('#andruav_unit_list_array_float').length != 0) {

         ReactDOM.render(
             <React.StrictMode>
             <CLSS_AndruavUnitListArray key='CLSS_AndruavUnitListArray1' prop_key='1' prop_speed={true}  prop_battery={true}  prob_ekf={true} prob_alt={true} prob_ws={true} prob_wp={true} />,
             </React.StrictMode>,
	 		window.document.getElementById('andruav_unit_list_array_float')
         );
    }
    
    if ($('#andruav_unit_list_array_fixed').length != 0) {
    
         ReactDOM.render(
             <React.StrictMode>
             <CLSS_AndruavUnitListArray  key='CLSS_AndruavUnitListArray2' prop_key='2' prop_speed={true}  prop_battery={true}  prob_ekf={true} prob_alt={true} prob_ws={false} prob_wp={false} />,
             </React.StrictMode>,
	 		window.document.getElementById('andruav_unit_list_array_fixed')
         );
    }
}
else
{
    // comments
    if ($('#andruav_unit_list_array_float').length != 0) {

         ReactDOM.render(
             <CLSS_AndruavUnitListArray key='CLSS_AndruavUnitListArray1' prop_key='1' prop_speed={true}  prop_battery={true}  prob_ekf={true} prob_alt={true} prob_ws={true} prob_wp={true} />,
             window.document.getElementById('andruav_unit_list_array_float')
         );
     }

     if ($('#andruav_unit_list_array_fixed').length != 0) {

         ReactDOM.render(
             <CLSS_AndruavUnitListArray  key='CLSS_AndruavUnitListArray2' prop_key='2'  prop_speed={true}  prop_battery={true}  prob_ekf={true} prob_alt={true} prob_ws={false} prob_wp={false} />,
             window.document.getElementById('andruav_unit_list_array_fixed')
         );
    }

}