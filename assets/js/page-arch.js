/* ============================================================
   第一部分：ComfyUI 架构解析页
   内容基于 ComfyUI v0.34.2 真实源码结构整理
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------------- SVG 图 1：前后端整体架构 ---------------- */
  var SVG_ARCH =
  '<svg class="arch-svg" viewBox="0 0 1160 620" xmlns="http://www.w3.org/2000/svg">'
  + '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#4cc9f0"/></marker>'
  + '<marker id="arp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#a78bfa"/></marker></defs>'

  /* 前端大框 */
  + '<rect x="30" y="30" width="440" height="540" rx="14" fill="#171a26" stroke="#7c5cff" stroke-width="1.5" stroke-dasharray="none"/>'
  + '<text x="250" y="62" text-anchor="middle" class="lbl-strong" style="font-size:16px">🖥️ 前端（浏览器 / Electron 桌面壳）</text>'
  + '<rect x="55" y="90" width="390" height="86" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="250" y="118" text-anchor="middle" class="lbl-strong">LiteGraph 节点画布 (Canvas)</text><text x="250" y="142" text-anchor="middle" class="lbl">拖拽节点、连线、摆布局 —— 你看到的工作流编辑器</text><text x="250" y="162" text-anchor="middle" class="lbl-small">litegraph.core.js / litegraph.extensions.js</text>'
  + '<rect x="55" y="196" width="390" height="80" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="250" y="224" text-anchor="middle" class="lbl-strong">工作流序列化 (workflow.json)</text><text x="250" y="247" text-anchor="middle" class="lbl">把画布上的节点与连线导出为 JSON</text><text x="250" y="265" text-anchor="middle" class="lbl-small">ComfyUI 原生格式 / ComfyAPI 格式两套序列化</text>'
  + '<rect x="55" y="296" width="390" height="80" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="250" y="324" text-anchor="middle" class="lbl-strong">前端扩展系统</text><text x="250" y="347" text-anchor="middle" class="lbl">自定义节点可在 web 目录注入 JS：注册控件、右键菜单、面板</text><text x="250" y="365" text-anchor="middle" class="lbl-small">app.registerExtension({...})</text>'
  + '<rect x="55" y="396" width="390" height="80" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="250" y="424" text-anchor="middle" class="lbl-strong">WebSocket 客户端</text><text x="250" y="447" text-anchor="middle" class="lbl">实时接收进度、预览图、执行状态消息</text><text x="250" y="465" text-anchor="middle" class="lbl-small">/ws · binary 预览帧 + JSON 状态消息</text>'
  + '<rect x="55" y="496" width="390" height="56" rx="9" fill="#221d33" stroke="#7c5cff" opacity="0.9"/><text x="250" y="523" text-anchor="middle" class="lbl-strong" style="fill:#c4b5fd">桌面版外壳 (Electron)</text><text x="250" y="541" text-anchor="middle" class="lbl-small">管理 Python 环境 / GPU 驱动 / 自动更新 (Comfy Desktop)</text>'

  /* 后端大框 */
  + '<rect x="690" y="30" width="440" height="540" rx="14" fill="#171a26" stroke="#4cc9f0" stroke-width="1.5"/>'
  + '<text x="910" y="62" text-anchor="middle" class="lbl-strong" style="font-size:16px">⚙️ 后端（Python / FastAPI 进程）</text>'
  + '<rect x="715" y="90" width="390" height="76" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="910" y="118" text-anchor="middle" class="lbl-strong">HTTP / WebSocket 服务 (main.py)</text><text x="910" y="141" text-anchor="middle" class="lbl">/prompt 提交任务 · /history 查询 · /view 取图 · /ws 推送</text><text x="910" y="159" text-anchor="middle" class="lbl-small">api_server / protocol.py</text>'
  + '<rect x="715" y="186" width="390" height="96" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="910" y="214" text-anchor="middle" class="lbl-strong">执行引擎 (execution.py + comfy_execution)</text><text x="910" y="238" text-anchor="middle" class="lbl">校验图 → 拓扑排序 → 逐节点求值 → 缓存复用</text><text x="910" y="257" text-anchor="middle" class="lbl">graph.py 图结构 · caching.py 结果缓存 · validation.py 校验</text><text x="910" y="274" text-anchor="middle" class="lbl-small">PromptQueue 任务队列（支持排队多条）</text>'
  + '<rect x="715" y="302" width="390" height="76" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="910" y="330" text-anchor="middle" class="lbl-strong">节点注册表 (nodes.py)</text><text x="910" y="353" text-anchor="middle" class="lbl">NODE_CLASS_MAPPINGS：名字 → 节点类的全局字典</text><text x="910" y="371" text-anchor="middle" class="lbl-small">启动时扫描 custom_nodes/ 逐个导入合并</text>'
  + '<rect x="715" y="398" width="390" height="76" rx="9" fill="#1e2233" stroke="#3a4157"/><text x="910" y="426" text-anchor="middle" class="lbl-strong">模型与显存管理 (comfy/model_management.py)</text><text x="910" y="449" text-anchor="middle" class="lbl">探测 VRAM / RAM，决定模型加载、卸载、低显存策略</text><text x="910" y="467" text-anchor="middle" class="lbl-small">sd.py · samplers.py · latent_formats.py 等</text>'
  + '<rect x="715" y="494" width="390" height="56" rx="9" fill="#1a2433" stroke="#4cc9f0" opacity="0.9"/><text x="910" y="521" text-anchor="middle" class="lbl-strong" style="fill:#7dd3fc">diffusion 后端 (torch)</text><text x="910" y="539" text-anchor="middle" class="lbl-small">统一定义了 SD/SDXL/Flux/Wan 等上百种模型的推理实现</text>'

  /* 中间连线 */
  + '<path class="arrow-line" marker-end="url(#ar)" d="M 470 130 C 560 130, 600 110, 715 112"/>'
  + '<text x="592" y="102" text-anchor="middle" class="lbl-small" style="fill:#4cc9f0">POST /prompt (workflow json)</text>'
  + '<path class="arrow-line purple dashed" marker-end="url(#arp)" d="M 715 435 C 600 435, 560 437, 470 437"/>'
  + '<text x="592" y="418" text-anchor="middle" class="lbl-small" style="fill:#a78bfa">WebSocket: progress / executing / executed</text>'
  + '<path class="arrow-line dashed" marker-end="url(#ar)" d="M 470 437 C 520 470, 640 500, 715 505" opacity="0.6"/>'
  + '<text x="592" y="488" text-anchor="middle" class="lbl-small">GET /view (取结果图)</text>'
  + "</svg>";

  /* ---------------- SVG 图 2：一次执行的完整生命周期 ---------------- */
  var SVG_LIFE =
  '<svg class="arch-svg" viewBox="0 0 1160 560" xmlns="http://www.w3.org/2000/svg">'
  + '<defs><marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#4cc9f0"/></marker></defs>'
  + '<rect x="20" y="200" width="180" height="120" rx="10" fill="#221d33" stroke="#7c5cff"/><text x="110" y="235" text-anchor="middle" class="lbl-strong">🖱️ 用户点 Queue</text><text x="110" y="260" text-anchor="middle" class="lbl">前端把画布序列化为</text><text x="110" y="280" text-anchor="middle" class="lbl">prompt JSON 提交</text>'
  + '<rect x="260" y="200" width="190" height="120" rx="10" fill="#1e2233" stroke="#3a4157"/><text x="355" y="228" text-anchor="middle" class="lbl-strong">服务端校验</text><text x="355" y="252" text-anchor="middle" class="lbl">validation.py：检查每个节点</text><text x="355" y="272" text-anchor="middle" class="lbl">的输入类型/必填项/文件存在</text><text x="355" y="292" text-anchor="middle" class="lbl-small">不合法直接返回错误</text>'
  + '<rect x="510" y="200" width="180" height="120" rx="10" fill="#1e2233" stroke="#3a4157"/><text x="600" y="228" text-anchor="middle" class="lbl-strong">入队排队</text><text x="600" y="252" text-anchor="middle" class="lbl">PromptQueue 先进先出，</text><text x="600" y="272" text-anchor="middle" class="lbl">可以一次排多条任务</text><text x="600" y="292" text-anchor="middle" class="lbl-small">执行线程循环取任务</text>'
  + '<rect x="750" y="200" width="190" height="120" rx="10" fill="#1e2233" stroke="#3a4157"/><text x="845" y="228" text-anchor="middle" class="lbl-strong">缓存判定</text><text x="845" y="252" text-anchor="middle" class="lbl">自上而下找到第一个</text><text x="845" y="272" text-anchor="middle" class="lbl">输出变化的节点，</text><text x="845" y="292" text-anchor="middle" class="lbl-small">它之后的才需要重算</text>'
  + '<rect x="990" y="200" width="150" height="120" rx="10" fill="#1a2433" stroke="#4cc9f0"/><text x="1065" y="228" text-anchor="middle" class="lbl-strong">🚀 执行</text><text x="1065" y="252" text-anchor="middle" class="lbl">拓扑顺序逐节点</text><text x="1065" y="272" text-anchor="middle" class="lbl">调用 + WebSocket</text><text x="1065" y="292" text-anchor="middle" class="lbl">推送进度</text>'
  + '<path class="arrow-line" marker-end="url(#ar2)" d="M200 260 L260 260"/><path class="arrow-line" marker-end="url(#ar2)" d="M450 260 L510 260"/><path class="arrow-line" marker-end="url(#ar2)" d="M690 260 L750 260"/><path class="arrow-line" marker-end="url(#ar2)" d="M940 260 L990 260"/>'
  /* 执行展开区 */
  + '<rect x="240" y="20" width="900" height="140" rx="10" fill="#131720" stroke="#262b38"/>'
  + '<text x="690" y="46" text-anchor="middle" class="lbl-strong" style="font-size:15px">🚀 执行阶段内部（摘自 execution.py 的主循环）</text>'
  + '<rect x="265" y="66" width="190" height="72" rx="8" fill="#1e2233" stroke="#3a4157"/><text x="360" y="96" text-anchor="middle" class="lbl-strong" style="font-size:12.5px">拓扑排序取下一个节点</text><text x="360" y="118" text-anchor="middle" class="lbl-small">所有上游都算完才轮到它</text>'
  + '<rect x="495" y="66" width="190" height="72" rx="8" fill="#1e2233" stroke="#3a4157"/><text x="590" y="96" text-anchor="middle" class="lbl-strong" style="font-size:12.5px">按名字查 NODE_CLASS_MAPPINGS</text><text x="590" y="118" text-anchor="middle" class="lbl-small">实例化 → 准备输入（含隐式转换）</text>'
  + '<rect x="725" y="66" width="190" height="72" rx="8" fill="#1e2233" stroke="#3a4157"/><text x="820" y="96" text-anchor="middle" class="lbl-strong" style="font-size:12.5px">调用节点 FUNCTION</text><text x="820" y="118" text-anchor="middle" class="lbl-small">如 KSampler.sample()，产出输出</text>'
  + '<rect x="955" y="66" width="160" height="72" rx="8" fill="#1a2433" stroke="#4cc9f0"/><text x="1035" y="96" text-anchor="middle" class="lbl-strong" style="font-size:12.5px">输出送缓存 + 下发</text><text x="1035" y="118" text-anchor="middle" class="lbl-small">OUTPUT_NODE 节点触发存图/推送</text>'
  + '<path class="arrow-line" marker-end="url(#ar2)" d="M455 102 L495 102"/><path class="arrow-line" marker-end="url(#ar2)" d="M685 102 L725 102"/><path class="arrow-line" marker-end="url(#ar2)" d="M915 102 L955 102"/>'
  /* 底部说明 */
  + '<rect x="20" y="380" width="1120" height="150" rx="10" fill="#131720" stroke="#262b38"/>'
  + '<text x="580" y="412" text-anchor="middle" class="lbl-strong" style="font-size:15px">🔁 循环直至没有可执行节点 —— 三个关键行为</text>'
  + '<text x="200" y="452" text-anchor="middle" class="lbl-strong" style="font-size:13px">1. 增量执行</text><text x="200" y="474" text-anchor="middle" class="lbl">只重算受参数变化影响的部分</text><text x="200" y="494" text-anchor="middle" class="lbl">改提示词不会重新加载模型</text>'
  + '<text x="580" y="452" text-anchor="middle" class="lbl-strong" style="font-size:13px">2. 实时反馈</text><text x="580" y="474" text-anchor="middle" class="lbl">每个节点开始/结束时发 executing 消息</text><text x="580" y="494" text-anchor="middle" class="lbl">采样过程中持续推送预览图</text>'
  + '<text x="960" y="452" text-anchor="middle" class="lbl-strong" style="font-size:13px">3. 资源调度</text><text x="960" y="474" text-anchor="middle" class="lbl">model_management 在节点间隙</text><text x="960" y="494" text-anchor="middle" class="lbl">加载/换出模型，防止显存溢出</text>'
  + "</svg>";

  /* ---------------- SVG 图 3：自定义节点加载流程 ---------------- */
  var SVG_EXT =
  '<svg class="arch-svg" viewBox="0 0 1160 320" xmlns="http://www.w3.org/2000/svg">'
  + '<defs><marker id="ar3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#a78bfa"/></marker></defs>'
  + '<rect x="30" y="110" width="200" height="100" rx="10" fill="#1e2233" stroke="#3a4157"/><text x="130" y="145" text-anchor="middle" class="lbl-strong">启动</text><text x="130" y="170" text-anchor="middle" class="lbl">main.py 初始化服务</text><text x="130" y="190" text-anchor="middle" class="lbl-small">加载官方 nodes.py</text>'
  + '<rect x="280" y="110" width="210" height="100" rx="10" fill="#1e2233" stroke="#3a4157"/><text x="385" y="140" text-anchor="middle" class="lbl-strong">扫描 custom_nodes/</text><text x="385" y="164" text-anchor="middle" class="lbl">每个子文件夹当作一个</text><text x="385" y="184" text-anchor="middle" class="lbl-small">Python 包导入 __init__.py</text>'
  + '<rect x="540" y="110" width="210" height="100" rx="10" fill="#1e2233" stroke="#3a4157"/><text x="645" y="140" text-anchor="middle" class="lbl-strong">读取导出字典</text><text x="645" y="164" text-anchor="middle" class="lbl">NODE_CLASS_MAPPINGS</text><text x="645" y="184" text-anchor="middle" class="lbl-small">WEB_DIRECTORY 前端文件(可选)</text>'
  + '<rect x="800" y="110" width="330" height="100" rx="10" fill="#1a2433" stroke="#4cc9f0"/><text x="965" y="140" text-anchor="middle" class="lbl-strong">合并进全局注册表</text><text x="965" y="164" text-anchor="middle" class="lbl">从此你的节点与官方节点完全平级：</text><text x="965" y="184" text-anchor="middle" class="lbl-small">前端能搜到、能连线、能被任何工作流引用</text>'
  + '<path class="arrow-line purple" marker-end="url(#ar3)" d="M230 160 L280 160"/><path class="arrow-line purple" marker-end="url(#ar3)" d="M490 160 L540 160"/><path class="arrow-line purple" marker-end="url(#ar3)" d="M750 160 L800 160"/>'
  + '<text x="580" y="60" text-anchor="middle" class="lbl-strong" style="font-size:15px">🧩 自定义节点是如何「长」进 ComfyUI 的</text>'
  + '<text x="580" y="280" text-anchor="middle" class="lbl">这就是 ComfyUI 生态爆发的机制：不改框架一行代码，任何人都以相同接口扩展它 —— 官方节点和第三方节点在引擎眼里毫无区别。</text>'
  + "</svg>";

  /* ---------------- 发展时间线 ---------------- */
  var TIMELINE = [
    ["2023.01", "项目开源", "comfyanonymous 在 GitHub 发布 ComfyUI，以节点图方式跑 Stable Diffusion，凭借显存效率与灵活性在社区迅速走红。"],
    ["2023 下半年", "生态成型", "ControlNet / LoRA / 动画等需求催生第三方节点包爆发；ComfyUI-Manager 出现，解决包管理难题；节点式范式被社区广泛接受。"],
    ["2024", "多模态扩张", "SD3、Flux 等新架构几乎首发适配；AnimateDiff、视频工作流成熟；API 与模板生态（comfyworkflows 等）繁荣。"],
    ["2024 末 - 2025", "官方化与桌面化", "新前端（v1）与 Comfy Desktop 桌面版发布，内置模板库与模型管理；成立 Comfy Org 统一维护；工作流 JSON 成为事实上的「AIGC 作品格式」。"],
    ["2025 - 2026", "视频时代", "Wan 2.x、HunyuanVideo 等开源视频模型以 ComfyUI 为主要落地方向；节点系统支持长上下文窗口、V2 工作流格式；API 节点接入官方云服务。"]
  ];

  /* ---------------- 对比表 ---------------- */
  var COMPARE = [
    ["组织生成过程的方式", "节点图（数据流显式化）", "表单/参数面板（流程固定）"],
    ["流程自由度", "任意组合、可插入任意环节", "限于软件预设的管线"],
    ["可复现性", "工作流 JSON 完整记录全部参数", "依赖截图或手抄参数"],
    ["显存效率", "按需加载卸载，低配可跑大图", "整体常驻，占用更高"],
    ["上手难度", "较高（要理解节点）", "低（填表即用）"],
    ["适合人群", "进阶玩家、研究者、做产品的人", "只想快速出图的普通用户"]
  ];

  /* ---------------- 接管路线 ---------------- */
  var PATHS = [
    {
      level: "路线 A · 推荐",
      color: "#4ade80",
      title: "HTTP API / WebSocket 驱动",
      body: "把 ComfyUI 当一个「生成服务」：程序通过 POST /prompt 提交工作流 JSON，监听 /ws 收进度与结果。不用改 ComfyUI 任何代码，升级无负担，是做产品、批处理、自动化最标准的方式。",
      extra: "ComfyUI 自带 API 节点与 OpenAPI 规范（openapi.yaml），还能直接挂到 n8n / Dify 之类的自动化平台。"
    },
    {
      level: "路线 B · 进阶",
      color: "#fbbf24",
      title: "扩展前端 + 自定义节点",
      body: "通过 custom_nodes 的 web 目录注入 JS，可以加面板、改右键菜单、自定义控件；Python 侧可注册新的输入输出类型与执行逻辑。这适合「增强 ComfyUI」而不是取代它。",
      extra: "绝大多数知名节点包（rgthree、Manager、VHS）同时用了这两层扩展能力。"
    },
    {
      level: "路线 C · 高难度",
      color: "#f87171",
      title: "深度魔改 / 内嵌运行",
      body: "把 ComfyUI 当 Python 库嵌入自己的进程（import execution 直接驱动），或者 fork 源码魔改执行引擎、替换前端。可行，但要跟着上游更新不断维护，成本高。",
      extra: "除非有特殊需求（如嵌入式设备、深度定制产品），否则建议用路线 A 实现同样目标。"
    }
  ];

  /* ---------------- FAQ ---------------- */
  var FAQ = [
    ["节点连错线了为什么提交时会报错而不是运行时崩溃？",
     "因为提交时后端会先跑一遍静态校验（validation.py）：检查每个输入的类型是否匹配、必填项是否缺失、模型文件是否存在。校验不通过整个任务会被拒绝，所以正常情况下你看到的是「红色的提交错误提示」，而不是执行到一半崩溃。"],
    ["为什么改动一小个参数，整个工作流好像重新跑了？",
     "其实没有。执行引擎逐层对比缓存：只有「从被改动的节点往下」的部分会重算。如果只改了提示词，模型加载节点会命中缓存瞬间完成，你感觉到的耗时几乎全是采样。若整个图都重跑了，多半是种子或上游参数确实变了。"],
    ["显存不够是怎么办到的「能跑」？",
     "model_management.py 会探测显卡显存与系统内存，决定模型以什么精度加载（fp16/fp8）、是否部分驻留 CPU 内存、在哪些节点之间换入换出。所以低显存机器跑 Flux 这类大模型会明显变慢，但通常不会直接失败。"],
    ["工作流 JSON 里为什么有两套格式（workflow 与 prompt）？",
     "画布导出的 workflow.json 是给前端恢复布局用的（含坐标、折叠状态）；而提交执行的 prompt 格式只保留「节点名 + 输入 + 连线」的纯逻辑。API 驱动时用后者即可，两者可以在开发菜单里互相导出。"],
    ["我能在一个脚本里不启动网页版直接执行工作流吗？",
     "可以走两条路：最简单是启动后端后用 HTTP API 提交；进阶做法是把 ComfyUI 作为库 import（社区有 comfycli 等封装）。但「无服务进程的纯库调用」不是官方支持的重点，遇到问题基本要自己读源码解决。"]
  ];

  var CODE_MIN_NODE =
