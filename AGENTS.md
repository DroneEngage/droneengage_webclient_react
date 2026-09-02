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
  `fn_reloadProvider()`, `fn_initAdsb()`.
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
  OBJECT_TIMEOUT_MS: 13000,   // aircraft expiry
  OPENSKY:    { URL:'', TOKEN_URL:'', CLIENT_ID:'', CLIENT_SECRET:'' },
  AISSTREAM:  { URL:'', REFRESH_RATE_MS: 5000 },
};
```

ADSB is gated by `js_globals.v_EnableADSB` and `js_globals.CONST_DISABLE_ADSG`.

## Notes

- `js_mavlink_v2.js` is eslint-ignored (generated).
- The old `v_ADSB_Exchange`/`v_adsbObject` jQuery implementation and the
  `AdsbExchangeProvider` (VirtualRadar endpoint) have been removed; OpenSky
  is the active aircraft provider.
