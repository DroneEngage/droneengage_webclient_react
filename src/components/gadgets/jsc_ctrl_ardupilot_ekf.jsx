import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'
import C_GUI_READING_VALUE from '../../js/js_gui_helper.js'
export class Clss_CTRL_ARDUPILOT_EKF extends React.Component {
    constructor()
	{
		super ();
		    this.state = {
                warning_level :  0,
                is_compact : false
		};
        js_eventEmitter.fn_subscribe(js_globals.EE_EKFViewToggle,this,this.fn_toggle_global);
    }

    childcomponentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_EKFViewToggle,this);
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
    
    getCss (value)
    {
        var ret = new C_GUI_READING_VALUE();
        if (value == undefined) 
        {
            value = 'na';
        }
        else
        {
            value = value.toFixed(2);
        }
        
        ret.value = value;

        if ((value == null) || (value===0.0)) 
        {
            ret.css = 'bg-none text-muted ';
        }else
        if (value >= 0.8)
        {
            ret.css = 'bg-danger text-white ';
            this.state.warning_level = this.state.warning_level | 0x8;
        }else
        if (value >= 0.5)
        {
            ret.css = 'bg-warning text-white ';
            this.state.warning_level = this.state.warning_level | 0x4;
        }else
        {
            ret.css = 'bg-success text-white ';
            this.state.warning_level = this.state.warning_level | 0x2;
        }

        return ret
    }

    getSingleCSS ()
    {
        if ((this.state.warning_level & 0x8) !== 0) return 'bg-danger';
        if ((this.state.warning_level & 0x4) !== 0) return 'bg-warning';
        if ((this.state.warning_level & 0x2) !== 0) return 'bg-success';
        if (this.state.warning_level == 0) return 'bg-none';
    }

    
    render ()
    {
        this.state.warning_level = 0;

        const v_andruavUnit = this.props.m_unit;
        const flags = v_andruavUnit.m_EKF.m_flags;
        var gui_V = this.getCss(v_andruavUnit.m_EKF.m_velocity_variance);
        var gui_PH = this.getCss(v_andruavUnit.m_EKF.m_pos_horiz_variance);
        var gui_PV = this.getCss(v_andruavUnit.m_EKF.m_pos_vert_variance);
        var gui_CO = this.getCss(v_andruavUnit.m_EKF.m_compass_variance);
        var gui_TA = this.getCss(v_andruavUnit.m_EKF.m_terrain_alt_variance);
        var gui_AS = this.getCss(v_andruavUnit.m_EKF.m_airspeed_variance);

        
        if (this.state.is_compact === true)
        {
            return (
                <div className = {'css_margin_zero css_padding_zero  al_c text-white cursor_hand ' + this.getSingleCSS()} onClick={ (e) => this.fn_toggle()}>
                    EFK
                </div>
            );
        }
        else
        {
            return (
                <div className = 'row  css_margin_zero css_padding_zero'  onClick={ (e) => this.fn_toggle()}>
                <div className = {'col-2  css_margin_zero css_padding_zero '+ gui_V.css}  title ={'velocity variance X: '  + gui_V.value}>V</div>
                <div className = {'col-2  css_margin_zero css_padding_zero '+ gui_PH.css} title ={'pos horiz variance X: '  + gui_PH.value}>PH</div>
                <div className = {'col-2  css_margin_zero css_padding_zero '+ gui_PV.css} title ={'pos vert variance X: '  + gui_PV.value}>PV</div>
                <div className = {'col-2  css_margin_zero css_padding_zero '+ gui_CO.css} title ={'pos vert variance X: '  + gui_CO.value}>CO</div>
                <div className = {'col-2  css_margin_zero css_padding_zero '+ gui_TA.css} title ={'terrain alt variance X: '  + gui_TA.value}>TA</div>
                <div className = {'col-2  css_margin_zero css_padding_zero '+ gui_AS.css} title ={'airspeed variance X: ' + gui_AS.value}>AS</div>
                </div>
            );
        }
    }
};