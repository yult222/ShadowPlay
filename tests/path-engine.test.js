const test = require("node:test");
const assert = require("node:assert/strict");
const { densifyPath, markPathCoverage, pathCoverageProgress, pointInPolygon, buildMaskCells, paintMask } = require("../miniprogram/utils/pathEngine");
const { TRACE_POINTS, DRAFT_GROUPS, CARVE_GROUPS, COLOR_MASKS } = require("../miniprogram/data/experience");

test("continuous paths can start anywhere and keep earlier coverage", () => {
  const path = densifyPath(TRACE_POINTS, 0.02); let coverage = [];
  const middle = path[Math.floor(path.length / 2)]; let result = markPathCoverage(middle, [path], coverage, 0.04, 2);
  assert.equal(result.hit, true); coverage = result.coverage; const first = result.progress;
  result = markPathCoverage(path[3], [path], coverage, 0.04, 2);
  assert.ok(result.progress > first);
  result = markPathCoverage({ x: 0.02, y: 0.02 }, [path], result.coverage, 0.02, 1);
  assert.equal(result.hit, false); assert.ok(pathCoverageProgress([path], result.coverage) >= first);
});

test("every carving group reaches its threshold from independent strokes", () => {
  for (const group of CARVE_GROUPS) {
    const paths = group.paths.map((path) => densifyPath(path, 0.02)); let coverage = [];
    paths.forEach((path) => path.forEach((point) => { coverage = markPathCoverage(point, paths, coverage, 0.035, 1).coverage; }));
    assert.ok(pathCoverageProgress(paths, coverage) >= 0.85);
  }
});

test("interest-oriented tracing completes with broad assisted strokes", () => {
  for (const group of DRAFT_GROUPS) {
    const paths = group.paths.map((path) => densifyPath(path, 0.026)); let coverage = [];
    paths.forEach((path) => path.filter((_, index) => index % 3 === 0).forEach((point) => {
      coverage = markPathCoverage(point, paths, coverage, 0.105, 5).coverage;
    }));
    assert.ok(pathCoverageProgress(paths, coverage) >= 0.42);
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
