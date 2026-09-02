const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const automator = require("miniprogram-automator");
const { CRAFT_TAP_TARGETS, COLOR_GROUPS, DRAFT_PIECES, PART_SEPARATION_GROUPS, JOINT_DEMOS } = require("../miniprogram/data/experience");

const ROOT = path.resolve(__dirname, "..");
const CLI = "/Applications/Develop/wechatwebdevtools.app/Contents/MacOS/cli";
const OUTPUT = path.join(ROOT, "docs", "validation", "ux-remediation");
const ENTRY = "/pages/experience/index";
const COLOR_ONLY = process.env.SHADOWPLAY_COLOR_ONLY === "1";

function wait(duration = 120) { return new Promise((resolve) => setTimeout(resolve, duration)); }
async function current(miniProgram, expected) {
  for (let index = 0; index < 40; index += 1) {
    const route = await miniProgram.evaluate(() => { const page = getCurrentPages().slice(-1)[0]; return page && page.route; }); if (route === expected) return; await wait(120);
  }
  const route = await miniProgram.evaluate(() => { const page = getCurrentPages().slice(-1)[0]; return page && page.route; }); assert.equal(route, expected);
}
async function pageData(miniProgram, key) {
  return miniProgram.evaluate((name) => { const page = getCurrentPages().slice(-1)[0]; return page && page.data[name]; }, key);
}
async function waitStage(miniProgram, expected) {
  for (let index = 0; index < 60; index += 1) {
    if (await pageData(miniProgram, "activeStageId") === expected) return; await wait(120);
  }
  assert.equal(await pageData(miniProgram, "activeStageId"), expected);
}
async function callPage(miniProgram, method, ...args) {
  return miniProgram.evaluate((name, values) => {
    const page = getCurrentPages().slice(-1)[0];
    if (!page || typeof page[name] !== "function") throw new Error(`missing page method ${name}`);
    setTimeout(() => page[name](...values), 0);
    return true;
  }, method, args);
}
async function drag(miniProgram, itemId, targetId) {
  process.stdout.write(`GESTURE drag ${itemId} -> ${targetId}\n`);
  const result = await miniProgram.evaluate((pieceId, destinationId) => {
    const page = getCurrentPages().slice(-1)[0]; const component = page && page.selectComponent("#drag-stage");
    if (!component) throw new Error("drag stage is missing");
    const index = component.data.localItems.findIndex((item) => item.id === pieceId);
    const item = component.data.localItems[index]; const target = component.properties.targets.find((candidate) => candidate.id === destinationId);
    if (!item || !target) throw new Error(`missing drag data ${pieceId} -> ${destinationId}`);
    const rect = component.data.rect || { left: 0, top: 0 };
    const point = (x, y) => ({ clientX: rect.left + x, clientY: rect.top + y, pageX: rect.left + x, pageY: rect.top + y, identifier: 1 });
    const start = point(item.x + item.width / 2, item.y + item.height / 2); const end = point(target.x + target.width / 2, target.y + target.height / 2);
    component.start({ currentTarget: { dataset: { index } }, touches: [start], changeTouches: [start] });
    component.move({ touches: [end], changeTouches: [end] });
    component.end({ touches: [], changeTouches: [end] });
    return true;
  }, itemId, targetId);
  assert.equal(result, true); await wait(160);
}
async function tapCraft(miniProgram, point) {
  process.stdout.write(`GESTURE tap ${point.x.toFixed(2)},${point.y.toFixed(2)}\n`);
  const result = await miniProgram.evaluate((normalized) => {
    const page = getCurrentPages().slice(-1)[0]; const component = page && page.selectComponent("#craft-canvas");
    if (!component || !component.data.rect) throw new Error("craft surface is missing");
    const rect = component.data.rect; const scale = Math.min(rect.width / component.properties.baseWidth, rect.height / component.properties.baseHeight);
    const imageWidth = component.properties.baseWidth * scale; const imageHeight = component.properties.baseHeight * scale;
    const touch = { clientX: rect.left + (rect.width - imageWidth) / 2 + normalized.x * imageWidth, clientY: rect.top + (rect.height - imageHeight) / 2 + normalized.y * imageHeight, identifier: 1 };
    touch.pageX = touch.clientX; touch.pageY = touch.clientY; component.select({ touches: [touch] }); return true;
  }, point);
  assert.equal(result, true); await wait(120);
}
async function triggerCraftElement(miniProgram, selector) {
  const page = await miniProgram.currentPage(); const canvas = await page.$("#craft-canvas");
  if (!canvas) throw new Error("craft canvas element is missing");
  const element = await canvas.$(selector); if (!element) throw new Error(`craft element is missing: ${selector}`);
  await element.trigger("tap"); await wait(100);
}
async function tapColor(miniProgram, id) { await triggerCraftElement(miniProgram, `.palette-color.${id}`); }
async function tapColorHint(miniProgram, id) { process.stdout.write(`GESTURE visible color target ${id}\n`); await triggerCraftElement(miniProgram, `.craft-hint.${id}`); }
async function screenshot(miniProgram, name) { if (COLOR_ONLY) return; await miniProgram.screenshot({ path: path.join(OUTPUT, name) }); process.stdout.write(`CAPTURE ${name}\n`); }
async function railAction(miniProgram, action, index) {
  return miniProgram.evaluate((method, itemIndex) => {
    const page = getCurrentPages().slice(-1)[0]; const rail = page && page.selectComponent("#process-rail");
    if (!rail) throw new Error("rail is missing");
    if (method === "toggle") rail.toggle(); else rail.select({ currentTarget: { dataset: { index: itemIndex } } });
    return true;
  }, action, index);
}

