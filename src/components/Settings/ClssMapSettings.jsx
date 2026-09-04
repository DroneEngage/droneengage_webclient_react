import React from 'react';
import { withTranslation } from 'react-i18next';
import * as js_siteConfig from '../../js/js_siteConfig.js';
import { js_localStorage } from '../../js/js_localStorage';
import { CPasswordReveal } from '../micro_gadgets/jsc_mctrl_password_reveal.jsx';
import { js_leafletmap } from '../../js/maps/js_leafletmap.js';
import { js_map3d } from '../../js/maps/js_map3d.js';

// Each Leaflet 2D tile provider/style carries its own urlTemplate with a
// {token} placeholder. fn_resolveTileUrl (js_leafletmap.js) substitutes the
// token using whatever auth param name the provider expects (access_token=,
// key=, api_key=, apikey=, apiKey=). tileSize/zoomOffset are auto-detected
// from the URL (@2x or /512/ → 512px HiDPI) by fn_deriveTileLayerOptions.
//
// Providers marked free need no token — the {token} placeholder is absent
// and the token field is ignored for those.
const LEAFLET_STYLE_OPTIONS = [
  // ---- Mapbox (512px @2x HiDPI, access_token=) ----
  { id: 'mapbox:satellite-v9', label: 'Satellite — pure satellite imagery (no roads, boundaries, or text)', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },
  { id: 'mapbox:satellite-streets-v12', label: 'Satellite Streets — satellite imagery with vector road overlays, borders, and place labels', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },
  { id: 'mapbox:streets-v12', label: 'Streets — standard detailed vector street map', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },
  { id: 'mapbox:outdoors-v12', label: 'Outdoors — topographic map for hiking/outdoors (elevation contours, trails, parks)', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },
  { id: 'mapbox:light-v11', label: 'Light — minimalist light-gray basemap', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },
  { id: 'mapbox:dark-v11', label: 'Dark — minimalist dark-themed basemap', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },
  { id: 'mapbox:navigation-day-v1', label: 'Navigation Day — high-contrast turn-by-turn driving map (day mode)', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },
  { id: 'mapbox:navigation-night-v1', label: 'Navigation Night — high-contrast turn-by-turn driving map (night mode)', urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/512/{z}/{x}/{y}@2x?access_token={token}', color: 'text-success' },

  // ---- MapTiler (512px @2x HiDPI, key=) ----
  { id: 'maptiler:satellite', label: 'Satellite — pure satellite imagery', urlTemplate: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}@2x.jpg?key={token}', color: 'text-success' },
  { id: 'maptiler:hybrid', label: 'Hybrid — satellite imagery with vector overlays and labels', urlTemplate: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}@2x.jpg?key={token}', color: 'text-success' },
  { id: 'maptiler:streets', label: 'Streets — standard street map', urlTemplate: 'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key={token}', color: 'text-success' },
  { id: 'maptiler:topo', label: 'Topo — topographic map with contours and trails', urlTemplate: 'https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}@2x.png?key={token}', color: 'text-success' },
  { id: 'maptiler:dark', label: 'Dark — dark-themed basemap', urlTemplate: 'https://api.maptiler.com/maps/dark-v2/{z}/{x}/{y}@2x.png?key={token}', color: 'text-success' },
  { id: 'maptiler:light', label: 'Light — light-themed basemap', urlTemplate: 'https://api.maptiler.com/maps/light-v2/{z}/{x}/{y}@2x.png?key={token}', color: 'text-success' },

  // ---- Stadia Maps (512px @2x HiDPI, api_key=) ----
  { id: 'stadia:alidade_smooth', label: 'Alidade Smooth — smooth light basemap', urlTemplate: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}@2x.png?api_key={token}', color: 'text-success' },
  { id: 'stadia:alidade_smooth_dark', label: 'Alidade Smooth Dark — smooth dark basemap', urlTemplate: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}@2x.png?api_key={token}', color: 'text-success' },
  { id: 'stadia:stamen_terrain', label: 'Stamen Terrain — terrain with hill shading and contours', urlTemplate: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}@2x.png?api_key={token}', color: 'text-success' },
  { id: 'stadia:stamen_watercolor', label: 'Stamen Watercolor — artistic watercolor basemap', urlTemplate: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}@2x.jpg?api_key={token}', color: 'text-success' },
  { id: 'stadia:osm_bright', label: 'OSM Bright — bright OSM-based street map', urlTemplate: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}@2x.png?api_key={token}', color: 'text-success' },

  // ---- Thunderforest (512px @2x HiDPI, apikey=) ----
  { id: 'thunderforest:cycle', label: 'OpenCycleMap — cycling routes and trails', urlTemplate: 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}@2x.png?apikey={token}', color: 'text-success' },
  { id: 'thunderforest:transport', label: 'Transport — public transport network map', urlTemplate: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}@2x.png?apikey={token}', color: 'text-success' },
  { id: 'thunderforest:outdoors', label: 'Outdoors — outdoor recreation map', urlTemplate: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}@2x.png?apikey={token}', color: 'text-success' },
  { id: 'thunderforest:landscape', label: 'Landscape — landscape features map', urlTemplate: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}@2x.png?apikey={token}', color: 'text-success' },

  // ---- ESRI World Imagery (free, no token, 256px) ----
  { id: 'esri:world_imagery', label: 'World Imagery — ESRI satellite imagery (free, no token needed)', urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', color: 'text-success' },

  // ---- OpenStreetMap (free, no token, 256px) ----
  { id: 'osm:standard', label: 'Standard — OpenStreetMap standard street map (free, no token needed)', urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', color: 'text-success' },

  // ---- Local / Offline (no token, 256px) ----
  // airgap.local is the on-premise tile server (offline LAN). Marked
  // text-warning to flag that it only works on the local network.
  { id: 'local:airgap_sat', label: 'AirGap Satellite — local offline tile server (airgap.local:88, LAN only)', urlTemplate: 'https://airgap.local:88/sat_{x}_{y}_{z}.png', color: 'text-warning' },
];

// Group labels for the <optgroup> elements in the dropdown.
const LEAFLET_PROVIDER_GROUPS = [
  { prefix: 'mapbox:', label: 'Mapbox (HiDPI @2x, access_token=)' },
  { prefix: 'maptiler:', label: 'MapTiler (HiDPI @2x, key=)' },
  { prefix: 'stadia:', label: 'Stadia Maps (HiDPI @2x, api_key=)' },
  { prefix: 'thunderforest:', label: 'Thunderforest (HiDPI @2x, apikey=)' },
  { prefix: 'esri:', label: 'ESRI (free, no token)' },
  { prefix: 'osm:', label: 'OpenStreetMap (free, no token)' },
  { prefix: 'local:', label: 'Local / Offline (LAN only, no token)' },
];

const MAPBOX_STYLE_OPTIONS = [
  { url: 'mapbox://styles/mapbox/standard', label: 'Standard — 3D standard basemap (supports 3D landmarks & lighting)' },
  { url: 'mapbox://styles/mapbox/standard-satellite', label: 'Standard Satellite — 3D satellite basemap with dynamic labels' },
  { url: 'mapbox://styles/mapbox/satellite-streets-v12', label: 'Satellite Streets — classic satellite imagery with vector road overlays' },
  { url: 'mapbox://styles/mapbox/satellite-v9', label: 'Satellite — pure satellite imagery without labels or roads' },
  { url: 'mapbox://styles/mapbox/streets-v12', label: 'Streets — detailed vector road and transit map' },
  { url: 'mapbox://styles/mapbox/outdoors-v12', label: 'Outdoors — topographic map with terrain contours and trails' },
  { url: 'mapbox://styles/mapbox/light-v11', label: 'Light — minimal light-themed vector style' },
  { url: 'mapbox://styles/mapbox/dark-v11', label: 'Dark — minimal dark-themed vector style' },
];

function fn_buildLeafletUrlFromStyleId(styleId) {
  // Look up the urlTemplate from the options array. Each provider carries
  // its own auth param name via the {token} placeholder.
  const opt = LEAFLET_STYLE_OPTIONS.find((o) => o.id === styleId);
  return opt ? opt.urlTemplate : LEAFLET_STYLE_OPTIONS[0].urlTemplate;
}

function fn_extractStyleIdFromLeafletUrl(url) {
  // Match the stored URL template against the options array. Falls back to
  // the first option if no match (e.g. a custom URL pasted into
  // config.local.json that isn't in the preset list).
  const normalized = (url || '').replace(/\s/g, '');
  const match = LEAFLET_STYLE_OPTIONS.find((o) => o.urlTemplate.replace(/\s/g, '') === normalized);
  if (match) return match.id;

  // Backward compat: old stored URLs used the Mapbox regex pattern without
  // {token} — extract the style id and map it to the new mapbox: prefix.
  const legacyMatch = /\/styles\/v1\/mapbox\/([^/]+)\//.exec(url || '');
  if (legacyMatch) {
    const legacyId = `mapbox:${legacyMatch[1]}`;
    if (LEAFLET_STYLE_OPTIONS.some((o) => o.id === legacyId)) return legacyId;
  }

  return LEAFLET_STYLE_OPTIONS[0].id;
}

class ClssMapSettings extends React.Component {
  constructor() {
    super();
    this.state = {
      leafletAccessToken: '',
      mapboxAccessToken: '',
      leafletStyleId: LEAFLET_STYLE_OPTIONS[0].id,
      mapboxStyleUrl: MAPBOX_STYLE_OPTIONS[0].url,
    };
  }

  componentDidMount() {
    const localStorageLeafletToken = js_localStorage.fn_getMapLeafletAccessToken();
    const localStorageMapboxToken = js_localStorage.fn_getMapbox3DAccessToken();
    const localStorageUrl = js_localStorage.fn_getMapLeafletUrlMap();
    const localStorageStyle = js_localStorage.fn_getMapboxStyle();

    this.setState({
      leafletAccessToken: localStorageLeafletToken || '',
      mapboxAccessToken: localStorageMapboxToken || '',
      leafletStyleId: fn_extractStyleIdFromLeafletUrl(localStorageUrl),
      mapboxStyleUrl: localStorageStyle || MAPBOX_STYLE_OPTIONS[0].url,
    });
  }

  fn_saveMapSettings = () => {
    const { leafletAccessToken, mapboxAccessToken, leafletStyleId, mapboxStyleUrl } = this.state;

    // Leaflet raster tile token (separate from the Mapbox GL 3D token —
    // different providers may use different keys, e.g. MapTiler key=
    // vs Mapbox access_token=).
    if (leafletAccessToken && leafletAccessToken.trim() !== '') {
      js_localStorage.fn_setMapLeafletAccessToken(leafletAccessToken);
    } else {
      js_localStorage.fn_removeMapLeafletAccessToken();
    }

    // Mapbox GL 3D access token (used by the 3D map view).
    if (mapboxAccessToken && mapboxAccessToken.trim() !== '') {
      js_localStorage.fn_setMapbox3DAccessToken(mapboxAccessToken);
    } else {
      js_localStorage.fn_removeMapbox3DAccessToken();
    }

    js_localStorage.fn_setMapLeafletUrlMap(fn_buildLeafletUrlFromStyleId(leafletStyleId));
    js_localStorage.fn_setMapboxStyle(mapboxStyleUrl);
  };

  fn_handleLeafletAccessTokenChange = (e) => {
    this.setState({ leafletAccessToken: e.target.value }, this.fn_saveMapSettings);
  };

  fn_handleMapboxAccessTokenChange = (e) => {
    this.setState({ mapboxAccessToken: e.target.value }, this.fn_saveMapSettings);
  };

  fn_handleLeafletStyleChange = (e) => {
    this.setState({ leafletStyleId: e.target.value }, this.fn_saveMapSettings);
  };

  fn_handleMapboxStyleChange = (e) => {
    this.setState({ mapboxStyleUrl: e.target.value }, this.fn_saveMapSettings);
  };

  // Swap the live tile layer / Mapbox GL style in place instead of
  // reloading the whole site - a full page reload would also drop the
  // websocket session (login, connected units, telemetry) just to pick up
  // a map style change.
  fn_refreshMap = () => {
    this.fn_saveMapSettings();
    js_leafletmap.fn_refreshBasemap();
    js_map3d.fn_refreshStyle();
  };

  render() {
    const { t } = this.props;
    const dir = this.props.i18n.language === 'ar' ? 'rtl' : 'ltr';
    const { leafletAccessToken, mapboxAccessToken, leafletStyleId, mapboxStyleUrl } = this.state;

    return (
      <fieldset dir={dir}>
        <div className="row mb-2 align-items-center">
          <label htmlFor="sel_leaflet_style" className="col-sm-4 col-form-label">
            Map-2D Style
          </label>
          <select
            className="form-control col-sm-8"
            id="sel_leaflet_style"
            value={leafletStyleId}
            onChange={this.fn_handleLeafletStyleChange}
          >
            {LEAFLET_PROVIDER_GROUPS.map((group) => (
              <optgroup key={group.prefix} label={group.label}>
                {LEAFLET_STYLE_OPTIONS
                  .filter((opt) => opt.id.startsWith(group.prefix))
                  .map((opt) => (
                    <option key={opt.id} value={opt.id} className={opt.color}>
                      {opt.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_leaflet_access_token" className="col-sm-4 col-form-label">
            Map-2D Access Token
          </label>
          <CPasswordReveal
            className="col-sm-8"
            id="txt_leaflet_access_token"
            value={leafletAccessToken}
            onChange={this.fn_handleLeafletAccessTokenChange}
          />
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="sel_mapbox_style" className="col-sm-4 col-form-label">
            Mapbox 3D Style
          </label>
          <select
            className="form-control col-sm-8"
            id="sel_mapbox_style"
            value={mapboxStyleUrl}
            onChange={this.fn_handleMapboxStyleChange}
          >
            {MAPBOX_STYLE_OPTIONS.map((opt) => (
              <option key={opt.url} value={opt.url}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_mapbox_access_token" className="col-sm-4 col-form-label">
            Mapbox 3D Token
          </label>
          <CPasswordReveal
            className="col-sm-8"
            id="txt_mapbox_access_token"
            value={mapboxAccessToken}
            onChange={this.fn_handleMapboxAccessTokenChange}
          />
        </div>
        <div className="row mb-2">
          <div className="col-sm-8 offset-sm-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.fn_refreshMap}
            >
              Refresh Map
            </button>
          </div>
        </div>
      </fieldset>
    );
  }
}

export default withTranslation(['', 'globalSettings'])(ClssMapSettings);
