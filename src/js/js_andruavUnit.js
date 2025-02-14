/*************************************************************************************
 *
 *   A N D R U A V - C L I E N T       JAVASCRIPT  LIB
 *
 *   Author: Mohammad S. Hefny
 *
 *   Date:   09 December 2015
 *
 *   Update: Date:   23 Jul 2016
 *
 *
 *
 *
 *
 *************************************************************************************/
/*jshint esversion: 6 */

import { js_globals } from "./js_globals.js";
import * as js_andruavMessages from "./js_andruavMessages";
import * as js_circularBuffer from "./js_circularBuffer";
import { mavlink20 } from "./js_mavlink_v2.js";

// Vehicle Types
export const VEHICLE_UNKNOWN = 0;
export const VEHICLE_TRI = 1;
export const VEHICLE_QUAD = 2;
export const VEHICLE_PLANE = 3;
export const VEHICLE_ROVER = 4;
export const VEHICLE_HELI = 5;
export const VEHICLE_BOAT = 6;
export const VEHICLE_SUBMARINE = 12;
export const VEHICLE_GIMBAL = 15;
export const VEHICLE_VTOL = 16;
export const VEHICLE_BUS = 997;
export const VEHICLE_PERSON = 998;
export const CONST_VEHICLE_GCS = 999;
export const CONTROL_UNIT = 10001;


//m_enum_userStatus
export const CONST_ALIVE = 1;
export const CONST_SUSPECTED = 2;
export const CONST_DISCONNECTED = 3;

// VIDEORECORDING
export const CONST_VIDEORECORDING_OFF = 0;
export const CONST_VIDEORECORDING_ON = 1;
export const CONST_VIDEOSTREAMING_OFF = 0;
export const CONST_VIDEOSTREAMING_ON = 1;

// Flight Control Modes
export const CONST_FLIGHT_CONTROL_RTL = 2;
// Flight Follow Me
export const CONST_FLIGHT_CONTROL_FOLLOW_ME = 3;
// param1:  Longitude:  Master position
// param2:  Latitude
// param3(opt):  Radius:             minimum approach to master.
// param4(opt):  Offset_Longitude:   used to make a fleet formation
// param5(opt):  Offset_Latitude:    used to make a fleet formation

// Flight Follow A Unit... The message is sent to the Master Unit
// and forwarded to the secondary one as a Follow_ME command.
export const CONST_FLIGHT_CONTROL_FOLLOW_UNITED = 4;
// UNIT_ID: unit to follow.
// Below commands are forwarded to Slave
// param1:  Longitude:  Master position
// param2:  Latitude
// param3(opt):  Radius:             minimum approach to master.
// param4(opt):  Offset_Longitude:   used to make a fleet formation
// param5(opt):  Offset_Latitude:    used to make a fleet formation

// Flight Auto [Mission UAV]
export const CONST_FLIGHT_CONTROL_AUTO = 5;
export const CONST_FLIGHT_CONTROL_STABILIZE = 6;
export const CONST_FLIGHT_CONTROL_ALT_HOLD = 7;
export const CONST_FLIGHT_CONTROL_MANUAL = 8; // Manual
export const CONST_FLIGHT_CONTROL_GUIDED = 9;
export const CONST_FLIGHT_CONTROL_LOITER = 10;
export const CONST_FLIGHT_CONTROL_POSTION_HOLD = 11;
export const CONST_FLIGHT_CONTROL_LAND = 12;
export const CONST_FLIGHT_CONTROL_CIRCLE = 13;
export const CONST_FLIGHT_CONTROL_FBWA = 14;
export const CONST_FLIGHT_CONTROL_CRUISE = 15;
export const CONST_FLIGHT_CONTROL_FBWB = 16;
export const CONST_FLIGHT_CONTROL_BRAKE = 17;
export const CONST_FLIGHT_CONTROL_SMART_RTL = 21;
export const CONST_FLIGHT_CONTROL_TAKEOFF = 22;
export const CONST_FLIGHT_CONTROL_QHOVER = 23;
export const CONST_FLIGHT_CONTROL_QLOITER = 24;
export const CONST_FLIGHT_CONTROL_QSTABILIZE = 25;
export const CONST_FLIGHT_CONTROL_QLAND = 26;
export const CONST_FLIGHT_CONTROL_QRTL = 27;
export const CONST_FLIGHT_CONTROL_ACRO = 28;
export const CONST_FLIGHT_CONTROL_INITIALIZE = 99;
export const CONST_FLIGHT_CONTROL_HOLD = 100;
export const CONST_FLIGHT_CONTROL_SURFACE = 101;
export const CONST_FLIGHT_MOTOR_DETECT = 102;
export const CONST_FLIGHT_PX4_MANUAL = 200;
export const CONST_FLIGHT_PX4_ALT_HOLD = 201;
export const CONST_FLIGHT_PX4_AUTO_TAKEOFF = 202;
export const CONST_FLIGHT_PX4_AUTO_MISSION = 203;
export const CONST_FLIGHT_PX4_AUTO_HOLD = 204;
export const CONST_FLIGHT_PX4_AUTO_RTL = 205;
export const CONST_FLIGHT_PX4_AUTO_LAND = 206;
export const CONST_FLIGHT_PX4_AUTO_FOLLOW_TARGET = 207;
export const CONST_FLIGHT_PX4_AUTO_PRECLAND = 208;
export const CONST_FLIGHT_PX4_VTOL_TAKEOFF = 209;
export const CONST_FLIGHT_PX4_ACRO = 210;
export const CONST_FLIGHT_PX4_STABILIZE = 211;
export const CONST_FLIGHT_PX4_OFF_BOARD = 212;
export const CONST_FLIGHT_PX4_RATTITUDE = 213;
export const CONST_FLIGHT_PX4_POSCTL_POSCTL = 214;
export const CONST_FLIGHT_PX4_POSCTL_ORBIT = 215;
export const CONST_FLIGHT_CONTROL_UNKNOWN = 999;



