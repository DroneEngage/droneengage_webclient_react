import React    from 'react';



export class ClssSDR_Planning extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            m_update : 0,
        };

        this.key = Math.random().toString();
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
        this.props.p_shape.m_missionItem.modules.sdr= {};
    }

    componentWillUnmount() 
    {
        
    }

    fn_editShape()
    {

    }

    render ()
    {
        return (
            <div className={this.props.className } >SDR CONTROL</div>
        );
    }

    
}