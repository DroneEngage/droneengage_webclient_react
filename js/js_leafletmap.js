/* ********************************************************************************
*   Mohammad Hefny
*
*   31 Aug 2020
*
*********************************************************************************** */
"use strict";

/*jshint esversion: 6 */


class CLeafLetAndruavMap {

    constructor() {
        this.Me = this;
        this.m_Map = null;
        this.m_isMapInit = false;
        this.m_elevator = null;
        this.m_markGuided = null;
    };


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

    /**
    * Handle map initialization onLoad.
    */
    fn_initMap(p_mapelement) {
        var v_site_copyright;
        v_site_copyright = '&copy; <a href="' + CONST_HOME_URL + '">' + CONST_TITLE + '</a>';


        this.m_Map = L.map(p_mapelement).setView([
            51.505, -0.09
        ], 13);
        
        if (CONST_MAP_GOOLE_PLUGIN === true)
        {
            var ggl = new L.Google('SATELLITE'); // Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN

            this.m_Map.addLayer(ggl);
            var zoomControl = new L.Control.Zoom({ position: 'topright' });
            zoomControl.addTo(this.m_Map);
        }
        else
        {
            L.tileLayer(VAR_MAP_LEAFLET_URL, {
                maxZoom: 22,
                attribution: v_site_copyright,
                id: 'mapbox.streets'
            }).addTo(this.m_Map);
        }
        
        if (CONST_MAP_EDITOR === true) {
            this.m_Map.pm.addControls({
                position: 'topleft',
                drawMarker: false,
                drawPolygon: true,
                editMode: true,
                drawPolyline: true,
                dragMode: true,
                removalMode: true,
                cutPolygon: false,
                drawCircleMarker: false
            });


            this.m_Map.on('pm:create' , (x) => {
                window.AndruavLibs.EventEmitter.fn_dispatch(EE_onShapeCreated, x.layer)
                // add to shapes list.
                v_map_shapes.push(x.layer);

                x.layer.on('click', function (p_event) {
                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_onShapeSelected, p_event);
                });

                x.layer.on('pm:edit', (x) => {

                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_onShapeEdited, x.layer);
                });

                x.layer.on('pm:remove', (x) => {

                    window.AndruavLibs.EventEmitter.fn_dispatch(EE_onShapeDeleted, x.layer);
                });

            });
        }
        // L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=babed5ef144e19a8edafd111a373036b', {
        // attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
        // opacity: 0.8
        // }).addTo(this.m_Map);

        // L.tileLayer('https://{s}.tiles.mapbox.com/v3/pk.eyJ1IjoibWhlZm55IiwiYSI6ImNrZW84Nm9rYTA2ZWgycm9mdmNscmFxYzcifQ.c-zxDjXCthXmRsErPzKhbQ/{z}/{x}/{y}.png',
        // { attribution: 'Map tiles &copy; <a href="https://mapbox.com">Mapbox</a>', maxZoom: 17 }).addTo(this.m_Map);

        // var bounds = [[90,0], [-90,-180]];
        // this.m_Map = L.map(p_mapelement, {
        // crs: L.CRS.EPSG3857,
        // minZoom: -5
        // });
        // L.imageOverlay('./images/map.png', bounds).addTo(this.m_Map);
        // this.m_Map.fitBounds(bounds);

        var update_timeout = null;
        this.m_Map.on('click', function (event) {
            if (CONST_MAP_EDITOR!==true)
			{
                update_timeout = setTimeout(function () { // if (dontexecute) return ;
                    $('.contextmenu').remove();
                    }, 300);
            }
        });

        this.m_Map.on('dblclick', function (event) {
            if (CONST_MAP_EDITOR!==true)
			{
                clearTimeout(update_timeout);
                fn_contextMenu(event.latlng)
            }
        });


        this.m_isMapInit = true;
    };


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
        //         new L.LatLng(p_positionFromLat,
        //           p_positionFromLng),
        //         new L.LatLng(p_positionToLat,
        //           p_positionToLng)
        // ];

        // var v_flightPath = new google.maps.Polyline({
        //     path: flightPlanCoordinates,
        //     geodesic: true,
        //     strokeColor: '#F5D29A',
        //     strokeOpacity: 8.0,
        //     strokeWeight: 2,
        //     icons: [{
        //         icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
        //         offset: '100%'
        //     }]
        // });

        // v_flightPath.setMap (this.m_Map);
        // return v_flightPath;

        return L.polyline(flightPlanCoordinates, p_style).addTo(this.m_Map);

    }

    fn_drawPolyline(p_lnglatFromTo, p_shouldKeepOutside) {
        // var v_geoFence = new google.maps.Polyline({
        //     path: p_lnglatFromTo,
        //     geodesic: true,
        //     strokeColor: p_shouldKeepOutside == false ? '#32CD32' : '#FF1493', //'#75A4D3':'#F75050',
        //     strokeOpacity: 0.9,
        //     strokeWeight: 2
        // });
        // v_geoFence.setMap(this.m_Map);

        // return v_geoFence;

        return L.polyline(p_lnglatFromTo, {
            color: p_shouldKeepOutside == false ? '#32CD32' : '#FF1493',
            opacity: 0.9,
            weight: 2
        }).addTo(this.m_Map);

    }

    fn_drawPolygon(p_lnglatFromTo, p_shouldKeepOutside) {
        // var v_geoFence = new google.maps.Polygon({
        //     path: p_lnglatFromTo,
        //     geodesic: true,
        //     fillColor: p_shouldKeepOutside == false ? '#32CD32' : '#FF1493', //'#75A4D3':'#F75050',
        //     //strokeColor: geoFenceInfo.m_shouldKeepOutside==false?'#FFFFFF':'#D3D375',
        //     strokeOpacity: 1.0,
        //     fillOpacity: 0.45,
        //     strokeWeight: 0  // you can use width with violation
        // });
        // v_geoFence.setMap(this.m_Map);

        // return v_geoFence;

        return L.polygon(p_lnglatFromTo, {
            fill: true,
            fillColor: p_shouldKeepOutside == false ? '#32CD32' : '#FF1493',
            fillOpacity: 0.45,
            opacity: 0.9,
            weight: 0
        }).addTo(this.m_Map);
    }

    fn_drawCircle(p_center, p_radius, p_shouldKeepOutside) {
        // var v_geoFence = new google.maps.Circle({
        //     fillColor: p_shouldKeepOutside == false ? '#32CD32' : '#FF1493', //'#75A4D3':'#F75050',
        //     //strokeColor: geoFenceInfo.m_shouldKeepOutside==false?'#FFFFFF':'#D3D375',
        //     strokeOpacity: 1.0,
        //     strokeWeight: 0,
        //     fillOpacity: 0.45,
        //     map: map,
        //     center: p_center,
        //     radius: p_radius
        // });
        // v_geoFence.setMap(this.m_Map);

        // return v_geoFence;

        return L.circle(p_center, {
            radius: parseInt(p_radius),
            fill: true,
            fillColor: p_shouldKeepOutside == false ? '#32CD32' : '#FF1493',
            opacity: 1.0,
            weight: 0,
            fillOpacity: 0.45
        }).addTo(this.m_Map);

    }

    fn_drawMissionPolyline(p_lnglatFromTo, p_color) {
        // var v_missionLine = new google.maps.Polyline({
        //     path: p_lnglatFromTo,
        //     geodesic: true,
        //     strokeColor: '#75A4D3',
        //     strokeOpacity: 0.9,
        //     strokeWeight: 2
        // });
        // v_missionLine.setMap(this.m_Map);

        // return v_missionLine;
        var v_color = (p_color == null)?'#75A4D3':p_color;

        return L.polyline(p_lnglatFromTo, {
            color: v_color,
            opacity: 0.9,
            weight: 2
        }).addTo(this.m_Map);
    }

    fn_drawMissionCircle(p_center, p_radius) {
        // var v_circleMission = new google.maps.Circle({
        //     fillColor: '#3232CD',
        //     strokeOpacity: 1.0,
        //     strokeWeight: 0,
        //     map: map,
        //     fillOpacity: 0.25,
        //     center: p_center,
        //     radius: parseInt(p_radius)
        // });
        // v_circleMission.setMap(this.m_Map);

        // return v_circleMission;

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
         * Set icon of a marker.
         * @param {*} p_marker 
         * @param {*} p_image 
         */
    fn_setIcon(p_marker, p_image) {
        // var v_image = {
        //     url: p_image,
        //     origin: new google.maps.Point(0, 0),
        //     anchor: new google.maps.Point(16, 16),
        //     scaledSize: new google.maps.Size(32, 32)
        // };

        // p_marker.setIcon (v_image);

    };

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
        if ((p_image==null) || (p_image==""))
        {
            p_image = './images/destination_g_32x32.png';
        }
        var v_image;
        if (p_iconsize==null) {
            p_iconsize = [32,32];
        }
        
        var v_iconAnchor = [p_iconsize[0]/2,p_iconsize[1]/2];
        if (anchor!=null)
        {
            v_iconAnchor = anchor;
        }
        
        var v_popupAnchor = [-p_iconsize[0]/2,-p_iconsize[0]/2];
        if (p_htmlTitle == null) {
            v_image = L.icon({
                iconUrl: p_image,
                iconSize: p_iconsize,
                iconAnchor: v_iconAnchor,
                popupAnchor: v_popupAnchor,
                // shadowUrl: 'my-icon-shadow.png',
                // shadowSize: [68, 95],
                // shadowAnchor: [22, 94]
            });
        } else {
            var v_htmlIcon = p_htmlTitle + "<image src='" + p_image + "'/>";
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

        }

        return v_image;
    }

    fn_setVehicleIcon(p_marker, p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize) {
        if (p_marker == null) 
            return;
        
        const v_image = this.fn_createIcon (p_image, p_title, anchor, p_draggable, p_isTop, p_htmlTitle, p_iconsize);


        p_marker.setRotationOrigin('center center');
        p_marker.setIcon(v_image);

    };


    fn_setMarkerIcon(p_marker, p_image) {
        var v_image = L.icon({
            iconUrl: p_image,
            iconSize: [
                32, 32
            ],
            iconAnchor: [
                16, 23
            ],
            popupAnchor: [
                10, 10
            ],
            // shadowUrl: 'my-icon-shadow.png',
            // shadowSize: [68, 95],
            // shadowAnchor: [22, 94]
        });

        p_marker.setIcon(v_image);

    };


    /**
         * Deletes shapes created by Geoman Plugin
         */
    fn_deleteAllEditShapes() {
        const v_editLayers = this.m_Map.pm.getGeomanDrawLayers();
        if ((v_editLayers == null) || (v_editLayers.length == 0)) 
            return;
        

        v_editLayers.forEach(function (e) {
            if (e.m_next!=null) e.m_next.remove(); // delete attached markers
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
        //     var p_call = p_callback;
        //     Me.m_elevator.getElevationForLocations({
        // 'locations': [new google.maps.LatLng(p_lat, p_lng)]
        //     }, function (results)
        //     {
        //         if (results[0])
        //         {
        //             p_call (results[0].elevation, p_lat, p_lng);
        //         }
        //         else
        //         {
        //             p_call (null);
        //         }
        //     });
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
        // if (p_infoWindow == null)
        // {
        //       p_infoWindow = new google.maps.InfoWindow(
        // {
        // });
        // }
        // else
        // {
        //       p_infoWindow.close();
        // }

        // p_infoWindow.setContent (p_content);
        // p_infoWindow.setPosition(new google.maps.LatLng(p_lat, p_lng));
        // p_infoWindow.open(this.m_Map);

        // return p_infoWindow;
        this.fn_hideInfoWindow(p_infoWindow);

        p_infoWindow = L.popup().setLatLng(new L.LatLng(p_lat, p_lng)).setContent(p_content).openOn(this.m_Map);

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

    fn_addListenerOnMouseOutClickMarker(p_marker, p_callback) {
        this.fn_addListenerOnMarker(p_marker, p_callback, 'mouseout');
    };

    fn_removeListenerOnMouseOverMarker(p_marker, p_callback) {
        p_marker.off('mouseover');
    };

    fn_removeListenerOnMouseOutClickMarker(p_marker, p_callback) {
        p_marker.off('mouseout');
    };


}


/*jshint esversion: 6 */
window.AndruavLibs = window.AndruavLibs || {
    REVISION: 'BETA'
};


if ((typeof(CONST_MAP_GOOLE) != "undefined") && (CONST_MAP_GOOLE === false)) {
    (function (lib) {
        "use strict";
        if (typeof module === "undefined" || typeof module.exports === "undefined") {
            window.AndruavLibs.AndruavMap = lib; // in ordinary browser attach library to window
        } else {
            module.exports = lib; // in nodejs
        }
    })(new CLeafLetAndruavMap);
}
