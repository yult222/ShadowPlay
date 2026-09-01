function compareVersions(a, b) {
  const left = String(a || "0").split(".").map(Number);
  const right = String(b || "0").split(".").map(Number);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] || 0) - (right[index] || 0);
    if (difference) return difference > 0 ? 1 : -1;
  }
  return 0;
}

function canUseXR() {
  try {
    const info = typeof wx.getAppBaseInfo === "function" ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
    const device = typeof wx.getDeviceInfo === "function" ? wx.getDeviceInfo() : info;
    return device.platform !== "devtools" && compareVersions(info.SDKVersion, "2.27.1") >= 0 && typeof wx.createSelectorQuery === "function";
  } catch (error) {
    return false;
  }
}

module.exports = { compareVersions, canUseXR };
