/***************************************************
    30 Jul 2016
    30 Aug 2024
*****************************************************/
import * as js_helpers from "./js_helpers.js";
import { js_globals } from "./js_globals.js";
import {EVENTS as js_event} from './js_eventList.js'
import { js_eventEmitter } from "./js_eventEmitter.js";
import { js_leafletmap } from "./js_leafletmap.js";

import * as js_andruavMessages from "./js_andruavMessages.js";
import { js_andruavAuth } from "./js_andruavAuth.js";
import { ClssAndruavFencePlan } from "./js_plan_fence.js";
import { mavlink20 } from "./js_mavlink_v2.js";

/**
 * Represents a single unit plan.
 * This plan does not include fence plan.
 */
export class ClssAndruavMissionPlan {
  constructor(p_id, p_initColor) {
    if (p_id === null || p_id === undefined) throw new Error("Error Bad ID");
    this.m_id = p_id;

    // MAIN list to all markers and attached mission items.
    this.m_all_mission_items_shaps = [];

    this.m_pathColor = p_initColor;

    this.v_highLight = false;
    this.m_hidden = false;

    this.m_missionCounter = 1;
    this.m_active_mission_item_id = 0; // this is mission index
  }

  fn_highlight(v_high) {
    this.v_highLight = v_high;
    this.fn_updatePath(true);
  }

  fn_togglePath() {
    this.m_hidden ? this.fn_showMarkers() : this.fn_hideMarkers();
  }

  fn_showMarkers() {
    if (this.m_all_mission_items_shaps.length === 0) return;

    this.m_all_mission_items_shaps.forEach(p_m => {
      js_leafletmap.fn_showItem(p_m);
      if (p_m.m_next !== null && p_m.m_next !== undefined) {
        js_leafletmap.fn_showItem(p_m.m_next);
      }
    });

    this.m_hidden = false;
  }

  fn_hideMarkers() {
    if (this.m_all_mission_items_shaps.length === 0) return;

    this.m_all_mission_items_shaps.forEach(p_m => {
      js_leafletmap.fn_hideItem(p_m);
      if (p_m.m_next !== null && p_m.m_next !== undefined) {
        js_leafletmap.fn_hideItem(p_m.m_next);
      }
    });

    this.m_hidden = true;
  }

  fn_disconnectMissionItem(marker) {
    if (marker.m_next !== null && marker.m_next !== undefined) {
      js_leafletmap.fn_hideItem(marker.m_next);
    }
    marker.m_next = undefined;
    marker.distance = undefined;
  }

  fn_drawStyle(v_color) {
    if (v_color == null) return;
    this.m_pathColor = v_color;
  }

  getRelatedColor(rgbColor, permutation) {
    if (!rgbColor || rgbColor.length !== 7 || rgbColor[0] !== '#' || !permutation || permutation.length !== 3) return null;

    const [r, g, b] = [rgbColor.slice(1, 3), rgbColor.slice(3, 5), rgbColor.slice(5, 7)].map(hex => parseInt(hex, 16));
    const order = { R: r, G: g, B: b };
    const newColor = `#${permutation.toUpperCase().split('').map(p => order[p].toString(16).padStart(2, '0')).join('')}`;
    return newColor;
}

