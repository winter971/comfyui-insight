#!/usr/bin/env node
/* ============================================================
   sanitize_secrets.mjs — 发布前密钥消毒（仓库内自足版，自 _sources 同代移植）
   扫描站点发布物中的泄漏凭据模式并打码：
     comfyui-insight/assets/files/civitai/{graph,desc}/*.json
     + assets/js/data/workflows-civitai.js
   背景：civitai 作者的 workflow 里偶尔内嵌他们自己泄漏的 token，不能发到公网。
   2026-09-25 云端扫描曾在 vid 2132079 / 3231743 / 944757 发现
   OpenRouter sk-or-v1-、通用 sk-api-、Groq gsk_ 三类变体——本版已并入。
   用法: node scripts/sanitize_secrets.mjs
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PATTERNS = [
  [/hf_[A-Za-z0-9]{20,}/g, "hf_[REDACTED]"],                      // Hugging Face
  [/gh[pousr]_[A-Za-z0-9]{30,}/g, "gh_[REDACTED]"],               // GitHub token
  [/github_pat_[A-Za-z0-9_]{20,}/g, "github_pat_[REDACTED]"],     // GitHub fine-grained
  [/sk-or-v1-[A-Za-z0-9]{20,}/g, "sk-or-v1-[REDACTED]"],          // OpenRouter
  [/sk-api-[A-Za-z0-9_\-]{10,}/g, "sk-api-[REDACTED]"],           // 通用 sk-api-
  [/sk-[A-Za-z0-9]{20,}/g, "sk-[REDACTED]"],                      // OpenAI style
  [/gsk_[A-Za-z0-9]{20,}/g, "gsk_[REDACTED]"],                    // Groq
  [/AKIA[0-9A-Z]{16}/g, "AKIA[REDACTED]"],                        // AWS access key id
  [/Bearer\s+[A-Za-z0-9._\-]{25,}/g, "Bearer [REDACTED]"],        // 裸 Bearer 头
  [/AIza[0-9A-Za-z\-_]{30,}/g, "AIza[REDACTED]"],                 // Google API key
];

function redact(s) {
  let out = s, hit = false;
  for (const [re, rep] of PATTERNS) {
    re.lastIndex = 0;
    if (re.test(out)) { out = out.replace(re, rep); hit = true; }
  }
  return hit ? out : null;
}

const targets = [];
const cdir = path.join(ROOT, "assets", "files", "civitai");
for (const sub of ["graph", "desc"]) {
  const dir = path.join(cdir, sub);
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) if (f.endsWith(".json")) targets.push(path.join(dir, f));
  }
}
targets.push(path.join(ROOT, "assets", "js", "data", "workflows-civitai.js"));

let cleaned = 0;
for (const file of targets) {
  const text = fs.readFileSync(file, "utf8");
  const out = redact(text);
  if (out !== null) {
    fs.writeFileSync(file, out);
    cleaned++;
    console.log("sanitized:", path.relative(ROOT, file));
  }
}
console.log(`secret scan done: ${targets.length} files scanned, ${cleaned} sanitized`);
