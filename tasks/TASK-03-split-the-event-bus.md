# TASK-03 — Split the event bus into three channels

**Depends on:** TASK-02 (field patches must exist before state events can be retired).
**Blocks:** TASK-04.
**Size:** medium-large (~1-2 weeks). **Risk:** medium.

## Goal

There are 132 event names in `src/js/events/js_eventList.js`, dispatched from 116 sites,
with no payload contract of any kind. The bus is currently carrying three different
things. Separate them, so that each one can use the mechanism that actually fits.

---

## Current state

### The bus carries three kinds of traffic

**(a) State change announcements** — ~29 events named `EE_unit*` or `*Updated`.
These are "a field on a unit changed". `EE_unitUpdated` alone is dispatched from
**11 different places** with no shared meaning, which is why subscribers re-render
defensively rather than precisely.

**(b) Genuine domain events** — discrete, past tense, worth broadcasting:
`EE_andruavUnitGeoFenceHit`, `EE_unitOnlineChanged`, `EE_onChatMessage`,
`EE_WS_OPEN` / `EE_WS_CLOSE`, the `EE_Auth_*` family, `EE_Mission_*`.

**(c) UI commands wearing a broadcast costume** — **19 events** matching
`^EE_(display|hide)`:

```
EE_displayAlertDialog       EE_displayGeoForm            EE_displayViewLinkGimbal
EE_displayAltitudeDialog    EE_displayMissionLoadDialog  EE_displayYawDlgForm
EE_displayApplyAllDialog    EE_displayParameters         EE_hideCameraDlgForm
EE_displayCameraDlgForm     EE_displayServoForm          EE_hideStreamDlgForm
EE_displayConfigGenerator   EE_displaySpeedDialog        EE_hideViewLinkGimbal
EE_displayConfirmationDialog EE_displayStreamDlgForm
EE_displayFpvDialog         EE_displayUnitInfoDialog
```

These are imperative function calls — "open this dialog now" — routed through a broadcast
channel, which makes the control flow impossible to follow by reading the code.

### The cost of having no payload contract

`src/js/events/js_eventEmitter.js` has to sniff payload shape at runtime:

```js
_fn_extractUnitKey(p_data) {
    if (typeof p_data.getPartyID === 'function') return p_data.getPartyID();
    if (p_data.track_id != null)                 return `track:${p_data.track_id}`;
    if (p_data.unit && typeof p_data.unit.getPartyID === 'function') return p_data.unit.getPartyID();
    if (p_data.partyID != null)                  return String(p_data.partyID);
    return '__default__';
}
```

Four shapes for one concept. This function is the tax; it should be deletable at the end
of this task.

---

## Target state

### (a) State -> the store

Retire the ~29 state events. Components read fields through the existing
`useUnitField(partyId, fieldPath)` hook (`src/js/hooks/useUnitField.js`), which is already
built on `useSyncExternalStore` and already works — only 7 components use it today, against
**146 hand-written `fn_subscribe` call sites** in `src/components/`.

Migrate component by component. Rule of thumb: if a subscription handler's only job is
`setState({ m_update: ... + 1 })`, it is a state read, and it becomes `useUnitField`.

`EE_unitUpdated`, `EE_unitNavUpdated`, `EE_unitPowUpdated`, `EE_andruavUnitFCBUpdated`,
`EE_unitSDRUpdated`, `EE_unitSDRSpectrum`, `EE_msgFromUnit_GPS` are all in the batched set
in `js_eventEmitterConfig.js` — remove each from that list as it stops being dispatched.

### (b) Domain events -> the same bus, but typed

Keep `js_eventEmitter`. Add `src/js/events/eventPayloads.js`, one factory per surviving
event:

```js
export const fn_unitEvent      = (p_unit) => ({ partyID: p_unit.getPartyID(), unit: p_unit });
export const fn_geofenceHit    = (p_unit, p_fence) => ({ partyID: ..., fence: p_fence });
export const fn_videoStatsEvent = (p_unit, p_trackId, p_stats) => ({ partyID: ..., trackID: ..., ...p_stats });
```

