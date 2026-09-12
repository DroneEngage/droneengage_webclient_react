/**
 * TASK-06 — wire payload types for the migrated inbound messages.
 *
 * One interface per CONST_TYPE_AndruavMessage_* handled by reduce.ts, describing
 * the abbreviated payload keys the units actually send (`la`, `ln`, `a`, `r`,
 * `3D`, `SC`, `c`, `p`, `t`, `s`, `b`, ...). Source of truth: the captured
 * frames in reduce.test.js and the field keys documented in the old
 * js_andruav_parser.js switch.
 *
 * Required fields are present on every frame of that type; optional fields
 * (`?`) genuinely may be absent on the wire and carry a runtime default in
 * reduce.ts (`?? default` / `!= null`). Typing them optional is what lets the
 * reducer drop the hand-written `hasOwnProperty` guards: optionality is now
 * expressed in the type, and the runtime guard is a plain nullish check.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** CONST_TYPE_AndruavMessage_GPS — position + GPS fix. */
export interface GpsPayload {
    la: number;                 // latitude
    ln: number;                 // longitude
    a: string;                  // absolute altitude (string on old units → parseFloat)
    r: string;                  // relative altitude
    '3D': number;               // GPS 3D fix
    SC: number;                 // satellite count
    p: string;                  // provider
    c?: number;                 // accuracy (optional)
    t?: number;                 // fix time (optional, defaults to receivedAt)
    s?: string;                 // ground speed (optional)
    b?: string;                 // bearing (optional)
}

/** CONST_TYPE_AndruavMessage_POW — mobile + optional FCB battery. */
export interface PowPayload {
    BL: number;                 // mobile battery level
    V: number;                  // mobile voltage
    BT: number;                 // battery temperature
    H: number;                  // health
    PS: number;                 // plug status
    FV?: number;                // FCB battery voltage (presence triggers the FCB block)
    FI?: number;                // FCB battery current
    FR?: number;                // FCB battery remaining
    T?: number;                 // FCB battery temperature
    C?: number;                 // FCB total current consumed
}

/** CONST_TYPE_AndruavMessage_NAV_INFO — orientation + target nav. */
export interface NavInfoPayload {
    d: string;                  // target bearing
    e: string;                  // wp distance
    a: string;                  // roll
    b: string;                  // pitch
    y: string;                  // yaw
    f: string;                  // alt error
}

/** CONST_TYPE_AndruavMessage_CommSignalsStatus — mobile signal info. */
export interface CommSignalsStatusPayload {
    r: number;                  // signal level
    s: number;                  // network type
    op?: string;                // operator name
    c?: string;                 // country ISO
    ds?: string;                // data state
}

/** CONST_TYPE_AndruavMessage_Communication_Line_Status — ws + p2p line. */
export interface CommLineStatusPayload {
    ws?: number;                // websocket line status
    p2p?: boolean;              // p2p line status
}

/** CONST_TYPE_AndruavMessage_UdpProxy_Info — telemetry proxy. */
export interface UdpProxyInfoPayload {
    a: string;                  // proxy ip
    p: number;                  // proxy port
    o: number;                  // telemetry level
    en: boolean;                // active
    z?: boolean;                // paused (optional, defaults false)
}

/** CONST_TYPE_AndruavMessage_HomeLocation — home point. */
export interface HomeLocationPayload {
    T: number;                  // lat
    O: number;                  // lng
    A: number;                  // alt
    R?: number;                 // radius accuracy
    H?: number;                 // altitude accuracy
}

/** CONST_TYPE_AndruavMessage_DistinationLocation — destination point. */
export interface DistinationLocationPayload {
    T: number;                  // lat
    O: number;                  // lng
    A: number;                  // alt
    P?: number;                 // destination type (optional, defaults 0)
}

/** CONST_TYPE_AndruavMessage_DroneReport — waypoint mission report. */
export interface DroneReportPayload {
    P: number;                  // mir
    R: number;                  // status
}

/** CONST_TYPE_AndruavMessage_Error — unit error / alert. */
export interface ErrorPayload {
    EN: number;                 // error number
    IT: number;                 // info type
    NT: number;                 // notification type
    DS: string;                 // description
}

/** CONST_TYPE_AndruavMessage_GEOFenceHit — fence breach. */
export interface GeoFenceHitPayload {
    n: string;                  // fence name
    z: boolean;                 // in zone
    o?: number | boolean;       // keep outside (1/0 or bool)
    d?: number;                 // distance (optional, defaults NaN)
}

