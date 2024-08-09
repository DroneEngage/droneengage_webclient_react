/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Aug - 2024
 */

import React    from 'react';
import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import * as js_andruavMessages from '../../js/js_andruavMessages.js'
import ClassSDRSpectrumVisualizer from './jsc_ctrl_sdr_spectrum.jsx'

export class ClssCTRL_SDR extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update : 0,
                m_center_frequency : 0.0,
                m_band_width : 0.0,
                m_driver_name : '',
                m_driver_index: 0,
                m_gain : 0.0,
                m_sample_rate : 0.0,
                m_decode_mode: 0,
                m_updated :
                {
                    fc : false,
                    f  : false,
                    bw : false,
                    g  : false,
                    sr : false,
                    dm : false,  // decode mode
                    dr : false,
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
    }

    fn_unitUpdated (p_me, p_unit)
    {
        p_me.fn_copyData(p_me, p_unit);
        p_me.setState({m_update:p_me.state.m_update});
    }

    fn_onDriver(e)
    {   
        this.state.m_updated.dr = true;
        
        this.setState({m_driver_index: e.target.value});
    }

    fn_onFreq(e)
    {
        this.state.m_updated.f = true;
        this.setState({m_frequency: e.target.value});
    }

    fn_onFreqCenter(e)
    {
        this.state.m_updated.fc = true;
        this.setState({m_center_frequency: e.target.value});
    }

    fn_onBandWidth(e)
    {
        this.state.m_updated.bw = true;
        this.setState({m_band_width: e.target.value});
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

    fn_onSelectDecodeModes(e)
    {
        this.state.m_updated.dm = true;
        this.setState({m_decode_mode: e.target.value});
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

        if (this.state.m_updated.fc === true)   p_fequency_center   = parseFloat(this.state.m_center_frequency);
        if (this.state.m_updated.f === true)    p_fequency          = parseFloat(this.state.m_frequency);
        if (this.state.m_updated.bw === true)   p_band_width        = parseFloat(this.state.m_band_width);
        if (this.state.m_updated.ga === true)    p_gain             = parseFloat(this.state.m_gain);
        if (this.state.m_updated.sr === true)   p_sample_rate       = parseFloat(this.state.m_sample_rate);
        const dm = this.state.m_decode_mode;
        if (this.state.m_updated.dm === true)   p_decode_mode       = ((dm === null)?0:parseInt(dm));
        const index = this.state.m_driver_index;
        if (this.state.m_updated.dr === true)   p_driver_index      = ((index === null)?0:parseInt(index));
        
        js_globals.v_andruavClient.API_setSDRConfig(p_andruavUnit, p_fequency_center, p_fequency,
            p_band_width, p_gain, p_sample_rate,
            p_decode_mode, p_driver_index); 


        
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
                return "bg-success";

            case js_andruavMessages.CONST_SDR_STATUS_ERROR:
                    return "bg-light";
                
            case js_andruavMessages.CONST_SDR_STATUS_CONNECTED:
                return "bg-warning";

            case js_andruavMessages.CONST_SDR_STATUS_STREAMING:
                return "bg-danger";
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
        {/* <button className="btn btn-warning col-2 btn-sm" type="button" id={v_andruavUnit.partyID + 'sdr_1111b'} onClick={() => this.fn_onUpdate(v_andruavUnit)}>Update</button>     */}
        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));
        
        var btn_activate_css = this.getActiveButtonStyle(v_andruavUnit);

        var cmd_btns = [];
        var driver_names = this.getDriverNames(v_andruavUnit);
        cmd_btns.push(<div key={v_andruavUnit.partyID + 'sdr2_'}  className='row css_margin_zero padding_zero  border-secondary'>
                
            <div key={v_andruavUnit.partyID + 'sdr2_1'} className="col-12 mt-1">
            <div key={v_andruavUnit.partyID + 'sdr2_2'} className = 'row al_l css_margin_zero d-flex '>
                <div key={v_andruavUnit.partyID + 'sdr2_21'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'sdr2_211'} className={' rounded-3 text-white cursor_hand textunit_nowidth al_c ' + btn_activate_css} title ='Activate SDR Device' onClick={() => this.fn_activateSDR(v_andruavUnit)}>Activate</p>
                </div>
                <div key={v_andruavUnit.partyID + 'sdr2_221'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'sdr2_221'} className=' rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c' title ='Update Settings' onClick={() => this.fn_UpdateSDR(v_andruavUnit)}>Update</p>
                </div>
                <div key={v_andruavUnit.partyID + 'sdr2_23'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'sdr2_231'} className=' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c' title ='Scan Spectrum' onClick={() => this.fn_scanSDR(v_andruavUnit)}>Scan Freq</p>
                </div>
                <div key={v_andruavUnit.partyID + 'sdr2_24'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'sdr2_241'} className=' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c' title ='Refresh Data' onClick={() => this.fn_refresh(v_andruavUnit)}>Refresh</p>
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
                            {/* <p key={v_andruavUnit.partyID + 'sdr_1111'} className="textunit_nowidth user-select-all m-0"><span><small><b>SDR Type <span className={css_connection_type} ><b>{txt_connection_type}</b></span></b></small></span></p> */}
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_dr_name'} className="col-5">SDR Driver</label>
                            <select multiple="" className="form-select" id={v_andruavUnit.partyID + 'sdr_dr_name'} value={this.getDriverNameByIndex(v_andruavUnit, this.state.m_driver_index)} onChange={(e) => this.fn_onDriver(e)}>
                                {driver_names}
                            </select>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_112'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_1121'} className="textunit_nowidth user-select-all m-0"><span><small><b>Freq <span className='text-warning' ><b>{v_andruavUnit.m_SDR.m_center_frequency}</b></span></b></small></span></p> */}
                            <label className="col-5">Freq Center</label>
                            <input type="text" className="col-5" placeholder="Center Frequency" aria-label="Center Frequency"  value={this.state.m_center_frequency} onChange={(e)=> this.fn_onFreqCenter(e)}/>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_212'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_2121'} className="textunit_nowidth user-select-all m-0"><span><small><b>Group <span className='text-warning' ><b>{v_andruavUnit.m_P2P.m_wifi_password}</b></span> </b></small></span></p> */}
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_f'} className="col-5">Freq</label>
                            <input type="text" id={v_andruavUnit.partyID + 'sdr_f'} className="col-5" placeholder="Freq" aria-label="Freq"  value={this.state.m_frequency} onChange={(e)=> this.fn_onFreq(e)}/>
                        
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_114'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_1141'} className="textunit_nowidth user-select-all m-0"><span><small><b>Gain  <span className='text-warning' ><b>{v_andruavUnit.m_SDR.m_gain}</b></span><span className="text-success">{}</span></b></small></span></p> */}
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_dm_gain'} className="col-5">Gain</label>
                            <input type="text" id={v_andruavUnit.partyID + 'sdr_dm_gain'} className="col-5" placeholder="Gain" aria-label="Gain"  value={this.state.m_gain} onChange={(e)=> this.fn_onGain(e)}/>
                        </div>
                    </div>
                    <div key={v_andruavUnit.partyID + 'sdr_21'} className="col-6 col-md-6 ">
                        
                        <div key={v_andruavUnit.partyID + 'sdr_211'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.partyID + 'sdr_dm_modes'} className="col-5">Decode Mode</label>
                            <select multiple="" className="form-select" id={v_andruavUnit.partyID + 'sdr_dm_modes'} value={this.state.m_decode_mode} onChange={(e) => this.fn_onSelectDecodeModes(e)}>
                                <option value="0">FM</option>
                                <option value="1">NBFM</option>
                                <option value="2">AM</option>
                                <option value="3">NAM</option>
                                <option value="4">USB</option>
                                <option value="5">LSB</option>
                                <option value="6">CW</option>
                            </select>

                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_213'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_2131'} className="textunit_nowidth user-select-all m-0"><span><small><b>Parent Status  <span className={css_parent_connected} ><b>{txt_parent_connected}</b></span></b></small></span></p> */}
                            <label className="col-5">Sample Rate</label>
                            <input type="text" className="col-5" placeholder="Sample Rate" aria-label="Sample Rate"  value={this.state.m_sample_rate} onChange={(e)=> this.fn_onSampleRate(e)}/>
                        
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_113'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_1131'} className="textunit_nowidth user-select-all m-0"><span><small><b>BW  <span className='text-warning' ><b>{v_andruavUnit.m_SDR.m_band_width}</b></span><span className="text-success">{}</span></b></small></span></p> */}
                            <label className="col-5">Band Width</label>
                            {/*<input type="text" className="col-5" placeholder="Bandwidth" aria-label="Bandwidth"  value={this.state.m_band_width} onChange={(e)=> this.fn_onBandWidth(e)}/>*/}
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
                    {/* <CLASS_CTRL_P2P_IN_RANGE_NODEs key={v_andruavUnit.partyID + 'sdr_41'} p_unit={v_andruavUnit} ></CLASS_CTRL_P2P_IN_RANGE_NODEs> */}
                    <ClassSDRSpectrumVisualizer p_unit={this.props.p_unit}/>
                </div> 
                <div key={v_andruavUnit.partyID + 'sdr_5'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                    {/* <CLASS_CTRL_P2P_IN_RANGE_BSSIDs key={v_andruavUnit.partyID + 'sdr_51'} p_unit={v_andruavUnit} ></CLASS_CTRL_P2P_IN_RANGE_BSSIDs> */}
                    
                </div>
            </div>
        );
    }

}