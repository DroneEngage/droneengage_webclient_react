# DroneEngage & Andruav WebClient

WebClient is a Ground Control Station (GCS) for [DroneEngage](https://droneengage.com/) and [Andruav](https://www.andruav.com) systems. It provides a browser-based interface for monitoring and controlling drones.

[![Ardupilot Cloud EcoSystem](https://cloud.ardupilot.org/_static/ardupilot_logo.png "Ardupilot Cloud EcoSystem")](https://cloud.ardupilot.org "Ardupilot Cloud EcoSystem")

**WebClient** is part of the Ardupilot Cloud Eco System.

## Features

- Real-time drone monitoring and control
- Map-based visualization with Leaflet
- Support for Ardupilot and PX4 flight controllers
- Multi-language support (i18n)
- Video streaming and recording

## Documentation

**Official Documentation:** https://cloud.ardupilot.org/webclient-whatis.html

**Video Tutorials:** [YouTube Channel](https://www.youtube.com/watch?v=Rsuo76jYF0I&list=PLbv12w8pMoMPr3D6Nd28VI1ADncs93gKL)

## Prerequisites

- Node.js (v16 or higher recommended)
- npm

## Installation

```bash
npm install
```

## Running (Development)

Start the development server with HTTPS:

```bash
npm run start
```

The application will be available at `https://localhost:3000`.

**Note:** The development server uses HTTPS with SSL certificates. Ensure the SSL certificate files exist in the `./ssl/` directory or update the paths in `package.json`.

## Building (Production)

Build the application for production deployment:

```bash
npm run build
```

The production-ready files will be generated in the `build/` directory.

## Other Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint to check code quality |
| `npm run eject` | Eject from Create React App (irreversible) |

## Configuration

### Development Configuration

Default settings are defined in `src/js/js_siteConfig.js`. These can be overridden at runtime using `public/config.json`.

### Production Configuration

After building, edit `config.json` in the `build/` directory to customize the deployed application.

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `CONST_TEST_MODE` | Enable test mode (uses test server settings) | `true` |
| `CONST_PROD_MODE_IP` | Production server IP/hostname | `airgap.droneengage.com` |
| `CONST_PROD_MODE_PORT` | Production server port | `19408` |
| `CONST_TEST_MODE_IP` | Test server IP/hostname | `127.0.0.1` |
| `CONST_TEST_MODE_PORT` | Test server port | `19408` |
| `CONST_MAP_LEAFLET_URL` | Map tile URL (Mapbox, OpenStreetMap, local) | Mapbox satellite |
| `CONST_ANDRUAV_URL_ENABLE` | Show Andruav download link | `true` |
| `CONST_ACCOUNT_URL_ENABLE` | Show account link | `true` |
| `CONST_DONT_BROADCAST_TO_GCSs` | Disable broadcasting to other GCS | `false` |
| `CONST_DONT_BROADCAST_GCS_LOCATION` | Hide GCS location from network | `false` |

### Feature Flags (`CONST_FEATURE`)

| Flag | Description |
|------|-------------|
| `DISABLE_UNIT_NAMING` | Disable unit renaming |
| `DISABLE_UDPPROXY_UPDATE` | Disable UDP proxy updates |
| `DISABLE_SWARM` | Disable swarm features |
| `DISABLE_SWARM_DESTINATION_PONTS` | Disable swarm destination points |
| `DISABLE_P2P` | Disable peer-to-peer connections |
| `DISABLE_SDR` | Disable SDR features |
| `DISABLE_GPIO` | Disable GPIO controls |
| `DISABLE_VOICE` | Disable voice features |
| `DISABLE_TRACKING` | Disable tracking features |
| `DISABLE_TRACKING_AI` | Disable AI tracking |
| `DISABLE_EXPERIMENTAL` | Disable experimental features |
| `DISABLE_VERSION_NOTIFICATION` | Disable version update notifications |

### Module Versions (`CONST_MODULE_VERSIONS`)

Define expected versions for connected modules (de, fcb, andruav, camera) with download URLs and help links.

### Language Settings (`CONST_LANGUAGE`)

- `ENABLED_LANGUAGES` - Array of available languages (en, ar, fr, es, ru)
- `DEFAULT_LANGUAGE` - Default language code

### WebRTC Settings (`CONST_ICE_SERVERS`)

Configure TURN/STUN servers for video streaming.

## Tech Stack

- **React** - UI framework
- **Bootstrap 5** - CSS framework
- **Leaflet** - Interactive maps
- **jQuery** - DOM manipulation
- **i18next** - Internationalization

## Author

**Mohammad Said Hefny**  
Email: mohammad.hefny@gmail.com  
GitHub: [HefnySco](https://github.com/HefnySco)

## Repository

https://github.com/DroneEngage/droneengage_webclient