/** CONST_TYPE_AndruavMessage_MODULE_HEALTH_STATUS — per-module resource usage. */
export interface ModuleHealthStatusPayload {
    k: string;                  // module key
    rs: number;                 // rss
    pk: number;                 // peak RSS over rolling window
    sw: number;                 // vmswap
    th: number;                 // threads
    sl: number;                 // slope
    tr: number;                 // trend
    hs: number;                 // status
    up: number;                 // uptime
}

/** CONST_TYPE_AndruavMessage_PRECLAND_STATUS — precision-landing module status. */
export interface PreclandStatusPayload {
    a: number;                  // state (CONST_PRECLAND_STATUS_*)
    b?: number;                 // processing fps
    c?: number;                 // last reprojection RMSE in px
    d?: number;                 // slant range in m
    e?: number[];               // fused tag ids
    f?: string;                 // error / gate reason
}

/** A single detected P2P node entry. */
export interface P2PNodeEntry {
    m: string;                  // mac
    p: string;                  // partyID
    c: boolean;                 // connected
    t?: number;                 // last time (defaults 0)
}

/** CONST_TYPE_AndruavMessage_P2P_InRange_Node — map of partyID → node. */
export type P2PInRangeNodePayload = Record<string, P2PNodeEntry>;

/** A single detected P2P BSSID entry. */
export interface P2PBssidEntry {
    p: string;                  // partyID
    b: string;                  // bssid
    s: string;                  // ssid
    c: number;                  // channel
    r: number;                  // rssi
    t: number;                  // last time
}

/** CONST_TYPE_AndruavMessage_P2P_InRange_BSSID — map of partyID → bssid. */
export type P2PInRangeBssidPayload = Record<string, P2PBssidEntry>;

/** CONST_TYPE_AndruavMessage_P2P_INFO — p2p link info. */
export interface P2PInfoPayload {
    c: number;                  // connection type
    a1: string;                 // address 1
    a2: string;                 // address 2
    wc: number;                 // wifi channel
    wp: string;                 // wifi password
    pa: string;                 // parent address
    pc: boolean;                // parent connected
    lp: string;                 // logical parent address
    f: string;                  // firmware
    a: boolean;                 // driver connected
    o: boolean;                 // p2p connected
    d?: boolean;                // p2p disabled (optional, defaults false)
}

/** CONST_TYPE_AndruavMessage_SDR_ACTION — sub-switched by `a`. */
export interface SdrActionPayload {
    a: number;                  // action code
    // SDR_INFO fields:
    fc?: number;                // center frequency
    r?: number;                 // display bars / gain / radius (per action)
    g?: number;                 // gain
    s?: number;                 // sample rate
    n?: string;                 // driver name
    c?: number;                 // status
    t?: number;                 // interval
    l?: number;                 // trigger level
    // LIST_SDR_DEVICES fields:
    dr?: string[];              // available drivers
    // TRIGGER fields:
    f?: number;                 // frequency
    v?: number;                 // value
    ln?: number;                // longitude
    la?: number;                // latitude
    A?: number;                 // altitude
    d?: number;                 // distance
}

/** CONST_TYPE_AndruavMessage_RemoteExecute — remote command relay. */
export interface RemoteExecutePayload {
    C: number;                  // inner message type (e.g. CONST_TYPE_AndruavMessage_ID)
}

/** Gimbal orientation sub-object. */
export interface GimbalOrientation {
    y?: number;                 // yaw
    p?: number;                 // pitch
    r?: number;                 // roll
}

/** CONST_TYPE_AndruavMessage_Viewlink_STATUS — sub-switched by `a`. */
export interface ViewlinkStatusPayload {
    a: number;                  // status code
    y?: number;                 // yaw (GIMBAL_ATTITUDE)
    p?: number;                 // pitch (GIMBAL_ATTITUDE)
    r?: number;                 // roll (GIMBAL_ATTITUDE)
    gm?: GimbalOrientation;     // gimbal (ALL)
    lrf?: { d?: number; a?: number; };  // LRF (ALL)
    tr?: any;                   // tracking (ALL)
    tracking?: any;             // tracking alt key (ALL)
    ai?: any;                   // AI (ALL)
    g?: any;                    // g (ALL)
}

/** A single geofence polygon point. */
export interface GeoFencePoint {
    a: string;                  // lat
    g: string;                  // lng
    l?: string;                 // alt (optional, defaults 0)
}

/** CONST_TYPE_AndruavMessage_GeoFence / ExternalGeoFence — fence definition. */
export interface GeoFencePayload {
    n: string;                  // fence name
    c: number;                  // point count
    r?: number;                 // maximum distance (optional, defaults 0)
    o?: number | boolean;       // keep outside (optional)
    t?: number;                 // fence type (1=linear, 2=polygon, 3=cylinder)
    [index: number]: GeoFencePoint;  // points indexed 0..count-1
}

