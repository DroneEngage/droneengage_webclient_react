# TASK-05 — One React root; portals for map popups

**Depends on:** nothing. Fully independent — good work to run in parallel with TASK-01.
**Size:** small-medium (~2-3 days). **Risk:** low.

## Goal

There are four React roots in this application. Three of them exist to use React as a string
template engine. Collapse them into one and render map popups with `createPortal`, which
makes popup content interactive and restores i18n and theming inside popups.

---

## Current state

`src/index.js:121` creates the real root. `src/js/js_main.js` creates three more, at lines
**2262**, **2301** and **2343**, in near-identical functions:

- `fn_generateContextMenuHTML(v_lat, v_lng)` -> `<ClssMainContextMenu>`
- `fn_generateContextMenuHTML_MissionItem(v_lat, v_lng, p_wayPointStep, p_andruavUnit)` -> `<ClssWaypointStepContextMenu>`
- `fn_generateContextMenuHTML_MainUnitPopup(v_lat, v_lng, v_andruavUnit, v_ignore)` -> `<ClssMainUnitPopup>`

Each does this:

```js
const tempContainer = document.createElement('div');
const root = ReactDOM.createRoot(tempContainer);
root.render(
  <ClssMainContextMenu p_lat={v_lat} p_lng={v_lng} OnComplete={() => {
      const htmlContent = tempContainer.innerHTML;
      // REACT POPUP LIMITATION: This creates static HTML content
      // Interactive React elements (links, buttons, events) will not work
      info_unit_context_popup = mapAdapter.fn_showInfoWindow(null, htmlContent, v_lat, v_lng);
      info_unit_context_popup = mapAdapter.fn_bindPopup(info_unit_context_popup, tempContainer, v_lat, v_lng);
      info_unit_context_popup.on('remove', () => { info_unit_context_popup = null; tempContainer.remove(); });
      v_context_busy = false;
  }} />
);
```

Four problems, all consequences of the extra root:

1. The component is rendered, then **serialised to `innerHTML`** and handed to Leaflet as a
   static string. The code's own comment says interactive elements will not work.
2. It then *also* binds the live container, so there are two competing mechanisms and a
   `v_context_busy` flag guarding the race between them.
3. These roots are outside `<I18nextProvider>` and `<ThemeProvider>` (see `src/index.js:122-128`),
   so **map popups get no translations and no theme**.
4. There is a `v_context_busy` module-level flag because concurrent popup creation would
   otherwise corrupt shared state.

Map adapter API, already present and identical in shape on both adapters:

```
js_leafletmap.js:1166  fn_showInfoWindow(p_infoWindow, p_content, p_lat, p_lng)
js_leafletmap.js:1177  fn_bindPopup(p_infoWindow, p_content, p_lat, p_lng)
js_leafletmap.js:1186  fn_hideInfoWindow(p_infoWindow)
js_map3d.js:633/674/693  same three, plus an optional p_alt
```

Note `js_main.js` picks the adapter by querying the DOM:
`const mapAdapter = ($('#div_map3d_view').is(':visible') === true) ? js_map3d : js_leafletmap;`
Leave that alone in this task — it is TASK-08's problem.

---

## Target state

A single `<MapPopupHost />` mounted inside the existing provider tree, driven by a small
store, rendering the active popup through `createPortal` into the DOM node the map adapter
gives back.

```jsx
// src/components/popups/MapPopupHost.jsx
export default function MapPopupHost() {
  const popup = useMapPopup();               // { kind, props, containerEl } | null
  if (!popup) return null;
  return createPortal(
    <MapPopupContent kind={popup.kind} {...popup.props} />,
    popup.containerEl
  );
}
```

```js
// src/js/services/map/mapPopupService.js
fn_openPopup(p_kind, p_props, p_lat, p_lng)   // asks the adapter for an empty popup,
                                              // stores its content element, notifies the host
fn_closePopup()
```

The flow inverts: instead of *render to string then give to Leaflet*, it becomes *ask Leaflet
for an empty popup, then portal React into its content node*. The component tree stays
connected, so context, event handlers and i18n all work normally.

`kind` is one of `'context-menu' | 'mission-item' | 'unit-popup'`, mapping to the three
existing components — which are small and need no changes:

