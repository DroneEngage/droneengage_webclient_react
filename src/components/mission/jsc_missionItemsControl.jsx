import React    from 'react';

import {js_andruavAuth} from '../../js/js_andruavAuth'

import {CWayPointLocation} from '../js/jsc_ctrl_waypoint_location'
import {CWayPointAction} from '../js/jsc_ctrl_waypoint_actions'
import {js_leafletmap} from '../js/js_leafletmap'





class CMissionStep extends React.Component {

    constructor()
    {
        super ();
        this.state = {

        };
    }


    fn_editShape ()
    {
        this.wp.fn_editShape();
        this.ma.fn_editShape();
        this.props.p_shape.order = parseInt($('#txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val());
        // this.props.p_shape.setLabel({
        //     text: $('#txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val(), // string
        //     color: "#977777",
        //     fontSize: "12px",
        //     fontWeight: "bold"
        //   });

        this.props.p_shape.m_mission.fn_updatePath(true)
        return ;
    }

    componentDidUpdate() 
    {
        if (this.props.p_shape != null)
        {
            $('#txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id).val(this.props.p_shape.order); 
        }
    }
    
    render ()
    {
        if ((this.props.p_shape == null)  || (this.props.p_isCurrent == false))
        {
            return (<div/>);
        }

        return (
            <div key={"ms_o" + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} id="m_hdr" className="card text-white bg-primary mb-3">
            <div className="card-header text-center"> 
            <h4 ><strong>{"Mission Item #" + this.props.p_shape.order}</strong></h4>
            </div>    
            <div className="card-body">
    
            <div className="form-group text-left">
                <label className="text-primary">ID</label>
                <input type='text' id={'txt_orderNum' + this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} className="form-control input-sm"/>
            </div>
		    

            <div key={this.props.p_shape.id + "_" + this.props.p_shape.m_mission.m_id} id="m_bdy" className="geo_fence ">
		        <CWayPointAction p_shape= {this.props.p_shape}  ref={instance => {this.ma = instance}}/>
                <CWayPointLocation p_shape= {this.props.p_shape}  ref={instance => {this.wp = instance}}/>
                <button className="button btn-primary css_margin_top_small" id='btn'  onClick={ (e) => this.fn_editShape()}>Apply</button>
            </div>
            </div>
            </div>
        );
    }
}

class MissionControlPanel extends React.Component {


    constructor()
	{
		super ();
		this.state = {
            m_deleted: false
		};
    
        js_eventEmitter.fn_subscribe(js_globals.EE_mapMissionUpdate,this,this.fn_missionUpdated);
    }
    

    fn_onSocketStatus (me,params) {
        
        if (params.status == js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {				
            me.setState({is_connected:true});
        }
        else
        {				
            me.setState({is_connected:false});
        }
    }


    fn_missionUpdated (me)
    {
        me.forceUpdate();
    }

    fn_exportMission ()
    {
        const c_mission_text = this.props.p_mission.fn_exportToV110 ();
        fn_saveAs (c_mission_text,"Mission" + Date.now() + ".txt","text/plain;charset=utf-8");
    }

    fn_saveDBMission ()
    {
        const c_mission_text = this.props.p_mission.fn_exportToV110 ();
        this.props.p_mission.fn_exportToJSONAndruav (c_mission_text, $('#prt_' + this.props.p_mission.m_id).val());
    }

    fn_deleteDBMission()
    {
        js_globals.v_andruavClient.API_disableWayPointTasks(js_andruavAuth.m_username,js_globals.v_andruavClient.m_groupName,$('#prt_' + this.props.p_mission.m_id).val(),'_drone_',1);
    }

    fn_deleteMission ()
    {
        if (this.props.p_mission == null) return ;
        window.AndruavLibs.MapMission.fn_deleteMission(this.props.p_mission.m_id);
        this.setState ({m_deleted:true});
    }


    fn_changeColor ()
    {
        if (this.props.p_ParentCtrl.props.p_missionPlan != null)
        {
            const c_path_color = $('#cp_' + this.props.p_mission.m_id).val();
            this.props.p_mission.fn_drawStyle (c_path_color);
            this.props.p_mission.fn_updatePath (true);
        }
        $('#pc_' + this.props.p_mission.m_id).css("background-color",$('#cp_' + this.props.p_mission.m_id).val());
    }

    /**
     * Close Mission Panel Control
     * @param {*} e 
     */
    fn_collabseMe (e)
    {
        if ((this.props.p_ParentCtrl.props.p_missionPlan.m_hidden == true) && (this.props.p_ParentCtrl.props.p_isCurrent == false))
        {
            // display path if group is going to be activated and was hidden.
            this.fn_togglePath(e);
        }

        js_eventEmitter.fn_dispatch(js_globals.EE_onMissionItemToggle,{p_isCurrent:this.props.p_ParentCtrl.props.p_isCurrent, p_mission:this.props.p_ParentCtrl.props.p_missionPlan} );
    }


    /**
     * hide or display pathes on Google Map.
     * @param {*} e 
     */
    fn_togglePath (e)
    {
        fn_console_log (e);
        this.props.p_ParentCtrl.props.p_missionPlan.fn_togglePath();
        if (this.props.p_ParentCtrl.props.p_missionPlan.m_hidden == true)
        {
            $('#ph_' + this.props.p_mission.m_id).addClass('text-muted');
            $('#ph_' + this.props.p_mission.m_id).removeClass('text-success');
            $('#ph_' + this.props.p_mission.m_id).addClass('border-muted');
            $('#ph_' + this.props.p_mission.m_id).removeClass('border-success');
        }
        else
        {
            $('#ph_' + this.props.p_mission.m_id).addClass('text-success');
            $('#ph_' + this.props.p_mission.m_id).removeClass('text-muted');
            $('#ph_' + this.props.p_mission.m_id).addClass('border-success');
            $('#ph_' + this.props.p_mission.m_id).removeClass('border-muted');
        }
    }

    /**
     * simulate click on color button
     * @param {*} e 
     */
    fn_simClick (e)
    {
        $('#cp_' + this.props.p_mission.m_id).click();
    }

    componentWillUnmount () 
    {
        js_eventEmitter.unsubscribe(js_globals.EE_mapMissionUpdate,this);
    }

    componentDidMount ()
    {
        //$('#cp_' + this.props.p_mission.m_id).val()
        $('#pc_' + this.props.p_mission.m_id).css("background-color",this.props.p_mission.m_pathColor);
    }


    componentDidUpdate ()
    {
        if ((this.props.p_ParentCtrl.props.p_missionPlan.m_hidden == true) && (this.props.p_ParentCtrl.props.p_isCurrent == true))
        {
            // display path if group is ACVTIE NOW and was hidden.
            this.fn_togglePath(e);
        }
    }
    
    render ()
    {

        if (this.state.m_deleted == true) return (<div className = " margin_zero "/>);

        if (this.props.p_mission == null)
        {
            return (<div className = " margin_zero "/>);
        }

        var v_item2 = [];
        var v_partyIDCtrl = [];

        var v_saveAsTask = [];

        //CODEBLOCK_START
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED===false)
		{
            v_saveAsTask.push (<button  key={'mp1b3' + this.props.p_mission.m_id}  id="geo_btn_geosave_db"  className="btn btn-danger btn-sm ctrlbtn" title ="Save into System" type="button" onClick={ (e) => this.fn_saveDBMission(e) } >Save</button>);
            v_saveAsTask.push (<button  key={'mp1b4' + this.props.p_mission.m_id} id="geo_btn_geodelete_db_me"  className="btn btn-danger btn-sm ctrlbtn" title ="Delete Any Related Mission from System for this Unit" type="button" onClick={ (e) => this.fn_deleteDBMission(e) } >Delete</button>);
        }
        //CODEBLOCK_END


        if (this.props.p_isCurrent == true)
        {
            v_item2.push (

                <div id="geofence" key={'mp1' + this.props.p_mission.m_id} className="btn-group  css_margin_top_small" >
                    <button id='pre_geo_btn_generate' key={'mp1b1' + this.props.p_mission.m_id} className='btn btn-primary btn-sm ctrlbtn'   title ="Export Mission" type="button "  onClick={ (e) => this.fn_exportMission(e) } >Export</button>
                    <button  id="geo_btn_georeset"  key={'mp1b2' + this.props.p_mission.m_id} className="btn btn-warning btn-sm ctrlbtn" title ="Reset Mission on Map" type="button" onClick={ (e) => this.fn_deleteMission(e) } >Reset</button>
                    {v_saveAsTask}
                </div>

            );

            
            if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED===false)
			{
                v_partyIDCtrl.push (
                    <div id="geofence" key={'mp2' + this.props.p_mission.m_id} className ="row margin_zero css_margin_top_small">
                        <div className="col-12">
                            <div className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="txt_partyID" className="text-primary"><small>Party ID</small></label>
                                    <input id={'prt_' + this.props.p_mission.m_id} type="text"  className="form-control input-sm input-sm css_margin_left_5" placeholder="unit pin code"    />
                                </div>
                            </div>
                        </div>
                            
                    </div>
                );
            }

            if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED===true)
			{
                // overwrite with this if public version 
                v_partyIDCtrl = [];        
                
            }

        }
        
        var v_class = (this.props.p_isCurrent === true)?"w-100 text-warning border border-warning rounded text-center cursor_hand padding_zero":"w-100  text-light border  border-secondry rounded text-center cursor_hand padding_zero"
        return (
            <div key={"plan" + this.props.p_mission.m_id} id="m_hdr" className="col  col-sm-12 margin_zero" >
            <div className="form-inline  margin_zero padding_zero">
                <div className="card-header text-center d-flex">
                    <label onClick={ (e) => this.fn_collabseMe(e) } className={v_class}><strong>{'Mission #' + this.props.p_mission.m_id + ' Panel (' + (this.props.p_mission.fn_getMissionDistance() / 1000.0).toFixed(1) + ' km)'}</strong></label>
                    <input type='color' className = "border hidden" id={'cp_' + this.props.p_mission.m_id} onChange={(e)=> this.fn_changeColor()}/>
                    <p id={'pc_' + this.props.p_mission.m_id}  onClick={ (e) => this.fn_simClick(e) } className="btn  btn-sm css_margin_left_5 text-light border border-primary rounded text-center cursor_hand" title="Change Plan color path"  >C</p>
                    <p id={'ph_' + this.props.p_mission.m_id}  onClick={ (e) => this.fn_togglePath(e) } className="btn  btn-sm  text-success border border-success rounded text-center cursor_hand" title="Hide/Display plan on Map"  >H</p>
                </div>
                </div>
            
            {v_item2}
            
            {v_partyIDCtrl}
            <hr/>
            </div>
        );
    }
}




class UnitMissionContainer extends React.Component {
  
