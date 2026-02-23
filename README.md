# 唐山皮影小程序

基于微信小程序原生框架（JavaScript + WXML + WXSS）实现的唐山皮影内容展示与音频播放应用。

## 当前状态

- 已完成首页资讯、经典剧目、虚拟体验占位页、个人中心、收藏与全局音频播放能力。
- `docs/` 已废弃，资讯图文素材已迁移到小程序运行目录。
- 当前版本以本地静态数据为主，不依赖云端数据库。

## 功能一览

### 1) 首页资讯（`pages/consult/index`）

- 顶部轮播 + 资讯列表，数据来自 `miniprogram/data/consult.js`。
- 每条资讯支持点击进入图文详情页 `pages/consult/detail`。
- 图文详情使用 `rich-text` 渲染正文，包含文章配图。

### 2) 经典剧目（`pages/plays/index` / `pages/plays/detail`）

- 剧目列表展示封面、标签、音轨数量。
- 详情页支持：
  - 一键播放解说音轨；
  - 播放剧目音轨列表；
  - 播放/暂停、停止、拖动进度；
  - 展开/收起解说文本；
  - 收藏/取消收藏；
  - 跳转虚拟体验页。

### 3) 虚拟体验（`pages/experience/index`）

- 当前为 Phase 0 占位页。
- 进入页面时自动暂停当前剧目音频；
- 离开页面时自动恢复到进入前的音轨与播放进度（若进入前处于播放态则继续播放）。
- 体验关卡、体验 BGM、通关发卡能力暂未上线。

### 4) 我的（`pages/settings/index`）

- 本地头像与昵称编辑（仅保存在本机）。
- 收藏统计与收藏预览，支持跳转“查看全部”。
- 虚拟体验 BGM 开关（当前仅本地存储，待体验页 BGM 功能接入后生效）。

### 5) 收藏列表（`pages/settings/favorites`）

- 展示全部已收藏剧目；
- 支持进入剧目详情；
- 支持取消收藏。

### 6) 全局音频与迷你播放器

- 使用 `wx.getBackgroundAudioManager()` 实现后台音频播放；
- 全局单实例、单音轨播放；
- 音轨播完后停在 `Ended` 状态，不自动下一首；
- 全局 `audio-mini-bar` 组件显示当前播放信息并支持快速操作。

## 数据与资源

### 内容数据

- `miniprogram/data/consult.js`：首页资讯与图文详情数据（4 篇文章）
- `miniprogram/data/plays.js`：剧目、解说、音轨、角色、场景
- `miniprogram/data/faq.js`：FAQ 预留数据（当前页面未接入）

### 图片资源

- `miniprogram/images/consult/`：资讯正文配图（`p1.png` ~ `p8.png`）
- 其他页面素材位于 `miniprogram/images/`

### 音频资源

- 当前示例音频使用公开演示链接（`soundhelix.com`），用于功能联调与播放器演示。

## 本地存储键

由 `miniprogram/services/storage.js` 管理：

- `settings.bgmEnabled`
- `favorites.playIds`
- `audio.resumeToken`
- `user.profile`

## 目录结构（核心）

```text
miniprogram/
  app.js
  app.json
  components/
    audio-mini-bar/
  data/
    consult.js
    plays.js
    faq.js
    index.js
  pages/
    consult/
    plays/
    experience/
    settings/
  services/
    audioService.js
    storage.js
```

## 本地运行

1. 使用微信开发者工具导入项目根目录（`project.config.json` 所在目录）。
2. 使用测试号或你自己的 AppID。
3. 直接编译运行即可（当前主流程不依赖云函数）。

## 云函数说明

- `cloudfunctions/quickstartFunctions` 为模板遗留能力，当前主页面流程未使用。
- 如需使用该云函数能力，再按微信开发者工具进行上传部署。

## 当前边界（与现状一致）

- 不支持用户提问、评论、分享。
- 不支持连续播放/播放队列/自动下一首。
- 虚拟体验关卡、通关发卡、体验页 BGM 播放尚未实现（仅占位与音频暂停恢复逻辑已实现）。
