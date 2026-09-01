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

function toNormalizedPoint(touch, rect) {
  const point = toLocalPoint(touch, rect);
  if (!point || !rect.width || !rect.height) return null;
  return { x: clamp(point.x / rect.width, 0, 1), y: clamp(point.y / rect.height, 0, 1) };
}

function fromNormalizedPoint(point, width, height) {
  return { x: point.x * width, y: point.y * height };
}

function responsiveBoardSize(windowWidth, windowHeight) {
  const width = Math.max(292, Math.min(410, Number(windowWidth || 375) - 28));
  const heightLimit = Math.max(356, Number(windowHeight || 812) - 286);
  return { width, height: Math.min(Math.round(width * 1.22), heightLimit) };
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

function isPointInEllipse(point, region, padding = 0) {
  if (!point || !region) return false;
  const rx = Math.max(0.001, Number(region.rx) + padding);
  const ry = Math.max(0.001, Number(region.ry) + padding);
  const dx = (point.x - region.x) / rx;
  const dy = (point.y - region.y) / ry;
  return dx * dx + dy * dy <= 1;
}

function rectsIntersect(a, b, padding = 0) {
  return !(a.x + a.width + padding < b.x || b.x + b.width + padding < a.x || a.y + a.height + padding < b.y || b.y + b.height + padding < a.y);
}

function worldPointFromRay(camera, direction, planeY = 0) {
  if (!camera || !direction || !Number.isFinite(direction[1]) || Math.abs(direction[1]) < 1e-6) return null;
  const k = (planeY - camera.y) / direction[1];
  if (!Number.isFinite(k) || k < 0) return null;
  return { x: camera.x + k * direction[0], y: planeY, z: camera.z + k * direction[2] };
}

module.exports = {
  distance,
  clamp,
  toLocalPoint,
  toNormalizedPoint,
  fromNormalizedPoint,
  responsiveBoardSize,
  near,
  pointToSegmentDistance,
  canSnap,
  isPointInEllipse,
  rectsIntersect,
  worldPointFromRay,
};
