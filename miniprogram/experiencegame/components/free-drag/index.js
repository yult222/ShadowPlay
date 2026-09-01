const { clamp, toLocalPoint } = require("../../../utils/geometry");

Component({
  properties: {
    items: { type: Array, value: [] },
    targets: { type: Array, value: [] },
    width: { type: Number, value: 320 },
    height: { type: Number, value: 480 },
  },
  data: { localItems: [], rect: null, active: null },
  observers: { items(items) { this.setData({ localItems: (items || []).map((item) => ({ ...item })) }); } },
  lifetimes: { ready() { this.measure(); } },
  methods: {
    measure() { wx.createSelectorQuery().in(this).select(".free-drag").boundingClientRect((rect) => { if (rect) this.setData({ rect }); }).exec(); },
    start(event) {
      const index = Number(event.currentTarget.dataset.index); const item = this.data.localItems[index];
      if (!item || item.fixed) return;
      const point = toLocalPoint(event.touches && event.touches[0], this.data.rect); if (!point) return;
      this.setData({ active: { index, start: point, originX: item.x, originY: item.y } });
      this.triggerEvent("interaction", { itemId: item.id });
    },
    move(event) {
      const active = this.data.active; if (!active) return;
      const point = toLocalPoint(event.touches && event.touches[0], this.data.rect); if (!point) return;
      const item = this.data.localItems[active.index];
      this.setData({
        [`localItems[${active.index}].x`]: clamp(active.originX + point.x - active.start.x, 0, this.properties.width - item.width),
        [`localItems[${active.index}].y`]: clamp(active.originY + point.y - active.start.y, 0, this.properties.height - item.height),
      });
    },
    end() {
      const active = this.data.active; if (!active) return;
      const item = this.data.localItems[active.index];
      const center = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
      const target = (this.properties.targets || []).find((candidate) => center.x >= candidate.x && center.x <= candidate.x + candidate.width && center.y >= candidate.y && center.y <= candidate.y + candidate.height);
      this.setData({ active: null });
      this.triggerEvent("drop", { itemId: item.id, targetId: target ? target.id : "", x: center.x / this.properties.width, y: center.y / this.properties.height });
    },
    resolveDrop(itemId, result = {}) {
      const index = this.data.localItems.findIndex((item) => item.id === itemId); if (index < 0) return;
      const item = { ...this.data.localItems[index] };
      if (result.accepted) {
        if (Number.isFinite(result.x)) item.x = result.x;
        if (Number.isFinite(result.y)) item.y = result.y;
        item.fixed = Boolean(result.fixed);
        item.done = Boolean(result.done);
      } else { item.x = item.startX; item.y = item.startY; item.rebound = true; }
      this.setData({ [`localItems[${index}]`]: item });
      if (!result.accepted) setTimeout(() => this.setData({ [`localItems[${index}].rebound`]: false }), 260);
    },
  },
});
