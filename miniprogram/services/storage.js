const KEYS = {
  BGM_ENABLED: "settings.bgmEnabled",
  FAVORITE_PLAY_IDS: "favorites.playIds",
  AUDIO_RESUME_TOKEN: "audio.resumeToken",
  USER_PROFILE: "user.profile",
};

function safeGet(key, fallbackValue) {
  try {
    const value = wx.getStorageSync(key);
    if (value === "" || value === undefined || value === null) {
      return fallbackValue;
    }
    return value;
  } catch (error) {
    return fallbackValue;
  }
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.warn("setStorageSync failed:", key, error);
  }
}

function ensureDefaults() {
  const bgmEnabled = safeGet(KEYS.BGM_ENABLED, null);
  if (typeof bgmEnabled !== "boolean") {
    safeSet(KEYS.BGM_ENABLED, true);
  }

  const favoritePlayIds = safeGet(KEYS.FAVORITE_PLAY_IDS, null);
  if (!Array.isArray(favoritePlayIds)) {
    safeSet(KEYS.FAVORITE_PLAY_IDS, []);
  }

  const resumeToken = safeGet(KEYS.AUDIO_RESUME_TOKEN, null);
  if (resumeToken === undefined) {
    safeSet(KEYS.AUDIO_RESUME_TOKEN, null);
  }

  const profile = safeGet(KEYS.USER_PROFILE, null);
  if (!profile || typeof profile !== "object") {
    safeSet(KEYS.USER_PROFILE, {
      nickname: "",
      avatarUrl: "",
    });
  }
}

function getBgmEnabled() {
  return Boolean(safeGet(KEYS.BGM_ENABLED, true));
}

function setBgmEnabled(enabled) {
  safeSet(KEYS.BGM_ENABLED, Boolean(enabled));
}

function getFavoritePlayIds() {
  const list = safeGet(KEYS.FAVORITE_PLAY_IDS, []);
  return Array.isArray(list) ? list : [];
}

function isFavoritePlay(playId) {
  return getFavoritePlayIds().includes(playId);
}

function setFavoritePlayIds(playIds) {
  const nextIds = Array.isArray(playIds) ? Array.from(new Set(playIds)) : [];
  safeSet(KEYS.FAVORITE_PLAY_IDS, nextIds);
  return nextIds;
}

function toggleFavoritePlay(playId) {
  const ids = getFavoritePlayIds();
  const exists = ids.includes(playId);
  const nextIds = exists
    ? ids.filter((id) => id !== playId)
    : ids.concat(playId);

  setFavoritePlayIds(nextIds);

  return {
    state: !exists,
    ids: nextIds,
  };
}

function getAudioResumeToken() {
  const token = safeGet(KEYS.AUDIO_RESUME_TOKEN, null);
  return token && typeof token === "object" ? token : null;
}

function setAudioResumeToken(token) {
  if (!token) {
    safeSet(KEYS.AUDIO_RESUME_TOKEN, null);
    return;
  }

  safeSet(KEYS.AUDIO_RESUME_TOKEN, token);
}

function getUserProfile() {
  const profile = safeGet(KEYS.USER_PROFILE, {});
  if (!profile || typeof profile !== "object") {
    return {
      nickname: "",
      avatarUrl: "",
    };
  }

  return {
    nickname: typeof profile.nickname === "string" ? profile.nickname : "",
    avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : "",
  };
}

function setUserProfile(profile) {
  const safeProfile =
    profile && typeof profile === "object"
      ? {
          nickname:
            typeof profile.nickname === "string" ? profile.nickname : "",
          avatarUrl:
            typeof profile.avatarUrl === "string" ? profile.avatarUrl : "",
        }
      : {
          nickname: "",
          avatarUrl: "",
        };

  safeSet(KEYS.USER_PROFILE, safeProfile);
  return safeProfile;
}

module.exports = {
  KEYS,
  ensureDefaults,
  getBgmEnabled,
  setBgmEnabled,
  getFavoritePlayIds,
  setFavoritePlayIds,
  toggleFavoritePlay,
  isFavoritePlay,
  getAudioResumeToken,
  setAudioResumeToken,
  getUserProfile,
  setUserProfile,
};
