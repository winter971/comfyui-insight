# AGENTS.md — comfyui-insight

## 定位
「ComfyUI 全景解析」：纯静态中文可视化知识库，讲清 ComfyUI 架构、节点包、工作流三件事。线上地址 https://winter971.github.io/comfyui-insight/ （GitHub Pages，push 到 main 即自动发布）。

## 怎么跑
- **先认清你在哪台机器**：`_sources/`（dev_server / build_graphs / build_site_data / build_topics / build_graphs / sanitize_secrets / e2e_cloud / fetch_fonts）**不在这个仓库里，也从未进过 git 历史**——它是维护者另一台机器上的工作区目录。只有仓库内的 `scripts/` 两个脚本随手可用。凡是下面提到 `_sources/...` 的步骤，在缺这个目录的机器上都做不了，不要照着猜。
- 本地预览：仓库根目录 `python3 -m http.server 8090 --bind 127.0.0.1` → http://127.0.0.1:8090，或直接双击 index.html。（本机 python3 3.14 可用；早先写的"本机无 python"是另一台 Windows 机器的情况，别照抄。node 也在 PATH。）
- 改动 assets 下任何 js/css 后，必须同步提升 index.html 里的 `?v=` 缓存版本号（格式 YYYYMMDD + 递进字母，如 20260908h），否则浏览器/Pages 缓存会导致"改了没生效"；app.js 顶部 `window.COMFY_APP_VER` 是运行时版本标记，可用来核对实际加载版本。
- 工作流源文件校验：`node scripts/validate-workflows.mjs assets/files/workflows`（当前 25/25 通过）。
- 数据文件语法检查：`node --check <文件>`；结构检查用 `node -e "global.window={};require('./assets/js/data/xxx.js')"` 后读取 window.COMFY_DATA（注意：数据文件是单行大 JSON，`grep -c` 只会返回 1，统计条目要用 node 解析）。
- AI 精读队列的取料 / 落盘 / 验收：`node scripts/ai-audit.mjs list|dump|apply`（仓库内，可用）；批量并行时另有仓外工具链，见下「精读落盘工具链」。
- 线上 E2E（发布后必跑）：`_sources/e2e_cloud.cjs`，35 项断言覆盖全站旅程 + 移动端零溢出 + 抽屉，两个域名都要跑；脚本内写死了期望版本号，每次发布升 `?v=` 后要同步改。**该脚本不在本仓库，缺则跑不了，此时改为本地手工核验并在摘要里说明。**

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

**机制、token 清单、加第四套主题的步骤、四个必踩的坑、验收命令与判据，原本在维护者工作区的 `docs/themes.md`——该文件不在本仓库、也从未进过 git 历史。** 在本克隆里这三套主题的真相只能读代码：`assets/css/style.css` 的 `:root` 中间 token、`assets/css/theme-c.css` / `theme-f.css`、`assets/js/theme.js`。本页只留红线。

1. **不许新写硬编码色**。一律用 `style.css :root` 的中间 token（`--acc-rgb` / `--acc-soft` / `--tx-strong-2` / `--page-max` …），否则新颜色不跟主题走。
2. **主题文件不许写裸选择器**。`theme-c.css` / `theme-f.css` 每条规则都要带 `html[data-theme="x"]` 前缀。
3. **原生渲染岛的范围必须收在 `svg` 上**，不能落在容器上——落在容器上会把容器自己的 `--border-2` 一起复原，外框就不跟主题了。节点图画布保持 ComfyUI 原生深色。
4. **桌面段设过 `position` / `top` / `float` / `transform` / `display` / `max-height` / `overflow` 的元素，移动段必须整套重写**。媒体查询不加特异性，桌面段的高特异性规则会盖掉基础样式的移动端规则——已两次踩到：抽屉退化成文档流（溢出 400px）、`.arch-toc` 残留 `position: sticky` 浮在正文上重叠。只写 `float: none` 是不够的。
5. **`pre > code { display: block }` 不能删**（管着代码块行距）；**`#wfJsonPre` 是裸文本 pre，不要动 `pre` 的 `font-size`**。

`assets/fonts/*.woff2`（448KB / 11 个文件）是本地字体，**必须随仓库发布**——站点零外部网络依赖。

宽幅图形（架构页示意图、迷你画布）**一律给足固有宽度 + 横向滚动，不做等比缩放**——缩到 390px 时图内文字会掉到 4px，而 `getComputedStyle` 读的是声明值，字号断言照样通过。


## 目录与数据约定
- assets/js/data/nodes-*.js：节点包数据（23 包 / 792 节点），每节点含 name/cat/brief/desc/inputs/outputs/why/params/tips。
- assets/js/data/workflows*.js：工作流解析数据（32 条）；graph.nodes 的 cat 只能取 load/model/cond/latent/image/sampler/mask/vae/clip/video/audio/util/net。
- assets/js/data/topics.js：专题层数据（2 个专题：video-gen / minimax-h3），由工作区 `_sources/build_topics.cjs` 生成，勿手改；改专题规则请编辑 `_sources/topics.json` 与 `_sources/topic_content/{id}.json` 后重跑（**`_sources/` 不在本仓库，缺这个目录的机器上这条做不了**）。
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

