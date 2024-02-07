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

// Vehicle Types
const VEHICLE_UNKNOWN 				= 0;
const VEHICLE_TRI 					= 1;
const VEHICLE_QUAD 					= 2;
const VEHICLE_PLANE 				= 3;
const VEHICLE_ROVER 				= 4;
const VEHICLE_HELI 					= 5;
const VEHICLE_BOAT 					= 6;

const VEHICLE_SUBMARINE    			= 12;

const VEHICLE_GIMBAL 				= 15;
const VEHICLE_BUS 					= 997;
const VEHICLE_PERSON 				= 998;
const CONST_VEHICLE_GCS 			= 999;


//m_enum_userStatus
const CONST_ALIVE 					= 1;
const CONST_SUSPECTED 				= 2;
const CONST_DISCONNECTED 			= 3;

// VIDEORECORDING
const CONST_VIDEORECORDING_OFF 		= 0;
const CONST_VIDEORECORDING_ON 		= 1;
const CONST_VIDEOSTREAMING_OFF 		= 0;
const CONST_VIDEOSTREAMING_ON 		= 1;



// ENUM_TelemetryProtocol
const CONST_No_Telemetry			= 0;
const CONST_Andruav_Telemetry		= 1;
const CONST_Mavlink_Telemetry		= 2;
const CONST_MW_Telemetry			= 3;
const CONST_Unknown_Telemetry		= 999;	





    // Flight Control Modes
const CONST_FLIGHT_CONTROL_RTL                =2;
    // Flight Follow Me
const CONST_FLIGHT_CONTROL_FOLLOW_ME          =3;
            // param1:  Longitude:  Master position
            // param2:  Latitude
            // param3(opt):  Radius:             minimum approach to master.
            // param4(opt):  Offset_Longitude:   used to make a fleet formation
            // param5(opt):  Offset_Latitude:    used to make a fleet formation


    // Flight Follow A Unit... The message is sent to the Master Unit
    // and forwarded to the secondary one as a Follow_ME command.
const CONST_FLIGHT_CONTROL_FOLLOW_UNITED       =4;
            // UNIT_ID: unit to follow.
            // Below commands are forwarded to Slave
            // param1:  Longitude:  Master position
            // param2:  Latitude
            // param3(opt):  Radius:             minimum approach to master.
            // param4(opt):  Offset_Longitude:   used to make a fleet formation
            // param5(opt):  Offset_Latitude:    used to make a fleet formation

    // Flight Auto [Mission UAV]
const CONST_FLIGHT_CONTROL_AUTO               			= 5;
const CONST_FLIGHT_CONTROL_STABILIZE          			= 6;
const CONST_FLIGHT_CONTROL_ALT_HOLD           			= 7;
const CONST_FLIGHT_CONTROL_MANUAL             			= 8;  // Manual 
const CONST_FLIGHT_CONTROL_GUIDED             			= 9;
const CONST_FLIGHT_CONTROL_LOITER             			= 10;
const CONST_FLIGHT_CONTROL_POSTION_HOLD       			= 11;
const CONST_FLIGHT_CONTROL_LAND               			= 12;
const CONST_FLIGHT_CONTROL_CIRCLE             			= 13;
const CONST_FLIGHT_CONTROL_FBWA               			= 14;
const CONST_FLIGHT_CONTROL_CRUISE             			= 15;
const CONST_FLIGHT_CONTROL_FBWB             			= 16;
const CONST_FLIGHT_CONTROL_BRAKE			 			= 17;
const CONST_FLIGHT_CONTROL_SMART_RTL		  			= 21;
const CONST_FLIGHT_CONTROL_TAKEOFF			  			= 22;
const CONST_FLIGHT_CONTROL_QHOVER        				= 23;
const CONST_FLIGHT_CONTROL_QLOITER       				= 24;
const CONST_FLIGHT_CONTROL_QSTABILIZE    				= 25;
const CONST_FLIGHT_CONTROL_QLAND         				= 26;
const CONST_FLIGHT_CONTROL_QRTL          				= 27;
const CONST_FLIGHT_CONTROL_ACRO          				= 28;
const CONST_FLIGHT_CONTROL_INITIALIZE		  			= 99;
const CONST_FLIGHT_CONTROL_HOLD		  		  			= 100;
const CONST_FLIGHT_CONTROL_SURFACE            			= 101;
const CONST_FLIGHT_MOTOR_DETECT               			= 102;
const CONST_FLIGHT_PX4_MANUAL               			= 200;
const CONST_FLIGHT_PX4_ALT_HOLD               			= 201;
const CONST_FLIGHT_PX4_AUTO_TAKEOFF						= 202;
const CONST_FLIGHT_PX4_AUTO_MISSION						= 203;
const CONST_FLIGHT_PX4_AUTO_HOLD						= 204;
const CONST_FLIGHT_PX4_AUTO_RTL							= 205;
const CONST_FLIGHT_PX4_AUTO_LAND						= 206;
const CONST_FLIGHT_PX4_AUTO_FOLLOW_TARGET				= 207;
const CONST_FLIGHT_PX4_AUTO_PRECLAND					= 208;
const CONST_FLIGHT_PX4_VTOL_TAKEOFF						= 209;
const CONST_FLIGHT_PX4_ACRO               				= 210;
const CONST_FLIGHT_PX4_STABILIZE               			= 211;
const CONST_FLIGHT_PX4_OFF_BOARD               			= 212;
const CONST_FLIGHT_PX4_RATTITUDE               			= 213;
const CONST_FLIGHT_PX4_POSCTL_POSCTL           			= 214;
const CONST_FLIGHT_PX4_POSCTL_ORBIT            			= 215;
const CONST_FLIGHT_CONTROL_UNKNOWN            			= 999;


