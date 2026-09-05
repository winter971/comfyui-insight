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
    s += '</g>';
    return s;
  }

  function render(container, graph, opts) {
    opts = opts || {};
    container.classList.add("graph-shell");
    var nmap = resolve(graph);

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
      linkEls.push({ el: p, from: lk.from, to: lk.to });
    });
    svg.appendChild(gLinks);

    var nodeEls = {};
    graph.nodes.forEach(function (n) {
      var wrap = document.createElementNS(svgNS, "g");
      wrap.innerHTML = renderNodeSVG(graph, n, nmap);
      var el = wrap.firstChild;
      nodeEls[n.id] = el;
      gNodes.appendChild(el);
    });
    svg.appendChild(gNodes);

    /* 高亮系统：keepIds 为要聚焦的节点 id 数组；null 表示清除 */
    function setHighlight(keepIds) {
      var keep = null;
      if (keepIds && keepIds.length) keep = {};
      if (keep) keepIds.forEach(function (id) { keep[id] = true; });
      linkEls.forEach(function (L) {
        L.el.classList.remove("hl", "dim");
        if (!keep) return;
        if (keep[L.from] && keep[L.to]) L.el.classList.add("hl");
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

    /* 工具栏 */
    var toolbar = document.createElement("div");
    toolbar.className = "graph-toolbar";
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

    function showDetail(node) {
      showRichDetail(detail, node, function () {
        svg.querySelectorAll(".g-node.selected").forEach(function (el) { el.classList.remove("selected"); });
        setHighlight(null);
      });
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
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!panning) return;
      var rect = svg.getBoundingClientRect();
      var kx = vb.w / rect.width, ky = vb.h / rect.height;
      vb.x = start.vx - (e.clientX - start.x) * kx;
      vb.y = start.vy - (e.clientY - start.y) * ky;
      applyVB();
    });
    svg.addEventListener("pointerup", function () { panning = false; svg.classList.remove("panning"); });

    /* 节点点击：高亮相邻链路 + 详情 */
    svg.addEventListener("click", function (e) {
      var g = e.target.closest(".g-node");
      if (!g) {
        detail.classList.remove("open");
        setHighlight(null);
        svg.querySelectorAll(".g-node.selected").forEach(function (el) { el.classList.remove("selected"); });
        return;
      }
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

    return { fit: fit, svg: svg, highlight: setHighlight, neighborsOf: neighborsOf };
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
  function showRichDetail(panel, node, closeCb) {
    var help = window.WIDGET_HELP;
    var color = CAT_COLORS[node.cat] || "#647088";
    var html = '<span class="gd-close" title="关闭">✕</span>';
    html += '<div class="gd-head">' + catDot2(node.cat) + "<h4>" + esc2(node.title) + '</h4></div>';
    html += '<div class="gd-cat" style="margin-bottom:8px"><span style="color:' + color + ';font-size:11.5px">' + esc2(CAT_LABELS[node.cat] || node.cat || "节点") + '</span></div>';

    /* 跳转到第二部分节点包详解（由 app 注册解析器） */
    if (window.ComfyGraph.detailLinkResolver) {
      var DL = window.ComfyGraph.detailLinkResolver(node.title || node.name || "");
      if (DL) html += '<a class="gd-pkg-link" href="' + esc2(DL.href) + '">📖 节点包详解：' + esc2(DL.label) + " →</a>";
    }

    /* 作用（默认展开） */
    html += '<div class="gd-role"><b style="color:#dfe4f2">作用：</b>' + esc2(node.brief || "") +
      (node.desc ? "<br>" + esc2(node.desc) : "") + "</div>";

    /* 输入 */
    var inputs = node.inputs || [];
    if (inputs.length) {
      html += '<details class="gd-sec-block" open><summary>⬅ 输入 <span class="sec-count">' + inputs.length + "</span></summary><div class=\"sec-body\">";
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
      html += '<details class="gd-sec-block" open><summary>🎛 参数 <span class="sec-count">' + params.length + "</span></summary><div class=\"sec-body\">";
      html += paramRowsHtml(params);
      html += "</div></details>";
    }

    panel.innerHTML = html;
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
