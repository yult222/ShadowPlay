const audioService = require("../../services/audioService");
const { hideShareMenu } = require("../../utils/page");

// ============ 点击/滑动容错系数（你要增大半径就改这里）============
const TAP_RADIUS_SCALE = 1.45;   // 录屏演示优先：适度放宽上色点击范围
const CARVE_RADIUS_SCALE = 1.45; // 录屏演示优先：适度放宽雕刻起终点范围

// ============ 来自 坐标表.xlsx（基准画布 1600 x 2133）============
// 注意：Excel 有些 threshold/radius 为空，我按“同类默认/继承”处理（注释写清楚）
const COORDS = {
  canvas: { width: 1600, height: 2133 },

  // Sheet1: 雕刻 1~6
  carving: [
    { startX: 535, startY: 994, endX: 466, endY: 1070, threshold: 70 }, // Excel 有 70
    { startX: 466, startY: 1070, endX: 520, endY: 1179, threshold: 70 }, // Excel 空 -> 继承 70
    { startX: 520, startY: 1179, endX: 588, endY: 1074, threshold: 70 }, // Excel 空 -> 继承 70
    { startX: 588, startY: 1074, endX: 535, endY: 994, threshold: 70 },  // Excel 空 -> 继承 70
    { startX: 1114, startY: 1075, endX: 979, endY: 1157, threshold: 70 }, // Excel 空 -> 继承 70
    { startX: 979, startY: 1157, endX: 1114, endY: 1075, threshold: 70 }, // Excel 空 -> 继承 70
  ],

  // Sheet1: 上色 1~5
  coloring: [
    { points: [{ x: 855, y: 870 }], radius: 600 },
    { points: [{ x: 826, y: 1431 }], radius: 360 },
    { points: [{ x: 303, y: 1092 }, { x: 401, y: 1252 }], radius: 150 },

    // 第4步：Excel 分两行写 3 个点
    { points: [{ x: 659, y: 409 }, { x: 789, y: 621 }, { x: 1195, y: 763 }], radius: 180 },

    // 第5步：Excel 写了 4 个点（我之前漏了 786,1083）
    // radius 在 Excel 里为空 -> 工程上按继承 180
    { points: [{ x: 927, y: 654 }, { x: 633, y: 814 }, { x: 1045, y: 886 }, { x: 786, y: 1083 }], radius: 180 },
  ],
};

