const {
  COPY, STAGES, MATERIALS, COLORS, DRAFT_PIECES, TRACE_SHEET, CRAFT_TAP_TARGETS,
  CRAFT_REVEAL_CLIPS, COLOR_MASKS, COLOR_GROUPS, PARTS, PART_SEPARATION_GROUPS,
  JOINT_TARGETS, JOINT_DEMOS, ROD_TARGETS,
} = require("../../data/experience");
const game = require("../../utils/game");
const audio = require("../../services/experienceAudio");
const { pointInPolygon, pickTapTarget } = require("../../utils/pathEngine");
const { hideShareMenu } = require("../../utils/page");
const { canUseXR } = require("../../utils/xr");

function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function polygonClip(polygon) { return `polygon(${polygon.map((point) => `${Math.round(point.x * 1000) / 10}% ${Math.round(point.y * 1000) / 10}%`).join(",")})`; }
function craftRevealLayers(stageId, state) {
  if (stageId === "color") {
    const filled = new Set(state.filledMaskIds || []);
    return COLOR_MASKS.filter((mask) => filled.has(mask.id)).map((mask) => ({ key: `color-${mask.id}`, clip: polygonClip(mask.polygon) }));
  }
  const clips = CRAFT_REVEAL_CLIPS[stageId]; if (!clips) return [];
  return (state.selectedGroups || []).flatMap((id) => (clips[id] || []).map((clip, index) => ({ key: `${stageId}-${id}-${index}`, clip })));
}
function tapHints(stageId, state) {
  if (stageId === "carve") {
    const completed = new Set(state.selectedGroups || []);
    return CRAFT_TAP_TARGETS.carve.map((target) => ({ id: target.id, x: target.points[0].x, y: target.points[0].y, completed: completed.has(target.id), tone: "cut" }));
  }
  if (stageId === "color") {
    const completed = new Set(state.filledColorIds || []);
    const selectedColor = state.selectedColor || "red";
    return COLOR_GROUPS.map((group) => ({
      id: group.id,
      x: group.points[0].x,
      y: group.points[0].y,
      completed: completed.has(group.id),
      available: group.colorId === selectedColor,
      tone: group.colorId,
    }));
  }
  return [];
}

