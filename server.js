const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();

const sslOptions = {
  //cert: fs.readFileSync(process.env.WEB_SSL_CRT),
  //key: fs.readFileSync(process.env.WEB_SSL_KEY),
  cert: fs.readFileSync("./ssl/localssl.crt"),
  key: fs.readFileSync("./ssl/localssl.key"),
};

https.createServer(sslOptions, app).listen(3000, () => {
  console.log('HTTPS server running on port 3000');
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

let openskyCreds = { clientId: '', clientSecret: '' };
try {
  const localCfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/config.local.json'), 'utf8'));
  const osc = (localCfg.CONST_ADSB_CONFIG && localCfg.CONST_ADSB_CONFIG.OPENSKY) || {};
  openskyCreds.clientId = osc.CLIENT_ID || '';
  openskyCreds.clientSecret = osc.CLIENT_SECRET || '';
} catch (e) {
  console.log('No OpenSky credentials found in config.local.json (anonymous mode)');
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
