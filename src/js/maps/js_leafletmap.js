/* ********************************************************************************
*   Mohammad Hefny
*
*   31 Aug 2020
*
*********************************************************************************** */

import $ from 'jquery';
import L from 'leaflet';
import 'leaflet-rotatedmarker';


import * as js_siteConfig from '../js_siteConfig.js'
import {js_globals} from '../js_globals.js';
import {EVENTS as js_event} from '../events/js_eventList.js'
import {js_eventEmitter} from '../events/js_eventEmitter.js'
import {js_tileCache} from './js_tileCache.js'
import {js_localStorage} from '../js_localStorage.js'
import {js_windProvider} from '../weather/js_windProvider.js'

import {fn_contextMenu} from '../js_main.js'

// Fix Leaflet's default marker icon paths for CRA/webpack bundling.
// This replaces the CSS `content: url(...)` hack which caused a white
// border on the right/bottom of marker icons due to sub-pixel rendering.
// Note: CRA serves the public folder at root, so use '/images/...' not '/public/images/...'
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: '/images/marker-icon.png',
    iconRetinaUrl: '/images/marker-icon-2x.png',
    shadowUrl: '/images/marker-shadow.png',
});

// Leaflet tile layer that routes tiles through the IndexedDB cache
// (js_tileCache.js) instead of always hitting the network. Mirrors
// L.TileLayer's default createTile, but resolves the tile src via
// js_tileCache.fn_getTile() (cache-first, falls back to the direct URL on a
// cache miss/CORS failure). Object URLs are released on 'tileunload'.
const CCachedTileLayer = L.TileLayer.extend({
    createTile(coords, done) {
        const tile = document.createElement('img');

        L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));
        L.DomEvent.on(tile, 'error', L.Util.bind(this._tileOnError, this, done, tile));

        if (this.options.crossOrigin || this.options.crossOrigin === '') {
            tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
        }

        tile.alt = '';
        tile.setAttribute('role', 'presentation');

        const url = this.getTileUrl(coords);
        const providerId = this.options.cacheProviderId || 'default';

        js_tileCache.fn_getTile(url, providerId, coords.z, coords.x, coords.y)
            .then((objectUrl) => {
                tile._cachedObjectUrl = objectUrl || null;
                tile.src = objectUrl || url;
            });

        return tile;
    }
});

// Cache key namespace for a tile layer, derived from its URL template
// (query string stripped, since that's just the access token). Different
// Leaflet map styles have different URL paths, so this keeps cached tiles
// from one style/provider from being served under another style's z/x/y -
// otherwise images from the previously selected style would mix in with
// the newly selected one at matching coordinates.
function fn_deriveTileCacheProviderId(p_tileUrl) {
    return (p_tileUrl || '').split('?')[0] || 'default';
}

/**
 * Resolve a tile URL template + access token into the final URL.
 *
 * Supports two template styles:
 *  - New (preferred): the template carries its own auth query-param name
 *    via a `{token}` placeholder, e.g.
 *      `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}@2x.jpg?key={token}`
 *      `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token={token}`
 *    This lets each provider use its own param name (key=, api_key=,
 *    apikey=, apiKey=, access_token=, ...) without any extra config field.
 *  - Legacy: the template ends with the param name and an empty value,
 *    e.g. `...?access_token=` — the token is appended. Kept for backward
 *    compatibility with existing config.json / config.local.json / stored
 *    localStorage values that don't contain `{token}`.
 *
 * Templates with no auth param (e.g. ESRI World Imagery, OSM) simply have
 * no `{token}` placeholder and no trailing `?param=`; the token is ignored.
 */
function fn_resolveTileUrl(p_urlTemplate, p_token) {
    const template = p_urlTemplate || '';
    if (template.indexOf('{token}') !== -1) {
        return template.replace('{token}', encodeURIComponent(p_token || ''));
    }
    return template + (p_token || '');
}

/**
 * Derive Leaflet tile-layer options (tileSize, zoomOffset, maxZoom) from
 * the URL template by detecting HiDPI / @2x / 512px patterns.
 *
 * - URLs containing `@2x` or `/512/` (MapTiler, Stadia, Thunderforest,
 *   HERE 512, Mapbox 512 @2x) are 512px HiDPI tiles: Leaflet needs
 *   tileSize=512 and zoomOffset=-1 so labels and scale are correct.
 * - Everything else (standard OSM 256px, ESRI 256px) uses Leaflet defaults.
 *
 * This works for any URL — including ones pasted directly into
 * config.local.json — without needing a separate config field.
 */
function fn_deriveTileLayerOptions(p_urlTemplate) {
    const url = p_urlTemplate || '';
    const isHiDPI = url.indexOf('@2x') !== -1 || url.indexOf('/512/') !== -1 || url.indexOf('512/png8') !== -1;
    if (isHiDPI) {
        return { tileSize: 512, zoomOffset: -1, maxZoom: 22 };
    }
    return { tileSize: 256, zoomOffset: 0, maxZoom: 22 };
}

/**
 * Custom Leaflet control: an ADSB toggle button placed under the +/- zoom
 * controls (topleft). Uses the same plane icon as the ADSB markers
 * (/images/Plane_Track.png). Clicking it toggles the ADSB runtime preference
 * (js_localStorage.fn_setADSBEnabled) and dispatches EE_onPreferenceChanged
 * — exactly what the ADSB settings checkbox does — so the manager stops/starts
 * polling and the map clears/repaints accordingly.
 *
 * The button reflects the current enabled state (active = highlighted,
 * inactive = dimmed) and updates itself on EE_onPreferenceChanged so it stays
 * in sync with the settings checkbox.
 */
const CAdsbToggleControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-adsb-toggle-control');
        // Prevent map drag/click from bleeding through the button.
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        const link = L.DomUtil.create('a', 'leaflet-adsb-toggle-btn', container);
        link.href = '#';
        link.title = 'Toggle ADSB';
        link.role = 'button';

        const img = L.DomUtil.create('img', '', link);
        img.src = '/images/Plane_Track.png';
        img.alt = 'ADSB';
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.verticalAlign = 'middle';

        this._link = link;
        this._updateActiveState();

        L.DomEvent.on(link, 'click', (ev) => {
            L.DomEvent.stop(ev);
            const enabled = js_localStorage.fn_getADSBEnabled();
            js_localStorage.fn_setADSBEnabled(!enabled);
            js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
            // _updateActiveState is called from the EE_onPreferenceChanged
            // listener, but dispatch is synchronous so it has already run
            // by the time we get here — still, update once more to be safe.
            this._updateActiveState();
        });

        // Keep the button state in sync with the settings checkbox.
        this._boundOnPreferenceChanged = () => this._updateActiveState();
        js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged, this, this._boundOnPreferenceChanged);

        return container;
    },

    onRemove() {
        if (this._boundOnPreferenceChanged) {
            js_eventEmitter.fn_unsubscribe(js_event.EE_onPreferenceChanged, this);
            this._boundOnPreferenceChanged = null;
        }
        this._link = null;
    },

    _updateActiveState() {
        if (!this._link) return;
        const enabled = js_localStorage.fn_getADSBEnabled();
        if (enabled) {
            this._link.classList.add('leaflet-adsb-toggle-active');
            this._link.classList.remove('leaflet-adsb-toggle-inactive');
        } else {
            this._link.classList.add('leaflet-adsb-toggle-inactive');
            this._link.classList.remove('leaflet-adsb-toggle-active');
        }
    }
});

/**
 * Custom Leaflet control: a wind-arrow toggle button placed under the ADSB
 * toggle (topleft), directly below the +/- zoom controls. Uses the Bootstrap
 * Icons `bi-wind` glyph. Clicking it toggles the "Enable Wind Arrow" runtime
 * preference (js_localStorage.fn_setWindEnabled) and dispatches
 * EE_onPreferenceChanged — exactly what the Preferences checkbox does — so
 * js_main's wind-arrow refresh picks up the change.
 *
 * The button reflects the current enabled state (active = highlighted,
 * inactive = dimmed) and updates itself on EE_onPreferenceChanged so it stays
 * in sync with the Preferences checkbox.
 */
const CWindToggleControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-wind-toggle-control');
        // Prevent map drag/click from bleeding through the button.
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        const link = L.DomUtil.create('a', 'leaflet-wind-toggle-btn', container);
        link.href = '#';
        link.title = 'Toggle Wind Arrow';
        link.role = 'button';

        const icon = L.DomUtil.create('i', 'bi bi-wind', link);
        icon.style.fontSize = '16px';
        icon.style.lineHeight = '1';

        this._link = link;
        this._updateActiveState();

        L.DomEvent.on(link, 'click', (ev) => {
            L.DomEvent.stop(ev);
            const enabled = js_localStorage.fn_getWindEnabled();
            js_localStorage.fn_setWindEnabled(!enabled);
            js_eventEmitter.fn_dispatch(js_event.EE_onPreferenceChanged);
            // _updateActiveState is called from the EE_onPreferenceChanged
            // listener, but dispatch is synchronous so it has already run
            // by the time we get here — still, update once more to be safe.
            this._updateActiveState();
        });

        // Keep the button state in sync with the Preferences checkbox.
        this._boundOnPreferenceChanged = () => this._updateActiveState();
        js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged, this, this._boundOnPreferenceChanged);

        return container;
    },

    onRemove() {
        if (this._boundOnPreferenceChanged) {
            js_eventEmitter.fn_unsubscribe(js_event.EE_onPreferenceChanged, this);
            this._boundOnPreferenceChanged = null;
        }
        this._link = null;
    },

    _updateActiveState() {
        if (!this._link) return;
        const enabled = js_localStorage.fn_getWindEnabled();
        if (enabled) {
            this._link.classList.add('leaflet-wind-toggle-active');
            this._link.classList.remove('leaflet-wind-toggle-inactive');
        } else {
            this._link.classList.add('leaflet-wind-toggle-inactive');
            this._link.classList.remove('leaflet-wind-toggle-active');
        }
    }
});

class CLeafLetAndruavMap {

    constructor() {
        this.Me = this;
        this.m_Map = null;
        this.m_isMapInit = false;
        this.m_elevator = null;
        this.m_markGuided = null;
        this.m_urlSyncEnabled = false;
        this.m_suppressHashUpdate = false;

        // ---- Wind arrow (all units) ----
        // One rotatedmarker per unit with an inline-SVG arrow divIcon, drawn
        // at each unit's position. Points downwind (bearing =
        // windDirection + 180). Length grows with wind speed. See
        // js_windProvider.js for the data source (Open-Meteo, free, no key).
        this.m_windArrowMarkers = new Map(); // unitId -> L.marker (leaflet-rotatedmarker)
        this.m_windArrowLastRefresh = 0;     // ms epoch of last visual refresh (throttle)
        this.m_windArrowLastSpeed = new Map(); // unitId -> last speed (skip icon rebuild)

    };

