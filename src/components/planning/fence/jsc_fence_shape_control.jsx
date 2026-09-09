import React    from 'react';

import {EVENTS as js_event} from '../../../js/events/js_eventList.js'
import * as js_common from '../../../js/js_common.js'
import * as js_andruavMessages from '../../../js/protocol/messages/js_andruavMessages'
import {EventBridge} from '../../../js/hooks/EventBridge.jsx'


const DEFAULT_DISTANCE = 10;
class ClssFenceAction extends React.Component {


    constructor(props)
    {
        super(props);
        this.state={
            m_update: 0
        };

        this.m_flag_mounted = false;
        
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
    }

    
    /**
     * When checkbox item is selected.
     * @param {*} e 
     */
    fn_onSelect(e)
    {
        this.props.shape.m_geofenceInfo.isHardFence=e.target.value; 
        
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_update ()
    {
        	//(this.props.hardClssFenceAction==null)?$('#geo #sel').val(0):$('#geo #sel').val(this.props.hardClssFenceAction);
	
    }
    

    render ()
    {
        const selected_value = ((this.props.shape.m_geofenceInfo.isHardFence === null ||  this.props.shape.m_geofenceInfo.isHardFence === undefined)?0:this.props.shape.m_geofenceInfo.isHardFence);
        return (
                <div className="form-group text-left"><label className="control-label">Fence Action </label>
                <select id='sel' className="form-control" onChange={(e) => this.fn_onSelect(e)} value={selected_value}>
                                                          <option value="0" >Soft Fence</option>
														  <option value="2" >Make RTL</option>
														  <option value="12">Make LAND</option>
														  <option value="10">Make LOITER</option>
                                                          <option value="17">Make BRAKE/HOLD</option>
                                                          <option value="21">Make Smart RTL</option>
                                                          </select>
			    </div>
        );
    }

}

class ClssShapeControl extends React.Component {
    constructor()
	{
		super ();
		this.state = {

		};

        // Refs to the form fields rendered by the subclasses. They are
        // declared on the parent so the shared fn_displayShapeData /
        // fn_editShape can read/write them. Each subclass only attaches the
        // ref for the input it actually renders (e.g. ClssPolygonControl
        // renders #name_edit_shape / #chk_restricted_area instead of
        // #name / #chk, so it leaves nameRef/chkRef unattached — preserving
        // the legacy no-op where the #geo #name selector matched nothing
        // for it).
        this.nameRef = React.createRef();
        this.chkRef = React.createRef();
        this.distanceRef = React.createRef();
        this.radiusRef = React.createRef();
    }

    fn_init ()
    {
        if (this.props.shape.m_geofenceInfo==null)
        {
            this.props.shape.m_geofenceInfo = {
                m_geoFenceName : ('fence_' + js_common.fn_generateRandomString(4)),
                m_valid : false,
                m_shouldKeepOutside : false,
                m_deleted: false
            };

        }

        this.fn_updateToolTip();
    }

    fn_updateCheckBox(p_ctrl)
    {
        // p_ctrl is a DOM element (e.target from fn_onCheck, or the chkRef
        // DOM node from fn_displayShapeData). jQuery addClass/removeClass
        // is replaced by classList; a null guard preserves the legacy
        // no-op when the checkbox ref is not attached (ClssPolygonControl).
        if (p_ctrl == null) return;
        if (this.props.shape.m_geofenceInfo.m_shouldKeepOutside === true)
        {
            p_ctrl.classList.add('bg-danger');
        }
        else
        {
            p_ctrl.classList.remove('bg-danger');
        }
    }

    fn_onCheck (e)
    {
        this.props.shape.m_geofenceInfo.m_shouldKeepOutside = e.target.checked;
        this.fn_updateCheckBox (e.target);

        this.fn_editShape();
    }

    fn_displayShapeData ()
    {
        if (this.props.shape.m_geofenceInfo != null) {
            if (this.nameRef.current) this.nameRef.current.value = this.props.shape.m_geofenceInfo.m_geoFenceName;
            if (this.chkRef.current) this.chkRef.current.checked = this.props.shape.m_geofenceInfo.m_shouldKeepOutside;
            this.fn_updateCheckBox(this.chkRef.current);
			//(this.props.shape.m_geofenceInfo.isHardFence==null)?$('#geo #sel').val(0):$('#geo #sel').val(this.props.shape.m_geofenceInfo.isHardFence);
		}

     }