Page({
  data: {
    currentState: "start", // start | carving | coloring | finished

    carvingStep: 0,
    coloringStep: 0,
    displayMode: "color",

    stageWidth: 300,
    stageHeight: 400,

    sourceCanvas: COORDS.canvas,
    carvingData: COORDS.carving,
    coloringData: COORDS.coloring,

    // 上色：记录本步命中的点（必须全部点完才算完成该步）
    coloringHitSet: {},

    touchStart: { x: 0, y: 0 },
    touchEnd: { x: 0, y: 0 },

    inputLocked: false,

    currentCarvingOverlay: 0,
    currentColoringOverlay: 0,

    stageRect: null,
    highlightTimer: null,
  },

  onLoad() {
    hideShareMenu();
  },

  onShow() {
    hideShareMenu();
    audioService.pausePlayAudioForExperience();
  },

  onHide() {
    audioService.resumePlayAudioAfterExperience();
    this.stopHighlightLoop();
  },

  onUnload() {
    audioService.resumePlayAudioAfterExperience();
    this.stopHighlightLoop();
  },

  onReady() {
    this.updateStageRect();
    this.renderHighlight();
  },

  updateStageRect(done) {
    const query = wx.createSelectorQuery().in(this);
    query.select(".touch-area").boundingClientRect((rect) => {
      if (!rect) {
        if (done) done(null);
        return;
      }

      this.setData({ stageRect: rect }, () => {
        if (done) done(rect);
      });
    }).exec();
  },

  // ======== 缩放（Excel 1600x2133 -> 舞台 300x400） ========
  scalePoint(x, y) {
    const { stageWidth, stageHeight, sourceCanvas } = this.data;
    const sx = stageWidth / sourceCanvas.width;
    const sy = stageHeight / sourceCanvas.height;
    return { x: x * sx, y: y * sy };
  },

  scaleLen(len) {
    const { stageWidth, sourceCanvas } = this.data;
    const sx = stageWidth / sourceCanvas.width;
    return len * sx;
  },

  getLocalPosFromTouch(touch) {
    if (!touch) return null;

    const { stageRect } = this.data;
    const clientX = touch.clientX ?? touch.x ?? touch.pageX;
    const clientY = touch.clientY ?? touch.y ?? touch.pageY;

    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    if (!stageRect) return { x: clientX, y: clientY };

    return {
      x: clientX - stageRect.left,
      y: clientY - stageRect.top,
    };
  },

  // ======== Canvas 高亮 ========
  startHighlightLoop() {
    this.stopHighlightLoop();
    const timer = setInterval(() => this.renderHighlight(), 120);
    this.setData({ highlightTimer: timer });
  },

  stopHighlightLoop() {
    if (this.data.highlightTimer) {
      clearInterval(this.data.highlightTimer);
      this.setData({ highlightTimer: null });
    }
  },

  renderHighlight() {
    const { currentState, stageWidth: w, stageHeight: h } = this.data;
    if (currentState !== "carving" && currentState !== "coloring") return;

    const ctx = wx.createCanvasContext("highlightCanvas", this);
    ctx.clearRect(0, 0, w, h);

    // 遮罩
    ctx.setFillStyle("rgba(0,0,0,0.25)");
    ctx.fillRect(0, 0, w, h);

    const t = Date.now();
    const pulse = 0.6 + 0.4 * Math.sin(t / 180);

    // ====== 雕刻 ======
    if (currentState === "carving") {
      const step = this.data.carvingStep;
      const item = this.data.carvingData[step];
      if (!item) return ctx.draw();

      const s = this.scalePoint(item.startX, item.startY);
      const e = this.scalePoint(item.endX, item.endY);
      const r = this.scaleLen((item.threshold || 70) * CARVE_RADIUS_SCALE);

      // 虚线指引
      ctx.setStrokeStyle("rgba(255,255,255,0.9)");
      ctx.setLineWidth(3);
      ctx.setLineDash([10, 8], 0);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      ctx.setLineDash([], 0);

      const drawCircle = (p, label) => {
        ctx.setFillStyle(`rgba(255,255,255,${0.25 + 0.2 * pulse})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.setStrokeStyle("rgba(255,255,255,0.95)");
        ctx.setLineWidth(4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // 文本 clamp
        ctx.setFillStyle("rgba(255,255,255,0.95)");
        ctx.setFontSize(14);
        const textW = ctx.measureText ? ctx.measureText(label).width : 60;

        let tx = p.x + r + 6;
        let ty = p.y + 5;
        if (tx + textW + 6 > w) tx = Math.max(6, p.x - r - 6 - textW);
        if (tx < 6) tx = 6;
        if (ty < 16) ty = 16;
        if (ty > h - 6) ty = h - 6;

        ctx.fillText(label, tx, ty);
      };

      drawCircle(s, "起点");
      drawCircle(e, "终点");
      return ctx.draw();
    }

    // ====== 上色 ======
    if (currentState === "coloring") {
      const step = this.data.coloringStep;
      const item = this.data.coloringData[step];
      if (!item) return ctx.draw();

      // 点击半径：严格基于 Excel 半径，再乘容错系数
      let r = this.scaleLen((item.radius || 180) * TAP_RADIUS_SCALE);

      // cap：不要太夸张（但比你之前更宽松）
      const maxR = w * 0.48; // 你觉得还小就调到 0.55
      if (r > maxR) r = maxR;

      const hitSet = this.data.coloringHitSet || {};

      item.points.forEach((pt, idx) => {
        const p = this.scalePoint(pt.x, pt.y);
        const done = !!hitSet[idx];

        ctx.setFillStyle(`rgba(255,255,255,${(done ? 0.28 : 0.18) + 0.18 * pulse})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.setStrokeStyle("rgba(255,255,255,0.95)");
        ctx.setLineWidth(done ? 6 : 4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // 文本 clamp
        const label = item.points.length > 1 ? `点这里(${idx + 1})` : "点这里";
        ctx.setFillStyle("rgba(255,255,255,0.95)");
        ctx.setFontSize(14);

        const textW = ctx.measureText ? ctx.measureText(label).width : 60;
        let tx = p.x + r + 6;
        let ty = p.y + 5;
        if (tx + textW + 6 > w) tx = Math.max(6, p.x - r - 6 - textW);
        if (tx < 6) tx = 6;
        if (ty < 16) ty = 16;
        if (ty > h - 6) ty = h - 6;

        ctx.fillText(label, tx, ty);

        // 打勾提示
        if (done) {
          ctx.setStrokeStyle("rgba(255,255,255,0.95)");
          ctx.setLineWidth(4);
          ctx.beginPath();
          ctx.moveTo(p.x - r * 0.25, p.y);
          ctx.lineTo(p.x - r * 0.05, p.y + r * 0.18);
          ctx.lineTo(p.x + r * 0.25, p.y - r * 0.18);
          ctx.stroke();
        }
      });

      return ctx.draw();
    }
  },

  // ======== 开始 ========
  startExperience() {
    this.setData({
      currentState: "carving",
      carvingStep: 0,
      currentCarvingOverlay: 0,
      inputLocked: false,
    }, () => {
      wx.nextTick(() => {
        this.updateStageRect(() => {
          this.startHighlightLoop();
          this.renderHighlight();
        });
      });
    });
  },

  // ======== 雕刻 ========
  handleCarvingTouchStart(e) {
    if (this.data.inputLocked) return;
    const p = this.getLocalPosFromTouch(e.touches[0]);
    if (!p) return;
    this.setData({ touchStart: p });
  },

  handleCarvingTouchEnd(e) {
    if (this.data.inputLocked) return;
    const p = this.getLocalPosFromTouch(e.changedTouches[0]);
    if (!p) return;
    this.setData({ touchEnd: p });
    this.checkCarvingStroke();
  },

  checkCarvingStroke() {
    const { touchStart, touchEnd, carvingStep, carvingData } = this.data;
    const item = carvingData[carvingStep];
    if (!item) return;

    const s = this.scalePoint(item.startX, item.startY);
    const e = this.scalePoint(item.endX, item.endY);
    const thr = this.scaleLen((item.threshold || 70) * CARVE_RADIUS_SCALE);

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const dForward = dist(touchStart, s) + dist(touchEnd, e);
    const dReverse = dist(touchStart, e) + dist(touchEnd, s);
    const best = Math.min(dForward, dReverse);

    const strokeLen = dist(touchStart, touchEnd);

    if (strokeLen > this.scaleLen(60) && best <= thr * 2) {
      this.completeCarvingStep();
    }
  },

  completeCarvingStep() {
    const { carvingStep } = this.data;

    this.setData({ inputLocked: true });
    wx.vibrateShort({});

    setTimeout(() => {
      const nextStep = carvingStep + 1;
      let nextOverlay = this.data.currentCarvingOverlay;

      if (nextStep === 4) nextOverlay = 1;
      // 进入第6刀(step=5)就切到覆盖片2，避免“第6像第5”
      if (nextStep === 5) nextOverlay = 2;

      this.setData({ currentCarvingOverlay: nextOverlay });
      this.renderHighlight();

      setTimeout(() => {
        if (nextStep < this.data.carvingData.length) {
          this.setData({ carvingStep: nextStep, inputLocked: false });
          this.renderHighlight();
        } else {
          // 雕刻完成 -> 上色
          this.setData({
            currentState: "coloring",
            coloringStep: 0,
            currentColoringOverlay: 0,
            coloringHitSet: {},
            inputLocked: false,
          });
          this.startHighlightLoop();
          this.renderHighlight();
        }
      }, 500);
    }, 400);
  },

  // ======== 上色：必须点完本步所有点 ========
  handleColoringTap(e) {
    if (this.data.inputLocked) return;

    const { coloringStep, coloringData, coloringHitSet } = this.data;
    const item = coloringData[coloringStep];
    if (!item) return;

    const touch = e.changedTouches?.[0] || e.touches?.[0] || e.detail;
    const tap = this.getLocalPosFromTouch(touch);
    if (!tap) return;

    let r = this.scaleLen((item.radius || 180) * TAP_RADIUS_SCALE);
    const maxR = this.data.stageWidth * 0.48;
    if (r > maxR) r = maxR;

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    let hitIndex = -1;
    let nearestDistance = Infinity;
    for (let i = 0; i < item.points.length; i++) {
      if (coloringHitSet[i]) continue;

      const p = this.scalePoint(item.points[i].x, item.points[i].y);
      const distance = dist(tap, p);
      if (distance <= r && distance < nearestDistance) {
        hitIndex = i;
        nearestDistance = distance;
      }
    }
    if (hitIndex === -1) return;

    const newSet = { ...coloringHitSet, [hitIndex]: true };
    this.setData({ coloringHitSet: newSet });
    wx.vibrateShort({});

    const allDone = item.points.every((_, idx) => !!newSet[idx]);
    if (allDone) this.completeColoringStep();
    else this.renderHighlight();
  },

  completeColoringStep() {
    const { coloringStep } = this.data;

    this.setData({ inputLocked: true });
    wx.vibrateShort({});

    setTimeout(() => {
      const nextStep = coloringStep + 1;

      this.setData({ currentColoringOverlay: nextStep });
      this.renderHighlight();

      setTimeout(() => {
        if (nextStep < this.data.coloringData.length) {
          this.setData({
            coloringStep: nextStep,
            coloringHitSet: {},
            inputLocked: false,
          });
          this.renderHighlight();
        } else {
          this.setData({ currentState: "finished", inputLocked: false });
          this.stopHighlightLoop();
        }
      }, 500);
    }, 300);
  },

  // ======== 成品 ========
  toggleDisplayMode() {
    this.setData({
      displayMode: this.data.displayMode === "color" ? "silhouette" : "color",
    });
  },

  save成品() {
    wx.showToast({ title: "保存成功", icon: "success" });
  },

  restartExperience() {
    this.stopHighlightLoop();
    this.setData({
      currentState: "start",
      carvingStep: 0,
      coloringStep: 0,
      currentCarvingOverlay: 0,
      currentColoringOverlay: 0,
      coloringHitSet: {},
      displayMode: "color",
      inputLocked: false,
    });
  },

  backToStart() {
    this.stopHighlightLoop();
    this.setData({
      currentState: "start",
      carvingStep: 0,
      coloringStep: 0,
      currentCarvingOverlay: 0,
      currentColoringOverlay: 0,
      coloringHitSet: {},
      displayMode: "color",
      inputLocked: false,
    });
  },

  goToPlaysTab() {
    wx.switchTab({ url: "/pages/plays/index" });
  },
});