export function fn_getFullName(m_groupName, p_partyID) {
  //return m_groupName.replace(" ","_") + "_X_" + partyID.replace(" ","_");

  return p_partyID; // partyID is unique
}



class C_Obstacles {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_obstacles = [];
  }

  fn_addObstacle ()
  {

  }

}
class C_Video {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_videoactiveTracks = {};
    this.m_videoTracks = [];
  }

  // returns CONST_VIDEOSTREAMING_OFF is ALL tracks are OFF
  fn_getVideoStreaming() {
    const c_activeTracks = Object.keys(this.m_videoactiveTracks);
    if (c_activeTracks.length === 0) {
      // NO ACTIVE VIDEOS ARE DEFINED
      return CONST_VIDEOSTREAMING_OFF;
    }
    const len = c_activeTracks.length;
    for (let i = 0; i < len; ++i) {
      if (
        this.m_videoactiveTracks[c_activeTracks[i]].VideoStreaming ===
        CONST_VIDEOSTREAMING_ON
      ) {
        // ONE TRACK IS ACTIVE
        return CONST_VIDEOSTREAMING_ON;
      }
    }

    return CONST_VIDEOSTREAMING_OFF;
  }

  supportFlashing(index) {
    const track = this.m_videoTracks[index];
    if (track === null || track === undefined) return false;

    if (track.hasOwnProperty("s") === true) {
      // new format
      return track.s & js_andruavMessages.CONST_CAMERA_SUPPORT_FLASHING;
    }
    if (track.hasOwnProperty("f") === true) {
      // both flashing & dual camera uses f field om Andruav
      return track.f;
    }
    return false;
  }

  supportCameraSwitch(index) {
    const track = this.m_videoTracks[index];
    if (track === null || track === undefined) return false;

    if (track.hasOwnProperty("s") === true) {
      // new format
      return track.s & js_andruavMessages.CONST_CAMERA_SUPPORT_DUAL_CAM;
    }
    if (track.hasOwnProperty("f") === true) {
      // both flashing & dual camera uses f field om Andruav
      return track.f;
    }
    return false;
  }

  supportZoom(index) {
    const track = this.m_videoTracks[index];
    if (track === null || track === undefined) return false;

    if (track.hasOwnProperty("s") === true) {
      // new format
      return track.s & js_andruavMessages.CONST_CAMERA_SUPPORT_ZOOMING;
    }
    if (track.hasOwnProperty("z") === true) {
      return track.f;
    }
    return false;
  }

  supportRotation(index) {
    const track = this.m_videoTracks[index];
    if (track === null || track === undefined) return false;

    if (track.hasOwnProperty("s") === true) {
      // new format
      return track.s & js_andruavMessages.CONST_CAMERA_SUPPORT_ROTATION;
    }
    if (track.hasOwnProperty("z") === true) {
      return track.f;
    }
    return false;
  }

  isAllActive() {
    const c_activeTracks = Object.keys(this.m_videoactiveTracks);
    if (
      c_activeTracks.length === 0 ||
      this.m_videoTracks.length > c_activeTracks.length
    ) {
      // NO ACTIVE VIDEOS ARE DEFINED OR NOT ALL ARE ACTIVE
      return false;
    }

    const len = c_activeTracks.length;
    let j = 0;
    let i = 0;
    for (i = 0; i < len; ++i) {
      if (
        this.m_videoactiveTracks[c_activeTracks[i]].VideoStreaming ===
        CONST_VIDEOSTREAMING_ON
      ) {
        // ON TRACK IS ACTIVE
        j += 1;
      }
    }

    return j === i;
  }

  fn_getVideoRecording() {
    const c_activeTracks = Object.keys(this.m_videoactiveTracks);

    if (this.VideoRecording === CONST_VIDEOSTREAMING_ON) {
      return CONST_VIDEOSTREAMING_ON;
    }

    if (c_activeTracks.length === 0) {
      // NO ACTIVE VIDEOS ARE DEFINED
      return CONST_VIDEOSTREAMING_OFF;
    }
    const len = c_activeTracks.length;
    for (let i = 0; i < len; ++i) {
      if (
        this.m_videoactiveTracks[c_activeTracks[i]].VideoRecording ===
        CONST_VIDEOSTREAMING_OFF
      ) {
        // ON TRACK IS ACTIVE
        return CONST_VIDEOSTREAMING_ON;
      }
    }

    return CONST_VIDEOSTREAMING_OFF;
  }
}

