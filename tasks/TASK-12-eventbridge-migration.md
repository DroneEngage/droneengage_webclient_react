# TASK-12 — Complete the EventBridge migration

**Depends on:** nothing (independent).
**Blocks:** nothing.
**Size:** medium (~45 class components + 5 function components). **Risk:** low.

## Goal

Finish the event-subscription leak-guard migration that was started in
"Plan1: Event-subscription hook + leak guard". Every React component that
still uses the manual `fn_subscribe` / `componentWillUnmount fn_unsubscribe`
pairing is migrated to either `EventBridge` (class components) or
`useEventSubscription` (function components), making listener leaks
structurally impossible.

Non-React JS modules (`js_main.js`, `js_map3d.js`, `js_leafletmap.js`,
`js_adsbManager.js`, `js_andruav_facade.js`, `js_webrtcthin2.js`,
`js_gamepad_*.js`, `js_andruav_gamepad.js`, `positionSmoother.js`,
`core/protocol/runtime.js`, `js_adsbProviderAisStream.js`) are **out of
scope** — they are not React components and cannot use hooks.

---

## Current state

- `useEventSubscription` hook exists in `src/js/hooks/useEventSubscription.js`.
- `EventBridge` component exists in `src/js/hooks/EventBridge.jsx`.
- ~19 function components already use `useEventSubscription` directly.
- 2 class components already use `EventBridge` (`jsc_ctrl_unit_drop_down_list.jsx`,
  `jsc_ctrl_sdr_spectrum.jsx`).
- **~45 class components** still use the manual pattern.
- **~5 function components** use manual `fn_subscribe` inside `useEffect`.

## Migration pattern

### Class components → EventBridge

For each class component:

1. Remove `js_eventEmitter.fn_subscribe(event, this, this.fn_handler)` from
   `constructor` / `componentDidMount`.
2. Remove `js_eventEmitter.fn_unsubscribe(event, this)` from
   `componentWillUnmount`.
3. Add `<EventBridge eventName={js_event.EVENT} onEvent={(data) => this.fn_handler(data)} />`
   as the first child inside `render()`'s return.
4. Import `EventBridge` if not already imported.
5. Remove the `js_eventEmitter` import only if no other references remain.
6. Handler signature changes from `(me, data)` / `(this, data)` to `(data)`.
   If the handler was called with `this` as the first arg (e.g.
   `this.fn_handler(this, p_unit)`), drop the `this`/`me` parameter.

### Function components with manual fn_subscribe in useEffect → useEventSubscription

Replace the `useEffect` + `fn_subscribe`/`fn_unsubscribe` pattern with a
direct `useEventSubscription(eventName, callback)` call.

---

## Steps

### Step 1 — Simple class components (1-2 subscriptions)

Migrate these files (each has 1-2 `fn_subscribe` calls):

- `jsc_ctrl_single_mission_control_bar.jsx` — 1 sub
- `jsc_videoTrackerLayer.jsx` — 1 sub
- `jsc_unit_control_drone.jsx` — 2 subs (extends base, has childcomponentWillMount)
- `jsc_ctrl_unit_main_bar.jsx` — 2 subs
- `jsc_ctrl_log_tab.jsx` — 1 sub
- `jsc_ctrl_single_plan_header.jsx` — 1 sub
- `jsc_ctrl_single_plan_container.jsx` — 2 subs
- `obs_jsc_fence_global_settings.jsx` — 1 sub
- `jsc_ctrl_telnet.jsx` — 2 subs
- `jsc_ctrl_sdr.jsx` — 1 sub
- `jsc_ctrl_p2p_inrange_nodes.jsx` — 1 sub
- `jsc_ctrl_p2p_inrange_bssid.jsx` — 1 sub
- `jsc_ctrl_p2p.jsx` — 1 sub
- `jsc_ctrl_gpio.jsx` — 1 sub
- `jsc_ctrl_audio.jsx` — 2 subs
- `jsc_yawDialogControl.jsx` — 1 sub
- `jsc_viewLinkGimbalControl.jsx` — 1 sub
- `jsc_unitParametersList.jsx` — 1 sub
- `jsc_servoDialogControl.jsx` — 1 sub
- `jsc_ctrl_depilot_control.jsx` — 2 subs
- `ClssDefault.jsx` — 1 sub
- `jsc_ctrl_details_tab.jsx` — 1 sub
- `jsc_ctrl_waypoint_location.jsx` — 1 sub
- `jsc_news_write.jsx` — 1 sub
- `jsc_mctrl_fire_event.jsx` — 1 sub
- `jsc_ctrl_andruav_extra_data.jsx` — 1 sub
- `jsc_ctrl_vibration.jsx` — 1 sub
- `jsc_ctrl_ardupilot_ekf.jsx` — 1 sub
- `jsc_videoCanvasLabel.jsx` — 1 sub

### Step 2 — Medium class components (3-4 subscriptions)

