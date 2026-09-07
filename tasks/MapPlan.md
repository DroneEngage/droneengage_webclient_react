Survey is running in the background — I'll let you know as soon as it comes back with the inventory of what's currently in the 3dMap component. In the meantime, I'll start thinking about what capabilities define state-of-the-art GCS (QGroundControl, DJI Pilot 2, Auterion Mission Control, UgCS) 3D views so I can map gaps once the survey lands.

Good — the survey confirms this is already a fairly mature 3D pane (Mapbox GL JS 3.x + glTF vehicle models with LOD, real terrain/DEM, 3D buildings, per-unit tethers, chase-cam, ADS-B subsystem, wind arrows), built in [src/js/maps/js_map3d.js](src/js/maps/js_map3d.js) (~3,570 lines). It's not a toy view. But compared to state-of-the-art GCS tools (QGroundControl, DJI Pilot 2/Fly, Auterion Mission Control, UgCS), there's a specific cluster of gaps — mostly *operational/mission-safety* features rather than rendering fidelity. Here's the gap analysis, roughly ordered by impact-to-effort ratio:

## Tier 1 — high impact, most GCS consider these table stakes

1. **Geofences / no-fly zones** — zero hits found in either the 3D or 2D map code. Every serious GCS (QGC, DJI, Auterion) renders inclusion/exclusion polygons and altitude ceilings in 3D. This is often the #1 thing evaluators check.
2. **Home point / RTL path visualization** — you have live position, trail, and mission waypoints, but no dedicated home marker + return-path line. Cheap to add given the tether/path infrastructure already exists.
3. **Gimbal/camera FOV cone** — a projected frustum from the vehicle's camera onto terrain is standard in DJI/Auterion for camera-aware missions (survey, inspection). You have vehicle attitude and glTF models already; adding a cone mesh oriented by gimbal pitch/yaw is a natural extension of `fn_syncUnit`.
4. **In-3D mission editing** — right now mission waypoints are view-only in 3D (editing only happens on the 2D Leaflet map via `leaflet.pm`). QGC/Auterion let you drag waypoints directly in the 3D view with live elevation snapping — you already sample terrain elevation per-waypoint (`fn_applyMissionElevation`), so wiring drag handlers to that is a moderate lift, not a rewrite.

## Tier 2 — differentiators most competitors have, some don't

5. **Video feed integration (picture-in-picture / projected onto the FOV cone)** — DJI Pilot's signature feature is live video docked next to the 3D view, sometimes projected onto the ground footprint. Not present at all currently.
6. **Signal/link-strength visualization** — color-coded trail or radio-range rings based on RSSI/link quality. You already cycle trail colors per unit (`CONST_MAP3D_TETHER_COLORS`) — reusing that channel for link health is low-effort.
7. **Flight log recording/playback (replay mode)** — scrub a timeline and watch the 3D trail replay. High value for post-flight debugging/QA, moderate effort since telemetry is already event-driven through `fn_syncUnit`.
8. **Measurement tools** — distance/area/height measurement in 3D, common in UgCS and QGC's terrain tools.
9. **Night/lighting realism** — Mapbox Standard style supports `setConfigProperty` light presets (dawn/day/dusk/night) — you're only switching to a static "Dark" style. This is a near-free upgrade given you're already on Mapbox Standard.

## Tier 3 — advanced/nice-to-have, fewer competitors nail these

10. **Orbit / first-person (FPV) camera modes** — you have chase-cam; adding orbit-around-target and a cockpit/FPV perspective would round out camera modes DJI and Auterion both offer.
11. **Weather overlay beyond wind arrow** — radar/cloud/precipitation layers (UgCS has this via its weather module).
12. **Photogrammetry/3D Tiles** — for high-fidelity site models (inspection use cases); this is a bigger architectural addition since Mapbox GL doesn't natively support OGC 3D Tiles the way Cesium does.
13. **AR/VR support** — genuinely rare even among "state of the art" GCS; low priority unless you have a specific field use case.

## One structural risk worth flagging separately

Mapbox GL JS v3.27.0 is pulled from a hard-coded CDN URL in `fn_loadMapboxSdk()` and isn't in `package.json`/lockfile — no version pinning, no offline/air-gapped deployment story. Several serious GCS deployments (military, industrial) require offline operation, so this could itself be a competitive gap, not just a maintenance nit. Worth deciding whether to vendor the library and consider self-hosted map tiles if offline capability matters to your target customers.

---

My recommendation: start with **geofences, home/RTL visualization, and the gimbal FOV cone** (Tier 1, items 1–3) — they reuse existing rendering infrastructure (tether/path/model layers), address the most commonly-benchmarked GCS features, and don't require new external dependencies or backend changes. Want me to scope one of these into an actual implementation plan?