// P2P Connection Type
const CONST_TYPE_UNKNOWN								= 0;
const CONST_TYPE_ESP32_MESH								= 1;

function fn_getFullName(m_groupName, p_partyID)
	{
		//return m_groupName.replace(" ","_") + "_X_" + partyID.replace(" ","_");
		
		return p_partyID;   // partyID is unique
	}


class C_Video
{

	constructor(p_parent)
	{
		this.m_parent = p_parent;
		this.m_videoactiveTracks = {};
		this.m_videoTracks=[];
	};

	// returns CONST_VIDEOSTREAMING_OFF is ALL tracks are OFF
	fn_getVideoStreaming ()
	{
		const c_activeTracks = Object.keys(this.m_videoactiveTracks);
		if (c_activeTracks.length ==0 )
		{	// NO ACTIVE VIDEOS ARE DEFINED
			return CONST_VIDEOSTREAMING_OFF;
		}
		var len = c_activeTracks.length;
		for (var i=0;i<len;++i)
		{	
			if (this.m_videoactiveTracks[c_activeTracks[i]].VideoStreaming == CONST_VIDEOSTREAMING_ON)
			{  // ONE TRACK IS ACTIVE
				return CONST_VIDEOSTREAMING_ON;
				
			}
		}

		return CONST_VIDEOSTREAMING_OFF;
	}


	isAllActive ()
	{
		const c_activeTracks = Object.keys(this.m_videoactiveTracks);
		if ((c_activeTracks.length ==0 )
		||  (this.m_videoTracks.length > c_activeTracks.length))
		{	// NO ACTIVE VIDEOS ARE DEFINED OR NOT ALL ARE ACTIVE
			return false;
		}
		
		var len = c_activeTracks.length;
		var j=0;
		for (var i=0;i<len;++i)
		{	
			if (this.m_videoactiveTracks[c_activeTracks[i]].VideoStreaming == CONST_VIDEOSTREAMING_ON)
			{  // ON TRACK IS ACTIVE
				j+=1;
			}
		}

		return (j==i);
	}



	fn_getVideoRecording ()
	{
		const c_activeTracks = Object.keys(this.m_videoactiveTracks);

		if (this.VideoRecording == CONST_VIDEOSTREAMING_ON)
		{
			return CONST_VIDEOSTREAMING_ON;
		}

		if (c_activeTracks.length ==0 )
		{	// NO ACTIVE VIDEOS ARE DEFINED
			return CONST_VIDEOSTREAMING_OFF;
		}
		var len = c_activeTracks.length;
		for (var i=0;i<len;++i)
		{	
			if (this.m_videoactiveTracks[c_activeTracks[i]].VideoRecording == CONST_VIDEOSTREAMING_OFF)
			{  // ON TRACK IS ACTIVE
				return CONST_VIDEOSTREAMING_ON;
			}
		}

		return CONST_VIDEOSTREAMING_OFF;
	};
}

