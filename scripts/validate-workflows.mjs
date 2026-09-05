#!/usr/bin/env node
/* ============================================================
   validate-workflows.mjs — 工作流源文件结构校验脚本
   用法: node scripts/validate-workflows.mjs [目录]
   默认目录: assets/files/workflows
   支持: ComfyUI UI 格式（含新版子图 definitions.subgraphs）
        与 API 格式（prompt 格式）
   ============================================================ */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "assets/files/workflows";
const absDir = path.resolve(dir);

if (!fs.existsSync(absDir)) {
  console.error("目录不存在:", absDir);
  process.exit(2);
}

const files = fs.readdirSync(absDir).filter((f) => f.endsWith(".json"));
if (!files.length) {
  console.error("目录中没有 .json 文件:", absDir);
  process.exit(2);
}

let okCount = 0, failCount = 0;
const failures = [];

function checkUi(data, errs) {
  const ids = new Set();
  const nodeMetas = new Map();
  const collect = (nodes, links, ctx) => {
    (nodes || []).forEach((n) => {
      ids.add(String(n.id));
      nodeMetas.set(String(n.id), { type: n.type, inputs: n.inputs || [], outputs: n.outputs || [], ctx });
      if (!n.type || typeof n.type !== "string") errs.push(`${ctx}节点 ${n.id} 缺少 type`);
    });
  };
  collect(data.nodes, data.links, "");
  const subgraphs = (data.definitions && data.definitions.subgraphs) || [];
  subgraphs.forEach((sg) => collect(sg.nodes, sg.links, `子图[${sg.name || sg.id}] `));

  if (!ids.size) errs.push("没有任何节点");

  (data.links || []).forEach((l, i) => {
    if (!Array.isArray(l) || l.length < 5) { errs.push(`link#${i} 格式非法`); return; }
    const [lid, srcId, srcSlot, dstId, dstSlot] = l;
    if (srcId === null || srcId === undefined) return; /* 子图边界等情况允许 */
    if (!ids.has(String(srcId))) errs.push(`link#${i}(id:${lid}) 源节点 ${srcId} 不存在`);
    if (!ids.has(String(dstId))) errs.push(`link#${i}(id:${lid}) 目标节点 ${dstId} 不存在`);
    if (!Number.isInteger(srcSlot) || srcSlot < 0) errs.push(`link#${i}(id:${lid}) 源槽位非法`);
    if (!Number.isInteger(dstSlot) || dstSlot < 0) errs.push(`link#${i}(id:${lid}) 目标槽位非法`);
  });
  return { ids, nodeMetas };
}

for (const f of files) {
  const p = path.join(absDir, f);
  const errs = [];
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.log(`FAIL  ${f}  JSON 解析失败: ${e.message}`);
    failCount++; failures.push(f);
    continue;
  }

  if (Array.isArray(data.nodes) && Array.isArray(data.links)) {
    const { nodeMetas } = checkUi(data, errs);
    /* 抽查 3 条连线的槽位是否真的存在于节点声明中 */
    let checked = 0;
    for (const l of data.links || []) {
      if (checked >= 3) break;
      if (!Array.isArray(l) || l.length < 5 || l[1] == null) continue;
      const m = nodeMetas.get(String(l[1]));
      if (m && Array.isArray(m.outputs) && m.outputs.length && l[2] >= m.outputs.length) {
        errs.push(`link(id:${l[0]}) 源节点 ${l[1]}(${m.type}) 输出槽 ${l[2]} 越界（共 ${m.outputs.length} 个输出）`);
      }
      checked++;
    }
  } else {
    /* API 格式 */
    const keys = Object.keys(data);
    if (!keys.length) errs.push("空对象");
    const ids = new Set(keys);
    for (const id of keys) {
      const n = data[id];
      if (!n || typeof n !== "object") { errs.push(`节点 ${id} 非对象`); continue; }
      if (!n.class_type || typeof n.class_type !== "string") errs.push(`节点 ${id} 缺少 class_type`);
      if (n.inputs) {
        for (const [k, v] of Object.entries(n.inputs)) {
          if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && /^\d+$/.test(v[0])) {
            if (!ids.has(v[0])) errs.push(`节点 ${id}.${k} 引用了不存在的节点 ${v[0]}`);
            if (!Number.isInteger(v[1]) || v[1] < 0) errs.push(`节点 ${id}.${k} 输出索引非法`);
          }
        }
      }
    }
  }

  if (errs.length) {
    console.log(`FAIL  ${f}  (${errs.length} 处问题)`);
    errs.slice(0, 6).forEach((e) => console.log("      · " + e));
    if (errs.length > 6) console.log(`      · … 共 ${errs.length} 处`);
    failCount++; failures.push(f);
  } else {
    console.log(`OK    ${f}`);
    okCount++;
  }
}

console.log(`\n结果: ${okCount} 通过 / ${failCount} 失败（共 ${files.length}）`);
if (failCount) {
  console.log("失败清单:", failures.join(", "));
  process.exit(1);
}
