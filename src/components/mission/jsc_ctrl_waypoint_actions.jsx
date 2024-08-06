import $ from 'jquery';

import React    from 'react';
import L from 'leaflet';

import {js_globals} from '../../js/js_globals.js';
import * as js_andruavMessages from '../../js/js_andruavMessages.js'

import {CFieldChecked} from '../gadgets/jsc_mctrl_field_check'


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
                    //origin: new google.maps.Point(0, 0),
                    iconAnchor: [16,32], //new google.maps.Point(16, 23),
                    iconSize: [32,32], //new google.maps.Size(32, 32),
                    //labelOrigin: new google.maps.Point(16,40)
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_SPLINE:
			    icon_img= {
                    iconUrl:'./images/location_bb_32x32.png',
                    //origin: new google.maps.Point(0, 0),
                    iconAnchor: [16,23], //new google.maps.Point(16, 23),
                    iconSize: [32,32], //new google.maps.Size(32, 32),
                    //labelOrigin: new google.maps.Point(16,40)
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
			    icon_img= {
                    iconUrl:'./images/plane_b_32x32.png',
                    //origin: new google.maps.Point(0, 0),
                    iconAnchor: [16,16], //new google.maps.Point(16, 16),
                    iconSize: [32,32], //new google.maps.Size(32, 32),
                    //labelOrigin: new google.maps.Point(16,40)
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
			    icon_img= {
                    iconUrl:'./images/plane_gr_32x32.png',
                    //origin: new google.maps.Point(0, 0),
                    iconAnchor: [16,16], //new google.maps.Point(16, 16),
                    scaledSize: [32,32], //new google.maps.Size(32, 32),
                    //labelOrigin: new google.maps.Point(16,40)
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
			    icon_img= {
                    iconUrl:'./images/rtl_bb_32x32.png',
                    //origin: new google.maps.Point(0, 0),
                    iconAnchor: [16,16], //new google.maps.Point(16, 16),
                    scaledSize: [32,32], //new google.maps.Size(32, 32),
                    //labelOrigin: new google.maps.Point(16,40)
                };
                break;
            
            case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
                icon_img= {
                    iconUrl:'./images/circle_bb_32x32.png',
                    //origin: new google.maps.Point(0, 0),
                    iconAnchor: [16,23], //new google.maps.Point(16, 23),
                    scaledSize: [32,32], //new google.maps.Size(32, 32),
                    //labelOrigin: new google.maps.Point(16,40)
                };
                break;

            
        }
        
        this.props.p_shape.setIcon(L.icon(icon_img));

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
       
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false)
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

    componentDidUpdate() 
    {
        if (this.props.p_shape.m_missionItem.m_missionType === 0) this.props.p_shape.m_missionItem.m_missionType = 1;
        $('#msnaction' + this.props.p_shape.id + '_' + this.props.p_shape.m_mission.m_id + ' #msnsel').val(this.props.p_shape.m_missionItem.m_missionType);
    }
    

    render ()
    {

        var v_itemID = this.props.p_shape.id+ "_" + this.props.p_shape.m_mission.m_id;

        var v_event_firing = [];
        
        //CODEBLOCK_START
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED===false)
		{
            v_event_firing.push(<CFieldChecked  key={'f3' + v_itemID} required={this.props.p_shape.m_missionItem.eventWaitRequired === true} txtLabel='wait_event' itemid={v_itemID + 'wv'} txtValue={this.props.p_shape.m_missionItem.eventWait}  ref={instance => {this.eventWait = instance}} />)
            v_event_firing.push(<CFieldChecked  key={'f4' + v_itemID} required={this.props.p_shape.m_missionItem.eventFireRequired === true} txtLabel='fire_event' itemid={v_itemID + 'fv'} txtValue={this.props.p_shape.m_missionItem.eventFire}  ref={instance => {this.eventFire = instance}} />)
        }
        //CODEBLOCK_END

        const c_id = "msnaction"+ v_itemID;
        
        return (

        <div id={c_id} key={c_id} className="form-group text-left ">
        <label className="form-control-label text-white">To Do When Arrive </label>
        {v_event_firing}
        <CFieldChecked  key={'f1' + v_itemID} required={this.props.p_shape.m_missionItem.m_speedRequired === true} txtLabel='speed' itemid={v_itemID + 'spd'} txtValue={this.props.p_shape.m_missionItem.speed}  ref={instance => {this.speed = instance}} />
        <CFieldChecked  key={'f2' + v_itemID} required={this.props.p_shape.m_missionItem.m_yawRequired === true}  txtLabel='yaw' itemid={v_itemID + 'yaw'} txtValue={this.props.p_shape.m_missionItem.yaw}  ref={instance => {this.yaw = instance}} />
        <select id="msnsel"  className="form-control css_margin_top_small">
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF}>Take Off</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP}>Waypoint</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE}>Circle Here</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_RTL}>RTL</option>
                <option value={js_andruavMessages.CONST_WayPoint_TYPE_LANDING}>Land</option>
                </select>
        </div>);
    }

}
