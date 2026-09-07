# TASK-02 — Split the inbound parser into decode / reduce / effects

**Depends on:** TASK-01 (the unit model must be DOM-free first).
**Blocks:** TASK-03, TASK-06.
**Size:** large (~2 weeks). **Risk:** high — this is the hot path.

## Goal

`parseCommunicationMessage` is one 1,886-line `switch` that does five jobs at once.
Separate them into three **pure** functions plus one impure caller, so that the inbound
direction mirrors the outbound direction you already built correctly in
`src/js/protocol/messages/js_commands_api.js`.

The concrete win: `reduce()` becomes testable with a captured JSON frame and no browser,
and field-level change notification lands at the point where the field is actually known.

---

## Current state

**File:** `src/js/protocol/server_comm/js_andruav_parser.js` (1,886 lines)

Entry points:

- `parseCommunicationMessage(Me, msg, evt)` — line 232, the main switch
- `parseBinaryAndruavMessage(v_unit, andruavCMD, data, idx, byteLength)` — line 1780
- `#prv_parseUnitMavlinkMessage(p_unit, p_mavlinkPacket)` — line 1425
- `_handleUnitIDMessage(p_unit, p_jmsg, isNewUnit)` — line 1193

The five jobs, all interleaved inside the switch:

1. **Transport decode** — `JSON.parse`, plus 22 `typeof x === 'string' || x instanceof String`
   backward-compatibility branches.
2. **Entity lifecycle** — creates `CAndruavUnitObject`s (being centralised by TASK-07).
3. **Model mutation** — writes directly onto `p_unit.m_*`.
4. **Outbound network requests** — **13 live call sites** (`grep -c` reports 14; line 228
   is a commented-out `API_requestIMU` — delete that dead comment too), e.g.
   ```js
   #prv_onNewUnitAdded(target) {                                  // line 224
     AndruavClientFacade.API_requestGeoFencesAttachStatus(target);
     AndruavClientFacade.API_requestUdpProxyStatus(target);
     AndruavClientFacade.API_requestWayPoints(target);
   }
   // and, mid-switch:
   p_unit.m_delayedTimeout = setTimeout(                          // line 1391
     () => AndruavClientFacade.API_requestP2P(p_unit), 1000);
   ```
5. **Event dispatch** — 60 `js_eventEmitter.fn_dispatch` calls.

