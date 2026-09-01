const {
  COPY, STAGES, MATERIALS, COLORS, DRAFT_GROUPS, TRACE_POINTS, CARVE_GROUPS,
  COLOR_MASKS, PARTS, JOINT_TARGETS, ROD_TARGETS,
} = require("../../data/experience");
const game = require("../../utils/game");
const audio = require("../../services/experienceAudio");
const {
  densifyPath, markPathCoverage, pathCoverageProgress, pointInPolygon, buildMaskCells, paintMask,
} = require("../../utils/pathEngine");
const { hideShareMenu } = require("../../utils/page");
const { canUseXR } = require("../../utils/xr");

const TRACE_PATH = densifyPath(TRACE_POINTS, 0.014);
const DRAFT_PATHS = DRAFT_GROUPS.map((group) => ({ ...group, paths: group.paths.map((path) => densifyPath(path, 0.018)) }));
const CARVE_PATHS = CARVE_GROUPS.map((group) => ({ ...group, paths: group.paths.map((path) => densifyPath(path, 0.016)) }));
const MASKS = COLOR_MASKS.map((mask) => ({ ...mask, cells: buildMaskCells(mask.polygon, 34) }));

function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

Page({
  data: {
    copy: COPY, stages: [], activeStageId: "", activeTitle: "", progress: 0,
    railExpanded: false, settingsVisible: false, sfxEnabled: true, bgmEnabled: true,
    boardWidth: 320, boardHeight: 520, boardTop: 150, transitioning: false,
    canvasGuides: [], canvasBaseClass: "", canvasTone: "", selectedColor: "red", palette: COLORS,
    dragItems: [], dragTargets: [], dragVersion: 0, lightPhase: "puppet", silhouette: false,
    xrEnabled: false, activePhase: "",
  },
  onLoad() {
    hideShareMenu();
    const info = typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const capsule = typeof wx.getMenuButtonBoundingClientRect === "function" ? wx.getMenuButtonBoundingClientRect() : null;
    const boardTop = Math.ceil((capsule && capsule.bottom ? capsule.bottom : Number(info.statusBarHeight || 20) + 32) + 60);
    const safeBottom = Number(info.safeArea && info.safeArea.bottom ? info.windowHeight - info.safeArea.bottom : 0);
    this.setData({
      boardWidth: Math.max(320, Math.round(info.windowWidth)),
      boardHeight: Math.max(500, Math.round(info.windowHeight - boardTop - safeBottom)),
      boardTop,
    });
  },
  onShow() {
    hideShareMenu(); audio.enterPage(this.route); this.setData(audio.getSettings());
    this.restore();
  },
  onHide() { audio.leavePage(this.route); },
  onUnload() { audio.leavePage(this.route); },
  restore() {
    const snapshot = game.getSnapshot();
    if (!snapshot.selectedRole) { wx.navigateBack(); return; }
    if (snapshot.finished) { wx.redirectTo({ url: "/experience2d/pages/result" }); return; }
    const active = snapshot.activeStage;
    if (snapshot.currentStageId !== active.id && !game.enterStage(active.id)) return;
    this.snapshot = game.getSnapshot();
    const stages = STAGES.map((stage, index) => ({
      id: stage.id, title: stage.title,
      status: index < this.snapshot.activeStageIndex ? "completed" : index === this.snapshot.activeStageIndex ? "active" : "locked",
    }));
    this.setData({ stages, activeStageId: active.id, activeTitle: active.title, progress: this.snapshot.liveProgress || 0 });
    this.prepareStage(active.id);
  },
  checkpoint(percent, patch) {
    const stageId = this.data.activeStageId;
    const result = game.recordStageProgress(stageId, percent, patch);
    if (result === false) return;
    this.snapshot = game.getSnapshot();
    this.setData({ progress: this.snapshot.liveProgress });
  },
  fail() { return game.failStage(this.data.activeStageId); },
  complete() {
    if (this.data.transitioning) return;
    const outcome = game.completeStage(this.data.activeStageId);
    if (!outcome) return;
    audio.playFeedback(); this.setData({ transitioning: true, railExpanded: false });
    setTimeout(() => {
      if (outcome.finished) { wx.redirectTo({ url: "/experience2d/pages/result" }); return; }
      game.enterStage(outcome.nextStageId);
      this.setData({ transitioning: false });
      this.restore();
    }, 220);
  },
  prepareStage(stageId) {
    this.stroke = null;
    const state = deepCopy((this.snapshot.stageStateById && this.snapshot.stageStateById[stageId]) || {});
    this.stageState = state;
    const config = {
      canvasGuides: [], canvasBaseClass: stageId, canvasTone: "", dragItems: [], dragTargets: [],
      silhouette: Boolean(state.silhouette), activePhase: state.phase || (stageId === "light" ? "puppet" : "install"),
      xrEnabled: canUseXR() && ["rods", "light"].includes(stageId),
    };
    if (stageId === "draft") config.canvasGuides = DRAFT_PATHS.flatMap((group) => group.paths);
    if (stageId === "trace") config.canvasGuides = [TRACE_PATH];
    if (stageId === "carve") config.canvasGuides = CARVE_PATHS.flatMap((group) => group.paths);
    if (["leather", "parts", "joint", "rods", "light"].includes(stageId)) Object.assign(config, this.dragScene(stageId, state));
    if (stageId === "color") config.selectedColor = state.selectedColor || "red";
    this.setData(config);
  },
  dragScene(stageId, state) {
    const width = this.data.boardWidth; const height = this.data.boardHeight;
    const px = (x) => Math.round(width * x); const py = (y) => Math.round(height * y);
    if (stageId === "leather") {
      const fixed = state.selected === "B";
      return {
        dragItems: MATERIALS.map((material, index) => ({
          id: material.id, label: material.label, image: material.asset, kind: `material ${state.hinted === material.id ? "hinted" : ""}`,
          width: 72, height: 64, startX: px(0.08 + index * 0.22), startY: py(0.75),
          x: fixed && material.id === "B" ? px(0.5) - 55 : px(0.08 + index * 0.22),
          y: fixed && material.id === "B" ? py(0.39) : py(0.75), fixed: fixed && material.id === "B",
        })),
        dragTargets: [{ id: "inspect", kind: "inspect", x: px(0.24), y: py(0.22), width: px(0.56), height: py(0.42), glow: Boolean(state.hinted) }],
      };
    }
    if (stageId === "parts") {
      const separated = new Set(state.separated || []);
      return {
        dragItems: PARTS.map((part, index) => {
          const done = separated.has(part.id); const side = index % 2 ? 0.82 : 0.06;
          const x = done ? px(side) : px(part.x) - 29; const y = done ? py(0.12 + (index % 6) * 0.12) : py(part.y) - 36;
          return { id: part.id, image: part.asset, kind: "part", width: 58, height: 72, startX: x, startY: y, x, y, fixed: done, done };
        }),
        dragTargets: [
          { id: "tray-left", kind: "tray", x: 0, y: py(0.06), width: px(0.22), height: py(0.84) },
          { id: "tray-right", kind: "tray", x: px(0.78), y: py(0.06), width: px(0.22), height: py(0.84) },
        ],
      };
    }
    if (stageId === "joint") return this.jointScene(state, px, py);
    if (stageId === "rods") return this.rodScene(state, px, py);
    return this.lightScene(state, px, py);
  },
  jointScene(state, px, py) {
    const phase = state.phase || "parts"; const placed = new Set(state.placed || []); const pins = new Set(state.pins || []); const tested = new Set(state.tested || []);
    if (phase === "parts") {
      return {
        dragItems: PARTS.map((part, index) => {
          const done = placed.has(part.id); const startX = px(index % 2 ? 0.82 : 0.05); const startY = py(0.08 + (index % 6) * 0.13);
          const x = done ? px(part.x) - 28 : startX; const y = done ? py(part.y) - 34 : startY;
          return { id: part.id, image: part.asset, kind: "part", width: 56, height: 68, startX, startY, x, y, fixed: done };
        }),
        dragTargets: PARTS.map((part) => ({ id: `target-${part.id}`, kind: "part-target", x: px(part.x) - 34, y: py(part.y) - 42, width: 68, height: 84 })),
      };
    }
    if (phase === "pins") {
      return {
        dragItems: JOINT_TARGETS.map((target, index) => {
          const id = `pin-${index}`; const done = pins.has(id); const startX = px(0.06); const startY = py(0.1 + index * 0.085);
          return { id, kind: "connector", width: 26, height: 26, startX, startY, x: done ? px(target.x) - 13 : startX, y: done ? py(target.y) - 13 : startY, fixed: done };
        }),
        dragTargets: JOINT_TARGETS.map((target, index) => ({ id: `joint-${index}`, kind: "connector", x: px(target.x) - 22, y: py(target.y) - 22, width: 44, height: 44 })),
      };
    }
    return {
      dragItems: JOINT_TARGETS.map((target, index) => {
        const id = `test-${index}`; const done = tested.has(id); const x = px(target.x) - 22; const y = py(target.y) - 22;
        return { id, kind: "connector joint-handle", width: 44, height: 44, startX: x, startY: y, x, y, done };
      }),
      dragTargets: JOINT_TARGETS.map((target, index) => ({ id: `move-${index}`, kind: "connector", x: px(clamp(target.x + (index % 2 ? 0.07 : -0.07), 0.1, 0.9)) - 24, y: py(clamp(target.y + 0.035, 0.1, 0.9)) - 24, width: 48, height: 48 })),
    };
  },
  rodScene(state, px, py) {
    const phase = state.phase || "install"; const installed = new Set(state.installed || []); const tested = new Set(state.tested || []);
    return {
      dragItems: ROD_TARGETS.map((target, index) => {
        const id = `rod-${index}`; const done = phase === "install" ? installed.has(id) : tested.has(id); const startX = px(0.14 + index * 0.28); const startY = py(0.82);
        const x = phase === "install" && done ? px(target.x) - 10 : phase === "test" ? px(target.x) - 10 : startX;
        const y = phase === "install" && done ? py(target.y) : phase === "test" ? py(target.y) : startY;
        return { id, kind: "rod", width: 20, height: 122, startX: x, startY: y, x, y, fixed: phase === "install" && done, done: phase === "test" && done };
      }),
      dragTargets: ROD_TARGETS.map((target, index) => ({ id: `${phase === "install" ? "rod-target" : "rod-move"}-${index}`, kind: "rod", x: px(target.x) - 26 + (phase === "test" ? (index - 1) * 28 : 0), y: py(target.y) - 20, width: 52, height: 84 })),
    };
  },
  lightScene(state, px, py) {
    const phase = state.phase || "puppet";
    if (phase === "puppet") return {
      lightPhase: phase,
      dragItems: [{ id: "puppet", image: "/images/experience-v3/xiaodan-anchor.webp", kind: "puppet", width: 126, height: 236, startX: px(0.06), startY: py(0.56), x: px(0.06), y: py(0.56) }],
      dragTargets: [{ id: "light", kind: "light", x: px(0.31), y: py(0.17), width: px(0.48), height: py(0.58) }],
    };
    return {
      lightPhase: phase,
      dragItems: [{ id: "light-rod", kind: "rod", width: 22, height: 144, startX: px(0.47), startY: py(0.58), x: px(0.47), y: py(0.58) }],
      dragTargets: [{ id: "light-move", kind: "rod light", x: px(0.57), y: py(0.43), width: 66, height: 112 }],
    };
  },
  onDrop(event) {
    const { itemId, targetId } = event.detail; const stageId = this.data.activeStageId;
    if (stageId === "leather") return this.dropLeather(itemId, targetId);
    if (stageId === "parts") return this.dropParts(itemId, targetId);
    if (stageId === "joint") return this.dropJoint(itemId, targetId);
    if (stageId === "rods") return this.dropRods(itemId, targetId);
    if (stageId === "light") return this.dropLight(itemId, targetId);
  },
  resolve(itemId, accepted, target, fixed) {
    this.selectComponent("#drag-stage").resolveDrop(itemId, { accepted, x: target && target.x, y: target && target.y, fixed, done: accepted });
  },
  target(id) { return this.data.dragTargets.find((item) => item.id === id); },
  dropLeather(itemId, targetId) {
    if (targetId === "inspect" && itemId === "B") {
      const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + target.width / 2 - 55, y: target.y + target.height / 2 - 32 }, true);
      this.checkpoint(100, { selected: "B" }); setTimeout(() => this.complete(), 320); return;
    }
    this.resolve(itemId, false); const attempts = this.fail();
    if (attempts >= 2) { this.stageState.hinted = "B"; this.checkpoint(0, { hinted: "B" }); this.prepareStage("leather"); }
  },
  dropParts(itemId, targetId) {
    const valid = targetId === "tray-left" || targetId === "tray-right";
    if (!valid) { this.resolve(itemId, false); this.fail(); return; }
    const separated = Array.from(new Set([...(this.stageState.separated || []), itemId]));
    const target = this.target(targetId); const index = separated.length - 1;
    this.resolve(itemId, true, { x: target.x + 6 + (index % 2) * 22, y: target.y + 10 + (index % 6) * 58 }, true);
    this.stageState.separated = separated; this.checkpoint((separated.length / PARTS.length) * 100, { separated });
    if (separated.length === PARTS.length) setTimeout(() => this.complete(), 280);
  },
  dropJoint(itemId, targetId) {
    const phase = this.stageState.phase || "parts";
    const expected = phase === "parts" ? `target-${itemId}` : phase === "pins" ? `joint-${itemId.split("-")[1]}` : `move-${itemId.split("-")[1]}`;
    if (targetId !== expected) { this.resolve(itemId, false); this.fail(); return; }
    const key = phase === "parts" ? "placed" : phase === "pins" ? "pins" : "tested";
    const total = phase === "parts" ? PARTS.length : JOINT_TARGETS.length;
    const list = Array.from(new Set([...(this.stageState[key] || []), itemId])); const target = this.target(targetId);
    this.resolve(itemId, true, { x: target.x + target.width / 2 - (phase === "parts" ? 28 : 13), y: target.y + target.height / 2 - (phase === "parts" ? 34 : 13) }, phase !== "test");
    this.stageState[key] = list;
    const base = phase === "parts" ? 0 : phase === "pins" ? 38 : 70; const span = phase === "parts" ? 38 : phase === "pins" ? 32 : 30;
    this.checkpoint(base + (list.length / total) * span, { phase, [key]: list });
    if (list.length === total) {
      if (phase === "test") { setTimeout(() => this.complete(), 280); return; }
      this.stageState.phase = phase === "parts" ? "pins" : "test";
      this.checkpoint(phase === "parts" ? 38 : 70, this.stageState); setTimeout(() => this.prepareStage("joint"), 220);
    }
  },
  dropRods(itemId, targetId) {
    const phase = this.stageState.phase || "install"; const index = itemId.split("-")[1]; const expected = `${phase === "install" ? "rod-target" : "rod-move"}-${index}`;
    if (targetId !== expected) { this.resolve(itemId, false); this.fail(); return; }
    const key = phase === "install" ? "installed" : "tested"; const list = Array.from(new Set([...(this.stageState[key] || []), itemId])); const target = this.target(targetId);
    this.resolve(itemId, true, { x: target.x + target.width / 2 - 10, y: target.y + 6 }, phase === "install");
    this.stageState[key] = list; this.checkpoint((phase === "install" ? 0 : 50) + (list.length / 3) * 50, { phase, [key]: list });
    if (list.length === 3) {
      if (phase === "test") { setTimeout(() => this.complete(), 280); return; }
      this.stageState.phase = "test"; this.checkpoint(50, this.stageState); setTimeout(() => this.prepareStage("rods"), 220);
    }
  },
  dropLight(itemId, targetId) {
    const phase = this.stageState.phase || "puppet"; const expected = phase === "puppet" ? "light" : "light-move";
    if (targetId !== expected) { this.resolve(itemId, false); this.fail(); return; }
    const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + target.width / 2 - 32, y: target.y + 8 }, true);
    if (phase === "puppet") { this.stageState.phase = "move"; this.checkpoint(60, { phase: "move" }); setTimeout(() => this.prepareStage("light"), 240); return; }
    this.stageState.silhouette = true; this.setData({ silhouette: true }); this.checkpoint(100, { phase: "done", silhouette: true }); setTimeout(() => this.complete(), 560);
  },
  xrFallback() { this.setData({ xrEnabled: false }); },
  xrAction(event) {
    const detail = event.detail || {}; const index = Number(detail.index || 0);
    if (this.data.activeStageId === "rods") {
      const phase = this.stageState.phase || "install"; const key = phase === "install" ? "installed" : "tested"; const id = `rod-${index}`;
      const list = Array.from(new Set([...(this.stageState[key] || []), id])); this.stageState[key] = list;
      this.checkpoint((phase === "install" ? 0 : 50) + (list.length / 3) * 50, { phase, [key]: list });
      if (list.length === 3) {
        if (phase === "test") this.complete();
        else { this.stageState.phase = "test"; this.checkpoint(50, this.stageState); this.setData({ activePhase: "test" }); }
      }
      return;
    }
    if (detail.kind === "light") { this.stageState.phase = "move"; this.checkpoint(60, { phase: "move" }); this.setData({ activePhase: "move" }); return; }
    if (detail.kind === "light-test") { this.stageState.silhouette = true; this.setData({ silhouette: true }); this.checkpoint(100, { phase: "done", silhouette: true }); setTimeout(() => this.complete(), 520); }
  },
  chooseColor(event) { const selectedColor = event.currentTarget.dataset.id; this.stageState.selectedColor = selectedColor; this.setData({ selectedColor }); this.checkpoint(Number(this.snapshot.progressByStage.color || 0), { selectedColor }); },
  onCanvasReady() {
    const canvas = this.selectComponent("#craft-canvas"); if (!canvas) return;
    const id = this.data.activeStageId; const state = this.stageState;
    if (id === "draft") DRAFT_PATHS.forEach((group) => canvas.redrawCoverage(group.paths, (state.coverage || {})[group.id], "#5a3c24", 4));
    if (id === "trace") canvas.redrawCoverage([TRACE_PATH], state.coverage, "#5a3c24", 4);
    if (id === "carve") CARVE_PATHS.forEach((group) => canvas.redrawCoverage(group.paths, (state.coverage || {})[group.id], "#4f2d19", 3));
    if (id === "color") (state.paintPoints || []).forEach((entry) => canvas.drawDot(entry.point, entry.color, 8));
  },
  strokeStart(event) { this.stroke = { previous: event.detail, hit: false, moved: false }; this.paintPoint(event.detail); },
  strokeMove(event) { if (!this.stroke) return; this.stroke.moved = true; this.paintPoint(event.detail); this.stroke.previous = event.detail; },
  strokeEnd() { if (!this.stroke) return; if (!this.stroke.hit) this.fail(); this.stroke = null; },
  paintPoint(point) {
    const id = this.data.activeStageId; if (!["draft", "trace", "carve", "color"].includes(id)) return;
    const canvas = this.selectComponent("#craft-canvas"); if (!canvas) return;
    const previous = this.stroke && this.stroke.previous ? this.stroke.previous : point;
    if (id === "draft") return this.paintDraft(point, previous, canvas);
    if (id === "trace") return this.paintTrace(point, previous, canvas);
    if (id === "carve") return this.paintCarve(point, previous, canvas);
    return this.paintColor(point, canvas);
  },
  paintDraft(point, previous, canvas) {
    const all = this.stageState.coverage || {}; let hit = false; let completed = 0; let totalProgress = 0;
    DRAFT_PATHS.forEach((group) => {
      const result = markPathCoverage(point, group.paths, all[group.id], 0.065, 2); all[group.id] = result.coverage; hit = hit || result.hit;
      totalProgress += result.progress; if (result.progress >= 0.7) completed += 1;
    });
    if (hit) { canvas.drawSegment(previous, point, "#5a3c24", 5); this.stroke.hit = true; }
    this.stageState.coverage = all; const progress = Math.min(100, Math.round((totalProgress / DRAFT_PATHS.length) * 100 / 0.7));
    this.checkpoint(progress, { coverage: all }); if (completed === DRAFT_PATHS.length) this.complete();
  },
  paintTrace(point, previous, canvas) {
    const tolerance = Number(this.snapshot.attemptsByStage.trace || 0) >= 2 ? 0.075 : 0.052;
    const result = markPathCoverage(point, [TRACE_PATH], this.stageState.coverage, tolerance, 2); this.stageState.coverage = result.coverage;
    if (result.hit) { canvas.drawSegment(previous, point, "#5a3c24", 4); this.stroke.hit = true; }
    else if (result.nearest <= tolerance * 1.65) canvas.drawSegment(previous, point, "#d5a62a", 4);
    const progress = Math.min(100, Math.round(result.progress * 100 / 0.88)); this.checkpoint(progress, { coverage: result.coverage });
    if (result.progress >= 0.88) this.complete();
  },
  paintCarve(point, previous, canvas) {
    const tolerance = Number(this.snapshot.attemptsByStage.carve || 0) >= 2 ? 0.065 : 0.045;
    const all = this.stageState.coverage || {}; let hit = false; let completed = 0; let sum = 0;
    CARVE_PATHS.forEach((group) => { const result = markPathCoverage(point, group.paths, all[group.id], tolerance, 2); all[group.id] = result.coverage; hit = hit || result.hit; sum += result.progress; if (result.progress >= 0.85) completed += 1; });
    canvas.drawSegment(previous, point, hit ? "#4f2d19" : "#a62b23", hit ? 3 : 4); if (hit) this.stroke.hit = true;
    this.stageState.coverage = all; this.checkpoint(Math.min(100, Math.round((sum / CARVE_PATHS.length) * 100 / 0.85)), { coverage: all });
    if (completed === CARVE_PATHS.length) this.complete();
  },
  paintColor(point, canvas) {
    const mask = MASKS.find((candidate) => pointInPolygon(point, candidate.polygon)); if (!mask) return;
    const selected = COLORS.find((color) => color.id === this.data.selectedColor); if (!selected) return;
    if (mask.colorId !== selected.id) { this.fail(); this.setData({ recommendedColor: mask.colorId }); setTimeout(() => this.setData({ recommendedColor: "" }), 420); return; }
    const painted = this.stageState.painted || {}; const result = paintMask(point, mask.cells, painted[mask.id], 0.06); painted[mask.id] = result.painted;
    const paintPoints = this.stageState.paintPoints || []; if (!paintPoints.length || Math.hypot(point.x - paintPoints[paintPoints.length - 1].point.x, point.y - paintPoints[paintPoints.length - 1].point.y) > 0.018) paintPoints.push({ point, color: selected.value });
    canvas.drawDot(point, selected.value, 9); this.stroke.hit = true; this.stageState.painted = painted; this.stageState.paintPoints = paintPoints.slice(-620);
    const completeCount = MASKS.filter((candidate) => ((painted[candidate.id] || []).length / candidate.cells.length) >= 0.7).length;
    const sum = MASKS.reduce((value, candidate) => value + Math.min(0.7, (painted[candidate.id] || []).length / candidate.cells.length), 0);
    this.checkpoint(Math.round((sum / (MASKS.length * 0.7)) * 100), { painted, paintPoints: this.stageState.paintPoints, selectedColor: selected.id });
    if (completeCount === MASKS.length) this.complete();
  },
  toggleRail() { this.setData({ railExpanded: !this.data.railExpanded }); },
  selectRail() { this.setData({ railExpanded: false }); },
  back() { wx.navigateBack(); },
  openSettings() { this.setData({ settingsVisible: true }); },
  closeSettings() { this.setData({ settingsVisible: false }); },
  changeSfx(event) { const sfxEnabled = event.detail.value; audio.setSfxEnabled(sfxEnabled); this.setData({ sfxEnabled }); },
  changeBgm(event) { const bgmEnabled = event.detail.value; audio.setBgmEnabled(bgmEnabled); this.setData({ bgmEnabled }); },
});
