import $ from 'jquery';

import React    from 'react';
import L from 'leaflet';

import {js_leafletmap} from '../../../js/js_leafletmap.js'
import {js_globals} from '../../../js/js_globals.js';
import * as js_andruavMessages from '../../../js/js_andruavMessages.js'

import {CFieldChecked} from '../../micro_gadgets/jsc_mctrl_field_check.jsx'


export class CWayPointAction extends React.Component {

    constructor()
    {
        super ();
        this.state = {
        };
    }
 

    fn_editShape ()
    {
        var waypointType = parseInt($('#msnaction' + this.props.p_shape.id + '_' + this.props.p_shape.m_mission.m_id + ' #msnsel option:selected').val());
        this.props.p_shape.m_missionItem.m_missionType = waypointType;
        var icon_img = './images/location_bb_32x32.png';
        switch (waypointType)
		{
            case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
			    icon_img= {
                    iconUrl:'./images/location_bb_32x32.png',
                    iconAnchor: [16,32], //new google.maps.Point(16, 23),
                    iconSize: [32,32], //new google.maps.Size(32, 32),
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_SPLINE:
			    icon_img= {
                    iconUrl:'./images/location_bb_32x32.png',
                    iconAnchor: [16,23], //new google.maps.Point(16, 23),
                    iconSize: [32,32], //new google.maps.Size(32, 32),
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
			    icon_img= {
                    iconUrl:'./images/plane_b_32x32.png',
                    iconAnchor: [16,16], //new google.maps.Point(16, 16),
                    iconSize: [32,32], //new google.maps.Size(32, 32),
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
			    icon_img= {
                    iconUrl:'./images/plane_gr_32x32.png',
                    iconAnchor: [16,16], //new google.maps.Point(16, 16),
                    scaledSize: [32,32], //new google.maps.Size(32, 32),
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_GUIDED:
                icon_img= {
                    iconUrl:'./images/location_bb_32x32.png',
                    iconAnchor: [16,16], //new google.maps.Point(16, 16),
                    scaledSize: [32,32], //new google.maps.Size(32, 32),
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
			    icon_img= {
                    iconUrl:'./images/back_b_32x32.png',
                    iconAnchor: [16,16], //new google.maps.Point(16, 16),
                    scaledSize: [32,32], //new google.maps.Size(32, 32),
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
                icon_img= {
                    iconUrl:'./images/circle_bb_32x32.png',
                    iconAnchor: [16,23], //new google.maps.Point(16, 23),
                    scaledSize: [32,32], //new google.maps.Size(32, 32),
                };
                break;

            
        }
        js_leafletmap.fn_setVehicleIcon(this.props.p_shape, icon_img.iconUrl, "", icon_img.iconAnchor, null, false, "", icon_img.scaledSize);
				
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
        
            if (this.eventWait.fn_getValue() != null)
            {
                this.props.p_shape.m_missionItem.eventWait = parseInt(this.eventWait.fn_getValue()) ;
                this.props.p_shape.m_missionItem.eventWaitRequired = (this.props.p_shape.m_missionItem.eventWait !== null && this.props.p_shape.m_missionItem.eventWait !== undefined);
            }
        }
        
    }

    componentDidMount () 
    {
        if (this.props.p_shape.m_missionItem.m_missionType === 0) this.props.p_shape.m_missionItem.m_missionType = 1;

        this.setState({ missionType: this.props.p_shape.m_missionItem.m_missionType });
        
    }

    componentDidUpdate(prevProps) {
        if (prevProps.p_shape.m_missionItem.m_missionType !== this.props.p_shape.m_missionItem.m_missionType) {
          this.setState({ missionType: this.props.p_shape.m_missionItem.m_missionType });
        }
      }
      
    handleMissionTypeChange = (event) => {
        const mission_type = event.target.value;
        if (mission_type === js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP_DE.toString())
        {
            // in DE_Mission Type Waypoints does not fire events.
            this.props.p_shape.m_missionItem.eventFireRequired = false;
            this.props.p_shape.m_missionItem.eventFire = undefined;
        }

        this.setState({ missionType: mission_type });
      }

    render ()
    {

        var v_itemID = this.props.p_shape.id+ "_" + this.props.p_shape.m_mission.m_id;

        var v_event_firing = [];
        
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
        <select id="msnsel"  className="form-control css_margin_top_small" value={this.state.missionType} onChange={this.handleMissionTypeChange}>
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
