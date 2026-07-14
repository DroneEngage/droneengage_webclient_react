# Cross-Platform Deployment Guide

This guide covers deploying and running DroneEngage WebConnector on **Windows**, **macOS**, and **Ubuntu/Linux**.

## Quick Start (All Platforms)

### Prerequisites

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)

### Installation Methods

#### Method 1: Quick Start Scripts (Recommended for Local Development)

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

#### Method 2: npm Global Install (Recommended for Production)

```bash
npm install -g droneengage-webconnector
droneengage-webconnector
```

#### Method 3: npx (No Installation)

```bash
npx droneengage-webconnector email@domain.com accessCode
```

## Platform-Specific Instructions

### Windows

#### Installation

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Run the installer with default settings
   - Restart your terminal/command prompt

2. **Install WebConnector**
   ```cmd
   cd webconnector
   npm install
   ```

3. **Generate SSL Certificates** (if needed)
   ```cmd
   # Use OpenSSL or download a tool like Git for Windows which includes OpenSSL
   # Or use the provided script if available
   ```

4. **Configure**
   - Edit `config.json` with your credentials
   - Set `apiKey` and `pluginToken` to secure random strings

5. **Run**
   ```cmd
   # Option 1: Use batch script
   start.bat
   
   # Option 2: Use npm
   npm start
   
   # Option 3: Direct node
   node src/index.js
   ```

#### With Caddy Reverse Proxy (Optional)

```cmd
# Install Caddy
droneengage-webconnector-install-caddy

# Run full stack (connector + Caddy)
droneengage-webconnector-stack
```

#### Windows Service (Optional)

