# TASK-02.4 — Migrate CameraList and SOUND_LIST messages

**Parent:** TASK-02 (step 4, camera/sound group).
**Depends on:** TASK-02.3 (tracking done, switch shrinking in order).
**Blocks:** TASK-02.6 (final cleanup).
**Size:** medium. **Risk:** medium — the callback registry is request/reply glue.

## Goal

Migrate `CONST_TYPE_AndruavMessage_CameraList` and
`CONST_TYPE_AndruavMessage_SOUND_LIST` into `reduce.js` / `runtime.js`, and
extract the parser-instance `v_callbackListeners` request/reply registry into its
own module so `reduce` stays pure.

## Current state

Two cases in `parseCommunicationMessage`:

### `CameraList` — line 385

```js
p_jmsg = msg.msgPayload;  // string-checked + JSON.parsed
p_unit.m_Video.m_videoTracks = p_jmsg.T;
js_eventEmitter.fn_dispatch(js_event.EE_unitUpdated, p_unit);
if (p_jmsg.R === true) {   // reply to a prior API_requestCameraList
    this.fn_callbackOnMessageID_Answer(CONST_TYPE_AndruavMessage_CameraList, v_session);
}
```

### `SOUND_LIST` — line 426

```js
p_jmsg = msg.msgPayload;  // string-checked + JSON.parsed
p_unit.m_Sound.m_files = Array.isArray(p_jmsg.T) ? p_jmsg.T : [];
js_eventEmitter.fn_dispatch(js_event.EE_onSoundListUpdated, p_unit);
if (p_jmsg.R === true) {   // reply to a prior API_requestSoundList
    this.fn_callbackOnMessageID_Answer(CONST_TYPE_AndruavMessage_SOUND_LIST, v_session);
}
```

Both are simple field writes + one dispatch + an optional request/reply callback.

### The callback registry

`this.v_callbackListeners` (defined at `js_andruav_parser.js:48`) is a map from
message-type → callback. It is written from the **facade** (3 sites) and read
from the **parser** (1 site):

| Site | Direction | Message type |
|---|---|---|
| `js_andruav_facade.js:836` | write (register) | `CameraList` |
| `js_andruav_facade.js:850` | write (register) | `SOUND_LIST` |
| `js_andruav_facade.js:1423` | write (register) | `CONFIG_STATUS` (TASK-02.5) |
| `js_andruav_parser.js:160` | read + delete (answer) | any of the above |

`fn_callbackOnMessageID(p_callback, p_messageID)` registers; `fn_callbackOnMessageID_Answer(p_messageID, v_session)` fires-once-and-deletes. It is a
single-shot request/reply pattern: `API_requestCameraList(unit, cb)` registers
`cb`, sends the request; when the reply arrives (`R === true`), `cb` fires once
and is removed.

## Target state

### 1. `src/js/protocol/callbackRegistry.js` (new)

```js
/**
 * Single-shot request/reply callback registry. Replaces
 * CAndruavClientParser.v_callbackListeners.
 *
 * API_requestCameraList / API_requestSoundList / API_fetchConfigJSON
 * register a callback here; the inbound reduce path fires it once when
 * the matching reply (R === true) arrives, then it is removed.
 */
class CCallbackRegistry {
    fn_register(p_messageType, p_callback)
    fn_fireOnce(p_messageType, p_session)  // calls + deletes; no-op if none
    fn_clear(p_messageType)
    fn_clearAll()
}
export const js_callbackRegistry = ...  // singleton
```

The facade's 3 `fn_callbackOnMessageID` calls become `js_callbackRegistry.fn_register`.
The parser's `fn_callbackOnMessageID_Answer` is deleted; `runtime` calls
`js_callbackRegistry.fn_fireOnce` instead.

### 2. `reduce.js` — pure reducers