Page({
  data: {
    copy: COPY, stages: [], activeStageId: "", activeTitle: "", progress: 0,
    railExpanded: false, settingsVisible: false, sfxEnabled: true, bgmEnabled: true,
    boardWidth: 320, boardHeight: 520, boardTop: 150, transitioning: false, stageComplete: false,
    revealLayers: [], tapHints: [], canvasBaseClass: "", canvasTone: "", selectedColor: "red", palette: COLORS,
    dragItems: [], dragTargets: [], lightPhase: "puppet", silhouette: false,
    traceTransferred: false, partsSeparated: false, xrEnabled: false, activePhase: "",
    previewStageId: "", previewArt: "",
  },
  onLoad() {
    hideShareMenu();
    const info = typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const capsule = typeof wx.getMenuButtonBoundingClientRect === "function" ? wx.getMenuButtonBoundingClientRect() : null;
    const boardTop = Math.ceil((capsule && capsule.bottom ? capsule.bottom : Number(info.statusBarHeight || 20) + 32) + 60);
    const safeBottom = Number(info.safeArea && info.safeArea.bottom ? info.windowHeight - info.safeArea.bottom : 0);
    this.setData({ boardWidth: Math.max(320, Math.round(info.windowWidth)), boardHeight: Math.max(500, Math.round(info.windowHeight - boardTop - safeBottom)), boardTop });
  },
  onShow() { hideShareMenu(); audio.enterPage(this.route); this.setData(audio.getSettings()); this.restore(); },
  onHide() { audio.leavePage(this.route); },
  onUnload() { audio.leavePage(this.route); },
  restore() {
    const snapshot = game.getSnapshot();
    if (!snapshot.selectedRole) { wx.navigateBack(); return; }
    if (snapshot.finished) { wx.redirectTo({ url: "/experience2d/pages/result" }); return; }
    const active = snapshot.activeStage;
    if (snapshot.currentStageId !== active.id && !game.enterStage(active.id)) return;
    this.snapshot = game.getSnapshot();
    const stages = STAGES.map((stage, index) => ({ id: stage.id, title: stage.title, status: index < this.snapshot.activeStageIndex ? "completed" : index === this.snapshot.activeStageIndex ? "active" : "locked" }));
    this.setData({ stages, activeStageId: active.id, activeTitle: active.title, progress: this.snapshot.liveProgress || 0, previewStageId: "", previewArt: "", stageComplete: false });
    this.prepareStage(active.id);
  },
  checkpoint(percent, patch) {
    const stageId = this.data.activeStageId; const result = game.recordStageProgress(stageId, percent, patch);
    if (result === false) return false;
    this.snapshot = game.getSnapshot(); this.setData({ progress: this.snapshot.liveProgress }); return result;
  },
  fail() { audio.playFeedback(); return game.failStage(this.data.activeStageId); },
  complete() {
    if (this.data.transitioning || this.data.stageComplete) return;
    const outcome = game.completeStage(this.data.activeStageId); if (!outcome) return;
    audio.playFeedback(); this.setData({ stageComplete: true, railExpanded: false });
    this.completeTimer = setTimeout(() => {
      this.setData({ transitioning: true });
      this.transitionTimer = setTimeout(() => {
        if (outcome.finished) { wx.redirectTo({ url: "/experience2d/pages/result" }); return; }
        game.enterStage(outcome.nextStageId); this.setData({ transitioning: false, stageComplete: false }); this.restore();
      }, 220);
    }, 760);
  },
  prepareStage(stageId) {
    const state = deepCopy((this.snapshot.stageStateById && this.snapshot.stageStateById[stageId]) || {}); this.stageState = state;
    const config = {
      revealLayers: craftRevealLayers(stageId, state), tapHints: tapHints(stageId, state), canvasBaseClass: stageId, canvasTone: "",
      dragItems: [], dragTargets: [], silhouette: Boolean(state.silhouette), lightPhase: state.phase || "puppet",
      traceTransferred: Boolean(state.transferred), partsSeparated: Boolean(state.allSeparated),
      activePhase: state.phase || (stageId === "light" ? "puppet" : "install"), xrEnabled: canUseXR() && ["rods", "light"].includes(stageId),
    };
    if (["leather", "draft", "trace", "parts", "joint", "rods", "light"].includes(stageId)) Object.assign(config, this.dragScene(stageId, state));
    if (stageId === "color") config.selectedColor = state.selectedColor || "red";
    this.setData(config);
  },
  dragScene(stageId, state) {
    const width = this.data.boardWidth; const height = this.data.boardHeight; const px = (x) => Math.round(width * x); const py = (y) => Math.round(height * y);
    if (stageId === "leather") return this.leatherScene(state, px, py);
    if (stageId === "draft") return this.draftScene(state, px, py);
    if (stageId === "trace") return this.traceScene(state, px, py);
    if (stageId === "parts") return this.partsScene(state, px, py);
    if (stageId === "joint") return this.jointScene(state, px, py);
    if (stageId === "rods") return this.rodScene(state, px, py);
    return this.lightScene(state, px, py);
  },
  leatherScene(state, px, py) {
    const fixed = state.selected === "B";
    return {
      dragItems: MATERIALS.map((material, index) => { const slot = [0.15, 0.36, 0.57, 0.78][index]; return { id: material.id, label: material.label, image: material.asset, kind: `material ${state.hinted === material.id ? "hinted" : ""}`, width: 72, height: 64, startX: px(slot), startY: py(0.75), x: fixed && material.id === "B" ? px(0.5) - 36 : px(slot), y: fixed && material.id === "B" ? py(0.39) : py(0.75), fixed: fixed && material.id === "B" }; }),
      dragTargets: [{ id: "inspect", kind: "inspect", x: px(0.24), y: py(0.22), width: px(0.56), height: py(0.42), glow: Boolean(state.hinted) }],
    };
  },
  draftScene(state, px, py) {
    const placed = new Set(state.placed || []);
    return {
      dragItems: DRAFT_PIECES.map((piece, index) => { const done = placed.has(piece.id); const startX = px([0.14, 0.35, 0.56, 0.76][index]); const startY = py(0.79); const x = done ? px(piece.x) - piece.width / 2 : startX; const y = done ? py(piece.y) - piece.height / 2 : startY; return { id: piece.id, image: piece.asset, kind: "draft-piece", width: piece.width, height: piece.height, startX, startY, x, y, fixed: done, done }; }),
      dragTargets: DRAFT_PIECES.map((piece) => ({ id: `draft-${piece.id}`, kind: "structure-target", x: px(piece.x) - piece.width / 2 - 8, y: py(piece.y) - piece.height / 2 - 8, width: piece.width + 16, height: piece.height + 16 })),
    };
  },
  traceScene(state, px, py) {
    const done = Boolean(state.transferred); const width = 132; const height = 164; const startX = px(0.62); const startY = py(0.69); const target = { x: px(0.30), y: py(0.18), width: px(0.52), height: py(0.58) };
    return { dragItems: [{ id: TRACE_SHEET.id, image: TRACE_SHEET.asset, kind: "trace-sheet", width, height, startX, startY, x: done ? target.x + target.width / 2 - width / 2 : startX, y: done ? target.y + target.height / 2 - height / 2 : startY, fixed: done, done }], dragTargets: [{ id: "trace-target", kind: "trace-target", ...target }] };
  },
  partsScene(state, px, py) {
    if (state.allSeparated) return { dragItems: PARTS.map((part, index) => { const side = index % 2 ? 0.82 : 0.05; const x = px(side); const y = py(0.08 + (index % 6) * 0.13); return { id: part.id, image: part.asset, kind: "part", width: 58, height: 72, startX: x, startY: y, x, y, fixed: true, done: true }; }), dragTargets: [] };
    const separated = new Set(state.separatedGroups || []);
    const targets = [
      { id: "separate-top", kind: "separate", x: px(0.40), y: py(0.04), width: 76, height: 76 }, { id: "separate-left", kind: "separate", x: px(0.14), y: py(0.34), width: 76, height: 112 },
      { id: "separate-right", kind: "separate", x: px(0.78), y: py(0.34), width: 76, height: 112 }, { id: "separate-bottom-left", kind: "separate", x: px(0.20), y: py(0.77), width: 76, height: 96 },
      { id: "separate-bottom-right", kind: "separate", x: px(0.60), y: py(0.77), width: 76, height: 96 },
    ];
    return { dragItems: PART_SEPARATION_GROUPS.map((group) => { const part = group.part; const done = separated.has(group.id); const target = targets.find((item) => item.id === group.targetId); const startX = px(part.x) - 29; const startY = py(part.y) - 36; return { id: group.id, image: part.asset, kind: "part separation-piece", width: 58, height: 72, startX, startY, x: done ? target.x + 9 : startX, y: done ? target.y + 10 : startY, fixed: done, done }; }), dragTargets: targets };
  },
  jointScene(state, px, py) {
    const phase = state.phase || "pins"; const pins = new Set(state.pins || []);
    if (phase === "pins") return {
      dragItems: JOINT_DEMOS.map((demo, index) => { const id = `pin-${demo.id}`; const done = pins.has(id); const target = JOINT_TARGETS[demo.targetIndex]; const startX = px(index === 2 ? 0.80 : 0.15); const startY = py(0.16 + index * 0.22); return { id, kind: "connector", width: 44, height: 44, startX, startY, x: done ? px(target.x) - 22 : startX, y: done ? py(target.y) - 22 : startY, fixed: done, done }; }),
      dragTargets: JOINT_DEMOS.map((demo) => { const target = JOINT_TARGETS[demo.targetIndex]; return { id: `joint-${demo.id}`, kind: "connector", x: px(target.x) - 26, y: py(target.y) - 26, width: 52, height: 52 }; }),
    };
    const origin = JOINT_TARGETS[2];
    return { dragItems: [{ id: "joint-test", kind: "connector joint-handle", width: 48, height: 48, startX: px(origin.x) - 24, startY: py(origin.y) - 24, x: px(origin.x) - 24, y: py(origin.y) - 24 }], dragTargets: [{ id: "joint-move", kind: "connector motion-target", x: px(clamp(origin.x - 0.11, 0.08, 0.9)) - 28, y: py(origin.y + 0.04) - 28, width: 56, height: 56 }] };
  },
  rodScene(state, px, py) {
    const phase = state.phase || "install"; const installed = new Set(state.installed || []);
    if (phase === "install") return { dragItems: ROD_TARGETS.map((target, index) => { const id = `rod-${index}`; const done = installed.has(id); const startX = px([0.15, 0.41, 0.67][index]); const startY = py(0.80); return { id, kind: "rod", width: 44, height: 122, startX, startY, x: done ? px(target.x) - 22 : startX, y: done ? py(target.y) : startY, fixed: done, done }; }), dragTargets: ROD_TARGETS.map((target, index) => ({ id: `rod-target-${index}`, kind: "rod", x: px(target.x) - 28, y: py(target.y) - 20, width: 56, height: 94 })) };
    return { dragItems: [{ id: "rod-control", kind: "rod control", width: 48, height: 138, startX: px(0.48) - 24, startY: py(0.42), x: px(0.48) - 24, y: py(0.42) }], dragTargets: [{ id: "rod-move", kind: "rod motion-target", x: px(0.62) - 30, y: py(0.36), width: 60, height: 126 }] };
  },
  lightScene(state, px, py) {
    const phase = state.phase || "puppet";
    if (phase === "puppet") return { lightPhase: phase, dragItems: [{ id: "puppet", image: "/images/experience-v3/xiaodan-anchor.webp", kind: "puppet", width: 126, height: 236, startX: px(0.06), startY: py(0.56), x: px(0.06), y: py(0.56) }], dragTargets: [{ id: "light", kind: "light", x: px(0.31), y: py(0.17), width: px(0.48), height: py(0.58) }] };
    return { lightPhase: phase, dragItems: [{ id: "light-rod", kind: "rod control", width: 48, height: 144, startX: px(0.47), startY: py(0.58), x: px(0.47), y: py(0.58) }], dragTargets: [{ id: "light-move", kind: "rod light motion-target", x: px(0.57), y: py(0.43), width: 66, height: 112 }] };
  },
  onDrop(event) {
    const { itemId, targetId } = event.detail; const stageId = this.data.activeStageId;
    if (stageId === "leather") return this.dropLeather(itemId, targetId); if (stageId === "draft") return this.dropDraft(itemId, targetId);
    if (stageId === "trace") return this.dropTrace(itemId, targetId); if (stageId === "parts") return this.dropParts(itemId, targetId);
    if (stageId === "joint") return this.dropJoint(itemId, targetId); if (stageId === "rods") return this.dropRods(itemId, targetId);
    if (stageId === "light") return this.dropLight(itemId, targetId);
  },
  resolve(itemId, accepted, target, fixed) { const component = this.selectComponent("#drag-stage"); if (component) component.resolveDrop(itemId, { accepted, x: target && target.x, y: target && target.y, fixed, done: accepted }); },
  target(id) { return this.data.dragTargets.find((item) => item.id === id); },
  dropLeather(itemId, targetId) {
    if (targetId === "inspect" && itemId === "B") { const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + target.width / 2 - 36, y: target.y + target.height / 2 - 32 }, true); this.stageState.selected = "B"; this.checkpoint(100, { selected: "B" }); setTimeout(() => this.complete(), 360); return; }
    this.resolve(itemId, false); const attempts = this.fail(); if (attempts >= 2) { this.stageState.hinted = "B"; this.checkpoint(0, { hinted: "B" }); this.prepareStage("leather"); }
  },
  dropDraft(itemId, targetId) {
    if (targetId !== `draft-${itemId}`) { this.resolve(itemId, false); this.fail(); return; }
    const placed = Array.from(new Set([...(this.stageState.placed || []), itemId])); const target = this.target(targetId); const piece = DRAFT_PIECES.find((item) => item.id === itemId);
    this.resolve(itemId, true, { x: target.x + target.width / 2 - piece.width / 2, y: target.y + target.height / 2 - piece.height / 2 }, true); this.stageState.placed = placed; this.checkpoint((placed.length / DRAFT_PIECES.length) * 100, { placed }); if (placed.length === DRAFT_PIECES.length) setTimeout(() => this.complete(), 360);
  },
  dropTrace(itemId, targetId) {
    if (itemId !== TRACE_SHEET.id || targetId !== "trace-target") { this.resolve(itemId, false); this.fail(); return; }
    const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + target.width / 2 - 66, y: target.y + target.height / 2 - 82 }, true); this.stageState.transferred = true; this.checkpoint(100, { transferred: true }); this.setData({ traceTransferred: true }); setTimeout(() => this.complete(), 420);
  },
  dropParts(itemId, targetId) {
    const group = PART_SEPARATION_GROUPS.find((item) => item.id === itemId); if (!group || targetId !== group.targetId) { this.resolve(itemId, false); this.fail(); return; }
    const separatedGroups = Array.from(new Set([...(this.stageState.separatedGroups || []), itemId])); const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + 9, y: target.y + 10 }, true); this.stageState.separatedGroups = separatedGroups;
    const complete = separatedGroups.length === PART_SEPARATION_GROUPS.length; this.checkpoint((separatedGroups.length / PART_SEPARATION_GROUPS.length) * 100, complete ? { separatedGroups, separated: PARTS.map((part) => part.id), allSeparated: true } : { separatedGroups });
    if (complete) { this.stageState.allSeparated = true; this.stageState.separated = PARTS.map((part) => part.id); this.setData({ partsSeparated: true }); setTimeout(() => { this.prepareStage("parts"); setTimeout(() => this.complete(), 360); }, 260); }
  },
  dropJoint(itemId, targetId) {
    const phase = this.stageState.phase || "pins";
    if (phase === "pins") { const demoId = itemId.replace("pin-", ""); const expected = `joint-${demoId}`; if (targetId !== expected) { this.resolve(itemId, false); this.fail(); return; } const pins = Array.from(new Set([...(this.stageState.pins || []), itemId])); const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + target.width / 2 - 22, y: target.y + target.height / 2 - 22 }, true); this.stageState.pins = pins; this.checkpoint((pins.length / 4) * 100, { phase: "pins", pins }); if (pins.length === JOINT_DEMOS.length) { this.stageState.phase = "test"; this.checkpoint(75, { phase: "test", pins }); setTimeout(() => this.prepareStage("joint"), 300); } return; }
    if (itemId !== "joint-test" || targetId !== "joint-move") { this.resolve(itemId, false); this.fail(); return; } const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + 4, y: target.y + 4 }, true); this.stageState.tested = true; this.checkpoint(100, { phase: "done", tested: true }); setTimeout(() => this.complete(), 360);
  },
  dropRods(itemId, targetId) {
    const phase = this.stageState.phase || "install";
    if (phase === "install") { const index = itemId.split("-")[1]; const expected = `rod-target-${index}`; if (targetId !== expected) { this.resolve(itemId, false); this.fail(); return; } const installed = Array.from(new Set([...(this.stageState.installed || []), itemId])); const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + target.width / 2 - 22, y: target.y + 6 }, true); this.stageState.installed = installed; this.checkpoint((installed.length / 4) * 100, { phase: "install", installed }); if (installed.length === ROD_TARGETS.length) { this.stageState.phase = "test"; this.checkpoint(75, { phase: "test", installed }); setTimeout(() => this.prepareStage("rods"), 300); } return; }
    if (itemId !== "rod-control" || targetId !== "rod-move") { this.resolve(itemId, false); this.fail(); return; } const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + 6, y: target.y + 4 }, true); this.stageState.tested = true; this.checkpoint(100, { phase: "done", tested: true }); setTimeout(() => this.complete(), 360);
  },
  dropLight(itemId, targetId) {
    const phase = this.stageState.phase || "puppet"; const expected = phase === "puppet" ? "light" : "light-move"; if (targetId !== expected) { this.resolve(itemId, false); this.fail(); return; }
    const target = this.target(targetId); this.resolve(itemId, true, { x: target.x + target.width / 2 - 32, y: target.y + 8 }, true); if (phase === "puppet") { this.stageState.phase = "move"; this.checkpoint(50, { phase: "move" }); setTimeout(() => this.prepareStage("light"), 300); return; }
    this.stageState.silhouette = true; this.setData({ silhouette: true }); this.checkpoint(100, { phase: "done", silhouette: true }); setTimeout(() => this.complete(), 900);
  },
  xrFallback() { this.setData({ xrEnabled: false }); },
  xrAction(event) {
    const detail = event.detail || {}; const index = Number(detail.index || 0);
    if (this.data.activeStageId === "rods") { const phase = this.stageState.phase || "install"; if (phase === "install") { const id = `rod-${index}`; const installed = Array.from(new Set([...(this.stageState.installed || []), id])); this.stageState.installed = installed; this.checkpoint((installed.length / 4) * 100, { phase: "install", installed }); if (installed.length === ROD_TARGETS.length) { this.stageState.phase = "test"; this.checkpoint(75, { phase: "test", installed }); this.setData({ activePhase: "test" }); } } else if (detail.kind === "rod-test") { this.stageState.tested = true; this.checkpoint(100, { phase: "done", tested: true }); this.complete(); } return; }
    if (detail.kind === "light") { this.stageState.phase = "move"; this.checkpoint(50, { phase: "move" }); this.setData({ activePhase: "move" }); return; }
    if (detail.kind === "light-test") { this.stageState.silhouette = true; this.setData({ silhouette: true }); this.checkpoint(100, { phase: "done", silhouette: true }); setTimeout(() => this.complete(), 900); }
  },
  chooseColor(event) {
    const selectedColor = event.currentTarget.dataset.id;
    this.stageState.selectedColor = selectedColor;
    this.setData({ selectedColor, tapHints: tapHints("color", this.stageState), canvasTone: "" });
    this.checkpoint(Number(this.snapshot.progressByStage.color || 0), { selectedColor });
  },
  selectCanvas(event) {
    const point = event.detail; const id = this.data.activeStageId; if (!["carve", "color"].includes(id)) return; if (id === "color") { this.selectColorRegion(point); return; }
    const selected = this.stageState.selectedGroups || []; const targetId = pickTapTarget(point, CRAFT_TAP_TARGETS.carve, selected, 0.20);
    if (!targetId) { this.setData({ canvasTone: "error" }); setTimeout(() => this.setData({ canvasTone: "" }), 280); return; }
    const next = Array.from(new Set([...selected, targetId])); this.stageState.selectedGroups = next; this.setData({ revealLayers: craftRevealLayers(id, this.stageState), tapHints: tapHints(id, this.stageState) }); this.checkpoint(Math.round((next.length / CRAFT_TAP_TARGETS.carve.length) * 100), { selectedGroups: next }); if (next.length === CRAFT_TAP_TARGETS.carve.length) setTimeout(() => this.complete(), 360);
  },
  selectColorRegion(point) {
    const mask = COLOR_MASKS.find((candidate) => pointInPolygon(point, candidate.polygon)); if (!mask) { this.setData({ canvasTone: "error" }); setTimeout(() => this.setData({ canvasTone: "" }), 280); return; }
    const group = COLOR_GROUPS.find((candidate) => candidate.colorId === mask.colorId); const selected = COLORS.find((color) => color.id === this.data.selectedColor); if (!group || !selected) return;
    if (group.colorId !== selected.id) { this.fail(); this.setData({ recommendedColor: group.colorId, canvasTone: "warn" }); setTimeout(() => this.setData({ recommendedColor: "", canvasTone: "" }), 520); return; }
    const filledColorIds = Array.from(new Set([...(this.stageState.filledColorIds || []), group.id])); const filledMaskIds = Array.from(new Set([...(this.stageState.filledMaskIds || []), ...group.maskIds])); this.stageState.filledColorIds = filledColorIds; this.stageState.filledMaskIds = filledMaskIds;
    this.setData({ revealLayers: craftRevealLayers("color", this.stageState), tapHints: tapHints("color", this.stageState) }); this.checkpoint(Math.round((filledColorIds.length / COLOR_GROUPS.length) * 100), { filledColorIds, filledMaskIds, selectedColor: selected.id }); if (filledColorIds.length === COLOR_GROUPS.length) setTimeout(() => this.complete(), 360);
  },
  toggleRail() { this.setData({ railExpanded: !this.data.railExpanded }); },
  selectRail(event) {
    const id = event.detail && event.detail.id; const stage = STAGES.find((item) => item.id === id); const status = this.data.stages.find((item) => item.id === id); if (!stage || !status || status.status === "locked") return;
    if (status.status === "completed") { this.setData({ previewStageId: id, previewArt: stage.art, activeTitle: stage.title, railExpanded: false }); return; }
    this.setData({ previewStageId: "", previewArt: "", activeTitle: this.snapshot.activeStage.title, railExpanded: false }); this.prepareStage(this.snapshot.activeStage.id);
  },
  back() { wx.navigateBack(); }, openSettings() { this.setData({ settingsVisible: true }); }, closeSettings() { this.setData({ settingsVisible: false }); },
  changeSfx(event) { const sfxEnabled = event.detail.value; audio.setSfxEnabled(sfxEnabled); this.setData({ sfxEnabled }); },
  changeBgm(event) { const bgmEnabled = event.detail.value; audio.setBgmEnabled(bgmEnabled); this.setData({ bgmEnabled }); },
});