  /**
   * Draws path between markers
   * @param {*} v_enforceRedraw
   * @returns
   */
  fn_updatePath(v_enforceRedraw) {
    if (this.m_hidden) return;

    const len = this.m_all_mission_items_shaps.length;
    if (len === 0) return;

    if (len === 1) {
      this.fn_disconnectMissionItem(this.m_all_mission_items_shaps[0]);
      return;
    }

    for (let i = 0; i < len - 1; ++i) {
      const marker = this.m_all_mission_items_shaps[i];
      if (v_enforceRedraw === true) {
        this.fn_disconnectMissionItem(marker);
      }
      js_leafletmap.fn_changeBootStrapIconColor(marker, this.getRelatedColor(this.m_pathColor,'bgr'));
      if (marker.m_next == null) {
        const arrowCoordinates = {
          from_pos: marker.getLatLng(),
          to_pos: this.m_all_mission_items_shaps[i + 1].getLatLng(),
        };

        const distance = js_helpers.fn_calcDistance(
          arrowCoordinates.from_pos.lat,
          arrowCoordinates.from_pos.lng,
          arrowCoordinates.to_pos.lat,
          arrowCoordinates.to_pos.lng
        );

        marker.distance = distance;
        marker.m_next = js_leafletmap.fn_DrawPath(
          arrowCoordinates.from_pos.lat,
          arrowCoordinates.from_pos.lng,
          arrowCoordinates.to_pos.lat,
          arrowCoordinates.to_pos.lng,
          {
            color: this.m_pathColor,
            opacity: 0.8,
            weight: 4,
          }
        );
      }
    }
    
    js_leafletmap.fn_changeBootStrapIconColor(this.m_all_mission_items_shaps[len-1], this.getRelatedColor(this.m_pathColor,'bgr'));

    js_leafletmap.fn_changeBootStrapIconColor (this.m_all_mission_items_shaps[this.m_active_mission_item_id], '#ffffff');
        
      
  }

  fn_activateMissionItem(active_mission_item_id, direction) {
    if (!this.m_all_mission_items_shaps || this.m_all_mission_items_shaps.length === 0) {
      return null;
    }

    const missionCount = this.m_all_mission_items_shaps.length;
    if (active_mission_item_id < 1 || active_mission_item_id > missionCount) {
      return null;
    }

    let nextMissionOrder;
    
    
    if (direction === 'next') {
      nextMissionOrder = (active_mission_item_id % missionCount);
    } else if (direction === 'prev') {
      nextMissionOrder = ((active_mission_item_id - 2) % missionCount);
      if (nextMissionOrder < 0) {
        nextMissionOrder = missionCount + nextMissionOrder;
      }
    } else {
      nextMissionOrder = active_mission_item_id - 1; // same object ... make if active
    }

    // activate item
    this.m_active_mission_item_id = nextMissionOrder;

    return this.m_all_mission_items_shaps[nextMissionOrder];
  }

  /*
		measure distance between all markers.
	*/
  fn_getMissionDistance() {
    if (!this.m_all_mission_items_shaps || this.m_all_mission_items_shaps.length === 0) {
      return 0;
    }

    return this.m_all_mission_items_shaps.reduce((totalDistance, marker) => {
      return totalDistance + (typeof marker.distance === 'number' ? marker.distance : 0);
    }, 0);
  }

  fn_addMarker(p_marker) {
    p_marker.m_main_de_mission = this;
    p_marker.id = this.m_missionCounter;
    p_marker.order = 99;
    p_marker.m_missionItem = {
      alt: 30,
      m_missionType: js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP,
      m_frameType: mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT,
      m_speedRequired: false,
      speed: 5, // m/s
      m_yawRequired: false,
      yaw: 0,
      modules: {},
    };

    this.m_missionCounter += 1;
    // activate item
    this.m_active_mission_item_id = this.m_missionCounter;
    this.m_all_mission_items_shaps.push(p_marker);
    this.fn_orderItems();
    this.fn_updatePath();

    js_eventEmitter.fn_dispatch(js_event.EE_mapMissionUpdate, {
      mission: this,
    });
  }

  fn_loadMarker(p_marker, p_mission_item) {
    p_marker.m_main_de_mission = this;
    p_marker.id = this.m_missionCounter;
    p_marker.order = 99;
    p_marker.m_missionItem = p_mission_item;

    this.m_missionCounter += 1;
    this.m_all_mission_items_shaps.push(p_marker);
    this.fn_orderItems();
    this.fn_updatePath();

    js_eventEmitter.fn_dispatch(js_event.EE_mapMissionUpdate, {
      mission: this,
    });
  }

