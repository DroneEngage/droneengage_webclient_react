
class CLSS_UserEntry extends  React.Component {

    constructor()
    {
        super();
        this.state={new_item: false};
    }

    /**
     * When forceupdate is called update state with the new value.
     */
    //componentDidMount
    UNSAFE_componentWillMount()
    {
        /**
         * Reset value if currently modified.
         */

        this.setState({new_item:this.props.prop_add_new});
        if (this.state.new_item !==true)
        {
            this.setState({single_item:this.props.prop_single_item});
        }
    }

    componentWillUpdate()
    {
        this.state.single_item=this.props.prop_single_item;
    }

    fn_onParamChanged(e,field)
    {
        if (this.state.new_item !== true)
        {
            this.props.prop_single_item.modified_value = $('#' + e.target.id).val();
            this.props.prop_single_item.is_dirty = true;
            if ((this.props.prop_single_item.modified_value=="") )
            {
                this.props.prop_single_item.is_valid = false;
            }
            else
            {
                this.props.prop_single_item.is_valid = true;
                //copy value
                this.state.single_item[field] = e.target.value;
            }
        }
        else
        {
            this.props.prop_single_item.modified_value = $('#' + e.target.id).val();
            this.props.prop_single_item.is_dirty = true;
            if ((this.props.prop_single_item.modified_value=="") )
            {
                this.props.prop_single_item.is_valid = false;
            }
            else
            {
                this.props.prop_single_item.is_valid = true;
                //copy value
                this.state.single_item[field] = e.target.value;
            }
        }

        this.forceUpdate();
    }

    fn_saveParameter(e)
    {
        fn_do_modal_confirmation("Confirmation", "Save User?", function (p_approved) {
            if (p_approved === false) return;
            window.StreamSensLibs.WebAdmin.fn_do_add_user(this.props.prop_single_item);
            $('#prop_val_acc')[0].value='';
            $('#prop_val_pwd')[0].value='';
        }, "YES");
    }

    fn_deleteParameter(user)
    {
        fn_do_modal_confirmation("Confirmation", "Delete User?", function (p_approved) {
            if (p_approved === false) return;
            window.StreamSensLibs.WebAdmin.fn_do_del_user (user);
        }, "YES");

        
    }

    fn_addParameter(user)
    {
        fn_do_modal_confirmation("Confirmation", "Add User?", function (p_approved) {
            if (p_approved === false) return;
            window.StreamSensLibs.WebAdmin.fn_do_add_user (user);
        }, "YES");
    }

    render () {
        var cls_color = " bg-white text-black-50";
        
        if (this.state.new_item === false)
        {
            if ((this.props.prop_single_item.is_dirty!= null) && (this.props.prop_single_item.is_dirty === true))
            {
                if ((this.props.prop_single_item.is_valid!=null) && (this.props.prop_single_item.is_valid === false))
                {
                    cls_color = " bg-danger text-white ";
                }
                else
                {
                    cls_color = " bg-success text-white ";
                }
            }
        }

        var class_modify;
        if ((this.state.new_item === true)  // should be first 
        || (this.props.prop_single_item.is_valid === false)
        || (!window.StreamSensLibs.WebAdmin.fn_isadmin()))
        {
            class_modify = " disabled ";
        }
        else
        {
            class_modify = "";
        }

        

        if (this.state.new_item !== true)
        {   //normal item
            
                return  (
                    <tr>
                        <td key={this.props.prop_single_item.acc} scope='row'>{this.props.prop_single_item.acc}</td>
                        <td><input type="text" className={"form-control " + cls_color } id="prop_val_new"  value={String(this.state.single_item.pwd)} onChange={(e) => this.fn_onParamChanged(e,'pwd')}/></td>
                        <td>
                            <div className="btn-group" role="group" aria-label="Basic example">
                                <button className={"btn btn-warning btn-sm btn_prop" + class_modify}  onClick={(e) => this.fn_saveParameter(e)}>Save</button>
                                <button className={"btn btn-danger btn-sm btn_prop" + class_modify}  onClick={(e) => this.fn_deleteParameter(this.props.prop_single_item)}>Del</button>
                            </div>
                        </td>
                    </tr>
                );
            
        }
        else
        {   //new item
            if (!window.StreamSensLibs.WebAdmin.fn_isadmin())
            {
                return (
                <div></div>);
            }
            else
            {
                return  (
                    <tr key="1">
                        <td key={"new_user"} scope="row"><input type="text" className={"form-control " + cls_color } id="prop_val_acc" onChange={(e) => this.fn_onParamChanged(e,'acc')} /></td>
                        <td><input type="text" className={"form-control " + cls_color } id="prop_val_pwd" onChange={(e) => this.fn_onParamChanged(e,'pwd')} /></td>
                        <td>
                            <div className="btn-group" role="group" aria-label="Basic example">
                                <button className={"btn btn-warning btn-sm btn_prop"}  onClick={(e) => this.fn_addParameter(this.state.single_item)}>Add</button>
                            </div>
                        </td>
                    </tr>
                );
                
            }
        }
    }
}


