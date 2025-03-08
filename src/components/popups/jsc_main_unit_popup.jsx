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
        const c_unit = this.props.p_unit;
        const markerContent = [];
        let keyCounter = 0;
    
        const armedBadge = c_unit.m_isArmed ? (
            <span className="text-danger">&nbsp;<strong>ARMED</strong>&nbsp;</span>
        ) : (
            <span key={this.key + 'ar1'} className="text-success">&nbsp;disarmed&nbsp;</span>
        );
    
        const flying = c_unit.m_isFlying ? (
            <span className="text-danger">&nbsp;flying&nbsp;</span>
        ) : (
            <span key={this.key + 'ar2'} className="text-success">&nbsp;on-ground&nbsp;</span>
        );
    
        markerContent.push(
            <p key={this.key + 'pop110'} className="m-0 p-0 text-white bg-primary text-center">
                <strong>{c_unit.m_unitName}</strong>
            </p>
        );
        markerContent.push(
            <p key={this.key + 'pop111'} className="m-0 p-0 width_fit_max">
                {armedBadge} - {flying}
            </p>
        );
    
        markerContent.push(
            <p key={`${this.key}-${c_unit.m_IsGCS ? 'gcs' : 'flightmode'}-${keyCounter++}`} className="m-0">
                {c_unit.m_IsGCS ? (
                    <span className="text-success">Ground Control Station</span>
                ) : (
                    <strong className="text-success">{hlp_getFlightMode(c_unit)}</strong>
                )}
            </p>
        );
    
        const { alt_relative: vAlt, alt_abs: vAlt_abs, ground_speed: vSpeed, air_speed: vAirSpeed } = c_unit.m_Nav_Info.p_Location;
    
        markerContent.push(
            <p key={`${this.key}-altitude-${keyCounter++}`} className="m-0 p-0">
                {vAlt !== null && vAlt !== undefined ? (
                    <span className="text-primary">
                        {vAlt.toFixed(0)}<span className="text-primary"> m </span>
                    </span>
                ) : (
                    <span className="text-secondary">?</span>
                )}
                {vAlt_abs !== null && vAlt_abs !== undefined && (
                    <span>
                        <span className="text-primary">abs:</span> {vAlt_abs.toFixed(0)}
                    </span>
                )}
            </p>
        );
    
        const speedDisplay = (label, speed) => (
            <p key={`${this.key}-${label}-${keyCounter++}`} className="m-0 p-0">
                <span className="text-primary">{label}:</span>
                <span className="text-success">{speed !== null && speed !== undefined ? speed.toFixed(1) : '?'}</span>
                <span className="text-primary"> m/s</span>
            </p>
        );
    
        markerContent.push(speedDisplay("GS", vSpeed));
        markerContent.push(speedDisplay("AS", vAirSpeed));
    
        markerContent.push(
            <p key={`${this.key}-location-${keyCounter++}`} className="m-0 p-0 ">
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
            <div key={this.key + 'popmu'} className='width_fit_max' >
            {this.generatePopup()}
            </div>
        );
    }


}