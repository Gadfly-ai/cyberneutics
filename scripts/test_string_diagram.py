#!/usr/bin/env python3
"""
Minimal smoke test for resource_equations_to_mermaid.py.
Runs the converter on each equation file in .claude/skills/string-diagram/
and checks exit code 0 and that output is valid Mermaid (contains 'flowchart').
Run from repository root: python scripts/test_string_diagram.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT = REPO_ROOT / ".claude" / "skills" / "string-diagram" / "resource_equations_to_mermaid.py"
EQUATION_DIR = REPO_ROOT / ".claude" / "skills" / "string-diagram"
EQUATION_FILES = ["decision-monad-equations.txt", "ai-study-equations.txt", "lemon-pie-equations.txt"]


def main() -> int:
    if not SCRIPT.exists():
        print(f"Script not found: {SCRIPT}", file=sys.stderr)
        return 1
    failed = 0
    for name in EQUATION_FILES:
        path = EQUATION_DIR / name
        if not path.exists():
            print(f"Skip (missing): {path}", file=sys.stderr)
            continue
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(path)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"FAIL {name}: exit code {result.returncode}", file=sys.stderr)
            if result.stderr:
                print(result.stderr, file=sys.stderr)
            failed += 1
            continue
        out = result.stdout
        if "flowchart" not in out:
            print(f"FAIL {name}: output does not contain 'flowchart'", file=sys.stderr)
            failed += 1
            continue
        if len(out.strip()) < 100:
            print(f"FAIL {name}: output too short ({len(out)} chars)", file=sys.stderr)
            failed += 1
            continue
        print(f"OK {name}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
