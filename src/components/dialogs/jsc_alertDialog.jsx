import React from 'react';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssAlertDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            title: '',
            message: '',
            ok_caption: 'OK',
            style: 'bg-warning',
        };
        this.p_callback = null;
        this.m_flag_mounted = false;
        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_displayAlertDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayAlertDialog, this);
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted || !p_params) return;

        const { p_title, p_message, p_callback, p_okCaption, p_style } = p_params;
        p_me.p_callback = p_callback || null;
        p_me.setState({
            title: p_title || 'Alert',
            message: p_message || '',
            ok_caption: p_okCaption || 'OK',
            style: p_style || 'bg-warning',
            is_open: true,
            m_update: p_me.state.m_update + 1,
        });
    }

    fn_closeDialog() {
        this.setState({ is_open: false });
    }

    fn_onOk() {
        if (this.p_callback) {
            this.p_callback();
        }
        this.fn_closeDialog();
    }

    render() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;

        return this.fn_renderInPortal(
            <>
                {this.state.is_open && <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>}
                <div
                    className={this.state.is_open ? "modal fade show" : "modal fade"}
                    style={{ display: this.state.is_open ? 'block' : 'none', zIndex: 1065 }}
                    id="alert_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            {this.fn_renderDialogHeader(this.state.title, this.state.style, false)}
                            <div className="modal-body text-white">
                                <p dangerouslySetInnerHTML={{ __html: this.state.message }} />
                            </div>
                            <div className="modal-footer">
                                <div className="btn-group w-100 d-flex flex-wrap">
                                    <button
                                        id="btnAlertOk"
                                        type="button"
                                        className="btn btn-warning btn-sm w-100"
                                        onClick={() => this.fn_onOk()}
                                    >
                                        {this.state.ok_caption}
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

export default withTranslation('home')(ClssAlertDialog);
