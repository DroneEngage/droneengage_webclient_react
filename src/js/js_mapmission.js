/***************************************************

	30 Jul 2016

*****************************************************/
import * as js_helpers from './js_helpers'
import {js_globals} from './js_globals.js';
import {js_eventEmitter} from './js_eventEmitter'
import {js_leafletmap} from './js_leafletmap'

import * as js_andruavMessages from './js_andruavMessages'

import { mavlink20 } from './js_mavlink_v2.js';


export class CLSS_AndruavFencePlan
{
	constructor (p_id/*, p_initColor*/)
	{
		if (p_id === null) throw new Error('Error Bad ID');
		this.m_id = p_id;
		this.v_markers = [];

		//this.m_pathColor = p_initColor;

		this.v_highLight = false;
		this.m_hidden = false;
	}
	
	static getInstance() {
        if (!CLSS_AndruavFencePlan.instance) {
            CLSS_AndruavFencePlan.instance = new CLSS_AndruavFencePlan(1);
        }
        return CLSS_AndruavFencePlan.instance;
    }

    fn_generateAndruavFenceData(shapes)
	{
		var shapesData = [];
		const len = js_globals.v_map_shapes.length;
			
		for (var i=0; i< len; ++i)
		{
				
			var cmd={};
			const c_shape = shapes[i];
				
			if (c_shape.m_geofenceInfo.m_deleted === true) continue;
				
			cmd.n = c_shape.m_geofenceInfo.m_geoFenceName;
			cmd.a = c_shape.m_geofenceInfo.isHardFence;
			cmd.o = c_shape.m_geofenceInfo.m_shouldKeepOutside?1:0;
			cmd.r = parseInt(c_shape.m_geofenceInfo.m_maximumDistance);
			var lnglat = {};
			switch (c_shape.pm.getShape())
			{
				case 'Marker':
				break;
					
				case 'Polygon':
				{
					cmd.t = js_andruavMessages.FENCETYPE_PolygonFence;
					const c_lnglats = c_shape.getLatLngs()[0];

					const len_lnglat = c_lnglats.length;

					for (let j=0; j<len_lnglat; ++j)
					{
						
						lnglat.a = c_lnglats[j].lat * 10000000;
						lnglat.g = c_lnglats[j].lng * 10000000;
						cmd[j] = lnglat;
					}

					cmd.c = 4;					
				}
				break;

				case 'Rectangle':
				{
					cmd.t = js_andruavMessages.FENCETYPE_PolygonFence;
					const c_boundary = c_shape.getBounds();

					lnglat.a = c_boundary._northEast.lat;
					lnglat.g = c_boundary._northEast.lng;
					cmd[0] = lnglat;

					lnglat = {};
					lnglat.a = c_boundary._southWest.lat;
					lnglat.g = c_boundary._northEast.lng;
					cmd[1] = lnglat;

					lnglat = {};
					lnglat.a = c_boundary._southWest.lat;
					lnglat.g = c_boundary._southWest.lng;
					cmd[2] = lnglat;

					lnglat = {};
					lnglat.a = c_boundary._northEast.lat;
					lnglat.g = c_boundary._southWest.lng;
					cmd[3] = lnglat;

						
					cmd.c = 4;					
				}
				break;

				case 'Circle':
				{
					cmd.t = js_andruavMessages.FENCETYPE_CylindersFence;
					const c_center = c_shape.getLatLng();
					
					lnglat.a = c_center.lat;
					lnglat.g = c_center.lng;
					cmd["0"] = lnglat;
					cmd.c=1;
				}
				break;
				
				case 'Line':
				{
					cmd.t = js_andruavMessages.FENCETYPE_LinearFence;
					const c_lnglats = c_shape.getLatLngs();

					const len_lnglat = c_lnglats.length;

					for (let j=0; j<len_lnglat;++j)
					{
						lnglat.a = c_lnglats[j].lat;
						lnglat.g = c_lnglats[j].lng;
						cmd[j] = lnglat;
					}

					cmd.c = len_lnglat;
				}
				break;

				default:
						
				break;
			}

			shapesData.push(cmd);
		}

		return shapesData;
	}
}