Job 4 is what creates the `js_andruav_parser <-> js_andruav_facade` import cycle
(cycle #3 of the 13 that `madge` reports) and what makes the parser untestable.

---

## Target state

Four modules under `src/js/core/protocol/`:

```
decode.js    fn_decode(rawFrame)              -> Message        pure
reduce.js    fn_reduce(unitSnapshot, Message) -> FieldPatch[]   pure
effects.js   fn_effects(unitSnapshot, Message)-> Command[]      pure
runtime.js   the only impure part — applies patches, dispatches commands
```

### Contracts

```js
/** @typedef {{ type: number, senderID: string, payload: object, raw?: Uint8Array }} Message */

/** @typedef {{ path: string, value: * }} FieldPatch
 *  path is a dot-path into the unit, e.g. "m_Nav_Info.p_Location.lat"
 *  — the SAME path format useUnitField already consumes. */

/** @typedef {{ kind: string, target?: string, args?: object, delayMs?: number }} Command
 *  kind is a name from a frozen COMMANDS map, e.g. 'REQUEST_WAYPOINTS'.
 *  delayMs replaces the inline setTimeout at line 1391. */
```

### `runtime.js` — the impure caller

```js
export function fn_handleFrame(p_rawFrame) {
    const msg    = fn_decode(p_rawFrame);
    const unit   = fn_getOrCreateUnit(msg.senderID, ...);   // from TASK-07
    const patches = fn_reduce(unit, msg);
    const cmds    = fn_effects(unit, msg);

    fn_applyPatches(unit, patches);   // mutate + notifyUnitFieldChanged per patch
    fn_dispatchCommands(cmds);        // the ONLY place the facade is called
}
```

**`reduce.js` and `effects.js` must not import `js_andruav_facade.js`.** That inversion —
returning what should be sent instead of sending it — is what breaks the cycle. It is the
single most important constraint in this task.

### `fn_applyPatches` and the render fix

```js
function fn_applyPatches(p_unit, p_patches) {
    for (const patch of p_patches) {
        fn_setByPath(p_unit, patch.path, patch.value);
        notifyUnitFieldChanged(p_unit.getPartyID(), patch.path);
    }
}
```

`notifyUnitFieldChanged` already exists in `src/js/store/unitStore.js` and is already
consumed by `useUnitField`. Today it is fed by a **hand-written bridge** in
`src/js/js_main.js:66-120` — one line per (event, field) pair, guessing after the fact
which field moved. That bridge becomes redundant here because `reduce()` knows exactly
which field it wrote.

**Delete the bridge block in `js_main.js` only when every event it covers is emitted as a
patch instead.** It currently covers `EE_onTrackingStatusChanged`,
`EE_onTrackingAIStatusChanged`, `EE_onTrackingAIObjectListUpdate`,
`EE_onAndruavUnitSwarmUpdated`, `EE_andruavUnitArmedUpdated`, `EE_unitOnlineChanged`,
`EE_andruavUnitFCBUpdated`.

---

## Steps

Do **not** rewrite all 1,886 lines at once. Migrate message type by message type, keeping
the old switch as the fallback for anything not yet migrated.

1. Create the four modules with the typedefs and an empty `fn_reduce` that returns `[]`.
   Add `fn_setByPath` (a small, tested dot-path setter). Commit.
2. Wire `fn_handleFrame` into `js_andruav_ws.js` **behind the existing switch**: run the
   new path, then fall through to `parseCommunicationMessage` for any message type not yet
   in the new `reduce`. Both run; the new one is a no-op for unmigrated types. Commit.
3. Migrate `CONST_TYPE_AndruavMessage_GPS` first (`js_andruav_parser.js:333`). It is the
   highest-frequency message and the simplest — pure field writes, one dispatch. Write its
   `reduce` test with a captured frame before migrating the call site. Commit.
4. Migrate in this order, one commit each — highest frequency first, so the render benefit
   arrives early:
   `POW` -> `Nav/FCB` -> `CommSignalsStatus` -> `Communication_Line_Status` ->
   `ID` -> `Chat` -> `SDR` -> `P2P` -> `GPIO` -> geofence -> waypoints -> tracking ->
   camera/sound/servo -> everything else.
5. Move the 13 `API_request*` calls into `fn_effects` as `Command` objects as you migrate
   the message type that triggers them. `#prv_onNewUnitAdded` becomes three commands with
   `kind: 'REQUEST_GEOFENCE_STATUS' | 'REQUEST_UDP_PROXY_STATUS' | 'REQUEST_WAYPOINTS'`.
   The `setTimeout` at line 1391 becomes `{ kind: 'REQUEST_P2P', delayMs: 1000 }`.
6. When the switch is empty, delete `parseCommunicationMessage` and remove the
   `js_andruav_facade` import from the parser file. Commit.
7. Delete the `js_main.js` bridge block. Commit.

---

## Do not change

- The wire protocol. Every field name, every abbreviated key (`la`, `ln`, `a`, `r`, `3D`,
  `SC`, ...) stays exactly as it is. This is a shared protocol with `de_comm` and Android
  clients — a change here breaks other projects in the ecosystem.
- The 22 `string`/`String` backward-compatibility branches. Move them into `decode.js`;
  do not remove them. Old units still send stringified payloads.
- Message type constants in `js_andruavMessages.js`.
- The binary path's `Uint8Array` handling — `parseBinaryAndruavMessage` may stay as-is for
  this task. Note it as a follow-up.
- MAVLink decode (`#prv_parseUnitMavlinkMessage`) — leave in place, migrate later.

## Acceptance

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

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> at most 12 cycles (parser<->facade gone)
```

**The real acceptance test.** `src/js/core/protocol/reduce.test.js` must exist and must
contain, at minimum, one test per migrated message type that:
- takes a captured raw frame as a string literal,
- calls `fn_decode` then `fn_reduce`,
- asserts the exact `FieldPatch[]`,
- and opens **no socket and no DOM**.

Capture real frames from a live session before you start; do not invent them.

Manual check: full flight session against SITL — telemetry, arming, flight-mode change,
geofence load, waypoint upload/download, chat, and a unit going offline and returning.
