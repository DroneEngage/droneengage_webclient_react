import $ from 'jquery';
import React from 'react';

import * as js_siteConfig from '../../js/js_siteConfig.js'
import { js_globals } from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter'



/**
 * props:
 * p_unit
 *
 * events:
 * onMakeSwarm
 * onRequestToFollow
 */
export default class ClssCtrlObjectTrackerAIList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
                m_update: 0,
                m_tracker_ai_gui_enabled: false,
                m_selectedUnits: [],
                m_selected_units_updated: false
        };

        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_onTrackingAIStatusChanged, this, this.fn_onTrackingAIStatusChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_onTrackingAIObjectListUpdate, this, this.fn_onTrackingAIObjectListUpdate);

        js_globals.v_andruavFacade.API_GetTrackingAIClassList(this.props.p_unit);

    }

    // --- Core Change: Preventing re-renders from parent props ---
    shouldComponentUpdate(nextProps, nextState) {
        // Only re-render if the internal m_update state has changed.
        // This effectively ignores prop changes from the parent.
        return (nextState.m_update !== this.state.m_update) || (nextState.m_selectedUnits.length != this.state.m_selectedUnits.length);
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe (js_event.EE_onTrackingAIStatusChanged,this);
        js_eventEmitter.fn_unsubscribe (js_event.EE_onTrackingAIObjectListUpdate,this);
    }




    componentDidMount() {
        this.setState({ m_update: 1 });
    }


    componentDidUpdate(prevProps, prevState) {
        // If the component re-rendered because m_selectedUnits_changed was true,
        // reset it back to false to allow future changes to trigger re-renders.
        if (this.state.m_selectedUnits_changed === true && prevState.m_selectedUnits_changed === false) {
            this.setState({ m_selectedUnits_changed: false });
        }
    }

    fn_onTrackingAIStatusChanged(p_me, p_unit) {

        if (p_me.props.p_unit.partyID !== p_unit.partyID) return ;
        if (p_me.m_flag_mounted === false)return;

        p_me.setState({ 'm_update': p_me.state.m_update + 1 });
    }

    fn_onTrackingAIObjectListUpdate(p_me, p_unit) {
        
        if (p_me.props.p_unit.partyID !== p_unit.partyID) return ;
        if (p_me.m_flag_mounted === false)return;

        p_me.setState({ 'm_update': p_me.state.m_update + 1 });
    }


    fnl_trackerAIOff() {
        js_globals.v_andruavFacade.API_DisableTrackingAI(this.props.p_unit);
    }

    fnl_trackerAIOnOff(e) {
        if (this.props.p_unit.m_tracker_ai.m_active===true)
        {
            this.fnl_trackerAIOff();
        }
        else
        {
            js_globals.v_andruavFacade.API_EnableTrackingAI(this.props.p_unit);
            if (this.state.m_selectedUnits.length == 0) return ; // nothing to select
            js_globals.v_andruavFacade.API_SendTrackAISelect(this.props.p_unit, this.state.m_selectedUnits);
        }

        js_eventEmitter.fn_dispatch(js_event.EE_onTrackingAIStatusChanged, this.props.p_unit);

    }

    fnl_unSelectAll()
    {
        const { m_selectedUnits } = this.state;
        const newSelectedUnits = [];

        this.fnl_trackerAIOff();
    }

    fnl_selectAll(e) {
        const { m_selectedUnits } = this.state;


        const v_units = this.props.p_unit.m_tracker_ai.m_object_list;
        const len = v_units.length;

        const newSelectedUnits = [];
        for (let i = 0; i < len; ++i) {
            newSelectedUnits.push(i);
        }

        if (newSelectedUnits.length === 0) return; // nothing to select

        js_globals.v_andruavFacade.API_SendTrackAISelect(this.props.p_unit, newSelectedUnits);


        this.setState({
            m_selectedUnits: newSelectedUnits,
            m_update: this.state.m_update + 1
        });
    }


    fnl_handleCheckboxChange = (event, unitIndex) => {
        const { m_selectedUnits } = this.state;
        let newSelectedUnits;

        if (event.target.checked) {
            newSelectedUnits = [...m_selectedUnits, unitIndex];
        } else {
            newSelectedUnits = m_selectedUnits.filter(index => index !== unitIndex);
        }

        // Update the state and then immediately trigger the search
        this.setState({
            m_selectedUnits: newSelectedUnits,
            m_selected_units_updated: true
        }, () => { // Callback function executed after state update
            if (newSelectedUnits.length > 0) { // Only send if there are selected units
                js_globals.v_andruavFacade.API_SendTrackAISelect(this.props.p_unit, this.state.m_selectedUnits);
            } else {
                // Optionally, if no items are selected, you might want to pause tracking
                this.fnl_trackerAIOff();
            }
            js_eventEmitter.fn_dispatch(js_event.EE_onTrackingAIStatusChanged, this.props.p_unit);
        });
    };


    render() {
        if ((js_siteConfig.CONST_FEATURE.DISABLE_TRACKING_AI === false)
               && (!this.props.p_unit.m_modules.has_ai_recognition))
        {
            return (
                        <div className="disabled hidden"/>
                    );
        }
        if (this.props.p_unit === null || this.props.p_unit === undefined) return;

        //CODEBLOCK_START
        const v_units = this.props.p_unit.m_tracker_ai.m_object_list;
        const len = v_units.length;
        const c_items = [];

        let v_follower_class = "bg-secondry";

        let css_Track = '';
        let css_Track_title = this.props.title?this.props.title :'object tracker';
        if (this.props.p_unit.m_tracker_ai.m_active === true)
        {
            if (this.props.p_unit.m_tracker_ai.m_detected)
            {
                css_Track = ' text-danger ';
                css_Track_title += ' disable tracking ';
                this.state.m_tracker_ai_gui_enabled = true;
            }
            else
            {
                css_Track = ' text-warning ';
                css_Track_title += ' disable tracking ';
                this.state.m_tracker_ai_gui_enabled = true;
            }
            
        }
        else 
        {
            css_Track = ' text-white ';
            css_Track_title += ' enable tracking ';
            this.state.m_tracker_ai_gui_enabled = false;
        }


        for (let i = 0; i < len; ++i) {
            const v_unit = v_units[i];
            const unitIndex = i; // Get the index of the current unit
            c_items.push(
                        <div key={v_unit + this.key} className="dropdown-item">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value={v_unit}
                                    id={`checkbox-${v_unit}`}
                                    checked={this.state.m_selectedUnits.includes(unitIndex)} // Check if index is in m_selectedUnits
                                    onChange={(e) => this.fnl_handleCheckboxChange(e, unitIndex)}
                                />
                                <label className="form-check-label" htmlFor={`checkbox-${v_unit}`}>
                                    {v_unit}
                                </label>
                            </div>
                        </div>
                    );
            }

            return (
                    <div key={'aiq_1' + this.key} className={"btn-group flgtctrlbtn_icon_w " + this.props.className} role="group" aria-label="Button group with nested dropdown">
                        <button
                            type="button"
                            className={"btn btn-sm  bi bi-eye-fill " + css_Track}
                            title={css_Track_title}
                            onClick={(e) => this.fnl_trackerAIOnOff(e)}></button>
                        <div key={`aiq_12${this.key}`} className="btn-group" role="group">
                            <button
                                id={"btnGroupDrop2"+ this.key}
                                type="button"
                                className={"btn  btn-sm dropdown-toggle " + v_follower_class}
                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
                            <div
                                key={'aiq_121' + this.key}
                                className="dropdown-menu"
                                aria-labelledby={"btnGroupDrop2"+ this.key}
                                style={{ maxHeight: '200px', overflowY: 'auto' }}
                            >
                                <a className="dropdown-item " href="#" onClick={(e) => this.fnl_unSelectAll(e)}>Unselect all</a>
                                {c_items}
                                <a className="dropdown-item " href="#" onClick={(e) => this.fnl_selectAll(e)}>select all</a>
                            </div>
                        </div>
                    </div>
            );


    }
}