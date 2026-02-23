function formatSecond(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minute = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const second = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minute}:${second}`;
}

module.exports = {
  formatSecond,
};
