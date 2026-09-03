#!/usr/bin/env node
/**
 * Generates a simple 3D arrowhead (cone) as a binary glTF (.glb) file.
 *
 * The arrow points along -Z in model space (Y-up glTF convention).
 * In Mapbox GL model layers, at orientation [0,0,0] (yaw=0) the model's
 * -Z axis points North, and yaw rotates clockwise — matching MAVLink
 * yaw convention (0=North, 90=East).
 *
 * Geometry: a cone with N_SEGMENTS sides.
 *   - Tip at (0, 0, -LENGTH)
 *   - Base ring at z=0, radius=RADIUS
 *   - Base cap (flat triangle fan) closing the back
 *
 * Uses flat shading (duplicated vertices per face) for clean cone facets.
 *
 * Output: public/models/arrow.glb
 */

const fs = require('fs');
const path = require('path');

const N_SEGMENTS = 12;
const RADIUS = 1.0;
const LENGTH = 2.5;

// --- Build geometry with flat normals (duplicated vertices) ---

const positions = [];
const normals = [];
const indices = [];

// Helper: push a triangle's 3 vertices + face normal
function pushTriangle(a, b, c) {
    // Compute face normal (CCW winding → outward)
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    const baseIdx = positions.length / 3;
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
}

const tip = [0, 0, -LENGTH];
const baseCenter = [0, 0, 0];

// Side faces + base cap
for (let i = 0; i < N_SEGMENTS; i++) {
    const a0 = (i / N_SEGMENTS) * 2 * Math.PI;
    const a1 = ((i + 1) / N_SEGMENTS) * 2 * Math.PI;

    const b0 = [Math.cos(a0) * RADIUS, Math.sin(a0) * RADIUS, 0];
    const b1 = [Math.cos(a1) * RADIUS, Math.sin(a1) * RADIUS, 0];

    // Side triangle (tip, b0, b1) — CCW when viewed from outside
    pushTriangle(tip, b0, b1);

    // Base cap triangle (baseCenter, b1, b0) — reversed winding so normal
    // points in +Z (backward, away from tip)
    pushTriangle(baseCenter, b1, b0);
}

// --- Pack into GLB ---

const numVertices = positions.length / 3;
const numIndices = indices.length;

// Binary buffer: positions (float32) + normals (float32) + indices (uint16)
const posBytes = positions.length * 4;   // 3 floats per vertex
const norBytes = normals.length * 4;     // 3 floats per vertex
const idxBytes = indices.length * 2;     // 1 uint16 per index

// Pad each bufferView to 4-byte alignment
const posPadded = Math.ceil(posBytes / 4) * 4;
const norPadded = Math.ceil(norBytes / 4) * 4;
const idxPadded = Math.ceil(idxBytes / 4) * 4;

const totalBinLength = posPadded + norPadded + idxPadded;
const binBuffer = Buffer.alloc(totalBinLength, 0);

// Write positions
const posBuf = Buffer.from(Float32Array.from(positions).buffer);
posBuf.copy(binBuffer, 0);

// Write normals
const norBuf = Buffer.from(Float32Array.from(normals).buffer);
norBuf.copy(binBuffer, posPadded);

// Write indices
const idxBuf = Buffer.from(Uint16Array.from(indices).buffer);
idxBuf.copy(binBuffer, posPadded + norPadded);

// Compute bounding box for POSITION accessor
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);     maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
}

const gltfJson = {
    asset: { version: '2.0', generator: 'DroneEngage arrow.glb generator' },
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
            baseColorFactor: [1.0, 0.8, 0.0, 1.0],  // bright yellow-orange
            metallicFactor: 0.1,
            roughnessFactor: 0.5
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
            type: 'VEC3', max: [minX, minY, minZ], min: [maxX, maxY, maxZ]
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

// Note: glTF spec says min/max are the actual min/max values.
// Fix: min should be the smallest, max the largest.
gltfJson.accessors[0].min = [minX, minY, minZ];
gltfJson.accessors[0].max = [maxX, maxY, maxZ];

// Serialize JSON chunk (pad with spaces to 4-byte alignment)
let jsonStr = JSON.stringify(gltfJson);
let jsonBuf = Buffer.from(jsonStr, 'utf8');
const jsonPadded = Math.ceil(jsonBuf.length / 4) * 4;
if (jsonPadded > jsonBuf.length) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPadded - jsonBuf.length, 0x20)]);
}

// BIN chunk is already 4-byte aligned (totalBinLength is a multiple of 4)

// GLB header: magic(4) + version(4) + length(4) = 12 bytes
// + JSON chunk: length(4) + type(4) + data(jsonPadded)
// + BIN chunk:  length(4) + type(4) + data(totalBinLength)
const glbLength = 12 + 8 + jsonPadded + 8 + totalBinLength;
const glb = Buffer.alloc(glbLength, 0);

// Header
glb.writeUInt32LE(0x46546C67, 0);  // "glTF"
glb.writeUInt32LE(2, 4);            // version 2
glb.writeUInt32LE(glbLength, 8);    // total length

// JSON chunk
glb.writeUInt32LE(jsonPadded, 12);  // chunk length
glb.writeUInt32LE(0x4E4F534A, 16);  // "JSON"
jsonBuf.copy(glb, 20);

// BIN chunk
const binOffset = 20 + jsonPadded;
glb.writeUInt32LE(totalBinLength, binOffset);      // chunk length
glb.writeUInt32LE(0x004E4942, binOffset + 4);      // "BIN\0"
binBuffer.copy(glb, binOffset + 8);

// Write file
// Usage: node generate_arrow_glb.js [outputPath]
//   outputPath is resolved relative to CWD; defaults to
//   <repo>/public/models/arrow.glb
const outPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(__dirname, '..', 'public', 'models', 'arrow.glb');
fs.writeFileSync(outPath, glb);
console.log(`Generated ${outPath} (${glbLength} bytes, ${numVertices} vertices, ${numIndices} indices)`);