```
src/components/popups/jsc_main_context_menu.jsx           160 lines
src/components/popups/jsc_main_unit_popup.jsx             148 lines
src/components/popups/jsc_waypoint_step_content_menu.jsx   83 lines
```

---

## Steps

1. Add `fn_getPopupContentElement(p_infoWindow)` to **both** map adapters, returning the DOM
   node React should portal into. For Leaflet that is the popup's content container; for
   Mapbox it is the marker/popup element. Keep the signatures parallel — the calling code
   must not care which adapter it has. Commit.
2. Add `mapPopupService.js` and the `useMapPopup()` hook. Commit.
3. Add `<MapPopupHost />` to `src/pages/home.js` inside the existing tree, and to
   `src/pages/planning.js` and `src/pages/mobile.js` if they open map popups (check first).
   Commit.
4. Migrate one popup at a time, deleting each `createRoot` call as it goes:
   `fn_generateContextMenuHTML` -> `fn_generateContextMenuHTML_MissionItem` ->
   `fn_generateContextMenuHTML_MainUnitPopup`. Commit each.
5. Delete the `v_context_busy` flag and the `info_unit_context_popup` module-level variable —
   both exist only to coordinate the old mechanism. Popup state now lives in the service.
   Commit.
6. Update the two **stale comments** that describe the mechanism you just deleted:
   `src/css/css_mobile.css:1163` and `src/components/popups/jsc_main_context_menu.jsx:42`
   both document the `createRoot() + tempContainer` approach. Rewrite them to describe the
   portal. Leaving them is worse than no comment. Commit.
7. Remove the `import ReactDOM from "react-dom/client"` and the three popup component imports
   from `js_main.js`. This also removes three of the 13 dependency cycles
   (`js_main -> jsc_main_context_menu`, `-> jsc_main_unit_popup`,
   `-> jsc_waypoint_step_content_menu`). Commit.

---

## Do not change

- The three popup components' markup or props, beyond dropping the now-unnecessary
  `OnComplete` callback. The `OnComplete` plumbing existed only to signal "you may now read
  my innerHTML" and has no meaning once portals are used.
- The map adapters' existing `fn_showInfoWindow` / `fn_bindPopup` / `fn_hideInfoWindow`
  signatures — other callers use them (ADSB popups, geofence info, home-point info in
  `js_main.js`). Add the new method, don't reshape the old ones.
- The mouse-over/mouse-out popup timing logic in `EVT_msgFromUnit_GPS` (the 200 ms
  `clickTimer`). Behaviour must be identical.
- ADSB popups (`fn_buildAdsbPopupHtml`, `js_main.js:1358`) — those build real HTML strings
  and are not React. Out of scope; note as a follow-up.

## Acceptance

```bash
# exactly one React root in the codebase.
# NOTE: before the change this returns 5 lines - 3 real calls in js_main.js plus 2 stale
# comments (src/css/css_mobile.css:1163, src/components/popups/jsc_main_context_menu.jsx:42).
# Step 6 rewrites those comments, so afterwards this must be zero.
grep -rn "createRoot" src/ | grep -v "^src/index.js"     # -> zero lines

# the innerHTML round-trip is gone
grep -rn "tempContainer" src/js/js_main.js                # -> zero lines
grep -rn "v_context_busy" src/                            # -> zero lines

# popups now portal
grep -c "createPortal" src/components/popups/MapPopupHost.jsx   # -> >= 1

# js_main no longer imports the popup components (was 3 imports on lines 39-41;
# line 206 is a prose comment reference and may stay)
grep -cE "^import .*(jsc_main_context_menu|jsc_main_unit_popup|jsc_waypoint_step_content_menu)" src/js/js_main.js   # -> 0

npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/    # -> at most 10 cycles (3 removed)
```

**Manual acceptance — this is the point of the task.** With the app running:
1. Right-click the map to open the context menu. **Click a button inside it.** It must work.
   (Today it does not — that is the "REACT POPUP LIMITATION" comment.)
2. Switch language to Arabic. Open a map popup. **Its text must be translated and RTL.**
   (Today it is not.)
3. Switch to a dark theme. Open a map popup. **It must be themed.**
4. Open a unit popup, then a mission-item popup, then a context menu in quick succession —
   no stuck popups, no `v_context_busy` deadlock.
5. Repeat 1-4 on the 3D map.
