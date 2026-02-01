import React    from 'react';


import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter'
import C_GUI_READING_VALUE from '../../js/js_gui_helper.js'

export class ClssCtrlVibration extends React.Component {
    constructor()
	{
		super ();
		this.state = {
            warning_level :  0,
            is_compact : true,
		    m_update: 0
		};

        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe(js_event.EE_EKFViewToggle,this,this.fn_toggle_global);
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
    }

    childcomponentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_EKFViewToggle,this);
    }

    fn_toggle_global(p_me,p_compact)
    {
        p_me.state.is_compact = p_compact;
        
        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    fn_toggle()
    {
        if (this.state.is_compact === false) this.state.is_compact = true;
        else
        this.state.is_compact = false;

        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }
    
    getVibrationCss (value)
    {
        let ret = new C_GUI_READING_VALUE();
        if (value === null || value === undefined) 
        {
            value = 'na';
        }
        else
        {
            value = value.toFixed(2);
        }
        ret.value = value;
        if ((value === null || value === undefined) || (value === 0.0))
        { 
            ret.css = 'bg-none text-muted';
        }else
        if (value >= 60)
        {
            ret.css = 'bg-danger txt-theme-aware';
        }else
        if (value >= 30)
        {
            ret.css = 'bg-warning txt-theme-aware';
        }if (value >= 5)
        {
            ret.css = 'bg-info txt-theme-aware';
        }else
        {
            ret.css = 'bg-success txt-theme-aware';
        }

        return ret;
    }

    getClippingCss (value)
    {
        // !BUG HERE
        let ret = new C_GUI_READING_VALUE();
        if (value === null || value === undefined) value = 'na';
        ret.value = value;
        if (value === null || value === undefined)
        {
           ret.css = 'bg-none text-muted ';
        }else
        if (value === 0)
        {
            ret.css = 'bg-success txt-theme-aware ';
            this.state.warning_level = this.state.warning_level | 0x2;
        }else
        if (value >= 50)
        {
            ret.css = 'bg-danger txt-theme-aware ';
            this.state.warning_level = this.state.warning_level | 0x10;
        }else
        if (value >= 5)
        {
            ret.css = 'bg-warning txt-theme-aware ';
            this.state.warning_level = this.state.warning_level | 0x8;
        }else
        if (value >= 1)
        {
            ret.css = 'bg-info txt-theme-aware ';
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
        
        const v_andruavUnit = this.props.p_unit;
        const css_VX = this.getVibrationCss(v_andruavUnit.m_Vibration.m_vibration_x);
        const css_VY = this.getVibrationCss(v_andruavUnit.m_Vibration.m_vibration_y);
        const css_VZ = this.getVibrationCss(v_andruavUnit.m_Vibration.m_vibration_z);
        const css_C0 = this.getClippingCss(v_andruavUnit.m_Vibration.m_clipping_0);
        const css_C1 = this.getClippingCss(v_andruavUnit.m_Vibration.m_clipping_1);
        const css_C2 = this.getClippingCss(v_andruavUnit.m_Vibration.m_clipping_2);

        
        if (this.state.is_compact === true)
        {
            return (
                <div className = {'css_margin_zero css_padding_zero  al_c txt-theme-aware cursor_hand ' + this.getSingleCSS()} onClick={ (e) => this.fn_toggle()}>
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