class C_NavInfo {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.p_Location = {
      alt_relative: null, // MAVLINK_MSG_ID_GLOBAL_POSITION_INT.relative_alt ... Altitude above ground - or baro alt if GPS is not available
      alt_abs: null, // MAVLINK_MSG_ID_GLOBAL_POSITION_INT.alt  ... Altitude (MSL). Note that virtually all GPS modules provide both WGS84 and MSL.
      air_speed: null, // MAVLINK_MSG_ID_VFR_HUD.airspeed ... Vehicle speed in form appropriate for vehicle type. For standard aircraft this is typically calibrated airspeed (CAS) or indicated airspeed (IAS) - either of which can be used by a pilot to estimate stall speed.
      ground_speed: null, // MAVLINK_MSG_ID_VFR_HUD.ground_speed ... float (m/s) ... Note HIGH_LATENCY uses unit8 m/s*5
    };
    this.p_Orientation = {
      roll: 0.0, // MAVLINK_MSG_ID_ATTITUDE.nav_roll ... rad ... Roll angle (-pi..+pi)
      pitch: 0.0, // MAVLINK_MSG_ID_ATTITUDE.nav_pitch ... rad ... Pitch angle (-pi..+pi)
      yaw: 0.0, // MAVLINK_MSG_ID_ATTITUDE.nav_yaw ... rad ... Yaw angle (-pi..+pi)
      roll_speed: 0.0, // MAVLINK_MSG_ID_ATTITUDE.rollspeed ... float	rad/s	Roll angular speed
      pitch_speed: 0.0, // MAVLINK_MSG_ID_ATTITUDE.pitchspeed ... float	rad/s	Pitch angular speed
      yaw_speed: 0.0, // MAVLINK_MSG_ID_ATTITUDE.yawspeed ... float	rad/s	Yaw angular speed
    };

    this.p_Desired = {
      nav_roll: 0.0, // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.nav_roll 		float	 deg	Current desired roll
      nav_pitch: 0.0, // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.nav_pitch 		float	 deg	Current desired pitch
      nav_bearing: 0.0, // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.nav_bearing 	int16_t	 deg	Current desired heading
    };

    this._Target = {
      target_bearing: 0.0, // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.target_bearing  int16_t	 deg	Current desired waypoint/target
      mission_state: mavlink20.MISSION_STATE_UNKNOWN, // (MISSION_STATE)
      //mission_mode: 0  , // 0: Unknown, 1: In mission mode, 2: Suspended (not in mission mode).
      wp_count: 0, // MAVLINK_MSG_ID_MISSION_COUNT.count
      wp_dist: 0, // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.wp_dist  		uint16_t  m		Distance to active waypoint
      wp_num: 0, // MAVLINK_MSG_ID_MISSION_CURRENT.seq
      alt_error: 0.0, // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.alt_error 		float	  m		Current altitude error
    };

