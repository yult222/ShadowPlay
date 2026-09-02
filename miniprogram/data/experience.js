const COPY = Object.freeze({
  back: "返回", settings: "设置", entryTitle: "影动唐山", entrySubtitle: "唐山皮影制作体验",
  start: "开始制作", gallery: "工艺图鉴", help: "玩法说明", soundEffects: "音效", backgroundMusic: "背景音乐",
  roleTitle: "选角", xiaodan: "小旦", wusheng: "武生", chou: "丑角", comingSoon: "后续开放",
  roleIntro: "角色简介", name: "名称：小旦", feature: "特点：造型秀丽", difficulty: "难度：★☆☆",
  selectRole: "选择此角色", result: "成品",
});

const STAGES = Object.freeze([
  { id: "leather", title: "识皮", gesture: "drag", renderer: "xr", art: "/images/experience-v3/stages/01-leather.webp" },
  { id: "draft", title: "制稿", gesture: "drag", renderer: "canvas", art: "/images/experience-v3/stages/02-draft.webp" },
  { id: "trace", title: "描样", gesture: "drag", renderer: "canvas", art: "/images/experience-v3/stages/03-trace.webp" },
  { id: "carve", title: "雕刻", gesture: "tap", renderer: "canvas", art: "/images/experience-v3/stages/04-carve.webp" },
  { id: "color", title: "敷彩", gesture: "tap", renderer: "canvas", art: "/images/experience-v3/stages/05-color.webp" },
  { id: "parts", title: "部件处理", gesture: "drag", renderer: "xr", art: "/images/experience-v3/stages/06-parts.webp" },
  { id: "joint", title: "连缀关节", gesture: "drag", renderer: "xr", art: "/images/experience-v3/stages/07-joint.webp" },
  { id: "rods", title: "装杆", gesture: "drag", renderer: "xr", art: "/images/experience-v3/stages/08-rods.webp" },
  { id: "light", title: "灯影检验", gesture: "drag", renderer: "xr", art: "/images/experience-v3/stages/09-light.webp" },
]);

const MATERIALS = Object.freeze([
  { id: "A", label: "皮料A", asset: "/images/experience-v3/materials/A.webp" },
  { id: "B", label: "皮料B", asset: "/images/experience-v3/materials/B.webp" },
  { id: "C", label: "皮料C", asset: "/images/experience-v3/materials/C.webp" },
  { id: "D", label: "皮料D", asset: "/images/experience-v3/materials/D.webp" },
]);

const COLORS = Object.freeze([
  { id: "red", label: "红", value: "#A62B23" }, { id: "yellow", label: "黄", value: "#D5A62A" },
  { id: "green", label: "绿", value: "#315E4B" }, { id: "blue", label: "蓝", value: "#247184" },
  { id: "black", label: "黑", value: "#30251C" },
]);

const DRAFT_PIECES = Object.freeze([
  { id: "head", asset: "/images/experience-v3/parts/01-head.webp", x: 0.50, y: 0.14, width: 72, height: 72 },
  { id: "torso", asset: "/images/experience-v3/parts/02-torso.webp", x: 0.50, y: 0.35, width: 72, height: 96 },
  { id: "sleeves", asset: "/images/experience-v3/parts/04-left-lower.webp", x: 0.24, y: 0.46, width: 82, height: 72 },
  { id: "lower", asset: "/images/experience-v3/parts/11-skirt.webp", x: 0.50, y: 0.67, width: 92, height: 70 },
]);

const TRACE_SHEET = Object.freeze({
  id: "trace-sheet", asset: "/images/experience-v3/stages/03-trace.webp",
});

const CRAFT_TAP_TARGETS = Object.freeze({
  carve: Object.freeze([
    { id: "outer", points: [{ x: 0.50, y: 0.12 }] },
    { id: "pattern", points: [{ x: 0.50, y: 0.48 }] },
    { id: "openwork", points: [{ x: 0.22, y: 0.46 }, { x: 0.78, y: 0.46 }] },
  ]),
});

const CRAFT_REVEAL_CLIPS = Object.freeze({
  carve: Object.freeze({
    outer: ["polygon(27% 0%,73% 0%,69% 28%,31% 28%)", "polygon(8% 56%,42% 44%,48% 100%,6% 100%)", "polygon(58% 44%,92% 56%,94% 100%,52% 100%)"],
    pattern: ["polygon(34% 23%,66% 23%,68% 82%,32% 82%)"],
    openwork: ["polygon(0% 25%,43% 24%,43% 59%,5% 63%)", "polygon(57% 24%,100% 25%,95% 63%,57% 59%)"],
  }),
});

