# AGENTS.md — droneengage_webclient_react

Browser-based GCS for DroneEngage/Andruav. React 19 + Bootstrap 5 + Leaflet,
built with `react-scripts` (CRA) + a custom `webpack.config.js` override.

## Build / lint

    npm run build   # production build (react-scripts build --config-overrides ./webpack.config.js)
    npm run lint    # eslint src
    npm start       # dev server (HTTPS, openssl-legacy-provider)

The build emits warnings from pre-existing code; treat only **errors** as
failures. ESLint config is in `package.json` (`eslintConfig`).

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

## Notes

- `js_mavlink_v2.js` is eslint-ignored (generated).
- The old `v_ADSB_Exchange`/`v_adsbObject` jQuery implementation and the
  `AdsbExchangeProvider` (VirtualRadar endpoint) have been removed; OpenSky
  is the active aircraft provider.
