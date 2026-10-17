import React from 'react';
import 'altcha';

/**
 * Wraps the ALTCHA proof-of-work widget (<altcha-widget>). On mount it
 * fetches a challenge from the authenticator (p_challengeUrl) and solves it
 * in a background worker — no typing for the user. The signed payload is
 * read via fn_getPayload() and sent to the server as the 'cp' field on the
 * public account commands (create/regenerate access code). Payloads are
 * single-use server-side, so call fn_reset() after every submit attempt.
 */
export default class ClssAltcha extends React.Component {
    constructor() {
        super();
        this.m_widgetRef = React.createRef();
        this.m_payload = null;
        this.fn_onStateChange = this.fn_onStateChange.bind(this);
    }

    componentDidMount() {
        const widget = this.m_widgetRef.current;
        if (!widget) return;
        // Config goes through the `configuration` attribute (JSON), not
        // widget.configure() — the Svelte-based element only exposes its
        // methods on a microtask after connect, so configure() does not
        // exist yet when componentDidMount runs and the call is skipped.
        widget.addEventListener('statechange', this.fn_onStateChange);
    }

    componentWillUnmount() {
        const widget = this.m_widgetRef.current;
        if (widget) widget.removeEventListener('statechange', this.fn_onStateChange);
    }

    fn_onStateChange(e) {
        const detail = e.detail || {};
        this.m_payload = detail.state === 'verified' ? detail.payload : null;
        if (this.props.p_onStateChange) this.props.p_onStateChange(detail);
    }

    /** @returns {string|null} solved ALTCHA payload (base64) or null when not verified yet. */
    fn_getPayload() {
        return this.m_payload;
    }

    /** Forces a fresh challenge — payloads are single-use server-side. */
    fn_reset() {
        this.m_payload = null;
        const widget = this.m_widgetRef.current;
        if (widget && typeof widget.reset === 'function') widget.reset();
    }

    render() {
        return <altcha-widget
            ref={this.m_widgetRef}
            className={this.props.p_dark === false ? undefined : 'css_altcha_dark'}
            configuration={JSON.stringify({
                challenge: this.props.p_challengeUrl,
                auto: 'onload',
                hideLogo: true,
                hideFooter: true,
            })}
        />;
    }
}
