# TASK-01 — Get view objects out of the drone model

**Depends on:** nothing (do TASK-07 first if convenient, it shrinks this one).
**Blocks:** TASK-02, TASK-04.
**Size:** large (~1 week). **Risk:** medium — touches the map render path.

## Goal

`CAndruavUnitObject` — the domain entity for a drone — currently holds **live Leaflet
marker instances** as fields. Remove them. After this task a unit is plain data:
serializable, constructible in a test, and free of any DOM or map dependency.

This is the foundation seam. Nothing else in the refactor set works until it lands.

---

## Current state

`src/js/js_andruavUnit.js:844` defines:

```js
class C_GUIHelper {
  constructor(p_parent) {
    this.m_parent = p_parent;
    this.m_gui_flightPath = new ClssCustomCircularBuffer(js_globals.CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT);
    this.m_wayPoint_markers = [];
    this.m_wayPoint_polygons = [];
    this.m_marker = null;
    this.m_marker_destination = null;
    this.speed_link = false;
  }
}
```

It is instantiated as `this.m_gui = new C_GUIHelper(this)` inside
`CAndruavUnitObject.init()`.

**`C_GUIHelper` is not sealed**, so callers have added five more fields at runtime. The full surface, from `grep -rho "m_gui\.[a-zA-Z_0-9]*" src/ | sort -u`:

| Field | Kind | Destination |
|---|---|---|
| `m_marker` | Leaflet marker | map registry |
| `m_marker_destination` | Leaflet marker | map registry |
| `m_marker_home` | Leaflet marker (added at runtime) | map registry |
| `m_wayPoint_markers` | Leaflet layer array | map registry |
| `m_wayPoint_polygons` | Leaflet layer array | map registry |
| `m_mapObj` | map object handle | map registry |
| `m_marker3d_events_attached` | render bookkeeping flag | map registry |
| `m_flightPath_style` | Leaflet style object | map registry |
| `m_gui_flightPath` | circular buffer of past positions | **stays on the unit** (telemetry history, not a view object) |
| `speed_link` | UI toggle, 8 sites | per-unit UI preference store |
| `defaultCircleRadius` | UI default | per-unit UI preference store |
| `defaultHieght` | UI default (note the existing typo — **keep it**) | per-unit UI preference store |

Three destinations, not one. Getting this split right is the whole task.

### The second copy

`js_globals.v_vehicle_gui` is a parallel registry of the *same* state, keyed by partyID.
It exists because units get recreated and their markers were being lost. There are repair
blocks that copy between the two:

- `src/js/js_main.js:2861-2864`
- `src/js/js_main.js:2986-2987` — **inside the per-packet GPS handler**, so this runs for
  every unit on every position update
- `src/js/js_main.js:3018` — writes the copy back

All three delete themselves once there is one registry.

---

## Target state

### 1. `src/js/services/map/unitLayerRegistry.js` (new)

Owned by the map layer. Keyed by partyID, holding everything Leaflet/Mapbox.

```js
/**
 * The single owner of per-unit map layer objects. Replaces
 * CAndruavUnitObject.m_gui and js_globals.v_vehicle_gui.
 *
 * Lifetime is the MAP's, not the unit's: entries survive a unit object being
 * recreated (which is why v_vehicle_gui existed), and are removed only by
 * fn_disposeUnitLayers.
 */
class CUnitLayerRegistry {
  fn_get(p_partyID)            // -> UnitLayers | null
  fn_getOrCreate(p_partyID)    // -> UnitLayers  (fields all null/[] on create)
  fn_disposeUnitLayers(p_partyID)  // removes layers from the map, then drops the entry
  fn_disposeAll()
}
export const js_unitLayerRegistry = ...  // singleton, matching the codebase's pattern
```

`UnitLayers` shape — keep the existing field names so the diff at call sites is a path
change only:

```js
{ m_marker, m_marker_destination, m_marker_home,
  m_wayPoint_markers, m_wayPoint_polygons,
  m_mapObj, m_marker3d_events_attached, m_flightPath_style }
```

`fn_disposeUnitLayers` is new behaviour that did not exist before — the old code leaked
markers when a unit disappeared. Implement it, but **do not wire it into a
unit-removal path in this task.** Adding the call is a follow-up; wiring it now risks
removing markers for units that are merely quiet.

