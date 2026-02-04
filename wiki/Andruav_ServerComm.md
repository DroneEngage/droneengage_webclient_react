`server_comm` is the Andruav Web Client communication layer responsible for connecting to the Andruav Communication Server (CommServer) via WebSocket and translating raw protocol messages into internal UI events.

It is implemented in these modules:

- `src/js/server_comm/js_andruav_ws.js` (WebSocket transport + envelope)
- `src/js/server_comm/js_andruav_parser.js` (inbound parsing/decoding + event dispatch)
- `src/js/server_comm/js_andruav_facade.js` (outbound high-level API used by UI)

---

# 1) Connection & Session Flow

## 1.1 Authentication (HTTP)

Authentication is handled by `src/js/js_andruav_auth.js`.

- The client performs an HTTP login request (`/w/wl/`) using `CAndruavAuth.fn_do_loginAccount()`.
- On success, the server response includes:

- `sid` (session id)
- CommServer info in `cs`:
  - `g` public host
  - `h` port
  - `f` temporary login key

When WebPlugin mode is enabled, `/w/wl/` is served by the local plugin and the response also includes:

- `plugin_party_id`: a plugin-generated party id.
  - The WebClient must use this as its `partyID` ONLY when connecting to the plugin's WSS.
  - This is independent from `sid`.

These are stored in `js_andruavAuth` fields:

- `js_andruavAuth._m_session_ID`
- `js_andruavAuth.m_server_ip`
- `js_andruavAuth.m_server_port`
- `js_andruavAuth.server_AuthKey`

The UI subscribes to `EE_Auth_Logined` and then proceeds to establish the WebSocket:

- `src/js/js_main.js` subscribes:
  - `js_eventEmitter.fn_subscribe(js_event.EE_Auth_Logined, this, fn_connectWebSocket);`

## 1.2 WebSocket connect

`fn_connectWebSocket()` (in `src/js/js_main.js`) configures the singleton `AndruavClientWS` and calls:

- `AndruavClientWS.fn_connect(js_andruavAuth.fn_getSessionID());`

The following fields must be set before connect:

- `AndruavClientWS.partyID` (from UI `#txtUnitID`)
- `AndruavClientWS.unitID` (same as partyID for web client)
- `AndruavClientWS.m_groupName` (from UI `#txtGroupName`)
- `AndruavClientWS.m_server_ip` / `m_server_port` / `m_server_port_ss`
- `AndruavClientWS.server_AuthKey`
- `AndruavClientWS.m_permissions` (from `js_andruavAuth.fn_getPermission()`)

### WebSocket URL

The WS URL is built in `CAndruavClientWS.fn_connect()`:

- `ws://<m_server_ip>:<m_server_port>?f=<server_AuthKey>&s=<partyID>&at=g`
- `wss://<m_server_ip>:<m_server_port_ss>?f=<server_AuthKey>&s=<partyID>&at=g`

Notes:

- `f` is the CommServer temp key.
- `s` is the client `partyID`.
- `at=g` identifies the actor type as GCS.

## 1.3 Socket status model

`AndruavClientWS.socketStatus` uses `js_andruavMessages.CONST_SOCKET_STATUS_*`:

- `FREASH` (1)
- `CONNECTING` (2)
- `DISCONNECTING` (3)
- `DISCONNECTED` (4)
- `CONNECTED` (5)
- `REGISTERED` (6)
- `UNREGISTERED` (7)
- `ERROR` (8)

### Local events emitted by socket layer

The socket layer publishes state transitions via `js_eventEmitter`:

- `EE_onSocketStatus2` payload: `{ status, name }`
- `EE_WS_OPEN` emitted when status becomes `REGISTERED`
- `EE_WS_CLOSE` emitted from `ws.onclose`
- `EE_onDeleted` emitted after successful logout from CommServer

## 1.4 Registration, periodic ID, and unit discovery

When the CommServer confirms connection (`CONST_TYPE_AndruavSystem_ConnectedCommServer`), the socket transitions:

