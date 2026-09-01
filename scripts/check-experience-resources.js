const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "miniprogram");
const app = JSON.parse(fs.readFileSync(path.join(ROOT, "app.json"), "utf8"));
const pages = [
  ...app.pages,
  ...app.subPackages.flatMap((group) => group.pages.map((page) => `${group.root}/${page}`)),
];
for (const page of pages) {
  for (const extension of [".js", ".json", ".wxml", ".wxss"]) {
    const target = path.join(ROOT, `${page}${extension}`);
    if (!fs.existsSync(target)) throw new Error(`missing page file: ${target}`);
  }
}

const sourceRoots = ["pages/experience", "experience2d", "experiencexr", "data/experience.js"];
function collect(target, output = []) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return output.concat(target);
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) collect(child, output);
    else if (/\.(js|wxml|wxss|json)$/.test(entry.name)) output.push(child);
  }
  return output;
}
const files = sourceRoots.flatMap((entry) => collect(path.join(ROOT, entry)));
const absoluteResource = /["'](\/(?:images|audio|experience2d|experiencexr)\/[^"']+\.(?:webp|png|wav|m4a|glb))["']/g;
for (const file of files) {
  const contents = fs.readFileSync(file, "utf8");
  for (const match of contents.matchAll(absoluteResource)) {
    const target = path.join(ROOT, match[1].slice(1));
    if (!fs.existsSync(target)) throw new Error(`missing resource in ${file}: ${match[1]}`);
    if (fs.statSync(target).size < 1024) throw new Error(`resource is unexpectedly small: ${target}`);
  }
}

const glbPath = path.join(ROOT, "experiencexr", "xr-assets", "experience-kit.glb");
const glb = fs.readFileSync(glbPath);
if (glb.toString("ascii", 0, 4) !== "glTF" || glb.readUInt32LE(4) !== 2 || glb.readUInt32LE(8) !== glb.length) {
  throw new Error("invalid GLB header");
}
const jsonLength = glb.readUInt32LE(12);
const glbJson = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength).trim());
if ((glbJson.nodes || []).length < 5 || (glbJson.meshes || []).length < 3) throw new Error("GLB scene is incomplete");

const stageArt = fs.readdirSync(path.join(ROOT, "images", "experience-v3", "stages")).filter((name) => name.endsWith(".webp"));
const parts = fs.readdirSync(path.join(ROOT, "images", "experience-v3", "parts")).filter((name) => name.endsWith(".webp"));
const materials = fs.readdirSync(path.join(ROOT, "images", "experience-v3", "materials")).filter((name) => name.endsWith(".webp"));
if (stageArt.length !== 9) throw new Error(`expected 9 stage artworks, found ${stageArt.length}`);
if (parts.length !== 11) throw new Error(`expected 11 part artworks, found ${parts.length}`);
if (materials.length !== 4) throw new Error(`expected 4 leather artworks, found ${materials.length}`);
console.log(`RESOURCE_OK pages=${pages.length} stageArt=${stageArt.length} parts=${parts.length} materials=${materials.length}`);