(async () => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const endpoint = process.env.SHADOWPLAY_WS;
  const miniProgram = endpoint ? await automator.connect({ wsEndpoint: endpoint }) : await automator.launch({ cliPath: CLI, projectPath: ROOT, port: Number(process.env.SHADOWPLAY_AUTO_PORT || 9431), trustProject: true, timeout: 45000 });
  process.stdout.write("AUTOMATION_CONNECTED\n");
  const errors = [];
  miniProgram.on("exception", (error) => errors.push(String(error)));
  miniProgram.on("console", (entry) => { if (entry && entry.type === "error") errors.push(String(entry.args || entry.text || entry)); });
  try {
    const system = COLOR_ONLY ? { platform: "devtools", screenWidth: 390, screenHeight: 844 } : await miniProgram.systemInfo(); assert.equal(system.platform, "devtools");
    await miniProgram.callWxMethod("reLaunch", { url: ENTRY }); await current(miniProgram, "pages/experience/index"); await wait(1100); await screenshot(miniProgram, "01-entry.png");
    await callPage(miniProgram, "openSettings"); await wait(180); await screenshot(miniProgram, "01b-settings.png"); await callPage(miniProgram, "closeSettings");
    await callPage(miniProgram, "start"); await current(miniProgram, "experience2d/pages/role"); await wait(500); await screenshot(miniProgram, "02-role.png");
    await callPage(miniProgram, "choose"); await current(miniProgram, "experiencegame/pages/workbench"); await waitStage(miniProgram, "leather"); await wait(500); await screenshot(miniProgram, "03-leather.png");

    await drag(miniProgram, "A", "inspect"); await wait(300); await drag(miniProgram, "D", "inspect"); await wait(300); await drag(miniProgram, "B", "inspect"); await waitStage(miniProgram, "draft");
    await wait(320); await screenshot(miniProgram, "04-draft.png");
    await railAction(miniProgram, "toggle"); await wait(120); await screenshot(miniProgram, "04b-rail-expanded.png"); await railAction(miniProgram, "select", 0); assert.equal(await pageData(miniProgram, "previewStageId"), "leather");
    await railAction(miniProgram, "toggle"); await railAction(miniProgram, "select", 1); assert.equal(await pageData(miniProgram, "previewStageId"), "");
    for (const piece of DRAFT_PIECES) await drag(miniProgram, piece.id, `draft-${piece.id}`); await waitStage(miniProgram, "trace"); await wait(320); await screenshot(miniProgram, "05-trace.png");

    await drag(miniProgram, "trace-sheet", "trace-target"); await waitStage(miniProgram, "carve"); await wait(320); await screenshot(miniProgram, "06-carve.png");
    for (const target of CRAFT_TAP_TARGETS.carve) await tapCraft(miniProgram, target.points[0]); await waitStage(miniProgram, "color"); await wait(320); await screenshot(miniProgram, "07-color.png");
    for (const group of COLOR_GROUPS) { await tapColor(miniProgram, group.colorId); await tapColorHint(miniProgram, group.colorId); }
    await waitStage(miniProgram, "parts"); await wait(320); await screenshot(miniProgram, "08-parts.png");
    if (COLOR_ONLY) { assert.deepEqual(errors, []); process.stdout.write("DEVTOOLS_COLOR_WXML_TAP_OK colors=5 next=parts\n"); return; }

    for (const group of PART_SEPARATION_GROUPS) await drag(miniProgram, group.id, group.targetId); await waitStage(miniProgram, "joint"); await wait(320); await screenshot(miniProgram, "09-joint.png");
    for (const demo of JOINT_DEMOS) await drag(miniProgram, `pin-${demo.id}`, `joint-${demo.id}`); await wait(420); await drag(miniProgram, "joint-test", "joint-move"); await waitStage(miniProgram, "rods"); await wait(320); await screenshot(miniProgram, "10-rods.png");
    for (let index = 0; index < 3; index += 1) await drag(miniProgram, `rod-${index}`, `rod-target-${index}`); await wait(420); await drag(miniProgram, "rod-control", "rod-move"); await waitStage(miniProgram, "light"); await wait(320); await screenshot(miniProgram, "11-light.png");
    await drag(miniProgram, "puppet", "light"); await wait(420); await drag(miniProgram, "light-rod", "light-move"); await current(miniProgram, "experience2d/pages/result"); await wait(500); await screenshot(miniProgram, "12-result.png");
    await miniProgram.callWxMethod("navigateTo", { url: "/experience2d/pages/help" }); await current(miniProgram, "experience2d/pages/help"); await wait(300); await screenshot(miniProgram, "13-help.png");
    assert.deepEqual(errors, []);
    process.stdout.write(`DEVTOOLS_COMPONENT_GESTURE_SMOKE_OK stages=9 viewport=${system.screenWidth}x${system.screenHeight} screenshots=15\n`);
  } finally { if (endpoint) miniProgram.disconnect(); else await miniProgram.close(); }
})().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
