# TASK-02.2 — Migrate the WayPoints message to reduce/effects

**Parent:** TASK-02 (step 4, waypoints group).
**Depends on:** TASK-02.1 (geofence done, so the switch is shrinking in order).
**Blocks:** TASK-02.6 (final cleanup).
**Size:** medium. **Risk:** medium — chunked assembly is stateful.

## Goal

Migrate `CONST_TYPE_AndruavMessage_WayPoints` out of the old switch into
`reduce.js` / `runtime.js`, moving the chunk-assembly cache off `js_globals`.

## Current state

**File:** `src/js/protocol/server_comm/js_andruav_parser.js:827-944`

The case is ~118 lines. It does three things:

1. **Chunk assembly** via `js_globals.v_waypointsCache[partyID]` — a global
   `Object` keyed by partyID, holding an in-progress `wayPoint[]`. A message is
   either a full payload (`i` absent → `WAYPOINT_NO_CHUNK`) or a chunk
   (`i` = chunk index; `WAYPOINT_LAST_CHUNK` triggers the final dispatch).
2. **Per-waypoint decode** — a sub-switch over `wayPointStep.waypointType`
   (`CONST_WayPoint_TYPE_*`) that picks which fields to read. 10 waypoint types.
3. **Dispatch** — `EE_msgFromUnit_WayPoints` with `{ unit, wps: wayPoint }`,
   only on full messages or the last chunk.

### The cache is shared

`js_globals.v_waypointsCache` is touched from 3 places:

- `js_andruav_parser.js:47` — constructor re-inits it to `{}`
- `js_andruav_parser.js:842-850, 942` — the case itself (read/write/delete)
- `js_andruav_facade.js:814-817` — `API_requestWayPoints` deletes a stale entry
  before sending the request (so a re-request starts clean)

The facade site means the cache cannot simply move into `runtime` as a private
field — the facade needs to clear it too. It must be a module with an API.

## Target state

### 1. `src/js/services/waypoint/waypointCache.js` (new)

```js
/**
 * Per-unit chunked waypoint assembly cache. Replaces
 * js_globals.v_waypointsCache.
 *
 * A waypoint download arrives as 1..N chunks. This cache holds the
 * in-progress array keyed by partyID, and is cleared on last chunk,
 * on a new download request, or on unit removal.
 */
class CWaypointCache {
    fn_has(p_partyID)           // -> boolean
    fn_get(p_partyID)           // -> wayPoint[] (creates [] if missing)
    fn_set(p_partyID, p_wps)
    fn_clear(p_partyID)         // delete one entry
    fn_clearAll()
}
export const js_waypointCache = ...  // singleton
```

`API_requestWayPoints` calls `js_waypointCache.fn_clear(partyID)` instead of
`delete js_globals.v_waypointsCache[partyID]`.

### 2. `reduce.js` — pure per-waypoint decode

The per-waypoint sub-switch is pure (it reads `p_jmsg[i].t` etc. and builds a
`wayPointStep` object). Move it into `reduce.js` as `fn_decodeWaypoints(payload)`:

```js
/**
 * Pure: decode the waypoint array from a WayPoints payload.
 * Returns { wps: wayPoint[], isChunk: number }.
 * Does NOT touch the cache, does NOT dispatch.
 */
function fn_decodeWaypoints(p) {
    const isChunk = p.hasOwnProperty('i') ? p.i : WAYPOINT_NO_CHUNK;
    const count = p.n;
    const wps = [];
    for (let i = 0; i < count; ++i) {
        if (p[i] == null) continue;
        wps.push(fn_decodeWaypointStep(p[i]));
    }
    return { wps, isChunk };
}
```

`fn_decodeWaypointStep` is the 10-case sub-switch, unchanged.

### 3. `runtime.js` — chunk assembly + dispatch

`reduce` returns the decoded `{ wps, isChunk }`; `runtime` owns the cache and
the dispatch decision:

```js
// runtime, after reduce returns:
const { wps, isChunk } = result.waypoints;
if (isChunk === WAYPOINT_NO_CHUNK) {
    js_waypointCache.fn_clear(unit.getPartyID());
    js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_WayPoints, { unit, wps });
} else {
    const cached = js_waypointCache.fn_get(unit.getPartyID());
    cached.push(...wps);
    if (isChunk === WAYPOINT_LAST_CHUNK) {
        js_eventEmitter.fn_dispatch(js_event.EE_msgFromUnit_WayPoints, { unit, wps: cached });
        js_waypointCache.fn_clear(unit.getPartyID());
    }
}
```

This keeps `reduce` pure (no globals, no cache) while preserving the exact
chunk-assembly behavior.

## Steps

1. Create `waypointCache.js` with no callers. Commit.
2. Move `fn_decodeWaypointStep` (the 10-case sub-switch) into `reduce.js` as a
   pure helper. Add a `reduce.test.js` case with a captured full WayPoints frame
   (no chunks) asserting the exact `wps` array. Commit.
3. Migrate `WayPoints` into `fn_reduce` + `fn_isMigrated`. `runtime` handles the
   cache + dispatch. The old case becomes a dead-code fallthrough marker. Commit.
4. Migrate `API_requestWayPoints` (`js_andruav_facade.js:814-817`) to
   `js_waypointCache.fn_clear`. Delete `js_globals.v_waypointsCache` from
   `js_globals.js:15` and from the parser constructor (`js_andruav_parser.js:47`).
   Commit.
5. Delete the `WayPoints` case from `parseCommunicationMessage`. Commit.

## Do not change

- Waypoint payload wire keys (`i`, `n`, `t`, `s`, `g`, `a`, `l`, `h`, `y`, `p`,
  `e`, `r`, `c`, `q`, `x`) — shared protocol.
- The `wayPointStep` object shape consumed by `js_main.js`'s
  `EVT_msgFromUnit_WayPoints` handler (`js_main.js:3607`).
- The `CONST_WayPoint_TYPE_*` constants.
- `WAYPOINT_NO_CHUNK` / `WAYPOINT_LAST_CHUNK` values.
- The chunking semantics: full message dispatches immediately; chunked dispatches
  only on the last chunk; a new request clears the cache.

## Acceptance

```bash
# WayPoints case gone from the old switch
grep -n "CONST_TYPE_AndruavMessage_WayPoints" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero

# the global cache is gone
grep -rn "v_waypointsCache" src/  # -> zero

# the cache module exists
test -f src/js/services/waypoint/waypointCache.js

# reduce stays pure
grep -n "js_andruav_facade\|AndruavClientFacade\|js_globals\|document\.\|window\." src/js/core/protocol/reduce.js  # -> zero

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> must not exceed 12 cycles
```

**Real acceptance:** `reduce.test.js` has tests for:
- a full (non-chunked) WayPoints frame with ≥3 waypoint types, asserting exact `wps`;
- a 2-chunk frame where chunk 1 returns no dispatch and chunk 2 (last) returns the
  merged `wps` — using a mock cache in the test.

Manual check: download waypoints from a unit (full + chunked), upload waypoints,
re-download after a disconnect (cache cleared).
