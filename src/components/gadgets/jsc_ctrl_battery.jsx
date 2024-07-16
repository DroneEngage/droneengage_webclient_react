import React    from 'react';

export class CLSS_CTRL_BATTERY extends React.Component {
    constructor()
	{
		super ();
		    this.state = {
                is_compact : true
		};

        js_eventEmitter.fn_subscribe(js_globals.EE_BattViewToggle,this,this.fn_toggle_global);
    }

    childcomponentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_BattViewToggle,this);
    }

    fn_toggle_global(me,p_compact)
    {
        me.state.is_compact = p_compact;
        me.forceUpdate();
    }

    fn_toggle()
    {
        if (this.state.is_compact === false) this.state.is_compact = true;
        else
        this.state.is_compact = false;

        this.forceUpdate();
    }


    hlp_getFCBBatteryCSSClass (v_battery)
	{
        var v_battery_display_fcb_div = "";
        var v_battery_src = "./images/battery_gy_32x32.png";
        
	    var v_remainingBat = v_battery.FCB_BatteryRemaining;
		var v_bat1 = " ";
			 
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
			 
	    var bat = { m_battery_src: v_battery_src, css:v_bat1, level:v_remainingBat, charging: 'unknown', v_battery_display_fcb_div: v_battery_display_fcb_div}; 
        


        return bat;
	}

    render ()
    {
        
        const v_battery_display_fcb = this.hlp_getFCBBatteryCSSClass(this.props.m_battery);
        
        
        if (this.state.is_compact === true)
        {
            return (
                <div key='bat_com_m' className = 'row  css_margin_zero fss-4 text-white cursor_hand' onClick={ (e) => this.fn_toggle()}>
                    <div key='bat_com_m1' className = {'col-3  css_margin_zero ' + v_battery_display_fcb.css}><span className="text-warning">{this.props.m_title}</span></div>
                    <div key='bat_com_m2' className = {'col-3  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryVoltage/1000).toFixed(1).toString()} <span className="text-warning">v</span></div>
                    <div key='bat_com_m3' className = {'col-3  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryCurrent/1000).toFixed(0).toString()} <span className="text-warning">A</span></div>
                    <div key='bat_com_m4' className = {'col-3  css_margin_zero text-white' + v_battery_display_fcb.css}>{parseFloat(this.props.m_battery.FCB_BatteryRemaining).toFixed(0)} <span className="text-warning">%</span></div>
                </div>
            );
        }
        else
        {
            return (
            <div key='bat_ncom_m' className = 'row  css_margin_zero fss-4 ' onClick={ (e) => this.fn_toggle()}>
                    <div key='bat_ncom_m5' className = {'col-2  css_margin_zero ' + v_battery_display_fcb.css}><span className="text-warning">{this.props.m_title}</span></div>
                    <div key='bat_ncom_m6' className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryVoltage/1000).toFixed(1).toString()} <span className="text-warning">v</span></div>
                    <div key='bat_ncom_m7' className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryCurrent/1000).toFixed(0).toString()} <span className="text-warning">A</span></div>
                    <div key='bat_ncom_m8' className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{parseFloat(this.props.m_battery.FCB_BatteryRemaining).toFixed(0)} <span className="text-warning">%</span></div>
                    <div key='bat_ncom_m9' className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_TotalCurrentConsumed/1000).toFixed(0).toString()} <span className="text-warning">AH</span></div>
                    <div key='bat_ncom_m10' className = {'col-2  css_margin_zero text-white' + v_battery_display_fcb.css}>{(this.props.m_battery.FCB_BatteryTemprature/1000).toFixed(1).toString()} <span className="text-warning">C</span></div>
            </div>
            );
        }
    }
}
