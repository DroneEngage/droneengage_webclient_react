import React from 'react';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.min.js';
import Draggable from 'react-draggable';

import * as js_siteConfig from '../../js/js_siteConfig.js';
import * as js_common from '../../js/js_common.js';
import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import { fn_do_modal_confirmation, fn_gotoUnit, fn_helpPage } from '../../js/js_main.js';

class ClssParameterItem extends React.Component {
    constructor() {
        super();
        this.state = {};
    }

    componentDidMount() {
        this.setState({ param_value: this.props.prop_param.param_value });
        js_common.fn_console_log("PARAM:" + this.props.prop_param.param_value + " componentWillUpdate");
    }

    componentWillUpdate() {
        this.state.param_value = this.props.prop_param.param_value;
    }

    fn_onParamChanged(e) {
        const val = $('#' + e.target.id).val();
        this.props.prop_param.modified_value = val;
        this.props.prop_param.is_dirty = true;
        if (!val || isNaN(val)) {
            this.props.prop_param.is_valid = false;
        } else {
            this.props.prop_param.is_valid = true;
        }
        this.setState({ param_value: e.target.value });
    }

    fn_saveParameter(e) {
        if (this.props.prop_param.is_valid === false) {
            alert("Invalid value. Cannot save it.");
            return;
        }
        const me = this;
        fn_do_modal_confirmation("Confirmation", "Write Parameter to FCB?", function (p_approved) {
            if (!p_approved) return;
            js_globals.v_andruavFacade.API_WriteParameter(me.props.prop_unit, me.props.prop_param);
            js_eventEmitter.fn_dispatch(js_event.EE_displayParameters, me.props.prop_unit);
        }, "YES");
    }

    render() {
        let cls_color = " bg-white text-black-50";
        if (this.props.prop_param.is_dirty === true) {
            cls_color = this.props.prop_param.is_valid === false ? " bg-danger txt-theme-aware " : " bg-success txt-theme-aware ";
        }
        return (
            <tr>
                <td scope="row">{this.props.prop_param.param_index}</td>
                <td><p>{this.props.prop_param.param_id}</p></td>
                <td>
                    <input
                        type="text"
                        className={"form-control " + cls_color}
                        id={"prop_val" + this.props.prop_param.param_index}
                        value={String(this.state.param_value)}
                        onChange={(e) => this.fn_onParamChanged(e)}
                    />
                </td>
                <td>
                    <button className="btn btn-danger btn-sm btn_prop" onClick={(e) => this.fn_saveParameter(e)}>
                        Save
                    </button>
                </td>
            </tr>
        );
    }
}

class ClssParametersList extends React.Component {
    render() {
        let p_params = [];
        if (this.props.prob_unit) {
            const c_list = this.props.prob_unit.m_FCBParameters.m_list_by_index_shadow;
            const c_keys = Object.keys(c_list);
            const c_len = c_keys.length;

            if (c_len !== 0) {
                for (let i = 0; i < c_len; ++i) {
                    const c_parameter_message = c_list[c_keys[i]];
                    if (!this.props.prop_search || c_parameter_message.param_id.toUpperCase().includes(this.props.prop_search)) {
                        p_params.push(
                            <ClssParameterItem
                                prop_unit={this.props.prob_unit}
                                prop_param_value={c_parameter_message.param_value}
                                prop_param={c_parameter_message}
                                key={c_parameter_message.param_index}
                            />
                        );
                    }
                }
            } else {
                return <p className="text-danger">NO DATA</p>;
            }
        } else {
            return <p className="text-danger">NO DATA</p>;
        }

        return (
            <table className="table table-dark table-striped">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Param</th>
                        <th scope="col">Value</th>
                        <th scope="col">Operation</th>
                    </tr>
                </thead>
                <tbody>{p_params}</tbody>
            </table>
        );
    }
}

export default class ClssUnitParametersList extends React.Component {
    constructor() {
        super();
        this.state = {
            m_search: "",
            m_update: 0,
            p_unit: null,
        };
        this.m_close = true;
        this.m_flag_mounted = false;
        this.modalRef = React.createRef();
        this.opaque_clicked = false;
        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_displayParameters, this, this.fn_displayForm);
        js_eventEmitter.fn_subscribe(js_event.EE_updateParameters, this, this.fn_updateForm);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        this.fn_initDialog();
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayParameters, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_updateParameters, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_initDialog() {
        const me = this;

        // Add centering styles
        this.modalRef.current.style.position = 'absolute';
        this.modalRef.current.style.top = '50%';
        this.modalRef.current.style.left = '50%';
        this.modalRef.current.style.transform = 'translate(-50%, -50%)';

        this.modalRef.current.onmousedown = function () {
            me.modalRef.current.style.opacity = '1.0';
        };
        this.modalRef.current.onmouseover = function () {
            me.modalRef.current.style.opacity = '1.0';
        };
        this.modalRef.current.onmouseout = function () {
            if (!me.opaque_clicked) {
                me.modalRef.current.style.opacity = '0.4';
            }
        };
        this.modalRef.current.style.display = 'none';
    }

    fn_displayForm(p_me, p_andruavUnit) {

        if (!p_me.m_flag_mounted) return;
        p_me.setState({ p_unit: p_andruavUnit, m_update: p_me.state.m_update + 1 });
        p_me.modalRef.current.style.display = 'block';
        p_me.m_close = false;
    }

