# -*- coding: utf-8 -*-
"""Export game copy + flow to UTF-8 BOM CSV for Excel (full text + flow)."""
import csv
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _quote_js_object_keys(blob):
    prev = None
    while prev != blob:
        prev = blob
        blob = re.sub(r"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:", r'\1"\2":', blob)
    blob = re.sub(r",\s*(\]|\})", r"\1", blob)
    return blob


def _parse_js_literal(blob):
    """Parse a JS object or array literal (unquoted keys, no trailing commas)."""
    blob = _quote_js_object_keys(blob.strip())
    return json.loads(blob)


def _extract_braced_object(source, anchor):
    """Return substring of first `{...}` at top level after anchor (string-aware)."""
    i = source.index(anchor) + len(anchor)
    while i < len(source) and source[i] in " \t\n":
        i += 1
    if i >= len(source) or source[i] != "{":
        raise ValueError("expected { after " + anchor)
    start = i
    depth = 0
    n = len(source)
    while i < n:
        c = source[i]
        if c == '"':
            i += 1
            while i < n:
                if source[i] == "\\":
                    i += 2
                    continue
                if source[i] == '"':
                    break
                i += 1
        elif c == "'":
            i += 1
            while i < n:
                if source[i] == "\\":
                    i += 2
                    continue
                if source[i] == "'":
                    break
                i += 1
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return source[start : i + 1]
        i += 1
    raise ValueError("unbalanced braces")


def read_game_data():
    raw = (ROOT / "gameData.js").read_text(encoding="utf-8")
    blob = _extract_braced_object(raw, "const gameData = ")
    return _parse_js_literal(blob)


def csv_escape(s):
    if s is None:
        return ""
    return str(s)


def add_row(rows, cat, loc_id, src, loc_detail, text, note):
    rows.append(
        {
            "分类": cat,
            "ID": loc_id,
            "源文件": src,
            "位置说明": loc_detail,
            "当前文案": text or "",
            "备注": note or "",
        }
    )


def _slice_balanced_square(source, open_index):
    """Return substring source[open_index:close_index+1] for matching [...] (string-aware)."""
    i = open_index
    if i >= len(source) or source[i] != "[":
        raise ValueError("expected [")
    start = i
    depth = 0
    n = len(source)
    while i < n:
        c = source[i]
        if c == '"':
            i += 1
            while i < n:
                if source[i] == "\\":
                    i += 2
                    continue
                if source[i] == '"':
                    break
                i += 1
        elif c == "'":
            i += 1
            while i < n:
                if source[i] == "\\":
                    i += 2
                    continue
                if source[i] == "'":
                    break
                i += 1
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return source[start : i + 1]
        i += 1
    raise ValueError("unbalanced brackets")


def _extract_bracket_array(source, anchor):
    i = source.index(anchor) + len(anchor)
    while i < len(source) and source[i] in " \t\n":
        i += 1
    if i >= len(source) or source[i] != "[":
        raise ValueError("expected [ after " + anchor)
    return _slice_balanced_square(source, i)


def _extract_js_concat_string_field(block, key):
    """Read `key: "a" + "b" + ...` style concatenation from a JS object snippet."""
    i = block.find(key)
    if i < 0:
        return None
    i = block.find(":", i) + 1
    n = len(block)
    while i < n and block[i] in " \t\n":
        i += 1
    parts = []
    while i < n:
        if block[i] != '"':
            break
        i += 1
        chunk = []
        while i < n:
            if block[i] == "\\":
                if i + 1 < n:
                    chunk.append(block[i : i + 2])
                    i += 2
                continue
            if block[i] == '"':
                i += 1
                break
            chunk.append(block[i])
            i += 1
        parts.append("".join(chunk))
        while i < n and block[i] in " \t\n":
            i += 1
        if i < n and block[i] == "+":
            i += 1
            while i < n and block[i] in " \t\n":
                i += 1
            continue
        break
    return "".join(parts) if parts else None


def extract_archive_files():
    p = (ROOT / "014-ending-shadow-archive.html").read_text(encoding="utf-8")
    try:
        raw = _extract_bracket_array(p, "var ARCHIVE_FILES = ")
    except Exception:
        return []

    id_matches = list(re.finditer(r"\bid:\s*\"([^\"]+)\"", raw))
    out = []
    for j, m in enumerate(id_matches):
        start = m.start()
        end = id_matches[j + 1].start() if j + 1 < len(id_matches) else len(raw)
        block = raw[start:end]
        fid = m.group(1)
        lm = re.search(r"label:\s*\"([^\"]*)\"", block)
        label = lm.group(1) if lm else ""
        iam = re.search(r"imageAlt:\s*\"([^\"]*)\"", block)
        image_alt = iam.group(1) if iam else None
        body = _extract_js_concat_string_field(block, "bodyText")
        keywords = []
        kw_pos = block.find("keywords:")
        if kw_pos >= 0:
            bi = block.find("[", kw_pos)
            if bi >= 0:
                try:
                    arr_txt = _slice_balanced_square(block, bi)
                    keywords = _parse_js_literal(arr_txt)
                except Exception:
                    keywords = []
        entry = {"id": fid, "label": label, "bodyText": body, "imageAlt": image_alt, "keywords": keywords}
        out.append(entry)
    return out


