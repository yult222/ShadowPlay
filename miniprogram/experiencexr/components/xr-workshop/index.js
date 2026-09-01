Component({
  properties: { progress: { type: Number, value: 0 } },
  data: { pinX: -2.25 },
  observers: { progress(value) { this.setData({ pinX: -2.25 + Math.max(0, Math.min(100, Number(value) || 0)) * 0.045 }); } },
  methods: {
    handleReady({ detail }) { this.scene = detail.value; this.triggerEvent("ready"); },
    handleLoaded() { this.triggerEvent("loaded"); },
    handleError() { this.triggerEvent("fallback"); },
    handleTick({ detail }) {
      if (!this.scene) return;
      const seal = this.scene.getNodeById("red-seal");
      if (seal && seal.el && seal.el._components && seal.el._components.transform) seal.el._components.transform.rotation.z += Number(detail.value || 0) * 0.00008;
    },
  },
});
