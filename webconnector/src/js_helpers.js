import fs from 'fs';

// -----------------------------------------------------------------------------
// Config loading
// - Loads webplugin/config.json (supports C-style /* */ and // comments).
// - Converts the config into a plain JS object used across the plugin.
// -----------------------------------------------------------------------------

export const fn_readConfigSync = (filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    let jsonString = raw;
    // Remove block comments first, then single-line comments.
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
    jsonString = jsonString.replace(/(^|\s)\/\/.*/g, '');
    return JSON.parse(jsonString);
};

// -----------------------------------------------------------------------------
// Logging safety helpers
// - Avoid logging secrets in URLs (tokens / api keys) and HTTP headers.
// -----------------------------------------------------------------------------

export const fn_redactUrlSecrets = (value) => {
    try {
        const s = String(value);
        return s
            .replace(/([?&]f=)[^&]*/ig, '$1***')
            .replace(/([?&]k=)[^&]*/ig, '$1***');
    } catch {
        return value;
    }
};

export const fn_redactHeaders = (headers) => {
    try {
        if (!headers) return headers;
        const h = { ...headers };
        for (const k of Object.keys(h)) {
            const key = String(k).toLowerCase();
            if (key === 'x-de-api-key' || key === 'authorization' || key === 'cookie') {
                h[k] = '***';
            }
        }
        return h;
    } catch {
        return headers;
    }
};

// -----------------------------------------------------------------------------
// Fetch wrapper
// - Adds request/response logging with secret redaction.
// - Used only for upstream cloud auth endpoints.
// -----------------------------------------------------------------------------
export const fn_fetchLogged = async (url, options, tag = 'fetch') => {
    if (typeof fetch !== 'function') {
        throw new Error('Global fetch is not available. Please use Node 18+ or polyfill fetch.');
    }

    const safeUrl = fn_redactUrlSecrets(url);
    const method = (options && options.method) ? options.method : 'GET';
    try {
        console.info(`[webplugin] ${tag} ->`, {
            method: method,
            url: safeUrl,
            headers: fn_redactHeaders(options ? options.headers : null),
        });
    } catch {
    }

    const t0 = Date.now();
    const res = await fetch(url, options);
    const dt = Date.now() - t0;

    try {
        console.info(`[webplugin] ${tag} <-`, {
            method: method,
            url: safeUrl,
            status: res.status,
            ok: res.ok === true,
            ms: dt,
        });
    } catch {
    }

    return res;
};

// -----------------------------------------------------------------------------
// Response utilities
// -----------------------------------------------------------------------------
export const fn_readJsonOrText = async (res) => {
    const ct = (res && res.headers) ? (res.headers.get('content-type') || '') : '';
    if (ct.toLowerCase().includes('application/json')) {
        return { json: await res.json(), text: null };
    }

    const text = await res.text();
    return { json: null, text: text };
};

// Normalizes URLs built from config values to avoid accidental double slashes.
export const fn_stripTrailingSlash = (s) => {
    try {
        return String(s).replace(/\/+$/, '');
    } catch {
        return s;
    }
};

// Reads TLS cert/key for the local HTTPS & WSS servers.
export const fn_loadTls = (cfg, baseUrl) => {
    const certFile = cfg.tls?.certFile;
    const keyFile = cfg.tls?.keyFile;
    if (!certFile || !keyFile) {
        throw new Error('Missing tls.certFile/tls.keyFile in config.json');
    }

    return {
        cert: fs.readFileSync(new URL(certFile, baseUrl)),
        key: fs.readFileSync(new URL(keyFile, baseUrl)),
    };
};
