#!/usr/bin/env node
/**
 * Generates a simple flat plane-shaped 3D model (.glb) with:
 *   - Flat fuselage body (pointing along -Z, North at yaw=0)
 *   - Two wings extending left/right (along X axis)
 *   - A cockpit window strip on top of the fuselage near the nose
 *   - A vertical fin on top (along Y axis, at the tail)
 *
 * Three separate materials so fuselage, windows, and fin can each have
 * their own baked-in color:
 *   - "fuselage" material: fuselage body + wings
 *   - "windows"   material: cockpit window strip
 *   - "fin"       material: vertical fin
 *
 * Y-up glTF convention.  -Z = forward (North), +X = right (East), +Y = up.
 * In Mapbox GL model layers, at orientation [0,0,0] the model's -Z points
 * North and yaw rotates clockwise — matching MAVLink yaw convention.
 *
 * Output: public/models/plane.glb
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONTROL PARAMETERS — edit these to change the model. Everything below this
// block is geometry/build logic and should not normally need editing.
// ============================================================================

// ---- Geometry (model-space units) ----
const FUSE_LEN   = 3.0;   // nose to tail length (along Z)
const FUSE_WID   = 0.4;   // fuselage width (along X)
const FUSE_THICK = 0.15;  // fuselage thickness (along Y)

const WING_SPAN  = 4.0;   // total wingspan (along X)
const WING_CHORD = 0.7;   // wing chord (along Z)
const WING_THICK = 0.08;  // wing thickness (along Y)

const WIN_LEN    = 0.8;   // cockpit window strip length (along Z)
const WIN_WID    = 0.28;  // cockpit window strip width (along X)
const WIN_THICK  = 0.04;  // cockpit window strip height (along Y)
const WIN_Z_OFFSET = 0.15; // distance behind the nose where the window strip starts

const FIN_HEIGHT = 0.50;  // fin height (along Y, above fuselage)
const FIN_CHORD  = 0.4;   // fin chord (along Z)
const FIN_THICK  = 0.06;  // fin thickness (along X)

// ---- Materials (RGBA baseColorFactor + PBR metallic/roughness) ----
const FUSE_COLOR = [1.0, 0.85, 0.0, 1.0];   // bright yellow
const FUSE_METAL = 0.4;
const FUSE_ROUGH = 0.5;

const WIN_COLOR  = [0.10, 0.30, 0.55, 1.0]; // dark tinted blue
const WIN_METAL  = 0.4;
const WIN_ROUGH  = 0.25;

const FIN_COLOR  = [0.85, 0.12, 0.08, 1.0]; // red accent
const FIN_METAL  = 0.1;
const FIN_ROUGH  = 0.5;

// ---- Output ----
const DEFAULT_OUT = path.join(__dirname, '..', 'public', 'models', 'plane.glb');

// ============================================================================
// BUILD — no user-tunable constants below this line.
// ============================================================================

// ---- Three independent geometry buffers (one per material) ----

function makeGeom() { return { positions: [], normals: [], indices: [] }; }
const fuseGeom = makeGeom();  // fuselage + wings
const winGeom  = makeGeom();  // cockpit windows
const finGeom  = makeGeom();  // vertical fin

function pushQuad(geom, a, b, c, d) {
    // Two triangles forming a quad: a-b-c and a-c-d
    // Compute face normal (CCW winding → outward)
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

// Helper to build a box (rectangular prism) from min/max corners
function addBox(geom, x0, y0, z0, x1, y1, z1) {
    // 8 corners
    const v = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],  // front  (z0)
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],  // back   (z1)
    ];
    // Faces (outward-facing CCW):
    pushQuad(geom, v[0], v[3], v[2], v[1]);  // front  (z0, normal -Z)
    pushQuad(geom, v[5], v[6], v[7], v[4]);  // back   (z1, normal +Z)
    pushQuad(geom, v[4], v[7], v[3], v[0]);  // left   (x0, normal -X)
    pushQuad(geom, v[1], v[2], v[6], v[5]);  // right  (x1, normal +X)
    pushQuad(geom, v[4], v[5], v[1], v[0]);  // bottom (y0, normal -Y)
    pushQuad(geom, v[3], v[7], v[6], v[2]);  // top    (y1, normal +Y)
}

// ---- Fuselage: flat box centered at origin, pointing -Z (nose) to +Z (tail) ----
// Nose at z = -FUSE_LEN/2, tail at z = +FUSE_LEN/2
const fy0 = -FUSE_THICK / 2, fy1 = FUSE_THICK / 2;
addBox(fuseGeom,
    -FUSE_WID / 2, fy0, -FUSE_LEN / 2,
     FUSE_WID / 2, fy1,  FUSE_LEN / 2);

// ---- Wings: thin flat box, centered on fuselage, spanning full wingspan ----
// Wings are at the middle of the fuselage (z ≈ 0)
const wy0 = -WING_THICK / 2, wy1 = WING_THICK / 2;
const wz0 = -WING_CHORD / 2, wz1 = WING_CHORD / 2;
addBox(fuseGeom,
    -WING_SPAN / 2, wy0, wz0,
     WING_SPAN / 2, wy1, wz1);

// ---- Cockpit window strip: thin box on top of the fuselage near the nose ----
const winZ0 = -FUSE_LEN / 2 + WIN_Z_OFFSET;   // just behind the nose
const winZ1 = winZ0 + WIN_LEN;
addBox(winGeom,
    -WIN_WID / 2, fy1, winZ0,
     WIN_WID / 2, fy1 + WIN_THICK, winZ1);

// ---- Vertical fin: thin box on top of fuselage at the tail ----
// Fin sits on top of fuselage (y = FUSE_THICK/2), extends up by FIN_HEIGHT
// Positioned at the tail end (z > 0)
const finZ0 = FUSE_LEN / 2 - FIN_CHORD;  // leading edge of fin
const finZ1 = FUSE_LEN / 2;              // trailing edge (at tail tip)
addBox(finGeom,
    -FIN_THICK / 2, fy1, finZ0,
     FIN_THICK / 2, fy1 + FIN_HEIGHT, finZ1);

// ---- Pack all three geometries into one GLB (3 primitives, 3 materials) ----

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

const fusePacked = packGeom(fuseGeom);
const winPacked  = packGeom(winGeom);
const finPacked  = packGeom(finGeom);

const binBuffer = Buffer.concat([fusePacked.buffer, winPacked.buffer, finPacked.buffer]);
const fuseBase = 0;
const winBase  = fusePacked.totalLength;
const finBase  = fusePacked.totalLength + winPacked.totalLength;

const gltfJson = {
    asset: { version: '2.0', generator: 'DroneEngage plane.glb generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
        primitives: [
            { attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 },  // fuselage + wings
            { attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 1 },  // windows
            { attributes: { POSITION: 6, NORMAL: 7 }, indices: 8, material: 2 }   // fin
        ]
    }],
    materials: [
        {
            name: 'fuselage',
            pbrMetallicRoughness: {
                baseColorFactor: FUSE_COLOR,
                metallicFactor: FUSE_METAL,
                roughnessFactor: FUSE_ROUGH
            },
            doubleSided: true
        },
        {
            name: 'windows',
            pbrMetallicRoughness: {
                baseColorFactor: WIN_COLOR,
                metallicFactor: WIN_METAL,
                roughnessFactor: WIN_ROUGH
            },
            doubleSided: true
        },
        {
            name: 'fin',
            pbrMetallicRoughness: {
                baseColorFactor: FIN_COLOR,
                metallicFactor: FIN_METAL,
                roughnessFactor: FIN_ROUGH
            },
            doubleSided: true
        }
    ],
    buffers: [{ byteLength: binBuffer.length }],
    bufferViews: [
        { buffer: 0, byteOffset: fuseBase, byteLength: fusePacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: fuseBase + fusePacked.posPadded, byteLength: fusePacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: fuseBase + fusePacked.posPadded + fusePacked.norPadded, byteLength: fusePacked.idxBytes, target: 34963 },
        { buffer: 0, byteOffset: winBase, byteLength: winPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: winBase + winPacked.posPadded, byteLength: winPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: winBase + winPacked.posPadded + winPacked.norPadded, byteLength: winPacked.idxBytes, target: 34963 },
        { buffer: 0, byteOffset: finBase, byteLength: finPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: finBase + finPacked.posPadded, byteLength: finPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: finBase + finPacked.posPadded + finPacked.norPadded, byteLength: finPacked.idxBytes, target: 34963 }
    ],
    accessors: [
        { bufferView: 0, componentType: 5126, count: fusePacked.numVertices, type: 'VEC3',
          min: [fusePacked.bounds.minX, fusePacked.bounds.minY, fusePacked.bounds.minZ],
          max: [fusePacked.bounds.maxX, fusePacked.bounds.maxY, fusePacked.bounds.maxZ] },
        { bufferView: 1, componentType: 5126, count: fusePacked.numVertices, type: 'VEC3' },
        { bufferView: 2, componentType: 5123, count: fusePacked.numIndices, type: 'SCALAR' },
        { bufferView: 3, componentType: 5126, count: winPacked.numVertices, type: 'VEC3',
          min: [winPacked.bounds.minX, winPacked.bounds.minY, winPacked.bounds.minZ],
          max: [winPacked.bounds.maxX, winPacked.bounds.maxY, winPacked.bounds.maxZ] },
        { bufferView: 4, componentType: 5126, count: winPacked.numVertices, type: 'VEC3' },
        { bufferView: 5, componentType: 5123, count: winPacked.numIndices, type: 'SCALAR' },
        { bufferView: 6, componentType: 5126, count: finPacked.numVertices, type: 'VEC3',
          min: [finPacked.bounds.minX, finPacked.bounds.minY, finPacked.bounds.minZ],
          max: [finPacked.bounds.maxX, finPacked.bounds.maxY, finPacked.bounds.maxZ] },
        { bufferView: 7, componentType: 5126, count: finPacked.numVertices, type: 'VEC3' },
        { bufferView: 8, componentType: 5123, count: finPacked.numIndices, type: 'SCALAR' }
    ]
};

// Serialize JSON chunk (pad to 4-byte alignment)
let jsonStr = JSON.stringify(gltfJson);
let jsonBuf = Buffer.from(jsonStr, 'utf8');
const jsonPadded = Math.ceil(jsonBuf.length / 4) * 4;
if (jsonPadded > jsonBuf.length) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPadded - jsonBuf.length, 0x20)]);
}

const glbLength = 12 + 8 + jsonPadded + 8 + binBuffer.length;
const glb = Buffer.alloc(glbLength, 0);

glb.writeUInt32LE(0x46546C67, 0);  // "glTF"
glb.writeUInt32LE(2, 4);            // version 2
glb.writeUInt32LE(glbLength, 8);    // total length

glb.writeUInt32LE(jsonPadded, 12);
glb.writeUInt32LE(0x4E4F534A, 16);  // "JSON"
jsonBuf.copy(glb, 20);

const binOffset = 20 + jsonPadded;
glb.writeUInt32LE(binBuffer.length, binOffset);
glb.writeUInt32LE(0x004E4942, binOffset + 4);  // "BIN\0"
binBuffer.copy(glb, binOffset + 8);

// Usage: node generate_plane_glb.js [outputPath]
//   outputPath is resolved relative to CWD; defaults to DEFAULT_OUT above.
const outPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_OUT;
fs.writeFileSync(outPath, glb);
console.log(`Generated ${outPath} (${glbLength} bytes)`);
console.log(`Fuselage: ${fusePacked.numVertices} vertices, ${fusePacked.numIndices} indices`);
console.log(`Windows:  ${winPacked.numVertices} vertices, ${winPacked.numIndices} indices`);
console.log(`Fin:      ${finPacked.numVertices} vertices, ${finPacked.numIndices} indices`);