- `CONNECTED` then `REGISTERED`

On `REGISTERED`:

- `EE_WS_OPEN` is emitted.
- The web client immediately broadcasts identity:
  - `AndruavClientFacade.API_sendID()`
- A periodic timer is started (`js_andruavMessages.CONST_sendID_Interverl`):
  - re-sends `API_sendID()`
  - emits `EE_adsbExpiredUpdate`
- A global discovery request is sent:
  - `AndruavClientFacade.API_requestID()` (group broadcast)

---

# 2) Transport Message Envelope

## 2.1 JSON message structure

Outgoing JSON messages are constructed by `AndruavClientWS.fn_generateJSONMessage()`:

- `ty`: routing type
- `sd`: sender partyID
- `st`: sender type (`w` = web)
- `tg`: target partyID (or special targets)
- `mt`: message type id
- `ms`: payload (object)

### Routing types

Routing codes are internal to `js_andruav_ws.js`:

- `s` system command
- `c` communication command (not used directly as envelope `ty` for normal messages)

Communication routing modes:

- `g` group broadcast
- `i` individual target

Special targets:

- `_GCS_` : all GCS targets
- `_AGN_` : all drone/agent targets

## 2.2 Binary framing

Binary messages are sent using `AndruavClientWS.API_sendBinCMD()`:

- A JSON header is serialized first (same envelope keys).
- The header is concatenated with the binary payload.

On receive, `AndruavClientWS` extracts the JSON header (via `fn_extractString`) and passes the remaining bytes to:

- `AndruavClientParser.parseBinaryAndruavMessage()`

---

# 3) Inbound Parsing & Event Dispatch

All inbound processing is handled by `src/js/server_comm/js_andruav_parser.js`.

## 3.1 Unit creation & refresh

For any inbound message, the parser resolves the sender into a `CAndruavUnitObject`:

- Creates a new unit if unknown.
- Tracks message statistics (`m_received_msg`, bytes, last active time).

If a unit is newly discovered and the message is not an `ID` message, the client may request identity:

- `AndruavClientFacade.API_requestID(senderPartyID)`

## 3.2 Core messages -> UI events

Below is the practical mapping used by the web client.

### Identity & unit lifecycle

- `CONST_TYPE_AndruavMessage_ID`:
  - Updates unit metadata, permissions, vehicle type, swarm info, etc.
  - Emits:
    - `EE_andruavUnitAdded` (new unit)
    - `EE_unitUpdated` (existing unit)
    - `EE_onModuleUpdated` (if module list changed)
    - `EE_andruavUnitFCBUpdated`
    - `EE_andruavUnitArmedUpdated`
    - `EE_andruavUnitFlyingUpdated`
    - `EE_andruavUnitFightModeUpdated`
    - `EE_andruavUnitVehicleTypeUpdated`
    - `EE_onAndruavUnitSwarmUpdated`
    - `EE_HomePointChanged` (when embedded home is present)
    - `EE_unitOnlineChanged` (shutdown/back-online status)

### Navigation / GPS

- `CONST_TYPE_AndruavMessage_GPS`:
  - Updates `m_Nav_Info.p_Location`, fix, sat count.
  - Emits: `EE_msgFromUnit_GPS`

- `CONST_TYPE_AndruavMessage_NAV_INFO`:
  - Updates roll/pitch/yaw, target bearing, waypoint distance.
  - Emits: `EE_unitNavUpdated`

- `CONST_TYPE_AndruavMessage_HomeLocation`:
  - Updates unit home tag.
  - Emits: `EE_HomePointChanged`

- `CONST_TYPE_AndruavMessage_DistinationLocation`:
  - Updates destination tag.
  - Emits: `EE_DistinationPointChanged`

### Power

- `CONST_TYPE_AndruavMessage_POW`:
  - Updates mobile + FCB battery.
  - Emits: `EE_unitPowUpdated`

### GeoFence

