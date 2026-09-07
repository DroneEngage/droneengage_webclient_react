# TASK-02.3 — Finish the tracking message migration

**Parent:** TASK-02 (step 4, tracking group).
**Depends on:** TASK-02.2 (waypoints done, switch shrinking in order).
**Blocks:** TASK-02.6 (final cleanup).
**Size:** small. **Risk:** low — both types are behind an experimental flag.

## Goal

Migrate `CONST_TYPE_AndruavMessage_SearchTargetList` and
`CONST_TYPE_AndruavMessage_TargetTrackingtLocation` into `reduce.js`. These are
the two types whose imports are **already present** in `reduce.js` (lines 42-43)
but unused — the migration was started and abandoned. Finish it and remove the
lint warnings.

## Current state

Both cases live in `parseCommunicationMessage`:

### `SearchTargetList` — line 709

```js
if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { return; }
p_jmsg = msg.msgPayload;
if (!p_jmsg.hasOwnProperty('t')) break;
// build c_search_target per item, write into
// p_unit.m_DetectedTargets.m_searchable_targets[name]
js_eventEmitter.fn_dispatch(js_event.EE_SearchableTarget, p_unit);
```

Pure field writes + one dispatch, **but** gated by a global flag.

### `TargetTrackingtLocation` — line 735

```js
if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) { return; }
p_jmsg = msg.msgPayload.t;
// reset m_DetectedTargets.m_targets.m_list = []
// build c_target per item (x1/y1/x2/y2/m_radius/m_propability/m_name)
// c_target.lastUpdate = Date.now();   <-- impure
js_eventEmitter.fn_dispatch(js_event.EE_DetectedTarget, p_unit);
```

Two impurities: the experimental flag check (reads `js_globals`) and `Date.now()`.

## Target state

### `reduce.js`

```js
function reduceSearchTargetList(unit, msg) {
    const p = msg.payload;
    if (!p.hasOwnProperty('t')) return { patches: [], events: [] };
    const targets = {};
    for (const item of p.t) {
        targets[item.n] = { m_name: item.n, m_type: item.hasOwnProperty('t') ? item.t : 'na' };
    }
    return {
        patches: [{ path: 'm_DetectedTargets.m_searchable_targets', value: targets }],
        events: [{ name: js_event.EE_SearchableTarget, payload: unit }],
    };
}

function reduceTargetTrackingLocation(unit, msg) {
    const items = msg.payload.t;
    const list = [];
    for (const item of items) {
        const t = { x1: item.a, y1: item.b };
        if (item.hasOwnProperty('r')) t.m_radius = item.r;
        else { t.x2 = item.c; t.y2 = item.d; }
        if (item.hasOwnProperty('p')) t.m_propability = item.p;
        t.m_name = item.hasOwnProperty('n') ? item.n : 'default';
        t.lastUpdate = msg.receivedAt;   // <-- pure: use msg.receivedAt, not Date.now()
        list.push(t);
    }
    return {
        patches: [{ path: 'm_DetectedTargets.m_targets.m_list', value: list }],
        events: [{ name: js_event.EE_DetectedTarget, payload: unit }],
    };
}
```

`msg.receivedAt` is already passed by `fn_decode` and used by `reduceGPS` — same
pattern. `Date.now()` is replaced by it, making the reducer pure.

### The experimental flag

The `CONST_EXPERIMENTAL_FEATURES_ENABLED` gate is a **transport-level** decision
(drop the message entirely before any side effect), not a reduce-level one. It
moves to `runtime.js`, checked in `fn_handleFrame` before calling `fn_reduce`
for these two types — the same place the `isIDMessage` / `shouldRequestID` logic
lives. If the flag is off, `fn_handleFrame` returns `false` so the old switch
runs (and also returns early — net behavior identical).

Alternatively, since the flag is currently `true` and the cases return early when
it's `false`, the runtime check can simply return `true` (skip old switch too)
when the flag is off and the type is one of these two — but that changes the
"both paths run" invariant from TASK-02 step 2. Prefer the explicit: flag off →
return `false`, old switch runs its early-return, no double side effect.

## Steps

1. Add `reduceSearchTargetList` and `reduceTargetTrackingLocation` to `reduce.js`,
   add both types to `fn_isMigrated`, wire the switch cases in `fn_reduce`.
   Remove the now-unused import warnings (the imports become used). Commit.
2. Add the experimental-flag guard in `runtime.js` for these two types. Commit.
3. Add `reduce.test.js` cases with captured frames. Commit.
4. Delete the two cases from `parseCommunicationMessage`. Commit.

## Do not change

- The `m_DetectedTargets` field shape (`m_searchable_targets`, `m_targets.m_list`).
- The `c_target` / `c_search_target` field names (`x1`, `y1`, `x2`, `y2`,
  `m_radius`, `m_propability`, `m_name`, `m_type`, `lastUpdate`).
- The `CONST_EXPERIMENTAL_FEATURES_ENABLED` flag value or its other 8 call sites.
- The `EE_SearchableTarget` / `EE_DetectedTarget` event contracts (consumed by
  `jsc_videoTrackerLayer.jsx`).

## Acceptance

```bash
# both cases gone from the old switch
grep -n "CONST_TYPE_AndruavMessage_SearchTargetList\|CONST_TYPE_AndruavMessage_TargetTrackingtLocation" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero

# no unused-import warnings for these two in reduce.js
npm run lint 2>&1 | grep "reduce.js" | grep -i "SearchTargetList\|TargetTrackingtLocation"  # -> zero

# reduce stays pure (no Date.now, no js_globals)
grep -n "Date.now\|js_globals" src/js/core/protocol/reduce.js  # -> zero

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> must not exceed 12 cycles
```

**Real acceptance:** `reduce.test.js` has tests for:
- `SearchTargetList` with 2 items (one with `t`, one without → `m_type: 'na'`);
- `TargetTrackingtLocation` with a rectangle target (`x2/y2`) and a radius target
  (`m_radius`), asserting `lastUpdate === msg.receivedAt`.

Manual check: with the experimental flag on, open the video tracker layer and
confirm detected targets render. With it off, confirm no errors.
