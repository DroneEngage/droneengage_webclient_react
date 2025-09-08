import $ from 'jquery'; 

import React    from 'react';
import { withTranslation } from 'react-i18next';


import * as js_common from '../../js/js_common.js'
import {js_globals} from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'



import * as js_andruavMessages from '../../js/js_andruavMessages.js'
import {js_localStorage} from '../../js/js_localStorage.js'
import {js_leafletmap} from '../../js/js_leafletmap.js'






import {ClssAndruavUnitGCS} from './jsc_unit_control_gcs.jsx'
import {ClssAndruavUnitDrone} from './jsc_unit_control_drone.jsx'




/**
 * 
 * Properties:
 * tab_planning: display planning tab... true in planner.
 * tab_main: display main bar control.... true in mnormal operation
 * tab_log: log tab that lists messages.
 * tab_details: detailed tab that display version, attached modules, received messages ....etc.
 * tab_modules: true to display any other module such as SDR,P2P,Audio ...etc.
 * 
 */
class ClssAndruavUnitList extends React.Component {
  
    constructor()
	{
		super ();
		this.state = {
			andruavUnitPartyIDs : [],
            rnd:Math.random(),
		    'm_update': 0
		};

        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe (js_event.EE_requestGamePadonPreferenceChanged, this, this.fn_onPreferenceChanged);
        js_eventEmitter.fn_subscribe (js_event.EE_requestGamePadonSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_event.EE_unitAdded,this,this.fn_unitAdded);
        js_eventEmitter.fn_subscribe(js_event.EE_unitOnlineChanged,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitArmedUpdated,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitFCBUpdated,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_unitHighlighted,this,this.fn_unitOnUnitHighlighted);
        
    }

    fn_unitOnUnitHighlighted (p_me, p_andruavUnit)
    {
        if (p_me.m_flag_mounted === false) return ;

        p_me.setState({m_active_partyID: p_andruavUnit.getPartyID()});
    }
      
    fn_unitOnlineChanged(me,p_andruavUnit)
    {
        if (me.m_flag_mounted === false) return ;
        
        // render is initiated via updating state
        me.setState({ 'm_update': me.state.m_update+1});
    }

    fn_unitAdded (me,p_andruavUnit)
    {
        if (me.m_flag_mounted === false) return ;
    
        js_common.fn_console_log ("REACT:fn_unitAdded" );

         if (me.state.andruavUnitPartyIDs.includes(p_andruavUnit.getPartyID())) return ;
         // http://stackoverflow.com/questions/26253351/correct-modification-of-state-arrays-in-reactjs      
         me.setState({ 
            andruavUnitPartyIDs: me.state.andruavUnitPartyIDs.concat([p_andruavUnit.getPartyID()])
        });
    }

    fn_onSocketStatus (me,params) {
       
        if (me.m_flag_mounted === false) return ;
    
        if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {				
                $('#andruavUnits').show();
        }
        else
        {				
                me.state.andruavUnitPartyIDs = [];
                me.setState({'m_update': me.state.m_update +1});
        }
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    fn_onPreferenceChanged(me)
    {
        if (me.m_flag_mounted === false) return ;
        me.setState({'m_update': me.state.m_update +1});
    }

    fn_updateMapStatus(p_andruavUnit)
    {
        if (p_andruavUnit.hasOwnProperty("p_marker") === false) return;
        if (
                ((js_globals.v_en_GCS !== true ) || (p_andruavUnit.m_IsGCS !== true))
             && ((js_globals.v_en_Drone !== true ) || (p_andruavUnit.m_IsGCS !== false))
            )
        {
            js_leafletmap.fn_hideItem(p_andruavUnit.m_gui.m_marker);
        }

        return ;
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_requestGamePadonPreferenceChanged,this);
        js_eventEmitter.fn_unsubscribe (js_event.EE_requestGamePadonSocketStatus,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitAdded,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitOnlineChanged,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_andruavUnitArmedUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_andruavUnitFCBUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onPreferenceChanged,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitHighlighted,this);
        
    }

