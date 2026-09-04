#!/usr/bin/env node
/**
 * Generates a simple boat 3D model (.glb) with:
 *   - Pentagonal-prism hull: a rectangular box at the stern joined to a
 *     triangular section narrowing to a point at the bow. Both sections
 *     are at the same Y level, forming one continuous shape (pentagon in
 *     the X-Z top-down plane, extruded in Y).
 *   - Box cabin on top of the hull (centered toward the stern)
 *   - Thin flat metal sheet on top of the cabin (roof/deck plate)
 *
 * Three materials so hull, cabin, and metal sheet can each have their
 * own baked-in color:
 *   - "hull"    material: triangular-prism board
 *   - "cabin"   material: box cabin
 *   - "metal"   material: thin sheet on top
 *
 * Y-up glTF convention.  -Z = forward (North), +X = right (East), +Y = up.
 * At orientation [0,0,0] the model's -Z points North and yaw rotates
 * clockwise — matching MAVLink yaw convention (see js_map3d.js).
 *
 * Output: public/models/boat.glb
 *
 * CLI: node scripts/generate_boat_glb.js [outPath] [--hull=#RRGGBB] [--cabin=#RRGGBB] [--metal=#RRGGBB]
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONTROL PARAMETERS — edit these to change the model. Everything below this
// block is geometry/build logic and should not normally need editing.
// ============================================================================

// ---- Hull (pentagonal prism: rectangular stern + triangular bow) ----
// Top-down outline is a pentagon — a box at the stern joined to a triangle
// that narrows to a point at the bow. Both at the same Y level, one shape.
const HULL_LEN   = 4.0;   // bow-to-stern length (along Z)
const HULL_WID   = 1.6;   // hull width (along X)
const HULL_THICK = 0.4;   // hull thickness (along Y), sits on ground at y=0
const HULL_BOX_LEN = 2.4; // length of the rectangular (stern) section;
                          // the remaining (HULL_LEN - HULL_BOX_LEN) is the
                          // triangular bow section narrowing to a point

// ---- Cabin (box on top of hull, toward the stern) ----
const CABIN_LEN   = 1.2;  // cabin length (along Z)
const CABIN_WID   = 1.0;  // cabin width (along X)
const CABIN_HGT   = 0.6;  // cabin height above the hull
const CABIN_Z_CENTER = 0.6; // cabin center offset along Z (toward stern)

// ---- Metal sheet (thin flat box on top of the cabin) ----
const SHEET_LEN   = 1.4;  // slightly overhangs the cabin in Z
const SHEET_WID   = 1.2;  // slightly overhangs the cabin in X
const SHEET_THICK = 0.05; // thin plate

// ---- Materials (RGBA baseColorFactor + PBR metallic/roughness) ----
// Override via CLI: --hull=#RRGGBB --cabin=#RRGGBB --metal=#RRGGBB
const DEFAULT_HULL_COLOR  = [0.85, 0.75, 0.45, 1.0];  // warm wood/tan
const HULL_METAL  = 0.1;
const HULL_ROUGH  = 0.7;

const DEFAULT_CABIN_COLOR = [0.90, 0.90, 0.92, 1.0];  // off-white
const CABIN_METAL = 0.2;
const CABIN_ROUGH = 0.5;

const DEFAULT_METAL_COLOR = [0.70, 0.72, 0.75, 1.0];  // brushed metal gray
const METAL_METAL = 0.9;
const METAL_ROUGH = 0.3;

// Runtime overrides (filled by parseCliColors below).
let HULL_COLOR  = DEFAULT_HULL_COLOR.slice();
let CABIN_COLOR = DEFAULT_CABIN_COLOR.slice();
let METAL_COLOR = DEFAULT_METAL_COLOR.slice();

// ---- Output ----
const DEFAULT_OUT = path.join(__dirname, '..', 'public', 'models', 'boat.glb');

// ============================================================================
// BUILD — no user-tunable constants below this line.
// ============================================================================

function makeGeom() { return { positions: [], normals: [], indices: [] }; }
const hullGeom  = makeGeom();
const cabinGeom = makeGeom();
const sheetGeom = makeGeom();

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

function pushTri(geom, a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    const base = geom.positions.length / 3;
    geom.positions.push(a[0], a[1], a[2],  b[0], b[1], b[2],  c[0], c[1], c[2]);
    geom.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    geom.indices.push(base, base + 1, base + 2);
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

// Extrude a polygon (defined as array of [x, z] vertices, CCW from above)
// along Y from y0 to y1, producing a prism with proper outward normals.
function extrudePolygon(geom, polygon, y0, y1) {
    const n = polygon.length;
    // Top face (y1, normal +Y): fan triangulation in CCW order
    for (let i = 1; i < n - 1; i++) {
        pushTri(geom,
            [polygon[0][0], y1, polygon[0][1]],
            [polygon[i][0],   y1, polygon[i][1]],
            [polygon[i+1][0], y1, polygon[i+1][1]]
        );
    }
    // Bottom face (y0, normal -Y): reversed order
    for (let i = n - 2; i >= 1; i--) {
        pushTri(geom,
            [polygon[0][0],   y0, polygon[0][1]],
            [polygon[i+1][0], y0, polygon[i+1][1]],
            [polygon[i][0],   y0, polygon[i][1]]
        );
    }
    // Side faces: one quad per edge
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        pushQuad(geom,
            [polygon[i][0], y0, polygon[i][1]],  // bottom current
            [polygon[j][0], y0, polygon[j][1]],  // bottom next
            [polygon[j][0], y1, polygon[j][1]],  // top next
            [polygon[i][0], y1, polygon[i][1]]   // top current
        );
    }
}

// ---- Hull: pentagonal prism (rectangular stern + triangular bow) ----
// Top-down pentagon outline (CCW from above), extruded in Y:
//
//       bow (point, -Z)
//        /\
//       /  \
//      /    \  ← triangular bow section
//     /      \
//    /        \
//   +----------+   ← z = boxFrontZ (box meets triangle)
//   |          |   ← rectangular stern section
//   |          |
//   +----------+   ← z = sternZ (stern, +Z)
//
const sternZ     = HULL_LEN / 2;
const bowZ       = -HULL_LEN / 2;
const boxFrontZ  = sternZ - HULL_BOX_LEN;
const halfW      = HULL_WID / 2;

// Pentagon vertices [x, z], CCW when viewed from above (+Y looking down):
//   stern-left → stern-right → box-front-right → bow → box-front-left
const hullPoly = [
    [-halfW, sternZ],     // 0: stern-left
    [ halfW, sternZ],     // 1: stern-right
    [ halfW, boxFrontZ],  // 2: box front-right (triangle starts here)
    [ 0,     bowZ],       // 3: bow point
    [-halfW, boxFrontZ],  // 4: box front-left (triangle starts here)
];

extrudePolygon(hullGeom, hullPoly, 0, HULL_THICK);

// ---- Cabin: box on top of the hull, offset toward the stern ----
const cabY0 = HULL_THICK;
const cabY1 = HULL_THICK + CABIN_HGT;
addBox(cabinGeom,
    -CABIN_WID / 2, cabY0, CABIN_Z_CENTER - CABIN_LEN / 2,
     CABIN_WID / 2, cabY1, CABIN_Z_CENTER + CABIN_LEN / 2);

// ---- Metal sheet: thin flat box on top of the cabin ----
const sheetY0 = cabY1;
const sheetY1 = cabY1 + SHEET_THICK;
addBox(sheetGeom,
    -SHEET_WID / 2, sheetY0, CABIN_Z_CENTER - SHEET_LEN / 2,
     SHEET_WID / 2, sheetY1, CABIN_Z_CENTER + SHEET_LEN / 2);

// ---- Parse CLI overrides ----
// Supports:
//   node scripts/generate_boat_glb.js [outPath] [--hull=#RRGGBB] [--cabin=#RRGGBB] [--metal=#RRGGBB]
// If a color is omitted it keeps the default. Hex values are treated as sRGB
// and converted to linear for glTF.
function srgbToLinear(v) {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseColorArg(str) {
    const hexMatch = str.match(/^#?([0-9a-fA-F]{6})$/);
    if (hexMatch) {
        const r = parseInt(hexMatch[1].substr(0, 2), 16);
        const g = parseInt(hexMatch[1].substr(2, 2), 16);
        const b = parseInt(hexMatch[1].substr(4, 2), 16);
        return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b), 1.0];
    }
    const parts = str.split(',').map(x => parseFloat(x.trim()));
    if (parts.length >= 3) {
        return [parts[0], parts[1], parts[2], parts[3] !== undefined ? parts[3] : 1.0];
    }
    throw new Error(`Invalid color: ${str}`);
}

let outPath = null;
for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const m = arg.match(/^--(hull|cabin|metal)=(.*)$/);
    if (m) {
        const color = parseColorArg(m[2]);
        if (m[1] === 'hull') HULL_COLOR = color;
        if (m[1] === 'cabin') CABIN_COLOR = color;
        if (m[1] === 'metal') METAL_COLOR = color;
    } else if (!outPath) {
        outPath = arg;
    } else {
        throw new Error(`Unexpected argument: ${arg}`);
    }
}
if (!outPath) outPath = DEFAULT_OUT;

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

const hullPacked  = packGeom(hullGeom);
const cabinPacked = packGeom(cabinGeom);
const sheetPacked = packGeom(sheetGeom);

const binBuffer = Buffer.concat([hullPacked.buffer, cabinPacked.buffer, sheetPacked.buffer]);
const hullBase  = 0;
const cabinBase = hullPacked.totalLength;
const sheetBase = hullPacked.totalLength + cabinPacked.totalLength;

const gltfJson = {
    asset: { version: '2.0', generator: 'DroneEngage boat.glb generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
        primitives: [
            { attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 },  // hull
            { attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 1 },  // cabin
            { attributes: { POSITION: 6, NORMAL: 7 }, indices: 8, material: 2 }   // metal sheet
        ]
    }],
    materials: [
        {
            name: 'hull',
            pbrMetallicRoughness: {
                baseColorFactor: HULL_COLOR,
                metallicFactor: HULL_METAL,
                roughnessFactor: HULL_ROUGH
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
            name: 'metal',
            pbrMetallicRoughness: {
                baseColorFactor: METAL_COLOR,
                metallicFactor: METAL_METAL,
                roughnessFactor: METAL_ROUGH
            },
            doubleSided: true
        }
    ],
    buffers: [{ byteLength: binBuffer.length }],
    bufferViews: [
        { buffer: 0, byteOffset: hullBase, byteLength: hullPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: hullBase + hullPacked.posPadded, byteLength: hullPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: hullBase + hullPacked.posPadded + hullPacked.norPadded, byteLength: hullPacked.idxBytes, target: 34963 },
        { buffer: 0, byteOffset: cabinBase, byteLength: cabinPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: cabinBase + cabinPacked.posPadded, byteLength: cabinPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: cabinBase + cabinPacked.posPadded + cabinPacked.norPadded, byteLength: cabinPacked.idxBytes, target: 34963 },
        { buffer: 0, byteOffset: sheetBase, byteLength: sheetPacked.posBytes, target: 34962 },
        { buffer: 0, byteOffset: sheetBase + sheetPacked.posPadded, byteLength: sheetPacked.norBytes, target: 34962 },
        { buffer: 0, byteOffset: sheetBase + sheetPacked.posPadded + sheetPacked.norPadded, byteLength: sheetPacked.idxBytes, target: 34963 }
    ],
    accessors: [
        { bufferView: 0, componentType: 5126, count: hullPacked.numVertices, type: 'VEC3',
          min: [hullPacked.bounds.minX, hullPacked.bounds.minY, hullPacked.bounds.minZ],
          max: [hullPacked.bounds.maxX, hullPacked.bounds.maxY, hullPacked.bounds.maxZ] },
        { bufferView: 1, componentType: 5126, count: hullPacked.numVertices, type: 'VEC3' },
        { bufferView: 2, componentType: 5123, count: hullPacked.numIndices, type: 'SCALAR' },
        { bufferView: 3, componentType: 5126, count: cabinPacked.numVertices, type: 'VEC3',
          min: [cabinPacked.bounds.minX, cabinPacked.bounds.minY, cabinPacked.bounds.minZ],
          max: [cabinPacked.bounds.maxX, cabinPacked.bounds.maxY, cabinPacked.bounds.maxZ] },
        { bufferView: 4, componentType: 5126, count: cabinPacked.numVertices, type: 'VEC3' },
        { bufferView: 5, componentType: 5123, count: cabinPacked.numIndices, type: 'SCALAR' },
        { bufferView: 6, componentType: 5126, count: sheetPacked.numVertices, type: 'VEC3',
          min: [sheetPacked.bounds.minX, sheetPacked.bounds.minY, sheetPacked.bounds.minZ],
          max: [sheetPacked.bounds.maxX, sheetPacked.bounds.maxY, sheetPacked.bounds.maxZ] },
        { bufferView: 7, componentType: 5126, count: sheetPacked.numVertices, type: 'VEC3' },
        { bufferView: 8, componentType: 5123, count: sheetPacked.numIndices, type: 'SCALAR' }
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

const resolvedOutPath = path.resolve(outPath);
fs.writeFileSync(resolvedOutPath, glb);
console.log(`Generated ${resolvedOutPath} (${glbLength} bytes)`);
console.log(`Hull:   ${hullPacked.numVertices} vertices, ${hullPacked.numIndices} indices`);
console.log(`Cabin:  ${cabinPacked.numVertices} vertices, ${cabinPacked.numIndices} indices`);
console.log(`Sheet:  ${sheetPacked.numVertices} vertices, ${sheetPacked.numIndices} indices`);
