# TASK-02.1 — Migrate geofence messages to reduce/effects

**Parent:** TASK-02 (step 4, geofence group).
**Depends on:** TASK-02 steps 1-3 done (core/protocol modules exist, fn_handleFrame wired).
**Blocks:** TASK-02.6 (final cleanup — cannot delete `parseCommunicationMessage` while geofence cases remain).
**Size:** medium. **Risk:** medium — `m_andruavGeoFences` is a shared registry.

## Goal

Migrate the three geofence message types still in the old switch into `reduce.js` /
`effects.js`, and extract the parser-instance `m_andruavGeoFences` fence registry
into its own module so `reduce` stays pure.

## Current state

Three cases remain in `parseCommunicationMessage` (`src/js/protocol/server_comm/js_andruav_parser.js`):

| Case | Line | Complexity |
|---|---|---|
| `CONST_TYPE_AndruavMessage_GeoFence` | 618 | easy — delegates to `#prv_parseFenceInfo` |
| `CONST_TYPE_AndruavMessage_ExternalGeoFence` | 568 | easy — same, with `senderName === '_sys_'` guard |
| `CONST_TYPE_AndruavMessage_GeoFenceAttachStatus` | 629 | **hard** — reads/writes `this.m_andruavGeoFences` |

`#prv_parseFenceInfo` (line 167) is pure: it builds a `geoFenceInfo` object from the
payload and dispatches `EE_andruavUnitGeoFenceUpdated`. No parser-instance state read.

`GeoFenceAttachStatus` is the blocker. It reads `this.m_andruavGeoFences[fenceName]`,
mutates `fence.Units[partyID]`, and dispatches `__facadeRequestGeoFences` when a fence
is missing. The registry is **not** unit state — it cannot live in `reduce`.

### The registry is shared

`this.m_andruavGeoFences` (defined at `js_andruav_parser.js:98`) is accessed from
**14 sites in `js_main.js`** via `js_globals.v_andruavClient.m_andruavGeoFences`:

- `js_main.js:1808-1818` — fence count + iteration
- `js_main.js:3364-3368` — fence iteration
- `js_main.js:3394` — read old fence before redraw
- `js_main.js:3401, 3417, 3433` — `hasOwnProperty` checks
- `js_main.js:3450` — write fence back after redraw (the `EVT_andruavUnitGeoFenceUpdated` handler attaches Leaflet layers + `Units` map)
- `js_main.js:3486` — read fence for hit display

The registry holds fence definitions keyed by name, each with:
```js
{ m_geoFenceName, m_shouldKeepOutside, fencetype, LngLatPoints,
  m_maximumDistance, isEditable, flightPath,  // flightPath = Leaflet layer, added by js_main
  Units: { [partyID]: { geoFenceInfo } } }    // attached units
```

## Target state

### 1. `src/js/services/geo/geoFenceRegistry.js` (new)

```js
/**
 * Single owner of geofence definitions. Replaces
 * CAndruavClientParser.m_andruavGeoFences.
 *
 * Lifetime is the app's, not the parser's. js_main.js reads/writes here
 * instead of js_globals.v_andruavClient.m_andruavGeoFences.
 */
class CGeoFenceRegistry {
    fn_get(p_name)                    // -> fence | null
    fn_has(p_name)                    // -> boolean
    fn_set(p_name, p_fence)           // insert/replace
    fn_removeUnit(p_name, p_partyID)  // detach a unit from a fence
    fn_addUnit(p_name, p_partyID, p_geoFenceInfo)  // attach a unit
    fn_getUnit(p_name, p_partyID)     // -> { geoFenceInfo } | null
    fn_keys()                         // -> string[]  (replaces Object.keys in js_main)
    fn_size()                         // -> number
    fn_clear()
}
export const js_geoFenceRegistry = ...  // singleton
```

### 2. `reduce.js` — two new reducers

```js
function reduceGeoFence(unit, msg) {
    // Pure: build geoFenceInfo from payload, dispatch EE_andruavUnitGeoFenceUpdated.
    // Mirrors #prv_parseFenceInfo exactly. unit is the attaching unit (or null for
    // ExternalGeoFence, which sets isEditable = true).
    const fence = fn_parseFenceInfo(msg.payload, unit);
    return { patches: [], events: [{ name: js_event.EE_andruavUnitGeoFenceUpdated, payload: { unit, fence } }] };
}

function reduceExternalGeoFence(unit, msg) {
    // senderName === '_sys_' guard — runtime checks this before calling reduce
    // (it's a transport-level concern, like the ID-message senderName check).
    // Same as reduceGeoFence but unit is null -> isEditable = true.
    const fence = fn_parseFenceInfo(msg.payload, null);
    return { patches: [], events: [{ name: js_event.EE_andruavUnitGeoFenceUpdated, payload: { unit: null, fence } }] };
}
```

