import * as js_siteConfig from '../js_siteConfig';
import { js_globals } from '../js_globals.js';
import { js_localStorage } from '../js_localStorage.js';
import { js_eventEmitter } from '../events/js_eventEmitter.js';
import { EVENTS as js_event } from '../events/js_eventList.js';
import * as js_andruavMessages from '../protocol/messages/js_andruavMessages.js';
import * as js_andruavUnit from '../js_andruavUnit';
import '../../css/css_map3d.css';

/**
 * 1x1 fully-transparent PNG (data URI) used as a placeholder icon when a
 * marker's real icon should be invisible but the marker element must stay
 * in the DOM hit-test tree to catch click/hover — i.e. when a DroneEngage
 * unit or ADSB aircraft is rendered as a 3D glTF model instead of a flat
 * DOM icon. Mapbox's model-layer hit-testing is broken for GeoJSON-backed
 * model layers (mapbox-gl-js#13598), so we keep the DOM marker alive with
 * a transparent icon on top of the model to handle interaction natively.
 */
const TRANSPARENT_ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Custom Mapbox GL control: three buttons (x1, x2, x5) that switch the
 * terrain exaggeration factor.  Mounted bottom-right of the 3D map.
 */
class TerrainExaggerationControl {
    constructor(map3d) {
        this._map3d = map3d;
        this._container = null;
        this._buttons = [];
    }

    onAdd() {
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group css_map3d_exaggeration_ctrl';

        const label = document.createElement('span');
        label.className = 'css_map3d_exaggeration_label';
        label.textContent = 'ALT';
        this._container.appendChild(label);

        const factors = [1, 2, 5];
        factors.forEach((f) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = `x${f}`;
            btn.title = `Terrain exaggeration x${f}`;
            btn.addEventListener('click', () => {
                this._map3d.fn_setTerrainExaggeration(f);
                this._buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            this._container.appendChild(btn);
            this._buttons.push(btn);
            // Highlight the current factor on init.
            if (f === this._map3d.m_terrainExaggeration) btn.classList.add('active');
        });

        return this._container;
    }

    onRemove() {
        if (this._container?.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._container = null;
        this._buttons = [];
    }
}

/**
 * Custom Mapbox GL control: three buttons (x1, x2, x5) that multiply the
 * on-screen size of every 3D model of the given target ('unit' or 'adsb')
 * by the chosen factor, on top of the zoom-compensated scale from
 * fn_computeModelScale.  Mounted top-left of the 3D map so the user can
 * grow/shrink units and ADSB aircraft independently without changing zoom.
 * @param {CAndruavMap3D} map3d
 * @param {'unit'|'adsb'} target - which model set this control scales
 * @param {string} label - short label shown before the buttons (e.g. 'UNITS')
 */
class ModelSizeControl {
    constructor(map3d, target, label) {
        this._map3d = map3d;
        this._target = target;
        this._label = label;
        this._container = null;
        this._valueEl = null;
        this._decBtn = null;
        this._incBtn = null;
    }

    onAdd() {
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group css_map3d_modelsize_ctrl';

        // For the ADSB control, the label is a clickable toggle button
        // (with the plane icon) that enables/disables ADSB — mirroring the
        // leaflet map's ADSB toggle button. For other targets it stays a
        // plain text label.
        if (this._target === 'adsb') {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'css_map3d_adsb_toggle';
            toggle.title = 'Toggle ADSB';

            const img = document.createElement('img');
            img.src = '/images/Plane_Track.png';
            img.alt = 'ADSB';
            img.style.width = '16px';
            img.style.height = '16px';
            img.style.verticalAlign = 'middle';
            toggle.appendChild(img);

            this._adsbToggleBtn = toggle;
            this._updateAdsbToggleState();

            toggle.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const enabled = js_localStorage.fn_getADSBEnabled();
                js_localStorage.fn_setADSBEnabled(!enabled);
                js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
                this._updateAdsbToggleState();
            });

            this._container.appendChild(toggle);

            // Keep the toggle state in sync with external changes (e.g. the
            // leaflet map button or the settings checkbox).
            this._boundOnPreferenceChanged = () => this._updateAdsbToggleState();
            js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged, this, this._boundOnPreferenceChanged);

            // Turn the button red when the ADSB provider reports a fetch
            // error, and clear it when the error is resolved (null payload).
            this._boundOnAdsbError = (listener, p_msg) => this._updateAdsbErrorState(p_msg);
            js_eventEmitter.fn_subscribe(js_event.EE_adsbError, this, this._boundOnAdsbError);
        } else {
            const label = document.createElement('span');
            label.className = 'css_map3d_modelsize_label';
            label.textContent = this._label;
            this._container.appendChild(label);
        }

        // Stepped +/- buttons that walk the user-facing model size multiplier
        // between CONST_MAP3D_MODEL_SIZE_MIN and MAX. Single click steps by
        // CONST_MAP3D_MODEL_SIZE_STEP (0.1); double-click steps by
        // CONST_MAP3D_MODEL_SIZE_STEP_BIG (0.5). A short debounce is used so
        // a double-click fires only the big step, not two small steps + a big
        // one. The current value is shown between the two buttons.
        const current = this._target === 'adsb'
            ? this._map3d.m_modelSizeMultiplierAdsb
            : this._map3d.m_modelSizeMultiplierUnits;

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'css_map3d_modelsize_step';
        decBtn.textContent = '\u2212';   // minus sign
        decBtn.title = `${this._label} size decrease (double-click for bigger step)`;

        const valueEl = document.createElement('span');
        valueEl.className = 'css_map3d_modelsize_value';
        valueEl.textContent = this._formatValue(current);

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'css_map3d_modelsize_step';
        incBtn.textContent = '+';
        incBtn.title = `${this._label} size increase (double-click for bigger step)`;

        // Wire click + dblclick with a debounce per button. On a single
        // click we wait DBLCLICK_DELAY; if a dblclick arrives in that
        // window we cancel the small step and apply the big step instead.
        this._wireStepButton(decBtn, -1);
        this._wireStepButton(incBtn, +1);

        this._container.appendChild(decBtn);
        this._container.appendChild(valueEl);
        this._container.appendChild(incBtn);

        this._decBtn = decBtn;
        this._incBtn = incBtn;
        this._valueEl = valueEl;
        this._updateButtonStates();

        // Capture keyboard + / - / z / x so the user can step the model
        // size without clicking the buttons. For the 'unit' control the
        // listener is attached to window so the keys work no matter what
        // has focus (the map canvas is not reliably focusable). It is
        // ignored when the 3D map is hidden or when the user is typing in
        // an input/textarea/contenteditable. The 'adsb' control keeps its
        // listener scoped to its own container so z/x doesn't step both
        // controls at once.
        this._boundOnKeyDown = (ev) => this._onKeyDown(ev);
        if (this._target === 'unit') {
            this._keyTarget = window;
        } else {
            this._container.tabIndex = 0;
            this._keyTarget = this._container;
        }
        this._keyTarget.addEventListener('keydown', this._boundOnKeyDown);

        return this._container;
    }

    /**
     * Keyboard handler: '+' steps up, '-' steps down (small step), mirroring
     * the on-screen +/- buttons. Shift+'+'/'-' applies the big step, mirroring
     * a double-click. Numpad + / - are also matched.
     */
    _onKeyDown(ev) {
        // Ignore when the 3D map is hidden (the control may still be mounted
        // while the leaflet map is the active view).
        if (!this._map3d.m_isVisible) return;
        // Ignore when the user is typing in a form field so z/x/+/- don't
        // steal characters from inputs, textareas, or contenteditable.
        const el = document.activeElement;
        if (el) {
            const tag = el.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return;
        }

        const key = ev.key;
        const isPlus  = key === '+' || key === 'Add' || key === 'x' || key === 'X';
        const isMinus = key === '-' || key === 'Subtract' || key === '_' || key === 'z' || key === 'Z';
        if (!isPlus && !isMinus) return;

        ev.preventDefault();
        ev.stopPropagation();

        const dir = isPlus ? +1 : -1;
        const step = ev.shiftKey
            ? js_globals.CONST_MAP3D_MODEL_SIZE_STEP_BIG
            : js_globals.CONST_MAP3D_MODEL_SIZE_STEP;

        const btn = isPlus ? this._incBtn : this._decBtn;
        if (btn && !btn.disabled) {
            this._step(dir, step);
        }
    }

    /**
     * Wires click (small step) and dblclick (big step) on a +/- button with
     * a debounce so a double-click produces exactly one big step, not two
     * small steps followed by a big one.
     * @param {HTMLButtonElement} btn
     * @param {number} dir -1 or +1
     */
    _wireStepButton(btn, dir) {
        const DBLCLICK_DELAY = 250;   // ms — must be <= the browser's dblclick threshold
        let pendingTimer = null;

        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            if (pendingTimer) return;   // a click is already pending (waiting for a possible dblclick)
            pendingTimer = setTimeout(() => {
                pendingTimer = null;
                this._step(dir, js_globals.CONST_MAP3D_MODEL_SIZE_STEP);
            }, DBLCLICK_DELAY);
        });

        btn.addEventListener('dblclick', (ev) => {
            ev.preventDefault();
            if (btn.disabled) return;
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
            }
            this._step(dir, js_globals.CONST_MAP3D_MODEL_SIZE_STEP_BIG);
        });
    }

    /**
     * Steps the multiplier by the given amount in the given direction,
     * clamped to [CONST_MAP3D_MODEL_SIZE_MIN, CONST_MAP3D_MODEL_SIZE_MAX],
     * and updates the displayed value + button disabled states.
     * @param {number} dir -1 to decrease, +1 to increase
     * @param {number} step amount to step (defaults to CONST_MAP3D_MODEL_SIZE_STEP)
     */
    _step(dir, step = js_globals.CONST_MAP3D_MODEL_SIZE_STEP) {
        const min = js_globals.CONST_MAP3D_MODEL_SIZE_MIN;
        const max = js_globals.CONST_MAP3D_MODEL_SIZE_MAX;

        const current = this._target === 'adsb'
            ? this._map3d.m_modelSizeMultiplierAdsb
            : this._map3d.m_modelSizeMultiplierUnits;

        // Round to step granularity to avoid float drift (e.g. 0.30000000004).
        let next = Math.round((current + dir * step) / step) * step;
        next = Math.min(max, Math.max(min, next));

        this._map3d.fn_setModelSizeMultiplier(next, this._target);
        this._valueEl.textContent = this._formatValue(next);
        this._updateButtonStates();
    }

    /**
     * Disables the - button at MIN and the + button at MAX so the user
     * gets a visual signal that the range edge has been reached.
     */
    _updateButtonStates() {
        const min = js_globals.CONST_MAP3D_MODEL_SIZE_MIN;
        const max = js_globals.CONST_MAP3D_MODEL_SIZE_MAX;
        const current = this._target === 'adsb'
            ? this._map3d.m_modelSizeMultiplierAdsb
            : this._map3d.m_modelSizeMultiplierUnits;

        if (this._decBtn) this._decBtn.disabled = (current <= min);
        if (this._incBtn) this._incBtn.disabled = (current >= max);
    }

    /**
     * Formats the multiplier for display: integers without decimals (x1,
     * x2, x5), fractions with one decimal (x0.1, x1.5, x2.3).
     * @param {number} v
     * @returns {string}
     */
    _formatValue(v) {
        const rounded = Math.round(v * 10) / 10;
        return `x${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}`;
    }

    // Reflect the current ADSB enabled state on the toggle button.
    _updateAdsbToggleState() {
        if (!this._adsbToggleBtn) return;
        const enabled = js_localStorage.fn_getADSBEnabled();
        if (enabled) {
            this._adsbToggleBtn.classList.add('active');
        } else {
            this._adsbToggleBtn.classList.remove('active');
        }
    }

    // Show/clear the red error indicator on the ADSB toggle button.
    // p_msg is the error string (truthy) when an error is active, or null
    // when the error has been cleared by a successful fetch.
    _updateAdsbErrorState(p_msg) {
        if (!this._adsbToggleBtn) return;
        if (p_msg) {
            this._adsbToggleBtn.classList.add('error');
            this._adsbToggleBtn.title = `ADSB Error: ${p_msg}`;
        } else {
            this._adsbToggleBtn.classList.remove('error');
            this._adsbToggleBtn.title = 'Toggle ADSB';
        }
    }

    onRemove() {
        if (this._boundOnPreferenceChanged) {
            js_eventEmitter.fn_unsubscribe(js_event.EE_onPreferenceChanged, this);
            this._boundOnPreferenceChanged = null;
        }
        if (this._boundOnAdsbError) {
            js_eventEmitter.fn_unsubscribe(js_event.EE_adsbError, this);
            this._boundOnAdsbError = null;
        }
        if (this._boundOnKeyDown && this._keyTarget) {
            this._keyTarget.removeEventListener('keydown', this._boundOnKeyDown);
        }
        this._boundOnKeyDown = null;
        this._keyTarget = null;
        this._adsbToggleBtn = null;
        this._decBtn = null;
        this._incBtn = null;
        this._valueEl = null;
        if (this._container?.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._container = null;
    }
}

/**
 * Custom Mapbox GL control: a single toggle button that enables/disables
 * follow mode on the 3D map.  When active the camera freezes its current
 * relative position to the followed unit and maintains it on every
 * telemetry tick (see fn_syncUnit).  Mounted bottom-left of the 3D map.
 */
class ChaseCamControl {
    constructor(map3d) {
        this._map3d = map3d;
        this._container = null;
        this._btn = null;
    }

    onAdd() {
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group css_map3d_follow_ctrl';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'css_map3d_follow_toggle';
        btn.title = 'Toggle follow (freeze camera relative to selected unit)';
        btn.innerHTML = '<i class="bi bi-image"></i>';
        btn.addEventListener('click', () => {
            const enabled = this._map3d.m_followEnabled;
            this._map3d.fn_setFollowEnabled(!enabled);
        });
        this._container.appendChild(btn);
        this._btn = btn;
        this._updateState();

        // Keep the button state in sync with external changes (e.g. follow
        // auto-disabled by a user drag).
        this._boundOnFollowChanged = () => this._updateState();
        js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged, this, this._boundOnFollowChanged);
        return this._container;
    }

    _updateState() {
        if (!this._btn) return;
        if (this._map3d.m_followEnabled) {
            this._btn.classList.add('active');
        } else {
            this._btn.classList.remove('active');
        }
    }

    onRemove() {
        if (this._boundOnFollowChanged) {
            js_eventEmitter.fn_unsubscribe(js_event.EE_onPreferenceChanged, this);
            this._boundOnFollowChanged = null;
        }
        this._btn = null;
        if (this._container?.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._container = null;
    }
}