```js
function reduceCameraList(unit, msg) {
    const p = msg.payload;
    const patches = [{ path: 'm_Video.m_videoTracks', value: p.T }];
    const events = [{ name: js_event.EE_unitUpdated, payload: unit }];
    // The reply callback is a runtime concern (impure). Signal it.
    if (p.R === true) {
        events.push({ name: '__callbackReply', payload: {
            messageType: CONST_TYPE_AndruavMessage_CameraList,
            session: { status: 'connected', m_unit: unit } } });
    }
    return { patches, events };
}

function reduceSoundList(unit, msg) {
    const p = msg.payload;
    const patches = [{ path: 'm_Sound.m_files', value: Array.isArray(p.T) ? p.T : [] }];
    const events = [{ name: js_event.EE_onSoundListUpdated, payload: unit }];
    if (p.R === true) {
        events.push({ name: '__callbackReply', payload: {
            messageType: CONST_TYPE_AndruavMessage_SOUND_LIST,
            session: { status: 'connected', m_unit: unit } } });
    }
    return { patches, events };
}
```

The `__callbackReply` pseudo-event is handled by `runtime` (alongside
`__listAdd`, `__facadeRequestGeoFences`, etc.) — it calls
`js_callbackRegistry.fn_fireOnce(messageType, session)`. This keeps `reduce`
pure: it declares the reply intent, runtime fires it.

### 3. `runtime.js`

Add `__callbackReply` handling to the event loop (or `fn_executeOps`):

```js
if (ev.name === '__callbackReply') {
    js_callbackRegistry.fn_fireOnce(ev.payload.messageType, ev.payload.session);
    continue;  // don't dispatch via js_eventEmitter
}
js_eventEmitter.fn_dispatch(ev.name, ev.payload);
```

## Steps

1. Create `callbackRegistry.js` with no callers. Commit.
2. Migrate the 3 facade registration sites to `js_callbackRegistry.fn_register`.
   Commit.
3. Add `reduceCameraList` + `reduceSoundList` to `reduce.js`, add both to
   `fn_isMigrated`, wire the switch. Add `__callbackReply` handling in `runtime`.
   Add `reduce.test.js` cases (reply + non-reply variants). Commit.
4. Delete `fn_callbackOnMessageID`, `fn_callbackOnMessageID_Answer`, and
   `v_callbackListeners` from the parser. Delete the two cases from
   `parseCommunicationMessage`. Commit.

## Do not change

- The `v_session` shape (`{ status: 'connected', m_unit }`) — passed to the
  callback, consumed by the video/audio gadget code.
- The `m_Video.m_videoTracks` and `m_Sound.m_files` field names.
- The `R === true` reply semantics (single-shot fire-and-delete).
- The `EE_unitUpdated` / `EE_onSoundListUpdated` event contracts.

## Acceptance

```bash
# both cases gone from the old switch
grep -n "CONST_TYPE_AndruavMessage_CameraList\|CONST_TYPE_AndruavMessage_SOUND_LIST" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero

# the callback registry is gone from the parser
grep -n "v_callbackListeners\|fn_callbackOnMessageID" src/js/protocol/server_comm/js_andruav_parser.js  # -> zero

# the facade registers via the new module
grep -n "fn_callbackOnMessageID" src/js/protocol/server_comm/js_andruav_facade.js  # -> zero
grep -n "js_callbackRegistry.fn_register" src/js/protocol/server_comm/js_andruav_facade.js  # -> 3

# the registry module exists
test -f src/js/protocol/callbackRegistry.js

# reduce stays pure
grep -n "js_andruav_facade\|AndruavClientFacade\|js_globals\|document\.\|window\." src/js/core/protocol/reduce.js  # -> zero

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> must not exceed 12 cycles
```

**Real acceptance:** `reduce.test.js` has tests for:
- `CameraList` with `R: true` → patches + `EE_unitUpdated` + `__callbackReply`;
- `CameraList` with `R` absent → patches + `EE_unitUpdated`, no `__callbackReply`;
- `SOUND_LIST` with empty `T` → `m_files: []` + `EE_onSoundListUpdated`.

Manual check: request camera list from a unit (opens video track picker),
request sound list (populates audio gadget dropdown), confirm the single-shot
callback fires exactly once.
