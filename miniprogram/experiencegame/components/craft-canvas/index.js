const { toNormalizedPoint, toAspectFitNormalizedPoint } = require("../../../utils/geometry");

Component({
  properties: {
    stageId: String,
    baseImage: String,
    baseClass: String,
    baseWidth: { type: Number, value: 768 },
    baseHeight: { type: Number, value: 1152 },
    revealLayers: { type: Array, value: [] },
    hints: { type: Array, value: [], observer(value) { this.updateHitHints(value); } },
    tone: String,
  },
  data: { rect: null, imageFrame: null, imageFrameStyle: "", hitHints: [] },
  lifetimes: { ready() { this.measure(); } },
  methods: {
    measure() {
      wx.createSelectorQuery().in(this).select("#craft-surface").boundingClientRect((rect) => {
        if (!rect) { this.triggerEvent("fallback"); return; }
        const scale = Math.min(rect.width / this.properties.baseWidth, rect.height / this.properties.baseHeight);
        const width = this.properties.baseWidth * scale; const height = this.properties.baseHeight * scale;
        const left = (rect.width - width) / 2; const top = (rect.height - height) / 2;
        const imageFrame = { left, top, width, height };
        this.setData({ rect, imageFrame, imageFrameStyle: `left:${left}px;top:${top}px;width:${width}px;height:${height}px` });
        this.updateHitHints(this.properties.hints, imageFrame);
        this.triggerEvent("ready", { width: rect.width, height: rect.height });
      }).exec();
    },
    point(event) {
      const boardPoint = toNormalizedPoint(event.touches && event.touches[0], this.data.rect);
      return toAspectFitNormalizedPoint(boardPoint, this.data.rect && this.data.rect.width, this.data.rect && this.data.rect.height, this.properties.baseWidth, this.properties.baseHeight);
    },
    updateHitHints(hints, frame = this.data.imageFrame) {
      if (!frame) return;
      const hitHints = (Array.isArray(hints) ? hints : []).map((hint, index) => ({
        ...hint,
        index,
        left: frame.left + Number(hint.x) * frame.width,
        top: frame.top + Number(hint.y) * frame.height,
      }));
      this.setData({ hitHints });
    },
    select(event) { const point = this.point(event); if (point) this.triggerEvent("select", point); },
    selectHint(event) {
      const index = Number(event.currentTarget && event.currentTarget.dataset.index);
      const hint = this.data.hitHints && this.data.hitHints[index];
      if (!hint || hint.completed) return;
      this.triggerEvent("select", { x: Number(hint.x), y: Number(hint.y), source: "hint" });
    },
  },
});