"import torch\n"
+"\n"
+"\n"
+"class ImageTintNode:\n"
+"    \"\"\"把图像整体染上一种颜色 —— 一个最小可用的自定义节点\"\"\"\n"
+"\n"
+"    @classmethod\n"
+"    def INPUT_TYPES(cls):\n"
+"        return {\n"
+"            \"required\": {\n"
+"                \"image\": (\"IMAGE\",),              # 输入：图像张量 [B,H,W,C]\n"
+"                \"strength\": (\"FLOAT\", {           # 输入：可拖动的浮点参数\n"
+"                    \"default\": 0.5, \"min\": 0.0, \"max\": 1.0, \"step\": 0.05,\n"
+"                }),\n"
+"                \"color\": (\"COMBO\", {\"options\": [\"red\", \"blue\"]}),\n"
+"            }\n"
+"        }\n"
+"\n"
+"    RETURN_TYPES = (\"IMAGE\",)        # 输出类型声明\n"
+"    FUNCTION = \"tint\"                # 真正执行的函数名\n"
+"    CATEGORY = \"image/postprocessing\"  # 在右键菜单里的分组路径\n"
+"\n"
+"    def tint(self, image, strength, color):\n"
+"        base = torch.tensor([1.0, 0.0, 0.0]) if color == \"red\" else torch.tensor([0.0, 0.0, 1.0])\n"
+"        out = image * (1 - strength) + strength * base\n"
+"        return (out.clamp(0, 1),)      # 返回值是一个元组，对应 RETURN_TYPES\n"
+"\n"
+"\n"
+"NODE_CLASS_MAPPINGS = {          # 框架启动时会读取这个字典\n"
+"    \"ImageTint\": ImageTintNode,\n"
+"}\n"
+"NODE_DISPLAY_NAME_MAPPINGS = {   # 可选：界面上显示的名字\n"
+"    \"ImageTint\": \"染色 (示例节点)\",\n"
+"}";

  var CODE_API =
