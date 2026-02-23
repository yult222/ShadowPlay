const CONSULT_IMAGE_BASE = "/images/consult";

function toParagraph(text) {
  return `<p>${text}</p>`;
}

function toImage(imageName, altText) {
  return `<p><img src="${CONSULT_IMAGE_BASE}/${imageName}" alt="${altText}" style="width:100%;margin:14px 0;border-radius:8px;" /></p>`;
}

const articles = [
  {
    id: "article-origin",
    title: "从滦州影到国家级非遗：唐山皮影的起源与文化地位",
    summary:
      "唐山皮影又称滦州影、乐亭影、驴皮影，初创于明代末期，盛行于清末民初，迄今已有400多年的历史。",
    cover: `${CONSULT_IMAGE_BASE}/p1.png`,
    bodyRichText: [
      toParagraph(
        "唐山皮影戏以其独特的材质工艺、唱腔体系和表演程式，成为中国北方民间艺术的典型代表。2006年5月20日，皮影戏（唐山皮影戏）经中华人民共和国国务院批准列入第一批国家级非物质文化遗产名录，项目编号：Ⅳ-91。后亦入选联合国教科文组织“人类非物质文化遗产代表作名录”，确立了其在世界文化舞台上的重要地位。",
      ),
      toImage("p2.png", "唐山皮影图2"),
      toParagraph(
        "唐山皮影的起源可追溯至明代晚期。据地方史料记载，明万历年间，滦州秀才黄素志因屡试不第，远赴沈阳以教书为生。他通晓绘画雕刻，且热衷戏曲，遂将当地影戏与佛教“宣卷”唱调相结合，编创影卷、雕制影人、改良唱腔，由此奠定了滦州皮影的基本形态。清代为其鼎盛期，皮影班社遍及城乡。清末民初，形成了两大艺术流派：以乐亭为中心的东路“柔派”以唱腔婉转见长，以遵化、玉田为中心的西路“快马擎刀派”则以表演火爆著称，两大流派对后世风格格局影响深远。",
      ),
    ].join(""),
  },
  {
    id: "article-craft",
    title: "一张驴皮如何成为影人：唐山皮影的材质选择与雕刻工艺",
    summary:
      "唐山皮影以驴皮为主要材质，经刮、磨、刻、染等多道工序处理后，形成薄如蝉翼、色彩明丽的影人形象。",
    cover: `${CONSULT_IMAGE_BASE}/p3.png`,
    bodyRichText: [
      toParagraph(
        "唐山皮影雕刻工艺繁复，需经刮皮、浆皮、拓样、雕刻、着色、上油、连缀等数十道工序。头部（头茬）与身体（戳子）分刻后组装，使角色可通过更换头茬实现身份与情绪的快速切换。",
      ),
      toImage("p4.png", "唐山皮影图4"),
      toParagraph(
        "唐山皮影的造型审美遵循强烈的伦理象征原则，如“公忠者雕以正貌，奸邪者刻以丑形”，通过线条疏密、刀法刚柔来区分人物品性，使影人形象生动传神。",
      ),
    ].join(""),
  },
  {
    id: "article-performance",
    title: "一台皮影戏如何“运转”：操纵体系、唱腔风格与行当结构",
    summary:
      "唐山皮影戏依靠“上线”“下线”协同操纵，形成完整的操纵、唱腔与行当体系，兼具高识别度与程式美学。",
    cover: `${CONSULT_IMAGE_BASE}/p5.png`,
    bodyRichText: [
      toParagraph(
        "唐山皮影戏的舞台机制建立在明确的操纵分工之上：主要操纵演员通常为两人，称“上线”和“下线”；支配影人动作的杆子共三根，包括主杆与两根手杆，形成稳定的控制系统。与此同时，演出组织还有“拿、贴、打、拉、唱”五种分工，并有“七忙八闲”之说，反映出其后台协作的高强度与高同步性。",
      ),
      toParagraph(
        "其声腔以乐亭、滦县方言为基础，具备男腔与女腔两套声腔特征：男腔高亢粗犷，女腔清脆婉转；唱法包含“掐嗓”与“不掐嗓”，形成“高亢悠扬、略带沙哑”的独特音韵，并在冀东民间被称为“呔味”，具有强识别度。",
      ),
      toParagraph(
        "在视觉呈现上，影人造型高度程式化：头部约占全身五分之一，眉眼约占面部二分之一，服务于灯影投射条件下的可辨识性。行当体系与京剧相近，分为生、小（旦）、净、大（花脸）、髯（老生）、丑、妖等，各行当对应独特造型、唱腔与表演形式，构成了完整的表演体系。",
      ),
    ].join(""),
  },
  {
    id: "article-renewal",
    title: "资讯4｜从“传承危机”到“场景重生”：校园课程、文创电商与数字化呈现",
    summary:
      "进入21世纪，唐山皮影戏在传承压力下持续创新，通过校园课程、文创电商、数字化展演与文旅融合拓展传播场景。",
    cover: `${CONSULT_IMAGE_BASE}/p8.png`,
    bodyRichText: [
      toParagraph(
        "在滦州市中山实验学校，皮影被纳入校本课程，学生组建演唱、操纵、雕刻社团，部分学生曾携剧目登上各类大型舞台。乐亭县前郑庄村组织农村妇女学习皮影雕刻，注册商标“影韵乡园”，开发书签、挂饰及私人订制肖像等文创产品，通过电商渠道销往国内外市场，年收入达二十万元。",
      ),
      toParagraph(
        "唐山市皮影剧团尝试突破传统二维影窗限制，推出融入木偶与多媒体元素的影偶剧，曹妃甸文化馆亦采用全息3D技术对传统剧目进行数字化呈现。这些探索，正让这门古老艺术在传承中焕发新的生命力。",
      ),
      toImage("p7.png", "唐山皮影图7"),
      toParagraph(
        "在文旅融合背景下，唐山宴、河头老街等景区设置皮影常态化展演，唐山建成中国首座皮影主题亲子乐园，通过互动体验拓展非遗传播途径。这些创新举措让古老皮影融入现代生活，吸引了更多年轻观众的关注。",
      ),
      toImage("p6.png", "唐山皮影图6"),
      toParagraph(
        "唐山皮影戏自明代萌芽以来，历经禁演与复兴、传承与转型，至今仍保持传承。其艺术形态融合雕刻、演唱、文学、表演于一体，承载着冀东地区的方言、音乐与民间叙事，是地域文化记忆的重要载体。随着非遗保护机制的完善与文化创意产业的介入，唐山皮影戏正在从传统乡土社会的娱乐形式，逐步向具备当代传播价值的文化符号转化。",
      ),
    ].join(""),
  },
];

const banners = articles.map((article, index) => ({
  id: `banner-article-${index + 1}`,
  image: article.cover,
  title: article.title,
  subtitle: article.summary,
  targetType: "article",
  targetId: article.id,
}));

const headlines = articles.map((article) => ({
  id: article.id,
  title: article.title,
  summary: article.summary,
  cover: article.cover,
  targetType: "article",
  targetId: article.id,
  bodyRichText: article.bodyRichText,
}));

function getHeadlineById(id) {
  return headlines.find((item) => item.id === id) || null;
}

module.exports = {
  banners,
  headlines,
  getHeadlineById,
};
