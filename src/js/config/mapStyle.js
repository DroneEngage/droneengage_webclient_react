// Map3D (Mapbox 3D) visual constants and wind-arrow render constants.
// Frozen — pure render-tuning values, never mutated at runtime.
// Consumers: js_map3d.js, js_main.js.

// ---- Map3D (Mapbox 3D) visual constants ----
// Tether/ground/altitude/trail colors per unit index (cycled).
export const CONST_MAP3D_TETHER_COLORS = ['#503508', '#094709', '#510c31', '#127577'];
// Line thickness (pixels) for the 3D overlay layers.
export const CONST_MAP3D_CIRCLE_WIDTH = 2;     // ground + altitude rings
export const CONST_MAP3D_TRAIL_WIDTH = 5;      // flight path trail
export const CONST_MAP3D_MISSION_DROP_WIDTH = 1;  // waypoint drop-to-ground line
export const CONST_MAP3D_GATE_RADIUS = 10;        // vertical gate ring radius (meters)
export const CONST_MAP3D_GATE_WIDTH = 3;          // vertical gate ring line width
export const CONST_MAP3D_WP_GROUND_RADIUS = 5;    // ground circle radius at waypoint drop base (meters)
export const CONST_MAP3D_ADSB_TETHER_COLOR = '#ff0000'; // ADSB aircraft tether/ground/altitude ring color
export const CONST_MAP3D_ADSB_TETHER_OPACITY = 0.95;    // ADSB tether cylinder fill opacity

// ---- Map3D tether width (dynamic, altitude-based) ----
// The vertical tether width scales linearly from MIN to MAX as the
// object's altitude above ground goes from 0 to MAX_ALT, then stays
// at MAX for higher altitudes. Applies to both DroneEngage units
// (line width in pixels) and ADSB aircraft (cylinder radius in meters).
export const CONST_MAP3D_TETHER_MIN = 2;        // minimum tether width (at ground level)
export const CONST_MAP3D_TETHER_MAX = 100;       // maximum tether width (at MAX_ALT and above)
export const CONST_MAP3D_TETHER_MAX_ALT = 2000;  // altitude (meters AGL) at which MAX is reached

// ---- Map3D 3D-model (glTF) icon LOD ----
// Below this zoom (i.e. more Zoom out) the flat billboard <div> marker is shown (constant
// screen size, no 3D tilt); at/above it we swap to a real glTF model
// (arrow.glb / plane.glb) that tilts with roll/pitch in 3D. This
// avoids the "too small / too big" problem of scaling a real-world
// sized 3D model across the full zoom range (see js_map3d.js).
export const CONST_MAP3D_MODEL_TO_ICON_ZOOM_THRESHOLD = 8;
// model-scale [x,y,z] applied to arrow.glb/plane.glb *at
// CONST_MAP3D_MODEL_SCALE_REFERENCE_ZOOM*. Mapbox's model-scale paint
// property doesn't support zoom expressions on a GeoJSON source, so
// js_map3d.js recomputes this manually on every 'zoom' event: scale
// is multiplied by 2^(referenceZoom - currentZoom) * exponent, the
// same meters-per-pixel relationship tiles use.
export const CONST_MAP3D_MODEL_SCALE = [1, 1, 1];
export const CONST_MAP3D_MODEL_SCALE_REFERENCE_ZOOM = 22;
// Pixel-constant compensation exponent. Mapbox model-scale is in
// real-world meters; each zoom level halves meters-per-pixel, so to
// hold a CONSTANT on-screen (icon-like) size the real-world scale
// must grow by 2× per zoom level you zoom out, and shrink by 2× per
// level you zoom in. That is exactly:
//   factor = 2^((refZoom - zoom) * exponent)
// exponent = 1.0 → true pixel-constant (model keeps the SAME screen
//   size at every zoom, just like a billboard/icon — this is the
//   desired "icon" behaviour).
// exponent > 1.0 → over-compensates, model visibly grows on screen
//   as you zoom out.
// exponent < 1.0 → under-compensates, model shrinks on screen as
//   you zoom out.
export const CONST_MAP3D_MODEL_SCALE_ZOOM_EXPONENT = 1;
// Clamp the zoom-compensation factor so scale can't blow up/collapse
// to a degenerate size at extreme zoom. MIN_FACTOR is set low so the
// model CAN shrink (factor < 1) when you zoom in past the reference
// zoom — that shrinkage is what holds the on-screen size constant at
// high zoom (icon behaviour across the full range, not just below
// the reference). MAX_FACTOR caps the growth at extreme zoom-out.
export const CONST_MAP3D_MODEL_SCALE_MIN_FACTOR = 1;
export const CONST_MAP3D_MODEL_SCALE_MAX_FACTOR = 2000;

// ---- Map3D model size multiplier range (ModelSizeControl +/- buttons) ----
// The user-facing size multiplier (applied on top of the zoom-
// compensated factor in fn_computeModelScale) is stepped with +/-
// buttons between MIN and MAX. STEP is the increment per single
// click, STEP_BIG is the increment per double-click. Default start
// value is 1 (no extra magnification).
export const CONST_MAP3D_MODEL_SIZE_MIN = 0.1;
export const CONST_MAP3D_MODEL_SIZE_MAX = 5;
export const CONST_MAP3D_MODEL_SIZE_STEP = 0.1;
export const CONST_MAP3D_MODEL_SIZE_STEP_BIG = 0.5;

