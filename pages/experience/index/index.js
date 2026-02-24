// 引入音频服务（确保路径正确）
const audioService = require('../../../services/audioService.js');

Page({
  data: {
    stage: 'intro', // 'intro' | 'carving' | 'coloring' | 'finished'
    carvingStep: 0,
    coloringStep: 0,
    isSilhouette: false,

    // 临时占位坐标（曹静雅会给正式数据，这里先 mock）
    carveSteps: [
      { start: { x: 100, y: 150 }, end: { x: 120, y: 180 } },
      { start: { x: 200, y: 100 }, end: { x: 220, y: 130 } },
      // ... 共6组，先写2组测试
      { start: { x: 150, y: 200 }, end: { x: 170, y: 230 } },
      { start: { x: 250, y: 180 }, end: { x: 270, y: 210 } },
      { start: { x: 180, y: 250 }, end: { x: 200, y: 280 } },
      { start: { x: 220, y: 300 }, end: { x: 240, y: 330 } }
    ],
    colorSteps: [
      { center: { x: 150, y: 150 }, radius: 30 },
      { center: { x: 250, y: 200 }, radius: 30 },
      // ... 共6组
      { center: { x: 200, y: 250 }, radius: 30 },
      { center: { x: 300, y: 180 }, radius: 30 },
      { center: { x: 180, y: 300 }, radius: 30 },
      { center: { x: 260, y: 320 }, radius: 30 }
    ]
  },

  // ========== 音频生命周期（必须保留！） ==========
  onShow() {
    // 进入体验页：暂停全局音频
    audioService.pause();
  },

  onHide() {
    // 切到后台或其他 tab：恢复音频
    audioService.resume();
  },

  onUnload() {
    // 页面销毁：恢复音频（保险）
    audioService.resume();
  },

  // ========== 用户交互 ==========
  startExperience() {
    this.setData({ stage: 'carving', carvingStep: 0 });
  },

  // 雕刻：后续由吴尚远实现 touch 逻辑，你先留接口
  // 暂时用按钮模拟完成一刀（真机调试时替换为滑动判定）
  simulateCarveNext() {
    const next = this.data.carvingStep + 1;
    if (next >= 6) {
      this.setData({ stage: 'coloring', coloringStep: 0 });
    } else {
      this.setData({ carvingStep: next });
    }
  },

  // 上色点击（王翔宇会完善命中检测，你先做基础跳转）
  onColorTap(e) {
    // TODO: 后续用 getBoundingClientRect + 手动 hit test
    // 现在先直接进下一步
    const next = this.data.coloringStep + 1;
    if (next >= 6) {
      this.setData({ stage: 'finished' });
    } else {
      this.setData({ coloringStep: next });
    }
  },

  toggleView() {
    this.setData({ isSilhouette: !this.data.isSilhouette });
  },

  saveImage() {
    wx.showToast({ title: '保存功能待实现', icon: 'none' });
    // 后续用 canvas 合成 visible layers 导出
  },

  restart() {
    this.setData({
      stage: 'intro',
      carvingStep: 0,
      coloringStep: 0,
      isSilhouette: false
    });
  },

  // ========== 计算属性（供 WXML 使用） ==========
  getCurrentCarve() {
    return this.data.carveSteps[this.data.carvingStep] || {};
  },

  getCurrentColor() {
    return this.data.colorSteps[this.data.coloringStep] || {};
  }
});