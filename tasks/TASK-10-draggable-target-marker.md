# TASK-10 — Draggable ground target marker (3D map)

**Depends on:** soft dependency on TASK-09 (mapbox vendor isolation). If
`src/js/maps/js_mapboxVendor.js` already exists when this task runs, construct the new
Marker in step 1 via `js_mapboxVendor.fn_createMarker(...)`; if it does not exist yet, use
`new window.mapboxgl.Marker(...)` directly (matching the file's current style) — do not
block on TASK-09 landing first.
**Size:** small (~1 day). **Risk:** low-medium (touches drag-gesture UX; test by hand).

## Goal

On the 3D map, double-clicking already drops a ground-draped circle-with-crosshair marker
(`fn_drawTargetMarker`) and opens a popup with per-unit "Goto Here" / "Set Home" / "Open Geo
Fence Here" actions. Two things are missing:

1. The marker is a static GeoJSON line layer — it cannot be dragged.
2. Even if it could be dragged, the popup's actions use `p_lat`/`p_lng` **frozen at the
   original double-click**, so repositioning the pin would not change where "Goto Here"
   actually sends the vehicle.

Make the marker draggable, and make the popup track its live position so the send-command
actions use wherever the user actually leaves the pin.

This is **3D-map only**. The 2D Leaflet map's double-click (`js_leafletmap.js:681`) opens
the same popup component but never draws a ground marker at all — there is nothing to make
draggable there, and adding one is out of scope for this task.

---

## Current state

**`src/js/maps/js_map3d.js`**
- `fn_drawTargetMarker(lat, lng)` (~line 3487): clears any previous marker, builds a
  GeoJSON `FeatureCollection` (a circle ring + N-S/E-W crosshair segments computed inline)
  and adds it as a `line` layer/source, `TARGET_MARKER_SOURCE` / `TARGET_MARKER_LAYER`
  (static fields, ~line 3475). No elevation is set on the layer, so it drapes flat on
  terrain automatically — this is deliberate (see the comment at line 3470) and must be
  preserved.
- `fn_clearTargetMarker()` (~line 3538): removes that layer/source. No draggable object
  exists yet, so there is nothing else to clean up.

**`src/js/js_main.js`**
- `fn_onMap3dDblClick(p_lat, p_lng)` (~line 585): calls
  `js_map3d.fn_drawTargetMarker(p_lat, p_lng)` then `fn_generateContextMenuHTML(p_lat, p_lng)`.
- `fn_generateContextMenuHTML(v_lat, v_lng)` (~line 2037): calls
  `mapPopupService.fn_openPopup('context-menu', { p_lat: v_lat, p_lng: v_lng }, v_lat, v_lng)`.

**`src/js/services/map/mapPopupService.js`** (from TASK-05): holds `m_state = { kind,
props, containerEl, ignoreMouseOut }` and `m_infoWindow` (the underlying Mapbox/Leaflet
popup object), and dispatches `EE_MapPopupChanged` on every `fn_setState`. There is
currently no way to reposition an *already-open* popup or patch its props without closing
and reopening it (which would flicker and unmount/remount the portaled React content).

**`src/components/popups/jsc_main_context_menu.jsx`**: reads `this.props.p_lat` /
`this.props.p_lng` for the coordinate display, the "Goto Here" (`fn_doFlyHere`), "Set Home"
(`fn_doSetHome`), and "Open Geo Fence Here" actions. It needs **no changes** — it already
reads live props on every render; the fix is upstream, in getting fresh coordinates into
those props.

---

## Target state

1. `fn_drawTargetMarker(lat, lng, p_onDragEnd)` gains an optional third argument: a
   `(newLat, newLng) => void` callback fired once when a drag ends. It additionally creates
   a small **invisible, draggable Mapbox `Marker`** ("the handle") co-located with the
   crosshair, purely to get native drag-gesture handling — Mapbox's own drag physics, not a
   hand-rolled mousedown/mousemove/mouseup implementation.
2. While dragging, the GeoJSON crosshair/circle is repositioned every frame via
   `source.setData(...)` (cheap) — **not** by calling `fn_drawTargetMarker` again (which
   does a remove+re-add of the layer/source and would be janky at drag frame-rate).
3. On `dragend`, the callback passed into `fn_drawTargetMarker` fires with the final
   lat/lng.
4. `js_main.js` wires that callback to a new `mapPopupService.fn_updatePopupPosition(lat,
   lng, extraProps)` which repositions the open popup and merges new props into it — no
   close/reopen, so the portaled `ClssMainContextMenu` just re-renders with fresh
   `p_lat`/`p_lng` and every action (`fn_doFlyHere`, `fn_doSetHome`, the geofence link, the
   coordinate readout) automatically reflects the dragged position.
5. A CSS class gives the handle a `grab`/`grabbing` cursor so it reads as draggable — the
   visible marker stays the existing crosshair; the handle itself has no visible fill.

---

## Steps

1. In `js_map3d.js`, extract the GeoJSON `FeatureCollection` construction currently inline
   in `fn_drawTargetMarker` (the ring + crossH + crossV coordinates) into a small helper,
   e.g. `fn_buildTargetMarkerGeoJSON(lat, lng)`, returning the same `FeatureCollection`
   object `fn_drawTargetMarker` passes to `addSource`. No behavior change — pure extraction.
   Commit.
2. Add a new private method `fn_updateTargetMarkerPosition(lat, lng)`:
   ```js
   fn_updateTargetMarkerPosition(lat, lng) {
       const source = this.m_map?.getSource(CAndruavMap3D.TARGET_MARKER_SOURCE);
       if (!source) return;
       source.setData(this.fn_buildTargetMarkerGeoJSON(lat, lng));
       this.m_targetMarkerLatLng = { lat, lng };
   }
   ```
   Commit.
3. In `fn_drawTargetMarker(lat, lng, p_onDragEnd)`, after the existing `addSource`/`addLayer`
   calls, create the draggable handle:
   ```js
   this.m_targetMarkerOnDragEnd = (typeof p_onDragEnd === 'function') ? p_onDragEnd : null;
   this.m_targetMarkerLatLng = { lat, lng };

   const handleEl = document.createElement('div');
   handleEl.className = 'css_map3d_target_drag_handle';

   this.m_targetMarkerHandle = js_mapboxVendor.fn_createMarker({   // or new window.mapboxgl.Marker({...}) — see header note
       element: handleEl,
       draggable: true,
       anchor: 'center'
   }).setLngLat([lng, lat]).addTo(this.m_map);

   this.m_targetMarkerHandle.on('drag', () => {
       const ll = this.m_targetMarkerHandle.getLngLat();
       this.fn_updateTargetMarkerPosition(ll.lat, ll.lng);
   });
   this.m_targetMarkerHandle.on('dragend', () => {
       const ll = this.m_targetMarkerHandle.getLngLat();
       this.m_targetMarkerLatLng = { lat: ll.lat, lng: ll.lng };
       if (typeof this.m_targetMarkerOnDragEnd === 'function') {
           this.m_targetMarkerOnDragEnd(ll.lat, ll.lng);
       }
   });
   ```
   Do not call `marker.setAltitude(...)` on the handle — Marker altitude defaults to the
   terrain surface at that lng/lat when terrain is enabled, which is exactly what keeps it
   flush with the crosshair (see how `fn_createMissionWaypointMarker` only calls
   `setAltitude` when it needs an *offset above* ground — same default applies here).
   Commit.
4. Update `fn_clearTargetMarker()` to also remove the handle and reset the new fields:
   ```js
   if (this.m_targetMarkerHandle) {
       this.m_targetMarkerHandle.remove();
       this.m_targetMarkerHandle = null;
   }
   this.m_targetMarkerOnDragEnd = null;
   this.m_targetMarkerLatLng = null;
   ```
   (in addition to its existing `fn_removeLayerAndSource(...)` call). Commit.
5. Add to `src/css/css_map3d.css`:
   ```css
   .css_map3d_target_drag_handle {
       width: 28px;
       height: 28px;
       border-radius: 50%;
       background: transparent;
       cursor: grab;
   }
   .css_map3d_target_drag_handle:active {
       cursor: grabbing;
   }
   ```
   (Sizing/visuals are a starting point — adjust if 28px proves too small/large as a grab
   target in manual testing.) Commit.
6. In `mapPopupService.js`, add:
   ```js
   /**
    * Repositions the currently-open popup and merges new props into it,
    * without closing/reopening (avoids remounting the portaled React
    * component). Used when a map feature backing the popup — e.g. the
    * draggable 3D target marker — moves after the popup was opened.
    * No-op if no popup is open.
    */
   export function fn_updatePopupPosition(p_lat, p_lng, p_extraProps) {
       if (m_state == null || m_infoWindow == null) return;
       const adapter = fn_getAdapter();
       adapter.fn_bindPopup(m_infoWindow, null, p_lat, p_lng);
       fn_setState({
           ...m_state,
           props: { ...m_state.props, ...(p_extraProps || {}) },
       });
   }
   ```
   Add it to the exported `mapPopupService` object at the bottom of the file. Commit.
7. In `js_main.js`, change `fn_onMap3dDblClick`:
   ```js
   function fn_onMap3dDblClick(p_lat, p_lng) {
       if (js_preferences.fn_getMapEditor() === true) return;
       js_map3d.fn_drawTargetMarker(p_lat, p_lng, (v_newLat, v_newLng) => {
           mapPopupService.fn_updatePopupPosition(v_newLat, v_newLng, { p_lat: v_newLat, p_lng: v_newLng });
       });
       fn_generateContextMenuHTML(p_lat, p_lng);
   }
   ```
   Commit.

---

## Do not change

- `jsc_main_context_menu.jsx` — it should need zero edits. If the popup does not visibly
  update after a drag, the bug is in the wiring above (props not actually merged /
  `EE_MapPopupChanged` not re-dispatched), not in this component.
- The 2D Leaflet map (`js_leafletmap.js`) and its double-click handler. No ground marker
  exists there today; adding one is a separate, larger task (Leaflet's drag story goes
  through `leaflet.pm`, which is a different mechanism than a Mapbox `Marker`) and is out
  of scope here.
- Do not reposition the popup bubble on every `'drag'` frame — only the GeoJSON
  crosshair moves live; the popup (and the props consumers read) update once, on
  `'dragend'`. This is a deliberate perf/UX choice, not an oversight — a popup bubble
  jumping around on every mousemove next to the cursor the user is dragging is worse UX,
  not better.
- The terrain-draping behavior of the crosshair (no `line-z-offset` / elevation reference
  on the layer) — must stay flat on the ground exactly as today.
- `fn_doFlyHere` / `fn_doSetHome` and the guided-command sending code they call into — not
  part of this task; they already take lat/lng as plain arguments and will simply receive
  updated ones.

---

## Acceptance

```bash
grep -n "fn_updatePopupPosition" src/js/services/map/mapPopupService.js   # -> defined + exported
grep -n "fn_updatePopupPosition" src/js/js_main.js                        # -> used in fn_onMap3dDblClick
grep -n "draggable: true" src/js/maps/js_map3d.js                         # -> >= 1
grep -n "css_map3d_target_drag_handle" src/css/css_map3d.css src/js/maps/js_map3d.js  # -> both files

npm run lint && npm test && npm run build
```

**Manual acceptance** (a valid Mapbox token configured, at least one unit connected in
`GUIDED`/`AUTO` mode so "Goto Here" is visible in the popup):

1. Double-click the 3D map. The ground crosshair (circle + `+`) appears exactly at the
   clicked point; the popup opens showing that same lat/lng.
2. Hover the crosshair — the cursor becomes a grab hand.
3. Drag it — the crosshair follows the cursor smoothly and stays flush with the terrain
   (test over sloped ground, not just flat ground).
4. Release — the popup's displayed lat/lng update to the new position.
5. Click "Goto Here" — the unit is commanded to the **dragged** position, not the original
   double-click point (check the outgoing guided-goto message/network payload).
6. Double-click a new spot elsewhere on the map — the old crosshair and its (invisible)
   drag handle are both fully removed; no leftover/duplicate markers accumulate after
   repeating this a few times.
