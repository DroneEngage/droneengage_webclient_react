import React    from 'react';



export class ClssSDR_Planning extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            m_update : 0,
        };

        this.key = Math.random().toString();
        this.m_enabled_ctrl = false;
        
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
        this.props.p_shape.m_missionItem.modules.sdr= {};
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
            this.props.p_shape.m_missionItem.modules.sdr = undefined;

            return;
        }
    }

    render ()
    {
        return (
            <div key={this.key + "_ctl_p2pp"} className={this.props.className}>
                <div key={this.key + 'p2pp_0'} className='row css_margin_zero padding_zero '>
                    <div key={this.key + 'p2pp_01'} className="col-6 pt-2">
                        <div key={this.key + 'p2pp_011'} className='row css_margin_zero padding_zero '>
                            <label htmlFor={this.key + "m_enable_ctrl"} className="col-8 al_l " ><small>Enabled</small></label>
                            <input className="form-check-input col-4 " type="checkbox" id={this.key + "m_enable_ctrl"} ref={this.servercomm_Ref} onChange={(e) => this.fn_enableCtrl(e)} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    
}