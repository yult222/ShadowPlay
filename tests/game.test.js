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
  assert.equal(game.failStage("trace"), 1);
  assert.equal(game.failStage("trace"), 2);
  assert.equal(game.getSnapshot().attemptsByStage.trace, 2);
  game.resetGame();
  assert.deepEqual(game.getSnapshot().completedStageIds, []);
  assert.equal(game.getSnapshot().selectedRole, "");
});
