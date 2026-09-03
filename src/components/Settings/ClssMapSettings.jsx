import React from 'react';
import { withTranslation } from 'react-i18next';
import * as js_siteConfig from '../../js/js_siteConfig.js';
import { js_localStorage } from '../../js/js_localStorage';

class ClssMapSettings extends React.Component {
  constructor() {
    super();
    this.key = Math.random().toString();
    this.leafletAccessTokenRef = React.createRef();
    this.leafletUrlMapRef = React.createRef();
    this.mapbox3DAccessTokenRef = React.createRef();
    this.mapboxStyleRef = React.createRef();
  }

  componentDidMount() {
    const localStorageToken = js_localStorage.fn_getMapLeafletAccessToken();
    const localStorageUrl = js_localStorage.fn_getMapLeafletUrlMap();
    const localStorage3DToken = js_localStorage.fn_getMapbox3DAccessToken();
    const localStorageStyle = js_localStorage.fn_getMapboxStyle();

    this.leafletAccessTokenRef.current.value = localStorageToken || '';
    this.leafletUrlMapRef.current.value = localStorageUrl || '';
    this.mapbox3DAccessTokenRef.current.value = localStorage3DToken || '';
    this.mapboxStyleRef.current.value = localStorageStyle || '';
  }

  fn_saveMapSettings(e) {
    const leafletToken = this.leafletAccessTokenRef.current.value;
    const leafletUrl = this.leafletUrlMapRef.current.value;
    const mapbox3DToken = this.mapbox3DAccessTokenRef.current.value;
    const mapboxStyle = this.mapboxStyleRef.current.value;

    if (leafletToken && leafletToken.trim() !== '') {
      js_localStorage.fn_setMapLeafletAccessToken(leafletToken);
    } else {
      js_localStorage.fn_removeMapLeafletAccessToken();
    }

    if (leafletUrl && leafletUrl.trim() !== '') {
      js_localStorage.fn_setMapLeafletUrlMap(leafletUrl);
    } else {
      js_localStorage.fn_removeMapLeafletUrlMap();
    }

    if (mapbox3DToken && mapbox3DToken.trim() !== '') {
      js_localStorage.fn_setMapbox3DAccessToken(mapbox3DToken);
    } else {
      js_localStorage.fn_removeMapbox3DAccessToken();
    }

    if (mapboxStyle && mapboxStyle.trim() !== '') {
      js_localStorage.fn_setMapboxStyle(mapboxStyle);
    } else {
      js_localStorage.fn_removeMapboxStyle();
    }
  }

  render() {
    const { t } = this.props;
    const dir = this.props.i18n.language === 'ar' ? 'rtl' : 'ltr';

    return (
      <fieldset dir={dir}>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_leaflet_access_token" className="col-sm-4 col-form-label">
            Leaflet Access Token
          </label>
          <input
            type="text"
            className="form-control col-sm-8"
            id="txt_leaflet_access_token"
            ref={this.leafletAccessTokenRef}
            onChange={(e) => this.fn_saveMapSettings(e)}
          />
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_leaflet_url_map" className="col-sm-4 col-form-label">
            Leaflet URL Map
          </label>
          <input
            type="text"
            className="form-control col-sm-8"
            id="txt_leaflet_url_map"
            ref={this.leafletUrlMapRef}
            onChange={(e) => this.fn_saveMapSettings(e)}
          />
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_mapbox_3d_access_token" className="col-sm-4 col-form-label">
            Mapbox 3D Access Token
          </label>
          <input
            type="text"
            className="form-control col-sm-8"
            id="txt_mapbox_3d_access_token"
            ref={this.mapbox3DAccessTokenRef}
            onChange={(e) => this.fn_saveMapSettings(e)}
          />
        </div>
        <div className="row mb-2 align-items-center">
          <label htmlFor="txt_mapbox_style" className="col-sm-4 col-form-label">
            Mapbox Style
          </label>
          <input
            type="text"
            className="form-control col-sm-8"
            id="txt_mapbox_style"
            ref={this.mapboxStyleRef}
            onChange={(e) => this.fn_saveMapSettings(e)}
          />
        </div>
      </fieldset>
    );
  }
}

export default withTranslation(['', 'globalSettings'])(ClssMapSettings);
