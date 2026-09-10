/* ============================================================
   wfpanel.js — 工作流详情「三合一联动面板」通用实现
   数据流 / 阶段拆解 / 逐节点分析 三个 tab + 播放数据流 + 与节点图双向联动
   被 app.js（三 · 工作流图鉴）与 page-civitai.js（四 · 真实工作流库）共用
   依赖: nodegraph.js（window.ComfyGraph）
   数据形状 w: {
     graph: ComfyGraph 图对象（nodes/links，节点含 id/title/cat/brief/widgets）
     flow:  [分步数据流讲解字符串]
     stages: [{ name, desc, nodes: [节点id] }]
     nodeAnalysis: [{ node: 节点id, detail: 在本工作流中的分析, paramsText: 图中参数串 }]
   }
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function catDot(cat) { return '<span class="cat-dot cat-' + esc(cat) + '"></span>'; }
  function clampIdx(i, n) { return Math.max(0, Math.min(n - 1, i)); }

  /* 面板三个 tab 通用的步进控制条：上一步 / 下一步 / 重置 + 当前聚焦位置 */
  function stepBarHtml(id) {
    return '<div class="wf-stepbar" id="' + id + '">'
      + '<button class="wf-step-btn" data-dir="prev" title="上一步">◀ 上一步</button>'
      + '<button class="wf-step-btn" data-dir="next" title="下一步">下一步 ▶</button>'
      + '<button class="wf-step-btn wf-step-reset" data-dir="reset" title="清除当前聚焦">↺ 重置</button>'
      + '<span class="wf-step-pos">未聚焦</span>'
      + "</div>";
  }

  /* ============ 面板骨架 ============ */
  function skeleton(w) {
    var nodeById = {};
    (w.graph.nodes || []).forEach(function (n) { nodeById[n.id] = n; });

    var html = "";
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
      /* 三合一联动面板：tab 切换 + 可收起 */
      + '<div class="wf-panel" id="wfPanel">'
      + '<div class="wf-tabs">'
      + '<button class="wf-tab active" data-tab="flow">🔗 数据流</button>'
      + '<button class="wf-tab" data-tab="stage">🧩 阶段拆解</button>'
      + '<button class="wf-tab" data-tab="nodes">🔬 逐节点分析</button>'
      + '<button class="wf-collapse" id="wfCollapse" title="收起/展开面板">▾ 收起</button>'
      + "</div>"
      + '<div class="wf-body" id="wfBody">'
      + '<div class="wf-tabpane active" data-pane="flow">'
      + stepBarHtml("flowBar")
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
      + stepBarHtml("stageBar")
      + '<div class="pb-sub mono" id="stageSub"></div>'
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
      + stepBarHtml("nodeBar")
      + '<div class="pb-sub mono" id="nodeSub"></div>'
      + (w.nodeAnalysis && w.nodeAnalysis.length
        ? '<div class="node-list" id="nodeList">'
          + w.nodeAnalysis.map(function (a) {
              var n = nodeById[a.node] || { title: a.node, cat: "util" };
              return '<details class="node-card" data-nid="' + esc(a.node) + '"><summary>'
                + catDot(n.cat) + '<span class="node-name">' + esc(n.title) + '</span><span class="node-brief">' + esc(n.brief || "") + '</span><span class="node-loc">📍 图中已高亮</span><span class="node-chevron">▶</span></summary>'
                + '<div class="node-body"><div class="nb-row"><div class="nb-label">在本工作流中</div><div>' + esc(a.detail) + "</div></div>"
                + (a.paramsText ? '<div class="nb-row"><div class="nb-label">图中参数</div><div class="mono" style="font-size:12.5px;color:#a5b0c8">' + esc(a.paramsText) + "</div></div>" : "")
                + nodeLinkRow(n)
                + "</div></details>";
            }).join("")
          + "</div>"
        : '<div class="pb-none" style="padding:8px 0">该工作流暂无逐节点分析。</div>')
      + "</div>"
      + "</div></div>";
    return html;
  }

  /* 节点卡「节点包详解」行：由 app.js 注入的 window.ComfyLookupNode 解析 */
  function nodeLinkRow(n) {
    if (!window.ComfyLookupNode) return "";
    var lk = window.ComfyLookupNode(n.title);
    if (!lk) return "";
    return '<div class="nb-row"><div class="nb-label">节点包详解</div><div><a href="#/nodes/' + esc(lk.pkg.id) + '" style="font-size:12.5px">📖 ' + esc(lk.pkg.name) + " · " + esc(lk.node.name) + " →</a></div></div>";
  }

  /* ============ 挂载与联动 ============ */
  /* opts: { root: 包含 skeleton 的 DOM 元素, w: 同上, notes: {节点id: 图内详情讲解} } */
  function mount(opts) {
    var root = opts.root, w = opts.w;
    if (!root || !w || !window.ComfyGraph) return null;

    var pbBar = $("#playBar", root), pbBtn = $("#pbPlay", root), pbPrev = $("#pbPrev", root), pbNext = $("#pbNext", root),
        pbReset = $("#pbReset", root), pbClose = $("#pbClose", root), pbSub = $("#pbSub", root);
    var stageSub = $("#stageSub", root), nodeSub = $("#nodeSub", root);
    var pbTimer = null, pbPlaying = false, pbStep = -1;
    function stopPbUi() {
      if (pbTimer) { clearInterval(pbTimer); pbTimer = null; }
      pbPlaying = false; pbStep = -1;
      if (pbBtn) pbBtn.textContent = "▶ 播放数据流";
      if (pbBar) pbBar.classList.remove("playing");
    }

    /* 节点图渲染 + 详情面板语境注入 */
    var wfNoteMap = opts.notes || {};
    var api = window.ComfyGraph.render($("#wfGraph", root), w.graph, {
      notes: wfNoteMap,
      onPlaybackChange: function (active) { if (!active) { stopPbUi(); panelClearAll(); } },
      onNodeClick: function (n) {
        if (n && nodeById2[n.id]) focusNode(n.id);
        else panelClearAll();  /* 点空白 / 关详情 = 全部取消聚焦 */
      }
    });
    var pbApi = api.playback;

    /* 图内节点索引 + 阶段归属（面板联动与聚焦模型的基础） */
    var nodeById2 = {};
    (w.graph.nodes || []).forEach(function (n) { nodeById2[n.id] = n; });
    var stageOf = {};
    (w.stages || []).forEach(function (s, si) {
      (s.nodes || []).forEach(function (nid) { if (stageOf[nid] === undefined) stageOf[nid] = si; });
    });

    /* 联动面板：三块内容 tab 切换 + 可收起；图交互自动切到对应 tab */
    var wfPanel = $("#wfPanel", root), wfCollapse = $("#wfCollapse", root);
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
    /* ── 统一聚焦模型：三个 tab 都有"当前聚焦"，样式一致、可步进、可重置 ── */
    var flowFocusIdx = -1, stageFocusIdx = -1, nodeFocusId = null;
    var stageLine = wfPanel ? wfPanel.querySelector(".stage-line") : null;
    var stageItems = wfPanel ? $all(".stage-line .stage-item", wfPanel) : [];
    var nodeOrder = [];
    (w.nodeAnalysis || []).forEach(function (a) { if (a && a.node && nodeById2[a.node]) nodeOrder.push(a.node); });
    function posEl(barId) { var bar = $("#" + barId, root); return bar ? bar.querySelector(".wf-step-pos") : null; }
    function setPos(barId, focused, total, unit, idx) {
      var el = posEl(barId);
      if (!el) return;
      el.textContent = focused ? "第 " + (idx + 1) + " / " + total + " " + unit : "未聚焦";
      el.classList.toggle("on", focused);
    }
    function updateStepPos() {
      setPos("flowBar", flowFocusIdx >= 0, (w.flow || []).length, "步", flowFocusIdx);
      setPos("stageBar", stageFocusIdx >= 0, (w.stages || []).length, "阶段", stageFocusIdx);
      var ni = nodeFocusId ? nodeOrder.indexOf(nodeFocusId) : -1;
      setPos("nodeBar", ni >= 0, nodeOrder.length, "节点", ni);
    }
    /* 三个 tab 顶部的"当前选中"卡：聚焦什么就地把内容显示在最开头，无需滚动列表 */
    function renderStageSub(si) {
      if (!stageSub) return;
      if (si < 0 || !w.stages[si]) { stageSub.innerHTML = ""; return; }
      var s = w.stages[si];
      var parts = (s.nodes || []).map(function (nid) { return nodeById2[nid] ? nodeById2[nid].title : nid; });
      stageSub.innerHTML = '<div class="pb-card"><div class="pb-head"><span class="pb-pos">第 ' + (si + 1) + " 阶段</span><b>" + esc(s.name) + "</b></div>"
        + '<div class="pb-row"><span class="pb-k">📖 讲解</span><span class="pb-do-text">' + esc(s.desc) + "</span></div>"
        + (parts.length ? '<div class="pb-row"><span class="pb-k">🎯 涉及节点</span><span>' + parts.map(function (t) { return '<span class="pb-d"><b>' + esc(t) + "</b></span>"; }).join("") + "</span></div>" : "")
        + "</div>";
    }
    function renderNodeSub(nid) {
      if (!nodeSub) return;
      var n = nid ? nodeById2[nid] : null;
      if (!n) { nodeSub.innerHTML = ""; return; }
      var na = null;
      (w.nodeAnalysis || []).forEach(function (a) { if (a.node === nid) na = a; });
      nodeSub.innerHTML = '<div class="pb-card"><div class="pb-head"><span class="pb-pos">节点聚焦</span><b>' + esc(n.title) + "</b></div>"
        + (na && na.detail ? '<div class="pb-row"><span class="pb-k">📖 在本工作流中</span><span class="pb-do-text">' + esc(na.detail) + "</span></div>" : "")
        + (n.brief ? '<div class="pb-row"><span class="pb-k">⚙ 通用职责</span><span class="pb-do-text">' + esc(n.brief) + "</span></div>" : "")
        + (n.widgets && n.widgets.length ? '<div class="pb-row"><span class="pb-k">🎚 图中参数</span><span class="mono">' + n.widgets.map(esc).join(" · ") + "</span></div>" : "")
        + "</div>";
    }
    function panelClearAll() {
      flowFocusIdx = -1; stageFocusIdx = -1; nodeFocusId = null;
      flowClear(); markStageItem(-1); syncChips(-1); markNodeCard(null);
      if (pbSub) pbSub.innerHTML = "";
      renderStageSub(-1);
      renderNodeSub(null);
      api.highlight(null);
      updateStepPos();
    }

    /* —— 阶段拆解：时间线卡片 ↔ 图高亮 双向联动 —— */
    function markStageItem(si) {
      stageItems.forEach(function (el) {
        el.classList.toggle("active", parseInt(el.getAttribute("data-stage"), 10) === si);
      });
    }
    function selectStage(si, opts2) {
      opts2 = opts2 || {};
      if (pbApi.isActive()) pbApi.exit();
      stageFocusIdx = (si >= 0 && w.stages[si]) ? si : -1;
      flowFocusIdx = -1; nodeFocusId = null;
      syncChips(stageFocusIdx);
      markStageItem(stageFocusIdx);
      flowClear();
      markNodeCard(null);
      if (pbSub) pbSub.innerHTML = "";
      renderNodeSub(null);
      if (stageFocusIdx < 0) api.highlight(null);
      else api.highlight((w.stages[si].nodes || []).slice(), true);
      renderStageSub(stageFocusIdx);
      updateStepPos();
      if (opts2.reveal) switchTab("stage", true);
    }
    if (stageLine) stageLine.addEventListener("click", function (e) {
      var item = e.target.closest(".stage-item");
      if (!item) return;
      var idx = parseInt(item.getAttribute("data-stage"), 10);
      if (isNaN(idx) || !w.stages[idx]) return;
      selectStage(item.classList.contains("active") ? -1 : idx);  /* 再点一次取消聚焦 */
    });

    /* —— 逐节点分析：卡片 ↔ 图 双向联动 —— */
    var nodeList = $("#nodeList", root);
    function markNodeCard(id) {
      if (!nodeList) return;
      $all(".node-card", nodeList).forEach(function (el) {
        el.classList.toggle("active", el.getAttribute("data-nid") === id);
      });
    }
    function focusNode(nid) {
      if (!nid || !nodeById2[nid]) return;
      if (pbApi.isActive()) pbApi.exit();
      nodeFocusId = nodeOrder.indexOf(nid) >= 0 ? nid : null;
      flowFocusIdx = -1; stageFocusIdx = -1;
      flowClear();
      syncChips(-1);
      markStageItem(-1);
      markNodeCard(nid);
      api.highlight(api.neighborsOf(nid));
      if (pbSub) pbSub.innerHTML = "";
      renderStageSub(-1);
      renderNodeSub(nid);
      var card = null;
      if (nodeList) $all(".node-card", nodeList).forEach(function (el) {
        if (el.getAttribute("data-nid") === nid) card = el;
      });
      if (card && !card.open) card.open = true;
      updateStepPos();
    }
    function nodeReset() {
      if (pbApi.isActive()) pbApi.exit();
      nodeFocusId = null;
      markNodeCard(null);
      api.highlight(null);
      renderNodeSub(null);
      updateStepPos();
    }
    if (nodeList) {
      nodeList.addEventListener("click", function (e) {
        var card = e.target.closest(".node-card");
        if (!card) return;
        if (e.target.closest("a")) return;  /* 卡内链接正常跳转 */
        var id = card.getAttribute("data-nid");
        if (!id || !nodeById2[id]) return;
        if (card.classList.contains("active")) { card.open = false; nodeReset(); return; }
        focusNode(id);
      });
    }

    /* 图上方阶段 chips：与面板内时间线联动 */
    var chips = $("#stageChips", root);
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
        selectStage(parseInt(b.getAttribute("data-stage"), 10), { reveal: true });
      });
    }

    /* DATA FLOW 联动：flow 文本点名了节点标题，按文本匹配建立 步骤→节点 映射 */
    var flowList = $("#flowList", root);
    var flowNodeCache = {};
    function flowStepIds(i) {
      if (flowNodeCache[i] !== undefined) return flowNodeCache[i];
      var text = (w.flow || [])[i] || "";
      var ids = [];
      (w.graph.nodes || []).forEach(function (n) {
        if (text.indexOf(n.title) >= 0) ids.push(n.id);
      });
      if (!ids.length && i > 0) ids = flowStepIds(i - 1);  /* 概念补充步沿用上一步节点 */
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
    function focusFlowStep(idx) {
      var total = (w.flow || []).length;
      if (!total) return;
      idx = clampIdx(idx, total);
      if (pbApi.isActive()) pbApi.exit();
      flowFocusIdx = idx;
      nodeFocusId = null;
      flowMark(idx);
      markNodeCard(null);
      renderNodeSub(null);
      var ids = flowStepIds(idx);
      stageFocusIdx = -1;
      syncChips(-1);
      markStageItem(-1);
      renderStageSub(-1);
      if (ids.length) {
        api.highlight(ids, true);
        var si = stageOf[ids[0]];
        if (si !== undefined) { stageFocusIdx = si; syncChips(si); markStageItem(si); renderStageSub(si); }
      }
      if (pbSub) {
        var parts = ids.map(function (id) { return nodeById2[id] ? nodeById2[id].title : id; });
        pbSub.innerHTML = '<div class="pb-card"><div class="pb-head"><span class="pb-pos">第 ' + (idx + 1) + " 步</span><b>数据流讲解</b></div>"
          + '<div class="pb-row"><span class="pb-k">📖 讲解</span><span class="pb-do-text">' + esc((w.flow || [])[idx]) + "</span></div>"
          + (parts.length ? '<div class="pb-row"><span class="pb-k">🎯 涉及节点</span><span>' + parts.map(function (t) { return '<span class="pb-d"><b>' + esc(t) + "</b></span>"; }).join("") + "</span></div>" : "")
          + "</div>";
      }
      updateStepPos();
    }
    function flowReset() {
      if (pbApi.isActive()) pbApi.exit();
      flowFocusIdx = -1; stageFocusIdx = -1;
      flowClear();
      syncChips(-1);
      markStageItem(-1);
      markNodeCard(null);
      api.highlight(null);
      if (pbSub) pbSub.innerHTML = "";
      renderStageSub(-1);
      renderNodeSub(null);
      updateStepPos();
    }
    if (flowList) {
      flowList.addEventListener("click", function (e) {
        var el = e.target.closest(".flow-step");
        if (!el) return;
        var idx = parseInt(el.getAttribute("data-fidx"), 10);
        if (el.classList.contains("active")) { flowReset(); return; }
        focusFlowStep(idx);
      });
    }

    /* —— 步进控制条：三个 tab 统一 上一步 / 下一步 / 重置 —— */
    function wireStepBar(barId, fn) {
      var bar = $("#" + barId, root);
      if (!bar) return;
      bar.addEventListener("click", function (e) {
        var b = e.target.closest(".wf-step-btn");
        if (!b) return;
        fn(b.getAttribute("data-dir"));
      });
    }
    wireStepBar("flowBar", function (dir) {
      if (dir === "reset") return flowReset();
      if (!(w.flow || []).length) return;
      focusFlowStep(flowFocusIdx < 0 ? 0 : flowFocusIdx + (dir === "next" ? 1 : -1));
    });
    wireStepBar("stageBar", function (dir) {
      if (dir === "reset") return selectStage(-1);
      if (!(w.stages || []).length) return;
      selectStage(stageFocusIdx < 0 ? 0 : stageFocusIdx + (dir === "next" ? 1 : -1));
    });
    wireStepBar("nodeBar", function (dir) {
      if (dir === "reset") return nodeReset();
      if (!nodeOrder.length) return;
      var i = nodeFocusId ? nodeOrder.indexOf(nodeFocusId) : -1;
      focusNode(nodeOrder[i < 0 ? 0 : clampIdx(i + (dir === "next" ? 1 : -1), nodeOrder.length)]);
    });

    /* 执行回放：数据流卡片 —— 每一步展示输入数据 → 加工 → 输出数据 */
    var TYPE_SHAPE = {
      MODEL: "扩散模型权重", CLIP: "文本编码器", CLIP_VISION: "视觉编码器", VAE: "VAE 编解码器",
      CONDITIONING: "文本语义向量", LATENT: "4×H/8×W/8 潜张量", IMAGE: "H×W×3 像素图", MASK: "H×W 蒙版",
      CONTROL_NET: "ControlNet 权重", UPSCALE_MODEL: "放大模型权重", STYLE_MODEL: "风格模型权重",
      VIDEO: "视频帧序列", AUDIO: "音频波形", STRING: "文本", INT: "整数", FLOAT: "小数",
      COMBO: "选项值", NUMBER: "数值", SIGMAS: "采样日程", NOISE: "噪声种子", SAMPLER: "采样器",
      GUIDER: "引导器", CFG: "引导系数", "*": "数据"
    };
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
      stageFocusIdx = si !== undefined ? si : -1;
      var fi = flowOfNode[cur];
      flowMark(fi !== undefined ? fi : -1);
      flowFocusIdx = fi !== undefined ? fi : -1;
      nodeFocusId = nodeOrder.indexOf(cur) >= 0 ? cur : null;
      markNodeCard(cur);
      renderStageSub(stageFocusIdx);
      renderNodeSub(nodeFocusId);
      updateStepPos();
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
      pbApi.exit();
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
      if (pbPlaying) {
        if (pbTimer) { clearInterval(pbTimer); pbTimer = null; }
        pbPlaying = false;
        pbBtn.textContent = "▶ 继续";
        return;
      }
      if (pbApi.isActive() && pbStep >= 0) {
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
    });

    var handle = { focusNode: focusNode, clearAll: panelClearAll, graph: api, root: root, highlight: function (ids) { api.highlight(ids); } };
    window.ComfyPanelApi = handle; /* 供精读摘要流程图的「高亮节点组」联动（后挂载者生效，即当前页面板） */
    return handle;
  }

  /* ===== AI 精读长文排版：句子切分 → 分段 → 首段直出 + 其余可折叠 + 节点名高亮 ===== */
  function digestHtml(text, types) {
    var t = String(text || "");
    if (!t) return "";
    /* 高亮词表：图上真实节点类型优先，长度降序拼 alternation，避免子串截断 */
    var names = [], seen = {};
    function add(x) { x = String(x || "").trim(); if (x.length >= 4 && !seen[x]) { seen[x] = 1; names.push(x); } }
    (types || []).forEach(add);
    ["ControlNet", "LoRA", "IPAdapter", "Turbo LoRA"].forEach(add);
    var html = esc(t);
    if (names.length) {
      names.sort(function (a, b) { return b.length - a.length; });
      var re = new RegExp("(" + names.map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "g");
      html = html.replace(re, '<b class="cv-tok">$1</b>');
    }
    /* 句子切分（保留标点），~110 字聚合一段 */
    var parts = html.split(/(。|！|？|；)/);
    var sents = [];
    for (var i = 0; i < parts.length; i += 2) {
      var s = (parts[i] + (parts[i + 1] || "")).trim();
      if (s) sents.push(s);
    }
    if (sents.length <= 1) return '<span class="cv-ai-para">' + html + "</span>";
    var paras = [], cur = "";
    for (var j = 0; j < sents.length; j++) {
      if (cur && (cur + sents[j]).length > 110) { paras.push(cur); cur = sents[j]; }
      else cur += sents[j];
    }
    if (cur) paras.push(cur);
    if (paras.length <= 1) return '<span class="cv-ai-para">' + html + "</span>";
    return '<span class="cv-ai-para">' + paras[0] + "</span>"
      + '<span class="cv-ai-more collapsed">' + paras.slice(1).map(function (p) { return '<span class="cv-ai-para">' + p + "</span>"; }).join("") + "</span>"
      + '<button class="cv-ai-toggle" type="button">展开全文 ▾</button>';
  }

  /* 折叠开关：document 级委托，第三 / 四部分通用，无需各页面手动绑定 */
  document.addEventListener("click", function (e) {
    var tog = e.target.closest && e.target.closest(".cv-ai-toggle");
    if (!tog) return;
    var more = tog.parentElement && tog.parentElement.querySelector(".cv-ai-more");
    if (!more) return;
    var collapsed = more.classList.toggle("collapsed");
    tog.textContent = collapsed ? "展开全文 ▾" : "收起 ▲";
  });

  /* ===== AI 精读双视图：横向流程图（默认）+ 文字讲解，Tab 切换 ===== */
  var FC_NO = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
  var MC_UID = 0;
  var CAT_COLORS = { load: "#b06ab3", model: "#8b5cf6", cond: "#e8a33d", latent: "#5faf5f", image: "#3d8bd6", sampler: "#2aa8b8", mask: "#8a93a8", vae: "#d9534f", clip: "#c9b34a", video: "#d4618c", audio: "#4fbf9f", util: "#647088", net: "#4cc9f0", "3d": "#b8875c" };
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function chipHtml(type, cat, id, loc) {
    var c = CAT_COLORS[cat] || "#647088";
    return '<span class="cv-fc-chip' + (loc ? " loc" : "") + '"' + (loc ? ' data-loc="' + esc(String(id)) + '"' : "")
      + ' style="color:' + c + ';border-color:' + c + '66;background:' + c + '14">' + esc(type) + "</span>";
  }

  /* ai: {s: 摘要, f: [数据流步骤], st: [{name,desc,nodes[]}]}; g: ComfyGraph（节点 type/cat/id，旁路节点 title 带 ⏸/🔇 前缀） */
  /* 宏观分支流程图：主线 = 非支线阶段大块横向排；支线（旁路/静音阶段）虚线块挂到合流阶段上方 */
  function digestBlock(ai, g) {
    var types = [], byType = {}, idNode = {};
    ((g && g.nodes) || []).forEach(function (n) {
      if (n && n.type) {
        types.push(n.type);
        if (!byType[n.type]) byType[n.type] = { cat: n.cat, id: n.id };
      }
      if (n && n.id !== undefined) idNode[String(n.id)] = n;
    });
    var textPane = '<div class="cv-digest-pane" data-pane="text" hidden>' + digestHtml(ai && ai.s, types) + "</div>";
    var st = (ai && ai.st) || [];
    if (!st.length) return legacyFlow(ai && ai.f, textPane);
    if (!byTypeKeys(byType).length) types.length = 0;

    /* 主线 / 支线划分：名字含支线词，或多数节点带 ⏸/🔇 前缀 */
    function isForkStage(s) {
      if (/支线|旁路|可选|备用|静音|二选一/.test(s.name || "")) return true;
      var ns = (s.nodes || []).filter(function (id) { var n = idNode[String(id)]; return n && /^[🔇⏸]/.test(n.title || ""); });
      return (s.nodes || []).length > 0 && ns.length * 2 >= s.nodes.length;
    }
    var main = [], forks = [];
    st.forEach(function (s, i) { (isForkStage(s) ? forks : main).push(i); });
    if (!main.length) { main = forks; forks = []; }

    var stageOf = {};
    main.forEach(function (si) { (st[si].nodes || []).forEach(function (id) { stageOf[String(id)] = si; }); });
    function anchorFor(fsi) {
      var inF = {};
      (st[fsi].nodes || []).forEach(function (id) { inF[String(id)] = 1; });
      var t = null;
      (g.links || []).some(function (lk) {
        var a = String(lk.from), b = String(lk.to);
        if (inF[a] && !inF[b] && stageOf[b] !== undefined) { t = stageOf[b]; return true; }
        return false;
      });
      if (t !== null) return t;
      var after = main.filter(function (si) { return si > fsi; });
      return after.length ? after[0] : main[main.length - 1];
    }
    var byAnchor = {};
    forks.forEach(function (fsi) { var a = anchorFor(fsi); (byAnchor[a] = byAnchor[a] || []).push(fsi); });

    var data = { m: [], f: [] };
    /* 飞书画板风格：SVG 圆角节点 + 折线箭头连接，支线从主线上方分叉再合流，整体等比适配宽度 */
    var NW = 176, NH = 78, GAP = 58, PAD = 16, FH = 56, FORKY = 10;
    var mainY = forks.length ? FORKY + FH + 36 : 6;
    var W = PAD * 2 + main.length * NW + (main.length - 1) * GAP;
    var H = mainY + NH + PAD;
    var uid = "mcb" + (++MC_UID);
    var defs = '<defs><marker id="' + uid + 'a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#4cc9f0"/></marker>'
      + '<marker id="' + uid + 'f" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#c4b5fd"/></marker></defs>';
    var body = "", edges = "";
    function escT(s, n) { var t = esc(String(s || "")); return t.length > n ? t.slice(0, n - 1) + "…" : t; }
    main.forEach(function (si, k) {
      var s = st[si];
      var x = PAD + k * (NW + GAP);
      data.m.push({ n: s.name || "", d: s.desc || "", ids: (s.nodes || []).map(String) });
      var dlines = wrap2(shortDesc(s.desc), 17);
      body += '<g class="cv-mc-stage" data-si="' + (data.m.length - 1) + '">'
        + '<rect x="' + x + '" y="' + mainY + '" width="' + NW + '" height="' + NH + '" rx="10"/>'
        + '<text class="mc-t" x="' + (x + 12) + '" y="' + (mainY + 21) + '">' + escT((FC_NO[k] || k + 1) + " " + s.name, 13) + "</text>"
        + '<text class="mc-m" x="' + (x + 12) + '" y="' + (mainY + 39) + '">' + ((s.nodes || []).length) + " 节点</text>"
        + '<text class="mc-d" x="' + (x + 12) + '" y="' + (mainY + 56) + '">' + escT(dlines[0], 19) + "</text>"
        + (dlines[1] ? '<text class="mc-d" x="' + (x + 12) + '" y="' + (mainY + 71) + '">' + escT(dlines[1], 19) + "</text>" : "")
        + "</g>";
      if (k < main.length - 1) {
        edges += '<path class="mc-e" d="M ' + (x + NW + 2) + " " + (mainY + NH / 2) + " H " + (x + NW + GAP - 8) + '" marker-end="url(#' + uid + 'a)"/>';
      }
    });
    var placed = []; /* 已放置支线的 [x0,x1]，同一行防重叠 */
    forks.forEach(function (fsi) {
      var fs = st[fsi];
      data.f.push({ n: fs.name || "", d: fs.desc || "", ids: (fs.nodes || []).map(String) });
      var fi = data.f.length - 1;
      var ak = main.indexOf(byAnchor[fsi]);
      if (ak < 0) ak = main.length - 1;
      var ax = PAD + ak * (NW + GAP) + NW / 2;
      var fx = Math.min(Math.max(PAD, ax - NW / 2), W - PAD - NW);
      placed.forEach(function (r) { if (fx < r[1] + 18 && fx + NW + 18 > r[0]) fx = r[1] + 18; });
      if (fx + NW > W - 4) W = fx + NW + PAD; /* 极端重叠时加宽画布（主线位置不受影响） */
      placed.push([fx, fx + NW]);
      var fcy = FORKY + FH / 2;
      body += '<g class="cv-mc-fork" data-fi="' + fi + '">'
        + '<rect x="' + fx + '" y="' + FORKY + '" width="' + NW + '" height="' + FH + '" rx="10"/>'
        + '<text class="mc-tag" x="' + (fx + 12) + '" y="' + (FORKY + 17) + '">⚡ 可选支线</text>'
        + '<text class="mc-t" x="' + (fx + 12) + '" y="' + (FORKY + 36) + '">' + escT(fs.name, 13) + "</text>"
        + '<text class="mc-d" x="' + (fx + 12) + '" y="' + (FORKY + 50) + '">' + escT(shortDesc(fs.desc), 18) + "</text>"
        + "</g>";
      /* 合流箭头路由：支线块与合流阶段上下对齐（常态，块以锚点中心放置）时从块底直落，
         未对齐时沿块边绕行——避免横向段穿过支线块内部（块底色近乎透明会露线） */
      var outD;
      if (ax >= fx && ax <= fx + NW) {
        outD = "M " + ax + " " + (FORKY + FH + 2) + " L " + ax + " " + (mainY - 4);
      } else if (ax > fx + NW) {
        outD = "M " + (fx + NW + 2) + " " + fcy + " L " + ax + " " + fcy + " L " + ax + " " + (mainY - 4);
      } else {
        outD = "M " + (fx - 8) + " " + fcy + " L " + ax + " " + fcy + " L " + ax + " " + (mainY - 4);
      }
      if (ak > 0) {
        var ox = PAD + (ak - 1) * (NW + GAP) + NW / 2; /* 从上一主线块顶部引出分叉 */
        edges += '<path class="mc-ef" d="M ' + ox + " " + (mainY - 4) + " L " + ox + " " + fcy + " L " + (fx - 8) + " " + fcy + '" marker-end="url(#' + uid + 'f)"/>';
        edges += '<path class="mc-ef" d="' + outD + '" marker-end="url(#' + uid + 'f)"/>';
      } else {
        /* ak=0：支线直接挂在首个主线块上方，块底直落即是入线兼合流线，只画一条 */
        edges += '<path class="mc-ef" d="' + outD + '" marker-end="url(#' + uid + 'f)"/>';
      }
    });
    return '<div class="cv-digest">'
      + '<div class="cv-digest-tabs"><button type="button" class="cv-digest-tab active" data-pane="flow">🧭 流程图</button><button type="button" class="cv-digest-tab" data-pane="text">📝 文字讲解</button></div>'
      + '<div class="cv-digest-pane" data-pane="flow"><div class="cv-mc-board"><svg viewBox="0 0 ' + W + " " + H + '" role="img">' + defs + edges + body + "</svg></div>"
      + '<div class="cv-fc-hint">点击节点块 → 下方交互图高亮对应阶段' + (forks.length ? " · ⚡ 虚线为被旁路/静音的可启用支线" : "") + '</div><div class="cv-fc-dock" hidden></div></div>'
      + textPane
      + '<script type="application/json" class="cv-fc-data">' + JSON.stringify(data).replace(/</g, "\\u003c") + "</" + "script>"
      + "</div>";
  }
  function wrap2(t, n) {
    t = String(t || "");
    if (t.length <= n) return [t];
    return [t.slice(0, n), t.slice(n, n * 2 - 1) + (t.length > n * 2 - 1 ? "…" : "")];
  }

  function byTypeKeys(o) { return Object.keys(o); }
  function typeChips(nodeIds, byType, idNode, cap) {
    var seen = {}, out = [];
    (nodeIds || []).forEach(function (id) {
      var n = idNode[String(id)];
      var tp = n && n.type;
      if (tp && !seen[tp] && tp !== "Reroute" && tp !== "Note") { seen[tp] = 1; out.push(tp); }
    });
    var h = out.slice(0, cap).map(function (tp) { return chipHtml(tp, byType[tp] && byType[tp].cat); }).join("");
    if (out.length > cap) h += '<span class="cv-fc-chip">+' + (out.length - cap) + "</span>";
    return h ? '<div class="cv-mc-chips">' + h + "</div>" : "";
  }
  function shortDesc(d) {
    var t = String(d || "").split(/[。；;]/)[0] || String(d || "");
    if (t.length > 46) t = t.slice(0, 45) + "…";
    return t;
  }
  /* 旧版兜底：无阶段数据时用数据流步骤拼横向卡轨 */
  function legacyFlow(steps, textPane) {
    if (!steps || !steps.length) return textPane;
    var cards = steps.map(function (raw, i) {
      var t = String(raw || "").replace(/^[\u2460-\u2473]\s*/, "");
      var cap = t.split(/[，,；;。]/)[0] || t;
      if (cap.length > 26) cap = cap.slice(0, 25) + "…";
      return '<div class="cv-fc-step" data-idx="' + i + '"><div><span class="cv-fc-no">' + (FC_NO[i] || i + 1) + '</span></div><div class="cv-fc-cap">' + esc(cap) + "</div></div>";
    });
    return '<div class="cv-digest">'
      + '<div class="cv-digest-tabs"><button type="button" class="cv-digest-tab active" data-pane="flow">🧭 流程图</button><button type="button" class="cv-digest-tab" data-pane="text">📝 文字讲解</button></div>'
      + '<div class="cv-digest-pane" data-pane="flow"><div class="cv-fc-scroll"><div class="cv-fc-rail">' + cards.join('<div class="cv-fc-link">→</div>') + '</div></div><div class="cv-fc-hint">点击步骤查看完整讲解</div><div class="cv-fc-dock" hidden></div></div>'
      + textPane + "</div>";
  }

  /* 双视图交互：Tab 切换 / 步骤点击出讲解坞 / 色块定位到图（document 级委托，两页通用） */
  document.addEventListener("click", function (e) {
    var tab = e.target.closest && e.target.closest(".cv-digest-tab");
    if (tab) {
      var box = tab.closest(".cv-digest");
      if (!box) return;
      var pane = tab.getAttribute("data-pane");
      box.querySelectorAll(".cv-digest-tab").forEach(function (x) { x.classList.toggle("active", x === tab); });
      box.querySelectorAll(".cv-digest-pane").forEach(function (x) {
        var on = x.getAttribute("data-pane") === pane;
        x.hidden = !on;
        x.classList.toggle("active", on);
      });
      return;
    }
    var loc = e.target.closest && e.target.closest(".cv-mc-stage, .cv-mc-fork");
    if (loc) {
      var boxL = loc.closest(".cv-digest");
      if (!boxL) return;
      var dataElL = boxL.querySelector("script.cv-fc-data");
      if (!dataElL) return;
      var dL;
      try { dL = JSON.parse(dataElL.textContent); } catch (err) { return; }
      var itemL = loc.classList.contains("cv-mc-fork") ? (dL.f || [])[(parseInt(loc.getAttribute("data-fi"), 10) || 0)] : (dL.m || [])[(parseInt(loc.getAttribute("data-si"), 10) || 0)];
      if (!itemL) return;
      boxL.querySelectorAll(".cv-mc-stage.active, .cv-mc-fork.active").forEach(function (x) { x.classList.remove("active"); });
      loc.classList.add("active");
      var apiL = window.ComfyPanelApi;
      if (apiL) {
        if (apiL.highlight && itemL.ids && itemL.ids.length) apiL.highlight(itemL.ids);
        if (apiL.root && apiL.root.scrollIntoView) apiL.root.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    var close = e.target.closest && e.target.closest(".cv-fc-dock-close");
    if (close) {
      var dk = close.closest(".cv-fc-dock");
      if (dk) dk.hidden = true;
      var bx = close.closest(".cv-digest");
      if (bx) bx.querySelectorAll(".cv-fc-step.active").forEach(function (x) { x.classList.remove("active"); });
      return;
    }
    var step = e.target.closest && e.target.closest(".cv-fc-step");
    if (step) {
      var box2 = step.closest(".cv-digest");
      if (!box2) return;
      var dataEl = box2.querySelector("script.cv-fc-data");
      var dock = box2.querySelector(".cv-fc-dock");
      if (!dataEl || !dock) return;
      var d;
      try { d = JSON.parse(dataEl.textContent); } catch (err) { return; }
      var idx = parseInt(step.getAttribute("data-idx"), 10) || 0;
      var item = (d.l || [])[idx];
      if (!item) return;
      box2.querySelectorAll(".cv-fc-step.active").forEach(function (x) { x.classList.remove("active"); });
      step.classList.add("active");
      dock.innerHTML = '<div class="cv-fc-dock-head"><span class="cv-fc-no">' + (FC_NO[idx] || idx + 1) + '</span><span>第 ' + (idx + 1) + ' 步</span><button type="button" class="cv-fc-dock-close">✕ 收起</button></div>'
        + '<div class="cv-fc-dock-body">' + esc(String(item.t == null ? item : item.t)) + "</div>";
      dock.hidden = false;
    }
  });

  window.ComfyWfPanel = { skeleton: skeleton, mount: mount, digest: digestHtml, digestBlock: digestBlock };
})();
