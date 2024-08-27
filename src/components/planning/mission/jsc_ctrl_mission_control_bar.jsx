import React    from 'react';

import * as js_helpers from '../../../js/js_helpers.js'
import {js_globals} from '../../../js/js_globals.js';

import {
    fn_requestWayPoints,
    fn_clearWayPoints, 
    fn_do_modal_confirmation,
    } from '../../../js/js_main.js'






export class ClssMission_Control_Bar extends React.Component {
    constructor(props)
	{
		super (props);
        this.state = {
            m_update: 0,
        };

        this.key = Math.random().toString();
        
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
    }


    fn_exportMission ()
    {
        const c_mission_text = this.props.p_mission.fn_exportToV110 ();
        js_helpers.fn_saveAs (c_mission_text,"Mission" + Date.now() + ".txt","text/plain;charset=utf-8");
    }

    fn_putWayPoints(p_partyID, p_eraseFirst)
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
        if (v_andruavUnit===null) return ;

        const c_mission_text = this.props.p_mission.fn_exportToV110 ();
        
        fn_do_modal_confirmation("Upload Mission for " + v_andruavUnit.m_unitName,
            "Are you sure you want to upload mission?", function (p_approved) {
                if (p_approved === false) return;
                // fn_putWayPoints in js_main
                js_globals.v_andruavClient.API_uploadWayPoints(v_andruavUnit, p_eraseFirst, c_mission_text);

            }, "YES", "bg-danger text-white");
        
    }


    fn_requestWayPoints(p_partyID, p_fromFCB)
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
        if (v_andruavUnit===null) return ;
        fn_requestWayPoints(v_andruavUnit, p_fromFCB);
    }

    fn_clearWayPoints(p_partyID, p_fromFCB)
    {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
        if (v_andruavUnit===null) return ;
        fn_clearWayPoints(v_andruavUnit, p_fromFCB);
    }

    render ()
    {
        const c_key = this.key;

        return (
            <div id="geofence" key={'m_c_b' + c_key} className="btn-group  css_margin_top_small" >
                <button  id='pre_geo_btn_generate' key={'mp1b1' + c_key} className='btn btn-primary btn-sm ctrlbtn'   title ="Export Mission as File" type="button "  onClick={ (e) => this.fn_exportMission(e) } >Export</button>
                <button  id='geo_btn_georeset'  key={'mp1b2' + c_key} className="btn btn-warning btn-sm ctrlbtn" title ="Reset Mission on Map" type="button" onClick={ (e) => this.fn_deleteMission(e) } >Reset</button>
                <button  id='geo_btn_geoupload'  key={'mp1b3' + c_key} className="btn btn-danger btn-sm ctrlbtn" title ="Save Mission on Unit" type="button" onClick={ (e) => this.fn_putWayPoints(this.props.m_selected_unit,true)}  >Upload</button>
                <button  id='geo_btn_georead'  key={'mp1b4' + c_key} className="btn btn-warning btn-sm ctrlbtn" title ="Read Mission from Unit" type="button" onClick={ (e) => this.fn_requestWayPoints(this.props.m_selected_unit,true)} >Read</button>
                <button  id='geo_btn_geoclear'  key={'mp1b5' + c_key} className="btn btn-danger btn-sm ctrlbtn" title ="Delete Mission from Unit" type="button" onClick={ (e) => this.fn_clearWayPoints(this.props.m_selected_unit, true) } >Clear</button>
            </div>
        );
    }
}