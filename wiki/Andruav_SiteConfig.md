`js_siteConfig` contains the **site/startup configuration** for the web client.

It defines default values in code and then (optionally) overrides them from `public/config.json` at runtime.

Files:

- `src/js/js_siteConfig.js`
- `public/config.json`

---

# 1) What `js_siteConfig` is responsible for

`src/js/js_siteConfig.js` exports configuration values that are used across the web client, such as:

- Which backend/auth host/port to use (test vs prod)
- Map tile URL
- Feature flags
- Language settings
- WebRTC ICE servers
- Various header links

This layer is meant to be controlled by **deployment configuration** (`public/config.json`).

---

# 2) How `public/config.json` overrides `js_siteConfig`

At the bottom of `src/js/js_siteConfig.js`, there is a `loadConfigSync()` function that:

- Loads `/config.json` using a **synchronous** `XMLHttpRequest`
- Strips comments before parsing:
  - Removes multi-line comments `/* ... */`
  - Removes single-line comments `// ...`
- Parses the result with `JSON.parse`
- Applies overrides by updating exported `let` variables

Important notes:

- Because the load is synchronous, the config values are available immediately to modules that import `js_siteConfig`.
- If `/config.json` does not exist or fails to parse, code defaults remain in effect.
- This override mechanism is **only for `js_siteConfig`**. It does not update `js_globals`.

---

# 3) `public/config.json` keys (what they control)

Below are the keys that `loadConfigSync()` actively reads and applies.

## 3.1 Backend selection

- `CONST_TEST_MODE`
  - **Effect**: When `true`, the web client uses `CONST_TEST_MODE_IP/PORT` for the auth backend.

- `CONST_PROD_MODE_IP`, `CONST_PROD_MODE_PORT`
  - **Effect**: Auth backend host/port used when `CONST_TEST_MODE=false`.

- `CONST_TEST_MODE_IP`, `CONST_TEST_MODE_PORT`
  - **Effect**: Auth backend host/port used when `CONST_TEST_MODE=true`.

These values are used by `src/js/js_andruav_auth.js` to build the login URL.

## 3.2 Header links

- `CONST_ANDRUAV_URL_ENABLE`
  - **Effect**: show/hide Andruav download link.

- `CONST_ACCOUNT_URL_ENABLE`
  - **Effect**: show/hide account link.

## 3.3 Map

- `CONST_MAP_LEAFLET_URL`
  - **Effect**: map tiles source for Leaflet.

## 3.4 Network privacy / behavior

- `CONST_DONT_BROADCAST_TO_GCSs`
  - **Effect**: affects broadcast routing logic in `AndruavClientWS.API_sendCMD()`.

- `CONST_DONT_BROADCAST_GCS_LOCATION`
  - **Effect**: controls whether the GCS embeds/sends its location in the periodic ID message.

## 3.5 Feature flags

- `CONST_FEATURE`
  - **Effect**: enables/disables chunks of UI/features. Applied as a merge:
    - `CONST_FEATURE = { ...CONST_FEATURE, ...data.CONST_FEATURE }`

## 3.6 WebRTC

- `CONST_ICE_SERVERS`
  - **Effect**: STUN/TURN servers used by WebRTC.

## 3.7 Module versions

- `CONST_MODULE_VERSIONS`
  - **Effect**: expected module versions and URLs; merged into defaults.

## 3.8 Language

- `CONST_LANGUAGE`
  - **Effect**: enabled languages and default language; merged into defaults.

---

# 4) Where to edit in production

- During development: edit `public/config.json`.
- After build: edit `build/config.json`.

---

# 5) Related pages

- `wiki/Andruav_Configuration.md` (runtime preferences in `js_globals` / `js_localStorage`)
- `wiki/Andruav_ServerComm.md` (communication layer overview)
