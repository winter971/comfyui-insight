#!/usr/bin/env node
/* ============================================================
   apply_legacy_ai.mjs — 把 _sources 旧 schema 精读稿定向注入仓库图
   适用：另一台机器新工具链未吸收、但仍达新门槛的存量稿。
   绝不重建整图，只替换目标 graph 的 .ai 字段（与 cards 的 d 同步）。
   用法:
     node scripts/apply_legacy_ai.mjs --list=<清单文件>            # 干跑：逐份校验并报告
     node scripts/apply_legacy_ai.mjs --list=<清单文件> --apply    # 写盘（graph + 索引 d）
     node scripts/apply_legacy_ai.mjs <vid__idx> [--apply]         # 指定 key
   清单文件格式：每行一个 vid__idx，# 开头为注释。
   注意：新门槛校验不过的稿会被跳过，绝不带病注入；写盘后跑 sanitize_secrets 再发布。
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformLegacy, validatePack, cleanPackText } from "./ai_validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GRAPH_DIR = path.join(ROOT, "assets", "files", "civitai", "graph");
const WF_JS = path.join(ROOT, "assets", "js", "data", "workflows-civitai.js");
const AD = path.join(path.resolve(ROOT, ".."), "_sources", "ai_analysis");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const listArg = args.find((a) => a.startsWith("--list="));
let keys = [];
if (listArg) {
  const file = listArg.slice(7);
  keys = fs.readFileSync(file, "utf8").split(/\r?\n/)
    .map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && /^\d+__\d+$/.test(l));
} else {
  keys = args.filter((a) => !a.startsWith("--")).map((k) => k.replace(/\.json$/, ""));
}
if (!keys.length) { console.error("no keys given"); process.exit(2); }

let ok = 0; const skipped = [], patched = [];
for (const key of keys) {
  const src = path.join(AD, key + ".json");
  const gp = path.join(GRAPH_DIR, key + ".json");
  if (!fs.existsSync(src)) { skipped.push(key + ":no-legacy-file"); continue; }
  if (!fs.existsSync(gp)) { skipped.push(key + ":no-graph"); continue; }
  let legacy, graph;
  try {
    legacy = JSON.parse(fs.readFileSync(src, "utf8"));
    graph = JSON.parse(fs.readFileSync(gp, "utf8"));
  } catch (e) { skipped.push(key + ":parse-error"); continue; }
  const pack = cleanPackText(transformLegacy(legacy));
  const r = validatePack(graph, pack);
  if (r.fails.length) { skipped.push(key + ":" + r.fails.join(",")); continue; }

  if (apply) {
    graph.ai = pack;
    delete graph.sameAs; /* 注入的是本文工作流自己的精读，不再是继承副本 */
    fs.writeFileSync(gp, JSON.stringify(graph));
  }
  patched.push({ key, func: r.func, na: Object.keys(pack.na || {}).length, d: pack.d });
  ok++;
}

/* 索引 d 同步：卡片的 d 来自 ai.difficulty，被替换稿若改了难度需跟着改 */
let indexNote = "index:untouched";
if (apply && patched.length) {
  const text = fs.readFileSync(WF_JS, "utf8");
  const m = text.match(/^(\s*window\.COMFY_DATA\.civitaiWorkflows = )(\[.*\])(;\r?)$/m);
  if (m) {
    const arr = JSON.parse(m[2]);
    const byV = new Map(arr.map((w) => [String(w.v), w]));
    let changed = 0;
    for (const p of patched) {
      const vid = p.key.split("__")[0];
      const card = byV.get(vid);
      if (card && card.d !== p.d) { card.d = p.d; changed++; }
    }
    if (changed) {
      const out = text.slice(0, m.index) + m[1] + JSON.stringify(arr) + m[3] + text.slice(m.index + m[0].length);
      fs.writeFileSync(WF_JS, out);
      indexNote = "index:d-updated x" + changed;
    } else {
      indexNote = "index:no-d-change";
    }
  } else {
    indexNote = "index:pattern-not-found";
  }
}

console.log(JSON.stringify({ apply, ok, patched, skipped, indexNote }, null, 1));
process.exit(apply && skipped.length ? 3 : 0);
