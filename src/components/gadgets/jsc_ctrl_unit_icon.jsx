import React    from 'react';

import {fn_gotoUnit, 
    getVehicleIcon, 
    } from '../../js/js_main.js'


export class ClssCtrlUnitIcon extends React.Component {

    constructor(props)
	{
		super (props);
		
        this.state = {
        };
        
        this.key = Math.random().toString();
        
    }


    render()
    {   
        const v_andruavUnit = this.props.p_unit;
        if (v_andruavUnit === null || v_andruavUnit === undefined)
        {
            return (<img className={this.props.className + ' gcs IsGCS_true css_cur_default small_icon'} src={getVehicleIcon(null)} alt='GCS'  />);
        }

        const is_GCS = false;
        const id = v_andruavUnit.partyID + "__u_i";
        const module_version = v_andruavUnit.module_version();
        
        if (is_GCS === false)
        {
            return (
                <img key={this.key + id +"u_ico1"} className={this.props.className + ' cursor_hand gcs IsGCS_false small_icon'} src={getVehicleIcon(v_andruavUnit)}  title={module_version}  alt='Vehicle' onClick={ (e) => fn_gotoUnit(v_andruavUnit)}/>
            );
        }
        else
        {
            return (
                <img key={this.key + id +"u_ico2"}  className={this.props.className + ' gcs IsGCS_true cursor_hand small_icon'} src={getVehicleIcon(v_andruavUnit)} alt='GCS' onClick={ (e) => fn_gotoUnit(v_andruavUnit)} />
            );
        }
    
    }

    
};