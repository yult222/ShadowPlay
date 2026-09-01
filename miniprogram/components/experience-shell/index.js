Component({
  options: { multipleSlots: true },
  data: { navTop: 20, navHeight: 44, headerHeight: 64, contentTop: 16 },
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
      const capsule = typeof wx.getMenuButtonBoundingClientRect === "function" ? wx.getMenuButtonBoundingClientRect() : null;
      const statusBarHeight = Number(info.statusBarHeight) || 20;
      const navTop = capsule && capsule.top ? capsule.top : statusBarHeight;
      const navHeight = capsule && capsule.height ? Math.max(44, capsule.height) : 44;
      const headerHeight = Math.ceil(navTop + navHeight + 8);
      this.setData({ navTop, navHeight, headerHeight, contentTop: headerHeight + 18 });
    },
  },
  methods: {
    onBack() { this.triggerEvent("back"); },
    onSettings() { this.triggerEvent("settings"); },
  },
});
