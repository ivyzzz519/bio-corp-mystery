# -*- coding: utf-8 -*-
"""One-time: rename Chinese HTML filenames to English slugs and patch references."""
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

RENAMES: list[tuple[str, str]] = [
    ("014 结局2_后门.css", "014-ending-shadow-archive.css"),
    ("000 初始页.html", "index.html"),
    ("001 首页_林敏.html", "001-oa-home.html"),
    ("002 新闻1.html", "002-news-industrial-visit.html"),
    ("003 新闻2.html", "003-notice-lifeguard-training.html"),
    ("004 新闻3.html", "004-report-bone-extraction.html"),
    ("005 新闻4.html", "005-news-couple-story.html"),
    ("006 新闻5.html", "006-news-doctor-profile.html"),
    ("007 首页_林岚.html", "007-desk-linlan.html"),
    ("008 工单_林岚.html", "008-ticket-destruction-appeal.html"),
    ("009 无忧云笔记.html", "009-wuyou-login.html"),
    ("010 云笔记_林岚.html", "010-notes-linlan.html"),
    ("011 巨象科技官网.html", "011-partner-juxiang-site.html"),
    ("012 首页_张弛.html", "012-desk-zhangchi.html"),
    ("013 结局1_报案.html", "013-ending-report-to-police.html"),
    ("014 结局2_后门.html", "014-ending-shadow-archive.html"),
    ("015 结局2_后续.html", "015-ending-recap.html"),
    ("016 公告_HIS系统账号权限.html", "016-notice-his-access.html"),
    ("017 公告_五月例会体检.html", "017-notice-may-health-check.html"),
    ("018 新闻_常高市长调研.html", "018-news-mayor-inspection.html"),
    ("998 清除全部进度.html", "reset-progress.html"),
]

TITLE_BY_NEW: dict[str, str] = {
    "index.html": "生物公司杀人案 · 开始",
    "001-oa-home.html": "员工工作台 · 公司门户",
    "002-news-industrial-visit.html": "公司要闻 · 湖山工业园调研",
    "003-notice-lifeguard-training.html": "内部通知 · 水上救生培训",
    "004-report-bone-extraction.html": "技术专报 · 骨粉提取工艺",
    "005-news-couple-story.html": "公司动态 · 锦旗与感谢",
    "006-news-doctor-profile.html": "人物专访 · 陈文",
    "007-desk-linlan.html": "工作台 · 林岚账号",
    "008-ticket-destruction-appeal.html": "工单详情 · 销毁异议",
    "009-wuyou-login.html": "无忧云笔记 · 登录",
    "010-notes-linlan.html": "云笔记 · 林岚",
    "011-partner-juxiang-site.html": "巨象科技 · 合作方官网",
    "012-desk-zhangchi.html": "工作台 · 张弛账号",
    "013-ending-report-to-police.html": "结局 · 报案之后",
    "014-ending-shadow-archive.html": "结局 · 深层卷宗",
    "015-ending-recap.html": "结局 · 复盘与选择",
    "016-notice-his-access.html": "公告 · HIS 账号权限",
    "017-notice-may-health-check.html": "公告 · 五月例会体检",
    "018-news-mayor-inspection.html": "要闻 · 市长调研",
    "reset-progress.html": "清除存档 · 测试工具",
}


def patch_text(s: str) -> str:
    for old, new in RENAMES:
        s = s.replace(old, new)
        s = s.replace("./" + old, "./" + new)
    return s


def update_title(html: str, new_name: str) -> str:
    t = TITLE_BY_NEW.get(new_name)
    if not t:
        return html
    return re.sub(
        r"<title>[^<]*</title>",
        f"<title>{t}</title>",
        html,
        count=1,
        flags=re.IGNORECASE,
    )


def main() -> None:
    exts = {".html", ".js", ".md", ".json", ".mjs", ".py"}
    old_set = {old for old, _ in RENAMES}

    for path in sorted(ROOT.rglob("*")):
        if path.suffix.lower() not in exts:
            continue
        if "blockedWords015.js" in path.name:
            continue
        if path.name == Path(__file__).name:
            continue
        raw = path.read_text(encoding="utf-8")
        new_raw = patch_text(raw)
        if new_raw != raw:
            path.write_text(new_raw, encoding="utf-8", newline="\n")

    for old, new in RENAMES:
        src = ROOT / old
        dst = ROOT / new
        if not src.exists():
            print("skip missing:", old)
            continue
        if dst.exists() and src.resolve() != dst.resolve():
            dst.unlink()
        shutil.move(str(src), str(dst))
        if new.endswith(".html"):
            html = dst.read_text(encoding="utf-8")
            html2 = update_title(html, new)
            if html2 != html:
                dst.write_text(html2, encoding="utf-8", newline="\n")
        print(old, "->", new)

    print("Done.")


if __name__ == "__main__":
    main()
