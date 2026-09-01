const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const automator = require("miniprogram-automator");

const ROOT = path.resolve(__dirname, "..");
const CLI = "/Applications/Develop/wechatwebdevtools.app/Contents/MacOS/cli";
const OUTPUT = path.join(ROOT, "docs", "validation");
const ENTRY = "/pages/experience/index";
const STAGES = ["leather", "draft", "trace", "carve", "color", "parts", "joint", "rods", "light"];
const XR_STAGES = new Set(["leather", "parts", "joint", "rods", "light"]);

function wait(duration = 500) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function openRoute(miniProgram, url, expectedPath) {
  const result = await miniProgram.callWxMethod("reLaunch", { url });
  assert.match(String(result.errMsg), /:ok$/);
  await wait(520);
  const page = await miniProgram.currentPage();
  assert.equal(page.path, expectedPath);
  return page;
}

async function prepareStage(miniProgram, stageIndex) {
  await openRoute(miniProgram, ENTRY, "pages/experience/index");
  const preceding = STAGES.slice(0, stageIndex);
  const snapshot = await miniProgram.evaluate((completed) => {
    const game = getApp().globalData.experienceGame;
    game.createSession();
    game.selectRole("xiaodan");
    completed.forEach((stageId) => { game.enterStage(stageId); game.completeStage(stageId); });
    return game.getSnapshot();
  }, preceding);
  assert.equal(snapshot.completedStageIds.length, stageIndex);
}

(async () => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const endpoint = process.env.SHADOWPLAY_WS;
  const miniProgram = endpoint
    ? await automator.connect({ wsEndpoint: endpoint })
    : await automator.launch({
      cliPath: CLI,
      projectPath: ROOT,
      port: Number(process.env.SHADOWPLAY_AUTO_PORT || 9431),
      trustProject: true,
      timeout: 45000,
    });
  const errors = [];
  miniProgram.on("exception", (error) => errors.push(String(error)));
  miniProgram.on("console", (entry) => {
    if (entry && entry.type === "error") errors.push(String(entry.args || entry.text || entry));
  });
  try {
    const system = await miniProgram.systemInfo();
    assert.equal(system.platform, "devtools");
    await openRoute(miniProgram, ENTRY, "pages/experience/index");
    await miniProgram.screenshot({ path: path.join(OUTPUT, "entry-390x844.png") });
    await openRoute(miniProgram, "/experience2d/pages/role", "experience2d/pages/role");
    await miniProgram.screenshot({ path: path.join(OUTPUT, "role-390x844.png") });
    await openRoute(miniProgram, "/experience2d/pages/gallery", "experience2d/pages/gallery");
    await openRoute(miniProgram, "/experience2d/pages/help", "experience2d/pages/help");

    await prepareStage(miniProgram, 0);
    await miniProgram.callWxMethod("navigateTo", { url: "/experiencexr/pages/workshop" });
    await wait(520);
    assert.equal((await miniProgram.currentPage()).path, "experiencexr/pages/workshop");
    await miniProgram.screenshot({ path: path.join(OUTPUT, "workshop-390x844.png") });

    for (let index = 0; index < STAGES.length; index += 1) {
      const stageId = STAGES[index];
      await prepareStage(miniProgram, index);
      const root = XR_STAGES.has(stageId) ? "experiencexr" : "experience2d";
      await miniProgram.callWxMethod("navigateTo", { url: `/${root}/pages/stage?id=${stageId}` });
      await wait(stageId === "trace" || stageId === "carve" || stageId === "color" ? 800 : 520);
      assert.equal((await miniProgram.currentPage()).path, `${root}/pages/stage`);
      if (["leather", "trace", "joint"].includes(stageId)) {
        await miniProgram.screenshot({ path: path.join(OUTPUT, `${stageId}-390x844.png`) });
      }
    }

    await miniProgram.evaluate(() => {
      const game = getApp().globalData.experienceGame;
      game.createSession(); game.selectRole("xiaodan");
      ["leather", "draft", "trace", "carve", "color", "parts", "joint", "rods", "light"].forEach((stageId) => {
        game.enterStage(stageId); game.completeStage(stageId);
      });
    });
    await openRoute(miniProgram, "/experience2d/pages/result", "experience2d/pages/result");
    await miniProgram.screenshot({ path: path.join(OUTPUT, "result-390x844.png") });
    assert.deepEqual(errors, []);
    process.stdout.write(`DEVTOOLS_SMOKE_OK routes=15 viewport=${system.screenWidth}x${system.screenHeight}\n`);
  } finally {
    if (endpoint) miniProgram.disconnect();
    else await miniProgram.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
