Component({
  properties: {
    stages: { type: Array, value: [] },
    expanded: Boolean,
    progress: Number,
  },
  methods: {
    toggle() { this.triggerEvent("toggle"); },
    select(event) {
      const item = this.properties.stages[Number(event.currentTarget.dataset.index)];
      if (item && item.status === "active") this.triggerEvent("stage", { id: item.id });
    },
  },
});
