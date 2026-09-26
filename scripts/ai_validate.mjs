#!/usr/bin/env node
/* ============================================================
   ai_validate.mjs — AI 精读载荷「新门槛」校验器（仓库内自足版）
   门槛口径来自 AGENTS.md「精读门槛」节（2026-09-25 一代）：
     s ≥220 字；u ≥3 项且每项 ≥15 字；d ∈1~3；
     st ≥min(3,功能节点数) 段且覆盖 ≥50% 功能节点；
     na ≥max(min(4,功能节点数), min(20, ceil(功能节点×0.3))) 条；
     st/na 引用节点 ID 必须真实存在；na 每条说明（desc/detail）≥20 字符；
     卫生：反引号/markdown/制表符/ASCII 单引号/TODO 占位 一律不过；
     p 不得为空（对应债表「缺 p」类）。
   功能节点 = 排除 Note / MarkdownNote / Note Plus (mtb) / Label (rgthree) /
     CR Prompt Text / Text Multiline / PrimitiveStringMultiline / ShowText|pysssss
   用法:
     node scripts/ai_validate.mjs <vid__idx> [moreKeys...]   # 校验仓库 graph 的 ai 载荷
     node scripts/ai_validate.mjs --all                      # 全库扫描（输出债表 JSON lines）
     node scripts/ai_validate.mjs --legacy <file.json> [...] # 校验 _sources 旧 schema 稿（转换后判）
   退出码：全部 pass=0，否则 1。每行输出一个 JSON：{key,pass,fails[]}
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GRAPH_DIR = path.join(ROOT, "assets", "files", "civitai", "graph");

const NON_FUNCTIONAL = new Set([
  "Note", "MarkdownNote", "Note Plus (mtb)", "Label (rgthree)",
  "CR Prompt Text", "Text Multiline", "PrimitiveStringMultiline", "ShowText|pysssss",
]);

// 旧 schema（本机 _sources/ai_analysis 长键）→ 仓库 pack（短键）。
// 与 build_graphs.cjs 的 pack 构造逐字段一致，已用 1081 份等价稿验证过双射。
export function transformLegacy(a) {
  const p = { s: a.summary, u: a.useCases, d: a.difficulty, st: a.stages, p: a.params || "", n: a.notice || "" };
  if (a.flow) p.f = a.flow;
  if (a.tips) p.t = a.tips;
  if (a.nodeAnalysis) p.na = a.nodeAnalysis;
  return p;
}

export function functionalNodes(graph) {
  const nodes = (graph.nodes || []).map((n) => String(n.type || "Unknown"));
  return nodes.filter((t) => !NON_FUNCTIONAL.has(t)).length;
}

const HYGIENE = [
  ["backtick", /`/],
  ["markdown", /\*\*|(^|\n)#{1,6} /],
  ["tab", /\t/],
  ["ascii-quote", /'/],
  ["placeholder", /\bTODO\b|\bTBD\b|\bFIXME\b|待补充|待完善|lorem ipsum/i],
];

/* 旧稿规范化清洗：配对引号→「」、字母间撇号→’、孤立反引号/引号剔除。
   清洗不保证语义完美，因此清洗后必须重新过 validatePack 才允许注入。 */
