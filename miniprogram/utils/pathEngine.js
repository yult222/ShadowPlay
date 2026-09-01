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

function pickTapTarget(point, targets, completedIds = [], radius = 0.19) {
  if (!point) return null;
  const completed = new Set(completedIds || []);
  let nearest = null;
  for (const target of targets || []) {
    if (completed.has(target.id)) continue;
    for (const anchor of target.points || []) {
      const distance = Math.hypot(point.x - anchor.x, point.y - anchor.y);
      if (distance <= radius && (!nearest || distance < nearest.distance)) nearest = { id: target.id, distance };
    }
  }
  return nearest && nearest.id;
}

module.exports = {
  pointInPolygon,
  buildMaskCells,
  paintMask,
  pickTapTarget,
};
