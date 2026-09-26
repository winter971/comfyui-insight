#!/usr/bin/env node
/* ============================================================
   fix_backticks.mjs — 机制性修复 ai 载荷里的反引号（债表「含反引号」类）
   规则：成对 `x` → 「x」；孤立 ` 剔除。只处理 graph 的 .ai 子树，图结构不动。
   用法:
     node scripts/fix_backticks.mjs              # 干跑：列出含反引号的图及命中数
     node scripts/fix_backticks.mjs --apply      # 写盘（写完记得跑 ai_validate 复验）
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GRAPH_DIR = path.join(ROOT, "assets", "files", "civitai", "graph");
const apply = process.argv.includes("--apply");

const clean = (s) => s.replace(/`([^`\n]{1,120}?)`/g, "「$1」").replace(/`/g, "");
function walk(node) {
  if (typeof node === "string") return [clean(node), node !== clean(node)];
  if (Array.isArray(node)) {
    let hit = 0;
    const out = node.map((v) => { const [nv, h] = walk(v); hit += h; return nv; });
    return [out, hit];
  }
  if (node && typeof node === "object") {
    let hit = 0;
    const o = {};
    for (const [k, v] of Object.entries(node)) { const [nv, h] = walk(v); hit += h; o[k] = nv; }
    return [o, hit];
  }
  return [node, 0];
}

let files = 0, hits = 0;
for (const f of fs.readdirSync(GRAPH_DIR)) {
  if (!/^\d+__\d+\.json$/.test(f)) continue;
  const p = path.join(GRAPH_DIR, f);
  const text = fs.readFileSync(p, "utf8");
  if (!text.includes("`")) continue;
  const g = JSON.parse(text);
  const [ai, hit] = walk(g.ai);
  if (!hit) continue;
  files++; hits += hit;
  console.log(`${f}: ${hit} 处`);
  if (apply) { g.ai = ai; fs.writeFileSync(p, JSON.stringify(g)); }
}
console.log(apply ? `applied: ${files} files, ${hits} hits` : `dry-run: ${files} files, ${hits} hits (加 --apply 写盘)`);