const COLOR_MASKS = Object.freeze([
  ["head","yellow",[[.42,.08],[.58,.08],[.61,.18],[.56,.26],[.44,.26],[.39,.18]]],
  ["torso","red",[[.43,.26],[.57,.26],[.61,.48],[.50,.55],[.39,.48]]],
  ["left-upper","red",[[.40,.28],[.31,.30],[.23,.39],[.32,.45],[.43,.36]]],
  ["left-lower","green",[[.23,.38],[.10,.50],[.17,.61],[.34,.46]]],
  ["right-upper","red",[[.60,.28],[.69,.30],[.77,.39],[.68,.45],[.57,.36]]],
  ["right-lower","green",[[.77,.38],[.90,.50],[.83,.61],[.66,.46]]],
  ["waist","blue",[[.40,.48],[.60,.48],[.62,.59],[.50,.64],[.38,.59]]],
  ["left-skirt","red",[[.39,.55],[.50,.63],[.47,.79],[.30,.74]]],
  ["right-skirt","red",[[.61,.55],[.50,.63],[.53,.79],[.70,.74]]],
  ["left-leg","black",[[.39,.72],[.49,.72],[.47,.94],[.39,.94]]],
  ["right-leg","black",[[.51,.72],[.61,.72],[.61,.94],[.53,.94]]],
].map(([id,colorId,polygon])=>Object.freeze({id,colorId,polygon:Object.freeze(polygon.map(([x,y])=>Object.freeze({x,y})))})));

const COLOR_GROUPS = Object.freeze(COLORS.map((color) => {
  const masks = COLOR_MASKS.filter((mask) => mask.colorId === color.id);
  const points = masks.map((mask) => mask.polygon.reduce((center, point) => ({
    x: center.x + point.x / mask.polygon.length,
    y: center.y + point.y / mask.polygon.length,
  }), { x: 0, y: 0 }));
  return Object.freeze({ id: color.id, colorId: color.id, maskIds: Object.freeze(masks.map((mask) => mask.id)), points: Object.freeze(points) });
}));

const PARTS = Object.freeze([
  ["head", 0.50, 0.12], ["torso", 0.50, 0.34], ["left-upper", 0.33, 0.34],
  ["left-lower", 0.20, 0.47], ["right-upper", 0.67, 0.34], ["right-lower", 0.80, 0.47],
  ["left-thigh", 0.42, 0.68], ["left-leg", 0.43, 0.84], ["right-thigh", 0.58, 0.68],
  ["right-leg", 0.57, 0.84], ["skirt", 0.50, 0.58],
].map(([id, x, y], index) => Object.freeze({ id, x, y, asset: `/images/experience-v3/parts/${String(index + 1).padStart(2, "0")}-${id}.webp` })));

const PART_SEPARATION_GROUPS = Object.freeze([
  { id: "head", targetId: "separate-top" },
  { id: "left-lower", targetId: "separate-left" },
  { id: "right-lower", targetId: "separate-right" },
  { id: "left-leg", targetId: "separate-bottom-left" },
  { id: "right-leg", targetId: "separate-bottom-right" },
].map((item) => Object.freeze({ ...item, part: PARTS.find((part) => part.id === item.id) })));

const JOINT_TARGETS = Object.freeze([
  { x: 0.36, y: 0.31 }, { x: 0.64, y: 0.31 }, { x: 0.23, y: 0.45 }, { x: 0.77, y: 0.45 },
  { x: 0.42, y: 0.58 }, { x: 0.58, y: 0.58 }, { x: 0.42, y: 0.79 }, { x: 0.58, y: 0.79 },
  { x: 0.50, y: 0.27 },
]);
const ROD_TARGETS = Object.freeze([{ x: 0.23, y: 0.45 }, { x: 0.50, y: 0.27 }, { x: 0.77, y: 0.45 }]);
const JOINT_DEMOS = Object.freeze([
  { id: "shoulder", targetIndex: 0 }, { id: "elbow", targetIndex: 2 }, { id: "knee", targetIndex: 6 },
]);
const COPY_ALLOWLIST = Object.freeze([...Object.values(COPY), ...STAGES.map((item) => item.title), ...MATERIALS.map((item) => item.label), ...COLORS.map((item) => item.label)]);

module.exports = {
  COPY, STAGES, MATERIALS, COLORS, DRAFT_PIECES, TRACE_SHEET, CRAFT_TAP_TARGETS,
  CRAFT_REVEAL_CLIPS, COLOR_MASKS, COLOR_GROUPS, PARTS, PART_SEPARATION_GROUPS,
  JOINT_TARGETS, JOINT_DEMOS, ROD_TARGETS, COPY_ALLOWLIST,
};
