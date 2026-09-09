
import React from 'react';
import * as js_session from '../../../js/state/session.js';

import * as js_common from '../../../js/js_common.js'

import {EVENTS as js_event} from '../../../js/events/js_eventList.js'
import {js_eventEmitter} from '../../../js/events/js_eventEmitter.js'
import {EventBridge} from '../../../js/hooks/EventBridge.jsx'

import {ClssSingle_Mission_Item_Card} from './jsc_ctrl_single_mission_item_card.jsx'
import {ClssSingle_Plan_Header} from './jsc_ctrl_single_plan_header.jsx'

/**
 * Contains a Single Mission All Controls
 */
export  class ClssSinglePlanContainer extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_collapsed: false,
            m_party_id: 0,
        };
        
        this.m_flag_mounted = false;

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }

    componentDidMount () {
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }

    
    fn_displayGeoForm(p_event) {

        js_common.fn_console_log("Mission Selected");
        // not a marker
        if (!p_event || p_event.m_main_de_mission === null || p_event.m_main_de_mission === undefined) {
            js_common.fn_console_log("MISSION:NULL HERE");
            return;
        }

        if (this.props.p_missionPlan.m_id !== p_event.m_main_de_mission.m_id) {
            js_common.fn_console_log("Not Me");
            return;
        }

        if (this.props.p_isCurrent === false) {
            js_eventEmitter.fn_dispatch(js_event.EE_onPlanToggle, { p_switch_next: false, p_mission: this.props.p_missionPlan });
        }

        


        js_common.fn_console_log("REACT:displayGeoForm");

        p_event.m_main_de_mission.fn_activateMissionItem(p_event.id,null)
        if (p_event.m_main_de_mission)
        {
            p_event.m_main_de_mission.fn_updatePath(true);
        }
            
        if (this.m_flag_mounted === false)return ;
        this.setState({ s_shape: p_event });
        
    }

    fn_resetMission()
    {
        this.setState({'m_update': this.state.m_update +1});
    }


    fn_onCollapse(e)
    {
        if (this.m_flag_mounted === false)return ;
        

        if (this.props.p_isCurrent===true)
        {
            this.setState({ m_collapsed: !this.state.m_collapsed });
            
        }
        else
        {
            this.state.m_collapsed = false;
        }

        js_eventEmitter.fn_dispatch(js_event.EE_onPlanToggle, { p_isCurrent: this.props.p_isCurrent, p_mission: this.props.p_missionPlan });


        this.setState({'m_update': this.state.m_update +1});
    }

    fn_onSelectUnit(partyID)
    {
        this.setState({'m_party_id': partyID});
    }
    
    render() {

        let c_borderStyle;

        if (this.props.p_isCurrent === true) {
            c_borderStyle = 'css_missionMapSelected';
        }


        const andruavSelectedUnit = js_session.fn_getAndruavUnitList().fn_getUnit(this.state.m_party_id);

        let item = [];
        
        if (this.props.p_missionPlan == null) {
            item.push(<h4 key="mi"></h4>);
        }
        else {
            // Unused code... delete later
            // if (this.state.shape != null) {
            //     this.state.shape.setLabel({
            //         text: this.state.shape.order.toString(), // string
            //         color: "#977777",
            //         fontSize: "12px",
            //         fontWeight: "bold"
            //     });
            // }
            item.push(<div key={"mstp" + this.props.p_missionPlan.m_id} id="missionstep" className={"container-fluid localcontainer margin_zero " + c_borderStyle}>
                <ClssSingle_Plan_Header p_mission={this.props.p_missionPlan} p_isCollapsed={this.state.m_collapsed}  p_ParentCtrl={this} p_isHidden={this.props.p_missionPlan.m_hidden} p_isCurrent={this.props.p_isCurrent} onSelectUnit={(partyID)=>this.fn_onSelectUnit(partyID)} onClick={(e)=>this.fn_onCollapse(e)}/>
                <ClssSingle_Mission_Item_Card p_shape={this.state.s_shape} p_isCollapsed={this.state.m_collapsed} p_isCurrent={this.props.p_isCurrent} p_unit={andruavSelectedUnit} />
            </div>);
        }

        return (
            <div key='fsc' className="margin_zero width_100">

                <EventBridge eventName={js_event.EE_onShapeSelected} onEvent={(p_event) => this.fn_displayGeoForm(p_event)} />
                <EventBridge eventName={js_event.EE_onMissionReset} onEvent={() => this.fn_resetMission()} />
                <div className="row margin_zero">
                    {item}
                </div>
            </div>
        );
    }
};