def _decode_js_string_inner(s):
    return (
        s.replace("\\\\", "\x00")
        .replace('\\"', '"')
        .replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace("\\r", "\r")
        .replace("\x00", "\\")
    )


def _is_noise_text(t):
    t = (t or "").strip()
    if not t or len(t) > 8000:
        return True
    if len(t) <= 2 and t.isdigit():
        return True
    if re.match(r"^[\d\s.,:;%+·|x\-/h↓]+$", t, re.I):
        return True
    if re.search(r"[\u4e00-\u9fff]", t):
        return False
    if len(t) < 4:
        return True
    if re.search(r"[A-Za-z]{3,}", t):
        return False
    return True


ATTR_KEYS = frozenset({"alt", "title", "placeholder", "aria-label", "value"})


class _VisibleHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._skip = 0
        self.items = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self._skip += 1
        if self._skip:
            return
        ad = dict(attrs)
        line = self.getpos()[0]
        for k in ATTR_KEYS:
            if k not in ad or not (ad[k] or "").strip():
                continue
            v = ad[k].strip()
            if v.startswith("http") and " " not in v:
                continue
            if not _is_noise_text(v):
                self.items.append((line, f"attr:{k}", v))

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._skip:
            return
        t = data.strip()
        if _is_noise_text(t):
            return
        line = self.getpos()[0]
        self.items.append((line, "text", t))


def _slug(s):
    return re.sub(r"\W+", "_", str(s))[:48] or "x"


def add_html_visible_rows(rows, html_path: Path):
    rel = html_path.name
    try:
        raw = html_path.read_text(encoding="utf-8")
    except OSError:
        return
    parser = _VisibleHTMLParser()
    try:
        parser.feed(raw)
        parser.close()
    except Exception as exc:
        add_row(rows, "HTML解析", f"ERR-{rel}", rel, "parse_error", str(exc), "")
        return
    by_line = {}
    for line, kind, text in parser.items:
        by_line.setdefault(line, []).append((kind, text))
    n = 0
    for line in sorted(by_line):
        for kind, text in by_line[line]:
            n += 1
            safe = re.sub(r"[^\w\-]", "_", kind)
            add_row(
                rows,
                "HTML可见文本",
                f"H-{html_path.stem[:20]}-L{line}-{safe}-{n}",
                rel,
                f"约第{line}行 · {kind}",
                text,
                "由解析器抽取；含 class 内中文时也可能出现",
            )


def _extract_inline_scripts(html: str):
    return re.findall(r"<script>\s*([\s\S]*?)</script>", html)


def add_010_cloud_note_rows(rows):
    p = ROOT / "010-notes-linlan.html"
    if not p.exists():
        return
    raw = p.read_text(encoding="utf-8")
    scripts = _extract_inline_scripts(raw)
    if not scripts:
        return
    main = max(scripts, key=len)

    def walk_block(const_name, label, end_markers):
        start = main.find(const_name)
        if start < 0:
            return
        end = len(main)
        for em in end_markers:
            e = main.find(em, start + len(const_name))
            if e > 0:
                end = min(end, e)
        block = main[start:end]
        pat = r'title:\s*"((?:[^"\\]|\\.)*)"\s*,\s*date:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?content:\s*\['
        for m in re.finditer(pat, block):
            title = _decode_js_string_inner(m.group(1))
            date = _decode_js_string_inner(m.group(2))
            open_bracket = m.end() - 1
            try:
                inner = _slice_balanced_square(block, open_bracket)
            except Exception:
                continue
            lines = re.findall(r'"((?:[^"\\]|\\.)*)"', inner[1:-1])
            body = "\n".join(_decode_js_string_inner(x) for x in lines)
            add_row(
                rows,
                "010云笔记脚本",
                f"010-{label}-{_slug(title)}",
                p.name,
                f"{label} · {title} · {date}",
                body,
                "content 多段已合并为单元格内换行",
            )

    walk_block("const diaries = [", "diaries", ("const lockedDiaries",))
    walk_block(
        "const lockedDiaries = [",
        "lockedDiaries",
        ("const specialDiaries",),
    )
    walk_block(
        "const specialDiaries = [",
        "specialDiaries",
        ("let activeDiaryTitle",),
    )
    if "不可阅读" not in [
        r.get("当前文案", "")
        for r in rows
        if str(r.get("ID", "")).startswith("010-")
    ]:
        add_row(
            rows,
            "010云笔记脚本",
            "010-ui-locked-msg",
            p.name,
            "showDiary 动态",
            "不可阅读",
            "引擎内写死，见 010 内联 script",
        )


