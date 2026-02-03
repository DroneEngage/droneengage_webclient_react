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

Detailed configuration documentation is maintained in `wiki/`:

- **Site / startup config** (`public/config.json` overrides `src/js/js_siteConfig.js`): `wiki/Andruav_SiteConfig.md`
- **Runtime preferences** (`src/js/js_globals.js` + `src/js/js_localStorage.js`): `wiki/Andruav_Configuration.md`
- **Communication layer** (`src/js/server_comm/*`): `wiki/Andruav_ServerComm.md`

## Tech Stack

- **React** - UI framework
- **Bootstrap 5** - CSS framework
- **Leaflet** - Interactive maps
- **jQuery** - DOM manipulation
- **i18next** - Internationalization

## WIKI Link

    ./wiki/

## Author

**Mohammad Said Hefny**  
Email: mohammad.hefny@gmail.com  
GitHub: [HefnySco](https://github.com/HefnySco)

## Repository

https://github.com/DroneEngage/droneengage_webclient


