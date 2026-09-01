const COPY = Object.freeze({
  back: "返回", settings: "设置", entryTitle: "影动唐山", entrySubtitle: "唐山皮影制作体验",
  start: "开始制作", gallery: "工艺图鉴", help: "玩法说明", soundEffects: "音效", backgroundMusic: "背景音乐",
  roleTitle: "选角", xiaodan: "小旦", wusheng: "武生", chou: "丑角", comingSoon: "后续开放",
  roleIntro: "角色简介", name: "名称：小旦", feature: "特点：造型秀丽", difficulty: "难度：★☆☆",
  selectRole: "选择此角色", result: "成品",
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

const CRAFT_TAP_TARGETS = Object.freeze({
  draft: Object.freeze([
    { id: "head", points: [{ x: 0.50, y: 0.15 }] },
    { id: "torso", points: [{ x: 0.50, y: 0.34 }] },
    { id: "sleeves", points: [{ x: 0.22, y: 0.43 }, { x: 0.78, y: 0.43 }] },
    { id: "lower", points: [{ x: 0.50, y: 0.70 }] },
  ]),
  trace: Object.freeze([
    { id: "head", points: [{ x: 0.50, y: 0.15 }] },
    { id: "torso", points: [{ x: 0.50, y: 0.34 }] },
    { id: "sleeves", points: [{ x: 0.22, y: 0.43 }, { x: 0.78, y: 0.43 }] },
    { id: "lower", points: [{ x: 0.50, y: 0.70 }] },
  ]),
  carve: Object.freeze([
    { id: "outer", points: [{ x: 0.50, y: 0.12 }] },
    { id: "pattern", points: [{ x: 0.50, y: 0.48 }] },
    { id: "openwork", points: [{ x: 0.22, y: 0.46 }, { x: 0.78, y: 0.46 }] },
  ]),
});

const CRAFT_REVEAL_CLIPS = Object.freeze({
  draft: Object.freeze({
    head: ["polygon(27% 0%,73% 0%,69% 28%,31% 28%)"],
    torso: ["polygon(35% 23%,65% 23%,65% 47%,35% 47%)"],
    sleeves: ["polygon(0% 25%,43% 24%,43% 48%,5% 61%)", "polygon(57% 24%,100% 25%,95% 61%,57% 48%)"],
    lower: ["polygon(13% 42%,87% 42%,91% 100%,9% 100%)"],
  }),
  trace: Object.freeze({
    head: ["polygon(27% 0%,73% 0%,69% 28%,31% 28%)"],
    torso: ["polygon(35% 23%,65% 23%,65% 47%,35% 47%)"],
    sleeves: ["polygon(0% 25%,43% 24%,43% 48%,5% 61%)", "polygon(57% 24%,100% 25%,95% 61%,57% 48%)"],
    lower: ["polygon(13% 42%,87% 42%,91% 100%,9% 100%)"],
  }),
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

module.exports = { COPY, STAGES, MATERIALS, COLORS, CRAFT_TAP_TARGETS, CRAFT_REVEAL_CLIPS, COLOR_MASKS, PARTS, JOINT_TARGETS, ROD_TARGETS, COPY_ALLOWLIST };