     /**
      * Update tooltip location and contents.
      */
     fn_updateToolTip()
     {
        this.props.shape.unbindTooltip();
        this.props.shape.bindTooltip(this.props.shape.m_geofenceInfo.m_geoFenceName, {sticky: true, permanent: true, className: "bg-transparent fence_tooltip border-0 fs-6 txt-theme-aware", opacity: 0.5, ffset: [0, 0] });
     }

     fn_editShape ()
     {
            if (this.props.shape.m_geofenceInfo == null) {this.props.shape.m_geofenceInfo= {};}

			//this.props.shape.m_geofenceInfo.m_shouldKeepOutside = this.state.restricted!=null?this.state.restricted:false;
        	let v_name = this.nameRef.current ? this.nameRef.current.value : undefined;
            if (v_name === "" || v_name === null || v_name === undefined) v_name = ('fence_' + js_common.fn_generateRandomString(4));
			this.props.shape.m_geofenceInfo.m_geoFenceName      = v_name;
			// #sel is rendered by the ClssFenceAction child component, so it
			// has no ref here; look it up by id. It always exists when a fence
			// control is rendered, and getElementById matches the legacy
			// #geo #sel selection (ids are unique in the document).
			this.props.shape.m_geofenceInfo.isHardFence       = parseInt(document.getElementById('sel') ? document.getElementById('sel').value : undefined);
			this.props.shape.m_geofenceInfo.m_maximumDistance   = 0;

			let color;
			if(this.props.shape.m_geofenceInfo.m_shouldKeepOutside) {color='#FF1493';} else {color='#32CD32';}
            this.props.shape.setStyle({
                color: color
            });
			this.props.shape.m_geofenceInfo.m_valid = true;
            this.fn_updateToolTip();
     }
}


class ClssPolygonControl extends ClssShapeControl {
    constructor()
	{
		super ();
	}

    fn_displayShapeData ()
    {
        super.fn_displayShapeData()

        if (this.props.shape.m_geofenceInfo != null) {
            // Polygon has no #distance input, so distanceRef is never
            // attached here — the guard preserves the legacy no-op where
            // the #geo #distance selector matched nothing.
            if (this.distanceRef.current) this.distanceRef.current.value = this.props.shape.m_geofenceInfo.m_maximumDistance;
        }

    }

    fn_editShape ()
	{
		super.fn_editShape ();
	}


    componentDidUpdate () {
        js_common.fn_console_log ("componentWillUpdate");
		this.fn_displayShapeData();
    }
    
    componentDidMount ()
    {
         js_common.fn_console_log ("componentDidMount");
		this.fn_displayShapeData();
    }
    
   
    render() {

        
        this.fn_init ();
        
        return (

            <div key={this.props.shape.id} id="geo" className="card txt-theme-aware bg-primary mb-3">
                <h4 className="card-header text-center">Polygon Fence</h4>
                <div className="card-body">
                <div className="form-group">
                    <label>Name</label>
                    <input type='text' id='name_edit_shape' className="form-control input-sm"  onChange={(e) => this.fn_editShape()}/>
                </div>
                <div className="form-check form-switch">
                <input className="form-check-input " type="checkbox" id='chk_restricted_area' onChange={(e) => this.fn_onCheck(e)}/>
                <label className="form-check-label" htmlFor="chk_restricted_area">Restricted Area</label>
                </div>
                <ClssFenceAction shape={this.props.shape} hardClssFenceAction={this.props.shape.m_geofenceInfo && this.props.shape.m_geofenceInfo.isHardFence!=null?this.props.shape.m_geofenceInfo.isHardFence:0}/>
                <button className="button btn-primary" id='btn_fence_apply'  onClick={ (e) => this.fn_editShape()}>Apply</button>
                </div> 
            </div> 
            );
           
     }
}



class ClssPolylineControl extends ClssShapeControl {
    
    
    constructor()
	{
		super ();
	}

    fn_displayShapeData ()
    {
        super.fn_displayShapeData()
        if (this.props.shape.m_geofenceInfo.m_maximumDistance ==null)
        {
            this.props.shape.m_geofenceInfo.m_maximumDistance = DEFAULT_DISTANCE
        }
       if (this.distanceRef.current) this.distanceRef.current.value = Math.round(this.props.shape.m_geofenceInfo.m_maximumDistance);
     }

    fn_editShape ()
	{
		super.fn_editShape ();

        this.props.shape.m_geofenceInfo.m_maximumDistance = parseInt(this.distanceRef.current ? this.distanceRef.current.value : undefined);
	}


    componentDidUpdate () {
        js_common.fn_console_log ("componentWillUpdate");
		this.fn_displayShapeData();
    }
    
