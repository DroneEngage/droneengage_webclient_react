import React from 'react';
import { withTranslation } from 'react-i18next';
import Draggable from 'react-draggable';

import { EVENTS as js_event } from '../js/js_eventList.js';
import { js_eventEmitter } from '../js/js_eventEmitter.js';
import { AndruavClientFacade } from '../js/protocol/server_comm/js_andruav_facade.js';
import * as js_andruavMessages from '../js/protocol/messages/js_andruavMessages.js';
import ClssDialogBase from './dialogs/jsc_dialog_base.jsx';

/**
 * Draggable panel to post an ACCOUNT-scoped news item (mirrors jsc_gcs_chat.jsx).
 * Global-scope news can only be posted from the storage server admin dashboard.
 *
 * TODO: gate visibility/usage of this control behind a super-user/permission
 * check once role information is available on the client session. For now it
 * is always available, per explicit product decision to defer permissions.
 */
class ClssNewsWrite extends ClssDialogBase {
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,
            isVisible: false,
            title: '',
            body: '',
            priority: js_andruavMessages.CONST_NEWS_PRIORITY_INFO,
            expiresAt: ''
        };

        this.m_flag_mounted = false;
        this.m_panelRef = React.createRef();

        this.fn_onNewsWriteToggle = this.fn_onNewsWriteToggle.bind(this);
        js_eventEmitter.fn_subscribe(js_event.EE_onNewsWriteToggle, this, this.fn_onNewsWriteToggle);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        this.modalRef = this.m_panelRef;
        super.componentDidMount();
    }

    componentWillUnmount() {
        this.m_flag_mounted = false;
        js_eventEmitter.fn_unsubscribe(js_event.EE_onNewsWriteToggle, this);
    }

    fn_isMounted() {
        return this.m_flag_mounted;
    }

    fn_onNewsWriteToggle(me, p_data) {
        if (me.fn_isMounted() === false) return;
        const visible = p_data && p_data.visible === true;
        me.setState({ isVisible: visible });
    }

    fn_handlePost() {
        const body = this.state.body.trim();
        if (body.length === 0) return;
        if (!this.state.expiresAt) return;

        // datetime-local defaults time to 00:00 when only a date is picked;
        // treat 00:00 as "no time set" and use end of day (23:59) instead.
        let expiresStr = this.state.expiresAt;
        if (expiresStr.endsWith('T00:00')) {
            expiresStr = expiresStr.replace('T00:00', 'T23:59');
        }
        const expiresAt = Math.floor(new Date(expiresStr).getTime() / 1000);

        AndruavClientFacade.API_saveNews(this.state.title.trim(), body, parseInt(this.state.priority, 10), expiresAt);

        this.setState({ title: '', body: '', expiresAt: '' });
    }

    fn_closeDialog() {
        this.setState({ isVisible: false });
        js_eventEmitter.fn_dispatch(js_event.EE_onNewsWriteToggle, { visible: false });
    }

    fn_getCurrentPartyID() {
        return null;
    }

    render() {
        const { t } = this.props;
        const title = t('news.write_title') || 'Post News (Account)';

        if (this.state.isVisible === false) {
            return null;
        }

        return (
            <Draggable nodeRef={this.m_panelRef} handle=".js-draggable-handle" cancel="button, input, select, textarea">
                <div
                    className="card css_ontop news-write-panel p-0"
                    ref={this.m_panelRef}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    {this.fn_renderDialogHeader(title, false)}
                    {!this.state.isMinimized && (
                        <div className="card-body p-2">
                            <div className="mb-2">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder={t('news.title_placeholder') || 'Title (optional)'}
                                    value={this.state.title}
                                    onChange={(e) => this.setState({ title: e.target.value })}
                                />
                            </div>
                            <div className="mb-2">
                                <textarea
                                    className="form-control form-control-sm"
                                    rows="3"
                                    placeholder={t('news.body_placeholder') || 'News text'}
                                    value={this.state.body}
                                    onChange={(e) => this.setState({ body: e.target.value })}
                                />
                            </div>
                            <div className="d-flex gap-2 mb-2">
                                <select
                                    className="form-select form-select-sm"
                                    value={this.state.priority}
                                    onChange={(e) => this.setState({ priority: e.target.value })}
                                >
                                    <option value={js_andruavMessages.CONST_NEWS_PRIORITY_INFO}>{t('news.priority_info') || 'Info'}</option>
                                    <option value={js_andruavMessages.CONST_NEWS_PRIORITY_WARNING}>{t('news.priority_warning') || 'Warning'}</option>
                                    <option value={js_andruavMessages.CONST_NEWS_PRIORITY_CRITICAL}>{t('news.priority_critical') || 'Critical'}</option>
                                </select>
                                <input
                                    type="datetime-local"
                                    className="form-control form-control-sm"
                                    title={t('news.expires_title') || 'Expires (time optional, defaults to 23:59)'}
                                    value={this.state.expiresAt}
                                    onChange={(e) => this.setState({ expiresAt: e.target.value })}
                                />
                            </div>
                            <button
                                className="btn btn-success btn-sm w-100"
                                type="button"
                                onClick={() => this.fn_handlePost()}
                            >
                                {t('news.post') || 'Post'}
                            </button>
                        </div>
                    )}
                </div>
            </Draggable>
        );
    }
}

export default withTranslation()(ClssNewsWrite);
