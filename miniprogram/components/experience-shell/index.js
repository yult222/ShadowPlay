Component({
  options: { multipleSlots: true },
  data: { statusBarHeight: 0 },
  properties: {
    title: String,
    showBack: Boolean,
    showSettings: Boolean,
    backLabel: String,
    settingsLabel: String,
    fullBleed: Boolean,
  },
  lifetimes: {
    attached() {
      const info = typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.setData({ statusBarHeight: Number(info.statusBarHeight) || 0 });
    },
  },
  methods: {
    onBack() { this.triggerEvent("back"); },
    onSettings() { this.triggerEvent("settings"); },
  },
});
