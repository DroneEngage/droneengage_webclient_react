# TASK-09 — Isolate Mapbox GL vendor calls in js_map3d.js

**Depends on:** nothing. Fully independent single-file refactor; safe to run in parallel
with any other task in this set. Touches only `src/js/maps/js_map3d.js` and one new file.
**Size:** small (~half a day). **Risk:** low.

## Goal

`src/js/maps/js_map3d.js` (~3,570 lines) is the only place in the app that talks to
Mapbox GL JS. It does so correctly, but the vendor API is called directly, repeatedly,
throughout business logic — `window.mapboxgl`, `new mapboxgl.Marker(...)`,
`new mapboxgl.Popup(...)`, `new mapboxgl.LngLatBounds()`, `new mapboxgl.Map(...)` — plus a
hand-rolled CDN `<script>`/`<link>` loader with the SDK version hardcoded into two URL
strings. There is no npm dependency or lockfile entry for Mapbox GL at all; it is fetched
from `https://api.mapbox.com/mapbox-gl-js/...` at runtime.

Move every one of those vendor-construction call sites into one small module. This is
**not** a rewrite and **not** a generic multi-engine abstraction — it is relocating ~9
existing call sites into one file so:

1. A future Mapbox version bump, or a breaking API change, is a one-file diff instead of a
   hunt through 3,570 lines of feature code.
2. The SDK version string exists in exactly one place instead of two hardcoded URLs.
3. If this project ever needs to evaluate MapLibre GL (the open-source Mapbox GL fork —
   relevant if offline/self-hosted deployment is ever required, since the current CDN
   loader needs network access and a paid Mapbox token), the surface to change is legible
   instead of scattered.

---

## Current state

Direct vendor touch points in `src/js/maps/js_map3d.js` (verified by grep — these are the
only real call sites; CSS class-name string literals like `'mapboxgl-ctrl'` and JSDoc type
references like `@returns {mapboxgl.Popup}` are **not** vendor calls — see "Do not change"):

| Line(s)   | What |
|-----------|------|
| 648       | `new window.mapboxgl.Popup({ closeOnClick: true })` in `fn_showInfoWindow` |
| 714–749   | `fn_loadMapboxSdk()` — injects `<link>`/`<script>` tags pointing at `https://api.mapbox.com/mapbox-gl-js/v3.27.0/mapbox-gl.css` and `.../v3.27.0/mapbox-gl.js`; returns `window.mapboxgl` |
| 763–766   | `fn_initMap`: `const mapboxgl = await this.fn_loadMapboxSdk(); mapboxgl.accessToken = token; this.m_map = new mapboxgl.Map({...})` |
| 1010–1011 | style-refresh path: `if (window.mapboxgl && token) { window.mapboxgl.accessToken = token; }` |
| 1572      | `new window.mapboxgl.Marker({...})` — unit marker, in `fn_syncUnit` |
| 1958      | `new window.mapboxgl.Marker({...})` — ADS-B aircraft marker |
| 2996      | `new window.mapboxgl.Marker({...})` — mission waypoint marker, in `fn_createMissionWaypointMarker` |
| 3244      | `if (!this.m_map || !window.mapboxgl || ...)` guard in `fn_ensureBoundsVisible` |
| 3258      | `new window.mapboxgl.LngLatBounds()` — same function |

Everything else — `this.m_map.addControl(...)`, `marker.setLngLat(...)`,
`.addTo(this.m_map)`, `.setAltitude(...)`, `.fitBounds(...)`, `.getBounds()`,
`.once('idle', ...)`, and the three custom Mapbox-`IControl`-shaped classes
(`TerrainExaggerationControl`, `ModelSizeControl`, `ChaseCamControl`) — are **method calls
on already-constructed vendor objects**, not construction sites. Leave every one of those
exactly where it is; see "Do not change" below.

---

## Target state

A new sibling module, `src/js/maps/js_mapboxVendor.js`, exporting plain functions — no
class, no state beyond the version constant:

```js
// src/js/maps/js_mapboxVendor.js
const MAPBOX_SDK_VERSION = 'v3.27.0';

export async function fn_loadMapboxSdk() { /* moved verbatim from js_map3d.js:714-749,
                                               URLs built from MAPBOX_SDK_VERSION */ }
export function fn_getMapboxGl() { return window.mapboxgl || null; }
export function fn_setAccessToken(token) { if (window.mapboxgl) window.mapboxgl.accessToken = token; }
export function fn_createMap(options) { return new window.mapboxgl.Map(options); }
export function fn_createMarker(options) { return new window.mapboxgl.Marker(options); }
export function fn_createPopup(options) { return new window.mapboxgl.Popup(options); }
export function fn_createLngLatBounds() { return new window.mapboxgl.LngLatBounds(); }
```

`js_map3d.js` imports it (`import * as js_mapboxVendor from './js_mapboxVendor.js';`) and
every row in the table above becomes a call into this module instead of a direct
`window.mapboxgl` / `mapboxgl` reference. `CAndruavMap3D`'s own `fn_loadMapboxSdk` method
is deleted — it has exactly one caller (itself, at line 763); confirm with
`grep -rn "fn_loadMapboxSdk" src/` before deleting, in case something changed since this
task was written.

---

