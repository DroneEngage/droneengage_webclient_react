#!/usr/bin/env node
/**
 * Generates a simple flat plane-shaped 3D model (.glb) with:
 *   - Flat fuselage body (pointing along -Z, North at yaw=0)
 *   - Two wings extending left/right (along X axis)
 *   - A vertical fin on top (along Y axis, at the tail)
 *
 * Y-up glTF convention.  -Z = forward (North), +X = right (East), +Y = up.
 * In Mapbox GL model layers, at orientation [0,0,0] the model's -Z points
 * North and yaw rotates clockwise — matching MAVLink yaw convention.
 *
 * Output: public/models/plane.glb
 */

const fs = require('fs');
const path = require('path');

// ---- Geometry parameters (model-space units) ----
const FUSE_LEN   = 3.0;   // nose to tail length (along Z)
const FUSE_WID   = 0.4;   // fuselage width (along X)
const FUSE_THICK = 0.15;  // fuselage thickness (along Y)

const WING_SPAN  = 4.0;   // total wingspan (along X)
const WING_CHORD = 1.0;   // wing chord (along Z)
const WING_THICK = 0.08;  // wing thickness (along Y)

const FIN_HEIGHT = 1.0;   // fin height (along Y, above fuselage)
const FIN_CHORD  = 0.8;   // fin chord (along Z)
const FIN_THICK  = 0.06;  // fin thickness (along X)

// ---- Build geometry with flat normals (duplicated vertices per face) ----

const positions = [];
const normals = [];
const indices = [];

function pushQuad(a, b, c, d) {
    // Two triangles forming a quad: a-b-c and a-c-d
    // Compute face normal (CCW winding → outward)
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
    // 8 corners
    const v = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],  // front  (z0)
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],  // back   (z1)
    ];
    // Faces (outward-facing CCW):
    pushQuad(v[0], v[3], v[2], v[1]);  // front  (z0, normal -Z)
    pushQuad(v[5], v[6], v[7], v[4]);  // back   (z1, normal +Z)
    pushQuad(v[4], v[7], v[3], v[0]);  // left   (x0, normal -X)
    pushQuad(v[1], v[2], v[6], v[5]);  // right  (x1, normal +X)
    pushQuad(v[4], v[5], v[1], v[0]);  // bottom (y0, normal -Y)
    pushQuad(v[3], v[7], v[6], v[2]);  // top    (y1, normal +Y)
}

// ---- Fuselage: flat box centered at origin, pointing -Z (nose) to +Z (tail) ----
// Nose at z = -FUSE_LEN/2, tail at z = +FUSE_LEN/2
const fy0 = -FUSE_THICK / 2, fy1 = FUSE_THICK / 2;
addBox(-FUSE_WID / 2, fy0, -FUSE_LEN / 2,
        FUSE_WID / 2, fy1,  FUSE_LEN / 2);

// ---- Wings: thin flat box, centered on fuselage, spanning full wingspan ----
// Wings are at the middle of the fuselage (z ≈ 0)
const wy0 = -WING_THICK / 2, wy1 = WING_THICK / 2;
const wz0 = -WING_CHORD / 2, wz1 = WING_CHORD / 2;
addBox(-WING_SPAN / 2, wy0, wz0,
        WING_SPAN / 2, wy1, wz1);

// ---- Vertical fin: thin box on top of fuselage at the tail ----
// Fin sits on top of fuselage (y = FUSE_THICK/2), extends up by FIN_HEIGHT
// Positioned at the tail end (z > 0)
const finZ0 = FUSE_LEN / 2 - FIN_CHORD;  // leading edge of fin
const finZ1 = FUSE_LEN / 2;              // trailing edge (at tail tip)
addBox(-FIN_THICK / 2, fy1, finZ0,
        FIN_THICK / 2, fy1 + FIN_HEIGHT, finZ1);

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
    asset: { version: '2.0', generator: 'DroneEngage plane.glb generator' },
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
            baseColorFactor: [1.0, 0.85, 0.0, 1.0],  // bright yellow
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

const outPath = path.join(__dirname, '..', 'public', 'models', 'plane.glb');
fs.writeFileSync(outPath, glb);
console.log(`Generated ${outPath} (${glbLength} bytes, ${numVertices} vertices, ${numIndices} indices)`);
console.log(`Bounds: X[${minX}, ${maxX}]  Y[${minY}, ${maxY}]  Z[${minZ}, ${maxZ}]`);
