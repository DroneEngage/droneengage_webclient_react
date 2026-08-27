/**
 * Remote Telnet/Terminal control for DroneEngage units.
 *
 * Provides a simple terminal interface that:
 *  - Opens a shell session on the unit's de_telnet module.
 *  - Sends keystrokes as TELNET_DATA messages.
 *  - Renders pty output received as TELNET_DATA (binary) events.
 *  - Handles session open/close/resize/status via TELNET_STATUS events.
 *
 * No external terminal library (xterm.js) is used — the output is
 * rendered in a scrollable <pre> and input is a text line + send button.
 * This keeps the webclient dependency-free and consistent with the
 * existing gadget components.
 *
 * @auth: Devin / DroneEngage
 */

import React from 'react';
import { js_globals } from '../../../js/js_globals.js';
import { EVENTS as js_event } from '../../../js/js_eventList.js'
import { js_eventEmitter } from '../../../js/js_eventEmitter.js'
import * as js_andruavMessages from '../../../js/protocol/messages/js_andruavMessages'

export class ClssCtrlTelnet extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            m_session_id: '',
            m_connected: false,
            m_output: '',
            m_error: '',
            m_cols: 80,
            m_rows: 24,
        };

        this.m_flag_mounted = false;
        this.m_outputBuffer = '';
        this.m_maxOutputLines = 500;

        this.m_inputRef = React.createRef();
        this.m_outputRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_unitTelnetStatus, this, this.fn_onTelnetStatus);
        js_eventEmitter.fn_subscribe(js_event.EE_unitTelnetData, this, this.fn_onTelnetData);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        this.m_flag_mounted = false;
        // Close the session when the component unmounts (tab switched away).
        if (this.state.m_connected && this.state.m_session_id) {
            js_globals.v_andruavFacade.API_telnetClose(this.props.p_unit, this.state.m_session_id);
        }
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitTelnetStatus, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitTelnetData, this);
    }

    /**
     * Handle TELNET_STATUS messages (open/close/error/list/resize).
     */
    fn_onTelnetStatus(p_me, p_data) {
        if (!p_me.m_flag_mounted) return;
        const v_unit = p_me.props.p_unit;
        if (!p_data || !p_data.unit || p_data.unit.getPartyID() !== v_unit.getPartyID()) return;

        const msg = p_data.msg;
        if (!msg) return;

        const action = msg.a;
        switch (action) {
            case js_andruavMessages.CONST_TELNET_STATUS_OPENED:
                p_me.setState({
                    m_session_id: msg.i || '',
                    m_connected: true,
                    m_error: '',
                });
                p_me.fn_appendOutput('\r\n*** Session opened: ' + (msg.i || '') + ' ***\r\n');
                break;

            case js_andruavMessages.CONST_TELNET_STATUS_CLOSED:
                p_me.fn_appendOutput('\r\n*** Session closed ***\r\n');
                p_me.setState({
                    m_connected: false,
                    m_session_id: '',
                });
                break;

            case js_andruavMessages.CONST_TELNET_STATUS_ERROR:
                p_me.setState({ m_error: msg.e || 'Unknown error' });
                p_me.fn_appendOutput('\r\n*** Error: ' + (msg.e || 'unknown') + ' ***\r\n');
                break;

            case js_andruavMessages.CONST_TELNET_STATUS_RESIZED:
                // Resize ack — nothing to do in UI.
                break;

            case js_andruavMessages.CONST_TELNET_STATUS_LIST:
                // Session list reply — could display, but not essential.
                break;

            default:
                break;
        }
    }

    /**
     * Handle TELNET_DATA (binary pty output) events.
     */
    fn_onTelnetData(p_me, p_data) {
        if (!p_me.m_flag_mounted) return;
        const v_unit = p_me.props.p_unit;
        if (!p_data || !p_data.unit || p_data.unit.getPartyID() !== v_unit.getPartyID()) return;

        // Only render output for our active session.
        if (p_me.state.m_session_id && p_data.session_id !== p_me.state.m_session_id) return;

        p_me.fn_appendOutput(p_data.data || '');
    }

    /**
     * Append text to the terminal output buffer and auto-scroll.
     */
    fn_appendOutput(text) {
        this.m_outputBuffer += text;
        // Trim to max lines to prevent unbounded memory growth.
        const lines = this.m_outputBuffer.split('\n');
        if (lines.length > this.m_maxOutputLines) {
            this.m_outputBuffer = lines.slice(lines.length - this.m_maxOutputLines).join('\n');
        }
        if (this.m_flag_mounted) {
            this.setState({ m_output: this.m_outputBuffer });
            // Auto-scroll to bottom after render.
            setTimeout(() => {
                if (this.m_outputRef.current) {
                    this.m_outputRef.current.scrollTop = this.m_outputRef.current.scrollHeight;
                }
            }, 0);
        }
    }

    /**
     * Open a new shell session on the unit.
     */
    fn_openSession() {
        const v_andruavUnit = this.props.p_unit;
        this.m_outputBuffer = '';
        this.setState({ m_output: '', m_error: '' });
        js_globals.v_andruavFacade.API_telnetOpen(v_andruavUnit, null);
    }

    /**
     * Close the current session.
     */
    fn_closeSession() {
        if (!this.state.m_session_id) return;
        js_globals.v_andruavFacade.API_telnetClose(this.props.p_unit, this.state.m_session_id);
    }

    /**
     * Send the text from the input line to the pty.
     * Appends a newline so the shell executes the command.
     */
    fn_sendInput() {
        if (!this.state.m_connected || !this.state.m_session_id) return;
        const text = this.m_inputRef.current ? this.m_inputRef.current.value : '';
        if (!text) return;
        // Echo the command locally so the user sees what they typed.
        this.fn_appendOutput(text + '\n');
        // Send text + newline to the shell.
        js_globals.v_andruavFacade.API_telnetData(this.props.p_unit, this.state.m_session_id, text + '\n');
        if (this.m_inputRef.current) {
            this.m_inputRef.current.value = '';
        }
    }

    /**
     * Handle keydown in the input field — Enter sends, Ctrl+C sends interrupt.
     */
    fn_handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.fn_sendInput();
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            if (this.state.m_connected && this.state.m_session_id) {
                js_globals.v_andruavFacade.API_telnetData(this.props.p_unit, this.state.m_session_id, '\x03');
                this.fn_appendOutput('^C\n');
            }
        }
    }

    /**
     * Clear the terminal output.
     */
    fn_clearOutput() {
        this.m_outputBuffer = '';
        this.setState({ m_output: '' });
    }

    render() {
        const v_andruavUnit = this.props.p_unit;
        const id = v_andruavUnit.getPartyID() + "_ctl_telnet";
        const isConnected = this.state.m_connected;
        const error = this.state.m_error;

        return (
            <div id={id} key={id} className="ms-1">
                {/* Toolbar: connect / disconnect / clear */}
                <div className="d-flex align-items-center gap-2 mb-1">
                    {!isConnected ? (
                        <button className="btn btn-sm btn-success" onClick={() => this.fn_openSession()}>
                            <i className="bi bi-terminal" /> Connect
                        </button>
                    ) : (
                        <button className="btn btn-sm btn-danger" onClick={() => this.fn_closeSession()}>
                            <i className="bi bi-x-circle" /> Disconnect
                        </button>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => this.fn_clearOutput()} title="Clear screen">
                        <i className="bi bi-eraser" /> Clear
                    </button>
                    {isConnected && (
                        <span className="badge bg-success">Session: {this.state.m_session_id}</span>
                    )}
                    {error && (
                        <span className="badge bg-danger">{error}</span>
                    )}
                </div>

                {/* Terminal output area */}
                <pre
                    ref={this.m_outputRef}
                    className="bg-black text-light rounded p-2 m-0"
                    style={{
                        height: '300px',
                        overflow: 'auto',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        cursor: 'text',
                    }}
                    onClick={() => { if (this.m_inputRef.current) this.m_inputRef.current.focus(); }}
                >{this.state.m_output || (isConnected ? '' : 'Click "Connect" to open a remote shell session.')}</pre>

                {/* Input line */}
                <div className="d-flex align-items-center gap-1 mt-1">
                    <span className="text-success fw-bold" style={{ fontFamily: 'monospace', fontSize: '13px' }}>$</span>
                    <input
                        ref={this.m_inputRef}
                        type="text"
                        className="form-control form-control-sm"
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                        placeholder={isConnected ? "Type a command and press Enter..." : "Connect first"}
                        disabled={!isConnected}
                        onKeyDown={(e) => { e.stopPropagation(); this.fn_handleKeyDown(e); }}
                        onKeyUp={(e) => e.stopPropagation()}
                        autoComplete="off"
                        spellCheck="false"
                    />
                    <button
                        className="btn btn-sm btn-primary"
                        disabled={!isConnected}
                        onClick={() => this.fn_sendInput()}
                    >Send</button>
                </div>
            </div>
        );
    }
}
