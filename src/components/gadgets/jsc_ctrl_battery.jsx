import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'


export class ClssCtrlBattery extends React.Component {
    constructor(props)
	{
		super (props);
		    this.state = {
                is_compact : true,
                m_update: 0
		};

        this.key = Math.random().toString();
        
        js_eventEmitter.fn_subscribe(js_globals.EE_BattViewToggle,this,this.fn_toggle_global);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitPowUpdated,this,this.fn_update);
    
    }


    shouldComponentUpdate(nextProps, nextState) {
        const update = (this.state.m_update != nextState.m_update);

        return update;
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
    }

    componentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_BattViewToggle,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitPowUpdated,this);
    }

    fn_update (me)
    {
        if (me.state.m_update === 0) return ;
        
        me.setState({'m_update': me.state.m_update +1});
    }
    
    fn_toggle_global(me,p_compact)
    {
        if (me.state.m_update === 0) return ;
        
        // Use setState to update multiple state variables
        me.setState((prevState) => ({
            is_compact: p_compact,
            m_update: prevState.m_update + 1
        }));
    }

    fn_toggle()
    {
        if (this.state.is_compact === false) 
        {
            this.state.is_compact = true;
        }
        else
        {
            this.state.is_compact = false;
        }

        if (this.state.m_update === 0) return ;
        this.setState({'m_update': this.state.m_update +1});
    }


    hlp_getFCBBatteryCSSClass (v_battery)
	{
        let v_battery_display_fcb_div = "";
        let v_battery_src = "./images/battery_gy_32x32.png";
        
	    let v_remainingBat = v_battery.FCB_BatteryRemaining;
		let v_bat1 = " ";
			 
		if (v_battery.p_hasPowerInfo === false)
        {
            v_battery_display_fcb_div = " hidden ";
            v_battery_src = "./images/battery_gy_32x32.png";
            
        }

		
		
        if (parseInt(v_remainingBat,0) > 80)
		{
		    v_bat1 += ' battery_4 ';
            v_battery_src = "./images/battery_g_32x32.png";
		}
		else if (parseInt(v_remainingBat,0) > 50)
		{
		    v_bat1 += ' battery_3 ';
            v_battery_src = "./images/battery_rg_32x32.png";
		}
		else if (parseInt(v_remainingBat,0) > 25)
		{
		    v_bat1 += ' battery_2 ';
            v_battery_src = "./images/battery_rg_3_32x32.png";
		}
		else 
		{
		    v_bat1 += ' battery_1 ';
            v_battery_src = "./images/battery_r_32x32.png";
		}
			 
	    let bat = { m_battery_src: v_battery_src, css:v_bat1, level:v_remainingBat, charging: 'unknown', v_battery_display_fcb_div: v_battery_display_fcb_div}; 
        


        return bat;
	}

    render ()
    {
        
        const v_battery_display_fcb = this.hlp_getFCBBatteryCSSClass(this.props.m_battery);
        
        
        if (this.state.is_compact === true)
        {
            return (
                <div key={'bat_com_m' + this.key} className = {this.props.className + ' row  css_margin_zero fss-4 text-white cursor_hand'} onClick={(e) => this.fn_toggle()}>
                    <div key={'bat_com_m1' + this.key} className = {'col-3  css_margin_zero ' + v_battery_display_fcb.css}><span className="text-warning">{this.props.m_title}</span></div>
                    <div key={'bat_com_m2' + this.key} className = {'col-3  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryVoltage/1000).toFixed(1).toString()} <span className="text-warning">v</span></div>
                    <div key={'bat_com_m3' + this.key} className = {'col-3  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryCurrent/1000).toFixed(0).toString()} <span className="text-warning">A</span></div>
                    <div key={'bat_com_m4' + this.key} className = {'col-3  css_margin_zero text-white' + v_battery_display_fcb.css}>{parseFloat(this.props.m_battery.FCB_BatteryRemaining).toFixed(0)} <span className="text-warning">%</span></div>
                </div>
            );
        }
        else
        {
            return (
            <div key={'bat_ncom_m' + this.key} className = {this.props.className + ' row  css_margin_zero fss-4 '} onClick={(e) => this.fn_toggle()}>
                    <div key={'bat_ncom_m5' + this.key} className = {'col-2  css_margin_zero ' + v_battery_display_fcb.css}><span className="text-warning">{this.props.m_title}</span></div>
                    <div key={'bat_ncom_m6' + this.key} className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryVoltage/1000).toFixed(1).toString()} <span className="text-warning">v</span></div>
                    <div key={'bat_ncom_m7' + this.key} className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryCurrent/1000).toFixed(0).toString()} <span className="text-warning">A</span></div>
                    <div key={'bat_ncom_m8' + this.key} className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{parseFloat(this.props.m_battery.FCB_BatteryRemaining).toFixed(0)} <span className="text-warning">%</span></div>
                    <div key={'bat_ncom_m9' + this.key} className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_TotalCurrentConsumed/1000).toFixed(0).toString()} <span className="text-warning">AH</span></div>
                    <div key={'bat_ncom_m10' + this.key} className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryTemprature/1000).toFixed(1).toString()} <span className="text-warning">C</span></div>
            </div>
            );
        }
    }
}
