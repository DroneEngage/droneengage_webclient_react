/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Apr - 2024
 */

import React    from 'react';


import * as js_helpers from '../../../js/js_helpers.js'
import {js_globals} from '../../../js/js_globals.js';
import {EVENTS as js_event} from '../../../js/js_eventList.js'
import {js_eventEmitter} from '../../../js/js_eventEmitter.js'



class CLASS_CTRL_P2P_IN_RANGE_BSSID_INFO  extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

    } 

    render()
    {
        let css_connection_type = "";
        let css_txt_rssi = "";
            
        let txt_parent_name = "";
        
        const v_andruavUnit = this.props.p_unit;
        const v_inrange_node = this.props.p_inrange_bssid;
        const unit = js_globals.m_andruavUnitList.fn_getUnitByP2PMac(v_inrange_node.bssid);
        
        let p2 = v_andruavUnit.getPartyID();
        if (unit!=null)
        {
            p2 = unit.getPartyID();
        }
        const p1 = v_andruavUnit.getPartyID();
        

        /*
            RSSI Value Range	WiFi Signal Strength
            RSSI > – 30 dBm	 Excellent
            RSSI < – 55 dBm	 Very good signal
            RSSI < – 67 dBm	 Fairly Good
            RSSI < – 70 dBm	 Okay
            RSSI < – 80 dBm	 Not good
            RSSI < – 90 dBm	 Extremely weak signal (unusable)
        */
       
        const rssi = new Int8Array([v_inrange_node.rssi ])[0];
        let txt_rssi="unknown";
        if (rssi > -30)
        {
            css_txt_rssi = 'text-success';
            txt_rssi = 'excellent';
        }else
        if (rssi > -55)
        {
            css_txt_rssi = 'text-info';
            txt_rssi = 'Very good signal';
        }else
        if (rssi > -67)
        {
            css_txt_rssi = 'text-primary';
            txt_rssi = 'Fairly Good';
        }else
        if (rssi > -70)
        {
            css_txt_rssi = 'text-white';
            txt_rssi = 'Okay';
        }else
        if (rssi > -80)
        {
            css_txt_rssi = 'text-warning';
            txt_rssi = 'excellent ';
        }else
        if (rssi > -90)
        {
            css_txt_rssi = 'text-danger';
            txt_rssi = 'Not good';
        }else
        {
            css_txt_rssi = 'text-secondary';
            txt_rssi = 'Extremely weak signal (unusable)';
        }
        
        return (
            <div key={p1  + p2 + 'p2pn_1'} className='row css_margin_zero padding_zero border-bottom border-secondary '>

                        <div key={p1 + p2 + 'p2pn_11'} className="col-6 ">
                            <div key={p1 + p2 + 'p2pn_111'} className='row css_margin_zero padding_zero '>
                                <p key={p1 + p2 + 'p2pn_1111'} className="textunit_nowidth user-select-all m-0"><span><small><b>BSSID&nbsp; <span className={css_connection_type} ><b>{v_inrange_node.bssid}</b></span></b></small></span></p>
                            </div>
                            <div key={p1 + p2 + 'p2pn_112'} className='row css_margin_zero padding_zero '>
                                <p key={p1 + p2 + 'p2pn_1121'} className="textunit_nowidth user-select-all m-0"><span><small><b>SSID&nbsp; <span className='text-warning' ><b>{v_inrange_node.ssid}: {js_helpers.fn_getTimeDiffDetails_Shortest (v_inrange_node.last_time/1000000)}</b></span></b></small></span></p>
                            </div>
                        </div>
                        
                        <div key={p1 + p2 + 'p2pn_21'} className="col-6 ">
                            <div key={p1 + p2 + 'p2pn_213'} className='row css_margin_zero padding_zero '>
                                    <p key={p1 + p2 + 'p2pn_2131'} className="textunit_nowidth user-select-all m-0"><span><small><b>Channel&nbsp; <span className='text-warning' ><b>{v_inrange_node.channel}</b></span><span className="text-success">{txt_parent_name}</span></b></small></span></p>
                            </div>
                            <div key={p1 + p2 + 'p2pn_211'} className='row css_margin_zero padding_zero '>
                                    <p key={p1 + p2 + 'p2pn_2111'} className="textunit_nowidth user-select-all m-0" title={txt_rssi}><span><small><b>RSSI&nbsp; <span className={css_txt_rssi} ><b>{rssi  + " dBm"}</b></span> </b></small></span></p>
                            </div>
                        </div>
            </div>
            
        );
    }

    }

export class CLASS_CTRL_P2P_IN_RANGE_BSSIDs extends React.Component {

    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe (js_event.EE_unitP2PUpdated,this,this.fn_unitUpdated);
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_unitP2PUpdated,this);
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
    }

    fn_unitUpdated (p_me,p_andruavUnit)
    {
        if (p_me.props.p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return ;
        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }


    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        let v_units = [];
        Object.entries(v_andruavUnit.m_P2P.m_detected_bssid).forEach(([partyID, inrange_bssid]) => {
            
            v_units.push( 
                    <CLASS_CTRL_P2P_IN_RANGE_BSSID_INFO key={v_andruavUnit.partID+partyID+'rnbssid_1'}  p_unit={v_andruavUnit} p_inrange_bssid={inrange_bssid} />
                );
        });
        
        let rendered=[];
        if (v_units.length === 0)
        {
            rendered.push(
                <div key={v_andruavUnit.partID+'rnbssid_00'} className='row css_margin_zero padding_zero border-top border-secondary' >
                <div className='col-12 col-sm-3 user-select-none  textunit_nowidth text-danger'>No&nbsp;Nearby&nbsp;BSSIDs</div>
                </div>);
        }
        else
        {
            rendered.push
            (   <div key={v_andruavUnit.partID+'rnbssid_00'} className='row css_margin_zero padding_zero border-top border-secondary' >
                <div className='col-12 user-select-none textunit_nowidth text-info'><b>&nbsp;Nearby&nbsp;BSSIDs</b></div>
                </div>);
        }
        return (
            <div key={v_andruavUnit.partID+'rnbssid_'} >{rendered}{v_units}
            </div>
            
        )
    }
}
