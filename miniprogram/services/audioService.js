const storage = require("./storage");

const STATUS = {
  IDLE: "Idle",
  LOADING: "Loading",
  PLAYING: "Playing",
  PAUSED: "Paused",
  ENDED: "Ended",
  ERROR: "Error",
};

const PLAYER_EVENT = {
  CHANGE: "change",
};

const manager = wx.getBackgroundAudioManager();
const listeners = new Set();

const state = {
  status: STATUS.IDLE,
  playId: "",
  trackId: "",
  type: "",
  title: "",
  subtitle: "",
  cover: "",
  src: "",
  positionSec: 0,
  durationSec: 0,
  progressPct: 0,
  error: null,
};

let resumeToken = storage.getAudioResumeToken();
let inExperience = false;
let suspendedByExperience = false;

function toSecond(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function calcProgress(positionSec, durationSec) {
  if (!durationSec) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round((positionSec / durationSec) * 100))
  );
}

function snapshot() {
  return {
    ...state,
  };
}

function notify() {
  const data = snapshot();
  listeners.forEach((listener) => {
    listener(data, PLAYER_EVENT.CHANGE);
  });
}

function setState(partialState) {
  Object.assign(state, partialState);
  notify();
}

function clearResumeToken() {
  resumeToken = null;
  storage.setAudioResumeToken(null);
}

function setResumeToken(token) {
  resumeToken = token;
  storage.setAudioResumeToken(token);
}

function resetTrack(override = {}) {
  Object.assign(state, {
    playId: "",
    trackId: "",
    type: "",
    title: "",
    subtitle: "",
    cover: "",
    src: "",
    positionSec: 0,
    durationSec: 0,
    progressPct: 0,
    error: null,
    ...override,
  });
}

function bindPlayerEvents() {
  manager.onPlay(() => {
    setState({
      status: STATUS.PLAYING,
      error: null,
    });
  });

  manager.onPause(() => {
    if (state.status !== STATUS.ENDED) {
      setState({ status: STATUS.PAUSED });
    }
  });

  manager.onStop(() => {
    resetTrack({ status: STATUS.IDLE });
    notify();

    if (inExperience) {
      suspendedByExperience = false;
      clearResumeToken();
    }
  });

  manager.onEnded(() => {
    const durationSec = toSecond(manager.duration || state.durationSec);
    setState({
      status: STATUS.ENDED,
      positionSec: durationSec,
      durationSec,
      progressPct: 100,
    });
  });

  manager.onTimeUpdate(() => {
    const positionSec = toSecond(manager.currentTime);
    const durationSec = toSecond(manager.duration || state.durationSec);

    setState({
      positionSec,
      durationSec,
      progressPct: calcProgress(positionSec, durationSec),
    });
  });

  manager.onWaiting(() => {
    if (state.status !== STATUS.PLAYING) {
      setState({ status: STATUS.LOADING });
    }
  });

  manager.onError((error) => {
    setState({
      status: STATUS.ERROR,
      error,
    });
  });
}

bindPlayerEvents();

function play(trackInfo) {
  if (!trackInfo || !trackInfo.src) {
    setState({
      status: STATUS.ERROR,
      error: { errMsg: "Audio source is required" },
    });
    return;
  }

  const {
    playId,
    trackId,
    type = "track",
    title,
    subtitle,
    cover,
    src,
    startPositionSec = 0,
  } = trackInfo;

  setState({
    status: STATUS.LOADING,
    playId,
    trackId,
    type,
    title,
    subtitle: subtitle || "唐山皮影",
    cover: cover || "",
    src,
    positionSec: 0,
    durationSec: 0,
    progressPct: 0,
    error: null,
  });

  manager.title = title || "未命名音轨";
  manager.epname = subtitle || "唐山皮影";
  manager.singer = "唐山皮影";
  manager.coverImgUrl = cover || "";
  manager.startTime = toSecond(startPositionSec);
  manager.src = src;
}

function pause() {
  manager.pause();
}

function resume() {
  if (!state.src) {
    return;
  }

  if (state.status === STATUS.ENDED) {
    manager.seek(0);
  }

  manager.play();
}

function togglePlayPause() {
  if (state.status === STATUS.PLAYING) {
    pause();
    return;
  }

  if (
    state.status === STATUS.PAUSED ||
    state.status === STATUS.ENDED ||
    state.status === STATUS.LOADING
  ) {
    resume();
  }
}

function stop() {
  manager.stop();

  if (inExperience) {
    suspendedByExperience = false;
    clearResumeToken();
  }
}

function seek(positionSec) {
  const safeSec = toSecond(positionSec);
  manager.seek(safeSec);
  setState({
    positionSec: safeSec,
    progressPct: calcProgress(safeSec, state.durationSec),
  });
}

function getState() {
  return snapshot();
}

function isCurrentTrack(playId, trackId) {
  return state.playId === playId && state.trackId === trackId;
}

function subscribe(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  listeners.add(listener);
  listener(snapshot(), PLAYER_EVENT.CHANGE);

  return () => {
    listeners.delete(listener);
  };
}

function pausePlayAudioForExperience() {
  inExperience = true;

  const canResume =
    (state.status === STATUS.PLAYING || state.status === STATUS.PAUSED) &&
    state.playId &&
    state.trackId;

  if (!canResume) {
    clearResumeToken();
    suspendedByExperience = false;
    return;
  }

  const token = {
    trackId: state.trackId,
    playId: state.playId,
    positionSec: state.positionSec,
    wasPlaying: state.status === STATUS.PLAYING,
  };

  setResumeToken(token);
  suspendedByExperience = true;

  if (state.status === STATUS.PLAYING) {
    pause();
  }
}

function resumePlayAudioAfterExperience() {
  inExperience = false;

  if (!resumeToken || !suspendedByExperience) {
    clearResumeToken();
    return;
  }

  const token = { ...resumeToken };
  clearResumeToken();
  suspendedByExperience = false;

  if (!isCurrentTrack(token.playId, token.trackId)) {
    return;
  }

  seek(token.positionSec || 0);

  if (token.wasPlaying) {
    resume();
  }
}

module.exports = {
  STATUS,
  PLAYER_EVENT,
  play,
  pause,
  resume,
  stop,
  seek,
  togglePlayPause,
  getState,
  subscribe,
  isCurrentTrack,
  pausePlayAudioForExperience,
  resumePlayAudioAfterExperience,
};
