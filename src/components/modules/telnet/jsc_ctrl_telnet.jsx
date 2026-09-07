/**
 * Remote Telnet/Terminal control for DroneEngage units.
 *
 * Simple line-mode terminal interface that:
 *  - Opens a shell session on the unit's de_telnet module.
 *  - Sends a whole command line as a single TELNET_DATA message
 *    (text + CR) via the input box / Send button / Enter key.
 *  - Provides toolbar buttons for Ctrl+C / Ctrl+Z / Backspace / Delete
 *    that send the corresponding raw byte(s) directly to the pty
 *    (useful to interrupt/suspend a running command or edit output
 *    without typing a full line).
 *  - Renders pty output received as TELNET_DATA (binary) events with
 *    ANSI color support.
 *  - Handles session open/close/resize/status via TELNET_STATUS events.
 *
 * The output <pre> is read-only display only — there is no character-
 * mode keystroke forwarding or cursor emulation. This keeps the model
 * simple and predictable, at the cost of not supporting raw-mode
 * full-screen apps (vim, nano, top, ...).
 *
 * No external terminal library (xterm.js) is used, consistent with the
 * existing gadget components.
 *
 * @auth: Devin / DroneEngage
 */

import React from 'react';
import * as js_session from '../../js/state/session.js';
import { EVENTS as js_event } from '../../../js/events/js_eventList.js'
import { js_eventEmitter } from '../../../js/events/js_eventEmitter.js'
import * as js_andruavMessages from '../../../js/protocol/messages/js_andruavMessages'
import { ansiToReact } from './js_ansi_parser.js'

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

        this.m_outputRef = React.createRef();
        this.m_inputRef = React.createRef();

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
            js_session.fn_getAndruavFacade().API_telnetClose(this.props.p_unit, this.state.m_session_id);
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
        js_session.fn_getAndruavFacade().API_telnetOpen(v_andruavUnit, null);
    }

    /**
     * Close the current session.
     */
    fn_closeSession() {
        if (!this.state.m_session_id) return;
        js_session.fn_getAndruavFacade().API_telnetClose(this.props.p_unit, this.state.m_session_id);
    }

    /**
     * Send a raw string (one or more bytes) to the remote pty.
     */
    fn_sendToPty(data) {
        if (!this.state.m_connected || !this.state.m_session_id) return;
        js_session.fn_getAndruavFacade().API_telnetData(this.props.p_unit, this.state.m_session_id, data);
    }

    /**
     * Send the text from the input line to the pty as a single message
     * (text + CR), so the shell executes it. One round-trip per command.
     */
    fn_sendCommand() {
        if (!this.state.m_connected || !this.state.m_session_id) return;
        const text = this.m_inputRef.current ? this.m_inputRef.current.value : '';
        this.fn_sendToPty(text + '\r');
        if (this.m_inputRef.current) {
            this.m_inputRef.current.value = '';
        }
    }

    /**
     * Toolbar control-button handlers — each sends the corresponding
     * raw terminal byte sequence to the pty.
     */
    fn_btnCtrlC() { this.fn_sendToPty('\x03'); }       // ETX - interrupt
    fn_btnCtrlZ() { this.fn_sendToPty('\x1a'); }       // SUB - suspend
    fn_btnBackspace() { this.fn_sendToPty('\x7f'); }   // DEL - backspace
    fn_btnDelete() { this.fn_sendToPty('\x1b[3~'); }   // Delete key sequence

    /**
     * Clear the terminal output.
     */
    fn_clearOutput() {
        this.m_outputBuffer = '';
        this.setState({ m_output: '' });
    }

    /**
     * Export the terminal output buffer as a downloadable .txt file
     * (raw text, ANSI escape codes included as-is).
     */
    fn_exportOutput() {
        const v_andruavUnit = this.props.p_unit;
        const blob = new Blob([this.m_outputBuffer], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `telnet_${v_andruavUnit.getPartyID()}_${stamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    render() {
        const v_andruavUnit = this.props.p_unit;
        const id = v_andruavUnit.getPartyID() + "_ctl_telnet";
        const isConnected = this.state.m_connected;
        const error = this.state.m_error;

        return (
            <div id={id} key={id} className="ms-1">
                {/* Toolbar: connect / disconnect / clear + control buttons */}
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
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
                    <button className="btn btn-sm btn-secondary" onClick={() => this.fn_exportOutput()} title="Export terminal output as text file">
                        <i className="bi bi-download" /> Export
                    </button>

                    {isConnected && (
                        <>
                            <div className="vr" />
                            <button className="btn btn-sm btn-outline-warning"
                                onClick={() => this.fn_btnCtrlC()}
                                title="Send Ctrl+C (interrupt)"
                                style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                Ⓒ
                            </button>
                            <button className="btn btn-sm btn-outline-warning"
                                onClick={() => this.fn_btnCtrlZ()}
                                title="Send Ctrl+Z (suspend)"
                                style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                Ⓩ
                            </button>
                            <button className="btn btn-sm btn-outline-secondary"
                                onClick={() => this.fn_btnBackspace()}
                                title="Send Backspace (DEL)">
                                <i className="bi bi-backspace" />
                            </button>
                            <button className="btn btn-sm btn-outline-secondary"
                                onClick={() => this.fn_btnDelete()}
                                title="Send Delete key">
                                <i className="bi bi-x-circle" />
                            </button>
                        </>
                    )}

                    {isConnected && (
                        <span className="badge bg-success">Session: {this.state.m_session_id}</span>
                    )}
                    {error && (
                        <span className="badge bg-danger">{error}</span>
                    )}
                </div>

                {/* Terminal output area — read-only display */}
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
                    }}
                >{this.state.m_output
                    ? ansiToReact(this.state.m_output)
                    : (isConnected ? '' : 'Click "Connect" to open a remote shell session.')}</pre>

                {/* Input line — sends a whole command in one message */}
                <div className="d-flex align-items-center gap-1 mt-1">
                    <span className="text-success fw-bold" style={{ fontFamily: 'monospace', fontSize: '13px' }}>$</span>
                    <input
                        ref={this.m_inputRef}
                        type="text"
                        className="form-control form-control-sm"
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                        placeholder={isConnected ? "Type a command and press Enter..." : "Connect first"}
                        disabled={!isConnected}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') { e.preventDefault(); this.fn_sendCommand(); }
                        }}
                        onKeyUp={(e) => e.stopPropagation()}
                        autoComplete="off"
                        spellCheck="false"
                    />
                    <button
                        className="btn btn-sm btn-primary"
                        disabled={!isConnected}
                        onClick={() => this.fn_sendCommand()}
                    >Send</button>
                </div>
            </div>
        );
    }
}
