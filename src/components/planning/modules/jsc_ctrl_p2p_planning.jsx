import React from 'react';



export class ClssP2P_Planning extends React.Component {

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
    }

    componentWillUnmount() 
    {

    }


    render ()
    {
        return (
            <div>Planning CONTROL</div>
        );
    }
}