    fn_updateForm(p_me, p_andruavUnit) {

        if (p_me.m_close) return;

        if (!p_me.m_flag_mounted) return;
        p_me.setState({ p_unit: p_andruavUnit, m_update: p_me.state.m_update + 1 });
    }

    fn_closeDialog() {
        this.m_close = true;
        this.modalRef.current.style.opacity = '';
        this.modalRef.current.style.display = 'none';
        if (this.state.p_unit) {
            this.setState({ p_unit: null });
        }
    }

    fn_opacityDialog() {
        this.opaque_clicked = !this.opaque_clicked;
        this.modalRef.current.style.opacity = this.opaque_clicked ? '1.0' : '0.4';
    }

    fn_doResetParameters() {
        if (!this.state.p_unit) return;
        this.setState({ m_update: this.state.m_update + 1 });
    }

    fn_resetAll() {
        if (!this.state.p_unit) return;
        const me = this;
        fn_do_modal_confirmation("Confirmation", "Undo all modified values?", function (p_approved) {
            if (!p_approved) return;
            me.fn_doResetParameters();
        }, "YES");
    }

    fn_reloadAll() {
        if (!this.state.p_unit) return;
        const me = this;
        fn_do_modal_confirmation("Confirmation", "Reload all parameters from FCB?", function (p_approved) {
            if (!p_approved) return;
            js_globals.v_andruavFacade.API_requestParamList(me.state.p_unit);
        }, "YES");
    }

    fn_saveAll() {
        if (!this.state.p_unit) return;
        const me = this;
        fn_do_modal_confirmation("Confirmation", "Write Parameter to FCB?", function (p_approved) {
            if (!p_approved) return;
            js_globals.v_andruavFacade.API_WriteAllParameters(me.state.p_unit);
        }, "YES");
    }

    fn_onSearch(e) {
        this.setState({ m_search: e.target.value });
    }

    fn_createParametersCtrl(p_andruavUnit) {
        if (p_andruavUnit && Object.keys(p_andruavUnit.m_FCBParameters.m_list_by_index_shadow).length === 0) {
            js_globals.v_andruavFacade.API_requestParamList(p_andruavUnit);
        }

        return (
            <div className="row margin_zero">
                <div key="HDR" className="row margin_zero">
                    <div className="col-12">
                        <div className="form-inline">
                            <div className="form-group">
                                <label htmlFor="txt_searchParam" className="txt-theme-aware">Search&nbsp;</label>
                                <input
                                    id="txt_searchParam"
                                    type="text"
                                    className="form-control input-sm"
                                    placeholder=""
                                    value={this.state.m_search}
                                    onChange={(e) => this.fn_onSearch(e)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div key="params" id="parameters_sublist">
                    <div>
                        <div className="btn-group" role="group">
                            <button
                                type="button"
                                className="btn btn-danger btn-sm ctrlbtn"
                                title="Save all changes"
                                onClick={(e) => this.fn_saveAll()}
                            >
                                SAVE
                            </button>
                            <button
                                type="button"
                                className="btn btn-warning btn-sm ctrlbtn"
                                title="Reset to current values"
                                onClick={(e) => this.fn_resetAll(e)}
                            >
                                RESET
                            </button>
                            <button
                                type="button"
                                className="btn btn-success btn-sm ctrlbtn"
                                title="Reload parameter from FCB"
                                onClick={(e) => this.fn_reloadAll(e)}
                            >
                                RELOAD
                            </button>
                        </div>
                    </div>
                    <ClssParametersList prop_search={this.state.m_search} prob_unit={p_andruavUnit} />
                </div>
            </div>
        );
    }

    render() {
        let p_andruavUnit = null;
        let v_Name = "Unknown";

        if (this.state.p_unit) {
            p_andruavUnit = this.state.p_unit;
            v_Name = p_andruavUnit.m_unitName;
        }

        const p_params = this.fn_createParametersCtrl(p_andruavUnit);

        return (
            <Draggable nodeRef={this.modalRef} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
                <div
                    id="modal_ctrl_parameters"
                    className="card css_ontop border-light p-2"
                    ref={this.modalRef}
                    title="Parameters Control"
                >
                    <div className="card-header text-center js-draggable-handle">
                        <div className="row">
                            <div className="col-10">
                                <h4 className="text-success text-start">Parameters of: {v_Name}</h4>
                            </div>
                            <div className="col-2 float-right">
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={(e) => this.fn_closeDialog()}
                                ></button>
                            </div>
                        </div>
                    </div>
                    <div id="ctrl_main" className="card-body">
                        {p_params}
                    </div>
                    <div id="modal_ctrl_parameters_footer" className="form-group text-center localcontainer css_ontop">
                        <div className="row">
                            <div className="col-6">
                                <button
                                    id="opaque_btn"
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={(e) => this.fn_opacityDialog()}
                                >
                                    Opaque
                                </button>
                            </div>
                            <div className="col-6">
                                <button
                                    id="btnGoto"
                                    type="button"
                                    className="btn btn-sm btn-success"
                                    onClick={(e) => fn_gotoUnit(p_andruavUnit)}
                                >
                                    Goto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Draggable>
        );
    }
}