`fn_parseFenceInfo` is the pure body of `#prv_parseFenceInfo`, moved into `reduce.js`
(or a small `geoFenceDecode.js` helper imported by reduce). It does NOT dispatch —
the reducer wraps its output in an event.

### 3. `GeoFenceAttachStatus` — registry stays in runtime

`reduce` cannot touch the registry. The reducer returns a **declarative attach/detach
intent** and `runtime` applies it to `js_geoFenceRegistry`:

```js
// reduce.js
function reduceGeoFenceAttachStatus(unit, msg) {
    const p = msg.payload;
    return {
        patches: [],
        events: [{
            name: '__geoFenceAttach',   // runtime-only pseudo-event
            payload: { unit, fenceName: p.n, isAttached: p.a },
        }],
    };
}

// runtime.js — fn_executeOps / event loop handles '__geoFenceAttach':
//   reads js_geoFenceRegistry, mutates Units, dispatches
//   __facadeRequestGeoFences (already subscribed) when fence is missing.
```

This keeps `reduce` pure while preserving the exact attach/detach/missing-fence logic.

### 4. `js_main.js` — 14 sites

Replace every `js_globals.v_andruavClient.m_andruavGeoFences` with
`js_geoFenceRegistry` calls. The `EVT_andruavUnitGeoFenceUpdated` handler at
`js_main.js:3380` becomes the **sole writer** of `fn_set` (it adds the Leaflet
`flightPath` layer + `Units` map after drawing).

## Steps

1. Create `geoFenceRegistry.js` with no callers. Commit.
2. Move `#prv_parseFenceInfo`'s body into a pure `fn_parseFenceInfo` helper (in
   `reduce.js` or `geoFenceDecode.js`). Delete `#prv_parseFenceInfo` from the parser.
   The old `GeoFence` / `ExternalGeoFence` cases still work because they dispatch
   `EE_andruavUnitGeoFenceUpdated` — the handler in js_main is unchanged. Commit.
3. Migrate `GeoFence` and `ExternalGeoFence` into `reduce.js` + `fn_isMigrated`.
   Add `reduce.test.js` cases with captured fence frames (linear, polygon, cylinder).
   The old cases become dead-code fallthrough markers. Commit.
4. Migrate the 14 `js_main.js` sites to `js_geoFenceRegistry`. The
   `EVT_andruavUnitGeoFenceUpdated` handler is the only `fn_set` caller. Commit.
5. Migrate `GeoFenceAttachStatus` into `reduce.js` (returns `__geoFenceAttach` event)
   + `runtime.js` (applies it to the registry, dispatches `__facadeRequestGeoFences`
   when missing). Add a test with a captured attach frame and a mock registry.
   Commit.
6. Delete the three geofence cases from `parseCommunicationMessage`. Commit.

## Do not change

- The fence payload wire keys (`n`, `r`, `o`, `t`, `c`, `a`, `g`, `l`) — shared protocol.
- The `geoFenceInfo` object shape consumed by `js_main.js`'s
  `EVT_andruavUnitGeoFenceUpdated` handler (`m_geoFenceName`, `fencetype`,
  `LngLatPoints`, `m_shouldKeepOutside`, `m_maximumDistance`, `isEditable`).
- The `__facadeRequestGeoFences` event — already wired in `fn_initFacadeSubscriptions`.
- The `EVT_andruavUnitGeoFenceDeleted` stub on the parser — it is a no-op (`fn_init`
  line 133); leave it or move it to the registry, but do not change its callers (there
  are none live).

## Acceptance

```bash
# geofence cases gone from the old switch
grep -n "CONST_TYPE_AndruavMessage_GeoFence\b\|CONST_TYPE_AndruavMessage_ExternalGeoFence\|CONST_TYPE_AndruavMessage_GeoFenceAttachStatus" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero

# the parser-instance registry is gone
grep -n "m_andruavGeoFences" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero

# js_main reads from the new registry, not the parser
grep -n "v_andruavClient.m_andruavGeoFences" src/js/js_main.js  # -> zero

# reduce stays pure
grep -n "js_andruav_facade\|AndruavClientFacade\|js_globals\|document\.\|window\." src/js/core/protocol/reduce.js  # -> zero

# the registry module exists
test -f src/js/services/geo/geoFenceRegistry.js

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> must not exceed 12 cycles
```

**Real acceptance:** `reduce.test.js` has tests for `GeoFence` (all 3 fence types),
`ExternalGeoFence`, and `GeoFenceAttachStatus` (attach + detach + missing-fence),
each with a captured frame, asserting the exact event payload — no socket, no DOM.

Manual check: load a geofence from a unit, create an external geofence from the
planning page, attach/detach a unit, trigger a fence hit.
