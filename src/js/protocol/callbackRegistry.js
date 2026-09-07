/**
 * TASK-02.4 — Single-shot request/reply callback registry.
 *
 * Replaces CAndruavClientParser.v_callbackListeners.
 *
 * API_requestCameraList / API_requestSoundList / API_fetchConfigJSON
 * register a callback here; the inbound reduce path signals a reply
 * (__callbackReply pseudo-event) and runtime fires the callback once
 * when the matching reply (R === true) arrives, then it is removed.
 */
class CCallbackRegistry {
    constructor() {
        this.m_listeners = {};
    }

    /** Register a callback for a message type (overwrites any prior). */
    fn_register(p_messageType, p_callback) {
        this.m_listeners[p_messageType] = p_callback;
    }

    /** Fire the callback once for a message type, then remove it. No-op if none. */
    fn_fireOnce(p_messageType, p_session) {
        if (this.m_listeners.hasOwnProperty(p_messageType) === true) {
            this.m_listeners[p_messageType](p_session);
            delete this.m_listeners[p_messageType];
        }
    }

    fn_clear(p_messageType) {
        delete this.m_listeners[p_messageType];
    }

    fn_clearAll() {
        this.m_listeners = {};
    }
}

export const js_callbackRegistry = new CCallbackRegistry();