## Steps

1. Create `src/js/maps/js_mapboxVendor.js` with the seven exports shown above. Move the
   CDN-loading logic from `fn_loadMapboxSdk` (lines 714–749) into it verbatim, replacing
   the two hardcoded `v3.27.0` strings with the one `MAPBOX_SDK_VERSION` constant. Commit.
2. In `js_map3d.js`, add `import * as js_mapboxVendor from './js_mapboxVendor.js';` next to
   the other imports at the top of the file. Delete the `fn_loadMapboxSdk` method
   definition; replace its one call site (line 763) with
   `await js_mapboxVendor.fn_loadMapboxSdk();`. Commit.
3. In `fn_initMap`, replace
   `mapboxgl.accessToken = token; this.m_map = new mapboxgl.Map({...})` with
   `js_mapboxVendor.fn_setAccessToken(token); this.m_map = js_mapboxVendor.fn_createMap({...});`
   — same options object, unchanged. Commit.
4. Replace the style-refresh guard at lines 1010–1011
   (`if (window.mapboxgl && token) { window.mapboxgl.accessToken = token; }`) with
   `if (js_mapboxVendor.fn_getMapboxGl() && token) { js_mapboxVendor.fn_setAccessToken(token); }`.
   Commit.
5. Replace the three `new window.mapboxgl.Marker({...})` call sites (lines 1572, 1958,
   2996) with `js_mapboxVendor.fn_createMarker({...})` — same options object each time,
   unchanged. Commit.
6. Replace `new window.mapboxgl.Popup({ closeOnClick: true })` (line 648) with
   `js_mapboxVendor.fn_createPopup({ closeOnClick: true })`. Commit.
7. In `fn_ensureBoundsVisible`, replace the `!window.mapboxgl` guard (line 3244) with
   `!js_mapboxVendor.fn_getMapboxGl()`, and `new window.mapboxgl.LngLatBounds()` (line 3258)
   with `js_mapboxVendor.fn_createLngLatBounds()`. Commit.
8. Sweep: `grep -n "window\.mapboxgl\|new mapboxgl\." src/js/maps/js_map3d.js` must return
   nothing. Fix anything left over. Commit.

---

## Do not change

- Any `'mapboxgl-ctrl ...'` / `'mapboxgl-popup-content'` CSS class-name string literals
  (around lines 35, 94, 386, 701, 708) — these are DOM class names Mapbox's own stylesheet
  targets, not vendor object construction. Leave them exactly as they are.
- JSDoc `@returns {mapboxgl.Popup}` / `{mapboxgl.Marker}` type comments — cosmetic,
  harmless, out of scope.
- `this.m_map.addControl(...)`, `.fitBounds(...)`, `.getBounds()`, `.once('idle', ...)`,
  and every other method called *on* an already-constructed `Map`/`Marker`/`Popup`
  instance. Only the `new mapboxgl.X(...)` construction calls and the `window.mapboxgl`
  global-access points move — not the whole vendor API surface. Do **not** invent a
  generic `MapAdapter`/engine-agnostic interface, do not touch `TerrainExaggerationControl`
  / `ModelSizeControl` / `ChaseCamControl`, and do not touch `js_leafletmap.js`. All of
  that is explicitly out of scope for this task — scope creep here defeats the point,
  which is a small, low-risk, mechanically-verifiable change.
- The external `fn_*` methods other code depends on (`js_main.js`, the layout control in
  `jsc_ctrl_layoutControl.jsx`, `ClssMapSettings.jsx`) — their names and signatures are
  untouched. This is a purely internal refactor of `js_map3d.js`.
- `CONST_MAPBOX_STYLE` / `CONST_MAPBOX_3D_ACCESS_TOKEN` in `js_siteConfig.js` — not part of
  this task.

---

## Acceptance

```bash
# every direct vendor-global touch point is gone from js_map3d.js
grep -n "window\.mapboxgl" src/js/maps/js_map3d.js      # -> zero lines
grep -n "new mapboxgl\."   src/js/maps/js_map3d.js      # -> zero lines

# and now lives in exactly one place
grep -c "window.mapboxgl" src/js/maps/js_mapboxVendor.js   # -> >= 5

# the SDK version exists once, not twice
grep -c "v3.27.0" src/js/maps/js_mapboxVendor.js   # -> 1
grep -c "v3.27.0" src/js/maps/js_map3d.js          # -> 0

# js_map3d now imports the vendor module
grep -c "js_mapboxVendor" src/js/maps/js_map3d.js  # -> >= 1

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/    # -> must not increase from baseline
```

**Manual acceptance.** With the app running and a valid `CONST_MAPBOX_3D_ACCESS_TOKEN`
configured:

1. Open the 3D map. It must load exactly as before — terrain, 3D buildings, unit models.
2. Move a unit / let live telemetry update. The 3D marker/model must still track it.
3. Open a unit popup and a mission waypoint marker. Both must render identically to before
   the refactor.
4. Load a mission whose waypoints sit outside the current view — the camera must still
   auto-fit to it (exercises `fn_ensureBoundsVisible`, the `LngLatBounds` call site).
5. Switch the Mapbox basemap style in Settings — the map must reload with the new style and
   the access token must still be applied (exercises the line 1010–1011 path).