To run as a Windows service, use tools like:
- [node-windows](https://github.com/coreybutler/node-windows)
- [NSSM](https://nssm.cc/)

Example with node-windows:
```cmd
npm install -g node-windows
node-windows -i src/index.js
```

### macOS

#### Installation

1. **Install Node.js**
   ```bash
   # Using Homebrew (recommended)
   brew install node
   
   # Or download from https://nodejs.org/
   ```

2. **Install WebConnector**
   ```bash
   cd webconnector
   npm install
   ```

3. **Generate SSL Certificates**
   ```bash
   # If you have the ssl generation script
   ../local/sh_make_ssl.sh
   
   # Or manually using OpenSSL
   openssl req -x509 -newkey rsa:4096 -keyout ssl/localssl.key -out ssl/localssl.crt -days 365 -nodes
   ```

4. **Configure**
   - Edit `config.json` with your credentials
   - Set `apiKey` and `pluginToken` to secure random strings

5. **Run**
   ```bash
   # Option 1: Use shell script
   chmod +x start.sh
   ./start.sh
   
   # Option 2: Use npm
   npm start
   
   # Option 3: Direct node
   node src/index.js
   ```

#### With Caddy Reverse Proxy (Optional)

```bash
# Install Caddy
droneengage-webconnector-install-caddy

# Run full stack (connector + Caddy)
droneengage-webconnector-stack
```

#### Launch Agent (Optional - Auto-start on login)

Create a macOS Launch Agent to auto-start the connector:

```bash
# Create plist file
cat > ~/Library/LaunchAgents/com.droneengage.webconnector.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.droneengage.webconnector</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/webconnector/src/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/path/to/webconnector</string>
</dict>
</plist>
EOF

# Load the agent
launchctl load ~/Library/LaunchAgents/com.droneengage.webconnector.plist
```

### Ubuntu/Linux

#### Installation

1. **Install Node.js**
   ```bash
   # Using NodeSource repository (recommended)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Or using package manager
   sudo apt update
   sudo apt install nodejs npm
   ```

2. **Install WebConnector**
   ```bash
   cd webconnector
   npm install
   ```

3. **Generate SSL Certificates**
   ```bash
   # If you have the ssl generation script
   ../local/sh_make_ssl.sh
   
   # Or manually using OpenSSL
   mkdir -p ssl
   openssl req -x509 -newkey rsa:4096 -keyout ssl/localssl.key -out ssl/localssl.crt -days 365 -nodes
   ```

4. **Configure**
   - Edit `config.json` with your credentials
   - Set `apiKey` and `pluginToken` to secure random strings

5. **Run**
   ```bash
   # Option 1: Use shell script
   chmod +x start.sh
   ./start.sh
   
   # Option 2: Use npm
   npm start
   
   # Option 3: Direct node
   node src/index.js
   ```

#### With Caddy Reverse Proxy (Optional)

```bash
# Install Caddy (requires sudo)
sudo droneengage-webconnector-install-caddy

# Run full stack (connector + Caddy)
droneengage-webconnector-stack
```

#### Systemd Service (Optional - Auto-start on boot)

Create a systemd service to auto-start the connector:

```bash
# Create service file
sudo cat > /etc/systemd/system/droneengage-webconnector.service << EOF
[Unit]
Description=DroneEngage WebConnector
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/webconnector
ExecStart=/usr/bin/node /path/to/webconnector/src/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable droneengage-webconnector
sudo systemctl start droneengage-webconnector

# Check status
sudo systemctl status droneengage-webconnector
```

## Configuration

### Basic Configuration (`config.json`)

```json
{
  "authPort": 9211,
  "wsPort": 9212,
  
  "cors": {
    "allowedOrigin": "https://localhost:3000"
  },
  
  "tls": {
    "certFile": "../ssl/localssl.crt",
    "keyFile": "../ssl/localssl.key"
  },
  
  "cloud": {
    "authHost": "cloud.ardupilot.org",
    "authPort": 19408,
    "authSecure": true,
    "wsSecure": true,
    "commSecure": true,
    "insecureTls": true,
    "localOnlyMode": false
  },
  
  "credentials": {
    "email": "your@email.com",
    "accessCode": "your-access-code",
    "group": "1"
  },
  
  "apiKey": "your-secure-api-key-here",
  "pluginToken": "static-plugin-token-12345",
  
  "reconnect": {
    "upstreamWsDelayMs": 2000
  }
}
```

### Generate Secure Keys

```bash
# Generate API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate plugin token
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

## NPM Scripts

The following npm scripts are available for convenience:

```bash
# Start connector
npm start

# Start with credentials
npm run start:creds -- email@domain.com accessCode

# Install Caddy (cross-platform)
npm run install:caddy

# Run full stack with Caddy
npm run stack
```

## Troubleshooting

### Port Already in Use

**Windows:**
```cmd
netstat -ano | findstr :9211
netstat -ano | findstr :9212
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -iTCP:9211 -sTCP:LISTEN -n -P
lsof -iTCP:9212 -sTCP:LISTEN -n -P
kill -9 <PID>
```

### Permission Denied

**Windows:** Run Command Prompt as Administrator

**macOS/Linux:** Use sudo
```bash
sudo npm start
```

### Certificate Issues

If you see certificate errors:

1. Regenerate SSL certificates
2. Accept the certificate in browser at `https://127.0.0.1:9211/h/health`
3. Or set `insecureTls: true` in config.json

### Node.js Not Found

**Windows:** Add Node.js to PATH or reinstall

**macOS/Linux:**
```bash
# Check if Node.js is installed
which node
node --version

# If not found, reinstall or add to PATH
export PATH="/usr/local/bin:$PATH"
```

## Advanced Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 9211 9212

CMD ["node", "src/index.js"]
```

Build and run:
```bash
docker build -t droneengage-webconnector .
docker run -p 9211:9211 -p 9212:9212 -v $(pwd)/config.json:/app/config.json droneengage-webconnector
```

### Reverse Proxy with Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/key.key;

    location / {
        proxy_pass https://127.0.0.1:9211;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass https://127.0.0.1:9212;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Security Best Practices

1. **Use strong API keys and tokens**
2. **Run behind a firewall** - only expose necessary ports
3. **Use valid SSL certificates** in production
4. **Keep Node.js and dependencies updated**
5. **Run as non-root user** when possible
6. **Enable HTTPS/WSS only** - disable HTTP/WS
7. **Use environment variables** for sensitive data

## Support

For issues and questions:
- GitHub Issues: https://github.com/DroneEngage/droneengage_webclient_react/issues
- Documentation: See README.md and SETUP_BROWSER.md