// ---- Map3D ADSB traffic render mode ----
// Unlike drone units (which always use the icon/GLB LOD hybrid
// above), ADSB aircraft can number in the hundreds, so instead of an
// automatic zoom-based swap this is a single global switch:
//   'icon' — flat DOM billboard markers only (current default).
//   'glb'  — real glTF models only ('drone-plane'), with the same
//            dynamic zoom-scaling (CONST_MAP3D_MODEL_SCALE_*) applied.
// See js_map3d.js fn_syncAdsbObject.
export const CONST_MAP3D_ADSB_RENDER_MODE_ICON = 'icon';
export const CONST_MAP3D_ADSB_RENDER_MODE_GLB = 'glb';
export const CONST_MAP3D_ADSB_RENDER_MODE = CONST_MAP3D_ADSB_RENDER_MODE_GLB;

// ---- Chase-cam / follow mode (3D map) ----
// When enabled, the 3D map camera trails behind the followed unit on
// every telemetry tick: center on the unit, bearing = yaw so the drone
// always flies "up" the screen, and a raised pitch for a chase view.
// The follow zoom is altitude-aware: it interpolates linearly from
// ZOOM_AT_GROUND (drone at 0 m AGL) to ZOOM_AT_HIGH (drone at/above
// ALT_REF m AGL), so a high drone pulls the camera back and a low
// one pushes it in — keeping the drone at a comfortable on-screen
// size regardless of altitude. See fn_computeFollowZoom.
export const CONST_MAP3D_FOLLOW_PITCH = 60;          // camera pitch (deg) while following
export const CONST_MAP3D_FOLLOW_ZOOM = 16;           // initial zoom applied once when follow starts
export const CONST_MAP3D_FOLLOW_DURATION_MS = 1500;  // easeTo duration per tick (smooths between packets)
export const CONST_MAP3D_FOLLOW_ZOOM_AT_GROUND = 17; // zoom when drone is at 0 m AGL (closer)
export const CONST_MAP3D_FOLLOW_ZOOM_AT_HIGH = 14;   // zoom when drone is at/above ALT_REF m AGL (farther)
export const CONST_MAP3D_FOLLOW_ALT_REF = 200;       // altitude (m AGL) at which ZOOM_AT_HIGH is reached

// ---- Wind arrow (selected unit) visual constants ----
// A single wind arrow is drawn next to the currently selected
// DroneEngage unit on the map (leaflet 2D now, map3d later). It
// points DOWNWIND (the direction the wind blows TO), and its length
// grows with wind speed. See js_windProvider.js for the data source
// (Open-Meteo, free, no key).
export const CONST_MAP_WIND_ARROW_COLOR = '#ffff00';        // arrow color (yellow, visible on most basemaps)
export const CONST_MAP_WIND_ARROW_LENGTH_PER_MS = 8;       // SVG path length units per 1 m/s of wind speed
export const CONST_MAP_WIND_ARROW_MAX_LENGTH = 80;         // clamp max path length (units)
export const CONST_MAP_WIND_ARROW_MIN_LENGTH = 24;         // clamp min path length (so 0 m/s is still visible)
export const CONST_MAP_WIND_ARROW_BASE_LENGTH_MS = 0;      // base length added regardless of speed
// Minimum interval between wind-arrow visual refreshes. Telemetry can
// arrive at 1-10 Hz; refreshing the arrow on every packet rebuilds the
// SVG icon + fires async plumbing for nothing (wind data is cached
// hourly + per ~11km cell, so it barely changes). This throttle makes
// the arrow "follow" the drone at a smooth, human-perceptible rate.
export const CONST_MAP_WIND_ARROW_REFRESH_MS = 10000;

Object.freeze({
	CONST_MAP3D_TETHER_COLORS, CONST_MAP3D_CIRCLE_WIDTH, CONST_MAP3D_TRAIL_WIDTH,
	CONST_MAP3D_MISSION_DROP_WIDTH, CONST_MAP3D_GATE_RADIUS, CONST_MAP3D_GATE_WIDTH,
	CONST_MAP3D_WP_GROUND_RADIUS, CONST_MAP3D_ADSB_TETHER_COLOR, CONST_MAP3D_ADSB_TETHER_OPACITY,
	CONST_MAP3D_TETHER_MIN, CONST_MAP3D_TETHER_MAX, CONST_MAP3D_TETHER_MAX_ALT,
	CONST_MAP3D_MODEL_TO_ICON_ZOOM_THRESHOLD, CONST_MAP3D_MODEL_SCALE, CONST_MAP3D_MODEL_SCALE_REFERENCE_ZOOM,
	CONST_MAP3D_MODEL_SCALE_ZOOM_EXPONENT, CONST_MAP3D_MODEL_SCALE_MIN_FACTOR, CONST_MAP3D_MODEL_SCALE_MAX_FACTOR,
	CONST_MAP3D_MODEL_SIZE_MIN, CONST_MAP3D_MODEL_SIZE_MAX, CONST_MAP3D_MODEL_SIZE_STEP, CONST_MAP3D_MODEL_SIZE_STEP_BIG,
	CONST_MAP3D_ADSB_RENDER_MODE_ICON, CONST_MAP3D_ADSB_RENDER_MODE_GLB, CONST_MAP3D_ADSB_RENDER_MODE,
	CONST_MAP3D_FOLLOW_PITCH, CONST_MAP3D_FOLLOW_ZOOM, CONST_MAP3D_FOLLOW_DURATION_MS,
	CONST_MAP3D_FOLLOW_ZOOM_AT_GROUND, CONST_MAP3D_FOLLOW_ZOOM_AT_HIGH, CONST_MAP3D_FOLLOW_ALT_REF,
	CONST_MAP_WIND_ARROW_COLOR, CONST_MAP_WIND_ARROW_LENGTH_PER_MS, CONST_MAP_WIND_ARROW_MAX_LENGTH,
	CONST_MAP_WIND_ARROW_MIN_LENGTH, CONST_MAP_WIND_ARROW_BASE_LENGTH_MS, CONST_MAP_WIND_ARROW_REFRESH_MS,
});
