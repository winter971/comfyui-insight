/* 四 · 真实工作流库（CivitAI 抓取 + 本地解析）
   数据: window.COMFY_DATA.civitaiWorkflows / civitaiStats (见 data/workflows-civitai.js) */
(function () {
  "use strict";
  function D() { return window.COMFY_DATA || {}; }
  function wfs() { return D().civitaiWorkflows || []; }
  function stats() { return D().civitaiStats || {}; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function fmtN(n) { n = n || 0; return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "w" : String(n); }

  var F = { cat: "全部", base: "全部", pack: "全部", sort: "dl", q: "", nsfw: false, page: 1 };
  var PER = 30;

  function filtered() {
    var q = (F.q || "").toLowerCase();
    var list = wfs().filter(function (w) {
      if (!F.nsfw && w.nsfw) return false;
      if (F.cat !== "全部" && w.cat !== F.cat) return false;
      if (F.base !== "全部" && w.base !== F.base) return false;
      if (F.pack !== "全部") {
        var names = (w.packs || []).map(function (p) { return p[0]; });
        if (names.indexOf(F.pack) < 0) return false;
      }
      if (q) {
        var hay = (w.name + " " + w.by + " " + w.cat + " " + w.base + " " + (w.tags || []).join(" ")
          + (w.packs || []).map(function (p) { return p[0]; }).join(" ")
          + (w.models || []).map(function (m) { return m.f; }).join(" ")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    if (F.sort === "pub") list.sort(function (a, b) { return (b.pub || "").localeCompare(a.pub || ""); });
    else list.sort(function (a, b) { return (b[F.sort] || 0) - (a[F.sort] || 0); });
    return list;
  }

  function summaryLine(w) {
    var packs = (w.packs || []).filter(function (p) { return p[0] !== "其他自定义"; }).slice(0, 3).map(function (p) { return p[0]; });
    var s = "基于 " + esc(w.base) + " 的" + esc(w.cat) + "流程，共 " + w.nodes + " 个节点";
    if (packs.length) s += "，依赖 " + packs.map(esc).join("、") + ((w.packs || []).length > 3 ? " 等 " + w.packs.length + " 个社区节点包" : "");
    else if (w.customCount) s += "，依赖 " + w.customCount + " 个自定义节点";
    else s += "，全部使用 ComfyUI 内置节点";
    if (w.res) s += "，默认画布 " + w.res.width + "×" + w.res.height;
    return s + "。";
  }

  /* ============ 列表页 ============ */
  var VIEW = "cards"; // cards | table
  function render() {
    var st = stats();
    if (!wfs().length) return '<div class="container"><div class="card">数据尚未生成：请先在 _sources 下运行 analyze_workflows.cjs 与 build_site_data.cjs。</div></div>';

    var html = '<div class="container">'
      + '<div class="sec-head"><h2>真实工作流库</h2><span class="sec-en">CIVITAI REAL-WORKFLOW LIBRARY</span></div>'
      + '<p class="sec-desc">以下是从 Civitai 公开抓取的 ' + fmtN(st.parsed) + ' 条真实 ComfyUI 工作流（关键词 workflow、类型 Workflows，按下载量排序收录）。'
      + '每条都经过本地解析：节点构成、社区节点包依赖、引用的模型文件、画布分辨率一目了然——想知道社区都在用什么节点包、跑什么底模，看这里的统计就有答案。</p>'
      + '<div class="cv-tiles">'
      + tile(fmtN(st.parsed), "条已解析工作流")
      + tile(Object.keys(st.packs || {}).length, "个社区节点包在用")
      + tile(fmtN(Object.entries(st.bases || {}).reduce(function (s, kv) { return s + kv[1]; }, 0)), "条标注了底模")
      + tile((st.formats && st.formats.ui || 0) + " / " + (st.formats && st.formats.api || 0), "UI 格式 / API 格式")
      + "</div>"
      + '<div class="cv-viewbar"><div class="cv-viewtabs">'
      + '<button class="cv-viewtab' + (VIEW === "cards" ? " active" : "") + '" data-view="cards">🗂 卡片视图</button>'
      + '<button class="cv-viewtab' + (VIEW === "table" ? " active" : "") + '" data-view="table">📋 多维表格</button>'
      + "</div>"
      + (st.aiDone ? '<span class="cv-viewnote">AI 精读已完成 <b>' + st.aiDone + "</b> / " + fmtN(st.parsed) + " 份（重复结构自动同源）</span>" : "")
      + "</div>";

    if (VIEW === "table") {
      html += renderTableShell() + "</div>";
    } else {
      html += renderCardsBody(st);
    }
    return html;
  }

  function renderCardsBody(st) {
    var html = "";
    /* 高频节点包 Top10 */
    var packsArr = Object.entries(st.packs || {});
    if (packsArr.length) {
      var maxP = packsArr[0][1] || 1;
      html += '<div class="section"><div class="sec-head"><h2 style="font-size:20px">社区都在用什么节点包</h2><span class="sec-en">TOP NODE PACKS</span></div><div class="cv-bars">';
      packsArr.slice(0, 10).forEach(function (kv) {
        var name = kv[0] === "其他自定义" ? "其他 / 长尾社区节点" : kv[0];
        html += '<div class="cv-bar"><span class="cv-bar-name">' + esc(name) + '</span>'
          + '<span class="cv-bar-track"><span class="cv-bar-fill" style="width:' + Math.round(kv[1] / maxP * 100) + '%"></span></span>'
          + '<span class="cv-bar-num">' + kv[1] + " 条</span></div>";
      });
      html += "</div></div>";
    }

    /* 底模分布 Top8 */
    var basesArr = Object.entries(st.bases || {}).slice(0, 8);
    if (basesArr.length) {
      html += '<div class="section"><div class="sec-head"><h2 style="font-size:20px">底模使用分布</h2><span class="sec-en">BASE MODELS</span></div><div class="cv-chips">';
      basesArr.forEach(function (kv) { html += '<span class="mini-tag">' + esc(kv[0]) + " · " + kv[1] + "</span>"; });
      html += "</div></div>";
    }

    /* 筛选器 */
    html += '<div class="section"><div class="filter-bar" id="cvCats"></div>'
      + '<div class="cv-controls">'
      + '<select id="cvBase" class="cv-sel"><option value="全部">全部底模</option></select>'
      + '<select id="cvPack" class="cv-sel"><option value="全部">全部节点包</option></select>'
      + '<select id="cvSort" class="cv-sel">'
      + '<option value="dl">按下载量</option><option value="up">按点赞</option><option value="pub">按发布时间</option><option value="nodes">按节点数</option>'
      + "</select>"
      + '<input id="cvQ" class="cv-q" type="text" placeholder="搜工作流名 / 作者 / 模型文件…">'
      + '<label class="cv-nsfw"><input type="checkbox" id="cvNsfw"> 显示 NSFW（' + (st.nsfwCount || 0) + " 条）</label>"
      + "</div>"
      + '<div class="wf-grid" id="cvGrid"></div>'
      + '<div class="cv-pager" id="cvPager"></div>'
      + "</div></div>";
    return html;
  }

  function tile(num, label) { return '<div class="cv-tile"><div class="cv-tile-num">' + num + '</div><div class="cv-tile-label">' + esc(label) + "</div></div>"; }

  function paintFilters() {
    var cats = ["全部"], bases = {}, packs = {};
    wfs().forEach(function (w) {
      if (cats.indexOf(w.cat) < 0) cats.push(w.cat);
      if (w.base) bases[w.base] = (bases[w.base] || 0) + 1;
      (w.packs || []).forEach(function (p) { packs[p[0]] = (packs[p[0]] || 0) + 1; });
    });
    var catBar = $("#cvCats");
    if (!catBar) return;
    catBar.innerHTML = cats.map(function (c) {
      return '<button class="filter-btn' + (c === F.cat ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
    var selBase = $("#cvBase"), selPack = $("#cvPack");
    var baseOpts = Object.entries(bases).sort(function (a, b) { return b[1] - a[1]; });
    selBase.innerHTML = '<option value="全部">全部底模</option>' + baseOpts.map(function (kv) {
      return '<option value="' + esc(kv[0]) + '"' + (kv[0] === F.base ? " selected" : "") + ">" + esc(kv[0]) + " (" + kv[1] + ")</option>";
    }).join("");
    var packOpts = Object.entries(packs).sort(function (a, b) { return b[1] - a[1]; }).filter(function (kv) { return kv[1] >= 5; }).slice(0, 40);
    selPack.innerHTML = '<option value="全部">全部节点包</option>' + packOpts.map(function (kv) {
      var label = kv[0] === "其他自定义" ? "其他 / 长尾社区节点" : kv[0];
      return '<option value="' + esc(kv[0]) + '"' + (kv[0] === F.pack ? " selected" : "") + ">" + esc(label) + " (" + kv[1] + ")</option>";
    }).join("");
  }

  function paintGrid() {
    var grid = $("#cvGrid"), pager = $("#cvPager");
    if (!grid) return;
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PER));
    if (F.page > pages) F.page = pages;
    var slice = list.slice((F.page - 1) * PER, F.page * PER);
    var html = "";
    slice.forEach(function (w) {
      html += '<a class="wf-card" href="#/civitai/' + w.v + '">'
        + "<h3><span class=\"wf-cat-pill\">" + esc(w.cat) + "</span>" + (w.nsfw ? '<span class="cv-nsfw-pill">18+</span>' : "") + esc(w.name) + "</h3>"
        + '<div class="wf-desc">' + summaryLine(w) + "</div>"
        + '<div class="wf-foot"><span class="mini-tag">⬇ ' + fmtN(w.dl) + '</span><span class="mini-tag">👍 ' + fmtN(w.up) + "</span>"
        + '<span class="mini-tag">' + w.nodes + " 节点</span>"
        + (w.variants && w.variants.length > 1 ? '<span class="mini-tag" style="color:#7dd3fc">📦 ' + w.variants.length + " 份工作流</span>" : "")
        + '<span class="mini-tag">' + esc(w.base) + "</span>"
        + (w.pub ? '<span class="mini-tag">' + esc(w.pub) + "</span>" : "")
        + "</div></a>";
    });
    if (!html) html = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted)">没有匹配的工作流</div>';
    grid.innerHTML = html;
    var ph = "";
    function plink(p, label, active) {
      return '<button class="cv-page-btn' + (active ? " active" : "") + '" data-page="' + p + '">' + label + "</button>";
    }
    if (pages > 1) {
      ph += plink(Math.max(1, F.page - 1), "‹", false);
      var win = [];
      for (var i = Math.max(1, F.page - 2); i <= Math.min(pages, F.page + 2); i++) win.push(i);
      if (win[0] > 1) ph += plink(1, "1", F.page === 1) + '<span class="cv-dots">…</span>';
      win.forEach(function (i) { ph += plink(i, String(i), i === F.page); });
      if (win[win.length - 1] < pages) ph += '<span class="cv-dots">…</span>' + plink(pages, String(pages), F.page === pages);
      ph += plink(Math.min(pages, F.page + 1), "›", false);
      ph = '<span class="cv-pager-info">共 ' + list.length + " 条 · 第 " + F.page + "/" + pages + " 页</span>" + ph;
    } else {
      ph = '<span class="cv-pager-info">共 ' + list.length + " 条</span>";
    }
    pager.innerHTML = ph;
  }

  /* ============ 多维表格视图 ============ */
  var T = { sort: { k: "dl", dir: -1 }, f: {}, groupBy: "", gSort: "dl", page: 1, per: 100, openCol: null, collapsed: {} };
  var TCOLS = [
    { k: "name", label: "名称", t: "text" },
    { k: "by", label: "作者", t: "enum" },
    { k: "cat", label: "类别", t: "enum" },
    { k: "base", label: "底模", t: "enum" },
    { k: "dl", label: "下载", t: "num" },
    { k: "up", label: "点赞", t: "num" },
    { k: "d", label: "难度", t: "num" },
    { k: "nodes", label: "节点", t: "num" },
    { k: "vc", label: "份数", t: "num" },
    { k: "pub", label: "发布", t: "enum", sortKey: "pub" },
    { k: "nsfw", label: "18+", t: "bool" },
    { k: "ai", label: "精读", t: "bool" },
    { k: "dup", label: "重复", t: "bool3" },
  ];
  function tv(w, k) {
    if (k === "vc") return (w.variants || []).length;
    if (k === "nsfw") return !!w.nsfw;
    if (k === "ai") return !!w.ai;
    if (k === "dup") return w.dup || 0;
    return w[k];
  }
  function tvText(w, col) {
    var v = tv(w, col.k);
    if (col.k === "name") return w.name;
    if (col.k === "pub") return (String(v || "").slice(0, 4)) ? v : "—";
    if (typeof v === "boolean") return v ? "是" : "否";
    if (col.k === "dup") return v > 0 ? "组×" + v : (v === -1 ? "副本" : "—");
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  }

  function tableFiltered() {
    var f = T.f || {};
    var base = wfs().filter(function (w) { return !F.nsfw || true; }).filter(function (w) { return F.nsfw || !w.nsfw; });
    return base.filter(function (w) {
      for (var i = 0; i < TCOLS.length; i++) {
        var col = TCOLS[i], fl = f[col.k];
        if (!fl) continue;
        var v = tv(w, col.k);
        if (col.t === "enum" && fl.vals && fl.vals.length) {
          var sv = String(v == null ? "" : v);
          if (col.k === "pub") sv = String(sv).slice(0, 4);
          if (fl.vals.indexOf(sv) < 0) return false;
        }
        if (col.t === "text" && fl.text) {
          if (String(v == null ? "" : v).toLowerCase().indexOf(fl.text.toLowerCase()) < 0) return false;
        }
        if (col.t === "num") {
          var n = (v === null || v === undefined) ? null : Number(v);
          if (fl.min !== undefined && fl.min !== null && fl.min !== "") { if (n === null || n < Number(fl.min)) return false; }
          if (fl.max !== undefined && fl.max !== null && fl.max !== "") { if (n === null || n > Number(fl.max)) return false; }
        }
        if ((col.t === "bool" || col.t === "bool3") && fl.mode) {
          if (col.t === "bool") { if (fl.mode === 1 && !v) return false; if (fl.mode === 2 && v) return false; }
          else { if (fl.mode === 1 && v !== 0) return false; if (fl.mode === 2 && v === 0) return false; }
        }
      }
      return true;
    });
  }
  function tableSorted(list) {
    var k = T.sort.k, dir = T.sort.dir;
    return list.slice().sort(function (a, b) {
      var va = tv(a, k), vb = tv(b, k);
      var na = (va === null || va === undefined || va === ""), nb = (vb === null || vb === undefined || vb === "");
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      if (typeof va === "string") return va.localeCompare(String(vb)) * dir;
      return (va - vb) * dir;
    });
  }

  function renderTableShell() {
    var html = '<div class="cv-tb-toolbar">'
      + '<span class="cv-tb-label">分组</span>'
      + '<select id="cvGroup" class="cv-sel"><option value="">不分组</option><option value="by">按作者</option><option value="cat">按类别</option><option value="base">按底模</option><option value="puby">按发布年份</option></select>'
      + '<span class="cv-tb-label" id="cvGSep" style="display:none">排序</span>'
      + '<select id="cvGSort" class="cv-sel" style="display:none"><option value="dl">组Σ下载</option><option value="cnt">组条数</option><option value="key">组名</option></select>'
      + '<button class="cv-page-btn" id="cvTReset">重置筛选</button>'
      + '<button class="cv-page-btn" id="cvTCsv">导出 CSV</button>'
      + '<span class="cv-pager-info" id="cvTCount"></span>'
      + "</div>"
      + '<div class="cv-table-wrap"><table class="cv-table"><thead id="cvTHead"></thead><tbody id="cvTBody"></tbody></table></div>'
      + '<div class="cv-pager" id="cvTPager"></div>'
      + '<div id="cvTPop"></div>';
    return html;
  }

  function activeFilterCount() {
    var n = 0;
    for (var k in T.f) {
      var fl = T.f[k];
      if (!fl) continue;
      if (fl.vals && fl.vals.length) n++;
      else if (fl.text) n++;
      else if (fl.min !== undefined && fl.min !== null && fl.min !== "") n++;
      else if (fl.max !== undefined && fl.max !== null && fl.max !== "") n++;
      else if (fl.mode) n++;
    }
    return n;
  }

  function paintTHead() {
    var head = $("#cvTHead");
    var html = "<tr>";
    TCOLS.forEach(function (col) {
      var arrow = T.sort.k === col.k ? (T.sort.dir === -1 ? "▼" : "▲") : "";
      var fc = (T.f[col.k] && activeFilterOf(col.k)) ? " on" : "";
      html += '<th class="cv-th" data-k="' + col.k + '"><div class="cv-th-in"><span class="cv-th-sort" data-sort="' + col.k + '">' + esc(col.label) + (arrow ? ' <i class="cv-arrow">' + arrow + "</i>" : "") + '</span><span class="cv-th-fbtn' + fc + '" data-fbtn="' + col.k + '">▼</span></div></th>';
    });
    head.innerHTML = html + "</tr>";
  }
  function activeFilterOf(k) {
    var fl = T.f[k];
    if (!fl) return false;
    return (fl.vals && fl.vals.length) || fl.text || (fl.min !== undefined && fl.min !== null && fl.min !== "") || (fl.max !== undefined && fl.max !== null && fl.max !== "") || fl.mode;
  }

  function paintTBody() {
    var body = $("#cvTBody"), pager = $("#cvTPager"), cnt = $("#cvTCount");
    var list = tableSorted(tableFiltered());
    if (cnt) cnt.textContent = "共 " + list.length + " 条（筛选后）";
    var html = "";
    if (!T.groupBy) {
      var pages = Math.max(1, Math.ceil(list.length / T.per));
      if (T.page > pages) T.page = pages;
      list.slice((T.page - 1) * T.per, T.page * T.per).forEach(function (w) { html += rowHtml(w); });
      body.innerHTML = html || '<tr><td class="cv-empty" colspan="' + TCOLS.length + '">没有匹配的工作流</td></tr>';
      paintTPager(pages, list.length);
    } else {
      pager.innerHTML = "";
      var groups = {};
      list.forEach(function (w) {
        var key = groupKeyOf(w);
        (groups[key] = groups[key] || []).push(w);
      });
      var arr = Object.keys(groups).map(function (k) { return { key: k, rows: groups[k] }; });
      arr.sort(function (a, b) {
        if (T.gSort === "key") return a.key.localeCompare(b.key, "zh");
        if (T.gSort === "cnt") return b.rows.length - a.rows.length;
        return sumOf(b.rows, "dl") - sumOf(a.rows, "dl");
      });
      arr.forEach(function (g, gi) {
        var sumDl = sumOf(g.rows, "dl"), sumUp = sumOf(g.rows, "up");
        var avgN = Math.round(g.rows.reduce(function (s, w) { return s + (w.nodes || 0); }, 0) / g.rows.length);
        var col = T.collapsed["g" + gi];
        html += '<tr class="cv-ghead" data-g="' + gi + '"><td colspan="' + TCOLS.length + '"><span class="cv-g-toggle">' + (col ? "▸" : "▾") + "</span><b>" + esc(g.key || "（未知）") + '</b><span class="cv-g-agg">' + g.rows.length + " 条 · Σ下载 " + fmtN(sumDl) + " · Σ点赞 " + fmtN(sumUp) + " · 平均 " + avgN + " 节点</span></td></tr>";
        if (!col) g.rows.forEach(function (w) { html += rowHtml(w); });
      });
      body.innerHTML = html || '<tr><td class="cv-empty" colspan="' + TCOLS.length + '">没有匹配的工作流</td></tr>';
    }
  }
  function groupKeyOf(w) {
    if (T.groupBy === "puby") return (w.pub || "").slice(0, 4) || "未知";
    return String(w[T.groupBy] == null ? "" : w[T.groupBy]) || "（未知）";
  }
  function sumOf(rows, k) { return rows.reduce(function (s, w) { return s + (w[k] || 0); }, 0); }
  function rowHtml(w) {
    var tds = "";
    TCOLS.forEach(function (col) {
      var v = tv(w, col.k), text = tvText(w, col), cls = "";
      if (col.k === "name") { tds += '<td><a class="cv-tname" href="#/civitai/' + w.v + '">' + (w.nsfw ? '<span class="cv-nsfw-pill">18+</span>' : "") + esc(w.name) + "</a></td>"; return; }
      if (col.k === "dl" || col.k === "up") { tds += "<td class=\"num\">" + fmtN(v) + "</td>"; return; }
      if (col.k === "d") { tds += "<td class=\"num\">" + (v ? '<span style="color:#e8a33d">' + "★".repeat(v) + "</span>" : "—") + "</td>"; return; }
      if (col.k === "pub") { tds += "<td class=\"mono dim\">" + esc(text) + "</td>"; return; }
      if (col.k === "nsfw") { tds += "<td>" + (v ? '<span class="cv-nsfw-pill">18+</span>' : "—") + "</td>"; return; }
      if (col.k === "ai") { tds += "<td>" + (v ? '<span class="cv-ai-mini">已读</span>' : "—") + "</td>"; return; }
      if (col.k === "dup") { tds += "<td>" + (v > 0 ? '<span class="cv-dup-tag">组×' + v + "</span>" : (v === -1 ? '<span class="cv-dup-tag copy">副本</span>' : "—")) + "</td>"; return; }
      if (typeof v === "number") { tds += '<td class="num">' + v + "</td>"; return; }
      tds += "<td>" + esc(text) + "</td>";
    });
    return "<tr>" + tds + "</tr>";
  }
  function paintTPager(pages, total) {
    var pager = $("#cvTPager");
    if (!pager) return;
    if (pages <= 1) { pager.innerHTML = '<span class="cv-pager-info">共 ' + total + " 条</span>"; return; }
    var ph = '<span class="cv-pager-info">共 ' + total + " 条 · 第 " + T.page + "/" + pages + " 页</span>";
    ph += '<button class="cv-page-btn" data-p="' + Math.max(1, T.page - 1) + '">‹</button>';
    var win = [];
    for (var i = Math.max(1, T.page - 2); i <= Math.min(pages, T.page + 2); i++) win.push(i);
    if (win[0] > 1) ph += '<button class="cv-page-btn" data-p="1">1</button><span class="cv-dots">…</span>';
    win.forEach(function (i) { ph += '<button class="cv-page-btn' + (i === T.page ? " active" : "") + '" data-p="' + i + '">' + i + "</button>"; });
    if (win[win.length - 1] < pages) ph += '<span class="cv-dots">…</span><button class="cv-page-btn" data-p="' + pages + '">' + pages + "</button>";
    ph += '<button class="cv-page-btn" data-p="' + Math.min(pages, T.page + 1) + '">›</button>';
    pager.innerHTML = ph;
  }

  /* 列筛选弹层 */
  function openFilterPop(k, anchor) {
    var pop = $("#cvTPop");
    var col = TCOLS.filter(function (c) { return c.k === k; })[0];
    var rect = anchor.getBoundingClientRect();
    var inner = '<div class="cv-pop" style="left:' + Math.max(8, rect.left - 220) + 'px;top:' + (rect.bottom + 6) + 'px">';
    inner += '<div class="cv-pop-head">筛选：' + esc(col.label) + '</div>';
    if (col.t === "enum") {
      var counts = {};
      wfs().forEach(function (w) {
        var v = tv(w, k);
        if (v === null || v === undefined || v === "") return;
        var s = k === "pub" ? String(v).slice(0, 4) : String(v);
        counts[s] = (counts[s] || 0) + 1;
      });
      var vals = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      var sel = (T.f[k] && T.f[k].vals) || [];
      inner += '<input class="cv-pop-q" id="cvPopQ" placeholder="搜索取值…" value="' + esc((T.f[k] && T.f[k].q) || "") + '">';
      inner += '<div class="cv-pop-list" id="cvPopList">';
      vals.slice(0, 400).forEach(function (v) {
        inner += '<label class="cv-pop-opt"><input type="checkbox" data-val="' + esc(v) + '"' + (sel.indexOf(v) >= 0 ? " checked" : "") + "> " + esc(v) + ' <span class="cv-pop-cnt">' + counts[v] + "</span></label>";
      });
      inner += "</div>";
    } else if (col.t === "text") {
      var t = (T.f[k] && T.f[k].text) || "";
      inner += '<input class="cv-pop-q" id="cvPopText" placeholder="包含关键字…" value="' + esc(t) + '">';
    } else if (col.t === "num") {
      var fl = T.f[k] || {};
      inner += '<div class="cv-pop-nums">最小 <input type="number" id="cvPopMin" value="' + esc(fl.min !== undefined ? fl.min : "") + '">　最大 <input type="number" id="cvPopMax" value="' + esc(fl.max !== undefined ? fl.max : "") + '"></div>';
    } else {
      var mode = (T.f[k] && T.f[k].mode) || 0;
      inner += '<div class="cv-pop-nums"><label><input type="radio" name="cvPopM" value="0"' + (!mode ? " checked" : "") + ">全部</label>　<label><input type=\"radio\" name=\"cvPopM\" value=\"1\"" + (mode === 1 ? " checked" : "") + ">" + (col.t === "bool3" ? "有重复标记" : "是") + "</label>　<label><input type=\"radio\" name=\"cvPopM\" value=\"2\"" + (mode === 2 ? " checked" : "") + ">" + (col.t === "bool3" ? "无重复标记" : "否") + "</label></div>";
    }
    inner += '<div class="cv-pop-foot"><button class="cv-page-btn" id="cvPopClear">清除</button><button class="cv-page-btn active" id="cvPopApply">应用</button></div></div>';
    pop.innerHTML = inner;
    T.openCol = k;
    $("#cvPopApply").addEventListener("click", function () { applyFilterPop(k); });
    $("#cvPopClear").addEventListener("click", function () { delete T.f[k]; closeFilterPop(); paintTHead(); paintTBody(); });
    var q = $("#cvPopQ");
    if (q) q.addEventListener("input", function () {
      var qq = q.value.toLowerCase();
      $all("#cvPopList .cv-pop-opt").forEach(function (o) {
        o.style.display = o.textContent.toLowerCase().indexOf(qq) >= 0 ? "" : "none";
      });
    });
  }
  function applyFilterPop(k) {
    var col = TCOLS.filter(function (c) { return c.k === k; })[0];
    if (col.t === "enum") {
      var vals = $all("#cvPopList input:checked").map(function (x) { return x.getAttribute("data-val"); });
      var q = $("#cvPopQ") ? $("#cvPopQ").value : "";
      T.f[k] = { vals: vals, q: q };
    } else if (col.t === "text") {
      var t = $("#cvPopText") ? $("#cvPopText").value.trim() : "";
      if (t) T.f[k] = { text: t }; else delete T.f[k];
    } else if (col.t === "num") {
      var mn = $("#cvPopMin").value, mx = $("#cvPopMax").value;
      if (mn !== "" || mx !== "") T.f[k] = { min: mn, max: mx }; else delete T.f[k];
    } else {
      var m = document.querySelector('input[name="cvPopM"]:checked');
      var mode = m ? parseInt(m.value, 10) : 0;
      if (mode) T.f[k] = { mode: mode }; else delete T.f[k];
    }
    closeFilterPop();
    T.page = 1;
    paintTHead(); paintTBody();
  }
  function closeFilterPop() { var pop = $("#cvTPop"); if (pop) pop.innerHTML = ""; T.openCol = null; }

  function exportCsv() {
    var list = tableSorted(tableFiltered());
    var head = TCOLS.map(function (c) { return c.label; }).join(",");
    var lines = [head];
    list.forEach(function (w) {
      lines.push(TCOLS.map(function (col) {
        var s;
        if (col.k === "name") s = w.name;
        else s = tvText(w, col);
        return '"' + String(s).replace(/"/g, '""') + '"';
      }).join(","));
    });
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "civitai-workflows.csv";
    a.click();
  }

  function rerenderPage() {
    $("#app").innerHTML = render();
    if (VIEW === "table") mountTable(); else mount();
  }

  function mountTable() {
    var gs = $("#cvGroup");
    gs.value = T.groupBy;
    $("#cvGSort").value = T.gSort;
    $("#cvGSep").style.display = $("#cvGSort").style.display = T.groupBy ? "" : "none";
    paintTHead(); paintTBody();
    $all(".cv-viewtab").forEach(function (b) {
      b.addEventListener("click", function () { VIEW = b.getAttribute("data-view"); T.openCol = null; rerenderPage(); });
    });
    gs.addEventListener("change", function () { T.groupBy = gs.value; T.page = 1; $("#cvGSep").style.display = $("#cvGSort").style.display = T.groupBy ? "" : "none"; paintTBody(); });
    $("#cvGSort").addEventListener("change", function (e) { T.gSort = e.target.value; paintTBody(); });
    $("#cvTReset").addEventListener("click", function () { T.f = {}; T.page = 1; paintTHead(); paintTBody(); });
    $("#cvTCsv").addEventListener("click", exportCsv);
    $("#cvTHead").addEventListener("click", function (e) {
      var fs = e.target.closest("[data-fbtn]");
      if (fs) { var k = fs.getAttribute("data-fbtn"); if (T.openCol === k) closeFilterPop(); else openFilterPop(k, fs); return; }
      var sBtn = e.target.closest("[data-sort]");
      if (sBtn) {
        var k2 = sBtn.getAttribute("data-sort");
        if (T.sort.k === k2) T.sort.dir = -T.sort.dir;
        else T.sort = { k: k2, dir: -1 };
        paintTHead(); paintTBody();
      }
    });
    $("#cvTBody").addEventListener("click", function (e) {
      var gh = e.target.closest(".cv-ghead");
      if (!gh) return;
      var gi = gh.getAttribute("data-g");
      T.collapsed["g" + gi] = !T.collapsed["g" + gi];
      paintTBody();
    });
    $("#cvTPager").addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]");
      if (!b) return;
      T.page = parseInt(b.getAttribute("data-p"), 10) || 1;
      paintTBody();
      window.scrollTo(0, 0);
    });
    document.addEventListener("click", cvPopDismiss);
  }
  function cvPopDismiss(e) {
    if (!T.openCol) return;
    if (e.target.closest(".cv-th-fbtn") || e.target.closest(".cv-pop")) return;
    closeFilterPop();
  }

  function mount() {
    if (VIEW === "table") { mountTable(); return; }
    $all(".cv-viewtab").forEach(function (b) {
      b.addEventListener("click", function () { VIEW = b.getAttribute("data-view"); rerenderPage(); });
    });
    paintFilters();
    paintGrid();
    $("#cvCats").addEventListener("click", function (e) {
      var b = e.target.closest(".filter-btn");
      if (!b) return;
      F.cat = b.getAttribute("data-cat"); F.page = 1;
      $all("#cvCats .filter-btn").forEach(function (x) { x.classList.toggle("active", x === b); });
      paintGrid();
    });
    $("#cvBase").addEventListener("change", function (e) { F.base = e.target.value; F.page = 1; paintGrid(); });
    $("#cvPack").addEventListener("change", function (e) { F.pack = e.target.value; F.page = 1; paintGrid(); });
    $("#cvSort").addEventListener("change", function (e) { F.sort = e.target.value; F.page = 1; paintGrid(); });
    var qIn = $("#cvQ");
    qIn.addEventListener("input", function () { F.q = qIn.value; F.page = 1; paintGrid(); });
    $("#cvNsfw").addEventListener("change", function (e) { F.nsfw = e.target.checked; F.page = 1; paintGrid(); });
    $("#cvPager").addEventListener("click", function (e) {
      var b = e.target.closest(".cv-page-btn");
      if (!b) return;
      F.page = parseInt(b.getAttribute("data-page"), 10) || 1;
      paintGrid();
      window.scrollTo(0, 0);
    });
  }

  /* ============ 详情页 ============ */
  function renderDetail(vid, vi) {
    var w = null;
    wfs().forEach(function (x) { if (String(x.v) === String(vid)) w = x; });
    if (!w) return '<div class="container"><div class="card">未找到该工作流。<a href="#/civitai">返回真实工作流库</a></div></div>';
    var variants = w.variants && w.variants.length ? w.variants : [{ i: 0, cat: w.cat, nodes: w.nodes, name: "主文件" }];
    var sel = variants[vi] || variants[0];
    var packs = sel.packs || w.packs || [];
    var models = sel.models || w.models || [];
    var nt = sel.nt || w.nt || [];

    var html = '<div class="container">'
      + '<a class="back-link" href="#/civitai">← 返回真实工作流库</a>'
      + '<div class="pkg-hero"><h1>' + (w.nsfw ? '<span class="cv-nsfw-pill">18+</span>' : "") + esc(w.name) + "</h1>"
      + '<div class="ph-meta"><span class="wf-cat-pill">' + esc(sel.cat || w.cat) + '</span>'
      + '<span class="mini-tag">⬇ ' + fmtN(w.dl) + '</span><span class="mini-tag">👍 ' + fmtN(w.up) + "</span>"
      + '<span class="mini-tag">' + sel.nodes + " 节点 / " + (sel.links || 0) + " 连线</span>"
      + '<span class="mini-tag">' + esc(w.base) + "</span>"
      + (sel.res ? '<span class="mini-tag">画布 ' + sel.res.width + "×" + sel.res.height + "</span>" : "")
      + (w.pub ? '<span class="mini-tag">发布 ' + esc(w.pub) + "</span>" : "")
      + (sel.fmt === "api" ? '<span class="mini-tag">API 格式（自动布局）</span>' : "")
      + (w.variants && w.variants.length > 1 ? '<span class="mini-tag" style="color:#7dd3fc">📦 包内共 ' + w.variants.length + " 份工作流</span>" : "")
      + "</div>"
      + '<p class="ph-desc" id="cvAiSum">' + esc(summaryLine(w)) + "</p>"
      + '<div class="ph-meta" id="cvDiffRow" style="display:none"></div>'
      + '<p class="ph-desc" style="font-size:13px">作者 ' + esc(w.by)
      + ' · <a class="cv-link" href="https://civitai.com/models/' + w.m + '" target="_blank" rel="noopener">在 Civitai 查看源页面 ↗</a>'
      + (w.tags && w.tags.length ? " · 标签：" + w.tags.map(esc).join("、") : "") + "</p></div>"
      + '<div id="cvAiBlocks"></div>';

    /* 附加工作流切换 */
    if (variants.length > 1) {
      html += '<div class="cv-variant-bar" id="cvVariants"><span class="cv-variant-label">包内工作流：</span>';
      variants.forEach(function (v, i) {
        html += '<a class="cv-variant-btn' + (String(v.i) === String(sel.i) ? " active" : "") + '" href="#/civitai/' + w.v + "/" + i + '" title="' + esc(v.name || "") + '">'
          + (i === 0 ? "★ 主文件" : "#" + (i + 1)) + " · " + v.nodes + " 节点" + (v.cat && v.cat !== w.cat ? " · " + esc(v.cat) : "") + "</a>";
      });
      html += "</div>";
    }

    /* 交互式节点图（懒加载 + AI 阶段拆解） */
    html += '<div class="section"><div class="sec-head"><h2 style="font-size:20px">工作流节点图</h2><span class="sec-en">INTERACTIVE GRAPH</span></div>'
      + '<p class="sec-desc">按原始画布坐标还原的节点图：拖拽平移 · 滚轮缩放 · <b>点击节点</b>查看它的作用、端口与参数解释；双击空白处复位。连线颜色 = 数据类型。</p>'
      + (variants.length > 1 ? '<p class="cv-variant-file mono">' + esc(sel.name || ("#" + (sel.i + 1))) + "</p>" : "")
      + '<div id="cvStages"></div>'
      + '<div id="cvGraph"><div class="cv-loading">节点图加载中…</div></div>'
      + '<div id="cvStageItems"></div>'
      + '<div class="graph-legend"><span>连线颜色：</span>'
      + [["MODEL", "#8b5cf6"], ["CLIP", "#c9b34a"], ["VAE", "#d9534f"], ["LATENT", "#5faf5f"], ["IMAGE", "#3d8bd6"], ["CONDITIONING", "#e8a33d"], ["CONTROL_NET", "#a1887f"], ["VIDEO", "#d4618c"]]
        .map(function (x) { return '<span class="lg"><span class="sw" style="background:' + x[1] + '"></span>' + x[0] + "</span>"; }).join("")
      + "</div></div>";

    if (packs.length) {
      html += '<div class="section"><div class="sec-head"><h2 style="font-size:20px">需要安装的社区节点包</h2><span class="sec-en">REQUIRED NODE PACKS</span></div>'
        + '<table class="data-table"><tr><th>节点包</th><th>用到的方法数</th><th>说明</th></tr>';
      packs.forEach(function (p) {
        var note = p[0] === "其他自定义" ? "长尾社区节点，装 ComfyUI-Manager 后按节点名搜索安装" : "用 ComfyUI-Manager 按包名搜索安装";
        html += "<tr><td>" + esc(p[0] === "其他自定义" ? "其他 / 长尾社区节点" : p[0]) + "</td><td>" + p[1] + "</td><td style=\"color:var(--muted)\">" + note + "</td></tr>";
      });
      html += "</table></div>";
    }

    if (models.length) {
      html += '<div class="section"><div class="sec-head"><h2 style="font-size:20px">引用的模型 / LoRA 文件</h2><span class="sec-en">MODEL REFERENCES</span></div>'
        + '<table class="data-table"><tr><th>文件名</th><th>所在节点</th></tr>';
      models.forEach(function (m) {
        html += '<tr><td class="mono" style="color:#93c5fd">' + esc(m.f) + "</td><td style=\"color:var(--muted)\">" + esc(m.n) + "</td></tr>";
      });
      html += "</table>"
        + '<div class="callout info" style="margin-top:12px"><span class="co-ico">📥</span><div><span class="co-title">说明</span>以上是这条工作流引用的模型文件名，按名字在 Civitai / Hugging Face 搜索下载，放入 models 对应子目录即可复跑。</div></div>'
        + "</div>";
    }

    if (nt.length) {
      var maxN = nt[0][1] || 1;
      html += '<div class="section"><div class="sec-head"><h2 style="font-size:20px">节点构成</h2><span class="sec-en">NODE COMPOSITION</span></div><div class="cv-bars">';
      nt.forEach(function (kv) {
        html += '<div class="cv-bar"><span class="cv-bar-name mono">' + esc(kv[0]) + '</span>'
          + '<span class="cv-bar-track"><span class="cv-bar-fill" style="width:' + Math.max(4, Math.round(kv[1] / maxN * 100)) + '%"></span></span>'
          + '<span class="cv-bar-num">×' + kv[1] + "</span></div>";
      });
      html += "</div><p style=\"font-size:12px;color:var(--faint);margin-top:8px\">只列出出现最多的 " + nt.length + " 类节点。" + (sel.customCount ? "全图含 " + sel.customCount + " 类自定义节点。" : "全图均为 ComfyUI 内置节点。") + "</p></div>";
    }

    html += "</div>";
    return html;
  }

  function loadGraph(vid, vi) {
    var box = $("#cvGraph");
    if (!box) return;
    box.innerHTML = '<div class="cv-loading">节点图加载中…</div>';
    fetch("assets/files/civitai/graph/" + vid + "__" + vi + ".json")
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (g) {
        if (!box.isConnected) return;
        box.innerHTML = "";
        var handle = null;
        try { handle = window.ComfyGraph.render(box, g); }
        catch (e) { box.innerHTML = '<div class="card">该图节点过多，渲染失败。</div>'; }
        renderAiBlocks(g.ai || null, handle, g.sameAs || null);
      })
      .catch(function () {
        if (box.isConnected) box.innerHTML = '<div class="card">节点图数据缺失（该工作流可能解析失败或尚未生成）。</div>';
      });
  }

  /* AI 精读内容渲染：摘要替换、难度、阶段拆解 chips 联动高亮、使用场景、参数与警示 */
  function renderAiBlocks(ai, handle, sameAs) {
    var sum = $("#cvAiSum"), diffRow = $("#cvDiffRow"), blocks = $("#cvAiBlocks");
    if (!sum) return;
    if (sameAs) {
      sum.innerHTML = '<span class="cv-dup-tag copy">同构副本</span>本工作流与 <a class="cv-link mono" href="#/civitai/' + sameAs.split("__")[0] + '">主代表 ' + esc(sameAs) + '</a> 的图结构完全相同，讲解同源。' ;
      return;
    }
    if (!ai) return;
    sum.innerHTML = '<span class="cv-ai-badge">AI 精读</span>' + esc(ai.s || "");
    if (ai.d) {
      var stars = "";
      for (var i = 1; i <= 3; i++) stars += i <= ai.d ? "★" : "☆";
      diffRow.style.display = "";
      diffRow.innerHTML = '<span class="diff" style="color:#e8a33d">' + stars + '</span><span class="mini-tag">上手难度 ' + ai.d + "/3</span>";
    }
    if (blocks) {
      var html = "";
      if (ai.u && ai.u.length) {
        html += '<div class="section"><div class="sec-head"><h2 style="font-size:20px">什么场景用它</h2><span class="sec-en">USE CASES</span></div><ul class="cv-uc-list">';
        ai.u.forEach(function (u) { html += "<li>" + esc(u) + "</li>"; });
        html += "</ul></div>";
      }
      if (ai.p) html += '<div class="callout info"><span class="co-ico">🎛</span><div><span class="co-title">参数建议</span>' + esc(ai.p) + "</div></div>";
      if (ai.n) html += '<div class="callout danger"><span class="co-ico">⚠️</span><div><span class="co-title">使用前必读</span>' + esc(ai.n) + "</div></div>";
      blocks.innerHTML = html;
    }
    var stageBox = $("#cvStages"), itemBox = $("#cvStageItems");
    if (stageBox && ai.st && ai.st.length && handle) {
      stageBox.innerHTML = '<div class="stage-chips">' + ai.st.map(function (s, i) {
        return '<button class="stage-chip" data-i="' + i + '">' + (i + 1) + ". " + esc(s.name) + "</button>";
      }).join("") + "</div>";
      var active = -1;
      stageBox.addEventListener("click", function (e) {
        var b = e.target.closest(".stage-chip");
        if (!b) return;
        var i = parseInt(b.getAttribute("data-i"), 10);
        $all("#cvStages .stage-chip").forEach(function (x) { x.classList.toggle("active", x === b && active !== i); });
        if (active === i) { handle.highlight(null); active = -1; }
        else { handle.highlight(ai.st[i].nodes.map(String)); active = i; }
      });
      if (itemBox) {
        itemBox.innerHTML = '<div class="stage-line">' + ai.st.map(function (s, si) {
          return '<div class="stage-item"><h4><span class="stage-num">' + (si + 1) + "</span>" + esc(s.name) + "</h4><p>" + esc(s.desc) + "</p></div>";
        }).join("") + "</div>";
      }
    }
  }

  function mountDetail(vid, vi) {
    loadGraph(String(vid), vi || 0);
  }

  window.PAGE_CIVITAI = { render: render, mount: mount, renderDetail: renderDetail, mountDetail: mountDetail };
})();