/**
 * Create a table of parameters
 */
class CLSS_UserEntryList extends  React.Component {

    render () {
        var p_params=[];
        
        if (this.props.prop_users != null)
        {
        
            const c_list = this.props.prop_users;
            const c_keys = Object.keys(c_list);
            const c_len = c_keys.length;
            
            p_params.push(<CLSS_UserEntry prop_add_new={true} prop_single_item={{}}/>);

            
                for (var i =0; i<c_len; ++i) 
                {
                    const single_item = c_list[c_keys[i]];
                    if ((this.props.prop_search =="" ) || (single_item.acc.toUpperCase().includes(this.props.prop_search)))
                    {
                        p_params.push(<CLSS_UserEntry prop_add_new={false} prop_single_item={single_item}/>);
                    }
                }
            
        }
        else
        {
            return (<p className="text-danger">NO DATA</p>);
        }

        return (

            <table className = "table table-dark table-striped">
                <thead>
                    <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Password</th>
                    <th scope="col">Operation</th>
                    </tr>
                </thead>
                <tbody>
                    {p_params}
                </tbody>
            </table>
    );
    }
}


class CLSS_UserList extends React.Component {

    constructor() 
    {
        super ();
		this.state = {
            m_search: "",
            users: [],
		};
	
        window.StreamSensLibs.EventEmitter.fn_subscribe (EE_Update_Users, this, this.fn_displayForm);
        
    }

    fn_displayForm (p_me, p_res)
    {
        p_me.setState({'users':p_res.users});
        fn_console_log (p_res.users);
    }

    fn_onSearch (e)
    {
        this.setState({
            m_search : e.target.value.toUpperCase()
       });
    }

    componentWillUnmount () {
        window.StreamSensLibs.EventEmitter.fn_unsubscribe (EE_Update_Users,this);
    }

      
    

    fn_createParametersCtrl ()
    {
        if ((this.state.users==null) || (this.state.users.length==0))
        {
           return (
            <div className='flex-column row margin_zero text-center'>
                NO DATA
            </div>
           )
        }

        

        return (
            <div className='row margin_zero'>
                <div key="HDR" className="row margin_zero">
                    <div className="col-12">
                        <div className="form-inline">
                            <div className="form-group">
                                <div>
                                    <label htmlFor="txt_searchParam" className="text-white">Search&nbsp;</label>
                                    <input id="txt_searchParam" type="text" className="form-control input-sm" placeholder="" value={this.state.m_search} onChange={(e) => this.fn_onSearch(e)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                        
                <div key='params' id="parameters_sublist">
                    
                    <CLSS_UserEntryList prop_search={this.state.m_search}  prop_users={this.state.users} />
                    
                </div>
            </div>
        );
    }

    render() {
        var p_params = [];
        
        
        p_params = this.fn_createParametersCtrl();

        return (
                    <div id="modal_ctrl_parameters" title="Users List" >
                        <div className="">
                            <div className="bg-dark ">
                            <div className="card-header bg-primary ">
                            <h3 id="modal_ctrl_parameters_lbl" className="text-white">Users List</h3>
                            </div>
                            <div id="card-body" className="" >
                                    {p_params}
                            </div>
                            
                        </div>
                        </div>
                    </div>
                );
    }
};


ReactDOM.render(
    <CLSS_UserList />,
    window.document.getElementById('user_list')
);

