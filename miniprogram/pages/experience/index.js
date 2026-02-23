const audioService = require("../../services/audioService");
const { hideShareMenu } = require("../../utils/page");

Page({
  onLoad() {
    hideShareMenu();
  },

  onShow() {
    hideShareMenu();
    audioService.pausePlayAudioForExperience();
  },

  onHide() {
    audioService.resumePlayAudioAfterExperience();
  },

  onUnload() {
    audioService.resumePlayAudioAfterExperience();
  },

  goToPlaysTab() {
    wx.switchTab({
      url: "/pages/plays/index",
    });
  },
});
