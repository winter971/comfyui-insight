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

## 主题层（2026-09-15）

三套主题共用同一份 DOM，只由 `html[data-theme]` 决定外观：

| 值 | 名称 | 载体 | 说明 |
|---|---|---|---|
| `c` | 精装出版物 | `assets/css/theme-c.css` | **默认**。米白纸底 + 衬线 + 书籍流 + 侧边目录 |
| `f` | 数据人文主义 | `assets/css/theme-f.css` | 深靛 Riso + 顶部横向章节带 + 双栏混排 + 手写体批注 |
| `base` | 原版深色 | `assets/css/style.css` | 原有暖色节点风，行为与改造前一致 |

设计语言来源：`comfyui-insight-redesign/design-demos/{C-stripe-press-v2,F-data-humanism-v2}.html`。

### 怎么运作

1. **`index.html` 里一段内联脚本**在样式表之前定下 `data-theme`（避免首屏闪主题）。取值优先级：URL `?theme=` → `localStorage.cvgTheme` → 默认 `c`。`?theme=` 只生效不写回存储（便于分享与自检）。
2. **`assets/js/theme.js`** 只管三件事：主题状态、顶栏/抽屉两个切换器、抽屉关闭按钮。**它不参与页面渲染**，所以加主题不会影响任何既有功能。
3. **中间 token 层**（`style.css` 的 `:root`）：`--acc-rgb` / `--acc2-rgb` / `--bg-rgb` / `--panel-rgb` / `--shade-rgb` / `--scrim-rgb` / `--shadow-rgb` / `--acc-soft` / `--acc2-soft` / `--acc-mid` / `--acc-mid2` / `--clip-soft` / `--ok-soft` / `--tx-strong*` / `--tx-soft` / `--tx-dim` / `--on-accent` / `--code-bg` / `--code-tx` / `--scroll-thumb*` / `--canvas-bg` / `--surface-3` / `--page-max` / `--page-pad`。
   **base 取值与原硬编码色逐字相同**，所以原版渲染零变化；主题文件只需重定义这些 token 就能整体换肤。
   改样式时**不要新写硬编码色**，用 token；否则新颜色不会跟着主题走。
4. **字体**：`assets/css/fonts.css`（由 `_sources/fetch_fonts.cjs` 生成）+ `assets/fonts/*.woff2`，只含 latin 子集（中文走系统字体栈）。共 448KB / 11 个文件，**必须随仓库发布**（站点零外部依赖）。

### 原生渲染岛（节点图边界，硬约束）

节点图画布、架构图、节点模拟图、civitai 迷你画布**由 JS 直接写死 ComfyUI 原生深色**，主题一律不碰内部。做法是把岛内 token 复原成 base 取值：

```css
html[data-theme="c"] .graph-shell svg,
html[data-theme="c"] .graph-detail svg,
html[data-theme="c"] .np-mock-wrap svg,
html[data-theme="c"] .arch-svg,
html[data-theme="c"] .cv-mc-board svg { /* 复原 base 的全部 token */ }
```

**岛的范围必须收在 `svg` 上，不能落在容器上**——否则容器自己的 `--border-2` 也被复原，外框就不跟主题了（`.graph-toolbar` / `.graph-hint` 等 HTML 也一样会被带偏）。
外框（`.graph-shell` 的边框与圆角、`.graph-toolbar` 按钮、`.graph-detail` 面板）随主题；画布网点保持原生琥珀 `rgba(232,163,61,.06)`。

### 改主题时最容易踩的三个坑

1. **媒体查询不加特异性**。桌面段写了 `html[data-theme="f"] .main-nav { position: relative }`，特异性 (0,2,1) 会**盖掉**基础样式里 `@media (max-width:1180px) .main-nav { position: fixed }`（0,1,0），抽屉直接退化成文档流、移动端溢出 400px。**凡在桌面段设过 `position`/`transform`/`display` 的元素，移动段必须整套重写，并在需要时补 `html[data-theme="x"] body.nav-open …` 这类更高特异性的规则。**
2. **`pre` 的 strut**。`pre` 字号 13px、内部 `<code>` 是 `.86em`，两者度量不同会让行距被 `pre` 撑高。现在用 `pre > code { display: block }` 让行距由 `code` 自己算。**`#wfJsonPre` 是裸文本 pre，靠 `pre` 的 13px 定字号，不要动 `pre` 的 font-size。**
3. **`!important` 与内联样式**。app.js 里依赖清单的类型标签是内联色（深色主题配色），纸底上对比度不足，主题 C 用 `!important` 只压文字色。

