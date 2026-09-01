const test = require("node:test");
const assert = require("node:assert/strict");
const geometry = require("../miniprogram/utils/geometry");
const { COLOR_REGIONS } = require("../miniprogram/data/experience");

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

test("normalized coordinates clamp across phone-sized canvases", () => {
  const rect = { left: 10, top: 20, width: 360, height: 600 };
  assert.deepEqual(geometry.toNormalizedPoint({ clientX: 190, clientY: 320 }, rect), { x: 0.5, y: 0.5 });
  assert.deepEqual(geometry.toNormalizedPoint({ clientX: -20, clientY: 900 }, rect), { x: 0, y: 1 });
  assert.deepEqual(geometry.fromNormalizedPoint({ x: 0.25, y: 0.75 }, 430, 932), { x: 107.5, y: 699 });
});

test("responsive boards fit all required phone viewports", () => {
  for (const [width, height] of [[360, 800], [375, 812], [390, 844], [430, 932]]) {
    const board = geometry.responsiveBoardSize(width, height);
    assert.ok(board.width <= width - 28);
    assert.ok(board.height <= height - 286);
    assert.ok(board.width >= 292);
    assert.ok(board.height >= 356);
  }
});

test("all eleven paint masks accept their center and reject distant points", () => {
  assert.equal(COLOR_REGIONS.length, 11);
  for (const region of COLOR_REGIONS) {
    assert.equal(geometry.isPointInEllipse({ x: region.x, y: region.y }, region), true);
    assert.equal(geometry.isPointInEllipse({ x: region.x + region.rx * 1.5, y: region.y }, region), false);
  }
});

test("collision and XR ray-plane conversion are deterministic", () => {
  assert.equal(geometry.rectsIntersect({ x: 0, y: 0, width: 20, height: 20 }, { x: 18, y: 18, width: 20, height: 20 }), true);
  assert.equal(geometry.rectsIntersect({ x: 0, y: 0, width: 20, height: 20 }, { x: 25, y: 25, width: 20, height: 20 }), false);
  assert.deepEqual(geometry.worldPointFromRay({ x: 0, y: 2, z: 3 }, [0.5, -1, 0.25], 0), { x: 1, y: 0, z: 3.5 });
  assert.equal(geometry.worldPointFromRay({ x: 0, y: 2, z: 3 }, [0.5, 0, 0.25], 0), null);
});

test("joint movement respects range, direction and body collision", () => {
  const origin = { x: -0.63, y: 0.52 };
  const rules = { minRadius: 0.16, maxRadius: 0.48, direction: -1, obstacles: [{ x: -0.42, y: -0.18, width: 0.84, height: 0.80 }] };
  assert.equal(geometry.jointMotionValid(origin, { x: -0.88, y: 0.55 }, rules), true);
  assert.equal(geometry.jointMotionValid(origin, { x: -0.68, y: 0.54 }, rules), false);
  assert.equal(geometry.jointMotionValid(origin, { x: -0.34, y: 0.52 }, rules), false);
  assert.equal(geometry.jointMotionValid(origin, { x: -1.30, y: 0.52 }, rules), false);
});