- `jsc_unit_control_base.jsx` — 4 subs (base class with childcomponentWillMount/Unmount)
- `jsc_videoDisplayComponent.jsx` — 3 subs
- `jsc_streamDialogControl.jsx` — 3 subs
- `jsc_news_display.jsx` — 3 subs
- `jsc_ctrl_audio.jsx` — 2 subs (if not done in step 1)
- `ClssGlobalSettings.jsx` — 2 subs (subscribes in constructor)
- `ClssAdsbSettings.jsx` — 2 subs
- `jsc_videoHUDOverlayComponent.jsx` — 2 subs
- `jsc_ctrl_depilot_control.jsx` — 2 subs (if not done in step 1)

### Step 3 — Complex class components (5+ subscriptions)

- `jsc_gcs_chat.jsx` — 4 subs
- `jsc_login.jsx` — 8 subs
- `jsc_videoScreenComponent.jsx` — 5 subs + 1 orphaned unsub (bug: unsubscribes
  `EE_onWebRTC_Video_Statistics` but never subscribed — remove the orphaned unsub)
- `jsc_unitControlMainList.jsx` — 5 subs
- `jsc_unitControlGCSList.jsx` — 6 subs
- `jsc_unitControlArrayView.jsx` — 6 subs (two classes in one file)
- `jsc_gamepadControl.jsx` — 7 subs (three classes in one file)
- `jsc_ctrl_mission_items_control.jsx` — 6 subs
- `jsc_fence_shape_control.jsx` — 5 subs
- `jsc_mobileLogin.jsx` — 7 subs
- `jsc_cmp_login.jsx` — 6 subs

### Step 4 — Function components with manual fn_subscribe in useEffect

- `DialogHost.jsx` — 1 sub in useEffect → useEventSubscription
- `jsc_mobile_telemetry_panel.jsx` — 1 sub in useEffect → useEventSubscription
- `jsc_mobile_module_details_panel.jsx` — 2 subs in useEffect → useEventSubscription
- `pages/home.js` — 1 sub in useEffect, **bug**: uses `this` as listener key in a
  function component (`this` is `undefined`). Fix: use `useEventSubscription`.
- `pages/mobile.js` — 12 subs in one useEffect with custom throttling. This one
  uses different listener objects for immediate vs throttled event groups.
  **Keep manual** — the throttling logic cannot be expressed with
  `useEventSubscription` alone. But fix the `this`-in-function-component bug
  if present (mobile.js already uses proper listener objects, so it's fine).

### Step 5 — Special case: jsc_user_list.jsx

Uses `window.StreamSensLibs.EventEmitter` instead of `js_eventEmitter`.
`EventBridge`/`useEventSubscription` are hardcoded to `js_eventEmitter`.
**Decision: leave as-is** — it's a different emitter, and parameterizing
`EventBridge` for a single call site adds more complexity than it saves.
Note in a comment that it's intentionally excluded.

### Step 6 — Verify

```bash
npm run lint          # zero NEW errors (pre-existing warnings OK)
npm test              # emitter tests must pass
npm run build         # must succeed
```

Grep verification — these should return zero matches in `.jsx` files
(excluding comments, EventBridge.jsx itself, useEventSubscription.js,
and jsc_user_list.jsx):

```bash
rg "fn_subscribe|fn_unsubscribe" --type-not js -g "*.jsx" src/
```

---

## Acceptance

1. `rg "fn_subscribe|fn_unsubscribe" -g "*.jsx" src/` returns matches only in:
   - `EventBridge.jsx` (comment)
   - `useEventSubscription.js` (comment — but this is .js not .jsx)
   - `jsc_ctrl_unit_drop_down_list.jsx` (comment)
   - `jsc_ctrl_tracker_button.jsx` (comment)
   - `jsc_ctrl_tracker_ai_list.jsx` (comment)
   - `jsc_ctrl_andruav_ctrl.jsx` (comment)
   - `jsc_user_list.jsx` (different emitter, intentionally excluded)
   - `pages/mobile.js` (complex throttling, intentionally kept manual — .js not .jsx)

2. `npm run lint` — zero new errors.
3. `npm test` — passes.
4. `npm run build` — succeeds.

## Notes

- The `m_flag_mounted` guard pattern (`if (me.m_flag_mounted === false) return`)
  in handlers becomes redundant with EventBridge — the hook auto-unsubscribes
  on unmount, so the callback can't fire after unmount. Keep the guard for
  now (behaviour-preserving); it's harmless and can be removed in a later
  cleanup pass.
- Some handlers use `(me, data)` where `me` is bound to `this` via
  `.bind(this)` or arrow functions in render. The EventBridge `onEvent`
  callback receives only `data`, so the handler's first `me`/`this` param
  must be dropped.
- For class components that subscribe in the `constructor` (not
  `componentDidMount`), the timing changes slightly: EventBridge subscribes
  on mount (after first render), not in the constructor. This is actually
  **more correct** — subscribing in the constructor can fire callbacks before
  the component is mounted. No behaviour change is expected because all
  handlers already guard on `m_flag_mounted`.
