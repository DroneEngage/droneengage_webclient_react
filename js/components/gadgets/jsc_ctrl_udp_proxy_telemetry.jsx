export  class CLSS_CTRL_UDP_PROXY_TELEMETRY   extends React.Component {

    constructor(props)
    {
        super(props);
        this.telemetry_level=["OFF","1","2","3"];
        this.state={
            m_message: [],
            'm_update': 0
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
        try
        {
        if (p_me.props.p_unit.partyID != p_andruavUnit.partyID) return ;

        if (p_me.state.m_update == 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
        //p_me.forceUpdate();
        }
        catch (ex)
        {

        }
    }
    
    fn_requestUdpProxyStatus(p_andruavUnit)
    {
        v_andruavClient.API_requestUdpProxyStatus(p_andruavUnit);
    }

    fn_changeTelemetryOptimizationLevel(p_andruavUnit, step)
    {
        if (p_andruavUnit==null) return;
        var next_step = (p_andruavUnit.m_Telemetry.m_telemetry_level + step);
        if (next_step<0) next_step = 0;
        if (next_step>3) next_step = 3;
        v_andruavClient.API_adjustTelemetryDataRate(p_andruavUnit, next_step);
        v_andruavClient.API_requestUdpProxyStatus(p_andruavUnit);
        p_andruavUnit.m_Telemetry.m_telemetry_level = next_step;
    }


    fn_pauseTelemetry(p_andruavUnit)
    {
        if (p_andruavUnit==null) return;
        v_andruavClient.API_pauseTelemetry(p_andruavUnit);
        v_andruavClient.API_requestUdpProxyStatus(p_andruavUnit);
    }

    fn_startTelemetry(p_andruavUnit)
    {
        if (p_andruavUnit==null) return;
        v_andruavClient.API_resumeTelemetry(p_andruavUnit);
        v_andruavClient.API_requestUdpProxyStatus(p_andruavUnit);
    }
    
    renderUdpProxy()
    {

        if (!window.AndruavLibs.AndruavAuth.fn_do_canControl())
        {
            return (
                // no enough permission to vide udp proxy data.
                <div>
                </div>
            );
        }

        var v_udpproxy_text_ip = '';
        var v_udpproxy_text_port = '';
        var v_telemetry_lvl_class = ' text-warning';
        const v_andruavUnit = this.props.p_unit;
        var v_udp_data = [];
        var v_udp_on_off = [];
        
                if (v_andruavUnit.m_Telemetry.m_udpProxy_active === true)
                {
                    v_udpproxy_text_ip = 'ip:' + v_andruavUnit.m_Telemetry.m_udpProxy_ip ;
                    v_udpproxy_text_port = 'port:' + v_andruavUnit.m_Telemetry.m_udpProxy_port;
                    
                    if (v_andruavUnit.m_Telemetry.m_udpProxy_paused === false)
                    {
                        v_telemetry_lvl_class = ' text-warning';
                        v_udp_on_off.push(
                            <span key={v_andruavUnit.partyID + 'pause'} title="Pause Telemetry" onClick={ (e) => this.fn_pauseTelemetry(v_andruavUnit)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-power " viewBox="0 0 16 16">
                                        <path d="M7.5 1v7h1V1h-1z"/>
                                        <path d="M3 8.812a4.999 4.999 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812z"/>
                                        </svg>
                            </span>
                        );
                    }
                    else
                    {
                        v_telemetry_lvl_class = ' text-light';
                        v_udp_on_off.push(
                            <span key={v_andruavUnit.partyID + 'active'} title="Activate Telemetry" onClick={ (e) => this.fn_startTelemetry(v_andruavUnit)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-power text-light" viewBox="0 0 16 16">
                                        <path d="M7.5 1v7h1V1h-1z"/>
                                        <path d="M3 8.812a4.999 4.999 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812z"/>
                                        </svg>
                            </span>
                        );
                    }

                    v_udp_data.push(
                        <div key={v_andruavUnit.partyID + 'txt'} className= {' col-12   padding_zero css_user_select_text ' + v_telemetry_lvl_class}>
                            <p id='udpproxy_t' className={ ' si-07x css_margin_zero user-select-none'}>Smart Telemetry</p>
                            <p id='udpproxy_a' className={ ' si-07x css_margin_zero css_user_select_text'}>{v_udpproxy_text_ip}</p>
                            <p id='udpproxy_p' className={ ' si-07x css_margin_zero css_user_select_text'}>{v_udpproxy_text_port}</p>
                        </div>);
                }
                else
                {
                    v_telemetry_lvl_class = ' text-light';
                    v_udp_data.push(
                        <div key={v_andruavUnit.partyID + 'refresh'} className= 'col-12   padding_zero css_user_select_text'>
                            <div className= 'css_margin_zero user-select-none '>
                                <p id='udp_get' className={' bg-warning cursor_hand rounded-3 textunit text-center  user-select-none text-white '} title ='Click to get UDP Info' onClick={ (e) => this.fn_requestUdpProxyStatus(v_andruavUnit)} > UDP Refresh</p>
                            </div>
                        </div>);
                }
        
        var rows = [];
        rows = (
        <div className= 'row padding_zero css_user_select_text'>
                            <div className = { v_telemetry_lvl_class + ' row al_l css_margin_zero'}>
                                <div className= 'col-12  margin_2px padding_zero css_user_select_text'>
                                <p className=' rounded-3 cursor_hand textunit' title ='Smart Telemetry'>
                                <span title="dec_tel" onClick={ (e) => this.fn_changeTelemetryOptimizationLevel(v_andruavUnit,-1)}>
                                    <svg className="bi bi-caret-down-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                                    </svg>
                                </span>
                                <span id='telemetry_rate'  className='user-select-none' onClick={ (e) => this.fn_requestUdpProxyStatus(v_andruavUnit)}>
                                <small><b>&nbsp;
                                 {'LVL: ' + this.telemetry_level[v_andruavUnit.m_Telemetry.m_telemetry_level]}
                                 &nbsp;</b></small>
                                </span>
                                <span title="inc_tel" onClick={ (e) => this.fn_changeTelemetryOptimizationLevel(v_andruavUnit,+1)}>
                                    <svg className="bi bi-caret-up-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.204 11L8 5.519 12.796 11H3.204zm-.753-.659l4.796-5.48a1 1 0 0 1 1.506 0l4.796 5.48c.566.647.106 1.659-.753 1.659H3.204a1 1 0 0 1-.753-1.659z"/>
                                    </svg>
                                </span>
                                {v_udp_on_off}
                                </p>
                                </div>
                            </div>
                            <div className = 'row al_l css_margin_zero css_user_select_text'>
                                {v_udp_data}
                            </div>
                        </div>);
        
        return rows;
    }

    render ()
    {
        return (this.renderUdpProxy());
    }
}