    constructor()
	{
		super ();
		this.state = {
		};
	 
        js_eventEmitter.fn_subscribe(js_globals.EE_onShapeSelected,this,this.displayGeoForm);
        js_eventEmitter.fn_subscribe (js_globals.EE_onMissionItemToggle, this, this.fn_onMissionItemToggle);
    }

    
    displayGeoForm (me,p_event)
    {
        // not a marker
        if (p_event.target.m_mission == null) 
        {
            fn_console_log ("MISSION:NULL HERE");
            return ; 
        }
        
        if (me.props.p_missionPlan.m_id != p_event.target.m_mission.m_id)
        {
            fn_console_log ("Not Me");
            return ;
        } 

        if (me.props.p_isCurrent == false)
        {
            js_eventEmitter.fn_dispatch(js_globals.EE_onMissionItemToggle,{p_isCurrent:me.props.p_isCurrent, p_mission:me.props.p_missionPlan});
        }

        me.setState({s_shape:p_event.target});


        fn_console_log ("REACT:displayGeoForm" );

        me.forceUpdate();
		
    }


    fn_onMissionItemToggle (me,p_params)
    {
        fn_console_log (p_params);
        
        
        me.forceUpdate();
    }

   


    componentWillUnmount () {
        js_eventEmitter.unsubscribe(js_globals.EE_onShapeSelected,this);
        js_eventEmitter.unsubscribe (js_globals.EE_onMissionItemToggle,this);
    }