"import json, urllib.request, websocket, uuid\n"
+"\n"
+"SERVER = \"127.0.0.1:8188\"\n"
+"client_id = str(uuid.uuid4())\n"
+"\n"
+"# 1. 读取工作流（在网页版里：设置 -> 导出 (API) 得到的 JSON）\n"
+"with open(\"my_workflow_api.json\", \"r\", encoding=\"utf-8\") as f:\n"
+"    workflow = json.load(f)\n"
+"\n"
+"# 2. 动态改参数：把第一个 KSampler 的种子换成随机值\n"
+"for node in workflow.values():\n"
+"    if node[\"class_type\"] == \"KSampler\":\n"
+"        node[\"inputs\"][\"seed\"] = 12345\n"
+"\n"
+"# 3. 提交任务\n"
+"data = json.dumps({\"prompt\": workflow, \"client_id\": client_id}).encode(\"utf-8\")\n"
+"resp = json.loads(urllib.request.urlopen(\n"
+"    urllib.request.Request(\"http://\" + SERVER + \"/prompt\", data=data)).read())\n"
+"prompt_id = resp[\"prompt_id\"]\n"
+"\n"
+"# 4. 通过 WebSocket 等待执行完成\n"
+"ws = websocket.WebSocket()\n"
+"ws.connect(\"ws://\" + SERVER + \"/ws?clientId=\" + client_id)\n"
+"while True:\n"
+"    msg = ws.recv()\n"
+"    if isinstance(msg, str):\n"
+"        m = json.loads(msg)\n"
+"        if m.get(\"type\") == \"executing\" and m[\"data\"][\"node\"] is None:\n"
+"            break   # node 为 None 表示整条工作流执行完毕\n"
+"\n"
+"# 5. 从 /history 拿到输出图片的文件名，再 GET /view 下载\n"
+"hist = json.loads(urllib.request.urlopen(\n"
+"    \"http://\" + SERVER + \"/history/\" + prompt_id).read())[prompt_id]\n"
+"for img in hist[\"outputs\"][list(hist[\"outputs\"])[0]][\"images\"]:\n"
+"    print(\"结果图:\", \"http://\" + SERVER + \"/view?\" + urllib.parse.urlencode({\n"
+"        \"filename\": img[\"filename\"], \"subfolder\": img[\"subfolder\"], \"type\": img[\"type\"]}))";

  var TREE =
