import React    from 'react';

import { mavlink20 } from '../../../js/js_mavlink_v2.js'
import {EVENTS as js_event} from '../../../js/events/js_eventList.js'
import { js_eventEmitter } from '../../../js/events/js_eventEmitter.js'

/**
 * Editable lat/lng/alt form for the currently selected waypoint (p_shape).
 *
 * lat/lng/alt are kept as *local component state* (fully controlled inputs)
 * rather than being read straight from props, so the user can freely type
 * into the fields. State is only re-synced from props:
 *   - on mount, or when a different waypoint is selected (see
 *     getDerivedStateFromProps), and
 *   - when the marker is dragged on the map (see fn_onShapeEdited).
 * Clicking "Apply" (fn_editShape, called by the parent) commits the local
 * state back onto the shape/mission item.
 */
export class CWayPointLocation extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            m_shapeId: null, // id of the waypoint the current lat/lng/alt belong to
            lat: 0,
            lng: 0,
            alt: 0,
        };

        this.m_latRef = React.createRef();
        this.m_lngRef = React.createRef();
        this.m_altRef = React.createRef();
        this.m_baltRef = React.createRef();

        // Browsers reset the caret to the end of an <input type="number"> every
        // time its `value` is set programmatically (which React does on every
        // controlled re-render), even when the value doesn't visually change.
        // We save the caret position on change and restore it after the render.
        this.m_pendingCaret = null;

        js_eventEmitter.fn_subscribe(js_event.EE_onShapeEdited, this, this.fn_onShapeEdited);
    }

    componentWillUnmount()
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_onShapeEdited, this);
    }

    componentDidUpdate()
    {
        // Restore the caret position saved in fn_handleFieldChange, undoing
        // the browser's default "jump to end" behavior on controlled
        // <input type="number"> updates.
        if (!this.m_pendingCaret) return;

        const { ref, pos } = this.m_pendingCaret;
        this.m_pendingCaret = null;

        const input = ref.current;
        if (input && document.activeElement === input && typeof input.setSelectionRange === 'function')
        {
            try { input.setSelectionRange(pos, pos); } catch (e) { /* not supported for this input's current type/state */ }
        }
    }

    /**
     * Shared onChange handler for the lat/lng/alt inputs: updates the given
     * state field and remembers the caret position to restore afterwards.
     */
    fn_handleFieldChange = (e, field, ref) => {
        this.m_pendingCaret = { ref, pos: e.target.selectionStart };
        this.setState({ [field]: e.target.value });
    }

    /**
     * Keeps the form in sync when the marker is dragged directly on the map
     * (Leaflet-Geoman 'pm:edit') rather than edited through this form.
     */
    fn_onShapeEdited(me, p_shape)
    {
        if (!p_shape || !me.props.p_shape || p_shape.id !== me.props.p_shape.id) return;
        const lnglat = me.props.p_shape.getLatLng();
        me.setState({
            lat: lnglat.lat,
            lng: lnglat.lng,
        });
    }

    static getDerivedStateFromProps(props, state)
    {
        // Sync from props only when the selected shape changes (switching waypoints).
        // This preserves the user's in-progress edits while typing.
        if (props.p_shape && props.p_shape.id !== state.m_shapeId)
        {
            const lnglat = props.p_shape.getLatLng();
            return {
                m_shapeId: props.p_shape.id,
                lat: lnglat.lat,
                lng: lnglat.lng,
                alt: props.p_shape.m_missionItem.alt,
            };
        }
        return null;
    }

    handleLatChange = (e) => {
        this.fn_handleFieldChange(e, 'lat', this.m_latRef);
    }

    handleLngChange = (e) => {
        this.fn_handleFieldChange(e, 'lng', this.m_lngRef);
    }

    handleAltChange = (e) => {
        this.fn_handleFieldChange(e, 'alt', this.m_altRef);
    }
    
    /**
     * Maps a MAVLink altitude frame type to the short label shown on the
     * altitude-type toggle button (abs/rel/ter).
     */
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

    /**
     * Cycles the waypoint's altitude frame type (abs -> rel -> ter -> abs)
     * when the altitude-type button next to the alt input is clicked.
     */
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

    /**
     * Commits the locally-edited lat/lng/alt onto the actual marker/mission
     * item. Called by the parent (ClssSingle_Mission_Item_Card) when the
     * "Apply" button is clicked.
     */
    fn_editShape ()
    {
        if (!this.props.p_shape || !this.props.p_shape.m_main_de_mission) return;

        this.props.p_shape.m_missionItem.alt = parseFloat(this.state.alt);

        const v_lat = parseFloat(this.state.lat);
        const v_lng = parseFloat(this.state.lng);
        this.props.p_shape.setLatLng({ lat: v_lat, lng: v_lng });

        this.m_baltRef.current.innerText = this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType);
    }

    render ()
    {
        const lat_id = "txt_lat" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id;
        const lng_id = "txt_lng" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id;
        const alt_id = "txt_alt" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id;

        return (<div className="margin_zero css_margin_top_small">
                    <p className="form-control-label txt-theme-aware mb-0">3D-Location </p>
                    <div className="row margin_zero">
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={lat_id} className="form-label txt-theme-aware "><small>lat</small>
                                <input id={lat_id} ref={this.m_latRef} type="number" min={-90} max={90} step="0.0001" className="form-control  input-sm  txt_margin " value={this.state.lat} placeholder="0.00" onChange={this.handleLatChange} />
                                </label>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={lng_id} className="form-label txt-theme-aware "><small>lng</small>
                                <input id={lng_id}  ref={this.m_lngRef} type="number" min={-180} max={180} step="0.0001" className="form-control  input-sm  txt_margin " value={this.state.lng} placeholder="0.00" onChange={this.handleLngChange} />
                                </label>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="form-group">
                                <label htmlFor={alt_id} className="form-label txt-theme-aware "><small>alt</small>
                                <div className="input-group mb-3">
                                    <input id={alt_id}  ref={this.m_altRef} type="number" min={0} max={9000} step="1.0" className="form-control  input-sm  txt_margin " placeholder="0.00" aria-label="0.00" aria-describedby="button-addon2" value={this.state.alt} onChange={this.handleAltChange} />
                                    <button id={"btn_alt" + this.props.p_shape.id + "_" + this.props.p_shape.m_main_de_mission.m_id}  ref={this.m_baltRef} type="button" className="btn btn-success input-sm line-height-0 border-dark border-1" onClick={ (e) => this.fn_editAltitudeType()} >{this.fn_getAltitudeLabel(this.props.p_shape.m_missionItem.m_frameType)}</button>
                                </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
        );
    }
}