class CAndruavMap3D {
    constructor() {
        this.m_map = null;
        this.m_isReady = false;
        this.m_markers = new Map();
        this.m_isVisible = false;
        this.m_hasAutoFocusedUnit = false;
        this.m_mapDblClickCallbacks = [];
        this.m_isMapDblClickBound = false;

        // ---- Follow mode ("freeze relative to drone") ----
        // When active, the camera maintains a fixed world-space offset from
        // the followed unit.  The user positions the camera wherever they
        // like (e.g. to the right of the drone, looking at it from the
        // side), then the camera moves WITH the drone, preserving that
        // relative viewing angle and bearing.  Unlike the old chase-cam,
        // the camera does NOT rotate with the drone's yaw — bearing/pitch/
        // zoom are frozen at capture time.
        //
        // The offset + camera params are captured when follow starts and
        // RE-captured whenever the user manually drags/rotates/zooms/pitches
        // while follow is on — so adjusting the view doesn't cancel follow,
        // it just updates the frozen relative position.
        //
        // m_followEnabled: master toggle (ChaseCamControl button).
        // m_followUnitId: which unit the camera follows.  Set on unit click
        //   (fn_focusUnit) or auto-seeded with the first unit to sync.
        // m_followOffsetCaptured: false until we've recorded the initial
        //   offset (needs a drone position + a map center, so it may happen
        //   on the first fn_syncUnit after enable, not at enable time).
        // m_followOffsetLng/Lat: world-space offset from drone to camera
        //   center (center = drone + offset).
        // m_followBearing/Pitch/Zoom: frozen camera params at capture time.
        // m_followLastUnitLng/Lat: last known position of the followed unit,
        //   used to re-capture the offset after a user gesture.
        // m_followUserInteracting: true while a drag/rotate/zoom/pitch
        //   gesture is in progress, so per-tick easeTo doesn't fight it.
        // m_followBound: guards the one-shot gesture listeners.
        this.m_followEnabled = false;
        this.m_followUnitId = null;
        this.m_followOffsetCaptured = false;
        this.m_followOffsetLng = 0;
        this.m_followOffsetLat = 0;
        this.m_followBearing = 0;
        this.m_followPitch = 60;
        this.m_followZoom = 16;
        this.m_followLastUnitLng = null;
        this.m_followLastUnitLat = null;
        this.m_followUserInteracting = false;
        this.m_followBound = false;

        // ---- 3D tether line + ground circle + altitude circle + path trail ----
        // - Path trail: elevated dotted line along the drone's flight path
        // - Tether: solid vertical line from drone down to ground
        // - Ground circle: circle on terrain marking drone's ground projection
        // - Altitude circle: ring at the drone's altitude (icon level) marking
        //   its 3D position in the air. Circle layers can't be elevated, so this
        //   is a line ring lifted with line-z-offset + line-elevation-reference:'sea'.
        // All use line-z-offset + line-elevation-reference:'sea' (>= v3.8).
        this.m_tetherSources = new Map();  // unitId -> sourceId (vertical line)
        this.m_tetherLayers = new Map();   // unitId -> layerId
        this.m_groundSources = new Map();  // unitId -> sourceId (ground circle)
        this.m_groundLayers = new Map();   // unitId -> layerId
        this.m_altCircleSources = new Map();  // unitId -> sourceId (altitude ring)
        this.m_altCircleLayers = new Map();   // unitId -> layerId
        this.m_pathSources = new Map();    // unitId -> sourceId (path trail)
        this.m_pathLayers = new Map();     // unitId -> layerId
        this.m_pathData = new Map();       // unitId -> { coords, elevations }
        // Colors + line thickness live in js_globals (CONST_MAP3D_*).

        // ---- 3D mission waypoints (mirrors the leaflet mission drawing) ----
        // - Markers: small colored dots at first/last waypoints, elevated to
        //   their planned altitude above terrain.
        // - Gate rings: vertical rings at interior waypoints, facing the line
        //   direction (like a race gate).
        // - Mission line: elevated line connecting waypoints in order.
        // - Drop lines: thin vertical line from each waypoint down to the
        //   ground, showing its altitude above terrain at a glance.
        // - Ground circles: small ring on terrain at each drop line base
        //   (same style as the drone's ground circle).
        // - Loiter rings: ground-draped circles for CIRCLE waypoints.
        this.m_missionMarkers = new Map();      // unitId -> array of markers (first/last only; null for interior)
        this.m_missionLineSources = new Map();  // unitId -> sourceId
        this.m_missionLineLayers = new Map();   // unitId -> layerId
        this.m_missionDropSources = new Map();  // unitId -> sourceId (waypoint→ground vertical lines)
        this.m_missionDropLayers = new Map();   // unitId -> layerId
        this.m_missionGateSources = new Map();  // unitId -> sourceId (vertical gate rings, FeatureCollection)
        this.m_missionGateLayers = new Map();   // unitId -> layerId
        this.m_missionGroundSources = new Map(); // unitId -> sourceId (ground circles at drop bases, FeatureCollection)
        this.m_missionGroundLayers = new Map();  // unitId -> layerId
        this.m_missionCircleIds = new Map();    // unitId -> array of { sourceId, layerId }
        this.m_missionSyncGeneration = new Map(); // unitId -> counter, guards stale elevation retries
        this.m_missionData = new Map();          // unitId -> { wayPointArray, color } (latest mission, for replay)
        this.m_terrainExaggeration = 1.3;        // current terrain exaggeration factor (adjustable via x1/x2/x5 buttons)
        this.m_modelSizeMultiplierUnits = 1;     // user-selected size multiplier for drone units (x1/x2/x5, top-left)
        this.m_modelSizeMultiplierAdsb = 1;      // user-selected size multiplier for ADSB aircraft (x1/x2/x5, top-left)

        // ---- ADSB traffic markers (mirrors js_leafletmap's fn_renderSingleAdsb) ----
        // ADSB traffic can number in the hundreds, so unlike drones (which
        // each get their own tether/ground/altitude-circle layer set — there
        // are only ever a handful of units) all aircraft share a single
        // tether source + layer, ground-circle source + layer, and
        // altitude-circle source + layer (batched FeatureCollections).
        // The tether/rings are only ever populated for the *selected*
        // (clicked) aircraft — see m_selectedAdsbIcao — both to keep this
        // cheap and to mirror the leaflet map's click-to-see-details UX.
        this.m_adsbMarkers = new Map();          // icao_address -> mapboxgl.Marker
        this.m_adsbTetherData = new Map();       // icao_address -> { lng, lat, terrainElev, altAboveGround }
        this.m_adsbLayersReady = false;
        this.m_selectedAdsbIcao = null;          // icao of the currently clicked/highlighted aircraft

        this.m_mapClickCallbacks = [];
        this.m_isMapClickBound = false;

        // ---- 3D model (glTF) icon LOD ----
        // Above CONST_MAP3D_MODEL_ZOOM_THRESHOLD, drone icons are rendered as
        // real glTF models (arrow.glb / plane.glb) via a Mapbox 'model' layer
        // so they tilt in true 3D with roll/pitch (unlike the flat DOM
        // billboard marker, which only ever rotates in the screen plane).
        // Below the threshold we keep the DOM marker, since a real-world
        // scaled 3D model looks wrong (too tiny/huge) once zoomed far out.
        this.m_modelLayerReady = false;
        this.m_modelLodActive = false;          // true when models are currently shown instead of DOM markers
        this.m_unitModelFeatures = new Map();   // unitId -> GeoJSON Feature (kept so we can setData() the whole collection)
        // Guards the 'zoom' handler below: Mapbox fires 'zoom' continuously
        // (many times per second) during a zoom gesture, but the LOD/scale
        // update it triggers (including a source.setData() call) only needs
        // to run once per rendered frame. Without this, a single zoom
        // gesture could call setData() dozens of times.
        this.m_modelUpdateScheduled = false;

        // glTF-model twin of the ADSB DOM markers, used only when
        // js_globals.CONST_MAP3D_ADSB_RENDER_MODE === 'glb' (see fn_syncAdsbObject).
        this.m_adsbModelFeatures = new Map();   // icao_address -> GeoJSON Feature
    }

    /**
     * Registers double-click handler on the map (only once).
     */
    fn_registerMapDblClickHandler() {
        if (!this.m_map || this.m_isMapDblClickBound) return;

        this.m_map.on('dblclick', (event) => {
            const lngLat = event?.lngLat;
            if (!lngLat) return;

            this.m_mapDblClickCallbacks.forEach(callback => callback(lngLat.lat, lngLat.lng));
        });

        this.m_isMapDblClickBound = true;
    }

    /**
     * Adds a callback to be called on map double-click.
     * @param {Function} p_callback (lat, lng) => void
     */
    fn_addListenerOnDblClickMap(p_callback) {
        if (typeof p_callback !== 'function') return;
        this.m_mapDblClickCallbacks.push(p_callback);
        this.fn_registerMapDblClickHandler();
    }

    /**
     * Registers a single-click handler on the map background (only once).
     * Used to deselect the currently highlighted ADSB aircraft when the user
     * clicks anywhere that isn't a marker — DOM marker click handlers call
     * stopPropagation() so this only fires for actual background clicks.
     * In GLB mode the DOM markers are kept alive but transparent (see
     * fn_syncAdsbObject / fn_updateModelLod) precisely so they still catch
     * clicks natively, avoiding the broken Mapbox model-layer hit-testing
     * (mapbox-gl-js#13598).
     */
    fn_registerMapClickHandler() {
        if (!this.m_map || this.m_isMapClickBound) return;

        this.m_map.on('click', () => {
            this.m_mapClickCallbacks.forEach(callback => callback());
        });

        this.m_isMapClickBound = true;
    }

    /**
     * Adds a callback to be called when the map background is clicked.
     * @param {Function} p_callback () => void
     */
    fn_addListenerOnMapClick(p_callback) {
        if (typeof p_callback !== 'function') return;
        this.m_mapClickCallbacks.push(p_callback);
        this.fn_registerMapClickHandler();
    }

    /**
     * Shows a popup at the given location.
     * @param {object} [p_infoWindow] existing popup to reuse (or null to create)
     * @param {string|HTMLElement} p_content
     * @param {number} p_lat
     * @param {number} p_lng
     * @param {number} [p_alt] optional altitude in meters above the terrain
     *   surface (same convention as Marker#setAltitude). When terrain is on,
     *   Mapbox GL JS v3 places the popup at this height; without it the popup
     *   sits on the ground.
     * @returns {mapboxgl.Popup | null}
     */
    fn_showInfoWindow(p_infoWindow, p_content, p_lat, p_lng, p_alt) {
        if (!this.m_map) return null;

        this.fn_hideInfoWindow(p_infoWindow);

        // When an altitude is given, pass it as the 3rd element of the
        // LngLatLike array so the popup floats above the terrain (matching
        // the marker/model altitude). Scale by terrain exaggeration the same
        // way Marker#setAltitude does (see fn_syncUnit / fn_syncAdsbObject).
        const alt = (typeof p_alt === 'number' && Number.isFinite(p_alt))
            ? p_alt * this.m_terrainExaggeration
            : undefined;
        const lngLat = (alt != null) ? [p_lng, p_lat, alt] : [p_lng, p_lat];

        const popup = new window.mapboxgl.Popup({ closeOnClick: true })
            .setLngLat(lngLat);

        if (typeof p_content === 'string') {
            popup.setHTML(p_content);
        } else if (p_content instanceof HTMLElement) {
            popup.setDOMContent(p_content);
        }

        // Normalize 'remove' event to 'close' for compatibility
        if (typeof popup.on === 'function') {
            const originalOn = popup.on.bind(popup);
            popup.on = function (eventName, callback) {
                return originalOn(eventName === 'remove' ? 'close' : eventName, callback);
            };
        }

        popup.addTo(this.m_map);
        return popup;
    }

    /**
     * Updates an existing popup's content and/or position.
     * @param {number} [p_alt] optional altitude in meters above the terrain
     *   (same convention as fn_showInfoWindow).
     * @returns {mapboxgl.Popup | null}
     */
    fn_bindPopup(p_infoWindow, p_content, p_lat, p_lng, p_alt) {
        if (!p_infoWindow) return null;

        if (typeof p_lat === 'number' && typeof p_lng === 'number') {
            const alt = (typeof p_alt === 'number' && Number.isFinite(p_alt))
                ? p_alt * this.m_terrainExaggeration
                : undefined;
            p_infoWindow.setLngLat(alt != null ? [p_lng, p_lat, alt] : [p_lng, p_lat]);
        }

        if (typeof p_content === 'string') {
            p_infoWindow.setHTML(p_content);
        } else if (p_content instanceof HTMLElement) {
            p_infoWindow.setDOMContent(p_content);
        }

        return p_infoWindow;
    }

    fn_hideInfoWindow(p_infoWindow) {
        p_infoWindow?.remove();
    }