"ComfyUI/\n"
+"├── main.py                  # 启动入口：解析参数、建 FastAPI 服务\n"
+"├── execution.py             # 执行引擎：校验、排序、逐节点求值\n"
+"├── nodes.py                 # 官方节点 + 全局注册表 NODE_CLASS_MAPPINGS\n"
+"├── folder_paths.py          # 模型/输入/输出目录的统一管理\n"
+"├── comfy/                   # 核心库：模型定义与采样\n"
+"│   ├── model_management.py  #   显存/内存调度大脑\n"
+"│   ├── samplers.py          #   采样器实现（euler/dpm…）\n"
+"│   ├── sd.py                #   Stable Diffusion 模型封装\n"
+"│   └── controlnet.py 等     #   ControlNet / LoRA / CLIP 视觉…\n"
+"├── comfy_execution/         # 图执行子系统\n"
+"│   ├── graph.py  caching.py  validation.py\n"
+"├── comfy_extras/            # 官方进阶节点（按功能拆文件）\n"
+"│   ├── nodes_custom_sampler.py  nodes_flux.py  nodes_wan.py …\n"
+"├── api_server/              # 官方 API 节点与服务\n"
+"├── custom_nodes/            # ← 你的第三方节点包放这里\n"
+"│   └── ComfyUI-GGUF/\n"
+"├── models/                  # 模型文件（checkpoints/loras/vae…）\n"
+"├── input/  output/  user/   # 输入图 / 输出图 / 用户配置\n"
+"└── web/                     # 前端静态资源（新版前端已独立成包）";

  /* ---------------- 页面渲染 ---------------- */
  function tocAnchor(id, text, cls) { return '<a class="' + (cls || "h2") + '" href="#/' + id + '" onclick="event.preventDefault();document.getElementById(\'' + id + '\').scrollIntoView({behavior:\'smooth\'})">' + esc(text) + "</a>"; }

  function render() {
    var h = "";
    h += '<div class="container">';
    h += '<aside class="arch-toc"><div class="toc-title">本页目录</div>'
      + tocAnchor("a-what", "ComfyUI 是什么")
      + tocAnchor("a-timeline", "发展时间线")
      + tocAnchor("a-arch", "整体架构：前后端分离")
      + tocAnchor("a-life", "一次执行的生命周期")
      + tocAnchor("a-engine", "执行引擎三大机制")
      + tocAnchor("a-tree", "源码目录导读")
      + tocAnchor("a-node-sys", "节点系统解剖")
      + tocAnchor("a-dev", "开发自己的节点")
      + tocAnchor("a-takeover", "接管 ComfyUI 可行吗")
      + tocAnchor("a-faq", "常见问题")
      + "</aside>";

    h += '<div class="prose" style="overflow:hidden">';
    h += '<div class="sec-head"><h2>第一部分 · ComfyUI 架构解析</h2><span class="sec-en">ARCHITECTURE</span></div>'
      + '<p class="sec-desc">这一部分回答三个问题：ComfyUI 的整体框架是什么、它是怎么运转起来的、以及你想开发自己的组件或接管它时应该走哪条路。内容基于 ComfyUI v0.34.2 的真实源码结构整理。</p>';

    /* 1. 是什么 */
    h += '<h2 id="a-what">ComfyUI 是什么</h2>'
      + '<p>ComfyUI 是一个<b>以「节点图」组织生成流程</b>的 Stable Diffusion 及多模态模型运行引擎。它把「加载模型 → 编码提示词 → 采样 → 解码 → 保存」拆成一个个节点，你用连线把它们组成一张有向无环图（DAG，Directed Acyclic Graph，即数据只朝一个方向流动、不构成环路的图）。点击 Queue 后，引擎按依赖顺序执行整张图。</p>'
      + '<p>它与 WebUI 类工具（如 A1111）的核心区别不在功能多少，而在<b>范式</b>：表单工具把流程写死、你只能填参数；节点工具把每个环节暴露成积木，你可以自由重组流程 —— 这正是复杂玩法（多 ControlNet 叠加、视频生成、区域控制）只在 ComfyUI 上先出现的原因。</p>'
      + '<div class="arch-figure"><table class="data-table"><tr><th>维度</th><th>ComfyUI（节点图）</th><th>表单式 WebUI</th></tr>';
    COMPARE.forEach(function (r) {
      h += "<tr><td style=\"color:var(--text)\">" + esc(r[0]) + "</td><td style=\"color:var(--muted)\">" + esc(r[1]) + "</td><td style=\"color:var(--muted)\">" + esc(r[2]) + "</td></tr>";
    });
    h += "</table><div class=\"figcap\">表 1 · ComfyUI 与表单式工具的范式对比</div></div>";

    /* 2. 时间线 */
    h += '<h2 id="a-timeline">发展时间线</h2><div class="timeline">';
    TIMELINE.forEach(function (t) {
      h += '<div class="tl-item"><div class="tl-date">' + esc(t[0]) + "</div><h4>" + esc(t[1]) + "</h4><p>" + esc(t[2]) + "</p></div>";
    });
    h += "</div>";

    /* 3. 整体架构 */
    h += '<h2 id="a-arch">整体架构：前后端分离的图执行器</h2>'
      + '<p>ComfyUI 是标准的<b>前后端分离</b>结构：前端只负责「画图和收集参数」，后端负责「真正的校验与执行」。两者通过 HTTP + WebSocket 通信。这个设计带来一个重要能力：<b>前端可以整个换掉</b>（网页版、桌面版、第三方界面都只是不同的前端），后端执行引擎稳定不变。</p>'
      + '<div class="arch-figure">' + SVG_ARCH + '<div class="figcap">图 1 · ComfyUI 前后端整体架构（右列模块名即真实源码文件）</div></div>'
      + '<div class="callout info"><span class="co-ico">🧠</span><div><span class="co-title">关键认知</span>你在画布上看到的「连线」并不直接执行任何东西 —— 前端只是把图序列化成 JSON 提交给后端；真正读懂这张图、决定先算谁后算谁、缓存什么，全部发生在后端的执行引擎里。</div></div>';

    /* 4. 生命周期 */
    h += '<h2 id="a-life">一次执行的生命周期：从点击 Queue 到图片落盘</h2>'
      + '<p>把一次生成拆开看，一共五步：提交 → 校验 → 排队 → 缓存判定 → 执行。理解这条链路，你就理解了 ComfyUI 的全部行为逻辑（为什么连错线立刻报错、为什么改提示词不用重新加载模型）。</p>'
      + '<div class="arch-figure">' + SVG_LIFE + '<div class="figcap">图 2 · 一次执行的完整生命周期</div></div>';

    /* 5. 引擎机制 */
    h += '<h2 id="a-engine">执行引擎三大机制</h2>'
      + '<h3>① 增量缓存执行</h3><p>引擎执行前会沿图自上而下比较每个节点的「输入指纹」：如果某节点的所有输入与上次完全一致，直接复用上次结果。于是<b>只有被改动节点影响到的下游才会重算</b>。反复调提示词时省掉模型加载、VAE 编码等所有上游开销，这是 ComfyUI 迭代效率高的根本原因。</p>'
      + '<h3>② 拓扑排序与数据驱动</h3><p>节点执行顺序不由画布位置决定，而是由<b>数据依赖</b>决定（拓扑序）：一个节点必须等它所有上游都产出数据才能执行。图本质上是声明式的 —— 你描述「什么数据从哪来到哪去」，引擎自己安排顺序。这也解释了为什么循环依赖会被拒绝。</p>'
      + '<h3>③ 显存调度</h3><p>comfy/model_management.py 是看不见的管家：它探测显存容量与带宽，决定模型加载精度（fp16 / fp8）、常驻还是用完即卸、多个模型谁给谁让路。低显存机器能跑大模型、队列连跑不炸，靠的都是它。</p>'
      + '<div class="callout warn"><span class="co-ico">⚡</span><div><span class="co-title">由此推导的实用经验</span>把「不变的东西」（模型加载、固定编码）放在图的左侧并保持参数不动，让缓存最大化命中；把「常改的东西」（提示词、种子）放在靠下游的位置 —— 工作流布局习惯直接影响迭代速度。</div></div>';

    /* 6. 目录树 */
    h += '<h2 id="a-tree">源码目录导读</h2>'
      + '<p>下面是 ComfyUI v0.34.2 的核心目录结构（与本机安装一致）。读源码时按这张地图走：</p>'
      + '<pre><code>' + esc(TREE) + "</code></pre>";

    /* 7. 节点系统解剖 */
    h += '<h2 id="a-node-sys">节点系统解剖：一个节点的全部定义</h2>'
      + '<p>ComfyUI 里「节点」就是一个遵循极简协议的 Python 类。引擎靠四个约定认识它：</p>'
      + '<table class="data-table"><tr><th>约定</th><th>作用</th><th>一句话理解</th></tr>'
      + '<tr><td class="mono" style="color:#c4b5fd">INPUT_TYPES()</td><td style="color:var(--muted)">声明输入：连接输入、控件（COMBO/INT/FLOAT/STRING…）及其默认值范围</td><td style="color:var(--muted)">「我需要什么」</td></tr>'
      + '<tr><td class="mono" style="color:#c4b5fd">RETURN_TYPES</td><td style="color:var(--muted)">声明输出类型元组</td><td style="color:var(--muted)">「我产出什么」</td></tr>'
      + '<tr><td class="mono" style="color:#c4b5fd">FUNCTION</td><td style="color:var(--muted)">真正执行的函数名（引擎按名调用）</td><td style="color:var(--muted)">「我干活的方法」</td></tr>'
      + '<tr><td class="mono" style="color:#c4b5fd">CATEGORY</td><td style="color:var(--muted)">右键菜单 / 搜索里的分组路径</td><td style="color:var(--muted)">「我在菜单哪里」</td></tr></table>'
      + '<p style="margin-top:14px">类型的意义远不止显示：<b>连线合法性完全由类型匹配决定</b>（MODEL 接 MODEL、IMAGE 接 IMAGE），这使整张图在提交前就能被静态检查。下面是一个完整可用的最小自定义节点：</p>'
      + '<div class="code-head"><span>custom_nodes/my-nodes/__init__.py</span><span>最小自定义节点</span></div><pre><code>' + esc(CODE_MIN_NODE) + "</code></pre>";

    /* 8. 开发自己的节点 */
    h += '<h2 id="a-dev">开发自己的组件：完整流程</h2>'
      + '<div class="flow-steps">'
      + '<div class="flow-step"><div class="fs-num">1</div><div><h4>建文件夹</h4><p>在 custom_nodes/ 下新建目录（如 my-nodes），ComfyUI 重启时会自动导入其中的 __init__.py。你本机的路径是 AppData/Local/Comfy-Desktop/ComfyUI-Installs/Test/ComfyUI/custom_nodes（桌面版）。</p></div></div>'
      + '<div class="flow-step"><div class="fs-num">2</div><div><h4>实现节点类</h4><p>按上面四个约定写类，放进 NODE_CLASS_MAPPINGS 字典。类型可以自创（如 MY_STYLE）—— 自创类型只能与同名类型相连，天然形成「专用通道」。</p></div></div>'
      + '<div class="flow-step"><div class="fs-num">3</div><div><h4>（可选）加前端扩展</h4><p>在包里建 web/ 目录并声明 WEB_DIRECTORY = "./web"，目录里的 JS 会被前端自动加载。用 app.registerExtension() 可以自定义控件、右键菜单、甚至全新面板。</p></div></div>'
      + '<div class="flow-step"><div class="fs-num">4</div><div><h4>重启验证与调试</h4><p>重启后端后，在画布双击搜索节点名即可。调试用 print + 控制台日志；前端 JS 问题看浏览器 DevTools。打包发布就是把这个文件夹推到 GitHub —— ComfyUI-Manager 能直接从 Git 地址安装。</p></div></div>'
      + "</div>"
      + '<div class="arch-figure">' + SVG_EXT + '<div class="figcap">图 3 · 自定义节点的加载与合并过程</div></div>'
      + '<div class="callout tip"><span class="co-ico">🧪</span><div><span class="co-title">练手建议</span>从「封装你常用的一段连线」开始写第一个节点（比如「一键双层 CLIP 编码」），比直接读文档学得快。ComfyUI 自带的 example_node.py.example 是官方模板。</div></div>';

    /* 9. 接管 */
    h += '<h2 id="a-takeover">接管 ComfyUI，可不可行？</h2>'
      + '<p>完全可行，而且有三条成熟程度不同的路线。结论先行：<b>做产品、做自动化选路线 A；增强 ComfyUI 本身选路线 B；路线 C 仅在特殊需求下考虑。</b></p>'
      + '<div class="path-grid">';
    PATHS.forEach(function (p) {
      h += '<div class="path-card"><span class="pk-level" style="color:' + p.color + ';border:1px solid ' + p.color + '55;background:' + p.color + '14">' + esc(p.level) + "</span>"
        + "<h4>" + esc(p.title) + "</h4><p>" + esc(p.body) + "</p><p style=\"font-size:12.5px;color:var(--faint)\">" + esc(p.extra) + "</p></div>";
    });
    h += "</div>";
    h += '<h3>路线 A 实战：用脚本驱动 ComfyUI</h3>'
      + '<p>ComfyUI 的 API 是公开且稳定的：提交用 POST /prompt，进度用 /ws WebSocket，取结果用 /history + /view。下面是一个完整可跑的 Python 客户端：</p>'
      + '<div class="code-head"><span>comfy_client.py</span><span>API 驱动示例</span></div><pre><code>' + esc(CODE_API) + "</code></pre>"
      + '<div class="callout info"><span class="co-ico">📡</span><div><span class="co-title">关键消息一览</span>status（队列状态）· executing（某个节点开始/结束，node 为 null 表示整图完成）· progress（采样步数进度）· executed（节点输出元数据）· binary 预览帧（采样的实时预览图）。做监控面板或进度条，监听这几类消息就够了。</div></div>';

    /* 10. FAQ */
    h += '<h2 id="a-faq">常见问题</h2>';
    FAQ.forEach(function (f) {
      h += '<details class="faq-item"><summary>❓ ' + esc(f[0]) + '</summary><div class="faq-body"><p>' + esc(f[1]) + "</p></div></details>";
    });

    h += '<div class="callout" style="margin-top:30px"><span class="co-ico">➡️</span><div>架构部分到此结束。带着这些认知进入<a href="#/nodes">第二部分 · 节点包全解</a>——你会发现自己已经能看懂每个节点「为什么在那个位置」了。</div></div>';
    h += "</div></div>";
    return h;
  }

  function mount() {
    /* 平滑滚动已由锚点 onclick 处理 */
  }

  function search(q) {
    var texts = ["ComfyUI 是什么", "架构", "执行引擎", "生命周期", "缓存", "显存", "拓扑排序", "自定义节点", "开发", "API 接管", "NODE_CLASS_MAPPINGS", "LiteGraph", "前后端分离"];
    var out = [];
    texts.forEach(function (t) {
      if (t.toLowerCase().indexOf(q) >= 0)
        out.push({ type: "架构", title: t, sub: "第一部分 · 架构解析", href: "#/arch" });
    });
    return out.slice(0, 4);
  }

  window.PAGE_ARCH = { render: render, mount: mount, search: search };
})();
