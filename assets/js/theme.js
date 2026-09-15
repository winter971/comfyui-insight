/* ============================================================
   ComfyUI 全景解析 — 主题层
   三个主题共用同一套 DOM，由 html[data-theme] 决定外观：
     c    精装出版物（米白纸底 · 衬线 · 书籍流）—— 默认
     f    数据人文主义（深靛 Riso · 横向章节带 · 双栏混排）
     base 原版深色（节点暖色）
   本文件只做「主题状态 + 切换器 + 抽屉关闭按钮」，不参与页面渲染，
   因此不会影响任何既有功能。
   ============================================================ */
(function () {
  "use strict";

  var KEY = "cvgTheme";
  var THEMES = ["c", "f", "base"];
  var LABEL = { c: "精装出版物", f: "数据人文主义", base: "原版深色" };
  var root = document.documentElement;

  function norm(t) { return THEMES.indexOf(t) >= 0 ? t : "c"; }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function fromUrl() {
    try { var m = /[?&]theme=([a-z]+)/i.exec(location.search); return m ? m[1].toLowerCase() : null; } catch (e) { return null; }
  }

  function current() { return norm(root.getAttribute("data-theme")); }

  /* 切换器里的色板：直接读当前主题的真实 token，保证色板不撒谎 */
  function swatchStyle(theme) {
    var map = {
      c:    { bg: "#faf7f0", bd: "#ded5c4", dot: "#8a5a12" },
      f:    { bg: "#1e1d40", bd: "#4d4d7d", dot: "#e9b23c" },
      base: { bg: "#1f1a16", bd: "#463b30", dot: "#e8a33d" }
    };
    var m = map[theme];
    return "background:" + m.bg + ";border-color:" + m.bd + ";";
  }

  function renderSwitch(mount) {
    if (!mount || mount.getAttribute("data-built") === "1") return;
    mount.innerHTML = THEMES.map(function (t) {
      return '<button type="button" class="ts-btn" data-set-theme="' + t +
        '" data-name="' + LABEL[t] + '" aria-label="切换到' + LABEL[t] + '主题" aria-pressed="false">' +
        '<i class="ts-sw" style="' + swatchStyle(t) + '"></i><span class="ts-lb">' +
        LABEL[t].slice(0, 2) + "</span></button>";
    }).join("");
    mount.setAttribute("data-built", "1");
  }

  function syncSwitch() {
    var cur = current();
    Array.prototype.forEach.call(document.querySelectorAll(".theme-switch .ts-btn"), function (b) {
      var on = b.getAttribute("data-set-theme") === cur;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("on", on);
    });
  }

  var lastTheme = current();

  function apply(theme, persist) {
    var t = norm(theme);
    root.setAttribute("data-theme", t);
    if (persist) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    syncSwitch();
    if (t !== lastTheme) {
      lastTheme = t;
      /* 广播给关心主题的模块（当前无消费者，留给后续扩展） */
      try {
        document.dispatchEvent(new CustomEvent("cvg:themechange", { detail: { theme: t } }));
      } catch (e) {}
    }
  }

  /* ---------- 事件绑定 ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".theme-switch .ts-btn");
    if (btn) {
      apply(btn.getAttribute("data-set-theme"), true);
      return;
    }
    /* 抽屉内关闭按钮：与遮罩 / Esc / hashchange 并列的第四个关闭入口 */
    if (e.target.closest && e.target.closest("#drawerClose")) {
      document.body.classList.remove("nav-open");
      var tg = document.getElementById("navToggle");
      if (tg) tg.setAttribute("aria-expanded", "false");
    }
  });

  function init() {
    renderSwitch(document.getElementById("themeSwitchTop"));
    renderSwitch(document.getElementById("themeSwitchDrawer"));
    var u = fromUrl();
    if (u && THEMES.indexOf(u) >= 0) apply(u, false); else apply(current(), false);
    lastTheme = current();
  }

  window.CVG_THEME = {
    list: THEMES.slice(),
    get: current,
    set: function (t) { apply(t, true); },
    label: function (t) { return LABEL[norm(t)]; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