    this.p_UserDesired = {
      m_NavSpeed: 0.0, // user desired speed..requested from web
    };
    // flight path as points (lng,lat,alt)
    this.m_FlightPath = [];
  }
}

class C_GeoTags {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.p_HomePoint = { m_isValid: false };
    this.p_DestinationPoint = {
      m_isValid: false,
      m_needsIcon: false,
    };
  }

  fn_addDestinationPoint(p_lat, p_lng, p_alt, p_type) {
    if (this.p_DestinationPoint.type !== p_type) {
      // type has changed so we need a new icon.
      this.p_DestinationPoint.m_needsIcon = true;
      this.p_DestinationPoint.type = p_type;
    }
    this.p_DestinationPoint.lat = p_lat;
    this.p_DestinationPoint.lng = p_lng;
    this.p_DestinationPoint.alt = p_alt;
    this.p_DestinationPoint.m_isValid = true;
  }
}

class C_DetectedTargets {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_targets = { m_list: [] };
    this.m_searchable_targets = {};
  }
}

class C_FCBParameters {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_systemID = 0;
    this.m_componentID = 0;
    this.m_list = {};
    this.m_list_by_index = {};
    this.m_list_by_index_shadow = {};
  }
}
class C_Swarm {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_isLeader = false;
    this.m_formation_as_leader =
      js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM;
    this.m_formation_as_follower =
      js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM;
    this.m_following = null;
  }
}

class C_SignalStatus {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_websocket = false;
    this.m_wifi = false;
    this.m_mobile = false;
    this.m_mobileSignalLevel = 0;
    this.m_mobileNetworkType = 0;
    this.m_mobileNetworkTypeRank = 0;
  }
}
class C_P2P {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_initialized = false;
    this.m_address_1 = "";
    this.m_address_2 = "";
    this.m_wifi_channel = 0;
    this.m_wifi_password = "";
    this.m_firmware = "";
    this.m_connection_type = js_andruavMessages.CONST_TYPE_UNKNOWN;
    this.m_parent_address = "";
    this.m_parent_connected = false;
    this.m_logical_parent_address = "";
    this.m_detected_bssid = {};
    this.m_detected_node = {};
    this.m_driver_connected = false;
    // there is a p2p module available.
    this.m_p2p_connected = false;
    // there is a p2p module but p2p communication is paused.
    this.m_p2p_disabled = true;
  }

  fn_isMyMac(mac) {
    if (mac === this.m_address_1 || mac === this.m_address_2) return true;

    return false;
  }
}


class C_SDR {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_initialized = false;
    this.m_type = '';
    this.m_center_frequency = 0.0;
    this.m_interval = 0.0;
    this.m_trigger_level = 0.0;
    this.m_sample_rate = 0.0;
    this.m_gain = 0.0;
    this.m_driver = '';
    this.m_driver_index = 0;
    this.m_display_bars = 30;
    this.m_status = js_andruavMessages.CONST_SDR_STATUS_NOT_CONNECTED;
    this.m_available_drivers = {};
    this.m_spectrum_data = [];
    this.m_detectedSignal = [];
    this.m_detectedSignal_new = false;
  }

  getLastSpectrum() {
    if (this.m_spectrum_data.length > 0) {
      return this.m_spectrum_data[this.m_spectrum_data.length - 1];
    } else {
      return null;
    }
  }

  addDetectedSignal(frequency, signal_value, longitude, latitude, altitude, relative_altitude, signal_direction)
  {
    let reading = 
    {
      frequency: frequency,
      signal_value: signal_value,
      longitude:longitude,
      latitude:latitude,
      altitude:altitude,
      relative_altitude:relative_altitude,
      signal_direction:signal_direction
    }

    Object.seal(reading);

    this.m_detectedSignal.push(reading);
    this.m_detectedSignal_new = true;
    // Ensure the array length is within the maximum limit
    if (this.m_detectedSignal.length > js_globals.CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH) {
      this.m_detectedSignal = this.m_detectedSignal.slice(-js_globals.CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH);
  }

  }

  getLastDetectedSignal() {
    if (this.m_detectedSignal_new === true && this.m_detectedSignal.length > 0) {
      this.m_detectedSignal_new = false;
      return this.m_detectedSignal[this.m_detectedSignal.length - 1];
    } else {
      return null;
    }
  }

  addSpectrumData(p_info, p_data)
  {   
    let spectrumData = {
      frequency_min: p_info.fcm,
      frequency_step: p_info.fcst,
      time: p_info.tim,
      spectrum_data: p_data
    }

    Object.seal(spectrumData);
    
    this.m_spectrum_data.push(spectrumData); // Add the new data to the array

    // Ensure the array length is within the maximum limit
    if (this.m_spectrum_data.length > js_globals.CONST_MAX_SDR_SPECTRUM_LENGTH) {
        this.m_spectrum_data = this.m_spectrum_data.slice(-js_globals.CONST_MAX_SDR_SPECTRUM_LENGTH);
    }
  }
}