Every payload gains a **guaranteed `partyID` field**. Once every dispatch site goes through
a factory, `_fn_extractUnitKey` collapses to `p_data?.partyID ?? '__default__'` — delete
the four-branch version.

### (c) UI commands -> a dialog service

`src/js/app/dialogService.js`:

```js
// Explicit, greppable, followable in an editor.
export const js_dialogs = {
  fn_showParameters(p_unit) { ... },
  fn_showYaw(p_unit) { ... },
  fn_showCamera(p_unit) { ... },
  fn_hideCamera() { ... },
  // ...one per retired EE_display*/EE_hide* event
};
```

Implementation: a tiny subscribable store holding
`{ activeDialog: string|null, props: object }`. A single `<DialogHost>` component in
`src/pages/home.js` reads it and renders **only** the active dialog.

That last point matters beyond tidiness: `src/pages/home.js` currently mounts **all 17
dialogs unconditionally** (lines 162-178). Every one subscribes to events and participates
in reconciliation whether or not it has ever been opened. `<DialogHost>` fixes that as a
side effect.

---

## Steps

1. Add `eventPayloads.js` with factories for the domain events. Migrate dispatch sites to
   use them. `_fn_extractUnitKey` still works during this phase. Commit per event family.
2. Simplify `_fn_extractUnitKey` to the single-field version. Its existing test
   (`js_eventEmitter.batching.test.js`) must be updated, not deleted — keep coverage of
   per-unit coalescing. Commit.
3. Add `dialogService.js` + `<DialogHost>`. Migrate the 19 `EE_display*`/`EE_hide*` events
   one dialog at a time; delete each event name from `js_eventList.js` as its last
   subscriber goes. Commit per dialog.
4. Remove the 17 unconditional dialog mounts from `src/pages/home.js`, replacing them with
   a single `<DialogHost />`. Check `src/pages/mobile.js` and `src/pages/planning.js` for
   the same pattern. Commit.
5. Migrate the 146 `fn_subscribe` sites to `useUnitField` where the handler is a pure
   re-render trigger. Commit per component. This is the long tail — it can continue after
   the rest of the task is merged.
6. Delete retired names from `js_eventList.js` and from the batched set in
   `js_eventEmitterConfig.js`.

---

## Do not change

- **The `FORBIDDEN_BATCHED` guard** in `js_eventEmitterConfig.js` and its test
  (`js_eventEmitterConfig.guard.test.js`). Geofence hit, arming, flight-mode change, unit
  online/offline, auth, chat and alerts must stay immediate. Never add a one-frame delay to
  any of them. If an event moves to the store, make sure the store notification path is
  also synchronous for these.
- The rAF batching mechanism itself. It is correct. It becomes the store's flush policy.
- `EE_WS_OPEN` / `EE_WS_CLOSE` / `EE_onSocketStatus2` — connection lifecycle, genuinely
  events, leave on the bus.

## Acceptance

```bash
# UI command events are gone from the event list
grep -cE '"EE_(display|hide)' src/js/events/js_eventList.js       # -> 0

# no component subscribes to a dialog event any more
grep -rnE "EE_(display|hide)" src/components/ src/pages/          # -> zero lines

# the shape-sniffing is gone
grep -A6 "_fn_extractUnitKey" src/js/events/js_eventEmitter.js | grep -c "track_id"   # -> 0

# dialogs are no longer all mounted at once
grep -cE "<Clss.*Dialog|<ClssServoControl|<ClssUnitParametersList" src/pages/home.js  # -> at most 1 (<DialogHost/>)

# event count has come down materially
grep -c "EE_" src/js/events/js_eventList.js    # -> was 132; expect < 90

npm run lint && npm test && npm run build
```

**Real acceptance test.** Add a test that renders two sibling telemetry gadgets for the
same unit, pushes a change to a field only one of them reads, and asserts the other did
**not** re-render. That is the behaviour this whole task exists to buy.

Manual check: open every dialog from every entry point (map context menu, unit card, unit
bar, planning page), confirm each opens, closes, and re-opens; confirm a geofence breach
still alerts without perceptible delay.