    componentDidMount ()
    {
         js_common.fn_console_log ("componentDidMount");
		this.fn_displayShapeData();
    }
    
   
    render() {

        this.fn_init ();

        return (

            <div key={this.props.shape.id} id="geo" className="card txt-theme-aware bg-primary mb-3">
                <h4 className="card-header  text-center">Polyline Fence</h4>
                <div className="card-body">
                <div className="form-group">
                    <label>Name</label>
                    <input type='text' id='name' ref={this.nameRef} className="form-control input-sm"  onChange={(e) => this.fn_editShape()}/>
                </div>
                <div className="form-check form-switch">
                    <input className="form-check-input " type="checkbox" id='chk' ref={this.chkRef} onChange={(e) => this.fn_onCheck(e)}/>
                    <label className="form-check-label" htmlFor="chk">Restricted Area</label>
                </div>
                <ClssFenceAction shape={this.props.shape} hardClssFenceAction={this.props.shape.m_geofenceInfo && this.props.shape.m_geofenceInfo.isHardFence!=null?this.props.shape.m_geofenceInfo.isHardFence:0}/>
                <div className="form-group text-left"><label className="control-label">Minimum Distance</label> <div className="form-inline text-left"><input type='number' 		id='distance' ref={this.distanceRef} className="form-control" /> &nbsp; meters</div></div>
		        <button className="button btn-primary" id='btn'  onClick={ (e) => this.fn_editShape()}>Apply</button>
                </div> 
            </div> 
                    );
           
     }
}


class ClssCircleControl extends ClssShapeControl {
    constructor()
	{
		super ();
	}

   

    fn_displayShapeData ()
    {
        super.fn_displayShapeData()

        if (this.radiusRef.current) this.radiusRef.current.value = Math.round(this.props.shape.getRadius());
    }

    fn_editShape ()
    {
        super.fn_editShape()

        this.props.shape.m_geofenceInfo.m_maximumDistance = parseInt(this.radiusRef.current ? this.radiusRef.current.value : undefined);
	}

   

    componentDidUpdate () {
        js_common.fn_console_log ("componentWillUpdate");
		this.fn_displayShapeData();
    }
    
    componentDidMount ()
    {
         js_common.fn_console_log ("componentDidMount");
		 this.fn_displayShapeData();
    }
    
   
    render() {

        this.fn_init ();
        
        return (

            <div key={this.props.shape.id} id="geo" className="card txt-theme-aware bg-primary mb-3">
		        <h4 className="card-header  text-center">Circle Fence</h4>
                <div className="card-body">
                <div className="form-group">
                    <label>Name</label>
                    <input type='text' id='name' ref={this.nameRef} className="form-control input-sm"  onChange={(e) => this.fn_editShape()}/>
                </div>
                <div className="form-check form-switch">
                <input className="form-check-input " type="checkbox" id='chk' ref={this.chkRef} onChange={(e) => this.fn_onCheck(e)}/>
                <label className="form-check-label" htmlFor="chk">Restricted Area</label>
                </div>
		        <ClssFenceAction shape={this.props.shape} hardClssFenceAction={this.props.shape.m_geofenceInfo && this.props.shape.m_geofenceInfo.isHardFence!=null?this.props.shape.m_geofenceInfo.isHardFence:0}/>
                <div className="form-group text-left">
                        <label className="control-label">Radius</label> 
                        <div className="form-inline text-left">
                        <input type='number' id='radius' ref={this.radiusRef} className="form-control" readOnly/> &nbsp; meters
                        </div>
                </div>
	            <button className="button btn-primary" id='btn'  onClick={ (e) => this.fn_editShape()}>Apply</button>
                </div> 
            </div> 
                    );
           
     }
}

class ClssRectangleControl extends ClssShapeControl {

    constructor()
	{
		super ();
		
    }

   
    componentDidUpdate () {
        js_common.fn_console_log ("componentWillUpdate");
		this.fn_displayShapeData();
    }
    
