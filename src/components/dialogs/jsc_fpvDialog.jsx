import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssFpvDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            image_src: '/public/images/camera_img.png',
            is_visible: false,
        };
        this.m_flag_mounted = false;
        this.key = Math.random().toString();
        this.modalRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_displayFpvDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayFpvDialog, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted) return;
        
        const { image_src } = p_params || {};
        p_me.setState({ 
            image_src: image_src || '/public/images/camera_img.png',
            is_visible: true,
            is_open: true,
            m_update: p_me.state.m_update + 1 
        });
    }

    fn_closeDialog() {
        this.setState({ is_open: false, is_visible: false });
    }

    fn_getCurrentPartyID() {
        return null;
    }

    fn_onSave() {
        // Save image logic would go here
        this.fn_closeDialog();
    }

    fn_onGoto() {
        // Goto unit logic would go here
        this.fn_closeDialog();
    }

    render() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;

        return this.fn_renderInPortal(
            <>
                {this.state.is_open && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
                <div
                    className={this.state.is_open ? "modal fade show" : "modal fade"}
                    style={{ display: this.state.is_open ? 'block' : 'none', zIndex: 1055 }}
                    id="fpv_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                <div className="modal-dialog">
                    <div className="modal-content">
                        {this.fn_renderDialogHeader(tFunc('home:modal.image.title', 'FPV Image'), 'bg-info')}
                        <div className="modal-body text-center">
                            <div id="modal_fpv_img" className="form-group text-center">
                                <img 
                                    id="unitImg" 
                                    className="img-rounded" 
                                    alt="camera" 
                                    src={this.state.image_src} 
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="btn-group w-100 d-flex flex-wrap">
                                <button
                                    id="unitImg_save"
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => this.fn_onSave()}
                                >
                                    {tFunc('home:modal.image.save', 'Save')}
                                </button>
                                <button
                                    id="btnGoto"
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={() => this.fn_onGoto()}
                                >
                                    {tFunc('home:modal.image.goto', 'Goto')}
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

export default withTranslation('home')(ClssFpvDialog);