- **线上双平台**：https://comfyui-insight.pages.dev 与 https://winter971.github.io/comfyui-insight 。版本标记有两处：app.js 的 `window.COMFY_APP_VER`（当前值即"最新版本"），以及 index.html 里 14 个 `?v=YYYYMMDDx`。**这 14 个不是一次全改**——只给本次真的改过的文件顶到最新值，没动的文件留在旧值是正常设计（9 个停在 20260923c、5 个在最新值就是当前实况）。`_sources/e2e_cloud.cjs` 里还写死了期望值，但它不在本仓库。**当前线上版本以 index.html 最新值 + COMFY_APP_VER 为准，本页不重复记录。**
- **板块与口径**：一 · 架构解析；二 · 节点包全解（23 包 / 792 节点）；三 · 工作流图鉴（32 条，其中 25 条挂真实源文件）；四 · 真实工作流库（~2332 条卡片 / ~3055 份交互节点图）。专题层 2 个（`video-gen` / `minimax-h3`），入口在第四部分页顶部 chip 条，路由 `#/civitai/topic`。**这些数字都会过期，动手前用脚本重估。**
- **状态**：AI 精读队列已清空——2332 / 2332 条都带精读载荷（2026-09-25 收尾，`?v=` 与 `COMFY_APP_VER` 同步在 20260925q）。**领先 origin/main 的提交全部只在本地**，push 即自动发布，推不推由人决定。
- **遗留**：① 486 条早于本轮的旧精读达不到下面的新门槛（na 注释偏少 204、阶段覆盖 <50% 124、缺 `p` 214、含反引号 38、`n` 偏短 11、`t` 偏短 7）——它们仍过仓库 `ai-audit.mjs` 的旧门槛，不是坏数据，只是比新标准薄，补齐是独立工作量；② graph 节点的 params 逐条增强（现靠 widget-help.js 自动推导）；③ 详情页 390px 横向溢出未修（原版就有）。
- **精读门槛**（新数据必须满足；`ai.na[id].brief` 会被节点图当备注渲染，质量是功能依赖不是装饰）：`s` ≥220 字、`u` ≥3 项且每项 ≥15 字、`d` ∈1~3、`st` ≥min(3, 功能节点数) 段且覆盖 ≥50% 功能节点、`na` ≥max(min(4,功能节点数), min(20, ceil(功能节点×0.3))) 条；`st`/`na` 引用的节点 ID 必须在图里真实存在。卫生：字符串值不得含反引号 / markdown / 制表符 / ASCII 单引号 / TODO 类占位词。功能节点 = 排除 Note / MarkdownNote / Note Plus (mtb) / Label (rgthree) / CR Prompt Text / Text Multiline / PrimitiveStringMultiline / ShowText|pysssss。
- **精读工具链**：仓库内只有 `scripts/ai-audit.mjs`（list / dump / apply，单条粒度）。批量并行靠维护者机器上的 `~/.cache/comfyui-jingdu/`——`dump2.cjs`（取上下文，比 `ai-audit.mjs dump` 多出带端口名的连线、拓扑 heads/tails/isolated、作者完整原文）、`commit-ai.cjs`（按上述门槛批量校验 + 回写 graph 与索引）、`audit.cjs`（终局复验，不看计数器）、`make-tasks.cjs`（分片给子 agent）。**这套也不在仓库里**，换机器要重建。
- **精读已知数据缺口**（写分析时只能述可证实内容）：graph 存档把长 widget 文本（提示词、Note 正文、模型路径）统一截断到约 46~90 字；VHS 类节点常无 widgets（帧率/容器不可证）；新版子图以 UUID 为节点类型名、内部结构不展开；Anything Everywhere / rgthree Context 的广播被物化成端口名错位的连线，真实数据流要靠变量名配对反推；图文件无节点 mute/bypass 字段，旁路只能凭标题里的 ⏸ 判断。队列里有 13 条退化导出（≤3 节点或零连线），别为此编造阶段拆解。
- **敏感边界**：不托管模型文件、不提供下载渠道；换脸/人像内容必须带合规提示；NSFW 部分只做管线结构解析（18+）。**发布前必须跑密钥消毒**——civitai 抓取数据里反复发现第三方作者泄漏的凭据（早前有 HF token；2026-09-25 又扫出 OpenRouter `sk-or-v1-` ×5 变体、通用 `sk-api-`、Groq `gsk_`，分别在 vid 2132079 / 3231743 / 944757），已就地替换成 `[REDACTED-<sha8>]`。**注意这些明文值仍留在打码提交之前的 git 历史里**：要彻底清除得改写历史并 force-push，动之前必须先问维护者；同时这些 key 属于别人，被公开过就应视为已失效。
- **历史踩坑（改样式时会再遇到）**：原 index.html 开头 6 个多余 BOM 字符曾使整站落入**怪异模式**（`document.compatMode === "BackCompat"`），造成每页顶部 26px 空行与表格行高异常；2026-09-15 已修，表格行高与代码块行距在 `style.css` 显式写回。**改样式后若发现页面高度/行距莫名变化，先查 `document.compatMode`。**