    render() {
   
        var c_borderStyle;

        if (this.props.p_isCurrent === true)
        {
            c_borderStyle = 'css_missionMapSelected';
        }

        
        var item = [];
        
        if (this.props.p_missionPlan == null)
        {
            item.push (<h4 key="mi"></h4>);
        }
        else
        {
            //if ((window.v_map != null))
            //{
                if (this.state.shape != null)
                {
                    this.state.shape.setLabel({
                        text: this.state.shape.order.toString(), // string
                        color: "#977777",
                        fontSize: "12px",
                        fontWeight: "bold"
                    });
                }
                item.push (<div key={"mstp"  + this.props.p_missionPlan.m_id} id="missionstep" className = {"container-fluid localcontainer " + c_borderStyle}>
                            <MissionControlPanel p_mission={this.props.p_missionPlan} p_ParentCtrl= {this}  p_isCurrent={this.props.p_isCurrent}/>
                            <CMissionStep  p_shape={this.state.s_shape} p_isCurrent={this.props.p_isCurrent}/>
                        </div>);
                
                    
            // }
            // else
            // {
                    
            // }
        
        }
        
    return (
            <div key='fsc' className ="margin_zero width_100">
            
            <div className="row margin_zero"> 
                {item}
            </div>
            </div>
            );
    }
};



class CMissionsContainer extends React.Component {
  
