# TASK-08 — Get layout state out of jQuery and the DOM

**Depends on:** nothing. Independent.
**Size:** medium (~1 week). **Risk:** medium — this is user-visible layout.

## Goal

Two renderers currently compete for the same DOM: React owns the component tree, and jQuery
show/hides elements underneath it. Give layout a single source of truth in React state, and
stop reading UI state back out of the DOM.

---

## Current state

**187 jQuery calls in `src/js/js_main.js`**, plus ~60 across `src/components/`. The heaviest
concentrations are:

```
src/components/gamepad/jsc_gamepadControl.jsx          17
src/components/planning/fence/jsc_fence_shape_control.jsx  14
src/components/unit_controls/jsc_unitControlArrayView.jsx  12
```

### The layout system

Seven functions in `js_main.js` switch views by jQuery show/hide on elements React renders:

```
fn_applyControl(v_small_mode)                    line 701
fn_activateClassicalView()                       line 576
fn_activateMapCameraSectionOnly()                line 601
fn_activateFixedVehicleListOnly()                line 620
fn_activateMapCameraSectionAndFloatingList()     line 638
fn_activateAllViews()                            line 657
fn_activateVehicleCardOnly()                     line 683
```

React does not know its DOM was mutated, so any re-render of those subtrees silently reverts
the layout.

### State read out of the DOM

The id `div_map3d_view` is referenced **19 times** across `src/`. Seven of those are
visibility *queries* — reading application state out of the DOM. The rest are legitimate
show/hide writes and can stay until step 3. The query looks like this:

```js
const mapAdapter = ($('#div_map3d_view').is(':visible') === true) ? js_map3d : js_leafletmap;
```

"Which map is active" is application state. Asking the DOM for it means the answer depends on
CSS and on whatever ran last.

Related: `js_globals.v_displayMode` and `js_globals.m_current_tab_status` already exist and are
*supposed* to hold this. They are partially maintained and not consistently read.

---

## Target state

`src/js/state/layoutStore.js` — a small subscribable store, the single source of truth:

```js
{
  displayMode: 'classical' | 'map-camera' | 'fixed-list' | 'map-floating-list' | 'all' | 'vehicle-card',
  mapMode:     '2d' | '3d',
  smallMode:   boolean,
  activeTab:   string,
}
```

Layout is then expressed as **CSS classes driven by React state**, not as jQuery
`.show()`/`.hide()` calls. The seven `fn_activate*` functions become one:

```js
fn_setDisplayMode(p_mode)   // writes to the store; React re-renders; CSS does the rest
```

And every `$('#div_map3d_view').is(':visible')` becomes `js_layout.fn_getMapMode() === '3d'`.

---

## Steps

1. Add `layoutStore.js` and a `useLayout()` hook. Seed `displayMode` and `mapMode` from the
   existing `js_globals.v_displayMode` so persisted preferences keep working. Commit.
2. Replace the **map-mode DOM query** first — it is the highest-value, lowest-risk change and
   it appears in `fn_generateContextMenuHTML*`, `EVT_msgFromUnit_GPS`'s mouse-out handler, and
   several others. Find them all:
   ```bash
   grep -rn "div_map3d_view" src/ | grep visible    # the 7 reads - these are the targets
   ```
   `fn_showMap()` (line 789) and `fn_showMap3D()` (line 803) become the writers. Commit.
3. Convert the seven `fn_activate*` functions one at a time. For each: identify the element
   ids it toggles, add the equivalent CSS class on the React container, and delete the jQuery.
   The CSS lives in `src/css/css_styles.css` / `css_styles2.css`. Commit each.
4. Delete `fn_applyControl`'s jQuery body once all seven are converted; it becomes a thin call
   to `fn_setDisplayMode`. Commit.
5. Reduce jQuery in the three heaviest components. Most uses are `$('#id').val()` /
   `.prop('checked')` reads of form fields React already controls — replace with refs or
   controlled state. Do **not** attempt `jsc_gamepadControl.jsx` last-minute; it is the most
   entangled. Commit per component.

---

## Do not change

- `enableDragging()` (`js_main.js:343`) in this task. It uses jQuery UI `.draggable()`.
  Replacing it with `react-draggable` (already a dependency, used in 12 files) is a good idea
  but is a separate change — keep this task focused on layout state.
- `jquery-knob` in `jsc_yawDialogControl.jsx`. Same reasoning: separate change.
- The visual result. Every layout mode must look pixel-identical before and after. This is a
  mechanism change, not a redesign.
- `js_leafletmap.js` and `js_map3d.js` internals. Only the *selection* between them moves.

## Acceptance

```bash
# UI state is no longer read from the DOM (was 7 such reads)
grep -rn "div_map3d_view" src/ | grep -c visible             # -> 0

# the seven activate functions are gone
grep -cE "fn_activate(ClassicalView|MapCameraSectionOnly|FixedVehicleListOnly|MapCameraSectionAndFloatingList|AllViews|VehicleCardOnly)" src/js/js_main.js   # -> 0

# jQuery use in js_main is materially down (was 187)
grep -c -F '$(' src/js/js_main.js     # -> target < 60

npm run lint && npm test && npm run build
```

**Manual acceptance.** Cycle through every display mode, in both 2D and 3D map modes, at
desktop and mobile widths:
1. Each mode must look identical to `main` before the change. Screenshot-compare if you can.
2. **Trigger a re-render while a non-default mode is active** — e.g. connect a new unit, or
   change language — and confirm the layout does **not** revert. This is the bug the task
   exists to fix, and it is the check most likely to be skipped.
3. Reload the page and confirm the mode persists.
