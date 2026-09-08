#!/usr/bin/env node
/**
 * Generates a simple rounded helicopter landing-pad ("H-pad") 3D model
 * (.glb) used to mark a drone's home position on the 3D map.
 *
 * The pad is a flat disc (low cylinder) sitting on the ground (y = 0)
 * with a raised "H" mark on top, plus a thin rim around the edge — the
 * classic helipad silhouette.
 *
 *   - Disc base:  flat cylinder, PAD_RADIUS wide, PAD_HEIGHT tall.
 *  - Rim:        thin ring wall around the disc edge.
 *  - H mark:     two vertical bars + one horizontal bar, raised above
 *                the disc surface (white, separate material).
 *
 * Y-up glTF convention.  Rotationally symmetric (no "forward" direction),
 * but still follows -Z-forward/+Y-up for consistency with the other
 * generators and js_map3d.js model-rotation handling.
 *
 * Output: public/models/homebase.glb
 */

const fs = require('fs');
const path = require('path');

// ---- Geometry parameters (model-space units) ----
const PAD_RADIUS   = 2.0;   // disc radius (X/Z plane)
const PAD_HEIGHT   = 0.10;  // disc thickness (Y)
const RIM_HEIGHT   = 0.12;  // rim wall height above the disc
const RIM_THICKNESS = 0.10; // rim wall thickness (radial)
const CYL_SEGMENTS = 48;    // disc/rim smoothness (more = rounder)

// "H" mark dimensions (sits on top of the disc, centered on origin)
const H_BAR_WIDTH  = 0.22;   // bar thickness (X for verticals, Y for horizontal)
const H_BAR_DEPTH  = 0.22;   // bar depth (Z)
const H_BAR_HEIGHT = 0.10;   // bar height above disc surface
const H_VERT_LEN   = 1.0;    // vertical bar length (Z)
const H_HORIZ_LEN  = 0.55;   // horizontal bar length (X)
const H_GAP        = 0.55;   // half-distance between the two verticals (X)

// ---- Build geometry with flat normals (duplicated vertices per face) ----

const positions = [];
const normals = [];
const indices = [];

// Two material groups: [0] = pad (disc + rim), [1] = H mark (white).
// We track the index offset where each group starts so we can split
// primitives per material.
const materialRanges = []; // { start, count, material }
let _groupStart = 0;

function beginGroup() { _groupStart = indices.length; }
function endGroup(material) {
    materialRanges.push({ start: _groupStart, count: indices.length - _groupStart, material });
}

function pushTriangle(a, b, c, nx, ny, nz) {
    const base = positions.length / 3;
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    indices.push(base, base + 1, base + 2);
}

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
        a[0], a[1], a[2], b[0], b[1], b[2],
        c[0], c[1], c[2], d[0], d[1], d[2]
    );
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
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

/**
 * Adds a flat cylinder (disc) centered at (cx, cz) in the X/Z plane,
 * from y=yBottom to y=yBottom+height, with the given radius.
 * Top and bottom are filled with triangle fans; the side is quads.
 */
