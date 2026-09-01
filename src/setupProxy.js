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
// A *missing* file is fine (anonymous mode). A file that EXISTS but is malformed
// is a real error: highlight it LOUDLY and abort so a broken config is never
// silently ignored.
let openskyCreds = { clientId: '', clientSecret: '' };
{
  const cfgPath = path.join(__dirname, '..', 'public', 'config.local.json');
  let raw;
  try {
    raw = fs.readFileSync(cfgPath, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('[setupProxy] config.local.json not found (anonymous mode)');
    } else {
      console.error('\n' + '='.repeat(79));
      console.error(' CONFIG ERROR  ::  could not read config.local.json');
      console.error(' path: ' + cfgPath);
      console.error(' error: ' + e.message);
      console.error('='.repeat(79) + '\n');
      console.error('FATAL: [setupProxy] aborting startup due to config error above.');
      process.exit(1);
    }
  }
  if (raw !== undefined) {
    let localCfg;
    try {
      localCfg = JSON.parse(raw);
    } catch (e) {
      console.error('\n' + '#'.repeat(79));
      console.error('########  CONFIG PARSE ERROR  ########################################################');
      console.error('##');
      console.error('##  file:  config.local.json');
      console.error('##  path:  ' + cfgPath);
      console.error('##  error: ' + e.message);
      console.error('##');
      console.error('##  Fix the JSON syntax in this file and restart the dev server.');
      console.error('#'.repeat(79) + '\n');
      console.error('FATAL: [setupProxy] aborting startup due to config error above.');
      process.exit(1);
    }
    const osc = (localCfg.CONST_ADSB_CONFIG && localCfg.CONST_ADSB_CONFIG.OPENSKY) || {};
    openskyCreds.clientId = osc.CLIENT_ID || '';
    openskyCreds.clientSecret = osc.CLIENT_SECRET || '';
    console.log('[setupProxy] config.local.json loaded OK' +
      (openskyCreds.clientId ? ' (authenticated mode)' : ' (anonymous mode)'));
  }
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
