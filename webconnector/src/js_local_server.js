import http from 'http';
import https from 'https';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

import {
    fn_redactUrlSecrets,
    fn_redactHeaders,
} from './js_helpers.js';

// -----------------------------------------------------------------------------
// CLocalServer
// - Manages the local HTTPS server (Auth API) and WSS server (frame relay).
// - Express serves a small subset of the cloud auth API used by webclient.
// - WSS accepts local browser clients and relays frames upstream/downstream.
// -----------------------------------------------------------------------------
class CLocalServer {

    #cfg;
    #state;
    #tlsOptions;
    #serverCommunicator;
    #app;
    #httpsServer;
    #wssServer;
    #wss;
    #reqSeq;

    constructor(cfg, state, tlsOptions, serverCommunicator) {
        this.#cfg = cfg;
        this.#state = state;
        this.#tlsOptions = tlsOptions;
        this.#serverCommunicator = serverCommunicator;
        this.#reqSeq = 0;

        this.#app = null;
        this.#httpsServer = null;
        this.#wssServer = null;
        this.#wss = null;
    }

    startHttp() {
        this.#app = this.#fn_buildExpressApp();

        this.#httpsServer = http.createServer(this.#app);
        this.#httpsServer.on('error', (e) => {
            try {
                if (e && e.code === 'EADDRINUSE') {
                    console.error('[webplugin] HTTP server port already in use', {
                        address: this.#cfg.bindAddress,
                        port: this.#cfg.authPort,
                    });
                    console.error('[webplugin] Hint: find and kill the process using the port, e.g.:');
                    console.error(`  lsof -iTCP:${this.#cfg.authPort} -sTCP:LISTEN -n -P`);
                } else {
                    console.error('[webplugin] HTTP server error', e);
                }
            } catch {
            }
            process.exit(1);
        });

        this.#httpsServer.listen(this.#cfg.authPort, this.#cfg.bindAddress, () => {
            console.log(`webplugin HTTP listening on http://${this.#cfg.bindAddress}:${this.#cfg.authPort}`);

            setTimeout(async () => {
                try {
                    await this.#serverCommunicator.ensureReady();
                } catch (e) {
                    try {
                        console.error('[webplugin] upstream autoconnect failed', e);
                    } catch {
                    }
                }
            }, 10);
        });
    }

    /**
     * Broadcast data to all connected local WSS clients.
     * @param {*} data
     */
    broadcastToClients(data) {
        for (const c of this.#state.clients) {
            if (c.readyState === WebSocket.OPEN) {
                c.send(data);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Access control
    // - HTTP endpoints authenticate via x-de-api-key header (if configured).
    // - WSS endpoint authenticates via query param k= (apiKey) + f= (pluginToken).
    // -------------------------------------------------------------------------
    #fn_requireApiKey(req) {
        const required = this.#cfg.apiKey && this.#cfg.apiKey.length > 0;
        if (!required) return true;

        const headerKey = req.headers['x-de-api-key'];
        if (headerKey && headerKey === this.#cfg.apiKey) return true;

        return false;
    }

    #fn_requireWsApiKey(url) {
        const required = this.#cfg.apiKey && this.#cfg.apiKey.length > 0;
        if (!required) return true;

        const k = url.searchParams.get('k');
        return k === this.#cfg.apiKey;
    }

    // Build the login response expected by webclient "plugin mode".
    #fn_buildPluginLoginReply(reqHost, reqPort) {
        return {
            e: 0,
            sid: this.#state.pluginSessionId,
            cs: {
                g: reqHost,
                h: reqPort,
                f: this.#state.pluginToken,
            },
            // Plugin-generated partyId.
            // WebClient must use this value as its partyID when connecting to plugin WSS.
            // This is independent from the cloud auth `sid`.
            plugin_party_id: this.#state.upstream.partyId,
            per: this.#state.upstream.auth.permission || '0xffffffff',
            prm: this.#state.upstream.auth.permission2 || '0xffffffff',
        };
    }

    // -------------------------------------------------------------------------
    // Local HTTPS server (Auth API)
    // - Express serves a small subset of the cloud auth API used by webclient.
    // - Provides /h/health and /w/wl/ (login) endpoints.
    // - Adds basic CORS + request logging.
    // -------------------------------------------------------------------------
    #fn_buildExpressApp() {
        const app = express();

        app.use((req, res, next) => {
            const id = ++this.#reqSeq;
            const started = Date.now();

            try {
                console.info('[webplugin] http ->', {
                    id: id,
                    method: req.method,
                    url: req.originalUrl,
                    ip: req.ip,
                    host: req.headers.host,
                    headers: fn_redactHeaders(req.headers),
                });
            } catch {
            }

            res.on('finish', () => {
                try {
                    console.info('[webplugin] http <-', {
                        id: id,
                        method: req.method,
                        url: req.originalUrl,
                        status: res.statusCode,
                        ms: Date.now() - started,
                    });
                } catch {
                }
            });

            next();
        });

        app.use((req, res, next) => {
            const origin = req.headers.origin;
            const allowedOrigin = this.#cfg.cors && this.#cfg.cors.allowedOrigin ? String(this.#cfg.cors.allowedOrigin) : null;

            if (allowedOrigin && allowedOrigin.length > 0) {
                if (origin && origin === allowedOrigin) {
                    res.setHeader('Access-Control-Allow-Origin', origin);
                    res.setHeader('Vary', 'Origin');
                }
            } else {
                // Allow browser clients to call the plugin from any origin.
                if (origin) {
                    res.setHeader('Access-Control-Allow-Origin', origin);
                    res.setHeader('Vary', 'Origin');
                } else {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                }
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-de-api-key');

            if (req.method === 'OPTIONS') {
                res.status(204).end();
                return;
            }

            next();
        });
        app.use(express.json({ limit: '2mb' }));

        // Health endpoint used by webclient/plugin discovery.
        app.get('/h/health', (req, res) => {
            if (!this.#fn_requireApiKey(req)) {
                try {
                    console.warn('[webplugin] /h/health forbidden', { ip: req.ip });
                } catch {
                }
                res.status(403).json({ e: 403, em: 'Forbidden' });
                return;
            }

            try {
                console.info('[webplugin] /h/health', {
                    ip: req.ip,
                    upstreamWsConnected: this.#serverCommunicator.isWsConnected,
                    hasSession: this.#serverCommunicator.hasSession,
                });
            } catch {
            }

            const healthReply = {
                ok: true,
                upstream: {
                    wsConnected: this.#serverCommunicator.isWsConnected,
                    hasSession: this.#serverCommunicator.hasSession,
                },
            };
            try {
                console.info('[webplugin] /h/health response', healthReply);
            } catch { }
            res.json(healthReply);
        });

        // Web login endpoint used by the webclient when plugin mode is enabled.
        app.post('/w/wl/', async (req, res) => {
            if (!this.#fn_requireApiKey(req)) {
                try {
                    console.warn('[webplugin] /w/wl forbidden', { ip: req.ip });
                } catch {
                }
                res.status(403).json({ e: 403, em: 'Forbidden' });
                return;
            }

            try {
                try {
                    console.info('[webplugin] /w/wl', {
                        ip: req.ip,
                        hasUid: !!(req.body && typeof req.body.uid === 'string' && req.body.uid.length > 0),
                    });
                } catch {
                }

                // Plugin uses its own partyId for upstream connection.
                // All webclients connecting to this plugin will use the same partyId.
                await this.#serverCommunicator.ensureReady();

                const hostHeader = req.headers.host || `${this.#cfg.bindAddress}:${this.#cfg.wsPort}`;
                const hostParts = String(hostHeader).split(':');
                const hostOnly = hostParts[0];
                const portOnly = hostParts.length > 1 ? parseInt(hostParts[1], 10) : NaN;
                const advertisedPort = Number.isFinite(portOnly) ? portOnly : this.#cfg.wsPort;
                const reply = this.#fn_buildPluginLoginReply(hostOnly, advertisedPort);
                try {
                    console.info('[webplugin] /w/wl response', reply);
                } catch { }
                res.json(reply);
            } catch (e) {
                res.status(500).json({ e: 500, em: e.message || 'Plugin error' });
            }
        });

        // Web logout endpoint (kept for compatibility; plugin does not maintain per-client state).
        app.post('/w/wo/', (req, res) => {
            if (!this.#fn_requireApiKey(req)) {
                res.status(403).json({ e: 403, em: 'Forbidden' });
                return;
            }

            try {
                console.info('[webplugin] /w/wo response', { e: 0, em: 'OK' });
            } catch { }
            res.json({ e: 0, em: 'OK' });
        });

        return app;
    }

    // -------------------------------------------------------------------------
    // Start the local HTTPS server (Auth API).
    // -------------------------------------------------------------------------
    startHttps() {
        this.#app = this.#fn_buildExpressApp();

        // HTTPS server hosts the Express app.
        this.#httpsServer = https.createServer(this.#tlsOptions, this.#app);
        this.#httpsServer.on('error', (e) => {
            try {
                if (e && e.code === 'EADDRINUSE') {
                    console.error('[webplugin] HTTPS server port already in use', {
                        address: this.#cfg.bindAddress,
                        port: this.#cfg.authPort,
                    });
                    console.error('[webplugin] Hint: find and kill the process using the port, e.g.:');
                    console.error(`  lsof -iTCP:${this.#cfg.authPort} -sTCP:LISTEN -n -P`);
                } else {
                    console.error('[webplugin] HTTPS server error', e);
                }
            } catch {
            }
            process.exit(1);
        });
        this.#httpsServer.listen(this.#cfg.authPort, this.#cfg.bindAddress, () => {
            console.log(`webplugin HTTPS listening on https://${this.#cfg.bindAddress}:${this.#cfg.authPort}`);

            // Opportunistic upstream connect on startup (non-fatal if cloud is down).
            setTimeout(async () => {
                try {
                    await this.#serverCommunicator.ensureReady();
                } catch (e) {
                    try {
                        console.error('[webplugin] upstream autoconnect failed', e);
                    } catch {
                    }
                }
            }, 10);
        });
    }

    // -------------------------------------------------------------------------
    // Local WSS server (frame relay)
    // - Accepts local browser clients.
    // - Enforces apiKey + per-process plugin token.
    // - Forwards client frames upstream and broadcasts upstream frames back.
    // -------------------------------------------------------------------------
    startWss() {
        this.#wssServer = https.createServer(this.#tlsOptions);
        this.#wssServer.on('error', (e) => {
            try {
                if (e && e.code === 'EADDRINUSE') {
                    console.error('[webplugin] WSS server port already in use', {
                        address: this.#cfg.bindAddress,
                        port: this.#cfg.wsPort,
                    });
                    console.error('[webplugin] Hint: find and kill the process using the port, e.g.:');
                    console.error(`  lsof -iTCP:${this.#cfg.wsPort} -sTCP:LISTEN -n -P`);
                } else {
                    console.error('[webplugin] WSS server error', e);
                }
            } catch {
            }
            process.exit(1);
        });
        this.#wss = new WebSocketServer({ server: this.#wssServer });

        this.#wss.on('connection', async (socket, req) => {
            const url = new URL(req.url, `https://${req.headers.host}`);

            try {
                console.info('[webplugin] wss incoming', {
                    url: fn_redactUrlSecrets(url.toString()),
                    host: req.headers.host,
                });
            } catch {
            }

            if (!this.#fn_requireWsApiKey(url)) {
                try {
                    console.warn('[webplugin] wss forbidden (apiKey)');
                } catch {
                }
                socket.close(1008, 'Forbidden (apiKey)');
                return;
            }

            const f = url.searchParams.get('f');
            // Token ties WSS access to the prior plugin login response.
            if (!f || f !== this.#state.pluginToken) {
                try {
                    console.warn('[webplugin] wss forbidden (token)');
                } catch {
                }
                socket.close(1008, 'Forbidden (token)');
                return;
            }

            this.#state.clients.add(socket);

            try {
                console.info('[webplugin] wss client connected', { clients: this.#state.clients.size });
            } catch {
            }

            try {
                await this.#serverCommunicator.ensureReady();
            } catch {
            }

            socket.on('message', (data, isBinary) => {
                // Forward local client frames upstream.
                try {
                    const len = data ? (data.byteLength ?? data.length ?? null) : null;
                    console.info('[webplugin] >> client', {
                        bytes: len,
                        isBinary: isBinary === true,
                        upstreamConnected: this.#serverCommunicator.isWsConnected,
                    });
                } catch {
                }
                this.#serverCommunicator.sendUpstream(data, { binary: isBinary === true });
            });

            socket.on('close', () => {
                this.#state.clients.delete(socket);

                try {
                    console.info('[webplugin] wss client closed', { clients: this.#state.clients.size });
                } catch {
                }
            });
        });

        this.#wssServer.listen(this.#cfg.wsPort, this.#cfg.bindAddress, () => {
            console.log(`webplugin WSS listening on wss://${this.#cfg.bindAddress}:${this.#cfg.wsPort}`);
        });
    }

    startWs() {
        this.#wssServer = http.createServer();
        this.#wssServer.on('error', (e) => {
            try {
                if (e && e.code === 'EADDRINUSE') {
                    console.error('[webplugin] WS server port already in use', {
                        address: this.#cfg.bindAddress,
                        port: this.#cfg.wsPort,
                    });
                    console.error('[webplugin] Hint: find and kill the process using the port, e.g.:');
                    console.error(`  lsof -iTCP:${this.#cfg.wsPort} -sTCP:LISTEN -n -P`);
                } else {
                    console.error('[webplugin] WS server error', e);
                }
            } catch {
            }
            process.exit(1);
        });

        this.#wss = new WebSocketServer({ server: this.#wssServer });
        this.#wss.on('connection', async (socket, req) => {
            const url = new URL(req.url, `http://${req.headers.host}`);

            try {
                console.info('[webplugin] ws incoming', {
                    url: fn_redactUrlSecrets(url.toString()),
                    host: req.headers.host,
                });
            } catch {
            }

            if (!this.#fn_requireWsApiKey(url)) {
                try {
                    console.warn('[webplugin] ws forbidden (apiKey)');
                } catch {
                }
                socket.close(1008, 'Forbidden (apiKey)');
                return;
            }

            const f = url.searchParams.get('f');
            if (!f || f !== this.#state.pluginToken) {
                try {
                    console.warn('[webplugin] ws forbidden (token)');
                } catch {
                }
                socket.close(1008, 'Forbidden (token)');
                return;
            }

            this.#state.clients.add(socket);
            try {
                console.info('[webplugin] ws client connected', { clients: this.#state.clients.size });
            } catch {
            }

            try {
                await this.#serverCommunicator.ensureReady();
            } catch {
            }

            socket.on('message', (data, isBinary) => {
                try {
                    const len = data ? (data.byteLength ?? data.length ?? null) : null;
                    console.info('[webplugin] >> client', {
                        bytes: len,
                        isBinary: isBinary === true,
                        upstreamConnected: this.#serverCommunicator.isWsConnected,
                    });
                } catch {
                }
                this.#serverCommunicator.sendUpstream(data, { binary: isBinary === true });
            });

            socket.on('close', () => {
                this.#state.clients.delete(socket);
                try {
                    console.info('[webplugin] ws client closed', { clients: this.#state.clients.size });
                } catch {
                }
            });
        });

        this.#wssServer.listen(this.#cfg.wsPort, this.#cfg.bindAddress, () => {
            console.log(`webplugin WS listening on ws://${this.#cfg.bindAddress}:${this.#cfg.wsPort}`);
        });
    }
}

export default CLocalServer;
