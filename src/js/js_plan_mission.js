/***************************************************

	30 Jul 2016
    30 Aug 2024

*****************************************************/
import * as js_helpers from './js_helpers.js'
import {js_globals} from './js_globals.js';
import {js_eventEmitter} from './js_eventEmitter.js'
import {js_leafletmap} from './js_leafletmap.js'

import * as js_andruavMessages from './js_andruavMessages.js'
import {js_andruavAuth} from './js_andruavAuth.js'
import {ClssAndruavFencePlan} from  './js_plan_fence.js'
import { mavlink20 } from './js_mavlink_v2.js';


/**
 * Represents a single unit plan.
 * This plan does not include fence plan.
 */
export class ClssAndruavMissionPlan 
{

	constructor (p_id, p_initColor)
	{
		if (p_id === null  || p_id === undefined) throw new Error('Error Bad ID');
		this.m_id = p_id;
		this.v_markers = [];

		this.m_pathColor = p_initColor;

		this.v_highLight = false;
		this.m_hidden = false;

		this.m_missionCounter =1;
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
		if (v_len === 0) return ;

		for (let i=0;i<v_len;++i)
		{
			let p_m = this.v_markers[i];
			js_leafletmap.fn_showItem(p_m);

			if (p_m.m_next !== null && p_m.m_next !== undefined)
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

			if (p_m.m_next !== null && p_m.m_next !== undefined)
			{	// delete line
				js_leafletmap.fn_hideItem(p_m.m_next);
			}

		}

		this.m_hidden = true;
	}


