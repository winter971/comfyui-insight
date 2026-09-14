/* 四 · 真实工作流库 —— 专题（TOPICS）
   数据: window.COMFY_DATA.civitaiTopics (见 data/topics.js，由 _sources/build_topics.cjs 生成)
   路由: #/civitai/topic      专题列表
         #/civitai/topic/{id} 专题详情                                        */
(function () {
  "use strict";
  function D() { return window.COMFY_DATA || {}; }
  function topics() { return D().civitaiTopics || []; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function fmtN(n) { n = n || 0; return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "w" : String(n); }
  function topicById(id) {
    var t = null;
    topics().forEach(function (x) { if (x.id === id) t = x; });
    return t;
  }

  /* ============ 专题列表 ============ */
  function renderList() {
    var list = topics();
    var html = '<div class="container">'
      + '<a class="back-link" href="#/civitai">← 返回真实工作流库</a>'
      + '<div class="sec-head"><h2>专题</h2><span class="sec-en">TOPICS</span></div>'
      + '<p class="sec-desc">把一个模型家族或一类玩法从两千多条工作流里单独拎出来：不仅有成员清单，还有跨工作流的横向讲解——这个技术是什么、社区演化出哪几套套路、它们之间怎么选、有哪些坑。每个专题的成员都从库里按规则自动圈定，并可人工微调。</p>';
    if (!list.length) {
      html += '<div class="card">专题数据尚未生成：请在 _sources 下运行 build_topics.cjs。</div></div>';
      return html;
    }
    html += '<div class="tp-grid">';
    list.forEach(function (t) {
      html += '<a class="tp-card" href="#/civitai/topic/' + esc(t.id) + '">'
        + '<div class="tp-card-top"><span class="tp-ico">' + esc(t.icon) + "</span>"
        + '<div><h3>' + esc(t.name) + "</h3>"
        + '<div class="tp-tagline">' + esc(t.tagline || "") + "</div></div></div>"
        + '<div class="tp-card-foot">'
        + '<span class="mini-tag">' + t.memberCount + " 条工作流</span>"
        + '<span class="mini-tag">✓ ' + t.aiCount + " 条已精读</span>"
        + '<span class="mini-tag">' + t.groups.length + " 个分组</span>"
        + "</div></a>";
    });
    html += "</div></div>";
    return html;
  }
  function mountList() { }

  /* ============ 专题详情 ============ */
  var S = { sub: "全部", sort: { k: "dl", dir: -1 } };

  function renderDetail(id) {
    var t = topicById(id);
    if (!t) return '<div class="container"><div class="card">未找到该专题。<a href="#/civitai/topic">返回专题列表</a></div></div>';
    var subName = {};
    t.groups.forEach(function (g) { subName[g.id] = g.name; });

    var html = '<div class="container">'
      + '<a class="back-link" href="#/civitai">← 返回真实工作流库</a>'
      + '<div class="tp-hero">'
      + '<div class="tp-hero-top"><span class="tp-hero-ico">' + esc(t.icon) + "</span>"
      + '<div><h1>' + esc(t.name) + "</h1>"
      + '<div class="tp-tagline">' + esc(t.tagline || "") + "</div></div></div>"
      + '<div class="tp-tiles">'
      + tile(t.memberCount, "条工作流")
      + tile(t.aiCount, "条已 AI 精读")
      + tile(t.groups.length, "个玩法分组")
      + (t.coreCount < t.memberCount ? tile(t.coreCount, "条核心（名称命中）") : "")
      + "</div>"
      + '<div class="tp-jump">'
      + jumps(t).map(function (x) { var p = x.split(":"); return '<a class="tp-jump-btn" href="#tp-' + p[0] + '">' + p[1] + "</a>"; }).join("")
      + "</div></div>";

    /* 导言 */
    if (t.intro) {
      html += '<div class="section" id="tp-intro"><div class="sec-head"><h2 style="font-size:20px">导言</h2><span class="sec-en">INTRODUCTION</span></div>'
        + '<div class="card tp-lead">' + esc(t.intro.lead) + "</div>";
      (t.intro.blocks || []).forEach(function (b) {
        html += '<div class="card tp-block"><h4>' + esc(b.h) + "</h4><p>" + esc(b.p) + "</p></div>";
      });
      html += "</div>";
    }

    /* 管线 */
    if (t.intro && (t.intro.pipeline || []).length) {
      html += '<div class="section" id="tp-pipeline"><div class="sec-head"><h2 style="font-size:20px">管线四步</h2><span class="sec-en">PIPELINE</span></div><div class="tp-pipe">';
      t.intro.pipeline.forEach(function (p, i) {
        html += '<div class="tp-pipe-step"><span class="tp-pipe-n">' + (i + 1) + "</span>"
          + '<div><div class="tp-pipe-k">' + esc(p.k) + '</div><div class="tp-pipe-v">' + esc(p.v) + "</div></div></div>";
      });
      html += "</div></div>";
    }

    /* 模型规格 */
    if (t.specs && (t.specs.items || []).length) {
      html += '<div class="section" id="tp-specs"><div class="sec-head"><h2 style="font-size:20px">模型规格</h2><span class="sec-en">SPECIFICATIONS</span></div>'
        + '<table class="data-table"><tr><th style="width:160px">项目</th><th>说明</th></tr>';
      t.specs.items.forEach(function (it) {
        html += '<tr><td class="mono" style="color:#93c5fd">' + esc(it.k) + '</td><td style="color:var(--muted)">' + esc(it.v) + "</td></tr>";
      });
      html += "</table></div>";
    }

    /* 成员（按子主题分组） */
    html += '<div class="section" id="tp-members"><div class="sec-head"><h2 style="font-size:20px">成员清单</h2><span class="sec-en">MEMBERS</span>'
      + '<span style="font-size:12px;color:var(--faint)">按玩法分组 · 点任意一条进入精读详情</span></div>';
    t.groups.forEach(function (g) {
      html += '<div class="tp-group">'
        + '<div class="tp-group-head"><h3>' + esc(g.name) + '</h3><span class="tp-group-n">'
        + (g.truncated ? g.members.length + " / " + g.total + " 条" : g.members.length + " 条") + "</span>"
        + (g.truncated
            ? (g.q
                ? '<a class="tp-group-all" href="#/civitai/q=' + encodeURIComponent(g.q) + '">在库中查看全部 ' + g.total + " 条 →</a>"
                : '<span class="tp-group-all dim">按下载量展示前 ' + g.members.length + " 条</span>")
            : "")
        + "</div>"
        + (g.desc ? '<p class="tp-group-desc">' + esc(g.desc) + "</p>" : "")
        + '<div class="wf-grid">';
      g.members.forEach(function (m) {
        html += '<a class="wf-card" href="#/civitai/' + m.v + '">'
          + "<h3>" + (m.nsfw ? '<span class="cv-nsfw-pill">18+</span>' : "") + esc(m.name) + "</h3>"
          + '<div class="wf-desc">' + esc(m.by ? "作者 " + m.by + " · " : "") + m.nodes + " 节点 · " + esc(m.cat || "") + "</div>"
          + '<div class="wf-foot"><span class="mini-tag">' + fmtN(m.dl) + '</span><span class="mini-tag">' + fmtN(m.up) + "</span>"
          + (m.ai ? '<span class="cv-ai-mini">已精读</span>' : '<span class="mini-tag">待精读</span>')
          + (m.pub ? '<span class="mini-tag">' + esc(m.pub) + "</span>" : "")
          + (m.vc > 1 ? '<span class="mini-tag" style="color:#e8b98f">' + m.vc + " 份</span>" : "")
          + "</div></a>";
      });
      html += "</div></div>";
    });
    html += "</div>";

    /* 横向对比 */
    html += '<div class="section" id="tp-compare"><div class="sec-head"><h2 style="font-size:20px">横向对比</h2><span class="sec-en">COMPARISON</span>'
      + '<span style="font-size:12px;color:var(--faint)">点表头排序 · 点分组只看某一类</span></div>'
      + '<div class="filter-bar" id="tpCmpSubs"></div>'
      + (t.compare.truncated ? '<p class="tp-note">共 ' + t.compare.total + " 条，此处列出 " + t.compare.rows.length + " 条（优先已 AI 精读）</p>" : "")
      + '<div class="tp-cmp-wrap"><table class="tp-cmp"><thead id="tpCmpHead"></thead><tbody id="tpCmpBody"></tbody></table></div>'
      + (t.compare.note ? '<p style="font-size:12px;color:var(--faint);margin-top:8px">' + esc(t.compare.note) + "</p>" : "")
      + "</div>";

    /* 选型指南 */
    if ((t.guide || []).length) {
      html += '<div class="section" id="tp-guide"><div class="sec-head"><h2 style="font-size:20px">怎么选</h2><span class="sec-en">HOW TO CHOOSE</span></div><div class="card">';
      t.guide.forEach(function (g) {
        html += '<div class="tp-guide-row"><div class="tp-guide-q">' + esc(g.q) + '</div><div class="tp-guide-a">' + esc(g.a) + "</div></div>";
      });
      html += "</div></div>";
    }

    /* 踩坑 */
    if ((t.pitfalls || []).length) {
      html += '<div class="section" id="tp-pitfalls"><div class="sec-head"><h2 style="font-size:20px">踩坑清单</h2><span class="sec-en">PITFALLS</span></div>'
        + '<div class="callout danger"><span class="co-ico"></span><div><span class="co-title">动手前先看这些</span><ul class="tp-list">';
      t.pitfalls.forEach(function (p) { html += "<li>" + esc(p) + "</li>"; });
      html += "</ul></div></div></div>";
    }

    /* FAQ */
    if ((t.faq || []).length) {
      html += '<div class="section" id="tp-faq"><div class="sec-head"><h2 style="font-size:20px">常见问题</h2><span class="sec-en">FAQ</span></div><div class="card">';
      t.faq.forEach(function (f) {
        html += '<details class="tp-faq"><summary>' + esc(f.q) + '</summary><div class="tp-faq-a">' + esc(f.a) + "</div></details>";
      });
      html += "</div></div>";
    }

    /* 延伸阅读：专题相关的外部资料（作者指南 / 原页面），并回链库内精读 */
    if ((t.resources || []).length) {
      html += '<div class="section" id="tp-res"><div class="sec-head"><h2 style="font-size:20px">延伸阅读</h2><span class="sec-en">RESOURCES</span>'
        + '<span style="font-size:12px;color:var(--faint)">外部链接在新标签页打开</span></div>';
      t.resources.forEach(function (r) {
        var v = (r.rel || [])[0];
        html += '<div class="tp-res">'
          + '<a class="tp-res-t" href="' + esc(r.u) + '" target="_blank" rel="noopener">' + esc(r.t) + " ↗</a>"
          + (r.d ? '<div class="tp-res-d">' + esc(r.d) + "</div>" : "")
          + (v ? '<a class="tp-res-go" href="#/civitai/' + v + '">看库内精读 →</a>' : "")
          + "</div>";
      });
      html += "</div>";
    }

    html += '<div style="margin-top:26px"><a class="filter-btn" href="#/civitai/topic">← 全部专题</a> '
      + '<a class="filter-btn" href="#/civitai">浏览完整工作流库</a></div></div>';
    return html;
  }

  function tile(num, label) {
    return '<div class="cv-tile"><div class="cv-tile-num">' + num + '</div><div class="cv-tile-label">' + esc(label) + "</div></div>";
  }

  /* 顶部快速跳转：只列这个专题实际拥有的区块 */
  function jumps(t) {
    var j = ["intro:导言", "pipeline:管线", "specs:模型规格", "members:成员", "compare:横向对比"];
    if ((t.guide || []).length) j.push("guide:怎么选");
    if ((t.pitfalls || []).length) j.push("pitfalls:踩坑");
    if ((t.faq || []).length) j.push("faq:常见问题");
    if ((t.resources || []).length) j.push("res:延伸阅读");
    return j;
  }

  /* 对比表 */
  function cmpRows(t) {
    var byV = {};
    t.groups.forEach(function (g) { g.members.forEach(function (m) { byV[m.v] = m; }); });
    var rows = (t.compare.rows || []).map(function (r) {
      return {
        v: r.v, name: r.name, by: r.by, sub: r.sub, dl: (byV[r.v] && byV[r.v].dl) || r.dl || 0,
        vals: r.vals || {}
      };
    });
    if (S.sub !== "全部") rows = rows.filter(function (r) { return r.sub === S.sub; });
    var k = S.sort.k, dir = S.sort.dir;
    rows.sort(function (a, b) {
      var va, vb;
      if (k === "name") { va = a.name; vb = b.name; return String(va).localeCompare(String(vb)) * dir; }
      if (k === "sub") { va = a.sub; vb = b.sub; return String(va).localeCompare(String(vb)) * dir; }
      if (k === "dl") { return (a.dl - b.dl) * dir; }
      va = a.vals[k]; vb = b.vals[k];
      var na = (va === "" || va === undefined), nb = (vb === "" || vb === undefined);
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      var numa = parseFloat(va), numb = parseFloat(vb);
      if (!isNaN(numa) && !isNaN(numb)) return (numa - numb) * dir;
      return String(va).localeCompare(String(vb), "zh") * dir;
    });
    return rows;
  }

  function paintCmp(t) {
    var head = $("#tpCmpHead"), body = $("#tpCmpBody");
    if (!head || !body) return;
    var subName = {};
    t.groups.forEach(function (g) { subName[g.id] = g.name; });

    var arrow = function (k) { return S.sort.k === k ? (S.sort.dir === -1 ? " ▼" : " ▲") : ""; };
    var h = "<tr>";
    h += '<th class="tp-th" data-k="name">工作流' + arrow("name") + "</th>";
    h += '<th class="tp-th" data-k="sub">玩法' + arrow("sub") + "</th>";
    t.compare.cols.forEach(function (c) { h += '<th class="tp-th" data-k="' + esc(c.k) + '">' + esc(c.label) + arrow(c.k) + "</th>"; });
    h += '<th class="tp-th" data-k="dl">下载' + arrow("dl") + "</th></tr>";
    head.innerHTML = h;

    var rows = cmpRows(t);
    var html = "";
    rows.forEach(function (r) {
      html += '<tr><td><a class="cv-tname" href="#/civitai/' + r.v + '">' + esc(r.name) + "</a>"
        + '<div class="tp-cmp-by">' + esc(r.by || "") + "</div></td>"
        + '<td><span class="tp-sub-pill">' + esc(subName[r.sub] || r.sub) + "</span></td>";
      t.compare.cols.forEach(function (c) {
        var v = r.vals[c.k];
        var cls = "";
        if (c.k === "audio") cls = v && v.indexOf("✓") >= 0 ? " tp-yes" : " tp-no";
        if (c.k === "speed") cls = v && v !== "—" ? " tp-yes" : " tp-no";
        html += '<td class="tp-cmp-val' + cls + '">' + esc(v || "—") + "</td>";
      });
      html += '<td class="num">' + fmtN(r.dl) + "</td></tr>";
    });
    body.innerHTML = html || '<tr><td class="tp-empty" colspan="' + (t.compare.cols.length + 3) + '">没有匹配的工作流</td></tr>';
  }

  function paintCmpSubs(t) {
    var bar = $("#tpCmpSubs");
    if (!bar) return;
    var subs = ["全部"];
    t.groups.forEach(function (g) { subs.push(g.id); });
    var nameOf = {};
    t.groups.forEach(function (g) { nameOf[g.id] = g.name; });
    bar.innerHTML = subs.map(function (s) {
      var label = s === "全部" ? "全部玩法" : nameOf[s];
      return '<button class="filter-btn' + (s === S.sub ? " active" : "") + '" data-sub="' + esc(s) + '">' + esc(label) + "</button>";
    }).join("");
  }

  function mountDetail(id) {
    var t = topicById(id);
    if (!t) return;
    S = { sub: "全部", sort: { k: "dl", dir: -1 } };
    paintCmpSubs(t);
    paintCmp(t);
    var bar = $("#tpCmpSubs");
    if (bar) bar.addEventListener("click", function (e) {
      var b = e.target.closest(".filter-btn");
      if (!b) return;
      S.sub = b.getAttribute("data-sub");
      $all("#tpCmpSubs .filter-btn").forEach(function (x) { x.classList.toggle("active", x === b); });
      paintCmp(t);
    });
    var head = $("#tpCmpHead");
    if (head) head.addEventListener("click", function (e) {
      var th = e.target.closest("[data-k]");
      if (!th) return;
      var k = th.getAttribute("data-k");
      if (S.sort.k === k) S.sort.dir = -S.sort.dir; else S.sort = { k: k, dir: -1 };
      paintCmp(t);
    });
  }

  window.PAGE_TOPICS = {
    renderList: renderList, mountList: mountList,
    renderDetail: renderDetail, mountDetail: mountDetail
  };
})();
