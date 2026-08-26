const fs = require("node:fs");
const path = require("node:path");

function total(root) {
  return fs.readdirSync(root, { withFileTypes: true }).reduce((sum, entry) => {
    const target = path.join(root, entry.name);
    return sum + (entry.isDirectory() ? total(target) : fs.statSync(target).size);
  }, 0);
}

const bytes = total("miniprogram/images/experience-v2") + total("miniprogram/audio");
const limit = 2 * 1024 * 1024;
if (bytes > limit) throw new Error(`experience media ${bytes} exceeds ${limit}`);
console.log(`MEDIA_SIZE_OK ${bytes}`);
