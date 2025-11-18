
import React    from 'react';
import L from 'leaflet';

import {js_leafletmap} from '../../../js/js_leafletmap.js'
import {js_globals} from '../../../js/js_globals.js';
import * as js_andruavMessages from '../../../js/protocol/js_andruavMessages'

import {CFieldChecked} from '../../micro_gadgets/jsc_mctrl_field_check.jsx'


export class CWayPointAction extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            missionType: 1
        };

        this.m_missionTypeRef = React.createRef(); // Add this line
    }
 

    fn_editShape ()
    {
        let waypointType = this.m_missionTypeRef.current.value; //parseInt($('#msnaction' + this.props.p_shape.id + '_' + this.props.p_shape.m_main_de_mission.m_id + ' #msnsel option:selected').val());
        this.props.p_shape.m_missionItem.m_missionType = waypointType;
        
        let icon_img = 'bi bi-geo-alt-fill';
                
        switch (waypointType)
		{
            case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
                icon_img = 'bi bi-geo-alt-fill';
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_SPLINE:
			    icon_img = 'bi bi-dice-6';
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
			    icon_img = 'bi-arrow-bar-up';
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
			    icon_img = 'bi-download';
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_GUIDED:
                icon_img = 'bi-signpost-split-fill';
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
			    icon_img = 'bi-skip-backward-circle';
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
                icon_img = 'bi-c-circle';
                break;

            
        }
        
        this.props.p_shape.m_shape_icon = icon_img;
        
        js_leafletmap.fn_createBootStrapIcon (this.props.p_shape, icon_img, this.props.p_shape.m_main_de_mission.m_pathColor, [32, 32]);
        // apply on all shapes
        this.props.p_shape.m_main_de_mission.fn_updatePath(true);
        
        if (this.speed.fn_getValue() != null)
        {
            this.props.p_shape.m_missionItem.speed = parseFloat(this.speed.fn_getValue());
            this.props.p_shape.m_missionItem.m_speedRequired = (this.props.p_shape.m_missionItem.speed !== null && this.props.p_shape.m_missionItem.speed !== undefined);
        }

        if (this.yaw.fn_getValue() != null)
        {
            this.props.p_shape.m_missionItem.yaw = parseFloat(this.yaw.fn_getValue());
            this.props.p_shape.m_missionItem.m_yawRequired = (this.props.p_shape.m_missionItem.yaw !== null && this.props.p_shape.m_missionItem.yaw !== undefined) ;
        }
       
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === true)
		{
            this.props.p_shape.m_missionItem.eventFire = this.eventFire.fn_getValue();
            this.props.p_shape.m_missionItem.eventFireRequired = (this.props.p_shape.m_missionItem.eventFire !== null && this.props.p_shape.m_missionItem.eventFire  !== undefined);
        
            const ret_val = this.eventWait.fn_getValue();
            if (ret_val === null || ret_val === undefined)
            {
                this.props.p_shape.m_missionItem.eventWait = null ;
            }
            else
            {
                this.props.p_shape.m_missionItem.eventWait = parseInt(ret_val) ;
            }
            this.props.p_shape.m_missionItem.eventWaitRequired = (ret_val !== null && ret_val !== undefined);
            
        }
        
    }

    componentDidMount () 
    {
        if (this.props.p_shape && this.props.p_shape.m_missionItem) { // Check if p_shape and m_missionItem are not null
            if (this.props.p_shape.m_missionItem.m_missionType === 0) this.props.p_shape.m_missionItem.m_missionType = 1;

            this.setState({ missionType: this.props.p_shape.m_missionItem.m_missionType });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.p_shape.m_missionItem.m_missionType !== this.props.p_shape.m_missionItem.m_missionType) {
          this.setState({ missionType: this.props.p_shape.m_missionItem.m_missionType });
        }
      }
      
    
    handleMissionTypeChange = (event) => {
        const mission_type = event.target.value;
        if (this.props.p_shape && this.props.p_shape.m_missionItem) { // Check if p_shape and m_missionItem are not null
            if (mission_type === js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP_DE.toString())
            {
                // in DE_Mission Type Waypoints does not fire events.
                this.props.p_shape.m_missionItem.eventFireRequired = false;
                this.props.p_shape.m_missionItem.eventFire = undefined;
            }

            this.setState({ missionType: mission_type });
        }
    }

    render ()
    {

        let v_itemID = this.props.p_shape.id+ "_" + this.props.p_shape.m_main_de_mission.m_id;

        let v_event_firing = [];
        
        //CODEBLOCK_START
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED===true)
		{
            v_event_firing.push(<CFieldChecked  key={'f3' + v_itemID} required={this.props.p_shape.m_missionItem.eventWaitRequired === true} txtLabel='wait for event'  txtValue={this.props.p_shape.m_missionItem.eventWait}  ref={instance => {this.eventWait = instance}} />)
            v_event_firing.push(<CFieldChecked  key={'f4' + v_itemID} required={this.props.p_shape.m_missionItem.eventFireRequired === true} txtLabel='fire event'  txtValue={this.props.p_shape.m_missionItem.eventFire}  ref={instance => {this.eventFire = instance}} />)
        }
        //CODEBLOCK_END

        const c_id = "msnaction"+ v_itemID;
        
        return (

        <div id={c_id} key={c_id} className={this.props.className + ' form-group text-left '}>
        <p className="form-control-label text-white mb-0">To Do When Arrive </p>
        {v_event_firing}
        <CFieldChecked  key={'f1' + v_itemID} required={this.props.p_shape.m_missionItem.m_speedRequired === true} txtLabel='speed'  txtValue={this.props.p_shape.m_missionItem.speed}  ref={instance => {this.speed = instance}} />
        <CFieldChecked  key={'f2' + v_itemID} required={this.props.p_shape.m_missionItem.m_yawRequired === true}  txtLabel='yaw'  txtValue={this.props.p_shape.m_missionItem.yaw}  ref={instance => {this.yaw = instance}} />
        <select id="msnsel"  ref={this.m_missionTypeRef} className="form-control css_margin_top_small" value={this.state.missionType} onChange={this.handleMissionTypeChange}>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF}>Take Off</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP}>Waypoint</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE}>Circle Here</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_RTL}>RTL</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_LANDING}>Land</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_GUIDED}>Guided</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP_DE}>DE Mission</option>
                </select>
        </div>);
    }

}
