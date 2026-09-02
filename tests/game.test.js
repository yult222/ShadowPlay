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
    assert.equal(game.completeStage(stage.id), false);
    assert.equal(game.recordStageProgress(stage.id, 100, { completedByGesture: true }), 100);
    const outcome = game.completeStage(stage.id);
    assert.equal(outcome.completed, true);
    assert.equal(outcome.finished, index === STAGES.length - 1);
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
    assert.equal(game.recordStageProgress(stageId, 100), 100);
    assert.equal(game.completeStage(stageId).completed, true);
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
  assert.deepEqual(game.getSnapshot().stageStateById, {});
});

test("stage checkpoints merge and survive component reconstruction", () => {
  game.createSession(); game.selectRole("xiaodan"); game.enterStage("leather");
  assert.equal(game.recordStageProgress("leather", 35, { failures: 1, selected: "" }), 35);
  assert.equal(game.recordStageProgress("leather", 20, { failures: 2, hinted: "B" }), 35);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.liveProgress, 4);
  assert.deepEqual(snapshot.stageStateById.leather, { failures: 2, selected: "", hinted: "B" });
  assert.equal(game.recordStageProgress("draft", 60, { coverage: [] }), false);
});

test("entering a stale or future stage never changes progression", () => {
  game.createSession();
  game.selectRole("xiaodan");
  assert.equal(game.enterStage("draft"), false);
  assert.equal(game.completeStage("draft"), false);
  assert.equal(game.recordStageProgress("draft", 100), false);
  assert.equal(game.getSnapshot().activeStage.id, "leather");
});

test("a stage cannot complete before its gesture progress reaches one hundred", () => {
  game.createSession(); game.selectRole("xiaodan"); assert.equal(game.enterStage("leather"), true);
  assert.equal(game.recordStageProgress("leather", 99, { selected: "B" }), 99);
  assert.equal(game.completeStage("leather"), false);
  assert.equal(game.getSnapshot().activeStage.id, "leather");
  assert.equal(game.recordStageProgress("leather", 100, { selected: "B" }), 100);
  assert.equal(game.completeStage("leather").nextStageId, "draft");
});
