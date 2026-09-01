const fs = require("node:fs");
const path = require("node:path");

function total(root, excluded = new Set()) {
  if (!fs.existsSync(root) || excluded.has(path.resolve(root))) return 0;
  return fs.readdirSync(root, { withFileTypes: true }).reduce((sum, entry) => {
    const target = path.join(root, entry.name);
    return sum + (entry.isDirectory() ? total(target, excluded) : fs.statSync(target).size);
  }, 0);
}

const limit = Math.floor(1.8 * 1024 * 1024);
const roots = ["miniprogram/experience2d", "miniprogram/experiencegame"];
const excluded = new Set(roots.map((root) => path.resolve(root)));
const packages = {
  main: total("miniprogram", excluded),
  experience2d: total(roots[0]),
  experiencegame: total(roots[1]),
};
for (const [name, bytes] of Object.entries(packages)) {
  if (bytes > limit) throw new Error(`${name} package ${bytes} exceeds ${limit}`);
}
console.log(`MEDIA_SIZE_OK ${JSON.stringify(packages)}`);
