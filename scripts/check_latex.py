#!/usr/bin/env python3
"""Compile every course book and report problems (used by CI).

For each <Subject>/<Course>/main.tex this runs latexmk in a temporary output
directory (nothing is written next to the sources) and fails on:
  - LaTeX errors,
  - undefined references or citations,
  - missing characters in the font,
  - chapter files in chapters/ that main.tex never \\include's (and the reverse).

With --pdf-dir, the PDFs are saved there as <slug>.pdf (e.g. cs-246.pdf); CI
publishes them on the website and in the "notes-latest" GitHub release. A
<slug>.inputs file next to each PDF records what it was built from, so a later
run skips courses that have not changed (--force rebuilds them anyway).
Courses compile in parallel (-j, default: one per CPU).

Usage: python3 scripts/check_latex.py [--pdf-dir DIR] [--force] [-j N] [COURSE ...]
       e.g. python3 scripts/check_latex.py "CS 246" "Math 135"
"""

import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
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


# Files LaTeX writes next to main.tex (not inputs of the book).
BUILD_OUTPUTS = {".aux", ".log", ".fls", ".fdb_latexmk", ".out", ".toc", ".xdv", ".synctex.gz",
                 ".lof", ".lot", ".bbl", ".blg"}


def inputs_hash(course):
    """Hash of everything a course's PDF is built from (its folder and the shared preamble)."""
    h = hashlib.sha1()
    files = [ROOT / "common" / "preamble.tex"]
    files += sorted(f for f in course.rglob("*") if f.is_file()
                    and "".join(f.suffixes[-2:]) not in BUILD_OUTPUTS and f.suffix not in BUILD_OUTPUTS
                    and f.name != "main.pdf")
    for f in files:
        h.update(str(f.relative_to(ROOT)).encode() + b"\0" + f.read_bytes() + b"\0")
    return h.hexdigest()


def check_course(course, pdf_dir, force):
    """Returns (problems, pages, skipped)."""
    stamp = Path(pdf_dir) / f"{slugify(course.name)}.inputs" if pdf_dir else None
    digest = inputs_hash(course) if stamp else None
    if (stamp and not force and stamp.exists() and stamp.read_text() == digest
            and stamp.with_suffix(".pdf").exists()):
        return [], None, True
    problems = check_includes(course)
    compile_problems, pages = compile_course(course, pdf_dir)
    problems += compile_problems
    if stamp:
        # Only a clean build may be skipped next time.
        if problems:
            stamp.unlink(missing_ok=True)
        else:
            stamp.write_text(digest)
    return problems, pages, False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("courses", nargs="*", help="course folder names (default: all)")
    ap.add_argument("--pdf-dir", help="copy the built PDFs here; courses whose files have not "
                    "changed since their last clean build there are skipped")
    ap.add_argument("--force", action="store_true", help="rebuild every course, changed or not")
    ap.add_argument("-j", "--jobs", type=int, default=os.cpu_count() or 2,
                    help="courses to compile at once (default: number of CPUs)")
    args = ap.parse_args()
    if args.pdf_dir:
        Path(args.pdf_dir).mkdir(parents=True, exist_ok=True)

    courses = [c for c in find_courses() if not args.courses or c.name in args.courses]
    if not courses:
        raise SystemExit("no courses found")
    failed = 0
    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        jobs = {pool.submit(check_course, c, args.pdf_dir, args.force): c for c in courses}
        for job in as_completed(jobs):
            course = jobs[job]
            problems, pages, skipped = job.result()
            name = f"{course.parent.name}/{course.name}"
            if problems:
                failed += 1
                print(f"FAIL {name}")
                for p in problems[:20]:
                    print(f"     {p}")
                if len(problems) > 20:
                    print(f"     ... and {len(problems) - 20} more")
            elif skipped:
                print(f"ok   {name} (unchanged)")
            else:
                print(f"ok   {name} ({pages} pages)")
            sys.stdout.flush()
    if failed:
        raise SystemExit(f"{failed} of {len(courses)} course(s) failed")


if __name__ == "__main__":
    main()
