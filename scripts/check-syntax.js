const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function collect(root, output = []) {
  if (!fs.existsSync(root)) return output;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) collect(target, output);
    else if (entry.isFile() && target.endsWith(".js")) output.push(target);
  }
  return output;
}

const files = [...collect("miniprogram"), ...collect("cloudfunctions")];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}
console.log(`SYNTAX_OK ${files.length}`);
