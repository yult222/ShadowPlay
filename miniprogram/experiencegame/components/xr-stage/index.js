Component({
  properties: { stageId: String, phase: String, completed: Boolean },
  data: { rods: [{ id: "left", position: "-1.55 -0.95 0.16" }, { id: "center", position: "0 -1.15 0.16" }, { id: "right", position: "1.55 -0.95 0.16" }] },
  lifetimes: {
    attached() { this.loadTimer = setTimeout(() => this.fallback(), 3200); },
    detached() { if (this.loadTimer) clearTimeout(this.loadTimer); },
  },
  methods: {
    ready() { this.triggerEvent("ready"); },
    loaded() { if (this.loadTimer) clearTimeout(this.loadTimer); this.loadTimer = null; this.triggerEvent("loaded"); },
    fallback() { if (this.failed) return; this.failed = true; if (this.loadTimer) clearTimeout(this.loadTimer); this.loadTimer = null; this.triggerEvent("fallback"); },
    point(detail) {
      const value = detail && detail.value; if (!value || !value.camera || !value.dir || !value.camera.el) return null;
      const position = value.camera.el._components.transform.worldPosition; const factor = (0.14 - position.z) / value.dir[2];
      if (!Number.isFinite(factor) || factor < 0) return null;
      return { x: position.x + factor * value.dir[0], y: position.y + factor * value.dir[1] };
    },
    dragRod(event) {
      const index = Number(event.currentTarget.dataset.index); const point = this.point(event.detail); const value = event.detail.value;
      if (!point || !value || !value.target) return;
      const targets = [[-0.72, 0.30], [0, 0.82], [0.72, 0.30]]; const target = targets[index]; const transform = value.target._components.transform;
      transform.position.x = point.x; transform.position.y = point.y; const distance = Math.hypot(point.x - target[0], point.y - target[1]);
      if (this.properties.phase === "install" && distance < 0.34) { transform.position.x = target[0]; transform.position.y = target[1]; this.triggerEvent("action", { kind: "rod", index }); }
      else if (this.properties.phase === "test" && distance > 0.16 && distance < 0.55) this.triggerEvent("action", { kind: "rod-test", index });
    },
    dragLight(event) {
      const point = this.point(event.detail); const value = event.detail.value; if (!point || !value || !value.target) return;
      const transform = value.target._components.transform; transform.position.x = Math.max(-1.5, Math.min(1.5, point.x)); transform.position.y = Math.max(-0.9, Math.min(0.9, point.y));
      if (Math.hypot(transform.position.x, transform.position.y) < (this.properties.phase === "puppet" ? 0.34 : 0.62)) this.triggerEvent("action", { kind: this.properties.phase === "puppet" ? "light" : "light-test" });
    },
  },
});
