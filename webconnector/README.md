# DroneEngage WebSocket Connector

## Overview

The WebSocket Connector implements **a standalone local WebSocket hub** that maintains a single upstream connection to the Andruav cloud communication server while allowing multiple web client instances to connect and share that connection.

If your WebClient UI is served over **HTTPS** (for example `https://localhost:3000`), and you want the local connector to run without TLS (`http://` + `ws://`), you must use a TLS terminator reverse proxy to avoid browser mixed-content blocking. See [README_CADDY.md](README_CADDY.md).

## Installation Methods

### Method 1: npm Global Install (Recommended)

```bash
npm install -g droneengage-webconnector
droneengage-webconnector
```

To run with the Caddy reverse proxy (one command):

```bash
sudo droneengage-webconnector-install-caddy
droneengage-webconnector-stack
```

### Method 2: npx (No Installation)

```bash
npx droneengage-webconnector email@domain.com accessCode
```

### Method 3: Local Development

```bash
cd webconnector
npm install
node src/index.js
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Andruav Cloud Server                     │
│                  (comm server: wss://...)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Single upstream WS connection
                           │
                ┌──────────▼──────────┐
                │  WebSocket Connector│
                │  (Node.js process)  │
                │  - Auth: :9211      │
                │  - WSS:  :9212      │
                └──────────┬──────────┘
                           │ Broadcasts to all clients
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │ Browser 1 │    │ Browser 2 │    │ Browser N │
    │  (Tab 1)  │    │  (Tab 2)  │    │  (Tab N)  │
    └───────────┘    └───────────┘    └───────────┘
```

## Features

✅ **Single upstream connection** - Only one connection to cloud server regardless of client count
✅ **Multi-client support** - Multiple browser tabs/instances can connect simultaneously
✅ **Bidirectional forwarding** - Messages flow both upstream and downstream
✅ **Auto-reconnect** - Automatically reconnects to cloud server on disconnect
✅ **LAN support** - Can be accessed from other devices on the network
✅ **Security** - API key authentication + per-session token validation
✅ **Shared party ID** - All clients can share the same party ID across tabs
✅ **Easy installation** - Available via npm and npx
✅ **Command line support** - Override credentials via command line arguments

## Configuration

### Connector Configuration (`webconnector/config.json`)

```json
{
  "bindAddress": "0.0.0.0",          // "0.0.0.0" for LAN, "127.0.0.1" for localhost only
  "authPort": 9211,                   // HTTPS auth endpoint port
  "wsPort": 9212,                     // WSS communication port
  
  "tls": {
    "certFile": "../ssl/localssl.crt",
    "keyFile": "../ssl/localssl.key"
  },
  
  "cloud": {
    "authHost": "127.0.0.1",         // Cloud auth server host
    "authPort": 19408,                // Cloud auth server port
    "authSecure": true,               // Use HTTPS for auth
    "wsSecure": true,                 // Use WSS for comm
    "commSecure": true,               // Use WSS for upstream comm
    "insecureTls": true,              // Allow self-signed certs
    "localOnlyMode": false            // false = connect to cloud, true = local only
  },
  
  "credentials": {
    "email": "your@email.com",
    "accessCode": "your-access-code",
    "group": "1"
  },
  
  "apiKey": "your-secure-api-key-here",  // Required for LAN access
  "pluginToken": "static-plugin-token-12345",
  "reconnect": {
    "upstreamWsDelayMs": 2000
  }
}
```

### Web Client Configuration (`public/config.json`)

```json
{
  "CONST_WS_PLUGIN_ENABLED": true,
  "CONST_WS_PLUGIN_AUTH_HOST": "192.168.1.100",  // Plugin server IP (LAN) or "localhost"
  "CONST_WS_PLUGIN_AUTH_PORT": 9211,
  "CONST_WS_PLUGIN_WS_PORT": 9212,
  "CONST_WS_PLUGIN_APIKEY": "your-secure-api-key-here",  // Must match plugin apiKey
  "CONST_WS_PLUGIN_TOKEN": "static-plugin-token-12345",   // Must match plugin pluginToken
  "CONST_WS_PLUGIN_AUTO_FALLBACK": false
}
```

## Setup Instructions

### Quick Start (npm)

```bash
# Install globally
npm install -g droneengage-webconnector

# Start with config.json credentials
droneengage-webconnector

# Or override credentials
droneengage-webconnector your@email.com yourAccessCode
```

### Quick Start (npx)

```bash
# Run without installation
npx droneengage-webconnector your@email.com yourAccessCode
```

### Local Development Setup

#### 1. Generate SSL Certificates

```bash
cd webconnector
../local/sh_make_ssl.sh
```

This creates self-signed certificates in `ssl/` directory.

#### 2. Configure Plugin

Edit `webconnector/config.json`:
- Set `bindAddress` to `"0.0.0.0"` for LAN access
- Set `apiKey` to a secure random string
- Set `pluginToken` to a secure random string
- Set `localOnlyMode` to `false` to enable cloud connection
- Update `credentials` with your Andruav account

#### 3. Configure Web Client

Edit `public/config.json`:
- Set `CONST_WS_PLUGIN_ENABLED` to `true`
- Set `CONST_WS_PLUGIN_AUTH_HOST` to plugin server IP
- Set `CONST_WS_PLUGIN_APIKEY` to match plugin's `apiKey`
- Set `CONST_WS_PLUGIN_TOKEN` to match plugin's `pluginToken`

#### 4. Start Plugin

```bash
cd webconnector
node src/index.js
```

