#!/usr/bin/env node
/**
 * Generates a simple car/rover 3D model (.glb) with:
 *   - Chassis body box (pointing along -Z, North at yaw=0)
 *   - Cabin box on top of the chassis (shorter, its own material/color)
 *   - Four wheels at the corners (separate dark material, distinct from
 *     the body)
 *
 * Three materials so body, cabin, and wheels can each have their own
 * baked-in color:
 *   - "body"   material: chassis
 *   - "cabin"  material: cabin on top of the chassis
 *   - "wheels" material: the four wheels
 *
 * Y-up glTF convention.  -Z = forward (North), +X = right (East), +Y = up.
 * At orientation [0,0,0] the model's -Z points North and yaw rotates
 * clockwise — matching MAVLink yaw convention (see js_map3d.js).
 *
 * Output: public/models/car.glb
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONTROL PARAMETERS — edit these to change the model. Everything below this
// block is geometry/build logic and should not normally need editing.
// ============================================================================

// ---- Chassis (main body box) ----
const BODY_LEN   = 3.0;   // nose to tail length (along Z)
const BODY_WID   = 1.4;   // body width (along X)
const BODY_HGT   = 0.5;   // body height (along Y), sits on ground at y=0

// ---- Cabin (box on top of chassis, shorter) ----
const CABIN_LEN   = 1.6;  // cabin length (along Z), centered on body
const CABIN_WID   = 1.2;  // cabin width (along X)
const CABIN_HGT   = 0.5;  // cabin height above the chassis

// ---- Wheels (square-profile boxes, axis along X) ----
const WHEEL_WID  = 0.3;   // wheel thickness along X (tire width)
const WHEEL_RAD  = 0.35;  // wheel radius → height & depth = 2*RAD
const WHEEL_INSET_X = 0.05; // how far the wheel pokes out beyond the body side
const WHEEL_INSET_Z = 0.4;  // distance from nose/tail to wheel center (along Z)

// ---- Materials (RGBA baseColorFactor + PBR metallic/roughness) ----
const BODY_COLOR = [0.85, 0.10, 0.08, 1.0];   // red
const BODY_METAL = 0.3;
const BODY_ROUGH = 0.5;

const CABIN_COLOR = [0.10, 0.30, 0.55, 1.0];   // dark tinted blue
const CABIN_METAL = 0.4;
const CABIN_ROUGH = 0.25;

const WHEEL_COLOR = [0.05, 0.05, 0.05, 1.0];  // near-black
const WHEEL_METAL = 0.1;
const WHEEL_ROUGH = 0.8;

// ---- Output ----
const DEFAULT_OUT = path.join(__dirname, '..', 'public', 'models', 'car.glb');

// ============================================================================
// BUILD — no user-tunable constants below this line.
// ============================================================================

function makeGeom() { return { positions: [], normals: [], indices: [] }; }
const bodyGeom  = makeGeom();  // chassis
const cabinGeom = makeGeom();  // cabin
const wheelGeom = makeGeom();  // wheels

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

function addBox(geom, x0, y0, z0, x1, y1, z1) {
    const v = [
        [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],  // front  (z0)
        [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],  // back   (z1)
    ];
    pushQuad(geom, v[0], v[3], v[2], v[1]);  // front  (z0, normal -Z)
    pushQuad(geom, v[5], v[6], v[7], v[4]);  // back   (z1, normal +Z)
    pushQuad(geom, v[4], v[7], v[3], v[0]);  // left   (x0, normal -X)
    pushQuad(geom, v[1], v[2], v[6], v[5]);  // right  (x1, normal +X)
    pushQuad(geom, v[4], v[5], v[1], v[0]);  // bottom (y0, normal -Y)
    pushQuad(geom, v[3], v[7], v[6], v[2]);  // top    (y1, normal +Y)
}

// ---- Chassis: box sitting on the ground, centered on origin (X/Z) ----
addBox(bodyGeom,
    -BODY_WID / 2, 0, -BODY_LEN / 2,
     BODY_WID / 2, BODY_HGT, BODY_LEN / 2);

// ---- Cabin: shorter box on top of the chassis, centered (own material) ----
const cabY0 = BODY_HGT;
const cabY1 = BODY_HGT + CABIN_HGT;
addBox(cabinGeom,
    -CABIN_WID / 2, cabY0, -CABIN_LEN / 2,
     CABIN_WID / 2, cabY1,  CABIN_LEN / 2);

// ---- Four wheels: square-profile boxes at the corners ----
// Wheels sit at ground level (y = 0 .. 2*RAD), centered on the wheel radius.
// They poke out slightly beyond the body sides (WHEEL_INSET_X).
const wheelX0 = BODY_WID / 2 + WHEEL_INSET_X;
const wheelX1 = wheelX0 + WHEEL_WID;
const wheelZFront = -BODY_LEN / 2 + WHEEL_INSET_Z;
const wheelZRear  =  BODY_LEN / 2 - WHEEL_INSET_Z;

// Front-left
addBox(wheelGeom,
    -wheelX1, 0, wheelZFront - WHEEL_RAD,
    -wheelX0, 2 * WHEEL_RAD, wheelZFront + WHEEL_RAD);
// Front-right
addBox(wheelGeom,
     wheelX0, 0, wheelZFront - WHEEL_RAD,
     wheelX1, 2 * WHEEL_RAD, wheelZFront + WHEEL_RAD);
// Rear-left
addBox(wheelGeom,
    -wheelX1, 0, wheelZRear - WHEEL_RAD,
    -wheelX0, 2 * WHEEL_RAD, wheelZRear + WHEEL_RAD);
// Rear-right
addBox(wheelGeom,
     wheelX0, 0, wheelZRear - WHEEL_RAD,
     wheelX1, 2 * WHEEL_RAD, wheelZRear + WHEEL_RAD);

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

const bodyPacked  = packGeom(bodyGeom);
const cabinPacked = packGeom(cabinGeom);
const wheelPacked = packGeom(wheelGeom);

const binBuffer = Buffer.concat([bodyPacked.buffer, cabinPacked.buffer, wheelPacked.buffer]);
const bodyBase  = 0;
const cabinBase = bodyPacked.totalLength;
const wheelBase = bodyPacked.totalLength + cabinPacked.totalLength;

const gltfJson = {
    asset: { version: '2.0', generator: 'DroneEngage car.glb generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
        primitives: [
            { attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 },  // chassis
            { attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 1 },  // cabin
            { attributes: { POSITION: 6, NORMAL: 7 }, indices: 8, material: 2 }   // wheels
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
            name: 'cabin',
            pbrMetallicRoughness: {
                baseColorFactor: CABIN_COLOR,
                metallicFactor: CABIN_METAL,
                roughnessFactor: CABIN_ROUGH
            },
            doubleSided: true
        },
        {
            name: 'wheels',
            pbrMetallicRoughness: {
                baseColorFactor: WHEEL_COLOR,
                metallicFactor: WHEEL_METAL,
                roughnessFactor: WHEEL_ROUGH
            },
            doubleSided: true
        }
    ],
    buffers: [{ byteLength: binBuffer.length }],
    bufferViews: [
        { buffer: 0, byteOffset: bodyBase, byteLength: bodyPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: bodyBase + bodyPacked.posPadded, byteLength: bodyPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: bodyBase + bodyPacked.posPadded + bodyPacked.norPadded, byteLength: bodyPacked.idxBytes, target: 34963 },
        { buffer: 0, byteOffset: cabinBase, byteLength: cabinPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: cabinBase + cabinPacked.posPadded, byteLength: cabinPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: cabinBase + cabinPacked.posPadded + cabinPacked.norPadded, byteLength: cabinPacked.idxBytes, target: 34963 },
        { buffer: 0, byteOffset: wheelBase, byteLength: wheelPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: wheelBase + wheelPacked.posPadded, byteLength: wheelPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: wheelBase + wheelPacked.posPadded + wheelPacked.norPadded, byteLength: wheelPacked.idxBytes, target: 34963 }
    ],
    accessors: [
        { bufferView: 0, componentType: 5126, count: bodyPacked.numVertices, type: 'VEC3',
          min: [bodyPacked.bounds.minX, bodyPacked.bounds.minY, bodyPacked.bounds.minZ],
          max: [bodyPacked.bounds.maxX, bodyPacked.bounds.maxY, bodyPacked.bounds.maxZ] },
        { bufferView: 1, componentType: 5126, count: bodyPacked.numVertices, type: 'VEC3' },
        { bufferView: 2, componentType: 5123, count: bodyPacked.numIndices, type: 'SCALAR' },
        { bufferView: 3, componentType: 5126, count: cabinPacked.numVertices, type: 'VEC3',
          min: [cabinPacked.bounds.minX, cabinPacked.bounds.minY, cabinPacked.bounds.minZ],
          max: [cabinPacked.bounds.maxX, cabinPacked.bounds.maxY, cabinPacked.bounds.maxZ] },
        { bufferView: 4, componentType: 5126, count: cabinPacked.numVertices, type: 'VEC3' },
        { bufferView: 5, componentType: 5123, count: cabinPacked.numIndices, type: 'SCALAR' },
        { bufferView: 6, componentType: 5126, count: wheelPacked.numVertices, type: 'VEC3',
          min: [wheelPacked.bounds.minX, wheelPacked.bounds.minY, wheelPacked.bounds.minZ],
          max: [wheelPacked.bounds.maxX, wheelPacked.bounds.maxY, wheelPacked.bounds.maxZ] },
        { bufferView: 7, componentType: 5126, count: wheelPacked.numVertices, type: 'VEC3' },
        { bufferView: 8, componentType: 5123, count: wheelPacked.numIndices, type: 'SCALAR' }
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

// Usage: node generate_car_glb.js [outputPath]
//   outputPath is resolved relative to CWD; defaults to DEFAULT_OUT above.
const outPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_OUT;
fs.writeFileSync(outPath, glb);
console.log(`Generated ${outPath} (${glbLength} bytes)`);
console.log(`Body:    ${bodyPacked.numVertices} vertices, ${bodyPacked.numIndices} indices`);
console.log(`Cabin:   ${cabinPacked.numVertices} vertices, ${cabinPacked.numIndices} indices`);
console.log(`Wheels:  ${wheelPacked.numVertices} vertices, ${wheelPacked.numIndices} indices`);