class CLSS_AndruavMissionPlan 
{

	constructor (p_id, p_initColor)
	{
		if (p_id === null) throw new Error('Error Bad ID');
		this.m_id = p_id;
		this.v_markers = [];

		this.m_pathColor = p_initColor;

		this.v_highLight = false;
		this.m_hidden = false;
	}


	fn_highlight (v_high)
	{
		this.v_highLight = v_high;
		this.fn_updatePath(true);
	}


	fn_togglePath ()
	{
		if (this.m_hidden === true)
		{
			this.fn_showMarkers();
		}
		else
		{
			this.fn_hideMarkers();
		}
	}

	fn_showMarkers ()
	{
		const v_len =this.v_markers.length;
		if (v_len ===0) return ;

		for (let i=0;i<v_len;++i)
		{
			let p_m = this.v_markers[i];
			js_leafletmap.fn_showItem(p_m);

			if (p_m.m_next != null)
			{
				js_leafletmap.fn_showItem(p_m.m_next);
			}
		}

		this.m_hidden = false;
	}


	/**
	*	Hide path from map.
	**/
	fn_hideMarkers ()
	{
		const v_len = this.v_markers.length;
		
		if (v_len === 0) return ;

		for (let i=0;i<v_len;++i)
		{
			
			let p_m = this.v_markers[i];
			// delete marker
			js_leafletmap.fn_hideItem(p_m);

			if (p_m.m_next != null)
			{	// delete line
				js_leafletmap.fn_hideItem(p_m.m_next);
			}

		}

		this.m_hidden = true;
	}


	fn_disconnectMissionItem (marker)
	{
		if (marker.m_next != null)
		{
			js_leafletmap.fn_hideItem(marker.m_next);
		}
		marker.m_next 	= undefined;
		marker.distance = undefined;
	};

	fn_drawStyle (v_color)
	{
		if (v_color == null)  
		{
			return ;
		}
		
		this.m_pathColor = v_color;
	}

	/**
	 * Draws path between markers
	 * @param {*} v_enforceRedraw 
	 * @returns 
	 */
	fn_updatePath (v_enforceRedraw) 
	{
		if (this.m_hidden) return ;
		
		var len = this.v_markers.length;
		if (len === 0)
		{
			return ;
		}

		if (len === 1)
		{
			this.fn_disconnectMissionItem (this.v_markers[0]);
			return ;
		}

		len = len - 1;
				
		// Disconnect Last Node [distance = 0 and make ure no arrow]
		var marker;
		marker = this.v_markers[len];
				
		//this.fn_disconnectMissionItem (marker);

		for (var i=0; i<len; ++i)
		{
			marker = this.v_markers[i];
			if ((v_enforceRedraw === true))
			{
				this.fn_disconnectMissionItem (marker);
			}
			
			if (marker.m_next == null)
			{
				var arrowCoordinates = {
							'from_pos': marker.getLatLng(),
							'to_pos': this.v_markers[i+1].getLatLng()	
				};

				var distance = js_helpers.fn_calcDistance(arrowCoordinates.from_pos.lat, arrowCoordinates.from_pos.lng,
					arrowCoordinates.to_pos.lat, arrowCoordinates.to_pos.lng);
						
				marker.distance = distance;
				marker.m_next = js_leafletmap.fn_DrawPath (arrowCoordinates.from_pos.lat, arrowCoordinates.from_pos.lng,
					arrowCoordinates.to_pos.lat, arrowCoordinates.to_pos.lng,
					{
						color: this.m_pathColor,
						opacity: 0.8,
						weight: 4
					});
			}
		}
	}

