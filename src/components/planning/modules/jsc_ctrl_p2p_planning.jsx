import React from 'react';


import {CCommandAPI} from '../../../js/js_commands_api.js'

export class ClssP2P_Planning extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            m_update : 0,
            m_action: 0,
            m_enable_p2p: false,
            m_enable_telemetry: false,
            m_enable_servercomm: false
        };

        this.key = Math.random().toString();
        
        this.p2p_Ref = React.createRef();
        this.telemetry_Ref = React.createRef();
        this.servercomm_Ref = React.createRef();
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
        if (this.props.p_shape.m_missionItem.modules.p2p === undefined)
        {
            this.props.p_shape.m_missionItem.modules.p2p = 
            {
                    tel: this.state.m_enable_telemetry,
                    p2p: this.state.m_enable_p2p,
                    srv: this.state.m_enable_servercomm,
            };
        }
        else
        {
            const p2p = this.props.p_shape.m_missionItem.modules.p2p;
            
            this.state.m_enable_telemetry = p2p.tel;
            this.state.m_enable_p2p = p2p.p2p;
            this.state.m_enable_servercomm = p2p.srv;


            this.telemetry_Ref.current.checked = p2p.tel;
            this.p2p_Ref.current.checked = p2p.p2p;
            this.servercomm_Ref.current.checked = p2p.srv;
        }
        

    }


    // componentDidUpdate () 
    // {
    //     this.state.m_update = 1;
    //     if (this.props.p_shape.m_missionItem.modules.p2p === undefined)
    //     {
    //         this.props.p_shape.m_missionItem.modules.p2p = 
    //         {
    //                 tel: this.state.m_enable_telemetry,
    //                 p2p: this.state.m_enable_p2p,
    //                 srv: this.state.m_enable_servercomm,
    //         };
    //     }
    //     else
    //     {
    //         const p2p = this.props.p_shape.m_missionItem.modules.p2p;
            
    //         this.state.m_enable_telemetry = p2p.tel;
    //         this.state.m_enable_p2p = p2p.p2p;
    //         this.state.m_enable_servercomm = p2p.srv;


    //         this.setState({m_update: this.state.m_update + 1});
    //     }
        

    // }

    componentWillUnmount() 
    {

    }

    fn_editShape()
    {
        const cmd = CCommandAPI.API_SetCommunicationChannel(null,this.state.m_enable_servercomm, this.state.m_enable_p2p, null, null );
        this.props.p_shape.m_missionItem.modules.p2p =
        {
            tel: this.state.m_enable_telemetry,
            p2p: this.state.m_enable_p2p,
            srv: this.state.m_enable_servercomm,
        };
    }

    fn_enableTelemetry(e)
    {
        this.state.m_enable_telemetry = e.currentTarget.checked;
    }

    fn_enableP2P(e)
    {
        this.state.m_enable_p2p = e.currentTarget.checked;
    }
    
    fn_enableServerComm(e)
    {
        this.state.m_enable_servercomm =  e.currentTarget.checked;
    }

    render ()
    {
        return (
            <div key={this.key + "_ctl_p2pp"} className={this.props.className}>
                <div key={this.key  + 'p2pp_1'} className='row css_margin_zero padding_zero '>
                    <div key={this.key  + 'p2pp_11'} className="col-6 pt-2">
                        <div key={this.key  + 'p2pp_111'} className='row css_margin_zero padding_zero '>
                            <label htmlFor="m_enable_servercomm" className="col-8 al_l " ><small>Server Comm</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_servercomm"} ref={this.servercomm_Ref} onClick={ (e) => this.fn_enableServerComm(e)} />
                        </div>
                        <div key={this.key  + 'p2pp_113'} className='row css_margin_zero padding_zero '>
                            <label htmlFor="m_enable_telemetry" className="col-8 al_l " ><small>Enable Telemetry</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_telemetry"} ref={this.telemetry_Ref} onClick={ (e) => this.fn_enableTelemetry(e)} />
                        </div>
                    </div>
                    <div key={this.key  + 'p2pp_21'} className="col-6 ">
                        
                        <div key={this.key  + 'p2pp_212'} className='row css_margin_zero padding_zero '>
                            <label htmlFor="m_enable_p2p" className="col-8 al_l " ><small>Enable P2P</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_p2p"} ref={this.p2p_Ref} onClick={ (e) => this.fn_enableP2P(e)} />
                        </div>
                        {/* <div key={v_andruavUnit.partyID + 'p2p_213'} className='row css_margin_zero padding_zero '>
                            <label className="col-5"><small><b>Sample Rate</b></small></label>
                            <input type="text" className="col-5" placeholder="Sample Rate" aria-label="Sample Rate"  value={this.state.m_sample_rate} onChange={(e)=> this.fn_onSampleRate(e)}/>
                        
                        </div>
                        <div key={v_andruavUnit.partyID + 'p2p_215'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={v_andruavUnit.partyID + 'p2p_dm_bar'} className="col-5"><small><b>Bars</b></small></label>
                            <input type="text" id={v_andruavUnit.partyID + 'p2p_dm_bar'} className="col-5" placeholder="Bars" aria-label="Bars"  value={this.state.m_display_bars} onChange={(e)=> this.fn_onDisplayBars(e)}/>
                        </div>
                        <div key={v_andruavUnit.partyID + 'p2p_214'} className='row css_margin_zero padding_zero '>
                            <label className="col-5"><small><b>Band Width</b></small></label>
                            <p  className="col-5" placeholder="Bandwidth" aria-label="Bandwidth">{this.state.m_band_width}</p>
                        </div> */}
                        
                    </div>
                </div>
                {/* <div key={v_andruavUnit.partyID + 'p2p_3'} className='row css_margin_zero padding_zero '>
                        <div key={v_andruavUnit.partyID + 'p2p_31'} className="col-12">
                            <p key={v_andruavUnit.partyID + 'p2p_311'} className="textunit user-select-all m-0"><span><small><b>Last Active <span className='text-warning' ><small><b>{v_date.toUTCString()}</b></small></span> </b></small></span></p>
                        </div>
                </div>
                    {cmd_btns} */}
            </div>
        );
    }
}