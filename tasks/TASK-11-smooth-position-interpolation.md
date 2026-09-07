# TASK-11 — Smooth (interpolated) unit & ADS-B movement, with a raw-accuracy toggle

**Depends on:** TASK-09 (already landed — `js_mapboxVendor.js` exists and `fn_syncUnit`/
`fn_syncAdsbObject` already construct markers through it). Independent of TASK-10 (already
landed — touches a different region of `js_map3d.js`, the target-marker code, no overlap).
**Size:** medium (~2-3 days, mostly careful unit-conversion and edge-case work, not volume).
**Risk:** medium — a wrong yaw unit conversion is a classic "icon spins 57x too far" bug;
follow the degrees/radians annotations below exactly.

## Goal

Both maps currently snap each unit/ADS-B marker straight to its latest raw telemetry
position on every tick — no interpolation. At typical update rates (1–10Hz for units, often
sparser and jitterier for ADS-B) this reads as visible jumps rather than motion. Add a
shared, engine-agnostic interpolation layer that both the Leaflet (2D) and Mapbox (3D)
adapters render through, plus a user-facing toggle to disable it when raw, undelayed
positions matter more than smoothness (e.g. precision inspection of exact telemetry).

**Interpolation only, not extrapolation.** Always animate between two *known* samples,
never guess ahead from velocity. This means displayed motion lags the real position by at
most one inter-tick interval — imperceptible for display purposes, and it can never produce
the correction/snap-back artifact extrapolation would when a vehicle turns or stops between
samples.

---

## Current state

Both adapters are driven from exactly two choke points in `src/js/js_main.js`, each of
which currently updates **both** maps back-to-back with the same raw values on every tick:

**Units** — `EVT_msgFromUnit_GPS(me, p_andruavUnit)` (~line 2653). The tail of this function
(~lines 2779–2781):
```js
js_leafletmap.fn_setPosition_bylatlng(layers.m_marker, p_andruavUnit.m_Nav_Info.p_Location.lat, p_andruavUnit.m_Nav_Info.p_Location.lng, p_andruavUnit.m_Nav_Info.p_Orientation.yaw);
fn_refreshWindArrowPosition();
const marker3d = js_map3d.fn_syncUnit(p_andruavUnit, v_image);
```
`p_andruavUnit.m_Nav_Info.p_Orientation.yaw` is in **radians**. `js_map3d.fn_syncUnit`
(`js_map3d.js:1519`) reads position straight off `unit.m_Nav_Info.p_Location` itself
(`const { lat, lng } = unit.m_Nav_Info.p_Location;`, line ~1529) and separately converts yaw
to degrees internally (~line 1601-1605: `const deg = (yaw * 180/Math.PI) % 360; normalizedYaw = (deg+360)%360;`).
Everything downstream of that top-of-function `lat`/`lng`/`normalizedYaw` — marker
positioning, `fn_syncTether(id, color, lat, lng, altRelative)`,
`fn_syncUnitModel(unit, id, lat, lng, altRelative, normalizedYaw)`, and the follow-camera
block (~line 1638) — already takes those as plain values, not re-reading `unit.m_Nav_Info`
a second time. That matters: it means once the top of `fn_syncUnit` accepts overridable
lat/lng/yaw, every downstream consumer (tether, model, follow-cam) automatically tracks the
override too, for free.

**ADS-B** — `fn_renderSingleAdsb(p_adsbObject)` (~line 1115), tail (~lines 1154–1159):
```js
js_leafletmap.fn_setPosition_bylatlng(p_adsbObject.p_marker, p_adsbObject.m_lat, p_adsbObject.m_lon, p_adsbObject.m_heading);
js_leafletmap.fn_showItem(p_adsbObject.p_marker);
js_map3d.fn_syncAdsbObject(p_adsbObject, icon, fn_onAdsbMap3dMarkerClick);
```
`p_adsbObject.m_heading` is also **radians** (see the comment at `js_map3d.js:1917`,
"Heading is stored in radians"). `js_map3d.fn_syncAdsbObject` (`js_map3d.js:1897`) reads
`p_adsbObject.m_lat` / `.m_lon` / `.m_heading` directly (lines 1908-1909, 1921) and converts
heading to degrees internally the same way.

