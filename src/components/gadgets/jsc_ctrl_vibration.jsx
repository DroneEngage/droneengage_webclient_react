import React    from 'react';


import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'
import C_GUI_READING_VALUE from '../../js/js_gui_helper.js'

export class ClssCtrlVibration extends React.Component {
    constructor()
	{
		super ();
		    this.state = {
                warning_level :  0,
                is_compact : true
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
    
    getVibrationCss (value)
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
            ret.css = 'bg-none text-muted';
        }else
        if (value >= 60)
        {
            ret.css = 'bg-danger text-white';
        }else
        if (value >= 30)
        {
            ret.css = 'bg-warning text-white';
        }if (value >= 5)
        {
            ret.css = 'bg-info text-white';
        }else
        {
            ret.css = 'bg-success text-white';
        }

        return ret;
    }

    getClippingCss (value)
    {
        var ret = new C_GUI_READING_VALUE();
        if (value == undefined) value = 'na';
        ret.value = value;
        if (value == null)
        {
           ret.css = 'bg-none text-muted ';
        }else
        if (value==0)
        {
            ret.css = 'bg-success text-white ';
            this.state.warning_level = this.state.warning_level | 0x2;
        }else
        if (value >= 50)
        {
            ret.css = 'bg-danger text-white ';
            this.state.warning_level = this.state.warning_level | 0x10;
        }else
        if (value >= 5)
        {
            ret.css = 'bg-warning text-white ';
            this.state.warning_level = this.state.warning_level | 0x8;
        }else
        if (value >= 1)
        {
            ret.css = 'bg-info text-white ';
            this.state.warning_level = this.state.warning_level | 0x4;
        }

        return ret;

    }

    getSingleCSS ()
    {
        if ((this.state.warning_level & 0x10) !== 0) return 'bg-danger';
        if ((this.state.warning_level & 0x8) !== 0) return 'bg-warning';
        if ((this.state.warning_level & 0x4) !== 0) return 'bg-info';
        if ((this.state.warning_level & 0x2) !== 0) return 'bg-success';
        if (this.state.warning_level === 0) return 'bg-none';
    }

    render ()
    {
        this.state.warning_level = 0;
        
        const v_andruavUnit = this.props.m_unit;
        const flags = v_andruavUnit.m_EKF.m_flags;
        var css_VX = this.getVibrationCss(v_andruavUnit.m_Vibration.m_vibration_x);
        var css_VY = this.getVibrationCss(v_andruavUnit.m_Vibration.m_vibration_y);
        var css_VZ = this.getVibrationCss(v_andruavUnit.m_Vibration.m_vibration_z);
        var css_C0 = this.getClippingCss(v_andruavUnit.m_Vibration.m_clipping_0);
        var css_C1 = this.getClippingCss(v_andruavUnit.m_Vibration.m_clipping_1);
        var css_C2 = this.getClippingCss(v_andruavUnit.m_Vibration.m_clipping_2);

        
        if (this.state.is_compact === true)
        {
            return (
                <div className = {'css_margin_zero css_padding_zero  al_c text-white cursor_hand ' + this.getSingleCSS()} onClick={ (e) => this.fn_toggle()}>
                    VIB
                </div>
            );
        }
        else
        {
            return (
            <div className = 'row  css_margin_zero css_padding_zero ' onClick={ (e) => this.fn_toggle()}>
            <div className = {'col-2  css_margin_zero css_padding_zero '+ css_VX.css} title ={'vibration X: ' + css_VX.value}>VX</div>
            <div className = {'col-2  css_margin_zero css_padding_zero '+ css_VY.css} title ={'vibration Y: ' + css_VY.value}>VY</div>
            <div className = {'col-2  css_margin_zero css_padding_zero '+ css_VZ.css} title ={'vibration Z: ' + css_VZ.value}>VZ</div>
            <div className = {'col-2  css_margin_zero css_padding_zero '+ css_C0.css} title ={'clipping 0: ' + css_C0.value}>C0</div>
            <div className = {'col-2  css_margin_zero css_padding_zero '+ css_C1.css} title ={'clipping 1: ' + css_C1.value}>C1</div>
            <div className = {'col-2  css_margin_zero css_padding_zero '+ css_C2.css} title ={'clipping 2: ' + css_C2.value}>C2</div>
            </div>
            );
        }
    }
};