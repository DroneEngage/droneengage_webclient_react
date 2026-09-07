/**
 * TASK-06 — structural type for the unit model boundary.
 *
 * `CAndruavUnit` describes the slice of the real `CAndruavUnitObject`
 * (src/js/js_andruavUnit.js) that the pure core layer — reduce.ts and
 * effects.ts — actually reads or declares method ops against. It is NOT the
 * full 1600-line class; it is the contract at the layer boundary, so the
 * reducer gets compile-time enforcement that every field path it touches
 * exists on the unit.
 *
 * The real class is not converted (out of scope: only core/ is typed). The
 * runtime (runtime.js, still .js) bridges the typed reducer output to the
 * real instance via fn_setByPath / callUnitMethod, which are dynamically
 * dispatched and stay untyped.
 *
 * Field types match the wire-payload types they are compared against, so the
 * `!==` / `!= null` checks in reduce.ts type-check without casts. Sub-objects
 * declare only the fields the core layer accesses; the real class has many
 * more, accessed only by the view layer (out of scope).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars -- this file is entirely type declarations;
   interface method params are documentation, not unused code */

export interface UnitLocation {
    lat: number;
    lng: number;
    alt_abs: number;
    alt_relative: number;
    time: number;
    ground_speed?: number;
    bearing?: number;
}

export interface UnitOrientation {
    roll: number;
    pitch: number;
    yaw: number;
}

export interface UnitTarget {
    target_bearing: number;
    wp_dist: number;
    alt_error: number;
}

export interface CNavInfo {
    p_Location: UnitLocation;
    p_Orientation: UnitOrientation;
    _Target: UnitTarget;
}

export interface CGpsInfo {
    m_isValid: boolean;
    GPS3DFix: number;
    m_satCount: number;
    accuracy: number;
    provider: string;
    gpsMode: number;
}

export interface CBattery {
    p_hasPowerInfo: boolean;
    BatteryLevel?: number;
    Voltage?: number;
    BatteryTemperature?: number;
    Health?: number;
    PlugStatus?: number;
    FCB_BatteryVoltage?: number;
    FCB_BatteryCurrent?: number;
    FCB_BatteryRemaining?: number;
    FCB_BatteryTemprature?: number;
    FCB_TotalCurrentConsumed?: number;
}

export interface CPower {
    _Mobile: { p_Battery: CBattery };
    _FCB: { p_Battery: CBattery };
}

export interface CTelemetry {
    m_isGCSBlocked: boolean;
    m_udpProxy_ip: string;
    m_udpProxy_port: number;
    m_telemetry_level: number;
    m_udpProxy_active: boolean;
    m_udpProxy_paused: boolean;
    fn_updateTelemetry(level: number): void;
}

export interface CSignalStatus {
    m_mobile: boolean;
    m_mobileSignalLevel: number;
    m_mobileNetworkType: number;
    m_operatorName?: string;
    m_countryIso?: string;
    m_dataState?: string;
    m_websocket?: number;
    m_mobileNetworkTypeRank: number;
}

export interface CSwarm {
    m_formation_as_follower: number;
    m_isLeader: boolean;
    m_formation_as_leader: number;
    m_following: string | null;
}

export interface CP2P {
    m_initialized: boolean;
    m_detected_node: Record<string, any>;
    m_detected_bssid: Record<string, any>;
    m_connection_type: number;
    m_address_1: string;
    m_address_2: string;
    m_wifi_channel: number;
    m_wifi_password: string;
    m_parent_address: string;
    m_parent_connected: boolean;
    m_logical_parent_address: string;
    m_firmware: string;
    m_driver_connected: boolean;
    m_p2p_connected: boolean;
    m_p2p_disabled: boolean;
}

export interface CSDR {
    m_initialized: boolean;
    m_center_frequency: number;
    m_display_bars: number;
    m_gain: number;
    m_sample_rate: number;
    m_driver: string;
    m_status: number;
    m_interval: number;
    m_trigger_level: number;
    m_available_drivers: string[];
    addDetectedSignal(...args: any[]): void;
}