    fn_parseMapHash() {
        const hash = (window.location.hash || '').replace(/^#/, '').trim();
        if (!hash) return null;

        const values = hash.split('/').map(Number);
        if (values.length < 3 || values.some(Number.isNaN)) return null;

        const [zoom, lat, lng] = values;
        if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
        }

        return { zoom, lat, lng };
    }

    fn_updateUrlHashFromMap() {
        if (this.m_Map == null || this.m_suppressHashUpdate === true) return;

        const center = this.m_Map.getCenter();
        const zoom = this.m_Map.getZoom();
        const hash = `${zoom.toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`;

        if (window.location.hash !== `#${hash}`) {
            window.history.replaceState(null, '', `#${hash}`);
        }
    }

    fn_applyHashToMap() {
        if (this.m_Map == null) return;

        const mapState = this.fn_parseMapHash();
        if (!mapState) return;

        this.m_suppressHashUpdate = true;
        this.m_Map.setView([mapState.lat, mapState.lng], mapState.zoom, { animate: false });
        this.m_suppressHashUpdate = false;
    }

    fn_enableMapUrlSync() {
        if (this.m_Map == null || this.m_urlSyncEnabled === true) return;

        this.m_Map.on('moveend zoomend', () => {
            this.fn_updateUrlHashFromMap();
        });

        window.addEventListener('hashchange', () => {
            this.fn_applyHashToMap();
        });

        this.m_urlSyncEnabled = true;
        this.fn_applyHashToMap();
        this.fn_updateUrlHashFromMap();
    }

    static getInstance() {
        if (!CLeafLetAndruavMap.instance) {
            CLeafLetAndruavMap.instance = new CLeafLetAndruavMap();
        }
        return CLeafLetAndruavMap.instance;
    }

    fn_addListenerOnMarker(p_marker, p_callback, p_event) {
        let p_call = p_callback;
        p_marker.on(p_event, function (p_event) {
            p_call(p_event.latlng.lat, p_event.latlng.lng);
        });
    };


    /**
    * Get LngLat object compatible with Map
    * @param {*} p_lat 
    * @param {*} p_lng 
    * @param {*} p_alt 
    */
    fn_getLocationObjectBy_latlng(p_lat, p_lng) {
        return new L.LatLng(p_lat, p_lng);
    };


    fn_invalidateSize()
    {
        if (this.m_Map == null) {
            console.warn('Map not initialized');
            return;
        }
        this.m_Map.invalidateSize();
    }

    fn_addShapeEvents()
    {

    }


    /**
     * Build (but don't attach) a cached tile layer for the given URL,
     * wiring up the tileunload -> object URL release housekeeping.
     * Tile size / zoom offset / max zoom are auto-detected from the URL
     * (fn_deriveTileLayerOptions) so HiDPI @2x / 512px providers render
     * correctly without extra config.
     */
    fn_createBasemapTileLayer(p_tileUrl, p_attribution) {
        const opts = fn_deriveTileLayerOptions(p_tileUrl);
        const tileLayer = new CCachedTileLayer(p_tileUrl, {
                tileSize: opts.tileSize,
                zoomOffset: opts.zoomOffset,
                maxZoom: opts.maxZoom,
                attribution: p_attribution,
                id: 'mapbox.streets',
                cacheProviderId: fn_deriveTileCacheProviderId(p_tileUrl)
            });
        tileLayer.on('tileunload', (event) => {
            const tile = event.tile;
            if (tile && tile._cachedObjectUrl) {
                js_tileCache.fn_releaseTileUrl(tile._cachedObjectUrl);
                tile._cachedObjectUrl = null;
            }
        });

        return tileLayer;
    }

    /**
     * Swap in a fresh basemap tile layer built from the current access
     * token/style (localStorage first, falling back to js_siteConfig)
     * without tearing down the rest of the map - used by the Settings
     * "Refresh Map" button so it doesn't force a full page reload.
     */
    fn_refreshBasemap() {
        if (this.m_Map == null) {
            console.warn('Map not initialized');
            return;
        }

        const token = js_localStorage.fn_getMapLeafletAccessToken() || js_siteConfig.CONST_MAP_LEAFLET_ACCESS_TOKEN;
        const urlTemplate = js_localStorage.fn_getMapLeafletUrlMap() || js_siteConfig.CONST_MAP_LEAFLET_URL_MAP;
        if (!urlTemplate) {
            console.error('Map tile URL not configured in js_siteConfig.CONST_MAP_LEAFLET_URL_MAP or CONST_MAP_LEAFLET_ACCESS_TOKEN');
            return;
        }
        const tileUrl = fn_resolveTileUrl(urlTemplate, token);

        const v_site_copyright = '&copy; <a href="' + (js_siteConfig.CONST_HOME_URL || '#') + '">' + (js_siteConfig.CONST_TITLE || 'Map') + '</a>';
        const newTileLayer = this.fn_createBasemapTileLayer(tileUrl, v_site_copyright);
        newTileLayer.addTo(this.m_Map);

        if (this.m_tileLayer) {
            this.m_Map.removeLayer(this.m_tileLayer);
        }
        this.m_tileLayer = newTileLayer;
    }