    /**
     * Dynamically loads Mapbox GL JS + CSS if not already present.
     */
    async fn_loadMapboxSdk() {
        if (window.mapboxgl) return window.mapboxgl;

        const loadCSS = () => {
            const id = 'mapbox-gl-css';
            if (document.getElementById(id)) return;
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.27.0/mapbox-gl.css';
            document.head.appendChild(link);
        };

        const loadJS = () => new Promise((resolve, reject) => {
            const id = 'mapbox-gl-js';
            if (document.getElementById(id)) {
                const el = document.getElementById(id);
                if (el.dataset.loaded) return resolve();
                el.addEventListener('load', () => { el.dataset.loaded = 'true'; resolve(); }, { once: true });
                el.addEventListener('error', () => reject(new Error('Failed to load Mapbox GL JS')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.id = id;
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.27.0/mapbox-gl.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'));
            document.body.appendChild(script);
        });

        loadCSS();
        await loadJS();
        return window.mapboxgl;
    }

    /**
     * Initializes the 3D Mapbox map with terrain and buildings.
     */
    async fn_initMap(containerId) {
        if (this.m_isReady || this.m_map) return;

        const token = js_siteConfig.CONST_MAPBOX_3D_ACCESS_TOKEN;
        if (!token) {
            console.warn('Mapbox 3D disabled: CONST_MAPBOX_3D_ACCESS_TOKEN not configured.');
            return;
        }

        const mapboxgl = await this.fn_loadMapboxSdk();
        mapboxgl.accessToken = token;

        this.m_map = new mapboxgl.Map({
            container: containerId,
            style: js_siteConfig.CONST_MAPBOX_STYLE || 'mapbox://styles/mapbox/standard',
            center: [24.767945, 42.144913],
            zoom: 15.47,
            pitch: 53,
            bearing: 0,
            antialias: true,
            doubleClickZoom: false
        });

        this.fn_registerMapDblClickHandler();

        this.m_map.on('style.load', () => {
            // Add 3D buildings if not already present
            if (!this.m_map.getLayer('add-3d-buildings')) {
                const sourceId = this.m_map.getSource('composite') ? 'composite' :
                                 this.m_map.getSource('mapbox-streets') ? 'mapbox-streets' : null;

                if (sourceId) {
                    this.m_map.addLayer({
                        id: 'add-3d-buildings',
                        source: sourceId,
                        'source-layer': 'building',
                        filter: ['==', 'extrude', 'true'],
                        type: 'fill-extrusion',
                        minzoom: 15,
                        paint: {
                            'fill-extrusion-color': '#aaa',
                            'fill-extrusion-height': ['get', 'height'],
                            'fill-extrusion-base': ['get', 'min_height'],
                            'fill-extrusion-opacity': 0.6
                        }
                    });
                } else {
                    console.warn('3D buildings skipped: no suitable building source found.');
                }
            }

            // Add terrain DEM source if missing
            if (!this.m_map.getSource('mapbox-dem')) {
                this.m_map.addSource('mapbox-dem', {
                    type: 'raster-dem',
                    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                    tileSize: 512,
                    maxzoom: 14
                });
            }

            // Enable terrain (required for marker altitude + path dots to be visible)
            this.m_map.setTerrain({
                source: 'mapbox-dem',
                exaggeration: this.m_terrainExaggeration
            });

            this.fn_setupModelLodLayer();

            // setStyle() wipes ALL user-added layers/sources but leaves our
            // in-memory tracking Maps intact, so fn_ensure*Layer would think
            // the layers still exist and skip re-adding them — causing
            // "layer does not exist" errors on the next setPaintProperty.
            // Clear every dynamic-layer tracking Map here so the next
            // fn_sync* call re-creates the layers from scratch.
            this.fn_clearDynamicLayerTracking();
        });

        this.m_map.on('load', () => {
            this.m_isReady = true;
            if (this.m_isVisible) this.m_map.resize();
            // Draw any missions that arrived while the map was still loading.
            this.fn_replayMissions();
        });

        // Toggle DOM markers vs. 3D glTF models, and rescale the models to
        // compensate for zoom, as the user zooms in/out. 'zoom' fires
        // continuously during the gesture, so this is throttled to once per
        // animation frame (see fn_scheduleModelUpdate) rather than running
        // fn_updateModelScale's setData() call on every single tick.
        this.m_map.on('zoom', () => {
            this.fn_scheduleModelUpdate();
        });

        // Add the terrain exaggeration control (x1 / x2 / x5 buttons).
        this.m_map.addControl(new TerrainExaggerationControl(this), 'bottom-right');
        // Add the model size multiplier controls (x1 / x2 / x5 buttons, top-left):
        // one for drone units, one for ADSB aircraft, each scaling its own set
        // independently on top of the zoom-compensated factor.
        this.m_map.addControl(new ModelSizeControl(this, 'unit', 'UNITS'), 'top-left');
        this.m_map.addControl(new ModelSizeControl(this, 'adsb', 'ADSB'), 'top-left');
        // Chase-cam (follow) toggle button, bottom-left.
        this.m_map.addControl(new ChaseCamControl(this), 'bottom-left');

        // While follow mode is on, user drag/rotate/zoom/pitch gestures
        // pause the per-tick camera tracking and re-capture the frozen
        // offset when the gesture ends — so the user can reposition the
        // camera relative to the drone without follow canceling.  Bound
        // once here (the map instance lives for the session).
        this.fn_bindFollowGestureHandlers();
    }

    /**
     * Registers gesture listeners that pause follow-mode camera tracking
     * while the user is dragging/rotating/zooming/pitching, and re-capture
     * the frozen offset when the gesture ends — so the user can reposition
     * the camera relative to the drone without follow canceling.  Called
     * once from fn_initMap.
     */
    fn_bindFollowGestureHandlers() {
        if (!this.m_map || this.m_followBound) return;
        this.m_followBound = true;

        // Pause per-tick easeTo while a gesture is in progress so it
        // doesn't fight the user's input.
        const onStart = () => { this.m_followUserInteracting = true; };
        this.m_map.on('dragstart', onStart);
        this.m_map.on('rotatestart', onStart);
        this.m_map.on('zoomstart', onStart);
        this.m_map.on('pitchstart', onStart);

        // When the gesture ends, re-capture the offset + camera params
        // from the new view so the camera maintains this new relative
        // position as the drone keeps moving.
        const onEnd = () => {
            this.m_followUserInteracting = false;
            this.fn_captureFollowOffset();
        };
        this.m_map.on('dragend', onEnd);
        this.m_map.on('rotateend', onEnd);
        this.m_map.on('zoomend', onEnd);
        this.m_map.on('pitchend', onEnd);
    }

    /**
     * Captures (or re-captures) the frozen camera offset and params from
     * the current map view.  The offset is the world-space delta from the
     * followed unit's last known position to the map's current center.
     * Called when follow is enabled and after every user gesture while
     * follow is on.  No-op if follow is off or the drone position is
     * unknown yet (will be retried on the next fn_syncUnit).
     */
    fn_captureFollowOffset() {
        if (!this.m_followEnabled || !this.m_map || !this.m_isReady) return;
        if (this.m_followLastUnitLng == null || this.m_followLastUnitLat == null) return;

        const center = this.m_map.getCenter();
        this.m_followOffsetLng = center.lng - this.m_followLastUnitLng;
        this.m_followOffsetLat = center.lat - this.m_followLastUnitLat;
        this.m_followBearing = this.m_map.getBearing();
        this.m_followPitch = this.m_map.getPitch();
        this.m_followZoom = this.m_map.getZoom();
        this.m_followOffsetCaptured = true;
    }

    /**
     * Enables or disables follow mode.  When enabled, the camera freezes
     * its current relative position to the drone and maintains it on every
     * telemetry tick.  No preset zoom/pitch jump — the user's current view
     * is what gets frozen.  When disabled, the camera is left where it is.
     * @param {boolean} enabled
     */
    fn_setFollowEnabled(enabled) {
        this.m_followEnabled = !!enabled;
        if (this.m_followEnabled) {
            // Try to capture the offset from the current view immediately.
            // If the drone position isn't known yet, the offset will be
            // captured on the first fn_syncUnit for the followed unit.
            this.m_followOffsetCaptured = false;
            this.fn_captureFollowOffset();
        }
        js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
    }

    /**
     * Sets the unit the camera should follow.  Called from fn_focusUnit when
     * the user clicks a unit; if follow mode is already on, the camera
     * immediately starts tracking the new target.
     * @param {string} unitId
     */
    fn_setFollowUnit(unitId) {
        if (!unitId) return;
        this.m_followUnitId = unitId;
    }

    /**
     * Clears the followed unit (e.g. when the unit is removed).  Follow mode
     * itself is left on — the next unit to sync will auto-seed the target.
     */
    fn_clearFollowUnit(unitId) {
        if (this.m_followUnitId === unitId) {
            this.m_followUnitId = null;
            this.m_followLastUnitLng = null;
            this.m_followLastUnitLat = null;
            this.m_followOffsetCaptured = false;
        }
    }

    /**
     * Computes the chase-cam zoom for a given altitude above ground so the
     * drone stays at a comfortable on-screen size regardless of how high it
     * is. Linearly interpolates from CONST_MAP3D_FOLLOW_ZOOM_AT_GROUND (at
     * 0 m AGL) to CONST_MAP3D_FOLLOW_ZOOM_AT_HIGH (at/above
     * CONST_MAP3D_FOLLOW_ALT_REF m AGL), clamped at both ends.
     * @param {number} altAboveGround meters AGL
     * @returns {number} zoom level
     */
    fn_computeFollowZoom(altAboveGround) {
        const zGround = js_globals.CONST_MAP3D_FOLLOW_ZOOM_AT_GROUND;
        const zHigh = js_globals.CONST_MAP3D_FOLLOW_ZOOM_AT_HIGH;
        const altRef = js_globals.CONST_MAP3D_FOLLOW_ALT_REF;
        const alt = Math.max(0, Number(altAboveGround) || 0);
        if (alt >= altRef) return zHigh;
        const t = alt / altRef;   // 0 at ground, 1 at altRef
        return zGround + (zHigh - zGround) * t;
    }

    /**
     * Swap in the current access token/style (localStorage first, falling
     * back to js_siteConfig) without tearing down the map instance - used
     * by the Settings "Refresh Map" button so it doesn't force a full page
     * reload. mapboxgl re-fires 'style.load' after setStyle(), which the
     * fn_initMap handler above already uses to re-add 3D buildings/terrain.
     */
    fn_refreshStyle() {
        if (!this.m_map) {
            console.warn('3D map not initialized');
            return;
        }

        const token = js_localStorage.fn_getMapbox3DAccessToken() || js_siteConfig.CONST_MAPBOX_3D_ACCESS_TOKEN;
        if (window.mapboxgl && token) {
            window.mapboxgl.accessToken = token;
        }

        const style = js_localStorage.fn_getMapboxStyle() || js_siteConfig.CONST_MAPBOX_STYLE || 'mapbox://styles/mapbox/standard';
        this.m_map.setStyle(style);
    }

    /**
     * Registers the glTF models (arrow.glb / plane.glb) + the GeoJSON source
     * and 'model' layer used to render unit icons as real 3D objects once
     * zoomed in past CONST_MAP3D_MODEL_ZOOM_THRESHOLD. See fn_syncUnit for
     * how per-unit position/rotation is pushed into the source, and
     * fn_updateModelLod for the DOM-marker/model swap.
     */
    fn_setupModelLodLayer() {
        if (!this.m_map || this.m_modelLayerReady) return;

        if (typeof this.m_map.addModel === 'function') {
            this.m_map.addModel('drone-arrow', '/models/arrow.glb');
            this.m_map.addModel('drone-plane', '/models/plane.glb');
            this.m_map.addModel('ground-station', '/models/groundstation.glb');
            this.m_map.addModel('drone-quad', '/models/quad.glb');
            this.m_map.addModel('drone-quad-1', '/models/quad_1.glb');
            this.m_map.addModel('drone-quad-2', '/models/quad_2.glb');
            this.m_map.addModel('drone-quad-3', '/models/quad_3.glb');
            this.m_map.addModel('drone-quad-4', '/models/quad_4.glb');
            this.m_map.addModel('drone-boat', '/models/boat.glb');
            this.m_map.addModel('drone-boat-1', '/models/boat_1.glb');
            this.m_map.addModel('drone-boat-2', '/models/boat_2.glb');
            this.m_map.addModel('drone-boat-3', '/models/boat_3.glb');
            this.m_map.addModel('drone-boat-4', '/models/boat_4.glb');
            this.m_map.addModel('drone-car', '/models/car.glb');
            this.m_map.addModel('drone-car-1', '/models/car_1.glb');
            this.m_map.addModel('drone-car-2', '/models/car_2.glb');
            this.m_map.addModel('drone-car-3', '/models/car_3.glb');
            this.m_map.addModel('drone-car-4', '/models/car_4.glb');
        }

        if (!this.m_map.getSource('unit-3d-models')) {
            this.m_map.addSource('unit-3d-models', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        if (!this.m_map.getLayer('unit-3d-models-layer')) {
            this.m_map.addLayer({
                id: 'unit-3d-models-layer',
                type: 'model',
                source: 'unit-3d-models',
                minzoom: js_globals.CONST_MAP3D_MODEL_ZOOM_THRESHOLD,
                layout: {
                    'model-id': ['get', 'modelId']
                },
                paint: {
                    'model-rotation': ['get', 'rotation'],
                    'model-translation': ['get', 'translation'],
                    // Data-driven (per-feature), not a zoom expression: Mapbox
                    // doesn't support zoom-dependent model-scale on a GeoJSON
                    // source, so fn_updateModelScale() recomputes this value
                    // in JS on every 'zoom' event instead (see below).
                    'model-scale': ['get', 'scale'],
                    // Real-time whole-model color tint (see fn_setUnitModelTint):
                    // Mapbox only supports independently recoloring sub-parts
                    // (e.g. rotors vs body) via materialOverrideNames on a
                    // 'model'-type source, NOT on this shared GeoJSON source
                    // (confirmed gap: mapbox/mapbox-gl-js#13609) — so this
                    // tints the entire model uniformly. Defaults to a no-op
                    // (intensity 0) unless a feature sets 'tintColor'/'tintIntensity'.
                    'model-color': ['get', 'tintColor'],
                    'model-color-mix-intensity': ['get', 'tintIntensity'],
                    'model-cast-shadows': false,
                    'model-receive-shadows': false
                }
            });
        }

        // ADSB traffic's glTF twin — only populated/shown when
        // js_globals.CONST_MAP3D_ADSB_RENDER_MODE === 'glb' (fn_syncAdsbObject).
        // minzoom gates the 3D model the same way as the unit layer above:
        // below CONST_MAP3D_MODEL_ZOOM_THRESHOLD the real-world scale needed
        // for pixel-constant compensation becomes so enormous that Mapbox's
        // model-layer rendering loses rotation precision (models default to
        // north). Below the threshold the DOM markers (which handle rotation
        // correctly at any size) take over; above it the 3D models render
        // with correct heading + tilt. fn_updateModelLod swaps the ADSB
        // DOM markers' icons between real and transparent accordingly.
        if (!this.m_map.getSource('adsb-3d-models')) {
            this.m_map.addSource('adsb-3d-models', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        if (!this.m_map.getLayer('adsb-3d-models-layer')) {
            this.m_map.addLayer({
                id: 'adsb-3d-models-layer',
                type: 'model',
                source: 'adsb-3d-models',
                minzoom: js_globals.CONST_MAP3D_MODEL_ZOOM_THRESHOLD,
                layout: {
                    'model-id': ['get', 'modelId']
                },
                paint: {
                    'model-rotation': ['get', 'rotation'],
                    'model-translation': ['get', 'translation'],
                    'model-scale': ['get', 'scale'],
                    // Same uniform whole-model tint mechanism as the unit
                    // layer above (see fn_setAdsbModelTint).
                    'model-color': ['get', 'tintColor'],
                    'model-color-mix-intensity': ['get', 'tintIntensity'],
                    'model-cast-shadows': false,
                    'model-receive-shadows': false
                }
            });
        }

        this.m_modelLayerReady = true;
        this.fn_updateModelLod();
        this.fn_updateModelScale();
    }

    /**
     * Swaps between the flat DOM billboard markers (m_markers) and the 3D
     * glTF model layer based on the current zoom, so the two never visually
     * overlap. DOM markers give a constant, readable screen size at any
     * zoom; the glTF models give true 3D roll/pitch tilt but only look
     * right within a narrow zoom band (see CONST_MAP3D_MODEL_SCALE), so
     * they're gated by minzoom on the layer itself + this icon swap.
     *
     * When models are active the DOM markers' icons are swapped to a
     * transparent placeholder (TRANSPARENT_ICON_URL) rather than hiding the
     * element — this keeps them in the hit-test tree so they still catch
     * click/hover natively, which is the only reliable way to interact
     * with the corresponding 3D model given that Mapbox's model-layer
     * hit-testing is broken for GeoJSON-backed model layers
     * (mapbox-gl-js#13598).
     */
    /**
     * Coalesces fn_updateModelLod + fn_updateModelScale to at most once per
     * animation frame. Bound to the 'zoom' event, which fires continuously
     * (many times per second) during a zoom gesture in Mapbox GL — without
     * this, fn_updateModelScale's source.setData() call would run on every
     * single tick of the gesture instead of once per rendered frame.
     */
    fn_scheduleModelUpdate() {
        if (this.m_modelUpdateScheduled) return;
        this.m_modelUpdateScheduled = true;
        requestAnimationFrame(() => {
            this.m_modelUpdateScheduled = false;
            this.fn_updateModelLod();
            this.fn_updateModelScale();
        });
    }

    fn_updateModelLod() {
        if (!this.m_map || !this.m_modelLayerReady) return;

        const showModels = this.m_map.getZoom() >= js_globals.CONST_MAP3D_MODEL_ZOOM_THRESHOLD;
        if (showModels === this.m_modelLodActive) return;
        this.m_modelLodActive = showModels;

        this.m_markers.forEach(marker => {
            this.fn_applyMarkerIconForMode(marker, showModels);
        });

        // In GLB mode, ADSB DOM markers swap between their real icon (below
        // threshold — the 3D model layer is hidden by minzoom, so the DOM
        // marker must be visible with correct heading) and the transparent
        // placeholder (at/above threshold — the 3D model renders instead).
        // In icon mode ADSB markers always show their real icon, so skip.
        if (js_globals.CONST_MAP3D_ADSB_RENDER_MODE === js_globals.CONST_MAP3D_ADSB_RENDER_MODE_GLB) {
            this.m_adsbMarkers.forEach(marker => {
                this.fn_applyMarkerIconForMode(marker, showModels);
            });
        }
    }

    /**
     * Computes the [x,y,z] model-scale for the current zoom so the glTF
     * model keeps a CONSTANT on-screen (icon-like) size regardless of zoom.
     * model-scale is real-world meters (not screen pixels): each zoom level
     * halves meters-per-pixel, so to hold the screen size steady the
     * real-world scale must grow by 2× per zoom-out level (and shrink by
     * 2× per zoom-in level). With exponent = 1.0 this is exact pixel-
     * constant compensation:
     *   zoomFactor = 2^((refZoom - zoom) * exponent), clamped to [min,max].
     * The user-selected multiplier for the given target ('unit' or 'adsb')
     * is then applied on top, so final scale = base * zoomFactor * multiplier.
     * @param {number} zoom
     * @param {'unit'|'adsb'} [target='unit'] - which multiplier to apply
     */
    fn_computeModelScale(zoom, target = 'unit') {
        const refZoom = js_globals.CONST_MAP3D_MODEL_SCALE_REFERENCE_ZOOM;
        const base = js_globals.CONST_MAP3D_MODEL_SCALE;
        const exponent = js_globals.CONST_MAP3D_MODEL_SCALE_ZOOM_EXPONENT;
        const minFactor = js_globals.CONST_MAP3D_MODEL_SCALE_MIN_FACTOR;
        const maxFactor = js_globals.CONST_MAP3D_MODEL_SCALE_MAX_FACTOR;
        const multiplier = (target === 'adsb' ? this.m_modelSizeMultiplierAdsb : this.m_modelSizeMultiplierUnits) || 1;

        const zoomFactor = Math.min(maxFactor, Math.max(minFactor, Math.pow(2, (refZoom - zoom) * exponent)));
        const factor = zoomFactor * multiplier;
        return base.map(v => v * factor);
    }

    /**
     * Computes the tether width/radius for a given altitude above ground.
     * Scales linearly from CONST_MAP3D_TETHER_MIN (at 0m AGL) to
     * CONST_MAP3D_TETHER_MAX (at CONST_MAP3D_TETHER_MAX_ALT and above).
     * Used for both DroneEngage unit tethers (line-width in pixels) and
     * ADSB aircraft tethers (fill-extrusion cylinder radius in meters).
     * @param {number} altAboveGround meters above ground (AGL)
     * @returns {number} tether width
     */
    fn_computeTetherWidth(altAboveGround) {
        const min = js_globals.CONST_MAP3D_TETHER_MIN;
        const max = js_globals.CONST_MAP3D_TETHER_MAX;
        const maxAlt = js_globals.CONST_MAP3D_TETHER_MAX_ALT;
        const alt = Math.max(0, Number(altAboveGround) || 0);
        if (alt >= maxAlt) return max;
        return min + (max - min) * (alt / maxAlt);
    }

    /**
     * Re-applies the current zoom-compensated scale (fn_computeModelScale)
     * to every unit's and (when CONST_MAP3D_ADSB_RENDER_MODE === 'glb')
     * every ADSB aircraft's 3D-model feature. Called on every 'zoom' event;
     * cheap given the small number of units (mirrors the ADSB tether
     * batching pattern used elsewhere in this file).
     */
    fn_updateModelScale() {
        if (!this.m_map || !this.m_modelLayerReady) return;

        const zoom = this.m_map.getZoom();

        if (this.m_unitModelFeatures.size > 0) {
            const scale = this.fn_computeModelScale(zoom, 'unit');
            this.m_unitModelFeatures.forEach(feature => { feature.properties.scale = scale; });
            this.fn_flushUnitModels();
        }

        if (this.m_adsbModelFeatures.size > 0) {
            const scale = this.fn_computeModelScale(zoom, 'adsb');
            this.m_adsbModelFeatures.forEach(feature => { feature.properties.scale = scale; });
            this.fn_flushAdsbModels();
        }
    }

    /**
     * Sets the user-selected model size multiplier for the given target
     * ('unit' or 'adsb') and re-applies it to that target's 3D model
     * features immediately. Called by the ModelSizeControl +/- buttons.
     * The multiplier is clamped to [CONST_MAP3D_MODEL_SIZE_MIN, MAX] and
     * applied on top of the zoom-compensated factor in fn_computeModelScale,
     * so the final on-screen scale for a feature of the given target =
     * base * zoomFactor * this multiplier.
     * @param {number} factor
     * @param {'unit'|'adsb'} target
     */
    fn_setModelSizeMultiplier(factor, target) {
        if (!Number.isFinite(factor) || factor <= 0) return;
        const min = js_globals.CONST_MAP3D_MODEL_SIZE_MIN;
        const max = js_globals.CONST_MAP3D_MODEL_SIZE_MAX;
        const clamped = Math.min(max, Math.max(min, factor));
        if (target === 'adsb') {
            this.m_modelSizeMultiplierAdsb = clamped;
        } else {
            this.m_modelSizeMultiplierUnits = clamped;
        }
        this.fn_updateModelScale();
    }

    /**
     * Changes the terrain exaggeration factor.  Called by the
     * TerrainExaggerationControl buttons.
     *
     * Elevated line layers use line-elevation-ground-scale:1.0, so Mapbox
     * scales their z-offset with terrain exaggeration automatically (GL JS
     * v3.19+).  Marker#setAltitude() does NOT scale automatically — the
     * altitude is raw meters above the (exaggerated) terrain surface — so we
     * must re-apply all marker altitudes multiplied by the new factor.
     * @param {number} factor - new exaggeration (1.0 = natural, 2.0 = 2x, etc.)
     */
    fn_setTerrainExaggeration(factor) {
        if (!this.m_map || !this.m_isReady) return;
        const prevFactor = this.m_terrainExaggeration;
        this.m_terrainExaggeration = factor;
        this.m_map.setTerrain({
            source: 'mapbox-dem',
            exaggeration: factor
        });

        // Re-apply marker altitudes with the new exaggeration factor.
        // Drone markers store their raw alt_relative on the marker instance
        // (set in fn_syncUnit); waypoint markers store it too (set in
        // fn_createMissionWaypointMarker / fn_applyMissionElevation).
        const ratio = factor / prevFactor;
        if (ratio !== 1) {
            this.m_markers.forEach(marker => {
                if (marker && typeof marker.getAltitude === 'function' && typeof marker.setAltitude === 'function') {
                    const cur = marker.getAltitude();
                    if (Number.isFinite(cur) && cur !== 0) {
                        marker.setAltitude(cur * ratio);
                    }
                }
            });
            this.m_missionMarkers.forEach(markers => {
                if (!Array.isArray(markers)) return;
                markers.forEach(marker => {
                    if (marker && typeof marker.getAltitude === 'function' && typeof marker.setAltitude === 'function') {
                        const cur = marker.getAltitude();
                        if (Number.isFinite(cur) && cur !== 0) {
                            marker.setAltitude(cur * ratio);
                        }
                    }
                });
            });
            this.m_adsbMarkers.forEach(marker => {
                if (marker && typeof marker.getAltitude === 'function' && typeof marker.setAltitude === 'function') {
                    const cur = marker.getAltitude();
                    if (Number.isFinite(cur) && cur !== 0) {
                        marker.setAltitude(cur * ratio);
                    }
                }
            });
        }

        // The ADSB tether/altitude-circle use 'line-elevation-reference':
        // 'ground', which — unlike the drone tether's 'sea' reference +
        // line-elevation-ground-scale:1.0 — is NOT auto-scaled by Mapbox, so
        // it must be recomputed (fn_flushAdsbTethers scales it manually).
        this.fn_flushAdsbTethers();
    }

    fn_show() {
        this.m_isVisible = true;

        // The map was initialized while the container was display:none (zero
        // size).  jQuery .show() changes display synchronously, but the browser
        // doesn't reflow until the current JS frame yields — so calling
        // resize() immediately reads the stale 0×0 dimensions and the canvas
        // stays pinned in the top-left corner.  Deferring to the next
        // animation frame lets the browser lay out the now-visible container
        // first, so resize() picks up the real dimensions.
        const doResizeAndSync = () => {
            if (!this.m_map) return;
            this.m_map.resize();

            // Re-sync all markers after resize. When the map container is hidden
            // (zero size), marker.setLngLat() projects to wrong screen coordinates
            // via requestAnimationFrame. resize() fires a 'resize' event but NOT
            // a 'move' event, so markers are never repositioned automatically.
            // Manually calling setLngLat forces a re-projection with the correct
            // container dimensions.
            if (this.m_isReady) {
                this.m_markers.forEach(marker => {
                    const lngLat = marker.getLngLat?.();
                    if (lngLat) marker.setLngLat(lngLat);

                    // Re-apply the correct icon (real or transparent) for the
                    // current LOD state — see fn_applyMarkerIconForMode.
                    this.fn_applyMarkerIconForMode(marker, this.m_modelLodActive);
                });

                // Same re-projection fix for ADSB traffic markers.
                const adsbGlb = js_globals.CONST_MAP3D_ADSB_RENDER_MODE === js_globals.CONST_MAP3D_ADSB_RENDER_MODE_GLB;
                this.m_adsbMarkers.forEach(marker => {
                    const lngLat = marker.getLngLat?.();
                    if (lngLat) marker.setLngLat(lngLat);

                    this.fn_applyMarkerIconForMode(marker, adsbGlb);
                });

                // Re-draw any missions that were stored while the 3D tab was
                // hidden — markers created against a zero-size container don't
                // project correctly, so we replay them now that it's visible.
                this.fn_replayMissions();

                // fn_flushAdsbTethers() was skipped while hidden (see its
                // m_isVisible guard) - if an aircraft is/was selected, its
                // tether/ground/altitude-ring visuals would otherwise stay
                // stale until the next ADSB poll (up to ~60s). Re-flush now
                // that the view (and m_adsbTetherData, refreshed by the
                // marker-sync loop above) is current again.
                this.fn_flushAdsbTethers();
            }
        };

        // Best-effort immediate resize (works if the browser already has
        // cached dimensions), then a guaranteed one on the next frame after
        // reflow.  The double-RAF covers browsers where a single frame
        // isn't enough to commit the layout change from display:none→block.
        requestAnimationFrame(() => requestAnimationFrame(doResizeAndSync));
    }

    fn_hide() {
        this.m_isVisible = false;
    }

    // Refresh the map canvas after its container size changes (e.g. browser
    // F11 fullscreen toggle). No-op when hidden or not yet initialised.
    fn_resize() {
        if (!this.m_isVisible || !this.m_map) return;
        this.m_map.resize();
    }

    fn_getUnitMarker(unit) {
        return unit ? this.m_markers.get(unit.getPartyID()) ?? null : null;
    }

    /**
     * Sets/updates a marker's icon image and remembers it so fn_show() can re-apply it.
     * Stores the real icon URL in _realIconUrl (separate from _lastIconUrl which
     * may be the transparent placeholder when GLB models are active — see
     * fn_applyMarkerIconForMode).
     */
    fn_setMarkerIcon(marker, markerIconUrl) {
        if (!marker || !markerIconUrl) return;

        marker._realIconUrl = markerIconUrl;
        // _lastIconUrl tracks what's currently displayed (real or transparent),
        // updated by fn_applyMarkerIconForMode. Only set it here if we're not
        // in a model-active state; otherwise fn_applyMarkerIconForMode owns it.
        if (!marker._modelActive) {
            marker._lastIconUrl = markerIconUrl;
            const iconEl = marker.getElement?.()?.querySelector('.css_map3d_marker_icon');
            if (iconEl) {
                iconEl.style.backgroundImage = `url('${markerIconUrl}')`;
            }
        }
    }

    /**
     * Applies either the real icon or the transparent placeholder to a marker,
     * depending on whether 3D models are currently active. Called by
     * fn_updateModelLod (for all unit markers) and fn_syncAdsbObject (per
     * ADSB marker) whenever the LOD state or ADSB render mode changes.
     */
    fn_applyMarkerIconForMode(marker, modelActive) {
        if (!marker) return;
        marker._modelActive = modelActive;
        const url = modelActive ? TRANSPARENT_ICON_URL : (marker._realIconUrl || '');
        marker._lastIconUrl = url;
        const iconEl = marker.getElement?.()?.querySelector('.css_map3d_marker_icon');
        if (iconEl && url) {
            iconEl.style.backgroundImage = `url('${url}')`;
        }
    }

    /**
     * Generic method to attach DOM event listeners to marker element.
     */
    fn_addListenerOnMarker(p_marker, p_callback, p_event) {
        if (!p_marker || typeof p_callback !== 'function') return;

        const el = p_marker.getElement?.();
        if (!el) return;

        p_marker.m_event_handlers = p_marker.m_event_handlers || {};
        p_marker.m_event_handlers[p_event] = p_marker.m_event_handlers[p_event] || [];

        const handler = () => {
            const lngLat = p_marker.getLngLat?.();
            if (lngLat) p_callback(lngLat.lat, lngLat.lng);
        };

        p_marker.m_event_handlers[p_event].push(handler);
        el.addEventListener(p_event, handler);
    }

    fn_addListenerOnClickMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'click');
    }

    fn_addListenerOnMouseOverMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'mouseover');
    }

    fn_addListenerOnMouseOutMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'mouseout');
    }

    fn_removeListenerOnMouseOutClickMarker(p_marker) {
        if (!p_marker?.m_event_handlers?.mouseout) return;

        const el = p_marker.getElement?.();
        if (!el) return;

        p_marker.m_event_handlers.mouseout.forEach(h => el.removeEventListener('mouseout', h));
        p_marker.m_event_handlers.mouseout = [];
    }

    fn_focusUnit(unit) {
        if (!this.m_map || !this.m_isReady || !unit?.m_Nav_Info?.p_Location) return;

        const { lat, lng } = unit.m_Nav_Info.p_Location;
        if (lat == null || lng == null) return;

        // Track the last-highlighted unit as the follow target so that, if
        // chase-cam is enabled (or gets enabled later), the camera trails
        // this unit.
        this.fn_setFollowUnit(unit.getPartyID());

        this.m_map.easeTo({ center: [lng, lat], duration: 500, pitch: 53 });
    }

    /**
     * Syncs unit position, altitude, rotation (yaw), and icon.
     * Altitude is applied via Marker#setAltitude (meters above the map surface
     * when terrain is enabled) — LngLat itself only carries lng/lat, so the
     * third array element is intentionally not used. With terrain on, the
     * marker floats `alt_relative` meters above the ground, giving a true 3D
     * "flying" representation.
     */
    fn_syncUnit(unit, markerIconUrl = null) {
        // Skip while the 3D view is hidden (e.g. user is on the 2D map):
        // this does real work per call (Mapbox marker create/update, terrain
        // queries downstream) that's wasted on an invisible map, and was
        // measured firing on every 2D map pan/zoom via fn_syncAdsbObject's
        // identical gap. fn_show() re-syncs every tracked marker's position
        // from cache when the 3D view becomes visible again, and the next
        // natural telemetry tick repopulates anything missed while hidden.
        if (!this.m_map || !this.m_isReady || !this.m_isVisible || !unit?.m_Nav_Info?.p_Location) return;

        const { lat, lng } = unit.m_Nav_Info.p_Location;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        // Relative altitude (meters above launch/home) — used as the height
        // above the terrain surface so the drone appears to fly in 3D.
        const altRelative = unit.m_Nav_Info.p_Location.alt_relative;

        const id = unit.getPartyID();
        let marker = this.m_markers.get(id);

        const createMarkerElement = () => {
            const el = document.createElement('div');
            el.className = 'css_map3d_marker';
            el.title = unit.m_unitName || id;
            el.style.transformOrigin = 'center center';

            const iconEl = document.createElement('div');
            iconEl.className = 'css_map3d_marker_icon';
            iconEl.style.transformOrigin = 'center center';
            el.appendChild(iconEl);

            return el;
        };

        if (!marker) {
            const el = createMarkerElement();

            marker = new window.mapboxgl.Marker({
                element: el,
                // Billboarded (always faces camera) for readability + click/hover.
                // rotationAlignment:'map' keeps the icon spinning with map bearing.
                rotationAlignment: 'map',
                pitchAlignment: 'viewport',
                anchor: 'center'
            })
            .setLngLat([lng, lat])
            .addTo(this.m_map);

            // Ensure alignment (some older versions needed explicit calls)
            if (typeof marker.setRotationAlignment === 'function') marker.setRotationAlignment('map');
            if (typeof marker.setPitchAlignment === 'function') marker.setPitchAlignment('viewport');
        } else {
            marker.setLngLat([lng, lat]);
        }

        // Apply altitude so the drone floats above the 3D terrain.
        // setAltitude() is meters above the map surface when terrain is on.
        // Marker altitude does NOT scale with terrain exaggeration (unlike
        // line-z-offset with line-elevation-ground-scale), so we multiply by
        // the current exaggeration factor to keep the icon at the same visual
        // height as the elevated lines.
        if (Number.isFinite(altRelative) && typeof marker.setAltitude === 'function') {
            marker.setAltitude(altRelative * this.m_terrainExaggeration);
        }

        this.m_markers.set(id, marker);

        // Keep newly created markers in sync with the current DOM/model LOD state.
        if (this.m_modelLodActive) {
            this.fn_applyMarkerIconForMode(marker, true);
        }

        // Update icon if provided — store last URL so fn_show can re-apply it
        this.fn_setMarkerIcon(marker, markerIconUrl);

        // Auto-focus first unit
        if (!this.m_hasAutoFocusedUnit) {
            this.m_hasAutoFocusedUnit = true;
            this.m_map.easeTo({ center: [lng, lat], duration: 500, pitch: 53 });
        }

        // Apply yaw rotation (in degrees)
        const yaw = unit?.m_Nav_Info?.p_Orientation?.yaw;
        let normalizedYaw = 0;
        if (Number.isFinite(yaw)) {
            const deg = (yaw * 180 / Math.PI) % 360;
            normalizedYaw = (deg + 360) % 360;

            if (typeof marker.setRotation === 'function') {
                marker.setRotation(normalizedYaw);
            } else {
                // Fallback: rotate icon element
                const iconEl = marker.getElement()?.querySelector('.css_map3d_marker_icon');
                iconEl?.style.setProperty('transform', `rotate(${normalizedYaw}deg)`);
            }
        }

        // Update the 3D tether line (vertical line from drone down to ground).
        this.fn_syncTether(id, this.fn_getTetherColor(unit), lat, lng, altRelative);

        // Update the glTF model twin used at close zoom (fn_updateModelLod).
        this.fn_syncUnitModel(unit, id, lat, lng, altRelative, normalizedYaw);

        // Follow mode ("freeze relative to drone"): if follow is on and
        // this is the followed unit (or no target has been picked yet —
        // auto-seed with the first unit to sync), move the camera by the
        // same delta as the drone so the world-space offset captured at
        // enable time (or after the last user gesture) is preserved.
        // bearing/pitch/zoom are frozen — the camera does NOT rotate with
        // the drone's yaw.  If the user is actively dragging/rotating/
        // zooming, skip the easeTo so it doesn't fight the gesture; the
        // gesture-end handler will re-capture the offset and resume.
        if (this.m_followEnabled) {
            if (!this.m_followUnitId) {
                this.m_followUnitId = id;
            }
            if (this.m_followUnitId === id) {
                // Remember the drone's current position for offset
                // re-capture after a user gesture.
                this.m_followLastUnitLng = lng;
                this.m_followLastUnitLat = lat;

                // Capture the offset on the first sync after follow was
                // enabled (if it wasn't already captured at enable time).
                if (!this.m_followOffsetCaptured) {
                    this.fn_captureFollowOffset();
                }

                if (this.m_followOffsetCaptured && !this.m_followUserInteracting) {
                    this.m_map.easeTo({
                        center: [lng + this.m_followOffsetLng, lat + this.m_followOffsetLat],
                        bearing: this.m_followBearing,
                        pitch: this.m_followPitch,
                        zoom: this.m_followZoom,
                        duration: js_globals.CONST_MAP3D_FOLLOW_DURATION_MS,
                        essential: true
                    });
                }
            }
        }

        return marker;
    }

    /**
     * Updates (or creates) the GeoJSON feature backing this unit's entry in
     * the 3D 'model' layer (unit-3d-models-layer) — the real glTF twin of
     * the DOM marker, shown instead of it once zoomed in past
     * CONST_MAP3D_MODEL_ZOOM_THRESHOLD (see fn_updateModelLod).
     *
     * model-rotation is [x, y, z] euler degrees applied in the model's
     * world/ENU frame: x tilts about the east-west axis (pitch), y tilts
     * about the north-south axis (roll/bank), z rotates about the vertical
     * axis (yaw/heading, clockwise from North) — see the comments in
     * scripts/generate_arrow_glb.js / generate_plane_glb.js for the raw
     * model convention (-Z forward/North, +Y up at [0,0,0]). Roll/pitch
     * sign conventions here are a best-effort derivation from MAVLink
     * angles and may need a visual sign flip once seen on screen.
     */
    fn_syncUnitModel(unit, id, lat, lng, altRelative, yawDeg) {
        if (!this.m_map) return;

        const roll = unit?.m_Nav_Info?.p_Orientation?.roll;
        const pitch = unit?.m_Nav_Info?.p_Orientation?.pitch;
        // Negated: model-rotation y-axis sign is opposite to MAVLink roll.
        const rollDeg = Number.isFinite(roll) ? roll * 180 / Math.PI : 0;
        const pitchDeg = Number.isFinite(pitch) ? -pitch * 180 / Math.PI : 0;

        let modelId;
        if (unit.m_VehicleType === js_andruavUnit.CONTROL_UNIT) {
            modelId = 'ground-station';
        } else if (unit.m_VehicleType === js_andruavUnit.VEHICLE_PLANE || unit.m_VehicleType === js_andruavUnit.VEHICLE_VTOL) {
            modelId = 'drone-plane';
        } else if (unit.m_VehicleType === js_andruavUnit.VEHICLE_QUAD || unit.m_VehicleType === js_andruavUnit.VEHICLE_TRI) {
            const idx = Number.isFinite(unit.m_index) ? ((unit.m_index % 4) + 1) : 1;
            modelId = `drone-quad-${idx}`;
        } else if (unit.m_VehicleType === js_andruavUnit.VEHICLE_BOAT) {
            const idx = Number.isFinite(unit.m_index) ? ((unit.m_index % 4) + 1) : 1;
            modelId = `drone-boat-${idx}`;
        } else if (unit.m_VehicleType === js_andruavUnit.VEHICLE_ROVER) {
            const idx = Number.isFinite(unit.m_index) ? ((unit.m_index % 4) + 1) : 1;
            modelId = `drone-car-${idx}`;
        } else {
            modelId = 'drone-arrow';
        }

        const zOffset = Number.isFinite(altRelative) ? altRelative * this.m_terrainExaggeration : 0;

        // Preserve the zoom-compensated scale and any active tint if this
        // feature already exists (fn_updateModelScale/fn_setUnitModelTint
        // keep them current independently); otherwise seed defaults.
        const existing = this.m_unitModelFeatures.get(id);
        const scale = existing?.properties?.scale || this.fn_computeModelScale(this.m_map.getZoom(), 'unit');
        const tintColor = existing?.properties?.tintColor || '#ffffff';
        const tintIntensity = existing?.properties?.tintIntensity || 0;

        this.m_unitModelFeatures.set(id, {
            type: 'Feature',
            id,
            properties: {
                modelId,
                rotation: [pitchDeg, rollDeg, yawDeg],
                translation: [0, 0, zOffset],
                scale,
                tintColor,
                tintIntensity
            },
            geometry: { type: 'Point', coordinates: [lng, lat] }
        });

        this.fn_flushUnitModels();
    }

    /**
     * Applies a real-time whole-model color tint to a unit's glTF model
     * (see the 'model-color'/'model-color-mix-intensity' comment on
     * unit-3d-models-layer for why this can't independently target rotors
     * vs body). Pass intensity 0 (or omit color) to clear the tint back to
     * the model's baked-in material colors.
     * @param {string} unitId
     * @param {string} [colorHex='#ffffff'] e.g. '#ff0000'
     * @param {number} [intensity=1] 0 (no tint) .. 1 (fully replaced by colorHex)
     */
    fn_setUnitModelTint(unitId, colorHex = '#ffffff', intensity = 1) {
        const feature = this.m_unitModelFeatures.get(unitId);
        if (!feature) return;

        feature.properties.tintColor = colorHex;
        feature.properties.tintIntensity = intensity;
        this.fn_flushUnitModels();
    }

    /**
     * Pushes the accumulated m_unitModelFeatures into the 'unit-3d-models'
     * source. Cheap enough to call on every telemetry tick given the small
     * number of units (mirrors the ADSB tether batching pattern).
     */
    fn_flushUnitModels() {
        if (!this.m_map || !this.m_modelLayerReady) return;

        const source = this.m_map.getSource('unit-3d-models');
        if (!source) return;

        source.setData({
            type: 'FeatureCollection',
            features: Array.from(this.m_unitModelFeatures.values())
        });
    }

    // ====================================================================
    //  ADSB traffic markers (mirrors js_leafletmap's fn_renderSingleAdsb)
    //  Each aircraft gets a billboarded icon floating at its real-world
    //  altitude above terrain, plus the same tether/ground-circle/altitude-
    //  circle visualization used for drones (fn_syncTether).
    // ====================================================================

    /**
     * Terrain elevation (meters MSL, non-exaggerated) at a lat/lng, or 0 if
     * terrain tiles aren't loaded yet. queryTerrainElevation() returns the
     * EXAGGERATED value, so we divide it back out (see fn_syncTether).
     */
    fn_getRawTerrainElevation(lat, lng) {
        if (!this.m_map || typeof this.m_map.queryTerrainElevation !== 'function') return 0;
        const exag = this.m_terrainExaggeration || 1;
        return (this.m_map.queryTerrainElevation([lng, lat]) || 0) / exag;
    }

    /**
     * Creates the shared tether/ground-circle/altitude-circle sources +
     * layers used for the currently selected ADSB aircraft (see
     * m_selectedAdsbIcao). Only ever holds 0 or 1 feature per layer, so a
     * single shared set (rather than one per aircraft) is plenty.
     *
     * The tether itself is a solid 3D cylinder (fill-extrusion over a small
     * circular polygon) rather than a thin line — a 1-2px line is very hard
     * to see against terrain/sky at typical zoom levels, especially for
     * aircraft thousands of meters up. fill-extrusion's default
     * 'fill-extrusion-base-alignment': 'terrain' plants the cylinder's base
     * directly on the local terrain surface (no manual terrain-elevation
     * query needed for placement, unlike the old line-based tether).
     *
     * The ground/altitude rings still use 'line-elevation-reference':
     * 'ground' (height above local terrain, same convention as
     * Marker#setAltitude) for the same reasons as before.
     */
    fn_ensureAdsbSharedLayers() {
        if (!this.m_map || !this.m_isReady || this.m_adsbLayersReady) return;

        const color = js_globals.CONST_MAP3D_ADSB_TETHER_COLOR;
        const empty = { type: 'FeatureCollection', features: [] };

        // --- Vertical tether cylinder (aircraft → ground) ---
        this.m_map.addSource('de-adsb-tether', { type: 'geojson', data: empty });
        this.m_map.addLayer({
            id: 'de-adsb-tether-layer',
            type: 'fill-extrusion',
            source: 'de-adsb-tether',
            paint: {
                'fill-extrusion-color': color,
                'fill-extrusion-opacity': js_globals.CONST_MAP3D_ADSB_TETHER_OPACITY,
                'fill-extrusion-base': 0,
                'fill-extrusion-height': ['get', 'height']
            }
        });

        // --- Ground circle (aircraft ground projection, draped on terrain) ---
        this.m_map.addSource('de-adsb-ground', { type: 'geojson', data: empty });
        this.m_map.addLayer({
            id: 'de-adsb-ground-layer',
            type: 'line',
            source: 'de-adsb-ground',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_CIRCLE_WIDTH,
                'line-opacity': 0.9
            }
        });

        // --- Altitude circle (ring at the aircraft's altitude) ---
        // 'zoffset' is a per-feature property (constant along the ring),
        // unlike the tether line which varies elevation along its length.
        this.m_map.addSource('de-adsb-altcircle', { type: 'geojson', data: empty });
        this.m_map.addLayer({
            id: 'de-adsb-altcircle-layer',
            type: 'line',
            source: 'de-adsb-altcircle',
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'line-z-offset': ['get', 'zoffset'],
                'line-elevation-reference': 'ground',
                'line-elevation-ground-scale': 1.0
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_CIRCLE_WIDTH,
                'line-opacity': 0.9
            }
        });

