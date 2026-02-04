import { WebSocket } from 'ws';

import * as js_andruavMessages from '../../src/js/protocol/js_andruavMessages.js';
import {
    fn_buildAuthUrl,
    fn_buildHealthBaseUrl,
    fn_buildLoginPayload,
    fn_parseLoginResponse,
} from '../../src/js/shared/andruav_auth_shared.js';

import {
    fn_redactUrlSecrets,
    fn_fetchLogged,
    fn_readJsonOrText,
    fn_stripTrailingSlash,
} from './js_helpers.js';

// -----------------------------------------------------------------------------
// CDeServerCommunicator
// - Handles upstream cloud authentication and WebSocket lifecycle.
// - Maintains a single WS connection to the cloud comm server.
// - Broadcasts upstream frames via an onUpstreamMessage callback.
// - Reconnects automatically on close.
// -----------------------------------------------------------------------------
class CDeServerCommunicator {

    #cfg;
    #state;
    #onUpstreamMessage;

    constructor(cfg, state) {
        this.#cfg = cfg;
        this.#state = state;
        this.#onUpstreamMessage = null;
    }

    /**
     * Register a callback invoked for every upstream WS frame.
     * @param {function} callback - fn(data)
     */
    setOnUpstreamMessage(callback) {
        this.#onUpstreamMessage = callback;
    }

    get isWsConnected() {
        return this.#state.upstream.wsConnected === true;
    }

    get hasSession() {
        return !!this.#state.upstream.auth.sessionId;
    }

    /**
     * Send data upstream to the cloud comm server.
     * @param {*} data
     * @param {{ binary: boolean }} opts
     */
    sendUpstream(data, opts) {
        if (this.#state.upstream.ws && this.#state.upstream.wsConnected === true) {
            this.#state.upstream.ws.send(data, opts);
        }
    }

    // -------------------------------------------------------------------------
    // Upstream cloud login
    // - Performs a health probe, then tries multiple login URL candidates.
    // - Stores comm server connection details for subsequent WS connection.
    // -------------------------------------------------------------------------
    async login() {
        const cfg = this.#cfg;
        const state = this.#state;

        const email = cfg.credentials?.email;
        const accessCode = cfg.credentials?.accessCode;
        const group = cfg.credentials?.group || '1';

        if (!email || !accessCode) {
            throw new Error('Missing credentials.email / credentials.accessCode in webplugin/config.json');
        }

        const host = cfg.cloud?.authHost;
        const port = cfg.cloud?.authPort;
        const secure = cfg.cloud?.authSecure === true;

        if (!host || !port) {
            throw new Error('Missing cloud.authHost / cloud.authPort in webplugin/config.json');
        }

        const loginUrl = fn_buildAuthUrl(secure, host, port, js_andruavMessages.CONST_WEB_LOGIN_COMMAND);
        const healthBaseUrl = fn_buildHealthBaseUrl(secure, host, port);

        const healthUrl = `${healthBaseUrl}/health`;

        try {
            console.info('[webplugin] cloud probe', {
                healthUrl: healthUrl,
                authHost: cfg.cloud?.authHost,
                authPort: cfg.cloud?.authPort,
                authSecure: cfg.cloud?.authSecure === true,
                wsSecure: cfg.cloud?.wsSecure === true,
            });
        } catch {
        }

        const healthRes = await fn_fetchLogged(healthUrl, { method: 'GET' }, 'cloud.health');
        if (!healthRes.ok) {
            throw new Error(`Cloud health failed: ${healthRes.status}`);
        }

        const payload = fn_buildLoginPayload(email, accessCode, 'de:1.0.0', group);

        let res;
        try {
            console.info('[webplugin] cloud login request', {
                url: loginUrl,
                group: group,
            });
        } catch {
        }

        const candidates = [
            { url: loginUrl, payload: payload, tag: 'cloud.login' },
            { url: fn_stripTrailingSlash(loginUrl), payload: payload, tag: 'cloud.login.1' },
        ];

        try {
            console.info('[webplugin] cloud login candidates (in order)', candidates.map(c => ({
                tag: c.tag,
                url: fn_redactUrlSecrets(c.url),
            })));
        } catch {
        }

        res = null;
        for (let i = 0; i < candidates.length; ++i) {
            const c = candidates[i];
            const r = await fn_fetchLogged(c.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'User-Agent': 'DroneEngage-WebPlugin/0.1.0',
                },
                body: JSON.stringify(c.payload),
            }, c.tag);

            res = r;
            if (r.status !== 404) {
                break;
            }