**`js_leafletmap.fn_setPosition_bylatlng(p_marker, p_lat, p_lng, p_yaw)`**
(`js_leafletmap.js:977`) already takes explicit lat/lng/yaw arguments — it needs **no
changes at all**. `p_yaw` must be **radians** (it does `p_yaw * 180 / Math.PI` internally).

ADS-B marker teardown already exists: `js_map3d.fn_removeAdsbMarker(p_adsbObject)`, called
from `js_main.js:870` and `:901` when an aircraft ages out. There is no equivalent
"remove unit" call site in `js_map3d.js` — units are long-lived per session (small,
bounded count), so unbounded growth risk from not explicitly cleaning up unit entries is
low; ADS-B (many aircraft, high churn) is the case that actually matters for cleanup.

Preference-toggle plumbing to copy exactly (all in `src/components/Settings/ClssPreferences.jsx`
and `src/js/js_localStorage.js`, using the Wind-enabled toggle as the template):

- `src/js/storage/localstorage_keys.js:27`: `export const LS_ENABLE_WIND = '_vWindEnabled';`
- `src/js/js_localStorage.js:287-296`: `fn_setWindEnabled(value)` / `fn_getWindEnabled()`
  pair, `_setValue`/`_getValue` wrapping the raw key, default `'false'`.
- `ClssPreferences.jsx:97-101`: `fn_enableWind(e)` — reads `e.currentTarget.checked`, calls
  `js_localStorage.fn_setWindEnabled(enabled)`, dispatches
  `js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged)`.
- `ClssPreferences.jsx:214-228`: the checkbox JSX itself (label + input, `defaultChecked`,
  `onClick`).
- i18n label lives in `src/locales/en/jsc_global_settings.json` under the `globalSettings`
  namespace (key `enableWindLabel`), consumed via `t('globalSettings:enableWindLabel')`.
  Sibling locale files exist for `fr`, `ru`, `ar`, `es`.

---

## Target state

**New file: `src/js/services/motion/positionSmoother.js`** — framework-free (no Mapbox/
Leaflet/React imports), a single shared `requestAnimationFrame` loop, one entry per tracked
entity. Mirrors `mapPopupService.js`'s style: plain exported `fn_*` functions plus a bundled
export object.

Public API:

```js
/**
 * @param {string} id           - caller-namespaced key, e.g. 'unit:'+partyID or 'adsb:'+icao
 * @param {number} lat
 * @param {number} lng
 * @param {number} yawDeg       - degrees, 0-360 (caller converts from radians first)
 * @param {(lat:number, lng:number, yawDeg:number) => void} renderFn
 *   Called at least once synchronously within this call (so a brand-new entity appears
 *   immediately, never waits a frame). If smoothing is enabled and a prior sample exists
 *   for this id, called again on every animation frame until the interpolation finishes,
 *   with a final call carrying the exact target values.
 */
export function fn_pushSample(id, lat, lng, yawDeg, renderFn) { ... }

/** Drops internal state for id. Call on entity teardown (see fn_removeAdsbMarker call sites). */
export function fn_removeEntity(id) { ... }

/** Enables/disables smoothing globally. Disabling snaps every in-flight entity straight to
 *  its most recent target (via its stored renderFn) so nothing is left half-interpolated. */
export function fn_setEnabled(enabled) { ... }

export function fn_isEnabled() { ... }

export const positionSmoother = { fn_pushSample, fn_removeEntity, fn_setEnabled, fn_isEnabled };
```

Internal per-entity state: `{ fromLat, fromLng, fromYaw, toLat, toLng, toYaw, tStart, tEnd, renderFn }`.

