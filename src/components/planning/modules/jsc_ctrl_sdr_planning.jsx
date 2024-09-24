import React    from 'react';

import {CFieldChecked} from '../../micro_gadgets/jsc_mctrl_field_check.jsx'
import {CTriStateChecked} from '../../micro_gadgets/jsc_mctl_tri_state_check.jsx'

export class ClssSDR_Planning extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            m_update : 0,
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
        this.enable_Ref.current.checked = enabled;
        this.m_enabled_ctrl = enabled;
        if (enabled === true) {
            
            
        }
        else
        {

        }
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

    render ()
    {
        return (
            <div key={"_ctl_sdrp_" + this.key} className={this.props.className}>
                <div key={'sdrp_0' + this.key} className='row css_margin_zero padding_zero '>
                    <div key={'sdrp_01' + this.key} className="col-6 pt-2">
                        <div key={'sdrp_011' + this.key} className='row css_margin_zero padding_zero '>
                            <label htmlFor={"m_enable_ctrl" + this.key} className="col-8 al_l " ><small>Enabled</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={"m_enable_ctrl" + this.key} ref={this.enable_Ref} onChange={(e) => this.fn_enableCtrl(e)} />
                        </div>
                    </div>
                </div>
                <div key={'sdrp_1' + this.key} className='row css_margin_zero padding_zero '>
                        <CFieldChecked  key={'f4' + this.key} required={this.props.p_shape.m_missionItem.eventFireRequired === true} txtLabel='fire event' itemid={'fv' + this.key} txtValue={0}  ref={instance => {this.eventFire = instance}} />
                </div>
                <div key={'sdrp_2' + this.key} className='row css_margin_zero padding_zero '>
                        <CTriStateChecked  key={'f4' + this.key}  txtLabel='fire event'  txtValue={0}  disabled={false} checked={true} ref={instance => {this.eventFire = instance}} />
                </div>

            </div>
        );
    }

    
}