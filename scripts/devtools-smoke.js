const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const automator = require("miniprogram-automator");
const { CRAFT_TAP_TARGETS, COLOR_MASKS, PARTS } = require("../miniprogram/data/experience");
const { buildMaskCells } = require("../miniprogram/utils/pathEngine");

const ROOT = path.resolve(__dirname, "..");
const CLI = "/Applications/Develop/wechatwebdevtools.app/Contents/MacOS/cli";
const OUTPUT = path.join(ROOT, "docs", "validation");
const ENTRY = "/pages/experience/index";

function wait(duration = 500) { return new Promise((resolve) => setTimeout(resolve, duration)); }
async function current(miniProgram, expected) { await wait(420); const page = await miniProgram.currentPage(); assert.equal(page.path, expected); return page; }
async function callPage(miniProgram, method, argument) {
  return miniProgram.evaluate((payload) => {
    const pages = getCurrentPages(); const page = pages[pages.length - 1];
    return page[payload.method](payload.argument);
  }, { method, argument });
}
async function pageData(miniProgram, name) {
  return miniProgram.evaluate((key) => { const pages = getCurrentPages(); return pages[pages.length - 1].data[key]; }, name);
}
async function selectCanvas(miniProgram, point) {
  await callPage(miniProgram, "selectCanvas", { detail: point });
}
function maskPoint(mask) { const cells = buildMaskCells(mask.polygon, 34); return cells[Math.floor(cells.length / 2)]; }

(async () => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const endpoint = process.env.SHADOWPLAY_WS;
  const miniProgram = endpoint ? await automator.connect({ wsEndpoint: endpoint }) : await automator.launch({
    cliPath: CLI, projectPath: ROOT, port: Number(process.env.SHADOWPLAY_AUTO_PORT || 9431), trustProject: true, timeout: 45000,
  });
  const errors = [];
  miniProgram.on("exception", (error) => errors.push(String(error)));
  miniProgram.on("console", (entry) => { if (entry && entry.type === "error") errors.push(String(entry.args || entry.text || entry)); });
  try {
    const system = await miniProgram.systemInfo(); assert.equal(system.platform, "devtools");
    await miniProgram.callWxMethod("reLaunch", { url: ENTRY }); let page = await current(miniProgram, "pages/experience/index");
    await miniProgram.screenshot({ path: path.join(OUTPUT, "entry-workbench.png") });
    await miniProgram.callWxMethod("navigateTo", { url: "/experience2d/pages/role" });
    page = await current(miniProgram, "experience2d/pages/role"); await miniProgram.screenshot({ path: path.join(OUTPUT, "role-workbench.png") });
    await miniProgram.evaluate(() => { const game = getApp().globalData.experienceGame; game.createSession(); game.selectRole("xiaodan"); });
    await miniProgram.callWxMethod("navigateTo", { url: "/experiencegame/pages/workbench" });
    page = await current(miniProgram, "experiencegame/pages/workbench");
    await miniProgram.screenshot({ path: path.join(OUTPUT, "workbench-leather-collapsed.png") });
    await callPage(miniProgram, "toggleRail"); await wait(260);
    await miniProgram.screenshot({ path: path.join(OUTPUT, "workbench-leather-expanded.png") }); await callPage(miniProgram, "toggleRail");

    await callPage(miniProgram, "onDrop", { detail: { itemId: "A", targetId: "inspect" } });
    await callPage(miniProgram, "onDrop", { detail: { itemId: "D", targetId: "inspect" } });
    await callPage(miniProgram, "onDrop", { detail: { itemId: "B", targetId: "inspect" } }); await wait(620);
    assert.equal(await pageData(miniProgram, "activeStageId"), "draft");

    for (const target of CRAFT_TAP_TARGETS.draft) await selectCanvas(miniProgram, target.points[0]);
    await wait(500); assert.equal(await pageData(miniProgram, "activeStageId"), "trace");
    await miniProgram.screenshot({ path: path.join(OUTPUT, "workbench-trace-source-before.png") });
    await selectCanvas(miniProgram, { x: 0.02, y: 0.02 });
    await selectCanvas(miniProgram, CRAFT_TAP_TARGETS.trace[0].points[0]);
    await wait(220);
    await miniProgram.screenshot({ path: path.join(OUTPUT, "workbench-trace-source-reveal.png") });
    for (const target of CRAFT_TAP_TARGETS.trace.slice(1)) await selectCanvas(miniProgram, target.points[0]);
    await wait(500); assert.equal(await pageData(miniProgram, "activeStageId"), "carve");

    for (const target of CRAFT_TAP_TARGETS.carve) await selectCanvas(miniProgram, target.points[0]);
    await wait(500); assert.equal(await pageData(miniProgram, "activeStageId"), "color");
    for (const mask of COLOR_MASKS) {
      await callPage(miniProgram, "chooseColor", { currentTarget: { dataset: { id: mask.colorId } } });
      await selectCanvas(miniProgram, maskPoint(mask));
    }
    await wait(650); assert.equal(await pageData(miniProgram, "activeStageId"), "parts");

    for (const [index, part] of PARTS.entries()) await callPage(miniProgram, "onDrop", { detail: { itemId: part.id, targetId: index % 2 ? "tray-right" : "tray-left" } });
    await wait(600); assert.equal(await pageData(miniProgram, "activeStageId"), "joint");
    for (const part of PARTS) await callPage(miniProgram, "onDrop", { detail: { itemId: part.id, targetId: `target-${part.id}` } });
    await wait(300); for (let index = 0; index < 9; index += 1) await callPage(miniProgram, "onDrop", { detail: { itemId: `pin-${index}`, targetId: `joint-${index}` } });
    await wait(300); for (let index = 0; index < 9; index += 1) await callPage(miniProgram, "onDrop", { detail: { itemId: `test-${index}`, targetId: `move-${index}` } });
    await wait(600); assert.equal(await pageData(miniProgram, "activeStageId"), "rods");
    for (let index = 0; index < 3; index += 1) await callPage(miniProgram, "onDrop", { detail: { itemId: `rod-${index}`, targetId: `rod-target-${index}` } });
    await wait(300); for (let index = 0; index < 3; index += 1) await callPage(miniProgram, "onDrop", { detail: { itemId: `rod-${index}`, targetId: `rod-move-${index}` } });
    await wait(600); assert.equal(await pageData(miniProgram, "activeStageId"), "light");
    await callPage(miniProgram, "onDrop", { detail: { itemId: "puppet", targetId: "light" } }); await wait(300);
    await callPage(miniProgram, "onDrop", { detail: { itemId: "light-rod", targetId: "light-move" } });
    await wait(900);
    page = await current(miniProgram, "experience2d/pages/result"); await miniProgram.screenshot({ path: path.join(OUTPUT, "result-workbench.png") });
    assert.deepEqual(errors, []);
    process.stdout.write(`DEVTOOLS_SMOKE_OK continuousStages=9 viewport=${system.screenWidth}x${system.screenHeight}\n`);
  } finally { if (endpoint) miniProgram.disconnect(); else await miniProgram.close(); }
})().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
