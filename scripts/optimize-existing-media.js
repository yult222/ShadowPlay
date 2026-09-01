const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..", "miniprogram", "images");
const INPUTS = [
  ...Array.from({ length: 8 }, (_, index) => `consult/p${index + 1}.png`),
  "ai_example1.png",
  "ai_example2.png",
  "default-goods-image.png",
];

(async () => {
  const report = [];
  for (const relative of INPUTS) {
    const source = path.join(ROOT, relative);
    if (!fs.existsSync(source)) continue;
    const target = source.replace(/\.png$/i, ".webp");
    const before = fs.statSync(source).size;
    await sharp(source).resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 74, alphaQuality: 82, effort: 6 }).toFile(target);
    report.push({ source: relative, target: path.relative(ROOT, target), before, after: fs.statSync(target).size });
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