def add_015_quiz_html_rows(rows):
    p = ROOT / "015-ending-recap.html"
    if not p.exists():
        return
    raw = p.read_text(encoding="utf-8")
    for i, m in enumerate(
        re.finditer(
            r'<p class="text-sm leading-7 text-slate-200">\s*([\s\S]*?)\s*</p>',
            raw,
        )
    ):
        inner = re.sub(r"<[^>]+>", "", m.group(1))
        inner = inner.replace("&nbsp;", " ").strip()
        if not inner or _is_noise_text(inner):
            continue
        add_row(
            rows,
            "015测验HTML",
            f"015-quiz-html-{i}",
            p.name,
            f"测验段落 #{i}",
            inner,
            "",
        )
    for i, m in enumerate(
        re.finditer(
            r'<label[^>]*for="killerAnswer"[^>]*>([\s\S]*?)</label>',
            raw,
        )
    ):
        t = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        if t:
            add_row(rows, "015测验HTML", f"015-fill-label-{i}", p.name, "填空题标题", t, "")
    for i, m in enumerate(
        re.finditer(
            r'<p class="text-\[11px\][^"]*"[^>]*>([\s\S]*?)</p>',
            raw,
        )
    ):
        t = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        if t and not _is_noise_text(t):
            add_row(rows, "015测验HTML", f"015-banner-line-{i}", p.name, "横幅/小字", t, "")


def add_js_cjk_string_rows(rows, js_path: Path):
    if js_path.name in (
        "gameData.js",
        "mailboxEngine.js",
        "page012Engine.js",
        "export_copy_to_csv.py",
    ):
        return
    try:
        text = js_path.read_text(encoding="utf-8")
    except OSError:
        return
    seen = set()
    for m in re.finditer(r'"((?:[^"\\]|\\.)*)"', text):
        raw = m.group(1)
        if not re.search(r"[\u4e00-\u9fff]", raw):
            continue
        if raw.startswith("http") or raw.startswith("./") and len(raw) < 80:
            continue
        dec = _decode_js_string_inner(raw)
        if _is_noise_text(dec):
            continue
        key = (js_path.name, dec[:200])
        if key in seen:
            continue
        seen.add(key)
        line = text.count("\n", 0, m.start()) + 1
        add_row(
            rows,
            "JS字符串含中文",
            f"JS-{js_path.stem}-L{line}-{len(seen)}",
            js_path.name,
            f"约第{line}行 · 双引号字符串",
            dec,
            "可能与上文结构化导出重复",
        )


def add_game_logic_evidence_rows(rows):
    p = ROOT / "gameLogic.js"
    if not p.exists():
        return
    t = p.read_text(encoding="utf-8")
    for mk in re.finditer(
        r'"([^"]+)"\s*:\s*\{\s*reply:\s*"((?:[^"\\]|\\.)*)"',
        t,
    ):
        add_row(
            rows,
            "gameLogic草稿",
            f"GL-DB-{mk.group(1)}",
            p.name,
            f"evidenceDB[{mk.group(1)}].reply",
            _decode_js_string_inner(mk.group(2)),
            "草稿检索逻辑，未必接入当前 OA",
        )
    for mk in re.finditer(
        r'unlockedFileName:\s*"((?:[^"\\]|\\.)*)"',
        t,
    ):
        add_row(
            rows,
            "gameLogic草稿",
            f"GL-file-{_slug(mk.group(1))}",
            p.name,
            "evidenceDB.*.unlockedFileName",
            _decode_js_string_inner(mk.group(1)),
            "档案名",
        )


