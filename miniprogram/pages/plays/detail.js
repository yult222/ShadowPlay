const { getPlayById } = require("../../data/index.js");
const storage = require("../../services/storage");
const audioService = require("../../services/audioService");
const { formatSecond } = require("../../utils/time");
const { hideShareMenu } = require("../../utils/page");

const STATUS_TEXT = {
  Idle: "未播放",
  Loading: "加载中",
  Playing: "播放中",
  Paused: "已暂停",
  Ended: "已播完",
  Error: "播放异常",
};

function getNarrationTrackId(playId) {
  return `${playId}-narration`;
}

Page({
  data: {
    play: null,
    isFavorite: false,
    showNarrationText: false,
    narrationTrackId: "",
    activeTrackId: "",
    playerState: audioService.getState(),
    playerStatusText: "未播放",
    playerPositionLabel: "00:00",
    playerDurationLabel: "00:00",
    playerSeekMax: 100,
    playerSeekValue: 0,
  },

  onLoad(options) {
    hideShareMenu();

    const play = getPlayById(options.playId);
    if (!play) {
      wx.showToast({
        title: "剧目不存在",
        icon: "none",
      });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }

    this.setData({
      play,
      narrationTrackId: getNarrationTrackId(play.id),
    });

    this.refreshFavoriteState();
    this.subscribePlayer();
  },

  onShow() {
    hideShareMenu();
    this.refreshFavoriteState();
  },

  onUnload() {
    if (this.unsubscribePlayer) {
      this.unsubscribePlayer();
      this.unsubscribePlayer = null;
    }
  },

  subscribePlayer() {
    if (this.unsubscribePlayer) {
      this.unsubscribePlayer();
      this.unsubscribePlayer = null;
    }

    this.unsubscribePlayer = audioService.subscribe((playerState) => {
      const isCurrentPlay = this.data.play && playerState.playId === this.data.play.id;
      const activeTrackId = isCurrentPlay ? playerState.trackId : "";
      const durationSec = Number(playerState.durationSec || 0);
      const positionSec = Number(playerState.positionSec || 0);

      this.setData({
        playerState,
        activeTrackId,
        playerStatusText: STATUS_TEXT[playerState.status] || playerState.status,
        playerPositionLabel: formatSecond(positionSec),
        playerDurationLabel: formatSecond(durationSec),
        playerSeekMax: durationSec > 0 ? durationSec : 100,
        playerSeekValue: durationSec > 0 ? Math.min(positionSec, durationSec) : 0,
      });
    });
  },

  refreshFavoriteState() {
    const playId = this.data.play?.id;
    if (!playId) {
      return;
    }

    this.setData({
      isFavorite: storage.isFavoritePlay(playId),
    });
  },

  toggleFavorite() {
    if (!this.data.play) {
      return;
    }

    const result = storage.toggleFavoritePlay(this.data.play.id);
    this.setData({
      isFavorite: result.state,
    });

    wx.showToast({
      title: result.state ? "已收藏" : "已取消收藏",
      icon: "none",
    });
  },

  playNarration() {
    const play = this.data.play;
    if (!play || !play.narration?.audio?.url) {
      wx.showToast({
        title: "暂无解说音频",
        icon: "none",
      });
      return;
    }

    audioService.play({
      playId: play.id,
      trackId: getNarrationTrackId(play.id),
      type: "narration",
      title: `${play.title}·解说`,
      subtitle: play.title,
      cover: play.cover,
      src: play.narration.audio.url,
    });
  },

  playTrack(e) {
    const trackId = e.currentTarget.dataset.trackId;
    const play = this.data.play;
    const track = play?.tracks?.find((item) => item.id === trackId);

    if (!track || !track.url) {
      wx.showToast({
        title: "音轨不存在",
        icon: "none",
      });
      return;
    }

    audioService.play({
      playId: play.id,
      trackId: track.id,
      type: "track",
      title: `${play.title}·${track.title}`,
      subtitle: play.title,
      cover: play.cover,
      src: track.url,
    });
  },

  toggleNarrationText() {
    this.setData({
      showNarrationText: !this.data.showNarrationText,
    });
  },

  goExperience() {
    wx.switchTab({
      url: "/pages/experience/index",
    });
  },

  onMainTogglePlay() {
    audioService.togglePlayPause();
  },

  onMainStopPlay() {
    audioService.stop();
  },

  onSeekChanging(e) {
    this.setData({
      playerSeekValue: Number(e.detail.value || 0),
    });
  },

  onSeekChange(e) {
    const seekSec = Number(e.detail.value || 0);
    audioService.seek(seekSec);
  },
});
