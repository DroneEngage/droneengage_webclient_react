#!/usr/bin/env node
/**
 * Generates a simple ground-station 3D model (.glb) for de_comm / Control
 * Unit units (non-drone, stationary comm/relay nodes) — deliberately NOT a
 * tall lattice mobile-tower shape, just a small base box + a thin antenna
 * rod + a small cap:
 *   - Base box (the unit itself), sitting on the ground (y = 0..BASE_HEIGHT)
 *   - Thin vertical antenna rod on top
 *   - Small cap box at the antenna tip
 *
 * Y-up glTF convention. Model is rotationally symmetric-ish (no strong
 * "forward" direction needed, unlike arrow.glb/plane.glb), but still follows
 * the same -Z-forward/+Y-up convention for consistency with model-rotation
 * handling in js_map3d.js.
 *
 * Output: public/models/groundstation.glb
 */

const fs = require('fs');
const path = require('path');

// ---- Geometry parameters (model-space units) ----
const BASE_WIDTH  = 1.0;   // along X
const BASE_DEPTH  = 1.0;   // along Z
const BASE_HEIGHT = 0.5;   // along Y

const ROD_WIDTH  = 0.12;   // antenna rod cross-section (X and Z)
const ROD_HEIGHT = 1.2;    // antenna rod height above the base

const CAP_SIZE   = 0.32;   // cap cross-section (X and Z)
const CAP_HEIGHT = 0.16;   // cap height

// ---- Build geometry with flat normals (duplicated vertices per face) ----

const positions = [];
const normals = [];
const indices = [];

function pushQuad(a, b, c, d) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    const base = positions.length / 3;
    positions.push(
        a[0], a[1], a[2],  b[0], b[1], b[2],
        c[0], c[1], c[2],  d[0], d[1], d[2]
    );
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    indices.push(base, base + 1, base + 2,  base, base + 2, base + 3);
}

// Helper to build a box (rectangular prism) from min/max corners
function addBox(x0, y0, z0, x1, y1, z1) {
    const v = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],  // front  (z0)
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],  // back   (z1)
    ];
    pushQuad(v[0], v[3], v[2], v[1]);  // front  (z0, normal -Z)
    pushQuad(v[5], v[6], v[7], v[4]);  // back   (z1, normal +Z)
    pushQuad(v[4], v[7], v[3], v[0]);  // left   (x0, normal -X)
    pushQuad(v[1], v[2], v[6], v[5]);  // right  (x1, normal +X)
    pushQuad(v[4], v[5], v[1], v[0]);  // bottom (y0, normal -Y)
    pushQuad(v[3], v[7], v[6], v[2]);  // top    (y1, normal +Y)
}

// ---- Base: small box sitting on the ground, centered on origin (X/Z) ----
addBox(-BASE_WIDTH / 2, 0, -BASE_DEPTH / 2,
        BASE_WIDTH / 2, BASE_HEIGHT, BASE_DEPTH / 2);

// ---- Antenna rod: thin box centered on top of the base ----
const rodY0 = BASE_HEIGHT;
const rodY1 = BASE_HEIGHT + ROD_HEIGHT;
addBox(-ROD_WIDTH / 2, rodY0, -ROD_WIDTH / 2,
        ROD_WIDTH / 2, rodY1,  ROD_WIDTH / 2);

// ---- Cap: small box at the antenna tip ----
addBox(-CAP_SIZE / 2, rodY1, -CAP_SIZE / 2,
        CAP_SIZE / 2, rodY1 + CAP_HEIGHT, CAP_SIZE / 2);

// ---- Pack into GLB ----

const numVertices = positions.length / 3;
const numIndices = indices.length;

const posBytes = positions.length * 4;
const norBytes = normals.length * 4;
const idxBytes = indices.length * 2;

const posPadded = Math.ceil(posBytes / 4) * 4;
const norPadded = Math.ceil(norBytes / 4) * 4;
const idxPadded = Math.ceil(idxBytes / 4) * 4;

const totalBinLength = posPadded + norPadded + idxPadded;
const binBuffer = Buffer.alloc(totalBinLength, 0);

const posBuf = Buffer.from(Float32Array.from(positions).buffer);
posBuf.copy(binBuffer, 0);

const norBuf = Buffer.from(Float32Array.from(normals).buffer);
norBuf.copy(binBuffer, posPadded);

const idxBuf = Buffer.from(Uint16Array.from(indices).buffer);
idxBuf.copy(binBuffer, posPadded + norPadded);

// Bounding box
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);     maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
}

const gltfJson = {
    asset: { version: '2.0', generator: 'DroneEngage groundstation.glb generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
        primitives: [{
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0
        }]
    }],
    materials: [{
        pbrMetallicRoughness: {
            baseColorFactor: [0.2, 0.55, 0.85, 1.0],  // muted blue
            metallicFactor: 0.2,
            roughnessFactor: 0.6
        },
        doubleSided: true
    }],
    buffers: [{ byteLength: totalBinLength }],
    bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: posBytes, target: 34962 },
        { buffer: 0, byteOffset: posPadded, byteLength: norBytes, target: 34962 },
        { buffer: 0, byteOffset: posPadded + norPadded, byteLength: idxBytes, target: 34963 }
    ],
    accessors: [
        {
            bufferView: 0, componentType: 5126, count: numVertices,
            type: 'VEC3', min: [minX, minY, minZ], max: [maxX, maxY, maxZ]
        },
        {
            bufferView: 1, componentType: 5126, count: numVertices,
            type: 'VEC3'
        },
        {
            bufferView: 2, componentType: 5123, count: numIndices,
            type: 'SCALAR'
        }
    ]
};

// Serialize JSON chunk (pad to 4-byte alignment)
let jsonStr = JSON.stringify(gltfJson);
let jsonBuf = Buffer.from(jsonStr, 'utf8');
const jsonPadded = Math.ceil(jsonBuf.length / 4) * 4;
if (jsonPadded > jsonBuf.length) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPadded - jsonBuf.length, 0x20)]);
}

const glbLength = 12 + 8 + jsonPadded + 8 + totalBinLength;
const glb = Buffer.alloc(glbLength, 0);

glb.writeUInt32LE(0x46546C67, 0);  // "glTF"
glb.writeUInt32LE(2, 4);            // version 2
glb.writeUInt32LE(glbLength, 8);    // total length

glb.writeUInt32LE(jsonPadded, 12);
glb.writeUInt32LE(0x4E4F534A, 16);  // "JSON"
jsonBuf.copy(glb, 20);

const binOffset = 20 + jsonPadded;
glb.writeUInt32LE(totalBinLength, binOffset);
glb.writeUInt32LE(0x004E4942, binOffset + 4);  // "BIN\0"
binBuffer.copy(glb, binOffset + 8);

const outPath = path.join(__dirname, '..', 'public', 'models', 'groundstation.glb');
fs.writeFileSync(outPath, glb);
console.log(`Generated ${outPath} (${glbLength} bytes, ${numVertices} vertices, ${numIndices} indices)`);
console.log(`Bounds: X[${minX}, ${maxX}]  Y[${minY}, ${maxY}]  Z[${minZ}, ${maxZ}]`);
