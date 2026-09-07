# TASK-04 — Dissolve js_globals into four modules

**Depends on:** TASK-01 and TASK-03. **Do not start early.**
**Size:** medium, but the widest diff in the set. **Risk:** low per change, high for merge conflicts.

## Goal

`src/js/js_globals.js` is a 378-line singleton imported by **94 of 264 modules** (36% of the
codebase). It mixes six unrelated kinds of data in one mutable, unsealed object, so no module
in this repo can be reasoned about locally and nothing in it can be tree-shaken.

Split it by lifetime and mutability. Three of the four results become frozen constants; only
one remains state.

**Sequencing warning:** this touches nearly every file. Run it *after* TASK-01 and TASK-03
have merged, or you will spend the week resolving conflicts instead of refactoring.

---

## Current state

One class, `GLOBALS`, exposed as `export const js_globals = GLOBALS.getInstance()`.
It is **not** sealed, so fields have been added at runtime (`v_andruavWS`, `v_andruavFacade`).
131 distinct field names are read across the codebase.

Six categories in one bag:

| Category | Examples | Count |
|---|---|---|
| Live mutable state | `v_andruavClient`, `m_andruavUnitList`, `v_map_shapes`, `v_waypointsCache`, `myposition`, `m_markGuided`, `m_current_tab_status`, `v_andruavWS`, `v_andruavFacade` | ~10 |
| User preferences | `v_useMetricSystem`, `v_displayMode`, `v_en_Drone`, `v_en_GCS`, `v_enable_tabs_display`, `v_enable_unit_sort`, `v_enable_gcs_display`, `v_enable_wind`, `v_gamePadMode`, `active_gamepad_index` | ~10 |
| Asset paths | `planes_icon`, `quad_icon`, `rover_icon`, `boat_icon`, `swarm_*_location_icon`, `flightPath_colors`, `v_colorDrawPathes` | 7 arrays |
| localStorage keys | `LS_*` | 25 strings |
| Gamepad mapping | `STICK_MODE_MAPPING`, `STICK_MODE_MAPPING_NAMES`, `v_gamepad_function_array`, `v_gamepad_button_function_array`, `BUTTON_FUNTION_*`, `GP_*` | ~15 |
| Map3D / render constants | `CONST_MAP3D_*`, `CONST_MAP_WIND_ARROW_*`, `DIALOG_ICONS` | ~45 |

### The trap: `CONST_` does not mean constant here

These are **written at runtime** despite the prefix, and are therefore preferences, not
constants. Do not freeze them:

```
CONST_DEFAULT_RADIUS                      5 write sites
CONST_DEFAULT_ALTITUDE                    5 write sites
CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE   4
CONST_DEFAULT_SWARM_VERTICAL_DISTANCE     4
CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN  2
CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN    2
CONST_DEFAULT_RADIUS_min                  2
CONST_DEFAULT_ALTITUDE_min                2
CONST_MAP_EDITOR                          4   <- actually a mode flag
```

Verify this list yourself before you start; it will have shifted:

```bash
grep -rhno "js_globals\.[a-zA-Z_0-9]* *=[^=]" src/ | sed 's/.*js_globals\.//;s/ *=.*//' | sort | uniq -c | sort -rn
```

Anything appearing in that output is mutable and belongs in `session.js` or `preferences.js`,
whatever its name says.

---

## Target state

```
src/js/config/constants.js    Object.freeze — genuinely immutable values
src/js/config/mapStyle.js     Object.freeze — the ~45 CONST_MAP3D_* / wind-arrow values
src/js/config/assets.js       Object.freeze — icon path arrays, colour arrays, DIALOG_ICONS
src/js/config/gamepadMap.js   Object.freeze — stick/button mapping tables
src/js/storage/keys.js        Object.freeze — the 25 LS_* strings
src/js/state/session.js       mutable runtime state, behind accessors
src/js/state/preferences.js   user preferences, behind accessors (incl. the mislabelled CONST_*)
```

Seven files, not four — the categories genuinely differ and `mapStyle` alone is 45 values that
only `js_map3d.js` reads.

### `session.js` shape

Do not export a bare mutable object; that just relocates the problem. Use accessors:

```js
let m_andruavClient = null;
export const fn_getAndruavClient = () => m_andruavClient;
export const fn_setAndruavClient = (p_client) => { m_andruavClient = p_client; };
```

This makes every write greppable, which is the property `js_globals` never had.

### `preferences.js`

Preferences already persist through `src/js/js_localStorage.js`. `preferences.js` is the
in-memory cache plus change notification; it must **not** duplicate the localStorage layer.
It should read through `js_localStorage` on init and write through it on change, and it is
the natural place for `EE_onPreferenceChanged` (dispatched from 11 sites today) to become a
subscription instead.

---

## Steps

Migrate one category at a time, deleting fields from `js_globals` as they move, so the file
shrinks visibly and the remaining work is always obvious.

1. `storage/keys.js` — 25 `LS_*` strings. Purely mechanical, zero risk. Commit.
2. `config/assets.js` — icon and colour arrays. Commit.
3. `config/gamepadMap.js` — mapping tables. Only `src/js/gamepad/` and
   `src/components/gamepad/` consume these. Commit.
4. `config/mapStyle.js` — `CONST_MAP3D_*` and `CONST_MAP_WIND_ARROW_*`. Consumers are
   `js_map3d.js` and `js_main.js`. Commit.
5. `config/constants.js` — what is left that is genuinely never written. Re-run the write-site
   grep above to confirm each one before moving it here. Commit.
6. `state/preferences.js` — the preference fields **and** the mislabelled `CONST_DEFAULT_*`
   set. Keep the existing names on the accessors to limit blast radius
   (`fn_getDefaultAltitude()` returning what was `CONST_DEFAULT_ALTITUDE`). Commit.
7. `state/session.js` — the ~10 genuinely runtime values, behind accessors. Commit.
8. Delete `src/js/js_globals.js`. Commit.

---

## Do not change

- Field *values*. This is a move, not a retune. No default altitude gets a new number.
- `js_localStorage.js` — `preferences.js` sits on top of it, it does not replace it.
- `js_siteConfig.js` — separate concern (runtime config from `public/config.json`),
  out of scope. Note that it already has a cycle with `js_localStorage` (cycle #8 of 13);
  leave it.
- The `CONST_` prefix on fields you move to `preferences.js`. Renaming them and moving them
  in the same commit makes the diff unreviewable. Rename later if you want.

## Acceptance

```bash
# the god object is gone
test ! -f src/js/js_globals.js
grep -rn "js_globals" src/                                # -> zero lines

# the config modules are actually frozen
grep -c "Object.freeze" src/js/config/constants.js src/js/config/mapStyle.js \
                        src/js/config/assets.js src/js/config/gamepadMap.js \
                        src/js/storage/keys.js    # -> each >= 1

# session state is behind accessors, not exported raw
grep -nE "^export (const|let) [a-z_]+ *=" src/js/state/session.js | grep -v "fn_"   # -> zero lines

# map style is consumed only where it should be
grep -rl "config/mapStyle" src/ | grep -v "js_map3d\|js_main\|config/"   # -> ideally zero

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/    # -> must not increase
```

Manual check: full app pass — units render with correct icons, gamepad axes map correctly in
all four stick modes, 3D map renders models at the right scale, wind arrow appears, every
preference in Settings persists across reload, metric/imperial toggle works.
