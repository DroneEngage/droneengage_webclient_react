import React    from 'react';

import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import {EventBridge} from '../../js/hooks/EventBridge.jsx'
import { subscribeUnitField } from '../../js/store/unitStore.js';
import C_GUI_READING_VALUE from '../../js/js_gui_helper.js'
export class ClssCtrlArdupilotEkf extends React.Component {
    constructor()
	{
		super ();
		this.state = {
            warning_level :  0,
            is_compact : false,
            m_update: 0
        
		};

        this.m_flag_mounted = false;
        this.m_unsubs = [];
    }

    childcomponentWillUnmount ()
    {
        this.m_flag_mounted = false;
        for (const fn of this.m_unsubs) fn();
        this.m_unsubs = [];
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
        // Field-granular: re-render only when a displayed EKF variance field
        // changes, replacing the parent's coarse re-render piggyback.
        const partyId = this.props.p_unit?.getPartyID();
        if (partyId) {
            const fields = [
                'm_EKF.m_velocity_variance',
                'm_EKF.m_pos_horiz_variance',
                'm_EKF.m_pos_vert_variance',
                'm_EKF.m_compass_variance',
                'm_EKF.m_terrain_alt_variance',
                'm_EKF.m_airspeed_variance',
            ];
            const me = this;
            for (const fp of fields) {
                this.m_unsubs.push(subscribeUnitField(partyId, fp, () => {
                    if (me.m_flag_mounted === false) return;
                    me.setState({ 'm_update': me.state.m_update + 1 });
                }));
            }
        }
    }

    fn_toggle_global(p_compact)
    {
        this.state.is_compact = p_compact;

        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_toggle()
    {
        if (this.state.is_compact === false) this.state.is_compact = true;
        else
        this.state.is_compact = false;

        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }
    
    getCss (value)
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
            ret.css = 'bg-none text-muted ';
        }else
        if (value >= 0.8)
        {
            ret.css = 'bg-danger txt-theme-aware ';
            this.state.warning_level = this.state.warning_level | 0x8;
        }else
        if (value >= 0.5)
        {
            ret.css = 'bg-warning txt-theme-aware ';
            this.state.warning_level = this.state.warning_level | 0x4;
        }else
        {
            ret.css = 'bg-success txt-theme-aware ';
            this.state.warning_level = this.state.warning_level | 0x2;
        }

        return ret
    }

    getSingleCSS ()
    {
        if ((this.state.warning_level & 0x8) !== 0) return 'bg-danger';
        if ((this.state.warning_level & 0x4) !== 0) return 'bg-warning';
        if ((this.state.warning_level & 0x2) !== 0) return 'bg-success';
        if (this.state.warning_level === 0) return 'bg-none';
    }

    
    render ()
    {
        this.state.warning_level = 0;

        const v_andruavUnit = this.props.p_unit;
        const gui_V = this.getCss(v_andruavUnit.m_EKF.m_velocity_variance);
        const gui_PH = this.getCss(v_andruavUnit.m_EKF.m_pos_horiz_variance);
        const gui_PV = this.getCss(v_andruavUnit.m_EKF.m_pos_vert_variance);
        const gui_CO = this.getCss(v_andruavUnit.m_EKF.m_compass_variance);
        const gui_TA = this.getCss(v_andruavUnit.m_EKF.m_terrain_alt_variance);
        const gui_AS = this.getCss(v_andruavUnit.m_EKF.m_airspeed_variance);

        
        if (this.state.is_compact === true)
        {
            return (
                <div className = {'css_margin_zero css_padding_zero  al_c txt-theme-aware cursor_hand ' + this.getSingleCSS()} onClick={ (e) => this.fn_toggle()}>
                    <EventBridge eventName={js_event.EE_EKFViewToggle} onEvent={(p_compact) => this.fn_toggle_global(p_compact)} />
                    EFK
                </div>
            );
        }
        else
        {
            return (
                <div className = 'row  css_margin_zero css_padding_zero'  onClick={ (e) => this.fn_toggle()}>
                <EventBridge eventName={js_event.EE_EKFViewToggle} onEvent={(p_compact) => this.fn_toggle_global(p_compact)} />
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