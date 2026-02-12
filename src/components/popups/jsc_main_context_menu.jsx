import React from 'react';

import { js_globals } from '../../js/js_globals.js'
import { js_localStorage } from '../../js/js_localStorage'
import { js_leafletmap } from '../../js/js_leafletmap'
import * as js_andruavUnit from '../../js/js_andruavUnit'
import { fn_doFlyHere, fn_doSetHome } from '../../js/js_main'

// Registration and Regeneration Control
export class ClssMainContextMenu extends React.Component {
    constructor() {
        super();
        this.state = {

            initialized: false,
        };
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


    listUnits() {
        let v_contextMenu = [];
        let sortedPartyIDs;
        if (js_localStorage.fn_getUnitSortEnabled() === true) {
            // Sort the array alphabetically
            sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSortedBy_APID();
        }
        else {
            sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSorted();
        }
        
        const p_lat = this.props.p_lat;
        const p_lng = this.props.p_lng;

        sortedPartyIDs.map(function (p_andruavUnit) {

            //let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(object);
            if ((p_andruavUnit !== null && p_andruavUnit !== undefined) && (p_andruavUnit.m_IsGCS !== true)) {
                if ((p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_ROVER)
                    || (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_BOAT)) {
                    if ((p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED) 
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO)
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD)) {
                        v_contextMenu.push(
                            <div key={'cmc1' + p_andruavUnit.getPartyID()}  className='row css_txt_center'>
                                <div className='col-12 mt-1 padding_zero'>
                                    <p className='text-bg-primary si-07x margin_zero padding_zero'> {p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT }</p></div>
                                <div className='col-6  p-0'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doFlyHere(p_andruavUnit.getPartyID(), p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt_relative)}>Goto Here</p></div>
                                <div className='col-6  p-0'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doSetHome(p_andruavUnit.getPartyID(), p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt_abs - p_andruavUnit.m_Nav_Info.p_Location.alt_relative)}>Set Home</p></div>
                            </div>);
                    }
                }
                else {
                    if ((p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED) 
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO)
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD)) {
                        v_contextMenu.push(
                            <div key={'cmc1' + p_andruavUnit.getPartyID()} className='row css_txt_center'>
                                <div className='col-12 mt-1 padding_zero'>
                                    <p className='text-bg-primary si-07x margin_zero padding_zero'> {p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT}</p>
                                </div>
                            </div>
                            );

                            v_contextMenu.push(
                                <div key={'cmc2' + p_andruavUnit.getPartyID()} className='row '>                           
                                <div className='col-6 p-0'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doFlyHere(p_andruavUnit.getPartyID(), p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt_relative)}>Goto Here</p></div>
                                <div className='col-6 p-0'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doSetHome(p_andruavUnit.getPartyID(), p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt_abs - p_andruavUnit.m_Nav_Info.p_Location.alt_relative)}>Set Home</p></div>
                            </div>);

                    }
                }
            }
        });

        return v_contextMenu;
    }


    render() {
        const listUnitsElement = this.listUnits();
        let v_lat = this.props.p_lat;
        let v_lng = this.props.p_lng;
        if (v_lat === null || v_lat === undefined)
        {
            v_lat = 0.0;
            v_lng = 0.0;
        }

        return (
            <div className="text-justified one_line col-12">
                <div className="row">
<<<<<<< HEAD
                <p className="text-bg-success mb-1 padding_zero">
                    <span className="margin_zero si-09x" >
=======
                <p className="bg-success text-white mb-1 padding_zero">
                    <span className="text-success margin_zero text-white si-09x" >
>>>>>>> 0c614b3 (f)
                        lat:<span className='si-09x'>{v_lat.toFixed(6)}</span> lng:<span className='si-09x'>{v_lng.toFixed(6)}</span>
                    </span>
                </p>
                </div>
                <div className="row">
                    <div className="col-sm-12">
                        <p
                            className="cursor_hand text-primary margin_zero si-07x al_c"
                            onClick={() =>
                                window.open(
                                    `./mapeditor?zoom=${js_leafletmap.fn_getZoom()}&lat=${v_lat}&lng=${v_lng}`,
                                    '_blank'
                                )
                            }
                        >
                            Open Geo Fence Here
                        </p>
                    </div>
                </div>
                {listUnitsElement}
            </div>
            
        );
    }

}


