import $ from 'jquery';

import React from 'react';

import * as js_common from '../../../js/js_common.js'

import { js_globals } from '../../../js/js_globals.js';
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'
import { ClssSingle_Mission_Details } from './jsc_ctrl_single_mission_details.jsx'

import {ClssSingle_Mission_Header} from './jsc_ctrl_single_mission_header.jsx'

/**
 * Contains a Single Mission All Controls
 */
export  class ClssSingle_Mission_Container extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_collapsed: false,
        };

        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeSelected, this, this.displayGeoForm);
    }

    componentDidMount () {
        this.state.m_update = 1;
    }

    componentWillUnmount() {
        js_eventEmitter.unsubscribe(js_globals.EE_onShapeSelected, this);
    }

    /**
     * hide or display pathes on Google Map.
     * @param {*} e 
     */
    fn_togglePath(e) {
        js_common.fn_console_log(e);
        this.props.p_missionPlan.fn_togglePath();
        if (this.props.p_missionPlan.m_hidden === true) {
            $('#ph_' + this.props.p_mission.m_id).addClass('text-muted');
            $('#ph_' + this.props.p_mission.m_id).removeClass('text-success');
            $('#ph_' + this.props.p_mission.m_id).addClass('border-muted');
            $('#ph_' + this.props.p_mission.m_id).removeClass('border-success');
        }
        else {
            $('#ph_' + this.props.p_mission.m_id).addClass('text-success');
            $('#ph_' + this.props.p_mission.m_id).removeClass('text-muted');
            $('#ph_' + this.props.p_mission.m_id).addClass('border-success');
            $('#ph_' + this.props.p_mission.m_id).removeClass('border-muted');
        }
    }


    displayGeoForm(me, p_event) {
        // not a marker
        if (p_event.target.m_mission === null || p_event.target.m_mission === undefined) {
            js_common.fn_console_log("MISSION:NULL HERE");
            return;
        }

        if (me.props.p_missionPlan.m_id !== p_event.target.m_mission.m_id) {
            js_common.fn_console_log("Not Me");
            return;
        }

        if (me.props.p_isCurrent === false) {
            js_eventEmitter.fn_dispatch(js_globals.EE_onMissionItemToggle, { p_switch_next: false, p_mission: me.props.p_missionPlan });
        }

        me.setState({ s_shape: p_event.target });


        js_common.fn_console_log("REACT:displayGeoForm");

        if (me.state.m_update === 0) return ;
        me.setState({'m_update': me.state.m_update +1});
    }


    // fn_onMissionItemToggle(me, p_params) {
    //     js_common.fn_console_log(p_params);


    //     me.forceUpdate();
    // }

    fn_onCollapse(e)
    {
        if (this.state.m_update === 0) return ;
        

        if ((this.props.p_missionPlan.m_hidden === true) && (this.props.p_isCurrent === false)) {
            // display path if group is going to be activated and was hidden.
            this.fn_togglePath(e);
        }

        if (this.props.p_isCurrent===true)
        {
            this.setState({ m_collapsed: !this.state.m_collapsed });
            return ;
        }
        else
        {
            this.state.m_collapsed = false;

            js_eventEmitter.fn_dispatch(js_globals.EE_onMissionItemToggle, { p_isCurrent: this.props.p_isCurrent, p_mission: this.props.p_missionPlan });
        }


        this.setState({'m_update': this.state.m_update +1});
    }


    
    render() {

        var c_borderStyle;

        if (this.props.p_isCurrent === true) {
            c_borderStyle = 'css_missionMapSelected';
        }


        let item = [];

        if (this.props.p_missionPlan == null) {
            item.push(<h4 key="mi"></h4>);
        }
        else {
            if (this.state.shape != null) {
                this.state.shape.setLabel({
                    text: this.state.shape.order.toString(), // string
                    color: "#977777",
                    fontSize: "12px",
                    fontWeight: "bold"
                });
            }
            item.push(<div key={"mstp" + this.props.p_missionPlan.m_id} id="missionstep" className={"container-fluid localcontainer " + c_borderStyle}>
                <ClssSingle_Mission_Header p_mission={this.props.p_missionPlan} p_ParentCtrl={this} p_isHidden={this.props.p_missionPlan.m_hidden} p_isCurrent={this.props.p_isCurrent} onClick={(e)=>this.fn_onCollapse(e)}/>
                <ClssSingle_Mission_Details p_shape={this.state.s_shape} p_isCollapsed={this.state.m_collapsed} p_isCurrent={this.props.p_isCurrent} />
            </div>);
        }

        return (
            <div key='fsc' className="margin_zero width_100">

                <div className="row margin_zero">
                    {item}
                </div>
            </div>
        );
    }
};