    componentDidMount ()
    {
         js_common.fn_console_log ("componentDidMount");
		this.fn_displayShapeData();
    }
    
   
    render() {

        this.fn_init ();

        return (
            <div key={this.props.shape.id} id="geo" className="card txt-theme-aware bg-primary mb-3">
                <h4 className="card-header  text-center">Rectangle Fence</h4>
                <div className="card-body">
                <div className="form-group">
                    <label>Name</label>
                    <input type='text' id='name' ref={this.nameRef} className="form-control input-sm" onChange={(e) => this.fn_editShape()}/>
                </div>
                <div className="form-check form-switch">
                <input className="form-check-input " type="checkbox" id='chk' ref={this.chkRef} onChange={(e) => this.fn_onCheck(e)}/>
                <label className="form-check-label" htmlFor="chk">Restricted Area</label>
                </div>
		        <ClssFenceAction shape={this.props.shape} hardClssFenceAction={this.props.shape.m_geofenceInfo && this.props.shape.m_geofenceInfo.isHardFence!=null?this.props.shape.m_geofenceInfo.isHardFence:0}/>
                <button className="button btn-primary" id='btn'  onClick={ (e) => this.fn_editShape()}>Apply</button>
                </div>
            </div>
 		
		            );
     }
}




export default class ClssFence_Shape_Control extends React.Component {
  
    constructor()
	{
		super ();
		this.state = {
			
		};

    
        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }



    fn_onSocketStatus (p_params) {

        if (p_params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {
            this.setState({is_connected:true});
        }
        else
        {
            this.setState({is_connected:false});
        }
    }


    fn_onShapeCreated (p_shape)
    {
        // Mission waypoint markers are not fences; ignore them here.
        if (p_shape.pm.m_shape_type === 'Marker') return;

        js_common.fn_console_log ("fn_onShapeCreated: " + p_shape);
        this.setState({m_shape: p_shape});
    }


    /**
     *
     * @param {*} p_event
     *      p_event
            {
                latlng: { lat, lng}
                target: shape
            }
     */
    fn_onShapeSelected (p_event)
    {
        this.setState({m_shape: p_event});
    }

    fn_onShapeEdited(p_shape)
    {
        if (p_shape.pm.m_shape_type === 'Marker') return;
        this.setState({m_shape: p_shape});
    }

    fn_onShapeDeleted (p_shape)
    {
        if (p_shape.pm.m_shape_type === 'Marker') return;

        if (p_shape.m_geofenceInfo!= null)
        {
            p_shape.m_geofenceInfo.m_deleted = true;
        }
        this.setState({m_shape: null});
    }

    
    componentWillUnmount () {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }

    _renderswitch (v_unit)
    {
        switch (this.state.m_shape.pm.m_shape_type)
        {
            case 'Marker':
            break;
            
            case 'Rectangle':
                v_unit.push (<ClssRectangleControl key={this.state.m_shape} shape = {this.state.m_shape}></ClssRectangleControl>);
            break;   

            case 'Circle':
                v_unit.push (<ClssCircleControl key={this.state.m_shape} shape = {this.state.m_shape}></ClssCircleControl>);
            break;

            case 'Polygon':
                v_unit.push (<ClssPolygonControl key={this.state.m_shape} shape = {this.state.m_shape}></ClssPolygonControl>);
            break;
        
            case 'Line':
                v_unit.push (<ClssPolylineControl key={this.state.m_shape} shape = {this.state.m_shape}></ClssPolylineControl>);
            break;

            default:
                v_unit.push (<h4 key='FCSCtrld1' >Please Create or Select a Region</h4>);
            break;
        }

    }
    
    render() {
   
        let v_unit = [];
        

        if ((this.state.m_shape === null || this.state.m_shape === undefined) 
        || ((this.state.m_shape.m_geofenceInfo !== null && this.state.m_shape.m_geofenceInfo !== undefined) && (this.state.m_shape.m_geofenceInfo.m_deleted === true))
        )
        {
            v_unit.push (<h6 key='FCSCtrl1' >Please Select A Shape</h6>);
        }
        else
        {
            if (this.state.is_connected === true)
            {
                this._renderswitch(v_unit);
            }
            else
            {
                v_unit.push (<h4 key='FCSCtrl2'>Please login first.</h4>)    ;
            }
        }
        
       
       

    return (

                <div key='ClssFence_Shape_Control'>
                    <EventBridge eventName={js_event.EE_onSocketStatus} onEvent={(p_params) => this.fn_onSocketStatus(p_params)} />
                    <EventBridge eventName={js_event.EE_onShapeCreated} onEvent={(p_shape) => this.fn_onShapeCreated(p_shape)} />
                    <EventBridge eventName={js_event.EE_onShapeSelected} onEvent={(p_event) => this.fn_onShapeSelected(p_event)} />
                    <EventBridge eventName={js_event.EE_onShapeEdited} onEvent={(p_shape) => this.fn_onShapeEdited(p_shape)} />
                    <EventBridge eventName={js_event.EE_onShapeDeleted} onEvent={(p_shape) => this.fn_onShapeDeleted(p_shape)} />
                    {v_unit}
                </div>
            );
    }
};
