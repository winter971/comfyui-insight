# AGENTS.md — comfyui-insight

## 定位
「ComfyUI 全景解析」：纯静态中文可视化知识库，讲清 ComfyUI 架构、节点包、工作流三件事。线上地址 https://winter971.github.io/comfyui-insight/ （GitHub Pages，push 到 main 即自动发布）。

## 怎么跑
- 本地预览：工作区根目录跑 `node _sources/dev_server.cjs` → http://127.0.0.1:8090（本机无 python，`python -m http.server` 跑不了；也可直接双击 index.html）。
- 改动 assets 下任何 js/css 后，必须同步提升 index.html 里的 `?v=` 缓存版本号（格式 YYYYMMDD + 递进字母，如 20260908h），否则浏览器/Pages 缓存会导致"改了没生效"；app.js 顶部 `window.COMFY_APP_VER` 是运行时版本标记，可用来核对实际加载版本。
- 工作流源文件校验：`node scripts/validate-workflows.mjs assets/files/workflows`（node 不在 PATH 时用 "/c/Program Files/nodejs/node.exe"）。
- 数据文件语法检查：`node --check <文件>`；结构检查用 `node -e "global.window={};require('./assets/js/data/xxx.js')"` 后读取 window.COMFY_DATA（注意：数据文件是单行大 JSON，`grep -c` 只会返回 1，统计条目要用 node 解析）。
- 线上 E2E（发布后必跑）：工作区 `_sources/e2e_cloud.cjs`，用法 `NODE_PATH=<playwright 所在 node_modules> node _sources/e2e_cloud.cjs <baseUrl> <label>`，35 项断言覆盖全站旅程 + 移动端零溢出 + 抽屉；两个域名都要跑。脚本内写死了期望版本号，每次发布升 `?v=` 后必须同步改这一行。

## 技术栈与硬约束
- 原生 HTML/CSS/JS（ES5 风格 IIFE + window.COMFY_DATA 全局挂载），无框架、无构建、无外部网络依赖。
- 节点图渲染器在 assets/js/nodegraph.js（SVG，支持平移/缩放/点击高亮、节点拖动＋位置记忆（localStorage `cvgPos:<图哈希>`）、默认排布防重叠推挤、节点一句话备注（优先 AI 精读 `ai.na[id].brief`，💬 开关存 `cvgShowNotes`）、连线端口越界夹紧）；SPA 路由在 assets/js/app.js（hash 路由）。
- 深色主题、ComfyUI 同构视觉（类型决定连线颜色），改样式只动 assets/css/style.css。
- **多主题层（2026-09-15 新增，改样式前必读）**：见下「主题层」整节。
- **视觉规范（2026-09-14 定稿，改样式前必读）**：配色 = 节点类型色系长出的暖色，`--accent #e8a33d`（琥珀）/ `--accent-2 #d97757`（赤陶）/ `--bg #14110e` / `--panel #1f1a16` / `--text #f3ede3` / `--muted #b6aa9b`，全部 ≥ WCAG AA 4.5。**禁止再引入紫青**（`#7c5cff` `#4cc9f0` `#7dd3fc` `#c4b5fd` 等已全站清除）；节点语义色 `--c-*` 是数据编码，一律不动（含 `--c-net #4cc9f0`）。
  - ⚠️ 该条的适用面是 **base 主题（原版深色）**。主题 F 的设计语言本身建立在深靛 + Riso 色上，其 `--c-*` 是同一批色相在深靛底上重调明度，属于既定方向，不算违反。

- **禁用清单**（impeccable 反模式，已清理干净，别再写回来）：渐变文字（`background-clip:text`）、玻璃拟态（`backdrop-filter`）、emoji 当图标、装饰性渐变、幽灵数字水印、英雄指标卡宫格。
- **图标**：统一用 assets/js/icons.js 的 `ICO.svg(name, size)`（30 个内联 SVG，stroke=currentColor）；callout 图标走 CSS 背景（`.callout.tip/.info/.warn/.danger .co-ico`）。**数据里的 🔇/⏸ 前缀是正则依赖，不能清**。
- **移动端**：≤1180px 顶栏收成「logo + 搜索 + 汉堡」，导航进右侧抽屉（`#navToggle` / `#navBackdrop` / `body.nav-open`，关闭入口：遮罩、Esc、hashchange；C / F 主题另有 `#drawerClose`）。任何新组件都要过 390px 零溢出检查（`document.documentElement.scrollWidth === clientWidth`）。
  - 断点为什么是 1180 而不是 980：`.container` 上限 1280px，顶栏可用宽度也就封顶 1280，**原版在 1024px 时内联导航只剩 1px 余量**；加入主题切换器后 1180 以下必然折行，故顶栏比页面布局（980）提前收起。页面布局断点仍是 980。
- **路由**：未知路由走 `renderNotFound()`（不要静默回落首页）。

## 主题层（多主题 / 换肤）

三套主题共用同一份 DOM，只由 `html[data-theme]` 决定外观：`c` 精装出版物（**默认**，米白纸底衬线）/ `f` 数据人文主义（深靛 Riso）/ `base` 原版深色。设计来源 `comfyui-insight-redesign/design-demos/{C-stripe-press-v2,F-data-humanism-v2}.html`。

**机制、token 清单、加第四套主题的步骤、四个必踩的坑、验收命令与判据，全在工作区 [docs/themes.md](../docs/themes.md)。本页只留红线。**

