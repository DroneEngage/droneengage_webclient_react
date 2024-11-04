/* ********************************************************************************
*   Mohammad Hefny
*
*   31 Aug 2020
*
*********************************************************************************** */

import $ from 'jquery'; 
import L from 'leaflet';
import 'leaflet-rotatedmarker';


import * as js_siteConfig from './js_siteConfig'
import {js_globals} from './js_globals.js';
import {js_eventEmitter} from './js_eventEmitter'

import {fn_contextMenu} from './js_main'
class CLeafLetAndruavMap {

    constructor() {
        this.Me = this;
        this.m_Map = null;
        this.m_isMapInit = false;
        this.m_elevator = null;
        this.m_markGuided = null;

    };

    static getInstance() {
        if (!CLeafLetAndruavMap.instance) {
            CLeafLetAndruavMap.instance = new CLeafLetAndruavMap();
        }
        return CLeafLetAndruavMap.instance;
    }

    fn_addListenerOnMarker(p_marker, p_callback, p_event) {
        var p_call = p_callback;
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
        this.m_Map.invalidateSize();
    }

    fn_addShapeEvents()
    {

    }


    /**
    * Handle map initialization onLoad.
    */
    fn_initMap(p_mapelement) {
        var v_site_copyright;
         v_site_copyright = '&copy; <a href="' + js_siteConfig.CONST_HOME_URL + '">' + js_siteConfig.CONST_TITLE + '</a>';


        this.m_Map = L.map(p_mapelement, {
            center: [51.505, -0.09],
            zoom: 13,
            doubleClickZoom: false // Disable the default double-click zoom
        });
        
        if (js_globals.CONST_MAP_GOOLE_PLUGIN === true)
        {
            var ggl = new L.Google('SATELLITE'); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN

            this.m_Map.addLayer(ggl);
            var zoomControl = new L.Control.Zoom({ position: 'topright' });
            zoomControl.addTo(this.m_Map);
        }
        else
        {
            L.tileLayer(js_globals.VAR_MAP_LEAFLET_URL, {
                maxZoom: 22,
                attribution: v_site_copyright,
                id: 'mapbox.streets'
            }).addTo(this.m_Map);
        }

        

        
        if (js_globals.CONST_MAP_EDITOR === true) {
            this.m_Map.pm.addControls({
                position: 'topleft',
                drawMarker: false,
                drawPolygon: true,
                editMode: true,
                drawPolyline: true,
                dragMode: true,
                removalMode: false,  // as event is not fired om:remove
                cutPolygon: false,
                drawCircleMarker: false
            });

            // Define your custom marker icon
            const myIcon = L.icon({
                iconUrl: 'images/myicon.png',
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
                e.workingLayer.setIcon(L.icon({iconUrl:'images/mode-portrait_b.png'}))
              });
              
            this.m_Map.on('pm:create' , (x) => {
                x.layer.pm.m_shape_type = x.shape;
                js_eventEmitter.fn_dispatch(js_globals.EE_onShapeCreated, x.layer)
                // add to shapes list.
                js_globals.v_map_shapes.push(x.layer);

                x.layer.on('click', function (p_event) {
                    if (p_event.originalEvent.ctrlKey===false)
                    {
                        js_eventEmitter.fn_dispatch(js_globals.EE_onShapeSelected, p_event);
                    }
                    else
                    {
                        js_eventEmitter.fn_dispatch(js_globals.EE_onShapeDeleted, x.layer);
                    }
                });

                x.layer.on('pm:edit', (x) => {

                    js_eventEmitter.fn_dispatch(js_globals.EE_onShapeEdited, x.target);
                });

                x.layer.on('remove', (x) => {

                    js_eventEmitter.fn_dispatch(js_globals.EE_onShapeDeleted, x.layer);
                });

            });

            //fn_addMarker ([51.505, -0.09], this);
        }
        
         // Function to add a marker
        // function fn_addMarker(loc, me) {
        //     const marker = L.marker(loc).addTo(me.m_Map);
        //     marker.pm.enable();
        //     marker.bindPopup('New Marker').openPopup();
        //     // Fire the pm:create event
        //     marker.fire('pm:create', {
        //         layer: marker,
        //         shape: 'Marker'
        //     });
        // }

        
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
    };

    // Function to add a marker
    fn_addMarker(loc, me) {
        const marker = L.marker(loc).addTo(me.m_Map);
        marker.pm.enable();
        marker.pm.m_shape_type = 'Marker';
        // Fire the pm:create event
        // marker.fire('pm:create', {
        //     layer: marker,
        //     shape: 'Marker'
        // });
        js_eventEmitter.fn_dispatch(js_globals.EE_onShapeCreated, marker)
                // add to shapes list.
        js_globals.v_map_shapes.push(marker);
        marker.on('click', function (p_event) {
            if (p_event.originalEvent.ctrlKey===false)
            {
                js_eventEmitter.fn_dispatch(js_globals.EE_onShapeSelected, p_event);
            }
            else
            {
                js_eventEmitter.fn_dispatch(js_globals.EE_onShapeDeleted, marker);
            }
        });
    }

    setMap(p_map) {
        this.m_Map = p_map;
    };


    fn_PanTo_latlng(p_lat, p_lng) {
        var v_latlng = new L.LatLng(p_lat, p_lng);

        this.m_Map.panTo(v_latlng);
    };

    fn_PanTo(p_marker) {
        this.m_Map.panTo(p_marker._latlng);
    };

