import React from 'react';
import { withTranslation } from 'react-i18next';
import Draggable from 'react-draggable';

import { js_globals } from '../js/js_globals.js';
import { EVENTS as js_event } from '../js/js_eventList.js';
import { js_eventEmitter } from '../js/js_eventEmitter.js';
import { AndruavClientFacade } from '../js/protocol/server_comm/js_andruav_facade.js';
import { CONST_TARGETS_GCS } from '../js/protocol/server_comm/js_andruav_ws.js';
import ClssDialogBase from './dialogs/jsc_dialog_base.jsx';

class ClssGCSChat extends ClssDialogBase {
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,
            messages: [],
            gcsUnits: [],
            selectedTarget: CONST_TARGETS_GCS,
            text: '',
            isVisible: true
        };

        this.m_flag_mounted = false;
        this.m_messagesEndRef = React.createRef();
        this.m_panelRef = React.createRef();

        this.fn_refreshGCSList = this.fn_refreshGCSList.bind(this);
        this.fn_onChatMessage = this.fn_onChatMessage.bind(this);
        this.fn_onChatToggle = this.fn_onChatToggle.bind(this);
        this.fn_unitAdded = this.fn_unitAdded.bind(this);
        this.fn_unitOnlineChanged = this.fn_unitOnlineChanged.bind(this);

        js_eventEmitter.fn_subscribe(js_event.EE_onChatMessage, this, this.fn_onChatMessage);
        js_eventEmitter.fn_subscribe(js_event.EE_onChatToggle, this, this.fn_onChatToggle);
        js_eventEmitter.fn_subscribe(js_event.EE_unitAdded, this, this.fn_unitAdded);
        js_eventEmitter.fn_subscribe(js_event.EE_unitOnlineChanged, this, this.fn_unitOnlineChanged);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        this.modalRef = this.m_panelRef;
        super.componentDidMount();
        this.fn_refreshGCSList();
    }

    componentWillUnmount() {
        this.m_flag_mounted = false;
        js_eventEmitter.fn_unsubscribe(js_event.EE_onChatMessage, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onChatToggle, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitAdded, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitOnlineChanged, this);
    }

    fn_isMounted() {
        return this.m_flag_mounted;
    }

    fn_getGCSUnits() {
        const units = (js_globals.m_andruavUnitList && js_globals.m_andruavUnitList.fn_getUnitValues()) || [];
        return units.filter(u => u && u.m_defined === true && u.m_IsGCS === true).sort((a, b) => {
            const nameA = a.m_unitName || a.getPartyID() || '';
            const nameB = b.m_unitName || b.getPartyID() || '';
            return nameA.localeCompare(nameB);
        });
    }

    fn_refreshGCSList() {
        if (this.fn_isMounted() === false) return;
        this.setState({ gcsUnits: this.fn_getGCSUnits() });
    }

    fn_unitAdded(me, p_andruavUnit) {
        if (me.fn_isMounted() === false) return;
        if (p_andruavUnit && p_andruavUnit.m_IsGCS === true) {
            me.fn_refreshGCSList();
        }
    }

    fn_unitOnlineChanged(me) {
        if (me.fn_isMounted() === false) return;
        me.fn_refreshGCSList();
    }

    fn_onChatMessage(me, p_data) {
        if (me.fn_isMounted() === false) return;

        const p_unit = p_data.unit;
        const p_message = p_data.message;
        if (!p_unit || !p_message) return;

        // Avoid echoing own messages when broadcast returns them.
        if (js_globals.v_andruavWS && js_globals.v_andruavWS.m_andruavUnit) {
            if (p_unit.getPartyID() === js_globals.v_andruavWS.m_andruavUnit.getPartyID()) {
                return;
            }
        }

        const msg = {
            text: p_message.t,
            sender: p_unit.m_unitName || p_unit.getPartyID() || 'Unknown',
            timestamp: p_message.ts || Date.now(),
            isMe: false
        };

        me.fn_appendMessage(msg);
    }

    fn_onChatToggle(me, p_data) {
        if (me.fn_isMounted() === false) return;
        const visible = p_data && p_data.visible === true;
        me.setState({ isVisible: visible });
    }

    fn_appendMessage(p_msg) {
        this.setState(prevState => ({
            messages: [...prevState.messages, p_msg]
        }), () => {
            this.fn_scrollToBottom();
        });
    }

    fn_scrollToBottom() {
        if (this.m_messagesEndRef.current) {
            this.m_messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }

    fn_findGCSUnitByIdentifier(p_identifier) {
        const identifier = p_identifier.toLowerCase();
        const units = this.fn_getGCSUnits();
        return units.find(u => {
            const partyID = (u.getPartyID() || '').toLowerCase();
            const name = (u.m_unitName || '').toLowerCase();
            return partyID === identifier || name === identifier;
        }) || null;
    }

    fn_resolveTargetAndText(p_text) {
        let target = this.state.selectedTarget;
        let text = p_text;

        // @ mention at the start of the message overrides the dropdown target.
        const trimmed = p_text.trim();
        if (trimmed.startsWith('@')) {
            const parts = trimmed.substring(1).trim().split(/\s+/);
            const mention = parts[0];
            const rest = parts.slice(1).join(' ');

            if (mention.toLowerCase() === 'all' || mention.toLowerCase() === 'gcs') {
                target = CONST_TARGETS_GCS;
                text = rest;
            } else {
                const unit = this.fn_findGCSUnitByIdentifier(mention);
                if (unit) {
                    target = unit.getPartyID();
                    text = rest;
                } else {
                    target = CONST_TARGETS_GCS;
                }
            }
        }

        return { target, text };
    }

    fn_handleSend() {
        const rawText = this.state.text.trim();
        if (rawText.length === 0) return;

        const { target, text } = this.fn_resolveTargetAndText(rawText);
        if (text.length === 0 && rawText.startsWith('@')) return;

        const targetLabel = this.fn_getTargetLabel(target);

        AndruavClientFacade.API_sendChatMessage(target, text);

        this.fn_appendMessage({
            text: text,
            sender: 'Me',
            target: targetLabel,
            timestamp: Date.now(),
            isMe: true
        });

        this.setState({ text: '' });
    }

    fn_getMentionQuery(p_text) {
        if (!p_text.startsWith('@')) return null;

        const afterAt = p_text.substring(1).trimStart();
        const firstSpace = afterAt.search(/\s/);
        if (firstSpace >= 0) return null;

        return afterAt.toLowerCase();
    }

    fn_getMentionOptions() {
        const query = this.fn_getMentionQuery(this.state.text);
        if (query === null) return [];

        const units = this.fn_getGCSUnits();
        const options = [
            { value: 'all', label: 'All GCS' }
        ];

        units.forEach(u => {
            const partyID = u.getPartyID() || '';
            const name = u.m_unitName || partyID;
            options.push({ value: partyID, label: name });
        });

        if (query.length === 0) return options;

        return options.filter(opt => {
            const lower = opt.label.toLowerCase();
            return lower.includes(query) || opt.value.toLowerCase().includes(query);
        });
    }

    fn_handleMentionSelect(p_option, p_event) {
        if (p_event) {
            p_event.preventDefault();
            p_event.stopPropagation();
        }
        this.setState({ text: `@${p_option.value} ` });
    }

    fn_getTargetLabel(p_target) {
        if (!p_target || p_target === CONST_TARGETS_GCS) {
            return 'All GCS';
        }
        const unit = this.fn_getGCSUnits().find(u => u.getPartyID() === p_target);
        return unit ? (unit.m_unitName || p_target) : p_target;
    }

    fn_handleKeyDown(p_event) {
        if (p_event.key === 'Enter' && !p_event.shiftKey) {
            p_event.preventDefault();
            this.fn_handleSend();
        }
    }

    fn_getCurrentPartyID() {
        if (this.state.selectedTarget && this.state.selectedTarget !== CONST_TARGETS_GCS) {
            return this.state.selectedTarget;
        }
        return null;
    }

    fn_closeDialog() {
        this.setState({ isVisible: false });
        js_eventEmitter.fn_dispatch(js_event.EE_onChatToggle, { visible: false });
    }

    fn_renderDialogFooter() {
        const { t } = this.props;
        const isGCSAll = this.state.selectedTarget === CONST_TARGETS_GCS;
        return (
            <div className="text-center">
                <div className="btn-group w-100 d-flex flex-wrap">
                    <button
                        id="btnGoto"
                        type="button"
                        className="btn btn-success"
                        onClick={() => this.fn_gotoUnit()}
                        disabled={isGCSAll}
                        title={isGCSAll ? (t('goto_disabled') || 'Select a specific GCS to navigate') : ''}
                    >
                        {t('goto', 'Goto')}
                    </button>
                </div>
            </div>
        );
    }

    render() {
        const { t } = this.props;
        const title = t('gcs_chat.title') || 'GCS Chat';

        if (this.state.isVisible === false) {
            return null;
        }

        return (
            <Draggable nodeRef={this.m_panelRef} handle=".js-draggable-handle" cancel=".gcs-chat-minimize-btn, button, input, select, textarea">
            <div className="card css_ontop gcs-chat-panel" ref={this.m_panelRef}>
                {this.fn_renderDialogHeader(title)}
                {!this.state.isMinimized && (
                    <div className="card-body p-2">
                        <div className="gcs-chat-messages mb-2">
                            {this.state.messages.length === 0 && (
                                <div className="text-muted text-center small">{t('gcs_chat.no_messages') || 'No messages yet'}</div>
                            )}
                            {this.state.messages.map((msg, index) => (
                                <div key={index} className={`small mb-1 ${msg.isMe ? 'text-end' : 'text-start'}`}>
                                    <span className="text-muted">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    {' '}
                                    <span className={msg.isMe ? 'text-primary' : 'text-warning'}>
                                        <strong>{msg.sender}</strong>
                                        {msg.target && msg.isMe ? ` -> ${msg.target}` : ''}
                                    </span>
                                    {': '}{msg.text}
                                </div>
                            ))}
                            <div ref={this.m_messagesEndRef}></div>
                        </div>

                        <div className="position-relative gcs-chat-input-wrapper">
                            {this.fn_getMentionOptions().length > 0 && (
                                <div className="list-group gcs-chat-mentions">
                                    {this.fn_getMentionOptions().map((opt, index) => (
                                        <button
                                            key={`${opt.value}-${index}`}
                                            type="button"
                                            className="list-group-item list-group-item-action py-1 px-2 small text-start"
                                            onMouseDown={(e) => this.fn_handleMentionSelect(opt, e)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    className="form-control w-100"
                                    placeholder={t('gcs_chat.input_placeholder') || 'Type @name to target or message here'}
                                    value={this.state.text}
                                    onChange={(e) => this.setState({ text: e.target.value })}
                                    onKeyDown={(e) => this.fn_handleKeyDown(e)}
                                />
                                <select
                                    className="form-select form-select-sm w-75"
                                    value={this.state.selectedTarget}
                                    onChange={(e) => this.setState({ selectedTarget: e.target.value })}
                                    title={t('gcs_chat.target_title') || 'Select target GCS'}
                                >
                                    <option value={CONST_TARGETS_GCS}>{t('gcs_chat.target_all') || 'All GCS'}</option>
                                    {this.state.gcsUnits.map(u => (
                                        <option key={u.getPartyID()} value={u.getPartyID()}>
                                            {u.m_unitName || u.getPartyID()}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-success"
                                    type="button"
                                    onClick={() => this.fn_handleSend()}
                                >
                                    {t('gcs_chat.send') || 'Send'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {this.fn_renderDialogFooter()}
            </div>
            </Draggable>
        );
    }
}

export default withTranslation()(ClssGCSChat);
