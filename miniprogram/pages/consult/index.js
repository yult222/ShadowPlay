const { consultBanners, consultHeadlines } = require("../../data/index.js");
const { hideShareMenu } = require("../../utils/page");

Page({
  data: {
    banners: [],
    headlines: [],
  },

  onLoad() {
    hideShareMenu();
    this.setData({
      banners: consultBanners,
      headlines: consultHeadlines,
    });
  },

  onShow() {
    hideShareMenu();
  },

  onTapBanner(e) {
    const targetType = e.currentTarget.dataset.targetType;
    const targetId = e.currentTarget.dataset.targetId || "";
    this.openTarget(targetType, targetId);
  },

  onTapHeadline(e) {
    const targetType = e.currentTarget.dataset.targetType;
    const targetId = e.currentTarget.dataset.targetId || "";
    this.openTarget(targetType, targetId);
  },

  openTarget(targetType, targetId) {
    if (targetType === "play" && targetId) {
      wx.navigateTo({
        url: `/pages/plays/detail?playId=${targetId}`,
      });
      return;
    }

    if (targetType === "experience") {
      wx.switchTab({
        url: "/pages/experience/index",
      });
      return;
    }

    if (targetType === "article" && targetId) {
      wx.navigateTo({
        url: `/pages/consult/detail?headlineId=${targetId}`,
      });
      return;
    }

    wx.showToast({
      title: "内容即将上线",
      icon: "none",
    });
  },
});
