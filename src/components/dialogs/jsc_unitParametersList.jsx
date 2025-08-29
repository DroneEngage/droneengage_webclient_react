import React    from 'react';

import $ from 'jquery';

import * as js_siteConfig from '../../js/js_siteConfig.js'
import * as js_common from '../../js/js_common.js'

import Modal from 'bootstrap/js/dist/modal';

import {js_globals} from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

import {fn_do_modal_confirmation, fn_gotoUnit, fn_helpPage} from '../../js/js_main.js'


class ClssParameterItem extends  React.Component {

    constructor()
    {
        super();
        this.state={};
    }

    /**
     * When forceupdate is called update state with the new value.
     */
    componentDidMount()
    {
        /**
         * Reset value if currently modified.
         */
        this.setState({param_value:this.props.prop_param.param_value});
        js_common.fn_console_log("PARAM:" + this.props.prop_param.param_value + " componentWillUpdate");
    }

    componentWillUpdate()
    {
        this.state.param_value=this.props.prop_param.param_value;
    }

    fn_onParamChanged(e)
    {
       
        const val  = $('#' + e.target.id).val();
        this.props.prop_param.modified_value = val;
        this.props.prop_param.is_dirty = true;
        if ((val === "" || val === null || val === undefined) || (isNaN(val) === true))
        {
            this.props.prop_param.is_valid = false;
        }
        else
        {
            this.props.prop_param.is_valid = true;
        }
        
        this.setState({
            param_value: e.target.value
       });
    }

    fn_saveParameter(e)
    {
        if (this.props.prop_param.is_valid === false)
        {
            alert ("Invalid value. Cannot save it.");
            return ;
        }
        const me = this;
        fn_do_modal_confirmation("Confirmation", "Write Parameter to FCB?", function (p_approved) {
            if (p_approved === false) return;
            js_globals.v_andruavFacade.API_WriteParameter(me.props.prop_unit, me.props.prop_param);
            js_eventEmitter.fn_dispatch(js_event.EE_displayParameters, me.props.prop_unit);
        }, "YES");


    }

    render () {
        let cls_color = " bg-white text-black-50";
        js_common.fn_console_log ("PARAM_:" + this.props.prop_param.param_id + ":" + this.props.prop_param.param_value + ":" + String(this.state.param_value));
        if (this.props.prop_param.is_dirty === true) 
        {
            if (this.props.prop_param.is_valid === false)
            {
                cls_color = " bg-danger text-white ";
            }
            else
            {
                cls_color = " bg-success text-white ";
            }
        }
        return (

        <tr>
        <td key={this.props.prop_param.param_index} scope="row">{this.props.prop_param.param_index}</td>
        <td ><p>{this.props.prop_param.param_id}</p></td>
        <td><input type="text" className={"form-control " + cls_color } id={"prop_val" + this.props.prop_param.param_index}  value={String(this.state.param_value)} onChange={(e) => this.fn_onParamChanged(e)}/></td>
        <td ><button className="btn btn-danger btn-sm btn_prop"  onClick={(e) => this.fn_saveParameter(e)} >Save</button></td>
        </tr>
        
    );
    }
}


/**
 * Create a table of parameters
 */
class ClssParametersList extends  React.Component {

