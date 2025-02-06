import React    from 'react';

import {OpenElevationAPI} from '../../../js/js_open_elevation.js'
import { mavlink20, MAVLink20Processor } from '../../../js/js_mavlink_v2.js'


export class CWayPointLocation extends React.Component {

    constructor()
    {
        super ();
        this.state = {

        };

        this.m_latRef = React.createRef();
        this.m_lngRef = React.createRef();
        this.m_altRef = React.createRef();
        this.m_baltRef = React.createRef();        
    }

    componentDidUpdate() 
    { 
    }

    handleLatChange = (e) => {
        this.setState({ lat: e.target.value });
    }

    handleLngChange = (e) => {
        this.setState({ lng: e.target.value });
    }
    
    handleAltChange = (e) => {
        this.setState({ alt: e.target.value });
    }
    
    fn_getAltitudeLabel(frame_type)
    {
        switch (frame_type)
        {
            case mavlink20.MAV_FRAME_GLOBAL:
            {
                return "abs";            
            }
            break;
            
            case mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT:
            {
                return "rel";            
            }
            break;

            case mavlink20.MAV_FRAME_GLOBAL_TERRAIN_ALT:
            {
                return "ter";            
            }
            break;

            default:
            {
                return "na";            
            }
            break;
        }
    }

    fn_editAltitudeType(e)
    {
        switch (this.props.p_shape.m_missionItem.m_frameType)
        {
            case mavlink20.MAV_FRAME_GLOBAL:
            {
                this.props.p_shape.m_missionItem.m_frameType = mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT;
            }
            break;
            
            case mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT:
            {
                this.props.p_shape.m_missionItem.m_frameType = mavlink20.MAV_FRAME_GLOBAL_TERRAIN_ALT;
            }
            break;

            case mavlink20.MAV_FRAME_GLOBAL_TERRAIN_ALT:
            {
                this.props.p_shape.m_missionItem.m_frameType = mavlink20.MAV_FRAME_GLOBAL;
            }
            break;
        }

        this.m_baltRef.current.innerText = this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType);
    }

    fn_editShape ()
    {
        const c_shap_id = this.props.p_shape.id;
        const c_mission_id = this.props.p_shape.m_main_de_mission.m_id;

        if (this.m_altRef.current) { // Check if m_altRef is not null
            this.props.p_shape.m_missionItem.alt = this.m_altRef.current.value; 
        }

        const v_lat = this.m_latRef.current.value; 
        const v_lng = this.m_lngRef.current.value; 
        this.props.p_shape.setLatLng(
                {lat:v_lat, 
                lng:v_lng});
        
        // TODO: Implement Correctly
        // if (this.props.p_shape._alt ==null)
        // {
        //     const api = new OpenElevationAPI(this.props.p_shape);
        //     api.getElevation(v_lat, v_lng)
        //     .then(elevation => this.props.p_shape._alt = elevation)
        //     .catch(error => console.error('Error fetching elevation data:', error));
        // }

        this.m_baltRef.current.innerText = this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType);
    }

    render ()
    {
        const lnglat = this.props.p_shape.getLatLng();
        
        const lat_id = "txt_lat" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id;
        const lng_id = "txt_lng" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id;
        const alt_id = "txt_alt" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id;

        return (<div className="margin_zero css_margin_top_small">
                    <p className="form-control-label text-white mb-0">3D-Location </p>
                    <div className="row margin_zero">
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={lat_id} className="form-label text-white "><small>lat</small>
                                <input id={lat_id} ref={this.m_latRef} type="number" min={-90} max={90} step="0.0001" className="form-control  input-sm  txt_margin " value={lnglat.lat} placeholder="0.00"    onChange={this.handleLatChange} />
                                </label>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={lng_id} className="form-label text-white "><small>lng</small>
                                <input id={lng_id}  ref={this.m_lngRef} type="number" min={-180} max={180} step="0.0001" className="form-control  input-sm  txt_margin " value={lnglat.lng} placeholder="0.00" onChange={this.handleLngChange} />
                                </label>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={alt_id} className="form-label text-white "><small>alt</small>
                                <div className="input-group mb-3">
                                    <input id={alt_id}  ref={this.m_altRef} type="number" min={0} max={9000} step="1.0" className="form-control  input-sm  txt_margin " placeholder="0.00" aria-label="0.00" aria-describedby="button-addon2" value={this.props.p_shape.m_missionItem.alt} onChange={this.handleAltChange}/>
                                    <button id={"btn_alt" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id}  ref={this.m_baltRef} type="button" className="btn btn-success input-sm line-height-0" onClick={ (e) => this.fn_editAltitudeType()} >{this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType)}</button>
                                </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
        );
    }
}
