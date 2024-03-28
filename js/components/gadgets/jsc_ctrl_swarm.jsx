export class CLSS_CTRL_SWARM extends React.Component {

    constructor(props)
	{
		super (props);
		
        this.state = {
        };

    }

    fn_toggleMakeSwarm (p_formationID)
    {
        if (this.props.m_unit.m_Swarm.m_isLeader == true)
        {   // make not a leader
            v_andruavClient.API_makeSwarm (this.props.m_unit, CONST_TASHKEEL_SERB_NO_SWARM);
        }
        else
        {   // make leader and set formation.
            v_andruavClient.API_makeSwarm (this.props.m_unit, p_formationID);
        }
    }

    fn_requestToFollow (p_unit)
    {
        fn_console_log (p_unit);
        var v_partyID = null;
        var v_do_follow = CONST_TYPE_SWARM_UNFOLLOW;
        if (p_unit != null)
        {
            v_partyID = p_unit.partyID;
            v_do_follow = CONST_TYPE_SWARM_FOLLOW;
        }
        v_andruavClient.API_requestFromDroneToFollowAnother(this.props.m_unit, -1, v_partyID, v_do_follow);
    }


    onChange(e)
    {
       if (e.target.value)
       {
          if (e.target.value == "NA")
          {
              // do not follow
            v_andruavClient.API_requestFromDroneToFollowAnother(this.props.m_unit, -1, null);
          } 
          else
          {
            v_andruavClient.API_requestFromDroneToFollowAnother(this.props.m_unit, -1, e.target.value);
          }
       }
    }
    
    componentDidUpdate() 
    {
        if (this.props.m_unit.m_Swarm.m_following != null)
        {
            var leaderUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(this.props.m_unit.m_Swarm.m_following);
            if (leaderUnit != null)
            {
                $("#" + this.props.m_unit.partyID + "dldrselsel").val(leaderUnit.partyID);
            }
            else
            {
                $("#" + this.props.m_unit.partyID + "dldrselsel").val("NA");
            }
        }
        else
        {
            $("#" + this.props.m_unit.partyID + "dldrselsel").val("NA");
        }
    }

    
    render ()
    {
        if ((CONST_FEATURE.DISABLE_SWARM === true) || (window.AndruavLibs.LocalStorage.fn_getAdvancedOptionsEnabled()!==true))
        {
            return (
                <div></div>
            )
        }
        else
        {

            
                
        //CODEBLOCK_START
        var v_units = v_andruavClient.m_andruavUnitList.fn_getUnitValues();
        var len = v_units.length;
        const c_items = [];
        
        var v_leader_class = "btn-secondry";
        var v_follower_class  = "bg-secondry";
        var v_leader_title_leader   = "not leader";
        var v_leader_title_follower = "none";
        var v_leader_dropdown_class = "bg-secondry";
        var v_swarm_class = ' text-light';

        var v_class_follower = '  hidden  ';
        var v_class_formation_as_leader = ' hidden  ';
        var v_class_formation_as_follower = ' hidden ';

        if (this.props.m_unit.m_Swarm.m_following != null)
        {
            
            v_follower_class = "bg-danger";
            //v_leader_class = "btn-success"; // this state can be overwritten if it is a leader. 
            v_leader_dropdown_class = "bg-success text-white";
            var v_leaderUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(this.props.m_unit.m_Swarm.m_following);
            
            if (v_leaderUnit!=null) 
            {   // display name of party_id as a temp solution untill name is available.
                // [v_leaderUnit==null] maybe the web is loading and this unit has not been received yet.
                v_leader_title_follower = v_leaderUnit.m_unitName;
            }
            else
            {
                v_leader_title_follower = this.props.m_unit.m_Swarm.m_following; // add party_id
            }

            v_class_formation_as_follower = '';
            v_class_follower = '';    
            
        }
        else
        {
            
            v_follower_class = "bg-secondry";
        }

        if (this.props.m_unit.m_Swarm.m_isLeader === true)
        {
            v_leader_class = "btn-danger";
            v_leader_dropdown_class = "bg-danger text-white";
            v_leader_title_leader = "LEADER";
            v_class_formation_as_leader = '';
        }
        

        for (let i=0; i<len; ++i)
        {   
            var v_unit = v_units[i];

            /*
                It is not Me.
                It is a leader i.e. can be followed.
                It is not following me. -as leaders can be followers but should not be following me-.
                Notice: deeper circulaar error can be made and not handled here.
            */
            if ((this.props.m_unit.partyID != v_unit.partyID) 
            && (v_unit.m_Swarm.m_isLeader === true)  
            && (this.props.m_unit.m_Swarm.m_following != v_unit.partyID ))
            {
                var v_out = v_unit; // need a local copy 
                // list drones that are not me and are leaders.
                c_items.push(
                     <a key={v_unit.m_unitName+"s"} className="dropdown-item" href="#" onClick={(unit => {
                        return () => this.fn_requestToFollow(unit);
                      })(v_unit)}>{v_unit.m_unitName}</a>
                );     
            }
        }

        return (
            <div key={'swr_' + this.props.m_unit.partyID }  className= 'row padding_zero '>
            <div className="btn-group" role="group" aria-label="Button group with nested dropdown">
            <button id={this.props.m_unit.partyID + "_ldr"} 
                        type="button" 
                        className={"btn btn-sm " + v_leader_class} 
                        title={v_leader_title_leader + " / folowing:" + v_leader_title_follower}
                        onClick={() => this.fn_toggleMakeSwarm(CONST_TASHKEEL_SERB_THREAD)}>Leader</button>
                <div className="btn-group" role="group">
                    <button id="btnGroupDrop2" 
                    type="button" 
                    className={"btn  btn-sm dropdown-toggle " + v_follower_class} 
                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
                    <div className="dropdown-menu" aria-labelledby="btnGroupDrop2">
                        {c_items}
                        <a className="dropdown-item " href="#" onClick={() => this.fn_requestToFollow()}>unfollow</a>
                    </div>
                </div>
            </div>
            <div className="row al_l css_margin_zero">
                <div className= {' col-12   padding_zero text-warning ' + v_swarm_class}>
                            <p className={ ' si-07x css_margin_zero user-select-none text-danger' + v_class_follower} title='leader I am following'><i className="bi bi-chevron-double-right text-danger"></i> { ' ' + v_leader_title_follower}</p>
                            <p className={ ' si-07x css_margin_zero css_user_select_text text-warning' + v_class_formation_as_follower}  title='formation of my leader'><i className="bi bi-dice-5 text-warning"></i> {' ' + swarm_formation_names[this.props.m_unit.m_Swarm.m_formation_as_follower]}</p>
                            <p className={ ' si-07x css_margin_zero css_user_select_text text-success' + v_class_formation_as_leader} title='formation as a leader'><i className="bi bi-dice-5 text-success"></i> {' ' + swarm_formation_names[this.props.m_unit.m_Swarm.m_formation_as_leader]}</p>
                            
                </div>
            </div>
            </div>
        );
        //CODEBLOCK_END


        }
    }
}