1. **不许新写硬编码色**。一律用 `style.css :root` 的中间 token（`--acc-rgb` / `--acc-soft` / `--tx-strong-2` / `--page-max` …），否则新颜色不跟主题走。
2. **主题文件不许写裸选择器**。`theme-c.css` / `theme-f.css` 每条规则都要带 `html[data-theme="x"]` 前缀。
3. **原生渲染岛的范围必须收在 `svg` 上**，不能落在容器上——落在容器上会把容器自己的 `--border-2` 一起复原，外框就不跟主题了。节点图画布保持 ComfyUI 原生深色。
4. **桌面段设过 `position` / `top` / `float` / `transform` / `display` / `max-height` / `overflow` 的元素，移动段必须整套重写**。媒体查询不加特异性，桌面段的高特异性规则会盖掉基础样式的移动端规则——已两次踩到：抽屉退化成文档流（溢出 400px）、`.arch-toc` 残留 `position: sticky` 浮在正文上重叠。只写 `float: none` 是不够的。
5. **`pre > code { display: block }` 不能删**（管着代码块行距）；**`#wfJsonPre` 是裸文本 pre，不要动 `pre` 的 `font-size`**。

`assets/fonts/*.woff2`（448KB / 11 个文件）是本地字体，**必须随仓库发布**——站点零外部网络依赖。

宽幅图形（架构页示意图、迷你画布）**一律给足固有宽度 + 横向滚动，不做等比缩放**——缩到 390px 时图内文字会掉到 4px，而 `getComputedStyle` 读的是声明值，字号断言照样通过。详见 [docs/themes.md](../docs/themes.md)。


## 目录与数据约定
- assets/js/data/nodes-*.js：节点包数据（23 包 / 792 节点），每节点含 name/cat/brief/desc/inputs/outputs/why/params/tips。
- assets/js/data/workflows*.js：工作流解析数据（32 条）；graph.nodes 的 cat 只能取 load/model/cond/latent/image/sampler/mask/vae/clip/video/audio/util/net。
- assets/js/data/topics.js：专题层数据（2 个专题：video-gen / minimax-h3），由工作区 `_sources/build_topics.cjs` 生成，勿手改；改专题规则请编辑 `_sources/topics.json` 与 `_sources/topic_content/{id}.json` 后重跑。
- assets/js/icons.js：全站内联 SVG 图标集（`window.ICO` + `ICO.svg(name,size)`），页面图标一律走它，不要用 emoji。
- assets/js/theme.js：主题状态 + 切换器 + 抽屉关闭按钮。**不参与页面渲染**。
- assets/css/theme-c.css / theme-f.css：两个新增主题，全部规则作用域在 `html[data-theme="c"|"f"]` 下，不写裸选择器。
- assets/css/fonts.css + assets/fonts/*.woff2：本地字体（latin 子集），由 `_sources/fetch_fonts.cjs` 生成，勿手改。
- assets/js/data/workflows-civitai.js：第四部分真实工作流库索引（~2332 条，含 variants/dup/ai 覆盖标记），由工作区 _sources/build_site_data.cjs 生成，勿手改。
- assets/files/civitai/graph/*.json：第四部分懒加载交互图（~3055 份，{versionId}__{idx}.json），由 _sources/build_graphs.cjs 生成，勿手改；已做泄漏凭据消毒（_sources/sanitize_secrets.cjs）。
- assets/js/wfpanel.js：三合一面板通用组件（数据流/阶段拆解/逐节点分析，第三、四部分共用），skeleton+mount 两段式调用。
- assets/js/page-civitai.js：第四部分页面（列表页主区只展示已 AI 精读工作流，未分析收进底部折叠备份区；详情页用 wfpanel.js 三合一面板 + 懒加载交互节点图，与第三部分同一套逻辑）。
- assets/js/data/workflow-files.js：工作流真实文件溯源清单；assets/files/workflows/*.json 是从公开仓库下载的原始文件（25 个，改前先跑校验脚本）。
- assets/js/data/widget-help.js：通用参数中文知识库，弹窗参数解释优先用它。
- 字符串卫生：数据文件内容禁止反引号、markdown 符号、单引号字符（渲染器按纯文本处理）。

## 当前状态与下一步

- **线上双平台**：https://comfyui-insight.pages.dev 与 https://winter971.github.io/comfyui-insight 。版本号只在 index.html（13 处）与 assets/js/app.js 的 `window.COMFY_APP_VER`，两者必须同步；`_sources/e2e_cloud.cjs` 里也写死了期望值。**当前线上版本以 index.html 为准，本页不重复记录。**
- **板块与口径**：一 · 架构解析；二 · 节点包全解（23 包 / 792 节点）；三 · 工作流图鉴（32 条，其中 25 条挂真实源文件）；四 · 真实工作流库（~2332 条卡片 / ~3055 份交互节点图）。专题层 2 个（`video-gen` / `minimax-h3`），入口在第四部分页顶部 chip 条，路由 `#/civitai/topic`。**这些数字都会过期，动手前用脚本重估。**
- **待办**：AI 精读按新 schema 继续磨（当前 aiDone = 1124，本轮完成 Batch 24 & 25 累计新增 16 篇；最新版本 20260924g，已推送 main）；工作流 graph 节点的 params 逐条增强（当前靠 widget-help.js 自动推导）；详情页 390px 横向溢出未修（原版就有，见 [docs/themes.md](../docs/themes.md) 末节）。
- **敏感边界**：不托管模型文件、不提供下载渠道；换脸/人像内容必须带合规提示；NSFW 部分只做管线结构解析（18+）；发布前必须跑密钥消毒（civitai 抓取数据里发现过他人泄漏的 HF token）。
- **历史踩坑（改样式时会再遇到）**：原 index.html 开头 6 个多余 BOM 字符曾使整站落入**怪异模式**（`document.compatMode === "BackCompat"`），造成每页顶部 26px 空行与表格行高异常；2026-09-15 已修，表格行高与代码块行距在 `style.css` 显式写回。**改样式后若发现页面高度/行距莫名变化，先查 `document.compatMode`。**