def add_flow_full_rows(rows):
    """细流程：分支、存储键、关键跳转。"""
    blocks = [
        (
            "FLOW-A",
            "入口与进度存储",
            "\n".join(
                [
                    "1) 从 000 初始页进入 001 林敏工作台。",
                    "2) localStorage: game_progress_stage（0–8）、game_progress_visual_boost_triggered_pages（已提示过的隐藏页如 011）、可选遗留键 game_progress_visual_boost（998 仍会清除）、oa_current_user、oa_mailbox_read、wuyou_reset_mail_sent、game014_shadow_files_viewed 等见 998 页说明。",
                    "3) URL 可带 ?gp=0–8 同步进度；链接点击会 append gp。",
                    "4) window.name 内嵌 __GAME_STAGE__: 用于跨页阶段。",
                ]
            ),
            "",
        ),
        (
            "FLOW-B",
            "林敏线（调查姐姐）",
            "\n".join(
                [
                    "001 OA 搜索：gameData.searchIndex 关键词 → 新闻/页面（林岚/湖山县/陈文/王安/张弛等）。",
                    "禁搜词 gameData.deniedKeywords（同种骨、B-09）→ 黑屏 404。",
                    "打开 003、005 等会推高进度（PAGE_STAGE_MAP）。",
                    "001 登录弹窗：160423 + 1234Qwer → 记 oa_current_user=linlan，可进林岚视角；zhangchi + 92TWSL66 → 进 012。",
                    "找回密码 / 密保：2000年3月16日 → 1234Qwer（与邮件一致）。",
                    "mailbox.html?view=linmin 林敏邮箱（入职邮）；view=linlan 林岚邮箱；view=zhangchi 张弛邮箱。",
                ]
            ),
            "",
        ),
        (
            "FLOW-C",
            "林岚线",
            "\n".join(
                [
                    "007 林岚受限 OA → 008 工单异议。",
                    "邮箱广告 → 009 无忧云 → 找回（林岚+19905678235+邮箱）可触发 reset 邮件 → QWTR10002。",
                    "010 云笔记：日记列表 + 搜索触发 special/locked 笔记；014 卷宗关键词可解密 locked。",
                ]
            ),
            "",
        ),
        (
            "FLOW-D",
            "张弛线 / 结局1",
            "\n".join(
                [
                    "012：HIS 表、工单、下载 B-09B…dcm → 改后缀 .zip → 解压 → 把柄.wav → 录音字幕（page012Engine transcriptLines）全部播完即 markAction(viewAudioRecord)，进度 100%。",
                    "进度：modifyFile、viewAudioRecord。",
                    "随后全屏：缓冲「正在同步线索」→「似乎已经找到真相」→ 约 2.8s 自动跳转 013（resolveUrlWithStage，带 gp）；已取消「继续调查 / 去报案」弹窗。",
                ]
            ),
            "",
        ),
        (
            "FLOW-E",
            "隐藏：结局2 后门与后续",
            "\n".join(
                [
                    "013 底部「探索隐藏内容」→ 014#password=JXZZ60@WT11（密码 JXZZ60@WT11）。",
                    "014：封停页 → 终端 → 归档检索（须完整文件名匹配）→ 四份里程碑卷宗检索满 100% 隐藏段 → 自动进 015（或手动）。",
                    "015：INTRO + 三道测验 + 自由填空 + OUTRO；CORRECT 在脚本内。",
                ]
            ),
            "",
        ),
        (
            "FLOW-F",
            "与其它页面",
            "\n".join(
                [
                    "002/003/016/017 新闻与公告：正文主要来自 gameData.newsArticles + newsDetailEngine。",
                    "004/005/006 为静态 HTML 正文。",
                    "011 官网：静态文案；首次进入 011（且主线未满）时 progressTracker 顶部浮层提示「发现隐藏内容!」；进度条已取消右侧「+40% 隐藏」条纹与拉伸动画。",
                    "search.html：带 keyword 的检索结果页。",
                ]
            ),
            "",
        ),
    ]
    for fid, title, body, note in blocks:
        add_row(rows, "流程详解", fid, "多文件汇总", title, body, note)


