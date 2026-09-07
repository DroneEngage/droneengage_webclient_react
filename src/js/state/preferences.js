// User preferences — in-memory cache behind accessors.
//
// This module holds the mutable preference fields that were previously
// on js_globals (including the mislabelled CONST_DEFAULT_* values that
// are written at runtime despite their prefix).  Every read goes
// through fn_getX() and every write through fn_setX(), which makes all
// mutation sites greppable — the property js_globals never had.
//
// Init: js_localStorage drives the initial load — its constructor
// calls the fn_setX() accessors with values read from localStorage.
// preferences.js does NOT import js_localStorage (that would create a
// cycle); it sits on top of it, it does not replace it.
//
// Change notification: EE_onPreferenceChanged is dispatched from the
// write sites today; this module is the natural home for a future
// subscription API.

// ---- in-memory state (defaults match the old js_globals constructor) ----
let m_useMetricSystem = true;
let m_displayMode = 0;
let m_en_Drone = true;
let m_en_GCS = true;
let m_enable_tabs_display = false;
let m_enable_unit_sort = true;
let m_enable_gcs_display = false;
let m_enable_wind = false;
let m_gamePadMode = 2;
let m_active_gamepad_index = 0;

// mislabelled CONST_* (mutable despite the prefix)
let m_CONST_DEFAULT_ALTITUDE = 100;  //  m
let m_CONST_DEFAULT_RADIUS = 50;     //  m
let m_CONST_DEFAULT_ALTITUDE_min = 1;    //  m
let m_CONST_DEFAULT_RADIUS_min = 5;      //  m
let m_CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = 30; // m
let m_CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = 5; // m
let m_CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN = 10; // m
let m_CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN = 2; // m
let m_CONST_MAP_EDITOR = false;

// ---- accessors ----

export const fn_getUseMetricSystem = () => m_useMetricSystem;
export const fn_setUseMetricSystem = (v) => { m_useMetricSystem = v; };

export const fn_getDisplayMode = () => m_displayMode;
export const fn_setDisplayMode = (v) => { m_displayMode = v; };

export const fn_getEnDrone = () => m_en_Drone;
export const fn_setEnDrone = (v) => { m_en_Drone = v; };

export const fn_getEnGCS = () => m_en_GCS;
export const fn_setEnGCS = (v) => { m_en_GCS = v; };

export const fn_getEnableTabsDisplay = () => m_enable_tabs_display;
export const fn_setEnableTabsDisplay = (v) => { m_enable_tabs_display = v; };

export const fn_getEnableUnitSort = () => m_enable_unit_sort;
export const fn_setEnableUnitSort = (v) => { m_enable_unit_sort = v; };

export const fn_getEnableGcsDisplay = () => m_enable_gcs_display;
export const fn_setEnableGcsDisplay = (v) => { m_enable_gcs_display = v; };

export const fn_getEnableWind = () => m_enable_wind;
export const fn_setEnableWind = (v) => { m_enable_wind = v; };

export const fn_getGamePadMode = () => m_gamePadMode;
export const fn_setGamePadMode = (v) => { m_gamePadMode = v; };

export const fn_getActiveGamepadIndex = () => m_active_gamepad_index;
export const fn_setActiveGamepadIndex = (v) => { m_active_gamepad_index = v; };

export const fn_getDefaultAltitude = () => m_CONST_DEFAULT_ALTITUDE;
export const fn_setDefaultAltitude = (v) => { m_CONST_DEFAULT_ALTITUDE = v; };

export const fn_getDefaultRadius = () => m_CONST_DEFAULT_RADIUS;
export const fn_setDefaultRadius = (v) => { m_CONST_DEFAULT_RADIUS = v; };

export const fn_getDefaultAltitudeMin = () => m_CONST_DEFAULT_ALTITUDE_min;
export const fn_setDefaultAltitudeMin = (v) => { m_CONST_DEFAULT_ALTITUDE_min = v; };

export const fn_getDefaultRadiusMin = () => m_CONST_DEFAULT_RADIUS_min;
export const fn_setDefaultRadiusMin = (v) => { m_CONST_DEFAULT_RADIUS_min = v; };

export const fn_getDefaultSwarmHorizontalDistance = () => m_CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE;
export const fn_setDefaultSwarmHorizontalDistance = (v) => { m_CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = v; };

export const fn_getDefaultSwarmVerticalDistance = () => m_CONST_DEFAULT_SWARM_VERTICAL_DISTANCE;
export const fn_setDefaultSwarmVerticalDistance = (v) => { m_CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = v; };

export const fn_getDefaultSwarmHorizontalDistanceMin = () => m_CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN;
export const fn_setDefaultSwarmHorizontalDistanceMin = (v) => { m_CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN = v; };

export const fn_getDefaultSwarmVerticalDistanceMin = () => m_CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN;
export const fn_setDefaultSwarmVerticalDistanceMin = (v) => { m_CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN = v; };

export const fn_getMapEditor = () => m_CONST_MAP_EDITOR;
export const fn_setMapEditor = (v) => { m_CONST_MAP_EDITOR = v; };
