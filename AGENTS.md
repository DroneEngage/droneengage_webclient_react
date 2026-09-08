# AGENTS.md — droneengage_webclient_react

Browser-based GCS for DroneEngage/Andruav. React 19 + Bootstrap 5 + Leaflet,
built with `react-scripts` (CRA) + a custom `webpack.config.js` override.

## Build / lint / typecheck

    npm run build       # production build (react-scripts build --config-overrides ./webpack.config.js)
    npm run lint        # eslint src
    npm run typecheck   # tsc --noEmit (checks src/js/core/**/* only)
    npm start           # dev server (HTTPS, openssl-legacy-provider)

The build emits warnings from pre-existing code; treat only **errors** as
failures. ESLint config is in `package.json` (`eslintConfig`).

`npm run typecheck` runs TypeScript in check-only mode (`tsc --noEmit`)
scoped to `src/js/core/**/*` by `tsconfig.json` (TASK-06). It does NOT
type-check plain `.js` files (`checkJs: false`) and does NOT add a build
step — CRA/babel still compiles `.ts` files for the bundle. Run it
alongside `npm run lint` in any CI that lints.

`tsconfig.json` pins `moduleResolution: "node"` + `ignoreDeprecations:
"6.0"`. The project pins `typescript@4.9.5` where `"node"` is the only
valid `moduleResolution` that supports `resolveJsonModule`, but newer TS
language servers (5.x, used by IDEs) deprecate `"node"` (now `"node10"`).
`ignoreDeprecations` is a no-op in 4.9.5 and silences the warning in 5.x,
so both the CLI checker and the IDE are happy.

The TASK-06 event-payload factories live in `src/js/events/eventPayloads.js`
(plain JSDoc-typed JS, NOT `.ts`) — an earlier TASK-06 step had promoted
them to `src/js/core/events/eventPayloads.ts`, but that was reverted;
the `.ts` copy is gone and the three importers
(`js_webrtcthin2.js`, `core/protocol/runtime.js`, the batching test) point
back at the original `src/js/events/` path. The `core/protocol/*.ts` and
`core/model/*.ts` files from TASK-06 are unaffected.

## ADSB abstraction layer

ADSB traffic is fetched through a provider abstraction so different backends can
be selected via config without touching consumers.

```
js_main.js  ──► js_adsbManager (singleton)  ──► AdsbProvider (abstract)
                 │                              ├─ OpenSkyProvider
                 │                              └─ AisStreamProvider
                 ▼
            js_adsbUnit (registry)  ──► CADSBObject  ──► map markers
            EE_adsbExchangeReady / EE_adsbExpiredUpdate events
```

- `src/js/adsb/js_adsbProvider.js` — abstract `AdsbProvider` base + normalized
  `AdsbAircraft` (SI units, MAVLink `ADSB_EMITTER_TYPE_*` for `emitterType`) +
  `radiusToBoundingBox()` helper. Subclasses implement `buildRequest()` and
  `parseResponse()`.
- `src/js/adsb/js_adsbProviderOpenSky.js` — OpenSky `/states/all` provider.
  Anonymous by default; OAuth2 client-credentials (auto token refresh) when
  `CONST_ADSB_CONFIG.OPENSKY.CLIENT_ID/CLIENT_SECRET` are set. Maps OpenSky
  `category` → MAVLink emitter type (`max(0, category-1)`).
- `src/js/adsb/js_adsbManager.js` — singleton owning the polling loop, provider
  selection, registry merge, and event dispatch. Entry points:
  `fn_changeDefaultLocation(lat,lng,radiusKm)`, `fn_getADSBDataForUnit(unit)`,
  `fn_reloadProvider()`, `fn_initAdsb()`, `fn_getLastError()`. Dispatches
  `EE_adsbError` (with the error message string, or null to clear) when a
  provider fetch fails/succeeds — the map toggle buttons turn red and the
  query circle switches from orange to red while the error is active.
- `src/js/js_adsbUnit.js` — `CADSBObjectList` registry + `CADSBObject`. The
  `m_*` field names are the **rendering contract** consumed by `js_main.js`
  (`fn_adsbObjectUpdate` / `fn_adsbExpiredUpdate`) — do not rename them.
  Providers feed it via `fn_mergeNormalized(AdsbAircraft[])`.

### Config (`src/js/js_siteConfig.js`)

`CONST_ADSB_CONFIG` is overridable at runtime via `/public/config.json` and
`/public/config.local.json`:

```js
CONST_ADSB_CONFIG = {
  PROVIDER: 'opensky',        // 'opensky' | 'aisstream'
  REFRESH_RATE_MS: 60000,     // poll interval (OpenSky anonymous tier is credit-limited)
  OBJECT_TIMEOUT_MS: 240000,  // aircraft expiry — absence tolerance from receive
                               // time (NOT provider last_contact); should be a
                               // multiple of REFRESH_RATE_MS so a plane survives
                               // several missed polls (default 4x)
  OPENSKY:    { URL:'', TOKEN_URL:'', CLIENT_ID:'', CLIENT_SECRET:'' },
  AISSTREAM:  { URL:'', REFRESH_RATE_MS: 5000 },
};
```

`CONST_ADSB_CONFIG` override priority (highest → lowest):
1. **localStorage** — edited from the ADSB settings tab
   (`src/components/Settings/ClssAdsbSettings.jsx`). Helpers in
   `js_localStorage.js`: `fn_getAdsbProvider`, `fn_getAdsbRefreshRateMs`,
   `fn_getAdsbOpenSkyClientId`, `fn_getAdsbOpenSkyClientSecret`. Applied
   in `fn_applyRuntimeConfig` after the config-file merge, so they win.
