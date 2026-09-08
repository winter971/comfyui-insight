# AGENTS.md — comfyui-insight

## 定位
「ComfyUI 全景解析」：纯静态中文可视化知识库，讲清 ComfyUI 架构、节点包、工作流三件事。线上地址 https://winter971.github.io/comfyui-insight/ （GitHub Pages，push 到 main 即自动发布）。

## 怎么跑
- 本地预览：工作区根目录跑 `node _sources/dev_server.cjs` → http://127.0.0.1:8090（本机无 python，`python -m http.server` 跑不了；也可直接双击 index.html）。
- 改动 assets 下任何 js/css 后，必须同步提升 index.html 里的 `?v=` 缓存版本号（格式 YYYYMMDD + 递进字母，如 20260908h），否则浏览器/Pages 缓存会导致"改了没生效"；app.js 顶部 `window.COMFY_APP_VER` 是运行时版本标记，可用来核对实际加载版本。
- 工作流源文件校验：`node scripts/validate-workflows.mjs assets/files/workflows`（node 不在 PATH 时用 "/c/Program Files/nodejs/node.exe"）。
- 数据文件语法检查：`node --check <文件>`；结构检查用 `node -e "global.window={};require('./assets/js/data/xxx.js')"` 后读取 window.COMFY_DATA。

## 技术栈与硬约束
- 原生 HTML/CSS/JS（ES5 风格 IIFE + window.COMFY_DATA 全局挂载），无框架、无构建、无外部网络依赖。
- 节点图渲染器在 assets/js/nodegraph.js（SVG，支持平移/缩放/点击高亮/节点 mock）；SPA 路由在 assets/js/app.js（hash 路由）。
- 深色主题、ComfyUI 同构视觉（类型决定连线颜色），改样式只动 assets/css/style.css。

## 目录与数据约定
- assets/js/data/nodes-*.js：节点包数据（19 包），每节点含 name/cat/brief/desc/inputs/outputs/why/params/tips。
- assets/js/data/workflows*.js：工作流解析数据；graph.nodes 的 cat 只能取 load/model/cond/latent/image/sampler/mask/vae/clip/video/audio/util/net。
- assets/js/data/workflows-civitai.js：第四部分真实工作流库索引（2281 条，含 variants/dup/ai 覆盖标记），由工作区 _sources/build_site_data.cjs 生成，勿手改。
- assets/files/civitai/graph/*.json：第四部分懒加载交互图（2991 份，{versionId}__{idx}.json），由 _sources/build_graphs.cjs 生成，勿手改；已做泄漏凭据消毒（_sources/sanitize_secrets.cjs）。
- assets/js/page-civitai.js：第四部分页面（卡片/多维表格双视图 + 详情页懒加载节点图与 AI 讲解）。
- assets/js/data/workflow-files.js：工作流真实文件溯源清单；assets/files/workflows/*.json 是从公开仓库下载的原始文件（25 个，改前先跑校验脚本）。
- assets/js/data/widget-help.js：通用参数中文知识库，弹窗参数解释优先用它。
- 字符串卫生：数据文件内容禁止反引号、markdown 符号、单引号字符（渲染器按纯文本处理）。

## 当前状态与下一步（更新于 2026-09-08）
- 已上线：架构解析（第一部分）、22 个节点包 / 752 个节点（第二部分，参数覆盖 100%）、32 条工作流页（第三部分，25 条挂真实源文件）。
- 已上线（2026-09-08）：第三部分工作流详情页「三合一联动面板」——数据流讲解 / 管线阶段拆解 / 逐节点分析整合为可切换可收起的 tab 面板；三个 tab 统一"当前聚焦"强调、上一步/下一步/重置步进条与位置指示、顶部就地显示当前选中内容；面板与节点图双向联动（点阶段/步骤/节点高亮图，点图同步面板），全程不做页面级自动滚动。实现集中在 app.js mountWfGraph。
- 已上线：第四部分 · 真实工作流库（civitai 全量 2281 条主工作流 + 2991 份交互图，多维表格视图，NSFW 默认隐藏）。AI 深度讲解渐进覆盖中（约 340/2991 份，重复结构同源继承），由工作区 _sources/ 管线持续产出后重建合入。
- 待办：AI 精读剩余批次继续磨（管线与分派规范见工作区根 AGENTS.md）；工作流 graph 节点的 params 逐条增强（当前靠 widget-help.js 自动推导）。
- 敏感边界：不托管模型文件、不提供下载渠道；换脸/人像内容必须带合规提示；NSFW 部分只做管线结构解析（18+）；发布前必须跑密钥消毒（civitai 抓取数据里发现过他人泄漏的 HF token）。
