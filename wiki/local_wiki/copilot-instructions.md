# Andruav WebClient - AI Coding Assistant Instructions

## Project Overview
This is a React-based Ground Control Station (GCS) web client for drone control systems, part of the Ardupilot Cloud ecosystem. It provides real-time drone monitoring, control, mission planning, and video streaming capabilities.

## Architecture Overview

### Core Components
- **Real-time Communication**: WebSocket-based Andruav protocol communication (`src/js/server_comm/`)
- **Flight Control**: MAVLink integration for Ardupilot/PX4 drones (`src/js/js_mavlink_v2.js`)
- **Mapping**: Leaflet-based interactive maps with drone visualization (`src/js/js_leafletmap.js`)
- **Video Streaming**: WebRTC-based camera feeds (`src/js/js_webrtcthin2.js`)
- **Mission Planning**: Waypoint and fence planning system (`src/components/planning/`)
- **Unit Management**: Multi-drone control interface (`src/components/unit_controls/`)

### Key Data Flows
1. **WebSocket Messages** → Parser → Event Emitter → UI Components
2. **MAVLink Telemetry** → Unit Objects → Display Components
3. **User Input** → Command API → WebSocket → Drones
4. **Video Streams** → WebRTC → Video Components

## Development Workflow

### Local Development
```bash
npm run start  # Runs HTTPS dev server on port 3000 with SSL certificates
```

### Building for Production
1. Update `build_number` in `package.json`
2. Run `npm run build` (uses custom webpack config with aggressive minification)
3. Commit the `build/` folder: `git add build/ && git commit -m "BUILD folder"`

### Deployment
- **Development**: `npm run start` (React dev server with HTTPS)
- **Production**: Use `serve` command with SSL certificates, managed by PM2
- **Example**: `serve -s build --ssl-cert /path/to/cert.pem --ssl-key /path/to/key.pem`

## Code Patterns & Conventions

### Naming Conventions
- **Variables**: Hungarian notation (`v_` for variables, `p_` for parameters, `fn_` for functions)
- **Constants**: `CONST_` prefix (e.g., `CONST_TEST_MODE`)
- **Components**: `Clss` prefix for React class components (e.g., `ClssHeaderControl`)
- **Events**: Defined in `src/js/js_eventList.js` with `EVENTS` object

### Architecture Patterns
- **Event-Driven**: Heavy use of `js_eventEmitter` for component communication
- **Singleton Pattern**: Many managers use `getInstance()` (e.g., WebSocket client)
- **Mixed React/jQuery**: Legacy jQuery code integrated with React components
- **Modular JS**: Core logic in `src/js/` directory with specific module responsibilities

### Component Structure
```
src/components/
├── dialogs/          # Modal dialogs (camera, servo, yaw controls)
├── unit_controls/    # Drone unit management UI
├── planning/         # Mission planning interface
├── popups/          # Context menus and popups
├── flight_controllers/  # Flight controller specific controls
└── gadgets/         # Small UI widgets
```

### Communication Patterns
- **WebSocket Commands**: System (`CMDTYPE_SYS`) vs Communication (`CMDTYPE_COMM`)
- **Message Types**: Group broadcast (`CMD_COMM_GROUP`) vs Individual (`CMD_COMM_INDIVIDUAL`)
- **Andruav Protocol**: Custom JSON-based protocol for drone communication

### Configuration Management
- **Environment Config**: `public/config.json` controls test/prod modes, feature flags
- **Feature Flags**: `CONST_FEATURE` object enables/disables experimental features
- **Server Endpoints**: Different IPs/ports for test (`127.0.0.1:19408`) vs prod environments

## Key Files & Directories

### Entry Points
- `src/index.js` - React app initialization with routing
- `src/js/js_main.js` - Core application logic (3k+ lines)
- `server.js` - HTTPS static file server for production

### Core Modules
- `src/js/js_andruavUnit.js` - Drone unit data models and management
- `src/js/js_leafletmap.js` - Map rendering and drone visualization
- `src/js/server_comm/js_andruav_ws.js` - WebSocket communication client
- `src/js/js_mavlink_v2.js` - MAVLink protocol handling

### UI Components
- `src/pages/home.js` - Main GCS interface
- `src/components/jsc_header.jsx` - Application header
- `src/components/unit_controls/jsc_unitControlMainList.jsx` - Drone list interface

## Build & Quality Assurance

### ESLint Configuration
- Custom rules in `package.json` (no unused vars, no const assign, etc.)
- Ignores `js_mavlink_v2.js` (generated file)

### Webpack Production Build
- Aggressive minification with Terser
- Removes console logs and debugger statements
- Mangles function/class names except reserved ones
- Property mangling for `fn_`, `p_`, `v_` prefixed properties

### Testing
- `npm run test` - React testing library
- No specific test patterns documented - focus on manual testing

## Internationalization
- **Library**: react-i18next with i18next
- **Languages**: English, Arabic, Spanish, Russian
- **Structure**: `src/locales/{lang}/` directories
- **Usage**: `useTranslation('namespace')` in components

## Common Development Tasks

### Adding New Drone Commands
1. Define command constants in `src/js/protocol/js_andruavMessages.js`
2. Add handler in `src/js/server_comm/js_andruav_parser.js`
3. Create UI component in appropriate `src/components/` directory
4. Wire events through `js_eventEmitter`

### Adding New UI Features
1. Create component in appropriate `src/components/` subdirectory
2. Import and use in relevant page (`src/pages/`)
3. Add i18n keys to locale files
4. Style with existing CSS patterns

### Debugging Communication Issues
1. Check WebSocket connection status in browser dev tools
2. Monitor messages in `js_andruav_ws.js` logging
3. Verify message parsing in `js_andruav_parser.js`
4. Check unit object updates in `js_andruavUnit.js`

## Gotchas & Important Notes

### SSL Requirements
- Always run with HTTPS (dev server includes SSL certificates)
- Production builds require valid SSL certificates
- WebRTC and other modern APIs require secure context

### File Watching Limits
- May need to increase `fs.inotify.max_user_watches` on Linux for large codebases
- Command: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`

### Legacy Code Integration
- jQuery is heavily used alongside React - maintain both patterns
- Some components mix imperative DOM manipulation with React state
- Bootstrap CSS framework integrated with custom styles

### Performance Considerations
- Real-time updates for multiple drones require efficient event handling
- Video streaming and map rendering can be resource-intensive
- Production builds remove development logging for performance</content>
<parameter name="filePath">/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/.github/copilot-instructions.md