function addDisc(cx, yBottom, cz, radius, height, segments) {
    const yTop = yBottom + height;

    // Pre-compute ring vertices at top and bottom.
    const ringBottom = [];
    const ringTop = [];
    for (let i = 0; i < segments; i++) {
        const a = (i / segments) * 2 * Math.PI;
        const x = cx + radius * Math.cos(a);
        const z = cz + radius * Math.sin(a);
        ringBottom.push([x, yBottom, z]);
        ringTop.push([x, yTop, z]);
    }

    // Top face (normal +Y) — triangle fan from center.
    const topCenter = [cx, yTop, cz];
    for (let i = 0; i < segments; i++) {
        const ni = (i + 1) % segments;
        pushTriangle(topCenter, ringTop[i], ringTop[ni], 0, 1, 0);
    }

    // Bottom face (normal -Y) — triangle fan from center (reversed winding).
    const botCenter = [cx, yBottom, cz];
    for (let i = 0; i < segments; i++) {
        const ni = (i + 1) % segments;
        pushTriangle(botCenter, ringBottom[ni], ringBottom[i], 0, -1, 0);
    }

    // Side wall (quads, outward normals).
    for (let i = 0; i < segments; i++) {
        const ni = (i + 1) % segments;
        const a = (i / segments) * 2 * Math.PI;
        const nx = Math.cos(a);
        const nz = Math.sin(a);
        // Manually push the side quad with the computed radial normal.
        const b = ringBottom[i], bn = ringBottom[ni], t = ringTop[i], tn = ringTop[ni];
        const base = positions.length / 3;
        positions.push(
            b[0], b[1], b[2], bn[0], bn[1], bn[2],
            tn[0], tn[1], tn[2], t[0], t[1], t[2]
        );
        normals.push(nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz);
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
}

/**
 * Adds a thin ring wall (rim) around the disc edge: a short cylinder
 * shell from inner radius to outer radius, sitting on top of the disc.
 */
function addRim(cx, yBottom, cz, innerR, outerR, height, segments) {
    const yTop = yBottom + height;

    const ringInnerBot = [], ringOuterBot = [];
    const ringInnerTop = [], ringOuterTop = [];
    for (let i = 0; i < segments; i++) {
        const a = (i / segments) * 2 * Math.PI;
        const xi = cx + innerR * Math.cos(a), zi = cz + innerR * Math.sin(a);
        const xo = cx + outerR * Math.cos(a), zo = cz + outerR * Math.sin(a);
        ringInnerBot.push([xi, yBottom, zi]);
        ringOuterBot.push([xo, yBottom, zo]);
        ringInnerTop.push([xi, yTop, zi]);
        ringOuterTop.push([xo, yTop, zo]);
    }

    for (let i = 0; i < segments; i++) {
        const ni = (i + 1) % segments;
        // Outer wall (+radial normal)
        pushQuad(ringOuterBot[i], ringOuterBot[ni], ringOuterTop[ni], ringOuterTop[i]);
        // Inner wall (-radial normal) — reversed winding
        pushQuad(ringInnerBot[ni], ringInnerBot[i], ringInnerTop[i], ringInnerTop[ni]);
        // Top ring face
        pushQuad(ringInnerTop[i], ringInnerTop[ni], ringOuterTop[ni], ringOuterTop[i]);
    }
}

// ---- Material 0: pad (disc + rim) — dark grey/green ----
beginGroup();
addDisc(0, 0, 0, PAD_RADIUS, PAD_HEIGHT, CYL_SEGMENTS);
addRim(0, PAD_HEIGHT, 0, PAD_RADIUS - RIM_THICKNESS, PAD_RADIUS, RIM_HEIGHT, CYL_SEGMENTS);
endGroup(0);

// ---- Material 1: "H" mark — white, raised above the disc surface ----
const hY0 = PAD_HEIGHT;             // sit on top of the disc
const hY1 = hY0 + H_BAR_HEIGHT;     // top of the H bars
const hZCenter = 0;
beginGroup();
// Two vertical bars (along Z)
addBox(-H_GAP - H_BAR_WIDTH / 2, hY0, hZCenter - H_VERT_LEN / 2,
       -H_GAP + H_BAR_WIDTH / 2, hY1, hZCenter + H_VERT_LEN / 2);
addBox( H_GAP - H_BAR_WIDTH / 2, hY0, hZCenter - H_VERT_LEN / 2,
        H_GAP + H_BAR_WIDTH / 2, hY1, hZCenter + H_VERT_LEN / 2);
// Horizontal bar (along X) at mid-height of the verticals
const hMidY0 = hY0;
const hMidY1 = hY1;
addBox(-H_HORIZ_LEN / 2, hMidY0, -H_BAR_DEPTH / 2,
        H_HORIZ_LEN / 2, hMidY1,  H_BAR_DEPTH / 2);
endGroup(1);

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

// Build one primitive per material group (so the disc is grey and the H
// is white).  Each primitive references the same position/normal accessors
// but its own index range via a bufferView + accessor slice.
const bufferViews = [
    { buffer: 0, byteOffset: 0,             byteLength: posBytes, target: 34962 },
    { buffer: 0, byteOffset: posPadded,      byteLength: norBytes, target: 34962 },
    { buffer: 0, byteOffset: posPadded + norPadded, byteLength: idxBytes, target: 34963 }
];

// Position + normal accessors are shared by every primitive.  Each
// material group gets its OWN index accessor — same index bufferView
// (bufferView 2), but a different byteOffset/count slice so each
// primitive only draws its own triangles.  This is the glTF 2.0 core
// way to do per-material sub-meshes from a single index buffer.
const accessors = [
    { bufferView: 0, componentType: 5126, count: numVertices, type: 'VEC3',
      min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },   // 0: POSITION
    { bufferView: 1, componentType: 5126, count: numVertices, type: 'VEC3' }    // 1: NORMAL
];

// Index accessor per material group (start at accessor index 2).
const primitives = materialRanges.map((r, i) => {
    const idxAccessor = 2 + i;
    accessors.push({
        bufferView: 2,
        componentType: 5123,
        count: r.count,
        type: 'SCALAR',
        byteOffset: r.start * 2   // Uint16 = 2 bytes per index
    });
    return {
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: idxAccessor,
        material: r.material
    };
});

const gltfJson = {
    asset: { version: '2.0', generator: 'DroneEngage homebase.glb generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives }],
    materials: [
        {   // 0: pad disc + rim — dark slate
            pbrMetallicRoughness: {
                baseColorFactor: [0.18, 0.20, 0.22, 1.0],
                metallicFactor: 0.1,
                roughnessFactor: 0.8
            },
            doubleSided: true
        },
        {   // 1: "H" mark — white
            pbrMetallicRoughness: {
                baseColorFactor: [0.95, 0.95, 0.95, 1.0],
                metallicFactor: 0.0,
                roughnessFactor: 0.6
            },
            doubleSided: true
        }
    ],
    buffers: [{ byteLength: totalBinLength }],
    bufferViews,
    accessors
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

// Usage: node generate_homebase_glb.js [outputPath]
//   outputPath is resolved relative to CWD; defaults to
//   <repo>/public/models/homebase.glb
const outPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(__dirname, '..', 'public', 'models', 'homebase.glb');
fs.writeFileSync(outPath, glb);
console.log(`Generated ${outPath} (${glbLength} bytes, ${numVertices} vertices, ${numIndices} indices)`);
console.log(`Bounds: X[${minX}, ${maxX}]  Y[${minY}, ${maxY}]  Z[${minZ}, ${maxZ}]`);