class C_NavInfo 
{
	constructor (p_parent)
	{
		this.m_parent = p_parent;
		this.p_Location={
			alt: null, 			// MAVLINK_MSG_ID_GLOBAL_POSITION_INT.relative_alt ... Altitude above ground - or baro alt if GPS is not available
			alt_abs: null,		// MAVLINK_MSG_ID_GLOBAL_POSITION_INT.alt  ... Altitude (MSL). Note that virtually all GPS modules provide both WGS84 and MSL.
			air_speed:null,		// MAVLINK_MSG_ID_VFR_HUD.airspeed ... Vehicle speed in form appropriate for vehicle type. For standard aircraft this is typically calibrated airspeed (CAS) or indicated airspeed (IAS) - either of which can be used by a pilot to estimate stall speed.
			ground_speed:null   // MAVLINK_MSG_ID_VFR_HUD.ground_speed ... float (m/s) ... Note HIGH_LATENCY uses unit8 m/s*5
		};
		this.p_Orientation={
			roll:0.0, 			// MAVLINK_MSG_ID_ATTITUDE.nav_roll ... rad ... Roll angle (-pi..+pi)
			pitch:0.0,			// MAVLINK_MSG_ID_ATTITUDE.nav_pitch ... rad ... Pitch angle (-pi..+pi)
			yaw:0.0,			// MAVLINK_MSG_ID_ATTITUDE.nav_yaw ... rad ... Yaw angle (-pi..+pi)
			roll_speed:0.0, 	// MAVLINK_MSG_ID_ATTITUDE.rollspeed ... float	rad/s	Roll angular speed
			pitch_speed:0.0,	// MAVLINK_MSG_ID_ATTITUDE.pitchspeed ... float	rad/s	Pitch angular speed
			yaw_speed:0.0,		// MAVLINK_MSG_ID_ATTITUDE.yawspeed ... float	rad/s	Yaw angular speed
		};
		
		this.p_Desired={
			nav_roll:0.0, 		// MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.nav_roll 		float	 deg	Current desired roll
			nav_pitch:0.0,		// MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.nav_pitch 		float	 deg	Current desired pitch
			nav_bearing:0.0,	// MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.nav_bearing 	int16_t	 deg	Current desired heading
		};
		
		this._Target= {
			target_bearing:0.0, // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.target_bearing  int16_t	 deg	Current desired waypoint/target
			wp_count: 0,		// MAVLINK_MSG_ID_MISSION_COUNT.count
			wp_dist: 0, 		// MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.wp_dist  		uint16_t  m		Distance to active waypoint			
			wp_num: 0,			// MAVLINK_MSG_ID_MISSION_CURRENT.seq
			alt_error:0.0,      // MAVLINK_MSG_ID_NAV_CONTROLLER_OUTPUT.alt_error 		float	  m		Current altitude error
		};

		this.p_UserDesired= {
			m_NavSpeed: 0.0,	// user desired speed..requested from web
		};
		// flight path as points (lng,lat,alt)
		this.m_FlightPath=[];
	};
}


class C_GeoTags 
{
	constructor (p_parent)
	{
		this.m_parent = p_parent;
		this.p_HomePoint = {m_isValid:false};
		this.p_DestinationPoint={
			m_isValid:false,
			m_needsIcon:false
			};
	};


	fn_addDestinationPoint (p_lat,p_lng,p_alt,p_type)
	{
		if (this.p_DestinationPoint.type != p_type)
		{
			this.p_DestinationPoint.m_needsIcon = true;
			this.p_DestinationPoint.type = p_type;
		}
		this.p_DestinationPoint.lat = p_lat;
		this.p_DestinationPoint.lng = p_lng;
		this.p_DestinationPoint.alt = p_alt;
		this.p_DestinationPoint.m_isValid = true;
	}
}


class C_DetectedTargets
{
	constructor (p_parent)
	{
		this.m_parent 				= p_parent;
		this.m_targets 				= { m_list: [] };
		this.m_searchable_targets	= {};
	};
}


