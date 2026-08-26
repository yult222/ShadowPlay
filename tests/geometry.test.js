const test = require("node:test");
const assert = require("node:assert/strict");
const geometry = require("../miniprogram/utils/geometry");

test("page coordinates convert to stage-local coordinates", () => {
  assert.deepEqual(geometry.toLocalPoint({ clientX: 150, clientY: 230 }, { left: 30, top: 80 }), { x: 120, y: 150 });
  assert.deepEqual(geometry.toLocalPoint({ x: 12, y: 22 }, null), { x: 12, y: 22 });
});

test("path distance and snap tolerance reject offsets", () => {
  assert.equal(geometry.pointToSegmentDistance({ x: 5, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 4);
  const item = { x: 10, y: 20, width: 20, height: 20 };
  const target = { x: 14, y: 24, width: 20, height: 20 };
  assert.equal(geometry.canSnap(item, target, 6), true);
  assert.equal(geometry.canSnap(item, target, 4), false);
});