### 2. `src/js/state/unitUiPrefs.js` (new)

```js
// Per-unit UI preferences. NOT domain data, NOT map objects.
// Values are read/written by React components and by js_main dialogs.
fn_getUnitPrefs(p_partyID)                      // -> { speed_link, defaultCircleRadius, defaultHieght }
fn_setUnitPref(p_partyID, p_key, p_value)
```

Defaults come from `js_globals.CONST_DEFAULT_RADIUS` / `CONST_DEFAULT_ALTITUDE` as today.

> Note for TASK-04: those two `js_globals` fields are written at runtime by 5 call sites
> each, despite the `CONST_` prefix. They are preferences, not constants. Do not try to
> freeze them here.

### 3. `CAndruavUnitObject`

- Delete `class C_GUIHelper` and the `this.m_gui = new C_GUIHelper(this)` line.
- Add `this.m_flightPathHistory = new ClssCustomCircularBuffer(...)` in its place —
  this is the old `m_gui_flightPath`, renamed and promoted to a first-class field. It is
  position history, which is domain data.
- Delete `js_globals.v_vehicle_gui` from `src/js/js_globals.js:13`.

---

## Steps

1. Write `unitLayerRegistry.js` and `unitUiPrefs.js` with no callers. Commit.
2. Migrate the **11 `speed_link` / `defaultCircleRadius` / `defaultHieght` sites** to
   `unitUiPrefs`. These are the easiest and touch 5 component files:
   `jsc_ctrl_ardupilot_flightControl.jsx`, `jsc_ctrl_speed_control.jsx`,
   `jsc_unitControlArrayView.jsx`, `jsc_unit_control_drone.jsx`, plus `js_main.js`.
   Commit.
3. Migrate `m_gui_flightPath` -> `m_flightPathHistory` (2 sites in `js_main.js`). Commit.
4. Migrate the map-object fields to `unitLayerRegistry`, file by file. Order:
   `js_main.js` last, because it holds ~34 of the ~46 sites. The component sites are:
   `jsc_unitControlArrayView.jsx` (3), `jsc_unitControlGCSList.jsx` (1),
   `jsc_unitControlMainList.jsx` (1). Commit per file.
5. Delete `C_GUIHelper`, delete `js_globals.v_vehicle_gui`, delete the three repair blocks
   in `js_main.js` (lines ~2861, ~2986, ~3018). Commit.
6. Add `Object.seal(this)` to the `UnitLayers` factory so no one re-opens the bag.
7. Add the first model test — see Acceptance.

---

## Do not change

- Field names inside `UnitLayers`. Same names, new home.
- The `defaultHieght` typo. Renaming it is a separate cleanup and will hide this diff.
- Anything in `js_leafletmap.js` / `js_map3d.js` beyond adding the registry import.
- The circular buffer implementation.
- ADSB marker handling — `CADSBObject` has its own `m_*` rendering contract (see
  `AGENTS.md`) and is **out of scope**.

## Acceptance

```bash
# the model no longer mentions view objects
grep -n "m_gui\b\|C_GUIHelper" src/js/js_andruavUnit.js          # -> zero lines
grep -rn "m_gui\." src/                                          # -> zero lines
grep -rn "v_vehicle_gui" src/                                    # -> zero lines

# the model no longer imports anything map-related
grep -n "leaflet\|Leaflet\|js_leafletmap\|js_map3d" src/js/js_andruavUnit.js  # -> zero lines

# the new modules exist
test -f src/js/services/map/unitLayerRegistry.js
test -f src/js/state/unitUiPrefs.js

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> must not exceed 13 cycles
```

**The real acceptance test.** Add `src/js/js_andruavUnit.test.js` containing a test that
constructs a `CAndruavUnitObject`, sets a party ID and a position, and asserts on it —
**with no DOM, no map and no jsdom-dependent import**. If that test cannot be written and
passed, the task is not done regardless of what the greps say.

Manual check: connect with 2+ units, confirm markers appear, move, leave a flight path,
show home/destination markers, and that waypoints still render on the planning page.
