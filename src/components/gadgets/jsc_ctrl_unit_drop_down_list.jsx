import $ from 'jquery'; 
import React    from 'react';


import * as js_common from '../../js/js_common.js'

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'
import {js_localStorage} from '../../js/js_localStorage.js'


export class ClssAndruavUnit_DropDown_List extends React.Component {


    constructor()
	{
		super ();
		this.state = {
            key: Math.random().toString(),
            m_update: 0,
        };

        js_eventEmitter.fn_subscribe(js_globals.EE_unitAdded,this,this.fn_unitAdded);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitUpdated,this,this.fn_unitUpdated);
     
    }

       

    componentDidMount() {
        this.state.m_update = 1;
    }

    fn_onPreferenceChanged(me)
    {
        if (me.state.m_update === 0) return ;
        me.setState({'m_update': me.state.m_update +1});
    }

    componentWillUnmount () {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe(js_globals.EE_unitAdded,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitUpdated,this);
    }

    

    fn_unitUpdated(me,p_andruavUnit)
    {
        if (me.state.m_update === 0) return ;
        
        // render is initiated via updating state
        me.setState({ 'm_update': me.state.m_update+1});
    }

    fn_unitAdded (me,p_andruavUnit)
    {
        if (me.state.m_update === 0) return ;
    
        js_common.fn_console_log ("REACT:fn_unitAdded" );

         if (me.state.andruavUnitPartyIDs.includes(p_andruavUnit.partyID)) return ;
         // http://stackoverflow.com/questions/26253351/correct-modification-of-state-arrays-in-reactjs      
         me.setState({ 
            andruavUnitPartyIDs: me.state.andruavUnitPartyIDs.concat([p_andruavUnit.partyID])
        });
    }

    fn_onSelectUnit(e)
    {
        
        if (this.props.onSelectUnit !== null && this.props.onSelectUnit !== undefined)
        {
            // partyid = e.target.value;
            this.props.onSelectUnit(e);
        }
    }

    render() 
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
        let units_details = [];
        sortedPartyIDs.map(function (object)
        {
            
            const partyID = object[0];
            const v_andruavUnit = object[1];
            
            // dont display if unit is not defined yet.
            if ((v_andruavUnit === null || v_andruavUnit === undefined) || (v_andruavUnit.m_defined !== true))return ;
            
            if (v_andruavUnit.m_IsGCS === false)
            {
                
                units_details.push(<option key={me.state.key + partyID} value={partyID}>{v_andruavUnit.m_unitName}</option>);
            }
        });

        return (
            <div className="form-inline">
                <div className="form-group">
                    <label htmlFor={this.state.key + 'combo_list'} className="col-5"><small><b>Drone ID</b></small></label>
                    <select multiple="" className="col-5" id={this.state.key + 'combo_list'} value={this.state.m_decode_mode} onChange={(e) => this.fn_onSelectUnit(e)}>
                        <option key={me.state.key + "00"} value="0">N/A</option>
                        {units_details}
                    </select>
                </div>
            </div>
        );
    }
}