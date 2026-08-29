import * as js_siteConfig from '../js_siteConfig';
import { js_globals } from '../js_globals.js';
import * as js_andruavMessages from '../protocol/messages/js_andruavMessages.js';

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

class CAndruavMap3D {
    constructor() {
        this.m_map = null;
        this.m_isReady = false;
        this.m_markers = new Map();
        this.m_isVisible = false;
        this.m_hasAutoFocusedUnit = false;
        this.m_mapDblClickCallbacks = [];
        this.m_isMapDblClickBound = false;

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
     * Shows a popup at the given location.
     * @returns {mapboxgl.Popup | null}
     */
    fn_showInfoWindow(p_infoWindow, p_content, p_lat, p_lng) {
        if (!this.m_map) return null;

        this.fn_hideInfoWindow(p_infoWindow);

        const popup = new window.mapboxgl.Popup({ closeOnClick: true })
            .setLngLat([p_lng, p_lat]);

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
     * @returns {mapboxgl.Popup | null}
     */
    fn_bindPopup(p_infoWindow, p_content, p_lat, p_lng) {
        if (!p_infoWindow) return null;

        if (typeof p_lat === 'number' && typeof p_lng === 'number') {
            p_infoWindow.setLngLat([p_lng, p_lat]);
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
        });

        this.m_map.on('load', () => {
            this.m_isReady = true;
            if (this.m_isVisible) this.m_map.resize();
            // Draw any missions that arrived while the map was still loading.
            this.fn_replayMissions();
        });

        // Add the terrain exaggeration control (x1 / x2 / x5 buttons).
        this.m_map.addControl(new TerrainExaggerationControl(this), 'bottom-right');
    }

    /**
     * Changes the terrain exaggeration factor.  Called by the
     * TerrainExaggerationControl buttons.
     *
     * No need to re-apply line/marker elevations: all elevated line layers
     * use line-elevation-ground-scale:1.0, so Mapbox scales their z-offset
     * with the terrain exaggeration automatically (added in GL JS v3.19).
     * Marker#setAltitude() is terrain-relative, so markers also scale
     * automatically.
     * @param {number} factor - new exaggeration (1.0 = natural, 2.0 = 2x, etc.)
     */
    fn_setTerrainExaggeration(factor) {
        if (!this.m_map || !this.m_isReady) return;
        this.m_terrainExaggeration = factor;
        this.m_map.setTerrain({
            source: 'mapbox-dem',
            exaggeration: factor
        });
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

                    // Re-apply the last icon URL (stored on the marker instance)
                    if (marker._lastIconUrl) {
                        const iconEl = marker.getElement?.()?.querySelector('.css_map3d_marker_icon');
                        if (iconEl) iconEl.style.backgroundImage = `url('${marker._lastIconUrl}')`;
                    }
                });

                // Re-draw any missions that were stored while the 3D tab was
                // hidden — markers created against a zero-size container don't
                // project correctly, so we replay them now that it's visible.
                this.fn_replayMissions();
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

    fn_getUnitMarker(unit) {
        return unit ? this.m_markers.get(unit.getPartyID()) ?? null : null;
    }

