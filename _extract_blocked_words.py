# Utility: read 屏蔽词库.docx and emit blockedWords015.js for 015 page.
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def docx_paragraphs(path: str) -> list[str]:
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    out: list[str] = []
    for para in root.iter(W + "p"):
        parts: list[str] = []
        for node in para.iter(W + "t"):
            if node.text:
                parts.append(node.text)
            if node.tail:
                parts.append(node.tail)
        line = "".join(parts).strip()
        if line:
            out.append(line)
    return out


def split_words(text: str) -> list[str]:
    """Split on common Chinese/English delimiters; drop empties and very long noise lines."""
    # Remove instruction header lines if any
    t = text.replace("\r", "\n")
    # Common separators in word lists: 、 ， , ; ； | / newline tab space
    parts = re.split(r"[\s、，,;；|/\n\t]+", t)
    words: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if len(p) > 80:
            continue
        words.append(p)
    return words


def main() -> int:
    src = r"e:\游戏业务\国王对决\国王对决资料包\屏蔽词库.docx"
    if len(sys.argv) > 1:
        src = sys.argv[1]
    paras = docx_paragraphs(src)
    bag: list[str] = []
    for para in paras:
        bag.extend(split_words(para))
    # Dedupe; drop obvious doc structure lines (not real block terms)
    def keep_word(w: str) -> bool:
        if w in ("屏蔽词库",):
            return False
        if w.endswith("：") and len(w) <= 30 and ("补充" in w or "分类" in w or "说明" in w):
            return False
        return True

    seen: set[str] = set()
    uniq: list[str] = []
    for w in bag:
        if not keep_word(w):
            continue
        if w in seen:
            continue
        seen.add(w)
        uniq.append(w)
    out_path = Path(__file__).resolve().parent / "blockedWords015.js"
    dumped = json.dumps(uniq, ensure_ascii=False)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("window.GAME015_BLOCKED_WORDS = ")
        f.write(dumped)
        f.write(";\n")
    print("wrote", out_path, "count", len(uniq))
    if uniq[:5]:
        print("sample:", uniq[:5])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
