# TASK-15 — Reduce jQuery in the three heaviest components (finish TASK-08 step 5)

**Depends on:** TASK-08 (steps 1-4 — the layout store, `fn_setDisplayMode`, and the
`fn_activate*` removal — are already merged).
**Blocks:** nothing.
**Size:** medium (~1 week). **Risk:** medium — these are interactive components
(gamepad config, fence drawing, unit list) where a behaviour slip is easy to miss.

## Goal

TASK-08 replaced jQuery-driven layout switching with a React store (steps 1-4, done). Step
5 — reducing jQuery inside the three most jQuery-heavy components — was explicitly deferred
as "the long tail" and has not been started. This task finishes it.

---

## Current state (verified — unchanged from TASK-08's original baseline)

```bash
grep -c -F '$(' src/components/gamepad/jsc_gamepadControl.jsx               # -> 17
grep -c -F '$(' src/components/planning/fence/jsc_fence_shape_control.jsx   # -> 14
grep -c -F '$(' src/components/unit_controls/jsc_unitControlArrayView.jsx  # -> 12
```

Identical to the counts TASK-08 recorded before step 5 was deferred — zero reduction has
happened in these three files. The rest of `src/components/` still has scattered jQuery use
totalling the same ballpark TASK-08 measured (~60):

```
src/components/jsc_user_list.jsx                              4
src/components/dialogs/jsc_cameraDialogControl.jsx             4
src/components/planning/fence/obs_jsc_fence_global_settings.jsx 2
src/components/dialogs/jsc_yawDialogControl.jsx                2
src/components/video/jsc_videoScreenComponent.jsx              1
src/components/unit_controls/jsc_unitControlMainList.jsx       1
src/components/planning/mission/jsc_ctrl_waypoint_actions.jsx  1
src/components/gadgets/jsc_cmp_login.jsx                       1
src/components/dialogs/jsc_unitParametersList.jsx              1
```

`js_main.js` itself is already down to 48 (TASK-08's target of `< 60` — done, not part of
this task).

Most uses in the three target files are `$('#id').val()` / `.prop('checked')` reads and
writes of form fields that React already renders — not DOM structural manipulation. This is
the same read as TASK-08's own assessment; nothing has changed since.

---

## Steps

Per TASK-08's own ordering guidance — smallest/least-entangled first, `jsc_gamepadControl.jsx`
last:

1. **`jsc_unitControlArrayView.jsx` (12 uses).** Replace `$('#id').val()`/`.prop('checked')`
   reads/writes with React refs (`useRef`/`React.createRef`) or controlled component state,
   whichever the surrounding code already leans toward. Commit.
2. **`jsc_fence_shape_control.jsx` (14 uses).** Same pattern. This one manipulates fence
   drawing state — verify with the map open that shape creation/editing still behaves
   identically before and after each change. Commit.
3. **`jsc_gamepadControl.jsx` (17 uses).** Most entangled, per TASK-08's explicit warning —
   do this last, once the pattern is proven on the other two. Test with an actual gamepad
   connected if possible; if not, note in `FINDINGS.md` that this was verified via code
   inspection only, and what specifically could not be exercised.
4. **Sweep the remaining small usages** (`jsc_user_list.jsx`, `jsc_cameraDialogControl.jsx`,
   `obs_jsc_fence_global_settings.jsx`, `jsc_yawDialogControl.jsx`,
   `jsc_videoScreenComponent.jsx`, `jsc_unitControlMainList.jsx`,
   `jsc_ctrl_waypoint_actions.jsx`, `jsc_cmp_login.jsx`, `jsc_unitParametersList.jsx`) with
   the same read/write-to-ref pattern where trivial. Skip any that turn out to be
   `jquery-knob` or `.draggable()` calls (out of scope, see below) — note which ones you
   skipped and why.

---

## Do not change

- `enableDragging()` (`src/js/js_main.js:343`) — uses jQuery UI `.draggable()`. Out of
  scope, same reasoning as TASK-08: replacing it with `react-draggable` is a separate
  change.
- `jquery-knob` usage in `jsc_yawDialogControl.jsx`. Separate change, same as TASK-08.
- The visual result and interaction behaviour. Every mode/control must look and behave
  identically before and after — this is a mechanism change, not a redesign.
- `layoutStore.js`, `fn_setDisplayMode`, or anything from TASK-08 steps 1-4 — already done,
  out of scope here.

## Acceptance

```bash
grep -c -F '$(' src/components/unit_controls/jsc_unitControlArrayView.jsx  # -> materially below 12
grep -c -F '$(' src/components/planning/fence/jsc_fence_shape_control.jsx  # -> materially below 14
grep -c -F '$(' src/components/gamepad/jsc_gamepadControl.jsx              # -> materially below 17

npm run lint && npm test && npm run build
```

**Manual acceptance.**
1. Connect (or simulate) a gamepad; confirm every mapped control still works, config UI
   still reads/writes correctly.
2. Draw, edit, and delete a fence shape on the planning map; confirm behaviour is
   pixel-identical to `main`.
3. Open the unit array view with several connected units; confirm sort/filter/selection
   controls all still work.
4. Repeat at mobile width if any of the three components render there.
