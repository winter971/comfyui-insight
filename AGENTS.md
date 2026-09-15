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
- **视觉规范（2026-09-14 定稿，改样式前必读）**：配色 = 节点类型色系长出的暖色，`--accent #e8a33d`（琥珀）/ `--accent-2 #d97757`（赤陶）/ `--bg #14110e` / `--panel #1f1a16` / `--text #f3ede3` / `--muted #b6aa9b`，全部 ≥ WCAG AA 4.5。**禁止再引入紫青**（`#7c5cff` `#4cc9f0` `#7dd3fc` `#c4b5fd` 等已全站清除）；节点语义色 `--c-*` 是数据编码，一律不动（含 `--c-net #4cc9f0`）。
- **禁用清单**（impeccable 反模式，已清理干净，别再写回来）：渐变文字（`background-clip:text`）、玻璃拟态（`backdrop-filter`）、emoji 当图标、装饰性渐变、幽灵数字水印、英雄指标卡宫格。
- **图标**：统一用 assets/js/icons.js 的 `ICO.svg(name, size)`（30 个内联 SVG，stroke=currentColor）；callout 图标走 CSS 背景（`.callout.tip/.info/.warn/.danger .co-ico`）。**数据里的 🔇/⏸ 前缀是正则依赖，不能清**。
- **移动端**：≤980px 顶栏收成「logo + 搜索 + 汉堡」，导航进右侧抽屉（`#navToggle` / `#navBackdrop` / `body.nav-open`，关闭入口：遮罩、Esc、hashchange）。任何新组件都要过 390px 零溢出检查（`document.documentElement.scrollWidth === clientWidth`）。
- **路由**：未知路由走 `renderNotFound()`（不要静默回落首页）。

## 目录与数据约定
- assets/js/data/nodes-*.js：节点包数据（23 包 / 792 节点），每节点含 name/cat/brief/desc/inputs/outputs/why/params/tips。
- assets/js/data/workflows*.js：工作流解析数据（32 条）；graph.nodes 的 cat 只能取 load/model/cond/latent/image/sampler/mask/vae/clip/video/audio/util/net。
- assets/js/data/topics.js：专题层数据（2 个专题：video-gen / minimax-h3），由工作区 `_sources/build_topics.cjs` 生成，勿手改；改专题规则请编辑 `_sources/topics.json` 与 `_sources/topic_content/{id}.json` 后重跑。
- assets/js/icons.js：全站内联 SVG 图标集（`window.ICO` + `ICO.svg(name,size)`），页面图标一律走它，不要用 emoji。
- assets/js/data/workflows-civitai.js：第四部分真实工作流库索引（2281 条，含 variants/dup/ai 覆盖标记），由工作区 _sources/build_site_data.cjs 生成，勿手改。
- assets/files/civitai/graph/*.json：第四部分懒加载交互图（2991 份，{versionId}__{idx}.json），由 _sources/build_graphs.cjs 生成，勿手改；已做泄漏凭据消毒（_sources/sanitize_secrets.cjs）。
- assets/js/wfpanel.js：三合一面板通用组件（数据流/阶段拆解/逐节点分析，第三、四部分共用），skeleton+mount 两段式调用。
- assets/js/page-civitai.js：第四部分页面（列表页主区只展示已 AI 精读工作流，未分析收进底部折叠备份区；详情页用 wfpanel.js 三合一面板 + 懒加载交互节点图，与第三部分同一套逻辑）。
- assets/js/data/workflow-files.js：工作流真实文件溯源清单；assets/files/workflows/*.json 是从公开仓库下载的原始文件（25 个，改前先跑校验脚本）。
- assets/js/data/widget-help.js：通用参数中文知识库，弹窗参数解释优先用它。
- 字符串卫生：数据文件内容禁止反引号、markdown 符号、单引号字符（渲染器按纯文本处理）。

## 当前状态与下一步（更新于 2026-09-15）
- **线上版本 `?v=20260915a`**，双平台一致：https://comfyui-insight.pages.dev 与 https://winter971.github.io/comfyui-insight 。版本号只在 index.html（9 处）与 assets/js/app.js 的 `window.COMFY_APP_VER`，两者必须同步。
- 四大板块均已上线：一 · 架构解析；二 · 节点包全解（**23 包 / 792 节点**，参数覆盖 100%）；三 · 工作流图鉴（**32 条**，其中 25 条挂真实源文件）；四 · 真实工作流库（**2281 条**工作流卡片 / **2991 份**交互节点图）。
- 已上线（2026-09-15）：第四部分 AI 精读进度 **498 份稿件**（主区可见卡片 426 张，variants 层 `ai:true` 924 个）。精读口径：新 schema（summary/useCases/difficulty/flow/tips/nodeAnalysis/stages）齐全才计入，重复组成员继承代表分析并标 `sameAs`。`_sources/ai_analysis/_reject/` 剩 5 份止损稿（需人工对照 workflow_json 重写）；剩余候选 2279 份。分派/发布/验收全流程见工作区根 AGENTS.md「方案四 AI 精读接手指南」，任务书在 `_sources/ai_analysis/TASK.md`。
- 已上线（2026-09-14）：专题层（方案五）——2 个专题（`video-gen` / `minimax-h3`），入口在第四部分页顶部 chip 条，路由 `#/civitai/topic` 与 `#/civitai/topic/{id}`；含对比表、子主题分组、模型规格表。规则改 `_sources/topics.json` + `_sources/topic_content/{id}.json`，重跑 `build_topics.cjs`。
- 已上线（2026-09-14）：视觉重构 P0–P3——紫青渐变 → 节点色系暖色、移除渐变文字/玻璃拟态/emoji 图标/幽灵数字/英雄指标卡、新增 icons.js 图标系统、统计块统一为数据条、移动端导航改汉堡 + 抽屉、未知路由改 404 页。规范见上「技术栈与硬约束」。
- 已上线（2026-09-10）：节点图交互——节点可拖动（位置 localStorage `cvgPos:<图哈希>` 记忆）、默认排布自动防重叠、节点下方一句话备注（优先 AI 精读 `ai.na[id].brief`，💬 开关存 `cvgShowNotes`）、连线悬空修复（槽位索引越界夹紧）；节点详情弹框支持拖动/缩放。
- 已上线（2026-09-09）：三合一面板抽为 assets/js/wfpanel.js 公共组件（数据流 / 阶段拆解 / 逐节点分析 + 步进 + 与图双向联动），第三、四部分共用。
- 待办：AI 精读按新 schema 继续磨（发布节奏每满 60 份一发布点，当前 498，下一发布点 558）；工作流 graph 节点的 params 逐条增强（当前靠 widget-help.js 自动推导）。
- 敏感边界：不托管模型文件、不提供下载渠道；换脸/人像内容必须带合规提示；NSFW 部分只做管线结构解析（18+）；发布前必须跑密钥消毒（civitai 抓取数据里发现过他人泄漏的 HF token）。
