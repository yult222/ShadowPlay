Component({
  properties: {
    label: String,
    variant: { type: String, value: "primary" },
    disabled: Boolean,
  },
  methods: {
    activate() { if (!this.properties.disabled) this.triggerEvent("tap"); },
  },
});
