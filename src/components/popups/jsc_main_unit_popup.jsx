import React from 'react';

import {hlp_getFlightMode, fn_gotoUnit_byPartyID} from '../../js/js_main.js'


// Registration and Regeneration Control
export class ClssMainUnitPopup extends React.Component {
    constructor() {
        super();
        this.state = {

            initialized: false,
        };

        this.key = Math.random().toString();
        
    }




    componentWillUnmount() {

    }

    componentDidMount() {

        if (this.state.initialized === true) {
            return;
        }

        this.state.initialized = true;

        if (this.props.OnComplete !== null && this.props.OnComplete !== undefined)
        {
            this.props.OnComplete();
        }
    }

    generatePopup() {
        let markerContent = [];
        let keyCounter = 0; // Counter to generate unique keys
    
        // is armed
        let armedBadge;
		if (this.props.p_unit.m_isArmed) armedBadge = <span className="text-danger">&nbsp;<strong>ARMED</strong>&nbsp;</span>;
		else armedBadge = <span key={this.key + 'ar1'} className="text-success">&nbsp;disarmed&nbsp;</span>;
		

        // is flying
        let flying;
        if (this.props.p_unit.m_isFlying) flying = <span className="text-danger">&nbsp;flying&nbsp;</span>;
		else flying = <span key={this.key + 'ar2'} className="text-success">&nbsp;on-ground&nbsp;</span>;


        
        // append is armed - flying
        markerContent.push (<p key={this.key + 'pop111'}  className='m-0 p-0'>{armedBadge} - {flying}</p>);
        
        // append flying mode
        if (this.props.p_unit.m_IsGCS === false) {
            markerContent.push(
                <p key={`${this.key}-flightmode-${keyCounter++}`} className='m-0 text-success'>
                    <strong>{hlp_getFlightMode(this.props.p_unit)}</strong>
                </p>
            );
        } else {
            markerContent.push(
                <p key={`${this.key}-gcs-${keyCounter++}`} className='m-0'>
                    <span className='text-success'>Ground Control Station</span>
                </p>
            );
        }
    
        // Append altitude
        const vAlt = this.props.p_unit.m_Nav_Info.p_Location.alt_relative;
        const vAlt_abs = this.props.p_unit.m_Nav_Info.p_Location.alt_abs;
        markerContent.push(
            <p key={`${this.key}-altitude-${keyCounter++}`} className='m-0 p-0'>
                {vAlt !== null && vAlt !== undefined ? (
                    <span className="text-primary">{vAlt.toFixed(0)}<span className="text-primary"> m</span></span>
                ) : (
                    <span className="text-secondary">?</span>
                )}
                {vAlt_abs !== null && vAlt_abs !== undefined && (
                    <span><span className="text-primary">abs:</span> {vAlt_abs.toFixed(0)}</span>
                )}
            </p>
        );
    
        // Append ground speed and air speed
        const vSpeed = this.props.p_unit.m_Nav_Info.p_Location.ground_speed;
        const vAirSpeed = this.props.p_unit.m_Nav_Info.p_Location.air_speed;
        markerContent.push(
            <p key={`${this.key}-speed-${keyCounter++}`} className='m-0 p-0'>
                <span className="text-primary">GS:</span>
                <span className="text-success">
                    {vSpeed !== null && vSpeed !== undefined ? vSpeed.toFixed(1) : '?'}
                </span>
                <span className="text-primary"> m/s</span>
            </p>
        );
        markerContent.push(
            <p key={`${this.key}-airspeed-${keyCounter++}`} className='m-0 p-0'>
                <span className="text-primary">AS:</span>
                <span className="text-success">
                    {vAirSpeed !== null && vAirSpeed !== undefined ? vAirSpeed.toFixed(1) : '?'}
                </span>
                <span className="text-primary"> m/s</span>
            </p>
        );
    
        // Append latitude and longitude
        markerContent.push(
            <p key={`${this.key}-location-${keyCounter++}`} className='m-0 p-0'>
                <span className="text-primary">lat:</span>
                <span className="text-success">{(this.props.p_lat).toFixed(6)}</span>
                <span className="text-primary">, lng:</span>
                <span className="text-success">{(this.props.p_lng).toFixed(6)}</span>
            </p>
        );
    
        return markerContent;
    }
    
    render()
    {
        return (
            <div key={this.key + 'popmu'} >
            {this.generatePopup()}
            </div>
        );
    }


}