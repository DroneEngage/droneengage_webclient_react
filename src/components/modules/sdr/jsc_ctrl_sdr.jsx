/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Aug - 2024
 */

import React    from 'react';
import {js_globals} from '../../../js/js_globals.js';
import {js_eventEmitter} from '../../../js/js_eventEmitter.js'
import * as js_andruavMessages from '../../../js/js_andruavMessages.js'
import ClassSDRSpectrumVisualizer from './jsc_ctrl_sdr_spectrum.jsx'

export class ClssCTRL_SDR extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update : 0,
                m_center_frequency : 0.0,
                m_frequency : 0.0,
                m_band_width : 0.0,
                m_driver_name : '',
                m_driver_index: 0,
                m_gain : 0.0,
                m_sample_rate : 0.0,
                m_decode_mode: 0,
                m_display_bars: 30,
                m_updated :
                {
                    fc : false,
                    f  : false,
                    bw : false,
                    g  : false,
                    sr : false,
                    dm : false,  // decode mode
                    dr : false,
                    db : false,
                }
		};

        this.Modes = ["FM", "NBFM", "AM", "NAM", "USB", "LSB", "CW"]
        js_eventEmitter.fn_subscribe (js_globals.EE_unitSDRUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_globals.EE_unitSDRUpdated,this);
    }

    componentDidMount () 
    {
        const  v_andruavUnit = this.props.p_unit;
        this.fn_copyData(this,v_andruavUnit);
    }

    fn_copyData(p_me, p_andruavUnit)
    {
        p_me.state.m_center_frequency = p_andruavUnit.m_SDR.m_center_frequency;
        p_me.state.m_frequency = p_andruavUnit.m_SDR.m_frequency;
        p_me.state.m_band_width = p_andruavUnit.m_SDR.m_band_width;
        p_me.state.m_driver_index = p_andruavUnit.m_SDR.m_driver_index;
        p_me.state.m_sample_rate = p_andruavUnit.m_SDR.m_sample_rate;
        p_me.state.m_gain = p_andruavUnit.m_SDR.m_gain;
        p_me.state.m_decode_mode = p_andruavUnit.m_SDR.m_decode_mode;
        p_me.state.m_display_bars = p_andruavUnit.m_SDR.m_display_bars;
    }

    fn_unitUpdated (p_me, p_unit)
    {
        p_me.fn_copyData(p_me, p_unit);
        p_me.setState({m_update:p_me.state.m_update});
    }

    fn_onDriver(e)
    {   
        this.setState({m_updated: { dr: true }, m_driver_index: e.target.value});
    }

    fn_onFreq(e)
    {
        this.state.m_updated.f = true;
        this.setState({m_updated: { dr: true }, m_frequency: e.target.value});
    }

    fn_onFreqCenter(e)
    {
        this.setState({m_updated: { fc: true }, m_center_frequency: e.target.value});
    }

    fn_onBandWidth(e)
    {
        this.setState({m_updated: { bw: true }, m_band_width: e.target.value});
    }

    fn_onSampleRate(e)
    {
        this.setState({m_updated: { sr: true }, m_sample_rate: e.target.value});
    }

    fn_onGain(e)
    {
        this.setState({m_updated: { ga: true }, m_gain: e.target.value});
    }

    fn_onDisplayBars(e)
    {
        this.setState({m_updated: { db: true }, m_display_bars: e.target.value});
    }

    fn_onSelectDecodeModes(e)
    {
        this.setState({m_updated: { dm: true }, m_decode_mode: e.target.value});
    }

    fn_activateSDR(p_andruavUnit)
    {

    }

    fn_UpdateSDR(p_andruavUnit)
    {
        var p_fequency_center = null;
        var p_fequency = null;
        var p_band_width = null;
        var p_gain = null;
        var p_sample_rate = null;
        var p_decode_mode = null;
        var p_driver_index = null;
        var p_display_bars = null;

        if (this.state.m_updated.fc === true)   p_fequency_center   = parseFloat(this.state.m_center_frequency);
        if (this.state.m_updated.f === true)    p_fequency          = parseFloat(this.state.m_frequency);
        if (this.state.m_updated.bw === true)   p_band_width        = parseFloat(this.state.m_band_width);
        if (this.state.m_updated.ga === true)   p_gain              = parseFloat(this.state.m_gain);
        if (this.state.m_updated.sr === true)   p_sample_rate       = parseFloat(this.state.m_sample_rate);
        if (this.state.m_updated.db === true)   p_display_bars      = parseFloat(this.state.m_display_bars);
        
        const dm = this.state.m_decode_mode;
        if (this.state.m_updated.dm === true)   p_decode_mode       = ((dm === null)?0:parseInt(dm));
        const index = this.state.m_driver_index;
        if (this.state.m_updated.dr === true)   p_driver_index      = ((index === null)?0:parseInt(index));
        
        js_globals.v_andruavClient.API_setSDRConfig(p_andruavUnit, p_fequency_center, p_fequency,
            p_band_width, p_gain, p_sample_rate,
            p_decode_mode, p_driver_index, p_display_bars); 


        
        // this.state.m_updated.fc = false;
        // this.state.m_updated.f = false;
        // this.state.m_updated.bw = false;
        // this.state.m_updated.ga= false;
        // this.state.m_updated.sr = false;
        // this.state.m_updated.dm = false;
        // this.state.m_updated.dr = false;
        
    }

    
    fn_scanSDR(p_andruavUnit)
    {
        js_globals.v_andruavClient.API_scanSDRFreq(p_andruavUnit);
    }


    fn_refresh(p_andruavUnit)
    {
        js_globals.v_andruavClient.API_requestSDR(p_andruavUnit);
        js_globals.v_andruavClient.API_scanSDRDrivers(p_andruavUnit);
    }


    getActiveButtonStyle(v_andruavUnit)
    {
        switch (v_andruavUnit.m_SDR.m_status)
        {
            case js_andruavMessages.CONST_SDR_STATUS_NOT_CONNECTED:
                return {r:"bg-light", u:"bg-light", s:"bg-light"};

            case js_andruavMessages.CONST_SDR_STATUS_ERROR:
                    return {r:"bg-danger", u:"bg-light", s:"bg-light"};
                
            case js_andruavMessages.CONST_SDR_STATUS_CONNECTED:
                return {r:"bg-success", u:"bg-danger", s:"bg-warning"};

            case js_andruavMessages.CONST_SDR_STATUS_STREAMING:
                return {r:"bg-light", u:"bg-light", s:"bg-danger"};
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
        var driver_names = [];
        const c_list = v_andruavUnit.m_SDR.m_available_drivers;
        const c_keys = Object.keys(c_list);
        const c_len = c_keys.length;
       
        for (let i =0; i<c_len; ++i) 
        { 
            const driver = c_list[c_keys[i]];
            driver_names.push(
                <option key={"op" + v_andruavUnit.partyID + driver.index + driver.driver} value={driver.index}>{driver.driver}</option>
            );
        }

        return driver_names;
    }
    
    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));
        
        var btn_activate_css = this.getActiveButtonStyle(v_andruavUnit);

        var cmd_btns = [];
        var driver_names = this.getDriverNames(v_andruavUnit);
        cmd_btns.push(<div key={v_andruavUnit.partyID + 'sdr2_'}  className='row css_margin_zero padding_zero  border-secondary'>
                
            <div key={v_andruavUnit.partyID + 'sdr2_1'} className="col-12 mt-1">
            <div key={v_andruavUnit.partyID + 'sdr2_2'} className = 'row al_l css_margin_zero d-flex '>
                <div key={v_andruavUnit.partyID + 'sdr2_24'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'sdr2_241'} className={' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c ' + btn_activate_css.r} title ='Refresh Data' onClick={() => this.fn_refresh(v_andruavUnit)}>Refresh</p>
                </div>
                <div key={v_andruavUnit.partyID + 'sdr2_221'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'sdr2_221'} className={' rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c ' + btn_activate_css.u}  title ='Update Settings' onClick={() => this.fn_UpdateSDR(v_andruavUnit)}>Update</p>
                </div>
                <div key={v_andruavUnit.partyID + 'sdr2_23'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'sdr2_231'} className={' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c ' + btn_activate_css.s}  title ='Scan Spectrum' onClick={() => this.fn_scanSDR(v_andruavUnit)}>Scan Freq</p>
                </div>
            </div>
            </div>
        </div>
        );


        return (
            <div key={v_andruavUnit.partyID + "_ctl_sdr"} className="">
                <div key={v_andruavUnit.partyID + 'sdr_1'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.partyID + 'sdr_11'} className="col-6 col-md-6 ">
                        <div key={v_andruavUnit.partyID + 'sdr_111'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_dr_name'} className="col-5"><small><b>SDR Driver</b></small></label>
                            <select multiple="" className="col-5" id={v_andruavUnit.partyID + 'sdr_dr_name'} defaultValue={this.getDriverNameByIndex(v_andruavUnit, this.state.m_driver_index)} onChange={(e) => this.fn_onDriver(e)}>
                                {driver_names}
                            </select>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_112'} className='row css_margin_zero padding_zero '>
                            <label className="col-5"><small><b>Freq Center</b></small></label>
                            <input type="text" className="col-5" placeholder="Center Frequency" aria-label="Center Frequency"  value={this.state.m_center_frequency} onChange={(e)=> this.fn_onFreqCenter(e)}/>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_212'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_f'} className="col-5"><small><b>Freq</b></small></label>
                            <input type="text" id={v_andruavUnit.partyID + 'sdr_f'} className="col-5" placeholder="Freq" aria-label="Freq"  value={this.state.m_frequency} onChange={(e)=> this.fn_onFreq(e)}/>
                        
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_114'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_dm_gain'} className="col-5"><small><b>Gain</b></small></label>
                            <input type="text" id={v_andruavUnit.partyID + 'sdr_dm_gain'} className="col-5" placeholder="Gain" aria-label="Gain"  value={this.state.m_gain} onChange={(e)=> this.fn_onGain(e)}/>
                        </div>
                    </div>
                    <div key={v_andruavUnit.partyID + 'sdr_21'} className="col-6 col-md-6 ">
                        
                        {/* <div key={v_andruavUnit.partyID + 'sdr_211'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_dm_modes'} className="col-5"><small><b>Decode Mode</b></small></label>
                            <select multiple="" className="col-5" id={v_andruavUnit.partyID + 'sdr_dm_modes'} value={this.state.m_decode_mode} onChange={(e) => this.fn_onSelectDecodeModes(e)}>
                                <option value="0">FM</option>
                                <option value="1">NBFM</option>
                                <option value="2">AM</option>
                                <option value="3">NAM</option>
                                <option value="4">USB</option>
                                <option value="5">LSB</option>
                                <option value="6">CW</option>
                            </select>

                        </div> */}
                        <div key={v_andruavUnit.partyID + 'sdr_213'} className='row css_margin_zero padding_zero '>
                            <label className="col-5"><small><b>Sample Rate</b></small></label>
                            <input type="text" className="col-5" placeholder="Sample Rate" aria-label="Sample Rate"  value={this.state.m_sample_rate} onChange={(e)=> this.fn_onSampleRate(e)}/>
                        
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_215'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_dm_bar'} className="col-5"><small><b>Bars</b></small></label>
                            <input type="text" id={v_andruavUnit.partyID + 'sdr_dm_bar'} className="col-5" placeholder="Bars" aria-label="Bars"  value={this.state.m_display_bars} onChange={(e)=> this.fn_onDisplayBars(e)}/>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_214'} className='row css_margin_zero padding_zero '>
                            <label className="col-5"><small><b>Band Width</b></small></label>
                            <p  className="col-5" placeholder="Bandwidth" aria-label="Bandwidth">{this.state.m_band_width}</p>
                        </div>
                        
                    </div>
                </div>
                <div key={v_andruavUnit.partyID + 'sdr_3'} className='row css_margin_zero padding_zero '>
                        <div key={v_andruavUnit.partyID + 'sdr_31'} className="col-12">
                            <p key={v_andruavUnit.partyID + 'sdr_311'} className="textunit user-select-all m-0"><span><small><b>Last Active <span className='text-warning' ><small><b>{v_date.toUTCString()}</b></small></span> </b></small></span></p>
                        </div>
                </div>
                    {cmd_btns}
                <div key={v_andruavUnit.partyID + 'sdr_4'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                    <ClassSDRSpectrumVisualizer p_unit={this.props.p_unit}/>
                </div> 
                <div key={v_andruavUnit.partyID + 'sdr_5'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                    
                    
                </div>
            </div>
        );
    }

}