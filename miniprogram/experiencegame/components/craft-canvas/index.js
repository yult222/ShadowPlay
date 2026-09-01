const { toNormalizedPoint, toAspectFitNormalizedPoint } = require("../../../utils/geometry");

Component({
  properties: {
    stageId: String,
    baseImage: String,
    baseClass: String,
    baseWidth: { type: Number, value: 768 },
    baseHeight: { type: Number, value: 1152 },
    revealLayers: { type: Array, value: [] },
    tone: String,
  },
  data: { rect: null, imageFrameStyle: "" },
  lifetimes: { ready() { this.measure(); } },
  methods: {
    measure() {
      wx.createSelectorQuery().in(this).select("#craft-surface").boundingClientRect((rect) => {
        if (!rect) { this.triggerEvent("fallback"); return; }
        const scale = Math.min(rect.width / this.properties.baseWidth, rect.height / this.properties.baseHeight);
        const width = this.properties.baseWidth * scale; const height = this.properties.baseHeight * scale;
        const left = (rect.width - width) / 2; const top = (rect.height - height) / 2;
        this.setData({ rect, imageFrameStyle: `left:${left}px;top:${top}px;width:${width}px;height:${height}px` });
        this.triggerEvent("ready", { width: rect.width, height: rect.height });
      }).exec();
    },
    point(event) {
      const boardPoint = toNormalizedPoint(event.touches && event.touches[0], this.data.rect);
      return toAspectFitNormalizedPoint(boardPoint, this.data.rect && this.data.rect.width, this.data.rect && this.data.rect.height, this.properties.baseWidth, this.properties.baseHeight);
    },
    select(event) { const point = this.point(event); if (point) this.triggerEvent("select", point); },
  },
});
