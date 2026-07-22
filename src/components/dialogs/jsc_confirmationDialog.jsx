import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssConfirmationDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            title: '',
            message: '',
            yes_caption: 'Yes',
            no_caption: 'Cancel',
            style: 'bg-success',
        };
        this.p_callback = null;
        this.m_flag_mounted = false;
        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_displayConfirmationDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayConfirmationDialog, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted || !p_params) return;

        const { p_title, p_message, p_callback, p_yesCaption, p_style, p_noCaption } = p_params;
        p_me.p_callback = p_callback;
        p_me.setState({
            title: p_title || '',
            message: p_message || '',
            yes_caption: p_yesCaption || 'Yes',
            no_caption: p_noCaption || 'Cancel',
            style: p_style || 'bg-success',
            is_open: true,
            m_update: p_me.state.m_update + 1,
        });
    }

    fn_closeDialog() {
        this.setState({ is_open: false });
    }

    fn_onConfirm() {
        if (this.p_callback) {
            this.p_callback(true);
        }
        this.fn_closeDialog();
    }

    fn_onCancel() {
        if (this.p_callback) {
            this.p_callback(false);
        }
        this.fn_closeDialog();
    }

    fn_hideDialog() {
        this.setState({ is_open: false });
    }

    render() {
        return this.fn_renderInPortal(
            <>
                {this.state.is_open && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
                <div
                    className={this.state.is_open ? "modal fade show" : "modal fade"}
                    style={{ display: this.state.is_open ? 'block' : 'none', zIndex: 1055 }}
                    id="confirmation_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            {this.fn_renderDialogHeader(this.state.title, this.state.style)}
                            <div className="modal-body text-white">
                                <p>{this.state.message}</p>
                            </div>
                            <div className="modal-footer">
                                <div className="btn-group w-100 d-flex flex-wrap">
                                    <button
                                        id="btnCancel"
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => this.fn_onCancel()}
                                    >
                                        {this.state.no_caption}
                                    </button>
                                    <button
                                        id="modal_btn_confirm"
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => this.fn_onConfirm()}
                                    >
                                        {this.state.yes_caption}
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

export default withTranslation('home')(ClssConfirmationDialog);

