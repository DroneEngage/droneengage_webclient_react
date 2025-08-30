/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: March - 2024
 */

import React    from 'react';

import * as js_siteConfig from '../../../js/js_siteConfig.js'
import {js_globals} from '../../../js/js_globals.js';
import * as js_andruavMessages from '../../../js/js_andruavMessages.js'
import {js_eventEmitter} from '../../../js/js_eventEmitter.js'


export class ClssCtrlExperimental extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

        this.m_flag_mounted = false;

    }

    componentWillUnmount () {
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
    }

    fn_ConnectToLocalCommServer (p_andruavUnit)
    {
        js_globals.v_andruavFacade.API_connectToLocalCommServer(p_andruavUnit,"192.168.1.144","9967")
    }

    fn_scanP2P (p_andruavUnit)
    {
    }

    fn_setCommunicationChannel_WS (p_andruavUnit, ws_state, duration)
    {
        js_globals.v_andruavFacade.API_SetCommunicationChannel (p_andruavUnit, ws_state, null, duration, null, null, null);
    }

    fn_setCommunicationChannel_Local_WS (p_andruavUnit, local_state, duration)
    {
        js_globals.v_andruavFacade.API_SetCommunicationChannel (p_andruavUnit, null, null, null, null, local_state, duration);
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
        
        let txt_address = ': OFF';
        let css_txt_address = 'text-disabled';

        
        

        let txt_parent_connected = '';
        let css_parent_connected = '';
        if (v_andruavUnit.m_P2P.m_parent_connected === true)
        {
            txt_parent_connected='connected';
            css_parent_connected='text-success';
        }
        else
        {
            txt_parent_connected='disconected';
            css_parent_connected='text-danger';
        }        


        let txt_channel_exp_offline = 'LWSDC';
        let txt_channel_ws_offline = ' WSDC';
        
   

        let cmd_btns = [];
            cmd_btns.push(<div key={v_andruavUnit.getPartyID() + 'exp_'}  className='row css_margin_zero padding_zero  border-secondary'>
                
                <div key={v_andruavUnit.getPartyID() + 'exp_1'} className="col-12 mt-1">
                <div key={v_andruavUnit.getPartyID() + 'exp_2'} className = 'row al_l css_margin_zero d-flex '>
                    <div key={v_andruavUnit.getPartyID() + 'exp_21'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'exp_211'} className=' rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c' title ='Local Comm Server' onClick={() => this.fn_ConnectToLocalCommServer(v_andruavUnit)}>LWSC</p>
                    </div>
                    <div key={v_andruavUnit.getPartyID() + 'exp_22'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'exp_212'} className=' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c bi bi-upc-scan' title ='Scan Nearby WIFI' onClick={() => this.fn_scanP2P(v_andruavUnit)}> WIFI Scan</p>
                    </div>
                    <div key={v_andruavUnit.getPartyID() + 'exp_23'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'exp_213'} className={' rounded-3 cursor_hand text unit_nowidth al_c'} title ='Set Channel online/offline' onClick={() => this.fn_setCommunicationChannel_Local_WS(v_andruavUnit, false, 10)}>{txt_channel_exp_offline}</p>
                    </div>
                    <div key={v_andruavUnit.getPartyID() + 'exp_24'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'exp_214'} className={' rounded-3 text-white bg-danger cursor_hand text unit_nowidth al_c bi bi-wifi'} title ='Set Channel online/offline' onClick={() => this.fn_setCommunicationChannel_WS(v_andruavUnit, false, 10)}>{txt_channel_ws_offline}</p>
                    </div>
                </div>
                </div>
            </div>);
        

        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));
        
        return (
            <div key={v_andruavUnit.getPartyID() + "_ctl_exp"} className={this.props.className}>

                <div key={v_andruavUnit.getPartyID() + 'exp_1'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.getPartyID() + 'sdr_112'} className='row css_margin_zero padding_zero '>
                            <label className="col-3"><small><b>WS-Local</b></small></label>
                            <input type="text" className="col-5" placeholder="Local Server IP:port" aria-label="IP"   />
                            <p key={v_andruavUnit.getPartyID() + 'exp_211'} className=' col-2 rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c' title ='Reset P2P HW' onClick={() => this.fn_ConnectToLocalCommServer(v_andruavUnit)}>LWSC</p>
                    
                        </div>
                        
                </div>
                <div key={v_andruavUnit.getPartyID() + 'exp_3'} className='row css_margin_zero padding_zero '>
                        <div key={v_andruavUnit.getPartyID() + 'exp_31'} className="col-12">
                            <p key={v_andruavUnit.getPartyID() + 'exp_311'} className="textunit user-select-all m-0"><span><small><b>Last Active <span className='text-warning' ><small><b>{v_date.toUTCString()}</b></small></span> </b></small></span></p>
                        </div>
                </div>
                    {cmd_btns}
                <div key={v_andruavUnit.getPartyID() + 'exp_4'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                </div> 
                <div key={v_andruavUnit.getPartyID() + 'exp_5'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                </div>    
            </div>
        );
    }

}