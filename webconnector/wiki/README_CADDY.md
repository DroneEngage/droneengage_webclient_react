# WebConnector + Caddy Reverse Proxy (Local HTTPS/WSS)

## Why Caddy is needed

When the WebClient UI is served over **HTTPS** (for example `https://localhost:3000`), the browser will block calls to insecure endpoints such as:

- `http://127.0.0.1:9211/...`
- `ws://127.0.0.1:9212/...`

This is enforced by the browser as **mixed-content blocking**.

Caddy solves this by:

- Terminating TLS locally on `https://localhost:9443` and `wss://localhost:9443`
- Reverse-proxying HTTPS -> the WebConnector **HTTP** API (`127.0.0.1:9211`)
- Reverse-proxying WSS -> the WebConnector **WS** server (`127.0.0.1:9212`)

This lets the WebConnector run locally without TLS while the browser still uses secure connections.

## Ports and paths

- WebConnector local API: `http://127.0.0.1:9211`
- WebConnector local WS: `ws://127.0.0.1:9212`
- Caddy public API: `https://localhost:9443/api` -> `http://127.0.0.1:9211`
- Caddy public WS: `wss://localhost:9443` -> `ws://127.0.0.1:9212`

## Files

- WebConnector config:
  - `~/.droneengage/webconnector/config.json`
- Caddy config:
  - `~/.droneengage/webconnector/Caddyfile.localplugin`

On first run, the CLI will copy defaults to the folder above if they are missing.

### Environment Variables

You can override default paths using these environment variables:

- `DE_WEBCONNECTOR_HOME`: Base directory (default: `~/.droneengage/webconnector`)
- `DE_WEBCONNECTOR_CONFIG`: Path to WebConnector config
- `DE_WEBCONNECTOR_CADDYFILE`: Path to Caddyfile

### CLI Options

All CLI commands support these options:

- `--home <path>`: Set home directory (overrides `DE_WEBCONNECTOR_HOME`)
- `--config <path>`: Path to WebConnector config file
- `--caddyfile <path>`: Path to Caddyfile

## Caddyfile template

This project ships with `Caddyfile.localplugin`:

```caddy
{
    auto_https disable_redirects
}

localhost:9443 {
    handle_path /api/* {
        reverse_proxy localhost:9211
    }

    reverse_proxy localhost:9212
}
```

## Install (Linux)

### Install the npm package

```bash
sudo npm i -g droneengage-webconnector
```

### Install Caddy (and disable system service)

```bash
sudo droneengage-webconnector-install-caddy
```

## Run

### Simple mode (one command)

Starts both WebConnector + Caddy:

```bash
droneengage-webconnector-stack
```

### Advanced mode (two commands)

Terminal 1:

```bash
droneengage-webconnector --config ~/.droneengage/webconnector/config.json
```

Terminal 2:

```bash
droneengage-webconnector-caddy --caddyfile ~/.droneengage/webconnector/Caddyfile.localplugin
```

### Custom configuration

Use custom paths:

```bash
droneengage-webconnector-stack --config /path/to/config.json --caddyfile /path/to/Caddyfile
```

Or with environment variables:

```bash
export DE_WEBCONNECTOR_HOME=/custom/webconnector/path
droneengage-webconnector-stack
```

## WebClient runtime configuration

In the WebClient `public/config.json`:

- `CONST_WEBCONNECTOR_CONFIG.AUTH_HOST`: `localhost`
- `CONST_WEBCONNECTOR_CONFIG.AUTH_PORT`: `9443`
- `CONST_WEBCONNECTOR_CONFIG.WS_PORT`: `9443`
- `CONST_WEBCONNECTOR_CONFIG.SECURE`: `true`
- `CONST_WEBCONNECTOR_CONFIG.BASE_PATH`: `/api`

`CONST_WEBCONNECTOR_CONFIG.APIKEY` and `CONST_WEBCONNECTOR_CONFIG.TOKEN` must match `apiKey` and `pluginToken` in the WebConnector config.

## Troubleshooting

### Caddy fails with permission denied on :80

Make sure `auto_https disable_redirects` exists at the top of the Caddyfile.

### Caddy command not found

Ensure Caddy is installed and in your PATH:

```bash
# Check if Caddy is installed
which caddy

# If not found, run the installer
droneengage-webconnector-install-caddy
```

### WebConnector returns 403

WebConnector requires `x-de-api-key` (or `k=` in WS query string). Ensure:

- WebClient `CONST_WEBCONNECTOR_CONFIG.APIKEY` == WebConnector `apiKey`
- WebClient `CONST_WEBCONNECTOR_CONFIG.TOKEN` == WebConnector `pluginToken`

### Port already in use

Check if ports 9211, 9212, or 9443 are already occupied:

```bash
# Check which processes are using the ports
sudo netstat -tlnp | grep -E ':(9211|9212|9443)'

# Kill processes if needed
sudo kill -9 <PID>
```

### Config files not found

The CLI automatically copies missing config files from the package. If you need to reset:

```bash
# Remove existing configs to force fresh copy
rm ~/.droneengage/webconnector/config.json
rm ~/.droneengage/webconnector/Caddyfile.localplugin
droneengage-webconnector-stack
```
