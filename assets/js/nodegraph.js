/* ============================================================
   ComfyGraph — ComfyUI 风格节点图渲染器（零依赖 SVG）
   用法: ComfyGraph.render(containerEl, graphData, opts)
   graphData = {
     nodes: [{ id, title, cat, x, y, inputs:[{name,type}], outputs:[{name,type}],
               widgets:[], brief, desc }],
     links: [{ from, fromOut, to, toIn, dashed? }]   // fromOut/toIn 支持索引或名称
   }
   ============================================================ */
(function () {
  "use strict";

  var TYPE_COLORS = {
    MODEL: "#8b5cf6", CLIP: "#c9b34a", CLIP_VISION: "#a2914a", STYLE_MODEL: "#a2914a",
    VAE: "#d9534f", IMAGE: "#3d8bd6", LATENT: "#5faf5f", CONDITIONING: "#e8a33d",
    SAMPLER: "#2aa8b8", SAMPLERS: "#2aa8b8", SIGMAS: "#2aa8b8", NOISE: "#2aa8b8",
    GUIDER: "#2aa8b8", CFG: "#2aa8b8", CONTROL_NET: "#a1887f", MASK: "#8a93a8",
    UPSCALE_MODEL: "#7c5cff", VIDEO: "#d4618c", AUDIO: "#4fbf9f", STRING: "#8a93a8",
    INT: "#8a93a8", FLOAT: "#8a93a8", COMBO: "#8a93a8", NUMBER: "#8a93a8",
    SEGS: "#c98a5c", DETECTOR: "#c98a5c", SAM_MODEL: "#c98a5c", BBOX_DETECTOR: "#c98a5c",
    SEGM_DETECTOR: "#c98a5c", UPSCALE_FUNC: "#c98a5c",_detailer_pipe: "#c98a5c",
    DETAILER_PIPE: "#c98a5c", KSAMPLER_ADVANCED: "#2aa8b8", CLIPTEXTENCODER: "#c9b34a",
    "*": "#8a93a8"
  };
  function typeColor(t) {
    if (!t) return "#8a93a8";
    var u = String(t).toUpperCase();
    if (TYPE_COLORS[u]) return TYPE_COLORS[u];
    if (TYPE_COLORS[String(t)]) return TYPE_COLORS[String(t)];
    return "#8a93a8";
  }

  var CAT_COLORS = {
    load: "#b06ab3", model: "#8b5cf6", cond: "#e8a33d", latent: "#5faf5f",
    image: "#3d8bd6", sampler: "#2aa8b8", mask: "#8a93a8", vae: "#d9534f",
    clip: "#c9b34a", video: "#d4618c", audio: "#4fbf9f", util: "#647088",
    net: "#4cc9f0", "3d": "#b8875c"
  };
  var CAT_LABELS = {
    load: "加载", model: "模型", cond: "条件", latent: "潜空间", image: "图像",
    sampler: "采样", mask: "遮罩", vae: "VAE", clip: "文本编码", video: "视频",
    audio: "音频", util: "工具", net: "网络", "3d": "3D"
  };

  var HEADER_H = 26, PORT_H = 18, WIDGET_H = 20, PAD = 10;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function computeLayout(node) {
    var titleW = (node.title || "").length * 9 + 34;
    var inW = 0, outW = 0, i;
    var inputs = node.inputs || [], outputs = node.outputs || [];
    for (i = 0; i < inputs.length; i++)
      inW = Math.max(inW, (inputs[i].name || "").length * 6.6 + (inputs[i].type ? String(inputs[i].type).length * 6.2 + 12 : 0));
    for (i = 0; i < outputs.length; i++)
      outW = Math.max(outW, (outputs[i].type || outputs[i].name || "").length * 7 + 26);
    var widW = 0, widgets = node.widgets || [];
    for (i = 0; i < widgets.length; i++) widW = Math.max(widW, widgets[i].length * 6.6 + 30);
    var w = Math.max(150, Math.ceil(Math.max(titleW, inW + outW + 40, widW + 18)));
    var rows = Math.max(inputs.length, outputs.length);
    var h = HEADER_H + rows * PORT_H + widgets.length * WIDGET_H + PAD + 4;
    return { w: w, h: h };
  }

  function portPos(node, lay, side, nameOrIdx) {
    var list = side === "in" ? (node.inputs || []) : (node.outputs || []);
    var idx = -1;
    if (typeof nameOrIdx === "number") idx = nameOrIdx;
    else {
      for (var i = 0; i < list.length; i++) {
        if (list[i].name === nameOrIdx || list[i].type === nameOrIdx) { idx = i; break; }
      }
      if (idx < 0) idx = 0;
    }
    /* 图数据里的端口索引按原始节点槽位记，精简图可能越界（如 VHS_LoadVideo toIn:7 但只留 1 个输入）：
       无端口时贴节点边角，越界时夹紧到最后一个端口，避免连线悬空断在半空 */
    if (list.length === 0)
      return { x: side === "in" ? node.x : node.x + lay.w, y: node.y + HEADER_H + 8 };
    if (idx < 0) idx = 0;
    if (idx > list.length - 1) idx = list.length - 1;
    var y = node.y + HEADER_H + idx * PORT_H + PORT_H / 2 + 1;
    var x = side === "in" ? node.x : node.x + lay.w;
    return { x: x, y: y };
  }

  function resolve(graph) {
    var map = {}, i;
    for (i = 0; i < graph.nodes.length; i++) map[graph.nodes[i].id] = graph.nodes[i];
    graph._layouts = {};
    for (i = 0; i < graph.nodes.length; i++) graph._layouts[graph.nodes[i].id] = computeLayout(graph.nodes[i]);
    return map;
  }

  function linkPath(graph, nmap, lk) {
    var a = nmap[lk.from], b = nmap[lk.to];
    if (!a || !b) return null;
    var la = graph._layouts[a.id], lb = graph._layouts[b.id];
    var p1 = portPos(a, la, "out", lk.fromOut);
    var p2 = portPos(b, lb, "in", lk.toIn);
    var dx = Math.max(50, Math.abs(p2.x - p1.x) * 0.5);
    return "M " + p1.x + " " + p1.y +
      " C " + (p1.x + dx) + " " + p1.y + ", " + (p2.x - dx) + " " + p2.y + ", " + p2.x + " " + p2.y;
  }

  function linkColor(graph, nmap, lk) {
    var a = nmap[lk.from];
    if (!a) return "#8a93a8";
    var outs = a.outputs || [];
    var t = null;
    if (typeof lk.fromOut === "number") t = outs[lk.fromOut] && outs[lk.fromOut].type;
    else {
      for (var i = 0; i < outs.length; i++) if (outs[i].name === lk.fromOut) { t = outs[i].type; break; }
    }
    return typeColor(t || (outs[0] && outs[0].type));
  }

  function renderNodeSVG(graph, node, nmap) {
    var lay = graph._layouts[node.id];
    var color = CAT_COLORS[node.cat] || "#647088";
    var s = '<g class="g-node" data-nid="' + esc(node.id) + '" transform="translate(' + node.x + ',' + node.y + ')">';
    s += '<rect class="g-node-body" width="' + lay.w + '" height="' + lay.h + '" rx="9" fill="#1b1e2b" stroke="#3a4157" stroke-width="1"/>';
    s += '<path d="M 0 9 A 9 9 0 0 1 9 0 L ' + (lay.w - 9) + ' 0 A 9 9 0 0 1 ' + lay.w + ' 9 L ' + lay.w + ' ' + HEADER_H + ' L 0 ' + HEADER_H + ' Z" fill="' + color + '" opacity="0.92"/>';
    s += '<rect x="0" y="' + HEADER_H + '" width="' + lay.w + '" height="2.5" fill="' + color + '" opacity="0.5"/>';
    s += '<text class="g-node-title" x="' + (lay.w / 2) + '" y="17.5" text-anchor="middle">' + esc(node.title) + '</text>';

    var i, y;
    var inputs = node.inputs || [], outputs = node.outputs || [];
    for (i = 0; i < inputs.length; i++) {
      y = HEADER_H + i * PORT_H + PORT_H / 2 + 1;
      s += '<circle cx="0" cy="' + y + '" r="4.5" fill="' + typeColor(inputs[i].type) + '" stroke="#101218" stroke-width="1.5"/>';
      s += '<text class="g-port-text" x="9" y="' + (y + 3.5) + '">' + esc(inputs[i].name) +
        ' <tspan fill="' + typeColor(inputs[i].type) + '" opacity="0.85">' + esc(inputs[i].type || "") + '</tspan></text>';
    }
    for (i = 0; i < outputs.length; i++) {
      y = HEADER_H + i * PORT_H + PORT_H / 2 + 1;
      var ot = outputs[i].type || outputs[i].name || "";
      s += '<circle cx="' + lay.w + '" cy="' + y + '" r="4.5" fill="' + typeColor(ot) + '" stroke="#101218" stroke-width="1.5"/>';
      s += '<text class="g-port-text" x="' + (lay.w - 9) + '" y="' + (y + 3.5) + '" text-anchor="end" fill="' + typeColor(ot) + '">' + esc(ot) + '</text>';
    }
    var rowMax = Math.max(inputs.length, outputs.length);
    var wy = HEADER_H + rowMax * PORT_H + 4;
    for (i = 0; i < (node.widgets || []).length; i++) {
      var wyy = wy + i * WIDGET_H;
      s += '<rect x="8" y="' + wyy + '" width="' + (lay.w - 16) + '" height="' + (WIDGET_H - 4) + '" rx="4" fill="#141724" stroke="#2c3245"/>';
      s += '<text class="g-widget-text" x="' + (lay.w / 2) + '" y="' + (wyy + 12.5) + '" text-anchor="middle">' + esc(node.widgets[i]) + '</text>';
    }
    /* 一句话备注：优先 AI 精读的「本图职责」（ai.na[id].brief，具体到本工作流），
       无则退回字典 brief；最多三行（每行 26 字），挂在节点正下方随节点移动；显隐由 💬 开关控制 */
    var _na = graph.ai && graph.ai.na && graph.ai.na[node.id];
    var noteTxt = String((_na && _na.brief) || node.brief || "").replace(/\s+/g, " ").trim();
    if (noteTxt) {
      var NOTE_LINE = 26, NOTE_ROWS = 3, NOTE_MAX = NOTE_LINE * NOTE_ROWS;
      if (noteTxt.length > NOTE_MAX) noteTxt = noteTxt.slice(0, NOTE_MAX - 1) + "…";
      var noteLines = [];
      for (var ni = 0; ni < noteTxt.length && noteLines.length < NOTE_ROWS; ni += NOTE_LINE)
        noteLines.push(noteTxt.slice(ni, ni + NOTE_LINE));
      s += '<text class="g-node-note" x="0" y="' + (lay.h + 14) + '">' + esc(noteLines[0])
        + noteLines.slice(1).map(function (ln, k) { return '<tspan x="0" dy="' + (13 * (k + 1)) + '">' + esc(ln) + '</tspan>'; }).join("")
        + '</text>';
    }
    s += '</g>';
    return s;
  }

  function render(container, graph, opts) {
    opts = opts || {};
    container.classList.add("graph-shell");
    var nmap = resolve(graph);

    /* 节点位置记忆：同构图（按节点 id 序列哈希作键）恢复用户上次拖放的位置 */
    var posLSKey = "cvgPos:" + (function () {
      var s = "";
      graph.nodes.slice(0, 40).forEach(function (n) { s += n.id + ","; });
      var h = 0;
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h.toString(36) + ":" + graph.nodes.length;
    })();
    var hasSavedPos = false;
    try {
      var savedPos = JSON.parse(localStorage.getItem(posLSKey) || "null");
      if (savedPos) {
        graph.nodes.forEach(function (n) {
          var p = savedPos[n.id];
          if (p) { n.x = p[0]; n.y = p[1]; hasSavedPos = true; }
        });
      }
    } catch (e) {}

    /* 防重叠：源画布坐标可能叠放（作者画布乱放/API 自动布局缺陷），
       相交节点对把 y 较大的往下推一格，多轮收敛；已有用户位置记忆时不做（尊重手动布局） */
    if (!hasSavedPos) {
      (function () {
        var GAP = 10;
        for (var it = 0; it < 8; it++) {
          var moved = false;
          var ns = graph.nodes, L = graph._layouts;
          for (var a = 0; a < ns.length; a++) {
            for (var b = a + 1; b < ns.length; b++) {
              var na = ns[a], nb = ns[b], la = L[na.id], lb = L[nb.id];
              if (!la || !lb) continue;
              if (na.x < nb.x + lb.w && nb.x < na.x + la.w &&
                  na.y < nb.y + lb.h && nb.y < na.y + la.h) {
                var low = na.y <= nb.y ? nb : na;
                var bottom = (low === na ? nb.y : na.y) + (low === na ? lb.h : la.h) + GAP;
                if (low.y < bottom) { low.y = bottom; moved = true; }
              }
            }
          }
          if (!moved) break;
        }
      })();
    }

    var nodesMinX = 1e9, nodesMinY = 1e9, nodesMaxX = -1e9, nodesMaxY = -1e9;
    graph.nodes.forEach(function (n) {
      var l = graph._layouts[n.id];
      nodesMinX = Math.min(nodesMinX, n.x); nodesMinY = Math.min(nodesMinY, n.y);
      nodesMaxX = Math.max(nodesMaxX, n.x + l.w); nodesMaxY = Math.max(nodesMaxY, n.y + l.h);
    });
    var pad = 60;
    var fullVB = { x: nodesMinX - pad, y: nodesMinY - pad, w: nodesMaxX - nodesMinX + pad * 2, h: nodesMaxY - nodesMinY + pad * 2 };

    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "cvg");
    svg.setAttribute("viewBox", fullVB.x + " " + fullVB.y + " " + fullVB.w + " " + fullVB.h);
    var aspect = fullVB.h / fullVB.w;
    container.style.minHeight = "320px";

    var gLinks = document.createElementNS(svgNS, "g");
    var gNodes = document.createElementNS(svgNS, "g");
    var bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("x", fullVB.x); bg.setAttribute("y", fullVB.y);
    bg.setAttribute("width", fullVB.w); bg.setAttribute("height", fullVB.h);
    bg.setAttribute("fill", "transparent");
    svg.appendChild(bg);

    var linkEls = [];
    graph.links.forEach(function (lk) {
      var d = linkPath(graph, nmap, lk);
      if (!d) return;
      var p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "g-link");
      p.setAttribute("stroke", linkColor(graph, nmap, lk));
      if (lk.dashed) p.setAttribute("stroke-dasharray", "6 4");
      gLinks.appendChild(p);
      /* 流动层：叠加在同一路径上，CSS dashoffset 动画显示数据沿 from→to 流动 */
      var f = document.createElementNS(svgNS, "path");
      f.setAttribute("d", d);
      f.setAttribute("class", "g-flow");
      f.setAttribute("stroke", linkColor(graph, nmap, lk));
      gLinks.appendChild(f);
      linkEls.push({ el: p, flow: f, from: lk.from, to: lk.to, lk: lk });
    });
    svg.appendChild(gLinks);

    /* 节点→关联连线 索引：拖动节点时只需重画这些连线 */
    var linksByNode = {};
    linkEls.forEach(function (L) {
      (linksByNode[L.from] = linksByNode[L.from] || []).push(L);
      (linksByNode[L.to] = linksByNode[L.to] || []).push(L);
    });

    var nodeEls = {};
    graph.nodes.forEach(function (n) {
      var wrap = document.createElementNS(svgNS, "g");
      wrap.innerHTML = renderNodeSVG(graph, n, nmap);
      var el = wrap.firstChild;
      nodeEls[n.id] = el;
      gNodes.appendChild(el);
    });
    svg.appendChild(gNodes);

    /* 高亮系统：keepIds 为要聚焦的节点 id 数组；null 表示清除。
       withContext=true 时（阶段聚焦），进出聚焦节点的一端连线以 ctx 档保留，
       展示数据如何流入/流出该阶段，而非一律压暗 */
    function setHighlight(keepIds, withContext) {
      var keep = null;
      if (keepIds && keepIds.length) keep = {};
      if (keep) keepIds.forEach(function (id) { keep[id] = true; });
      linkEls.forEach(function (L) {
        L.el.classList.remove("hl", "ctx", "dim");
        if (!keep) return;
        if (keep[L.from] && keep[L.to]) L.el.classList.add("hl");
        else if (withContext && (keep[L.from] || keep[L.to])) L.el.classList.add("ctx");
        else L.el.classList.add("dim");
      });
      Object.keys(nodeEls).forEach(function (id) {
        nodeEls[id].classList.remove("dim");
        if (keep && !keep[id]) nodeEls[id].classList.add("dim");
      });
    }
    function neighborsOf(id) {
      var set = [id];
      linkEls.forEach(function (L) {
        if (L.from === id) set.push(L.to);
        if (L.to === id) set.push(L.from);
      });
      return set;
    }

    /* 执行回放：按拓扑序（ComfyUI 真实执行顺序）逐节点点亮，
       入边显示数据流入动画，已播连线保持流动，未到节点压暗 */
    var pbActive = false, pbIdx = -1;
    var pbSeq = (function () {
      var indeg = {}, i;
      graph.nodes.forEach(function (n) { indeg[n.id] = 0; });
      linkEls.forEach(function (L) { if (indeg[L.to] !== undefined) indeg[L.to]++; });
      var q = graph.nodes.filter(function (n) { return indeg[n.id] === 0; }).map(function (n) { return n.id; });
      var seq = [];
      while (q.length) {
        var id = q.shift();
        seq.push(id);
        linkEls.forEach(function (L) {
          if (L.from === id && indeg[L.to] !== undefined) {
            indeg[L.to]--;
            if (indeg[L.to] === 0) q.push(L.to);
          }
        });
      }
      /* 容错：特殊节点可能成环（如反馈回路），剩余的按声明顺序追加 */
      graph.nodes.forEach(function (n) { if (seq.indexOf(n.id) < 0) seq.push(n.id); });
      return seq;
    })();
    function pbApply(idx) {
      pbIdx = idx;
      var done = {}, k;
      for (k = 0; k < idx; k++) done[pbSeq[k]] = true;
      var cur = pbSeq[idx];
      linkEls.forEach(function (L) {
        L.el.classList.remove("play-pending", "play-in", "play-done");
        L.flow.classList.remove("play-pending", "play-in", "play-done");
        if (L.to === cur && done[L.from]) { L.el.classList.add("play-in"); L.flow.classList.add("play-in"); }
        else if (done[L.from] && done[L.to]) { L.el.classList.add("play-done"); L.flow.classList.add("play-done"); }
        else { L.el.classList.add("play-pending"); L.flow.classList.add("play-pending"); }
      });
      Object.keys(nodeEls).forEach(function (id) {
        var el = nodeEls[id];
        el.classList.remove("play-pending", "play-active", "play-done");
        el.classList.add(id === cur ? "play-active" : (done[id] ? "play-done" : "play-pending"));
      });
    }
    function pbEnter() {
      pbActive = true;
      linkEls.forEach(function (L) { L.el.classList.remove("hl", "ctx", "dim"); });
      Object.keys(nodeEls).forEach(function (id) { nodeEls[id].classList.remove("dim", "selected"); });
      pbApply(0);
      if (opts.onPlaybackChange) opts.onPlaybackChange(true);
    }
    function pbExit() {
      if (!pbActive) return;
      pbActive = false; pbIdx = -1;
      linkEls.forEach(function (L) {
        L.el.classList.remove("play-pending", "play-in", "play-done");
        L.flow.classList.remove("play-pending", "play-in", "play-done");
      });
      Object.keys(nodeEls).forEach(function (id) {
        nodeEls[id].classList.remove("play-pending", "play-active", "play-done");
      });
      if (opts.onPlaybackChange) opts.onPlaybackChange(false);
    }

    /* 工具栏 */
    var toolbar = document.createElement("div");
    toolbar.className = "graph-toolbar";
    /* 💬 节点一句话备注开关（状态记忆，默认开） */
    var showNotes = true;
    try { showNotes = localStorage.getItem("cvgShowNotes") !== "0"; } catch (e) {}
    var noteBtn = document.createElement("button");
    noteBtn.className = "gt-btn gt-toggle" + (showNotes ? " on" : "");
    noteBtn.textContent = "💬";
    noteBtn.title = "节点一句话备注：开/关";
    noteBtn.addEventListener("click", function () {
      showNotes = !showNotes;
      noteBtn.classList.toggle("on", showNotes);
      svg.classList.toggle("hide-notes", !showNotes);
      try { localStorage.setItem("cvgShowNotes", showNotes ? "1" : "0"); } catch (e) {}
    });
    toolbar.appendChild(noteBtn);
    if (!showNotes) svg.classList.add("hide-notes");
    ["+", "−", "⤢"].forEach(function (label, idx) {
      var b = document.createElement("button");
      b.className = "gt-btn"; b.textContent = label;
      b.title = ["放大", "缩小", "适配视图"][idx];
      b.addEventListener("click", function () {
        if (idx === 0) zoomBy(0.8); else if (idx === 1) zoomBy(1.25); else fit();
      });
      toolbar.appendChild(b);
    });
    container.appendChild(svg);
    container.appendChild(toolbar);

    var hint = document.createElement("div");
    hint.className = "graph-hint";
    hint.textContent = "🖱 拖拽平移 · 滚轮缩放 · 点击节点查看说明";
    container.appendChild(hint);

    /* 详情面板 */
    var detail = document.createElement("div");
    detail.className = "graph-detail";
    container.appendChild(detail);

    /* 详情卡整页自由拖动/缩放：fixed 挂 body（避开 .page 动画 transform 让 fixed 失效的坑），位置+尺寸记忆 */
    (function () {
      /* 挂到 body：带 transform 的祖先（如 .page 入场动画 fill both）会把 fixed 变成相对内容定位，导致滚动后面板跑出视野 */
      document.querySelectorAll("body > .graph-detail").forEach(function (el) { el.remove(); });
      document.body.appendChild(detail);
      function clampX(x) { return Math.min(Math.max(6, x), window.innerWidth - 120); }
      function clampY(y) { return Math.min(Math.max(6, y), window.innerHeight - 48); }
      function toViewport() { /* right 锚定默认位 → left/top，统一拖动/缩放坐标系 */
        var r = detail.getBoundingClientRect();
        detail.style.left = r.left + "px"; detail.style.top = r.top + "px"; detail.style.right = "auto";
      }
      /* 恢复上次位置；超出现视口（换窗口/缩放）时夹紧回视野内 */
      try {
        var sp = JSON.parse(localStorage.getItem("cvgDetailPos") || "null");
        if (sp && sp.x != null && sp.y != null) { detail.style.left = clampX(sp.x) + "px"; detail.style.top = clampY(sp.y) + "px"; detail.style.right = "auto"; }
      } catch (e) {}
      /* 恢复上次尺寸（宽必选，高可选） */
      try {
        var ss = JSON.parse(localStorage.getItem("cvgDetailSize") || "null");
        if (ss && ss.w >= 280) {
          detail.style.width = Math.round(ss.w) + "px";
          if (ss.h >= 180) { detail.style.height = Math.round(ss.h) + "px"; detail.style.maxHeight = "none"; }
        }
      } catch (e) {}
      window.addEventListener("resize", function () {
        if (!detail.style.left) return;
        detail.style.left = clampX(parseFloat(detail.style.left)) + "px";
        detail.style.top = clampY(parseFloat(detail.style.top)) + "px";
      });

      /* 拖动：window 级监听 + 抓握点偏移，抓哪里都不会跳，指针移出面板也不丢事件 */
      var drag = null;
      detail.addEventListener("pointerdown", function (e) {
        var h = e.target.closest && e.target.closest(".gd-head");
        if (!h || e.target.closest(".gd-close, a, button, summary")) return;
        if (!detail.style.left) toViewport();
        var r = detail.getBoundingClientRect();
        drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        detail.classList.add("dragging");
        e.preventDefault();
      });
      window.addEventListener("pointermove", function (e) {
        if (!drag) return;
        detail.style.left = clampX(e.clientX - drag.dx) + "px";
        detail.style.top = clampY(e.clientY - drag.dy) + "px";
        detail.style.right = "auto";
      });
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      function endDrag() {
        if (!drag) return;
        drag = null;
        detail.classList.remove("dragging");
        try { localStorage.setItem("cvgDetailPos", JSON.stringify({ x: parseFloat(detail.style.left), y: parseFloat(detail.style.top) })); } catch (err) {}
      }

      /* 缩放：左下角手柄，左右调宽（左边缘跟随，右边缘不动）、上下调高，localStorage 记忆 */
      var rs = document.createElement("div");
      rs.className = "gd-rsz";
      rs.title = "拖拽调整大小：左右调宽 · 上下调高";
      detail.appendChild(rs);
      var rz = null;
      rs.addEventListener("pointerdown", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (!detail.style.left) toViewport();
        var r = detail.getBoundingClientRect();
        rz = { x: e.clientX, y: e.clientY, w: r.width, h: r.height, l: r.left, t: r.top };
        detail.classList.add("resizing");
        function mv(ev) {
          if (!rz) return;
          var nw = Math.min(Math.max(280, rz.w - (ev.clientX - rz.x)), window.innerWidth - 12);
          var nh = Math.min(Math.max(180, rz.h + (ev.clientY - rz.y)), window.innerHeight - 12);
          detail.style.left = clampX(rz.l + (rz.w - nw)) + "px";
          detail.style.top = rz.t + "px";
          detail.style.right = "auto";
          detail.style.width = Math.round(nw) + "px";
          detail.style.height = Math.round(nh) + "px";
          detail.style.maxHeight = "none";
        }
        function up() {
          rz = null;
          detail.classList.remove("resizing");
          window.removeEventListener("pointermove", mv);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
          try { localStorage.setItem("cvgDetailSize", JSON.stringify({ w: parseFloat(detail.style.width), h: parseFloat(detail.style.height) || 0 })); } catch (err) {}
        }
        window.addEventListener("pointermove", mv);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      });
      detail.__rsz = rs; /* showRichDetail 重建 innerHTML 后需回挂 */

      /* 路由切换后原图容器已被移除：清理挂在 body 上的孤儿面板 */
      window.addEventListener("hashchange", function () {
        setTimeout(function () { if (!container.isConnected) detail.remove(); }, 0);
      });
    })();

    /* 画布高度手动调整：拖底部边条（260px ~ 92vh），localStorage 记忆 */
    (function () {
      var rs = document.createElement("div");
      rs.className = "graph-rsz";
      rs.title = "上下拖拽调整画布高度";
      container.appendChild(rs);
      var saved = 0;
      try { saved = parseFloat(localStorage.getItem("cvgHeight")) || 0; } catch (e) {}
      if (saved >= 260) { container.classList.add("sized"); container.style.height = Math.round(saved) + "px"; }
      rs.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        var startY = e.clientY, h0 = container.getBoundingClientRect().height;
        rs.classList.add("active");
        function mv(ev) {
          var nh = Math.max(260, Math.min(window.innerHeight * 0.92, h0 + (ev.clientY - startY)));
          container.classList.add("sized");
          container.style.height = Math.round(nh) + "px";
          try { localStorage.setItem("cvgHeight", String(Math.round(nh))); } catch (err) {}
        }
        function up() {
          rs.classList.remove("active");
          window.removeEventListener("pointermove", mv);
          window.removeEventListener("pointerup", up);
        }
        window.addEventListener("pointermove", mv);
        window.addEventListener("pointerup", up);
      });
    })();

    function showDetail(node) {
      showRichDetail(detail, node, function () {
        svg.querySelectorAll(".g-node.selected").forEach(function (el) { el.classList.remove("selected"); });
        setHighlight(null);
        if (opts.onNodeClick) opts.onNodeClick(null);  /* 关详情 = 取消面板侧聚焦 */
      }, opts.notes);
    }

    /* 平移缩放 */
    var vb = { x: fullVB.x, y: fullVB.y, w: fullVB.w, h: fullVB.h };
    function applyVB() { svg.setAttribute("viewBox", vb.x + " " + vb.y + " " + vb.w + " " + vb.h); }
    function zoomBy(f) {
      var cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
      vb.w *= f; vb.h *= f;
      vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2;
      applyVB();
    }
    function fit() { vb = { x: fullVB.x, y: fullVB.y, w: fullVB.w, h: fullVB.h }; applyVB(); }

    svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var rect = svg.getBoundingClientRect();
      var px = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
      var py = vb.y + (e.clientY - rect.top) / rect.height * vb.h;
      var f = e.deltaY > 0 ? 1.12 : 0.89;
      vb.w *= f; vb.h *= f;
      vb.x = px - (px - vb.x) * f; vb.y = py - (py - vb.y) * f;
      applyVB();
    }, { passive: false });

    var panning = false, start = null;
    svg.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".g-node")) return;
      panning = true; start = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
      svg.classList.add("panning");
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    });
    svg.addEventListener("pointermove", function (e) {
      if (!panning) return;
      try { var sel = window.getSelection(); if (sel.rangeCount) sel.removeAllRanges(); } catch (err) {}
      var rect = svg.getBoundingClientRect();
      var kx = vb.w / rect.width, ky = vb.h / rect.height;
      vb.x = start.vx - (e.clientX - start.x) * kx;
      vb.y = start.vy - (e.clientY - start.y) * ky;
      applyVB();
    });
    svg.addEventListener("pointerup", function () { panning = false; svg.classList.remove("panning"); });

    /* 节点拖动：按住节点自由移动位置，连线实时跟随；位移超过 4px 记为拖动，
       拖完存 localStorage（同构图下次打开自动恢复），并吞掉释放时的 click 防止误开详情 */
    var dragNode = null, dragMoved = false, dragJustMoved = false;
    svg.addEventListener("pointerdown", function (e) {
      var g = e.target.closest && e.target.closest(".g-node");
      if (!g) return;
      var n = nmap[g.getAttribute("data-nid")];
      if (!n) return;
      var rect = svg.getBoundingClientRect();
      dragNode = { n: n, el: g, sx: e.clientX, sy: e.clientY, x0: n.x, y0: n.y, kx: vb.w / rect.width, ky: vb.h / rect.height };
      dragMoved = false;
      try { g.setPointerCapture(e.pointerId); } catch (err) {} /* 捕获到节点组本身：click 仍落在 .g-node 内，不会丢失点击详情 */
    });
    svg.addEventListener("pointermove", function (e) {
      if (!dragNode) return;
      if (!dragMoved && Math.abs(e.clientX - dragNode.sx) + Math.abs(e.clientY - dragNode.sy) > 4) {
        dragMoved = true;
        svg.classList.add("nodedragging");
        try { window.getSelection().removeAllRanges(); } catch (err) {} /* 清掉拖拽瞬间可能已产生的文字选中 */
      }
      if (!dragMoved) return;
      dragNode.n.x = Math.round(dragNode.x0 + (e.clientX - dragNode.sx) * dragNode.kx);
      dragNode.n.y = Math.round(dragNode.y0 + (e.clientY - dragNode.sy) * dragNode.ky);
      dragNode.el.setAttribute("transform", "translate(" + dragNode.n.x + "," + dragNode.n.y + ")");
      (linksByNode[dragNode.n.id] || []).forEach(function (L) {
        var d = linkPath(graph, nmap, L.lk);
        if (d) { L.el.setAttribute("d", d); L.flow.setAttribute("d", d); }
      });
    });
    function endNodeDrag() {
      if (!dragNode) return;
      var moved = dragMoved;
      dragNode = null;
      svg.classList.remove("nodedragging");
      if (moved) {
        dragJustMoved = true;
        var pos = {};
        graph.nodes.forEach(function (n) { pos[n.id] = [n.x, n.y]; });
        try { localStorage.setItem(posLSKey, JSON.stringify(pos)); } catch (err) {}
      }
    }
    svg.addEventListener("pointerup", endNodeDrag);
    svg.addEventListener("pointercancel", endNodeDrag);

    /* 节点点击：高亮相邻链路 + 详情（回放中点击则先退出回放） */
    svg.addEventListener("click", function (e) {
      if (dragJustMoved) { dragJustMoved = false; return; } /* 刚拖完节点：吞掉这次 click */
      var g = e.target.closest(".g-node");
      if (!g) {
        detail.classList.remove("open");
        pbExit();
        setHighlight(null);
        svg.querySelectorAll(".g-node.selected").forEach(function (el) { el.classList.remove("selected"); });
        if (opts.onNodeClick) opts.onNodeClick(null);
        return;
      }
      pbExit();
      var id = g.getAttribute("data-nid");
      var node = nmap[id];
      svg.querySelectorAll(".g-node.selected").forEach(function (el) { el.classList.remove("selected"); });
      g.classList.add("selected");
      setHighlight(neighborsOf(id));
      if (node) showDetail(node);
      if (opts.onNodeClick) opts.onNodeClick(node);
    });

    svg.addEventListener("dblclick", function (e) {
      if (e.target.closest(".g-node")) return;
      fit();
    });

    return {
      fit: fit, svg: svg, highlight: setHighlight, neighborsOf: neighborsOf,
      playback: {
        seq: pbSeq,
        isActive: function () { return pbActive; },
        index: function () { return pbIdx; },
        enter: pbEnter,
        apply: pbApply,
        exit: pbExit
      }
    };
  }

  window.ComfyGraph = {
    render: render,
    typeColor: typeColor,
    TYPE_COLORS: TYPE_COLORS,
    CAT_COLORS: CAT_COLORS,
    CAT_LABELS: CAT_LABELS
  };

  /* ============================================================
     节点真实结构 mock 渲染 + 富详情弹窗
     ============================================================ */

  function esc2(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* 单节点结构 mock：与画布节点同构，端口/控件行可点击 */
  function renderNodeMock(container, node, opts) {
    opts = opts || {};
    container.classList.add("np-mock-wrap");
    var lay = computeLayout(node);
    var color = CAT_COLORS[node.cat] || "#647088";
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "-2 -2 " + (lay.w + 4) + " " + (lay.h + 4));
    svg.setAttribute("class", "np-mock");
    var help = window.WIDGET_HELP;
    var inner = "";

    /* 输入端口行 */
    var inputs = node.inputs || [], outputs = node.outputs || [];
    var rowMax = Math.max(inputs.length, outputs.length);
    for (var i = 0; i < rowMax; i++) {
      var y = HEADER_H + i * PORT_H;
      var inp = inputs[i], outp = outputs[i];
      if (inp) {
        var zh = help ? help.typeZh(inp.type) : "";
        inner += '<g class="mock-row" data-kind="input" data-idx="' + i + '" title="' + esc2(inp.name + " · " + (zh || inp.type || "")) + '">'
          + '<rect class="mock-row-hl" x="1" y="' + (y + 1.5) + '" width="' + (lay.w - 2) + '" height="' + (PORT_H - 3) + '" rx="4" fill="transparent" stroke="transparent"/>'
          + '<circle cx="0" cy="' + (y + PORT_H / 2 + 1) + '" r="4.5" fill="' + typeColor(inp.type) + '" stroke="#101218" stroke-width="1.5"/>'
          + '<text class="g-port-text" x="9" y="' + (y + PORT_H / 2 + 4.5) + '">' + esc2(inp.name) + "</text></g>";
      }
      if (outp) {
        var y2 = HEADER_H + i * PORT_H;
        var ot = outp.type || outp.name || "";
        var ozh = help ? help.typeZh(ot) : "";
        inner += '<g class="mock-row" data-kind="output" data-idx="' + i + '" title="' + esc2((outp.name || ot) + " · " + (ozh || ot)) + '">'
          + '<rect class="mock-row-hl" x="1" y="' + (y2 + 1.5) + '" width="' + (lay.w - 2) + '" height="' + (PORT_H - 3) + '" rx="4" fill="transparent" stroke="transparent"/>'
          + '<circle cx="' + lay.w + '" cy="' + (y2 + PORT_H / 2 + 1) + '" r="4.5" fill="' + typeColor(ot) + '" stroke="#101218" stroke-width="1.5"/>'
          + '<text class="g-port-text" x="' + (lay.w - 9) + '" y="' + (y2 + PORT_H / 2 + 4.5) + '" text-anchor="end" fill="' + typeColor(ot) + '">' + esc2(ot) + "</text></g>";
      }
    }
    /* 控件行 */
    var wy = HEADER_H + rowMax * PORT_H + 4;
    (node.widgets || []).forEach(function (wv, wi) {
      var wyy = wy + wi * WIDGET_H;
      inner += '<g class="mock-row" data-kind="widget" data-idx="' + wi + '" title="' + esc2(wv) + '">'
        + '<rect class="mock-row-hl" x="1" y="' + (wyy - 1) + '" width="' + (lay.w - 2) + '" height="' + WIDGET_H + '" rx="4" fill="transparent" stroke="transparent"/>'
        + '<rect x="8" y="' + wyy + '" width="' + (lay.w - 16) + '" height="' + (WIDGET_H - 4) + '" rx="4" fill="#141724" stroke="#2c3245"/>'
        + '<text class="g-widget-text" x="' + (lay.w / 2) + '" y="' + (wyy + 12.5) + '" text-anchor="middle">' + esc2(wv) + "</text></g>";
    });

    /* 外壳（放在最上层线框之下） */
    var shell = '<rect class="g-node-body" width="' + lay.w + '" height="' + lay.h + '" rx="9" fill="#1b1e2b" stroke="#3a4157" stroke-width="1"/>'
      + '<path d="M 0 9 A 9 9 0 0 1 9 0 L ' + (lay.w - 9) + ' 0 A 9 9 0 0 1 ' + lay.w + ' 9 L ' + lay.w + ' ' + HEADER_H + ' L 0 ' + HEADER_H + ' Z" fill="' + color + '" opacity="0.92"/>'
      + '<rect x="0" y="' + HEADER_H + '" width="' + lay.w + '" height="2.5" fill="' + color + '" opacity="0.5"/>'
      + '<text class="g-node-title" x="' + (lay.w / 2) + '" y="17.5" text-anchor="middle">' + esc2(node.title) + "</text>";
    svg.innerHTML = shell + inner;
    container.appendChild(svg);

    var hint = document.createElement("div");
    hint.className = "mock-hint";
    hint.textContent = "👆 点击节点上的端口或控件，右侧详情自动展开";
    container.appendChild(hint);

    svg.addEventListener("click", function (e) {
      var row = e.target.closest(".mock-row");
      if (!row) return;
      svg.querySelectorAll(".mock-row.flash").forEach(function (r) { r.classList.remove("flash"); });
      row.classList.add("flash");
      if (opts.onSelect) opts.onSelect(row.getAttribute("data-kind"), parseInt(row.getAttribute("data-idx"), 10));
    });
    return { lay: lay };
  }

  /* 富详情弹窗（用于工作流图与节点包页共用） */
  function typeChipHtml(t) {
    var zh = window.WIDGET_HELP ? window.WIDGET_HELP.typeZh(t) : "";
    return '<span class="type-chip t-' + esc2(String(t || "DEFAULT").toUpperCase()) + '">' + esc2(t) + "</span>" +
      (zh ? '<span class="type-zh">' + esc2(zh) + "</span>" : "");
  }

  function paramRowsHtml(params) {
    var html = "";
    (params || []).forEach(function (p) {
      html += '<div class="param-row"><div class="param-head">'
        + '<span class="param-name">' + esc2(p.name) + "</span>"
        + (p.kind ? '<span class="param-kind">' + esc2(p.kind) + "</span>" : "")
        + (p.default !== undefined && p.default !== "" ? '<span class="param-default">默认 ' + esc2(p.default) + "</span>" : "")
        + "</div>"
        + (p.desc ? '<div class="param-desc">' + esc2(p.desc) + "</div>" : "");
      if (p.options && p.options.length) {
        html += '<div class="param-opts">';
        p.options.forEach(function (o) {
          var v = Array.isArray(o) ? o[0] : o.value;
          var d = Array.isArray(o) ? o[1] : o.desc;
          html += '<div class="param-opt"><span class="opt-v">' + esc2(v) + '</span><span class="opt-d">' + esc2(d) + "</span></div>";
        });
        html += "</div>";
      }
      html += "</div>";
    });
    return html;
  }

  /* 从 widgets 字符串 + 全局参数库推导参数解释 */
  function deriveParams(node) {
    var out = [];
    var help = window.WIDGET_HELP;
    if (node.params && node.params.length) {
      node.params.forEach(function (p) { out.push(p); });
      return out;
    }
    (node.widgets || []).forEach(function (wv) {
      var val = String(wv);
      var nameGuess = val;
      /* widget 值形如 "euler" 或 "30" 或 "sd_xl_base_1.0.safetensors"，按值反查参数库 */
      var hit = null;
      if (help) {
        ["sampler_name", "scheduler", "ckpt_name", "unet_name", "lora_name", "vae_name", "control_net_name", "upscale", "guidance", "denoise", "cfg", "steps", "seed", "width", "height", "fps", "length", "batch_size", "strength", "factor"].some(function (k) {
          /* 采样器/调度器常直接以值出现 */
          var kh = help.get(k);
          if (!kh) return false;
          if (kh.options && kh.options.some(function (o) { return String(Array.isArray(o) ? o[0] : o.value).toLowerCase() === val.toLowerCase(); })) { hit = { name: kh.zh, desc: "取值 " + val + "：" + (kh.desc || ""), kind: kh.options ? "下拉选择" : "参数" }; return true; }
          return false;
        });
        if (!hit) {
          if (/^\d+$/.test(val)) { hit = { name: "数值参数", desc: "该节点的一个数值设置（取值 " + val + "）。具体含义见下方节点作用说明。", kind: "整数" }; }
          else if (/^(euler|ddim|uni_pc|dpm|lcm|res_)/i.test(val)) { hit = { name: "采样算法", desc: "取值 " + val + "：" + (help.get("sampler_name") || {}).desc, kind: "下拉选择" }; }
          else if (/\.(safetensors|ckpt|pt|gguf|onnx|pth|bin)$/i.test(val)) { hit = { name: "模型文件", desc: "取值 " + val + "：models 对应子目录中的模型文件。", kind: "下拉选择" }; }
          else if (/^\d+\s*[x×]\s*\d+$/i.test(val)) { hit = { name: "分辨率", desc: "图像或视频的宽高设置：" + val + "。注意需为 8 的倍数。", kind: "整数" }; }
        }
      }
      if (!hit) hit = { name: nameGuess, desc: "", kind: "" };
      out.push({ name: val, kind: hit.kind || "参数", desc: hit.desc || "", default: "", options: hit.options || [] });
    });
    return out;
  }

  /* 富详情面板 HTML（工作流图点击节点时用） */
  function showRichDetail(panel, node, closeCb, notes) {
    var help = window.WIDGET_HELP;
    var color = CAT_COLORS[node.cat] || "#647088";
    /* 头部（拖把手）单独存放：固定在面板顶部，不随内容滚动 */
    var head = '<div class="gd-head">' + catDot2(node.cat) + "<h4>" + esc2(node.title) + "</h4></div>";
    var html = "";
    html += '<div class="gd-cat" style="margin-bottom:8px"><span style="color:' + color + ';font-size:11.5px">' + esc2(CAT_LABELS[node.cat] || node.cat || "节点") + '</span></div>';

    /* 跳转到第二部分节点包详解（由 app 注册解析器） */
    if (window.ComfyGraph.detailLinkResolver) {
      var DL = window.ComfyGraph.detailLinkResolver(node.title || node.name || "");
      if (DL) html += '<a class="gd-pkg-link" href="' + esc2(DL.href) + '">📖 节点包详解：' + esc2(DL.label) + " →</a>";
    }

    /* 作用（默认展开） */
    html += '<div class="gd-role"><b style="color:#dfe4f2">作用：</b>' + esc2(node.brief || "") +
      (node.desc ? "<br>" + esc2(node.desc) : "") + "</div>";
    /* 在本工作流中：site 层 nodeAnalysis[].detail 经调用方传入，比通用作用更贴合当前图 */
    var wfNote = notes && notes[node.id];
    if (wfNote) html += '<div class="gd-note"><b>📍 在本工作流中</b>' + esc2(wfNote) + "</div>";

    /* 输入 */
    var inputs = node.inputs || [];
    if (inputs.length) {
      html += '<details class="gd-sec-block"><summary>⬅ 输入 <span class="sec-count">' + inputs.length + "</span></summary><div class=\"sec-body\">";
      inputs.forEach(function (p, i) {
        var zh = help ? help.typeZh(p.type) : "";
        html += '<details class="io-item"><summary>' + typeChipHtml(p.type) + '<span class="io-name">' + esc2(p.name) + "</span>" +
          (zh ? '<span class="io-zh">' + esc2(zh) + "</span>" : "") + "</summary><div class=\"io-body\">";
        if (p.from) html += '<div><span class="io-cap">典型上游</span>' + esc2(p.from) + "</div>";
        if (p.desc) html += '<div style="margin-top:4px"><span class="io-cap">说明</span>' + esc2(p.desc) + "</div>";
        if (!p.from && !p.desc) html += '<div style="color:var(--faint)">接收同类型数据的输入。</div>';
        html += "</div></details>";
      });
      html += "</div></details>";
    }

    /* 输出 */
    var outputs = node.outputs || [];
    if (outputs.length) {
      html += '<details class="gd-sec-block"><summary>➡ 输出 <span class="sec-count">' + outputs.length + "</span></summary><div class=\"sec-body\">";
      outputs.forEach(function (o) {
        var zh = help ? help.typeZh(o.type || o.name) : "";
        html += '<details class="io-item"><summary>' + typeChipHtml(o.type || o.name) +
          (zh ? '<span class="io-zh">' + esc2(zh) + "</span>" : "") + "</summary><div class=\"io-body\">";
        if (o.to) html += '<div><span class="io-cap">典型下游</span>' + esc2(o.to) + "</div>";
        if (o.desc) html += '<div style="margin-top:4px"><span class="io-cap">说明</span>' + esc2(o.desc) + "</div>";
        if (!o.to && !o.desc) html += '<div style="color:var(--faint)">向下游传递该类型的数据。</div>';
        html += "</div></details>";
      });
      html += "</div></details>";
    }

    /* 参数 */
    var params = deriveParams(node);
    if (params.length) {
      html += '<details class="gd-sec-block"><summary>🎛 参数 <span class="sec-count">' + params.length + "</span></summary><div class=\"sec-body\">";
      html += paramRowsHtml(params);
      html += "</div></details>";
    }

    /* 内容包进滚动层：面板本体不滚动，头部拖把、关闭按钮与左下角缩放手柄常驻 */
    panel.innerHTML = '<span class="gd-close" title="关闭">✕</span>' + head + '<div class="gd-scroll">' + html + "</div>";
    if (panel.__rsz) panel.appendChild(panel.__rsz);
    panel.classList.add("open");
    panel.querySelector(".gd-close").addEventListener("click", function () { panel.classList.remove("open"); if (closeCb) closeCb(); });
  }

  function catDot2(cat) { return '<span class="cat-dot cat-' + esc2(cat) + '"></span>'; }

  window.ComfyGraph.renderNodeMock = renderNodeMock;
  window.ComfyGraph.showRichDetail = showRichDetail;
  window.ComfyGraph.deriveParams = deriveParams;
  window.ComfyGraph.paramRowsHtml = paramRowsHtml;
  window.ComfyGraph.typeChipHtml = typeChipHtml;
  window.ComfyGraph.esc2 = esc2;
})();
