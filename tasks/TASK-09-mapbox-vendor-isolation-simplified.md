## What this task is about

`js_map3d.js` calls the Mapbox GL JS vendor API (`window.mapboxgl`, `new mapboxgl.Marker(...)`,
`new mapboxgl.Popup(...)`, etc.) directly from ~9 places scattered across 3,570 lines, plus
loads the SDK from a hardcoded CDN URL. This task moves those construction call sites into
one new file, `js_mapboxVendor.js`, with no other behavior change.

## Why this is useful

A future Mapbox version bump or breaking API change becomes a one-file diff instead of a
hunt through the whole feature file. The SDK version string exists in one place instead of
two. If offline/self-hosted deployment ever requires evaluating MapLibre GL instead of
Mapbox, the surface that would need to change is contained and legible.
