import fs from 'fs';
import { WebSocket } from 'ws';

import * as js_andruavMessages from '../../src/js/protocol/js_andruavMessages.js';
import {
    fn_buildAuthUrl,
    fn_buildHealthBaseUrl,
    fn_buildLoginPayload,
    fn_parseLoginResponse,
} from '../../src/js/shared/andruav_auth_shared.js';

const fn_readConfigSync = (filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    let jsonString = raw;
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
    jsonString = jsonString.replace(/(^|\s)\/\/.*/g, '');
    return JSON.parse(jsonString);
};

const cfg = fn_readConfigSync(new URL('../config.json', import.meta.url));

if (cfg.cloud && cfg.cloud.insecureTls === true) {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

const fn_readJsonOrText = async (res) => {
    const ct = (res && res.headers) ? (res.headers.get('content-type') || '') : '';
    if (ct.toLowerCase().includes('application/json')) {
        return { json: await res.json(), text: null };
    }

    const text = await res.text();
    return { json: null, text: text };
};

const fn_stripTrailingSlash = (s) => {
    try {
        return String(s).replace(/\/+$/, '');
    } catch {
        return s;
    }
};

const fn_connectToCommServer = (parsed, partyID) => {
    return new Promise((resolve, reject) => {
        const commHost = parsed.commServerHost;
        const commPort = parsed.commServerPort;
        const authKey = parsed.commServerAuthKey;
        const sessionId = parsed.sessionId;

        if (!commHost || !commPort || !authKey || !sessionId) {
            reject(new Error('Missing comm server connection parameters'));
            return;
        }

        const protocol = cfg.cloud?.commSecure === true ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${commHost}:${commPort}?f=${authKey}&s=${sessionId}&at=g`;

        console.log('Connecting to comm server:', {
            protocol,
            host: commHost,
            port: commPort,
            partyID: partyID,
        });

        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.on('open', () => {
            console.log('WebSocket OPEN - Connected to comm server');
            resolve(ws);
        });

        ws.on('message', (data) => {
            if (typeof data === 'string') {
                console.log('WS TEXT message:', data);
            } else {
                console.log('WS BINARY message, length:', data.length);
            }
        });

        ws.on('close', () => {
            console.log('WebSocket CLOSED');
        });

        ws.on('error', (err) => {
            console.error('WebSocket ERROR:', err.message);
            reject(err);
        });
    });
};

const fn_main = async () => {
    if (typeof fetch !== 'function') {
        throw new Error('Global fetch is not available. Please use Node 18+ or polyfill fetch.');
    }

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

    const healthBaseUrl = fn_buildHealthBaseUrl(secure, host, port);
    const healthUrl = `${healthBaseUrl}/health`;

    console.log('Checking auth server health:', healthUrl);
    
    try {
        const healthRes = await fetch(healthUrl, { method: 'GET' });
        if (!healthRes.ok) {
            throw new Error(`Auth health failed: ${healthRes.status}`);
        }
        console.log('Auth server health OK');
    } catch (err) {
        console.error('Auth health check failed:', err.message);
        throw new Error(`Auth health check failed: ${err.message}`);
    }

    const payload = fn_buildLoginPayload(email, accessCode, 'de:1.0.0', group);

    const loginUrl = fn_buildAuthUrl(secure, host, port, js_andruavMessages.CONST_WEB_LOGIN_COMMAND);

    const r = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'User-Agent': 'DroneEngage-AuthSample/0.1.0',
        },
        body: JSON.stringify(payload),
    });

    const lastStatus = r.status;
    const parsedBody = await fn_readJsonOrText(r);

    if (!parsedBody || parsedBody.json === null) {
        const snippet = (parsedBody && parsedBody.text ? parsedBody.text : '').substring(0, 250);
        throw new Error(`Auth login bad response (status=${lastStatus}) non-JSON: ${snippet}`);
    }

    const parsed = fn_parseLoginResponse(parsedBody.json);
    if (parsed.ok !== true) {
        console.error('LOGIN FAILED', {
            e: parsed.error,
            em: parsed.errorMessage,
        });
        process.exit(2);
        return;
    }

    console.log('LOGIN OK', {
        sessionId: parsed.sessionId,
        commServerHost: parsed.commServerHost,
        commServerPort: parsed.commServerPort,
        permission: parsed.permission,
        permission2: parsed.permission2,
    });

    const ws = await fn_connectToCommServer(parsed, parsed.sessionId);
    console.log('Connected to communication server successfully');

    process.on('SIGINT', () => {
        console.log('\nClosing WebSocket connection...');
        ws.close();
        setTimeout(() => process.exit(0), 1000);
    });
};

fn_main().catch((e) => {
    try {
        console.error('ERROR', e && e.message ? e.message : e);
    } catch {
    }
    process.exit(1);
});
