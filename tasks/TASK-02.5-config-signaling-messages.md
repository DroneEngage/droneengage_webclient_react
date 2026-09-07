# TASK-02.5 — Migrate CONFIG_STATUS and Signaling messages

**Parent:** TASK-02 (step 4, "everything else" group).
**Depends on:** TASK-02.4 (callback registry extracted — CONFIG_STATUS uses it).
**Blocks:** TASK-02.6 (final cleanup — these are the last two JSON-switch cases).
**Size:** medium. **Risk:** medium — Signaling is the WebRTC signaling bridge.

## Goal

Migrate the last two JSON-switch cases: `CONST_TYPE_AndruavMessage_CONFIG_STATUS`
(uses the callback registry from TASK-02.4) and
`CONST_TYPE_AndruavMessage_Signaling` (uses an injected WebRTC callback). After
this, `parseCommunicationMessage`'s switch is empty and TASK-02.6 can delete it.

## Current state

### `CONFIG_STATUS` — line 244

```js
p_jmsg = msg.msgPayload;
if (p_jmsg.R === true) {   // reply to API_fetchConfigJSON
    const c_module = p_unit.m_modules.getModuleByKey(p_jmsg.k);
    if (!c_module) return;
    c_module.template = p_jmsg.b;
    this.fn_callbackOnMessageID_Answer(CONST_TYPE_AndruavMessage_CONFIG_STATUS,
        { p_unit, p_module: c_module });
}
```

Two impurities: `m_modules.getModuleByKey` (a unit method — fine, call it in
runtime) and `fn_callbackOnMessageID_Answer` (the registry from TASK-02.4).

No event dispatch, no field patches on the unit itself — the mutation is on
`c_module.template`, which is a sub-object of `m_modules`.

### `Signaling` — line 800

```js
p_jmsg = msg.msgPayload;  // string-checked + JSON.parsed
let signal = p_jmsg.w || p_jmsg;
this.EVT_andruavSignalling(p_unit, signal);
```

`this.EVT_andruavSignalling` is an **externally injected function reference**.
It is assigned from `js_webrtcthin2.js:298`:

```js
js_globals.v_andruavClient.EVT_andruavSignalling = this.EVT_andruavSignalling.bind(this);
```

This is the WebRTC signaling bridge — SDP offer/answer/ICE candidates flow from
the unit through this callback into the WebRTC layer. It is the **only** inbound
path for WebRTC signaling. There is no event for it in `js_eventList.js`.

## Target state

### 1. `CONFIG_STATUS` — reducer + runtime

```js
// reduce.js
function reduceConfigStatus(unit, msg) {
    const p = msg.payload;
    if (p.R !== true) return { patches: [], events: [] };
    // The module lookup + template write is a unit-method call — declare it.
    return {
        patches: [],
        events: [{
            name: '__configStatusReply',
            payload: { unit, moduleKey: p.k, template: p.b },
        }],
    };
}

// runtime.js — handles '__configStatusReply':
//   const c_module = unit.m_modules.getModuleByKey(ev.payload.moduleKey);
//   if (!c_module) return;
//   c_module.template = ev.payload.template;
//   js_callbackRegistry.fn_fireOnce(CONST_TYPE_AndruavMessage_CONFIG_STATUS,
//       { p_unit: unit, p_module: c_module });
```

The early `return` on missing module (line 256) becomes a `return` in runtime —
same behavior, no callback fired.

### 2. `Signaling` — new event + WebRTC subscription

Introduce `EE_andruavSignalling` in `js_eventList.js`:

```js
"EE_andruavSignalling",
```

The reducer dispatches it; `js_webrtcthin2.js` subscribes to it instead of
injecting a function reference onto the parser.

```js
// reduce.js
function reduceSignaling(unit, msg) {
    const p = msg.payload;
    const signal = p.w || p;
    return {
        patches: [],
        events: [{ name: js_event.EE_andruavSignalling, payload: { unit, signal } }],
    };
}

// js_webrtcthin2.js — replace the injection at line 298:
//   js_globals.v_andruavClient.EVT_andruavSignalling = this.EVT_andruavSignalling.bind(this);
// with a subscription (once, at module init):
js_eventEmitter.fn_subscribe(js_event.EE_andruavSignalling, this, this.fn_onAndruavSignalling);
// where fn_onAndruavSignalling(me, { unit, signal }) calls the old EVT_andruavSignalling logic.
```

Delete `this.EVT_andruavSignalling = {}` from the parser constructor (line 52)
and the `this.EVT_andruavSignalling(p_unit, signal)` call (line 807).

**Safety-critical event check:** `EE_andruavSignalling` carries WebRTC SDP/ICE
data. It is NOT in the `FORBIDDEN_BATCHED` list in `js_eventEmitterConfig.js`
and must NOT be added there — signaling can be batched within a frame. But verify
it is not accidentally batched by the emitter's default config; if the default is
"immediate", leave it. The WebRTC layer relies on ordered delivery, which the
emitter preserves per-dispatch.

## Steps

1. Add `EE_andruavSignalling` to `js_eventList.js`. Commit.
2. In `js_webrtcthin2.js`, subscribe to `EE_andruavSignalling` and delete the
   `EVT_andruavSignalling` injection at line 298. Keep the bound method as
   `fn_onAndruavSignalling`. Commit.
3. Add `reduceConfigStatus` and `reduceSignaling` to `reduce.js`, add both to
   `fn_isMigrated`, wire the switch. Add `__configStatusReply` handling in
   runtime. Add `reduce.test.js` cases. Commit.
4. Delete the two cases from `parseCommunicationMessage`. Delete
   `this.EVT_andruavSignalling = {}` from the parser constructor. Commit.

## Do not change

- The signaling payload wire keys (`w` for wrapped signal, or bare payload).
- The `signal` object shape consumed by `js_webrtcthin2.js`'s
  `EVT_andruavSignalling(andruavUnit, p_signal)` (line 377) — the event payload
  wraps it as `{ unit, signal }`, the subscription handler unwraps.
- The `CONFIG_STATUS` payload wire keys (`R`, `k`, `b`).
- The `c_module.template` field — written by runtime, read by the config UI.
- The `v_session` shape for the callback (`{ p_unit, p_module }`).

## Acceptance

```bash
# both cases gone from the old switch
grep -n "CONST_TYPE_AndruavMessage_CONFIG_STATUS\|CONST_TYPE_AndruavMessage_Signaling" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero

# the signaling injection is gone
grep -n "EVT_andruavSignalling" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero
grep -rn "EVT_andruavSignalling" src/js/js_webrtcthin2.js  # -> only the method definition + subscription, no assignment onto v_andruavClient

# the new event exists
grep -n "EE_andruavSignalling" src/js/events/js_eventList.js  # -> one line

# reduce stays pure
grep -n "js_andruav_facade\|AndruavClientFacade\|js_globals\|document\.\|window\." src/js/core/protocol/reduce.js  # -> zero

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> must not exceed 12 cycles
```

**Real acceptance:** `reduce.test.js` has tests for:
- `CONFIG_STATUS` with `R: true` → `__configStatusReply` event with moduleKey + template;
- `CONFIG_STATUS` with `R` absent → no events;
- `Signaling` with `w` present → `EE_andruavSignalling` with `{ unit, signal: p.w }`;
- `Signaling` with `w` absent → `EE_andruavSignalling` with `{ unit, signal: p }`.

Manual check: open the module config dialog (CONFIG_STATUS reply), establish a
WebRTC video stream with a unit (Signaling — SDP offer/answer + ICE exchange).