  /**
   *	removes a single marker.
   */
   fn_deleteMe(marker_id) {
    const indexToDelete = this.m_all_mission_items_shaps.findIndex(marker => marker.id === marker_id);
    if (indexToDelete === -1) return; // Marker not found

    // Delete the marker
    const markerToDelete = this.m_all_mission_items_shaps.splice(indexToDelete, 1)[0];
    js_leafletmap.fn_hideItem(markerToDelete);

    // Handle next marker
    if (markerToDelete.m_next !== null && markerToDelete.m_next !== undefined) {
      js_leafletmap.fn_hideItem(markerToDelete.m_next);
      markerToDelete.m_next = undefined;
      markerToDelete.distance = undefined;
    }

    // Update mission
    markerToDelete.m_main_de_mission = null;
    this.fn_orderItems();
    this.fn_updatePath(true);

    js_eventEmitter.fn_dispatch(js_event.EE_mapMissionUpdate, {
      mission: this,
    });
  }

  /**
   *	removes all markers of a single mission.
   **/
  fn_deleteAll() {
    this.m_all_mission_items_shaps.forEach(marker => {
      marker.m_main_de_mission = null;
      if (marker.m_next !== null && marker.m_next !== undefined) {
        js_leafletmap.fn_hideItem(marker.m_next);
      }
      js_leafletmap.fn_hideItem(marker);
    });

    this.m_all_mission_items_shaps = [];

    js_eventEmitter.fn_dispatch(js_event.EE_mapMissionUpdate, {
      mission: this,
    });
  }

  /**
   * Order items from 1 to mission items length
   *	Order attributes holds the real order ofmarker in the array and we need to keep them sync after any
   *	updates to mission.
   **/
  fn_orderItems() {
    const len = this.m_all_mission_items_shaps.length;
    for (let i = 1; i <= len; ++i) {
      let smallest_item = this.m_all_mission_items_shaps[0];
      for (let j = 0; j < len; ++j) {
        if (
          (this.m_all_mission_items_shaps[j].order < smallest_item.order &&
            this.m_all_mission_items_shaps[j].order >= i) ||
          smallest_item.order < i
        ) {
          smallest_item = this.m_all_mission_items_shaps[j];
        }
      }

      smallest_item.order = i;
      if (
        smallest_item.EVT_onShapeUpdated !== null &&
        smallest_item.EVT_onShapeUpdated !== undefined
      ) {
        smallest_item.EVT_onShapeUpdated(smallest_item);
      }
    }
  }

  fn_exportToJSONAndruav(p_missionV110, p_andruavUnit) {
    const c_party = p_andruavUnit != null ? p_andruavUnit.partyID : null;

    if (this.m_all_mission_items_shaps.length === 0) return;

    // Delete Old Shapes
    if (p_missionV110 !== null && p_missionV110 !== undefined) {
      if (
        js_globals.v_andruavWS !== null &&
        js_globals.v_andruavWS !== undefined &&
        js_globals.v_andruavWS.fn_isRegistered() === true
      ) {
        js_globals.v_andruavFacade.API_requestDeleteFenceByName(c_party, null); // deattach drones from all fences in the group
        js_globals.v_andruavFacade.API_disableWayPointTasks(
          js_andruavAuth.m_username,
          js_globals.v_andruavWS.m_groupName,
          c_party,
          "_drone_",
          1
        );
        js_globals.v_andruavFacade.API_saveWayPointTasks(
          js_andruavAuth.m_username,
          js_globals.v_andruavWS.m_groupName,
          c_party,
          "_drone_",
          1,
          p_missionV110
        );
      }
    }
  }

  fn_getModuleTaskByLinkedMavlink(p_linked_mavlinked, p_module) {
    // Find the module that matches the given linked mavlink
    const module = p_module.find(mod => mod.ls === p_linked_mavlinked);
    // If the module is found, return its tasks; otherwise, return null or an empty array
    return module ? (module.c.length > 0 ? module.c : null) : null;
  }

