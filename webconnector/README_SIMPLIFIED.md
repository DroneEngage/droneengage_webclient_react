# Simplified WebSocket Connector - Direct Connection

## Overview

The web client now connects **directly to the connector's WebSocket server** without requiring an authentication step. This simplifies the architecture and eliminates SSL certificate issues with the auth endpoint.

## How It Works

### Old Flow (Removed)
```
Web Client → HTTPS Auth (9211) → Get Token → WSS Connect (9212)
            ❌ SSL cert issues
```

### New Flow (Simplified)
```
Web Client → Direct WSS Connect (9212) with static token
            ✅ No auth endpoint needed
```

## Configuration

### Connector Configuration (`webconnector/config.json`)

```json
{
  "bindAddress": "0.0.0.0",
  "wsPort": 9212,
  "apiKey": "your-secure-api-key-here",
  "pluginToken": "static-plugin-token-12345",
  
  "cloud": {
    "authHost": "127.0.0.1",
    "authPort": 19408,
    "authSecure": true,
    "wsSecure": true,
    "commSecure": true,
    "insecureTls": true,
    "localOnlyMode": false
  },
  
  "credentials": {
    "email": "your@email.com",
    "accessCode": "your-password",
    "group": "1"
  }
}
```

**Important**: `pluginToken` must match between plugin and web client configs.

### Web Client Configuration (`public/config.json`)

```json
{
  "CONST_WS_PLUGIN_ENABLED": true,
  "CONST_WS_PLUGIN_AUTH_HOST": "127.0.0.1",
  "CONST_WS_PLUGIN_WS_PORT": 9212,
  "CONST_WS_PLUGIN_APIKEY": "your-secure-api-key-here",
  "CONST_WS_PLUGIN_TOKEN": "static-plugin-token-12345"
}
```

**Note**: `CONST_WS_PLUGIN_AUTH_HOST` is still used to determine the WSS host, but no auth endpoint is called.

## Setup Instructions

### 1. Configure Plugin

Edit `webconnector/config.json`:
- Set `pluginToken` to a secure random string
- Set `apiKey` for WSS query parameter authentication
- Configure cloud credentials for upstream connection

### 2. Configure Web Client

Edit `public/config.json`:
- Set `CONST_WS_PLUGIN_TOKEN` to **match** plugin's `pluginToken`
- Set `CONST_WS_PLUGIN_APIKEY` to **match** plugin's `apiKey`
- Set `CONST_WS_PLUGIN_ENABLED` to `true`

### 3. Start Plugin

```bash
cd webconnector
node src/index.js
```

Expected output:
```
webconnector HTTPS listening on https://0.0.0.0:9211
webconnector WSS listening on wss://0.0.0.0:9212
[webconnector] cloud login OK
[webconnector] upstream ws open
```

### 4. Start Web Client

```bash
npm start
```

### 5. Connect

1. Open browser to `http://localhost:3000`
2. Check "Use WebPlugin" checkbox (or leave checked if default)
3. Enter any credentials (not validated in plugin mode)
4. Click Connect

Browser console should show:
```
[WebPlugin] plugin mode - connecting directly to plugin WSS
[WebPlugin] direct connection configured
[WS] connect { usePlugin: true, isPluginTarget: true, ... }
[WS] open
```

## WebSocket URL Format

The web client connects to:
```
wss://127.0.0.1:9212?f=<pluginToken>&s=<sessionId>&at=g&k=<apiKey>
```

Where:
- `f` = Plugin token (from `CONST_WS_PLUGIN_TOKEN`)
- `s` = Session ID (generated locally or from shared unit ID)
- `at` = Account type (`g` for GCS)
- `k` = API key (from `CONST_WS_PLUGIN_APIKEY`)

## Security

### Token Generation

Generate secure random tokens:
```bash
# Plugin token
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

# API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### For LAN Access

1. **Update both configs** with the same tokens
2. **Set plugin bindAddress** to `0.0.0.0`
3. **Update web client** `CONST_WS_PLUGIN_AUTH_HOST` to plugin server IP
4. **Use firewall rules** to restrict access:
   ```bash
   sudo ufw allow from 192.168.1.0/24 to any port 9212
   ```

## Advantages Over Previous Approach

✅ **No SSL certificate issues** - Browser doesn't need to trust auth endpoint cert
✅ **Simpler flow** - One connection instead of auth + WSS
✅ **Faster connection** - No health probe or auth request delay
✅ **Fewer failure points** - Auth endpoint can't fail
✅ **Same security** - Static token + API key validation on WSS

## Multi-Client Support

Multiple browser tabs/instances can connect simultaneously:
- Each generates its own session ID (or shares via `localStorage`)
- All connect to same plugin WSS endpoint
- Plugin maintains single upstream connection
- Messages broadcast to all connected clients

## Troubleshooting

### "WebSocket connection failed"

1. **Check plugin is running**:
   ```bash
   lsof -iTCP:9212 -sTCP:LISTEN
   ```

2. **Check tokens match**:
   - `webconnector/config.json` → `pluginToken`
   - `public/config.json` → `CONST_WS_PLUGIN_TOKEN`

3. **Check API key matches**:
   - `webconnector/config.json` → `apiKey`
   - `public/config.json` → `CONST_WS_PLUGIN_APIKEY`

4. **Check browser console** for connection URL (tokens redacted)

### Plugin rejects connection

Check connector logs for:
```
[webconnector] wss forbidden (apiKey)
[webconnector] wss forbidden (token)
```

This means the `k=` or `f=` parameters don't match config.

### Still getting SSL errors?

The simplified flow **should not** have SSL errors since it only uses WSS (not HTTPS auth).

If you see SSL errors on WSS connection, your browser needs to trust the certificate:
1. Visit `https://127.0.0.1:9212` (will fail, that's OK)
2. Accept the certificate warning
3. Reload web client

## Migration from Old Approach

If you were using the auth endpoint approach:

1. ✅ Remove `#loginViaPlugin()` calls (already done)
2. ✅ Add `pluginToken` to plugin config
3. ✅ Add `CONST_WS_PLUGIN_TOKEN` to web client config
4. ✅ Ensure both tokens match
5. ✅ Restart plugin and web client

The auth endpoint (port 9211) is still running but **not used** by web clients in simplified mode.
