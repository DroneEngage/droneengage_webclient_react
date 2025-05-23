import React    from 'react';


import {ClssAndruavUnitBase} from './jsc_unit_control_base.jsx'
import {ClssCtrlUnitIcon} from '../gadgets/jsc_ctrl_unit_icon.jsx'

export class ClssAndruavUnitGCS extends ClssAndruavUnitBase {
    constructor(props)
	{
		super (props);
    }

    render ()
    {
        let v_andruavUnit = this.props.p_unit; 
        let v_hidden = "";
        if (this.props.v_en_GCS === false)
        {
            v_hidden = 'hidden';
        } 
        if (v_andruavUnit === null || v_andruavUnit === undefined) return ;
        
        return (
         <div id={v_andruavUnit.partyID + "__FAKE"}  className={v_hidden + " row mb-1 mt-0 me-0 ms-0 pt-1 IsGCS_" + v_andruavUnit.m_IsGCS + " IsShutdown_" + (v_andruavUnit.m_IsShutdown  || v_andruavUnit.m_IsDisconnectedFromGCS)}>
            <div className='col-11 css_margin_zero padding_zero'>
                {/* <div className='col-1' ><img className='gcs IsGCS_true cursor_hand' src={getVehicleIcon(v_andruavUnit)} alt='GCS' onClick={ (e) => this.fn_gotoUnit_byPartyID(e,v_andruavUnit)} /> </div> */}
                <div className='col-1' ><ClssCtrlUnitIcon p_unit={v_andruavUnit}/></div>
                <div className='col-11'><p id='id' className='text-right text-warning cursor_hand'> GCS [<strong>{v_andruavUnit.m_unitName}</strong>]</p></div>
            </div>
        </div>
        );
    }
}