  fn_importAsDE_V1 (p_andruavUnit, p_plan_text)
  {
      if (p_plan_text['fileType'] !== 'de_plan') return ;

      const me_mission = p_plan_text['de_mission'];
      const mav_waypoints = me_mission['mav_waypoints'];
      const modules = me_mission['modules'];

      let temp_missionItem = {};

      const len = mav_waypoints.length;
      for (let i = 0; i < len; ++i) {
        const maypoint = mav_waypoints[i];
        
        const cmd = maypoint['c'];
        const mavlink = maypoint['mv'];
              
        switch (cmd)
        {

          case mavlink20.MAV_CMD_DO_SET_SERVO:
          {
            if (mavlink[0] === 16)
              { // FIRE EVENT
                temp_missionItem.eventFireRequired = true;
                temp_missionItem.eventFire = mavlink[1];
              }
            if (mavlink[0] === 15)
            { // WAIT FOR EVENT
                temp_missionItem.eventWaitRequired = true;
                temp_missionItem.eventWait = mavlink[1];
            }
          }
          break;

        case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
          const cmds = this.fn_getModuleTaskByLinkedMavlink((i + 1).toString(), modules);
          const new_marker = js_leafletmap.fn_addMarkerManually([mavlink[4], mavlink[5]], js_leafletmap);
          const p_mission_item = {
            alt: 30,
            m_missionType: js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP,
            m_frameType: mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT,
            m_speedRequired: false,
            speed: 5, // m/s
            m_yawRequired: false,
            yaw: 0,
            modules: {
              compiled_cmds: cmds
            },
          };

          this.fn_loadMarker(new_marker, p_mission_item);
          break;

        case mavlink20.MAV_CMD_DO_CHANGE_SPEED:
          temp_missionItem.m_speedRequired = true;
          temp_missionItem.speed = mavlink[0];
          break;

        case mavlink20.MAV_CMD_CONDITION_YAW:
          temp_missionItem.m_yawRequired = true;
          temp_missionItem.yaw = mavlink[0];
          break;
      }
    }
  }

  /**
   * Export fences as json text in DE-format - similar to QGC
   * Note: fences are handles out of Ardupilot.
   */
  fn_exportFencesToDE_V1() {
    const v = new ClssAndruavFencePlan(1);
    return v.fn_generateAndruavFenceData(js_globals.v_map_shapes);
  }