export interface CModules {
    m_list: any[];
    has_fcb: boolean;
    has_viewlink: boolean;
    has_ai_recognition: boolean;
    has_p2p: boolean;
    has_sdr: boolean;
    addModules(modules: any[]): void;
    getModuleByKey(key: string): { template?: any; [key: string]: any } | null;
}

export interface CHomePoint {
    m_isValid: boolean;
    lat: number;
    lng: number;
    alt: number;
}

export interface CGeoTags {
    p_HomePoint: CHomePoint;
    p_DestinationPoint: { m_isValid: boolean };
    fn_addHomePoint(lat: number, lng: number, alt: number, radiusAcc: number, altAcc: number): void;
    fn_addDestinationPoint(lat: number, lng: number, alt: number, type: number): void;
}

export interface CGimbal {
    setOrientation(y: number, p: number, r: number): void;
    setLRF(d?: number, a?: number): void;
}

export interface CVideo {
    m_videoTracks: any[];
    VideoRecording: boolean;
}

export interface CSound {
    m_files: any[];
}

export interface CTracker {
    fn_updateTrackerStatus(payload: any): void;
    m_enable_gui_tracker: boolean;
    m_active: boolean;
    m_ai_driven: boolean;
}

export interface CTrackerAI {
    fn_addObjectClass(classList: any[]): void;
    fn_updateTrackerStatus(status: any): void;
    m_object_list: any;
    m_active: boolean;
    m_detected: boolean;
}

export interface CDetectedTargets {
    m_searchable_targets: Record<string, any>;
    m_targets: { m_list: any[] };
}

export interface CGPIOs {
    addGPIO(gpioList: any[]): void;
}

export interface CMessages {
    fn_addMsg(type: number): void;
    m_received_msg: number;
    m_received_bytes: number;
    m_lastActiveTime: number;
}

/**
 * The unit model boundary contract. Fields the core layer reads are typed;
 * the real CAndruavUnitObject has many more fields used only by the view
 * layer (out of scope).
 */
export interface CAndruavUnit {
    // Identity / flags
    m_defined: boolean;
    m_IsMe: boolean;
    m_IsGCS: boolean;
    m_unitName: string;
    Description: string;
    m_VehicleType: number;
    m_Permissions: string;
    m_IsDisconnectedFromGCS: boolean;
    m_IsShutdown: boolean;
    m_useFCBIMU: boolean;
    m_telemetry_protocol: number;
    m_time_sync: number;
    m_autoPilot: number;
    m_flightMode: number;
    m_isArmed: boolean;
    m_is_ready_to_arm: boolean;
    m_isFlying: boolean;
    m_FlyingLastStartTime: number;
    m_FlyingTotalDuration: number;
    m_de_pilot_enabled: boolean;
    m_de_pilot_operation: number;
    m_index: number;
    m_groupName: string;
    m_delayedTimeout?: ReturnType<typeof setTimeout> | null;
    m_moduleHealth: Record<string, any>;

    // Sub-objects
    m_GPS_Info1: CGpsInfo;
    m_Nav_Info: CNavInfo;
    m_Power: CPower;
    m_Telemetry: CTelemetry;
    m_SignalStatus: CSignalStatus;
    m_Swarm: CSwarm;
    m_P2P: CP2P;
    m_SDR: CSDR;
    m_modules: CModules;
    m_Geo_Tags: CGeoTags;
    m_Gimbal: CGimbal;
    m_Video: CVideo;
    m_Sound: CSound;
    m_tracker: CTracker;
    m_tracker_ai: CTrackerAI;
    m_DetectedTargets: CDetectedTargets;
    m_GPIOs: CGPIOs;
    m_Messages: CMessages;

    // Methods
    getPartyID(): string;
    setPartyID(id: string): void;
    fn_getIsDE(): boolean;
    fn_setIsDE(isDE: boolean): void;
    fn_getVersion(): string;
    fn_setVersion(version: string): void;
    fn_getFullName(groupName: string, partyId: string): string;
    fullName(): string;
}
