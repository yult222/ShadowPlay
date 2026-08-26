const { STAGES } = require("../data/experience");

function initialSession() {
  return {
    selectedRole: "",
    activeStageIndex: 0,
    completedStageIds: [],
    attemptsByStage: {},
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
  if (!stageId) return 0;
  const count = Number(session.attemptsByStage[stageId] || 0) + 1;
  session.attemptsByStage[stageId] = count;
  return count;
}

function completeStage(stageId) {
  const active = getActiveStage();
  if (!active || active.id !== stageId || session.currentStageId !== stageId || session.completedStageIds.includes(stageId)) {
    return false;
  }
  session.completedStageIds.push(stageId);
  session.activeStageIndex += 1;
  session.currentStageId = "";
  return true;
}

function getSnapshot() {
  const snapshot = copy(session);
  snapshot.progress = Math.round((snapshot.completedStageIds.length / STAGES.length) * 100);
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
  completeStage,
  getSnapshot,
};
