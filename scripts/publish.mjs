#!/usr/bin/env node
/* ============================================================
   publish.mjs — 数据层发布一条龙（仓库内自足版，管 GitHub Pages + Cloudflare 双端）
   前身是 _sources/release_data.cjs + release_ship.cjs（维护者机器专属），本版收编进仓库。
   步骤（可 --from=N 断点续跑）:
     1 白名单预检   —— 工作区只允许「数据层 + 版本文件 + scripts + assets」类改动；
                      白名单外的脏改动一律停下，绝不 git add -A（防覆盖并行会话）
     2 密钥消毒     —— node scripts/sanitize_secrets.mjs
     3 版本号       —— COMFY_APP_VER 与 index.html 里「本次真的改过且带 ?v=」的资源顶到 --v
     4 提交推送     —— 显式 git add 白名单路径 → commit → push（代理/直连交替重试 3 次）
     5 CF 部署      —— wrangler pages deploy（先代理后直连）；GitHub Pages 由 push 自动发布
     6 双域验收     —— _sources/e2e_cloud.cjs 存在则双域全跑（GH 需 E2E_PROXY），缺则 curl 核版本
   用法:
     node scripts/publish.mjs --v=20260927b [--m="提交说明"] [--from=4] [--dry]
                              [--skip-deploy] [--skip-e2e] [--delta=新增份数]
   ============================================================ */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROXY_SOCKS = "socks5h://127.0.0.1:3067";
const PROXY_HTTP = "http://127.0.0.1:3067";
const CF_URL = "https://comfyui-insight.pages.dev";
const GH_URL = "https://winter971.github.io/comfyui-insight";
const E2E = path.join(path.resolve(ROOT, ".."), "_sources", "e2e_cloud.cjs");

const args = process.argv.slice(2);
const opt = (name) => (args.find((a) => a.startsWith("--" + name + "=")) || "").slice(name.length + 3);
const has = (name) => args.includes("--" + name);
const VER = opt("v");
const MSG = opt("m");
const DELTA = opt("delta");
const FROM = parseInt(opt("from") || "1", 10);
const DRY = has("dry");
const SKIP_DEPLOY = has("skip-deploy");
const SKIP_E2E = has("skip-e2e");
if (!VER) { console.error("用法: node scripts/publish.mjs --v=<版本号> [--m=说明] [--from=N] [--dry]"); process.exit(2); }

const WHITE = [/^index\.html$/, /^assets\/js\/app\.js$/, /^assets\//, /^scripts\//, /^AGENTS\.md$/];
const git = (cmd, opts = {}) => execSync("git " + cmd, { cwd: ROOT, encoding: "utf8", ...opts });
const say = (s) => console.log("[" + new Date().toISOString().slice(11, 19) + "] " + s);

/* 1 白名单预检 */
function step1() {
  const raw = git("status --porcelain");
  const lines = raw.split("\n").filter(Boolean).map((l) => l.slice(3).trim().replace(/^"|"$/g, ""));
  const bad = lines.filter((f) => !WHITE.some((re) => re.test(f)));
  if (bad.length) {
    say("❌ 白名单外改动，拒绝发布（防覆盖并行会话）: " + bad.join(", "));
    say("   处理：把无关改动 stash/提交/移走后再跑。绝不替你 add 它们。");
    process.exit(1);
  }
  if (!lines.length) { say("⚠️ 工作区无任何改动——若数据已在早前提交里，直接 --from=4 续跑"); }
  else say(`1 预检 OK：${lines.length} 个改动文件全在白名单内`);
}

/* 2 消毒 */
function step2() {
  if (DRY) return say("2 消毒(dry): 跳过执行");
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "sanitize_secrets.mjs")], { encoding: "utf8" });
  say("2 消毒: " + (r.stdout || "").trim().split("\n").pop());
  if (r.status !== 0) { say("❌ 消毒脚本失败: " + r.stderr); process.exit(1); }
}

/* 3 版本号：COMFY_APP_VER + 「改动过且带 ?v=」的资源 */
function step3() {
  if (DRY) return say(`3 版本(dry): 将置 ${VER}`);
  let app = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8");
  if (!/COMFY_APP_VER = ".*?"/.test(app)) { say("❌ app.js 找不到 COMFY_APP_VER"); process.exit(1); }
  app = app.replace(/COMFY_APP_VER = ".*?"/, `COMFY_APP_VER = "${VER}"`);
  fs.writeFileSync(path.join(ROOT, "assets/js/app.js"), app);

  const dirty = new Set(git("status --porcelain").split("\n").filter(Boolean).map((l) => l.slice(3).trim()));
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  // 逐个 ?v= 引用判断其目标文件是否本次改动过
  html = html.replace(/="((?:assets\/[^"]+?\.(?:js|css)))\?v=[0-9a-z]+"/g, (m, rel) => {
    const file = rel.replace(/\//g, path.sep);
    if (dirty.has(rel) || rel === "assets/js/app.js") return `="${rel}?v=${VER}"`;
    return m;
  });
  fs.writeFileSync(path.join(ROOT, "index.html"), html);
  say(`3 版本: COMFY_APP_VER=${VER}，?v= 已对改动资源顶版`);
}