- `CONST_TYPE_AndruavMessage_GeoFence`:
  - Parses fence definition.
  - Emits: `EE_andruavUnitGeoFenceUpdated`

- `CONST_TYPE_AndruavMessage_ExternalGeoFence` (sender must be `_sys_`):
  - Parses system-provided fence.
  - Emits: `EE_andruavUnitGeoFenceUpdated`

- `CONST_TYPE_AndruavMessage_GeoFenceAttachStatus`:
  - Updates fence attachment state.

- `CONST_TYPE_AndruavMessage_GEOFenceHit`:
  - Emits: `EE_andruavUnitGeoFenceHit` payload `{ unit, fenceHit }`

### Waypoints

- `CONST_TYPE_AndruavMessage_WayPoints`:
  - Parses waypoint list (supports chunking).
  - Emits: `EE_msgFromUnit_WayPoints` payload `{ unit, wps }`

- `CONST_TYPE_AndruavMessage_DroneReport`:
  - Emits: `EE_msgFromUnit_WayPointsUpdated` payload `{ unit, mir, status }`

### Camera & video control

- `CONST_TYPE_AndruavMessage_CameraList`:
  - Updates `unit.m_Video.m_videoTracks`.
  - May resolve a callback registered by `fn_callbackOnMessageID()`.

- `CONST_TYPE_AndruavMessage_CameraZoom`:
  - Emits: `EE_cameraZoomChanged` payload `{ p_unit, p_jmsg }`

- `CONST_TYPE_AndruavMessage_CameraFlash`:
  - Emits: `EE_cameraFlashChanged` payload `{ p_unit, p_jmsg }`

### P2P

- `CONST_TYPE_AndruavMessage_P2P_INFO`:
  - Updates unit P2P config.
  - Emits: `EE_unitP2PUpdated`

- `CONST_TYPE_AndruavMessage_P2P_InRange_Node`
- `CONST_TYPE_AndruavMessage_P2P_InRange_BSSID`
  - Updates detected nodes/APs.
  - Emits: `EE_unitP2PUpdated`

### SDR

- `CONST_TYPE_AndruavMessage_SDR_ACTION`:
  - Updates SDR config/status.
  - Emits:
    - `EE_unitSDRUpdated`
    - `EE_unitSDRTrigger` (for triggers)

Binary:

- `CONST_TYPE_AndruavMessage_SDR_SPECTRUM`:
  - Emits: `EE_unitSDRSpectrum`

### Telemetry proxy

- `CONST_TYPE_AndruavMessage_UdpProxy_Info`:
  - Updates udp-proxy info.
  - Emits: `EE_onProxyInfoUpdated`

### Tracking (experimental)

- `CONST_TYPE_AndruavMessage_Target_STATUS`:
  - Emits: `EE_onTrackingStatusChanged`

- `CONST_TYPE_AndruavMessage_AI_Recognition_STATUS`:
  - Emits:
    - `EE_onTrackingAIStatusChanged`
    - `EE_onTrackingAIObjectListUpdate`

- `CONST_TYPE_AndruavMessage_SearchTargetList`:
  - Emits: `EE_SearchableTarget`

- `CONST_TYPE_AndruavMessage_TrackingTargetLocation`:
  - Emits: `EE_DetectedTarget`

### Errors

- `CONST_TYPE_AndruavMessage_Error`:
  - Emits: `EE_andruavUnitError` payload `{ unit, err }`

### Signaling (WebRTC)

- `CONST_TYPE_AndruavMessage_Signaling`:
  - Calls `AndruavClientParser.EVT_andruavSignalling(unit, signal)`.
  - WebRTC integration is documented separately in `wiki/Andruav_WebRTC.md`.

---

# 4) Outbound API (Facade)

All outbound user actions should use `src/js/server_comm/js_andruav_facade.js` (not the socket directly).

## 4.1 General notes