class C_FCBParameters
{
	constructor (p_parent)
	{
		this.m_parent = p_parent;
		this.m_systemID = 0;
		this.m_componentID = 0;
		this.m_list = {};
		this.m_list_by_index = {};
		this.m_list_by_index_shadow = {};
	}
}
class C_Swarm
{
	constructor (p_parent)
	{
		this.m_parent = p_parent;
		this.m_isLeader = false;
		this.m_formation_as_leader = CONST_TASHKEEL_SERB_NO_SWARM;
		this.m_formation_as_follower = CONST_TASHKEEL_SERB_NO_SWARM;
		this.m_following = null;
	};
}

class C_P2P
{
		constructor (p_parent)
		{
			this.m_parent = p_parent;
			this.m_address_1;
			this.m_address_2;
			this.m_wifi_channel=0;
			this.m_wifi_password='';
			this.m_connection_type = CONST_TYPE_UNKNOWN;
			this.m_parent_address = '';
			this.m_parent_connected = false;
			this.m_detected_units = {};
		};
}


class C_Servo
{
	constructor (p_parent)
	{
		this.m_parent = p_parent;
		this.m_values = {};
	};
}


class C_Power
{
	constructor (p_parent)
	{
		this.m_parent = p_parent;
		this._Mobile = 
					{
						p_Battery:{
							p_hasPowerInfo:false,
						}
					};

		this._FCB = 
					{
						
						p_Battery:
						{
							p_hasPowerInfo:false,
							FCB_BatteryVoltage: 0.0,
							FCB_BatteryCurrent: 0.0,
							FCB_BatteryRemaining: 0.0,
							FCB_BatteryTemprature: 0.0,
							FCB_TotalCurrentConsumed: 0.0
						},
						p_Battery2:
						{
							p_hasPowerInfo:false,
							FCB_BatteryVoltage: 0.0,
							FCB_BatteryCurrent: 0.0,
							FCB_BatteryRemaining: 0.0,
							FCB_BatteryTemprature: 0.0,
							FCB_TotalCurrentConsumed: 0.0
						}
					}
	};
}

class C_Telemetry 
{
	constructor (p_parent)
	{
		this.m_parent 				= p_parent;
		this._isActive = false;
		this.m_isGCSBlocked = false;
		this.manualTXBlockedSubAction =0;
		this.m_rxEngaged = false; // defined locally
		this.m_telemetry_level = 0;
		this.m_udpProxy_ip = null;
		this.m_udpProxy_port = 0;
		this.m_udpProxy_active = false;
		this.m_udpProxy_paused = false;
	};


	fn_getManualTXBlockedSubAction (){
		return this.manualTXBlockedSubAction; // defined by remote unit
	};
	
	fn_updateTelemetry (p_manualTXBlockedSubAction)
	{
		this.manualTXBlockedSubAction = p_manualTXBlockedSubAction;
		// if (manualTXBlockedSubAction == CONST_RC_SUB_ACTION_RELEASED)
		// {   // release rx if engaged
											// 	//this.m_rxEngaged = false;
		// }
		// NOTICE STATUS MIGHT BE:
		// CONST_RC_SUB_ACTION_JOYSTICK_CHANNELS but it could be controlled by another channel.
	}											
};

class C_GPS
{
	constructor (p_parent)
	{
		this.m_parent 	= p_parent;
		this.m_isValid	= false;
		this.m_satCount	= 0;
	}
}

class C_TerrainEntry
{
	constructor (lat =null, lon =null, spacing=null, terrain_height, current_height)
	{	
		this.m_lat = lat;  						// optional 	invalud = null					
		this.m_lon = lon;  						// optional 	invalud = null	   			
		this.m_spacing = spacing;		 		//optional 	invalud = null	
		this.m_terrain_height = terrain_height; // m - Terrain height MSL
		this.m_current_height = current_height; // m - Current vehicle height above lat/lon terrain height
	}
}
class C_Terrain
{
	constructor (p_parent)
	{
		this.m_parent 	= p_parent;
		this.m_isValid	= false;
		this._index = 0;
		this.__terrain_entry  = [];
		this.last_terrain_entry = null;
	}

	add (terrain_entry)
	{
		if (terrain_entry == null) return ;
		
		this.last_terrain_entry = terrain_entry;
		this.m_isValid = true;
		// if (this._index ==100 ) this._index = 0;
		// this.__terrain_entry.push(terrain_entry);
		// this._index+=1;
	}
}


