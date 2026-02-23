const storage = require("./services/storage");

App({
  globalData: {
    appName: "唐山皮影",
  },

  onLaunch() {
    storage.ensureDefaults();
  },
});
