const {
  COPY, STAGES, MATERIALS, COLORS, DRAFT_NODES, TRACE_POINTS,
  CARVE_SEGMENTS, COLOR_REGIONS, PART_TARGETS, JOINT_TARGETS, ROD_TARGETS,
} = require("../../data/experience");
const game = require("../../utils/game");
const { distance, near, toLocalPoint, pointToSegmentDistance } = require("../../utils/geometry");
const audio = require("../../services/experienceAudio");
const { hideShareMenu } = require("../../utils/page");

const BOARD_WIDTH = 320;
const BOARD_HEIGHT = 420;
const ANCHOR_IMAGE = "/images/experience-v2/xiaodan-anchor.webp";

function lineStyle(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return `left:${start.x}px;top:${start.y}px;width:${length}px;transform:rotate(${angle}deg)`;
}

function decorateSegments(points, completed) {
  return points.slice(0, -1).map((point, index) => ({
    id: `path-${index}`,
    style: lineStyle(point, points[index + 1]),
    state: index < completed ? "done" : index === completed ? "active" : "pending",
  }));
}

function dragTargets(points, kind, width, height) {
  return points.map((point, index) => ({ id: `${kind}-target-${index}`, kind, x: point.x, y: point.y, width, height }));
}

function dragItems(targets, kind) {
  return targets.map((target, index) => {
    const left = index % 2 === 0;
    const startX = left ? 10 : BOARD_WIDTH - target.width - 10;
    const startY = 18 + (index % 6) * 62;
    return {
      id: `${kind}-${index}`, kind, targetIndex: index,
      x: startX, y: startY, startX, startY,
      width: target.width, height: target.height, fixed: false,
    };
  });
}

