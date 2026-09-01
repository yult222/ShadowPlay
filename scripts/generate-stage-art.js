const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "miniprogram", "images", "experience-v3");
const OUTPUT = path.join(SOURCE, "stages");
const MATERIAL_OUTPUT = path.join(SOURCE, "materials");
const SIZE = 512;
const PAPER = { create: { width: SIZE, height: SIZE, channels: 4, background: "#ead6ad" } };

function svg(content) {
  return Buffer.from(`<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`);
}

async function puppetBuffer({ grayscale = false, opacity = 1, silhouette = false } = {}) {
  const resize = { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } };
  if (silhouette) {
    const alpha = await sharp(path.join(SOURCE, "xiaodan-anchor.webp"))
      .resize(360, 460, resize).ensureAlpha().extractChannel(3).toBuffer();
    return sharp({ create: { width: 360, height: 460, channels: 3, background: "#20140e" } })
      .joinChannel(alpha).png().toBuffer();
  }
  let image = sharp(path.join(SOURCE, "xiaodan-anchor.webp")).resize(360, 460, resize);
  if (grayscale) image = image.grayscale().tint("#795132");
  if (opacity < 1) image = image.modulate({ brightness: 1 });
  return image.png().toBuffer();
}

async function write(name, layers, quality = 78) {
  const output = path.join(OUTPUT, `${name}.webp`);
  await sharp(PAPER).composite(layers).webp({ quality, alphaQuality: 90, effort: 6 }).toFile(output);
  return output;
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.mkdirSync(MATERIAL_OUTPUT, { recursive: true });
  const muted = await puppetBuffer({ grayscale: true, opacity: 0.72 });
  const colored = await puppetBuffer();
  const silhouette = await puppetBuffer({ silhouette: true });
  const center = { left: 76, top: 26 };

  await sharp(path.join(SOURCE, "leather-board.webp"))
    .resize(SIZE, SIZE, { fit: "cover" }).webp({ quality: 78, effort: 6 })
    .toFile(path.join(OUTPUT, "01-leather.webp"));
  const leatherMeta = await sharp(path.join(SOURCE, "leather-board.webp")).metadata();
  const halfWidth = Math.floor(leatherMeta.width / 2);
  const halfHeight = Math.floor(leatherMeta.height / 2);
  for (const [name, left, top] of [["A", 0, 0], ["B", halfWidth, 0], ["C", 0, halfHeight], ["D", halfWidth, halfHeight]]) {
    await sharp(path.join(SOURCE, "leather-board.webp"))
      .extract({ left, top, width: halfWidth, height: halfHeight }).resize(420, 260, { fit: "cover" })
      .webp({ quality: 80, effort: 6 }).toFile(path.join(MATERIAL_OUTPUT, `${name}.webp`));
  }

  await write("02-draft", [
    { input: muted, ...center },
    { input: svg('<g fill="#a62b23" stroke="#5a3c24" stroke-width="6"><line x1="256" y1="100" x2="152" y2="236"/><line x1="256" y1="100" x2="360" y2="236"/><line x1="152" y1="236" x2="256" y2="438"/><line x1="360" y1="236" x2="256" y2="438"/><circle cx="256" cy="100" r="12"/><circle cx="152" cy="236" r="12"/><circle cx="360" cy="236" r="12"/><circle cx="256" cy="438" r="12"/></g>') },
  ]);

  await write("03-trace", [
    { input: muted, ...center },
    { input: svg('<path d="M256 64 C186 85 165 166 118 238 C155 307 183 413 256 468 C329 413 357 307 394 238 C347 166 326 85 256 64" fill="none" stroke="#5a3c24" stroke-width="9" stroke-linecap="round" stroke-dasharray="26 13"/>') },
  ]);

  await write("04-carve", [
    { input: muted, ...center },
    { input: svg('<g fill="none" stroke="#6b3f24" stroke-width="7" stroke-linecap="round"><path d="M126 378 L382 128"/><path d="M345 115 l50 50"/><path d="M162 154 q94 64 188 0"/><path d="M154 340 q102 -58 204 0"/></g><circle cx="382" cy="128" r="19" fill="#a62b23" opacity=".8"/>') },
  ]);

  await write("05-color", [
    { input: colored, ...center },
    { input: svg('<g stroke="#fff6da" stroke-width="5"><circle cx="91" cy="424" r="24" fill="#a62b23"/><circle cx="150" cy="444" r="24" fill="#d5a62a"/><circle cx="213" cy="453" r="24" fill="#315e4b"/><circle cx="279" cy="453" r="24" fill="#247184"/><circle cx="344" cy="444" r="24" fill="#30251c"/></g>') },
  ]);

  const partFiles = fs.readdirSync(path.join(SOURCE, "parts")).filter((name) => name.endsWith(".webp")).sort();
  const partLayers = [];
  for (let index = 0; index < partFiles.length; index += 1) {
    const part = await sharp(path.join(SOURCE, "parts", partFiles[index]))
      .resize(108, 132, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const column = index % 4;
    const row = Math.floor(index / 4);
    partLayers.push({ input: part, left: 16 + column * 124, top: 34 + row * 150 });
  }
  await write("06-parts", partLayers);

  await write("07-joint", [
    { input: colored, ...center },
    { input: svg('<g fill="#d5a62a" stroke="#5a3c24" stroke-width="5"><circle cx="188" cy="190" r="12"/><circle cx="324" cy="190" r="12"/><circle cx="137" cy="265" r="12"/><circle cx="375" cy="265" r="12"/><circle cx="219" cy="318" r="12"/><circle cx="293" cy="318" r="12"/><circle cx="219" cy="409" r="12"/><circle cx="293" cy="409" r="12"/><circle cx="256" cy="170" r="12"/></g>') },
  ]);

  await write("08-rods", [
    { input: colored, ...center },
    { input: svg('<g stroke="#5a3c24" stroke-width="9" stroke-linecap="round"><line x1="132" y1="286" x2="61" y2="478"/><line x1="256" y1="158" x2="256" y2="488"/><line x1="380" y1="286" x2="451" y2="478"/></g><g fill="#d5a62a"><circle cx="132" cy="286" r="11"/><circle cx="256" cy="158" r="11"/><circle cx="380" cy="286" r="11"/></g>') },
  ]);

  await write("09-light", [
    { input: svg('<defs><radialGradient id="g"><stop offset="0" stop-color="#fff2bd"/><stop offset=".62" stop-color="#d9a04c"/><stop offset="1" stop-color="#4b2b1b"/></radialGradient></defs><rect width="512" height="512" fill="url(#g)"/><rect x="62" y="30" width="388" height="452" rx="150" fill="none" stroke="#5a3c24" stroke-width="12"/>') },
    { input: silhouette, ...center, blend: "multiply" },
  ], 80);

  const manifest = [];
  for (const filename of fs.readdirSync(OUTPUT).sort()) {
    const target = path.join(OUTPUT, filename);
    const metadata = await sharp(target).metadata();
    manifest.push({ filename, width: metadata.width, height: metadata.height, bytes: fs.statSync(target).size });
  }
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
