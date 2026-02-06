`js_globals` is the runtime configuration/state singleton used by the web client. Most user-facing fields are edited from the UI (Global Settings panel) and persisted via `js_localStorage`.

Files:

- `src/js/js_globals.js` (runtime defaults + constants)
- `src/js/js_localStorage.js` (persistence into browser localStorage/sessionStorage)
- `src/components/jsc_globalSettings.jsx` (UI that edits some values)

---

# 1) Important: this is NOT `public/config.json`

`public/config.json` overrides `src/js/js_siteConfig.js` only.

It does **not** override `js_globals`.

If you want to change `js_globals` defaults permanently, you typically do one of:

- Use the UI that stores values in browser localStorage (`js_localStorage`).
- Change defaults in `js_globals.js` (code-level default).

---

# 2) How values are loaded

`js_localStorage` (singleton) initializes some `js_globals` values on startup if storage is supported:

- `js_globals.v_useMetricSystem`
- `js_globals.CONST_DEFAULT_ALTITUDE`
- `js_globals.CONST_DEFAULT_RADIUS`

Other preferences are read by UI code when needed (for example `jsc_globalSettings.jsx` reads volume, tabs display, unit sorting, etc.).

---

# 3) User-tunable defaults (persisted in localStorage)

These are practical “options you can change” without rebuilding the app.

| Setting | Effect | Where it is persisted |
|---------|--------|-----------------------|
| `v_useMetricSystem` | Metric vs imperial UI behavior (affects distance labels and unit conversion when toggling). | `LS_METRIC_SYS` via `js_localStorage.fn_setMetricSystem()` |
| `CONST_DEFAULT_ALTITUDE` | Default altitude used by planning/mission UI when creating new actions/items. Enforced by `CONST_DEFAULT_ALTITUDE_min`. | `LS_DEFAULT_ALT` via `js_localStorage.fn_setDefaultAltitude()` |
| `CONST_DEFAULT_RADIUS` | Default radius used by circle-related operations and mission defaults. Enforced by `CONST_DEFAULT_RADIUS_min`. | `_vDefaultRadius` via `js_localStorage.fn_setDefaultRadius()` |
| `CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE` | Default swarm formation horizontal distance. Enforced by `CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN`. | `_vDefaultSHD` via `js_localStorage.fn_setDefaultSwarmHorizontalDistance()` |
| `CONST_DEFAULT_SWARM_VERTICAL_DISTANCE` | Default swarm formation vertical distance. Enforced by `CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN`. | `_vDefaultSVD` via `js_localStorage.fn_setDefaultSwarmVerticalDistance()` |
| `CONST_DEFAULT_VOLUME` | Default volume for speech/voice features. | `LS_DEFAULT_VOLUME` via `js_localStorage.fn_setVolume()` |
| `LS_ENABLE_SPEECH` (via `js_localStorage.fn_getSpeechEnabled`) | Enables/disables speech. When disabled, volume slider is disabled in UI. | `LS_ENABLE_SPEECH` |
| `v_enable_tabs_display` | UI preference: enable/disable tabbed settings display. | `LS_TAB_DISPLAY_ENABLED` |
| `v_enable_unit_sort` | UI preference: auto-sort unit list. | `LS_UNIT_SORTED_ENABLED` |
| `v_enable_gcs_display` | UI preference: show GCS units in UI lists. | `_vGCSDisplay` |
| `LS_SHOW_ME_GCS` (via `js_localStorage.fn_setGCSShowMe`) | UI/network behavior preference related to showing this GCS. | `LS_SHOW_ME_GCS` |
| `LS_SELECTED_THEME` | Selected UI theme name. | `LS_SELECTED_THEME` |

---

# 4) Other runtime tuning knobs (code-level defaults)

These are defined in `js_globals.js` and typically adjusted in code.

| Setting | Effect |
|---------|--------|
| `v_connectRetries` | Retry count used by connection logic where implemented. |
| `CONST_DEFAULT_ALTITUDE_min` / `CONST_DEFAULT_RADIUS_min` | Minimum allowed values enforced by settings UI and validation. |
| `CONST_DEFAULT_ALTITUDE_STEP` | Step size for some altitude controls (where used). |
| `CONST_DEFAULT_SPEED_MIN` / `CONST_DEFAULT_SPEED_STEP` | Limits/step used in some mission/planning speed controls (where used). |
| `CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT` | Number of points for flight-path visualization (smoothness vs performance). |
| `v_EnableADSB` | Enables ADS-B related UI/processing (where integrated/used). |
| `v_en_Drone` / `v_en_GCS` | Enables filtering of drone vs GCS categories in UI (where used). |
| `v_gamePadMode` | Default gamepad “mode” concept (stick mapping preset). Final behavior depends on stored gamepad configs. |
| `GP_EPSILON_CHANGE` | Gamepad RC send threshold: minimum axis delta to trigger a send (noise filtering). |
| `GP_HEARTBEAT_MS` | Gamepad RC heartbeat: max delay before re-sending unchanged axes. |
| `GP_SUDDEN_CHANGE` / `GP_MIN_GAP_FAST_MS` | Immediate-send logic for large stick changes with rate limiting. |
| `v_mission_file_extension` | Default mission file extension used by mission import/export UI. |

---

# 5) LocalStorage keys

Keys are defined in `js_globals.js` (e.g. `LS_DEFAULT_ALT`, `LS_METRIC_SYS`, `LS_DEFAULT_VOLUME`, etc.) and used by `js_localStorage.js`.

If you need to reset preferences, clear the relevant keys from the browser’s localStorage.
