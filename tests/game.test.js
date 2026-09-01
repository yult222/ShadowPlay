const test = require("node:test");
const assert = require("node:assert/strict");
const game = require("../miniprogram/utils/game");
const { STAGES } = require("../miniprogram/data/experience");

test("game enforces role selection and stage order", () => {
  game.createSession();
  assert.equal(game.enterStage("leather"), false);
  assert.equal(game.selectRole("wusheng"), false);
  assert.equal(game.selectRole("xiaodan"), true);
  assert.equal(game.completeStage("leather"), false);
  assert.equal(game.enterStage("draft"), false);
  assert.equal(game.enterStage("leather"), true);
});

test("game completes all nine stages without skipping", () => {
  game.createSession();
  game.selectRole("xiaodan");
  for (const [index, stage] of STAGES.entries()) {
    assert.equal(game.enterStage(stage.id), true);
    assert.equal(game.completeStage(stage.id), true);
    assert.equal(game.completeStage(stage.id), false);
    const snapshot = game.getSnapshot();
    assert.equal(snapshot.completedStageIds.length, index + 1);
  }
  const result = game.getSnapshot();
  assert.equal(result.finished, true);
  assert.equal(result.progress, 100);
});

test("failure counts and reset are deterministic", () => {
  game.createSession();
  game.selectRole("xiaodan");
  for (const stageId of ["leather", "draft"]) {
    assert.equal(game.enterStage(stageId), true);
    assert.equal(game.completeStage(stageId), true);
  }
  assert.equal(game.failStage("trace"), 0);
  assert.equal(game.enterStage("trace"), true);
  assert.equal(game.failStage("trace"), 1);
  assert.equal(game.failStage("trace"), 2);
  assert.equal(game.getSnapshot().attemptsByStage.trace, 2);
  assert.equal(game.recordStageProgress("trace", 64), 64);
  assert.equal(game.recordStageProgress("trace", 40), 64);
  assert.equal(game.recordStageProgress("carve", 80), false);
  assert.equal(game.completeStage("carve"), false);
  game.resetGame();
  assert.deepEqual(game.getSnapshot().completedStageIds, []);
  assert.equal(game.getSnapshot().selectedRole, "");
  assert.deepEqual(game.getSnapshot().progressByStage, {});
});

test("entering a stale or future stage never changes progression", () => {
  game.createSession();
  game.selectRole("xiaodan");
  assert.equal(game.enterStage("draft"), false);
  assert.equal(game.completeStage("draft"), false);
  assert.equal(game.recordStageProgress("draft", 100), false);
  assert.equal(game.getSnapshot().activeStage.id, "leather");
});
