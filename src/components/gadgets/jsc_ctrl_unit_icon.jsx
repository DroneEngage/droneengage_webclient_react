import React    from 'react';

import {fn_gotoUnit_byPartyID, 
    getVehicleIcon, 
    fn_putWayPoints, 
    toggleVideo, toggleRecrodingVideo} from '../../js/js_main.js'


export class ClssCTRL_Unit_Icon extends React.Component {

    constructor(props)
	{
		super (props);
		
        this.state = {
        };

    }


    render()
    {   
        const v_andruavUnit = this.props.m_unit;
        const is_GCS = false;
        const id = v_andruavUnit.partyID + "__u_i";
        const module_version = v_andruavUnit.module_version();
        
        if (is_GCS === false)
        {
            return (
                <img key={id +"u_ico"} className=' cursor_hand gcs IsGCS_false small_icon' src={getVehicleIcon(v_andruavUnit)}  title={module_version}  alt='Vehicle' onClick={ (e) => fn_gotoUnit_byPartyID(v_andruavUnit)}/>
            );
        }
        else
        {
            return (
                <img className='gcs IsGCS_true cursor_hand' src={getVehicleIcon(v_andruavUnit)} alt='GCS' onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)} />
            );
        }
    
    }

    
};