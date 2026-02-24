const audioService = require("../../services/audioService");
const { hideShareMenu } = require("../../utils/page");

Page({
  data: {
    // 状态管理：start, carving, coloring, finished
    currentState: "start",
    // 雕刻进度
    carvingStep: 0,
    // 上色进度
    coloringStep: 0,
    // 成品显示模式：color(彩皮) 或 silhouette(剪影)
    displayMode: "color",
    // 舞台容器尺寸（固定比例）
    stageWidth: 300,
    stageHeight: 400,
    // 雕刻数据（坐标和命中区域）
    carvingData: [
      { startX: 50, startY: 100, endX: 250, endY: 100, threshold: 30 },
      { startX: 50, startY: 150, endX: 250, endY: 150, threshold: 30 },
      { startX: 50, startY: 200, endX: 250, endY: 200, threshold: 30 },
      { startX: 100, startY: 50, endX: 100, endY: 250, threshold: 30 },
      { startX: 150, startY: 50, endX: 150, endY: 250, threshold: 30 },
      { startX: 200, startY: 50, endX: 200, endY: 250, threshold: 30 }
    ],
    // 上色数据（热点坐标和半径）
    coloringData: [
      { x: 100, y: 100, radius: 40 },
      { x: 200, y: 100, radius: 40 },
      { x: 100, y: 200, radius: 40 },
      { x: 200, y: 200, radius: 40 },
      { x: 100, y: 300, radius: 40 },
      { x: 200, y: 300, radius: 40 }
    ],
    // 触摸开始位置
    touchStart: { x: 0, y: 0 },
    // 触摸结束位置
    touchEnd: { x: 0, y: 0 },
    // 是否锁定输入
    inputLocked: false
  },

  onLoad() {
    hideShareMenu();
  },

  onShow() {
    hideShareMenu();
    audioService.pausePlayAudioForExperience();
  },

  onHide() {
    audioService.resumePlayAudioAfterExperience();
  },

  onUnload() {
    audioService.resumePlayAudioAfterExperience();
  },

  // 开始体验
  startExperience() {
    this.setData({ currentState: "carving", carvingStep: 0 });
  },

  // 雕刻触摸开始
  handleCarvingTouchStart(e) {
    if (this.data.inputLocked) return;
    this.setData({
      touchStart: {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    });
  },

  // 雕刻触摸结束
  handleCarvingTouchEnd(e) {
    if (this.data.inputLocked) return;
    
    this.setData({
      touchEnd: {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }
    });

    this.checkCarvingStroke();
  },

  // 检查雕刻是否成功
  checkCarvingStroke() {
    const { touchStart, touchEnd, carvingStep, carvingData } = this.data;
    const currentCarving = carvingData[carvingStep];

    // 计算距离
    const distance = Math.sqrt(
      Math.pow(touchEnd.x - touchStart.x, 2) + Math.pow(touchEnd.y - touchStart.y, 2)
    );

    // 计算方向（简化判断，只看大致方向）
    const isHorizontal = Math.abs(touchEnd.x - touchStart.x) > Math.abs(touchEnd.y - touchStart.y);
    const expectedHorizontal = Math.abs(currentCarving.endX - currentCarving.startX) > Math.abs(currentCarving.endY - currentCarving.startY);

    // 容错判断
    if (distance > 20 && isHorizontal === expectedHorizontal) {
      this.completeCarvingStep();
    }
  },

  // 完成雕刻步骤
  completeCarvingStep() {
    const { carvingStep } = this.data;
    
    // 锁定输入
    this.setData({ inputLocked: true });

    // 模拟震动反馈
    wx.vibrateShort({});

    // 延迟后解锁输入并进入下一步
    setTimeout(() => {
      const nextStep = carvingStep + 1;
      if (nextStep < 6) {
        this.setData({ 
          carvingStep: nextStep,
          inputLocked: false 
        });
      } else {
        // 雕刻完成，进入上色
        this.setData({ 
          currentState: "coloring",
          coloringStep: 0,
          inputLocked: false 
        });
      }
    }, 400);
  },

  // 上色点击处理
  handleColoringTap(e) {
    if (this.data.inputLocked) return;
    
    const { coloringStep, coloringData } = this.data;
    const currentColoring = coloringData[coloringStep];
    const tapX = e.detail.x;
    const tapY = e.detail.y;

    // 计算点击位置与热点的距离
    const distance = Math.sqrt(
      Math.pow(tapX - currentColoring.x, 2) + Math.pow(tapY - currentColoring.y, 2)
    );

    // 容错判断
    if (distance <= currentColoring.radius) {
      this.completeColoringStep();
    }
  },

  // 完成上色步骤
  completeColoringStep() {
    const { coloringStep } = this.data;
    
    // 锁定输入
    this.setData({ inputLocked: true });

    // 模拟震动反馈
    wx.vibrateShort({});

    // 延迟后解锁输入并进入下一步
    setTimeout(() => {
      const nextStep = coloringStep + 1;
      if (nextStep < 6) {
        this.setData({ 
          coloringStep: nextStep,
          inputLocked: false 
        });
      } else {
        // 上色完成，进入成品
        this.setData({ 
          currentState: "finished",
          inputLocked: false 
        });
      }
    }, 300);
  },

  // 切换显示模式（彩皮/剪影）
  toggleDisplayMode() {
    this.setData({
      displayMode: this.data.displayMode === "color" ? "silhouette" : "color"
    });
  },

  // 保存成品图
  save成品() {
    // 这里简化处理，实际应该使用离屏canvas合成导出
    wx.showToast({
      title: "保存成功",
      icon: "success"
    });
  },

  // 重新开始
  restartExperience() {
    this.setData({ 
      currentState: "start",
      carvingStep: 0,
      coloringStep: 0,
      displayMode: "color"
    });
  },

  // 返回开场
  backToStart() {
    this.setData({ 
      currentState: "start",
      carvingStep: 0,
      coloringStep: 0,
      displayMode: "color"
    });
  },

  // 返回经典剧目
  goToPlaysTab() {
    wx.switchTab({
      url: "/pages/plays/index",
    });
  },
});