class C_Servo {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_values = {};
  }
}

class C_Power {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this._Mobile = {
      p_Battery: {
        p_hasPowerInfo: false,
      },
    };

    this._FCB = {
      p_Battery: {
        p_hasPowerInfo: false,
        FCB_BatteryVoltage: 0.0,
        FCB_BatteryCurrent: 0.0,
        FCB_BatteryRemaining: 0.0,
        FCB_BatteryTemprature: 0.0,
        FCB_TotalCurrentConsumed: 0.0,
      },
      p_Battery2: {
        p_hasPowerInfo: false,
        FCB_BatteryVoltage: 0.0,
        FCB_BatteryCurrent: 0.0,
        FCB_BatteryRemaining: 0.0,
        FCB_BatteryTemprature: 0.0,
        FCB_TotalCurrentConsumed: 0.0,
      },
    };
  }
}

class C_Telemetry {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this._isActive = false;
    this.m_isGCSBlocked = false;
    this.manualTXBlockedSubAction = 0;
    this.m_rxEngaged = false; // defined locally
    this.m_telemetry_level = 0;
    this.m_udpProxy_ip = null;
    this.m_udpProxy_port = 0;
    this.m_udpProxy_active = false;
    this.m_udpProxy_paused = false;
  }

  fn_getManualTXBlockedSubAction() {
    return this.manualTXBlockedSubAction; // defined by remote unit
  }

  fn_updateTelemetry(p_manualTXBlockedSubAction) {
    this.manualTXBlockedSubAction = p_manualTXBlockedSubAction;
    // if (manualTXBlockedSubAction === js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED)
    // {   // release rx if engaged
    // 	//this.m_rxEngaged = false;
    // }
    // NOTICE STATUS MIGHT BE:
    // CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS but it could be controlled by another channel.
  }
}

class C_GPS {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_isValid = false;
    this.m_satCount = 0;
  }
}

export class C_TerrainEntry {
  constructor(
    lat = null,
    lon = null,
    spacing = null,
    terrain_height,
    current_height
  ) {
    this.m_lat = lat; // optional 	invalud = null
    this.m_lon = lon; // optional 	invalud = null
    this.m_spacing = spacing; //optional 	invalud = null
    this.m_terrain_height = terrain_height; // m - Terrain height MSL
    this.m_current_height = current_height; // m - Current vehicle height above lat/lon terrain height
  }
}
class C_Terrain {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_isValid = false;
    this._index = 0;
    this.__terrain_entry = [];
    this.last_terrain_entry = null;
  }

  add(terrain_entry) {
    if (terrain_entry === null || terrain_entry === undefined) return;

    this.last_terrain_entry = terrain_entry;
    this.m_isValid = true;
    // if (this._index ==100 ) this._index = 0;
    // this.__terrain_entry.push(terrain_entry);
    // this._index+=1;
  }
}

class C_EKF {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_isValid = false;
    this.m_velocity_variance = 0;
    this.m_pos_horiz_variance = 0;
    this.m_pos_vert_variance = 0;
    this.m_compass_variance = 0;
    this.m_terrain_alt_variance = 0;
    this.m_airspeed_variance = 0;
    this.m_flags = 0;
  }
}

class C_Vibration {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_isValid = false;
    this.m_vibration_x = 0;
    this.m_vibration_y = 0;
    this.m_vibration_z = 0;
    this.m_clipping_0 = 0;
    this.m_clipping_1 = 0;
    this.m_clipping_2 = 0;
  }
}

class C_DistanceSensor {
  constructor(p_parent, p_orientation) {
    this.m_parent = p_parent;
    this.m_orientation = p_orientation; //MAV_SENSOR_ORIENTATION_ENUM_END
    this.m_isValid = false;
    this.m_last_access = null;
    this.m_min_distance = 0;
    this.m_max_distance = 0;
    this.m_current_distance = 0;
  }