def main():
    rows = []
    add_row(
        rows,
        "使用说明",
        "README",
        "export_copy_to_csv.py",
        "重新生成本表",
        "在项目目录执行：python export_copy_to_csv.py",
        "UTF-8（带 BOM）CSV。含：结构化数据、流程详解、全页 HTML 可见文本、010 日记脚本、015 测验 HTML、各 JS 内中文串（可能与前者重复）。保留「ID」列便于回写。",
    )
    gd = read_game_data()

    add_row(
        rows,
        "流程",
        "FLOW-01",
        "progressTracker.js",
        "STEP_LABELS / ACTION_STAGE_MAP",
        " | ".join(
            [
                "0 开始调查",
                "1 已打开 003 新闻2",
                "2 已打开 005 页面",
                "3 已登录林岚账号",
                "4 已进入林岚邮箱",
                "5 已进入林岚云笔记",
                "6 已登录张弛账号",
                "7 已修改文件",
                "8 已查看录音文件",
            ]
        ),
        "markAction: loginLinlan, enterLinlanMailbox, enterLinlanCloudNote, loginZhangchi, modifyFile, viewAudioRecord；003/005 用 PAGE_STAGE_MAP",
    )

    add_row(
        rows,
        "流程",
        "FLOW-02",
        "多 HTML",
        "主线（简述）",
        "000→001 搜索读新闻→登录林岚线(160423)或张弛线(zhangchi)→邮箱/云笔记/007/008 或 012 下载与录音→013→可选014后门→015",
        "以各页实际链接为准",
    )

    add_row(
        rows,
        "流程",
        "FLOW-03",
        "014-ending-shadow-archive.html",
        "终端密码",
        "JXZZ60@WT11；URL #password=JXZZ60@WT11",
        "同步 CORRECT、URL_CRED_*",
    )

    add_row(
        rows,
        "流程",
        "FLOW-04",
        "各 *Engine.js",
        "账号密码谜题（与剧情耦合）",
        "林岚160423/1234Qwer；张弛zhangchi/92TWSL66；云笔记linlanlinmin/QWTR10002；密保2000年3月16日；找回林岚+19905678235+邮箱",
        "改谜题需同步所有出现处",
    )

    for pid, p in (gd.get("pages") or {}).items():
        add_row(rows, "页面元数据", f"PAGE-{pid}-title", "gameData.js", f'pages["{pid}"].title', p.get("title"), "")
        add_row(
            rows,
            "页面元数据",
            f"PAGE-{pid}-subtitle",
            "gameData.js",
            f'pages["{pid}"].subtitle',
            p.get("subtitle") or "",
            "",
        )

    for aid, art in (gd.get("newsArticles") or {}).items():
        add_row(rows, "新闻数据", f"NEWS-{aid}-title", "gameData.js", f'newsArticles["{aid}"].title', art.get("title"), "")
        add_row(rows, "新闻数据", f"NEWS-{aid}-source", "gameData.js", f'newsArticles["{aid}"].source', art.get("source") or "", "")
        for i, b in enumerate(art.get("blocks") or []):
            pref = f'newsArticles["{aid}"].blocks[{i}]'
            t = b.get("type")
            if t in ("paragraph", "signature"):
                add_row(rows, "新闻数据", f"NEWS-{aid}-b{i}", "gameData.js", f"{pref}.text", b.get("text"), f"type={t}")
            if t == "image":
                add_row(rows, "新闻数据", f"NEWS-{aid}-b{i}-alt", "gameData.js", f"{pref}.alt", b.get("alt") or "", "")
                add_row(rows, "新闻数据", f"NEWS-{aid}-b{i}-cap", "gameData.js", f"{pref}.caption", b.get("caption") or "", "")
                add_row(rows, "新闻数据", f"NEWS-{aid}-b{i}-src", "gameData.js", f"{pref}.imageSrc", b.get("imageSrc") or "", "资源路径")

    for k, v in (gd.get("deniedKeywords") or {}).items():
        add_row(rows, "搜索", f"DENY-{k}", "gameData.js", f'deniedKeywords["{k}"]', v, "可黑屏")

    for kw, rec in (gd.get("searchIndex") or {}).items():
        for i, r in enumerate(rec.get("results") or []):
            add_row(rows, "搜索", f"SRCH-{kw}-{i}-title", "gameData.js", f'results[{i}].title', r.get("title"), "")
            add_row(rows, "搜索", f"SRCH-{kw}-{i}-summary", "gameData.js", f'results[{i}].summary', r.get("summary"), "")
            add_row(rows, "搜索", f"SRCH-{kw}-{i}-target", "gameData.js", f'results[{i}].targetPage', r.get("targetPage") or "", "链接")

    add_row(rows, "搜索UI", "GE-empty", "gameEngine.js", "getSearchPayload", "请输入关键词。", "")
    add_row(rows, "搜索UI", "GE-miss", "gameEngine.js", "getSearchPayload", "无搜索结果", "")
    add_row(rows, "搜索UI", "GE-404", "gameEngine.js", "overlay 默认", "404 NOT FOUND", "")
    add_row(rows, "搜索UI", "GE-dup", "gameEngine.js", "renderSearchResults", "该关键词已检索过，以下为已解锁信息。", "")
    add_row(rows, "搜索UI", "GE-new", "gameEngine.js", "renderSearchResults", "检索成功，发现新线索。", "")

    gp = (ROOT / "progressTracker.js").read_text(encoding="utf-8")
    try:
        step_blob = _extract_bracket_array(gp, "const STEP_LABELS = ")
        labels = _parse_js_literal(step_blob)
        for i, t in enumerate(labels):
            add_row(rows, "进度条", f"GP-LABEL-{i}", "progressTracker.js", f"STEP_LABELS[{i}]", t, "")
    except Exception:
        pass

    add_row(rows, "进度条", "GP-title", "progressTracker.js", "bar 标题", "探索进度", "")
    add_row(
        rows,
        "进度条",
        "GP-ribbon",
        "progressTracker.js",
        "（已移除）原 HIDDEN_ZONE_RIBBON_TEXT UI",
        "+40% 隐藏",
        "右侧条纹与黄签已从代码删除；本行保留字面便于检索",
    )
    add_row(
        rows,
        "进度条",
        "GP-hiddenSpan",
        "progressTracker.js",
        "（已移除）原轨内「隐藏区域」",
        "隐藏区域",
        "同上",
    )
    add_row(
        rows,
        "进度条",
        "GP-hiddenTitle",
        "progressTracker.js",
        "（已移除）原隐藏区 title",
        "未标注路径 · 隐藏关卡区域",
        "同上",
    )
    add_row(
        rows,
        "进度条",
        "GP-alert",
        "progressTracker.js",
        "showHiddenPageToast",
        "发现隐藏内容!",
        "首次进入 011 等且主线未满时顶部短时浮层；非进度条子节点",
    )
    add_row(
        rows,
        "进度条",
        "GP-boost",
        "progressTracker.js",
        "（已移除）原 playSubtleBoostAnimation",
        "系统校验异常：右侧出现未登记进度区间（隐藏关卡）。",
        "随隐藏条动画删除；不再出现",
    )
    add_row(
        rows,
        "进度条",
        "GP-shadowHint",
        "progressTracker.js",
        "refreshProgressUI",
        "深层卷宗检索：主线已闭合 · 隐藏数据段 X% / 100%（Y/4 份已检索命中）",
        "动态占位",
    )
    add_row(
        rows,
        "进度条",
        "GP-015",
        "progressTracker.js",
        "015 页",
        "结局2后续正式页：双段进度按 200% 计（等同已检索全部关键深层卷宗）；不显示顶部探索进度条",
        "",
    )

    def load_mailbox_map(name):
        txt = (ROOT / "mailboxEngine.js").read_text(encoding="utf-8")
        try:
            blob = _extract_braced_object(txt, f"const {name} = ")
            return _parse_js_literal(blob)
        except Exception:
            return {}

    for map_name in ("linlanMailMap", "linminMailMap", "zhangchiMailMap"):
        mdata = load_mailbox_map(map_name)
        for key, mail in mdata.items():
            base = f'mailboxEngine.js · {map_name}["{key}"]'
            rid = f"{map_name}-{key}"
            add_row(rows, "邮箱", f"MAIL-{rid}-title", "mailboxEngine.js", f"{base}.title", mail.get("title"), "")
            add_row(rows, "邮箱", f"MAIL-{rid}-meta", "mailboxEngine.js", f"{base}.meta", mail.get("meta"), "")
            for bi, line in enumerate(mail.get("body") or []):
                add_row(rows, "邮箱", f"MAIL-{rid}-b{bi}", "mailboxEngine.js", f"{base}.body[{bi}]", line, "")
            add_row(rows, "邮箱", f"MAIL-{rid}-link", "mailboxEngine.js", f"{base}.link", mail.get("link") or "", "")
            add_row(rows, "邮箱", f"MAIL-{rid}-linkLabel", "mailboxEngine.js", f"{base}.linkLabel", mail.get("linkLabel") or "", "")

    add_row(rows, "交互", "P001-ok", "page001Engine.js", "找回成功", "验证成功，密码为：1234Qwer", "")
    add_row(rows, "交互", "P001-bad", "page001Engine.js", "找回失败", "答案错误", "")
    add_row(rows, "交互", "P001-pw", "page001Engine.js", "登录", "密码错误", "")
    add_row(rows, "交互", "P001-r1", "page001Engine.js", "工号", "工号不匹配，请重试。", "")
    add_row(rows, "交互", "P001-r2", "page001Engine.js", "密保", "答案错误，请重试。", "")
    add_row(rows, "交互", "P007-bad", "page007Engine.js", "登录", "账号或密码错误", "")

    add_row(rows, "交互", "P009-r1", "page009Engine.js", "找回", "信息不匹配，无法找回", "")
    add_row(rows, "交互", "P009-r2", "page009Engine.js", "找回成功", "已通过邮箱找回", "")
    add_row(rows, "交互", "P009-l1", "page009Engine.js", "登录成功", "登录成功，正在跳转...", "")
    add_row(rows, "交互", "P009-l2", "page009Engine.js", "登录失败", "账号或密码错误", "")

    p12 = (ROOT / "page012Engine.js").read_text(encoding="utf-8")
    try:
        t_blob = _extract_bracket_array(p12, "const transcriptLines = ")
        arr = _parse_js_literal(t_blob)
        for i, line in enumerate(arr):
            add_row(rows, "录音字幕", f"P012-t{i}", "page012Engine.js", f"transcriptLines[{i}]", line, "")
    except Exception:
        pass

    hints = [
        ("P012-h2", "downloadTrayText", "B-09B_ultrasound_preview.dcm 下载完成"),
        ("P012-h3", "hintEl 下载", "模拟下载已完成：右下角出现下载标识。"),
        ("P012-h4", "virtualPathText", "C:\\Users\\Player\\Downloads\\Case_0422\\"),
        ("P012-h5", "DICOM", "DICOM（.dcm）无法在此预览，请先重命名为 .zip 并解压后再打开录音。"),
        ("P012-h6", "zip view", "压缩包请使用下方「解压文件」，而非「查看文件」。"),
        ("P012-h7", "format", "当前格式无法在此预览。"),
        ("P012-h8", "解压失败", "无法打开压缩包：文件格式不受支持。"),
        ("P012-h9", "解压成功", "压缩包已打开。点击下方「把柄.wav」可查看声纹波形与文字记录。"),
        ("P012-h10", "空文件名", "文件名不能为空。"),
        ("P012-h11", "重命名zip", "重命名成功：${nextFileName}"),
        ("P012-h12", "重命名其他", "重命名成功：${nextFileName}。该格式暂不识别。"),
        ("P012-h13", "右键压缩王", "压缩王.zip 无法识别该文件，请先改为 .zip。"),
        ("P012-h14", "压缩王打开", "已使用压缩王.zip 打开：发现 把柄.wav（20 分钟）。点击下方「把柄.wav」可查看声纹波形与文字记录。"),
    ]
    for hid, loc, text in hints:
        add_row(rows, "张弛页文案", hid, "page012Engine.js", loc, text, "部分含模板变量")
    add_row(
        rows,
        "张弛页文案",
        "P012-end-buffer",
        "page012Engine.js",
        "startTruthRevealSequence 缓冲文案",
        "正在同步线索",
        "viewAudioRecord 后全屏层首段",
    )
    add_row(
        rows,
        "张弛页文案",
        "P012-end-truth",
        "page012Engine.js",
        "startTruthRevealSequence",
        "似乎已经找到真相",
        "约 1.1s 后出现；约 2.8s 后跳转 013",
    )
    add_row(
        rows,
        "张弛页文案",
        "P012-modal-removed",
        "012-desk-zhangchi.html（已删）",
        "原调查完成弹窗",
        "调查完成提示；似乎你已经完成了调查；继续调查；去报案",
        "已由缓冲+真相+自动进 013 取代",
    )

    add_row(rows, "引擎", "ND-t1", "newsDetailEngine.js", "缺数据 title", "未找到该内容", "")
    add_row(rows, "引擎", "ND-t2", "newsDetailEngine.js", "缺数据 body", "当前页面暂无对应数据。", "")

    add_row(rows, "草稿", "GL-1", "gameLogic.js", "", "请输入有效关键词。", "可能未接入主线")
    add_row(rows, "草稿", "GL-2", "gameLogic.js", "", "没有检索到相关线索。", "")

    # 014
    terms = [
        "> 尝试连接 无限生物科技有限公司_主节点... [失败：目标已被物理切断]",
        "> 正在绕过本地防火墙...",
        "> 正在唤醒 【无限生物科技有限公司_容灾备份影子节点】... [连接成功]",
        "> 警告：您正在访问未备案的深层数据。",
        "> Root Directory Access Denied.",
    ]
    for i, t in enumerate(terms):
        add_row(rows, "014终端", f"014-t{i}", "014-ending-shadow-archive.html", f"lines[{i}]", t, "")

    add_row(rows, "014封停", "014-s1", "014-ending-shadow-archive.html", "h1", "【A城公安局网络安全保卫支队 封停公告】", "")
    add_row(
        rows,
        "014封停",
        "014-s2",
        "014-ending-shadow-archive.html",
        "正文",
        "该域名所属服务器（无限生物科技有限公司）因涉嫌重大案件，已被依法查封离线。",
        "",
    )
    add_row(rows, "014封停", "014-s3", "014-ending-shadow-archive.html", "脚注", "本公告自发布之时起生效", "")
    add_row(
        rows,
        "014归档",
        "014-a1",
        "014-ending-shadow-archive.html",
        "提示",
        "无限生物科技有限公司机密文件，请管理员注意保密工作，文件名称按照既有命名规则。",
        "",
    )
    add_row(rows, "014归档", "014-a2", "014-ending-shadow-archive.html", "placeholder", "须输入完整文件名（可大小写不一致）", "")
    add_row(rows, "014归档", "014-a3", "014-ending-shadow-archive.html", "", "已打开文件：（可再次阅读）", "")
    add_row(rows, "014归档", "014-a4", "014-ending-shadow-archive.html", "", "尚未打开任何文件预览。", "")
    add_row(rows, "014归档", "014-a5", "014-ending-shadow-archive.html", "", "已收集文件：（点击阅读）", "")
    add_row(rows, "014归档", "014-a6", "014-ending-shadow-archive.html", "", "无匹配条目。", "")
    add_row(rows, "014归档", "014-a7", "014-ending-shadow-archive.html", "button", "返回首页", "")
    add_row(rows, "014密码", "014-p1", "014-ending-shadow-archive.html", "成功", "> 校验通过。正在挂载只读卷……", "")
    add_row(rows, "014密码", "014-p2", "014-ending-shadow-archive.html", "失败", "> AUTHENTICATION FAILED. 请重试。", "")
    add_row(rows, "014预览", "014-pr", "014-ending-shadow-archive.html", "无内容", "（无预览内容）", "")

    for f in extract_archive_files():
        fid = f.get("id", "")
        add_row(rows, "014卷宗", f"014-{fid}-label", "014-ending-shadow-archive.html", "label", f.get("label"), "")
        if f.get("imageAlt"):
            add_row(rows, "014卷宗", f"014-{fid}-alt", "014-ending-shadow-archive.html", "imageAlt", f.get("imageAlt"), "")
        if f.get("bodyText"):
            add_row(rows, "014卷宗", f"014-{fid}-body", "014-ending-shadow-archive.html", "bodyText", f.get("bodyText"), "长文")
        if f.get("keywords"):
            add_row(rows, "014卷宗", f"014-{fid}-kw", "014-ending-shadow-archive.html", "keywords", ", ".join(f.get("keywords")), "检索关键词")

    p15 = (ROOT / "015-ending-recap.html").read_text(encoding="utf-8")
    try:
        intro_blob = _extract_bracket_array(p15, "var INTRO_LINES = ")
        for i, t in enumerate(_parse_js_literal(intro_blob)):
            add_row(rows, "015结局后续", f"015-intro-{i}", "015-ending-recap.html", f"INTRO_LINES[{i}]", t, "")
    except Exception:
        pass
    try:
        out_blob = _extract_bracket_array(p15, "var OUTRO_PARAGRAPHS = ")
        for i, t in enumerate(_parse_js_literal(out_blob)):
            add_row(rows, "015结局后续", f"015-outro-{i}", "015-ending-recap.html", f"OUTRO_PARAGRAPHS[{i}]", t, "")
    except Exception:
        pass
    add_row(rows, "015结局后续", "015-quiz-wrong", "015-ending-recap.html", "quizFeedback", "你重新组织思路……", "")

    add_flow_full_rows(rows)

    for html_path in sorted(ROOT.glob("*.html")):
        add_html_visible_rows(rows, html_path)

    add_010_cloud_note_rows(rows)
    add_015_quiz_html_rows(rows)
    p15raw = (ROOT / "015-ending-recap.html").read_text(encoding="utf-8")
    cm = re.search(r"var CORRECT = (\[[^\]]*\])", p15raw)
    if cm:
        try:
            corr = _parse_js_literal(cm.group(1))
            add_row(
                rows,
                "015脚本",
                "015-CORRECT",
                "015-ending-recap.html",
                "CORRECT（测验答案顺序）",
                ", ".join(corr),
                "改题需同步脚本内 CORRECT 与选项",
            )
        except Exception:
            pass

    for js_path in sorted(ROOT.glob("*.js")):
        add_js_cjk_string_rows(rows, js_path)

    add_game_logic_evidence_rows(rows)

    add_row(
        rows,
        "使用说明",
        "README-2",
        "export_copy_to_csv.py",
        "关于重复行",
        "同一句话可能同时出现在「结构化导出」「HTML可见文本」「JS字符串含中文」中，改稿时以你指定的权威来源为准即可。",
        "",
    )

    out_path = ROOT / "游戏文案与流程导出.csv"
    with out_path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["分类", "ID", "源文件", "位置说明", "当前文案", "备注"],
            quoting=csv.QUOTE_MINIMAL,
        )
        w.writeheader()
        w.writerows(rows)

    print("Wrote", out_path, "rows:", len(rows))


if __name__ == "__main__":
    main()
