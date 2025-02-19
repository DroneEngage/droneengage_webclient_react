import React    from 'react';


import * as js_common from '../../js/js_common.js'

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'
import {js_localStorage} from '../../js/js_localStorage.js'
import {ClssCtrlUnitIcon} from './jsc_ctrl_unit_icon.jsx'

/**
 * List all units in combobox with icon next to it.
 * 
 * properties:
 * p_partyID
 * p_fixed_list = [ [value,text, text-color], [value,text, text-color],...]
 * 
 * event:
 * onSelectUnit(partyID)
 * 
 */
export class ClssAndruavUnit_DropDown_List extends React.Component {


    constructor()
	{
		super ();
		this.state = {
            m_update: 0,
            m_selected_party_id: "0"
        };

        this.key = Math.random().toString();
            
        js_eventEmitter.fn_subscribe(js_globals.EE_unitAdded,this,this.fn_unitAdded);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitOnlineChanged,this,this.fn_unitOnlineChanged);

    }

       

    componentDidMount() {
        this.state.m_update = 1;
        this.state.m_selected_party_id = this.props.p_partyID;
        if (this.state.m_selected_party_id === null || this.state.m_selected_party_id === undefined)
        {
            this.state.m_selected_party_id = "0";
        }
        this.setState({'m_update': this.state.m_update +1});
    }

    componentDidUpdate(prevProps) {
        // Check if the prop has changed
        if (prevProps.p_partyID !== this.props.p_partyID) {
            this.state.m_selected_party_id = this.props.p_partyID;
            if (this.state.m_selected_party_id === null || this.state.m_selected_party_id === undefined)
            {
                this.state.m_selected_party_id = "0";
            }
            this.setState({'m_update': this.state.m_update +1});
        }
        
    }

    fn_onPreferenceChanged(me)
    {
        if (me.state.m_update === 0) return ;
        me.setState({'m_update': me.state.m_update +1});
    }

    componentWillUnmount () {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe(js_globals.EE_unitAdded,this);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitOnlineChanged,this);

    }

    
    fn_unitOnlineChanged (me,p_andruavUnit)
    {
        if (me.state.m_update === 0) return ;
        
        // render is initiated via updating state
        me.setState({ 'm_update': me.state.m_update+1});
    }

    fn_unitAdded (me,p_andruavUnit)
    {
        if (me.state.m_update === 0) return ;
    
        js_common.fn_console_log ("REACT:fn_unitAdded" );

        me.fn_unitOnlineChanged (me,p_andruavUnit);
    }

    fn_onSelectUnit(e)
    {
        this.state.m_selected_party_id = e.target.value;

        if (this.props.onSelectUnit !== null && this.props.onSelectUnit !== undefined)
        {
            // partyid = e.target.value;
            this.props.onSelectUnit(e.target.value);
        }

        this.setState({ 'm_update': this.state.m_update+1});
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
        let v_css_select = ' text-white ';

        if (this.props.p_fixed_list !== undefined)
        {
            this.props.p_fixed_list.forEach((value, index, array)=> {
                units_details.push(<option key={value[0] + this.key} className={"col-6 " + value[2]} value={value[0]}>{value[1]}</option>);
            });

        }
        else
        {
            units_details.push(<option key={this.key + "00"} className="col-6 text-white" value="0">n/a</option>);
        }

        sortedPartyIDs.map(function (object)
        {
            
            const partyID = object.partyID;
            const v_andruavUnit = object;
            
            // dont display if unit is not defined yet.
            if ((v_andruavUnit === null || v_andruavUnit === undefined) || (v_andruavUnit.m_defined !== true))return ;
            
            if (v_andruavUnit.m_IsGCS === false)
            {
                let css_unit = 'text-success fw-bold';
                let txt_unit = v_andruavUnit.m_unitName;
                if ((v_andruavUnit.m_IsDisconnectedFromGCS === true) || (v_andruavUnit.m_IsShutdown === true))
                {
                    css_unit = 'text-light';
                    txt_unit += ' --- offline';
                } 
                
                const v_selected = (partyID === me.props.p_partyID);
                units_details.push(<option key={me.key + partyID} 
                    className={css_unit} 
                    value={partyID}
                    >{txt_unit}</option>);

                    
                    if (v_selected === true)
                    {
                        v_css_select = css_unit;
                    }
            }
        });

        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.m_selected_party_id);


        return (
                <div className={"form-group" + this.props.className} >
                    <label htmlFor={this.key + 'combo_list'} className="col-3 text-white al_r pe-2 "><small><b>{this.props.p_label}</b></small></label>
                    <select multiple="" className={'col-7 bg-dark ' + v_css_select} id={this.key + 'combo_list'} value={this.state.m_selected_party_id } onChange={(e) => this.fn_onSelectUnit(e)}>
                        {units_details}
                    </select>
                    <ClssCtrlUnitIcon className="ms-2 p-1" p_unit={v_andruavUnit}/>
                </div>
            
        );
    }
}