  /**
   * Exports mission as json text in DE-format - similar to QGC.
   * @param {*} andruavUnit : can be null
   * @returns
   */
  fn_exportToDE_V1(andruavUnit) {
    let output_plan = {
      fileType: "de_plan",
      unit: {
        partyID: 0,
        unitName: "General",
        vehichleType: "NA",
      },
      version: 1,

      de_geoFence: {},

      de_mission: {
        "mav_waypoints": [],
        "modules": [],
      },
    };

    if (andruavUnit != null) {
      output_plan["unit"]["partyID"] = andruavUnit.partyID;
      output_plan["unit"]["unitName"] = andruavUnit.m_unitName;
      output_plan["unit"]["vehichleType"] = andruavUnit.m_VehicleType;
      const home_point = andruavUnit.m_Geo_Tags.p_HomePoint;
      if (home_point.m_isValid === true) {
        output_plan["unit"]["home"] = {
          'lat': home_point.lat,
          'lng': home_point.lng,
          'alt': 0, //home_point.alt,
          'ft': mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT,
        };
      }
    }

    output_plan["de_geoFence"] = this.fn_exportFencesToDE_V1();

    const len = this.m_all_mission_items_shaps.length;
    let mission_steps = [];
    let module_steps = [];

    const fn_addMissionItem = function (marker, cmd, m_paramsArray) {
      let step = {
        'c': cmd,
        'ft': marker.m_missionItem.m_frameType,
        'mv': m_paramsArray,
      };
      mission_steps.push(step);
    };

    // Add Module mission item
    const fn_addModuleItem = function (cmd, linked_step, eventFire, eventWait) {
      let step = {
        'c': cmd
      };

      if (linked_step !== null && linked_step !== undefined) {
        step.ls = linked_step.toString();
      }
      if (eventFire !== null && eventFire !== undefined) {
        step.ef = eventFire.toString();
      }

      if (eventWait !== null && eventWait !== undefined) {
        step.ew = eventWait.toString();
      }

      module_steps.push(step);
    };

    let skip = false;
    let mission_drift = 0;
    let mission_item_latest = 0;
    for (let i = 0; i < len; ++i) {
      skip = false;
      let marker = this.m_all_mission_items_shaps[i];

      const eventFireRequired = marker.m_missionItem.eventFireRequired;
      const eventWaitRequired = marker.m_missionItem.eventWaitRequired;
      const eventFire = marker.m_missionItem.eventFire;
      const eventWait = marker.m_missionItem.eventWait;

      if (marker.m_missionItem.m_missionType !== js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP_DE.toString()) {
        mission_drift += 1; // mission starts from 1 because 0 is home.
        if (eventWaitRequired === true) {
          // WAITING EVENT SHOULD BE THE FIRST THING

          // wait event will use servo (15) as default or other suitable servo channel.
          /*
              MAV_CMD_DO_SET_SERVO	mavlink20.MAV_CMD_DO_SET_SERVO Set a servo to a desired PWM value.
              Mission Param #1	Servo instance number.
              Mission Param #2	Pulse Width Modulation.
              Mission Param #3	Empty
              Mission Param #4	Empty
              Mission Param #5	Empty
              Mission Param #6	Empty
              Mission Param #7	Empty
            */

          fn_addMissionItem(marker, mavlink20.MAV_CMD_DO_SET_SERVO, [
            15,
            parseInt(eventWait), // param1
            0, // param2
            0,
            0,
            0,
            0,
          ]);
          
          // then insert MAV_CMD_NAV_DELAY
          /*
              MAV_CMD_NAV_DELAY	mavlink20.MAV_CMD_NAV_DELAY Delay the next navigation command a number of seconds or until a specified time
              1: Delay	Delay (-1 to enable time-of-day fields)	min: -1 increment:1	s
              2: Hour	hour (24h format, UTC, -1 to ignore)	min: -1 max:23 increment:1	
              3: Minute	minute (24h format, UTC, -1 to ignore)	min: -1 max:59 increment:1	
              4: Second	second (24h format, UTC, -1 to ignore)	min: -1 max:59 increment:1	
              5	Empty		
              6	Empty		
              7	Empty
            */

          fn_addMissionItem(marker, mavlink20.MAV_CMD_NAV_DELAY, [
            0,
            1, // param1 - Delay 1 hour
            0, // param2
            0,
            0,
            0,
            0,
          ]);

          mission_drift += 2;
        }

        switch (parseInt(marker.m_missionItem.m_missionType)) {
          case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
            fn_addMissionItem(marker, js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP, [
              0,
              5,
              0,
              0.0,
              marker.getLatLng().lat,
              marker.getLatLng().lng,
              parseFloat(marker.m_missionItem.alt),
            ]);
            break;

        case mavlink20.MAV_CMD_NAV_TAKEOFF:
            fn_addMissionItem(marker, mavlink20.MAV_CMD_NAV_TAKEOFF, [
              0.0,
              0.0,
              0.0,
              0.0,
              marker.getLatLng().lat,
              marker.getLatLng().lng,
              parseFloat(marker.m_missionItem.alt),
            ]);
            fn_addMissionItem(marker, js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP, [
              0,
              5,
              0,
              0.0,
              marker.getLatLng().lat,
              marker.getLatLng().lng,
              parseFloat(marker.m_missionItem.alt),
            ]);

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

          case mavlink20.MAV_CMD_NAV_LAND:
            fn_addMissionItem(marker, mavlink20.MAV_CMD_NAV_LAND, [
              0.0,
              0.0,
              0.0,
              0.0,
              marker.getLatLng().lat,
              marker.getLatLng().lng,
              parseFloat(marker.m_missionItem.alt),
            ]);

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

          case mavlink20.MAV_CMD_NAV_GUIDED_ENABLE:
            fn_addMissionItem(marker, js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP, [
              0,
              5,
              0,
              0.0,
              marker.getLatLng().lat,
              marker.getLatLng().lng,
              parseFloat(marker.m_missionItem.alt),
            ]);
            fn_addMissionItem(marker, mavlink20.MAV_CMD_NAV_GUIDED_ENABLE, [
              1,
              0,
              0.0,
              0.0,
              0.0,
              0.0,
              0.0
            ]);
            break;

          case mavlink20.MAV_CMD_NAV_RETURN_TO_LAUNCH:
            fn_addMissionItem(marker, js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP, [
              0,
              5,
              0,
              0.0,
              marker.getLatLng().lat,
              marker.getLatLng().lng,
              parseFloat(marker.m_missionItem.alt),
            ]);
            fn_addMissionItem(marker, mavlink20.MAV_CMD_NAV_RETURN_TO_LAUNCH, [
              0,
              0,
              0.0,
              0.0,
              0.0,
              0.0,
              0.0
            ]);

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
						nextstep.cmd = 20; << MAV_CMD_NAV_RETURN_TO_LAUNCH
						nextstep.param1 = 0.0;
						nextstep.param2 = 0.0;
						nextstep.param3 = 0.0;
						nextstep.param4 = 0.0;
						nextstep.param5 = 0.0;
						nextstep.param6 = 0.0;
						nextstep.param7 = 0.0; 							
					*/
          break;
      }

      mission_item_latest = mission_drift;
      if (skip === true) continue;
      
      if (marker.m_missionItem.m_speedRequired === true) {
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

          fn_addMissionItem(marker, mavlink20.MAV_CMD_DO_CHANGE_SPEED, [
            1,
            marker.m_missionItem.speed,
            1,
            0.0,
            0,
            0,
            0,
            0,
          ]);

          ++mission_drift;
        }

      if (marker.m_missionItem.m_yawRequired === true) {
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

          fn_addMissionItem(marker, mavlink20.MAV_CMD_CONDITION_YAW, [
            marker.m_missionItem.yaw, // param1
            0, // defalt speed [AUTO_YAW_SLEW_RATE]
            0, // direction is not effectve in absolute degree
            0, // absolute heading
            0,
            0,
            0,
          ]);

          ++mission_drift;
        }

        if (eventFireRequired === true) {
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

          fn_addMissionItem(marker, mavlink20.MAV_CMD_DO_SET_SERVO, [
            16,
            parseInt(eventFire), // param1
            0, // param2
            0,
            0,
            0,
            0,
          ]);

          ++mission_drift;
        }
      }

      const keys = Object.keys(marker.m_missionItem.modules);

      if (marker.m_missionItem.modules === null || marker.m_missionItem.modules === undefined) continue;
      const cmds = [];
      for (let key in marker.m_missionItem.modules) {
        const m = marker.m_missionItem.modules[key];
        if (m.cmds !== null && m.cmds !== undefined) {
          for (let key2 in m.cmds) {
            const single_cmd = m.cmds[key2];
            if (single_cmd === null || single_cmd === undefined) continue;
            cmds.push(single_cmd);
          }
        }
      }

      if (cmds === null || cmds === undefined) continue;

      if (marker.m_missionItem.m_missionType === js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP_DE.toString()) {
        fn_addModuleItem(cmds, null,
          eventFireRequired === true ? eventFire : null,
          eventWaitRequired === true ? eventWait : null
        );
      } else {
        fn_addModuleItem(cmds, mission_item_latest,
          eventFireRequired === true ? eventFire : null,
          eventWaitRequired === true ? eventWait : null
        );
      }
    }

    output_plan.de_mission['mav_waypoints'] = mission_steps;
    output_plan.de_mission.modules = module_steps;

    return JSON.stringify(output_plan);
  }

