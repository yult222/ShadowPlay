const fs = require("node:fs");
const path = require("node:path");
const { COPY_ALLOWLIST } = require("../miniprogram/data/experience");

const roots = [
  "miniprogram/pages/experience",
  "miniprogram/components/experience-shell",
  "miniprogram/components/experience-progress",
  "miniprogram/components/experience-process",
  "miniprogram/components/common-popup",
  "miniprogram/components/drag-snap-stage",
];

function filesUnder(root, output = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) filesUnder(target, output);
    else if (/\.(js|wxml)$/.test(entry.name)) output.push(target);
  }
  return output;
}

const chineseLiteral = /["'`]([^"'`]*[\u3400-\u9fff][^"'`]*)["'`]/g;
for (const file of roots.flatMap((root) => filesUnder(root))) {
  const text = fs.readFileSync(file, "utf8");
  const matches = [...text.matchAll(chineseLiteral)].map((match) => match[1]);
  if (matches.length) {
    throw new Error(`${file} contains visible Chinese literals outside the central copy file: ${matches.join(" | ")}`);
  }
}

const dataSource = fs.readFileSync("miniprogram/data/experience.js", "utf8");
const centralLiterals = [...dataSource.matchAll(chineseLiteral)].map((match) => match[1]);
const rejected = centralLiterals.filter((text) => !COPY_ALLOWLIST.includes(text));
if (rejected.length) throw new Error(`copy allowlist rejected: ${rejected.join(" | ")}`);

const banned = ["制作完成", "保存作品", "重新制作", "返回经典剧目", "开始体验", "工坊式制作"];
for (const text of banned) {
  if (dataSource.includes(text)) throw new Error(`legacy copy remains: ${text}`);
}
console.log(`COPY_ALLOWLIST_OK ${COPY_ALLOWLIST.length}`);
