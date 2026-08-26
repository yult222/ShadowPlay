const { COPY } = require("../../data/experience");
const game = require("../../utils/game");
const audio = require("../../services/experienceAudio");
const { hideShareMenu } = require("../../utils/page");

Page({
  data: {
    copy: COPY,
    settingsVisible: false,
    sfxEnabled: true,
    bgmEnabled: true,
  },
  onLoad() { hideShareMenu(); },
  onShow() {
    hideShareMenu();
    audio.enterPage(this.route);
    this.setData(audio.getSettings());
  },
  onHide() { audio.leavePage(this.route); },
  onUnload() { audio.leavePage(this.route); },
  start() {
    game.createSession();
    audio.playFeedback();
    wx.navigateTo({ url: "/pages/experience/role" });
  },
  openGallery() { wx.navigateTo({ url: "/pages/experience/gallery" }); },
  openHelp() { wx.navigateTo({ url: "/pages/experience/help" }); },
  openSettings() { this.setData({ settingsVisible: true }); },
  closeSettings() { this.setData({ settingsVisible: false }); },
  changeSfx(e) {
    const sfxEnabled = e.detail.value;
    audio.setSfxEnabled(sfxEnabled);
    this.setData({ sfxEnabled });
  },
  changeBgm(e) {
    const bgmEnabled = e.detail.value;
    audio.setBgmEnabled(bgmEnabled);
    this.setData({ bgmEnabled });
  },
});