  /**
   * Exports Mission as text file in V110 format understood by Mission Planner & DroneAPI
   */
  fn_exportToV110() {
    let len = this.m_all_mission_items_shaps.length;
    let mission_steps = [];

    const fn_addMissionItem = function (marker, cmd, m_paramsArray) {
      let step = {};
      step.cmd = cmd;
      step.m_frameType = marker.m_missionItem.m_frameType;
      step.m_paramsArray = m_paramsArray;
      mission_steps.push(step);
    };

    let skip = false;
    for (let i = 0; i < len; ++i) {
      skip = false;
      let marker = this.m_all_mission_items_shaps[i];
      let step = {};

      if (marker.m_missionItem.eventWaitRequired === true) {
        // WAITING EVENT SHOULD BE THE FIRST THING

        // wait event will use servo (15) as default or other suitable servo channel.
        /*
					MAV_CMD_DO_SET_SERVO	mavlink20.MAV_CMD_DO_SET_SERVO Set a servo to a desired PWM value.
					Mission Param #1	Servo instance number.
					Mission Param #2	Pulse Width Modulation.
					Mission Param #3	Empty
					Mission Param #4	Empty
					Mission Param #5	Empty
					Mission Param #6	Empty
					Mission Param #7	Empty
				*/

        fn_addMissionItem(marker, mavlink20.MAV_CMD_DO_SET_SERVO, [
          15,
          marker.m_missionItem.eventWait, // param1
          0, // param2
          0,
          0,
          0,
          0,
        ]);

        // then insert MAV_CMD_NAV_DELAY
        /*
					MAV_CMD_NAV_DELAY	mavlink20.MAV_CMD_NAV_DELAY Delay the next navigation command a number of seconds or until a specified time
					1: Delay	Delay (-1 to enable time-of-day fields)	min: -1 increment:1	s
					2: Hour	hour (24h format, UTC, -1 to ignore)	min: -1 max:23 increment:1	
					3: Minute	minute (24h format, UTC, -1 to ignore)	min: -1 max:59 increment:1	
					4: Second	second (24h format, UTC, -1 to ignore)	min: -1 max:59 increment:1	
					5	Empty		
					6	Empty		
					7	Empty
				*/

        fn_addMissionItem(marker, mavlink20.MAV_CMD_NAV_DELAY, [
          0,
          1, // param1
          0, // param2
          0,
          0,
          0,
          0,
        ]);
      }

      switch (marker.m_missionItem.m_missionType) {
        case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
          fn_addMissionItem(marker, js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP, [
            0,
            5,
            0,
            0.0,
            marker.getLatLng().lat,
            marker.getLatLng().lng,
            marker.m_missionItem.alt,
          ]);
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
          fn_addMissionItem(marker, 22, [
            0.0,
            0.0,
            0.0,
            0.0,
            marker.getLatLng().lat,
            marker.getLatLng().lng,
            marker.m_missionItem.alt,
          ]);
          fn_addMissionItem(marker, js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP, [
            0,
            5,
            0,
            0.0,
            marker.getLatLng().lat,
            marker.getLatLng().lng,
            marker.m_missionItem.alt,
          ]);

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
          fn_addMissionItem(marker, 21, [
            0.0,
            0.0,
            0.0,
            0.0,
            marker.getLatLng().lat,
            marker.getLatLng().lng,
            marker.m_missionItem.alt,
          ]);

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
          fn_addMissionItem(marker, js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP, [
            0,
            5,
            0,
            0.0,
            marker.getLatLng().lat,
            marker.getLatLng().lng,
            marker.m_missionItem.alt,
          ]);
          fn_addMissionItem(marker, 20, [0, 0, 0.0, 0.0, 0.0, 0.0, 0.0]);

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

      if (marker.m_missionItem.m_speedRequired === true) {
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

        fn_addMissionItem(marker, 178, [
          1,
          marker.m_missionItem.speed,
          1,
          0.0,
          0,
          0,
          0,
          0,
        ]);
      }

      if (marker.m_missionItem.m_yawRequired === true) {
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

        fn_addMissionItem(marker, 115, [
          marker.m_missionItem.yaw, // param1
          0, // defalt speed [AUTO_YAW_SLEW_RATE]
          0, // direction is not effectve in absolute degree
          0, // absolute heading
          0,
          0,
          0,
        ]);
      }

      if (marker.m_missionItem.eventFireRequired === true) {
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

        fn_addMissionItem(marker, mavlink20.MAV_CMD_DO_SET_SERVO, [
          16,
          marker.m_missionItem.eventFire, // param1
          0, // param2
          0,
          0,
          0,
          0,
        ]);
      }

    }

    len = mission_steps.length;
    let MissionText = "QGC WPL 110\r\n";
    mission_steps.forEach((step, j) => {
      let startWith = j > 0 ? 0 : 1;
      let line =
        j + "\t" + startWith + "\t" + step.m_frameType + "\t" + step.cmd + "\t";

      for (let k = 0; k < 7; ++k) {
        line += step.m_paramsArray[k] + "\t";
      }

      line += "1\r\n";

      MissionText += line;
    });

    return MissionText;
  }
}