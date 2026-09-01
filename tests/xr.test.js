const test = require("node:test");
const assert = require("node:assert/strict");
const xr = require("../miniprogram/utils/xr");

test("XR version comparison handles mixed segment lengths", () => {
  assert.equal(xr.compareVersions("2.27.1", "2.27.1"), 0);
  assert.equal(xr.compareVersions("3.0", "2.27.1"), 1);
  assert.equal(xr.compareVersions("2.26.9", "2.27.1"), -1);
});

test("XR capability falls back when API or SDK is unavailable", () => {
  const previous = global.wx;
  delete global.wx;
  assert.equal(xr.canUseXR(), false);
  global.wx = { getAppBaseInfo: () => ({ SDKVersion: "2.26.0" }), getDeviceInfo: () => ({ platform: "ios" }), createSelectorQuery() {} };
  assert.equal(xr.canUseXR(), false);
  global.wx = { getAppBaseInfo: () => ({ SDKVersion: "3.17.2" }), getDeviceInfo: () => ({ platform: "devtools" }), createSelectorQuery() {} };
  assert.equal(xr.canUseXR(), false);
  global.wx = { getAppBaseInfo: () => ({ SDKVersion: "3.17.2" }), getDeviceInfo: () => ({ platform: "ios" }), createSelectorQuery() {} };
  assert.equal(xr.canUseXR(), true);
  if (previous === undefined) delete global.wx;
  else global.wx = previous;
});
