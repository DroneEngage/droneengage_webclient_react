import React from 'react';

import { js_globals } from '../../js/js_globals.js'
import { js_localStorage } from '../../js/js_localStorage'
import { js_leafletmap } from '../../js/js_leafletmap'
import * as js_andruavUnit from '../../js/js_andruavUnit'
import { fn_doFlyHere, fn_doCircle2, fn_doSetHome, fn_convertToMeter } from '../../js/js_main'

// Registration and Regeneration Control
export class Clss_MainContextMenu extends React.Component {
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

    }


    listUnits() {
        var v_contextMenu = [];
        var sortedPartyIDs;
        if (js_localStorage.fn_getUnitSortEnabled() === true) {
            // Sort the array alphabetically
            sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSortedBy_APID();
        }
        else {
            sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSorted();
        }
        var p_lat = this.props.p_lat;
        var p_lng = this.props.p_lng;

        sortedPartyIDs.map(function (object) {

            let p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(object[0]);
            if ((p_andruavUnit !== null && p_andruavUnit !== undefined) && (p_andruavUnit.m_IsGCS !== true)) {
                if ((p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_ROVER)
                    || (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_BOAT)) {
                    if ((p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED) 
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO)
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD)) {
                        v_contextMenu.push(
                            <div key={'cmc1' + p_andruavUnit.partyID}  className='row'>";
                                <div className='col-sm-12'><p className='bg-primary text-white  si-07x'>" + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT + "</p></div>";
                                <div className='col-6'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doFlyHere(p_andruavUnit.partyID, p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt)}>Goto Here</p></div>
                                <div className='col-6'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doSetHome(p_andruavUnit.partyID, p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt_abs)}>Set Home</p></div>
                            </div>);
                    }
                }
                else {
                    if ((p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED) 
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO)
                        || (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD)) {
                        v_contextMenu.push(
                            <div key={'cmc1' + p_andruavUnit.partyID} className='row css_txt_center'>
                                <div className='col-12 mt-1 padding_zero'>
                                    <p className='bg-primary text-white si-07x margin_zero padding_zero'> {p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT}</p>
                                </div>
                                <div className='col-4 padding_zero'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doCircle2(p_andruavUnit.partyID, p_lat, p_lng, fn_convertToMeter(js_globals.CONST_DEFAULT_ALTITUDE), fn_convertToMeter(js_globals.CONST_DEFAULT_RADIUS), 10)}>Circle</p></div>
                                <div className='col-4 padding_zero'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doFlyHere(p_andruavUnit.partyID, p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt)}>Goto Here</p></div>
                                <div className='col-4 padding_zero'><p className='cursor_hand margin_zero text-primary si-07x' onClick={() =>fn_doSetHome(p_andruavUnit.partyID, p_lat, p_lng, p_andruavUnit.m_Nav_Info.p_Location.alt_abs)}>Set Home</p></div>
                            </div>);
                    }
                }
            }
        });

        return v_contextMenu;
    }


    render() {
        const listUnitsElement = this.listUnits();
        return (
            <div className="text-justified one_line row">
                <p className="bg-success text-white mb-1 padding_zero">
                    <span className="text-success margin_zero text-white si-09x" >
                        lat:<span className='si-09x'>{this.props.p_lat.toFixed(6)}</span> lng:<span className='si-09x'>{this.props.p_lng.toFixed(6)}</span>
                    </span>
                </p>
                <div className="row">
                    <div className="col-sm-12">
                        <p
                            className="cursor_hand text-primary margin_zero si-07x"
                            onClick={() =>
                                window.open(
                                    `./mapeditor.html?zoom=${js_leafletmap.fn_getZoom()}&lat=${this.props.p_lat}&lng=${this.props.p_lng}`,
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