	fn_disconnectMissionItem (marker)
	{
		if (marker.m_next !== null && marker.m_next !== undefined)
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
		let marker;
		marker = this.v_markers[len];
				
		//this.fn_disconnectMissionItem (marker);

		for (let i=0; i<len; ++i)
		{
			marker = this.v_markers[i];
			if ((v_enforceRedraw === true))
			{
				this.fn_disconnectMissionItem (marker);
			}
			
			if (marker.m_next == null)
			{
				let arrowCoordinates = {
							'from_pos': marker.getLatLng(),
							'to_pos': this.v_markers[i+1].getLatLng()	
				};

				let distance = js_helpers.fn_calcDistance(arrowCoordinates.from_pos.lat, arrowCoordinates.from_pos.lng,
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
		let distance = 0;
		let len = this.v_markers.length;
		for (let i=0; i<len; ++i)
		{
			let marker = this.v_markers[i];
			if (marker.distance !== null && marker.distance !== undefined)
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
		let len = this.v_markers.length;
		for (let i =0;i<len;++i)
		{
			if (this.v_markers[i].id === marker.id)
			{
				this.v_markers.splice(i,1);
				js_leafletmap.fn_hideItem(marker);
				if (marker.m_next !== null && marker.m_next  !== undefined)
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
		let len = this.v_markers.length;
		for (let i =0;i<len;++i)
		{
			var marker = this.v_markers[i];
			marker.m_mission = null;
			if (marker.m_next !== null && marker.m_next !== undefined)
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
		let len = this.v_markers.length;
		let j = 0;
		for (let i=1; i<=len; ++i)
		{
			let smallest_item = this.v_markers[0];
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
			if (smallest_item.EVT_onShapeUpdated !== null && smallest_item.EVT_onShapeUpdated !== undefined)
			{
				smallest_item.EVT_onShapeUpdated(smallest_item);
			}
		}
	};


	

	fn_exportToJSONAndruav (p_missionV110, p_PartyID)
	{
		if (this.v_markers.length === 0)	 return;
		
		// Delete Old Shapes
		if (p_missionV110 !== null && p_missionV110 !== undefined)
		{
			if ((js_globals.v_andruavClient !== null && js_globals.v_andruavClient !== undefined) && (js_globals.v_andruavClient.fn_isRegistered() === true))
			{
				js_globals.v_andruavClient.API_requestDeleteWayPoint(p_PartyID,null); // deattach drones from all fences in the group
				js_globals.v_andruavClient.API_disableWayPointTasks(js_andruavAuth.m_username,js_globals.v_andruavClient.m_groupName,p_PartyID,'_drone_',1);
				js_globals.v_andruavClient.API_saveWayPointTasks(js_andruavAuth.m_username,js_globals.v_andruavClient.m_groupName,p_PartyID,'_drone_',1,p_missionV110);
			}
		}
	};

	/**
	 * Export fences as json text in DE-format - similar to QGC
	 * Note: fences are handles out of Ardupilot.
	 */
	fn_exportFencesToDE_V1 ()
	{
		const v = new ClssAndruavFencePlan(1);
        const fence_res = v.fn_generateAndruavFenceData(js_globals.v_map_shapes);
        
		return fence_res;
	}

	/**
	 * Exports mission as json text in DE-format - similar to QGC.
	 * @param {*} andruavUnit : can be null
	 * @returns 
	 */
	fn_exportToDE_V1 (andruavUnit)
	{
		let output_plan = 
		{
			"fileType": "de_plan",
			"unit": 
			{
				"partyID": 0,
				"unitName": "General",
				"vehichleType": "NA"
			},
			"version": 1,

			"de_geoFence": {
				
			},

			"de_mission": {
			},
			
		};

		if (andruavUnit!= null)	
		{
			output_plan["unit"]["partyID"] = andruavUnit.partyID;
			output_plan["unit"]["unitName"] = andruavUnit.m_unitName;
			output_plan["unit"]["vehichleType"] = andruavUnit.m_VehicleType;
		}

		output_plan["de_geoFence"] = this.fn_exportFencesToDE_V1 ();
		
		const len = this.v_markers.length;
		let missionSteps = [];
		
		const fn_addMissionItem = function (marker, cmd, m_paramsArray)
		{
			let step = {
				'cmd': cmd,
				'frameType': marker.m_missionItem.m_frameType,
				'mavlink': m_paramsArray,
			};
			missionSteps.push (step);
		}

		let skip = false;
		for (let i =0;i<len;++i)
		{
			skip = false;
			let marker = this.v_markers[i];
			let step={};
			switch (marker.m_missionItem.m_missionType)
			{
				case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
				{
					fn_addMissionItem(marker,16,[0,5,0,0.0,marker.getLatLng().lat,marker.getLatLng().lng,marker.m_missionItem.alt]);
				}
				break;

				case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
				{
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
				}
				break;
				
				case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
				{
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
				}
				break;
				
				case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
				{
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
				}
				break;
				
				
			}
		}

		output_plan["de_mission"] = missionSteps;
		
		return JSON.stringify(output_plan);
	}


	/**
	* Exports Mission as text file in V110 format understood by Mission Planner & DroneAPI
	*/
	fn_exportToV110 ()
	{
		let len = this.v_markers.length;
		let missionSteps = [];
				
		const fn_addMissionItem = function (marker, cmd, m_paramsArray)
		{
			let step = {};
			step.cmd = cmd;
			step.m_frameType = marker.m_missionItem.m_frameType;
			step.m_paramsArray = m_paramsArray;
			missionSteps.push (step);
		}

		let skip = false;
		for (let i=0; i<len; ++i)
		{
			skip = false;
			let marker = this.v_markers[i];
			let step={};
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
		let MissionText = "QGC WPL 110\r\n";
		for (let j=0; j<len; ++j)
		{
			let step = missionSteps[j];
			let startWith = j>0?0:1;
			let line = j +"\t" + startWith + "\t"+ step.m_frameType+  "\t" + step.cmd + "\t";
					
			for (let k =0;k< 7; ++ k)
			{
				line += step.m_paramsArray[k] + "\t";
			}

			line += "1\r\n";

			MissionText += line;
						
		}
				
		return MissionText;
	};
	 
}