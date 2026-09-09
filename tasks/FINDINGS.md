# FINDINGS — TASK-15 (reduce jQuery in heavy components)

Behaviour-preserving refactor notes. No bugs were fixed inline; the
items below are observations recorded per the task rules ("If you find a
bug while working, do not fix it inline — note it in FINDINGS.md and
keep going").

## jsc_unitControlArrayView.jsx (12 → 2)

- The two remaining `$(...)` calls are `.off('mouseout')` and
  `.on('mouseout')` on the parent `#andruav_unit_list_array_float`
  container (rendered by `pages/home.js` / `pages/mobile.js`, not by this
  component). They stay jQuery because they must remove/re-add the
  mouseout handler that `src/js/js_main.js` `enableDragging()` registers
  via jQuery `.on()`. A direct-DOM `removeEventListener` cannot reach
  jQuery-tracked handlers, and `enableDragging()` (jQuery UI
  `.draggable()`) is explicitly out of scope for TASK-15. The
  `.attr('opacity')` / `.css('opacity')` calls on the same element were
  converted to direct DOM (`setAttribute` / `style.opacity`); only the
  event off/on remain jQuery.
- The `#obaq` pin icon is rendered by this component, so its
  `bi-x-diamond` ↔ `bi-x-diamond-fill` toggle was moved to React state
  (`m_opaque`), kept in sync with the legacy `attr('opacity')` flag.
- `$('#andruavUnits').show()` (on socket register) became
  `document.getElementById('andruavUnits').style.display = 'block'`.
  `#andruavUnits` is rendered by `pages/home.js` (row_2); this is a
  cross-component reveal, not a form-field read/write.

## jsc_fence_shape_control.jsx (14 → 0 in code)

- **Pre-existing bug (not fixed):** `ClssPolygonControl` renders its
  name/checkbox inputs with ids `#name_edit_shape` / `#chk_restricted_area`,
  but the shared `ClssShapeControl.fn_editShape` / `fn_displayShapeData`
  read/write `#name` / `#chk`. So for a Polygon fence, typing a name never
  takes effect — `fn_editShape` reads the (missing) `#name` and falls back
  to a random `fence_XXXX` name, and the restricted-area checkbox state is
  never shown. This refactor preserves that behaviour exactly: the
  `nameRef`/`chkRef` are only attached in the subclasses that render
  `#name`/`#chk` (Polyline/Circle/Rectangle), so for Polygon the refs stay
  null and the guards reproduce the legacy no-op.
- `ClssPolygonControl.fn_displayShapeData` also writes to `#distance`,
  which Polygon does not render — a no-op. `distanceRef` is declared on the
  parent but only attached by `ClssPolylineControl`, so the guard
  reproduces the no-op.
- The `#sel` fence-action `<select>` lives in the `ClssFenceAction` child
  component, so it has no ref on the shape-control parent; it is looked up
  with `document.getElementById('sel')`. IDs are unique while a single fence
  control is rendered (the parent `_renderswitch` mounts one subclass at a
  time), so this matches the legacy `$('#geo #sel')` selection. Reading the
  shape's `isHardFence` directly was avoided because on first "Apply" of a
  new shape `isHardFence` is `null` and `parseInt(null)` is `NaN`, whereas
  the rendered select defaults to value `"0"` — the DOM read preserves the
  `parseInt("0") === 0` behaviour.
- The two `grep '$('` hits that remain in the file are pre-existing
  commented-out dead code (the `$('#geo #sel')` lines in `ClssFenceAction`
  and `ClssShapeControl`). They were not touched.

## jsc_gamepadControl.jsx (17 → 1)

- **Pre-existing bug (not fixed):** `fn_requestGamePad` bound a jQuery
  `click` handler on `#btnGoto` that called
  `fn_gotoUnit_byPartyID($('#modal_ctrl_gamepad').attr(p_andruavUnit.getPartyID()))`.
  No attribute named by the party ID is ever set on the modal, so
  `.attr(partyID)` returns `undefined` and the call is a no-op. The button
  already has a React `onClick={fn_gotoUnitPressed}` that calls
  `fn_gotoUnit_byPartyID(this.state.m_andruavUnit.getPartyID())` correctly.
  The redundant jQuery binding was removed; the React handler now solely
  drives the button. Net effect: the dead `fn_gotoUnit_byPartyID(undefined)`
  call no longer fires alongside the correct one.
- The single remaining `$(...)` call is `.draggable()` (jQuery UI) on the
  root ref node. jQuery UI `.draggable()` is out of scope for TASK-15 (same
  reasoning as `js_main.js` `enableDragging()`).
- `show()` / `hide()` now set `style.display` on `rootRef.current`;
  mouseover/mouseout opacity and the opaque-btn pin toggle moved to React
  handlers. The pin flag is the `m_opaque` instance field (mirrors the
  legacy `attr('opacity')`); opacity is applied directly to the DOM node
  to avoid re-renders, matching the legacy `.css('opacity', ...)` mechanism.

## Sweep (small usages)

- `jsc_user_list.jsx` (4 → 0): `$('#' + e.target.id).val()` →
  `e.target.value` (the event target is the element with that id).
  `$('#prop_val_acc')[0].value=''` → `document.getElementById(...).value=''`
  (the clear runs inside a non-arrow callback where `this` is not bound to
  the component, so a ref cannot be used there).
- `jsc_cameraDialogControl.jsx` (4 → 0): the two getters now read
  `this.txt_ShootingInterval.current.value` / `this.txt_TotalImages.current.value`
  (refs already existed). The two `$(this).parents('tr').removeClass('draggable')`
  mousedown handlers became `this.closest('tr').classList.remove('draggable')`.
- `jsc_cmp_login.jsx` (1 → 0): `$('#txtLoginName').val(...)` →
  `this.m_loginNameRef.current.value = ...` (ref already existed; the input
  also has `defaultValue=fn_getLoginName()`).
- `jsc_unitParametersList.jsx` (1 → 0): `$('#' + e.target.id).val()` →
  `e.target.value`.
- `jsc_unitControlMainList.jsx` (1 → 0): `$('#andruavUnits').show()` →
  `document.getElementById('andruavUnits').style.display = 'block'` (same
  cross-component pattern as `jsc_unitControlArrayView`).
- `jsc_videoScreenComponent.jsx` (1 → 0): `$(selectorString)[0]` →
  `document.getElementById(...)` (equivalent for an id selector).
- `jsc_ctrl_waypoint_actions.jsx` (1 → 0): the jQuery was already dead
  code in a trailing `//` comment (the live code uses
  `this.m_missionTypeRef.current.value`); the dead comment was removed.
- `obs_jsc_fence_global_settings.jsx` (2 → 0): both hits were already
  dead commented-out `$('#andruavUnits').show()/hide()` lines; removed.
- `jsc_yawDialogControl.jsx` (2, unchanged): both uses are `jquery-knob`
  (`$(this.yaw_knob.current).val(...).trigger('change')` and knob init).
  Skipped per the task — `jquery-knob` is out of scope.
- Unused `import $ from 'jquery'` was removed from the files that no
  longer use it (`jsc_videoScreenComponent`, `jsc_unitControlMainList`,
  `jsc_cmp_login`). In the two files that also side-effect-import
  `jquery-ui-dist` (`jsc_cameraDialogControl`, `jsc_unitParametersList`),
  the jquery import was converted to a side-effect `import 'jquery'` to
  preserve jquery-before-jquery-ui load order without an unused `$` var.

## Verification limits

- No gamepad was connected during this work, so `jsc_gamepadControl.jsx`
  was verified by code inspection only. Specifically exercised by
  inspection: the show/hide/display path (`fn_requestGamePad` /
  `fn_releaseGamePad` / `componentDidMount`), the opacity pin toggle
  (`fn_onMouseOver` / `fn_onMouseOut` / `fn_onOpaqueClick` and the
  `m_opaque` flag), and the `#btnGoto` React onClick (`fn_gotoUnitPressed`).
  What could NOT be exercised without hardware: actual gamepad axis/button
  rendering (unchanged — those sub-components were not touched) and the
  jQuery UI `.draggable()` handle drag (out of scope, unchanged).
- Fence shape drawing/editing was verified by code inspection only (no
  map session). The ref-attachment/guard logic above is designed to
  reproduce the legacy `$('#geo #id')` selection semantics exactly,
  including the Polygon no-ops.
