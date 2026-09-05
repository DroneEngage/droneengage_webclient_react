import React from 'react';
import { withTranslation } from 'react-i18next';
import Draggable from 'react-draggable';

import { EVENTS as js_event } from '../js/events/js_eventList.js';
import { js_eventEmitter } from '../js/events/js_eventEmitter.js';
import * as js_andruavMessages from '../js/protocol/messages/js_andruavMessages.js';
import { CONST_FEATURE as js_siteConfig_CONST_FEATURE } from '../js/js_siteConfig.js';
import ClssDialogBase from './dialogs/jsc_dialog_base.jsx';

/**
 * "News tail" - a scrolling/list ticker of active (non-disabled, non-expired)
 * news, newest first. Loaded once on mount (EE_News_Loaded resync/reply) and
 * updated live as items are pushed (EE_News_Push).
 */
class ClssNewsDisplay extends ClssDialogBase {
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,
            newsById: {},
            isVisible: true
        };

        this.m_flag_mounted = false;
        this.m_panelRef = React.createRef();

        this.fn_onNewsLoaded = this.fn_onNewsLoaded.bind(this);
        this.fn_onNewsPush = this.fn_onNewsPush.bind(this);
        this.fn_onNewsToggle = this.fn_onNewsToggle.bind(this);

        js_eventEmitter.fn_subscribe(js_event.EE_News_Loaded, this, this.fn_onNewsLoaded);
        js_eventEmitter.fn_subscribe(js_event.EE_News_Push, this, this.fn_onNewsPush);
        js_eventEmitter.fn_subscribe(js_event.EE_onNewsToggle, this, this.fn_onNewsToggle);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        this.modalRef = this.m_panelRef;
        super.componentDidMount();
    }

    componentWillUnmount() {
        this.m_flag_mounted = false;
        js_eventEmitter.fn_unsubscribe(js_event.EE_News_Loaded, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_News_Push, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onNewsToggle, this);
    }

    fn_isMounted() {
        return this.m_flag_mounted;
    }

    fn_isActive(p_item) {
        if (!p_item || p_item.disabled) return false;
        if (p_item.expires_at && (p_item.expires_at * 1000) <= Date.now()) return false;
        return true;
    }

    // p_payload here is the LoadNews reply's msgPayload, shaped { s: 'OK', news: [...] } (or an error string)
    fn_onNewsLoaded(me, p_payload) {
        if (me.fn_isMounted() === false) return;
        if (!p_payload || !Array.isArray(p_payload.news)) return;

        const newsById = {};
        p_payload.news.forEach(item => { newsById[item.id] = item; });
        me.setState({ newsById });
    }

    // p_payload here is the unsolicited NewsPush's msgPayload: a single news item
    // (possibly just { id, disabled: 1 } for a disable/delete).
    fn_onNewsPush(me, p_payload) {
        if (me.fn_isMounted() === false) return;
        if (!p_payload || !p_payload.id) return;

        me.setState(prevState => ({
            newsById: { ...prevState.newsById, [p_payload.id]: { ...prevState.newsById[p_payload.id], ...p_payload } }
        }));
    }

    fn_onNewsToggle(me, p_data) {
        if (me.fn_isMounted() === false) return;
        const visible = p_data && p_data.visible === true;
        me.setState({ isVisible: visible });
    }

    fn_getActiveNews() {
        return Object.values(this.state.newsById)
            .filter(item => this.fn_isActive(item))
            .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    }

    fn_getPriorityClass(p_priority) {
        if (p_priority === js_andruavMessages.CONST_NEWS_PRIORITY_CRITICAL) return 'text-danger';
        if (p_priority === js_andruavMessages.CONST_NEWS_PRIORITY_WARNING) return 'text-warning';
        return 'text-info';
    }

    fn_getScopeLabel(p_scope) {
        return p_scope === js_andruavMessages.CONST_NEWS_SCOPE_GLOBAL ? 'Global' : 'Account';
    }

    fn_toggleCompose() {
        js_eventEmitter.fn_dispatch(js_event.EE_onNewsWriteToggle, { visible: true });
    }

    fn_closeDialog() {
        this.setState({ isVisible: false });
        js_eventEmitter.fn_dispatch(js_event.EE_onNewsToggle, { visible: false });
    }

    fn_getCurrentPartyID() {
        return null;
    }

    render() {
        const { t } = this.props;
        const title = t('news.title') || 'News';

        if (this.state.isVisible === false) {
            return null;
        }

        const news = this.fn_getActiveNews();

        const sendingDisabled = js_siteConfig_CONST_FEATURE
            && js_siteConfig_CONST_FEATURE.DISABLE_SENDING_NEWS === true;

        const composeButton = sendingDisabled ? null : (
            <button
                type="button"
                className="btn btn-sm btn-link text-dark float-end p-0 ms-2"
                title={t('news.compose') || 'Post news'}
                onClick={() => this.fn_toggleCompose()}
            >
                +
            </button>
        );

        return (
            <Draggable nodeRef={this.m_panelRef} handle=".js-draggable-handle" cancel="button, input, select, textarea">
                <div className="card css_ontop news-display-panel" ref={this.m_panelRef}>
                    {this.fn_renderDialogHeader(title, false, composeButton)}
                    {!this.state.isMinimized && (
                        <div className="card-body p-2 news-display-body">
                            {news.length === 0 && (
                                <div className="text-muted text-center small">{t('news.no_news') || 'No news'}</div>
                            )}
                            {news.map(item => (
                                <div key={item.id} className="small mb-2 border-bottom pb-1">
                                    <div>
                                        <span className={this.fn_getPriorityClass(item.priority)}>
                                            <strong>{item.title || this.fn_getScopeLabel(item.scope)}</strong>
                                        </span>
                                        {' '}
                                        <span className="text-muted">
                                            {item.created_at ? new Date(item.created_at * 1000).toLocaleString() : ''}
                                        </span>
                                    </div>
                                    <div>{item.body}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Draggable>
        );
    }
}

export default withTranslation()(ClssNewsDisplay);
