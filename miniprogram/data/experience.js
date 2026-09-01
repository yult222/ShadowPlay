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

const DRAFT_GROUPS = Object.freeze([
  { id: "head", paths: [[{x:.42,y:.20},{x:.39,y:.13},{x:.44,y:.08},{x:.52,y:.07},{x:.60,y:.12},{x:.58,y:.21},{x:.50,y:.25},{x:.42,y:.20}]] },
  { id: "torso", paths: [[{x:.44,y:.25},{x:.40,y:.43},{x:.50,y:.54},{x:.60,y:.43},{x:.56,y:.25}]] },
  { id: "sleeves", paths: [[{x:.43,y:.29},{x:.31,y:.34},{x:.20,y:.49},{x:.10,y:.57}],[{x:.57,y:.29},{x:.69,y:.34},{x:.80,y:.49},{x:.90,y:.57}]] },
  { id: "lower", paths: [[{x:.45,y:.51},{x:.36,y:.68},{x:.40,y:.90}],[{x:.55,y:.51},{x:.64,y:.68},{x:.60,y:.90}],[{x:.40,y:.58},{x:.50,y:.70},{x:.60,y:.58}]] },
]);

const TRACE_POINTS = Object.freeze([
  [0.489,0.092],[0.421,0.116],[0.378,0.139],[0.349,0.162],[0.356,0.185],[0.370,0.208],[0.422,0.232],[0.416,0.255],[0.438,0.278],[0.355,0.302],[0.312,0.325],[0.252,0.348],[0.223,0.371],[0.121,0.395],[0.077,0.418],[0.039,0.441],[0.031,0.464],[0.087,0.487],[0.086,0.511],[0.112,0.534],[0.133,0.558],[0.327,0.581],[0.305,0.604],[0.278,0.627],[0.253,0.650],[0.246,0.674],[0.185,0.697],[0.155,0.721],[0.190,0.744],[0.272,0.767],[0.437,0.790],[0.441,0.813],[0.428,0.837],[0.385,0.860],[0.386,0.883],[0.567,0.907],[0.576,0.907],[0.596,0.883],[0.601,0.860],[0.568,0.837],[0.565,0.813],[0.778,0.790],[0.767,0.767],[0.851,0.744],[0.889,0.721],[0.866,0.697],[0.832,0.674],[0.793,0.650],[0.791,0.627],[0.774,0.604],[0.728,0.581],[0.868,0.558],[0.883,0.534],[0.904,0.511],[0.892,0.487],[0.977,0.464],[0.943,0.441],[0.907,0.418],[0.829,0.395],[0.750,0.371],[0.737,0.348],[0.687,0.325],[0.649,0.302],[0.554,0.278],[0.574,0.255],[0.665,0.232],[0.664,0.208],[0.665,0.185],[0.658,0.162],[0.669,0.139],[0.634,0.116],[0.494,0.092],[0.489,0.092],
].map(([x,y]) => Object.freeze({x,y})));

const CARVE_PATHS = Object.freeze([
  [{ x: 0.50, y: 0.09 }, { x: 0.33, y: 0.30 }], [{ x: 0.33, y: 0.30 }, { x: 0.21, y: 0.48 }],
  [{ x: 0.21, y: 0.48 }, { x: 0.40, y: 0.86 }], [{ x: 0.40, y: 0.86 }, { x: 0.60, y: 0.86 }],
  [{ x: 0.60, y: 0.86 }, { x: 0.79, y: 0.48 }], [{ x: 0.79, y: 0.48 }, { x: 0.50, y: 0.09 }],
  [{ x: 0.38, y: 0.37 }, { x: 0.50, y: 0.50 }, { x: 0.62, y: 0.37 }],
  [{ x: 0.36, y: 0.57 }, { x: 0.50, y: 0.68 }, { x: 0.64, y: 0.57 }],
  [{ x: 0.29, y: 0.43 }, { x: 0.34, y: 0.48 }, { x: 0.29, y: 0.53 }],
  [{ x: 0.71, y: 0.43 }, { x: 0.66, y: 0.48 }, { x: 0.71, y: 0.53 }],
]);

const CARVE_GROUPS = Object.freeze([
  { id: "outer", paths: CARVE_PATHS.slice(0, 6) },
  { id: "pattern", paths: CARVE_PATHS.slice(6, 8) },
  { id: "openwork", paths: CARVE_PATHS.slice(8, 10) },
]);

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

module.exports = { COPY, STAGES, MATERIALS, COLORS, DRAFT_GROUPS, TRACE_POINTS, CARVE_PATHS, CARVE_GROUPS, COLOR_MASKS, PARTS, JOINT_TARGETS, ROD_TARGETS, COPY_ALLOWLIST };