    /**
     * determine text and style of tabs of each drone.
     * @param {*} v_andruavUnit 
     * @returns classes, text
     */
    getHeaderInfo(v_andruavUnit)
    {
        const bad_fcb = (
            (v_andruavUnit.m_modules.has_fcb === true)
            &&
            ((v_andruavUnit.m_useFCBIMU === false)
            ||((v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_DroneKit_Telemetry)
            && (v_andruavUnit.m_telemetry_protocol !== js_andruavMessages.CONST_TelemetryProtocol_CONST_Mavlink_Telemetry)))
            );

        let classes = "";
        let text = v_andruavUnit.m_unitName;
        if (v_andruavUnit.m_FCBParameters.m_systemID !== 0)
        {
            text += ":" + v_andruavUnit.m_FCBParameters.m_systemID;
        }
        if ((v_andruavUnit.m_IsDisconnectedFromGCS === true) || (v_andruavUnit.m_IsShutdown === true))
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
        const { t } = this.props; // Access t function
        
        let unit = [];
        
        let units_header = [];
        let units_details = [];
        let units_gcs = [];

        if (this.state.andruavUnitPartyIDs.length === 0) 
        {

            unit.push (<div key={'no_online_units'} className='text-center text-uppercase' >{t('msg.no_online_units')}</div>);
        }
        else 
        {
            const me = this;
            
            let sortedPartyIDs;
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
            
            const v_prop = this.props;
            
            sortedPartyIDs.map(function (object)
            {
                
                const partyID = object.getPartyID();
                const v_andruavUnit = object;
                
                // dont display if unit is not defined yet.
                if ((v_andruavUnit==null) || (v_andruavUnit.m_defined !== true))return ;
                
                if ((v_prop.gcs_list !== false) && (v_andruavUnit.m_IsGCS === true))
                {
                    units_gcs.push (<ClssAndruavUnitGCS key={'ClssAndruavUnitGCS' + partyID} v_en_GCS= {js_localStorage.fn_getGCSDisplayEnabled()} p_unit = {v_andruavUnit}/>);
                }
                else 
                if (v_andruavUnit.m_IsGCS===false)
                {
                    // Display Units (Vehicles)
                    if (js_localStorage.fn_getTabsDisplayEnabled() === true)
                    { 
                        // Display in Tabs
                        const header_info = me.getHeaderInfo(v_andruavUnit);
                        const c_active = me.state.m_active_partyID === v_andruavUnit.getPartyID();
                        units_header.push(
                            <li id={'h' + partyID} key={'h' + partyID} className="nav-item nav-units">
                                <a 
                                className={`nav-link user-select-none ${c_active === true ? '' : ''}`} data-bs-toggle="tab" href={"#tab_" + v_andruavUnit.getPartyID()}><span className={header_info.classes}> {header_info.text}</span> </a>
                            </li>
                        );

                        units_details.push(
                            <div key={'aud' + partyID} className={`tab-pane fade ${c_active === true ? 'active show' : ''}`} id={"tab_"+v_andruavUnit.getPartyID()}>
                                <ClssAndruavUnitDrone p_unit = {v_andruavUnit} tab_collapsed={false} tab_planning={v_prop.tab_planning} tab_main={v_prop.tab_main} tab_log={v_prop.tab_log} tab_details={v_prop.tab_details} tab_module={v_prop.tab_module} />
                            </div>
                        );
                    }
                    else
                    {   // Display as List
                        units_details.push(<ClssAndruavUnitDrone key={'aud2' + partyID}  p_unit = {v_andruavUnit} tab_collapsed={true} tab_planning={v_prop.tab_planning} tab_main={v_prop.tab_main} tab_log={v_prop.tab_log} tab_details={v_prop.tab_details} tab_module={v_prop.tab_module} />);
                    }
                }

                me.fn_updateMapStatus(v_andruavUnit);

            });
        }
       
        unit.push (<ul key={'unit_header_div'} className="nav nav-tabs"> {units_header} </ul>    );
        unit.push (<div key={'unit_details_div'} id="myTabContent3" className="tab-content padding_zero"> {units_details} </div>);
        unit.push (units_gcs);
        
    return (

                <div key='main' className='margin_zero row'>{unit}</div>
            );
    }
};


export default withTranslation()(ClssAndruavUnitList);