Expected output:
```
=================================================
DroneEngage WebClient Connector ver: 0.1.0
=================================================
Usage:
  droneengage-webconnector                    # Use config.json credentials
  droneengage-webconnector <email> <accessCode> # Override credentials
  npx droneengage-webconnector <email> <accessCode> # Run without installation
=================================================

webconnector HTTPS listening on https://0.0.0.0:9211
webconnector WSS listening on wss://0.0.0.0:9212
[webconnector] cloud login OK
[webconnector] upstream ws open
```

#### 5. Open Web Clients

Open multiple browser tabs/windows pointing to your web client. Each will:
1. Connect to plugin auth endpoint (port 9211)
2. Receive plugin session + WSS connection details
3. Connect to plugin WSS endpoint (port 9212)
4. Share the single upstream connection

## Command Line Options

The connector supports command line credential overrides:

```bash
# Use config.json credentials
droneengage-webconnector

# Override credentials via command line
droneengage-webconnector your@email.com yourAccessCode

# Using npx with credentials
npx droneengage-webconnector your@email.com yourAccessCode
```

## Security Considerations

### For LAN Access

1. **API Key Required**: Set a strong `apiKey` in `config.json`
   ```bash
   # Generate random API key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Plugin Token Required**: Set a strong `pluginToken` in `config.json`
   ```bash
   # Generate random plugin token
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```

3. **Firewall Rules**: Only allow trusted devices on your LAN
   ```bash
   # Example: Allow only specific subnet
   sudo ufw allow from 192.168.1.0/24 to any port 9211
   sudo ufw allow from 192.168.1.0/24 to any port 9212
   ```

4. **HTTPS/WSS Only**: Plugin enforces TLS for all connections

### For Localhost Only

Set `bindAddress` to `"127.0.0.1"` and leave `apiKey` empty.

## Message Flow

### Upstream (Cloud → Clients)

1. Cloud server sends message to plugin
2. Plugin receives on upstream WebSocket
3. Plugin broadcasts to all connected clients
4. Each client processes message independently

### Downstream (Clients → Cloud)

1. Any client sends message to plugin
2. Plugin receives on client WebSocket
3. Plugin forwards to upstream WebSocket
4. Cloud server receives single message

## Troubleshooting

### Connector won't start

**Error**: `EADDRINUSE`
```bash
# Find process using port
lsof -iTCP:9211 -sTCP:LISTEN -n -P
lsof -iTCP:9212 -sTCP:LISTEN -n -P

# Kill process
kill -9 <PID>
```

### Web client can't connect

1. Check connector is running: `curl -k https://localhost:9211/h/health`
2. Verify `apiKey` matches in both configs
3. Verify `pluginToken` matches in both configs
4. Check firewall allows ports 9211, 9212
5. Verify `CONST_WS_PLUGIN_AUTH_HOST` is correct IP

### Upstream connection fails

1. Check `cloud.authHost` and `cloud.authPort` are correct
2. Verify credentials are valid
3. Check `localOnlyMode` is `false`
4. Review connector logs for auth errors

### npm/npx Issues

1. **Permission denied**: Use `sudo npm install -g droneengage-webconnector`
2. **Command not found**: Check npm global path: `npm config get prefix`
3. **npx fails**: Ensure Node.js >=16.0.0: `node --version`

## Testing Multi-Client Scenario

```bash
# Terminal 1: Start connector
droneengage-webconnector

# Terminal 2: Start web client dev server
cd ..
npm start

# Browser: Open multiple tabs
# - http://localhost:3000 (Tab 1)
# - http://localhost:3000 (Tab 2)
# - http://localhost:3000 (Tab 3)

# All tabs should show same telemetry
# Connector logs should show:
# [webconnector] wss client connected { clients: 1 }
# [webconnector] wss client connected { clients: 2 }
# [webconnector] wss client connected { clients: 3 }
```

## Protocol Details

### Authentication Flow

1. Web client calls `https://<plugin>:9211/w/wl/`
2. Plugin returns:
   ```json
   {
     "e": 0,
     "sid": "<session-id>",
     "cs": {
       "g": "<plugin-host>",
       "h": 9212,
       "f": "<plugin-token>"
     },
     "plugin_party_id": "<plugin-party-id>",
     "per": "D1G1T3R4V5C6",
     "prm": 4294967295
   }
   ```
3. Web client connects to `wss://<plugin>:9212?f=<token>&s=<session>&at=g&k=<apikey>`

### Message Format

Plugin forwards messages **verbatim** between upstream and clients:

- **Text frames**: JSON strings (e.g., `{"ty":"c","sd":"...","mt":1234,...}`)
- **Binary frames**: ArrayBuffer with JSON header + binary payload

No message transformation occurs - plugin is transparent relay.

## Performance

- **Latency**: ~1-5ms additional latency vs direct connection
- **Throughput**: Handles 100+ messages/sec per client
- **Clients**: Tested with 10+ simultaneous clients
- **Memory**: ~50MB base + ~5MB per client

## Advanced Configuration

### Custom Ports

```json
{
  "authPort": 19211,  // Custom auth port
  "wsPort": 19212     // Custom WSS port
}
```

Update web client config to match.

### Reconnect Tuning

```json
{
  "reconnect": {
    "upstreamWsDelayMs": 5000  // Wait 5s before reconnecting
  }
}
```

### Shared Party ID

Connector generates a single party ID for its upstream connection and returns it to WebClient as `plugin_party_id`.
All WebClients connecting through the same connector instance will therefore share the same party identity.

## Browser Certificate Setup

When accessing the connector via browser, you'll need to accept the self-signed SSL certificate:

1. Visit `https://127.0.0.1:9211/h/health`
2. Accept the certificate warning
3. Reload your web client

For detailed instructions, see [SETUP_BROWSER.md](SETUP_BROWSER.md).
