#!/usr/bin/env node
/* ============================================================
   ai-audit.mjs — AI 精读结果审核、校验与自动落盘脚本
   用法:
     node scripts/ai-audit.mjs list [count]       # 列出待精读的高热度工作流
     node scripts/ai-audit.mjs dump <vid>         # 提取指定工作流的精读上下文提示词
     node scripts/ai-audit.mjs apply <vid> <file> # 严格校验并写入 graph.json 与索引
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WF_JS = path.join(ROOT, "assets/js/data/workflows-civitai.js");
const GRAPH_DIR = path.join(ROOT, "assets/files/civitai/graph");

function loadWorkflowsData() {
  const code = fs.readFileSync(WF_JS, "utf-8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.COMFY_DATA;
}

const cmd = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (cmd === "list") {
  const count = parseInt(arg1 || "10", 10);
  const data = loadWorkflowsData();
  const unread = (data.civitaiWorkflows || [])
    .filter((w) => !w.ai)
    .sort((a, b) => (b.dl || 0) - (a.dl || 0))
    .slice(0, count);
  console.log(JSON.stringify(unread.map(w => ({
    v: w.v,
    name: w.name,
    by: w.by,
    dl: w.dl,
    cat: w.cat,
    base: w.base,
    nodes: w.nodes,
    de: w.de || ""
  })), null, 2));
  process.exit(0);
}

if (cmd === "dump") {
  if (!arg1) {
    console.error("请指定 versionId");
    process.exit(1);
  }
  const vid = String(arg1);
  const data = loadWorkflowsData();
  const meta = (data.civitaiWorkflows || []).find((w) => String(w.v) === vid);
  const graphFile = path.join(GRAPH_DIR, `${vid}__0.json`);
  if (!fs.existsSync(graphFile)) {
    console.error(`图文件不存在: ${graphFile}`);
    process.exit(1);
  }
  const graph = JSON.parse(fs.readFileSync(graphFile, "utf-8"));
  
  // 拓扑节点精简
  const cleanNodes = (graph.nodes || []).map((n) => ({
    id: String(n.id),
    title: n.title || n.name || "",
    type: n.type,
    cat: n.cat,
    brief: n.brief || "",
    widgets: (n.widgets || []).slice(0, 5),
    inputs: (n.inputs || []).map((i) => `${i.name}(${i.type})`),
    outputs: (n.outputs || []).map((o) => `${o.name}(${o.type})`)
  }));

  const linkSummary = (graph.links || []).map((lk) => {
    return `${lk.from} -> ${lk.to}`;
  });

  const output = {
    meta: meta || { v: vid },
    nodeCount: cleanNodes.length,
    nodes: cleanNodes,
    links: linkSummary.slice(0, 100)
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

if (cmd === "apply") {
  if (!arg1 || !arg2) {
    console.error("用法: node scripts/ai-audit.mjs apply <versionId> <ai-json-path>");
    process.exit(1);
  }
  const vid = String(arg1);
  const graphFile = path.join(GRAPH_DIR, `${vid}__0.json`);
  if (!fs.existsSync(graphFile)) {
    console.error(`图文件不存在: ${graphFile}`);
    process.exit(1);
  }
  const graph = JSON.parse(fs.readFileSync(graphFile, "utf-8"));
  const existingNodeIds = new Set((graph.nodes || []).map((n) => String(n.id)));

  let aiContent;
  try {
    const raw = fs.readFileSync(arg2, "utf-8");
    aiContent = JSON.parse(raw);
    if (aiContent.ai) aiContent = aiContent.ai;
  } catch (err) {
    console.error("解析 AI 精读 JSON 失败:", err.message);
    process.exit(1);
  }

  // 严格审核字段
  const errs = [];
  if (!aiContent.s || typeof aiContent.s !== "string" || aiContent.s.length < 50) {
    errs.push("`s` (summary) 缺失或长度少于 50 字");
  }
  if (!Array.isArray(aiContent.u) || aiContent.u.length < 1) {
    errs.push("`u` (use cases) 必须包含至少 1 项适用场景");
  }
  if (typeof aiContent.d !== "number" || aiContent.d < 1 || aiContent.d > 3) {
    errs.push("`d` (difficulty) 必须是 1~3 的整数");
  }
  if (!Array.isArray(aiContent.st) || aiContent.st.length < 2) {
    errs.push("`st` (stages) 阶段拆解必须至少包含 2 个阶段");
  } else {
    aiContent.st.forEach((st, idx) => {
      if (!st.name) errs.push(`阶段 [${idx}] 缺少 name`);
      if (!st.desc) errs.push(`阶段 [${idx}] 缺少 desc`);
      if (!Array.isArray(st.nodes) || st.nodes.length === 0) {
        errs.push(`阶段 [${idx}](${st.name}) 的 nodes 为空`);
      } else {
        st.nodes.forEach((nid) => {
          if (!existingNodeIds.has(String(nid))) {
            errs.push(`阶段 [${idx}](${st.name}) 引用的节点 ID [${nid}] 在图结构中不存在！`);
          }
        });
      }
    });
  }

  if (errs.length > 0) {
    console.error("❌ 质量与结构校验未通过:");
    errs.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }

  // 审核通过，写入 graph.json
  graph.ai = aiContent;
  fs.writeFileSync(graphFile, JSON.stringify(graph), "utf-8");
  console.log(`✅ 成功回写 graph 文件: ${graphFile}`);

  // 更新 workflows-civitai.js 索引中的 ai 标记与统计数字
  let rawJs = fs.readFileSync(WF_JS, "utf-8");
  const p1 = rawJs.indexOf(`"v":${vid}`);
  if (p1 === -1) {
    console.warn(`⚠️ 未在 workflows-civitai.js 中匹配到 "v":${vid}`);
  } else {
    let p2 = rawJs.indexOf('"v":', p1 + 10);
    if (p2 === -1) p2 = rawJs.length;
    let chunk = rawJs.slice(p1, p2);
    if (chunk.includes('"ai":false')) {
      chunk = chunk.replace(/"ai"\s*:\s*false/g, '"ai":true');
      rawJs = rawJs.slice(0, p1) + chunk + rawJs.slice(p2);
      rawJs = rawJs.replace(/"aiDone":\s*(\d+)/, (m, count) => {
        const nextCount = parseInt(count, 10) + 1;
        return `"aiDone":${nextCount}`;
      });
      fs.writeFileSync(WF_JS, rawJs, "utf-8");
      console.log(`✅ 成功更新 workflows-civitai.js 索引标记 (ai: true)，并更新 aiDone 计数器`);
    } else {
      console.log(`ℹ️ workflows-civitai.js 中已无 ai:false 标记，跳过索引替换`);
    }
  }
}
