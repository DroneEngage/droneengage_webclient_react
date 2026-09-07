import React from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';

import * as js_siteConfig from '../../js/js_siteConfig.js';
import { fn_closeDialog as fn_closeDialogService } from '../../js/app/dialogService.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssUnitInfoDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            p_andruavUnit: null,
            unit_name: '',
            unit_description: '',
        };
        this.m_flag_mounted = false;
        this.key = Math.random().toString();
        this.modalRef = React.createRef();
        this.unitNameRef = React.createRef();
        this.unitDescriptionRef = React.createRef();
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
        if (this.props.dialogProps) this.fn_displayDialog(this, this.props.dialogProps?.unit);
    }

    componentWillUnmount() {
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_andruavUnit) {
        if (!p_me.m_flag_mounted || !p_andruavUnit) return;
        
        if ((js_siteConfig.CONST_FEATURE.hasOwnProperty('DISABLE_UNIT_NAMING')) && (js_siteConfig.CONST_FEATURE.DISABLE_UNIT_NAMING === true)) return;

        p_me.setState({ 
            p_andruavUnit: p_andruavUnit,
            unit_name: p_andruavUnit.m_unitName || '',
            unit_description: p_andruavUnit.Description || '',
            is_open: true,
            m_update: p_me.state.m_update + 1 
        });

        setTimeout(() => {
            if (p_me.unitNameRef.current) {
                p_me.unitNameRef.current.focus();
            }
        }, 100);
    }

    fn_closeDialog() {
        this.setState({ is_open: false, p_andruavUnit: null });
        fn_closeDialogService();
    }

    fn_getCurrentPartyID() {
        if (this.state.p_andruavUnit) {
            return this.state.p_andruavUnit.getPartyID();
        }
        return null;
    }

    fn_onApply() {
        if (!this.state.p_andruavUnit) return;
        
        const unitName = this.unitNameRef.current.value;
        const unitDescription = this.unitDescriptionRef.current.value;

        if (unitName && unitName.trim() !== '' && unitDescription && unitDescription.trim() !== '') {
            js_session.fn_getAndruavFacade().API_setUnitName(this.state.p_andruavUnit, unitName, unitDescription);
        }
        
        this.fn_closeDialog();
    }

    fn_onCancel() {
        this.fn_closeDialog();
    }

    render() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        
        let unitName = 'Unknown';
        if (this.state.p_andruavUnit) {
            unitName = this.state.p_andruavUnit.m_unitName;
        }

        return this.fn_renderInPortal(
            <>
                {this.state.is_open && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
                <div
                    className={this.state.is_open ? "modal fade show" : "modal fade"}
                    style={{ display: this.state.is_open ? 'block' : 'none', zIndex: 1055 }}
                    id="unit_info_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                <div className="modal-dialog">
                    <div className="modal-content">
                        {this.fn_renderDialogHeader(tFunc('home:modal.unitInfo.title', 'Change Unit Name of ' + unitName), 'bg-success')}
                        <div className="modal-body">
                            <div className="input-group align-items-center">
                                <span id="txtNamelbl" className="input-group-addon me-2">
                                    {tFunc('home:modal.unitInfo.name', 'Name')}
                                </span>
                                <input
                                    id="txtUnitName"
                                    type="text"
                                    className="form-control rounded-3 me-3"
                                    placeholder=""
                                    aria-describedby="basic-addon2"
                                    ref={this.unitNameRef}
                                    defaultValue={this.state.unit_name}
                                />
                            </div>
                            <div className="input-group mt-2 align-items-center">
                                <span id="txtDescriptionlbl" className="input-group-addon me-2">
                                    {tFunc('home:modal.unitInfo.description', 'Description')}
                                </span>
                                <input
                                    id="txtDescription"
                                    type="text"
                                    className="form-control rounded-3 me-3"
                                    placeholder=""
                                    aria-describedby="basic-addon2"
                                    ref={this.unitDescriptionRef}
                                    defaultValue={this.state.unit_description}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="btn-group w-100 d-flex flex-wrap">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => this.fn_onCancel()}
                                >
                                    {tFunc('home:modal.unitInfo.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    onClick={() => this.fn_onApply()}
                                >
                                    {tFunc('home:modal.unitInfo.go', 'Go')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </>
        );
    }
}

export default withTranslation('home')(ClssUnitInfoDialog);
