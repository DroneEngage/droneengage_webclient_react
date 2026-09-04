const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();

const sslOptions = {
  cert: fs.readFileSync(process.env.WEB_SSL_CRT || "./ssl/localssl.crt"),
  key: fs.readFileSync(process.env.WEB_SSL_KEY || "./ssl/localssl.key"),
};

const PORT = process.env.WEB_PORT || process.env.PORT || 3000;

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS server running on port ${PORT}`);
});

app.use(express.static(path.join(__dirname, 'build')));

// ─── OpenSky proxy ───────────────────────────────────────────────────────────
// OpenSky's API does not send CORS headers for third-party origins, so browser
// fetch() is blocked. This proxy forwards requests server-side (no CORS in
// Node.js) and keeps OAuth2 credentials server-side (out of the browser bundle).
//
//   GET  /opensky/api/states/all?...   -> https://opensky-network.org/api/states/all?...
//   POST /opensky/token                -> https://auth.opensky-network.org/.../token
//
// Credentials are read from public/config.local.json (gitignored) at startup.
const OPENSKY_API = 'https://opensky-network.org/api';
const OPENSKY_TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

// ─── Config loading ──────────────────────────────────────────────────────────
// Loads public/config.json and public/config.local.json (the latter overrides the
// former). A *missing* file is fine (soft notice). A file that EXISTS but cannot
// be parsed is a real error: we highlight it LOUDLY and abort startup so a broken
// config is never silently ignored.
function fn_loadConfigFile(fileRelPath) {
  const absPath = path.join(__dirname, fileRelPath);
  let raw;
  try {
    raw = fs.readFileSync(absPath, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`[config] ${fileRelPath} not found (skipping)`);
      return {};
    }
    // Any other read error (permissions, I/O...) is loud.
    console.error('\n' + '='.repeat(79));
    console.error(' CONFIG ERROR  ::  could not read ' + fileRelPath);
    console.error(' path: ' + absPath);
    console.error(' error: ' + e.message);
    console.error('='.repeat(79) + '\n');
    throw e;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('\n' + '#'.repeat(79));
    console.error('########  CONFIG PARSE ERROR  ########################################################');
    console.error('##');
    console.error('##  file:   ' + fileRelPath);
    console.error('##  path:   ' + absPath);
    console.error('##  error:  ' + e.message);
    console.error('##');
    console.error('##  Fix the JSON syntax in this file and restart the server.');
    console.error('##  The server will NOT start while a config file is malformed.');
    console.error('#'.repeat(79) + '\n');
    throw e;
  }
  console.log(`[config] loaded ${fileRelPath} OK (${Object.keys(parsed).length} top-level key(s))`);
  return parsed;
}

let mergedConfig = {};
try {
  mergedConfig = Object.assign(
    {},
    fn_loadConfigFile('public/config.json'),
    fn_loadConfigFile('public/config.local.json')   // local overrides base
  );
} catch (e) {
  console.error('FATAL: aborting startup due to config error above.');
  process.exit(1);
}

let openskyCreds = { clientId: '', clientSecret: '' };
{
  const osc = (mergedConfig.CONST_ADSB_CONFIG && mergedConfig.CONST_ADSB_CONFIG.OPENSKY) || {};
  openskyCreds.clientId = osc.CLIENT_ID || '';
  openskyCreds.clientSecret = osc.CLIENT_SECRET || '';
  if (!openskyCreds.clientId || !openskyCreds.clientSecret) {
    console.log('[config] No OpenSky credentials found (anonymous mode)');
  } else {
    console.log('[config] OpenSky credentials loaded (authenticated mode)');
  }
}

function fn_forwardJson(proxyRes, res) {
  let body = '';
  proxyRes.on('data', (chunk) => { body += chunk; });
  proxyRes.on('end', () => {
    res.status(proxyRes.statusCode || 502)
       .set('Content-Type', proxyRes.headers['content-type'] || 'application/json')
       .send(body);
  });
}

// Proxy: OpenSky states API (GET)
app.get('/opensky/api/*', (req, res) => {
  const targetUrl = OPENSKY_API + req.url.replace('/opensky/api', '');
  const proxyReq = https.get(targetUrl, (proxyRes) => fn_forwardJson(proxyRes, res));
  proxyReq.on('error', (e) => res.status(502).json({ error: e.message }));
});

// Proxy: OpenSky OAuth2 token (POST, server-side only)
app.post('/opensky/token', express.urlencoded({ extended: false }), (req, res) => {
  const clientId = req.body.client_id || openskyCreds.clientId;
  const clientSecret = req.body.client_secret || openskyCreds.clientSecret;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'missing OpenSky credentials' });
  }
  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  const proxyReq = https.request(OPENSKY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, (proxyRes) => fn_forwardJson(proxyRes, res));
  proxyReq.on('error', (e) => res.status(502).json({ error: e.message }));
  proxyReq.write(payload);
  proxyReq.end();
});
// ─── end OpenSky proxy ───────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
