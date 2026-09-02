const { STAGES } = require("../data/experience");

function initialSession() {
  return {
    selectedRole: "",
    activeStageIndex: 0,
    completedStageIds: [],
    attemptsByStage: {},
    progressByStage: {},
    stageStateById: {},
    currentStageId: "",
  };
}

let session = initialSession();

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSession() {
  session = initialSession();
  return getSnapshot();
}

function resetGame() {
  return createSession();
}

function selectRole(roleId) {
  if (roleId !== "xiaodan") return false;
  session.selectedRole = roleId;
  return true;
}

function getActiveStage() {
  return STAGES[session.activeStageIndex] || null;
}

function enterStage(stageId) {
  const active = getActiveStage();
  if (!session.selectedRole || !active || active.id !== stageId) return false;
  session.currentStageId = stageId;
  return true;
}

function failStage(stageId) {
  if (!stageId || session.currentStageId !== stageId) return 0;
  const count = Number(session.attemptsByStage[stageId] || 0) + 1;
  session.attemptsByStage[stageId] = count;
  return count;
}

function recordStageProgress(stageId, value, patch) {
  const active = getActiveStage();
  if (!active || active.id !== stageId || session.currentStageId !== stageId) return false;
  const next = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  session.progressByStage[stageId] = Math.max(Number(session.progressByStage[stageId] || 0), next);
  if (patch && typeof patch === "object") {
    session.stageStateById[stageId] = Object.assign({}, session.stageStateById[stageId] || {}, copy(patch));
  }
  return session.progressByStage[stageId];
}

function completeStage(stageId) {
  const active = getActiveStage();
  if (!active || active.id !== stageId || session.currentStageId !== stageId
    || session.completedStageIds.includes(stageId) || Number(session.progressByStage[stageId] || 0) < 100) {
    return false;
  }
  session.completedStageIds.push(stageId);
  session.progressByStage[stageId] = 100;
  session.activeStageIndex += 1;
  session.currentStageId = "";
  const nextStage = getActiveStage();
  return { completed: true, nextStageId: nextStage ? nextStage.id : "", finished: !nextStage };
}

function getSnapshot() {
  const snapshot = copy(session);
  snapshot.progress = Math.round((snapshot.completedStageIds.length / STAGES.length) * 100);
  const activeProgress = snapshot.activeStageIndex < STAGES.length
    ? Number(snapshot.progressByStage[STAGES[snapshot.activeStageIndex].id] || 0)
    : 0;
  snapshot.liveProgress = Math.round(((snapshot.completedStageIds.length + activeProgress / 100) / STAGES.length) * 100);
  snapshot.activeStage = STAGES[snapshot.activeStageIndex] || null;
  snapshot.finished = snapshot.activeStageIndex >= STAGES.length;
  return snapshot;
}

module.exports = {
  createSession,
  resetGame,
  selectRole,
  enterStage,
  failStage,
  recordStageProgress,
  completeStage,
  getSnapshot,
};