2. **`/public/config.local.json`** then **`/public/config.json`** — merged
   via `fn_applyRuntimeConfig`.
3. **defaults** in `js_siteConfig.js` (`CONST_ADSB_CONFIG`).

The ADSB tab edits persist to localStorage, mirror onto `CONST_ADSB_CONFIG`
in place, and call `js_adsbManager.fn_reloadProvider()` so the next poll
uses the new credentials/refresh rate without a page reload. The ADSB
enable toggle + radius slider live in this tab (moved out of
`ClssPreferences.jsx`); AISStream enable stays in Preferences.

ADSB is gated by `js_globals.v_EnableADSB` and `js_globals.CONST_DISABLE_ADSG`.

## 3D map (Mapbox GL JS)

The 3D map is `src/js/maps/js_map3d.js` (`CAndruavMap3D`), a Mapbox GL JS
v3 view with glTF vehicle models (LOD swap to flat icons below
`CONST_MAP3D_MODEL_TO_ICON_ZOOM_THRESHOLD`), terrain exaggeration,
per-unit tethers, chase-cam, ADSB rendering, and mission waypoints.
Visual constants live in `src/js/config/mapStyle.js` (frozen).

### Mapbox vendor isolation (TASK-09)

`src/js/maps/js_mapboxVendor.js` is the **single point of contact** with
the Mapbox GL JS vendor API. All `window.mapboxgl` global access and every
`new mapboxgl.X(...)` construction call site lives here, so an SDK version
bump or breaking API change is a one-file diff. The SDK version string
exists exactly once (`MAPBOX_SDK_VERSION = 'v3.27.0'`) instead of being
duplicated across the two CDN URLs. Exports: `fn_loadMapboxSdk`,
`fn_getMapboxGl`, `fn_setAccessToken`, `fn_createMap`, `fn_createMarker`,
`fn_createPopup`, `fn_createLngLatBounds`.

This is intentionally NOT a generic engine-agnostic map abstraction — it
only relocates the existing construction call sites. Method calls on
already-constructed Map/Marker/Popup instances (`addControl`, `fitBounds`,
`setLngLat`, `once('idle', ...)`, etc.) stay in `js_map3d.js`.

### Draggable guided-target marker (TASK-10)

The 3D map double-click draws a ground-draped circle + crosshair
(`fn_drawTargetMarker`) and immediately opens the context-menu popup.
The marker is now **draggable**: an invisible Mapbox `Marker` backs the
GeoJSON line layer to capture native Mapbox drag gestures. On `dragend`,
`js_main.js`'s callback fires `mapPopupService.fn_updatePopupPosition`
to reposition the open popup and patch its `p_lat`/`p_lng` props so
"Goto Here" / "Set Home" target the dragged position instead of the
original double-click point.

### Destination / swarm-target markers

`fn_syncDestinationPoint` / `fn_clearDestinationPoint` mirror the 2D
Leaflet destination markers (`EVT_DistinationPointChanged` in
`js_main.js`) on the 3D map: small drone icons at swarm-target positions,
floating at the target's altitude. In GLB mode the DOM icon is swapped
to transparent and the target is shown as a ground circle + altitude
ring pair (same pattern as the guided-target crosshair), toggled
automatically with the LOD state. `p_DestinationPoint.alt` is in
millimeters (raw MAVLink relative_alt) and is divided by 1000 to meters
above terrain at the call site.

## Map popups (React portals)

`src/js/services/map/mapPopupService.js` is the single source of truth
for map popups (context menu, mission item, unit popup) rendered via
React portals. It replaces the old detached-root + `innerHTML`
round-trip: the active map adapter (`js_leafletmap` or `js_map3d`,
selected via `js_layout.fn_getMapMode()`) provides an empty popup shell,
`fn_getPopupContentElement` returns its content DOM node, and the
`<MapPopupHost />` component (mounted inside the i18n/theme provider
tree) portals the real React component into that node. Because the
component tree stays connected, context (i18n, theme), event handlers,
and interactive elements all work normally inside popups.

The service is a subscribable singleton (notifications go through
`js_eventEmitter` as `EE_MapPopupChanged`); React reads it via the
`useMapPopup()` hook, `js_main.js` writes via `fn_openPopup` /
`fn_closePopup`. `fn_updatePopupPosition` repositions the open popup
and merges new props without closing/reopening (used by the draggable
3D target marker).

## Notes

- `js_mavlink_v2.js` is eslint-ignored (generated).
- The old `v_ADSB_Exchange`/`v_adsbObject` jQuery implementation and the
  `AdsbExchangeProvider` (VirtualRadar endpoint) have been removed; OpenSky
  is the active aircraft provider.
- The `tasks/` directory holds the structural-refactor task specs
  (TASK-01 … TASK-11) and `README.md` with their dependency order and the
  rules that apply to every task (behaviour-preserving, `fn_`/`m_`/`p_`
  naming, never edit `js_mavlink_v2.js`, don't touch the build, don't
  rename rendering-contract fields, safety-critical events stay
  immediate, leave the tree green, commit per step). `MapPlan.md` holds
  a 3D-map gap analysis vs. QGC/DJI/Auterion/UgCS.
