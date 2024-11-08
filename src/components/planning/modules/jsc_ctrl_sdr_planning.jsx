import React    from 'react';

import {CFieldChecked} from '../../micro_gadgets/jsc_mctrl_field_check.jsx'
import {CTriStateChecked} from '../../micro_gadgets/jsc_mctrl_tri_state_check.jsx'

export class ClssSDR_Planning extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            m_update : 0,
            m_cmd_packet: {},
        };

        this.key = Math.random().toString();
        this.m_enabled_ctrl = false;
        this.enable_Ref = React.createRef();
       
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
        
        if (this.props.p_shape.m_missionItem.modules.sdr === undefined) {
            // init data
            this.fn_process_enable (false);

            this.props.p_shape.m_missionItem.modules.sdr= {};
        }
        else
        {
            this.fn_process_enable (true);
        }

        this.setState({m_update: this.state.m_update +1});

    }

    fn_process_enable (enabled)
    {
        
    }

    componentWillUnmount() 
    {
        
    }

    fn_enableCtrl(e) {
        if (e.currentTarget.checked === true) {
            this.m_enabled_ctrl = true;
            
        }
        else {
            this.m_enabled_ctrl = false;
            
        }
    }

    fn_editShape()
    {
        if (this.m_enabled_ctrl !== true) {
            this.props.p_shape.m_missionItem.modules.sdr =
            {
                cmds: {}
            };

            return;
        }
    }


    fn_enableSDR (is_enabled, is_checked)
    {
        
    }

    render ()
    {
        return (
            <div key={"_ctl_sdrp_" + this.key} className={this.props.className}>
                <div key={'sdrp_0' + this.key} className='row css_margin_zero padding_zero '>
                    <div key={'sdrp_01' + this.key} className="col-6 pt-2">
                        <CTriStateChecked  txtLabel='Enable SDR' />
                    </div>
                    <div key={'sdrp_02' + this.key} className="col-6 pt-2">
                        <CFieldChecked  txtLabel='fire event' />
                    </div>
                </div>

                <div key={'sdrp_2' + this.key} className='row css_margin_zero padding_zero '>
                        Scan Frequencies
                </div>

                <div key={'sdrp_3' + this.key} className='row css_margin_zero padding_zero '>
                    <div key={'sdrp_31' + this.key} className="col-6 pt-2">
                        <CFieldChecked txtLabel='From'/>
                    </div>
                    <div key={'sdrp_32' + this.key} className="col-6 pt-2">
                        <CFieldChecked txtLabel='From'/>
                    </div>
                </div>
            </div>
        );
    }

    
}