    /**
     * Sets/updates a marker's icon image and remembers it so fn_show() can re-apply it.
     */
    fn_setMarkerIcon(marker, markerIconUrl) {
        if (!marker || !markerIconUrl) return;

        marker._lastIconUrl = markerIconUrl;
        const iconEl = marker.getElement?.()?.querySelector('.css_map3d_marker_icon');
        if (iconEl) {
            iconEl.style.backgroundImage = `url('${markerIconUrl}')`;
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
        if (!this.m_map || !this.m_isReady || !unit?.m_Nav_Info?.p_Location) return;

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
        if (Number.isFinite(altRelative) && typeof marker.setAltitude === 'function') {
            marker.setAltitude(altRelative);
        }

        this.m_markers.set(id, marker);

        // Update icon if provided — store last URL so fn_show can re-apply it
        this.fn_setMarkerIcon(marker, markerIconUrl);

        // Auto-focus first unit
        if (!this.m_hasAutoFocusedUnit) {
            this.m_hasAutoFocusedUnit = true;
            this.m_map.easeTo({ center: [lng, lat], duration: 500, pitch: 53 });
        }

        // Apply yaw rotation (in degrees)
        const yaw = unit?.m_Nav_Info?.p_Orientation?.yaw;
        if (Number.isFinite(yaw)) {
            const deg = (yaw * 180 / Math.PI) % 360;
            const normalizedYaw = (deg + 360) % 360;

            if (typeof marker.setRotation === 'function') {
                marker.setRotation(normalizedYaw);
            } else {
                // Fallback: rotate icon element
                const iconEl = marker.getElement()?.querySelector('.css_map3d_marker_icon');
                iconEl?.style.setProperty('transform', `rotate(${normalizedYaw}deg)`);
            }
        }

        // Update the 3D tether line (vertical line from drone down to ground).
        this.fn_syncTether(unit, lat, lng, altRelative);

        return marker;
    }

    // ====================================================================
    //  3D tether line (drone → ground)
    //  A vertical line from the drone's 3D position straight down to the
    //  terrain surface below it. Updated on every fn_syncUnit so it's always
    //  visible — even when the drone is stationary on the ground.
    //  Uses line-z-offset + line-elevation-reference:'sea' (>= v3.8).
    // ====================================================================

    /**
     * Returns the tether color for a unit based on its index.
     */
    fn_getTetherColor(unit) {
        const idx = unit?.m_index ?? 0;
        const colors = js_globals.CONST_MAP3D_TETHER_COLORS;
        return colors[idx % colors.length];
    }

    /**
     * Ensures a GeoJSON source + elevated line layer exist for a unit's tether,
     * plus a ground circle source + layer. Called on first fn_syncTether.
     */
    fn_ensureTetherLayer(unit) {
        if (!this.m_map || !this.m_isReady) return;
        const id = unit.getPartyID();
        if (this.m_tetherSources.has(id)) return;

        const sourceId = `de-tether-${id}`;
        const layerId = `de-tether-layer-${id}`;
        const groundSourceId = `de-ground-${id}`;
        const groundLayerId = `de-ground-layer-${id}`;
        const color = this.fn_getTetherColor(unit);

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
                'line-width': js_globals.CONST_MAP3D_TETHER_WIDTH,
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
     * Updates the tether line + ground circle + altitude circle for a unit.
     * Called from fn_syncUnit on every telemetry update.
     */
    fn_syncTether(unit, lat, lng, altRelative) {
        if (!this.m_map || !this.m_isReady) return;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const id = unit.getPartyID();
        this.fn_ensureTetherLayer(unit);

        // Terrain elevation at the drone's position (meters above sea level).
        const terrainElev = (typeof this.m_map.queryTerrainElevation === 'function')
            ? (this.m_map.queryTerrainElevation([lng, lat]) || 0)
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
        if (altSource && altLayerId) {
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

        const terrainElev = (typeof this.m_map.queryTerrainElevation === 'function')
            ? (this.m_map.queryTerrainElevation([lng, lat]) || 0)
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
        if (layerId) {
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
        if (altLayerId) {
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
            marker.setAltitude(altRelative);
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

        // Remove waypoint markers
        const markers = this.m_missionMarkers.get(id);
        if (markers) {
            markers.forEach(marker => marker.remove());
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
            // for this point hasn't loaded yet.
            let localTerrainElev = null;
            if (typeof this.m_map.queryTerrainElevation === 'function') {
                localTerrainElev = this.m_map.queryTerrainElevation([lng, lat]);
            }

            // Marker: terrain-relative altitude (same as drone marker).
            // Only first/last have dot markers; interior are null.
            const marker = markers[i];
            if (marker && typeof marker.setAltitude === 'function') {
                marker.setAltitude(relAlt);
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
            if (lineLayerId) {
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
     * Compatibility stub for the circular buffer callback.
     */
    fn_hideItem(item) {
        // No-op
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

}

export const js_map3d = new CAndruavMap3D();
