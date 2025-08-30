/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Aug - 2024
 */

import React    from 'react';
import {js_globals} from '../../../js/js_globals.js';
import {EVENTS as js_event} from '../../../js/js_eventList.js'
import {js_eventEmitter} from '../../../js/js_eventEmitter.js'
import * as js_andruavMessages from '../../../js/js_andruavMessages.js'
import ClassSDRSpectrumVisualizer from './jsc_ctrl_sdr_spectrum.jsx'

export class ClssCtrlSDR extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update : 0,
                m_center_frequency : 0.0,
                m_driver_name : '',
                m_driver_index: 0,
                m_gain : 0.0,
                m_sample_rate : 0.0,
                m_display_bars: 30,
                m_interval: 0,
                m_trigger_level: 0,
                m_updated :
                {
                    fc : false,
                    bw : false,
                    ga : false,  // gain
                    sr : false,
                    dm : false,  // decode mode
                    dr : false,  // p_driver_index
                    db : false,  // p_display_bars
                    i  : false,  // interval
                    tl : false,  // trigger_level
                }
		};

        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe (js_event.EE_unitSDRUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_unitSDRUpdated,this);
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
        const  v_andruavUnit = this.props.p_unit;
        this.fn_copyData(this,v_andruavUnit);
    }

    fn_copyData(p_me, p_andruavUnit)
    {
        p_me.state.m_center_frequency = p_andruavUnit.m_SDR.m_center_frequency;
        p_me.state.m_driver_index = p_andruavUnit.m_SDR.m_driver_index;
        p_me.state.m_sample_rate = p_andruavUnit.m_SDR.m_sample_rate;
        p_me.state.m_gain = p_andruavUnit.m_SDR.m_gain;
        p_me.state.m_interval = p_andruavUnit.m_SDR.m_interval;
        p_me.state.m_display_bars = p_andruavUnit.m_SDR.m_display_bars;
        p_me.state.m_trigger_level = p_andruavUnit.m_SDR.m_trigger_level;
    }

    fn_unitUpdated (p_me, p_unit)
    {
        if (p_me.state.m_update == 0) return ;
        
        p_me.fn_copyData(p_me, p_unit);
        p_me.setState({m_update:p_me.state.m_update});
    }

    fn_onDriver(e)
    {   
        this.state.m_updated.dr = true;
        this.setState({m_driver_index: e.target.value});
    }

    fn_onFreqCenter(e)
    {
        this.state.m_updated.fc = true;
        this.setState({m_center_frequency: e.target.value});
    }

    fn_onSampleRate(e)
    {
        this.state.m_updated.sr = true;
        this.setState({m_sample_rate: e.target.value});
    }

    fn_onGain(e)
    {
        this.state.m_updated.ga = true;
        this.setState({m_gain: e.target.value});
    }

    fn_onInterval(e)
    {
        if (isNaN(e.target.value)) return ;

        let res = parseInt(e.target.value);
        this.state.m_updated.i = true;
        this.setState({m_interval: res});
    }

    fn_onDisplayBars(e)
    {
        this.state.m_updated.db = true;
        this.setState({m_display_bars: e.target.value});
    }

    fn_onTriggerLevel(e)
    {
        this.state.m_updated.tl = true;
        this.setState({m_trigger_level: e.target.value});
    }

    fn_activateSDR(p_andruavUnit)
    {

    }

    fn_UpdateSDR(p_andruavUnit)
    {
        let p_fequency_center = null;
        let p_gain = null;
        let p_sample_rate = null;
        let p_decode_mode = null;
        let p_driver_index = null;
        let p_display_bars = null;
        let p_interval = null;
        let p_trigger_level = null;

        if (this.state.m_updated.fc === true)       p_fequency_center   = parseFloat(this.state.m_center_frequency);
        if (this.state.m_updated.ga === true)       p_gain              = parseFloat(this.state.m_gain);
        if (this.state.m_updated.sr === true)       p_sample_rate       = parseFloat(this.state.m_sample_rate);
        if (this.state.m_updated.db === true)       p_display_bars      = parseFloat(this.state.m_display_bars);
        if (this.state.m_updated.i  === true)       p_interval          = parseFloat(this.state.m_interval);
        if (this.state.m_updated.tl === true)       p_trigger_level     = parseFloat(this.state.m_trigger_level);
        
        const index = this.state.m_driver_index;
        if (this.state.m_updated.dr === true)   p_driver_index      = ((index === null)?0:parseInt(index));
        
        js_globals.v_andruavFacade.API_setSDRConfig(p_andruavUnit, p_fequency_center,
            p_gain, p_sample_rate,
            p_decode_mode, p_driver_index, p_interval,
            p_display_bars, p_trigger_level); 


        this.state.m_updated.fc = false;
        this.state.m_updated.ga = false;
        this.state.m_updated.sr = false;
        this.state.m_updated.db = false;
        this.state.m_updated.i  = false;
        this.state.m_updated.tl = false;
        
    }

    
    fn_scanSDR(p_andruavUnit, p_on_off)
    {
        js_globals.v_andruavFacade.API_scanSDRFreq(p_andruavUnit, p_on_off);
        
    }


    fn_refresh(p_andruavUnit)
    {
        js_globals.v_andruavFacade.API_requestSDR(p_andruavUnit);
        js_globals.v_andruavFacade.API_scanSDRDrivers(p_andruavUnit);
    }


    getActiveButtonStyle(v_andruavUnit)
    {
        switch (v_andruavUnit.m_SDR.m_status)
        {
            case js_andruavMessages.CONST_SDR_STATUS_NOT_CONNECTED:
                
                if (Object.keys(v_andruavUnit.m_SDR.m_available_drivers).length === 0)
                {
                    return {r:"bg-success", u:"hidden", s:"hidden", p:"hidden"};
                }
                else
                {
                    return {r:"bg-success", u:"bg-danger", s:"hidden", p:"hidden"};
                }

                
            case js_andruavMessages.CONST_SDR_STATUS_CONNECTED:
                return {r:"bg-success", u:"bg-danger", s:"bg-success", p:"bg-light"};

            case js_andruavMessages.CONST_SDR_STATUS_STREAMING_ONCE:
            case js_andruavMessages.CONST_SDR_STATUS_STREAMING_INTERVALS:
                    return {r:"bg-success", u:"bg-warning", s:"bg-danger", p:"bg-warning"};

            case js_andruavMessages.CONST_SDR_STATUS_ERROR:
            default:
                return {r:"bg-danger", u:"bg-light", s:"bg-light", p:"bg-light"};
                        
        }
    }

    getDriverNameByIndex (v_andruavUnit, index)
    {
        let driver = v_andruavUnit.m_SDR.m_available_drivers[index]; 
        if (driver === null || driver === undefined)
        {
            return "No Device";
        }
        
        return driver.driver;
    }

    getDriverNames(v_andruavUnit)
    {
        let driver_names = [];
        const c_list = v_andruavUnit.m_SDR.m_available_drivers;
        const c_keys = Object.keys(c_list);
        const c_len = c_keys.length;
       
        for (let i =0; i<c_len; ++i) 
        { 
            const driver = c_list[c_keys[i]];
            driver_names.push(
                <option key={"op" + v_andruavUnit.getPartyID() + driver.index + driver.driver} value={driver.index}>{driver.driver}</option>
            );
        }

        return driver_names;
    }
    
    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));
        
        let btn_activate_css = this.getActiveButtonStyle(v_andruavUnit);

        let cmd_btns = [];
        let driver_names = this.getDriverNames(v_andruavUnit);
        cmd_btns.push(<div key={v_andruavUnit.getPartyID() + 'sdr2_'}  className='row css_margin_zero padding_zero  border-secondary'>
                
            <div key={v_andruavUnit.getPartyID() + 'sdr2_1'} className="col-12 mt-1">
            <div key={v_andruavUnit.getPartyID() + 'sdr2_2'} className = 'row al_l css_margin_zero d-flex '>
                <div key={v_andruavUnit.getPartyID() + 'sdr2_21'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'sdr2_211'} className={' rounded-3 text-white  cursor_hand textunit_nowidth al_c ' + btn_activate_css.r} title ='Refresh Data' onClick={() => this.fn_refresh(v_andruavUnit)}>Refresh</p>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'sdr2_221'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'sdr2_221'} className={' rounded-3 text-white  cursor_hand textunit_nowidth al_c ' + btn_activate_css.u}  title ='Update Settings' onClick={() => this.fn_UpdateSDR(v_andruavUnit)}>Update</p>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'sdr2_23'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'sdr2_231'} className={' rounded-3 text-white  cursor_hand textunit_nowidth al_c ' + btn_activate_css.s}  title ='Scan Spectrum' onClick={() => this.fn_scanSDR(v_andruavUnit, true)}>Scan Freq</p>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'sdr2_24'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'sdr2_241'} className={' rounded-3 text-white  cursor_hand textunit_nowidth al_c ' + btn_activate_css.p}  title ='Pause Scaning' onClick={() => this.fn_scanSDR(v_andruavUnit, false)}>Stop Scan</p>
                </div>
            </div>
            </div>
        </div>
        );


        return (
            <div key={v_andruavUnit.getPartyID() + "_ctl_sdr"} className={this.props.className}>
                <div key={v_andruavUnit.getPartyID() + 'sdr_1'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'sdr_11'} className="col-6 col-md-6 ">
                        <div key={v_andruavUnit.getPartyID() + 'sdr_111'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.getPartyID() + 'sdr_dr_name'} className="col-5"><small><b>SDR Driver</b></small></label>
                            <select multiple="" className="col-5" id={v_andruavUnit.getPartyID() + 'sdr_dr_name'} defaultValue={this.getDriverNameByIndex(v_andruavUnit, this.state.m_driver_index)} onChange={(e) => this.fn_onDriver(e)}>
                                {driver_names}
                            </select>
                        </div>
                        <div key={v_andruavUnit.getPartyID() + 'sdr_112'} className='row css_margin_zero padding_zero '>
                            <label className="col-5"><small><b>Freq Center</b></small></label>
                            <input type="text" className="col-5" placeholder="Center Frequency" aria-label="Center Frequency"  value={this.state.m_center_frequency} onChange={(e)=> this.fn_onFreqCenter(e)}/>
                        </div>
                        <div key={v_andruavUnit.getPartyID() + 'sdr_212'} className='row css_margin_zero padding_zero '>
                            
                        </div>
                        <div key={v_andruavUnit.getPartyID() + 'sdr_114'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.getPartyID() + 'sdr_dm_gain'} className="col-5"><small><b>Gain</b></small></label>
                            <input type="text" id={v_andruavUnit.getPartyID() + 'sdr_dm_gain'} className="col-5" placeholder="Gain" aria-label="Gain"  value={this.state.m_gain} onChange={(e)=> this.fn_onGain(e)}/>
                        </div>
                        <div key={v_andruavUnit.getPartyID() + 'sdr_115'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.getPartyID() + 'sdr_dm_interval'} className="col-5"><small><b>Interval (ms)</b></small></label>
                            <input type="text" id={v_andruavUnit.getPartyID() + 'sdr_dm_interval'} className="col-5" placeholder="Interval" aria-label="Interval"  value={this.state.m_interval} onChange={(e)=> this.fn_onInterval(e)}/>
                        </div>
                    </div>
                    <div key={v_andruavUnit.getPartyID() + 'sdr_21'} className="col-6 col-md-6 ">
                        
                        <div key={v_andruavUnit.getPartyID() + 'sdr_213'} className='row css_margin_zero padding_zero '>
                            <label className="col-5"><small><b>Sample Rate</b></small></label>
                            <input type="text" className="col-5" placeholder="Sample Rate" aria-label="Sample Rate"  value={this.state.m_sample_rate} onChange={(e)=> this.fn_onSampleRate(e)}/>
                        
                        </div>
                        <div key={v_andruavUnit.getPartyID() + 'sdr_215'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.getPartyID() + 'sdr_dm_bar'} className="col-5"><small><b>Bars</b></small></label>
                            <input type="text" id={v_andruavUnit.getPartyID() + 'sdr_dm_bar'} className="col-5" placeholder="Bars" aria-label="Bars"  value={this.state.m_display_bars} onChange={(e)=> this.fn_onDisplayBars(e)}/>
                        </div>
                        <div key={v_andruavUnit.getPartyID() + 'sdr_216'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.getPartyID() + 'sdr_dm_trigger_level'} className="col-5"><small><b>Trigger</b></small></label>
                            <input type="text" id={v_andruavUnit.getPartyID() + 'sdr_dm_trigger_level'} className="col-5" placeholder="Trigger" aria-label="Trigger"  value={this.state.m_trigger_level} onChange={(e)=> this.fn_onTriggerLevel(e)}/>
                        </div>
                    </div>
                </div>
                <div key={v_andruavUnit.getPartyID() + 'sdr_3'} className='row css_margin_zero padding_zero '>
                        <div key={v_andruavUnit.getPartyID() + 'sdr_31'} className="col-12">
                            <p key={v_andruavUnit.getPartyID() + 'sdr_311'} className="textunit user-select-all m-0"><span><small><b>Last Active <span className='text-warning' ><small><b>{v_date.toUTCString()}</b></small></span> </b></small></span></p>
                        </div>
                </div>
                    {cmd_btns}
                <div key={v_andruavUnit.getPartyID() + 'sdr_4'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                    <ClassSDRSpectrumVisualizer p_unit={this.props.p_unit}/>
                </div> 
                <div key={v_andruavUnit.getPartyID() + 'sdr_5'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                    
                    
                </div>
            </div>
        );
    }

}