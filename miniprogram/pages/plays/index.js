const { plays } = require("../../data/index.js");
const { hideShareMenu } = require("../../utils/page");

Page({
  data: {
    plays: [],
  },

  onLoad() {
    hideShareMenu();
    this.setData({ plays });
  },

  onShow() {
    hideShareMenu();
  },

  openPlayDetail(e) {
    const playId = e.currentTarget.dataset.playId;
    wx.navigateTo({
      url: `/pages/plays/detail?playId=${playId}`,
    });
  },
});
