# scripts/ — GLB model generators

Standalone Node.js scripts that procedurally build the simple 3D vehicle
models used by the 3D map (`js_map3d.js`) and emit them as binary glTF
(`.glb`) files into `public/models/`.

Each script:
- Uses **only Node.js built-ins** (`fs`, `path`) — no npm dependencies,
  no need to `npm install` first.
- Accepts an **optional output-path CLI argument** (resolved relative to
  CWD). Without it, the script writes to its default location
  `<repo>/public/models/<name>.glb`. Geometry params are constants at
  the top of each file; edit there and re-run to change the model.
- Is **not** marked executable (`-rw-rw-r--`), so invoke it through
  `node` rather than `./script.js`.

## Files

| Script                          | Output                          | Purpose                                              |
| ------------------------------- | ------------------------------- | ---------------------------------------------------- |
| `generate_arrow_glb.js`         | `public/models/arrow.glb`       | Yellow-orange cone arrowhead (heading indicator).    |
| `generate_plane_glb.js`         | `public/models/plane.glb`       | Yellow fixed-wing plane (fuselage + wings + fin).    |
| `generate_quad_glb.js`          | `public/models/quad.glb`        | Quadcopter X-frame, 4 materials (body + rear rotors + white front rotors + chassis). |
| `generate_groundstation_glb.js` | `public/models/groundstation.glb` | Blue ground-station box + antenna rod + cap.       |
| `generate_homebase_glb.js`      | `public/models/homebase.glb`      | Rounded helipad disc + rim + white "H" mark (home).|

All models use the Y-up glTF convention with **-Z = forward (North)**,
matching the MAVLink yaw convention (0 = North, 90 = East, clockwise)
used by `js_map3d.js`.

## How to call them

### One script

```bash
# Default output location (public/models/<name>.glb):
node scripts/generate_plane_glb.js
# Generated /home/.../droneengage_webclient_react/public/models/plane.glb (1234 bytes, 96 vertices, 144 indices)
# Bounds: X[-2, 2]  Y[-0.075, 1.075]  Z[-1.5, 1.5]

# Custom output path (resolved relative to CWD):
node scripts/generate_plane_glb.js ./build/models/my_plane.glb
node scripts/generate_plane_glb.js /tmp/test.glb
```

### All of them at once

Use the bundled runner:

```bash
# Default: regenerate all four into public/models/
node scripts/generate_all.js

# Custom output directory (created if missing; writes <dir>/<name>.glb):
node scripts/generate_all.js ./build/models
```

### From npm

Add to `package.json` if you want them wired into the build:

```json
"scripts": {
  "models": "node scripts/generate_all.js",
  "models:plane": "node scripts/generate_plane_glb.js"
}
```

Then: `npm run models` (regenerates all four `.glb` files into
`public/models/`). To target a custom dir via npm, use
`npm run models -- ./build/models` (npm forwards trailing args after
`--` to the script).

## When to re-run

- After editing the geometry constants at the top of a generator
  (`RADIUS`, `WING_SPAN`, `ARM_OUTER`, `BASE_HEIGHT`, …).
- After deleting or branching the repo (the `.glb` files are build
  artifacts; regenerate them whenever `public/models/` is missing or
  stale).

The generated `.glb` files are checked into `public/models/`, so a
fresh checkout does not strictly need to run these scripts — they
exist to **regenerate** the models when the procedural geometry
changes.
