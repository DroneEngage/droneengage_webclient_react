import crypto from 'crypto';

import { fn_readConfigSync, fn_loadTls } from './js_helpers.js';
import CDeServerCommunicator from './js_de_server_communicator.js';
import CLocalServer from './js_local_server.js';

// -----------------------------------------------------------------------------
// Config loading
// -----------------------------------------------------------------------------
const cfg = fn_readConfigSync(new URL('../config.json', import.meta.url));

if (cfg.cloud && cfg.cloud.insecureTls === true) {
    // Allow connecting to upstream HTTPS/WSS endpoints with self-signed certs.
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    try {
        console.warn('[webplugin] WARNING: insecureTls enabled - TLS verification is disabled');
    } catch {
    }
}

// -----------------------------------------------------------------------------
// Plugin runtime state
// - pluginToken is a static shared secret from config to protect WSS access.
// - pluginSessionId is returned to clients as a login session id.
// - upstream holds authenticated cloud connection details.
// - clients tracks all connected local WSS clients.
// -----------------------------------------------------------------------------
const state = {
    pluginToken: cfg.pluginToken || crypto.randomBytes(24).toString('hex'),
    pluginSessionId: crypto.randomBytes(12).toString('hex'),

    upstream: {
        partyId: `WEB_GCS_PLG_${crypto.randomBytes(2).toString('hex')}`,
        auth: {
            sessionId: null,
            commServerHost: null,
            commServerPort: null,
            commServerAuthKey: null,
            permission: null,
            permission2: null,
        },
        ws: null,
        wsConnected: false,
        wsConnecting: false,
        reconnectTimer: null,
    },

    clients: new Set(),
};

// -----------------------------------------------------------------------------
// TLS
// -----------------------------------------------------------------------------
const webpluginBaseUrl = new URL('../', import.meta.url);
const tlsOptions = fn_loadTls(cfg, webpluginBaseUrl);

// -----------------------------------------------------------------------------
// Wire up modules
// -----------------------------------------------------------------------------
const serverCommunicator = new CDeServerCommunicator(cfg, state);
const localServer = new CLocalServer(cfg, state, tlsOptions, serverCommunicator);

// Upstream frames are broadcast to all local WSS clients.
serverCommunicator.setOnUpstreamMessage((data) => {
    localServer.broadcastToClients(data);
});

// -----------------------------------------------------------------------------
// Start servers
// -----------------------------------------------------------------------------
localServer.startHttps();
localServer.startWss();