    /**
    * Handle map initialization onLoad.
    */
    fn_initMap(p_mapelement) {
        let v_site_copyright;
         v_site_copyright = '&copy; <a href="' + (js_siteConfig.CONST_HOME_URL || '#') + '">' + (js_siteConfig.CONST_TITLE || 'Map') + '</a>';


        this.m_Map = L.map(p_mapelement, {
            center: [51.505, -0.09],
            zoom: 13,
            doubleClickZoom: false // Disable the default double-click zoom
        });

        // Validate tile layer URL before using
        const tileUrl = fn_resolveTileUrl(js_siteConfig.CONST_MAP_LEAFLET_URL_MAP, js_siteConfig.CONST_MAP_LEAFLET_ACCESS_TOKEN);
        if (!tileUrl) {
            console.error('Map tile URL not configured in js_siteConfig.CONST_MAP_LEAFLET_URL_MAP or CONST_MAP_LEAFLET_ACCESS_TOKEN');
            return;
        }

        this.m_tileLayer = this.fn_createBasemapTileLayer(tileUrl, v_site_copyright);
        this.m_tileLayer.addTo(this.m_Map);

        // ADSB toggle button under the +/- zoom controls (topleft).
        // Skipped when the site feature flag disables ADSB entirely.
        if (!(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_ADSB === true)) {
            this.m_adsbToggleControl = new CAdsbToggleControl();
            this.m_adsbToggleControl.addTo(this.m_Map);
        }

        // Wind-arrow toggle button under the ADSB toggle (topleft).
        // Skipped when the site feature flag disables the wind feature entirely.
        if (!(js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_WIND === true)) {
            this.m_windToggleControl = new CWindToggleControl();
            this.m_windToggleControl.addTo(this.m_Map);
        }


        
        if (js_globals.CONST_MAP_EDITOR === true) {
            // Check if Geoman plugin is available
            if (this.m_Map.pm == null) {
                console.error('Geoman plugin not loaded. Map editor features will not be available.');
                return;
            }
            
            this.m_Map.pm.addControls({
                position: 'topleft',
                drawMarker: false,
                drawPolygon: true,
                editMode: true,
                drawPolyline: true,
                dragMode: true,
                removalMode: true,  // as event is not fired om:remove
                cutPolygon: false,
                drawCircleMarker: false
            });

            // Define your custom marker icon
            const myIcon = L.icon({
                iconUrl: '/public/images/myicon.png',
                iconSize: [32, 32], // size of the icon
                iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
            });

            // Initialize Leaflet.PM with the custom marker icon
            L.PM.addInitHooks(function() {
                this.options.drawMarker.icon = myIcon;
            });
            this.m_Map.on("pm:drawstart", function (e) {
                console.log("drawstart", e);
              });
              
            this.m_Map.on("pm:dragstart", function (e) {
                console.log("dragstart", e);
                e.workingLayer.setIcon(L.icon({iconUrl:'/public/images/mode-portrait_b.png'}))
              });
              
            this.m_Map.on('pm:create' , (x) => {
                x.layer.pm.m_shape_type = x.shape;
                js_eventEmitter.fn_dispatch(js_event.EE_onShapeCreated, x.layer)
                // add to shapes list.
                js_globals.v_map_shapes.push(x.layer);
                let already_deleted = false;
                x.layer.on('click', function (p_event) {
                        
                    if (p_event.originalEvent.ctrlKey===false)
                    {
                        js_eventEmitter.fn_dispatch(js_event.EE_onShapeSelected, p_event.target);
                    }
                    else
                    {
                        already_deleted = true;
                        js_eventEmitter.fn_dispatch(js_event.EE_onShapeDeleted, x.layer);
                    }
                });

                x.layer.on('pm:edit', (x) => {

                    js_eventEmitter.fn_dispatch(js_event.EE_onShapeEdited, x.target);
                });

                x.layer.on('remove', (x) => {
                    
                    // you can delete the shap by ctrl+click or use eraser.
                    // when using ctrl you still get 'remove' event 
                    // so we need to check if it was already deleted.
                    
                    if (already_deleted === true) return ;

                    // 'remove' is also fired for programmatic hide/show (fn_hideItem),
                    // e.g. toggling path visibility. That is NOT a user deletion, so skip it.
                    if (x.target.m_programmatic_hide === true) {
                        x.target.m_programmatic_hide = false;
                        return;
                    }

                    js_eventEmitter.fn_dispatch(js_event.EE_onShapeDeleted, x.target);
                    already_deleted = false;
                });

            });
        }
        
        let update_timeout = null;
        this.m_Map.on('click', function (event) {
            if (js_globals.CONST_MAP_EDITOR !== true)
			{
                update_timeout = setTimeout(function () { // if (dontexecute) return ;
                    $('.contextmenu').remove();
                    }, 300);
            }
        });

        this.m_Map.on('dblclick', function (event) {
            if (js_globals.CONST_MAP_EDITOR !== true)
			{
                clearTimeout(update_timeout);
                fn_contextMenu(event.latlng)
            }
        });


        this.m_isMapInit = true;
        this.fn_enableMapUrlSync();
    };

