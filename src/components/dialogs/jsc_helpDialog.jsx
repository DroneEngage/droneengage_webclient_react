import React from 'react';
import { withTranslation } from 'react-i18next';

import { fn_closeDialog as fn_closeDialogService } from '../../js/app/dialogService.js';
import { js_localStorage } from '../../js/state/js_localStorage.js';
import ClssModalDialogBase from './jsc_modalDialog_base.jsx';

class ClssHelpDialog extends ClssModalDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            title: '',
            html: '',
            dont_show_again: false,
        };
        this.p_topicId = null;
        this.m_flag_mounted = false;
        this.key = Math.random().toString();
    }

    componentDidMount() {
        super.componentDidMount();
        this.m_flag_mounted = true;
        if (this.props.dialogProps) this.fn_displayDialog(this, this.props.dialogProps);
    }

    componentWillUnmount() {
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted || !p_params) return;

        const { p_topicId, p_title, p_html } = p_params;
        p_me.p_topicId = p_topicId || null;
        p_me.setState({
            title: p_title || 'Help',
            html: p_html || '',
            dont_show_again: false,
            is_open: true,
            m_update: p_me.state.m_update + 1,
        });
    }

    fn_closeDialog() {
        if (this.state.dont_show_again === true && this.p_topicId) {
            js_localStorage.fn_setHelpSuppressed(this.p_topicId, true);
        }
        fn_closeDialogService();
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
                    id="help_dialog"
                    ref={this.modalRef}
                    role="dialog"
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            {this.fn_renderDialogHeader(this.state.title, 'bg-primary', false)}
                            <div
                                className="modal-body text-white help-md-body"
                                dangerouslySetInnerHTML={{ __html: this.state.html }}
                            />
                            <div className="modal-footer d-flex justify-content-between align-items-center">
                                <div className="form-check m-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="check_help_dont_show"
                                        checked={this.state.dont_show_again}
                                        onChange={(e) => this.setState({ dont_show_again: e.currentTarget.checked })}
                                    />
                                    <label className="form-check-label text-white" htmlFor="check_help_dont_show">
                                        {tFunc('helpDialog:dontShowAgain', "Don't show again")}
                                    </label>
                                </div>
                                <button
                                    id="btnHelpOk"
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => this.fn_closeDialog()}
                                >
                                    {tFunc('helpDialog:gotIt', 'Got it')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default withTranslation()(ClssHelpDialog);
