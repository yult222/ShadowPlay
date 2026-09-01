const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const removedPaths = ["素材.zip", "素材", "坐标表.xlsx", "pages/experience", "miniprogram/images/experience"];
for (const target of removedPaths) {
  if (fs.existsSync(target)) throw new Error(`legacy path remains: ${target}`);
}

const tracked = spawnSync("git", ["ls-files"], { encoding: "utf8" });
if (tracked.status !== 0) throw new Error(tracked.stderr);
for (const target of ["素材.zip", "坐标表.xlsx", "pages/experience/index/index.js", "miniprogram/images/experience/111剪影.png"]) {
  if (tracked.stdout.split("\n").includes(target)) throw new Error(`legacy tracked path remains: ${target}`);
}

const residueTokens = ["222皮料底图", "coloringHitSet", "save成品", "currentCarvingOverlay"];
const sourceExtensions = new Set([".js", ".json", ".wxml", ".wxss"]);
function sourceFiles(root, output = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) sourceFiles(target, output);
    else if (sourceExtensions.has(path.extname(entry.name))) output.push(target);
  }
  return output;
}
for (const file of sourceFiles("miniprogram")) {
  const contents = fs.readFileSync(file, "utf8");
  const token = residueTokens.find((candidate) => contents.includes(candidate));
  if (token) throw new Error(`legacy source remains: ${file} (${token})`);
}
for (const forbidden of ["placeholder", "experience-v2", "test3D4WeMi", "工程车"]) {
  for (const file of [
    ...sourceFiles("miniprogram/pages/experience"),
    ...sourceFiles("miniprogram/experience2d"),
    ...sourceFiles("miniprogram/experiencexr"),
  ]) {
    if (fs.readFileSync(file, "utf8").includes(forbidden)) throw new Error(`forbidden experience token remains: ${file} (${forbidden})`);
  }
}
console.log("LEGACY_RESIDUE_OK");