    /*
     * Function to add a physical marker on the map and attached events to it.
     * This is used when creating the marker programatically not using Map Editor.
     * @param {*} loc 
     * @param {*} me 
     */
    fn_addMarkerManually(loc, me) {
        const marker = L.marker(loc).addTo(me.m_Map);
        marker.pm.enable();
        marker.pm.m_shape_type = 'Marker';
        // add to shapes list.
        js_globals.v_map_shapes.push(marker);
        let already_deleted = false;
        marker.on('click', function (p_event) {
            if (p_event.originalEvent.ctrlKey===false)
            {
                js_eventEmitter.fn_dispatch(js_event.EE_onShapeSelected, p_event.target);
            }
            else
            {
                already_deleted = true;
                js_eventEmitter.fn_dispatch(js_event.EE_onShapeDeleted, marker);
            }
        });

        marker.on('remove', (x) => {
            if (already_deleted === true) return;

            if (x.target.m_programmatic_hide === true) {
                x.target.m_programmatic_hide = false;
                return;
            }

            js_eventEmitter.fn_dispatch(js_event.EE_onShapeDeleted, x.target);
            already_deleted = false;
        });

        return marker;
    }

    setMap(p_map) {
        this.m_Map = p_map;
    };


    fn_PanTo_latlng(p_lat, p_lng) {
        if (this.m_Map == null) {
            console.warn('Map not initialized');
            return;
        }
        let v_latlng = new L.LatLng(p_lat, p_lng);

        this.m_Map.panTo(v_latlng);
    };

    fn_PanTo(p_marker) {
        if (!p_marker || !p_marker._latlng) return;
        if (this.m_Map == null) {
            console.warn('Map not initialized');
            return;
        }
        this.m_Map.panTo(p_marker._latlng);
    };

    fn_enableDrawMarker(p_enable) {
        if (this.m_Map == null || this.m_Map.pm == null) {
            console.warn('Map or Geoman plugin not initialized');
            return;
        }
        this.m_Map.pm.addControls({drawMarker: p_enable});
    }

    fn_enableDrawLine(p_enable) {
        if (this.m_Map == null || this.m_Map.pm == null) {
            console.warn('Map or Geoman plugin not initialized');
            return;
        }
        this.m_Map.pm.addControls({"drawPolyline": p_enable});
    }

    fn_enableDrawCircle(p_enable) {
        if (this.m_Map == null || this.m_Map.pm == null) {
            console.warn('Map or Geoman plugin not initialized');
            return;
        }
        this.m_Map.pm.addControls({"drawCircle": p_enable});
    }

    fn_enableDrawPolygon(p_enable) {
        if (this.m_Map == null || this.m_Map.pm == null) {
            console.warn('Map or Geoman plugin not initialized');
            return;
        }
        this.m_Map.pm.addControls({"drawPolygon": p_enable});
    }

    fn_enableDrawRectangle(p_enable) {
        if (this.m_Map == null || this.m_Map.pm == null) {
            console.warn('Map or Geoman plugin not initialized');
            return;
        }
        this.m_Map.pm.addControls({"drawRectangle": p_enable});
    }

    fn_removeControls()
    {
        if (this.m_Map == null || this.m_Map.pm == null) {
            console.warn('Map or Geoman plugin not initialized');
            return;
        }
        this.m_Map.pm.removeControls();
    }

    fn_setZoom(p_zoom) {
        this.m_Map.setZoom(p_zoom);
    };


    fn_getZoom() {
        return this.m_Map.getZoom();
    };

    fn_getCenter() {
        if (!this.m_Map) return null;
        const c = this.m_Map.getCenter();
        return { lat: c.lat, lng: c.lng };
    };


    /**
     * Hide a shape or a marker.
     * This is an abstract call so that other types of maps can be implemented.
     * as you alreay can call p_marker.remove()
     * @param {*} p_marker 
     */
    fn_hideItem(p_marker) { // p_marker.setMap(null);
        // Flag this as a programmatic hide so the 'remove' listener does not
        // mistake it for an actual user deletion (which would splice the
        // marker out of the mission plan array).
        p_marker.m_programmatic_hide = true;
        p_marker.remove();
    }

    /**
     * Show a shape or a marker.
     * This is an abstract call so that other types of maps can be implemented.
     * as you alreay can call p_marker.remove()
     * @param {*} p_marker 
     */
     fn_showItem(p_marker) { // p_marker.setMap(null);
      p_marker.addTo(this.m_Map);
    }

  /**
     * Draw line between two locations.
     * @param {*} p_positionFromLat 
     * @param {*} p_positionFromLng 
     * @param {*} p_positionToLat 
     * @param {*} p_positionToLng 
     * @param {*} p_style 
     * @returns 
     */
    fn_DrawPath(p_positionFromLat, p_positionFromLng, p_positionToLat, p_positionToLng, p_style) {
        let flightPlanCoordinates = [
            [
                p_positionFromLat, p_positionFromLng
            ],
            [
                p_positionToLat, p_positionToLng
            ]
        ];

        if (p_style == null)
        {
          p_style = {
            color: '#F5D29A',
            opacity: 0.8,
            weight: 2
          };
        }
        
        return L.polyline(flightPlanCoordinates, p_style).addTo(this.m_Map);

    }

    fn_drawPolyline(p_lnglatFromTo, p_shouldKeepOutside) {

        return L.polyline(p_lnglatFromTo, {
            color: p_shouldKeepOutside === false ? '#32CD32' : '#FF1493',
            opacity: 0.9,
            weight: 2
        }).addTo(this.m_Map);

    }

    fn_drawPolygon(p_lnglatFromTo, p_shouldKeepOutside) {

        return L.polygon(p_lnglatFromTo, {
            fill: true,
            fillColor: p_shouldKeepOutside === false ? '#32CD32' : '#FF1493',
            fillOpacity: 0.45,
            opacity: 0.9,
            weight: 1
        }).addTo(this.m_Map);
    }