  update (p_mavlink_distance_sensor) {
    this.m_orientation = p_mavlink_distance_sensor.orientation; //MAV_SENSOR_ORIENTATION_ENUM_END
    this.m_isValid = true;
    this.m_min_distance = p_mavlink_distance_sensor.min_distance ;  // cm
    this.m_max_distance = p_mavlink_distance_sensor.max_distance ;  // cm
    this.m_current_distance = p_mavlink_distance_sensor.current_distance ;  // cm

    const now = new Date();
    this.m_last_access = now ;

    this.m_parent.m_last_access = now ;
  }

}

class C_LidarInfo {
  constructor (p_parent)
  {
    this.m_parent = p_parent;
    this.m_distance_sensors = [];
    this.m_last_access = new Date();
    this.m_any_valid = false;
    for (let i = 0; i <= 40; ++i) {
      this.m_distance_sensors.push(new C_DistanceSensor(this, i));
    }
  }

  update (mavlink_distance_sensor)
  {
    const orientation = mavlink_distance_sensor.orientation;
    
    if (orientation >=40) return ;  
                    
    this.m_distance_sensors[orientation].update(mavlink_distance_sensor);
    this.m_any_valid = true;
  }

  get(p_orientation)
  {
    return  this.m_distance_sensors[p_orientation];
  }

  anyValidDataExists ()
  {
    const now = new Date();
    return ((this.m_any_valid === true) && (now - this.m_last_access) < 5000);
  }
}

class C_GUIHelper {
  constructor(p_parent) {
    this.m_parent = p_parent;
    // actual lines on map
    this.m_gui_flightPath = new js_circularBuffer.ClssCustomCircularBuffer(
      js_globals.CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT
    );
    this.m_wayPoint_markers = [];
    this.m_wayPoint_polygons = [];
    this.m_marker = null;
    this.m_marker_destination = null;
    this.speed_link = false;
  }
}

class C_GPIO {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_gpios = {};
  }

  addGPIO(gpio_array) {
    // Ensure gpio_array is an array
    if (!Array.isArray(gpio_array)) {
      console.error("Invalid input: gpio_array must be an array.");
      return;
    }

    /*
     Json_de json_gpio = {
        {"b", gpio.pin_number},
        {"m", gpio.pin_mode},
        {"t", gpio.gpio_type},
        {"v", gpio.pin_value},
        {"d", gpio.pwm_width}
      };


    * PIN_MODE
    * *    INPUT			        0
    * *    OUTPUT			        1
    * *    PWM_OUTPUT		      2
    * *    PWM_MS_OUTPUT	    8
    * *    PWM_BAL_OUTPUT     9
    * *    GPIO_CLOCK		      3
    * *    SOFT_PWM_OUTPUT		4
    * *    SOFT_TONE_OUTPUT	  5
    * *    PWM_TONE_OUTPUT		6
    * *    PM_OFF		          7   // to input / release line
    *
    */
      gpio_array.forEach(gpio => {
        // Ensure required properties exist
        if (gpio.b === undefined) {
          console.warn("GPIO object missing required properties:", gpio);
          return;
        }
  
        const gpio_obj = {
          pin_number: gpio.b,
          pin_mode: gpio.m,
          gpio_type: gpio.t,
          pin_value: gpio.v,
          pin_name: gpio.n,
          pwm_width: gpio.d==null?0:gpio.d, 
        };
  
        this.m_gpios[gpio.b] = gpio_obj;
      });
    }
}

class C_Modules {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.has_fcb = false;
    this.has_camera = false;
    this.has_sound = false;
    this.has_gpio = false;
    this.has_p2p = false;
    this.has_sdr = false;
    this.m_list = [];
  }

  addModules(jsonModules) {

    // Ensure jsonModules is an array
    if (!Array.isArray(jsonModules)) {
      console.error("Invalid input: jsonModules must be an array.");
      return;
    }

    // check uavos_camera_plugin
    /*
		{"v", module_item->version},
		{"i", module_item->module_id},
		{"c", module_item->module_class},
		{"t", module_item->time_stamp},
		{"d", module_item->is_dead},
		*/
    jsonModules.forEach(module => {
      switch (module.c.toLowerCase()) {
        case js_andruavMessages.TYPE_MODULE_CLASS_FCB:
          this.has_fcb = true;
          break;

        case js_andruavMessages.TYPE_MODULE_CLASS_GPIO:
          this.has_gpio = true;
          break;

        case js_andruavMessages.TYPE_MODULE_CLASS_SOUND:
          this.has_sound = true;
          break;

        case js_andruavMessages.TYPE_MODULE_CLASS_P2P:
					this.has_p2p = true;	
				  break;
          
        case js_andruavMessages.TYPE_MODULE_CLASS_SDR:
          this.has_sdr = true;	
          break;
            
        default:
          console.warn(`Unknown module class: ${module.c}`);
          break;
      }
    });

    this.m_list = jsonModules;
  }
}
/**
 * Handles message counters.
 */
