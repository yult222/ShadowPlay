const storage = require("../../services/storage");
const { getPlaysByIds } = require("../../data/index.js");
const { hideShareMenu } = require("../../utils/page");

Page({
  data: {
    favoritePlays: [],
  },

  onLoad() {
    hideShareMenu();
  },

  onShow() {
    hideShareMenu();
    this.loadFavorites();
  },

  loadFavorites() {
    const playIds = storage.getFavoritePlayIds();
    this.setData({
      favoritePlays: getPlaysByIds(playIds),
    });
  },

  openPlayDetail(e) {
    const playId = e.currentTarget.dataset.playId;
    wx.navigateTo({
      url: `/pages/plays/detail?playId=${playId}`,
    });
  },

  removeFavorite(e) {
    const playId = e.currentTarget.dataset.playId;
    storage.toggleFavoritePlay(playId);
    this.loadFavorites();
    wx.showToast({
      title: "已取消收藏",
      icon: "none",
    });
  },
});
