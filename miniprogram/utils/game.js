const GAME_STATE = {
  READY: 'ready',
  PLAYING: 'playing',
  SUCCESS: 'success',
  FAIL: 'fail'
}

// 创建游戏状态
function createGameState(level = 1) {
  return {
    state: GAME_STATE.READY,
    level: level,
    score: 0,
    startTime: 0,
    endTime: 0
  }
}

// 开始游戏
function startGame(game) {
  game.state = GAME_STATE.PLAYING
  game.startTime = Date.now()
}

// 游戏成功
function successGame(game) {
  game.state = GAME_STATE.SUCCESS
  game.endTime = Date.now()
}

// 游戏失败
function failGame(game) {
  game.state = GAME_STATE.FAIL
  game.endTime = Date.now()
}

// 增加分数
function addScore(game, score) {
  game.score += score
}

// 重置游戏
function resetGame(game) {
  game.state = GAME_STATE.READY
  game.score = 0
  game.startTime = 0
  game.endTime = 0
}

module.exports = {
  GAME_STATE,
  createGameState,
  startGame,
  successGame,
  failGame,
  addScore,
  resetGame
}
