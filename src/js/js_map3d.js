import * as js_siteConfig from './js_siteConfig';

class CAndruavMap3D {
    constructor() {
        this.m_map = null;
        this.m_isReady = false;
        this.m_markers = new Map();
        this.m_isVisible = false;
        this.m_hasAutoFocusedUnit = false;
        this.m_mapDblClickCallbacks = [];
        this.m_isMapDblClickBound = false;
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
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css';
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
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js';
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

        const token = js_siteConfig.CONST_MAPBOX_ACCESS_TOKEN;
        if (!token) {
            console.warn('Mapbox 3D disabled: CONST_MAPBOX_ACCESS_TOKEN not configured.');
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

            // Enable terrain (required for marker altitude to be visible)
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
    }

    fn_hide() {
        this.m_isVisible = false;
    }

    fn_getUnitMarker(unit) {
        return unit ? this.m_markers.get(unit.getPartyID()) ?? null : null;
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
     * Now uses proper altitude support + terrain.
     */
    fn_syncUnit(unit, markerIconUrl = null) {
        if (!this.m_map || !this.m_isReady || !unit?.m_Nav_Info?.p_Location) return;

        const { lat, lng } = unit.m_Nav_Info.p_Location;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

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
                rotationAlignment: 'map',
                pitchAlignment: 'map',
                anchor: 'center'
            })
            .setLngLat([lng, lat])
            .addTo(this.m_map);

            // Ensure alignment (some older versions needed explicit calls)
            if (typeof marker.setRotationAlignment === 'function') marker.setRotationAlignment('map');
            if (typeof marker.setPitchAlignment === 'function') marker.setPitchAlignment('map');
        } else {
            marker.setLngLat([lng, lat]);
            
        }

        this.m_markers.set(id, marker);

        // Update icon if provided
        const iconEl = marker.getElement()?.querySelector('.css_map3d_marker_icon');
        if (iconEl && markerIconUrl) {
            iconEl.style.backgroundImage = `url('${markerIconUrl}')`;
        }

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
                iconEl?.style.setProperty('transform', `rotate(${normalizedYaw}deg)`);
            }
        }

        return marker;
    }
}

export const js_map3d = new CAndruavMap3D();