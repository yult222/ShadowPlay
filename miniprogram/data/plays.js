module.exports = [
  {
    id: "play-shadow-ox",
    title: "影戏《牧牛图》",
    cover: "/images/ai_example1.png",
    tags: ["传统唱腔", "皮影操控", "入门推荐"],
    summaryRichText:
      "<p>《牧牛图》节奏舒缓，适合初次接触唐山皮影的观众，重点展示人物抖腕与走位。</p>",
    narration: {
      textRichText:
        "<p>这段解说会带你了解影人操纵的核心动作：挑、勾、提、转。</p><p>建议先听完解说，再切换到完整唱段。</p>",
      audio: {
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        durationSec: 348,
      },
    },
    tracks: [
      {
        id: "track-main",
        title: "全本唱段",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        durationSec: 353,
      },
      {
        id: "track-highlight",
        title: "高光片段",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        durationSec: 299,
      },
    ],
    roles: [
      {
        name: "牧童",
        img: "/images/avatar.png",
        desc: "动作轻快，手腕翻转频繁，适合观察操纵节奏。",
      },
      {
        name: "老牛",
        img: "/images/avatar.png",
        desc: "以重心移动表现力量感，常见于场景转场。",
      },
    ],
    scenes: [
      {
        title: "山路放牧",
        img: "/images/default-goods-image.png",
        desc: "通过背景层次和鼓点变化渲染晨雾山路。",
      },
    ],
  },
  {
    id: "play-wukong",
    title: "影戏《大闹天宫》选段",
    cover: "/images/ai_example2.png",
    tags: ["武打", "快节奏", "经典角色"],
    summaryRichText:
      "<p>该选段突出兵器对打与翻身动作，音轨节拍密集，适合测试播放体验。</p>",
    narration: {
      textRichText:
        "<p>重点听锣鼓点与角色出场配合，节奏会明显快于文戏。</p>",
      audio: {
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        durationSec: 330,
      },
    },
    tracks: [
      {
        id: "track-fight",
        title: "武打主段",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        durationSec: 355,
      },
      {
        id: "track-dialogue",
        title: "对白与亮相",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        durationSec: 323,
      },
    ],
    roles: [
      {
        name: "孙悟空",
        img: "/images/avatar.png",
        desc: "高频跳跃动作，强调影人的快切与转腕。",
      },
      {
        name: "托塔天王",
        img: "/images/avatar.png",
        desc: "动作稳重，配合鼓点形成反差。",
      },
    ],
    scenes: [
      {
        title: "南天门",
        img: "/images/default-goods-image.png",
        desc: "多角色同屏调度，检验舞台层次。",
      },
    ],
  },
  {
    id: "play-mu-guiying",
    title: "影戏《穆桂英挂帅》",
    cover: "/images/default-goods-image.png",
    tags: ["巾帼英雄", "唱腔细腻", "人物戏"],
    summaryRichText:
      "<p>《穆桂英挂帅》注重人物情绪递进，唱词更细腻，适合反复听解说。</p>",
    narration: {
      textRichText:
        "<p>先看人物关系，再听唱词，会更容易理解每段情绪推进。</p>",
      audio: {
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
        durationSec: 377,
      },
    },
    tracks: [
      {
        id: "track-aria",
        title: "主唱段",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        durationSec: 359,
      },
      {
        id: "track-recap",
        title: "剧情回顾",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
        durationSec: 408,
      },
    ],
    roles: [
      {
        name: "穆桂英",
        img: "/images/avatar.png",
        desc: "人物表情变化多，适合观察影人头部摆动与步伐。",
      },
      {
        name: "佘太君",
        img: "/images/avatar.png",
        desc: "台词与唱段转换密集，体现文戏层次。",
      },
    ],
    scenes: [
      {
        title: "点将台",
        img: "/images/default-goods-image.png",
        desc: "文戏转武戏的关键场景。",
      },
    ],
  },
];
