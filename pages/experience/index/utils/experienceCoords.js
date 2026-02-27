// utils/experienceCoords.js
// 来源：坐标表.xlsx（基准画布 1600 x 2133）
// 用法：小程序运行时 require 该文件（不要在运行时读取 xlsx）

module.exports = {
    canvas: { width: 1600, height: 2133 },
  
    // 雕刻：6 步，每步一刀（起点/终点 + 命中半径 threshold）
    carving: [
      { startX: 535, startY: 994, endX: 466, endY: 1070, threshold: 70 },
      { startX: 466, startY: 1070, endX: 520, endY: 1179, threshold: 70 },
      { startX: 520, startY: 1179, endX: 588, endY: 1074, threshold: 70 },
      { startX: 588, startY: 1074, endX: 535, endY: 994, threshold: 70 },
      { startX: 1114, startY: 1075, endX: 979, endY: 1157, threshold: 70 },
      { startX: 979, startY: 1157, endX: 1114, endY: 1075, threshold: 70 },
    ],
  
    // 上色：5 步（你 Excel 里是 5 组热点），每步可能多个点，点中任意一个即可
    coloring: [
      { points: [{ x: 855, y: 870 }], radius: 600 },
      { points: [{ x: 826, y: 1431 }], radius: 360 },
      { points: [{ x: 303, y: 1092 }, { x: 401, y: 1252 }], radius: 150 },
      { points: [{ x: 659, y: 409 }, { x: 789, y: 621 }, { x: 1195, y: 763 }], radius: 180 },
      { points: [{ x: 927, y: 654 }, { x: 633, y: 814 }, { x: 1045, y: 886 }], radius: 180 },
    ],
  };