class C_Messages {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.fn_reset();
  }

  fn_addMavlinkMsg(message_mavlin) {
    if (
      this.m_messages_in_mavlink.hasOwnProperty(message_mavlin.name) === false
    ) {
      this.m_messages_in_mavlink[message_mavlin.name] = 1;
    } else {
      ++this.m_messages_in_mavlink[message_mavlin.name];
    }
  }

  /**
   * message type counter.
   * @param {*} message_id
   */
  fn_addMsg(message_id) {
    if (this.m_messages_in.hasOwnProperty(message_id) === false) {
      this.m_messages_in[message_id] = 1;
    } else {
      ++this.m_messages_in[message_id];
    }
  }

  /**
   * Stores messages status to know what message is sent to or from this unit so we can ignore repeated messages.
   * @param {*} message_id message id
   * @param {*} interval_ms send it every ms
   * @param {*} from_time last time sent .
   */
  fn_doNotRepeatMessageBefore(message_id, interval_ms, from_time) {
    this.m_messages_repeat[message_id] = {
      interval_ms: interval_ms,
      timestamp: from_time,
    };
  }

  /**
   * Test if a message can be processed, sent or ignored.
   * if true then can be added or can be re-send.
   * @param {*} message_id
   * @returns
   */
  fn_sendMessageAllowed(message_id) {
    const data = this.m_messages_repeat[message_id];
    if (data === null  || data === undefined) return true;

    const can_send = new Date() - data.from_time > data.interval_ms;
    return can_send;
  }

  fn_reset() {
    this.m_messages_repeat = {};
    this.m_messages_in = {};
    this.m_messages_in_mavlink = {};

    this.m_received_msg = 0;
    this.m_received_bytes = 0;
    this.m_lastActiveTime = 0;
  }
}

export class CAndruavUnitObject {
  constructor() {
    this.m_index = 0;
    this.m_defined = false;
    this.m_IsMe = false;
    this.m_IsGCS = true;
    this.m_isDE = false; // is Drone Engage
    this.m_IsShutdown = false;
    this.Description = "";
    this.m_inZone = null; // name of A ZONE  that the unit is IN.
    this.m_unitName = "unknown";
    this.partyID = null;
    this.m_groupName = null;
    this.m_isFlying = false;
    this.m_FlyingLastStartTime = 0; // flight duration of latest or current flight.
    this.m_FlyingTotalDuration = 0;
    this.m_flightMode = CONST_FLIGHT_CONTROL_UNKNOWN;
    this.m_autoPilot = mavlink20.MAV_AUTOPILOT_GENERIC;
    this.m_isArmed = false;
    this.m_is_ready_to_arm = false;
    this.m_useFCBIMU = false;
    this.m_VehicleType = VEHICLE_UNKNOWN;
    this.m_telemetry_protocol = js_andruavMessages.CONST_No_Telemetry;
    this.m_enum_userStatus = 0;
    this.m_version = "null";
    this.m_delayedTimeout = null; // used for delayed actions.
    this.init();
  }

  fn_getFullName() {
    return fn_getFullName(this.m_groupName, this.m_unitName);
  }

  fn_canCamera() {
    if (this.m_Permissions[10] === "C") {
      return true;
    }

    return false;
  }

  fn_canVideo() {
    if (this.m_Permissions[8] === "V") {
      return true;
    }

    return false;
  }