            try {
                console.warn('[webplugin] cloud login 404 - trying next candidate', {
                    tag: c.tag,
                    url: fn_redactUrlSecrets(c.url),
                    isRouterFallback: String(c.tag).includes('.router.') === true,
                });
            } catch {
            }
        }

        const parsedBody = await fn_readJsonOrText(res);
        if (parsedBody.json === null) {
            const snippet = (parsedBody.text || '').substring(0, 250);
            throw new Error(`Cloud login bad response (status=${res.status}) non-JSON: ${snippet}`);
        }

        const parsed = fn_parseLoginResponse(parsedBody.json);
        if (parsed.ok !== true) {
            try {
                console.error('[webplugin] cloud login failed', {
                    status: res.status,
                    e: parsed.error,
                    em: parsed.errorMessage,
                });
            } catch {
            }
            throw new Error(`Cloud login failed: ${parsed.errorMessage || parsed.error}`);
        }

        state.upstream.auth.sessionId = parsed.sessionId;
        state.upstream.auth.commServerHost = parsed.commServerHost;
        state.upstream.auth.commServerPort = parsed.commServerPort;
        state.upstream.auth.commServerAuthKey = parsed.commServerAuthKey;
        state.upstream.auth.permission = parsed.permission;
        state.upstream.auth.permission2 = parsed.permission2;

        try {
            console.info('[webplugin] cloud login OK', {
                commServerHost: parsed.commServerHost,
                commServerPort: parsed.commServerPort,
            });
        } catch {
        }
    }

    // -------------------------------------------------------------------------
    // Upstream cloud WebSocket
    // - Maintains a single WS connection to the cloud comm server.
    // - Broadcasts upstream frames to all local plugin clients.
    // - Reconnects automatically on close.
    // -------------------------------------------------------------------------
    connectWs() {
        const cfg = this.#cfg;
        const state = this.#state;

        if (state.upstream.wsConnected === true || state.upstream.wsConnecting === true) return;

        const host = state.upstream.auth.commServerHost;
        const port = state.upstream.auth.commServerPort;
        const authKey = state.upstream.auth.commServerAuthKey;

        if (!host || !port || !authKey) {
            throw new Error('Upstream comm server not ready (missing cs.g/cs.h/cs.f)');
        }

        const protocol = cfg.cloud?.wsSecure === true ? 'wss' : 'ws';
        const url = `${protocol}://${host}:${port}?f=${encodeURIComponent(authKey)}&s=${encodeURIComponent(state.upstream.partyId)}&at=g`;

        try {
            const safeUrl = fn_redactUrlSecrets(url);
            console.info('[webplugin] upstream ws connecting', { url: safeUrl });
        } catch {
        }

        state.upstream.wsConnecting = true;

        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            state.upstream.ws = ws;
            state.upstream.wsConnected = true;
            state.upstream.wsConnecting = false;

            try {
                console.info('[webplugin] upstream ws open');
            } catch {
            }
        };

        ws.onmessage = (evt) => {
            // Relay upstream frames to all connected local clients.
            try {
                const len = evt && evt.data ? (evt.data.byteLength ?? evt.data.length ?? null) : null;
                let msgType = null;
                if (typeof evt.data === 'string') {
                    try {
                        const parsed = JSON.parse(evt.data);
                        msgType = parsed.messageType || parsed.mt;

                        console.info('[webplugin] << upstream', {
                            bytes: len,
                            msgType: msgType,
                            isCameraList: msgType === 1012,
                        });
                    } catch { }
                }

            } catch {
            }

            if (this.#onUpstreamMessage) {
                this.#onUpstreamMessage(evt.data);
            }
        };

        ws.onerror = (err) => {
            try {
                console.error('[webplugin] upstream ws error', err);
            } catch {
            }
        };

        ws.onclose = () => {
            state.upstream.wsConnected = false;
            state.upstream.wsConnecting = false;
            state.upstream.ws = null;

            try {
                console.warn('[webplugin] upstream ws close');
            } catch {
            }

            const delay = cfg.reconnect?.upstreamWsDelayMs || 2000;
            if (state.upstream.reconnectTimer) clearTimeout(state.upstream.reconnectTimer);
            state.upstream.reconnectTimer = setTimeout(() => {
                try {
                    this.connectWs();
                } catch {
                }
            }, delay);
        };
    }

    // Ensures the plugin has a valid cloud session and an active upstream WS.
    async ensureReady() {
        const cfg = this.#cfg;

        if (cfg.cloud && cfg.cloud.localOnlyMode === true) {
            try {
                console.warn('[webplugin] localOnlyMode enabled - skipping upstream cloud connection');
            } catch {
            }
            return;
        }

        try {
            console.info('[webplugin] ensure upstream ready', {
                hasSession: this.hasSession,
                wsConnected: this.isWsConnected,
            });
        } catch {
        }

        if (!this.hasSession) {
            await this.login();
        }

        if (!this.isWsConnected) {
            this.connectWs();
        }
    }
}

export default CDeServerCommunicator;
