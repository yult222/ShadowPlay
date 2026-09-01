const fs = require("node:fs");
const path = require("node:path");

const positions = [
  -1,-1, 1, 1,-1, 1, 1, 1, 1,-1, 1, 1,
   1,-1,-1,-1,-1,-1,-1, 1,-1, 1, 1,-1,
  -1, 1, 1, 1, 1, 1, 1, 1,-1,-1, 1,-1,
  -1,-1,-1, 1,-1,-1, 1,-1, 1,-1,-1, 1,
   1,-1, 1, 1,-1,-1, 1, 1,-1, 1, 1, 1,
  -1,-1,-1,-1,-1, 1,-1, 1, 1,-1, 1,-1,
];
const normals = [
  0,0,1,0,0,1,0,0,1,0,0,1, 0,0,-1,0,0,-1,0,0,-1,0,0,-1,
  0,1,0,0,1,0,0,1,0,0,1,0, 0,-1,0,0,-1,0,0,-1,0,0,-1,0,
  1,0,0,1,0,0,1,0,0,1,0,0, -1,0,0,-1,0,0,-1,0,0,-1,0,0,
];
const indices = [0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23];

function pad4(buffer) {
  const padding = (4 - buffer.length % 4) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding)]) : buffer;
}

const positionBuffer = Buffer.from(new Float32Array(positions).buffer);
const normalBuffer = Buffer.from(new Float32Array(normals).buffer);
const indexBuffer = Buffer.from(new Uint16Array(indices).buffer);
const binary = pad4(Buffer.concat([positionBuffer, normalBuffer, indexBuffer]));
const gltf = {
  asset: { version: "2.0", generator: "ShadowPlay experience-kit generator" },
  scene: 0,
  scenes: [{ nodes: [0,1,2,3,4] }],
  nodes: [
    { name: "workbench", mesh: 0, translation: [0,-0.75,0], scale: [2.5,0.08,0.42] },
    { name: "left-rod", mesh: 1, translation: [-0.8,-0.12,0.15], scale: [0.025,0.72,0.025] },
    { name: "center-rod", mesh: 1, translation: [0,-0.12,0.15], scale: [0.025,0.82,0.025] },
    { name: "right-rod", mesh: 1, translation: [0.8,-0.12,0.15], scale: [0.025,0.72,0.025] },
    { name: "seal", mesh: 2, translation: [0,-0.61,0.5], scale: [0.16,0.04,0.16] },
  ],
  materials: [
    { name: "walnut", pbrMetallicRoughness: { baseColorFactor: [0.22,0.09,0.03,1], metallicFactor: 0, roughnessFactor: 0.72 } },
    { name: "rod", pbrMetallicRoughness: { baseColorFactor: [0.16,0.06,0.02,1], metallicFactor: 0, roughnessFactor: 0.62 } },
    { name: "cinnabar", pbrMetallicRoughness: { baseColorFactor: [0.58,0.06,0.04,1], metallicFactor: 0.1, roughnessFactor: 0.48 } },
  ],
  meshes: [0,1,2].map((material) => ({ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material }] })),
  buffers: [{ byteLength: binary.length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: positionBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: positionBuffer.length, byteLength: normalBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: positionBuffer.length + normalBuffer.length, byteLength: indexBuffer.length, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 24, type: "VEC3", min: [-1,-1,-1], max: [1,1,1] },
    { bufferView: 1, componentType: 5126, count: 24, type: "VEC3" },
    { bufferView: 2, componentType: 5123, count: 36, type: "SCALAR" },
  ],
};
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67,0); header.writeUInt32LE(2,4); header.writeUInt32LE(12+8+json.length+8+binary.length,8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(json.length,0); jsonHeader.writeUInt32LE(0x4e4f534a,4);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length,0); binHeader.writeUInt32LE(0x004e4942,4);
const output = path.resolve(process.argv[2] || "miniprogram/xr-assets/experience-kit.glb");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header,jsonHeader,json,binHeader,binary]));
console.log(output);