        this.m_adsbLayersReady = true;
    }

    /**
     * Marks `icao` (or none, if null) as the selected ADSB aircraft — the
     * only one whose tether/ground-circle/altitude-circle gets drawn. Call
     * fn_flushAdsbTethers() afterwards to apply the change.
     */
    fn_setSelectedAdsbAircraft(icao) {
        this.m_selectedAdsbIcao = icao || null;
    }

    /**
     * Creates/updates the 3D marker for an ADSB aircraft: position, altitude,
     * heading and icon. Called on every ADSB update (mirrors js_main.js's
     * fn_renderSingleAdsb for the leaflet map). Does NOT touch the shared
     * tether/ground/altitude-circle layers directly — it just records this
     * aircraft's tether data (used only if it's the selected one); call
     * fn_flushAdsbTethers() once after syncing all aircraft in a batch.
     *
     * `p_adsbObject.m_altitude` is barometric altitude MSL (meters), not
     * relative to any drone's home point, so it's converted to height above
     * the local terrain surface before calling Marker#setAltitude (which
     * expects meters above the terrain, like the drone markers in fn_syncUnit).
     * @param {import('../js_adsbUnit.js').CADSBObject} p_adsbObject
     * @param {string} markerIconUrl
     * @param {Function} [onClickCallback] (p_adsbObject) => void, called when
     *   the aircraft's icon is clicked (bound once per marker).
     * @returns {mapboxgl.Marker|null}
     */
    fn_syncAdsbObject(p_adsbObject, markerIconUrl, onClickCallback) {
        // Skip while the 3D view is hidden. Confirmed via trace + code
        // inspection as the actual dominant cost during 2D-map pan/zoom:
        // this runs a synchronous Mapbox terrain-elevation query
        // (queryTerrainElevation, see fn_getRawTerrainElevation) plus a real
        // Mapbox GL marker create/update, per aircraft, on every render pass
        // - including every 2D pan/zoom (fn_renderAdsbMarkers) - even though
        // none of it is visible. fn_show() re-syncs every tracked marker's
        // position from cache when the 3D view becomes visible again.
        if (!this.m_map || !this.m_isReady || !this.m_isVisible || !p_adsbObject) return null;

        const lat = p_adsbObject.m_lat;
        const lng = p_adsbObject.m_lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const icao = p_adsbObject.m_icao_address;
        if (!icao) return null;

        // Raw (non-exaggerated) height above the local terrain surface —
        // reused for both the marker's/model's floating altitude and its
        // tether. Heading is stored in radians (see
        // CADSBObject.updateFromNormalized).
        const terrainElev = this.fn_getRawTerrainElevation(lat, lng);
        const altAboveGround = Math.max((Number(p_adsbObject.m_altitude) || 0) - terrainElev, 0);
        const headingDeg = ((Number(p_adsbObject.m_heading) || 0) * 180 / Math.PI) % 360;
        const normalizedHeading = (headingDeg + 360) % 360;
        this.m_adsbTetherData.set(icao, { lng, lat, terrainElev, altAboveGround });

        const isGlbMode = js_globals.CONST_MAP3D_ADSB_RENDER_MODE === js_globals.CONST_MAP3D_ADSB_RENDER_MODE_GLB;

        // In GLB mode: sync the 3D model AND keep the DOM marker alive but
        // transparent (opacity:0) so it still catches click/hover natively —
        // the only reliable interaction path given Mapbox's broken model-
        // layer hit-testing (mapbox-gl-js#13598).
        // In icon mode: drop any stale GLB model feature.
        if (isGlbMode) {
            this.fn_syncAdsbModel(icao, lat, lng, altAboveGround, normalizedHeading);
        } else {
            if (this.m_adsbModelFeatures.delete(icao)) this.fn_flushAdsbModels();
        }

        let marker = this.m_adsbMarkers.get(icao);
        if (!marker) {
            const el = document.createElement('div');
            el.className = 'css_map3d_marker css_map3d_adsb_marker';
            el.style.transformOrigin = 'center center';

            const iconEl = document.createElement('div');
            iconEl.className = 'css_map3d_marker_icon';
            iconEl.style.transformOrigin = 'center center';
            el.appendChild(iconEl);

            marker = new window.mapboxgl.Marker({
                element: el,
                // Billboarded like drone markers: icon rotates with map bearing,
                // stays flat to the viewport otherwise.
                rotationAlignment: 'map',
                pitchAlignment: 'viewport',
                anchor: 'center'
            })
            .setLngLat([lng, lat])
            .addTo(this.m_map);

            if (typeof marker.setRotationAlignment === 'function') marker.setRotationAlignment('map');
            if (typeof marker.setPitchAlignment === 'function') marker.setPitchAlignment('viewport');

            this.m_adsbMarkers.set(icao, marker);
        } else {
            marker.setLngLat([lng, lat]);
        }

        const markerEl = marker.getElement?.();
        if (markerEl) markerEl.title = p_adsbObject.m_callsign || icao;

        // Bind the click handler once (el is stable for the marker's lifetime).
        // stopPropagation keeps the background map-click handler (which
        // deselects) from also firing right after selecting an aircraft.
        if (markerEl && typeof onClickCallback === 'function' && !marker._adsbClickBound) {
            markerEl.addEventListener('click', (evt) => {
                evt.stopPropagation();
                onClickCallback(p_adsbObject);
            });
            marker._adsbClickBound = true;
        }

        if (typeof marker.setAltitude === 'function') {
            marker.setAltitude(altAboveGround * this.m_terrainExaggeration);
        }

        if (typeof marker.setRotation === 'function') {
            marker.setRotation(normalizedHeading);
        } else {
            const iconEl = marker.getElement()?.querySelector('.css_map3d_marker_icon');
            iconEl?.style.setProperty('transform', `rotate(${normalizedHeading}deg)`);
        }

        this.fn_setMarkerIcon(marker, markerIconUrl);

        // In GLB mode, swap the icon to a transparent placeholder so the
        // marker is visually invisible but still catches click/hover for
        // the 3D model sitting on top of it — but ONLY when the 3D model
        // layer is actually active (at/above CONST_MAP3D_MODEL_ZOOM_THRESHOLD).
        // Below the threshold the model layer is hidden by minzoom (the
        // enormous scale needed for pixel-constant compensation would lose
        // rotation precision in Mapbox), so the DOM marker must show its
        // real icon with correct heading instead.
        this.fn_applyMarkerIconForMode(marker, isGlbMode && this.m_modelLodActive);

        return marker;
    }

    /**
     * Updates (or creates) the GeoJSON feature backing this aircraft's entry
     * in the 'adsb-3d-models' source — the glTF twin of the ADSB DOM marker,
     * used only when js_globals.CONST_MAP3D_ADSB_RENDER_MODE === 'glb'. See
     * fn_syncUnitModel for the rotation/scale conventions (identical here,
     * except ADSB only carries heading — no roll/pitch — so x/y stay 0).
     */
    fn_syncAdsbModel(icao, lat, lng, altAboveGround, headingDeg) {
        if (!this.m_map) return;

        const zOffset = altAboveGround * this.m_terrainExaggeration;
        const existing = this.m_adsbModelFeatures.get(icao);
        const scale = existing?.properties?.scale || this.fn_computeModelScale(this.m_map.getZoom(), 'adsb');
        const tintColor = existing?.properties?.tintColor || '#ffffff';
        const tintIntensity = existing?.properties?.tintIntensity || 0;

        this.m_adsbModelFeatures.set(icao, {
            type: 'Feature',
            id: icao,
            properties: {
                modelId: 'drone-plane',
                rotation: [0, 0, headingDeg],
                translation: [0, 0, zOffset],
                scale,
                tintColor,
                tintIntensity
            },
            geometry: { type: 'Point', coordinates: [lng, lat] }
        });

        this.fn_flushAdsbModels();
    }

    /**
     * Same real-time whole-model tint as fn_setUnitModelTint, for an ADSB
     * aircraft's glTF model (only has an effect while
     * CONST_MAP3D_ADSB_RENDER_MODE === 'glb').
     * @param {string} icao
     * @param {string} [colorHex='#ffffff']
     * @param {number} [intensity=1] 0 (no tint) .. 1 (fully replaced by colorHex)
     */
    fn_setAdsbModelTint(icao, colorHex = '#ffffff', intensity = 1) {
        const feature = this.m_adsbModelFeatures.get(icao);
        if (!feature) return;

        feature.properties.tintColor = colorHex;
        feature.properties.tintIntensity = intensity;
        this.fn_flushAdsbModels();
    }

    /**
     * Pushes the accumulated m_adsbModelFeatures into the 'adsb-3d-models'
     * source. Cheap enough given the batching (mirrors fn_flushUnitModels).
     */
    fn_flushAdsbModels() {
        if (!this.m_map || !this.m_modelLayerReady) return;

        const source = this.m_map.getSource('adsb-3d-models');
        if (!source) return;

        source.setData({
            type: 'FeatureCollection',
            features: Array.from(this.m_adsbModelFeatures.values())
        });
    }

    /**
     * Pushes the selected ADSB aircraft's tether/ground/altitude-circle data
     * (if any) to the shared Mapbox sources. Call once after syncing every
     * aircraft for the current update tick, and after selecting/deselecting
     * an aircraft (fn_setSelectedAdsbAircraft).
     */
    fn_flushAdsbTethers() {
        // Same gap as fn_syncAdsbObject/fn_syncUnit had: called unconditionally
        // from js_main.js's fn_adsbObjectUpdate on every ADSB fetch regardless
        // of whether the 3D view is visible. source.setData() below triggers a
        // Mapbox repaint request even on a display:none canvas (Mapbox GL does
        // not check container visibility itself), so this was still forcing
        // background render work while the user was only looking at the 2D
        // map. fn_show()'s doResizeAndSync path re-establishes the correct
        // tether/ring state when the 3D view becomes visible again.
        if (!this.m_map || !this.m_isReady || !this.m_isVisible) return;

        const data = this.m_selectedAdsbIcao ? this.m_adsbTetherData.get(this.m_selectedAdsbIcao) : null;
        if (!data) {
            if (!this.m_adsbLayersReady) return;
            const empty = { type: 'FeatureCollection', features: [] };
            this.m_map.getSource('de-adsb-tether')?.setData(empty);
            this.m_map.getSource('de-adsb-ground')?.setData(empty);
            this.m_map.getSource('de-adsb-altcircle')?.setData(empty);
            return;
        }

        this.fn_ensureAdsbSharedLayers();

        const CIRCLE_RADIUS = 5;      // meters — shared by ground + altitude rings
        const { lng, lat, altAboveGround } = data;

        // fill-extrusion-height/Marker#setAltitude don't auto-scale with
        // terrain exaggeration, so — same as the marker in fn_syncAdsbObject
        // above — we scale it ourselves to keep the tether/rings visually
        // matching the marker's floating height.
        const scaledAlt = altAboveGround * (this.m_terrainExaggeration || 1);

        this.m_map.getSource('de-adsb-tether')?.setData({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [this.fn_generateCircleRing(lng, lat, this.fn_computeTetherWidth(altAboveGround))]
                },
                properties: { height: scaledAlt }
            }]
        });
        this.m_map.getSource('de-adsb-ground')?.setData({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: this.fn_generateCircleRing(lng, lat, CIRCLE_RADIUS) },
                properties: {}
            }]
        });
        this.m_map.getSource('de-adsb-altcircle')?.setData({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: this.fn_generateCircleRing(lng, lat, CIRCLE_RADIUS * 2) },
                properties: { zoffset: scaledAlt }
            }]
        });
    }

    /**
     * Removes an ADSB aircraft's 3D marker and its tether data, e.g. once
     * it's expired/out of range. If it was the selected aircraft, also
     * clears the selection. Call fn_flushAdsbTethers() afterwards. Recreated
     * on demand next time the aircraft is seen again.
     */
    fn_removeAdsbMarker(p_adsbObject) {
        const icao = p_adsbObject?.m_icao_address;
        if (!icao) return;

        const marker = this.m_adsbMarkers.get(icao);
        if (marker) {
            marker.remove();
            this.m_adsbMarkers.delete(icao);
        }

        if (this.m_adsbModelFeatures.delete(icao)) this.fn_flushAdsbModels();

        this.m_adsbTetherData.delete(icao);
        if (this.m_selectedAdsbIcao === icao) this.m_selectedAdsbIcao = null;
    }

    // ====================================================================
    //  3D tether line (drone → ground)
    //  A vertical line from the drone's 3D position straight down to the
    //  terrain surface below it. Updated on every fn_syncUnit so it's always
    //  visible — even when the drone is stationary on the ground.
    //  Uses line-z-offset + line-elevation-reference:'sea' (>= v3.8).
    // ====================================================================

    /**
     * Clears every per-unit/per-id dynamic-layer tracking Map and resets the
     * shared-layer "ready" flags.  Called from the 'style.load' handler so
     * that fn_ensure*Layer re-creates layers from scratch after setStyle()
     * wipes them.  The Mapbox markers themselves (m_markers, m_adsbMarkers)
     * are DOM elements independent of the style and survive a style reload,
     * so they are NOT cleared here.
     */
    fn_clearDynamicLayerTracking() {
        // Tether / ground circle / altitude circle (per unit)
        this.m_tetherSources.clear();
        this.m_tetherLayers.clear();
        this.m_groundSources.clear();
        this.m_groundLayers.clear();
        this.m_altCircleSources.clear();
        this.m_altCircleLayers.clear();

        // Path trail (per unit) — data is preserved so fn_DrawPath can re-add
        this.m_pathLayers.clear();
        this.m_pathSources.clear();
        // m_pathData is intentionally kept: it holds the actual coordinates
        // so the trail can be replayed without losing history.

        // Mission waypoints (per unit) — m_missionData is kept for replay
        this.m_missionLineSources.clear();
        this.m_missionLineLayers.clear();
        this.m_missionDropSources.clear();
        this.m_missionDropLayers.clear();
        this.m_missionGateSources.clear();
        this.m_missionGateLayers.clear();
        this.m_missionGroundSources.clear();
        this.m_missionGroundLayers.clear();
        this.m_missionCircleIds.clear();
        this.m_missionSyncGeneration.clear();

        // ADSB shared layers (single set, flagged)
        this.m_adsbLayersReady = false;

        // glTF model LOD layer (single set, flagged)
        this.m_modelLayerReady = false;
    }

    /**
     * Returns the tether color for a unit based on its index.
     */
    fn_getTetherColor(unit) {
        const idx = unit?.m_index ?? 0;
        const colors = js_globals.CONST_MAP3D_TETHER_COLORS;
        return colors[idx % colors.length];
    }

    /**
     * Ensures a GeoJSON source + elevated line layer exist for the tether
     * (identified by `id`, e.g. a unit's party ID or an ADSB icao address),
     * plus a ground circle source + layer. Called on first fn_syncTether.
     */
    fn_ensureTetherLayer(id, color) {
        if (!this.m_map || !this.m_isReady) return;
        if (this.m_tetherSources.has(id)) return;

        const sourceId = `de-tether-${id}`;
        const layerId = `de-tether-layer-${id}`;
        const groundSourceId = `de-ground-${id}`;
        const groundLayerId = `de-ground-layer-${id}`;

        // --- Vertical tether line (drone → ground) ---
        // lineMetrics:true is required for line-progress / line-z-offset.
        this.m_map.addSource(sourceId, {
            type: 'geojson',
            lineMetrics: true,
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[0, 0], [0, 0]]
                },
                properties: { elevation: [0, 0] }
            }
        });

        // Solid elevated line: line-z-offset interpolates per-vertex elevation
        // from the 'elevation' property array using line-progress (0..1).
        // vertex 0 = ground (terrainElev), vertex 1 = drone (terrainElev + alt).
        this.m_map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'line-z-offset': [
                    'at-interpolated',
                    ['line-progress'],
                    ['get', 'elevation']
                ],
                'line-elevation-reference': 'sea',
                'line-elevation-ground-scale': 1.0  // scale z-offset with terrain exaggeration
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_TETHER_MIN,  // updated per fn_syncTether
                'line-opacity': 0.8
            }
        });

        this.m_tetherSources.set(id, sourceId);
        this.m_tetherLayers.set(id, layerId);

        // --- Ground circle (drone's ground projection) ---
        // A line ring (outline only) at [lng, lat] with no z-offset, so it
        // drapes flat on the terrain surface — same ring style + radius as the
        // altitude circle, ensuring its diameter is not bigger than the upper one.
        this.m_map.addSource(groundSourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                properties: {}
            }
        });

        this.m_map.addLayer({
            id: groundLayerId,
            type: 'line',
            source: groundSourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
                // No line-z-offset / line-elevation-reference => drapes on terrain.
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_CIRCLE_WIDTH,
                'line-opacity': 0.9
            }
        });

        this.m_groundSources.set(id, groundSourceId);
        this.m_groundLayers.set(id, groundLayerId);

        // --- Altitude circle (ring at the drone's altitude / icon level) ---
        // Circle layers have no z-offset, so this is a line ring lifted to the
        // drone's absolute altitude via line-z-offset + line-elevation-reference:'sea'.
        // It marks the drone's 3D position in the air, pairing with the ground
        // circle below and the vertical tether line connecting them.
        const altSourceId = `de-altcircle-${id}`;
        const altLayerId = `de-altcircle-layer-${id}`;

        this.m_map.addSource(altSourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                properties: {}
            }
        });

        this.m_map.addLayer({
            id: altLayerId,
            type: 'line',
            source: altSourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'line-z-offset': 0,   // updated per fn_syncTether to droneAlt
                'line-elevation-reference': 'sea',
                'line-elevation-ground-scale': 1.0  // scale z-offset with terrain exaggeration
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_CIRCLE_WIDTH,
                'line-opacity': 0.9
            }
        });

        this.m_altCircleSources.set(id, altSourceId);
        this.m_altCircleLayers.set(id, altLayerId);
    }

    /**
     * Updates the tether line + ground circle + altitude circle for a unit
     * or an ADSB aircraft (identified by `id`, with tether color `color`).
     * Called from fn_syncUnit / fn_syncAdsbObject on every telemetry update.
     */
    fn_syncTether(id, color, lat, lng, altRelative) {
        if (!this.m_map || !this.m_isReady) return;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        this.fn_ensureTetherLayer(id, color);

        // Terrain elevation at the drone's position (meters above sea level).
        // queryTerrainElevation() returns the EXAGGERATED elevation (raw DEM ×
        // exaggeration).  Our line layers use line-elevation-ground-scale:1.0
        // which scales the z-offset by exaggeration, so we must pass the RAW
        // (non-exaggerated) DEM value to avoid double-scaling.
        const exag = this.m_terrainExaggeration || 1;
        const terrainElev = (typeof this.m_map.queryTerrainElevation === 'function')
            ? ((this.m_map.queryTerrainElevation([lng, lat]) || 0) / exag)
            : 0;
        const droneAlt = terrainElev + (Number.isFinite(altRelative) ? altRelative : 0);

        // --- Update vertical tether line ---
        // Mapbox line layers need non-zero horizontal length to render — a
        // LineString with two identical [lng,lat] points is invisible. We
        // offset the top point by a tiny amount (~1m north) so the line has
        // horizontal extent to draw, while line-z-offset provides the vertical
        // component. At any realistic zoom this looks perfectly vertical.
        const TINY_OFFSET = 0.00001;  // ~1 meter in degrees
        const sourceId = this.m_tetherSources.get(id);
        const source = this.m_map?.getSource(sourceId);
        if (source) {
            source.setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[lng, lat], [lng, lat + TINY_OFFSET]]
                },
                properties: {
                    elevation: [terrainElev, droneAlt]
                }
            });
        }

        // --- Update tether line width (dynamic, altitude-based) ---
        const tetherLayerId = this.m_tetherLayers.get(id);
        if (tetherLayerId && this.m_map.getLayer(tetherLayerId)) {
            const width = this.fn_computeTetherWidth(altRelative);
            this.m_map.setPaintProperty(tetherLayerId, 'line-width', width);
        }

        // --- Update ground circle (ring draping on terrain) ---
        // Same ring geometry + radius as the altitude circle so the ground
        // diameter is not bigger than the upper one. No z-offset => drapes
        // flat on the terrain surface.
        const CIRCLE_RADIUS = 5;  // meters — shared by ground + altitude rings
        const ringCoordsUp = this.fn_generateCircleRing(lng, lat, CIRCLE_RADIUS * 2);
        const ringCoordsDown = this.fn_generateCircleRing(lng, lat, CIRCLE_RADIUS);

        const groundSourceId = this.m_groundSources.get(id);
        const groundSource = this.m_map?.getSource(groundSourceId);
        if (groundSource) {
            groundSource.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: ringCoordsDown },
                properties: {}
            });
        }

        // --- Update altitude circle (ring at the drone's altitude / icon level) ---
        // Same ring geometry, lifted to droneAlt via line-z-offset. Pairs with
        // the ground circle below + the tether line connecting them.
        const altSourceId = this.m_altCircleSources.get(id);
        const altLayerId = this.m_altCircleLayers.get(id);
        const altSource = this.m_map?.getSource(altSourceId);
        if (altSource && altLayerId && this.m_map.getLayer(altLayerId)) {
            altSource.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: ringCoordsUp },
                properties: {}
            });
            // Elevate the whole ring to the drone's absolute altitude (above sea).
            this.m_map.setLayoutProperty(altLayerId, 'line-z-offset', droneAlt);
        }
    }

    /**
     * Generates a closed circular ring (LineString coordinates) of the given
     * radius (meters) around a [lng, lat] center. Used for the altitude circle.
     * @returns {Array<[number, number]>} array of [lng, lat] points (closed)
     */
    fn_generateCircleRing(lng, lat, radiusMeters, numPoints = 32) {
        const points = [];
        const latRad = lat * Math.PI / 180;
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos(latRad);
        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const dx = radiusMeters * Math.cos(angle);
            const dy = radiusMeters * Math.sin(angle);
            points.push([
                lng + dx / metersPerDegLng,
                lat + dy / metersPerDegLat
            ]);
        }
        return points;
    }

    /**
     * Computes the initial bearing (forward azimuth) from point 1 to point 2.
     * @returns {number} bearing in degrees (0 = north, 90 = east, -180..180)
     */
    fn_bearing(lat1, lng1, lat2, lng2) {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        return Math.atan2(y, x) * 180 / Math.PI;
    }

    /**
     * Generates a vertical ring (race-gate style) centered at [lng, lat] at
     * centerElev MSL, lying in a vertical plane perpendicular to bearingDeg.
     *
     * Each point on the ring has a horizontal offset (perpendicular to the
     * line direction) and a vertical offset (altitude), so the ring stands
     * upright like a gate the drone would fly through.
     *
     * @param {number} lng - center longitude
     * @param {number} lat - center latitude
     * @param {number} centerElev - center absolute MSL elevation
     * @param {number} bearingDeg - line direction at this waypoint (degrees)
     * @param {number} radiusMeters - ring radius
     * @returns {{ coords: Array<[number,number]>, elevations: Array<number> }}
     */
    fn_generateVerticalRing(lng, lat, centerElev, bearingDeg, radiusMeters, numPoints = 32) {
        const coords = [];
        const elevations = [];
        const latRad = lat * Math.PI / 180;
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos(latRad);
        // Perpendicular to the line bearing → the ring plane faces along the line.
        const perpRad = (bearingDeg + 90) * Math.PI / 180;

        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            // Horizontal offset: radius * cos(angle) in the perpendicular direction
            const horizDist = radiusMeters * Math.cos(angle);
            const dx = horizDist * Math.sin(perpRad);  // east component
            const dy = horizDist * Math.cos(perpRad);  // north component
            // Vertical offset: radius * sin(angle) in altitude
            const vertDist = radiusMeters * Math.sin(angle);

            coords.push([
                lng + dx / metersPerDegLng,
                lat + dy / metersPerDegLat
            ]);
            elevations.push(centerElev + vertDist);
        }

        return { coords, elevations };
    }

    // ====================================================================
    //  3D path trail (elevated dotted line along the flight path)
    // ====================================================================

    /**
     * Ensures a GeoJSON source + elevated line layer exist for a unit's path trail.
     */
    fn_ensurePathTrailLayer(unit) {
        if (!this.m_map || !this.m_isReady) return;
        const id = unit.getPartyID();
        if (this.m_pathSources.has(id)) return;

        const sourceId = `de-trail-${id}`;
        const layerId = `de-trail-layer-${id}`;
        const color = this.fn_getTetherColor(unit);

        this.m_map.addSource(sourceId, {
            type: 'geojson',
            lineMetrics: true,
            data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                properties: { elevation: [0, 0] }
            }
        });

        // Dotted elevated trail: line-z-offset lifts it to drone altitude,
        // line-dasharray creates dot-like segments.  The line-z-offset
        // expression is updated per fn_DrawPath call to map each vertex's
        // actual distance-based progress to its elevation (see
        // fn_buildLineZOffsetExpr).
        this.m_map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'line-z-offset': 0,  // updated per fn_DrawPath
                'line-elevation-reference': 'sea',
                'line-elevation-ground-scale': 1.0  // scale z-offset with terrain exaggeration
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_TRAIL_WIDTH,
                'line-opacity': 0.85,
                'line-dasharray': [0.1, 3]
            }
        });

        this.m_pathSources.set(id, sourceId);
        this.m_pathLayers.set(id, layerId);
        this.m_pathData.set(id, { coords: [], elevations: [] });
    }

    /**
     * Adds a point to the unit's 3D flight path trail.
     * Called from js_main.js when the drone has moved > 10m.
     */
    fn_DrawPath(unit, lat, lng, altRelative) {
        if (!this.m_map || !this.m_isReady) return null;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const id = unit.getPartyID();
        this.fn_ensurePathTrailLayer(unit);

        // queryTerrainElevation() returns exaggerated elevation; divide by
        // exaggeration to get raw DEM value for line-elevation-ground-scale.
        const exag = this.m_terrainExaggeration || 1;
        const terrainElev = (typeof this.m_map.queryTerrainElevation === 'function')
            ? ((this.m_map.queryTerrainElevation([lng, lat]) || 0) / exag)
            : 0;
        const absAlt = terrainElev + (Number.isFinite(altRelative) ? altRelative : 0);

        const data = this.m_pathData.get(id);
        if (!data) return null;

        data.coords.push([lng, lat]);
        data.elevations.push(absAlt);

        const sourceId = this.m_pathSources.get(id);
        const layerId = this.m_pathLayers.get(id);
        const source = this.m_map.getSource(sourceId);
        if (!source) return null;

        source.setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: data.coords },
            properties: { elevation: data.elevations }
        });

        // Update line-z-offset to map each vertex's actual distance-based
        // progress to its elevation, so the trail passes through the correct
        // altitude at every recorded point regardless of spacing.
        if (layerId && this.m_map.getLayer(layerId)) {
            const zOffsetExpr = this.fn_buildLineZOffsetExpr(data.coords, data.elevations);
            this.m_map.setLayoutProperty(layerId, 'line-z-offset', zOffsetExpr);
        }

        return { sourceId, index: data.coords.length - 1 };
    }

    /**
     * Flushes (clears) the tether + ground circle + altitude circle + path trail
     * for a unit. Called when a unit is re-created.
     */
    fn_flushPath(unit) {
        const id = unit?.getPartyID?.();
        if (!id) return;

        // Clear tether line
        const sourceId = this.m_tetherSources.get(id);
        if (sourceId) {
            const source = this.m_map?.getSource(sourceId);
            if (source) {
                source.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                    properties: { elevation: [0, 0] }
                });
            }
        }

        // Clear ground circle
        const groundSourceId = this.m_groundSources.get(id);
        if (groundSourceId) {
            const groundSource = this.m_map?.getSource(groundSourceId);
            if (groundSource) {
                groundSource.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                    properties: {}
                });
            }
        }

        // Clear altitude circle
        const altSourceId = this.m_altCircleSources.get(id);
        const altLayerId = this.m_altCircleLayers.get(id);
        if (altSourceId) {
            const altSource = this.m_map?.getSource(altSourceId);
            if (altSource) {
                altSource.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                    properties: {}
                });
            }
        }
        if (altLayerId && this.m_map?.getLayer(altLayerId)) {
            this.m_map?.setLayoutProperty(altLayerId, 'line-z-offset', 0);
        }

        // Clear path trail
        const trailSourceId = this.m_pathSources.get(id);
        if (trailSourceId) {
            const trailSource = this.m_map?.getSource(trailSourceId);
            if (trailSource) {
                trailSource.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                    properties: { elevation: [0, 0] }
                });
            }
        }
        const data = this.m_pathData.get(id);
        if (data) {
            data.coords = [];
            data.elevations = [];
        }
    }

    // ====================================================================
    //  3D mission waypoints (read from unit)
    //  Mirrors the mission drawing done on the leaflet map in
    //  js_main.js#EVT_msgFromUnit_WayPoints: small marker per waypoint,
    //  an elevated line connecting them in sequence, and ground-draped
    //  rings for CIRCLE/loiter waypoints.
    // ====================================================================

    /**
     * Removes a Mapbox layer + its source, if present.
     */
    fn_removeLayerAndSource(layerId, sourceId) {
        if (!this.m_map) return;
        if (layerId && this.m_map.getLayer(layerId)) this.m_map.removeLayer(layerId);
        if (sourceId && this.m_map.getSource(sourceId)) this.m_map.removeSource(sourceId);
    }

    /**
     * Builds a Mapbox 'interpolate' expression for line-z-offset that maps
     * each vertex's actual cumulative-distance progress (line-progress) to
     * its elevation, so the line passes through the correct elevation at
     * every vertex — regardless of whether vertices are evenly spaced.
     *
     * The previous approach used at-interpolated(line-progress * (N-1),
     * elevation), which assumes uniform spacing.  With unevenly spaced
     * waypoints (the common case), line-progress at vertex i ≠ i/(N-1),
     * so the line interpolated between the wrong elevation values and
     * missed the markers at every interior vertex.
     *
     * @param {Array<[number,number]>} coords - GeoJSON [lng,lat] coordinates
     * @param {Array<number>} elevations - absolute MSL elevation per vertex
     * @returns {Array|number} Mapbox interpolate expression, or a constant
     *          if the line has < 2 vertices or zero total length.
     */
    fn_buildLineZOffsetExpr(coords, elevations) {
        if (!coords || coords.length < 2) return elevations?.[0] ?? 0;

        // Cumulative distance along the line (equirectangular approximation —
        // only relative proportions matter for the progress fractions).
        const dists = [0];
        let total = 0;
        for (let i = 1; i < coords.length; i++) {
            const lat = coords[i][1];
            const lng2m = 111320 * Math.cos(lat * Math.PI / 180);
            const dx = (coords[i][0] - coords[i - 1][0]) * lng2m;
            const dy = (coords[i][1] - coords[i - 1][1]) * 111320;
            total += Math.hypot(dx, dy);
            dists.push(total);
        }

        if (total === 0) return elevations[0] ?? 0;

        // ['interpolate', ['linear'], ['line-progress'], p0, e0, p1, e1, ...]
        const expr = ['interpolate', ['linear'], ['line-progress']];
        for (let i = 0; i < coords.length; i++) {
            expr.push(dists[i] / total);
            expr.push(elevations[i]);
        }
        return expr;
    }

    /**
     * Ensures the elevated mission-path line source + layer exist for a unit.
     * Uses line-z-offset with an interpolate expression (updated per data set
     * in fn_applyMissionElevation) so the line passes through each waypoint's
     * correct elevation regardless of spacing.
     */
    fn_ensureMissionLineLayer(unit, color) {
        if (!this.m_map || !this.m_isReady) return;
        const id = unit.getPartyID();
        if (this.m_missionLineSources.has(id)) return;

        const sourceId = `de-mission-line-${id}`;
        const layerId = `de-mission-line-layer-${id}`;

        this.m_map.addSource(sourceId, {
            type: 'geojson',
            lineMetrics: true,
            data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                properties: { elevation: [0, 0] }
            }
        });

        this.m_map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'line-z-offset': 0,  // updated per fn_applyMissionElevation
                'line-elevation-reference': 'sea',
                'line-elevation-ground-scale': 1.0  // scale z-offset with terrain exaggeration
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_TRAIL_WIDTH,
                'line-opacity': 0.7,
                'line-dasharray': [2, 1]
            }
        });

        this.m_missionLineSources.set(id, sourceId);
        this.m_missionLineLayers.set(id, layerId);
    }

    /**
     * Ensures the waypoint drop-line source + layer exist for a unit.
     * Holds a FeatureCollection of 2-vertex LineStrings (one per waypoint),
     * each going from the ground up to the waypoint's planned altitude.
     * Uses the same line-z-offset + at-interpolated mechanism as the tether
     * line, evaluated per-feature so every drop line rises independently.
     */
    fn_ensureMissionDropLayer(unit, color) {
        if (!this.m_map || !this.m_isReady) return;
        const id = unit.getPartyID();
        if (this.m_missionDropSources.has(id)) return;

        const sourceId = `de-mission-drop-${id}`;
        const layerId = `de-mission-drop-layer-${id}`;

        this.m_map.addSource(sourceId, {
            type: 'geojson',
            lineMetrics: true,
            data: { type: 'FeatureCollection', features: [] }
        });

        this.m_map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'line-z-offset': [
                    'at-interpolated',
                    ['line-progress'],
                    ['get', 'elevation']
                ],
                'line-elevation-reference': 'sea',
                'line-elevation-ground-scale': 1.0  // scale z-offset with terrain exaggeration
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_MISSION_DROP_WIDTH,
                'line-opacity': 0.5,
                'line-dasharray': [1, 1]
            }
        });

        this.m_missionDropSources.set(id, sourceId);
        this.m_missionDropLayers.set(id, layerId);
    }

    /**
     * Ensures the vertical gate-ring source + layer exist for a unit.
     * Holds a FeatureCollection of LineStrings (one closed ring per interior
     * waypoint).  Ring points are uniformly spaced, so at-interpolated on
     * line-progress maps correctly per-feature (each feature has its own
     * 'elevation' array).
     */
    fn_ensureMissionGateLayer(unit, color) {
        if (!this.m_map || !this.m_isReady) return;
        const id = unit.getPartyID();
        if (this.m_missionGateSources.has(id)) return;

        const sourceId = `de-mission-gate-${id}`;
        const layerId = `de-mission-gate-layer-${id}`;

        this.m_map.addSource(sourceId, {
            type: 'geojson',
            lineMetrics: true,
            data: { type: 'FeatureCollection', features: [] }
        });

        this.m_map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'line-z-offset': [
                    'at-interpolated',
                    ['*', ['line-progress'], ['-', ['length', ['get', 'elevation']], 1]],
                    ['get', 'elevation']
                ],
                'line-elevation-reference': 'sea',
                'line-elevation-ground-scale': 1.0  // scale z-offset with terrain exaggeration
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_GATE_WIDTH,
                'line-opacity': 0.8
            }
        });

        this.m_missionGateSources.set(id, sourceId);
        this.m_missionGateLayers.set(id, layerId);
    }

    /**
     * Ensures the ground-circle source + layer exist for a unit.
     * Holds a FeatureCollection of closed LineString rings (one per waypoint
     * drop-line base).  No z-offset → drapes flat on the terrain surface,
     * same style as the drone's ground circle.
     */
    fn_ensureMissionGroundCircleLayer(unit, color) {
        if (!this.m_map || !this.m_isReady) return;
        const id = unit.getPartyID();
        if (this.m_missionGroundSources.has(id)) return;

        const sourceId = `de-mission-ground-${id}`;
        const layerId = `de-mission-ground-layer-${id}`;

        this.m_map.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        this.m_map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
                // No line-z-offset / line-elevation-reference => drapes on terrain.
            },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_CIRCLE_WIDTH,
                'line-opacity': 0.9
            }
        });

        this.m_missionGroundSources.set(id, sourceId);
        this.m_missionGroundLayers.set(id, layerId);
    }

    /**
     * Draws a ground-draped loiter ring for a CIRCLE waypoint. Each ring gets
     * its own source/layer (count varies per mission) tracked in
     * m_missionCircleIds so fn_clearMissionWaypoints can remove them all.
     */
    fn_drawMissionCircleRing(unit, lat, lng, radiusMeters, color, seq) {
        if (!this.m_map || !this.m_isReady) return;
        const id = unit.getPartyID();

        const sourceId = `de-mission-circle-${id}-${seq}`;
        const layerId = `${sourceId}-layer`;
        if (this.m_map.getSource(sourceId)) return;  // already drawn this pass

        this.m_map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: this.fn_generateCircleRing(lng, lat, radiusMeters)
                },
                properties: {}
            }
        });

        this.m_map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': color,
                'line-width': js_globals.CONST_MAP3D_CIRCLE_WIDTH,
                'line-opacity': 0.8
            }
        });

        const circles = this.m_missionCircleIds.get(id) || [];
        circles.push({ sourceId, layerId });
        this.m_missionCircleIds.set(id, circles);
    }

    /**
     * Creates a small DOM marker for a mission waypoint (colored dot),
     * elevated to the waypoint's planned altitude above terrain.
     */
    fn_createMissionWaypointMarker(lng, lat, altRelative, color, label) {
        const el = document.createElement('div');
        el.className = 'css_map3d_mission_marker';
        el.title = label || '';
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '50%';
        el.style.background = color;
        el.style.border = '2px solid #fff';
        el.style.boxShadow = '0 0 2px rgba(0,0,0,0.6)';

        const marker = new window.mapboxgl.Marker({
            element: el,
            anchor: 'center',
            pitchAlignment: 'viewport',
            rotationAlignment: 'viewport'
        })
        .setLngLat([lng, lat])
        .addTo(this.m_map);

        if (Number.isFinite(altRelative) && typeof marker.setAltitude === 'function') {
            // Scale by terrain exaggeration to match elevated lines (see
            // fn_syncUnit for the same rationale).
            marker.setAltitude(altRelative * this.m_terrainExaggeration);
        }

        return marker;
    }

    /**
     * Clears all mission waypoint graphics (markers, path line, loiter rings)
     * for a unit. Called before re-drawing on every fresh WayPoints message,
     * and when the mission is deleted.
     */
    fn_clearMissionWaypoints(unit) {
        const id = unit?.getPartyID?.();
        if (!id) return;

        // Note: we do NOT delete m_missionData here — this is called to clear
        // the *graphics* before redrawing.  The store is cleared only by
        // fn_syncMissionWaypoints when an empty array arrives (mission deleted).

        // Remove waypoint markers (interior entries are null — gate rings
        // replace dot markers there — so guard before calling .remove()).
        const markers = this.m_missionMarkers.get(id);
        if (markers) {
            markers.forEach(marker => marker && marker.remove());
        }
        this.m_missionMarkers.set(id, []);

        // Reset mission path line (keep source/layer, just clear geometry)
        const lineSourceId = this.m_missionLineSources.get(id);
        const lineSource = this.m_map?.getSource(lineSourceId);
        if (lineSource) {
            lineSource.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
                properties: { elevation: [0, 0] }
            });
        }

        // Reset waypoint drop lines (keep source/layer, just clear geometry)
        const dropSourceId = this.m_missionDropSources.get(id);
        const dropSource = this.m_map?.getSource(dropSourceId);
        if (dropSource) {
            dropSource.setData({ type: 'FeatureCollection', features: [] });
        }

        // Reset gate rings (keep source/layer, just clear geometry)
        const gateSourceId = this.m_missionGateSources.get(id);
        const gateSource = this.m_map?.getSource(gateSourceId);
        if (gateSource) {
            gateSource.setData({ type: 'FeatureCollection', features: [] });
        }

        // Reset ground circles (keep source/layer, just clear geometry)
        const groundSourceId = this.m_missionGroundSources.get(id);
        const groundSource = this.m_map?.getSource(groundSourceId);
        if (groundSource) {
            groundSource.setData({ type: 'FeatureCollection', features: [] });
        }

        // Remove loiter circle rings (dynamic count per sync)
        const circles = this.m_missionCircleIds.get(id);
        if (circles) {
            circles.forEach(({ sourceId, layerId }) => this.fn_removeLayerAndSource(layerId, sourceId));
        }
        this.m_missionCircleIds.set(id, []);
    }

    /**
     * Syncs (redraws) a unit's mission waypoints on the 3D map: markers at
     * each waypoint's planned altitude, an elevated connecting path, and
     * ground rings for loiter/CIRCLE waypoints. Mirrors the leaflet drawing
     * in js_main.js#EVT_msgFromUnit_WayPoints.
     * @param {*} unit
     * @param {Array} wayPointArray - array of wayPointStep objects (Latitude/
     *        Longitude/Altitude/waypointType/m_Radius/m_Sequence/m_label)
     * @param {string} [color] - path/marker color; defaults to the unit's tether color
     */
    fn_syncMissionWaypoints(unit, wayPointArray, color) {
        const id = unit?.getPartyID?.();
        if (!id) return;

        // Always store the latest mission so it can be replayed when the map
        // becomes ready or the 3D tab is shown.  Without this, a mission that
        // arrives while the map is still loading (or while the 3D view is
        // hidden) is lost forever — fn_syncMissionWaypoints would have early-
        // returned and there'd be nothing to redraw later.
        if (!Array.isArray(wayPointArray) || wayPointArray.length === 0) {
            this.m_missionData.delete(id);
            this.fn_clearMissionWaypoints(unit);
            return;
        }
        this.m_missionData.set(id, { wayPointArray, color });

        // If the map isn't ready yet (still loading, or 3D never opened),
        // just store — fn_show() / the 'load' handler will replay it.
        if (!this.m_map || !this.m_isReady) return;

        this.fn_drawMission(unit, wayPointArray, color);
    }

    /**
     * Internal: actually draws markers, line, and loiter rings for a mission.
     * Called by fn_syncMissionWaypoints (live) and by fn_replayMissions
     * (after map load / when 3D tab is shown).  Assumes map is ready.
     *
     * Altitude model (same as the drone's tether in fn_syncTether):
     *   - Item #0 (home) is on the ground → relative alt = 0.
     *   - Every other item's Altitude is relative-to-home → used directly as
     *     the height above terrain for the marker (Marker#setAltitude is
     *     terrain-relative, exactly like the drone marker).
     *   - The connecting line uses line-elevation-reference:'sea', so each
     *     vertex's absolute height = terrainElev(at that point) + relativeAlt,
     *     matching the drone's `droneAlt = terrainElev + altRelative` pattern.
     */
    fn_drawMission(unit, wayPointArray, color) {
        const id = unit.getPartyID();
        const pathColor = color || this.fn_getTetherColor(unit);

        this.fn_clearMissionWaypoints(unit);
        this.fn_ensureMissionLineLayer(unit, pathColor);
        this.fn_ensureMissionDropLayer(unit, pathColor);
        this.fn_ensureMissionGateLayer(unit, pathColor);
        this.fn_ensureMissionGroundCircleLayer(unit, pathColor);

        // Only keep steps with a valid position — markers[] stays index-aligned
        // with validSteps[] so fn_applyMissionElevation can re-run later.
        const validSteps = wayPointArray.filter(w => Number.isFinite(w.Latitude) && Number.isFinite(w.Longitude));
        if (validSteps.length === 0) return;

        const lastIdx = validSteps.length - 1;
        // Dot markers for first (home) and last waypoints only; interior
        // waypoints are represented by vertical gate rings (built in
        // fn_applyMissionElevation).  markers[i] is null for interior
        // waypoints so fn_applyMissionElevation skips marker altitude updates.
        const markers = validSteps.map((wayPointStep, i) => {
            if (i !== 0 && i !== lastIdx) return null;
            const label = `${unit.m_unitName || id} - ${wayPointStep.m_label || 'WP'} #${wayPointStep.m_Sequence ?? ''}`;
            const relAlt = (i === 0) ? 0 : (Number.isFinite(wayPointStep.Altitude) ? wayPointStep.Altitude : 0);
            return this.fn_createMissionWaypointMarker(wayPointStep.Longitude, wayPointStep.Latitude, relAlt, pathColor, label);
        });
        this.m_missionMarkers.set(id, markers);

        validSteps.forEach((wayPointStep) => {
            if (wayPointStep.waypointType === js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE) {
                this.fn_drawMissionCircleRing(unit, wayPointStep.Latitude, wayPointStep.Longitude, wayPointStep.m_Radius, pathColor, wayPointStep.m_Sequence);
            }
        });

        // Guards against a slower, stale retry chain (below) overwriting a
        // newer sync's line/markers if fn_syncMissionWaypoints is called
        // again for this unit before the previous retries finish.
        const generation = (this.m_missionSyncGeneration.get(id) || 0) + 1;
        this.m_missionSyncGeneration.set(id, generation);

        // Apply elevation now (best-effort paint), then keep re-applying
        // whenever DEM source data loads until every waypoint's terrain
        // height actually resolves.  Uses the 'sourcedata' event (fired
        // when DEM tiles arrive) instead of blind polling — more reliable
        // than setTimeout retries, which can miss the window where
        // queryTerrainElevation() transitions from null to a real value.
        this.fn_applyMissionElevation(unit, validSteps, markers, generation);
        this.fn_ensureBoundsVisible(validSteps, () => {
            this.fn_watchTerrainForMission(unit, validSteps, markers, generation);
        });
    }

    /**
     * Sets up a 'sourcedata' listener on the DEM source that re-applies
     * mission elevations whenever terrain tiles load, until all waypoints
     * resolve or a timeout fires.  Cleans up the listener once resolved.
     * Aborts silently if a newer sync has started (generation mismatch).
     */
    fn_watchTerrainForMission(unit, validSteps, markers, generation) {
        if (!this.m_map) return;
        const id = unit.getPartyID();

        // First try immediately — tiles may have loaded during fitBounds.
        const resolved = this.fn_applyMissionElevation(unit, validSteps, markers, generation);
        if (resolved) return;

        // Re-apply on every DEM sourcedata event until all resolved.
        const onSourceData = (e) => {
            if (e.sourceId !== 'mapbox-dem') return;
            if (this.m_missionSyncGeneration.get(id) !== generation) {
                this.m_map.off('sourcedata', onSourceData);
                return;
            }
            const done = this.fn_applyMissionElevation(unit, validSteps, markers, generation);
            if (done) {
                this.m_map.off('sourcedata', onSourceData);
            }
        };
        this.m_map.on('sourcedata', onSourceData);

        // Fallback: if no sourcedata event fires within 15s (e.g. all tiles
        // already cached but queryTerrainElevation still returns null/0),
        // do a few final attempts then give up and clean up the listener.
        let attempts = 0;
        const fallbackTimer = setInterval(() => {
            attempts++;
            if (!this.m_map || this.m_missionSyncGeneration.get(id) !== generation) {
                clearInterval(fallbackTimer);
                this.m_map?.off('sourcedata', onSourceData);
                return;
            }
            const done = this.fn_applyMissionElevation(unit, validSteps, markers, generation);
            if (done || attempts >= 10) {
                clearInterval(fallbackTimer);
                this.m_map.off('sourcedata', onSourceData);
            }
        }, 1000);
    }

    /**
     * Replays all stored missions onto the map.  Called after the map finishes
     * loading and whenever the 3D tab is shown (fn_show), so missions that
     * arrived while the map wasn't ready or was hidden get drawn.
     */
    fn_replayMissions() {
        if (!this.m_map || !this.m_isReady) return;
        this.m_missionData.forEach(({ wayPointArray, color }, id) => {
            // Need the unit object — look it up from the global unit list.
            const unit = js_globals.m_andruavUnitList?.fn_getUnit(id);
            if (unit) {
                this.fn_drawMission(unit, wayPointArray, color);
            }
        });
    }

    /**
     * Ensures the map camera covers all given waypoints' [lng,lat] positions
     * (so their terrain DEM tiles get requested/loaded), fitting the view if
     * any fall outside the current bounds. Calls p_onSettled once done (either
     * immediately, if nothing needed to change, or after the fit + idle).
     */
    fn_ensureBoundsVisible(validSteps, p_onSettled) {
        if (!this.m_map || !window.mapboxgl || validSteps.length === 0) {
            p_onSettled();
            return;
        }

        const currentBounds = this.m_map.getBounds();
        const allVisible = validSteps.every(w => currentBounds.contains([w.Longitude, w.Latitude]));
        if (allVisible) {
            // Even when all waypoints are visible, wait for 'idle' so DEM
            // tiles have a chance to load before we query terrain elevation.
            this.m_map.once('idle', p_onSettled);
            return;
        }

        const bounds = new window.mapboxgl.LngLatBounds();
        validSteps.forEach(w => bounds.extend([w.Longitude, w.Latitude]));

        this.m_map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 18 });
        this.m_map.once('idle', p_onSettled);
    }

    /**
     * (Re-)applies elevation to a unit's mission markers + connecting line,
     * using each waypoint's planned altitude. Safe to call multiple times
     * (e.g. while polling for terrain DEM tiles to finish loading — see
     * fn_scheduleMissionElevationRetry).
     *
     * Uses the same altitude model as the drone's tether (fn_syncTether):
     *   - Marker#setAltitude(relAlt)  — terrain-relative, just like the drone.
     *   - Line vertex elevation = terrainElev(at that point) + relAlt  — absolute
     *     MSL for line-elevation-reference:'sea', matching droneAlt = terrainElev
     *     + altRelative.
     * Home (item #0) has relAlt = 0 (on the ground); every other item's relAlt
     * is its own Altitude value (already relative-to-home from the FC).
     *
     * queryTerrainElevation() returns null while the DEM tile for a point
     * hasn't loaded yet — we treat that as "unresolved" and keep the marker
     * at its initial relAlt (best-effort) until the tile arrives, then the
     * line elevation gets the correct terrainElev + relAlt value.
     * @returns {boolean} true if every waypoint's terrain height was actually
     *          resolved (queryTerrainElevation didn't return null for any);
     *          false if some still need a retry.
     */
    fn_applyMissionElevation(unit, validSteps, markers, generation) {
        if (!this.m_map || !this.m_isReady) return true;
        if (!validSteps || validSteps.length === 0) return true;

        const id = unit.getPartyID();
        if (generation !== undefined && this.m_missionSyncGeneration.get(id) !== generation) return true;  // superseded

        const lastIdx = validSteps.length - 1;
        const lineCoords = [];
        const lineElevations = [];
        const dropFeatures = [];
        const gateFeatures = [];
        const groundCircleFeatures = [];
        // Mapbox line layers need non-zero horizontal length to render — a
        // LineString with two identical [lng,lat] points is invisible. We
        // offset the top point by a tiny amount (~1m north) so each drop line
        // has horizontal extent to draw, while line-z-offset provides the
        // vertical component. At any realistic zoom this looks perfectly
        // vertical. (Same trick as the drone tether line in fn_syncTether.)
        const DROP_TINY_OFFSET = 0.00001;  // ~1 meter in degrees
        const GATE_RADIUS = js_globals.CONST_MAP3D_GATE_RADIUS;
        const GROUND_RADIUS = js_globals.CONST_MAP3D_WP_GROUND_RADIUS;
        let allResolved = true;

        validSteps.forEach((wayPointStep, i) => {
            const lat = wayPointStep.Latitude;
            const lng = wayPointStep.Longitude;
            // Home (i===0) is on the ground; others are relative-to-home.
            const relAlt = (i === 0) ? 0 : (Number.isFinite(wayPointStep.Altitude) ? wayPointStep.Altitude : 0);

            // queryTerrainElevation() returns null (not 0) when the DEM tile
            // for this point hasn't loaded yet.  It also returns the
            // EXAGGERATED elevation (raw DEM × exaggeration); we divide by
            // exaggeration to get the raw value, since our line layers use
            // line-elevation-ground-scale:1.0 which scales the z-offset by
            // exaggeration (avoiding double-scaling).
            const exag = this.m_terrainExaggeration || 1;
            let localTerrainElev = null;
            if (typeof this.m_map.queryTerrainElevation === 'function') {
                const queried = this.m_map.queryTerrainElevation([lng, lat]);
                localTerrainElev = (queried === null || queried === undefined) ? null : queried / exag;
            }

            // Marker: terrain-relative altitude (same as drone marker).
            // Only first/last have dot markers; interior are null.
            // Scale by terrain exaggeration to match elevated lines.
            const marker = markers[i];
            if (marker && typeof marker.setAltitude === 'function') {
                marker.setAltitude(relAlt * this.m_terrainExaggeration);
            }

            // Line: absolute MSL = terrainElev + relAlt (same as droneAlt).
            // If terrain hasn't resolved yet, use relAlt alone as best-effort
            // (marker is already at relAlt above terrain, so the line roughly
            // tracks it) and mark for retry.
            let topElev;
            let groundElev;
            if (localTerrainElev === null || localTerrainElev === undefined) {
                allResolved = false;
                topElev = relAlt;
                groundElev = 0;
                lineElevations.push(relAlt);
            } else {
                topElev = localTerrainElev + relAlt;
                groundElev = localTerrainElev;
                lineElevations.push(localTerrainElev + relAlt);
            }

            lineCoords.push([lng, lat]);

            // Drop line + ground circle: for every waypoint above ground.
            if (i > 0 && relAlt > 0) {
                dropFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [[lng, lat], [lng, lat + DROP_TINY_OFFSET]]
                    },
                    properties: { elevation: [groundElev, topElev] }
                });

                // Ground circle at the drop line base — same style as the
                // drone's ground circle (horizontal ring draping on terrain).
                groundCircleFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: this.fn_generateCircleRing(lng, lat, GROUND_RADIUS)
                    },
                    properties: {}
                });
            }

            // Gate ring: vertical ring at interior waypoints, facing the line
            // direction.  First and last keep their dot markers instead.
            if (i > 0 && i < lastIdx) {
                // Bearing at this waypoint: bisector of incoming and outgoing
                // segments, computed via vector averaging to handle wrap-around.
                const prev = validSteps[i - 1];
                const next = validSteps[i + 1];
                const bIn = this.fn_bearing(prev.Latitude, prev.Longitude, lat, lng);
                const bOut = this.fn_bearing(lat, lng, next.Latitude, next.Longitude);
                const avgRad = Math.atan2(
                    Math.sin(bIn * Math.PI / 180) + Math.sin(bOut * Math.PI / 180),
                    Math.cos(bIn * Math.PI / 180) + Math.cos(bOut * Math.PI / 180)
                );
                const bearingDeg = avgRad * 180 / Math.PI;

                const ring = this.fn_generateVerticalRing(lng, lat, topElev, bearingDeg, GATE_RADIUS);
                gateFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: ring.coords
                    },
                    properties: { elevation: ring.elevations }
                });
            }
        });

        if (lineCoords.length >= 2) {
            const lineSourceId = this.m_missionLineSources.get(id);
            const lineLayerId = this.m_missionLineLayers.get(id);
            const lineSource = this.m_map.getSource(lineSourceId);
            if (lineSource) {
                lineSource.setData({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: lineCoords },
                    properties: { elevation: lineElevations }
                });
            }
            // Update line-z-offset with an interpolate expression that maps
            // each vertex's actual distance-based progress to its elevation.
            // This ensures the line passes through the correct elevation at
            // every waypoint, regardless of uneven spacing.  (The previous
            // at-interpolated(line-progress * (N-1), elevation) assumed uniform
            // spacing and missed every interior marker.)
            if (lineLayerId && this.m_map.getLayer(lineLayerId)) {
                const zOffsetExpr = this.fn_buildLineZOffsetExpr(lineCoords, lineElevations);
                this.m_map.setLayoutProperty(lineLayerId, 'line-z-offset', zOffsetExpr);
            }
        }

        // Update waypoint drop lines (one FeatureCollection of 2-vertex
        // LineStrings). Each feature's elevation array is evaluated
        // independently by line-progress, so every drop line rises from
        // the ground up to its own waypoint altitude.
        const dropSourceId = this.m_missionDropSources.get(id);
        const dropSource = this.m_map.getSource(dropSourceId);
        if (dropSource) {
            dropSource.setData({ type: 'FeatureCollection', features: dropFeatures });
        }

        // Update gate rings (FeatureCollection of vertical ring LineStrings).
        // Ring points are uniformly spaced, so at-interpolated on line-progress
        // maps correctly per-feature (each feature has its own elevation array).
        const gateSourceId = this.m_missionGateSources.get(id);
        const gateSource = this.m_map.getSource(gateSourceId);
        if (gateSource) {
            gateSource.setData({ type: 'FeatureCollection', features: gateFeatures });
        }

        // Update ground circles (FeatureCollection of horizontal LineString
        // rings).  No z-offset → drapes flat on the terrain surface.
        const groundSourceId = this.m_missionGroundSources.get(id);
        const groundSource = this.m_map.getSource(groundSourceId);
        if (groundSource) {
            groundSource.setData({ type: 'FeatureCollection', features: groundCircleFeatures });
        }

        return allResolved;
    }

    /**
     * Removes a marker (or any object with a .remove() method) from the
     * map.  Mirrors js_leafletmap.fn_hideItem.
     */
    fn_hideItem(item) {
        if (item && typeof item.remove === 'function') {
            item.remove();
        }
    }

    // ---- Guided-target ground marker (circle + crosshair) ----
    // Drawn on dblclick instead of a DOM marker pin.  Uses a single
    // GeoJSON source + line layer, terrain-draped (no elevation), so the
    // circle sits flat on the ground and the + cross marks the exact
    // clicked point.
    static TARGET_MARKER_SOURCE = 'de-target-marker-src';
    static TARGET_MARKER_LAYER  = 'de-target-marker-layer';
    static TARGET_MARKER_RADIUS = 10;   // circle radius + cross arm length (meters)
    static TARGET_MARKER_COLOR  = '#ffcc00';
    static TARGET_MARKER_WIDTH  = 3;

    /**
     * Draws (or replaces) the guided-target ground marker: a circle with
     * a + crosshair at its center, draped on the terrain.
     * @param {number} lat
     * @param {number} lng
     */
    fn_drawTargetMarker(lat, lng) {
        if (!this.m_map || !this.m_isReady) return;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        // Remove any previous target marker.
        this.fn_clearTargetMarker();

        const R = CAndruavMap3D.TARGET_MARKER_RADIUS;
        const ringCoords = this.fn_generateCircleRing(lng, lat, R);

        // Crosshair: two short line segments (N-S and E-W) through center.
        const latRad = lat * Math.PI / 180;
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos(latRad);
        const dLng = R / metersPerDegLng;
        const dLat = R / metersPerDegLat;
        const crossH = [[lng - dLng, lat], [lng + dLng, lat]];   // horizontal (E-W)
        const crossV = [[lng, lat - dLat], [lng, lat + dLat]];   // vertical (N-S)

        this.m_map.addSource(CAndruavMap3D.TARGET_MARKER_SOURCE, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: ringCoords }, properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: crossH },    properties: {} },
                    { type: 'Feature', geometry: { type: 'LineString', coordinates: crossV },    properties: {} }
                ]
            }
        });

        this.m_map.addLayer({
            id: CAndruavMap3D.TARGET_MARKER_LAYER,
            type: 'line',
            source: CAndruavMap3D.TARGET_MARKER_SOURCE,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
                // No line-z-offset / line-elevation-reference => drapes on terrain.
            },
            paint: {
                'line-color': CAndruavMap3D.TARGET_MARKER_COLOR,
                'line-width': CAndruavMap3D.TARGET_MARKER_WIDTH,
                'line-opacity': 0.9
            }
        });
    }

    /**
     * Removes the guided-target ground marker if present.
     */
    fn_clearTargetMarker() {
        if (!this.m_map) return;
        this.fn_removeLayerAndSource(
            CAndruavMap3D.TARGET_MARKER_LAYER,
            CAndruavMap3D.TARGET_MARKER_SOURCE
        );
    }

    /**
     * Pans the map to the specified latitude and longitude coordinates.
     * @param {number} lat - Latitude coordinate
     * @param {number} lng - Longitude coordinate
     */
    fn_PanTo_latlng(lat, lng) {
        if (!this.m_map) return;
        this.m_map.easeTo({ center: [lng, lat], duration: 500 });
    }

    /**
     * Instantly re-centers the 3D map (no animation). Used to sync the 3D
     * map's start location with the leaflet map when switching to the 3D tab,
     * so the 3D map does not stay stuck at its hardcoded initial center.
     * @param {number} lat - Latitude coordinate
     * @param {number} lng - Longitude coordinate
     */
    fn_syncCenter(lat, lng) {
        if (!this.m_map || !this.m_isReady) return;
        this.m_map.jumpTo({ center: [lng, lat] });
    }

}

export const js_map3d = new CAndruavMap3D();
