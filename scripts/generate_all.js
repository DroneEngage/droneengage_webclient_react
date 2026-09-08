#!/usr/bin/env node
/**
 * Convenience runner: regenerates every procedural .glb model by
 * invoking each generate_*_glb.js script in turn.
 *
 * Each generator accepts an optional output-path CLI arg (resolved
 * relative to CWD) and falls back to <repo>/public/models/<name>.glb.
 * This runner forwards an optional output directory to each script,
 * writing <outDir>/<name>.glb for each model.
 *
 * We use child_process to keep each script's console.log output and
 * exit code isolated (matching running them manually), rather than
 * `require()`-ing them (which would share module state and swallow
 * their final log lines on some Node versions).
 *
 * Usage:
 *   node scripts/generate_all.js                   # default: public/models/
 *   node scripts/generate_all.js ./build/models    # custom output dir
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// script -> default output filename it produces
const scripts = [
    ['generate_arrow_glb.js',         'arrow.glb'],
    ['generate_plane_glb.js',         'plane.glb'],
    ['generate_quad_glb.js',          'quad.glb'],
    ['generate_groundstation_glb.js', 'groundstation.glb'],
    ['generate_homebase_glb.js',      'homebase.glb'],
    ['generate_car_glb.js',           'car.glb'],
    ['generate_boat_glb.js',          'boat.glb'],
];

const scriptsDir = __dirname;
const outDir = process.argv[2] ? path.resolve(process.argv[2]) : null;

if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
}

let failed = 0;

for (const [name, fileName] of scripts) {
    const file = path.join(scriptsDir, name);
    const args = outDir ? [file, path.join(outDir, fileName)] : [file];
    console.log(`\n=== ${name} ===`);
    const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
    if (res.status !== 0) {
        console.error(`!! ${name} exited with code ${res.status}`);
        failed++;
    }
}

console.log(
    failed === 0
        ? `\nDone: ${scripts.length} models regenerated${outDir ? ` into ${outDir}` : ''}.`
        : `\nDone with errors: ${failed}/${scripts.length} scripts failed.`
);
process.exit(failed === 0 ? 0 : 1);
