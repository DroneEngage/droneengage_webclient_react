import crypto from 'crypto';
import fs from 'fs/promises';

import { fn_readConfigSync, fn_loadTls } from './js_helpers.js';
import CDeServerCommunicator from './js_de_server_communicator.js';
import CLocalServer from './js_local_server.js';

// -----------------------------------------------------------------------------
// Color utilities
// -----------------------------------------------------------------------------
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// -----------------------------------------------------------------------------
// Usage function
// -----------------------------------------------------------------------------
function Usage() {
    return `${colors.cyan}Usage:${colors.reset}
  ${colors.green}droneengage-webconnector${colors.reset} [--config <path>]                    # Use config.json credentials
  ${colors.green}droneengage-webconnector${colors.reset} [--config <path>] ${colors.yellow}<email>${colors.reset} ${colors.yellow}<accessCode>${colors.reset} # Override credentials
  ${colors.green}npx droneengage-webconnector${colors.reset} [--config <path>] ${colors.yellow}<email>${colors.reset} ${colors.yellow}<accessCode>${colors.reset} # Run without installation`;
}

// -----------------------------------------------------------------------------
// Main async function
// -----------------------------------------------------------------------------
async function main() {
// -----------------------------------------------------------------------------
// Startup Banner
// -----------------------------------------------------------------------------
const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));
console.log(`${colors.cyan}=================================================${colors.reset}`);
console.log(`${colors.bright}${colors.yellow}DroneEngage WebClient Connector ver: ${colors.green}${packageJson.version}${colors.reset}`);
console.log(`${colors.cyan}=================================================${colors.reset}`);
console.log(Usage());
console.log(`${colors.cyan}=================================================${colors.reset}`);
console.log('');

// -----------------------------------------------------------------------------
// Command line argument parsing
// -----------------------------------------------------------------------------
const rawArgs = process.argv.slice(2);
let configOverride = null;
const args = [];

for (let i = 0; i < rawArgs.length; ++i) {
    const a = rawArgs[i];
    if (a === '--config') {
        configOverride = rawArgs[i + 1] || null;
        i++;
        continue;
    }

    if (a === '--help' || a === '-h') {
        console.log(Usage());
        process.exit(0);
    }

    args.push(a);
}
let emailOverride = null;
let accessCodeOverride = null;

if (args.length >= 2) {
    emailOverride = args[0];
    accessCodeOverride = args[1];
} else if (args.length === 1) {
    console.error('Usage: node index.js <email> <accessCode>');
    console.error('Please provide both email and accessCode, or run without parameters to use config defaults');
    process.exit(1);
}

// -----------------------------------------------------------------------------
// Config loading
// -----------------------------------------------------------------------------
const cfg = configOverride ? fn_readConfigSync(configOverride) : fn_readConfigSync(new URL('../config.json', import.meta.url));

// Override credentials if provided via command line
if (emailOverride && accessCodeOverride) {
    cfg.credentials = {
        ...cfg.credentials,
        email: emailOverride,
        accessCode: accessCodeOverride
    };
    console.log(`[webplugin] Using command line credentials: email=${emailOverride}`);
}

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
const localAuthSecure = cfg.local ? (cfg.local.authSecure === true) : true;
const localWsSecure = cfg.local ? (cfg.local.wsSecure === true) : true;
const needsTls = localAuthSecure === true || localWsSecure === true;
const tlsOptions = needsTls === true ? fn_loadTls(cfg, webpluginBaseUrl) : null;

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
if (localAuthSecure === true) {
    localServer.startHttps();
} else {
    localServer.startHttp();
}

if (localWsSecure === true) {
    localServer.startWss();
} else {
    localServer.startWs();
}

}

// Run the main function
main().catch(console.error);