`fn_pushSample` behavior:
- If `fn_isEnabled()` is false, or this `id` has no prior state (first-ever sample — nothing
  to interpolate from): call `renderFn(lat, lng, yawDeg)` **immediately and synchronously**,
  store `{ lastLat: lat, lastLng: lng, lastYaw: yawDeg, renderFn }` as idle state (no active
  animation), and return.
- Otherwise: compute `dt = now - <time of last sample for this id>`, clamp it to a sane
  window (suggested: `duration = Math.min(Math.max(dt, 150), 800)` ms — a floor so even
  back-to-back ticks get *some* animation, a ceiling so a long stall doesn't leave the
  marker crawling for a second or more). Compute `from` by evaluating the *currently
  in-flight* interpolation at `now` (not just reusing the previous `to` verbatim) so a new
  sample arriving mid-animation doesn't cause a discontinuity. Set `to = {lat, lng, yawDeg}`,
  `tStart = now`, `tEnd = now + duration`, update `renderFn` (a fresh closure may be passed
  each call — cheap to just overwrite the reference), and ensure the shared rAF loop is
  running (start it lazily on first active entity).

Shared rAF loop (module-level, one `requestAnimationFrame` chain for all entities, not one
per marker):
- Each frame, for every entity with `now < tEnd`: `t = clamp((now - tStart)/(tEnd - tStart), 0, 1)`;
  linear-lerp `lat`/`lng`; interpolate yaw via **shortest-path** angle interpolation (handle
  the ±180° wrap — naive linear lerp on raw degrees breaks near due north); call
  `entity.renderFn(lat, lng, yaw)`.
- For entities where `now >= tEnd`: call `renderFn` once more with the exact `to` values,
  then move the entity to "idle" (drop it from the set the loop iterates, but keep its last
  values around so the next `fn_pushSample` has a `from`).
