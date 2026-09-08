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
  function wfFile(id) { return ((D().workflowFiles) || {})[id] || null; }

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
      + '<a class="entry-card ec-orange" href="#/civitai"><span class="ec-num">04</span><div class="ec-ico">🌐</div><h3>真实工作流库</h3><p>从 Civitai 抓取并解析的真实社区工作流：每条都标注节点构成、需要安装的社区节点包、引用的模型文件与画布分辨率，可按底模 / 节点包 / 类别筛选。</p><div class="ec-meta">' + (D().civitaiWorkflows || []).length + " 条真实工作流 · 持续抓取更新</div></a>"
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
    html += '<span class="spacer" style="flex:1"></span>'
      + '<input id="pkgQ" type="text" placeholder="在节点包内搜索…" value="' + esc(nodeFilter.q || "") + '" style="height:32px;background:var(--panel);border:1px solid var(--border);border-radius:9px;color:var(--text);padding:0 12px;font-size:13px;outline:none;width:200px;font-family:inherit">';
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
      var hasParams = (n.params && n.params.length) || (n.widgets && n.widgets.length);
      html += '<details class="node-card"' + (i === 0 ? " open" : "") + '><summary>'
        + catDot(n.cat) + '<span class="node-name">' + esc(n.name) + "</span>"
        + '<span class="node-brief">' + esc(n.brief) + '</span><span class="node-chevron">▶</span></summary>'
        + '<div class="node-body"><div class="np-split">'
        + '<div class="np-mock" data-mocknode="' + i + '"></div>'
        + '<div class="np-details">'

        + '<details class="np-sec" open><summary>🎯 节点作用</summary><div class="np-sec-body"><div class="np-prose">' + esc(n.desc)
        + (n.why ? '<div style="margin-top:8px"><b style="color:#dfe4f2">为什么需要：</b>' + esc(n.why) + "</div>" : "")
        + (n.tips ? '<div class="callout tip" style="margin:10px 0 0"><span class="co-ico">💡</span><div>' + esc(n.tips) + "</div></div>" : "")
        + "</div></div></details>"

        + ((n.inputs && n.inputs.length) ? '<details class="np-sec"' + (i === 0 ? " open" : "") + ' data-sec="input"><summary>⬅ 输入 <span class="sec-count">' + n.inputs.length + '</span><span class="node-chevron">▶</span></summary><div class="np-sec-body">'
          + n.inputs.map(function (inp, ii) {
              var zh = window.WIDGET_HELP ? window.WIDGET_HELP.typeZh(inp.type) : "";
              return '<details class="io-item" data-iosec="input" data-ioidx="' + ii + '"><summary>' + typeChip(inp.type)
                + '<span class="io-name">' + esc(inp.name) + "</span>" + (zh ? '<span class="io-zh">' + esc(zh) + "</span>" : "") + "</summary>"
                + '<div class="io-body">'
                + (inp.from ? '<div><span class="io-cap">典型上游</span>' + esc(inp.from) + "</div>" : "")
                + (inp.desc ? '<div style="margin-top:4px"><span class="io-cap">说明</span>' + esc(inp.desc) + "</div>" : "")
                + "</div></details>";
            }).join("")
          + "</div></details>" : "")

        + ((n.outputs && n.outputs.length) ? '<details class="np-sec" data-sec="output"><summary>➡ 输出 <span class="sec-count">' + n.outputs.length + '</span><span class="node-chevron">▶</span></summary><div class="np-sec-body">'
          + n.outputs.map(function (o, oi) {
              var zh = window.WIDGET_HELP ? window.WIDGET_HELP.typeZh(o.type || o.name) : "";
              return '<details class="io-item" data-iosec="output" data-ioidx="' + oi + '"><summary>' + typeChip(o.type || o.name)
                + (zh ? '<span class="io-zh">' + esc(zh) + "</span>" : "") + "</summary>"
                + '<div class="io-body">'
                + (o.to ? '<div><span class="io-cap">典型下游</span>' + esc(o.to) + "</div>" : "")
                + (o.desc ? '<div style="margin-top:4px"><span class="io-cap">说明</span>' + esc(o.desc) + "</div>" : "")
                + "</div></details>";
            }).join("")
          + "</div></details>" : "")

        + (hasParams ? '<details class="np-sec" data-sec="param"><summary>🎛 参数详解 <span class="sec-count">' + Math.max((n.params || []).length, (n.widgets || []).length) + '</span><span class="node-chevron">▶</span></summary><div class="np-sec-body" data-parambody="' + i + '"></div></details>' : "")

        + "</div></div></div></details>";
    });
    html += "</div>";
    html += pagerNav(pkgs(), p.id, "#/nodes/", "节点包");
    html += "</div>";
    return html;
  }

  /* 节点包页：渲染左侧真实结构 mock + 点击联动右侧详情 */
  function mountPkgMocks(pkgId) {
    var p = null;
    pkgs().forEach(function (x) { if (x.id === pkgId) p = x; });
    if (!p || !window.ComfyGraph) return;
    $all("[data-mocknode]").forEach(function (holder) {
      var i = parseInt(holder.getAttribute("data-mocknode"), 10);
      var n = (p.nodes || [])[i];
      if (!n) return;
      var node = { title: n.name, cat: n.cat, inputs: n.inputs, outputs: n.outputs, widgets: n.widgets || [], params: n.params };
      var G = window.ComfyGraph;
      /* 预填参数区 */
      var pb = holder.closest(".node-body").querySelector("[data-parambody]");
      if (pb && !pb.innerHTML) pb.innerHTML = G.paramRowsHtml(G.deriveParams(node));
      var wrap = document.createElement("div");
      holder.appendChild(wrap);
      G.renderNodeMock(wrap, node, {
        onSelect: function (kind, idx) {
          var card = holder.closest(".node-body");
          if (!card) return;
          var sec = card.querySelector('.np-sec[data-sec="' + kind + '"]');
          if (!sec && kind === "widget") sec = card.querySelector('.np-sec[data-sec="param"]');
          if (!sec) return;
          sec.open = true;
          var target = null;
          if (kind === "input" || kind === "output") {
            target = sec.querySelector('.io-item[data-ioidx="' + idx + '"]');
          } else if (kind === "widget") {
            target = sec.querySelectorAll(".param-row")[idx];
          }
          if (target) {
            if (target.tagName === "DETAILS") target.open = true;
            target.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } else {
            sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }
      });
    });
  }

  /* 上一条 / 下一条导航 */
  function pagerNav(list, id, base, label) {    var idx = -1;
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
        + (wfFile(w.id) ? '<span class="mini-tag" style="color:#7dd3fc">📄 真实文件</span>' : '<span class="mini-tag" style="color:var(--warn)">🧪 自制参考</span>')
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
      + (wfFile(w.id)
          ? '<a class="mini-tag" href="' + esc(wfFile(w.id).sourceUrl) + '" target="_blank" rel="noopener" style="color:#7dd3fc;border-color:rgba(76,201,240,.4)">📄 真实文件：' + esc(wfFile(w.id).sourceName) + " ↗</a>"
          : '<span class="mini-tag">🧪 来源：' + esc(w.source || "社区常见结构") + "（本站自制参考版）</span>")
      + (w.tags || []).map(function (t) { return '<span class="mini-tag">' + esc(t) + "</span>"; }).join("") + "</div>"
      + '<p class="ph-desc">' + esc(w.summary) + "</p></div>";

    if (w.notice) html += '<div class="callout danger"><span class="co-ico">⚠️</span><div><span class="co-title">使用前必读</span>' + esc(w.notice) + "</div></div>";

    /* 依赖清单（模型 / LoRA / 控制网等，前置展示） */
    var depBadge = { "Checkpoint": "#8b5cf6", "LoRA": "#4ade80", "ControlNet": "#a1887f", "VAE": "#d9534f", "UNET/Diffusion": "#7c5cff", "CLIP": "#c9b34a", "ClipVision": "#c9b34a", "Upscale": "#4cc9f0", "检测模型": "#c98a5c", "InstantID": "#f9a8d4", "人脸模型": "#f9a8d4", "超分": "#4cc9f0", "其他": "#647088" };
    if (w.models && w.models.length) {
      html += '<div class="section" style="margin-top:26px"><div class="sec-head"><h2 style="font-size:20px">依赖清单</h2><span class="sec-en">REQUIRED MODELS</span>'
        + '<span style="font-size:12px;color:var(--faint)">共 ' + w.models.length + " 项，放到 models 对应子目录后刷新</span></div>"
        + '<table class="data-table"><tr><th>类型</th><th>文件 / 要求</th><th>说明与获取指引</th></tr>';
      w.models.forEach(function (m) {
        var c = depBadge[m.type] || "#647088";
        html += "<tr><td><span style=\"font-size:11px;font-weight:600;padding:2px 10px;border-radius:99px;border:1px solid " + c + "55;background:" + c + "14;color:" + c + "\">" + esc(m.type) + "</span></td>"
          + '<td class="mono" style="color:#93c5fd">' + esc(m.name) + "</td>"
          + '<td style="color:var(--muted)">' + esc(m.note) + "</td></tr>";
      });
      html += "</table>"
        + '<div class="callout info" style="margin-top:12px"><span class="co-ico">📥</span><div><span class="co-title">获取指引</span>官方模型优先从 Comfy Org 的 Hugging Face 页面获取（comfyanonymous/ComfyUI_docs 或对应官方仓库）；社区微调模型与 LoRA 常见来源为 Civitai 与 Hugging Face。下载后放入对应目录：Checkpoint → models/checkpoints，LoRA → models/loras，ControlNet → models/controlnet，VAE → models/vae，放大模型 → models/upscale_models。</div></div>'
        + "</div>";
    }

    /* 交互式节点图 */
    html += '<div class="section"><div class="sec-head"><h2>工作流节点图</h2><span class="sec-en">INTERACTIVE GRAPH</span></div>'
      + '<p class="sec-desc">拖拽平移 · 滚轮缩放 · <b>点击阶段按钮</b>聚焦该环节并高亮数据进出连线，讲解直接显示在图下方；<b>点击节点</b>查看它在整条流程中的职责；双击空白处复位视图。连线颜色 = 数据类型。</p>';
    if (w.stages && w.stages.length) {
      html += '<div class="stage-chips" id="stageChips"><button class="stage-chip active" data-stage="-1">🌐 全部</button>';
      w.stages.forEach(function (s, i) {
        html += '<button class="stage-chip" data-stage="' + i + '">' + esc((i + 1) + ". " + s.name) + "</button>";
      });
      html += "</div>";
    }
    html += '<div class="play-bar" id="playBar">'
      + '<button class="play-btn" id="pbPlay" title="按真实执行顺序逐节点播放数据流动">▶ 播放数据流</button>'
      + '<button class="pb-mini" id="pbPrev" title="上一步">◀</button>'
      + '<button class="pb-mini" id="pbNext" title="下一步">▶</button>'
      + '<button class="pb-mini" id="pbReset" title="从头重播">↺</button>'
      + '<button class="pb-mini pb-x" id="pbClose" title="退出回放">✕</button>'
      + '<span class="pb-note">按真实执行顺序回放每一步的数据流入流出</span>'
      + "</div>"
      + '<div id="wfGraph"></div>'
      + '<div class="graph-legend"><span>连线颜色：</span>'
      + [["MODEL", "#8b5cf6"], ["CLIP", "#c9b34a"], ["VAE", "#d9534f"], ["LATENT", "#5faf5f"], ["IMAGE", "#3d8bd6"], ["CONDITIONING", "#e8a33d"], ["CONTROL_NET", "#a1887f"], ["VIDEO", "#d4618c"]]
        .map(function (x) { return '<span class="lg"><span class="sw" style="background:' + x[1] + '"></span>' + x[0] + "</span>"; }).join("")
      + '<span style="margin-left:auto">连线颜色由上游输出类型决定</span></div>'
      /* 联动面板：数据流 / 阶段拆解 / 逐节点分析 三合一，tab 切换 + 可收起 */
      + '<div class="wf-panel" id="wfPanel">'
      + '<div class="wf-tabs">'
      + '<button class="wf-tab active" data-tab="flow">🔗 数据流</button>'
      + '<button class="wf-tab" data-tab="stage">🧩 阶段拆解</button>'
      + '<button class="wf-tab" data-tab="nodes">🔬 逐节点分析</button>'
      + '<button class="wf-collapse" id="wfCollapse" title="收起/展开面板">▾ 收起</button>'
      + "</div>"
      + '<div class="wf-body" id="wfBody">'
      + '<div class="wf-tabpane active" data-pane="flow">'
      + '<div class="pb-sub mono" id="pbSub"></div>'
      + (w.flow && w.flow.length
        ? '<div class="flow-inline-head"><h2>数据是怎么一步步流动的</h2><span class="sec-en">DATA FLOW</span><span class="flow-hint">👆 点击任意步骤，图上高亮该步的数据流动</span></div>'
          + '<div class="flow-steps" id="flowList">'
          + w.flow.map(function (f, i) {
              return '<div class="flow-step" data-fidx="' + i + '"><div class="fs-num">' + (i + 1) + '</div><div><h4>第 ' + (i + 1) + " 步</h4><p>" + esc(f) + "</p></div></div>";
            }).join("")
          + "</div>"
        : '<div class="pb-none" style="padding:8px 0">该工作流暂无分步数据流讲解。</div>')
      + "</div>"
      + '<div class="wf-tabpane" data-pane="stage">'
      + (w.stages && w.stages.length
        ? '<div class="stage-line">'
          + w.stages.map(function (s, i) {
              return '<div class="stage-item" data-stage="' + i + '"><h4><span class="stage-num">' + (i + 1) + "</span>" + esc(s.name) + '<span class="st-nodes">'
                + (s.nodes || []).map(function (nid) {
                    var n = nodeById[nid];
                    return n ? '<span class="mini-tag mono" style="font-size:10.5px">' + esc(n.title) + "</span>" : "";
                  }).join("") + '</span></h4><p>' + esc(s.desc) + "</p></div>";
            }).join("")
          + "</div>"
        : "")
      + "</div>"
      + '<div class="wf-tabpane" data-pane="nodes">'
      + (w.nodeAnalysis && w.nodeAnalysis.length
        ? '<div class="node-list" id="nodeList">'
          + w.nodeAnalysis.map(function (a, i) {
              var n = nodeById[a.node] || { title: a.node, cat: "util" };
              var lk = lookupNode(n.title);
              return '<details class="node-card" data-nid="' + esc(a.node) + '"' + (i === 0 ? " open" : "") + '><summary>'
                + catDot(n.cat) + '<span class="node-name">' + esc(n.title) + '</span><span class="node-brief">' + esc(n.brief || "") + '</span><span class="node-loc">📍 图中已高亮</span><span class="node-chevron">▶</span></summary>'
                + '<div class="node-body"><div class="nb-row"><div class="nb-label">在本工作流中</div><div>' + esc(a.detail) + "</div></div>"
                + (n.widgets && n.widgets.length ? '<div class="nb-row"><div class="nb-label">图中参数</div><div class="mono" style="font-size:12.5px;color:#a5b0c8">' + n.widgets.map(esc).join(" · ") + "</div></div>" : "")
                + (lk ? '<div class="nb-row"><div class="nb-label">节点包详解</div><div><a href="#/nodes/' + esc(lk.pkg.id) + '" style="font-size:12.5px">📖 ' + esc(lk.pkg.name) + " · " + esc(lk.node.name) + " →</a></div></div>" : "")
                + "</div></details>";
            }).join("")
          + "</div>"
        : '<div class="pb-none" style="padding:8px 0">该工作流暂无逐节点分析。</div>')
      + "</div>"
      + "</div></div>"
      + "</div>";

    /* 工作流源文件（展示与下载） */
    var mf = wfFile(w.id);
    html += '<div class="section"><div class="sec-head"><h2>工作流源文件</h2><span class="sec-en">WORKFLOW FILE</span></div>'
      + '<div class="card"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:6px">'
      + '<button class="bulk-btn" id="wfJsonToggle">📋 查看源 JSON</button>'
      + '<button class="bulk-btn" id="wfJsonDownload">⬇ 下载 .json</button>'
      + (mf
          ? '<a class="mini-tag" href="' + esc(mf.sourceUrl) + '" target="_blank" rel="noopener" style="color:#7dd3fc;border-color:rgba(76,201,240,.4)">📄 溯源：' + esc(mf.sourceName) + " ↗</a>"
            + '<span style="font-size:12px;color:#86efac">✓ 公开仓库原始文件 · 结构校验通过</span>'
          : '<span style="font-size:12px;color:var(--warn)">🧪 本站自制参考版 · 非任何作者的原始文件</span>')
      + "</div>"
      + '<div id="wfJsonBox" style="display:none"><div class="code-head"><span>' + esc(w.id) + ".json</span><span>" + (mf ? "UI 格式（官方原始）" : "API 格式（自制参考）") + "</span></div><pre id=\"wfJsonPre\" style=\"max-height:440px;overflow:auto\"></pre></div>"
      + (mf
          ? '<div class="callout info" style="margin:12px 0 0"><span class="co-ico">🧭</span><div><span class="co-title">如何导入</span>下载 JSON 后：方式一，把文件直接拖进 ComfyUI 画布；方式二，菜单 Workflow → Open 选择文件。导入后请把各加载节点里的模型文件名改成你本机已有的文件（见上方依赖清单）；若提示缺节点，先在 ComfyUI-Manager 里安装对应节点包。本文件来自上方标注的公开仓库，可点击溯源。</div></div>'
          : '<div class="callout warn" style="margin:12px 0 0"><span class="co-ico">🧭</span><div><span class="co-title">关于此文件</span>该工作流暂无对应的公开原始文件，此处为本站依据社区通用结构构造的参考实现（API 格式），已通过结构校验。导入方式同左：拖入画布或 Workflow → Open。第三方节点若提示缺失请先用 Manager 安装；参数如与最新版节点包有出入，请对照上方节点图与参数详解微调。</div></div>')
      + "</div></div>";

    /* 参数表 */
    if (w.params && w.params.length) {
      html += '<div class="section"><div class="sec-head"><h2>关键参数参考</h2><span class="sec-en">PARAMETERS</span></div><table class="data-table"><tr><th>参数</th><th>图中取值</th><th>说明</th></tr>';
      w.params.forEach(function (p) {
        html += "<tr><td class=\"mono\" style=\"color:#c4b5fd\">" + esc(p.name) + "</td><td class=\"mono\">" + esc(p.value) + "</td><td style=\"color:var(--muted)\">" + esc(p.desc) + "</td></tr>";
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

    /* 执行回放 UI 状态 */
    var pbBar = $("#playBar"), pbBtn = $("#pbPlay"), pbPrev = $("#pbPrev"), pbNext = $("#pbNext"),
        pbReset = $("#pbReset"), pbClose = $("#pbClose"), pbSub = $("#pbSub");
    var pbTimer = null, pbPlaying = false, pbStep = -1;
    function stopPbUi() {
      if (pbTimer) { clearInterval(pbTimer); pbTimer = null; }
      pbPlaying = false; pbStep = -1;
      if (pbBtn) pbBtn.textContent = "▶ 播放数据流";
      if (pbBar) pbBar.classList.remove("playing");
    }

    /* 节点图详情面板注入"在本工作流中"语境分析（来自逐节点全量分析） */
    var wfNoteMap = {};
    (w.nodeAnalysis || []).forEach(function (a) {
      if (a && a.node && a.detail) wfNoteMap[a.node] = a.detail;
    });
    var api = window.ComfyGraph.render(host, w.graph, {
      notes: wfNoteMap,
      onPlaybackChange: function (active) { if (!active) stopPbUi(); },
      onNodeClick: function (n) { markNodeCard(n ? n.id : null); }
    });
    var pbApi = api.playback;

    /* 联动面板：三块内容 tab 切换 + 可收起；图交互自动切到对应 tab */
    var wfPanel = $("#wfPanel"), wfCollapse = $("#wfCollapse");
    function switchTab(name, expand) {
      if (!wfPanel) return;
      if (expand && wfPanel.classList.contains("collapsed")) wfPanel.classList.remove("collapsed");
      if (wfCollapse) wfCollapse.textContent = wfPanel.classList.contains("collapsed") ? "▸ 展开" : "▾ 收起";
      $all(".wf-tab", wfPanel).forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-tab") === name); });
      $all(".wf-tabpane", wfPanel).forEach(function (p) { p.classList.toggle("active", p.getAttribute("data-pane") === name); });
    }
    if (wfCollapse) wfCollapse.addEventListener("click", function () {
      wfPanel.classList.toggle("collapsed");
      wfCollapse.textContent = wfPanel.classList.contains("collapsed") ? "▸ 展开" : "▾ 收起";
    });
    $all(".wf-tab", wfPanel).forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.getAttribute("data-tab")); });
    });
    /* 阶段拆解 tab：时间线卡片点击 ↔ 图高亮 双向联动；选中态直接标在卡片上 */
    var stageLine = wfPanel ? wfPanel.querySelector(".stage-line") : null;
    var stageItems = wfPanel ? $all(".stage-line .stage-item", wfPanel) : [];
    function markStageItem(si) {
      stageItems.forEach(function (el) {
        el.classList.toggle("active", parseInt(el.getAttribute("data-stage"), 10) === si);
      });
    }
    /* 阶段选中统一入口：图上方 chips 与面板内时间线卡片共用 */
    function selectStage(si, reveal) {
      if (pbApi.isActive()) pbApi.exit();
      syncChips(si);
      markStageItem(si);
      if (si < 0 || !w.stages[si]) { api.highlight(null); flowClear(); clearNodeCards(); return; }
      flowClear();
      clearNodeCards();
      api.highlight((w.stages[si].nodes || []).slice(), true);
      /* 从面板外（阶段 chips）触发时，切到阶段拆解 tab 并展开，让讲解可见 */
      if (reveal) switchTab("stage", true);
    }
    if (stageLine) stageLine.addEventListener("click", function (e) {
      var item = e.target.closest(".stage-item");
      if (!item) return;
      var idx = parseInt(item.getAttribute("data-stage"), 10);
      if (isNaN(idx) || !w.stages[idx]) return;
      selectStage(item.classList.contains("active") ? -1 : idx);  /* 再点一次取消聚焦 */
    });

    /* 逐节点分析卡 ↔ 图 双向联动标记 */
    var nodeList = $("#nodeList");
    function markNodeCard(id) {
      if (!nodeList) return;
      $all(".node-card", nodeList).forEach(function (el) {
        el.classList.toggle("active", el.getAttribute("data-nid") === id);
      });
    }
    function clearNodeCards() { markNodeCard(null); }
    if (nodeList) {
      nodeList.addEventListener("click", function (e) {
        var card = e.target.closest(".node-card");
        if (!card) return;
        if (e.target.closest("a")) return;  /* 卡内链接正常跳转 */
        var id = card.getAttribute("data-nid");
        if (!id || !nodeById2[id]) return;
        if (pbApi.isActive()) pbApi.exit();
        flowClear();
        markNodeCard(id);
        api.highlight(api.neighborsOf(id));
        syncChips(-1);
      });
    }

    /* 阶段聚焦：高亮阶段节点 + 数据进出连线，讲解就地显示在图下方 */
    var nodeById2 = {};
    (w.graph.nodes || []).forEach(function (n) { nodeById2[n.id] = n; });
    var stageOf = {};
    (w.stages || []).forEach(function (s, si) {
      (s.nodes || []).forEach(function (nid) { if (stageOf[nid] === undefined) stageOf[nid] = si; });
    });
    var chips = $("#stageChips");
    function syncChips(si) {
      if (!chips) return;
      $all(".stage-chip", chips).forEach(function (x) {
        x.classList.toggle("active", parseInt(x.getAttribute("data-stage"), 10) === si);
      });
    }
    if (chips) {
      chips.addEventListener("click", function (e) {
        var b = e.target.closest(".stage-chip");
        if (!b) return;
        selectStage(parseInt(b.getAttribute("data-stage"), 10), true);
      });
    }

    /* DATA FLOW 联动：flow 文本点名了节点标题，按文本匹配建立 步骤→节点 映射 */
    var flowList = $("#flowList");
    var flowNodeCache = {};
    function flowStepIds(i) {
      if (flowNodeCache[i] !== undefined) return flowNodeCache[i];
      var text = (w.flow || [])[i] || "";
      var ids = [];
      (w.graph.nodes || []).forEach(function (n) {
        if (text.indexOf(n.title) >= 0) ids.push(n.id);
      });
      if (!ids.length && i > 0) ids = flowStepIds(i - 1);  /* 概念补充步（如 Seed 说明）沿用上一步节点 */
      flowNodeCache[i] = ids;
      return ids;
    }
    var flowOfNode = {};
    (w.flow || []).forEach(function (f, i) {
      flowStepIds(i).forEach(function (id) { if (flowOfNode[id] === undefined) flowOfNode[id] = i; });
    });
    function flowMark(idx) {
      if (!flowList) return;
      $all(".flow-step", flowList).forEach(function (el) {
        el.classList.toggle("active", parseInt(el.getAttribute("data-fidx"), 10) === idx);
      });
    }
    function flowClear() { flowMark(-1); }
    if (flowList) {
      flowList.addEventListener("click", function (e) {
        var el = e.target.closest(".flow-step");
        if (!el) return;
        var idx = parseInt(el.getAttribute("data-fidx"), 10);
        var alreadyActive = el.classList.contains("active");
        if (pbApi.isActive()) pbApi.exit();
        if (alreadyActive) {  /* 再点一次取消聚焦 */
          flowClear();
          api.highlight(null);
          if (pbSub) pbSub.innerHTML = "";
          return;
        }
        flowMark(idx);
        var ids = flowStepIds(idx);
        if (ids.length) {
          api.highlight(ids, true);
          var si = stageOf[ids[0]];
          if (si !== undefined) { syncChips(si); markStageItem(si); }
        }
        if (pbSub) {
          var parts = ids.map(function (id) { return nodeById2[id] ? nodeById2[id].title : id; });
          pbSub.innerHTML = '<div class="pb-card"><div class="pb-head"><span class="pb-pos">第 ' + (idx + 1) + " 步</span><b>数据流讲解</b></div>"
            + '<div class="pb-row"><span class="pb-k">📖 讲解</span><span class="pb-do-text">' + esc((w.flow || [])[idx]) + "</span></div>"
            + (parts.length ? '<div class="pb-row"><span class="pb-k">🎯 涉及节点</span><span>' + parts.map(function (t) { return '<span class="pb-d"><b>' + esc(t) + "</b></span>"; }).join("") + "</span></div>" : "")
            + "</div>";
        }
      });
    }

    /* 执行回放：数据流卡片 —— 每一步展示输入数据(形态/状态/来源) → 加工 → 输出数据(形态/状态/去向) */
    var TYPE_SHAPE = {
      MODEL: "扩散模型权重", CLIP: "文本编码器", CLIP_VISION: "视觉编码器", VAE: "VAE 编解码器",
      CONDITIONING: "文本语义向量", LATENT: "4×H/8×W/8 潜张量", IMAGE: "H×W×3 像素图", MASK: "H×W 蒙版",
      CONTROL_NET: "ControlNet 权重", UPSCALE_MODEL: "放大模型权重", STYLE_MODEL: "风格模型权重",
      VIDEO: "视频帧序列", AUDIO: "音频波形", STRING: "文本", INT: "整数", FLOAT: "小数",
      COMBO: "选项值", NUMBER: "数值", SIGMAS: "采样日程", NOISE: "噪声种子", SAMPLER: "采样器",
      GUIDER: "引导器", CFG: "引导系数", "*": "数据"
    };
    /* 节点级数据状态转换：title 命中正则 → 该步输入/输出侧的数据状态注解 */
    var STATE_RULES = [
      { re: /load\s*checkpoint|checkpoint\s*loader/i,
        out: { MODEL: "UNET 扩散权重", CLIP: "文本编码器（随 ckpt 加载）", VAE: "像素解码器（随 ckpt 加载）" } },
      { re: /lora/i,
        out: { MODEL: "扩散权重（已叠加 LoRA）", CLIP: "文本编码器（LoRA 已注入）" } },
      { re: /control\s*net/i,
        in: { CONTROL_NET: "控制网权重", IMAGE: "参考控制图" },
        out: { CONDITIONING: "已注入空间控制信号的引导向量" } },
      { re: /clip\s*text\s*encode|text\s*encode/i,
        out: { CONDITIONING: "prompt 语义向量（决定画什么/不画什么）" } },
      { re: /empty\s*latent/i,
        out: { LATENT: "纯噪声 {res}（随机初始化）" } },
      { re: /load\s*latent/i,
        out: { LATENT: "外部导入的潜图" } },
      { re: /ksampler|sampler|sample/i,
        in: { LATENT: "待去噪潜张量", MODEL: "扩散权重", CONDITIONING: "正/负引导向量" },
        out: { LATENT: "去噪完成的潜表示（已含图像信息）" } },
      { re: /vae\s*encode|encode.*vae/i,
        out: { LATENT: "图像压缩编码后的潜表示" } },
      { re: /vae\s*decode|decode/i,
        in: { LATENT: "去噪完成的潜表示", VAE: "解码器权重" },
        out: { IMAGE: "解码还原的 RGB 像素图" } },
      { re: /load\s*image/i,
        out: { IMAGE: "原始像素图", MASK: "蒙版" } },
      { re: /upscale/i,
        out: { IMAGE: "放大后的像素图", UPSCALE_MODEL: "放大模型权重", LATENT: "放大后的潜张量" } },
      { re: /save\s*image|preview/i,
        in: { IMAGE: "最终像素图" } },
      { re: /image\s*(scale|resize|rotate|flip|blend|composite|invert|crop|pad)/i,
        out: { IMAGE: "处理后的像素图", MASK: "处理后的蒙版" } }
    ];
    function stateRulesFor(title) {
      for (var i = 0; i < STATE_RULES.length; i++) if (STATE_RULES[i].re.test(title)) return STATE_RULES[i];
      return null;
    }
    /* {res} 占位符 → 从 widgets 里的分辨率算出真实潜张量形状 */
    function resolveState(st, n) {
      if (!st || st.indexOf("{res}") < 0) return st;
      var dims = null, i, m, ws = (n && n.widgets) || [];
      for (i = 0; i < ws.length; i++) {
        m = String(ws[i]).match(/(\d{2,5})\s*[x×]\s*(\d{2,5})/i);
        if (m) { dims = [parseInt(m[1], 10), parseInt(m[2], 10)]; break; }
      }
      return dims
        ? st.replace("{res}", "4×" + Math.round(dims[1] / 8) + "×" + Math.round(dims[0] / 8))
        : st.replace("{res}", "4×H/8×W/8");
    }
    function typeOfLink(lk) {
      var a = nodeById2[lk.from];
      if (!a || !a.outputs) return "";
      var o = a.outputs[typeof lk.fromOut === "number" ? lk.fromOut : 0];
      return (o && o.type) || "";
    }
    function groupFlow(lks, dir, rule, n) {
      var byType = {}, order = [];
      lks.forEach(function (lk) {
        var t = typeOfLink(lk) || "DATA";
        var other = dir === "in" ? lk.from : lk.to;
        var ot = nodeById2[other] ? nodeById2[other].title : other;
        if (!byType[t]) { byType[t] = { t: t, srcs: [] }; order.push(t); }
        if (byType[t].srcs.indexOf(ot) < 0) byType[t].srcs.push(ot);
      });
      return order.map(function (t) {
        var g = byType[t];
        var st = rule && rule[dir] && rule[dir][t];
        return '<span class="pb-d"><span class="pb-t" style="color:' + window.ComfyGraph.typeColor(t) + '">' + esc(t) + "</span> "
          + esc(resolveState(st || TYPE_SHAPE[t] || "数据", n))
          + ' <i class="pb-src">' + (dir === "in" ? "← " : "→ ") + esc(g.srcs.join("、")) + "</i></span>";
      }).join("");
    }
    function setPbStep(i) {
      var cur = pbApi.seq[i];
      pbApi.apply(i);
      pbStep = i;
      var n = nodeById2[cur];
      var ins = (w.graph.links || []).filter(function (lk) { return lk.to === cur; });
      var outs = (w.graph.links || []).filter(function (lk) { return lk.from === cur; });
      var si = stageOf[cur];
      if (si !== undefined) { syncChips(si); markStageItem(si); }
      var fi = flowOfNode[cur];
      flowMark(fi !== undefined ? fi : -1);
      markNodeCard(cur);
      if (pbSub) {
        var rule = n ? stateRulesFor(n.title || "") : null;
        var inHtml = ins.length ? groupFlow(ins, "in", rule, n) : '<span class="pb-none">（源头节点，无输入）</span>';
        var outHtml = outs.length ? groupFlow(outs, "out", rule, n) : '<span class="pb-none">（终点节点，数据保存/预览）</span>';
        var wid = (n && n.widgets && n.widgets.length)
          ? '<div class="pb-wid">本步参数：' + esc(n.widgets.join(" · ")) + "</div>" : "";
        var flowLine = (fi !== undefined && (w.flow || [])[fi])
          ? '<div class="pb-row"><span class="pb-k">📖 讲解</span><span class="pb-do-text">' + esc(w.flow[fi]) + "</span></div>" : "";
        var doRow = (n && (n.brief || wid))
          ? '<div class="pb-row"><span class="pb-k">⚙ 加工</span><span class="pb-do-text">' + esc(n.brief || "") + wid + "</span></div>" : "";
        pbSub.innerHTML = '<div class="pb-card">'
          + '<div class="pb-head"><span class="pb-pos">[' + (i + 1) + "/" + pbApi.seq.length + ']</span><b>' + esc(n ? n.title : cur) + "</b>"
          + (si !== undefined && w.stages[si] ? '<span class="pb-stage-tag">' + esc((si + 1) + ". " + w.stages[si].name) + "</span>" : "")
          + "</div>"
          + flowLine
          + '<div class="pb-row"><span class="pb-k">⬅ 输入</span><span>' + inHtml + "</span></div>"
          + doRow
          + '<div class="pb-row"><span class="pb-k">➡ 输出</span><span>' + outHtml + "</span></div>"
          + "</div>";
      }
    }
    function pbStart() {
      pbApi.enter();
      pbPlaying = true;
      if (pbBar) pbBar.classList.add("playing");
      if (pbBtn) pbBtn.textContent = "⏸ 暂停";
      setPbStep(0);
      if (pbTimer) clearInterval(pbTimer);
      pbTimer = setInterval(function () {
        if (pbStep >= pbApi.seq.length - 1) { pbFinish(); return; }
        setPbStep(pbStep + 1);
      }, 1600);
    }
    function pbFinish() {
      var total = pbApi.seq.length;
      pbApi.exit();  /* 触发 onPlaybackChange → stopPbUi 复位按钮 */
      if (pbSub) pbSub.innerHTML = '<span class="pb-done">✅ 播放完成 — 已按真实执行顺序走完全部 ' + total + " 个节点，点击节点可查看详细讲解</span>";
      syncChips(-1);
    }
    function pbManual(delta) {
      if (pbTimer) { clearInterval(pbTimer); pbTimer = null; }
      pbPlaying = false;
      if (pbBtn) pbBtn.textContent = "▶ 继续";
      if (!pbApi.isActive()) pbApi.enter();
      var base = pbStep < 0 ? 0 : pbStep;
      setPbStep(Math.min(pbApi.seq.length - 1, Math.max(0, base + delta)));
    }
    if (pbBtn) pbBtn.addEventListener("click", function () {
      if (pbPlaying) {  /* 暂停 */
        if (pbTimer) { clearInterval(pbTimer); pbTimer = null; }
        pbPlaying = false;
        pbBtn.textContent = "▶ 继续";
        return;
      }
      if (pbApi.isActive() && pbStep >= 0) {  /* 从暂停处继续 */
        pbPlaying = true;
        pbBtn.textContent = "⏸ 暂停";
        if (pbTimer) clearInterval(pbTimer);
        pbTimer = setInterval(function () {
          if (pbStep >= pbApi.seq.length - 1) { pbFinish(); return; }
          setPbStep(pbStep + 1);
        }, 1600);
      } else pbStart();
    });
    if (pbPrev) pbPrev.addEventListener("click", function () { pbManual(-1); });
    if (pbNext) pbNext.addEventListener("click", function () { pbManual(1); });
    if (pbReset) pbReset.addEventListener("click", function () {
      stopPbUi();
      pbStart();
    });
    if (pbClose) pbClose.addEventListener("click", function () {
     pbApi.exit();
      syncChips(-1);
      flowClear();
      clearNodeCards();
      if (pbSub) pbSub.innerHTML = "";
    });

    /* 源 JSON 加载 / 展示 / 下载 */
    var box = $("#wfJsonBox"), pre = $("#wfJsonPre");
    var tBtn = $("#wfJsonToggle"), dBtn = $("#wfJsonDownload");
    if (box && tBtn && dBtn) {
      var raw = null;
      var mf = wfFile(w.id);
      var fetchPath = mf ? mf.file : "assets/js/data/exports/" + w.id + ".api.json";
      function loadJson(cb) {
        if (raw !== null) return cb(raw);
        fetch(fetchPath)
          .then(function (r) { if (!r.ok) throw new Error("404"); return r.text(); })
          .then(function (t) { raw = t; cb(t); })
          .catch(function () { raw = ""; cb(null); });
      }
      function pretty(t) {
        try { return esc(JSON.stringify(JSON.parse(t), null, 2)); }
        catch (e) { return esc(t); }
      }
      tBtn.addEventListener("click", function () {
        var hidden = box.style.display !== "block";
        if (hidden) {
          loadJson(function (t) {
            pre.innerHTML = t === null
              ? '<span style="color:var(--warn)">⏳ 该工作流的源文件正在整理，将在下一个版本提供。</span>'
              : pretty(t);
            box.style.display = "block";
            tBtn.textContent = "📋 收起源 JSON";
          });
        } else {
          box.style.display = "none";
          tBtn.textContent = "📋 查看源 JSON";
        }
      });
      dBtn.addEventListener("click", function () {
        loadJson(function (t) {
          if (t === null) {
            pre.innerHTML = '<span style="color:var(--warn)">⏳ 该工作流的源文件正在整理，将在下一个版本提供。</span>';
            box.style.display = "block";
            tBtn.textContent = "📋 收起源 JSON";
            return;
          }
          var blob = new Blob([t], { type: "application/json" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = w.id + ".json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        });
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

  /* ============ 节点名 → 节点包 跳转索引（工作流 → 第二部分联动） ============ */
  var NODE_INDEX = null;
  function normName(s) {
    return String(s || "").toLowerCase().replace(/[\s_\-+()\[\]（）·:：.，,]/g, "");
  }
  function nodeIndex() {
    if (NODE_INDEX) return NODE_INDEX;
    NODE_INDEX = {};
    pkgs().forEach(function (p) {
      (p.nodes || []).forEach(function (n) {
        var k = normName(n.name);
        if (k && !NODE_INDEX[k]) NODE_INDEX[k] = { pkg: p, node: n };
      });
    });
    return NODE_INDEX;
  }
  function lookupNode(title) {
    var idx = nodeIndex();
    var t = normName(title);
    if (!t) return null;
    /* 别名层：工作流显示名 → 包内条目（来自 node-aliases.js） */
    var AL = (D().nodeAliases) || {};
    if (AL[t]) {
      var ap = null;
      pkgs().forEach(function (x) { if (x.id === AL[t].pkg) ap = x; });
      if (ap) return { pkg: ap, node: AL[t].node ? { name: AL[t].node, brief: "" } : { name: ap.name, brief: "" } };
    }
    if (idx[t]) return idx[t];
    var keys = Object.keys(idx);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].length >= 5 && (keys[i].indexOf(t) >= 0 || t.indexOf(keys[i]) >= 0)) return idx[keys[i]];
    }
    return null;
  }
  window.ComfyGraph.detailLinkResolver = function (title) {
    var r = lookupNode(title);
    if (r) return { href: "#/nodes/" + r.pkg.id, label: r.pkg.name + " · " + r.node.name };
    return { href: "#/nodes/q=" + encodeURIComponent(title), label: "收录中暂无 · 去节点包列表搜「" + title + "」" };
  };

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
    if (parts[0] === "nodes" && parts[1] && parts[1].indexOf("q=") === 0) {
      try { nodeFilter.q = decodeURIComponent(parts[1].slice(2)); } catch (e) { nodeFilter.q = parts[1].slice(2); }
      nodeFilter.cat = "全部";
      app.innerHTML = renderNodes();
      paintPkgGrid();
      var qInput = $("#pkgQ");
      if (qInput) qInput.addEventListener("input", function () { nodeFilter.q = qInput.value; paintPkgGrid(); });
      return;
    }
    if (parts[0] === "nodes" && parts[1]) {
      app.innerHTML = renderPkgDetail(parts[1]);
      mountPkgMocks(parts[1]);
      return;
    }
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
      var qIn = $("#pkgQ");
      if (qIn) qIn.addEventListener("input", function () { nodeFilter.q = qIn.value; paintPkgGrid(); });
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
    if (parts[0] === "civitai" && parts[1]) {
      app.innerHTML = window.PAGE_CIVITAI ? window.PAGE_CIVITAI.renderDetail(parts[1], parseInt(parts[2], 10) || 0) : "<div class=container>加载中…</div>";
      if (window.PAGE_CIVITAI) window.PAGE_CIVITAI.mountDetail(parts[1], parseInt(parts[2], 10) || 0);
      return;
    }
    if (parts[0] === "civitai") {
      app.innerHTML = window.PAGE_CIVITAI ? window.PAGE_CIVITAI.render() : "<div class=container>加载中…</div>";
      if (window.PAGE_CIVITAI) window.PAGE_CIVITAI.mount();
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
