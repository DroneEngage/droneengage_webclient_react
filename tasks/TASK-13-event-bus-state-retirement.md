# TASK-13 — Retire the coarse unit-state events (finish TASK-03)

**Depends on:** TASK-03 (parts b and c — domain-event typing and the dialog service — are
already merged), TASK-12 (EventBridge migration, already merged).
**Blocks:** nothing.
**Size:** medium-large (~1-2 weeks, long tail). **Risk:** medium — touches render behaviour
across many components; regressions would show up as stale UI, not crashes.

## Goal

TASK-03 split the event bus into three channels. Two of the three landed: the dialog
service (part c) and typed domain-event payloads (part b). The third — retiring the ~29
`EE_unit*`/`*Updated` state-change events in favour of `useUnitField` — did not. This task
finishes it.

---

## Current state (verified)

**Parts b and c are done — do not redo them:**

```bash
grep -cE '"EE_(display|hide)' src/js/events/js_eventList.js       # -> 0
grep -rlE "EE_(display|hide)" src/components/ src/pages/          # -> 1 (a stale comment, not a live subscriber)
```

`src/js/app/dialogService.js`, `<DialogHost>`, and `src/js/events/eventPayloads.js` all
exist and are wired in. `_fn_extractUnitKey` is already the single-field version.

**Part a — state events — is not done:**

```bash
grep -c "EE_" src/js/events/js_eventList.js       # -> 117 (target was < 90)
grep -rn "EE_unitUpdated" src/js/ src/components/ | grep -v '\.test\.'   # -> 26 dispatch/subscribe sites
```

`js_eventEmitterConfig.js:75-79` still lists `EE_unitUpdated`, `EE_unitNavUpdated`,
`EE_unitPowUpdated`, `EE_unitSDRUpdated`, `EE_unitSDRSpectrum` in `BATCHED_EVENTS`.
`EE_andruavUnitFCBUpdated` and `EE_msgFromUnit_GPS` are the other two events named in the
original TASK-03 spec as retirement candidates.

**Important: the migration path assumed by TASK-03 has partially changed underneath it.**
TASK-03's spec expected component migration to go `fn_subscribe` &rarr; `useUnitField`
directly. TASK-12 shipped first and migrated nearly all class components from
`fn_subscribe` to `<EventBridge>` instead (leak-safety, not granular re-rendering):

```bash
grep -rl "fn_subscribe(" src/components/    # -> 0 (TASK-12 already did this)
grep -rl "EventBridge" src/components/ | wc -l    # -> 49
grep -rl "useUnitField(" src/components/ src/pages/  # -> only 4 files:
  # jsc_ctrl_tracker_ai_list.jsx, jsc_unit_tab_header.jsx,
  # jsc_ctrl_swarm.jsx, jsc_ctrl_tracker_button.jsx
```

So the actual remaining work is: **EventBridge subscribers to the 7 coarse events above,
whose handler's only job is a re-render trigger, need to move to `useUnitField`** — not a
second pass over `fn_subscribe` (that pattern is already gone from `src/components/`).

**The plumbing this depends on already exists and is already correct.** `useUnitField`
(`src/js/hooks/useUnitField.js`) reads through `subscribeUnitField`/`notifyUnitFieldChanged`
in `src/js/store/unitStore.js`, and that store is already fed directly from the TASK-02
field-patch pipeline —

```bash
grep -rn "notifyUnitFieldChanged" src/js/core/protocol/runtime.js
# -> called on every applied FieldPatch (lines 111, 125, 256, 263, 290)
```

— **not** from the `EE_unit*` events. This means retiring `EE_unitUpdated` and friends is
safe once nothing subscribes to them any more: the store's data source is independent of
the event bus.

**No cross-rerender regression test exists yet.** TASK-03's "Real acceptance test" (render
two sibling gadgets for the same unit, change a field only one reads, assert the other did
not re-render) was never added.

---

## The class-component problem

`useUnitField` is a hook — it cannot be called from a class component, and most of the 49
`EventBridge` consumers are class components (that is why they use `EventBridge` and not
`useEventSubscription` in the first place). Converting ~40 class components to function
components is out of scope for this task.

Use a small adapter instead. Add `src/js/hooks/UnitFieldValue.jsx`:

