const COPY = Object.freeze({
  back: "返回", settings: "设置", entryTitle: "影动唐山", entrySubtitle: "唐山皮影制作体验",
  start: "开始制作", gallery: "工艺图鉴", help: "玩法说明", soundEffects: "音效", backgroundMusic: "背景音乐",
  roleTitle: "选角", xiaodan: "小旦", wusheng: "武生", chou: "丑角", comingSoon: "后续开放",
  roleIntro: "角色简介", name: "名称：小旦", feature: "特点：造型秀丽", difficulty: "难度：★☆☆",
  selectRole: "选择此角色", workshopTitle: "小旦制作工坊", currentProgress: "当前进度",
  currentStage: "当前可进行工序", completedStage: "已完成工序", none: "无", enterStage: "进入当前工序",
  leatherTask: "挑选适合制作皮影的皮料", confirm: "确认", flat: "平整、透光、厚薄适中",
  damaged: "表面破损", uneven: "厚度不均", opaque: "透光性不足", traceHint: "尽量沿辅助线描绘",
  traceReturn: "请回到轮廓线附近继续描绘", carveHint: "沿轮廓慢慢刻画",
  colorHint: "参考右上角配色示意图", jointHint: "请将部件连接到正确关节点", result: "成品",
});

const STAGES = Object.freeze([
  { id: "leather", title: "识皮", renderer: "xr", art: "/images/experience-v3/stages/01-leather.webp" },
  { id: "draft", title: "制稿", renderer: "canvas", art: "/images/experience-v3/stages/02-draft.webp" },
  { id: "trace", title: "描样", renderer: "canvas", art: "/images/experience-v3/stages/03-trace.webp" },
  { id: "carve", title: "雕刻", renderer: "canvas", art: "/images/experience-v3/stages/04-carve.webp" },
  { id: "color", title: "敷彩", renderer: "canvas", art: "/images/experience-v3/stages/05-color.webp" },
  { id: "parts", title: "部件处理", renderer: "xr", art: "/images/experience-v3/stages/06-parts.webp" },
  { id: "joint", title: "连缀关节", renderer: "xr", art: "/images/experience-v3/stages/07-joint.webp" },
  { id: "rods", title: "装杆", renderer: "xr", art: "/images/experience-v3/stages/08-rods.webp" },
  { id: "light", title: "灯影检验", renderer: "xr", art: "/images/experience-v3/stages/09-light.webp" },
]);

const MATERIALS = Object.freeze([
  { id: "A", label: "皮料A", issue: COPY.damaged, asset: "/images/experience-v3/materials/A.webp" },
  { id: "B", label: "皮料B", issue: "", asset: "/images/experience-v3/materials/B.webp" },
  { id: "C", label: "皮料C", issue: COPY.uneven, asset: "/images/experience-v3/materials/C.webp" },
  { id: "D", label: "皮料D", issue: COPY.opaque, asset: "/images/experience-v3/materials/D.webp" },
]);

const COLORS = Object.freeze([
  { id: "red", label: "红", value: "#A62B23" }, { id: "yellow", label: "黄", value: "#D5A62A" },
  { id: "green", label: "绿", value: "#315E4B" }, { id: "blue", label: "蓝", value: "#247184" },
  { id: "black", label: "黑", value: "#30251C" },
]);

const DRAFT_NODES = Object.freeze([
  { x: 0.50, y: 0.14 }, { x: 0.27, y: 0.42 }, { x: 0.73, y: 0.42 }, { x: 0.50, y: 0.86 },
]);

const TRACE_POINTS = Object.freeze([
  { x: 0.50, y: 0.08 }, { x: 0.38, y: 0.16 }, { x: 0.32, y: 0.30 },
  { x: 0.20, y: 0.46 }, { x: 0.32, y: 0.59 }, { x: 0.40, y: 0.80 },
  { x: 0.50, y: 0.92 }, { x: 0.61, y: 0.80 }, { x: 0.69, y: 0.59 },
  { x: 0.80, y: 0.46 }, { x: 0.68, y: 0.30 }, { x: 0.62, y: 0.16 }, { x: 0.50, y: 0.08 },
]);

