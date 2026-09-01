const { toNormalizedPoint } = require("../../../utils/geometry");

Component({
  properties: {
    stageId: String,
    baseImage: String,
    baseClass: String,
    guidePaths: { type: Array, value: [] },
    tone: String,
  },
  data: { rect: null },
  lifetimes: { ready() { this.measure(); } },
  methods: {
    measure() {
      const query = wx.createSelectorQuery().in(this);
      query.select("#craft-surface").fields({ node: true, size: true });
      query.select("#craft-surface").boundingClientRect();
      query.exec((result) => {
        const surface = result && result[0]; const rect = result && result[1];
        if (!surface || !surface.node) { this.triggerEvent("fallback"); return; }
        const info = typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync();
        const ratio = Math.min(3, Number(info.pixelRatio) || 1);
        const canvas = surface.node;
        canvas.width = Math.max(1, Math.round(surface.width * ratio));
        canvas.height = Math.max(1, Math.round(surface.height * ratio));
        const context = canvas.getContext("2d");
        context.scale(ratio, ratio); context.lineCap = "round"; context.lineJoin = "round";
        this.surface = { canvas, context, width: surface.width, height: surface.height, ratio };
        this.setData({ rect: rect || { left: 0, top: 0, width: surface.width, height: surface.height } });
        this.drawGuides();
        this.triggerEvent("ready", { width: surface.width, height: surface.height, ratio });
      });
    },
    point(event, changed = false) {
      const touches = changed ? event.changedTouches : event.touches;
      return toNormalizedPoint(touches && touches[0], this.data.rect);
    },
    select(event) { const point = this.point(event); if (point) this.triggerEvent("select", point); },
    clear() { if (this.surface) this.surface.context.clearRect(0, 0, this.surface.width, this.surface.height); },
    drawGuides() {
      if (!this.surface) return;
      const { context, width, height } = this.surface;
      context.save(); context.setLineDash([6, 8]); context.lineWidth = 3; context.strokeStyle = "rgba(226,182,96,.72)";
      for (const path of this.properties.guidePaths || []) {
        if (!path || path.length < 2) continue;
        context.beginPath(); context.moveTo(path[0].x * width, path[0].y * height);
        for (let index = 1; index < path.length; index += 1) context.lineTo(path[index].x * width, path[index].y * height);
        context.stroke();
      }
      context.restore();
    },
    drawSegment(from, to, color = "#5a3c24", lineWidth = 4) {
      if (!this.surface || !from || !to) return;
      const { context, width, height } = this.surface;
      context.beginPath(); context.moveTo(from.x * width, from.y * height); context.lineTo(to.x * width, to.y * height);
      context.strokeStyle = color; context.lineWidth = lineWidth; context.stroke();
    },
    drawDot(point, color = "#5a3c24", radius = 6) {
      if (!this.surface || !point) return;
      const { context, width, height } = this.surface;
      context.beginPath(); context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2); context.fillStyle = color; context.fill();
    },
    redrawCoverage(paths, coverage, color = "#5a3c24", lineWidth = 4) {
      (paths || []).forEach((path, pathIndex) => {
        const marked = new Set((coverage && coverage[pathIndex]) || []);
        marked.forEach((segment) => this.drawSegment(path[segment], path[segment + 1], color, lineWidth));
      });
    },
    drawPaths(paths, color = "#5a3c24", lineWidth = 4) {
      for (const path of paths || []) {
        if (!path || path.length < 2) continue;
        for (let index = 0; index < path.length - 1; index += 1) this.drawSegment(path[index], path[index + 1], color, lineWidth);
      }
    },
    fillPolygon(polygon, color, alpha = 0.78) {
      if (!this.surface || !polygon || polygon.length < 3) return;
      const { context, width, height } = this.surface;
      context.save(); context.globalAlpha = alpha; context.beginPath(); context.moveTo(polygon[0].x * width, polygon[0].y * height);
      for (let index = 1; index < polygon.length; index += 1) context.lineTo(polygon[index].x * width, polygon[index].y * height);
      context.closePath(); context.fillStyle = color; context.fill(); context.strokeStyle = "rgba(83,46,24,.72)"; context.lineWidth = 2; context.stroke(); context.restore();
    },
  },
});
