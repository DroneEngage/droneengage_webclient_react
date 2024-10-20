import React from 'react';

import { js_globals } from '../../js/js_globals.js'
import { js_localStorage } from '../../js/js_localStorage'
import { js_leafletmap } from '../../js/js_leafletmap'
import * as js_andruavUnit from '../../js/js_andruavUnit'
import { fn_doFlyHere, fn_doCircle2, fn_doSetHome, fn_convertToMeter } from '../../js/js_main'
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

    generatePopup()
    {
        let markerContent = [];

        let sysid;
		if (this.props.p_unit.m_FCBParameters.m_systemID !== 0)
		{
		    sysid = (<span key={this.key + 'sys1'}>{'sysid:' + this.props.p_unit.m_FCBParameters.m_systemID}</span>);
		}

        // create header
        markerContent.push(
            <p key={this.key+'pop1'} className='img-rounded bg-primary text-white '>
                <strong className='css_padding_5'>{this.props.p_unit.m_unitName } </strong> 
                {sysid}
                <style className='img-rounded help-block'>{this.props.p_unit.Description }"</style></p>);
    
        // is armed
        let armedBadge;
		if (this.props.p_unit.m_isArmed) armedBadge = <span className="text-danger">&nbsp;<strong>ARMED</strong>&nbsp;</span>;
		else armedBadge = <span key={this.key + 'ar1'} className="text-success">&nbsp;disarmed&nbsp;</span>;
		

        // is flying
        let flying;
        if (this.props.p_unit.m_isFlying) flying = <span className="text-danger">&nbsp;flying&nbsp;</span>;
		else flying = <span key={this.key + 'ar2'} className="text-success">&nbsp;on-ground&nbsp;</span>;


        
        // append is armed - flying
        markerContent.push (<p className='m-0 p-0'>{armedBadge} - {flying}</p>);
        
        // append flying mode
        if (this.props.p_unit.m_IsGCS === false) {
            markerContent.push (<p key={this.key + 'pop211'} className='m-0 text-success'><strong> {hlp_getFlightMode(this.props.p_unit)} </strong></p>);
        }
        else {
            markerContent.push(<p key={this.key + 'pop211'} className='m-0' key={this.key + 'pop2'}> <span className='text-success'>Ground Control Station</span> </p>);
        }
        
        
        let vAlt = this.props.p_unit.m_Nav_Info.p_Location.alt;
		let vAlt_abs = this.props.p_unit.m_Nav_Info.p_Location.alt_abs;
			if (vAlt === null || vAlt  === undefined)
			{
				vAlt=<span key={this.key + 'pop311'} className="text-secondary">?</span>
			}
			else
			{
				vAlt = <span key={this.key + 'pop312'} className="text-primary">{vAlt.toFixed(0)}<span className="text-primary"> m</span></span>;
			}
			if (vAlt_abs === null || vAlt_abs  === undefined)
			{
				vAlt_abs='';
			}
			else
			{
				vAlt_abs = <span><span className="text-primary">abs:</span> {vAlt_abs.toFixed(0)}</span>;
			}
            markerContent.push(<p key={this.key + 'pop3'} className='m-0 p-0' >{vAlt} {vAlt_abs}</p>);
			
            
            let vSpeed = this.props.p_unit.m_Nav_Info.p_Location.ground_speed;
			if (vSpeed === null || vSpeed === undefined)
			{
				vSpeed=<span key={this.key + 'pop411'} className="text-secondary">?</span>;
			}
			else
			{
				vSpeed = <span key={this.key + 'pop412'} className="text-primary">{vSpeed.toFixed(1)}<span className="text-primary"> m</span></span>;
			}
			let vAirSpeed = this.props.p_unit.m_Nav_Info.p_Location.air_speed;
			if (vAirSpeed === null || vAirSpeed === undefined)
			{
				vAirSpeed=<span key={this.key + 'pop511'}  className="text-secondary">?</span>;
			}
			else
			{
				vAirSpeed = <span key={this.key + 'pop512'}  className="text-primary">{vAirSpeed.toFixed(1)}</span>;
			}
        
            markerContent.push(<p key={this.key + 'pop4'} className='m-0 p-0'><span className="text-primary ">GS:</span><span className="text-success">{vSpeed} </span><span className="text-primary"> m/s</span></p>);
            markerContent.push(<p key={this.key + 'pop5'} className='m-0 p-0'><span className="text-primary"> AS:</span><span className="text-success">{vAirSpeed} </span><span className="text-primary"> m/s</span></p>);
            
            markerContent.push(
                <p key={this.key + 'pop6'} className='m-0 p-0'>
                    <span key={this.key + 'pop61'} className="text-primary">lat:<span className="text-success">{(this.props.p_lat).toFixed(6)}</span>
                    <span key={this.key + 'pop62'} className="text-primary">,lng:</span>
                    <span key={this.key + 'pop63'}className="text-success">{(this.props.p_lng).toFixed(6)}</span></span></p>);
                
                

        // let p_elevation = null;

        // if (this.props.p_elevation !== null && this.props.p_elevation !== undefined) {
        //     if (js_localStorage.fn_getMetricSystem() === false) {
        //         p_elevation = js_helpers.CONST_METER_TO_FEET * p_elevation;
        //     }

        //     if (isNaN(p_elevation)===false)
        //     {
        //         p_elevation = p_elevation.toFixed(1);
        //     }
        // }

        
        // if (this.props.p_unit.m_isArmed) armedBadge = '<span className="text-danger">&nbsp;<strong>ARMED</strong>&nbsp;</span>';
        
        return (
            markerContent
        )
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