    fn_drawCircle(p_center, p_radius, p_shouldKeepOutside) {

        return L.circle(p_center, {
            radius: parseInt(p_radius),
            fill: true,
            fillColor: p_shouldKeepOutside === false ? '#32CD32' : '#FF1493',
            opacity: 1.0,
            weight: 1,
            fillOpacity: 0.45
        }).addTo(this.m_Map);

    }

    fn_drawMissionPolyline(p_lnglatFromTo, p_color) {
        
        const v_color = (p_color === '')?'#75A4D3':p_color;

        return L.polyline(p_lnglatFromTo, {
            color: v_color,
            opacity: 0.9,
            weight: 2
        }).addTo(this.m_Map);
    }

    fn_drawMissionCircle(p_center, p_radius, p_color) {
        
        const v_color = (p_color === '') ? '#3232CD' : p_color;

        return L.circle(p_center, {
            radius: parseInt(p_radius),
            fill: true,
            fillColor: v_color,
            opacity: 1.0,
            weight: 0,
            fillOpacity: 0.25
        }).addTo(this.m_Map);

    }

    /**
     * Draw a dotted outline circle showing the ADSB query coverage area.
     * No fill so it does not obscure the map. p_radiusKm is in kilometers;
     * Leaflet circle radius is in meters.
     */
    fn_drawAdsbQueryCircle(p_lat, p_lng, p_radiusKm) {
        return L.circle([p_lat, p_lng], {
            radius: Math.round(p_radiusKm * 1000),
            fill: false,
            color: '#FFA500',
            opacity: 0.8,
            weight: 1,
            dashArray: '2, 6',
            lineCap: 'round'
        }).addTo(this.m_Map);
    }


    /**
         * Set position of a marker.
         * @param {*} p_marker 
         * @param {*} p_lat 
         * @param {*} p_lng 
         * @param {*} p_yaw to set orientation.
         */
    fn_setPosition_bylatlng(p_marker, p_lat, p_lng, p_yaw) {
        if (p_marker == null) {
            console.warn('Marker is null');
            return;
        }

        p_marker.setLatLng(new L.LatLng(p_lat, p_lng));
        // Check if rotation methods are available (rotatedmarker plugin)
        if (typeof p_marker.setRotationAngle === 'function') {
            // p_marker.setRotationOrigin ('center 10px');
            p_marker.setRotationAngle(p_yaw * 180 / Math.PI); // (360 + p_yaw * 180 / Math.PI) % 360;
        }

    };


    fn_setPosition(p_marker, p_latlng) {

        p_marker.setLatLng(p_latlng);

    };

    fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        if ((p_image === null || p_image === undefined || p_image===""))
        {
            p_image = '/images/destination_g_32x32.png';
            anchor = [16,32];
        }
        let v_image;
        if (p_iconsize === null || p_iconsize === undefined) {
            p_iconsize = [32,32];
        }
        
        let v_iconAnchor = [p_iconsize[0]/2, p_iconsize[1]/2];
        if (anchor !== null && anchor !== undefined)
        {
            v_iconAnchor = anchor;
        }
        
        let v_popupAnchor = [-p_iconsize[0]/2, -p_iconsize[1]/2];
        
        // Escape HTML attributes to prevent XSS
        const escapedImage = p_image.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const escapedTitle = (p_htmlTitle || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        let v_htmlIcon = `<img src="${escapedImage}" alt="icon"/>`;
        let hasTextLabel = false;
        
        if ((p_htmlTitle === null || p_htmlTitle === undefined ) || (p_htmlTitle === '')) {
            
        } else {
            hasTextLabel = true;
            // Position text above the image, with image at anchor point
            v_htmlIcon = `<div style="position: relative; width: ${p_iconsize[0]}px; height: ${p_iconsize[1]}px;">
                <div style="position: absolute; bottom: ${p_iconsize[1]}px; left: 50%; transform: translateX(-50%); white-space: nowrap; text-align: center;">${escapedTitle}</div>
                <img src="${escapedImage}" alt="icon" style="position: absolute; top: 0; left: 0; width: ${p_iconsize[0]}px; height: ${p_iconsize[1]}px;"/>
            </div>`;
        }

        // Add debug anchor dot if enabled
        if (js_globals.CONST_DEBUG_SHOW_ANCHOR_DOTS === true) {
            // The anchor is relative to iconSize (the icon container), not the text
            // So the dot position is simply at v_iconAnchor coordinates within the icon container
            const dotHtml = `<div style="position: absolute; left: ${v_iconAnchor[0]}px; top: ${v_iconAnchor[1]}px; width: 6px; height: 6px; background: white; border: 1px solid black; border-radius: 50%; transform: translate(-50%, -50%); z-index: 1000; pointer-events: none;"></div>`;
            
            if (hasTextLabel) {
                // For labeled icons, add dot before the closing tag of the outer container
                // Find the last </div> and insert the dot before it
                const lastDivIndex = v_htmlIcon.lastIndexOf('</div>');
                v_htmlIcon = v_htmlIcon.substring(0, lastDivIndex) + dotHtml + v_htmlIcon.substring(lastDivIndex);
            } else {
                // For simple icons, wrap in container and add dot
                v_htmlIcon = `<div style="position: relative; width: ${p_iconsize[0]}px; height: ${p_iconsize[1]}px;">
                    ${v_htmlIcon}
                    ${dotHtml}
                </div>`;
            }
        }

        v_image = L.divIcon({
            html: v_htmlIcon,
            iconSize: p_iconsize,
            iconAnchor: v_iconAnchor,
            tooltipAnchor: v_popupAnchor, // The coordinates of the point from which tooltips will "open", relative to the icon anchor.
            popupAnchor: v_popupAnchor, //The coordinates of the point from which popups will "open", relative to the icon anchor.
            className: "css_leaflet_icon"
            // shadowUrl: 'my-icon-shadow.png',
            // shadowSize: [68, 95],
            // shadowAnchor: [22, 94]
        });


        return v_image;
    }