- When no entities are active, stop the rAF loop entirely (don't spin forever); the next
  `fn_pushSample` restarts it.
- **Do not interpolate altitude.** Altitude/terrain-elevation is computed once per real tick
  in `fn_syncUnit`/`fn_syncAdsbObject` today and is left exactly as-is — only lat/lng/yaw
  route through the smoother. ADS-B's altitude path in particular runs a terrain-elevation
  query (`fn_getRawTerrainElevation`, flagged elsewhere in this file as measured to be
  expensive) — running that at animation-frame rate per aircraft would reintroduce the exact
  perf problem this codebase has already fought (see the comments at `js_map3d.js:1898-1905`).
  Horizontal movement between consecutive ticks is small enough that reusing the one
  terrain-elevation sample for the whole interpolation window is visually indistinguishable.

At module load, initialize the enabled flag from `js_localStorage.fn_getSmoothMovementEnabled()`
and subscribe to `EE_onPreferenceChanged` to re-read it live (no reload needed) — mirrors how
other per-feature toggles in this codebase are consumed.

---

## Steps

1. Add `LS_ENABLE_SMOOTH_MOVEMENT` to `src/js/storage/localstorage_keys.js` (same pattern as
   `LS_ENABLE_WIND`), and `fn_setSmoothMovementEnabled(value)` / `fn_getSmoothMovementEnabled()`
   to `js_localStorage.js`, **default `'true'`** (this is a quality-of-life default-on
   feature, unlike Wind which defaults off). Commit.
2. Create `src/js/services/motion/positionSmoother.js` per the "Target state" section above.
   No Mapbox/Leaflet/React imports — only `js_eventEmitter`, `js_eventList`, `js_localStorage`.
   Commit.
3. In `js_map3d.js`, change `fn_syncUnit(unit, markerIconUrl = null)` to
   `fn_syncUnit(unit, markerIconUrl = null, p_overrideLat, p_overrideLng, p_overrideYawDeg)`.
   Replace the top-of-function position read with:
   ```js
   const lat = Number.isFinite(p_overrideLat) ? p_overrideLat : unit.m_Nav_Info.p_Location.lat;
   const lng = Number.isFinite(p_overrideLng) ? p_overrideLng : unit.m_Nav_Info.p_Location.lng;
   ```
   and the yaw block (~line 1601) to use `p_overrideYawDeg` directly (already degrees, skip
   the radians conversion) when finite, falling back to the existing
   `unit.m_Nav_Info.p_Orientation.yaw` radians→degrees conversion otherwise. Leave every
   other line of the function untouched — tether/model/follow-cam already consume the local
   `lat`/`lng`/`normalizedYaw` consts, so they inherit the override automatically. Commit.
4. Do the same for `fn_syncAdsbObject(p_adsbObject, markerIconUrl, onClickCallback)` →
   `fn_syncAdsbObject(p_adsbObject, markerIconUrl, onClickCallback, p_overrideLat, p_overrideLng, p_overrideHeadingDeg)`,
   overriding the `lat`/`lng` read (line ~1908) and the `headingDeg` computation (line ~1921)
   the same way. Commit.
5. In `js_main.js`, import the service: `import { positionSmoother } from './services/motion/positionSmoother.js'`.
   Replace the unit tail (~lines 2779-2781):
   ```js
   positionSmoother.fn_pushSample(
       'unit:' + p_andruavUnit.getPartyID(),
       p_andruavUnit.m_Nav_Info.p_Location.lat,
       p_andruavUnit.m_Nav_Info.p_Location.lng,
       (p_andruavUnit.m_Nav_Info.p_Orientation.yaw * 180 / Math.PI + 360) % 360,
       (iLat, iLng, iYawDeg) => {
           js_leafletmap.fn_setPosition_bylatlng(layers.m_marker, iLat, iLng, iYawDeg * Math.PI / 180);
           js_map3d.fn_syncUnit(p_andruavUnit, v_image, iLat, iLng, iYawDeg);
       }
   );
   fn_refreshWindArrowPosition();
   ```
   Note the deliberate unit conversions: source yaw is radians → convert to degrees once
   when pushing in; convert back to radians only for the Leaflet call, since
   `fn_setPosition_bylatlng` requires radians. Commit.
6. In `js_main.js`, replace the ADS-B tail (~lines 1154-1159) the same way:
   ```js
   positionSmoother.fn_pushSample(
       'adsb:' + p_adsbObject.m_icao_address,
       p_adsbObject.m_lat,
       p_adsbObject.m_lon,
       (p_adsbObject.m_heading * 180 / Math.PI + 360) % 360,
       (iLat, iLng, iHeadingDeg) => {
           js_leafletmap.fn_setPosition_bylatlng(p_adsbObject.p_marker, iLat, iLng, iHeadingDeg * Math.PI / 180);
           js_leafletmap.fn_showItem(p_adsbObject.p_marker);
           js_map3d.fn_syncAdsbObject(p_adsbObject, icon, fn_onAdsbMap3dMarkerClick, iLat, iLng, iHeadingDeg);
       }
   );
   ```
   Commit.
7. Wire cleanup: at `js_main.js:870` and `:901`, alongside the existing
   `js_map3d.fn_removeAdsbMarker(adsb_obj)` calls, add
   `positionSmoother.fn_removeEntity('adsb:' + adsb_obj.m_icao_address)`. Commit.
8. Add the settings toggle to `ClssPreferences.jsx`, copying the Wind checkbox block
   (lines ~214-228) verbatim in structure: new `fn_enableSmoothMovement(e)` method calling
   `js_localStorage.fn_setSmoothMovementEnabled(e.currentTarget.checked)` then dispatching
   `EE_onPreferenceChanged`; a new checkbox row with `defaultChecked={js_localStorage.fn_getSmoothMovementEnabled()}`.
   No feature flag gate needed (unlike Wind/AISStream, this isn't behind a
   `CONST_FEATURE.DISABLE_*` site flag) — always show it. Commit.
9. Add `"enableSmoothMovementLabel"` to `src/locales/en/jsc_global_settings.json` (e.g.
   `"Smooth movement"`). Add the same key (English text is an acceptable placeholder) to the
   `fr`/`ru`/`ar`/`es` sibling files so `i18next` never falls back to a raw key — flag in
   commit message that real translations are a follow-up. Commit.

---

## Do not change

- `js_leafletmap.js` — no changes needed anywhere in this file; `fn_setPosition_bylatlng`
  already accepts explicit lat/lng/yaw.
- Altitude handling in `fn_syncUnit` / `fn_syncAdsbObject` / `fn_syncAdsbModel` — left
  exactly as today, driven by the real per-tick value, not interpolated. See the "Do not
  interpolate altitude" note above; this is deliberate, not an oversight to fix.
- The follow-camera's `easeTo(...)` call inside `fn_syncUnit` (~line 1655) — leave its
  duration/logic untouched. It will now fire on every interpolation frame instead of once
  per raw tick while a followed unit is moving; Mapbox's `easeTo` retargets cleanly when
  called again before a prior easing finishes, so this should just make the chase-cam
  smoother for free. **Verify this empirically in manual testing (step 5 below)** — if it
  turns out janky or CPU-heavy, the fix is throttling how often the follow-cam block
  re-triggers `easeTo` independently of the marker's own per-frame position updates, not
  reverting the interpolation itself. Flag it as a follow-up if you observe an issue; do not
  silently "fix" it by skipping frames for all consumers.
- Do not extrapolate. If a future task wants lower perceived latency, that is a deliberate,
  separate design discussion (damped dead-reckoning), not something to fold in here.
- `EVT_msgFromUnit_GPS`'s path-drawing block (lines ~2729-2777, the `oldlat`/`oldlng`
  distance-threshold logic) — unrelated to this task, uses the raw final position as today.