	/*
		measure distance between all markers.
	*/
	fn_getMissionDistance ()
	{
		var distance = 0;
		var len = this.v_markers.length;
		for (var i=0; i<len; ++i)
		{
			var marker = this.v_markers[i];
			if (marker.distance != null)
			{
				distance  += marker.distance;
			}
		}
		
		return distance;
	}

	/**
	*	Creates a default marker.
	*/
	fn_addMarker (p_marker)
	{
		p_marker.m_mission = this;
		p_marker.id = this.m_missionCounter;
		p_marker.order = 99;
		p_marker.m_missionItem = {
			alt:30,
			m_missionType:js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP,
			m_frameType: mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT,
			m_speedRequired: false,
			speed: 5,  // m/s
			m_yawRequired: false,
			yaw: 0
		};
				
		this.m_missionCounter+=1;
		this.v_markers.push (p_marker);
		this.fn_orderItems();
		this.fn_updatePath();

		   
        js_eventEmitter.fn_dispatch(js_globals.EE_mapMissionUpdate,{mission:this});
				
	};

			
	/**
	*	removes a single marker.
	*/
	fn_deleteMe (marker)
	{
		var len = this.v_markers.length;
		for (var i =0;i<len;++i)
		{
			if (this.v_markers[i].id === marker.id)
			{
				this.v_markers.splice(i,1);
				js_leafletmap.fn_hideItem(marker);
				if (marker.m_next != null)
				{	
					js_leafletmap.fn_hideItem(marker.m_next);
					marker.m_next = undefined;
					marker.distance = undefined;
				}
				
				marker.m_mission = null;
				this.fn_orderItems();
				this.fn_updatePath(true);
				break;
			}
        }
                
        js_eventEmitter.fn_dispatch(js_globals.EE_mapMissionUpdate,{mission:this});
	};

			
			
	/**
	*	removes all markers of a single mission.
	**/
	fn_deleteAll ()
	{
		var len = this.v_markers.length;
		for (var i =0;i<len;++i)
		{
			var marker = this.v_markers[i];
			marker.m_mission = null;
			if (marker.m_next != null)
			{
				js_leafletmap.fn_hideItem(marker.m_next);
			}
			
			js_leafletmap.fn_hideItem(marker);
			//marker.EVT_onShapeDeleted(marker);
		}

        this.v_markers = [];
                
        js_eventEmitter.fn_dispatch(js_globals.EE_mapMissionUpdate,{mission:this});
	};

	/**
	* Order items from 1 to mission items length
	*	Order attributes holds the real order ofmarker in the array and we need to keep them sync after any 
	*	updates to mission.
	**/
	fn_orderItems ()
	{
		var len = this.v_markers.length;
		var j = 0;
		for (var i=1; i<=len; ++i)
		{
			var smallest_item = this.v_markers[0];
			for (j=0; j<len; ++j)
			{
				if (((this.v_markers[j].order < smallest_item.order)
					&& (this.v_markers[j].order >= i))
					||(smallest_item.order <i))
				{
					smallest_item = this.v_markers[j];
				}
			}
			
			smallest_item.order = i;
			if (smallest_item.EVT_onShapeUpdated != null)
			{
				smallest_item.EVT_onShapeUpdated(smallest_item);
			}
		}
	};


	

	fn_exportToJSONAndruav (p_missionV110, p_PartyID)
	{
		if (this.v_markers.length ===0)	 return;
		
		// var v_cmd = CLSS_AndruavResala_WayPoints.fn_toJSON(this.v_markers);
		
		// Delete Old Shapes
		if (p_missionV110 != null)
		{
			if ((js_globals.v_andruavClient != null) && (js_globals.v_andruavClient.fn_isRegistered()===true))
			{
				js_globals.v_andruavClient.API_requestDeleteWayPoint(p_PartyID,null); // deattach drones from all fences in the group
				js_globals.v_andruavClient.API_disableWayPointTasks(window.AndruavLibs.AndruavAuth.m_username,js_globals.v_andruavClient.m_groupName,p_PartyID,'_drone_',1);
				js_globals.v_andruavClient.API_saveWayPointTasks(window.AndruavLibs.AndruavAuth.m_username,js_globals.v_andruavClient.m_groupName,p_PartyID,'_drone_',1,p_missionV110);
			}
		}
	};