    /**
     * Create a marker with image and title
     */
    fn_CreateMarker(p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        
        const v_image = this.fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize);

        let v_marker = L.marker([
            0, 0
        ], {
            icon: v_image,
            title: p_title,
            draggable: p_draggable ? true : false,
            zIndexOffset: p_isTop ? 1000 : 0
        }
        
        ).addTo(this.m_Map);

        return v_marker;
    };

    fn_setVehicleIcon(p_marker, p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        if (p_marker == null) {
            console.warn('Marker is null');
            return;
        }
        
        const v_image = this.fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize);

        // Check if rotation methods are available (rotatedmarker plugin)
        if (typeof p_marker.setRotationOrigin === 'function') {
            p_marker.setRotationOrigin('center center');
        }
        p_marker.setIcon(v_image);

    };

    fn_createBootStrapIcon(p_marker, p_bootstrap_icon_name, p_color, p_iconsize) {
        if (p_marker == null) 
            return;
    
        // Set default icon size if not provided
        const iconSize = p_iconsize || [48, 48];
    
        // Create the icon with customizable size and color
        // line-height: 1 and display: block ensure the glyph fills the full
        // iconSize height so the iconAnchor at the bottom aligns with the pin tip.
        const v_image = L.divIcon({
            html: `<i class="bi ${p_bootstrap_icon_name}" style="background: none; border: none; color: ${p_color}; font-size: ${iconSize[0]}px; line-height: 1; display: block; text-align: center;"></i>`,
            className: "custom-location-icon",
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1]], // Center horizontally, anchor at bottom (pin tip)
            popupAnchor: [0, -iconSize[1]] // Adjust popup anchor based on icon size
        });
    
        // Set the icon to the marker
        p_marker.setIcon(v_image);
    };


    fn_changeBootStrapIconColor(p_marker, p_color) {
        if (!p_marker) return;
    
        const icon = p_marker.getIcon();
        if (icon && icon.options && icon.options.html) {
            const iconElement = p_marker._icon.querySelector('i');
            if (iconElement) {
                iconElement.style.color = p_color;
            }
        }
    };
    
    /**
         * Deletes shapes created by Geoman Plugin
         */
    fn_deleteAllEditShapes() {
        if (this.m_Map == null || this.m_Map.pm == null) {
            console.warn('Map or Geoman plugin not initialized');
            return;
        }
        
        const v_editLayers = this.m_Map.pm.getGeomanDrawLayers();
        if ((v_editLayers === null || v_editLayers === undefined) || (v_editLayers.length === 0)) 
            return;
        

        v_editLayers.forEach(function (e) {
            if (e.m_next !== null && e.m_next !== undefined) e.m_next.remove(); // delete attached markers
            e.remove()
        })

    }
    /**
         * Get altitude of a location compare to sea level.
         * @param {*} p_lat 
         * @param {*} p_lng 
         * @param {*} p_callback 
         */
    fn_getElevationForLocation(p_lat, p_lng, p_callback) {
        p_callback("NA", p_lat, p_lng);
    }


    /**
         * 
         * @param {*} p_infoWindow 
         * @param {*} p_content 
         * @param {*} p_lat 
         * @param {*} p_lng 
         */
    fn_showInfoWindow(p_infoWindow, p_content, p_lat, p_lng) {
        
        if (this.m_Map == null) return null;
        
        this.fn_hideInfoWindow(p_infoWindow);

        p_infoWindow = L.popup().setLatLng(new L.LatLng(p_lat, p_lng)).setContent(p_content).openOn(this.m_Map);

        return p_infoWindow;
    }

    fn_bindPopup (p_infoWindow, p_content, p_lat, p_lng)
    {
        if (!p_infoWindow) return null;

        p_infoWindow.bindPopup(p_content).openPopup();

        return p_infoWindow;
    }

    fn_hideInfoWindow(p_infoWindow) {
        
        if (p_infoWindow == null) 
            return;
        

        p_infoWindow.remove();
        p_infoWindow = null;
    }


    fn_addListenerOnClickMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'click');
    };

    fn_addListenerOnDblClickMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'dblclick');
    };


    fn_addListenerOnRightClickMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'rightclick');
    };


    fn_addListenerOnMouseOverMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'mouseover');
    };

    fn_addListenerOnMouseOutMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'mouseout');
    };

    fn_removeListenerOnMouseOverMarker(p_marker, p_callback) {
        p_marker.off('mouseover');
    };

    fn_removeListenerOnMouseOutClickMarker(p_marker, p_callback) {
        p_marker.off('mouseout');
    };

    // ---- Wind arrow (selected unit) ----

    /**
     * Builds a leaflet divIcon containing an inline-SVG wind arrow pointing
     * UP (north) in its source orientation. The arrow length encodes wind
     * speed (clamped to [MIN, MAX]). leaflet-rotatedmarker's rotationAngle
     * orients it to the downwind bearing (see fn_setWindArrow).
     * @param {number} speedMs wind speed in m/s
     * @returns {L.DivIcon}
     */
    fn_buildWindArrowIcon(speedMs) {
        const g = js_globals;
        const len = Math.max(g.CONST_MAP_WIND_ARROW_MIN_LENGTH,
                   Math.min(g.CONST_MAP_WIND_ARROW_MAX_LENGTH,
                            g.CONST_MAP_WIND_ARROW_BASE_LENGTH_MS + (Number(speedMs) || 0) * g.CONST_MAP_WIND_ARROW_LENGTH_PER_MS));
        const color = g.CONST_MAP_WIND_ARROW_COLOR;
        const w = 14;                 // SVG width (pixels)
        const headH = Math.min(14, len * 0.35);
        const shaftTop = headH;
        const shaftBot = len;
        const halfW = w / 2;
        // Arrow shape: tip at top, shaft below. Points UP (north) at 0°.
        const points = [
            `${halfW},0`,                              // tip
            `${w},${headH}`,                           // head right
            `${halfW + 2},${headH}`,                   // head right inner
            `${halfW + 2},${shaftBot}`,                // shaft bottom right
            `${halfW - 2},${shaftBot}`,                // shaft bottom left
            `${halfW - 2},${headH}`,                   // head left inner
            `0,${headH}`,                              // head left
        ].join(' ');
        const svg = `<svg width="${w}" height="${len}" viewBox="0 0 ${w} ${len}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">` +
                    `<polygon points="${points}" fill="${color}" stroke="#000" stroke-width="0.5" opacity="0.85"/>` +
                    `</svg>`;
        return L.divIcon({
            html: svg,
            className: 'leaflet-wind-arrow',
            iconSize: [w, len],
            iconAnchor: [halfW, len],   // anchor at tail (bottom-center) so the arrow emanates from the unit
        });
    }

    /**
     * Creates or updates the wind arrow marker at the unit's position,
     * oriented to point downwind. Called on unit selection and on every
     * telemetry sync of the selected unit.
     * @param {object} unit CAndruavUnit
     * @param {{speedMs:number, directionDeg:number}} windData from js_windProvider
     */
    fn_setWindArrow(unit, windData) {
        if (!this.m_Map || !unit || !windData) return;
        const loc = unit.m_Nav_Info && unit.m_Nav_Info.p_Location;
        if (!loc) return;
        const lat = Number(loc.lat);
        const lng = Number(loc.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const unitId = unit.getPartyID ? unit.getPartyID() : (unit.partyID || null);
        if (!unitId) return;

        // Meteorological direction = where wind blows FROM.
        // Arrow points DOWNWIND = where wind blows TO = direction + 180.
        const downwindBearing = ((Number(windData.directionDeg) || 0) + 180) % 360;
        const speed = Number(windData.speedMs) || 0;

        const existing = this.m_windArrowMarkers.get(unitId);
        if (existing) {
            // Always update position + rotation (cheap).
            existing.setLatLng([lat, lng]);
            existing.setRotationAngle(downwindBearing);
            // Only rebuild the SVG icon when speed changed enough to alter
            // the arrow length — wind is cached hourly, so speed is usually
            // identical across thousands of refreshes.
            if (this.m_windArrowLastSpeed.get(unitId) !== speed) {
                existing.setIcon(this.fn_buildWindArrowIcon(speed));
                this.m_windArrowLastSpeed.set(unitId, speed);
            }
        } else {
            const marker = L.marker([lat, lng], {
                icon: this.fn_buildWindArrowIcon(speed),
                rotationAngle: downwindBearing,
                interactive: false,    // no click/hover — the unit marker handles interaction
                keyboard: false,
                zIndexOffset: 1000,
            }).addTo(this.m_Map);
            this.m_windArrowMarkers.set(unitId, marker);
            this.m_windArrowLastSpeed.set(unitId, speed);
        }
        this.m_windArrowLastRefresh = Date.now();
    }

    /**
     * Removes the wind arrow marker for a single unit from the map.
     * @param {string} unitId
     */
    fn_clearWindArrow(unitId) {
        if (!unitId) return;
        const marker = this.m_windArrowMarkers.get(unitId);
        if (marker) {
            this.m_Map.removeLayer(marker);
            this.m_windArrowMarkers.delete(unitId);
        }
        this.m_windArrowLastSpeed.delete(unitId);
    }

    /**
     * Removes ALL wind arrow markers from the map (on disable).
     */
    fn_clearAllWindArrows() {
        this.m_windArrowMarkers.forEach(marker => {
            this.m_Map.removeLayer(marker);
        });
        this.m_windArrowMarkers.clear();
        this.m_windArrowLastSpeed.clear();
        this.m_windArrowLastRefresh = 0;
    }

    /**
     * Removes wind arrows for units no longer in the given active-unit set.
     * Self-cleaning — no explicit unit-removal event exists in the codebase.
     * @param {Set<string>} activeUnitIds partyIDs of currently online units
     */
    fn_clearStaleWindArrows(activeUnitIds) {
        for (const unitId of this.m_windArrowMarkers.keys()) {
            if (!activeUnitIds.has(unitId)) {
                this.fn_clearWindArrow(unitId);
            }
        }
    }

    /**
     * @returns {number} count of active wind arrow markers
     */
    fn_getWindArrowCount() {
        return this.m_windArrowMarkers.size;
    }


}


export const js_leafletmap =  CLeafLetAndruavMap.getInstance();