    render () {
        let p_params=[];
        
        if (this.props.prob_unit !== null && this.props.prob_unit !== undefined)
        {
        
            const c_list = this.props.prob_unit.m_FCBParameters.m_list_by_index_shadow;
            const c_keys = Object.keys(c_list);
            const c_len = c_keys.length;
            
            if (c_len !== 0 ) 
            {
                        
                            
                for (let i =0; i<c_len; ++i) 
                {
                    const c_parameter_message = c_list[c_keys[i]];
                    if ((this.props.prop_search === "" || this.props.prop_search === null  || this.props.prop_search === undefined ) || (c_parameter_message.param_id.toUpperCase().includes(this.props.prop_search)))
                    {
                        p_params.push(<ClssParameterItem prop_unit={this.props.prob_unit} prop_param_value={c_parameter_message.param_value} prop_param={c_parameter_message} key={c_parameter_message.param_index}/>);
                    }
                }
            }
            else
            {
                return(<p className="text-danger">NO DATA</p>);
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
                    <th scope="col">#</th>
                    <th scope="col">Param</th>
                    <th scope="col">Value</th>
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


export default class ClssUnitParametersList extends React.Component {

    constructor() 
    {
        super ();
		this.state = {
            m_search: "",
		    m_update: 0
		};
	
        this.m_flag_mounted = false;

        js_eventEmitter.fn_subscribe (js_event.EE_displayParameters, this, this.fn_displayForm);
        js_eventEmitter.fn_subscribe (js_event.EE_updateParameters, this, this.fn_updateParameters);
        
    }

    fn_displayForm (p_me, p_andruavUnit)
    {
        p_me.setState({'p_unit':p_andruavUnit});
        js_common.showModal('#modal_ctrl_parameters', true);
    }

    fn_updateParameters(p_me, p_andruavUnit)
    {
        if (p_me.state.p_unit === null || p_me.state.p_unit === undefined) return ;
        if (p_andruavUnit.partyID !== p_me.state.p_unit.partyID) return ;
        
        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }


    componentDidMount () 
    {
        this.m_flag_mounted = true;
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_displayParameters,this);
        js_eventEmitter.fn_unsubscribe (js_event.EE_updateParameters,this);
    }

    fn_onSearch (e)
    {
        this.setState({
            m_search : e.target.value.toUpperCase()
       });
    }


    fn_doResetParameters()
    {
        const  p_andruavUnit = this.state.p_unit ;
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;

        const c_list = p_andruavUnit.m_FCBParameters.m_list_by_index_shadow;
        const c_keys = Object.keys(c_list);
        const c_len = c_keys.length;
        
        
        for (let i =0; i<c_len; ++i) 
        {
            const c_parameter_message = c_list[c_keys[i]];

            if (c_parameter_message.is_dirty === true)
            {
                c_parameter_message.modified_value="";
                c_parameter_message.is_dirty = false;
            }
        }
        
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_resetAll()
    {
        if (this.state.p_unit === null || this.state.p_unit === undefined) return ;
        
        const me = this;
        fn_do_modal_confirmation("Confirmation", "Undo all modified values?", function (p_approved) {
            if (p_approved === false) return;
            me.fn_doResetParameters();
        }, "YES");
    }


    fn_reloadAll()
    {
        if (this.state.p_unit === null || this.state.p_unit === undefined) return ;

        const me = this;
        fn_do_modal_confirmation("Confirmation", "Release all parameters from FCB?", function (p_approved) {
            if (p_approved === false) return;
            js_globals.v_andruavFacade.API_requestParamList(me.state.p_unit);
        }, "YES");
    }

    fn_saveAll()
    {
        if (this.state.p_unit === null || this.state.p_unit === undefined) return ;
        const me = this;
        fn_do_modal_confirmation("Confirmation", "Write Parameter to FCB?", function (p_approved) {
            if (p_approved === false) return;
            js_globals.v_andruavFacade.API_WriteAllParameters(me.state.p_unit);
        }, "YES");
    }
    

    fn_createParametersCtrl (p_andruavUnit)
    {
        if ((p_andruavUnit !== null && p_andruavUnit !== undefined) && (Object.keys(p_andruavUnit.m_FCBParameters.m_list_by_index_shadow).length === 0))
        {
            // Maybe parameters are not loaded ... send reload request.
            js_globals.v_andruavFacade.API_requestParamList(p_andruavUnit);
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
                    <div >
                        <div className="btn-group" role="group" >
                            <button type="button" className="btn btn-danger btn-sm ctrlbtn"   title='Save all changes' onClick={(e) => this.fn_saveAll()}>SAVE</button>
                            <button type="button" className="btn btn-warning btn-sm ctrlbtn"  title='Reset to current values' onClick={(e) => this.fn_resetAll(e)}>RESET</button>
                            <button type="button" className="btn btn-success btn-sm ctrlbtn"  title='Reload parameter from FCB' onClick={(e) => this.fn_reloadAll(e)}>RELOAD</button>
                        </div>
                    </div>
                    <ClssParametersList prop_search={this.state.m_search} prob_unit={p_andruavUnit} />
                    
                </div>
            </div>
        );
    }

    render() {
        let p_andruavUnit = null;
        let p_params = [];
        let v_Name = "Unknown";
        
        
        if (this.state.p_unit !== null && this.state.p_unit !== undefined)
        {
            p_andruavUnit = this.state.p_unit;
            v_Name = p_andruavUnit.m_unitName;
        }

        p_params = this.fn_createParametersCtrl(p_andruavUnit);

        return (
                    <div id="modal_ctrl_parameters" title="Unit Parameters" className="modal fade " tabIndex="-1" aria-labelledby="modal_ctrl_parameters_lbl">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content width_fit">
                            <div className="modal-header bg-primary ">
                            <h3 id="modal_ctrl_parameters_lbl" className="modal-title text-white">Parameters of:&nbsp;&nbsp; <strong>{v_Name} </strong></h3>
                            <button type="button" className="btn-close"  data-bs-dismiss="modal" aria-hidden="true" aria-label="Close"></button>
                            </div>
                            <div id="ctrl_main" className="modal-body" >
                                    {p_params}
                            </div>
                            <div id="modal_ctrl_parameters_footer" className="modal-footer ">
                            
                                        <div className = "row flex-fill al_c">
                                            <div className = "col-6">
                                                <button id="btnGoto" type="button" className="btn  btn-sm btn-success" onClick={(e) => fn_gotoUnit(p_andruavUnit)}>Goto</button>
                                            </div>
                                            <div className = "col-6">
                                                <button id="btnHelp" type="button" className="btn  btn-sm btn-primary" onClick={(e) => fn_helpPage(js_siteConfig.CONST_MANUAL_URL)}>Help</button>
                                            </div>
                                        </div>
                            </div>
                        </div>
                        </div>
                    </div>
                );
    }
};

