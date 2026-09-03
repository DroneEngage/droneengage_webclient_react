#!/usr/bin/env node
/**
 * Generates a simple quadcopter 3D model (.glb) for VEHICLE_QUAD/VEHICLE_TRI
 * (multirotor) units, in X configuration (arms at 45/135/225/315 degrees —
 * i.e. no arm points straight forward/back/left/right, unlike a "+" frame).
 *
 * Two separate materials so rotors and body can have distinct baked-in
 * colors (and, in principle, be targeted independently via Mapbox
 * materialOverrideNames on a 'model'-type source — NOT supported on the
 * batched GeoJSON source this project currently uses; see js_map3d.js):
 *   - "body"   material: central body box + 4 diagonal arms + 4 rotor hubs
 *   - "rotors" material: 1 thin cylinder per rotor (4 disks total)
 *
 * Y-up glTF convention. -Z = forward (North), +X = right (East), +Y = up —
 * same convention as arrow.glb/plane.glb, centered at y=0.
 *
 * Output: public/models/quad.glb
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONTROL PARAMETERS — edit these to change the model. Everything below this
// block is geometry/build logic and should not normally need editing.
// ============================================================================

// ---- Geometry (model-space units) ----
const BODY_SIZE   = 0.6;   // body box width/depth (X/Z)
const BODY_HEIGHT = 0.25;  // body box height (Y)

const ARM_INNER = 0.35;    // arm start distance from center (past body edge)
const ARM_OUTER = 1.1;     // arm end distance from center (rotor hub position)
const ARM_HALF_WIDTH = 0.05;
const ARM_Y0 = -0.04, ARM_Y1 = 0.04;

const HUB_HALF_SIZE = 0.09;
const HUB_Y0 = -0.07, HUB_Y1 = 0.07;

const PROP_RADIUS    = 0.45;  // propeller disk radius
const PROP_THICKNESS = 0.02;  // propeller disk thickness (along Y)
const PROP_SEGMENTS  = 16;    // cylinder side count
const PROP_GAP       = 0.01;  // gap between hub top and propeller disk

const ARM_ANGLES_DEG = [45, 135, 225, 315];  // X configuration

// ---- Materials (RGBA baseColorFactor + PBR metallic/roughness) ----
const BODY_COLOR  = [0.15, 0.15, 0.17, 1.0]; // dark gray frame
const BODY_METAL  = 0.3;
const BODY_ROUGH  = 0.6;

const ROTOR_COLOR = [0.85, 0.12, 0.08, 1.0]; // red accent props
const ROTOR_METAL = 0.1;
const ROTOR_ROUGH = 0.5;

// ---- Output ----
const DEFAULT_OUT = path.join(__dirname, '..', 'public', 'models', 'quad.glb');

// ============================================================================
// BUILD — no user-tunable constants below this line.
// ============================================================================

// Derived: propeller disk sits just above the hub
const PROP_Y_CENTER = HUB_Y1 + PROP_THICKNESS / 2 + PROP_GAP;

// ---- Two independent geometry buffers (one per material) ----

function makeGeom() { return { positions: [], normals: [], indices: [] }; }
const bodyGeom = makeGeom();
const rotorGeom = makeGeom();

function pushQuad(geom, a, b, c, d) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    const base = geom.positions.length / 3;
    geom.positions.push(
        a[0], a[1], a[2],  b[0], b[1], b[2],
        c[0], c[1], c[2],  d[0], d[1], d[2]
    );
    geom.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    geom.indices.push(base, base + 1, base + 2,  base, base + 2, base + 3);
}

// Box from min/max corners, optionally transformed (e.g. rotated) per-vertex.
// pushQuad computes normals from the (possibly transformed) vertex positions,
// so any rotation/translation passed via transformFn is handled correctly.
function addBox(geom, x0, y0, z0, x1, y1, z1, transformFn = (p) => p) {
    let v = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],  // front  (z0)
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],  // back   (z1)
    ];
    v = v.map(transformFn);
    pushQuad(geom, v[0], v[3], v[2], v[1]);  // front  (z0, normal -Z)
    pushQuad(geom, v[5], v[6], v[7], v[4]);  // back   (z1, normal +Z)
    pushQuad(geom, v[4], v[7], v[3], v[0]);  // left   (x0, normal -X)
    pushQuad(geom, v[1], v[2], v[6], v[5]);  // right  (x1, normal +X)
    pushQuad(geom, v[4], v[5], v[1], v[0]);  // bottom (y0, normal -Y)
    pushQuad(geom, v[3], v[7], v[6], v[2]);  // top    (y1, normal +Y)
}

function rotateYFn(angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    const c = Math.cos(rad), s = Math.sin(rad);
    return ([x, y, z]) => [x * c + z * s, y, -x * s + z * c];
}

// Single triangle with a flat face normal (CCW winding → outward).
function pushTriangle(geom, a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    const base = geom.positions.length / 3;
    geom.positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    geom.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    geom.indices.push(base, base + 1, base + 2);
}

// Cylinder centered at (cx, cy, cz) with its axis along Y, given radius
// and height (thickness). Flat-shaded sides (one quad per segment) plus
// triangle-fan end caps. Used for the propeller disks.
function addCylinder(geom, cx, cy, cz, radius, height, segments) {
    const y0 = cy - height / 2, y1 = cy + height / 2;
    const ring = [];
    for (let i = 0; i < segments; i++) {
        const a = (i / segments) * 2 * Math.PI;
        ring.push([cx + Math.cos(a) * radius, cz + Math.sin(a) * radius]);
    }
    // Side faces (outward normals)
    for (let i = 0; i < segments; i++) {
        const j = (i + 1) % segments;
        pushQuad(geom,
            [ring[i][0], y0, ring[i][1]],
            [ring[j][0], y0, ring[j][1]],
            [ring[j][0], y1, ring[j][1]],
            [ring[i][0], y1, ring[i][1]]);
    }
    // End caps
    for (let i = 0; i < segments; i++) {
        const j = (i + 1) % segments;
        // bottom (normal -Y)
        pushTriangle(geom, [cx, y0, cz], [ring[j][0], y0, ring[j][1]], [ring[i][0], y0, ring[i][1]]);
        // top (normal +Y)
        pushTriangle(geom, [cx, y1, cz], [ring[i][0], y1, ring[i][1]], [ring[j][0], y1, ring[j][1]]);
    }
}

// ---- Body: box centered at origin ----
addBox(bodyGeom,
    -BODY_SIZE / 2, -BODY_HEIGHT / 2, -BODY_SIZE / 2,
     BODY_SIZE / 2,  BODY_HEIGHT / 2,  BODY_SIZE / 2);

// ---- Arms + hubs (body material) and propellers (rotor material), one set per angle ----
for (const angleDeg of ARM_ANGLES_DEG) {
    const rot = rotateYFn(angleDeg);

    // Arm: thin box running from ARM_INNER to ARM_OUTER along local +Z,
    // then rotated into place.
    addBox(bodyGeom,
        -ARM_HALF_WIDTH, ARM_Y0, ARM_INNER,
         ARM_HALF_WIDTH, ARM_Y1, ARM_OUTER,
        rot);

    // Rotor hub at the arm tip.
    addBox(bodyGeom,
        -HUB_HALF_SIZE, HUB_Y0, ARM_OUTER - HUB_HALF_SIZE,
         HUB_HALF_SIZE, HUB_Y1, ARM_OUTER + HUB_HALF_SIZE,
        rot);

    // Propeller: a thin cylinder (disk) centered on the hub, sitting above it.
    // The cylinder's axis is Y and it is rotationally symmetric, so it does not
    // need rotateYFn — just place it at the hub center after the arm rotation.
    const rad = angleDeg * Math.PI / 180;
    const hubCx = ARM_OUTER * Math.sin(rad);
    const hubCz = ARM_OUTER * Math.cos(rad);
    addCylinder(rotorGeom, hubCx, PROP_Y_CENTER, hubCz, PROP_RADIUS, PROP_THICKNESS, PROP_SEGMENTS);
}

// ---- Pack both geometries into one GLB (2 primitives, 2 materials) ----

function packGeom(geom) {
    const numVertices = geom.positions.length / 3;
    const numIndices = geom.indices.length;
    const posBytes = geom.positions.length * 4;
    const norBytes = geom.normals.length * 4;
    const idxBytes = geom.indices.length * 2;
    const posPadded = Math.ceil(posBytes / 4) * 4;
    const norPadded = Math.ceil(norBytes / 4) * 4;
    const idxPadded = Math.ceil(idxBytes / 4) * 4;
    const totalLength = posPadded + norPadded + idxPadded;

    const buffer = Buffer.alloc(totalLength, 0);
    Buffer.from(Float32Array.from(geom.positions).buffer).copy(buffer, 0);
    Buffer.from(Float32Array.from(geom.normals).buffer).copy(buffer, posPadded);
    Buffer.from(Uint16Array.from(geom.indices).buffer).copy(buffer, posPadded + norPadded);

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < geom.positions.length; i += 3) {
        minX = Math.min(minX, geom.positions[i]);     maxX = Math.max(maxX, geom.positions[i]);
        minY = Math.min(minY, geom.positions[i + 1]); maxY = Math.max(maxY, geom.positions[i + 1]);
        minZ = Math.min(minZ, geom.positions[i + 2]); maxZ = Math.max(maxZ, geom.positions[i + 2]);
    }

    return { buffer, posBytes, norBytes, idxBytes, posPadded, norPadded, idxPadded, totalLength, numVertices, numIndices, bounds: { minX, minY, minZ, maxX, maxY, maxZ } };
}

const bodyPacked = packGeom(bodyGeom);
const rotorPacked = packGeom(rotorGeom);

const binBuffer = Buffer.concat([bodyPacked.buffer, rotorPacked.buffer]);
const bodyBase = 0;
const rotorBase = bodyPacked.totalLength;

const gltfJson = {
    asset: { version: '2.0', generator: 'DroneEngage quad.glb generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
        primitives: [
            { attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 },  // body
            { attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 1 }   // rotors
        ]
    }],
    materials: [
        {
            name: 'body',
            pbrMetallicRoughness: {
                baseColorFactor: BODY_COLOR,
                metallicFactor: BODY_METAL,
                roughnessFactor: BODY_ROUGH
            },
            doubleSided: true
        },
        {
            name: 'rotors',
            pbrMetallicRoughness: {
                baseColorFactor: ROTOR_COLOR,
                metallicFactor: ROTOR_METAL,
                roughnessFactor: ROTOR_ROUGH
            },
            doubleSided: true
        }
    ],
    buffers: [{ byteLength: binBuffer.length }],
    bufferViews: [
        { buffer: 0, byteOffset: bodyBase, byteLength: bodyPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: bodyBase + bodyPacked.posPadded, byteLength: bodyPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: bodyBase + bodyPacked.posPadded + bodyPacked.norPadded, byteLength: bodyPacked.idxBytes, target: 34963 },
        { buffer: 0, byteOffset: rotorBase, byteLength: rotorPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: rotorBase + rotorPacked.posPadded, byteLength: rotorPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: rotorBase + rotorPacked.posPadded + rotorPacked.norPadded, byteLength: rotorPacked.idxBytes, target: 34963 }
    ],
    accessors: [
        { bufferView: 0, componentType: 5126, count: bodyPacked.numVertices, type: 'VEC3',
          min: [bodyPacked.bounds.minX, bodyPacked.bounds.minY, bodyPacked.bounds.minZ],
          max: [bodyPacked.bounds.maxX, bodyPacked.bounds.maxY, bodyPacked.bounds.maxZ] },
        { bufferView: 1, componentType: 5126, count: bodyPacked.numVertices, type: 'VEC3' },
        { bufferView: 2, componentType: 5123, count: bodyPacked.numIndices, type: 'SCALAR' },
        { bufferView: 3, componentType: 5126, count: rotorPacked.numVertices, type: 'VEC3',
          min: [rotorPacked.bounds.minX, rotorPacked.bounds.minY, rotorPacked.bounds.minZ],
          max: [rotorPacked.bounds.maxX, rotorPacked.bounds.maxY, rotorPacked.bounds.maxZ] },
        { bufferView: 4, componentType: 5126, count: rotorPacked.numVertices, type: 'VEC3' },
        { bufferView: 5, componentType: 5123, count: rotorPacked.numIndices, type: 'SCALAR' }
    ]
};

let jsonStr = JSON.stringify(gltfJson);
let jsonBuf = Buffer.from(jsonStr, 'utf8');
const jsonPadded = Math.ceil(jsonBuf.length / 4) * 4;
if (jsonPadded > jsonBuf.length) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPadded - jsonBuf.length, 0x20)]);
}

const glbLength = 12 + 8 + jsonPadded + 8 + binBuffer.length;
const glb = Buffer.alloc(glbLength, 0);

glb.writeUInt32LE(0x46546C67, 0);  // "glTF"
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(glbLength, 8);

glb.writeUInt32LE(jsonPadded, 12);
glb.writeUInt32LE(0x4E4F534A, 16);  // "JSON"
jsonBuf.copy(glb, 20);

const binOffset = 20 + jsonPadded;
glb.writeUInt32LE(binBuffer.length, binOffset);
glb.writeUInt32LE(0x004E4942, binOffset + 4);  // "BIN\0"
binBuffer.copy(glb, binOffset + 8);

// Usage: node generate_quad_glb.js [outputPath]
//   outputPath is resolved relative to CWD; defaults to DEFAULT_OUT above.
const outPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_OUT;
fs.writeFileSync(outPath, glb);
console.log(`Generated ${outPath} (${glbLength} bytes)`);
console.log(`Body:   ${bodyPacked.numVertices} vertices, ${bodyPacked.numIndices} indices`);
console.log(`Rotors: ${rotorPacked.numVertices} vertices, ${rotorPacked.numIndices} indices`);