	/**
	* Exports Mission as text file in V110 format understood by Mission Planner & DroneAPI
	*/
	fn_exportToV110 ()
	{
		let len = this.v_markers.length;
		var missionSteps = [];
				
		var fn_addMissionItem = function (marker, cmd,m_paramsArray)
		{
			step = {};
			step.cmd = cmd;
			step.m_frameType = marker.m_missionItem.m_frameType;
			step.m_paramsArray = m_paramsArray;
			missionSteps.push (step);
		}

		var skip = false;
		for (var i =0;i<len;++i)
		{
			skip = false;
			var marker = this.v_markers[i];
			var step={};
			var nextstep = {};
			switch (marker.m_missionItem.m_missionType)
			{
				case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
					fn_addMissionItem(marker,16,[0,5,0,0.0,marker.getLatLng().lat,marker.getLatLng().lng,marker.m_missionItem.alt]);
					/*step.id = missionCounter;
						step.cmd = 16;
						step.frameType =e.g. mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT;
						step.param1 = 0; // Hold time in decimal seconds. (ignored by fixed wing, time to stay at waypoint for rotary wing)
						step.param2 = 5; // Acceptance radius in meters (if the sphere with this radius is hit, the waypoint counts as reached)
						step.param3 = 0; // 0 to pass through the WP, if > 0 radius in meters to pass by WP. Positive value for clockwise orbit, negative value for counter-clockwise orbit. Allows trajectory control.
						step.param4 = 0.0; 
						step.param5 = marker.getLatLng().lat;
						step.param6 = marker.getLatLng().lng;
						step.param7 = marker.m_missionItem.alt;
					*/
					break;
				case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
					fn_addMissionItem(marker,22,[0.0,0.0,0.0,0.0,marker.getLatLng().lat,marker.getLatLng().lng,marker.m_missionItem.alt]);
					fn_addMissionItem(marker,16,[0,5,0,0.0,marker.getLatLng().lat,marker.getLatLng().lng,marker.m_missionItem.alt]);
							
					/*step.id = missionCounter;
						step.cmd = 22;
						step.frameType =e.g. mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT;
						step.param1 = 0.0;
						step.param2 = 0.0;
						step.param3 = 0.0;
						step.param4 = 0.0;
						step.param5 = marker.getLatLng().lat;
						step.param6 = marker.getLatLng().lng;
						step.param7 = marker.m_missionItem.alt;
					*/
					break;
				case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
					fn_addMissionItem(marker,21,[0.0,0.0,0.0,0.0,marker.getLatLng().lat,marker.getLatLng().lng,marker.m_missionItem.alt]);
					
					/*step.id = missionCounter;
						step.cmd = 21;
						step.frameType =e.g. mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT;
						step.param1 = 0.0;
						step.param2 = 0.0;
						step.param3 = 0.0;
						step.param4 = 0.0;
						step.param5 = marker.getLatLng().lat;
						step.param6 = marker.getLatLng().lng;
						step.param7 = marker.m_missionItem.alt;
					*/
					break;
				case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
					fn_addMissionItem(marker,16,[0,5,0,0.0,marker.getLatLng().lat,marker.getLatLng().lng,marker.m_missionItem.alt]);
					fn_addMissionItem(marker,20,[0,0,0.0,0.0,0.0,0.0,0.0]);
							
					/*step.id = missionCounter;
						step.cmd = 16;
						step.frameType =e.g. mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT;
						step.param1 = 0; // Hold time in decimal seconds. (ignored by fixed wing, time to stay at waypoint for rotary wing)
						step.param2 = 5; // Acceptance radius in meters (if the sphere with this radius is hit, the waypoint counts as reached)
						step.param3 = 0; // 0 to pass through the WP, if > 0 radius in meters to pass by WP. Positive value for clockwise orbit, negative value for counter-clockwise orbit. Allows trajectory control.
						step.param4 = 0.0; 
						step.param5 = marker.getLatLng().lat;
						step.param6 = marker.getLatLng().lng;
						step.param7 = marker.m_missionItem.alt;

						nextstep.id = missionCounter;
						nextstep.cmd = 20;
						nextstep.param1 = 0.0;
						nextstep.param2 = 0.0;
						nextstep.param3 = 0.0;
						nextstep.param4 = 0.0;
						nextstep.param5 = 0.0;
						nextstep.param6 = 0.0;
						nextstep.param7 = 0.0; 							
					*/
					break;
				case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
					break;
				
				default:
					skip = true;
					break;
			}
			
			if (skip === true) continue;
                    

			if (marker.m_missionItem.m_speedRequired === true)
			{
				// add speed command
				/*
					MAV_CMD_DO_CHANGE_SPEED	Change speed and/or throttle set points.
					Mission Param #1	Speed type (0=Airspeed, 1=Ground Speed)
					Mission Param #2	Speed (m/s, -1 indicates no change)
					Mission Param #3	Throttle ( Percent, -1 indicates no change)
					Mission Param #4	absolute or relative [0,1]
					Mission Param #5	Empty
					Mission Param #6	Empty
					Mission Param #7	Empty
				*/
				
				fn_addMissionItem(marker,178,[1,
					marker.m_missionItem.speed,
					1,
					0.0,
					0,
					0,
					0,
					0]);
						
			}

			if (marker.m_missionItem.m_yawRequired === true)
			{
				// add speed command
				/*
					MAV_CMD_CONDITION_YAW	Reach a certain target angle.
					Mission Param #1	target angle: [0-360], 0 is north
					Mission Param #2	speed during yaw change:[deg per second]
					Mission Param #3	direction: negative: counter clockwise, positive: clockwise [-1,1]
					Mission Param #4	relative offset or absolute angle: [ 1,0]
					Mission Param #5	Empty
					Mission Param #6	Empty
					Mission Param #7	Empty
				*/

				fn_addMissionItem(marker,115,[
					marker.m_missionItem.yaw, // param1
					0, // defalt speed [AUTO_YAW_SLEW_RATE]
					0, // direction is not effectve in absolute degree
					0, // absolute heading
					0,
					0,
					0]);
							
			}

			if (marker.m_missionItem.eventFireRequired === true)
			{
				// fire event will use servo (16) as default or other suitable servo channel.
				/*
					MAV_CMD_DO_SET_SERVO	Set a servo to a desired PWM value.
					Mission Param #1	Servo instance number.
					Mission Param #2	Pulse Width Modulation.
					Mission Param #3	Empty
					Mission Param #4	Empty
					Mission Param #5	Empty
					Mission Param #6	Empty
					Mission Param #7	Empty
				*/

				fn_addMissionItem(marker,183,[16,
					marker.m_missionItem.eventFire,	// param1
					0, // param2
					0, 
					0, 
					0,
					0]);
							
			}

			if (marker.m_missionItem.eventWaitRequired === true)
			{
				// wait event will use servo (15) as default or other suitable servo channel.
				/*
					MAV_CMD_DO_SET_SERVO	183 Set a servo to a desired PWM value.
					Mission Param #1	Servo instance number.
					Mission Param #2	Pulse Width Modulation.
					Mission Param #3	Empty
					Mission Param #4	Empty
					Mission Param #5	Empty
					Mission Param #6	Empty
					Mission Param #7	Empty
				*/

				fn_addMissionItem(marker,183,[15, 
					marker.m_missionItem.eventWait, // param1
					0, // param2
					0, 
					0, 
					0,
					0]);

				// then insert MAV_CMD_NAV_DELAY 
				/*
					MAV_CMD_NAV_DELAY	93 Delay the next navigation command a number of seconds or until a specified time
					1: Delay	Delay (-1 to enable time-of-day fields)	min: -1 increment:1	s
					2: Hour	hour (24h format, UTC, -1 to ignore)	min: -1 max:23 increment:1	
					3: Minute	minute (24h format, UTC, -1 to ignore)	min: -1 max:59 increment:1	
					4: Second	second (24h format, UTC, -1 to ignore)	min: -1 max:59 increment:1	
					5	Empty		
					6	Empty		
					7	Empty
				*/
				
				fn_addMissionItem(marker,93,[0,
					1, 							// param1
					0, 							// param2
					0, 
					0, 
					0,0]);
							
			}
		}
		
		len = missionSteps.length;
		var MissionText = "QGC WPL 110\r\n";
		for (var j=0; j<len; ++j)
		{
			step = missionSteps[j];
			var startWith = j>0?0:1;
			var line = j +"\t" + startWith + "\t"+ step.m_frameType+  "\t" + step.cmd + "\t";
					
			for (var k =0;k< 7; ++ k)
			{
				line += step.m_paramsArray[k] + "\t";
			}

			line += "1\r\n";

			MissionText += line;
						
		}
				
		return MissionText;
	};
	 
}


