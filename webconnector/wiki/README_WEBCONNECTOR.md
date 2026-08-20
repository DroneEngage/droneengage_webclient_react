# DroneEngage WebSocket Connector

## Overview

The WebSocket Connector implements **a standalone local WebSocket hub** that maintains a single upstream connection to the Andruav cloud communication server while allowing multiple web client instances to connect and share that connection.

It also includes a **MAVLink hub** that extracts raw MAVLink frames from Andruav binary messages and exposes them on a separate WebSocket port, so tools like Mavlink3DMap2 can consume telemetry directly without needing a separate ws2ws bridge process or a running browser tab.

If your WebClient UI is served over **HTTPS** (for example `https://localhost:3000`), and the connector runs locally as `http://` + `ws://`, the browser will block the connection (mixed-content). The recommended solution is to use a local reverse proxy (Caddy) that provides `https://` and `wss://` and proxies to the connector. See [README_CADDY.md](README_CADDY.md).

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
│                    Andruav Cloud Server                      │
│                  (comm server: wss://...)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ Single upstream WS connection
                           │
                ┌──────────▼──────────────────────┐
                │       WebSocket Connector         │
                │       (Node.js process)           │
                │                                   │
                │  ┌─────────┐  ┌────────────────┐  │
                │  │ Auth API│  │ Andruav Relay  │  │
                │  │ HTTP    │  │ WS  :9212      │  │
                │  │ :9211   │  │ (to cloud)     │  │
                │  └─────────┘  └───────┬────────┘  │
                │                       │           │
                │  ┌────────────────────▼────────┐  │
                │  │ MAVLink Extraction           │  │
                │  │ (mt=6502 → raw MAVLink)      │  │
                │  └────────────┬────────────────┘  │
                │               │                   │
                │  ┌────────────▼────────────────┐  │
                │  │ MAVLink Hub WS :8811         │  │
                │  └────────────┬────────────────┘  │
                └───────────────┼───────────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
     ┌─────▼─────┐       ┌──────▼──────┐      ┌──────▼──────┐
     │ Browser 1 │       │ Browser 2   │      │ Mavlink3DMap2│
     │ (Tab 1)   │       │ (Tab 2)     │      │ 3D map UI    │
     │ → :9212   │       │ → :9212     │      │ → :8811      │
     └───────────┘       └─────────────┘      └──────────────┘
```

### Data paths

| Path | Port | Direction | Payload |
|---|---|---|---|
| Auth API | 9211 (HTTP) | WebClient → Connector | Login request/response |
| Andruav relay | 9212 (WS) | Bidirectional | Andruav protocol (JSON + binary) |
| MAVLink hub | 8811 (WS) | Connector → consumers | Raw MAVLink v2 binary frames |

The Andruav relay (:9212) carries full Andruav protocol frames to/from browser tabs.
The MAVLink hub (:8811) carries only extracted raw MAVLink — the connector parses
Andruav binary frames (message type 6502), strips the JSON header, and forwards
the MAVLink payload. This lets Mavlink3DMap2 receive telemetry directly from the
connector without a browser tab being open and without a separate ws2ws bridge.

## Features

✅ **Single upstream connection** - Only one connection to cloud server regardless of client count
✅ **Multi-client support** - Multiple browser tabs/instances can connect simultaneously
✅ **MAVLink hub** - Extracts raw MAVLink from Andruav frames and serves on :8811 for tools like Mavlink3DMap2
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
  "mavlinkHubPort": 8811,             // Raw MAVLink hub port (Mavlink3DMap2 connects here)
  
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
  "CONST_WEBCONNECTOR_CONFIG": {
    "ENABLED": true,
    "AUTH_HOST": "192.168.1.100",  // Plugin server IP (LAN) or "localhost"
    "AUTH_PORT": 9211,
    "WS_PORT": 9212,
    "APIKEY": "your-secure-api-key-here",  // Must match plugin apiKey
    "TOKEN": "static-plugin-token-12345",   // Must match plugin pluginToken
    "AUTO_FALLBACK": false
  }
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
- Set `CONST_WEBCONNECTOR_CONFIG.ENABLED` to `true`
- Set `CONST_WEBCONNECTOR_CONFIG.AUTH_HOST` to plugin server IP
- Set `CONST_WEBCONNECTOR_CONFIG.APIKEY` to match plugin's `apiKey`
- Set `CONST_WEBCONNECTOR_CONFIG.TOKEN` to match plugin's `pluginToken`

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
webconnector MAVLink hub listening on ws://127.0.0.1:8811
[webconnector] cloud login OK
[webconnector] upstream ws open
```

#### 5. Open Web Clients

Open multiple browser tabs/windows pointing to your web client. Each will:
1. Connect to plugin auth endpoint (port 9211)
2. Receive plugin session + WSS connection details
3. Connect to plugin WSS endpoint (port 9212)
4. Share the single upstream connection

#### 6. (Optional) Connect Mavlink3DMap2

Mavlink3DMap2's frontend connects directly to the MAVLink hub on `ws://127.0.0.1:8811`.
No additional bridge process is needed — the connector extracts MAVLink from
Andruav frames and serves raw MAVLink on port 8811. Simply open the Mavlink3DMap2
web UI and it will receive telemetry as long as the connector is running.

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
   sudo ufw allow from 192.168.1.0/24 to any port 8811
   ```

4. **HTTPS/WSS Only**: Plugin enforces TLS for all connections

### For Localhost Only

Set `bindAddress` to `"127.0.0.1"` and leave `apiKey` empty.

## Message Flow

### Upstream (Cloud → Clients)

1. Cloud server sends message to plugin
2. Plugin receives on upstream WebSocket
3. Plugin broadcasts to all connected clients on :9212
4. Each client processes message independently
5. If the frame is an Andruav binary message with `mt=6502` (MAVLink),
   the connector also extracts the raw MAVLink payload and broadcasts it
   to all MAVLink hub clients on :8811

### Downstream (Clients → Cloud)

1. Any client sends message to plugin
2. Plugin receives on client WebSocket (:9212)
3. Plugin forwards to upstream WebSocket
4. Cloud server receives single message

### MAVLink Hub (Connector → Mavlink3DMap2)

1. Cloud sends an Andruav binary frame containing MAVLink (`mt=6502`)
2. Connector parses the frame: `[JSON header][0x00][raw MAVLink bytes]`
3. Connector extracts the bytes after the null terminator
4. Connector broadcasts the raw MAVLink ArrayBuffer to all :8811 clients
5. Mavlink3DMap2 parses the MAVLink and updates the 3D scene

The MAVLink hub is read-only from the cloud's perspective — it does not
send data back upstream. However, hub clients can send MAVLink to each
other (e.g. a SITL/UDP publisher can feed MAVLink to other hub consumers).

## Troubleshooting

### Connector won't start

**Error**: `EADDRINUSE`
```bash
# Find process using port
lsof -iTCP:9211 -sTCP:LISTEN -n -P
lsof -iTCP:9212 -sTCP:LISTEN -n -P
lsof -iTCP:8811 -sTCP:LISTEN -n -P

# Kill process
kill -9 <PID>
```

### Web client can't connect

1. Check connector is running: `curl -k https://localhost:9211/h/health`
2. Verify `apiKey` matches in both configs
3. Verify `pluginToken` matches in both configs
4. Check firewall allows ports 9211, 9212
5. Verify `CONST_WEBCONNECTOR_CONFIG.AUTH_HOST` is correct IP

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

The connector forwards Andruav protocol messages **verbatim** between upstream and clients on :9212:

- **Text frames**: JSON strings (e.g., `{"ty":"c","sd":"...","mt":1234,...}`)
- **Binary frames**: ArrayBuffer with JSON header + binary payload

No message transformation occurs on the :9212 relay — it is a transparent relay.

For the MAVLink hub (:8811), the connector performs lightweight extraction:
binary frames with `mt=6502` are parsed as `[JSON header][0x00][MAVLink payload]`
and only the raw MAVLink payload is forwarded to :8811 clients.

## Performance

- **Latency**: ~1-5ms additional latency vs direct connection
- **Throughput**: Handles 100+ messages/sec per client
- **Clients**: Tested with 10+ simultaneous clients
- **Memory**: ~50MB base + ~5MB per client

## Advanced Configuration

### Custom Ports

```json
{
  "authPort": 19211,       // Custom auth port
  "wsPort": 19212,         // Custom WSS port
  "mavlinkHubPort": 18811  // Custom MAVLink hub port
}
```

Update web client config to match the auth/WSS ports. If you change the
MAVLink hub port, update Mavlink3DMap2's frontend WebSocket URL accordingly.

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
