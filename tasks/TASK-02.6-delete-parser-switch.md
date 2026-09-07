# TASK-02.6 — Delete parseCommunicationMessage and close TASK-02

**Parent:** TASK-02 (steps 6 + 7 — the final cleanup).
**Depends on:** TASK-02.1 through TASK-02.5 (all JSON-switch cases migrated).
**Blocks:** TASK-03 (split the event bus), TASK-06 (types on core).
**Size:** small. **Risk:** low — mechanical deletion after all cases are gone.

## Goal

With every JSON-switch case migrated to `reduce.js` / `runtime.js`, the old
`parseCommunicationMessage` is an empty shell. Delete it, remove the parser's
last impure dependencies, and close the parent TASK-02.

This is the commit that makes the parent task's full acceptance section pass.

## Current state

After TASK-02.1–02.5, `parseCommunicationMessage` at
`src/js/protocol/server_comm/js_andruav_parser.js:228` contains:

- The top-of-function message accounting (`fn_addMsg`, `m_received_msg++`,
  `m_received_bytes`, `m_lastActiveTime`) — **duplicated** in `runtime.js:54-57`.
- The `fn_getOrCreateUnit` + `shouldRequestID` call — **duplicated** in
  `runtime.js:48-51`.
- An empty `switch (msg.messageType)` where every case is either deleted or a
  dead-code fallthrough marker (the `// Migrated to core/protocol/reduce.js`
  markers added during migration).
- `return` statements inside the old switch that are now unreachable (the
  runtime returns `true` for migrated types before the old switch runs).

The parser class still holds:

- `this.v_callbackListeners` — deleted in TASK-02.4.
- `this.m_andruavGeoFences` — deleted in TASK-02.1.
- `this.EVT_andruavSignalling` — deleted in TASK-02.5.
- `js_globals.v_waypointsCache` init — deleted in TASK-02.2.
- `fn_callbackOnMessageID` / `fn_callbackOnMessageID_Answer` — deleted in TASK-02.4.
- `#prv_parseFenceInfo` — deleted in TASK-02.1.
- `_fn_checkStatus` — still live (the periodic online/offline + request-ID timer).
  It dispatches `__facadeRequestID` / `__facadeGetHomeLocation`, already wired in
  `fn_initFacadeSubscriptions`. **Keep it** — it is not part of the switch.
- `parseBinaryAndruavMessage` (line 1421) — **out of scope** per TASK-02 "Do not
  change". Keep it. It is the binary path (MAVLink, servo, IMG, TELNET_DATA,
  SDR_SPECTRUM) and stays in the parser for now.
- `#prv_parseUnitMavlinkMessage` — **out of scope**. Keep it.

## Target state

### 1. Delete `parseCommunicationMessage`

Remove the method (line 228 through its closing brace). The
`fn_handleFrame` → `parseCommunicationMessage` fallthrough in
`js_andruav_ws.js:612-613` becomes unreachable — `fn_handleFrame` always returns
`true` now (every JSON type is migrated). Simplify the call site:

```js
// js_andruav_ws.js — before:
if (!fn_handleFrame(p_jmsg, evt)) {
    js_andruav_parser.AndruavClientParser.parseCommunicationMessage(Me, p_jmsg, evt);
}
// after:
fn_handleFrame(p_jmsg, evt);
```

Keep `fn_handleFrame`'s `fn_isMigrated` guard as a safety net — if a future
message type is added to the protocol but not to `fn_isMigrated`, the guard
returns `false` and the frame is silently dropped (with a console warning). This
is better than the old behavior of falling through to a deleted switch.

### 2. Remove the parser's `js_andruav_facade` import

After TASK-02's earlier commits the parser no longer calls the facade directly,
but verify the import is gone (it was removed in commit `f4747275`). If any
facade reference remains (e.g. in `_fn_checkStatus` via `__facade*` events —
those go through the emitter, not a direct import), remove the import line.

### 3. Remove dead parser-instance state

After TASK-02.1–02.5, the parser constructor (`fn_init`) should have lost:
- `this.v_callbackListeners = {}` (TASK-02.4)
- `this.m_andruavGeoFences = {}` (TASK-02.1)
- `this.EVT_andruavSignalling = {}` (TASK-02.5)
- `js_globals.v_waypointsCache = {}` (TASK-02.2)
- `this.EVT_andruavUnitGeoFenceDeleted = function () { }` (TASK-02.1 — no live callers)

Verify each is gone. If any remain, delete them in this commit.

