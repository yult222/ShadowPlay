Component({
  options: { multipleSlots: true },
  data: { navTop: 20, navHeight: 48, headerHeight: 72, contentTop: 72 },
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
      const capsuleBottom = capsule && capsule.bottom ? capsule.bottom : statusBarHeight + 32;
      const navTop = Math.ceil(capsuleBottom + 6);
      const navHeight = 48;
      const headerHeight = navTop + navHeight + 6;
      this.setData({ navTop, navHeight, headerHeight, contentTop: headerHeight + 12 });
    },
  },
  methods: {
    onBack() { this.triggerEvent("back"); },
    onSettings() { this.triggerEvent("settings"); },
  },
});
