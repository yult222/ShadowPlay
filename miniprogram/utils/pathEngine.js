const { pointToSegmentDistance } = require("./geometry");

function densifyPath(points, gap = 0.025) {
  const source = Array.isArray(points) ? points : [];
  if (source.length < 2) return source.slice();
  const output = [{ ...source[0] }];
  for (let index = 0; index < source.length - 1; index += 1) {
    const start = source[index];
    const end = source[index + 1];
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.max(1, Math.ceil(distance / gap));
    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      output.push({ x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio });
    }
  }
  return output;
}

function normalizeCoverage(paths, coverage) {
  return paths.map((_, index) => Array.from(new Set((coverage && coverage[index]) || [])).sort((a, b) => a - b));
}

function markPathCoverage(point, paths, coverage, tolerance = 0.05, neighborSpan = 1) {
  const next = normalizeCoverage(paths, coverage);
  let hit = false;
  let nearest = Infinity;
  for (let pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
    const path = paths[pathIndex];
    const marked = new Set(next[pathIndex]);
    for (let segment = 0; segment < path.length - 1; segment += 1) {
      const offset = pointToSegmentDistance(point, path[segment], path[segment + 1]);
      nearest = Math.min(nearest, offset);
      if (offset > tolerance) continue;
      hit = true;
      for (let span = -neighborSpan; span <= neighborSpan; span += 1) {
        const candidate = segment + span;
        if (candidate >= 0 && candidate < path.length - 1) marked.add(candidate);
      }
    }
    next[pathIndex] = Array.from(marked).sort((a, b) => a - b);
  }
  return { hit, nearest, coverage: next, progress: pathCoverageProgress(paths, next) };
}

function pathCoverageProgress(paths, coverage) {
  let total = 0;
  let marked = 0;
  paths.forEach((path, index) => {
    total += Math.max(0, path.length - 1);
    marked += new Set((coverage && coverage[index]) || []).size;
  });
  return total ? marked / total : 0;
}

function pointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const a = polygon[current];
    const b = polygon[previous];
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-8) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function buildMaskCells(polygon, resolution = 28) {
  const cells = [];
  for (let row = 0; row < resolution; row += 1) {
    for (let column = 0; column < resolution; column += 1) {
      const point = { x: (column + 0.5) / resolution, y: (row + 0.5) / resolution };
      if (pointInPolygon(point, polygon)) cells.push({ key: `${column}:${row}`, x: point.x, y: point.y });
    }
  }
  return cells;
}

function paintMask(point, cells, painted, radius = 0.055) {
  const next = new Set(painted || []);
  for (const cell of cells || []) {
    if (Math.hypot(point.x - cell.x, point.y - cell.y) <= radius) next.add(cell.key);
  }
  return { painted: Array.from(next), progress: cells && cells.length ? next.size / cells.length : 0 };
}

module.exports = {
  densifyPath,
  normalizeCoverage,
  markPathCoverage,
  pathCoverageProgress,
  pointInPolygon,
  buildMaskCells,
  paintMask,
};
