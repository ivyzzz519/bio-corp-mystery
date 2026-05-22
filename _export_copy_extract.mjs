/**
 * 导出结构化文案为 JSON（供 _export_full_game_copy_xlsx.py 消费）
 * 运行: node _export_copy_extract.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), "utf8");
}

function loadGameData() {
  const code = read("gameData.js");
  return new Function(`${code}\nreturn gameData;`)();
}

function extractBraceBalanced(src, fromIndex) {
  let i = fromIndex;
  while (i < src.length && src[i] !== "{") i++;
  if (src[i] !== "{") return null;
  let depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function extractAfterMarkerObject(src, marker) {
  const pos = src.indexOf(marker);
  if (pos < 0) return null;
  const braceStart = pos + marker.length;
  return extractBraceBalanced(src, braceStart);
}

function evalObjectLiteral(objSrc) {
  return new Function(`return (${objSrc});`)();
}

function loadMailboxMaps() {
  const code = read("mailboxEngine.js");
  const lin = extractAfterMarkerObject(code, "const linlanMailMap = ");
  const zhang = extractAfterMarkerObject(code, "const zhangchiMailMap = ");
  return {
    linlanMailMap: evalObjectLiteral(lin),
    zhangchiMailMap: evalObjectLiteral(zhang)
  };
}

function loadArchiveFiles() {
  const html = read("014-ending-shadow-archive.html");
  const marker = "var ARCHIVE_FILES = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("ARCHIVE_FILES not found");
  const tail = html.slice(start + marker.length);
  const cut = tail.indexOf("\n        var lines =");
  if (cut < 0) throw new Error("var lines marker not found after ARCHIVE_FILES");
  const arrSrc = tail.slice(0, cut).trim();
  return new Function(`return ${arrSrc};`)();
}

/** 粗略跳过引号内字符，提取 const name = [ ... ]; 最外层数组 */
function extractConstArraySource(html, constName) {
  const marker = `const ${constName} = `;
  const pos = html.indexOf(marker);
  if (pos < 0) return null;
  let i = pos + marker.length;
  while (i < html.length && /\s/.test(html[i])) i++;
  if (html[i] !== "[") return null;
  let depth = 0;
  const start = i;
  let q = null;
  for (; i < html.length; i++) {
    const c = html[i];
    const prev = i > 0 ? html[i - 1] : "";
    if (q) {
      if (prev === "\\" && (q === '"' || q === "'")) continue;
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      q = c;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

function load010Arrays() {
  const html = read("010-notes-linlan.html");
  const names = ["diaries", "lockedDiaries", "specialDiaries"];
  const out = {};
  for (const n of names) {
    const src = extractConstArraySource(html, n);
    if (!src) throw new Error(`const ${n} not found in 010`);
    out[n] = new Function(`return ${src};`)();
  }
  return out;
}

function load012Transcript() {
  const code = read("page012Engine.js");
  const m = code.match(/const transcriptLines = \[([\s\S]*?)\n  \];/);
  if (!m) return [];
  const inner = "[" + m[1] + "\n  ]";
  return new Function(`return ${inner};`)();
}

function loadGameEngineStringsFixed() {
  const code = read("gameEngine.js");
  const lines = code.split("\n");
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (L.includes('message: "请输入关键词。')) out.enterKeyword = "请输入关键词。";
    if (L.includes('message: "无搜索结果')) out.noResults = "无搜索结果";
    if (L.includes("该关键词已检索过")) out.duplicate = "该关键词已检索过，以下为已解锁信息。";
    if (L.includes("检索成功，发现新线索")) out.success = "检索成功，发现新线索。";
    if (L.includes("显示${payload.resultCount}条搜索结果")) out.resultCountTpl = "显示${payload.resultCount}条搜索结果";
    if (L.includes('el.textContent = message || "404 NOT FOUND"')) out.notFound404 = "404 NOT FOUND";
  }
  return out;
}

function loadProgressTrackerLabels() {
  const code = read("progressTracker.js");
  const m = code.match(/const STEP_LABELS = \[([\s\S]*?)\];/);
  if (!m) return [];
  const inner = "[" + m[1].trim() + "]";
  return new Function(`return ${inner};`)();
}

function loadProgressTrackerMisc() {
  const code = read("progressTracker.js");
  const misc = {};
  const hm = code.match(/const HIDDEN_ZONE_RIBBON_TEXT = "([^"]*)"/);
  if (hm) {
    misc.hiddenRibbon = hm[1];
  } else {
    misc.hiddenRibbon = "+40% 隐藏（已从 UI 移除）";
  }
  misc.hiddenAlert = "发现隐藏内容!";
  misc.hiddenZoneLabel = "隐藏区域（已从 UI 移除）";
  const anim = code.match(/hintEl\.textContent = "([^"]*未登记进度区间[^"]*)"/);
  if (anim) {
    misc.boostHint = anim[1];
  } else {
    misc.boostHint = "（已移除）系统校验异常：右侧出现未登记进度区间（隐藏关卡）。";
  }
  const sh = code.match(/`深层卷宗检索：[^`]+`/);
  if (sh) misc.shadow014HintTemplate = sh[0].slice(1, -1);
  return misc;
}

const bundle = {
  gameData: loadGameData(),
  mailbox: loadMailboxMaps(),
  archive014: loadArchiveFiles(),
  diary010: load010Arrays(),
  transcript012: load012Transcript(),
  gameEngine: loadGameEngineStringsFixed(),
  progressLabels: loadProgressTrackerLabels(),
  progressMisc: loadProgressTrackerMisc()
};

process.stdout.write(JSON.stringify(bundle, null, 2), "utf8");
