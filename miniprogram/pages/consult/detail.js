const { getConsultHeadlineById } = require("../../data/index.js");
const { hideShareMenu } = require("../../utils/page");

Page({
  data: {
    article: null,
  },

  onLoad(options) {
    hideShareMenu();

    const article = getConsultHeadlineById(options.headlineId);
    if (!article || article.targetType !== "article") {
      wx.showToast({
        title: "图文不存在",
        icon: "none",
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 400);
      return;
    }

    this.setData({
      article,
    });
  },

  onShow() {
    hideShareMenu();
  },
});
