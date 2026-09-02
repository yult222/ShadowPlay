const test = require("node:test");
const assert = require("node:assert/strict");
const { pointInPolygon, buildMaskCells, paintMask, pickTapTarget } = require("../miniprogram/utils/pathEngine");
const {
  DRAFT_PIECES, TRACE_SHEET, CRAFT_TAP_TARGETS, CRAFT_REVEAL_CLIPS, COLOR_MASKS,
  COLOR_GROUPS, PART_SEPARATION_GROUPS, JOINT_DEMOS,
} = require("../miniprogram/data/experience");

test("draft trace and carve use three different lightweight interactions", () => {
  assert.equal(DRAFT_PIECES.length, 4);
  assert.equal(TRACE_SHEET.id, "trace-sheet");
  const targets = CRAFT_TAP_TARGETS.carve; const selected = [];
  assert.equal(targets.length, 3);
  for (const target of targets) {
    const picked = pickTapTarget(target.points[0], targets, selected, 0.2);
    assert.equal(picked, target.id); selected.push(picked);
    assert.ok(Array.isArray(CRAFT_REVEAL_CLIPS.carve[target.id]) && CRAFT_REVEAL_CLIPS.carve[target.id].length > 0);
  }
  assert.equal(pickTapTarget(targets[0].points[0], targets, selected, 0.2), null);
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

test("five color groups cover all eleven visual masks exactly once", () => {
  assert.equal(COLOR_GROUPS.length, 5);
  const ids = COLOR_GROUPS.flatMap((group) => group.maskIds);
  assert.equal(ids.length, COLOR_MASKS.length);
  assert.deepEqual(new Set(ids), new Set(COLOR_MASKS.map((mask) => mask.id)));
});

test("late-stage representative actions stay within the mobile interaction budget", () => {
  assert.equal(PART_SEPARATION_GROUPS.length, 5);
  assert.equal(JOINT_DEMOS.length, 3);
  const minimumCoreActions = 1 + DRAFT_PIECES.length + 1 + CRAFT_TAP_TARGETS.carve.length
    + COLOR_GROUPS.length * 2 + PART_SEPARATION_GROUPS.length + JOINT_DEMOS.length + 1 + 4 + 2;
  assert.equal(minimumCoreActions, 34);
});
