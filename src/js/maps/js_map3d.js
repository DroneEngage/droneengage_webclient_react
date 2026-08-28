import * as js_siteConfig from '../js_siteConfig';

class CAndruavMap3D {
    constructor() {
        this.m_map = null;
        this.m_isReady = false;
        this.m_markers = new Map();
        this.m_isVisible = false;
        this.m_hasAutoFocusedUnit = false;
        this.m_mapDblClickCallbacks = [];
        this.m_isMapDblClickBound = false;

        // ---- 3D tether line + ground circle + path trail ----
        // - Path trail: elevated dotted line along the drone's flight path
        // - Tether: solid vertical line from drone down to ground
        // - Ground circle: circle on terrain marking drone's ground projection
        // All use line-z-offset + line-elevation-reference:'sea' (>= v3.8).
        this.m_tetherSources = new Map();  // unitId -> sourceId (vertical line)
        this.m_tetherLayers = new Map();   // unitId -> layerId
        this.m_groundSources = new Map();  // unitId -> sourceId (ground circle)
        this.m_groundLayers = new Map();   // unitId -> layerId
        this.m_pathSources = new Map();    // unitId -> sourceId (path trail)
        this.m_pathLayers = new Map();     // unitId -> layerId
        this.m_pathData = new Map();       // unitId -> { coords, elevations }
        this.m_tetherColors = ['#F5D29A', '#32CD32', '#FF1493', '#00CED1'];
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
                exaggeration: 1.3  // Adjust for visual impact (1.0 = natural, 1.5+ = dramatic)
            });
        });

        this.m_map.on('load', () => {
            this.m_isReady = true;
            if (this.m_isVisible) this.m_map.resize();
        });
    }

    fn_show() {
        this.m_isVisible = true;
        this.m_map?.resize();

        // Re-sync all markers after resize. When the map container is hidden
        // (zero size), marker.setLngLat() projects to wrong screen coordinates
        // via requestAnimationFrame. resize() fires a 'resize' event but NOT
        // a 'move' event, so markers are never repositioned automatically.
        // Manually calling setLngLat forces a re-projection with the correct
        // container dimensions.
        if (this.m_map && this.m_isReady) {
            this.m_markers.forEach(marker => {
                const lngLat = marker.getLngLat?.();
                if (lngLat) marker.setLngLat(lngLat);

                // Re-apply the last icon URL (stored on the marker instance)
                if (marker._lastIconUrl) {
                    const iconEl = marker.getElement?.()?.querySelector('.css_map3d_marker_icon');
                    if (iconEl) iconEl.style.backgroundImage = `url('${marker._lastIconUrl}')`;
                }
            });
        }
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
        return this.m_tetherColors[idx % this.m_tetherColors.length];
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
                'line-elevation-reference': 'sea'
            },
            paint: {
                'line-color': color,
                'line-width': 2,
                'line-opacity': 0.8
            }
        });

        this.m_tetherSources.set(id, sourceId);
        this.m_tetherLayers.set(id, layerId);

        // --- Ground circle (drone's ground projection) ---
        // A circle layer at [lng, lat] with no elevation — drapes on the
        // terrain surface, marking where the drone is directly above.
        this.m_map.addSource(groundSourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {}
            }
        });

        this.m_map.addLayer({
            id: groundLayerId,
            type: 'circle',
            source: groundSourceId,
            paint: {
                'circle-radius': 8,
                'circle-color': color,
                'circle-opacity': 0.4,
                'circle-stroke-width': 2,
                'circle-stroke-color': color,
                'circle-stroke-opacity': 0.9,
                'circle-pitch-scale': 'map'
            }
        });

        this.m_groundSources.set(id, groundSourceId);
        this.m_groundLayers.set(id, groundLayerId);
    }

    /**
     * Updates the tether line + ground circle for a unit.
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

        // --- Update ground circle position ---
        const groundSourceId = this.m_groundSources.get(id);
        const groundSource = this.m_map?.getSource(groundSourceId);
        if (groundSource) {
            groundSource.setData({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                properties: {}
            });
        }
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
        // line-dasharray creates dot-like segments.
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
                'line-elevation-reference': 'sea'
            },
            paint: {
                'line-color': color,
                'line-width': 5,
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
        const source = this.m_map.getSource(sourceId);
        if (!source) return null;

        source.setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: data.coords },
            properties: { elevation: data.elevations }
        });

        return { sourceId, index: data.coords.length - 1 };
    }

    /**
     * Flushes (clears) the tether + ground circle + path trail for a unit.
     * Called when a unit is re-created.
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
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: {}
                });
            }
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
