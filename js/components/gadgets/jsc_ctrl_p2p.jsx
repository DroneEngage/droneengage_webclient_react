export class CLSS_CTRL_P2P extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

        window.AndruavLibs.EventEmitter.fn_subscribe (EE_unitP2PUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        window.AndruavLibs.EventEmitter.fn_unsubscribe (EE_unitP2PUpdated,this);
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
    }

    fn_resetP2P (p_andruavUnit)
    {
        v_andruavClient.API_resetP2P(p_andruavUnit)
    }
    
    fn_unitUpdated (p_me,p_andruavUnit)
    {
        if (p_me._isMounted !== true) return ;

        if (p_me.props.p_unit.partyID != p_andruavUnit.partyID) return ;
        if (p_me.state.m_update == 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        var txt_connection_type='nothing';
        var css_connection_type= 'text-warning';
        var txt_address = ': ON';
        var css_txt_address = 'text-warning';

        if (v_andruavUnit.m_P2P.m_driver_connected===false)
        {
            css_txt_address='text-disabled';
            txt_address = ': OFF';
        }
        switch(v_andruavUnit.m_P2P.m_connection_type)
        {
            case CONST_TYPE_UNKNOWN:
                break;
            
            case CONST_TYPE_ESP32_MESH:
                txt_connection_type='ep32-mesh fw:' + v_andruavUnit.m_P2P.m_firmware;
                css_connection_type='text-success';
                break;
        }

        var txt_parent_connected = '';
        var css_parent_connected = '';
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


        var txt_parent_mac='--:--:--:--:--';
        var txt_parent_name = '';
        if (v_andruavUnit.m_P2P.m_parent_address!="")
        {
            const unit = window.AndruavLibs.AndruavClient.m_andruavUnitList.fn_getUnitByP2PMac(v_andruavUnit.m_P2P.m_parent_address);
            txt_parent_mac = v_andruavUnit.m_P2P.m_parent_address;
            if (unit!=null)
            {
                txt_parent_name = "  " + unit.m_unitName;
            }
            
        }

        var cmd_btns = [];
        if (CONST_FEATURE.DISABLE_UDPPROXY_UPDATE !== true)
        if (window.AndruavLibs.AndruavAuth.fn_do_canControl())
        {
            cmd_btns.push(<div key={v_andruavUnit.partyID + 'p2p_2'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                
                <div key={v_andruavUnit.partyID + 'p2p_21'} className="col-12 mt-1">
                <div key={v_andruavUnit.partyID + 'p2p_22'} className = 'row al_l css_margin_zero d-flex '>
                    <div key={v_andruavUnit.partyID + 'p2p_221'} className= 'col-6 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'p2p_2211'} className=' rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c' title ='Change UDP Proxy Port' onClick={() => this.fn_resetP2P(v_andruavUnit)}>Reset P2P</p>
                    </div>
                </div>
                </div>
            </div>);
        }

        return (
            <div key={v_andruavUnit.partyID + "_ctl_p2p"} className="">
                <div key={v_andruavUnit.partyID + 'p2p_1'} className='row css_margin_zero padding_zero '>
                    <div key={v_andruavUnit.partyID + 'p2p_11'} className="col-6 ">
                        <div key={v_andruavUnit.partyID + 'p2p_111'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_1111'} className="textunit_nowidth user-select-all m-0"><span><small><b>P2P Type <span className={css_connection_type} ><b>{txt_connection_type}</b></span></b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'p2p_112'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_1121'} className="textunit_nowidth user-select-all m-0"><span><small><b>Channel <span className='text-warning' ><b>{v_andruavUnit.m_P2P.m_wifi_channel}</b></span></b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'p2p_113'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_1131'} className="textunit_nowidth user-select-all m-0"><span><small><b>Parent Mac  <span className='text-warning' ><b>{txt_parent_mac}</b></span><span className="text-success">{txt_parent_name}</span></b></small></span></p>
                        </div>
                    </div>
                    <div key={v_andruavUnit.partyID + 'p2p_21'} className="col-6 ">
                        <div key={v_andruavUnit.partyID + 'p2p_211'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_2111'} className="textunit_nowidth user-select-all m-0"><span><small><b>Address <span className={css_txt_address} ><b>{v_andruavUnit.m_P2P.m_address_1 + txt_address }</b></span> </b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'p2p_212'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_2121'} className="textunit_nowidth user-select-all m-0"><span><small><b>Group <span className='text-warning' ><b>{v_andruavUnit.m_P2P.m_wifi_password}</b></span> </b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'p2p_213'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_2131'} className="textunit_nowidth user-select-all m-0"><span><small><b>Parent Status  <span className={css_parent_connected} ><b>{txt_parent_connected}</b></span></b></small></span></p>
                        </div>
                    </div>
                </div>
                {cmd_btns}

            </div>
        );
    }

}