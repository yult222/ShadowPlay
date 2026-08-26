function distance(a, b) {
  if (!a || !b) return Infinity;
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function toLocalPoint(touch, rect) {
  if (!touch) return null;
  const clientX = touch.clientX ?? touch.x ?? touch.pageX;
  const clientY = touch.clientY ?? touch.y ?? touch.pageY;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  return {
    x: clientX - Number(rect?.left || 0),
    y: clientY - Number(rect?.top || 0),
  };
}

function near(a, b, tolerance) {
  return distance(a, b) <= Number(tolerance || 0);
}

function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (!dx && !dy) return distance(point, start);
  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  );
  return distance(point, { x: start.x + t * dx, y: start.y + t * dy });
}

function canSnap(item, target, tolerance) {
  const center = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
  const targetCenter = {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
  };
  return near(center, targetCenter, tolerance);
}

module.exports = {
  distance,
  clamp,
  toLocalPoint,
  near,
  pointToSegmentDistance,
  canSnap,
};
