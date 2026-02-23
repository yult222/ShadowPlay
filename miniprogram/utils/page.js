function hideShareMenu() {
  if (!wx.hideShareMenu) {
    return;
  }

  try {
    wx.hideShareMenu({
      menus: ["shareAppMessage", "shareTimeline"],
    });
  } catch (error) {
    wx.hideShareMenu();
  }
}

module.exports = {
  hideShareMenu,
};