  init() {
    this.m_time_sync = 0; // time sent by unit so that you can use it to measrue other time fields sent by the same module.
    this.m_Permissions = "X0X0X0X0X0X0";
    this.m_IsShutdown = false;
    this.m_WindSpeed = null;
    this.m_WindSpeed_z = null;
    this.m_WindDirection = null;
    this.m_modules = new C_Modules(this);
    this.m_GPIOs = new C_GPIO(this);
    this.m_Messages = new C_Messages(this);
    this.m_Power = new C_Power(this);
    this.m_GPS_Info1 = new C_GPS(this);
    this.m_GPS_Info2 = new C_GPS(this);
    this.m_GPS_Info3 = new C_GPS(this);
    this.m_Nav_Info = new C_NavInfo(this);
    this.m_Terrain_Info = new C_Terrain(this);
    Object.seal(this.m_NetworkStatus);
    Object.seal(this.m_Nav_Info);
    this.m_gui = new C_GUIHelper(this);
    this.m_Geo_Tags = new C_GeoTags(this);
    this.m_Telemetry = new C_Telemetry(this);
    this.m_Servo = new C_Servo(this);
    this.m_Gimbal = { m_pitch: 0, m_roll: 0, m_yaw: 0 };
    this.m_Video = new C_Video(this);
    this.m_Obstacles = new C_Obstacles(this);
    this.m_DetectedTargets = new C_DetectedTargets(this);

    this.m_Swarm = new C_Swarm(this);
    this.m_P2P = new C_P2P(this);
    this.m_SDR = new C_SDR(this);
    Object.seal(this.m_Swarm);
    Object.seal(this.m_P2P);
    this.m_SignalStatus = new C_SignalStatus(this);

    this.m_FCBParameters = new C_FCBParameters(this);
    this.m_EKF = new C_EKF(this);
    this.m_Vibration = new C_Vibration(this);

    this.m_lidar_info = new C_LidarInfo(this);
    this.m_Throttle = 0; //MAVLINK_MSG_ID_VFR_HUD.throttle uint16_t % Current throttle setting (0 to 100).

    
  }

  fullName() {
    return this.fn_getFullName(this.m_groupName, this.partyID);
  }

  module_version () {
    let module_version = (this.Description+'\n');
                
        if (this.m_isDE !== true)
        {
            module_version += "Andruav";
        }
        else
        {
            module_version += "DE version: " + this.m_version;
            const len = this.m_modules.length;
            for (let i=0; i< len; ++i)
            {
                const module = this.m_modules[i];
                module_version += '\n';
                module_version += module.i + ' ver:' + module.v;
            }
        }

        return module_version;
  }
}

export class CAndruavUnitList {
  constructor() {
    this.List = new Map();
    this.count = 0;
  }

  fn_resetList() {
    this.List.clear();
  }

  fn_getUnitsArray() {
    return Array.from(this.List.entries());
  }

  /**
     * Returns units sorted by name.
     * @returns {Array} An array of units sorted by name.
     */
  fn_getUnitsSorted() {
    return Array.from(this.List.values()).sort((a, b) => {
        const nameA = a.m_unitName || "";
        const nameB = b.m_unitName || "";
        return nameA.localeCompare(nameB);
    });
  } 


    /**
     * Returns units sorted by system ID.
     * @returns {Array} An array of units sorted by system ID.
     */
    fn_getUnitsSortedBy_APID() {
      return Array.from(this.List.values()).sort((a, b) => {
          const idA = a.m_FCBParameters.m_systemID || 0;
          const idB = b.m_FCBParameters.m_systemID || 0;
          return idA > idB;
      });
  }
 /**
     * Finds a unit by P2P MAC address.
     * @param {string} mac The MAC address to search for.
     * @returns {CAndruavUnitObject|null} The unit with the specified MAC address, or null if not found.
     */
 fn_getUnitByP2PMac(mac) {
  return Array.from(this.List.values()).find(unit => unit.m_P2P.fn_isMyMac(mac)) || null;
}

  Add(partyID, andruavUnit) {
    if (this.List.has(partyID)) return;
    andruavUnit.m_index = this.count;
    this.List.set(partyID, andruavUnit);
    this.count++;
  }

  Del(partyID) {
    if (this.List.has(partyID)) {
      this.List.delete(partyID);
      this.count--;
    }
  }

  fn_getUnit(partyID) {
    return this.List.get(partyID) || null;
  }

  fn_getUnitKeys() {
    if (!js_globals.v_andruavClient) return undefined;
    return Array.from(this.List.keys());
  }

  fn_getUnitValues() {
    if (!js_globals.v_andruavClient) return undefined;
    return Array.from(this.List.values());
  }

  fn_getUnitCount() {
    if (!js_globals.v_andruavClient || !this.List) return 0;
    return this.List.size;
  }

  putUnit(unitFullName, andruavUnit) {
    this.List.set(unitFullName, andruavUnit);
  }
}