class C_EKF
{
	constructor (p_parent)
	{
		this.m_parent 	= p_parent;
		this.m_isValid	= false;
		this.m_velocity_variance = 0;
		this.m_pos_horiz_variance = 0;
		this.m_pos_vert_variance = 0;
		this.m_compass_variance = 0;
		this.m_terrain_alt_variance = 0;
		this.m_airspeed_variance =0;
		this.m_flags = 0;
	}
}

class C_Vibration
{
	constructor (p_parent)
	{
		this.m_parent 	= p_parent;
		this.m_isValid	= false;
		this.m_vibration_x = 0;
		this.m_vibration_y = 0;
		this.m_vibration_z = 0;
		this.m_clipping_0 = 0;
		this.m_clipping_1 = 0;
		this.m_clipping_2 = 0;
	}
}


class C_DistanceSensor
{
	constructor (p_parent, v_orientation)
	{
		this.m_parent 	= p_parent;
		this.m_orientation = v_orientation; //MAV_SENSOR_ORIENTATION_ENUM_END
		this.m_isValid = false;
		this.m_last_access = null;
		this.m_min_distance = 0;
		this.m_max_distance = 0;
		this.m_current_distance = 0;
	}	
}

class C_GUIHelper
{
	constructor (p_parent)
	{
		this.m_parent 	= p_parent;
		// actual lines on map
		this.m_gui_flightPath = new CLSS_CustomCircularBuffer(CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT); 
		this.m_wayPoint_markers = [];
		this.m_wayPoint_polygons = [];
		this.m_marker = null;
		this.m_marker_destination = null;
	}
}

/**
 * Handles message counters.
 */
class C_Messages
{
	constructor(p_parent)
	{
		this.m_parent = parent;
		this.m_messages_repeat = {};
		this.m_messages_in = {};
		this.m_messages_in_mavlink = {};

		this.m_received_msg	= 0;
		this.m_received_bytes = 0;
		this.m_lastActiveTime = 0;
	}

	
	fn_addMavlinkMsg(message_mavlin)
	{
		if (this.m_messages_in_mavlink.hasOwnProperty(message_mavlin.name)==false)
		{
			this.m_messages_in_mavlink[message_mavlin.name] = 1;
		}
		else
		{
			++this.m_messages_in_mavlink[message_mavlin.name];
		}
	}

	fn_addMsg (message_id)
	{
		if (this.m_messages_in.hasOwnProperty(message_id)==false)
		{
			this.m_messages_in[message_id] = 1;
		}
		else
		{
			++this.m_messages_in[message_id];
		}
	}

	/**
	 * Stores messages status to know what message is sent to or from this unit so we can ignore repeated messages.
	 * @param {*} message_id message id
	 * @param {*} interval_ms send it every ms
	 * @param {*} from_time last time sent .
	 */
	fn_doNotRepeatMessageBefore(message_id, interval_ms,from_time)
	{
		this.m_messages_repeat[message_id] = {
			'interval_ms': interval_ms,
			'timestamp' : from_time
		}
	}

	/**
	 * Test if a message can be processed, sent or ignored.
	 * if true then can be added or can be re-send.
	 * @param {*} message_id 
	 * @returns 
	 */
	fn_sendMessageAllowed(message_id)
	{
		const data = this.m_messages_repeat[message_id];
		if (data == null) return true;

		const can_send =  (((new Date()) - data.from_time)>data.interval_ms);
		return can_send;
	}
}


class CAndruavUnitObject 
{
	
	constructor()
	{
		this.m_index					= 0;
		this.m_defined					= false;
		this.m_IsMe 					= false;
		this.m_IsGCS 					= true;
		this.m_isDE						= false; // is Drone Engage
		this.m_IsShutdown 				= false;
		this.Description 				= "";
		this.m_inZone 					= null;  // name of A ZONE  that the unit is IN. 
		this.m_unitName					="unknown";
		this.partyID					= null;
		this.m_groupName;
		this.m_isFlying					= false; 
		this.m_FlyingLastStartTime		= 0; // flight duration of latest or current flight.
		this.m_FlyingTotalDuration		= 0; 
		this.m_flightMode				= CONST_FLIGHT_CONTROL_UNKNOWN;
		this.m_autoPilot				= mavlink20.MAV_AUTOPILOT_GENERIC;
		this.m_isArmed					= false;
		this.m_useFCBIMU				= false;
		this.m_VehicleType 				= VEHICLE_UNKNOWN;
		this.m_telemetry_protocol 		= CONST_No_Telemetry;
		this.m_enum_userStatus 			= 0;	
		this.m_version 					= "null";
		this.m_modules					= [];
		this.init();
	}

