#!/usr/bin/env python3
"""Compile every course book and report problems (used by CI).

For each <Subject>/<Course>/main.tex this runs latexmk in a temporary output
directory (nothing is written next to the sources) and fails on:
  - LaTeX errors,
  - undefined references or citations,
  - missing characters in the font,
  - chapter files in chapters/ that main.tex never \\include's (and the reverse).

With --pdf-dir, the PDFs are saved there as <slug>.pdf (e.g. cs-246.pdf); CI
publishes them on the website and in the "notes-latest" GitHub release.

Usage: python3 scripts/check_latex.py [--pdf-dir DIR] [COURSE ...]
       e.g. python3 scripts/check_latex.py "CS 246" "Math 135"
"""

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ["Computer Science", "Mathematics", "Statistics", "Economics", "Languages",
            "East Asian Studies"]

LOG_PROBLEMS = [
    (re.compile(r"^! .*", re.M), "error"),
    (re.compile(r"LaTeX Warning: Reference `[^']*' on page \d+ undefined.*", re.M), "undefined reference"),
    (re.compile(r"LaTeX Warning: Citation `[^']*' on page \d+ undefined.*", re.M), "undefined citation"),
    (re.compile(r"Missing character: There is no .*", re.M), "missing character"),
]


def slugify(text):
    """Same names as the website uses: "CS 246" -> "cs-246"."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def find_courses():
    for subject in SUBJECTS:
        d = ROOT / subject
        if d.is_dir():
            for course in sorted(d.iterdir()):
                if (course / "main.tex").exists():
                    yield course


def check_includes(course):
    main = (course / "main.tex").read_text()
    included = set(re.findall(r"^\s*\\include\{chapters/([^}]+)\}", main, re.M))
    present = {p.stem for p in (course / "chapters").glob("*.tex")}
    problems = [f"chapters/{name}.tex is not included in main.tex"
                for name in sorted(present - included)]
    problems += [f"main.tex includes missing chapters/{name}.tex"
                 for name in sorted(included - present)]
    return problems


def engine(main_tex):
    """"xelatex" when main.tex starts with "% !TEX program = xelatex", else "pdflatex"."""
    first = Path(main_tex).read_text().split("\n", 1)[0]
    m = re.match(r"%\s*!TEX\s+program\s*=\s*(\w+)", first)
    return m.group(1).lower() if m else "pdflatex"


def engine_flag(main_tex):
    return "-xelatex" if engine(main_tex) == "xelatex" else "-pdf"


def compile_course(course, pdf_dir):
    with tempfile.TemporaryDirectory() as out:
        r = subprocess.run(
            ["latexmk", engine_flag(course / "main.tex"), "-interaction=nonstopmode", "-halt-on-error",
             f"-outdir={out}", "main.tex"],
            cwd=course, capture_output=True, text=True)
        log_path = Path(out) / "main.log"
        log = log_path.read_text(errors="replace") if log_path.exists() else r.stdout
        problems = []
        for pattern, kind in LOG_PROBLEMS:
            for m in pattern.finditer(log):
                problems.append(f"{kind}: {m.group(0).strip()}")
        if r.returncode != 0 and not problems:
            problems.append(f"latexmk exited with status {r.returncode}")
        pages = None
        pdf = Path(out) / "main.pdf"
        if pdf.exists():
            m = re.search(r"Output written on .*?\((\d+) pages?", log)
            pages = int(m.group(1)) if m else None
            if pdf_dir:
                shutil.copy(pdf, Path(pdf_dir) / f"{slugify(course.name)}.pdf")
        return problems, pages


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("courses", nargs="*", help="course folder names (default: all)")
    ap.add_argument("--pdf-dir", help="copy the built PDFs here")
    args = ap.parse_args()
    if args.pdf_dir:
        Path(args.pdf_dir).mkdir(parents=True, exist_ok=True)

    courses = [c for c in find_courses() if not args.courses or c.name in args.courses]
    if not courses:
        raise SystemExit("no courses found")
    failed = 0
    for course in courses:
        problems = check_includes(course)
        compile_problems, pages = compile_course(course, args.pdf_dir)
        problems += compile_problems
        name = f"{course.parent.name}/{course.name}"
        if problems:
            failed += 1
            print(f"FAIL {name}")
            for p in problems[:20]:
                print(f"     {p}")
            if len(problems) > 20:
                print(f"     ... and {len(problems) - 20} more")
        else:
            print(f"ok   {name} ({pages} pages)")
        sys.stdout.flush()
    if failed:
        raise SystemExit(f"{failed} of {len(courses)} course(s) failed")


if __name__ == "__main__":
    main()