    fn_enableDrawMarker(p_enable) {
        this.m_Map.pm.addControls({drawMarker: p_enable});
    }

    fn_enableDrawLine(p_enable) {
        this.m_Map.pm.addControls({"drawPolyline": p_enable});
    }

    fn_enableDrawCircle(p_enable) {
        this.m_Map.pm.addControls({"drawCircle": p_enable});
    }

    fn_enableDrawPolygon(p_enable) {
        this.m_Map.pm.addControls({"drawPolygon": p_enable});
    }

    fn_enableDrawRectangle(p_enable) {
        this.m_Map.pm.addControls({"drawRectangle": p_enable});
    }

    fn_removeControls()
    {
        this.m_Map.pm.removeControls();
    }

    fn_setZoom(p_zoom) {
        this.m_Map.setZoom(p_zoom);
    };


    fn_getZoom() {
        return this.m_Map.getZoom();
    };


    /**
         * Create a marker with image and title
         */
    fn_CreateMarker(p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        
        const v_image = this.fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize);

        var v_marker = L.marker([
            0, 0
        ], {
            icon: v_image,
            title: p_title,
            draggable: p_draggable ? true : false,
            zIndexOffset: p_isTop ? 1000 : 0
        }
        // map: this.m_Map,
        // //label: c_lbl,
        // //labelAnchor: new google.maps.Point(22, 0),
        // anchor: new google.maps.Point(16, 16),
        // icon: v_image
        ).addTo(this.m_Map);

        //     v_marker.setTitle(p_title);

        return v_marker;
    };

    /**
     * Hide a shape or a marker.
     * This is an abstract call so that other types of maps can be implemented.
     * as you alreay can call p_marker.remove()
     * @param {*} p_marker 
     */
    fn_hideItem(p_marker) { // p_marker.setMap(null);
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
        var flightPlanCoordinates = [
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

    fn_drawMissionCircle(p_center, p_radius) {
        
        return L.polyline(p_center, {
            radius: parseInt(p_radius),
            fill: true,
            fillColor: '#3232CD',
            opacity: 1.0,
            weight: 0,
            fillOpacity: 0.25
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

        p_marker.setLatLng(new L.LatLng(p_lat, p_lng));
        // p_marker.setRotationOrigin ('center 10px');
        p_marker.setRotationAngle(p_yaw * 180 / Math.PI); // (360 + p_yaw * 180 / Math.PI) % 360;

    };


    fn_setPosition(p_marker, p_latlng) {

        p_marker.setLatLng(p_latlng);

    };

    fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        if ((p_image === null || p_image === undefined || p_image===""))
        {
            p_image = './images/destination_g_32x32.png';
        }
        var v_image;
        if (p_iconsize === null || p_iconsize === undefined) {
            p_iconsize = [32,32];
        }
        
        var v_iconAnchor = [p_iconsize[0]/2,p_iconsize[1]/2];
        if (anchor !== null && anchor !== undefined)
        {
            v_iconAnchor = anchor;
        }
        
        var v_popupAnchor = [-p_iconsize[0]/2,-p_iconsize[0]/2];
        let v_htmlIcon = "<image src='" + p_image + "'/>";
        if ((p_htmlTitle === null || p_htmlTitle === undefined ) || (p_htmlTitle === '')) {
            
        } else {
            v_htmlIcon = p_htmlTitle + "<image src='" + p_image + "'/>";
        }

        v_image = L.divIcon({
            html: v_htmlIcon,
            iconSize: p_iconsize,
            iconAnchor: v_iconAnchor,
            popupAnchor: v_popupAnchor,
            className: "css_leaflet_icon"
            // shadowUrl: 'my-icon-shadow.png',
            // shadowSize: [68, 95],
            // shadowAnchor: [22, 94]
        });


        return v_image;
    }

    fn_setVehicleIcon(p_marker, p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        if (p_marker == null) 
            return;
        
        const v_image = this.fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize);


        p_marker.setRotationOrigin('center center');
        p_marker.setIcon(v_image);

    };


    fn_setMarkerIcon(p_marker, p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        if (p_marker == null) 
            return;
        
        const v_image = this.fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize);


        p_marker.setIcon(v_image);
    };


    /**
         * Deletes shapes created by Geoman Plugin
         */
    fn_deleteAllEditShapes() {
        const v_editLayers = this.m_Map.pm.getGeomanDrawLayers();
        if ((v_editLayers === null || v_editLayers === undefined) || (v_editLayers.length === 0)) 
            return;
        

        v_editLayers.forEach(function (e) {
            if (e.m_next!==null) e.m_next.remove(); // delete attached markers
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
        
        this.fn_hideInfoWindow(p_infoWindow);

        p_infoWindow = L.popup().setLatLng(new L.LatLng(p_lat, p_lng)).setContent(p_content).openOn(this.m_Map);

        return p_infoWindow;
    }

    fn_showInfoWindow2(p_infoWindow, p_content, p_lat, p_lng) {
        
        this.fn_hideInfoWindow(p_infoWindow);

        p_infoWindow = L.popup().setLatLng(new L.LatLng(p_lat, p_lng)).setContent(p_content).openOn(this.m_Map);

        return p_infoWindow;
    }


    fn_bindPopup (p_infoWindow, p_content, p_lat, p_lng)
    {
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


}


export var js_leafletmap =  CLeafLetAndruavMap.getInstance();