- Most facade methods end up calling `AndruavClientWS.API_sendCMD(targetPartyID, messageType, payload)`.
- Some calls use `RemoteExecute` (`CONST_TYPE_AndruavMessage_RemoteExecute`) with a sub-command in `payload.C`.
- Some calls are binary (MAVLink) via `API_sendBinCMD()`.

## 4.2 Common APIs

Identity / discovery:

- `API_sendID(targetPartyID)`
- `API_requestID(partyID)`

Flight:

- `API_do_Arm(unit, toArm, emergencyDisarm)` -> `CONST_TYPE_AndruavMessage_Arm`
- `API_do_FlightMode(unit, flightMode)` -> `CONST_TYPE_AndruavMessage_FlightControl`
- `API_do_Land(unit)` -> `CONST_TYPE_AndruavMessage_Land`
- `API_do_ChangeAltitude(unit, altitude)`
- `API_do_YAW(unit, targetAngle, turnRate, isClockwise, isRelative)`

Waypoints / missions:

- `API_requestWayPoints(unit, enableFCB)` -> `RemoteExecute` (`GET_WAY_POINTS` or `RELOAD_WAY_POINTS_FROM_FCB`)
- `API_uploadWayPoints(unit, eraseFirst, textMission)`
- `API_uploadDEMission(unit, eraseFirst, jsonMission)`
- `API_requestDeleteWayPoints(unit)` -> `RemoteExecute` (`CLEAR_WAY_POINTS`)

GeoFence:

- `API_requestGeoFences(unit, fenceName)`
- `API_requestDeleteGeoFences(unit, fenceName)` -> `RemoteExecute` (`CLEAR_FENCE_DATA`)
- `API_requestGeoFencesAttachStatus(unit, fenceName)`

Camera:

- `API_requestCameraList(unit, callback)`
- `API_SwitchCamera(targetPartyID, cameraUniqueName)`
- `API_TurnMobileFlash(targetPartyID, flashOn, cameraUniqueName)`
- `API_CONST_RemoteCommand_zoomCamera(targetPartyID, cameraUniqueName, zoomIn, zoomValue, zoomStep)`

Remote control (gamepad -> RC channels):

- `API_engageRX(unit)` / `API_disengageRX(unit)`
  - Emits local UI events:
    - `EE_requestGamePad`
    - `EE_releaseGamePad`
- RC channel updates are periodically sent as `CONST_TYPE_AndruavMessage_RemoteControl2`.

Telemetry control:

- `API_resumeTelemetry(unit)` / `API_pauseTelemetry(unit)` / `API_stopTelemetry(unit)`
  - `API_stopTelemetry()` emits: `EE_unitTelemetryOff`

P2P / SDR / GPIO:

- `API_requestP2P(unit)`
- `API_requestSDR(unit)` / `API_scanSDRDrivers(unit)` / `API_scanSDRFreq(unit,onOff)` / `API_setSDRConfig(...)`
- `API_requestGPIOStatus(unit, moduleKey, pinNumber)` / `API_writeGPIO(...)` / `API_writeGPIO_PWM(...)`

MAVLink (binary):

- `API_WriteParameter(unit, mavlink_param)` -> sends `CONST_TYPE_AndruavBinaryMessage_Mavlink`
- `API_requestMavlinkHeartBeat(unit)`
- `API_requestMavlinkServoChannel(unit)`

---

# 5) Behavior notes (reconnect, health)

- The socket layer does not implement an explicit reconnect loop. Connection initiation is driven by auth events (`EE_Auth_Logined`) and UI actions.
- There is a periodic `sendID` timer once registered, used both as a presence/heartbeat and for periodic housekeeping (`EE_adsbExpiredUpdate`).
- Unit liveness is tracked in the parser (`_fn_checkStatus`) using `m_lastActiveTime`, and emits `EE_unitOnlineChanged` when a unit is considered disconnected.

---

# 6) See also

- `wiki/Andruav_Authentication.md` (HTTP auth and session)
- `wiki/Andruav_Unit.md` (unit model)
- `wiki/Andruav_WebRTC.md` (signaling + WebRTC)
