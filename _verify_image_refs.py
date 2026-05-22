"""Verify local image paths referenced by HTML <img> and gameData imageSrc exist. Run: python _verify_image_refs.py (from gameproject01 folder)."""
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
MISSING = []


def check_resolved(from_file: str, src: str) -> None:
    s = src.strip()
    if not s or s.startswith(("http://", "https://", "data:")):
        return
    rel = s[2:] if s.startswith("./") else s
    base = os.path.dirname(from_file)
    abs_path = os.path.normpath(os.path.join(base, rel))
    if not os.path.isfile(abs_path):
        MISSING.append((from_file, src, abs_path))


def main() -> int:
    img_src_re = re.compile(r"<img\b[^>]*?\bsrc\s*=\s*\"([^\"]+)\"", re.I | re.S)

    for dirpath, _, files in os.walk(ROOT):
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(dirpath, name)
            text = open(path, "r", encoding="utf-8", errors="ignore").read()
            for m in img_src_re.finditer(text):
                check_resolved(path, m.group(1))

    gd = os.path.join(ROOT, "gameData.js")
    if os.path.isfile(gd):
        t = open(gd, "r", encoding="utf-8", errors="ignore").read()
        for m in re.finditer(r'imageSrc:\s*"([^"]+)"', t):
            check_resolved(gd, m.group(1))

    if MISSING:
        print("MISSING", len(MISSING))
        for row in MISSING:
            print(row)
        return 1
    print("OK: all referenced local image paths resolve under game folder.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