class CLSS_AndruavMissionPlanManager 
{
	constructor ()
	{
		this.m_missionPlans = {};
		this.m_activePlan = null;
		this.m_missionCounter =1; 
	}

	fn_createNewMission ()
	{
		const c_initColor = js_globals.v_colorDrawPathes[this.m_missionCounter%js_globals.v_colorDrawPathes.length];
		var v_missionPlan = new CLSS_AndruavMissionPlan (this.m_missionCounter, c_initColor);
		this.m_missionPlans[this.m_missionCounter] = v_missionPlan;
		this.m_missionCounter = this.m_missionCounter + 1;

		
		return v_missionPlan;
	}

	fn_deleteMission (v_id2)
	{
		if (this.m_missionPlans.hasOwnProperty(v_id2) === false)
		{
			return ;
		}

		let v_missionPlan = this.m_missionPlans[v_id2];
		v_missionPlan.fn_deleteAll ();
		delete this.m_missionPlans[v_id2];
	}

	fn_getCurrentMission()
	{
		return this.m_activePlan;
	}


	fn_activateNextMission (v_id2)
	{
		var p_keys = Object.keys(this.m_missionPlans);
		if ((p_keys === undefined) || (p_keys ===null) || (p_keys.length ===0))
		{
			return null;
		}

		var p_len = p_keys.length;
		var p_index =0;
		
		for (var i=0;i<p_len;++i)
		{
			if (p_keys[i] === v_id2)
			{
				p_index = (i + 1) % p_keys.length;
				var v_mission = this.m_missionPlans[p_keys[p_index]];
				this.fn_setCurrentMission (v_mission.m_id);
				return v_mission;
			}
		}
		
	}

	fn_setCurrentMission (v_id1)
	{
		if (this.m_missionPlans.hasOwnProperty(v_id1) == false)
		{
			return ;
		}
		
		if (this.m_activePlan != null)
		{
			// unselect the old one.
			this.m_activePlan.fn_highlight (false);
		}

		this.m_activePlan = this.m_missionPlans[v_id1];
		this.m_activePlan.fn_highlight (true);
	}


	fn_showAllMarkers (v_map1)
	{
		
		var v_missionPlans = Object.values(this.m_missionPlans);
		v_missionPlans.map(x => x.fn_showMarkers(v_map1));
		
	};

}


export default CLSS_AndruavFencePlan.getInstance();