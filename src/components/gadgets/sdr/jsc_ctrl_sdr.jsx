/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Aug - 2024
 */

import React    from 'react';
import {js_globals} from '../../../js/js_globals.js';
import {js_eventEmitter} from '../../../js/js_eventEmitter.js'


export class ClssCTRL_SDR extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

        js_eventEmitter.fn_subscribe (js_globals.EE_unitSDRUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_globals.EE_unitSDRUpdated,this);
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
    }

    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        var txt_connection_type='nothing';
        var css_connection_type= 'text-warning';
        
        var txt_address = ': OFF';
        var css_txt_address = 'text-disabled';

        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));
        var cmd_btns = [];
        return (
            <div key={v_andruavUnit.partyID + "_ctl_sdr"} className="">
                <div key={v_andruavUnit.partyID + 'sdr_1'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.partyID + 'sdr_11'} className="col-6 ">
                        <div key={v_andruavUnit.partyID + 'sdr_111'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'sdr_1111'} className="textunit_nowidth user-select-all m-0"><span><small><b>SDR Type <span className={css_connection_type} ><b>{txt_connection_type}</b></span></b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_112'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'sdr_1121'} className="textunit_nowidth user-select-all m-0"><span><small><b>Freq <span className='text-warning' ><b>{v_andruavUnit.m_SDR.m_center_frequency}</b></span></b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_113'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'sdr_1131'} className="textunit_nowidth user-select-all m-0"><span><small><b>BW  <span className='text-warning' ><b>{v_andruavUnit.m_SDR.m_band_width}</b></span><span className="text-success">{}</span></b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_114'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'sdr_1141'} className="textunit_nowidth user-select-all m-0"><span><small><b>Gain  <span className='text-warning' ><b>{v_andruavUnit.m_SDR.m_gain}</b></span><span className="text-success">{}</span></b></small></span></p>
                        </div>
                    </div>
                    <div key={v_andruavUnit.partyID + 'sdr_21'} className="col-6 ">
                        <div key={v_andruavUnit.partyID + 'sdr_211'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_2111'} className="textunit_nowidth user-select-all m-0"><span><small><b>Address <span className={css_txt_address} ><b>{v_andruavUnit.m_P2P.m_address_1 + txt_address }</b></span> </b></small></span></p> */}
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_212'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_2121'} className="textunit_nowidth user-select-all m-0"><span><small><b>Group <span className='text-warning' ><b>{v_andruavUnit.m_P2P.m_wifi_password}</b></span> </b></small></span></p> */}
                        </div>
                        <div key={v_andruavUnit.partyID + 'sdr_213'} className='row css_margin_zero padding_zero '>
                            {/* <p key={v_andruavUnit.partyID + 'sdr_2131'} className="textunit_nowidth user-select-all m-0"><span><small><b>Parent Status  <span className={css_parent_connected} ><b>{txt_parent_connected}</b></span></b></small></span></p> */}
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
                </div> 
                <div key={v_andruavUnit.partyID + 'sdr_5'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                    {/* <CLASS_CTRL_P2P_IN_RANGE_BSSIDs key={v_andruavUnit.partyID + 'sdr_51'} p_unit={v_andruavUnit} ></CLASS_CTRL_P2P_IN_RANGE_BSSIDs> */}
                </div>    
            </div>
        );
    }

}