	fn_getFullName ()
	{
		return fn_getFullName (this.m_groupName , this.m_unitName);
	};


	fn_canCamera ()
	{
		if (this.m_Permissions[10] == 'C')
		{
			return true;
		}

		return false;
	}


	fn_canVideo ()
	{
		if (this.m_Permissions[8] == 'V')
		{
			return true;
		}

		return false;
	}



	init ()
	{
		var me = this;
		this.m_Permissions           	= 'X0X0X0X0X0X0';
		this.m_IsShutdown				= false;	
		this.m_WindSpeed				= null;
		this.m_WindSpeed_z				= null;
		this.m_WindDirection			= null;
		this.m_Messages					= new C_Messages(this);
		this.m_Power 					= new C_Power (this);
		this.m_GPS_Info1				= new C_GPS (this);
		this.m_GPS_Info2				= new C_GPS (this);
		this.m_GPS_Info3				= new C_GPS (this);
		this.m_Nav_Info 				= new C_NavInfo(this);
		this.m_Terrain_Info 			= new C_Terrain (this);
		// create a buffer for flight path
		Object.seal(this.m_NetworkStatus);
		Object.seal(this.m_Nav_Info);
		this.m_gui						= new C_GUIHelper(this);
		this.m_Geo_Tags 				= new C_GeoTags(this);
		this.m_Telemetry				= new C_Telemetry(this);
		this.m_Servo 					= new C_Servo(this);
		this.m_Gimbal 					= {m_pitch:0, m_roll:0, m_yaw:0};
		this.m_Video					= new C_Video(this);
		this.m_DetectedTargets			= new C_DetectedTargets(this);
											
		this.m_Swarm 					= new C_Swarm(this);
		this.m_P2P						= new C_P2P(this);
		this.m_SignalStatus				= {m_wifi:false, m_mobile:false, m_mobileSignalLevel:0, m_mobileNetworkType:0, m_mobileNetworkTypeRank:0};
		
		this.m_FCBParameters 			= new C_FCBParameters(this);
		this.m_EKF 						= new C_EKF(this);
		this.m_Vibration				= new C_Vibration(this);

		this.m_DistanceSensors = [];
		this.m_Throttle					= 0; //MAVLINK_MSG_ID_VFR_HUD.throttle uint16_t % Current throttle setting (0 to 100).

		for (var i=0;i<=40;++i)
		{
			this.m_DistanceSensors.push(new C_DistanceSensor(this,i));
		}
	};
	

	fullName  ()
	{
		return this.fn_getFullName(this.m_groupName,this.partyID);
	};


};




class CAndruavUnitList 
{

	constructor ()
	{
		this.List = {};
		this.count = 0;
	}


	Add (partyID,andruavUnit)
	{
		if (this.List[partyID]!=null) return ;
		andruavUnit.m_index = this.count;
		this.List[partyID] = andruavUnit;
		this.count = this.count + 1;
	};


	Del (partyID)
	{
		if (this.hasOwnProperty(partyID))
		{
			delete this.List[partyID];
			this.count = this.count -1;
		}
		
	};


	fn_getUnit (partyID)
	{
		if (this.List.hasOwnProperty(partyID))
		{
			return this.List[partyID];
		}
		return null;
		
	};


	fn_getUnitKeys ()
	{
		if (v_andruavClient==null) return undefined;
		return Object.keys(v_andruavClient.m_andruavUnitList.List);
	};


	fn_getUnitValues ()
	{
		if (v_andruavClient==null) return undefined;
		return Object.values(v_andruavClient.m_andruavUnitList.List);
	};


	fn_getUnitCount ()
	{
		if (v_andruavClient==null) return 0;
		if (v_andruavClient.m_andruavUnitList == null) return 0;
		return Object.keys(v_andruavClient.m_andruavUnitList.List).length; 
	};


	putUnit (unitFullName,andruavUnit)
	{
		for (var name in this.List)
		{
			if (name == unitFullName)
			{
				this.List[name] = andruavUnit;
				return ;
			}
		}

		this.List[name] = andruavUnit;

	};
}









