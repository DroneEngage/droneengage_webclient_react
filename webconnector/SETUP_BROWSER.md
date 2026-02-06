# Browser Setup for WebSocket Connector

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

### Method 3: Local Development

```bash
cd webconnector
npm install
node src/index.js
```

## Problem

When the web client tries to connect to the connector at `https://127.0.0.1:9211`, the browser blocks the request with:

```
TypeError: Failed to fetch
```

This happens because the connector uses a **self-signed SSL certificate** that the browser doesn't trust.

## Solution: Accept the Self-Signed Certificate

### Step 1: Visit Plugin Health Endpoint

Open your browser and navigate to:

```
https://127.0.0.1:9211/h/health
```

### Step 2: Accept the Certificate Warning

You'll see a security warning like:

- **Chrome/Edge**: "Your connection is not private" → Click "Advanced" → "Proceed to 127.0.0.1 (unsafe)"
- **Firefox**: "Warning: Potential Security Risk Ahead" → Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: "This Connection Is Not Private" → Click "Show Details" → "visit this website"

### Step 3: Verify Response

After accepting the certificate, you should see:

```json
{"e":403,"em":"Forbidden"}
```

This is **expected** - it means the connector is accessible but requires an API key (which the browser doesn't send).

### Step 4: Test Web Client Connection

Now reload your web client and try connecting again. The browser will now allow the HTTPS connection to the plugin.

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

## For LAN Access

If accessing the connector from another device on your network (e.g., `https://192.168.1.100:9211`):

1. Update `public/config.json`:
   ```json
   "CONST_WS_PLUGIN_AUTH_HOST": "192.168.1.100"
   ```

2. Visit `https://192.168.1.100:9211/h/health` in your browser

3. Accept the certificate warning for that IP address

4. Reload the web client

## Alternative: Use Production Certificates

For production use, replace the self-signed certificates with proper SSL certificates:

1. Obtain certificates from Let's Encrypt or your CA
2. Update `webconnector/config.json`:
   ```json
   "tls": {
     "certFile": "/path/to/fullchain.pem",
     "keyFile": "/path/to/privkey.pem"
   }
   ```

## Troubleshooting

### Still getting "Failed to fetch"?

1. **Check connector is running**:
   ```bash
   curl -k https://127.0.0.1:9211/h/health
   ```
   Should return: `{"e":403,"em":"Forbidden"}`

2. **Check browser console** for specific error:
   - `ERR_CERT_AUTHORITY_INVALID` → Need to accept certificate
   - `ERR_CONNECTION_REFUSED` → Connector not running
   - `CORS error` → Connector CORS headers issue (shouldn't happen)

3. **Clear browser cache** and try accepting certificate again

4. **Try incognito/private mode** to rule out extension interference

### Certificate keeps getting rejected?

The certificate might have expired or be invalid. Regenerate it:

```bash
cd webconnector
rm -rf ssl/
../local/sh_make_ssl.sh
# Restart connector
droneengage-webconnector
```

Then accept the new certificate in your browser.

### npm/npx Issues

1. **Permission denied**: Use `sudo npm install -g droneengage-webconnector`
2. **Command not found**: Check npm global path: `npm config get prefix`
3. **npx fails**: Ensure Node.js >=16.0.0: `node --version`
