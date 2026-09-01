const test = require("node:test");
const assert = require("node:assert/strict");
const { pointInPolygon, buildMaskCells, paintMask, pickTapTarget } = require("../miniprogram/utils/pathEngine");
const { CRAFT_TAP_TARGETS, CRAFT_REVEAL_CLIPS, COLOR_MASKS } = require("../miniprogram/data/experience");

test("craft stages select whole groups with taps instead of freehand strokes", () => {
  for (const stageId of ["draft", "trace", "carve"]) {
    const targets = CRAFT_TAP_TARGETS[stageId]; const selected = [];
    for (const target of targets) {
      const picked = pickTapTarget(target.points[0], targets, selected, 0.2);
      assert.equal(picked, target.id); selected.push(picked);
    }
    assert.equal(selected.length, targets.length);
    assert.equal(pickTapTarget(targets[0].points[0], targets, selected, 0.2), null);
    for (const target of targets) assert.ok(Array.isArray(CRAFT_REVEAL_CLIPS[stageId][target.id]) && CRAFT_REVEAL_CLIPS[stageId][target.id].length > 0);
  }
});

test("source reveal clips stay inside the original puppet image", () => {
  for (const stage of Object.values(CRAFT_REVEAL_CLIPS)) {
    for (const clips of Object.values(stage)) {
      for (const clip of clips) {
        assert.match(clip, /^polygon\(.+\)$/);
        const values = Array.from(clip.matchAll(/([0-9]+)%/g), (match) => Number(match[1]));
        assert.ok(values.length >= 6); assert.ok(values.every((value) => value >= 0 && value <= 100));
      }
    }
  }
});

test("all eleven polygon masks paint independently without ellipse placeholders", () => {
  assert.equal(COLOR_MASKS.length, 11);
  for (const mask of COLOR_MASKS) {
    const cells = buildMaskCells(mask.polygon, 24); assert.ok(cells.length > 4);
    const point = cells[Math.floor(cells.length / 2)]; assert.equal(pointInPolygon(point, mask.polygon), true);
    const result = paintMask(point, cells, [], 0.12); assert.ok(result.progress > 0);
  }
});
