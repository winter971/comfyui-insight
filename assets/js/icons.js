/* 图标系统 —— 内联 SVG，替代 emoji
   用法：'<span class="ico">' + ICO.search + '</span>'  或  ICO.svg('search', 16)
   设计约束：单色 stroke=currentColor，24×24 网格，stroke-width 1.6 */
(function () {
  "use strict";
  var P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    node: '<rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="14" y="14" width="7" height="6" rx="1.5"/><path d="M10 7h4a3 3 0 0 1 3 3v4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
    network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5L6.5 16.6M12 11.5l5.5 5.1"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.6.9.6 1.5v.7h6v-.7c0-.6.1-1.1.6-1.5A6 6 0 0 0 12 3z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
    box: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2L12 3z"/><path d="M4 7.2l8 4.3 8-4.3M12 11.5V21"/>',
    download: '<path d="M12 3v11"/><path d="M7.5 10L12 14.5 16.5 10"/><path d="M4 18.5h16"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    code: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M9.5 9.5V20"/>',
    cards: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
    link: '<path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/>',
    puzzle: '<path d="M10 4h4v2.2a1.8 1.8 0 1 0 0 3.6V12h4v4h-2.2a1.8 1.8 0 1 0-3.6 0H10v-4H7.8a1.8 1.8 0 1 1 0-3.6H10z"/>',
    microscope: '<path d="M6 20h13"/><path d="M9 20a5 5 0 0 0 8-4"/><path d="M11 4l3 3-4 4-3-3z"/><path d="M9.5 9.5L6 13l2 2 3.5-3.5"/>',
    play: '<path d="M8 5.5v13l11-6.5-11-6.5z"/>',
    alert: '<path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.1"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M19 18v3H6.5"/>',
    sliders: '<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
    ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
    bolt: '<path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5L13 3z"/>',
    tag: '<path d="M4 11V4h7l9 9-7 7-9-9z"/><circle cx="8" cy="8" r="1.4"/>',
    eye: '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    thumb: '<path d="M7 10.5v9H4.5a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 4.5 10.5H7z"/><path d="M7 10.5l4.2-7.2a1.4 1.4 0 0 1 2.6.9V9h4.3a2 2 0 0 1 2 2.4l-1.2 6a2 2 0 0 1-2 1.6H7"/>',
    flask: '<path d="M9.5 3h5M10.5 3v5.2L5.6 17a2 2 0 0 0 1.7 3h9.4a2 2 0 0 0 1.7-3l-4.9-8.8V3"/><path d="M7.6 14.5h8.8"/>'
  };
  function svg(name, size) {
    var body = P[name];
    if (!body) return '';
    var s = size || 16;
    return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }
  window.ICO = P;
  window.ICO.svg = svg;
  window.icoSvg = svg;
})();
