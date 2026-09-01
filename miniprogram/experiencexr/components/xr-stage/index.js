const STARTS = ["-2.25 1.05 0.12", "2.25 1.05 0.12", "-2.25 0.55 0.12", "2.25 0.55 0.12", "-2.25 0.05 0.12", "2.25 0.05 0.12", "-2.25 -0.45 0.12", "2.25 -0.45 0.12", "-2.25 -0.95 0.12", "2.25 -0.95 0.12", "0 -1.20 0.12"];
const TARGETS = [[0,1.08],[0,0.52],[-0.63,0.52],[-1.14,0.02],[0.63,0.52],[1.14,0.02],[-0.30,-0.32],[-0.32,-0.92],[0.30,-0.32],[0.32,-0.92],[0,-0.18]];
const ASSETS = ["01-head.webp","02-torso.webp","03-left-upper.webp","04-left-lower.webp","05-right-upper.webp","06-right-lower.webp","07-left-thigh.webp","08-left-leg.webp","09-right-thigh.webp","10-right-leg.webp","11-skirt.webp"];

Component({
  properties: { stageId: String, phase: String, completed: Boolean, activeIndex: { type: Number, value: 0 } },
  data: {
    renderParts: ASSETS.map((asset, index) => ({ id: `part-${index}`, asset: `/images/experience-v3/parts/${asset}`, position: STARTS[index], scale: index === 10 ? "0.52 0.48 1" : "0.30 0.38 1", fixed: false })),
    jointPins: TARGETS.slice(0, 9).map((point, index) => ({ id: `joint-${index}`, position: `${point[0]} ${point[1]} 0.22` })),
    rods: [{ id:"left", position:"-1.65 -0.70 0.16" }, { id:"center", position:"0 -1.05 0.16" }, { id:"right", position:"1.65 -0.70 0.16" }],
  },
  methods: {
    handleReady({ detail }) { this.scene = detail.value; this.triggerEvent("ready"); },
    handleLoaded() { this.triggerEvent("loaded"); },
    handleError() { this.triggerEvent("fallback"); },
    pointOnPlane(detail) {
      const value = detail && detail.value;
      if (!value || !value.camera || !value.dir) return null;
      const position = value.camera.el._components.transform.worldPosition;
      const k = (0.14 - position.z) / value.dir[2];
      if (!Number.isFinite(k) || k < 0) return null;
      return { x: position.x + k * value.dir[0], y: position.y + k * value.dir[1] };
    },
    handleLeatherTouch() { this.triggerEvent("action", { kind: "leather-view" }); },
    handleLeatherDrag({ detail }) {
      const value = detail.value;
      if (!value || !value.target) return;
      const transform = value.target._components.transform;
      transform.rotation.y += Number(value.deltaX || 0) / 120;
      transform.rotation.x += Number(value.deltaY || 0) / 180;
      this.triggerEvent("action", { kind: "leather-view" });
    },
    handlePartTouch(event) {
      if (this.properties.stageId !== "parts") return;
      const index = Number(event.currentTarget.dataset.index);
      if (index !== this.properties.activeIndex) return;
      this.setData({ [`renderParts[${index}].fixed`]: true });
      this.triggerEvent("action", { kind: "part", index });
    },
    handlePartDrag(event) {
      if (this.properties.stageId !== "joint") return;
      const index = Number(event.currentTarget.dataset.index);
      const point = this.pointOnPlane(event.detail);
      const value = event.detail.value;
      if (!point || !value || !value.target) return;
      const transform = value.target._components.transform;
      if (this.properties.phase === "test") {
        const target = TARGETS[index];
        const offset = Math.hypot(point.x - target[0], point.y - target[1]);
        if (offset <= 0.48) {
          transform.position.x = point.x; transform.position.y = point.y;
          if (offset > 0.16) this.triggerEvent("action", { kind: "joint-test", index });
        } else { transform.position.x = target[0]; transform.position.y = target[1]; }
        return;
      }
      if (this.properties.phase !== "parts") return;
      if (index !== this.properties.activeIndex) return;
      this.fixedJointIndexes = this.fixedJointIndexes || new Set();
      if (this.fixedJointIndexes.has(index)) return;
      transform.position.x = point.x; transform.position.y = point.y;
      const target = TARGETS[index];
      if (target && Math.hypot(point.x - target[0], point.y - target[1]) < 0.34) {
        transform.position.x = target[0]; transform.position.y = target[1];
        this.fixedJointIndexes.add(index);
        this.triggerEvent("action", { kind: "joint", index });
      }
    },
    handlePinTouch(event) {
      if (this.properties.stageId !== "joint" || this.properties.phase !== "pins") return;
      const index = Number(event.currentTarget.dataset.index);
      if (index === this.properties.activeIndex) this.triggerEvent("action", { kind: "pin", index });
    },
    handleRodDrag(event) {
      const index = Number(event.currentTarget.dataset.index);
      const point = this.pointOnPlane(event.detail);
      const value = event.detail.value;
      if (!point || !value || !value.target) return;
      const transform = value.target._components.transform;
      const targets = [[-0.72,0.30],[0,0.82],[0.72,0.30]];
      const target = targets[index];
      this.fixedRodIndexes = this.fixedRodIndexes || new Set();
      if (this.properties.phase === "test" && this.fixedRodIndexes.has(index)) {
        const offset = Math.hypot(point.x-target[0],point.y-target[1]);
        if (offset <= 0.48) {
          transform.position.x=point.x; transform.position.y=point.y;
          if (offset > 0.15) this.triggerEvent("action",{kind:"rod-test",index});
        } else { transform.position.x=target[0]; transform.position.y=target[1]; }
        return;
      }
      if (this.properties.phase !== "install" || this.fixedRodIndexes.has(index)) return;
      transform.position.x = point.x; transform.position.y = point.y;
      if (Math.hypot(point.x-target[0],point.y-target[1]) < 0.36) {
        transform.position.x=target[0];transform.position.y=target[1];
        this.fixedRodIndexes.add(index);this.triggerEvent("action",{kind:"rod",index});
      }
    },
    handleLightDrag({ detail }) {
      const point = this.pointOnPlane(detail);
      const value = detail.value;
      if (!point || !value || !value.target) return;
      const transform = value.target._components.transform;
      transform.position.x = Math.max(-1.6, Math.min(1.6, point.x)); transform.position.y = Math.max(-0.9, Math.min(0.9, point.y));
      if (Math.hypot(transform.position.x, transform.position.y) < 0.34) { transform.position.x=0;transform.position.y=0;this.triggerEvent("action",{kind:"light"}); }
    },
  },
});