export function cleanPackText(node) {
  const clean = (s) => s
    .replace(/`([^`\n]{1,120}?)`/g, "「$1」")
    .replace(/`/g, "")
    .replace(/'([^'\n]{1,120}?)'/g, "「$1」")
    .replace(/(\p{L})'(\p{L})/gu, "$1’$2")
    .replace(/'/g, "");
  if (typeof node === "string") return clean(node);
  if (Array.isArray(node)) return node.map(cleanPackText);
  if (node && typeof node === "object") {
    const o = {};
    for (const [k, v] of Object.entries(node)) o[k] = cleanPackText(v);
    return o;
  }
  return node;
}

function strFailures(label, v, fails) {
  if (typeof v !== "string") return;
  for (const [name, re] of HYGIENE) if (re.test(v)) fails.push(`${label}:${name}`);
}

export function validatePack(graph, ai) {
  const fails = [];
  const types = new Set((graph.nodes || []).map((n) => String(n.id)));
  const func = functionalNodes(graph);
  if (!ai || typeof ai !== "object") return { fails: ["missing-ai"], func };

  // s / u / d
  if (typeof ai.s !== "string" || ai.s.length < 220) fails.push("s<220");
  if (!Array.isArray(ai.u) || ai.u.length < 3 || ai.u.some((x) => typeof x !== "string" || x.length < 15)) fails.push("u<3x15");
  if (!Number.isInteger(ai.d) || ai.d < 1 || ai.d > 3) fails.push("d-range");
  strFailures("s", ai.s, fails);
  (Array.isArray(ai.u) ? ai.u : []).forEach((x, i) => strFailures(`u[${i}]`, x, fails));

  // st：段数 + 节点存在性 + 覆盖率
  const st = Array.isArray(ai.st) ? ai.st : [];
  if (st.length < Math.min(3, func)) fails.push(`st<${Math.min(3, func)}`);
  const stIds = new Set();
  for (let i = 0; i < st.length; i++) {
    const seg = st[i] || {};
    for (const id of Array.isArray(seg.nodes) ? seg.nodes : []) {
      if (!types.has(String(id))) { fails.push(`st[${i}].id-missing:${id}`); continue; }
      stIds.add(String(id));
    }
    strFailures(`st[${i}].name`, seg.name, fails);
    strFailures(`st[${i}].desc`, seg.desc, fails);
  }
  const funcIds = new Set((graph.nodes || []).filter((n) => !NON_FUNCTIONAL.has(String(n.type || ""))).map((n) => String(n.id)));
  let covered = 0;
  for (const id of stIds) if (funcIds.has(id)) covered++;
  if (func > 0 && covered / func < 0.5) fails.push(`st-coverage<50%(${covered}/${func})`);

  // na：条数下限 + id 存在 + 每条说明 ≥20 字符
  const na = ai.na && typeof ai.na === "object" && !Array.isArray(ai.na) ? ai.na : null;
  const naNeed = Math.max(Math.min(4, func), Math.min(20, Math.ceil(func * 0.3)));
  if (!na || Object.keys(na).length < naNeed) fails.push(`na<${naNeed}`);
  if (na) {
    for (const [id, v] of Object.entries(na)) {
      if (!types.has(String(id))) { fails.push(`na.id-missing:${id}`); continue; }
      const text = (v && (v.detail || v.desc)) || "";
      if (typeof text !== "string" || text.length < 20) fails.push(`na[${id}].text<20`);
      const brief = v && v.brief;
      if (typeof brief !== "string" || brief.trim().length < 2) fails.push(`na[${id}].brief`);
      strFailures(`na[${id}].brief`, brief, fails);
      strFailures(`na[${id}].text`, text, fails);
      strFailures(`na[${id}].params`, v && v.params, fails);
    }
  }

  // p 必填；n/t/f 可选但卫生照查
  if (typeof ai.p !== "string" || ai.p.trim() === "") fails.push("p-empty");
  for (const k of ["p", "n", "f", "t"]) strFailures(k, ai[k], fails);
  return { fails: [...new Set(fails)], func };
}

function loadGraph(key) {
  const p = path.join(GRAPH_DIR, key + ".json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/* CLI 入口：被其他脚本 import 时（apply_legacy_ai 等）不执行 */
import { pathToFileURL } from "node:url";
const asMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

function mainCli() {
  const argv = process.argv.slice(2);
  let keys = [], mode = "repo";
  if (argv[0] === "--all") {
    keys = fs.readdirSync(GRAPH_DIR).filter((f) => /^\d+__\d+\.json$/.test(f)).map((f) => f.replace(".json", ""));
  } else {
    keys = argv.map((k) => k.replace(/\.json$/, ""));
  }

  let bad = 0;
  for (const key of keys) {
    const g = loadGraph(key);
    if (!g) { console.log(JSON.stringify({ key, pass: false, fails: ["no-graph"] })); bad++; continue; }
    const r = validatePack(g, g.ai);
    if (r.fails.length) bad++;
    console.log(JSON.stringify({ key, pass: r.fails.length === 0, fails: r.fails, func: r.func }));
  }
  process.exit(bad ? 1 : 0);
}

function legacyCli() {
  const argv = process.argv.slice(2);
  const AD = path.join(path.resolve(ROOT, ".."), "_sources", "ai_analysis");
  for (const f of argv.slice(1)) {
    const key = f.replace(/\.json$/, "").split(/[\\/]/).pop();
    const a = JSON.parse(fs.readFileSync(path.join(AD, key + ".json"), "utf8"));
    const g = loadGraph(key);
    if (!g) { console.log(JSON.stringify({ key, pass: false, fails: ["no-graph"] })); continue; }
    const r = validatePack(g, transformLegacy(a));
    console.log(JSON.stringify({ key, pass: r.fails.length === 0, fails: r.fails, func: r.func }));
  }
  process.exit(0);
}

if (asMain) {
  if (process.argv[2] === "--legacy") legacyCli();
  else mainCli();
}
