const { toNormalizedPoint } = require("../../../utils/geometry");

Component({
  options: { multipleSlots: true },
  properties: { baseImage: String, baseClass: String, tone: String },
  data: { rect: null },
  lifetimes: { ready() { this.measure(); } },
  methods: {
    measure() {
      wx.createSelectorQuery().in(this).select("#surface").fields({ node: true, size: true, rect: true }).exec((result) => {
        const surface = result && result[0];
        if (!surface || !surface.node) { this.triggerEvent("fallback"); return; }
        const ratio = Math.min(3, Number((typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio) || 1);
        const canvas = surface.node;
        canvas.width = Math.max(1, Math.round(surface.width * ratio));
        canvas.height = Math.max(1, Math.round(surface.height * ratio));
        const context = canvas.getContext("2d");
        context.scale(ratio, ratio);
        context.lineCap = "round";
        context.lineJoin = "round";
        this.surface = { canvas, context, width: surface.width, height: surface.height, ratio };
        this.setData({ rect: surface });
        this.triggerEvent("ready", { width: surface.width, height: surface.height, ratio });
      });
    },
    pointFromEvent(event, changed = false) {
      const list = changed ? event.changedTouches : event.touches;
      return toNormalizedPoint(list && list[0], this.data.rect);
    },
    onStart(event) { const point = this.pointFromEvent(event); if (point) this.triggerEvent("pointstart", point); },
    onMove(event) { const point = this.pointFromEvent(event); if (point) this.triggerEvent("pointmove", point); },
    onEnd(event) { const point = this.pointFromEvent(event, true); this.triggerEvent("pointend", point || {}); },
    clear() { if (this.surface) this.surface.context.clearRect(0, 0, this.surface.width, this.surface.height); },
    drawSegment(from, to, color, width = 5) {
      if (!this.surface || !from || !to) return;
      const { context, width: canvasWidth, height } = this.surface;
      context.beginPath(); context.moveTo(from.x * canvasWidth, from.y * height); context.lineTo(to.x * canvasWidth, to.y * height);
      context.strokeStyle = color; context.lineWidth = width; context.stroke();
    },
    drawDot(point, color, radius = 6) {
      if (!this.surface || !point) return;
      const { context, width, height } = this.surface;
      context.beginPath(); context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2); context.fillStyle = color; context.fill();
    },
  },
});
