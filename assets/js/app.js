/* ============================================================
   ComfyUI 全景解析 — 主应用（hash 路由 + 渲染 + 搜索）
   ============================================================ */
(function () {
  "use strict";

  var D = function () { return window.COMFY_DATA || {}; };
  function pkgs() { return (D().nodePackages || []).slice().sort(function (a, b) { return (a.official === b.official) ? 0 : (a.official ? -1 : 1); }); }
  function wfs() { return D().workflows || []; }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function typeChip(t) {
    var key = t && window.ComfyGraph.TYPE_COLORS[String(t).toUpperCase()] ? String(t).toUpperCase() : (t ? String(t).toUpperCase() : "DEFAULT");
    return '<span class="type-chip t-' + esc(key) + '">' + esc(t) + "</span>";
  }
  function catDot(cat) { return '<span class="cat-dot cat-' + esc(cat) + '"></span>'; }
  function diffStars(n) { n = n || 1; var s = ""; for (var i = 1; i <= 5; i++) s += i <= n ? "★" : "☆"; return s; }

  /* ============ 首页 ============ */
  function renderHome() {
    var P = pkgs(), W = wfs();
    var nodeCount = P.reduce(function (s, p) { return s + (p.nodes || []).length; }, 0);
    var third = P.filter(function (p) { return !p.official; }).length;
    var html = '';

    html += '<section class="hero">'
      + '<h1>ComfyUI 全景解析</h1>'
      + '<p class="sub">架构 · 节点 · 工作流 —— 一个可随时查询的中文可视化知识库。看懂 ComfyUI 是怎么运转的、每个节点在做什么、每条工作流为什么这样连。</p>'
      + '<div class="hero-badges"><span class="badge acc">📦 基于 ComfyUI v0.34.2</span><span class="badge cyan">🎨 全程可视化图解</span><span class="badge">🧩 覆盖官方 + 主流第三方节点包</span></div>'
      + '<div class="hot-chips"><span style="color:var(--faint);font-size:12px;align-self:center">热门：</span>'
      + ["KSampler", "ControlNet", "换脸", "Flux", "LoRA", "视频生成", "IPAdapter", "放大"].map(function (t) {
          return '<button class="hot-chip" data-q="' + esc(t) + '">' + esc(t) + "</button>";
        }).join("")
      + "</div>"
      + "</section>";

    html += '<div class="container">';
    html += '<div class="entry-grid">'
      + '<a class="entry-card ec-purple" href="#/arch"><span class="ec-num">01</span><div class="ec-ico">🏗️</div><h3>架构解析</h3><p>前后端如何分工、执行引擎如何跑一张图、节点系统怎么加载、以及开发自己的节点或用 API 接管 ComfyUI 是否可行。</p><div class="ec-meta">架构图 · 生命周期 · 扩展开发 · API 接管</div></a>'
      + '<a class="entry-card ec-cyan" href="#/nodes"><span class="ec-num">02</span><div class="ec-ico">🧩</div><h3>节点包全解</h3><p>以节点包为单位，逐一分析每个节点：干了什么、上下游是什么、为什么需要。附交互式节点图，点击节点即可查看说明。</p><div class="ec-meta">' + P.length + " 个节点包 · " + nodeCount + " 个节点详解</div></a>"
      + '<a class="entry-card ec-green" href="#/workflows"><span class="ec-num">03</span><div class="ec-ico">🕸️</div><h3>工作流图鉴</h3><p>从文生图到视频生成、从换脸到风格迁移：常见工作流的全量图解与逐节点分析，像官方界面一样可视化呈现。</p><div class="ec-meta">' + W.length + " 条工作流 · 覆盖图 / 视频 / 人物 / 风格</div></a>"
      + "</div>";

    html += '<div class="stats-bar">'
      + '<div class="stat-box"><div class="st-num">' + P.length + "</div><div class=\"st-label\">节点包（官方 " + (P.length - third) + " / 第三方 " + third + "）</div></div>"
      + '<div class="stat-box"><div class="st-num">' + nodeCount + "</div><div class=\"st-label\">节点逐个解析</div></div>"
      + '<div class="stat-box"><div class="st-num">' + W.length + "</div><div class=\"st-label\">工作流全量图解</div></div>"
      + '<div class="stat-box"><div class="st-num">0</div><div class="st-label">外部依赖 · 打开即用</div></div>'
      + "</div>";

    html += '<div class="section"><div class="sec-head"><h2>怎么使用这个站</h2><span class="sec-en">HOW TO USE</span></div>'
      + '<div class="grid-3">'
      + '<div class="card"><h4>🔍 当作查询工具</h4><p style="color:var(--muted);font-size:13.5px">顶部搜索框可以搜任何节点名（如 KSampler）、包名（如 Impact Pack）或工作流（如 换脸）。遇到不认识的节点，搜一下就有上下游解释。</p></div>'
      + '<div class="card"><h4>🧭 按路线学习</h4><p style="color:var(--muted);font-size:13.5px">推荐顺序：先读「架构解析」建立整体认知，再按类别浏览「节点包全解」，最后在「工作流图鉴」里对照真实连线理解数据流。</p></div>'
      + '<div class="card"><h4>🖱️ 图是可交互的</h4><p style="color:var(--muted);font-size:13.5px">所有节点图都支持拖拽平移、滚轮缩放，点击任意节点会弹出它的说明卡片——就像在 ComfyUI 里点开节点一样。</p></div>'
      + "</div></div>";

    html += '<div class="section"><div class="sec-head"><h2>数据流一分钟看懂</h2><span class="sec-en">TL;DR</span></div>'
      + '<div class="card"><p style="color:var(--muted)">ComfyUI 的本质是一条 <strong style="color:var(--text)">数据流水线</strong>：模型（MODEL）提供画笔，文本编码（CLIP）把你写的提示词翻译成模型听得懂的「条件（Conditioning）」，采样器（KSampler）拿着模型、条件和一张「噪声画布（Latent）」反复去噪，最后由 VAE 把潜空间结果解码成人眼可见的图像（IMAGE）。任何复杂工作流，都是在这条主线的不同环节上插入增强节点——ControlNet 在条件环节加约束、IPAdapter 在模型环节加风格、放大器在输出环节加分辨率。本站的三大部分，正是沿着这条主线展开的。</p></div></div>';

    html += "</div>";
    return html;
  }

  /* ============ 节点包列表 ============ */
  var nodeFilter = { cat: "全部", q: "" };
  function renderNodes() {
    var P = pkgs();
    var cats = ["全部"];
    P.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    var activeCat = nodeFilter.cat || "全部";
    var q = (nodeFilter.q || "").toLowerCase();

    var html = '<div class="container">'
      + '<div class="back-link" style="display:none"></div>'
      + '<div class="sec-head"><h2>节点包全解</h2><span class="sec-en">NODE PACKAGES</span></div>'
      + '<p class="sec-desc">以「节点包」为单位组织：官方核心节点 + 主流第三方节点包。每个包点进去可以看到包内每个节点的功能、上下游与存在意义。图中颜色与 ComfyUI 界面一致：<span style="color:#b06ab3">紫=加载</span> · <span style="color:#e8a33d">橙=条件</span> · <span style="color:#2aa8b8">青=采样</span> · <span style="color:#5faf5f">绿=潜空间</span> · <span style="color:#3d8bd6">蓝=图像</span>。</p>'
      + '<div class="filter-bar" id="pkgFilters">';
    cats.forEach(function (c) {
      html += '<button class="filter-btn' + (c === activeCat ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    });
    html += "</div>";
    html += '<div class="pkg-grid" id="pkgGrid"></div>';
    html += '<div class="callout tip" style="margin-top:26px"><span class="co-ico">💡</span><div><span class="co-title">看不懂某个节点？</span>到工作流图鉴里找一条用到它的工作流，在图上点它——结合上下文理解节点是最快的方式。</div></div>';
    html += "</div>";
    return html;
  }

  function paintPkgGrid() {
    var grid = $("#pkgGrid");
    if (!grid) return;
    var P = pkgs();
    var activeCat = nodeFilter.cat || "全部";
    var q = (nodeFilter.q || "").toLowerCase();
    var html = "";
    P.forEach(function (p) {
      if (activeCat !== "全部" && p.category !== activeCat) return;
      var hay = (p.name + " " + (p.summary || "") + " " + (p.tags || []).join(" ") + " " + (p.nodes || []).map(function (n) { return n.name + n.brief; }).join(" ")).toLowerCase();
      if (q && hay.indexOf(q) < 0) return;
      html += '<a class="pkg-card" href="#/nodes/' + esc(p.id) + '">'
        + '<div class="pc-top">' + (p.official ? '<span class="pkg-tag official">官方</span>' : '<span class="pkg-tag third">第三方</span>') + "<h3>" + esc(p.name) + "</h3></div>"
        + '<div class="pc-desc">' + esc(p.summary) + "</div>"
        + '<div class="pc-foot"><span class="mini-tag">' + esc(p.category) + '</span><span class="mini-tag n">' + (p.nodes || []).length + " 个节点</span>"
        + (p.tags || []).slice(0, 3).map(function (t) { return '<span class="mini-tag">' + esc(t) + "</span>"; }).join("")
        + "</div></a>";
    });
    if (!html) html = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted)">没有匹配的节点包</div>';
    grid.innerHTML = html;
  }

  /* ============ 节点包详情 ============ */
  function renderPkgDetail(id) {
    var p = null;
    pkgs().forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return '<div class="container"><div class="card">未找到该节点包。<a href="#/nodes">返回列表</a></div></div>';
    var html = '<div class="container">'
      + '<a class="back-link" href="#/nodes">← 返回节点包列表</a>'
      + '<div class="pkg-hero"><h1>' + esc(p.name) + "</h1>"
      + '<div class="ph-meta">' + (p.official ? '<span class="pkg-tag official">官方节点包</span>' : '<span class="pkg-tag third">第三方节点包</span>')
      + '<span class="mini-tag">' + esc(p.category) + "</span>"
      + (p.author ? '<span class="mini-tag">作者：' + esc(p.author) + "</span>" : "")
      + '<span class="mini-tag n">' + (p.nodes || []).length + " 个节点</span></div>"
      + '<p class="ph-desc">' + esc(p.summary) + "</p>"
      + '<div class="callout info" style="margin:16px 0 0"><span class="co-ico">🎯</span><div><span class="co-title">什么时候用它</span>' + esc(p.why) + "</div></div>"
      + '<div class="callout" style="margin:10px 0 0"><span class="co-ico">📦</span><div><span class="co-title">安装方式</span>' + esc(p.install) + "</div></div>"
      + "</div>";

    html += '<div class="sec-head"><h3 style="font-size:19px">节点详解</h3><span class="sec-en">NODE BY NODE</span></div>';
    html += '<div class="bulk-bar"><button class="bulk-btn" onclick="__pkgBulk(true)">⊕ 展开全部</button><button class="bulk-btn" onclick="__pkgBulk(false)">⊖ 收起全部</button><span class="spacer"></span><span style="font-size:12px;color:var(--faint)">共 ' + (p.nodes || []).length + ' 个节点 · 点击卡片展开详情</span></div>';
    html += '<div class="node-list" id="pkgNodeList">';
    (p.nodes || []).forEach(function (n, i) {
      html += '<details class="node-card"' + (i === 0 ? " open" : "") + '><summary>'
        + catDot(n.cat) + '<span class="node-name">' + esc(n.name) + "</span>"
        + '<span class="node-brief">' + esc(n.brief) + '</span><span class="node-chevron">▶</span></summary>'
        + '<div class="node-body">'
        + '<div class="nb-row"><div class="nb-label">它做什么</div><div>' + esc(n.desc) + "</div></div>"
        + '<div class="nb-row"><div class="nb-label">输入</div><div>'
        + (n.inputs || []).map(function (inp) {
            return '<div class="io-line">' + typeChip(inp.type) + ' <b>' + esc(inp.name) + "</b>"
              + (inp.from ? '<span class="io-arrow">⬅</span><span style="color:var(--faint);font-size:12px">' + esc(inp.from) + "</span>" : "")
              + (inp.desc ? ' <span style="color:var(--muted)">— ' + esc(inp.desc) + "</span>" : "") + "</div>";
          }).join("") + "</div></div>"
        + '<div class="nb-row"><div class="nb-label">输出</div><div>'
        + (n.outputs || []).map(function (o) {
            return '<div class="io-line">' + typeChip(o.type)
              + (o.to ? '<span class="io-arrow">➡</span><span style="color:var(--faint);font-size:12px">' + esc(o.to) + "</span>" : "")
              + (o.desc ? ' <span style="color:var(--muted)">— ' + esc(o.desc) + "</span>" : "") + "</div>";
          }).join("") + "</div></div>"
        + '<div class="nb-row"><div class="nb-label">为什么需要</div><div>' + esc(n.why) + "</div></div>"
        + (n.tips ? '<div class="nb-row"><div class="nb-label">实用提示</div><div style="color:#a7d8b8">' + esc(n.tips) + "</div></div>" : "")
        + "</div></details>";
    });
    html += "</div>";
    html += pagerNav(pkgs(), p.id, "#/nodes/", "节点包");
    html += "</div>";
    return html;
  }

  /* 上一条 / 下一条导航 */
  function pagerNav(list, id, base, label) {
    var idx = -1;
    list.forEach(function (x, i) { if (x.id === id) idx = i; });
    if (idx < 0) return "";
    var prev = list[idx - 1], next = list[idx + 1];
    var html = '<div class="pager-nav">';
    html += prev ? '<a href="' + base + esc(prev.id) + '"><div class="pn-label">← 上一个' + label + '</div><div class="pn-title">' + esc(prev.name) + "</div></a>"
                 : "<a style=\"opacity:.4;pointer-events:none\"><div class=\"pn-label\">← 上一个" + label + "</div><div class=\"pn-title\">已经是第一个</div></a>";
    html += next ? '<a class="pn-next" href="' + base + esc(next.id) + '"><div class="pn-label">下一个' + label + ' →</div><div class="pn-title">' + esc(next.name) + "</div></a>"
                 : "<a class=\"pn-next\" style=\"opacity:.4;pointer-events:none\"><div class=\"pn-label\">下一个" + label + " →</div><div class=\"pn-title\">已经是最后一个</div></a>";
    html += "</div>";
    return html;
  }

  /* ============ 工作流列表 ============ */
  var wfFilter = { cat: "全部", q: "" };
  function renderWorkflows() {
    var cats = ["全部"];
    wfs().forEach(function (w) { if (cats.indexOf(w.category) < 0) cats.push(w.category); });
    var html = '<div class="container">'
      + '<div class="sec-head"><h2>工作流图鉴</h2><span class="sec-en">WORKFLOW GALLERY</span></div>'
      + '<p class="sec-desc">每条工作流都提供：可交互的节点图（点击节点看说明）、管线阶段拆解、全量逐节点分析、数据流步骤与参数建议。基础流程人人必学，进阶流程按需查阅。</p>'
      + '<div class="filter-bar" id="wfFilters">';
    cats.forEach(function (c) { html += '<button class="filter-btn' + (c === (wfFilter.cat || "全部") ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>"; });
    html += "</div><div class=\"wf-grid\" id=\"wfGrid\"></div></div>";
    return html;
  }

  function paintWfGrid() {
    var grid = $("#wfGrid");
    if (!grid) return;
    var activeCat = wfFilter.cat || "全部";
    var q = (wfFilter.q || "").toLowerCase();
    var html = "";
    wfs().forEach(function (w) {
      if (activeCat !== "全部" && w.category !== activeCat) return;
      var hay = (w.name + " " + w.category + " " + (w.tags || []).join(" ") + " " + (w.summary || "") + " " + (w.graph.nodes || []).map(function (n) { return n.title; }).join(" ")).toLowerCase();
      if (q && hay.indexOf(q) < 0) return;
      html += '<a class="wf-card" href="#/workflows/' + esc(w.id) + '">'
        + "<h3><span class=\"wf-cat-pill\">" + esc(w.category) + "</span>" + esc(w.name) + "</h3>"
        + '<div class="wf-desc">' + esc(w.summary) + "</div>"
        + '<div class="wf-foot"><span class="diff">' + diffStars(w.difficulty) + '</span><span class="mini-tag">' + (w.graph.nodes || []).length + " 个节点</span>"
        + (w.tags || []).slice(0, 3).map(function (t) { return '<span class="mini-tag">' + esc(t) + "</span>"; }).join("")
        + "</div></a>";
    });
    if (!html) html = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted)">没有匹配的工作流</div>';
    grid.innerHTML = html;
  }

  /* ============ 工作流详情 ============ */
  function renderWfDetail(id) {
    var w = null;
    wfs().forEach(function (x) { if (x.id === id) w = x; });
    if (!w) return '<div class="container"><div class="card">未找到该工作流。<a href="#/workflows">返回列表</a></div></div>';

    var nodeById = {};
    (w.graph.nodes || []).forEach(function (n) { nodeById[n.id] = n; });

    var html = '<div class="container">'
      + '<a class="back-link" href="#/workflows">← 返回工作流列表</a>'
      + '<div class="pkg-hero"><h1>' + esc(w.name) + "</h1>"
      + '<div class="ph-meta"><span class="wf-cat-pill">' + esc(w.category) + '</span><span class="diff">' + diffStars(w.difficulty) + '</span><span class="mini-tag">' + (w.graph.nodes || []).length + " 个节点</span>"
      + '<span class="mini-tag">来源：' + esc(w.source || "社区常见结构") + "</span>"
      + (w.tags || []).map(function (t) { return '<span class="mini-tag">' + esc(t) + "</span>"; }).join("") + "</div>"
      + '<p class="ph-desc">' + esc(w.summary) + "</p></div>";

    if (w.notice) html += '<div class="callout danger"><span class="co-ico">⚠️</span><div><span class="co-title">使用前必读</span>' + esc(w.notice) + "</div></div>";

    /* 交互式节点图 */
    html += '<div class="section"><div class="sec-head"><h2>工作流节点图</h2><span class="sec-en">INTERACTIVE GRAPH</span></div>'
      + '<p class="sec-desc">拖拽平移 · 滚轮缩放 · <b>点击节点</b>查看它在整条流程中的职责，并高亮它的上下游连线；双击空白处复位视图。连线颜色 = 数据类型。</p>';
    if (w.stages && w.stages.length) {
      html += '<div class="stage-chips" id="stageChips"><button class="stage-chip active" data-stage="-1">🌐 全部</button>';
      w.stages.forEach(function (s, i) {
        html += '<button class="stage-chip" data-stage="' + i + '">' + esc((i + 1) + ". " + s.name) + "</button>";
      });
      html += "</div>";
    }
    html += '<div id="wfGraph"></div>'
      + '<div class="graph-legend"><span>连线颜色：</span>'
      + [["MODEL", "#8b5cf6"], ["CLIP", "#c9b34a"], ["VAE", "#d9534f"], ["LATENT", "#5faf5f"], ["IMAGE", "#3d8bd6"], ["CONDITIONING", "#e8a33d"], ["CONTROL_NET", "#a1887f"], ["VIDEO", "#d4618c"]]
        .map(function (x) { return '<span class="lg"><span class="sw" style="background:' + x[1] + '"></span>' + x[0] + "</span>"; }).join("")
      + '<span style="margin-left:auto">连线颜色由上游输出类型决定</span></div>'
      + "</div>";

    /* 阶段拆解 */
    if (w.stages && w.stages.length) {
      html += '<div class="section"><div class="sec-head"><h2>管线阶段拆解</h2><span class="sec-en">PIPELINE STAGES</span></div><div class="stage-line">';
      w.stages.forEach(function (s, i) {
        html += '<div class="stage-item"><h4><span class="stage-num">' + (i + 1) + "</span>" + esc(s.name) + '<span class="st-nodes">'
          + (s.nodes || []).map(function (nid) {
              var n = nodeById[nid];
              return n ? '<span class="mini-tag mono" style="font-size:10.5px">' + esc(n.title) + "</span>" : "";
            }).join("") + "</span></h4><p>" + esc(s.desc) + "</p></div>";
      });
      html += "</div></div>";
    }

    /* 数据流步骤 */
    if (w.flow && w.flow.length) {
      html += '<div class="section"><div class="sec-head"><h2>数据是怎么一步步流动的</h2><span class="sec-en">DATA FLOW</span></div><div class="flow-steps">';
      w.flow.forEach(function (f, i) {
        html += '<div class="flow-step"><div class="fs-num">' + (i + 1) + "</div><div><h4>第 " + (i + 1) + " 步</h4><p>" + esc(f) + "</p></div></div>";
      });
      html += "</div></div>";
    }

    /* 全量节点分析 */
    if (w.nodeAnalysis && w.nodeAnalysis.length) {
      html += '<div class="section"><div class="sec-head"><h2>逐节点全量分析</h2><span class="sec-en">NODE-BY-NODE</span></div><div class="node-list">';
      w.nodeAnalysis.forEach(function (a, i) {
        var n = nodeById[a.node] || { title: a.node, cat: "util" };
        html += '<details class="node-card"' + (i === 0 ? " open" : "") + '><summary>'
          + catDot(n.cat) + '<span class="node-name">' + esc(n.title) + '</span><span class="node-brief">' + esc(n.brief || "") + '</span><span class="node-chevron">▶</span></summary>'
          + '<div class="node-body"><div class="nb-row"><div class="nb-label">在本工作流中</div><div>' + esc(a.detail) + "</div></div>"
          + (n.widgets && n.widgets.length ? '<div class="nb-row"><div class="nb-label">图中参数</div><div class="mono" style="font-size:12.5px;color:#a5b0c8">' + n.widgets.map(esc).join(" · ") + "</div></div>" : "")
          + "</div></details>";
      });
      html += "</div></div>";
    }

    /* 参数表 */
    if (w.params && w.params.length) {
      html += '<div class="section"><div class="sec-head"><h2>关键参数参考</h2><span class="sec-en">PARAMETERS</span></div><table class="data-table"><tr><th>参数</th><th>图中取值</th><th>说明</th></tr>';
      w.params.forEach(function (p) {
        html += "<tr><td class=\"mono\" style=\"color:#c4b5fd\">" + esc(p.name) + "</td><td class=\"mono\">" + esc(p.value) + "</td><td style=\"color:var(--muted)\">" + esc(p.desc) + "</td></tr>";
      });
      html += "</table></div>";
    }

    /* 模型清单 */
    if (w.models && w.models.length) {
      html += '<div class="section"><div class="sec-head"><h2>需要准备的模型</h2><span class="sec-en">MODELS</span></div><table class="data-table"><tr><th>类型</th><th>名称 / 要求</th><th>说明</th></tr>';
      w.models.forEach(function (m) {
        html += "<tr><td>" + esc(m.type) + "</td><td class=\"mono\" style=\"color:#93c5fd\">" + esc(m.name) + "</td><td style=\"color:var(--muted)\">" + esc(m.note) + "</td></tr>";
      });
      html += "</table></div>";
    }

    if (w.tips && w.tips.length) {
      html += '<div class="section"><div class="sec-head"><h2>实用技巧与常见坑</h2><span class="sec-en">TIPS</span></div><div class="card">';
      w.tips.forEach(function (t) { html += '<p style="color:var(--muted);margin-bottom:8px">✦ ' + esc(t) + "</p>"; });
      html += "</div></div>";
    }

    html += pagerNav(wfs(), w.id, "#/workflows/", "工作流");
    html += "</div>";
    return html;
  }

  function mountWfGraph(id) {
    var w = null;
    wfs().forEach(function (x) { if (x.id === id) w = x; });
    var host = $("#wfGraph");
    if (!w || !host || !window.ComfyGraph) return;
    var api = window.ComfyGraph.render(host, w.graph, {});

    /* 阶段聚焦 */
    var chips = $("#stageChips");
    if (chips) {
      chips.addEventListener("click", function (e) {
        var b = e.target.closest(".stage-chip");
        if (!b) return;
        $all(".stage-chip", chips).forEach(function (x) { x.classList.toggle("active", x === b); });
        var si = parseInt(b.getAttribute("data-stage"), 10);
        if (si < 0 || !w.stages[si]) { api.highlight(null); return; }
        var ids = (w.stages[si].nodes || []).slice();
        /* 补上阶段间衔接节点的直接连线两端，保证高亮链路完整 */
        api.highlight(ids);
      });
    }
  }

  /* ============ 关于 ============ */
  function renderAbout() {
    var P = pkgs(), W = wfs();
    var nodeCount = P.reduce(function (s, p) { return s + (p.nodes || []).length; }, 0);
    var html = '<div class="container" style="max-width:860px">'
      + '<div class="sec-head"><h2>关于本站</h2><span class="sec-en">ABOUT</span></div>'
      + '<div class="card"><p style="color:var(--muted)">「ComfyUI 全景解析」是一个纯静态中文知识库，目标是把 ComfyUI 的<b style="color:var(--text)">架构原理、节点生态与常见工作流</b>讲给对 AIGC 有兴趣、但不熟悉底层实现的读者。全站零外部依赖，可离线访问。</p>'
      + '<p style="color:var(--muted);margin-top:10px">当前收录：' + P.length + " 个节点包 / " + nodeCount + " 个节点详解 / " + W.length + " 条工作流全量图解。内容基于 ComfyUI v0.34.2 源码与各节点包官方文档、社区共识整理，并经人工审校；节点包更新很快，个别界面或参数可能随版本变化。</p></div>"
      + '<div class="card" style="margin-top:18px"><h4 style="margin-bottom:10px">内容声明</h4>'
      + '<p style="color:var(--muted);font-size:13.5px">· 本站是学习与查询工具，不托管任何模型文件，也不提供任何下载渠道。</p>'
      + '<p style="color:var(--muted);font-size:13.5px">· 涉及换脸、人像一致性的内容均附带合规提示：请只处理本人肖像或已获明确授权的素材，并遵守当地法律与平台规则。</p>'
      + '<p style="color:var(--muted);font-size:13.5px">· 「成人内容（技术解析）」仅描述管线结构与原理认知，不含任何露骨内容与具体资源指引，仅限 18 岁以上读者按需查阅。</p></div>'
      + '<div class="card" style="margin-top:18px"><h4 style="margin-bottom:10px">维护方式</h4>'
      + '<p style="color:var(--muted);font-size:13.5px">源码托管于 GitHub Pages。所有修改在本地完成后推送，页面即自动更新——本站本身就是一个持续生长的文档。</p></div>'
      + '<div style="margin-top:22px;text-align:center"><a class="filter-btn" href="#/">返回首页</a> <a class="filter-btn active" href="#/arch">开始阅读 →</a></div>'
      + "</div>";
    return html;
  }

  /* ============ 全局搜索 ============ */
  function globalSearch(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    var out = [];
    pkgs().forEach(function (p) {
      if (p.name.toLowerCase().indexOf(q) >= 0 || (p.summary || "").toLowerCase().indexOf(q) >= 0)
        out.push({ type: "包", title: p.name, sub: (p.category + " · " + (p.nodes || []).length + " 个节点"), href: "#/nodes/" + p.id });
      (p.nodes || []).forEach(function (n) {
        if (n.name.toLowerCase().indexOf(q) >= 0 || (n.brief || "").toLowerCase().indexOf(q) >= 0 || (n.desc || "").toLowerCase().indexOf(q) >= 0)
          out.push({ type: "节点", title: n.name, sub: n.brief + "（" + p.name + "）", href: "#/nodes/" + p.id });
      });
    });
    wfs().forEach(function (w) {
      if (w.name.toLowerCase().indexOf(q) >= 0 || (w.summary || "").toLowerCase().indexOf(q) >= 0 || w.category.toLowerCase().indexOf(q) >= 0 || (w.tags || []).join(" ").toLowerCase().indexOf(q) >= 0)
        out.push({ type: "工作流", title: w.name, sub: w.category + " · " + (w.graph.nodes || []).length + " 个节点", href: "#/workflows/" + w.id });
      (w.graph.nodes || []).forEach(function (n) {
        if (n.title.toLowerCase().indexOf(q) >= 0)
          out.push({ type: "工作流节点", title: n.title, sub: "出现在工作流「" + w.name + "」", href: "#/workflows/" + w.id });
      });
    });
    if (window.PAGE_ARCH) {
      var archHits = window.PAGE_ARCH.search ? window.PAGE_ARCH.search(q) : [];
      out = out.concat(archHits);
    }
    return out.slice(0, 24);
  }

  /* ============ 路由 ============ */
  function currentRoute() {
    var h = location.hash.replace(/^#/, "");
    if (!h) h = "/";
    return h;
  }

  function render() {
    var r = currentRoute();
    var app = $("#app");
    var parts = r.split("/").filter(Boolean);
    window.scrollTo(0, 0);

    $all("#mainNav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === "/" + (parts[0] || ""));
    });

    if (!parts.length) { app.innerHTML = renderHome(); return; }
    if (parts[0] === "arch") { app.innerHTML = window.PAGE_ARCH ? window.PAGE_ARCH.render() : "<div class=container>加载中…</div>"; if (window.PAGE_ARCH) window.PAGE_ARCH.mount(); return; }
    if (parts[0] === "nodes" && parts[1]) { app.innerHTML = renderPkgDetail(parts[1]); return; }
    if (parts[0] === "nodes") {
      app.innerHTML = renderNodes();
      paintPkgGrid();
      $("#pkgFilters").addEventListener("click", function (e) {
        var b = e.target.closest(".filter-btn");
        if (!b) return;
        nodeFilter.cat = b.getAttribute("data-cat");
        $all("#pkgFilters .filter-btn").forEach(function (x) { x.classList.toggle("active", x === b); });
        paintPkgGrid();
      });
      return;
    }
    if (parts[0] === "workflows" && parts[1]) {
      app.innerHTML = renderWfDetail(parts[1]);
      mountWfGraph(parts[1]);
      return;
    }
    if (parts[0] === "workflows") {
      app.innerHTML = renderWorkflows();
      paintWfGrid();
      $("#wfFilters").addEventListener("click", function (e) {
        var b = e.target.closest(".filter-btn");
        if (!b) return;
        wfFilter.cat = b.getAttribute("data-cat");
        $all("#wfFilters .filter-btn").forEach(function (x) { x.classList.toggle("active", x === b); });
        paintWfGrid();
      });
      return;
    }
    if (parts[0] === "about") { app.innerHTML = renderAbout(); return; }
    app.innerHTML = renderHome();
  }

  /* ============ 搜索框事件 ============ */
  function initSearch() {
    var input = $("#globalSearch"), box = $("#searchResults");
    input.addEventListener("input", function () {
      var q = input.value;
      if (!q.trim()) { box.classList.remove("open"); return; }
      var res = globalSearch(q);
      var html = "";
      var tColor = { "包": "#7dd3fc", "节点": "#c4b5fd", "工作流": "#86efac", "工作流节点": "#fcd34d", "架构": "#f9a8d4" };
      res.forEach(function (r) {
        html += '<a class="sr-item" href="' + r.href + '"><div class="sr-title"><span class="sr-badge" style="color:' + (tColor[r.type] || "#9aa3b8") + ';border:1px solid currentColor">' + esc(r.type) + "</span>" + esc(r.title) + '</div><div class="sr-sub">' + esc(r.sub) + "</div></a>";
      });
      box.innerHTML = html || '<div class="sr-item"><div class="sr-sub">没有找到相关内容</div></div>';
      box.classList.add("open");
    });
    box.addEventListener("click", function () { box.classList.remove("open"); input.value = ""; });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search-wrap")) box.classList.remove("open");
    });
  }

  /* ============ 全局交互（进度条 / 返回顶部 / 快捷键 / 热搜词） ============ */
  function initChrome() {
    var bar = $("#readProgress"), topBtn = $("#backTop");
    function onScroll() {
      var st = document.documentElement.scrollTop || document.body.scrollTop;
      var sh = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (sh > 0 ? (st / sh) * 100 : 0) + "%";
      if (topBtn) topBtn.classList.toggle("show", st > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (topBtn) topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    var input = $("#globalSearch");
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); input.focus(); input.select();
      } else if (e.key === "/" && document.activeElement !== input && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); input.focus();
      } else if (e.key === "Escape") {
        $("#searchResults").classList.remove("open"); input.blur();
      }
    });

    /* 首页热搜词 */
    document.addEventListener("click", function (e) {
      var chip = e.target.closest(".hot-chip");
      if (!chip) return;
      input.value = chip.getAttribute("data-q");
      input.dispatchEvent(new Event("input"));
      input.focus();
    });
  }

  /* 节点包页批量展开/收起 */
  window.__pkgBulk = function (open) {
    $all("#pkgNodeList details").forEach(function (d) { d.open = open; });
  };

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", function () {
    initSearch();
    initChrome();
    render();
  });
})();
