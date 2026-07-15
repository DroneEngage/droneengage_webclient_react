# WebConnector Guide

## Overview

The WebConnector is a standalone local WebSocket hub that bridges the DroneEngage cloud communication server with local web clients. It maintains a single upstream connection to the cloud while allowing multiple web client instances to connect and share that connection.

### Key Benefits

- **Single upstream connection** - Reduces cloud server load by sharing one connection across multiple browser tabs
- **Multi-client support** - Multiple browser tabs/instances can connect simultaneously
- **LAN support** - Can be accessed from other devices on your network
- **Bidirectional forwarding** - Messages flow both upstream (to cloud) and downstream (to clients)
- **Auto-reconnect** - Automatically reconnects to cloud server on disconnect
- **Security** - API key authentication + per-session token validation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Andruav Cloud Server                     │
│                  (comm server: wss://...)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Single upstream WS connection
                           │
                ┌──────────▼──────────┐
                │  WebConnector       │
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

## Installation Methods

### Method 1: npm Global Install (Recommended)

```bash
npm install -g droneengage-webconnector
droneengage-webconnector
```

### Method 2: npx (No Installation)

```bash
npx droneengage-webconnector email@domain.com accessCode
```

### Method 3: Quick Start Scripts

**Windows:**
```cmd
cd webconnector
start.bat
```

**macOS/Linux:**
```bash
cd webconnector
chmod +x start.sh
./start.sh
```

### Method 4: Local Development

```bash
cd webconnector
npm install
node src/index.js
```

## Configuration

### WebConnector Configuration

**File:** `webconnector/config.json`

```json
{
  "authPort": 9211,  // Port for local authentication server
  "wsPort": 9212,   // Port for local WebSocket server

  "cors": {
    "allowedOrigin": "http://localhost:3000"  // Use http:// for HTTP mode, https:// for HTTPS mode
  },

  "tls": {
    "certFile": "../ssl/localssl.crt",  // Path to TLS certificate file (NOT NEEDED for HTTP mode)
    "keyFile": "../ssl/localssl.key"    // Path to TLS private key file (NOT NEEDED for HTTP mode)
  },

  "cloud": {
    "authHost": "cloud.ardupilot.org",  // Cloud authentication server host
    "authPort": 19408,                   // Cloud authentication server port
    "authSecure": true,                  // Whether cloud auth uses HTTPS
    "wsSecure": true,                    // Whether cloud WebSocket uses WSS
    "commSecure": true,                  // Whether cloud communication uses HTTPS
    "insecureTls": true,                 // Allow insecure TLS (self-signed certs)
    "localOnlyMode": false               // Set to true to skip ALL cloud connections. For air-gapped envs, set to false and point authHost to local server (e.g., airgap.local)
  },

  "credentials": {
    "email": "your@email.com",           // User email for authentication
    "accessCode": "your-access-code",    // Access code/password for authentication
    "group": "1"                          // User group ID
  },

  "apiKey": "your-secure-api-key-here",           // API key for secure communication
  "pluginToken": "static-plugin-token-12345",     // Token for plugin authentication

  "reconnect": {
    "upstreamWsDelayMs": 2000             // Delay in milliseconds before reconnecting WebSocket
  }
}
```

### WebClient Configuration

**File:** `src/js/js_siteConfig.js`

```javascript
export let CONST_WEBCONNECTOR_CONFIG = {
    ENABLED: true,                        // Enable WebConnector mode
    AUTH_PORT: 9211,                      // Must match webconnector authPort
    WS_PORT: 9212,                        // Must match webconnector wsPort
    APIKEY: 'your-secure-api-key-here',   // Must match webconnector's apiKey
    TOKEN: 'static-plugin-token-12345',   // Must match webconnector's pluginToken
    AUTO_FALLBACK: false,                 // Auto fallback to cloud login when plugin is unreachable
    BASE_PATH: ''
};
```

## Security Keys Explained

### apiKey

**Purpose:** Authenticates HTTP requests to the local WebConnector

**Usage:**
- Required for HTTP endpoints like `/w/wl/` (auth endpoint)
- Checked via header `x-de-api-key` or query parameter `k=`
- If required and missing/invalid → 403 Forbidden

**When needed:**
- **Required:** When WebConnector is exposed on LAN (bindAddress: "0.0.0.0")
- **Optional:** For localhost-only (bindAddress: "127.0.0.1") - can leave empty

**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### pluginToken

**Purpose:** Authenticates WebSocket connections to the local WebConnector

**Usage:**
- Generated per WebConnector instance (static from config or random)
- Returned to web clients as `f` parameter in auth response
- Clients must include `f=<pluginToken>` in WebSocket URL
- If missing/invalid → connection closed with code 1008 (Forbidden)

**Always used:** Even for localhost connections

**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

## Key Configuration Requirements

**CRITICAL:** The following values must match exactly between WebConnector and WebClient:

| WebConnector (config.json) | WebClient (js_siteConfig.js) | Purpose |
|---------------------------|------------------------------|---------|
| `apiKey` | `APIKEY` | HTTP authentication |
| `pluginToken` | `TOKEN` | WebSocket authentication |
| `authPort` | `AUTH_PORT` | Auth server port |
| `wsPort` | `WS_PORT` | WebSocket port |

## Command Line Options

The WebConnector supports command line parameter overrides:

```bash
# Use config.json credentials
droneengage-webconnector

# Override credentials via command line
droneengage-webconnector your@email.com yourAccessCode

# Override cloud server settings (useful for air-gapped environments)
droneengage-webconnector --host airgap.local --port 19408 your@email.com yourAccessCode

# Using npx with credentials
npx droneengage-webconnector your@email.com yourAccessCode

# Using npx with cloud server override
npx droneengage-webconnector --host airgap.local --port 19408 your@email.com yourAccessCode
```

**Available options:**
- `--config <path>` - Override config file path
- `--host <authHost>` - Override cloud auth server host
- `--port <authPort>` - Override cloud auth server port
- `--help` / `-h` - Show usage information

## HTTP vs HTTPS Mode

### HTTP Mode (Simpler, no SSL certificates needed)

**WebConnector config:**
```json
{
  "cors": {
    "allowedOrigin": "http://localhost:3000"
  },
  "tls": {
    // Not needed for HTTP mode
  }
}
```

**WebClient config:**
```javascript
{
  CONST_WEBCONNECTOR_CONFIG: {
    // Uses HTTP automatically
  }
}
```

**Pros:** No SSL certificate management, simpler setup
**Cons:** Not suitable for production environments

### HTTPS Mode (More secure, requires SSL certificates)

**WebConnector config:**
```json
{
  "cors": {
    "allowedOrigin": "https://localhost:3000"
  },
  "tls": {
    "certFile": "../ssl/localssl.crt",
    "keyFile": "../ssl/localssl.key"
  }
}
```

**Pros:** Secure, suitable for production
**Cons:** Requires SSL certificate management

**Note:** If your WebClient is served over HTTPS but WebConnector runs over HTTP, browsers will block mixed-content. In this case, use a TLS terminator reverse proxy like Caddy.

## Air-Gapped Environments

For air-gapped or local-only environments:

1. **Set up local cloud server** (e.g., at `airgap.local:19408`)
2. **Configure WebConnector:**
   ```json
   {
     "cloud": {
       "authHost": "airgap.local",
       "authPort": 19408,
       "localOnlyMode": false  // Connect to local cloud server
     }
   }
   ```
3. **Run WebConnector:**
   ```bash
   droneengage-webconnector --host airgap.local --port 19408 email@domain.com accessCode
   ```

**Do NOT** set `localOnlyMode: true` for air-gapped environments - this skips ALL cloud connections. Instead, point `authHost` to your local cloud server.

## Authentication Flow

1. **WebClient calls WebConnector auth endpoint:**
   ```
   POST http://localhost:9211/w/wl/
   Headers: x-de-api-key: <apiKey>
   Body: { email, accessCode }
   ```

2. **WebConnector authenticates with cloud server:**
   ```
   POST https://cloud.ardupilot.org:19408/w/wl/
   Body: { email, accessCode }
   ```

3. **WebConnector returns session to WebClient:**
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

4. **WebClient connects to WebSocket:**
   ```
   ws://localhost:9212?f=<plugin-token>&s=<session>&at=g&k=<apiKey>
   ```

## Troubleshooting

### WebConnector won't start

**Error:** `EADDRINUSE`
```bash
# Find process using port
lsof -iTCP:9211 -sTCP:LISTEN -n -P
lsof -iTCP:9212 -sTCP:LISTEN -n -P

# Kill process
kill -9 <PID>
```

### WebClient can't connect

1. Check WebConnector is running: `curl http://localhost:9211/h/health`
2. Verify `apiKey` matches in both configs
3. Verify `pluginToken` matches in both configs
4. Check firewall allows ports 9211, 9212
5. Verify `CONST_WEBCONNECTOR_CONFIG.AUTH_HOST` is correct IP

### Upstream connection fails

1. Check `cloud.authHost` and `cloud.authPort` are correct
2. Verify credentials are valid
3. Check `localOnlyMode` is `false`
4. Review WebConnector logs for auth errors

### npm/npx Issues

1. **Permission denied:** Use `sudo npm install -g droneengage-webconnector`
2. **Command not found:** Check npm global path: `npm config get prefix`
3. **npx fails:** Ensure Node.js >=18.0.0: `node --version`

## Security Best Practices

1. **Use strong API keys and tokens** - Generate with crypto.randomBytes()
2. **Run behind a firewall** - Only expose necessary ports
3. **Use valid SSL certificates** in production environments
4. **Keep Node.js and dependencies updated**
5. **Run as non-root user** when possible
6. **Enable HTTPS/WSS only** - Disable HTTP/WS for production
7. **Use environment variables** for sensitive data when possible

## Performance

- **Latency:** ~1-5ms additional latency vs direct connection
- **Throughput:** Handles 100+ messages/sec per client
- **Clients:** Tested with 10+ simultaneous clients
- **Memory:** ~50MB base + ~5MB per client
