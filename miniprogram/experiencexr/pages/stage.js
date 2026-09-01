const {
  COPY, STAGES, MATERIALS, COLORS, DRAFT_NODES, TRACE_POINTS, CARVE_PATHS,
  COLOR_REGIONS, PARTS, JOINT_TARGETS, ROD_TARGETS,
} = require("../../data/experience");
const game = require("../../utils/game");
const { distance, pointToSegmentDistance, isPointInEllipse, responsiveBoardSize } = require("../../utils/geometry");
const { canUseXR } = require("../../utils/xr");
const audio = require("../../services/experienceAudio");
const { hideShareMenu } = require("../../utils/page");

const ANCHOR_IMAGE = "/images/experience-v3/xiaodan-anchor.webp";
const COLOR_THRESHOLD = 5;

function nodeStyle(node) { return `left:calc(${node.x * 100}% - 15px);top:calc(${node.y * 100}% - 15px)`; }
function regionStyle(region) { return `left:${(region.x-region.rx)*100}%;top:${(region.y-region.ry)*100}%;width:${region.rx*200}%;height:${region.ry*200}%`; }
function unique(list) { return Array.from(new Set(list)); }

Page({
  data: {
    copy: COPY, stageId: "", stageTitle: "", progress: 0, anchorImage: ANCHOR_IMAGE,
    materials: MATERIALS, colors: COLORS, xrEnabled: false, xrCompleted: false,
    materialSelected: "", materialFeedback: "", revealCorrect: false, leatherViewed: false,
    draftNodes: [], draftIndex: 0, traceIndex: 0, traceTone: "", traceAlert: COPY.traceHint,
    carvePathIndex: 0, carvePointIndex: 0, carveError: false,
    selectedColor: "red", colorRegions: [], boundaryFlash: false, showColorResult: false,
    parts: [], partIndex: 0, jointPhase: "parts", jointIndex: 0, jointTests: [],
    rodPhase: "install", rodIndexes: [], rodTests: [],
    fallbackItems: [], fallbackTargets: [], boardWidth: 320, boardHeight: 420, dragTolerance: 44,
  },

  onLoad(options) {
    hideShareMenu();
    const stageId = options.id || "";
    const stage = STAGES.find((item) => item.id === stageId);
    if (!stage || stage.renderer !== "xr" || !game.enterStage(stageId)) { wx.navigateBack(); return; }
    const info = typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const board = responsiveBoardSize(info.windowWidth, info.windowHeight);
    this.setData({ stageId, stageTitle: stage.title, xrEnabled: stage.renderer === "xr" && canUseXR(), boardWidth: board.width, boardHeight: board.height });
    this.initializeStage(stageId);
  },
  onShow() { audio.enterPage(this.route); },
  onHide() { audio.leavePage(this.route); },
  onUnload() { audio.leavePage(this.route); if (this.finishTimer) clearTimeout(this.finishTimer); },
  back() { wx.navigateBack(); },

  initializeStage(stageId) {
    if (stageId === "draft") this.setData({ draftNodes: DRAFT_NODES.map((item, index) => ({ ...item, id: `draft-${index}`, style: nodeStyle(item), done: false })) });
    if (stageId === "color") this.setData({ colorRegions: COLOR_REGIONS.map((item) => ({ ...item, style: regionStyle(item), filled: false, recommended: false })) });
    if (stageId === "parts") this.setData({ parts: PARTS.map((item, index) => ({ ...item, index, done: false })) });
    if (["joint", "rods", "light"].includes(stageId) && !this.data.xrEnabled) this.setupFallback(stageId);
  },

  xrFallback() {
    this.setData({ xrEnabled: false });
    if (["joint", "rods", "light"].includes(this.data.stageId)) this.setupFallback(this.data.stageId);
  },
  xrAction({ detail }) {
    const { kind, index } = detail || {};
    if (kind === "leather-view") { this.setData({ leatherViewed: true }); return; }
    if (kind === "part" && index === this.data.partIndex) {
      const next = index + 1; this.setData({ partIndex: next, progress: Math.round(next / PARTS.length * 100) }); audio.playFeedback();
      if (next === PARTS.length) this.finishStage(420); return;
    }
    if (kind === "joint" && this.data.jointPhase === "parts" && index === this.data.jointIndex) {
      const next = index + 1;
      if (next === PARTS.length) this.setData({ jointPhase: "pins", jointIndex: 0, progress: 55 });
      else this.setData({ jointIndex: next, progress: Math.round(next / PARTS.length * 55) });
      audio.playFeedback(); return;
    }
    if (kind === "pin" && this.data.jointPhase === "pins" && index === this.data.jointIndex) {
      const next = index + 1;
      if (next === JOINT_TARGETS.length) this.setData({ jointPhase: "test", jointIndex: 0, progress: 84 });
      else this.setData({ jointIndex: next, progress: 55 + Math.round(next / JOINT_TARGETS.length * 29) });
      audio.playFeedback(); return;
    }
    if (kind === "joint-test" && this.data.jointPhase === "test") {
      const tests = unique(this.data.jointTests.concat(index));
      this.setData({ jointTests: tests, progress: 84 + Math.round(tests.length / 9 * 16) });
      if (tests.length >= 9) this.finishStage(460); return;
    }
    if (kind === "rod" && this.data.rodPhase === "install") {
      const rods = unique(this.data.rodIndexes.concat(index));
      if (rods.length >= 3) this.setData({ rodIndexes: rods, rodPhase: "test", progress: 72 });
      else this.setData({ rodIndexes: rods, progress: Math.round(rods.length / 3 * 72) });
      audio.playFeedback(); return;
    }
    if (kind === "rod-test" && this.data.rodPhase === "test") {
      const tests = unique(this.data.rodTests.concat(index));
      this.setData({ rodTests: tests, progress: 72 + Math.round(tests.length / 3 * 28) });
      audio.playFeedback(); if (tests.length >= 3) this.finishStage(480); return;
    }
    if (kind === "light") { this.setData({ xrCompleted: true, progress: 100 }); audio.playFeedback(); this.finishStage(700); }
  },

  selectMaterial(event) { this.setData({ materialSelected: event.currentTarget.dataset.id, materialFeedback: "" }); audio.playFeedback(); },
  confirmMaterial() {
    const material = MATERIALS.find((item) => item.id === this.data.materialSelected);
    if (!material) return;
    if (material.id === "B") { this.setData({ materialFeedback: COPY.flat, progress: 100 }); audio.playFeedback(); this.finishStage(620); return; }
    const attempts = game.failStage("leather");
    this.setData({ materialFeedback: material.issue, revealCorrect: attempts >= 2 });
  },

  tapDraftNode(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (index !== this.data.draftIndex) return;
    const next = index + 1;
    this.setData({ [`draftNodes[${index}].done`]: true, draftIndex: next, progress: Math.round(next / DRAFT_NODES.length * 100) });
    audio.playFeedback(); if (next === DRAFT_NODES.length) this.finishStage(520);
  },

  canvasReady() { this.canvas = this.selectComponent("#game-canvas"); },
  canvasStart({ detail }) {
    this.canvas = this.canvas || this.selectComponent("#game-canvas");
    if (this.data.stageId === "trace") {
      const attempts = Number(game.getSnapshot().attemptsByStage.trace || 0); const tolerance = attempts >= 2 ? 0.072 : 0.052;
      this.traceActive = distance(detail, TRACE_POINTS[this.data.traceIndex]) <= tolerance * 1.7; this.lastPoint = detail; this.traceBlocked = false;
    } else if (this.data.stageId === "carve") {
      const path = CARVE_PATHS[this.data.carvePathIndex]; const attempts = Number(game.getSnapshot().attemptsByStage.carve || 0); const tolerance = attempts >= 2 ? 0.075 : 0.052;
      this.carveActive = path && distance(detail, path[this.data.carvePointIndex]) <= tolerance * 1.8; this.lastPoint = detail;
    } else if (this.data.stageId === "color") { this.paint(detail, true); this.lastPoint = detail; }
  },
  canvasMove({ detail }) {
    if (this.data.stageId === "trace") this.traceMove(detail);
    else if (this.data.stageId === "carve") this.carveMove(detail);
    else if (this.data.stageId === "color") this.paint(detail, false);
  },
  canvasEnd() {
    if (this.data.stageId === "trace" && this.traceBlocked) game.failStage("trace");
    if (this.data.stageId === "carve" && this.data.carveError) game.failStage("carve");
    this.traceActive = false; this.carveActive = false; this.lastPoint = null;
  },
  traceMove(point) {
    if (!this.traceActive || !this.lastPoint) return;
    const index = this.data.traceIndex; const end = TRACE_POINTS[index + 1]; if (!end) return;
    const attempts = Number(game.getSnapshot().attemptsByStage.trace || 0); const tolerance = attempts >= 2 ? 0.060 : 0.040;
    const offset = pointToSegmentDistance(point, TRACE_POINTS[index], end);
    if (offset <= tolerance) {
      this.canvas.drawSegment(this.lastPoint, point, "#4f3423", 5); this.setData({ traceTone: "", traceAlert: COPY.traceHint }); this.traceBlocked = false;
      if (distance(point, end) <= tolerance * 1.5) {
        const next = index + 1; this.setData({ traceIndex: next, progress: Math.round(next / (TRACE_POINTS.length - 1) * 100) });
        if (next >= TRACE_POINTS.length - 1) { this.traceActive = false; audio.playFeedback(); this.finishStage(540); }
      }
    } else if (offset <= tolerance * 2) { this.canvas.drawSegment(this.lastPoint, point, "#d5a62a", 5); this.setData({ traceTone: "warn" }); }
    else { this.traceBlocked = true; this.setData({ traceTone: "blocked", traceAlert: COPY.traceReturn }); }
    this.lastPoint = point;
  },
  carveMove(point) {
    if (!this.carveActive || !this.lastPoint) return;
    const path = CARVE_PATHS[this.data.carvePathIndex]; const nextPoint = path && path[this.data.carvePointIndex + 1]; if (!nextPoint) return;
    const attempts = Number(game.getSnapshot().attemptsByStage.carve || 0); const tolerance = attempts >= 2 ? 0.070 : 0.045;
    const offset = pointToSegmentDistance(point, path[this.data.carvePointIndex], nextPoint);
    if (offset <= tolerance) {
      this.canvas.drawSegment(this.lastPoint, point, "#6b3f24", 4); this.setData({ carveError: false });
      if (distance(point, nextPoint) <= tolerance * 1.5) {
        const pointIndex = this.data.carvePointIndex + 1;
        if (pointIndex >= path.length - 1) {
          const pathIndex = this.data.carvePathIndex + 1;
          this.setData({ carvePathIndex: pathIndex, carvePointIndex: 0, progress: Math.round(pathIndex / CARVE_PATHS.length * 100) }); this.carveActive = false; audio.playFeedback();
          if (pathIndex >= CARVE_PATHS.length) this.finishStage(560);
        } else this.setData({ carvePointIndex: pointIndex });
      }
    } else { this.canvas.drawSegment(this.lastPoint, point, "#a62b23", 5); this.setData({ carveError: true }); }
    this.lastPoint = point;
  },
  selectColor(event) { this.setData({ selectedColor: event.currentTarget.dataset.id }); },
  paint(point, start) {
    const regionIndex = COLOR_REGIONS.findIndex((region) => isPointInEllipse(point, region));
    if (regionIndex < 0) { this.flashBoundary(); return; }
    const region = this.data.colorRegions[regionIndex]; if (region.filled) return;
    if (region.colorId !== this.data.selectedColor) { this.setData({ [`colorRegions[${regionIndex}].recommended`]: true }); return; }
    const color = COLORS.find((item) => item.id === this.data.selectedColor).value;
    if (start || !this.lastPoint) this.canvas.drawDot(point, color, 8); else this.canvas.drawSegment(this.lastPoint, point, color, 16);
    this.colorCoverage = this.colorCoverage || {};
    const localX = Math.floor((point.x - (region.x-region.rx)) / (region.rx * 2) * 6); const localY = Math.floor((point.y - (region.y-region.ry)) / (region.ry * 2) * 6);
    const cells = this.colorCoverage[region.id] || new Set(); cells.add(`${localX}:${localY}`); this.colorCoverage[region.id] = cells;
    if (cells.size >= COLOR_THRESHOLD) {
      this.setData({ [`colorRegions[${regionIndex}].filled`]: true, [`colorRegions[${regionIndex}].recommended`]: false }); audio.playFeedback();
      const complete = this.data.colorRegions.filter((item, index) => item.filled || index === regionIndex).length;
      this.setData({ progress: Math.round(complete / COLOR_REGIONS.length * 100) });
      if (complete === COLOR_REGIONS.length) { this.setData({ showColorResult: true }); this.finishStage(1050); }
    }
    this.lastPoint = point;
  },
  flashBoundary() { this.setData({ boundaryFlash: true }); clearTimeout(this.boundaryTimer); this.boundaryTimer = setTimeout(() => this.setData({ boundaryFlash: false }), 280); },

  tapFallbackPart(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (index !== this.data.partIndex) return;
    const next = index + 1;
    this.setData({ [`parts[${index}].done`]: true, partIndex: next, progress: Math.round(next / PARTS.length * 100) });
    audio.playFeedback(); if (next === PARTS.length) this.finishStage(460);
  },

  setupFallback(stageId) {
    const width = this.data.boardWidth; const height = this.data.boardHeight;
    if (stageId === "joint") {
      const targets = PARTS.map((part, index) => ({ id:`target-${index}`,kind:"part",x:part.x*width-22,y:part.y*height-29,width:44,height:58 }));
      const items = PARTS.map((part,index)=>({id:`part-${index}`,kind:"part",targetIndex:index,x:index%2?width-50:6,y:8+(index%6)*62,startX:index%2?width-50:6,startY:8+(index%6)*62,width:44,height:58,fixed:false,image:part.asset}));
      this.setData({fallbackTargets:targets,fallbackItems:items,dragTolerance:48,jointPhase:"parts",jointIndex:0});
    } else if (stageId === "rods") {
      const targets=ROD_TARGETS.map((p,index)=>({id:`target-${index}`,kind:"rod",x:p.x*width-5,y:p.y*height-58,width:10,height:116}));
      const items=targets.map((target,index)=>({id:`rod-${index}`,kind:"rod",targetIndex:index,x:45+index*(width-100)/2,y:height-126,startX:45+index*(width-100)/2,startY:height-126,width:10,height:116,fixed:false}));
      this.setData({fallbackTargets:targets,fallbackItems:items,dragTolerance:54,rodPhase:"install",rodIndexes:[],rodTests:[]});
    } else if (stageId === "light") {
      this.setData({fallbackTargets:[{id:"light-target",kind:"figure",x:width*.33,y:height*.16,width:width*.34,height:height*.68}],fallbackItems:[{id:"light-figure",kind:"figure",targetIndex:0,x:8,y:height*.2,startX:8,startY:height*.2,width:width*.32,height:height*.64,fixed:false,image:ANCHOR_IMAGE}],dragTolerance:70});
    }
  },
  fallbackSnap() { audio.playFeedback(); },
  fallbackComplete() {
    if (this.data.stageId === "joint" && this.data.jointPhase === "parts") {
      const width=this.data.boardWidth,height=this.data.boardHeight;
      const targets=JOINT_TARGETS.map((p,index)=>({id:`pin-target-${index}`,kind:"connector",x:p.x*width-9,y:p.y*height-9,width:18,height:18}));
      const items=targets.map((target,index)=>({id:`pin-${index}`,kind:"connector",targetIndex:index,x:index%2?width-26:8,y:20+(index%5)*54,startX:index%2?width-26:8,startY:20+(index%5)*54,width:18,height:18,fixed:false}));
      this.setData({jointPhase:"pins",fallbackTargets:targets,fallbackItems:items,progress:55,dragTolerance:38}); return;
    }
    if (this.data.stageId === "joint" && this.data.jointPhase === "pins") {
      const width=this.data.boardWidth,height=this.data.boardHeight;
      const targets=JOINT_TARGETS.map((p,index)=>({id:`test-target-${index}`,kind:"connector",x:Math.min(width-18,Math.max(0,p.x*width-9+(index%2?24:-24))),y:Math.min(height-18,Math.max(0,p.y*height-9+(index%3===0?-20:20))),width:18,height:18}));
      const items=JOINT_TARGETS.map((p,index)=>({id:`test-${index}`,kind:"connector",targetIndex:index,x:p.x*width-9,y:p.y*height-9,startX:p.x*width-9,startY:p.y*height-9,width:18,height:18,fixed:false}));
      this.setData({jointPhase:"test",fallbackTargets:targets,fallbackItems:items,progress:84,dragTolerance:34}); return;
    }
    if (this.data.stageId === "rods" && this.data.rodPhase === "install") {
      const width=this.data.boardWidth,height=this.data.boardHeight;
      const targets=ROD_TARGETS.map((p,index)=>({id:`rod-test-target-${index}`,kind:"rod",x:Math.min(width-10,Math.max(0,p.x*width-5+(index-1)*28)),y:Math.min(height-116,Math.max(0,p.y*height-58-30)),width:10,height:116}));
      const items=ROD_TARGETS.map((p,index)=>({id:`rod-test-${index}`,kind:"rod",targetIndex:index,x:p.x*width-5,y:p.y*height-58,startX:p.x*width-5,startY:p.y*height-58,width:10,height:116,fixed:false}));
      this.setData({rodPhase:"test",fallbackTargets:targets,fallbackItems:items,progress:72,dragTolerance:52}); return;
    }
    this.setData({ progress:100, xrCompleted:this.data.stageId==="light" }); this.finishStage(this.data.stageId==="light"?700:480);
  },

  finishStage(delay) {
    if (this.finishing) return; this.finishing = true;
    game.recordStageProgress(this.data.stageId, 100);
    this.finishTimer = setTimeout(() => { if (game.completeStage(this.data.stageId)) wx.navigateBack(); else this.finishing = false; }, delay);
  },
});
