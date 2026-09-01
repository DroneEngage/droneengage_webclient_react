/**
 * CRA dev-server proxy setup.
 *
 * OpenSky's API does not send CORS headers for third-party origins, so browser
 * fetch() is blocked. This registers proxy middleware on the CRA dev server
 * (npm start) that forwards OpenSky requests server-side. The same proxy exists
 * in server.js for production builds.
 *
 *   GET  /opensky/api/*   -> https://opensky-network.org/api/*
 *   POST /opensky/token   -> https://auth.opensky-network.org/.../token
 *
 * OAuth2 credentials are injected server-side from public/config.local.json
 * (gitignored) so they never reach the browser bundle.
 */

const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Read OpenSky credentials from config.local.json (gitignored).
let openskyCreds = { clientId: '', clientSecret: '' };
try {
  const localCfg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'public', 'config.local.json'), 'utf8')
  );
  const osc = (localCfg.CONST_ADSB_CONFIG && localCfg.CONST_ADSB_CONFIG.OPENSKY) || {};
  openskyCreds.clientId = osc.CLIENT_ID || '';
  openskyCreds.clientSecret = osc.CLIENT_SECRET || '';
} catch (e) {
  console.log('[setupProxy] No OpenSky credentials found (anonymous mode)');
}

module.exports = function (app) {
  // Proxy: OpenSky states API (GET) — straight passthrough.
  app.use(
    '/opensky/api',
    createProxyMiddleware({
      target: 'https://opensky-network.org',
      changeOrigin: true,
      pathRewrite: { '^/opensky/api': '/api' },
      secure: false,
    })
  );

  // Proxy: OpenSky OAuth2 token (POST) — inject credentials server-side.
  // The browser sends an empty grant_type body; we add client_id/secret here.
  app.post('/opensky/token', (req, res) => {
    const https = require('https');
    const tokenUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
    const clientId = openskyCreds.clientId;
    const clientSecret = openskyCreds.clientSecret;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'missing OpenSky credentials in config.local.json' });
    }
    const payload = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString();

    const proxyReq = https.request(
      tokenUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (proxyRes) => {
        let body = '';
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
          res.status(proxyRes.statusCode || 502)
             .set('Content-Type', proxyRes.headers['content-type'] || 'application/json')
             .send(body);
        });
      }
    );
    proxyReq.on('error', (e) => res.status(502).json({ error: e.message }));
    proxyReq.write(payload);
    proxyReq.end();
  });
};
