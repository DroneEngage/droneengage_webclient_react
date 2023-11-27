import {CLSS_RX_MESSAGE} from './gadgets/jsc_ctrl_rx_messageControl.jsx'

export  class CLSS_CTRL_SETTINGS   extends React.Component {
    
    constructor(props)
    {
        super(props);
        this.state={
            m_traffic_monitor: false,
            m_message: [],
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
        if (p_me.props.p_unit.partyID != p_andruavUnit.partyID) return ;
        if (p_me.state.m_update == 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    fn_changeTelemetryPort(p_andruavUnit)
    {
        if (p_andruavUnit==null) return;
        
        fn_changeUDPPort(p_andruavUnit);
    }

    fn_toggleTrafficMonitor()
    {
        this.setState({'m_traffic_monitor': !this.state.m_traffic_monitor});
    }

    render() {
        
        var module_version = [];

        const v_andruavUnit = this.props.p_unit;
        if (v_andruavUnit.m_isDE==false)
        {
            module_version.push(<span key={v_andruavUnit.partyID + 'settings_andruav'} >Andruav</span>);
        }
        else
        {
            module_version.push(<span key={v_andruavUnit.partyID + 'settings_dev'} className=''>DE version: {v_andruavUnit.m_version}</span>);
            const len = v_andruavUnit.m_modules.length;
            if (len==0)
            {
                module_version.push(<span key={v_andruavUnit.partyID + 'settings_nm'}  className='text-warning'>&nbsp;( no modules connected ) </span>);
            }
            else
            {
                for (var i=0; i< len; ++i)
                {
                    const module = v_andruavUnit.m_modules[i];
                    
                    if (module.d == true)
                    {
                        module_version.push(<span key={v_andruavUnit.partyID + 'settings_mod_d'}  >&nbsp;-&nbsp;<span className='text-danger'>{module.i} {module.v}</span> <span className='blink_alert animate_iteration_5s'>OFFLINE</span></span>);
                    }
                    else
                    {
                        module_version.push(<span key={v_andruavUnit.partyID + 'settings_mod'}  >&nbsp;-&nbsp;<span className='text-success'>{module.i} {module.v}</span></span>);
                    }
                }
            }
        }
        
        var cmd_btns = [];
        if (CONST_FEATURE.DISABLE_UDPPROXY_UPDATE !== true)
        if (window.AndruavLibs.AndruavAuth.fn_do_canControl())
        {
            cmd_btns.push(<div key={v_andruavUnit.partyID + 'settings_cb1'}  className='row css_margin_zero padding_zero border-top border-secondary'>
                
                <div key={v_andruavUnit.partyID + 'settings_cb11'} className="col-12 mt-1">
                <div key={v_andruavUnit.partyID + 'settings_cb12'} className = 'row al_l css_margin_zero d-flex '>
                    <div key={v_andruavUnit.partyID + 'settings_cb121'} className= 'col-6 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.partyID + 'settings_cb1211'} className=' rounded-3 text-white bg-danger cursor_hand textunit_nowidth al_c' title ='Change UDP Proxy Port' onClick={() => this.fn_changeTelemetryPort(v_andruavUnit)}>Proxy Port</p>
                    </div>
                </div>
                </div>
            </div>);
        }
        
        var cmd_data = [];
        if (this.state.m_traffic_monitor===true)
        {
            cmd_data.push(<div key={v_andruavUnit.partyID + 'settings_cd1'} className='row css_margin_zero padding_zero border-top border-secondary'>
                            <div key={v_andruavUnit.partyID + 'settings_cd11'}className="col-12 mt-1">
                            <CLSS_RX_MESSAGE p_unit={v_andruavUnit}/>
                            </div>
                        </div>
            );
        }

        const v_date = (new Date(v_andruavUnit.m_NetworkStatus.m_lastActiveTime));
        
        return (
            <div key={v_andruavUnit.partyID + 'settings'}>
            <div key={v_andruavUnit.partyID + 'settings_1'} className='row css_margin_zero padding_zero '>
                <div key={v_andruavUnit.partyID + 'settings_11'} className="col-6 cursor_hand">
                    <p key={v_andruavUnit.partyID + 'settings_111'}className="textunit user-select-all m-0" onClick={(e) => this.fn_toggleTrafficMonitor(e)}><span><small><b>Received {parseFloat(v_andruavUnit.m_NetworkStatus.m_received_bytes/1024).toFixed(2)} KB</b></small></span></p>
                </div>
                
                <div key={v_andruavUnit.partyID + 'settings_12'} className="col-6 cursor_hand">
                    <p className="textunit user-select-all m-0" key={v_andruavUnit.partyID + 'SC_51'} onClick={(e) => this.fn_toggleTrafficMonitor(e)}><span><small><b>Received {v_andruavUnit.m_NetworkStatus.m_received_msg} msgs</b></small></span></p>
                </div>
            </div>
            <div key={v_andruavUnit.partyID + 'settings_2'} className='row css_margin_zero padding_zero '>
                <div key={v_andruavUnit.partyID + 'settings_21'} className="col-12 ">
                    <p key={v_andruavUnit.partyID + 'settings_211'} className="textunit_nowidth user-select-all curd m-0"><span><small><b>{module_version}</b></small></span></p>
                </div>
            </div>
            <div key={v_andruavUnit.partyID + 'settings_3'} className='row css_margin_zero padding_zero '>
                <div key={v_andruavUnit.partyID + 'settings_31'} className="col-12">
                    <p key={v_andruavUnit.partyID + 'settings_311'} className="textunit_nowidth user-select-all m-0"><span><small><b>Last Active <span className='text-warning' ><small><b>{v_date.toUTCString()}</b></small></span> </b></small></span></p>
                </div>
            </div>
            {cmd_btns}
            {cmd_data}
            </div>
            
        )
    }
}