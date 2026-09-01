const storage = require("./services/storage");
const experienceGame = require("./utils/game");

App({
  globalData: {
    appName: "唐山皮影",
    experienceGame,
  },

  onLaunch() {
    storage.ensureDefaults();
  },
});
