#!/usr/bin/env python3
"""Compile every levels_src/*.py into a level entry in levels.json.

A level source is a plain Python file with a header block and one function:

    # level: reverse_string
    # title: Reverse The String
    # desc: Type the text backwards.
    # prompt: dlrow olleh
    # answer: hello world

    def solve(prompt):
        return prompt[::-1]

The answer is produced by RUNNING solve(prompt) at build time, so the
contributor can never drift from what the site checks. Answer stays hidden:
only a SHA-256 of it ships to the browser.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "levels_src"
OUT = ROOT / "site" / "levels.json"

HEADER_RE = re.compile(r"^#\s*(level|title|desc|prompt|answer)\s*:\s*(.+)$", re.M)
SOLVE_RE = re.compile(r"^def\s+solve\s*\(\s*(\w*)\s*\)\s*:", re.M)


def norm(s):
    return " ".join(str(s).split()).strip().lower()


def compile_level(path):
    src = path.read_text(encoding="utf-8")
    meta = dict(HEADER_RE.findall(src))
    missing = {"level", "title", "desc", "prompt"} - meta.keys()
    if missing:
        raise ValueError(f"{path.name}: missing header field(s) {sorted(missing)}")
    if not SOLVE_RE.search(src):
        raise ValueError(f"{path.name}: no `def solve(prompt):` found")

    ns = {}
    exec(compile(src, str(path), "exec"), ns)  # noqa: S102 - trusted repo content
    solve = ns.get("solve")
    if not callable(solve):
        raise ValueError(f"{path.name}: solve() missing after exec")
    answer = solve(meta["prompt"])
    if not isinstance(answer, str):
        raise ValueError(f"{path.name}: solve() must return str, got {type(answer).__name__}")

    return {
        "id": meta["level"].strip(),
        "title": meta["title"].strip(),
        "desc": meta["desc"].strip(),
        "prompt": meta["prompt"].strip(),
        "answer_sha": hashlib.sha256(norm(answer).encode()).hexdigest(),
        "answer_len": len(answer),
        "source": path.name,
    }


def main():
    levels, errors = [], []
    for path in sorted(SRC.glob("*.py")):
        try:
            levels.append(compile_level(path))
        except Exception as e:  # a bad contribution must not break the site
            errors.append(str(e))

    ids = [l["id"] for l in levels]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        errors.append(f"duplicate level id(s): {sorted(dupes)}")

    OUT.write_text(json.dumps(levels, indent=2) + "\n", encoding="utf-8")
    print(f"compiled {len(levels)} level(s) -> {OUT.name}")
    for e in errors:
        print(f"SKIP {e}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
