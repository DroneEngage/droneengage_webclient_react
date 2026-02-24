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

    fn_registerMapDblClickHandler() {
        if (!this.m_map || this.m_isMapDblClickBound === true) return;

        this.m_map.on('dblclick', (event) => {
            const lngLat = event && event.lngLat ? event.lngLat : null;
            if (!lngLat) return;

            const lat = lngLat.lat;
            const lng = lngLat.lng;

            const len = this.m_mapDblClickCallbacks.length;
            for (let i = 0; i < len; ++i) {
                this.m_mapDblClickCallbacks[i](lat, lng);
            }
        });

        this.m_isMapDblClickBound = true;
    }

    fn_addListenerOnDblClickMap(p_callback) {
        if (!p_callback) return;
        this.m_mapDblClickCallbacks.push(p_callback);
        this.fn_registerMapDblClickHandler();
    }

    fn_showInfoWindow(p_infoWindow, p_content, p_lat, p_lng) {
        if (!this.m_map) return null;

        this.fn_hideInfoWindow(p_infoWindow);

        const popup = new window.mapboxgl.Popup({ closeOnClick: true })
            .setLngLat([p_lng, p_lat]);

        if (typeof p_content === 'string') {
            popup.setHTML(p_content);
        }
        else if (p_content instanceof HTMLElement) {
            popup.setDOMContent(p_content);
        }

        if (typeof popup.on === 'function') {
            const originalOn = popup.on.bind(popup);
            popup.on = function (eventName, callback) {
                if (eventName === 'remove') {
                    return originalOn('close', callback);
                }
                return originalOn(eventName, callback);
            };
        }

        popup.addTo(this.m_map);
        return popup;
    }

    fn_bindPopup(p_infoWindow, p_content, p_lat, p_lng) {
        if (!p_infoWindow) return null;

        if (typeof p_lat === 'number' && typeof p_lng === 'number') {
            p_infoWindow.setLngLat([p_lng, p_lat]);
        }

        if (typeof p_content === 'string') {
            p_infoWindow.setHTML(p_content);
        }
        else if (p_content instanceof HTMLElement) {
            p_infoWindow.setDOMContent(p_content);
        }

        return p_infoWindow;
    }

    fn_hideInfoWindow(p_infoWindow) {
        if (!p_infoWindow) return;
        if (typeof p_infoWindow.remove === 'function') {
            p_infoWindow.remove();
        }
    }

    async fn_loadMapboxSdk() {
        if (window.mapboxgl) return window.mapboxgl;

        await new Promise((resolve, reject) => {
            const cssId = 'mapbox-gl-css';
            if (!document.getElementById(cssId)) {
                const css = document.createElement('link');
                css.id = cssId;
                css.rel = 'stylesheet';
                css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css';
                document.head.appendChild(css);
            }

            const scriptId = 'mapbox-gl-js';
            const existing = document.getElementById(scriptId);
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('failed to load mapbox sdk')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('failed to load mapbox sdk'));
            document.body.appendChild(script);
        });

        return window.mapboxgl;
    }

    async fn_initMap(containerId) {
        if (this.m_isReady === true || this.m_map != null) return;

        const token = js_siteConfig.CONST_MAPBOX_ACCESS_TOKEN;
        if (!token) {
            console.warn('Mapbox 3D disabled: CONST_MAPBOX_ACCESS_TOKEN is not configured.');
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
            const hasBuildingLayer = this.m_map.getLayer('add-3d-buildings');
            if (!hasBuildingLayer) {
                this.m_map.addLayer({
                    id: 'add-3d-buildings',
                    source: 'composite',
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
            }
        });

        this.m_map.on('load', () => {
            this.m_isReady = true;
            if (this.m_isVisible === true) {
                this.m_map.resize();
            }
        });
    }

    fn_show() {
        this.m_isVisible = true;
        if (this.m_map) this.m_map.resize();
    }

    fn_hide() {
        this.m_isVisible = false;
    }

    fn_getUnitMarker(unit) {
        if (!unit) return null;
        return this.m_markers.get(unit.getPartyID()) || null;
    }

    fn_addListenerOnMarker(p_marker, p_callback, p_event) {
        if (!p_marker || !p_callback) return;

        const markerElement = p_marker.getElement ? p_marker.getElement() : null;
        if (!markerElement) return;

        if (p_marker.m_event_handlers === undefined) {
            p_marker.m_event_handlers = {};
        }

        if (p_marker.m_event_handlers[p_event] === undefined) {
            p_marker.m_event_handlers[p_event] = [];
        }

        const handler = () => {
            const lngLat = p_marker.getLngLat ? p_marker.getLngLat() : null;
            if (!lngLat) return;
            p_callback(lngLat.lat, lngLat.lng);
        };

        p_marker.m_event_handlers[p_event].push(handler);
        markerElement.addEventListener(p_event, handler);
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
        if (!p_marker || !p_marker.m_event_handlers || !p_marker.m_event_handlers.mouseout) return;

        const markerElement = p_marker.getElement ? p_marker.getElement() : null;
        if (!markerElement) return;

        p_marker.m_event_handlers.mouseout.forEach((handler) => {
            markerElement.removeEventListener('mouseout', handler);
        });

        p_marker.m_event_handlers.mouseout = [];
    }

    fn_focusUnit(unit) {
        if (!this.m_map || !this.m_isReady || !unit?.m_Nav_Info?.p_Location) return;
        const { lat, lng } = unit.m_Nav_Info.p_Location;
        if (lat == null || lng == null) return;

        this.m_map.easeTo({
            center: [lng, lat],
            duration: 500,
            pitch: 53
        });
    }

    fn_syncUnit(unit, markerIconUrl = null) {
        if (!this.m_map || !this.m_isReady || !unit?.m_Nav_Info?.p_Location) return;

        const { lat, lng } = unit.m_Nav_Info.p_Location;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const id = unit.getPartyID();
        let marker = this.m_markers.get(id);

        if (!marker) {
            const el = document.createElement('div');
            el.className = 'css_map3d_marker';
            el.title = unit.m_unitName || id;
            el.style.transformOrigin = 'center center';

            const iconEl = document.createElement('div');
            iconEl.className = 'css_map3d_marker_icon';
            iconEl.style.transformOrigin = 'center center';
            el.appendChild(iconEl);

            marker = new window.mapboxgl.Marker({
                element: el,
                rotationAlignment: 'map',
                pitchAlignment: 'map',
                anchor: 'center'
            });

            if (typeof marker.setRotationAlignment === 'function') {
                marker.setRotationAlignment('map');
            }

            if (typeof marker.setPitchAlignment === 'function') {
                marker.setPitchAlignment('map');
            }
            
            // Set position before adding to map
            marker.setLngLat([lng, lat]);
            
            // Double-check map is still available before adding marker
            if (this.m_map) {
                marker.addTo(this.m_map);
            } else {
                return;
            }
        } else {
            // Update position for existing marker
            marker.setLngLat([lng, lat]);
        }
        this.m_markers.set(id, marker);

        const markerElement = marker.getElement();
        const iconElement = markerElement ? markerElement.querySelector('.css_map3d_marker_icon') : null;
        if (iconElement && markerIconUrl) {
            iconElement.style.backgroundImage = `url('${markerIconUrl}')`;
        }

        if (this.m_hasAutoFocusedUnit === false) {
            this.m_hasAutoFocusedUnit = true;
            this.m_map.easeTo({
                center: [lng, lat],
                duration: 500,
                pitch: 53
            });
        }

        const yaw = unit?.m_Nav_Info?.p_Orientation?.yaw;
        if (Number.isFinite(yaw)) {
            // Leaflet receives yaw in radians and converts to degrees; do the same here
            const deg = (yaw * 180 / Math.PI);
            const normalizedYaw = ((deg % 360) + 360) % 360;
            if (typeof marker.setRotation === 'function') {
                marker.setRotation(normalizedYaw);
            } else {
                // Fallback: rotate inner icon element if API is unavailable
                const el = marker.getElement && marker.getElement();
                const iconEl = el ? el.querySelector('.css_map3d_marker_icon') : null;
                if (iconEl) iconEl.style.transform = `rotate(${normalizedYaw}deg)`;
            }
        }

        return marker;
    }
}

export const js_map3d = new CAndruavMap3D();
