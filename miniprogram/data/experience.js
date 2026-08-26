const COPY = Object.freeze({
  back: "←返回",
  settings: "设置",
  entryTitle: "影动唐山",
  entrySubtitle: "唐山皮影制作体验",
  start: "开始制作",
  gallery: "工艺图鉴",
  help: "玩法说明",
  soundEffects: "音效",
  backgroundMusic: "背景音乐",
  roleTitle: "选角",
  xiaodanCard: "小旦角色卡",
  wushengCard: "武生角色卡-锁定",
  chouCard: "丑角角色卡-锁定",
  comingSoon: "后续开放",
  roleIntro: "角色简介",
  name: "名称：小旦",
  feature: "特点：造型秀丽",
  difficulty: "难度：★☆☆",
  selectRole: "选择此角色",
  workshopTitle: "小旦制作工坊",
  currentProgress: "当前进度",
  currentStage: "当前可进行工序",
  completedStage: "已完成工序",
  none: "无",
  enterStage: "进入当前工序",
  leatherTask: "挑选适合制作皮影的皮料",
  flat: "平整、透光、厚薄适中",
  damaged: "表面破损",
  uneven: "厚度不均",
  opaque: "透光性不足",
  traceHint: "尽量沿辅助线描绘",
  traceReturn: "请回到轮廓线附近继续描绘",
  carveHint: "沿轮廓慢慢刻画",
  colorHint: "参考右上角配色示意图",
  jointHint: "请将部件连接到正确关节点",
  result: "成品",
});

const STAGES = Object.freeze([
  { id: "leather", title: "识皮" },
  { id: "draft", title: "制稿" },
  { id: "trace", title: "描样" },
  { id: "carve", title: "雕刻" },
  { id: "color", title: "敷彩" },
  { id: "parts", title: "部件处理" },
  { id: "joint", title: "连缀关节" },
  { id: "rods", title: "装杆" },
  { id: "light", title: "灯影检验" },
]);

const MATERIALS = Object.freeze([
  { id: "A", label: "皮料A", issue: COPY.damaged, className: "damaged" },
  { id: "B", label: "皮料B", issue: "", className: "correct" },
  { id: "C", label: "皮料C", issue: COPY.uneven, className: "uneven" },
  { id: "D", label: "皮料D", issue: COPY.opaque, className: "opaque" },
]);

const COLORS = Object.freeze([
  { id: "red", label: "红", value: "#A62B23" },
  { id: "yellow", label: "黄", value: "#D5A62A" },
  { id: "green", label: "绿", value: "#315E4B" },
  { id: "blue", label: "蓝", value: "#247184" },
  { id: "black", label: "黑", value: "#30251C" },
]);

const DRAFT_NODES = Object.freeze([
  { x: 160, y: 76 },
  { x: 84, y: 178 },
  { x: 238, y: 178 },
  { x: 160, y: 340 },
]);

const TRACE_POINTS = Object.freeze([
  { x: 160, y: 58 },
  { x: 122, y: 92 },
  { x: 103, y: 142 },
  { x: 66, y: 195 },
  { x: 104, y: 242 },
  { x: 128, y: 326 },
  { x: 160, y: 374 },
  { x: 195, y: 326 },
  { x: 219, y: 242 },
  { x: 255, y: 195 },
  { x: 218, y: 142 },
  { x: 198, y: 92 },
  { x: 160, y: 58 },
]);

const CARVE_SEGMENTS = Object.freeze([
  { start: { x: 160, y: 62 }, end: { x: 104, y: 145 } },
  { start: { x: 104, y: 145 }, end: { x: 72, y: 208 } },
  { start: { x: 72, y: 208 }, end: { x: 132, y: 350 } },
  { start: { x: 132, y: 350 }, end: { x: 192, y: 350 } },
  { start: { x: 192, y: 350 }, end: { x: 250, y: 208 } },
  { start: { x: 250, y: 208 }, end: { x: 160, y: 62 } },
]);

const COLOR_REGIONS = Object.freeze([
  { id: "red", colorId: "red", x: 160, y: 174, size: 72 },
  { id: "yellow", colorId: "yellow", x: 160, y: 78, size: 42 },
  { id: "green", colorId: "green", x: 121, y: 260, size: 48 },
  { id: "blue", colorId: "blue", x: 200, y: 260, size: 48 },
  { id: "black", colorId: "black", x: 160, y: 342, size: 46 },
]);

const PART_TARGETS = Object.freeze([
  { x: 145, y: 56 }, { x: 145, y: 104 }, { x: 92, y: 122 },
  { x: 47, y: 170 }, { x: 198, y: 122 }, { x: 243, y: 170 },
  { x: 113, y: 206 }, { x: 177, y: 206 }, { x: 114, y: 286 },
  { x: 176, y: 286 }, { x: 145, y: 350 },
]);

const JOINT_TARGETS = Object.freeze([
  { x: 114, y: 126 }, { x: 204, y: 126 }, { x: 76, y: 182 },
  { x: 241, y: 182 }, { x: 131, y: 218 }, { x: 188, y: 218 },
  { x: 126, y: 300 }, { x: 192, y: 300 }, { x: 159, y: 105 },
]);

const ROD_TARGETS = Object.freeze([
  { x: 74, y: 178 }, { x: 156, y: 106 }, { x: 239, y: 178 },
]);

const COPY_ALLOWLIST = Object.freeze([
  ...Object.values(COPY),
  ...STAGES.map((item) => item.title),
  ...MATERIALS.map((item) => item.label),
  ...COLORS.map((item) => item.label),
]);

module.exports = {
  COPY,
  STAGES,
  MATERIALS,
  COLORS,
  DRAFT_NODES,
  TRACE_POINTS,
  CARVE_SEGMENTS,
  COLOR_REGIONS,
  PART_TARGETS,
  JOINT_TARGETS,
  ROD_TARGETS,
  COPY_ALLOWLIST,
};