```jsx
import { useUnitField } from './useUnitField.js';

// Lets a class component consume a single reactive unit field without
// itself becoming a function component. Renders nothing of its own;
// the class component supplies how to render the value.
export function UnitFieldValue({ partyId, fieldPath, children }) {
    const value = useUnitField(partyId, fieldPath);
    return children(value);
}
```

A class component that currently does:

```jsx
<EventBridge eventName={js_event.EE_unitUpdated} onEvent={() => this.forceUpdate()} />
{this.m_unit.m_battery.m_voltage}
```

becomes:

```jsx
<UnitFieldValue partyId={this.m_unit.getPartyID()} fieldPath="m_battery.m_voltage">
  {(voltage) => <span>{voltage}</span>}
</UnitFieldValue>
```

with the `EventBridge` subscription to the coarse event removed. If a component reads
several fields, use one `UnitFieldValue` per field, or nest them — do not invent a
multi-field variant unless you hit a case where nesting is genuinely unworkable (note it in
`FINDINGS.md` if so).

---

## Steps

1. Add `src/js/hooks/UnitFieldValue.jsx` as above. Commit.
2. `grep -rn "EventBridge eventName={js_event.EE_\(unitUpdated\|unitNavUpdated\|unitPowUpdated\|andruavUnitFCBUpdated\|unitSDRUpdated\|unitSDRSpectrum\|msgFromUnit_GPS\)" src/components/` to
   get the exact subscriber list. For each subscriber whose handler is a pure re-render
   trigger (no side effect beyond re-rendering), migrate to `UnitFieldValue`/`useUnitField`.
   Commit per component.
3. For a handler that does more than re-render (e.g. also plays a sound, updates a ref used
   elsewhere), keep the `EventBridge` subscription for that side effect but stop using it to
   gate rendering of the field value itself — split the two concerns.
4. If a component needs a field-level notification that `runtime.js` does not yet emit,
   check `src/js/core/protocol/path.js` and the relevant `reduce.ts` branch before assuming
   it is missing — most fields are already covered. If genuinely missing, add the
   `notifyUnitFieldChanged` call at the point the field is patched, following the existing
   pattern in `runtime.js`. Do not add a new coarse event as a shortcut.
5. Once an event's last subscriber is migrated, remove it: delete from `BATCHED_EVENTS` in
   `js_eventEmitterConfig.js`, delete the dispatch call site(s), delete the name from
   `js_eventList.js`. Commit per event.
6. Add the sibling non-rerender test (see Acceptance).
7. Re-run the line count. If it is still above 90 once all 7 events are retired, audit the
   rest of `js_eventList.js` for other dead/mergeable names and note any that cannot be
   retired, with a one-line reason, in `FINDINGS.md`. Do not force the number down by
   deleting something still in use.

---

## Do not change

- The `FORBIDDEN_BATCHED` guard and its test (`js_eventEmitterConfig.guard.test.js`).
  Geofence hit, arming, flight-mode change, unit online/offline, auth, chat, alerts stay
  immediate — this task only touches `BATCHED_EVENTS`, never `FORBIDDEN_BATCHED`.
- `EE_WS_OPEN` / `EE_WS_CLOSE` / `EE_onSocketStatus2` — leave on the bus, out of scope.
- The dialog service / `<DialogHost>` — already done, do not touch.
- `core/protocol/runtime.js`'s `notifyUnitFieldChanged` call sites unless you are adding a
  genuinely missing one per step 4.

## Acceptance

```bash
grep -c "EE_" src/js/events/js_eventList.js    # -> < 90, or documented in FINDINGS.md why not
grep -n "EE_unitUpdated\|EE_unitNavUpdated\|EE_unitPowUpdated\|EE_andruavUnitFCBUpdated\|EE_unitSDRUpdated\|EE_unitSDRSpectrum" \
  src/js/events/js_eventEmitterConfig.js         # -> zero, or only entries still genuinely
                                                  #    subscribed, documented in FINDINGS.md
npm run lint && npm test && npm run build
```

**Real acceptance test.** Render two sibling telemetry gadgets for the same unit via
`UnitFieldValue`/`useUnitField` on two different fields. Push a field patch that changes
only one of them. Assert the other did not re-render (e.g. via a render-count spy). This is
the behaviour the whole task exists to buy — do not report completion without it.

Manual check: exercise every gadget touched (battery, GPS/nav, power, FCB, SDR, tracker) on
a live or simulated telemetry stream and confirm values still update live, with no
perceptible added latency.