/* 4 提交推送 */
function step4() {
  if (DRY) return say("4 提交(dry): 跳过");
  git('add index.html assets/js/app.js');
  const rest = git("status --porcelain").split("\n").filter(Boolean).map((l) => l.slice(3).trim()).filter((f) => WHITE.some((re) => re.test(f)));
  if (rest.length) git("add " + rest.map((f) => '"' + f + '"').join(" "));
  const msg = MSG || (`数据层发布 ${VER}` + (DELTA ? `（新增 ${DELTA} 份）` : "") + "：消毒+版本号");
  let committed = false;
  try { git(`commit -m "${msg.replace(/"/g, "")}"`); committed = true; say("4 提交: " + git("log -1 --oneline").trim()); }
  catch (e) { say("4 提交: 无可提交变更（可能已提交过），继续推送"); }
  let okPush = false;
  for (let i = 1; i <= 3 && !okPush; i++) {
    try { git(`-c http.proxy=${PROXY_SOCKS} push origin main`); okPush = true; say(`4 push: OK(代理) 第${i}次`); }
    catch (e1) {
      try { git("push origin main"); okPush = true; say(`4 push: OK(直连) 第${i}次`); }
      catch (e2) { say(`4 push 第${i}次失败: ${String(e2.stderr || e2.message).split("\n").pop()}`); if (i < 3) execSync("sleep 4"); }
    }
  }
  if (!okPush) { say("❌ push 三次均失败，--from=4 续跑"); process.exit(1); }
}

/* 5 CF 部署 */
function step5() {
  if (SKIP_DEPLOY) return say("5 CF: --skip-deploy 跳过");
  if (DRY) return say("5 CF(dry): 跳过");
  const base = ["pages", "deploy", "comfyui-insight", "--project-name=comfyui-insight", "--commit-dirty=true"];
  const envP = { ...process.env, NODE_USE_ENV_PROXY: "1", HTTPS_PROXY: PROXY_HTTP, HTTP_PROXY: PROXY_HTTP };
  let r = spawnSync("wrangler", base, { encoding: "utf8", shell: true, env: envP, timeout: 540000 });
  if (r.status !== 0) {
    say("5 CF: 代理通道失败，转直连: " + String(r.stderr).split("\n").pop());
    r = spawnSync("wrangler", base, { encoding: "utf8", shell: true, timeout: 540000 });
  }
  if (r.status !== 0) { say("❌ CF 部署失败: " + String(r.stderr).split("\n").slice(-3).join(" | ")); process.exit(1); }
  const m = (r.stdout || "").match(/https:\/\/[a-z0-9]+\.comfyui-insight\.pages\.dev/);
  say("5 CF: OK " + (m ? m[0] : ""));
}

/* 6 双域验收 */
async function step6() {
  if (SKIP_E2E) return say("6 验收: --skip-e2e 跳过");
  const want = fs.readFileSync(path.join(ROOT, "assets/js/app.js"), "utf8").match(/COMFY_APP_VER = "(.*?)"/)[1];
  const e2eReady = fs.existsSync(E2E) && process.env.NODE_PATH;
  if (e2eReady && !DRY) {
    for (const [label, url, proxy] of [["CF", CF_URL, false], ["GH", GH_URL, true]]) {
      const env = { ...process.env };
      if (proxy) env.E2E_PROXY = PROXY_HTTP; else delete env.E2E_PROXY;
      say(`6 E2E ${label}: 开始`);
      const r = spawnSync(process.execPath, [E2E, url, `${label}-${VER}`], { encoding: "utf8", env, timeout: 300000 });
      const tail = (r.stdout || "").trim().split("\n").pop();
      say(`6 E2E ${label}: ${tail || ("exit=" + r.status)}`);
    }
  } else {
    for (const [label, url] of [["CF", CF_URL], ["GH", GH_URL]]) {
      try {
        const r = await fetch(url + "/assets/js/app.js?cb=" + Date.now(), { signal: AbortSignal.timeout(30000) });
        const m = (await r.text()).match(/COMFY_APP_VER = "(.*?)"/);
        say(`6 curl ${label}: ` + (m ? m[1] : "版本标记未取到"));
      } catch (e) { say(`6 curl ${label}: 失败 ${String(e.message || e).split("\n")[0]}`); }
    }
    say(`6 期望版本: ${want}（e2e 脚本或 NODE_PATH 缺失，已退化为 curl 核验）`);
  }
}

const steps = [step1, step2, step3, step4, step5, step6];
(async () => {
  for (let i = FROM; i <= steps.length; i++) await steps[i - 1]();
  say(`publish 结束: v=${VER}${DRY ? "（dry，未写盘）" : ""}`);
})();