const CARVE_PATHS = Object.freeze([
  [{ x: 0.50, y: 0.09 }, { x: 0.33, y: 0.30 }], [{ x: 0.33, y: 0.30 }, { x: 0.21, y: 0.48 }],
  [{ x: 0.21, y: 0.48 }, { x: 0.40, y: 0.86 }], [{ x: 0.40, y: 0.86 }, { x: 0.60, y: 0.86 }],
  [{ x: 0.60, y: 0.86 }, { x: 0.79, y: 0.48 }], [{ x: 0.79, y: 0.48 }, { x: 0.50, y: 0.09 }],
  [{ x: 0.38, y: 0.37 }, { x: 0.50, y: 0.50 }, { x: 0.62, y: 0.37 }],
  [{ x: 0.36, y: 0.57 }, { x: 0.50, y: 0.68 }, { x: 0.64, y: 0.57 }],
  [{ x: 0.29, y: 0.43 }, { x: 0.34, y: 0.48 }, { x: 0.29, y: 0.53 }],
  [{ x: 0.71, y: 0.43 }, { x: 0.66, y: 0.48 }, { x: 0.71, y: 0.53 }],
]);

const COLOR_REGIONS = Object.freeze([
  ["head", "yellow", 0.50, 0.16, 0.10, 0.09], ["torso", "red", 0.50, 0.38, 0.11, 0.13],
  ["left-upper", "red", 0.34, 0.36, 0.09, 0.08], ["left-lower", "green", 0.23, 0.48, 0.10, 0.10],
  ["right-upper", "red", 0.66, 0.36, 0.09, 0.08], ["right-lower", "green", 0.77, 0.48, 0.10, 0.10],
  ["waist", "blue", 0.50, 0.53, 0.12, 0.08], ["left-skirt", "red", 0.40, 0.68, 0.10, 0.13],
  ["right-skirt", "red", 0.60, 0.68, 0.10, 0.13], ["left-leg", "black", 0.43, 0.84, 0.07, 0.10],
  ["right-leg", "black", 0.57, 0.84, 0.07, 0.10],
].map(([id, colorId, x, y, rx, ry]) => Object.freeze({ id, colorId, x, y, rx, ry })));

const PARTS = Object.freeze([
  ["head", 0.50, 0.12], ["torso", 0.50, 0.34], ["left-upper", 0.33, 0.34],
  ["left-lower", 0.20, 0.47], ["right-upper", 0.67, 0.34], ["right-lower", 0.80, 0.47],
  ["left-thigh", 0.42, 0.68], ["left-leg", 0.43, 0.84], ["right-thigh", 0.58, 0.68],
  ["right-leg", 0.57, 0.84], ["skirt", 0.50, 0.58],
].map(([id, x, y], index) => Object.freeze({ id, x, y, asset: `/images/experience-v3/parts/${String(index + 1).padStart(2, "0")}-${id}.webp` })));

const JOINT_TARGETS = Object.freeze([
  { x: 0.36, y: 0.31 }, { x: 0.64, y: 0.31 }, { x: 0.23, y: 0.45 }, { x: 0.77, y: 0.45 },
  { x: 0.42, y: 0.58 }, { x: 0.58, y: 0.58 }, { x: 0.42, y: 0.79 }, { x: 0.58, y: 0.79 },
  { x: 0.50, y: 0.27 },
]);
const ROD_TARGETS = Object.freeze([{ x: 0.23, y: 0.45 }, { x: 0.50, y: 0.27 }, { x: 0.77, y: 0.45 }]);
const COPY_ALLOWLIST = Object.freeze([...Object.values(COPY), ...STAGES.map((item) => item.title), ...MATERIALS.map((item) => item.label), ...COLORS.map((item) => item.label)]);

module.exports = { COPY, STAGES, MATERIALS, COLORS, DRAFT_NODES, TRACE_POINTS, CARVE_PATHS, COLOR_REGIONS, PARTS, JOINT_TARGETS, ROD_TARGETS, COPY_ALLOWLIST };
