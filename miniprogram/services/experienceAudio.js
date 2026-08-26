const storage = require("./storage");
const audioService = require("./audioService");

const activeRoutes = new Set();
let bgm = null;
let feedback = null;
let leaveTimer = null;

function ensureContexts() {
  if (!bgm) {
    bgm = wx.createInnerAudioContext();
    bgm.src = "/audio/experience-bgm.wav";
    bgm.loop = true;
    bgm.volume = 0.18;
  }
  if (!feedback) {
    feedback = wx.createInnerAudioContext();
    feedback.src = "/audio/experience-feedback.wav";
    feedback.volume = 0.42;
  }
}

function syncBgm() {
  ensureContexts();
  if (activeRoutes.size && storage.getBgmEnabled()) {
    bgm.play();
  } else {
    bgm.pause();
  }
}

function enterPage(route) {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
  const wasEmpty = activeRoutes.size === 0;
  activeRoutes.add(route);
  if (wasEmpty) audioService.pausePlayAudioForExperience();
  syncBgm();
}

function leavePage(route) {
  activeRoutes.delete(route);
  if (activeRoutes.size) return;
  leaveTimer = setTimeout(() => {
    if (activeRoutes.size) return;
    if (bgm) bgm.pause();
    audioService.resumePlayAudioAfterExperience();
  }, 160);
}

function playFeedback() {
  if (!storage.getSfxEnabled()) return;
  ensureContexts();
  feedback.stop();
  feedback.play();
}

function setBgmEnabled(enabled) {
  storage.setBgmEnabled(enabled);
  syncBgm();
}

function setSfxEnabled(enabled) {
  storage.setSfxEnabled(enabled);
}

function getSettings() {
  return {
    bgmEnabled: storage.getBgmEnabled(),
    sfxEnabled: storage.getSfxEnabled(),
  };
}

module.exports = {
  enterPage,
  leavePage,
  playFeedback,
  setBgmEnabled,
  setSfxEnabled,
  getSettings,
};
