export class CLSS_CTRL_P2P extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

        window.AndruavLibs.EventEmitter.fn_subscribe (EE_unitUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        window.AndruavLibs.EventEmitter.fn_unsubscribe (EE_unitUpdated,this);
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
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
        switch(v_andruavUnit.m_P2P.m_connection_type)
        {
            case CONST_TYPE_UNKNOWN:
                break;
            
            case CONST_TYPE_ESP32_MESH:
                txt_connection_type='ep32-mesh';
                css_connection_type='text-success';
                break;
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
                    </div>
                    <div key={v_andruavUnit.partyID + 'p2p_21'} className="col-6 ">
                        <div key={v_andruavUnit.partyID + 'p2p_211'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_2111'} className="textunit_nowidth user-select-all m-0"><span><small><b>Address <span className='text-warning' ><b>{v_andruavUnit.m_P2P.m_address_1}</b></span> </b></small></span></p>
                        </div>
                        <div key={v_andruavUnit.partyID + 'p2p_212'} className='row css_margin_zero padding_zero '>
                            <p key={v_andruavUnit.partyID + 'p2p_2121'} className="textunit_nowidth user-select-all m-0"><span><small><b>GROUP <span className='text-warning' ><b>{v_andruavUnit.m_P2P.m_wifi_password}</b></span> </b></small></span></p>
                        </div>
                    </div>
                </div>

            </div>
        );
    }

}