### 4. Delete the `js_main.js` bridge block (TASK-02 step 7)

Already done in commit `80f9b472` ("remove __unitStoreBridge"). Verify:

```bash
grep -n "__unitStoreBridge" src/js/js_main.js  # -> zero
```

If it's gone, skip. If it reappeared, delete it.

## Steps

1. Verify every JSON-switch case is migrated:
   ```bash
   grep -c "case js_andruavMessages.CONST_TYPE_AndruavMessage_" src/js/protocol/server_comm/js_andruav_parser.js
   ```
   The only remaining `case` lines should be in `parseBinaryAndruavMessage`
   (binary path, out of scope). If any JSON-switch cases remain, **stop** — go
   back and finish the relevant sub-task. Commit not allowed until zero.
2. Delete `parseCommunicationMessage`. Simplify `js_andruav_ws.js` to call
   `fn_handleFrame` directly (no fallthrough). Commit.
3. Remove any remaining dead parser-instance state from `fn_init` / constructor.
   Commit.
4. Run the full parent TASK-02 acceptance section (below). If all pass, the
   parent task is done. Commit a final `refactor(TASK-02): close task — all
   message types migrated, parser switch deleted` marker if step 2+3 were
   already one commit.

## Do not change

- `parseBinaryAndruavMessage` and `#prv_parseUnitMavlinkMessage` — out of scope,
  stay in the parser. Note them as a follow-up task (TASK-02.7 or a separate
  binary-path task) but do not touch them here.
- `_fn_checkStatus` — stays. It uses `__facade*` events, not a direct facade
  import. It is the periodic health-check timer, not part of the message switch.
- The wire protocol. Nothing in this task touches payload keys.
- `fn_handleFrame`'s `fn_isMigrated` guard — keep it as a safety net.

## Acceptance (parent TASK-02 full acceptance — must all pass)

```bash
# the cycle is broken: reduce and effects know nothing about the facade
grep -n "js_andruav_facade\|AndruavClientFacade" src/js/core/protocol/reduce.js   # -> zero
grep -n "js_andruav_facade\|AndruavClientFacade" src/js/core/protocol/effects.js  # -> zero
grep -n "js_andruav_facade\|AndruavClientFacade" src/js/core/protocol/decode.js   # -> zero

# reduce/effects/decode touch no globals and no DOM
grep -n "js_globals\|document\.\|window\." src/js/core/protocol/reduce.js         # -> zero

# the old parser no longer calls the facade (13 live sites + 1 dead comment on line 228)
grep -c "AndruavClientFacade.API_" src/js/protocol/server_comm/js_andruav_parser.js  # -> 0

# the hand-written bridge is gone
grep -n "__unitStoreBridge" src/js/js_main.js                                     # -> zero

# parseCommunicationMessage is gone
grep -n "parseCommunicationMessage" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero
grep -n "parseCommunicationMessage" src/js/protocol/server_comm/js_andruav_ws.js      # -> zero

# the JSON switch is gone (only binary-path cases remain)
grep -c "case js_andruavMessages.CONST_TYPE_AndruavMessage_" src/js/protocol/server_comm/js_andruav_parser.js  # -> only binary-path cases

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> at most 12 cycles (parser<->facade gone)
```

**Real acceptance:** `src/js/core/protocol/reduce.test.js` exists and contains
one test per migrated message type (GPS, POW, NAV_INFO, CommSignalsStatus,
Communication_Line_Status, ID, Chat, UdpProxy_Info, TargetTracking_STATUS,
AI_Recognition_STATUS, CameraFlash, CameraZoom, HomeLocation, DistinationLocation,
DroneReport, GPIO_STATUS, TELNET_STATUS, Error, GEOFenceHit, MODULE_HEALTH_STATUS,
P2P_InRange_Node, P2P_InRange_BSSID, P2P_INFO, SDR_ACTION, RemoteExecute,
Viewlink_STATUS, GeoFence, ExternalGeoFence, GeoFenceAttachStatus, WayPoints,
SearchTargetList, TargetTrackingtLocation, CameraList, SOUND_LIST, CONFIG_STATUS,
Signaling) — each taking a captured raw frame, calling `fn_decode` then
`fn_reduce`, asserting the exact result, opening no socket and no DOM.

Manual check: full flight session against SITL — telemetry, arming, flight-mode
change, geofence load, waypoint upload/download, chat, camera list, sound list,
module config, WebRTC video, and a unit going offline and returning.
