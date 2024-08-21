import $ from 'jquery'; 
import React    from 'react';


import * as js_common from '../js/js_common.js'
import {js_globals} from '../js/js_globals.js';
import {js_eventEmitter} from '../js/js_eventEmitter.js'



import * as js_andruavMessages from '../js/js_andruavMessages.js'
import {js_localStorage} from '../js/js_localStorage.js'
import {js_leafletmap} from '../js/js_leafletmap.js'






import {ClssAndruavUnit_GCS} from './jsc_unit_control_gcs.jsx'
import {ClssAndruavUnit_Drone} from './jsc_unit_control_drone.jsx'





export default class ClssAndruavUnitList extends React.Component {
  
    constructor()
	{
		super ();
		this.state = {
			andruavUnitPartyIDs : [],
            rnd:Math.random(),
		    'm_update': 0
		};

        this._isMounted = false;

        js_eventEmitter.fn_subscribe (js_globals.EE_requestGamePadonPreferenceChanged, this, this.fn_onPreferenceChanged);
        js_eventEmitter.fn_subscribe (js_globals.EE_requestGamePadonSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitAdded,this,this.fn_unitAdded);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitUpdated,this,this.fn_unitUpdated);
        
    }
      
    fn_unitUpdated(me,p_andruavUnit)
    {
        if (me._isMounted !== true) return ;
        
        // render is initiated via updating state
        me.setState({ 'm_update': me.state.m_update+1});
        //me.forceUpdate();
    }

    fn_unitAdded (me,p_andruavUnit)
    {
        if (me._isMounted !== true) return ;
    
        js_common.fn_console_log ("REACT:fn_unitAdded" );

         if (me.state.andruavUnitPartyIDs.includes(p_andruavUnit.partyID)) return ;
         // http://stackoverflow.com/questions/26253351/correct-modification-of-state-arrays-in-reactjs      
         me.setState({ 
            andruavUnitPartyIDs: me.state.andruavUnitPartyIDs.concat([p_andruavUnit.partyID])
        });
    }

    fn_onSocketStatus (me,params) {
       
        if (me._isMounted !== true) return ;
    
        if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {				
                $('#andruavUnits').show();
        }
        else
        {				
                me.state.andruavUnitPartyIDs = [];
                me.setState({'m_update': me.state.m_update +1});
                //me.forceUpdate();
        }
    }

    componentDidMount() {
        this._isMounted = true;
    
    }

    fn_onPreferenceChanged(me)
    {
        if (me._isMounted !== true) return ;
        me.setState({'m_update': me.state.m_update +1});
        //me.forceUpdate();
    }

    fn_updateMapStatus(p_andruavUnit)
    {
        if (p_andruavUnit.hasOwnProperty("p_marker") === false) return;
        if (
                ((js_globals.v_en_GCS === true ) && (p_andruavUnit.m_IsGCS === true))
             || ((js_globals.v_en_Drone === true ) && (p_andruavUnit.m_IsGCS ===false))
            )
        {
            // if (p_andruavUnit.m_gui != null)
            // {
            //     //p_andruavUnit.p_marker.setMap(p_andruavUnit.m_gui.m_mapObj);
            //     js_leafletmap.setMap(p_andruavUnit.m_gui.m_marker, p_andruavUnit.m_gui.m_mapObj);
            // }   
        }
        else
        {
            js_leafletmap.fn_hideItem(p_andruavUnit.m_gui.m_marker);
        }

        return ;
    }


    componentWillUnmount () {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe (js_globals.EE_requestGamePadonPreferenceChanged,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_requestGamePadonSocketStatus,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitAdded,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitUpdated,this);
    }

    /**
     * determine text and style of tabs of each drone.
     * @param {*} v_andruavUnit 
     * @returns classes, text
     */
    getHeaderInfo(v_andruavUnit)
    {
        var bad_fcb = ((v_andruavUnit.m_useFCBIMU === false) 
        ||((v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry)
            && (v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry)));

        var classes = "";
        var text = v_andruavUnit.m_unitName;
        if (v_andruavUnit.m_FCBParameters.m_systemID !== 0)
        {
            text += ":" + v_andruavUnit.m_FCBParameters.m_systemID;
        }
        if ( v_andruavUnit.m_IsShutdown === true)
        {
            classes = " blink_offline ";
        }
        else
        {
            if (bad_fcb === true) 
            {
                    classes = "blink_warning animate_iteration_5s bi bi-exclamation-diamond ";
                    text = " " + text;
                    
            }
            else 
            if (v_andruavUnit.m_isArmed === true) 
            {
                classes = " blink_alert animate_iteration_3s";
            }
            else
            {
                classes += " blink_success animate_iteration_3s ";
            }

            
        }
        return {
            'classes': classes,
            'text': text
        };
    }
    
    render() {
        var unit = [];
        
        var units_header = [];
        var units_details = [];
        var units_gcs = [];

        if (this.state.andruavUnitPartyIDs.length === 0) 
        {

            unit.push (<div key={'no_online_units'} className='text-center' >NO ONLINE UNITS</div>);
        }
        else 
        {
            var me = this;

            var sortedPartyIDs;
            if (js_localStorage.fn_getUnitSortEnabled() === true)
            {
                // Sort the array alphabetically
                // returns array
                sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSortedBy_APID();
            }
            else
            {
                // returns list
                sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSorted();
            }
            
            sortedPartyIDs.map(function (object)
            {
                const partyID = object[0];
                const v_andruavUnit = object[1];
                
                // dont display if unit is not defined yet.
                if ((v_andruavUnit==null) || (v_andruavUnit.m_defined !== true))return ;
                
                if (v_andruavUnit.m_IsGCS === true)
                {
                    units_gcs.push (<ClssAndruavUnit_GCS key={'ClssAndruavUnit_GCS' + partyID} v_en_GCS= {js_localStorage.fn_getGCSDisplayEnabled()} m_unit = {v_andruavUnit}/>);
                }
                else 
                if (v_andruavUnit.m_IsGCS===false)
                {
                    // Display Units (Vehicles)
                    if (js_localStorage.fn_getTabsDisplayEnabled() === true)
                    { 
                        // Display in Tabs
                        var header_info = me.getHeaderInfo(v_andruavUnit);
                        units_header.push(
                            <li id={'h' + partyID} key={'h' + partyID} className="nav-item nav-units">
                                <a className={"nav-link user-select-none "} data-bs-toggle="tab" href={"#tab_" + v_andruavUnit.partyID}><span className={header_info.classes}> {header_info.text}</span> </a>
                            </li>
                        );

                        units_details.push(
                            <div key={'aud' + partyID} className="tab-pane fade" id={"tab_"+v_andruavUnit.partyID}>
                                <ClssAndruavUnit_Drone m_unit = {v_andruavUnit}/>
                            </div>
                        );
                    }
                    else
                    {   // Display as List
                        units_details.push(<ClssAndruavUnit_Drone key={'aud2' + partyID}  m_unit = {v_andruavUnit}/>);
                    }
                }

                me.fn_updateMapStatus(v_andruavUnit);

            });
        }
       
        unit.push (<ul key={'unit_header_div'} className="nav nav-tabs"> {units_header} </ul>    );
        unit.push (<div key={'unit_details_div'} id="myTabContent" className="tab-content padding_zero"> {units_details} </div>);
        unit.push (units_gcs);
        
    return (

                <div key='main' className='margin_zero row'>{unit}</div>
            );
    }
};