    constructor()
	{
		super ();
		this.state = {
            p_plans:[],
		};

        js_eventEmitter.fn_subscribe (js_globals.EE_onSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe (js_globals.EE_onMissionItemToggle, this, this.fn_onMissionItemToggle);
        js_eventEmitter.fn_subscribe (js_globals.EE_onShapeCreated, this, this.fn_onShapeCreated);
        js_eventEmitter.fn_subscribe (js_globals.EE_onShapeSelected, this, this.fn_onShapeSelected);
        js_eventEmitter.fn_subscribe (js_globals.EE_onShapeEdited, this, this.fn_onShapeEdited);
        js_eventEmitter.fn_subscribe (js_globals.EE_onShapeDeleted, this, this.fn_onShapeDeleted);
    
	}

    fn_onSocketStatus (me,p_params) {
        
        if (p_params.status == js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {				
            me.setState({is_connected:true});
        }
        else
        {				
            me.setState({is_connected:false});
        }
    }
    
    fn_onMissionItemToggle (me,p_params)
    {
       
        if (p_params.p_isCurrent == true)
        {
            // switch to next
            window.AndruavLibs.MapMission.fn_activateNextMission(p_params.p_mission.m_id);
        }
        else
        {
            // make this the current
            window.AndruavLibs.MapMission.fn_setCurrentMission(p_params.p_mission.m_id);
        }
        me.forceUpdate();
    }


    fn_onShapeCreated (me, p_shape) 
    {
        fn_console_log ("fn_onShapeCreated: " + p_shape);
        
        if (p_shape.pm.getShape()!='Marker') return ;

        let v_mission = window.AndruavLibs.MapMission.fn_getCurrentMission();
        v_mission.fn_addMarker(p_shape);
    }


    /**
     * 
     * @param {*} me 
     * @param {*} p_event 
     *      p_event
            { 
                latlng: { lat, lng}
                target: shape
            }
    */
    fn_onShapeSelected (me, p_event) 
    {
        
    }
        
    fn_onShapeEdited(me, p_shape)
    {   
        if (p_shape.m_mission == null) return ; // geo fence not mission
        p_shape.m_mission.fn_updatePath(true);
    }
        
    fn_onShapeDeleted (me, p_shape) 
    {
        if (p_shape.m_mission == null) return ; // geo fence not mission
        p_shape.m_mission.fn_deleteMe(p_shape);
    }

    fn_addNewPathPlan (e)
    {
        var v_missionPlan = window.AndruavLibs.MapMission.fn_createNewMission();
        window.AndruavLibs.MapMission.fn_setCurrentMission(v_missionPlan.m_id);
        js_leafletmap.fn_enableDrawMarker(true);
        this.setState ({p_plans: this.state.p_plans.concat([v_missionPlan])});
    }


    

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onSocketStatus,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onMissionItemToggle,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onShapeCreated,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onShapeSelected,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onShapeEdited,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onShapeDeleted,this);
 
    }

    render() {
   
        var item = [];
        

        let v_mission1 = window.AndruavLibs.MapMission.fn_getCurrentMission();
				
        if ((this.state.is_connected == false) || (this.state.p_plans == null) || (this.state.p_plans.length ==0))
        {
            item.push (<h4 key="mi"></h4>);
        }
        else
        {
                this.state.p_plans.map (function (v_plan)
                {
                    
                
                    item.push (
                            <UnitMissionContainer key={'umc' + v_plan.m_id} p_missionPlan={v_plan} p_isCurrent={v_plan.m_id==v_mission1.m_id}/>
                        );
                });
                    
            
        }
        
        let v_ctrl = [];

        if (this.state.is_connected == true)
        {
            v_ctrl.push(
                <div key='fsc' className="width_100">
                <div className="row margin_zero"> 
                    <div className="col-11">
                    <label>Add New Mission </label>
                    </div>
                    <div className="col-1">
                    <button className="btn-primary btn-sm float-left" title="Add New Mission Plan" onClick={ (e) => this.fn_addNewPathPlan(e)} >+</button>
                    </div>
                </div>
                <div className="row margin_zero width_100"> 
                {item}
                </div>				
            </div>
            );
        }
        else
        {
            v_ctrl.push (
                <div key='fsc' ><h4> </h4></div>
            )    ;
        }

        
    return (
        <div key='CLSS_CMissionsContainer' className="width_100">{v_ctrl}</div>
            );
    }
};


ReactDOM.render(
    <CMissionsContainer  />,
    window.document.getElementById('c_missioncontrol')
);