/** CONST_TYPE_AndruavMessage_GeoFenceAttachStatus — attach/detach intent. */
export interface GeoFenceAttachStatusPayload {
    n: string;                  // fence name
    a: boolean;                 // is attached
}

/** A single waypoint step on the wire. */
export interface WayPointWireStep {
    t: number;                  // waypointType
    s?: number;                 // sequence
    g?: number;                 // longitude
    a?: number;                 // latitude
    l?: number;                 // altitude
    h?: number;                 // heading
    y?: number;                 // time to stay
    p?: number;                 // pitch
    e?: boolean;                // enable (guided)
    r?: number;                 // ascent/descent rate OR radius (circle)
    c?: number;                 // ascent/descent (continue+changealt)
    q?: boolean;                // header required (circle)
    x?: number;                 // xtrack location (circle)
    n?: number;                 // turns (circle)
}

/** CONST_TYPE_AndruavMessage_WayPoints — chunked waypoint download. */
export interface WayPointsPayload {
    n: number;                  // waypoint count
    i?: number;                 // chunk index (optional, defaults NO_CHUNK)
    [index: number]: WayPointWireStep;  // waypoints indexed 0..n-1
}

/** A single search target entry. */
export interface SearchTargetEntry {
    n: string;                  // name
    t?: string;                 // type (optional, defaults 'na')
}

/** CONST_TYPE_AndruavMessage_SearchTargetList — searchable targets. */
export interface SearchTargetListPayload {
    t: SearchTargetEntry[];     // targets list
}

/** A single detected tracking target. */
export interface TrackingTargetEntry {
    a: number;                  // x1
    b: number;                  // y1
    r?: number;                 // radius (if present, x2/y2 omitted)
    c?: number;                 // x2 (when no radius)
    d?: number;                 // y2 (when no radius)
    p?: number;                 // probability
    n?: string;                 // name (optional, defaults 'default')
}

/** CONST_TYPE_AndruavMessage_TargetTrackingtLocation — detected targets. */
export interface TargetTrackingLocationPayload {
    t: TrackingTargetEntry[];   // targets list
}

/** CONST_TYPE_AndruavMessage_CameraList — available cameras. */
export interface CameraListPayload {
    T: any[];                   // video tracks
    R?: boolean;                // reply flag (optional)
}

/** CONST_TYPE_AndruavMessage_SOUND_LIST — available sound files. */
export interface SoundListPayload {
    T: any[];                   // sound files
    R?: boolean;                // reply flag (optional)
}

/** CONST_TYPE_AndruavMessage_CONFIG_STATUS — module config template reply. */
export interface ConfigStatusPayload {
    R: boolean;                 // reply flag
    k: string;                  // module key
    b: any;                     // template body
}

/** CONST_TYPE_AndruavMessage_Signaling — WebRTC SDP/ICE/hangup. */
export interface SignalingPayload {
    w?: any;                    // wrapped signal (when present, unwrap; else bare payload)
    [key: string]: any;
}

/** Home-location sub-message embedded in the ID payload. */
export interface IDHomeLocationSub extends HomeLocationPayload {}

/**
 * CONST_TYPE_AndruavMessage_ID — the unit identity message. Most fields are
 * optional because units send incremental ID updates; only the always-present
 * core identity fields are required.
 */
export interface IDPayload {
    GS: boolean;                // is GCS
    UD: string;                 // unit name
    DS: string;                 // description
    VT: number;                 // vehicle type
    VR: boolean;                // video recording
    GM: number;                 // gps mode
    p: string;                  // permissions
    FI?: boolean;               // use FCB IMU (optional, defaults false)
    TP?: number;                // telemetry protocol (optional, defaults Unknown)
    T?: number;                 // time sync
    AP?: number;                // autopilot
    m1?: any[];                 // module list
    dv?: string;                // DroneEngage version
    av?: string;                // Andruav version
    B?: boolean;                // GCS blocked
    C?: number;                 // telemetry level
    SD?: boolean;               // is shutdown
    FM?: number;                // flight mode
    AR?: boolean | number;      // arming (bool or bitmask)
    FL?: boolean;               // is flying
    z?: number;                 // flying last start time (ms)
    a?: number;                 // flying total duration (ms)
    DE?: boolean;               // DE pilot enabled
    DO?: number;                // DE pilot operation
    n?: number;                 // swarm formation as follower
    o?: number;                 // swarm formation as leader
    q?: string;                 // swarm following
    senderName?: string;        // envelope sender (fallback for setPartyID)
    [key: string]: any;         // home-location sub-message keyed by HomeLocation type, etc.
}
