const storage = require("../../services/storage");
const { getPlaysByIds } = require("../../data/index.js");
const { hideShareMenu } = require("../../utils/page");

const DEFAULT_AVATAR = "/images/avatar.png";
const DEFAULT_NICKNAME = "皮影观众";

function normalizeNickname(value) {
  const nickname = String(value || "").trim();
  return nickname || DEFAULT_NICKNAME;
}

function buildProfile(profile) {
  return {
    avatarUrl:
      profile && typeof profile.avatarUrl === "string" && profile.avatarUrl
        ? profile.avatarUrl
        : DEFAULT_AVATAR,
    nickname: normalizeNickname(profile && profile.nickname),
  };
}

Page({
  data: {
    bgmEnabled: true,
    favoriteCount: 0,
    favoritePreview: [],
    profile: {
      avatarUrl: DEFAULT_AVATAR,
      nickname: DEFAULT_NICKNAME,
    },
  },

  onLoad() {
    hideShareMenu();
    this.refreshPageData();
  },

  onShow() {
    hideShareMenu();
    this.refreshPageData();
  },

  refreshPageData() {
    const bgmEnabled = storage.getBgmEnabled();
    const favoriteIds = storage.getFavoritePlayIds();
    const favoritePlays = getPlaysByIds(favoriteIds);
    const profile = buildProfile(storage.getUserProfile());

    this.setData({
      bgmEnabled,
      favoriteCount: favoritePlays.length,
      favoritePreview: favoritePlays.slice(0, 3),
      profile,
    });
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl;
    if (!avatarUrl) {
      return;
    }

    const profile = {
      ...this.data.profile,
      avatarUrl,
    };

    this.setData({ profile });
    storage.setUserProfile(profile);
  },

  onNicknameInput(e) {
    const nickname = e.detail.value || "";
    this.setData({
      profile: {
        ...this.data.profile,
        nickname,
      },
    });
  },

  onNicknameBlur() {
    const profile = buildProfile(this.data.profile);
    this.setData({ profile });
    storage.setUserProfile(profile);
  },

  onBgmSwitchChange(e) {
    const bgmEnabled = Boolean(e.detail.value);
    storage.setBgmEnabled(bgmEnabled);

    this.setData({
      bgmEnabled,
    });

    wx.showToast({
      title: bgmEnabled ? "已开启体验BGM" : "已关闭体验BGM",
      icon: "none",
    });
  },

  openFavoritesPage() {
    wx.navigateTo({
      url: "/pages/settings/favorites",
    });
  },

  openPlayDetail(e) {
    const playId = e.currentTarget.dataset.playId;
    wx.navigateTo({
      url: `/pages/plays/detail?playId=${playId}`,
    });
  },
});
