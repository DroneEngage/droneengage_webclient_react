import $ from 'jquery';

import React    from 'react';

import {OpenElevationAPI} from '../../../js/js_open_elevation.js'
import { mavlink20, MAVLink20Processor } from '../../../js/js_mavlink_v2.js'


export class CWayPointLocation extends React.Component {

    constructor()
    {
        super ();
        this.state = {

        };
    }

    componentDidUpdate() 
    { 
        var lnglat = this.props.p_shape.getLatLng();
        //$('#txt_lat' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val(lnglat.lat); 
        //$('#txt_lng' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val(lnglat.lng); 
        //$('#txt_alt' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val(this.props.p_shape.m_missionItem.alt); 
        //$('btn_alt' + this.props.p_shape.id + '_' + this.props.p_shape.m_mission.m_id).text(this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType));
    }

    handleLatChange(e)
    {

    }

    handleLngChange(e)
    {

    }
    
    handleAltChange(e)
    {

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

        $('#btn_alt' + this.props.p_shape.id + '_' + this.props.p_shape.m_mission.m_id).text(this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType));
    
    }

    fn_editShape ()
    {
        const c_shap_id = this.props.p_shape.id;
        const c_mission_id = this.props.p_shape.m_mission.m_id;

        this.props.p_shape.m_missionItem.alt = $('#txt_alt'+ c_shap_id + "_" + c_mission_id).val(); 

        const v_lat = $('#txt_lat'+ c_shap_id + "_" + c_mission_id).val();
        const v_lng = $('#txt_lng'+ c_shap_id + "_" + c_mission_id).val();
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

        $('#btn_alt' + this.props.p_shape.id + '_' + this.props.p_shape.m_mission.m_id).text(this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType));
    }

    render ()
    {
        var lnglat = this.props.p_shape.getLatLng();
        
        const lat_id = "txt_lat" + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id;
        const lng_id = "txt_lng" + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id;
        const alt_id = "txt_alt" + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id;

        return (<div className="margin_zero css_margin_top_small">
                    <p className="form-control-label text-white mb-0">3D-Location </p>
                    <div className="row margin_zero">
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={lat_id} className="form-label text-white "><small>lat</small>
                                <input id={lat_id}  type="number" min={-90} max={90} step="0.0001" className="form-control  input-sm  txt_margin " value={lnglat.lat} placeholder="0.00"    onChange={this.handleLatChange} />
                                </label>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={lng_id} className="form-label text-white "><small>lng</small>
                                <input id={lng_id}  type="number" min={-180} max={180} step="0.0001" className="form-control  input-sm  txt_margin " value={lnglat.lng} placeholder="0.00" onChange={this.handleLngChange} />
                                </label>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={alt_id} className="form-label text-white "><small>alt</small>
                                <div className="input-group mb-3">
                                    <input id={alt_id}  type="number" min={0} max={9000} step="1.0" className="form-control  input-sm  txt_margin " placeholder="0.00" aria-label="0.00" aria-describedby="button-addon2" value={this.props.p_shape.m_missionItem.alt} onChange={this.handleAltChange}/>
                                    <button id={"btn_alt" + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id}  type="button" className="btn btn-success input-sm line-height-0" onClick={ (e) => this.fn_editAltitudeType()} >{this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType)}</button>
                                </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
        );
    }
}
