const audioService = require("../../services/audioService");
const { formatSecond } = require("../../utils/time");

const STATUS_LABEL_MAP = {
  Idle: "未播放",
  Loading: "加载中",
  Playing: "播放中",
  Paused: "已暂停",
  Ended: "已播完",
  Error: "播放异常",
};

Component({
  data: {
    visible: false,
    playId: "",
    title: "",
    subtitle: "",
    status: "Idle",
    statusLabel: "未播放",
    positionLabel: "00:00",
    durationLabel: "00:00",
    progressPct: 0,
    actionLabel: "播放",
    actionDisabled: false,
  },

  lifetimes: {
    attached() {
      this.unsubscribeAudio = audioService.subscribe((playerState) => {
        this.updateByPlayerState(playerState);
      });
    },

    detached() {
      if (this.unsubscribeAudio) {
        this.unsubscribeAudio();
        this.unsubscribeAudio = null;
      }
    },
  },

  methods: {
    updateByPlayerState(playerState) {
      const visible = Boolean(playerState && playerState.trackId);
      const status = playerState?.status || "Idle";

      let actionLabel = "播放";
      let actionDisabled = false;

      if (status === audioService.STATUS.PLAYING) {
        actionLabel = "暂停";
      } else if (status === audioService.STATUS.LOADING) {
        actionLabel = "加载";
        actionDisabled = true;
      } else if (status === audioService.STATUS.PAUSED) {
        actionLabel = "继续";
      } else if (status === audioService.STATUS.ENDED) {
        actionLabel = "重播";
      }

      this.setData({
        visible,
        playId: playerState.playId || "",
        title: playerState.title || "",
        subtitle: playerState.subtitle || "",
        status,
        statusLabel: STATUS_LABEL_MAP[status] || status,
        positionLabel: formatSecond(playerState.positionSec),
        durationLabel: formatSecond(playerState.durationSec),
        progressPct: Number(playerState.progressPct || 0),
        actionLabel,
        actionDisabled,
      });
    },

    openPlayDetail() {
      if (!this.data.playId) {
        return;
      }

      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.route === "pages/plays/detail") {
        return;
      }

      wx.navigateTo({
        url: `/pages/plays/detail?playId=${this.data.playId}`,
      });
    },

    onToggle(e) {
      e && e.stopPropagation && e.stopPropagation();
      if (this.data.actionDisabled) {
        return;
      }
      audioService.togglePlayPause();
    },

    onStop(e) {
      e && e.stopPropagation && e.stopPropagation();
      audioService.stop();
    },

    noop() {},
  },
});
