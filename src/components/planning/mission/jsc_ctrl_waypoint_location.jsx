import React from 'react';
import { OpenElevationAPI } from '../../../js/js_open_elevation.js';
import { mavlink20 } from '../../../js/js_mavlink_v2.js';

export class CWayPointLocation extends React.Component {
    constructor() {
        super();
        this.state = {
            lat: 0,
            lng: 0,
            alt: 0,
        };

        this.m_latRef = React.createRef();
        this.m_lngRef = React.createRef();
        this.m_altRef = React.createRef();
        this.m_baltRef = React.createRef();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.p_shape !== this.props.p_shape) {
            const lnglat = this.props.p_shape.getLatLng();
            this.setState({
                lat: lnglat.lat,
                lng: lnglat.lng,
                alt: this.props.p_shape.m_missionItem.alt,
            });
        }
    }

    handleLatChange = (e) => {
        const lat = parseFloat(e.target.value);
        if (!isNaN(lat)) {
            this.setState({ lat });
        }
    };

    handleLngChange = (e) => {
        const lng = parseFloat(e.target.value);
        if (!isNaN(lng)) {
            this.setState({ lng });
        }
    };

    handleAltChange = (e) => {
        const alt = parseFloat(e.target.value);
        if (!isNaN(alt)) {
            this.setState({ alt });
        }
    };

    fn_getAltitudeLabel(frame_type) {
        switch (frame_type) {
            case mavlink20.MAV_FRAME_GLOBAL:
                return 'abs';
            case mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT:
                return 'rel';
            case mavlink20.MAV_FRAME_GLOBAL_TERRAIN_ALT:
                return 'ter';
            default:
                return 'na';
        }
    }

    fn_editAltitudeType = () => {
        const { m_frameType } = this.props.p_shape.m_missionItem;
        const frameTypes = [
            mavlink20.MAV_FRAME_GLOBAL,
            mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT,
            mavlink20.MAV_FRAME_GLOBAL_TERRAIN_ALT,
        ];
        const currentIndex = frameTypes.indexOf(m_frameType);
        const nextIndex = (currentIndex + 1) % frameTypes.length;
        this.props.p_shape.m_missionItem.m_frameType = frameTypes[nextIndex];
        this.m_baltRef.current.innerText = this.fn_getAltitudeLabel(frameTypes[nextIndex]);
    };

    fn_editShape = () => {
        const { lat, lng, alt } = this.state;
        const { p_shape } = this.props;

        if (this.m_altRef.current) {
            p_shape.m_missionItem.alt = alt;
        }

        p_shape.setLatLng({ lat, lng });

        // TODO: Implement elevation API call if needed
        // if (p_shape._alt == null) {
        //     const api = new OpenElevationAPI(p_shape);
        //     api.getElevation(lat, lng)
        //         .then((elevation) => (p_shape._alt = elevation))
        //         .catch((error) => console.error('Error fetching elevation data:', error));
        // }

        this.m_baltRef.current.innerText = this.fn_getAltitudeLabel(p_shape.m_missionItem.m_frameType);
    };

    render() {
        const { lat, lng, alt } = this.state;
        const { p_shape } = this.props;

        const lat_id = `txt_lat${p_shape.id}_${p_shape.m_main_de_mission.m_id}`;
        const lng_id = `txt_lng${p_shape.id}_${p_shape.m_main_de_mission.m_id}`;
        const alt_id = `txt_alt${p_shape.id}_${p_shape.m_main_de_mission.m_id}`;

        return (
            <div className="margin_zero css_margin_top_small">
                <p className="form-control-label text-white mb-0">3D-Location</p>
                <div className="row margin_zero">
                    <div className="col-4">
                        <div className="form-group">
                            <label htmlFor={lat_id} className="form-label text-white">
                                <small>lat</small>
                                <input
                                    id={lat_id}
                                    ref={this.m_latRef}
                                    type="number"
                                    min={-90}
                                    max={90}
                                    step="0.0001"
                                    className="form-control input-sm txt_margin"
                                    value={lat}
                                    placeholder="0.00"
                                    onChange={this.handleLatChange}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="form-group">
                            <label htmlFor={lng_id} className="form-label text-white">
                                <small>lng</small>
                                <input
                                    id={lng_id}
                                    ref={this.m_lngRef}
                                    type="number"
                                    min={-180}
                                    max={180}
                                    step="0.0001"
                                    className="form-control input-sm txt_margin"
                                    value={lng}
                                    placeholder="0.00"
                                    onChange={this.handleLngChange}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="form-group">
                            <label htmlFor={alt_id} className="form-label text-white">
                                <small>alt</small>
                                <div className="input-group mb-3">
                                    <input
                                        id={alt_id}
                                        ref={this.m_altRef}
                                        type="number"
                                        min={0}
                                        max={9000}
                                        step="1.0"
                                        className="form-control input-sm txt_margin"
                                        placeholder="0.00"
                                        aria-label="0.00"
                                        value={alt}
                                        onChange={this.handleAltChange}
                                    />
                                    <button
                                        id={`btn_alt${p_shape.id}_${p_shape.m_main_de_mission.m_id}`}
                                        ref={this.m_baltRef}
                                        type="button"
                                        className="btn btn-success input-sm line-height-0"
                                        onClick={this.fn_editAltitudeType}
                                    >
                                        {this.fn_getAltitudeLabel(p_shape.m_missionItem.m_frameType)}
                                    </button>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}