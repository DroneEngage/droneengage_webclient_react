import $ from 'jquery'; 
import * as js_session from '../../js/state/session.js';
import * as js_preferences from '../../js/state/preferences.js';

import React    from 'react';
import { withTranslation } from 'react-i18next';


import * as js_common from '../../js/js_common.js'
import { DIALOG_ICONS } from '../../js/config/assets.js';
import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import {js_eventEmitter} from '../../js/events/js_eventEmitter.js'



import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'
import {js_localStorage} from '../../js/js_localStorage.js'
import {js_leafletmap} from '../../js/maps/js_leafletmap.js'
import { js_unitLayerRegistry } from '../../js/services/map/unitLayerRegistry.js'






import {ClssAndruavUnitDrone} from './jsc_unit_control_drone.jsx'
import ClssUnitTabHeaderItem from './jsc_unit_tab_header.jsx'


/**
 * Max number of unit panels kept mounted at once in tabbed-display mode
 * (the active unit plus the most-recently-visited ones). Inactive units
 * beyond this set are unmounted so they stop receiving telemetry-driven
 * re-renders while hidden. Keeps per-unit UI state (e.g. log history in
 * ClssCtrlUnitLog) alive for recently-viewed units without keeping every
 * connected unit's full control tree live.
 */
const CONST_KEEP_ALIVE_UNITS = 3;




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
		    'm_update': 0,
            isMinimized: false,
            // LRU set of party IDs whose full ClssAndruavUnitDrone tree stays
            // mounted in tabbed-display mode. Always contains the active unit
            // (most-recently pushed). Capped at CONST_KEEP_ALIVE_UNITS.
            m_keepAlive: [],
		};

        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe (js_event.EE_requestGamePadonPreferenceChanged, this, this.fn_onPreferenceChanged);
        js_eventEmitter.fn_subscribe (js_event.EE_requestGamePadonSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_event.EE_unitAdded,this,this.fn_unitAdded);
        // EE_unitOnlineChanged / EE_andruavUnitArmedUpdated / EE_andruavUnitFCBUpdated
        // used to all funnel into fn_unitOnlineChanged, forcing this whole list
        // (every connected unit's tab header) to re-render on any single unit's
        // armed/FCB/online tick. Each tab header now reads those fields itself
        // via useUnitField (see jsc_unit_tab_header.jsx), bridged from the same
        // three events in js_main.js - so only the affected unit's header
        // re-renders, not the whole list.
        js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_unitHighlighted,this,this.fn_unitOnUnitHighlighted);
        
    }

    fn_unitOnUnitHighlighted (p_me, p_andruavUnit)
    {
        if (p_me.m_flag_mounted === false) return ;

        p_me.fn_setActiveUnit(p_andruavUnit.getPartyID());
    }

    /**
     * Select the active unit tab and record it in the LRU keep-alive set so
     * its full ClssAndruavUnitDrone tree stays mounted (preserving per-unit
     * UI state such as log history) even after the user switches to another
     * unit, up to CONST_KEEP_ALIVE_UNITS recently-visited units.
     */
    fn_setActiveUnit (p_partyID)
    {
        if (this.m_flag_mounted === false) return ;

        this.setState((prevState) => {
            let v_keepAlive = prevState.m_keepAlive.filter(id => id !== p_partyID);
            v_keepAlive.push(p_partyID);
            while (v_keepAlive.length > CONST_KEEP_ALIVE_UNITS) {
                v_keepAlive.shift();
            }
            return { m_active_partyID: p_partyID, m_keepAlive: v_keepAlive };
        });
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

    fn_toggleMinimize() {
        this.setState(prevState => ({ isMinimized: !prevState.isMinimized }));
    }

    fn_toggleTabsDisplay() {
        const enabled = !js_localStorage.fn_getTabsDisplayEnabled();
        js_preferences.fn_setEnableTabsDisplay(enabled);
        js_localStorage.fn_setTabsDisplayEnabled(enabled);
        js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
    }

    fn_toggleSortUnits() {
        const enabled = !js_localStorage.fn_getUnitSortEnabled();
        js_localStorage.fn_setUnitSortEnabled(enabled);
        js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
    }

    fn_updateMapStatus(p_andruavUnit)
    {
        if (p_andruavUnit.hasOwnProperty("p_marker") === false) return;
        if (
                ((js_preferences.fn_getEnGCS() !== true ) || (p_andruavUnit.m_IsGCS !== true))
             && ((js_preferences.fn_getEnDrone() !== true ) || (p_andruavUnit.m_IsGCS !== false))
            )
        {
            js_leafletmap.fn_hideItem(js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID())?.m_marker);
        }

        return ;
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_requestGamePadonPreferenceChanged,this);
        js_eventEmitter.fn_unsubscribe (js_event.EE_requestGamePadonSocketStatus,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitAdded,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onPreferenceChanged,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitHighlighted,this);
        
    }

    render() {
        const { t } = this.props; // Access t function

        let unit = [];

        let units_header = [];
        let units_details = [];
        let onlineCount = 0;

        if (this.state.andruavUnitPartyIDs.length === 0)
        {

            // no units; header will show the message instead.
        }
        else
        {
            const me = this;

            let sortedPartyIDs;
            if (js_localStorage.fn_getUnitSortEnabled() === true)
            {
                // Sort the array alphabetically
                // returns array
                sortedPartyIDs = js_session.fn_getAndruavUnitList().fn_getUnitsSortedBy_APID();
            }
            else
            {
                // returns list
                sortedPartyIDs = js_session.fn_getAndruavUnitList().fn_getUnitsSorted();
            }

            const v_prop = this.props;

            // Resolve the active party ID for tabbed-display mode.
            // - If the stored active unit is no longer connected, drop it so a
            //   fallback (first eligible unit) can take over below.
            // - If no unit has been selected yet (initial load, no marker/tab
            //   click), the first eligible unit is treated as active so its
            //   panel mounts and is visible immediately.
            let activePartyID = me.state.m_active_partyID;
            if (activePartyID !== undefined
                && !sortedPartyIDs.some(obj => obj && obj.m_defined === true && obj.m_IsGCS === false && obj.getPartyID() === activePartyID))
            {
                activePartyID = undefined;
            }
            let fallbackActiveAssigned = false;

            sortedPartyIDs.map(function (object)
            {

                const partyID = object.getPartyID();
                const v_andruavUnit = object;

                // dont display if unit is not defined yet.
                if ((v_andruavUnit==null) || (v_andruavUnit.m_defined !== true))return ;

                // GCS units are displayed by ClssAndruavUnitGCSList, skip them here.
                if (v_andruavUnit.m_IsGCS === true) return ;

                onlineCount++;

                if (v_andruavUnit.m_IsGCS===false)
                {
                    // Display Units (Vehicles)
                    if (js_localStorage.fn_getTabsDisplayEnabled() === true)
                    {
                        // Display in Tabs
                        let c_active = activePartyID === v_andruavUnit.getPartyID();
                        // No unit selected yet: make the first eligible unit the
                        // visible one so the user sees a panel on initial load.
                        if (c_active === false && activePartyID === undefined && fallbackActiveAssigned === false)
                        {
                            c_active = true;
                            fallbackActiveAssigned = true;
                        }
                        // Only keep-alive units (active + recently visited) get
                        // their full ClssAndruavUnitDrone tree mounted. Everyone
                        // else gets null: no telemetry-driven re-renders and no
                        // live listeners while hidden.
                        const c_keepAlive = c_active === true || me.state.m_keepAlive.includes(v_andruavUnit.getPartyID());
                        units_header.push(
                            <ClssUnitTabHeaderItem
                                key={'h' + partyID}
                                p_unit={v_andruavUnit}
                                active={c_active}
                                onSelect={() => me.fn_setActiveUnit(partyID)}
                            />
                        );

                        units_details.push(
                            <div key={'aud' + partyID} className={`tab-pane fade ${c_active === true ? 'active show' : ''}`} id={"tab_"+v_andruavUnit.getPartyID()}>
                                {c_keepAlive === true
                                    ? <ClssAndruavUnitDrone p_unit = {v_andruavUnit} tab_collapsed={false} tab_planning={v_prop.tab_planning} tab_main={v_prop.tab_main} tab_log={v_prop.tab_log} tab_details={v_prop.tab_details} tab_module={v_prop.tab_module} />
                                    : null}
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

        const v_showCard = this.props.show_card !== false;
        const v_hasUnits = this.state.andruavUnitPartyIDs.length > 0;
        const v_tabsEnabled = js_localStorage.fn_getTabsDisplayEnabled();
        const v_sortEnabled = js_localStorage.fn_getUnitSortEnabled();
        const v_headerText = v_hasUnits ? t('home:onlineUnits') + ' - ' + onlineCount : t('home:no_online_units');

    return (
                <div key='main' className='margin_zero width_100'>
                    {v_showCard === true
                    ? (
                    <div className="mb-3 padding_zero">
                        <div className="card-header user-select-none border-bottom border-light rounded-top txt-theme-aware mb-1">
                            <strong>{v_headerText}</strong>
                            {v_hasUnits === true
                            ? <>
                                <button type="button" className="btn btn-sm btn-link txt-theme-aware float-end p-0 ms-2" onClick={() => this.fn_toggleMinimize()}>
                                    {this.state.isMinimized ? DIALOG_ICONS.MAXIMIZE : DIALOG_ICONS.MINIMIZE}
                                </button>
                                <button type="button" className={`btn btn-sm btn-link txt-theme-aware float-end p-0 ms-2 ${v_tabsEnabled ? 'bi bi-list-ul' : 'bi bi-list-nested'}`} title={t('globalSettings:tabsDisplayLabel')} onClick={() => this.fn_toggleTabsDisplay()}>
                                </button>
                                <button type="button" className={`btn btn-sm btn-link txt-theme-aware float-end p-0 ms-2 ${v_sortEnabled ? 'bi bi-sort-alpha-down' : 'bi bi-sort-alpha-up'}`} title={t('globalSettings:sortUnitsTitle')} onClick={() => this.fn_toggleSortUnits()}>
                                </button>
                              </>
                            : null
                            }
                        </div>
                        <div style={{ display: this.state.isMinimized ? 'none' : 'block' }}>
                            {unit}
                        </div>
                    </div>
                    )
                    : unit
                    }
                </div>
            );
    }
};


export default withTranslation(['', 'home', 'globalSettings'])(ClssAndruavUnitList);