---

## Acceptance

```bash
grep -n "fn_getSmoothMovementEnabled\|fn_setSmoothMovementEnabled" src/js/js_localStorage.js   # -> both defined
grep -n "LS_ENABLE_SMOOTH_MOVEMENT" src/js/storage/localstorage_keys.js                        # -> defined
grep -n "positionSmoother" src/js/js_main.js                                                   # -> imported + used at both call sites
grep -n "positionSmoother.fn_removeEntity" src/js/js_main.js                                   # -> >= 1 (ADS-B teardown)
grep -n "p_overrideLat\|p_overrideLng" src/js/maps/js_map3d.js                                 # -> present in both fn_syncUnit and fn_syncAdsbObject
grep -n "enableSmoothMovementLabel" src/locales/en/jsc_global_settings.json                    # -> present

npm run lint && npm test && npm run build
```

**Manual acceptance:**

1. With a unit connected and moving (or simulated GPS ticks), watch the 2D map: the icon
   should glide between positions rather than jump, and rotate smoothly through turns
   (including a turn that crosses due north/0°/360° — confirms shortest-path yaw
   interpolation, not a spin-the-long-way-around bug).
2. Repeat on the 3D map — same smooth glide, tether line and glTF model (at close zoom)
   both track the interpolated position, not just the DOM icon.
3. Enable ADS-B with at least one aircraft visible — same smooth glide on both maps.
4. Open Settings, uncheck "Smooth movement" — motion should immediately become the old
   instant-jump behavior on both maps, for both units and ADS-B, with no stale
   half-interpolated marker left behind at the moment of toggling.
5. Re-check the box — smoothing resumes without a page reload.
6. With follow/chase-cam enabled on the 3D map and a unit moving, confirm the camera itself
   feels at least as smooth as before (per the "do not change" note — flag, don't silently
   patch, if it regresses).
7. Let an ADS-B aircraft age out and reappear — confirm no leftover interpolation state
   causes a stale glide-in from a long-gone position (exercises `fn_removeEntity`).