### 验收（改主题后必跑）

```bash
# 三主题 × 11 条路由 × 1440/390 两档，截图 + 相对 base 的增量问题判定
NODE_PATH=<playwright node_modules> node _sources/theme_shot.cjs <label> --themes=base,c,f

# base 主题逐元素回归（用 git HEAD 的原版文件做对照，颜色差异必须为 0）
NODE_PATH=<...> node _sources/theme_regress.cjs

# 全站 36 项旅程（三个主题各跑一次，BASE 里带 ?theme=）
NODE_PATH=<...> node _sources/e2e_cloud.cjs "http://127.0.0.1:8090/index.html?theme=f" <label>
```

判据：`theme_shot` 输出「相对 base 的增量问题：无」；`theme_regress` 颜色差异 0、几何差异只剩 `pre>code` 的 display 与 1px 舍入；`e2e_cloud` 36/36。


## 目录与数据约定
- assets/js/data/nodes-*.js：节点包数据（23 包 / 792 节点），每节点含 name/cat/brief/desc/inputs/outputs/why/params/tips。
- assets/js/data/workflows*.js：工作流解析数据（32 条）；graph.nodes 的 cat 只能取 load/model/cond/latent/image/sampler/mask/vae/clip/video/audio/util/net。
- assets/js/data/topics.js：专题层数据（2 个专题：video-gen / minimax-h3），由工作区 `_sources/build_topics.cjs` 生成，勿手改；改专题规则请编辑 `_sources/topics.json` 与 `_sources/topic_content/{id}.json` 后重跑。
- assets/js/icons.js：全站内联 SVG 图标集（`window.ICO` + `ICO.svg(name,size)`），页面图标一律走它，不要用 emoji。
- assets/js/theme.js：主题状态 + 切换器 + 抽屉关闭按钮。**不参与页面渲染**。
- assets/css/theme-c.css / theme-f.css：两个新增主题，全部规则作用域在 `html[data-theme="c"|"f"]` 下，不写裸选择器。
- assets/css/fonts.css + assets/fonts/*.woff2：本地字体（latin 子集），由 `_sources/fetch_fonts.cjs` 生成，勿手改。
- assets/js/data/workflows-civitai.js：第四部分真实工作流库索引（2281 条，含 variants/dup/ai 覆盖标记），由工作区 _sources/build_site_data.cjs 生成，勿手改。
- assets/files/civitai/graph/*.json：第四部分懒加载交互图（2991 份，{versionId}__{idx}.json），由 _sources/build_graphs.cjs 生成，勿手改；已做泄漏凭据消毒（_sources/sanitize_secrets.cjs）。
- assets/js/wfpanel.js：三合一面板通用组件（数据流/阶段拆解/逐节点分析，第三、四部分共用），skeleton+mount 两段式调用。
- assets/js/page-civitai.js：第四部分页面（列表页主区只展示已 AI 精读工作流，未分析收进底部折叠备份区；详情页用 wfpanel.js 三合一面板 + 懒加载交互节点图，与第三部分同一套逻辑）。
- assets/js/data/workflow-files.js：工作流真实文件溯源清单；assets/files/workflows/*.json 是从公开仓库下载的原始文件（25 个，改前先跑校验脚本）。
- assets/js/data/widget-help.js：通用参数中文知识库，弹窗参数解释优先用它。
- 字符串卫生：数据文件内容禁止反引号、markdown 符号、单引号字符（渲染器按纯文本处理）。

## 当前状态与下一步（更新于 2026-09-15）
- **线上版本 `?v=20260915d`**，双平台已同步：https://comfyui-insight.pages.dev 与 https://winter971.github.io/comfyui-insight （2026-09-15 20:30 发布，Cloudflare 部署 ID `dfb9d68f`）。版本号只在 index.html（13 处）与 assets/js/app.js 的 `window.COMFY_APP_VER`，两者必须同步；`_sources/e2e_cloud.cjs` 里也写死了期望值。
- **已上线（2026-09-15）：多主题层**——三主题（`c` 精装出版物 · 默认 / `f` 数据人文主义 / `base` 原版深色），顶栏右侧切换器 + 抽屉内切换器，`localStorage.cvgTheme` 记忆，`?theme=` 可直接指定。线上实测：默认主题 `c`、四个样式表 200、字体真实加载、切主题与刷新记忆正常、无 404 无 JS 错误；节点图画布底色与节点描边三主题一致，外框随主题。
- **本次顺手修掉的两个既有 bug**（不是新增改动，是原版就有）：
  1. `index.html` 开头有 **6 个多余的 BOM 字符**，被解析器当成 `<body>` 里的文本节点 → 整站落入**怪异模式**（`document.compatMode === "BackCompat"`），每页顶部多出一条 **26px 空行**。重写 index.html 时清掉了；表格行高与代码块行距在 `style.css` 里显式写回，保证视觉不变。
  2. 详情页在 390px 下横向溢出（工作流详情 +19px、工作流库详情 +121px）——**原版就有**，三主题都没让它变差，**尚未修**。

- 四大板块均已上线：一 · 架构解析；二 · 节点包全解（**23 包 / 792 节点**，参数覆盖 100%）；三 · 工作流图鉴（**32 条**，其中 25 条挂真实源文件）；四 · 真实工作流库（**2281 条**工作流卡片 / **2991 份**交互节点图）。
- 已上线（2026-09-15）：第四部分 AI 精读进度 **498 份稿件**（主区可见卡片 426 张，variants 层 `ai:true` 924 个）。精读口径：新 schema（summary/useCases/difficulty/flow/tips/nodeAnalysis/stages）齐全才计入，重复组成员继承代表分析并标 `sameAs`。`_sources/ai_analysis/_reject/` 剩 5 份止损稿（需人工对照 workflow_json 重写）；剩余候选 2279 份。分派/发布/验收全流程见工作区根 AGENTS.md「方案四 AI 精读接手指南」，任务书在 `_sources/ai_analysis/TASK.md`。
- 已上线（2026-09-14）：专题层（方案五）——2 个专题（`video-gen` / `minimax-h3`），入口在第四部分页顶部 chip 条，路由 `#/civitai/topic` 与 `#/civitai/topic/{id}`；含对比表、子主题分组、模型规格表。规则改 `_sources/topics.json` + `_sources/topic_content/{id}.json`，重跑 `build_topics.cjs`。
- 已上线（2026-09-14）：视觉重构 P0–P3——紫青渐变 → 节点色系暖色、移除渐变文字/玻璃拟态/emoji 图标/幽灵数字/英雄指标卡、新增 icons.js 图标系统、统计块统一为数据条、移动端导航改汉堡 + 抽屉、未知路由改 404 页。规范见上「技术栈与硬约束」。
- 已上线（2026-09-10）：节点图交互——节点可拖动（位置 localStorage `cvgPos:<图哈希>` 记忆）、默认排布自动防重叠、节点下方一句话备注（优先 AI 精读 `ai.na[id].brief`，💬 开关存 `cvgShowNotes`）、连线悬空修复（槽位索引越界夹紧）；节点详情弹框支持拖动/缩放。
- 已上线（2026-09-09）：三合一面板抽为 assets/js/wfpanel.js 公共组件（数据流 / 阶段拆解 / 逐节点分析 + 步进 + 与图双向联动），第三、四部分共用。
- 待办：AI 精读按新 schema 继续磨（发布节奏每满 60 份一发布点，当前 498，下一发布点 558）；工作流 graph 节点的 params 逐条增强（当前靠 widget-help.js 自动推导）。
- 敏感边界：不托管模型文件、不提供下载渠道；换脸/人像内容必须带合规提示；NSFW 部分只做管线结构解析（18+）；发布前必须跑密钥消毒（civitai 抓取数据里发现过他人泄漏的 HF token）。