Page({
  data: {
    copy: COPY,
    stageId: "",
    stageTitle: "",
    progress: 0,
    boardWidth: BOARD_WIDTH,
    boardHeight: BOARD_HEIGHT,
    anchorImage: ANCHOR_IMAGE,
    materials: MATERIALS,
    colors: COLORS,
    materialFeedback: "",
    materialSelected: "",
    revealCorrect: false,
    draftNodes: [],
    draftSegments: [],
    draftIndex: 0,
    traceSegments: [],
    traceIndex: 0,
    traceAlert: COPY.traceHint,
    traceTone: "",
    carveSegments: [],
    carveIndex: 0,
    carveError: false,
    selectedColor: "red",
    colorRegions: [],
    boundaryFlash: false,
    showColorResult: false,
    parts: [],
    partIndex: 0,
    dragTargets: [],
    dragItems: [],
    jointPhase: "parts",
    dragTolerance: 40,
    lightSilhouette: false,
    dragSnapCount: 0,
    completeLocked: false,
    stageRect: null,
  },

  onLoad(options) {
    hideShareMenu();
    const stageId = options.id || "";
    const stage = STAGES.find((item) => item.id === stageId);
    if (!stage || !game.enterStage(stageId)) {
      wx.navigateBack();
      return;
    }
    this.setData({ stageId, stageTitle: stage.title });
    this.initializeStage(stageId);
  },
  onShow() { audio.enterPage(this.route); },
  onHide() { audio.leavePage(this.route); },
  onUnload() { audio.leavePage(this.route); },
  onReady() { this.measureBoard(); },
  back() { wx.navigateBack(); },

  measureBoard() {
    wx.createSelectorQuery().in(this).select(".interaction-board").boundingClientRect((rect) => {
      if (rect) this.setData({ stageRect: rect });
    }).exec();
  },

  initializeStage(stageId) {
    if (stageId === "draft") {
      this.setData({
        draftNodes: DRAFT_NODES.map((node, index) => ({ ...node, id: `draft-${index}`, done: false })),
        draftSegments: decorateSegments(DRAFT_NODES, 0),
      });
    } else if (stageId === "trace") {
      this.setData({ traceSegments: decorateSegments(TRACE_POINTS, 0) });
    } else if (stageId === "carve") {
      this.setData({ carveSegments: CARVE_SEGMENTS.map((segment, index) => ({ ...segment, id: `carve-${index}`, style: lineStyle(segment.start, segment.end), state: index === 0 ? "active" : "pending" })) });
    } else if (stageId === "color") {
      this.setData({ colorRegions: COLOR_REGIONS.map((region) => ({ ...region, fillValue: COLORS.find((color) => color.id === region.colorId)?.value || "#A62B23", filled: false, recommended: false })) });
    } else if (stageId === "parts") {
      this.setData({ parts: PART_TARGETS.map((point, index) => ({ id: `part-${index}`, x: point.x, y: point.y, done: false })) });
    } else if (stageId === "joint") {
      this.setupJointParts();
    } else if (stageId === "rods") {
      this.setupRods();
    } else if (stageId === "light") {
      this.setupLight();
    }
  },

  selectMaterial(e) {
    const id = e.currentTarget.dataset.id;
    const material = MATERIALS.find((item) => item.id === id);
    if (!material) return;
    if (id === "B") {
      this.setData({ materialSelected: id, materialFeedback: COPY.flat, progress: 100 });
      audio.playFeedback();
      this.finishStage(520);
      return;
    }
    const attempts = game.failStage("leather");
    this.setData({ materialSelected: id, materialFeedback: material.issue, revealCorrect: attempts >= 2 });
  },

  tapDraftNode(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index !== this.data.draftIndex) return;
    const next = index + 1;
    this.setData({ [`draftNodes[${index}].done`]: true, draftIndex: next, draftSegments: decorateSegments(DRAFT_NODES, Math.max(0, next - 1)), progress: Math.round(next / DRAFT_NODES.length * 100) });
    audio.playFeedback();
    if (next >= DRAFT_NODES.length) this.finishStage(440);
  },

  traceStart(e) {
    const point = toLocalPoint(e.touches?.[0], this.data.stageRect);
    const current = TRACE_POINTS[this.data.traceIndex];
    const tolerance = Number(game.getSnapshot().attemptsByStage.trace || 0) >= 2 ? 38 : 26;
    this.traceActive = point && near(point, current, tolerance * 1.7);
    this.traceBlocked = false;
  },
  traceMove(e) {
    if (!this.traceActive) return;
    const point = toLocalPoint(e.touches?.[0], this.data.stageRect);
    const index = this.data.traceIndex;
    const start = TRACE_POINTS[index];
    const end = TRACE_POINTS[index + 1];
    if (!point || !end) return;
    const attempts = Number(game.getSnapshot().attemptsByStage.trace || 0);
    const tolerance = attempts >= 2 ? 38 : 24;
    const offset = pointToSegmentDistance(point, start, end);
    if (offset <= tolerance) {
      this.traceBlocked = false;
      this.setData({ traceTone: "deep", traceAlert: COPY.traceHint });
      if (near(point, end, tolerance * 1.45)) {
        const next = index + 1;
        this.setData({ traceIndex: next, traceSegments: decorateSegments(TRACE_POINTS, next), progress: Math.round(next / (TRACE_POINTS.length - 1) * 100) });
        if (next >= TRACE_POINTS.length - 1) {
          this.traceActive = false;
          audio.playFeedback();
          this.finishStage(500);
        }
      }
    } else if (offset <= tolerance * 2) {
      this.setData({ traceTone: "warn" });
    } else {
      this.traceBlocked = true;
      this.setData({ traceTone: "blocked", traceAlert: COPY.traceReturn });
    }
  },
  traceEnd() {
    if (this.traceBlocked) game.failStage("trace");
    this.traceActive = false;
  },

  carveStart(e) { this.carveTouchStart = toLocalPoint(e.touches?.[0], this.data.stageRect); },
  carveEnd(e) {
    const endPoint = toLocalPoint(e.changedTouches?.[0], this.data.stageRect);
    const segment = CARVE_SEGMENTS[this.data.carveIndex];
    if (!this.carveTouchStart || !endPoint || !segment) return;
    const attempts = Number(game.getSnapshot().attemptsByStage.carve || 0);
    const tolerance = attempts >= 2 ? 54 : 38;
    const forward = near(this.carveTouchStart, segment.start, tolerance) && near(endPoint, segment.end, tolerance);
    const reverse = near(this.carveTouchStart, segment.end, tolerance) && near(endPoint, segment.start, tolerance);
    if ((forward || reverse) && distance(this.carveTouchStart, endPoint) > 42) {
      const next = this.data.carveIndex + 1;
      const decorated = this.data.carveSegments.map((item, index) => ({ ...item, state: index < next ? "done" : index === next ? "active" : "pending" }));
      this.setData({ carveIndex: next, carveSegments: decorated, carveError: false, progress: Math.round(next / CARVE_SEGMENTS.length * 100) });
      audio.playFeedback();
      if (next >= CARVE_SEGMENTS.length) this.finishStage(500);
    } else {
      game.failStage("carve");
      this.setData({ carveError: true });
      setTimeout(() => this.setData({ carveError: false }), 360);
    }
  },

  selectColor(e) { this.setData({ selectedColor: e.currentTarget.dataset.id }); },
  fillRegion(e) {
    const index = Number(e.currentTarget.dataset.index);
    const region = this.data.colorRegions[index];
    if (!region || region.filled) return;
    if (region.colorId !== this.data.selectedColor) {
      this.setData({ [`colorRegions[${index}].recommended`]: true });
      return;
    }
    this.setData({ [`colorRegions[${index}].filled`]: true, [`colorRegions[${index}].recommended`]: false });
    audio.playFeedback();
    const nextFilled = this.data.colorRegions.filter((item, itemIndex) => item.filled || itemIndex === index).length;
    this.setData({ progress: Math.round(nextFilled / COLOR_REGIONS.length * 100) });
    if (nextFilled >= COLOR_REGIONS.length) {
      this.setData({ showColorResult: true });
      this.finishStage(900);
    }
  },
  flashBoundary() {
    this.setData({ boundaryFlash: true });
    setTimeout(() => this.setData({ boundaryFlash: false }), 300);
  },

  tapPart(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index !== this.data.partIndex) return;
    const next = index + 1;
    this.setData({ [`parts[${index}].done`]: true, partIndex: next, progress: Math.round(next / PART_TARGETS.length * 100) });
    audio.playFeedback();
    if (next >= PART_TARGETS.length) this.finishStage(500);
  },

  setupJointParts() {
    const targets = dragTargets(PART_TARGETS, "part", 30, 44);
    this.setData({ jointPhase: "parts", dragTargets: targets, dragItems: dragItems(targets, "part"), dragTolerance: 44, dragSnapCount: 0, progress: 0 });
  },
  setupJointConnectors() {
    const points = JOINT_TARGETS.map((point) => ({ x: point.x, y: point.y }));
    const targets = dragTargets(points, "connector", 18, 18);
    this.setData({ jointPhase: "connectors", dragTargets: targets, dragItems: dragItems(targets, "connector"), dragTolerance: 38, dragSnapCount: 0, progress: 56 });
  },
  setupRods() {
    const targets = ROD_TARGETS.map((point, index) => ({ id: `rod-target-${index}`, kind: "rod", x: point.x, y: point.y, width: 8, height: 126 }));
    const items = targets.map((target, index) => ({ id: `rod-${index}`, kind: "rod", targetIndex: index, x: 42 + index * 104, y: 284, startX: 42 + index * 104, startY: 284, width: 8, height: 126, fixed: false }));
    this.setData({ dragTargets: targets, dragItems: items, dragTolerance: 54, dragSnapCount: 0 });
  },
  setupLight() {
    const targets = [{ id: "light-target", kind: "figure", x: 105, y: 64, width: 110, height: 282 }];
    const items = [{ id: "light-figure", kind: "figure", targetIndex: 0, x: 12, y: 92, startX: 12, startY: 92, width: 110, height: 282, fixed: false, image: ANCHOR_IMAGE }];
    this.setData({ dragTargets: targets, dragItems: items, dragTolerance: 66, dragSnapCount: 0 });
  },
  dragSnap(e) {
    audio.playFeedback();
    const fixed = this.data.dragSnapCount + 1;
    this.setData({ dragSnapCount: fixed });
    if (this.data.stageId === "joint") {
      const total = this.data.jointPhase === "parts" ? PART_TARGETS.length : JOINT_TARGETS.length;
      const base = this.data.jointPhase === "parts" ? 0 : 56;
      const span = this.data.jointPhase === "parts" ? 56 : 44;
      this.setData({ progress: Math.max(this.data.progress, base + Math.round(fixed / total * span)) });
    } else if (this.data.stageId === "rods") {
      this.setData({ progress: Math.round(fixed / ROD_TARGETS.length * 100) });
    } else if (this.data.stageId === "light") {
      this.setData({ progress: Math.min(90, fixed * 90) });
    }
  },
  dragComplete() {
    if (this.data.stageId === "joint" && this.data.jointPhase === "parts") {
      audio.playFeedback();
      setTimeout(() => this.setupJointConnectors(), 320);
      return;
    }
    if (this.data.stageId === "light") this.setData({ lightSilhouette: true, progress: 100 });
    else this.setData({ progress: 100 });
    audio.playFeedback();
    this.finishStage(this.data.stageId === "light" ? 760 : 520);
  },

  finishStage(delay) {
    if (this.data.completeLocked) return;
    this.setData({ completeLocked: true, progress: 100 });
    if (!game.completeStage(this.data.stageId)) return;
    setTimeout(() => wx.navigateBack(), delay);
  },
});
