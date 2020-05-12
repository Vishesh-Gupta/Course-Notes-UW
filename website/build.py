#!/usr/bin/env python3
"""Build the course notes website from the LaTeX sources.

Each "<Subject>/<Course>/main.tex" becomes a course; every \\include'd
chapter becomes one page. Chapters are converted with pandoc (filter.lua),
math is rendered in the browser by KaTeX and TikZ pictures are compiled to
SVG with pdflatex + pdftocairo (cached in website/.cache).

Usage: python3 website/build.py [--out DIR]
Needs: pandoc, pdflatex (TeX Live with latex-extra), pdftocairo.
"""

import argparse
import hashlib
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_SRC = ROOT / "website"
SUBJECTS = ["Computer Science", "Mathematics", "Statistics", "Economics"]
PREAMBLE = ROOT / "common" / "preamble.tex"
CACHE = SITE_SRC / ".cache" / "tikz"
REPO_URL = "https://github.com/Vishesh-Gupta/Course-Notes-UW"
SITE_TITLE = "Course Notes UW"
TIKZ_ZOOM = 1.4


# --------------------------------------------------------------------------
# LaTeX helpers

def skip_group(text, i, open_ch="{", close_ch="}"):
    """Return the index just past the balanced group starting at text[i]."""
    depth = 0
    while i < len(text):
        c = text[i]
        if c == "\\":
            i += 2
            continue
        if c == open_ch:
            depth += 1
        elif c == close_ch:
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return i


def remove_command(text, name, nargs):
    """Delete every \\name[opt]{arg1}...{argN} from text."""
    out, pos = [], 0
    pattern = re.compile(r"\\" + name + r"(?![A-Za-z])")
    while True:
        m = pattern.search(text, pos)
        if not m:
            break
        out.append(text[pos:m.start()])
        i = m.end()
        for _ in range(nargs):
            while i < len(text) and text[i].isspace():
                i += 1
            if i < len(text) and text[i] == "[":
                i = skip_group(text, i, "[", "]")
                while i < len(text) and text[i].isspace():
                    i += 1
            if i < len(text) and text[i] == "{":
                i = skip_group(text, i)
        pos = i
    out.append(text[pos:])
    return "".join(out)


def strip_comments(text):
    return re.sub(r"(?<!\\)%.*", "", text)


def course_chunk(main_tex):
    """Course-specific preamble lines between the shared preamble and \\title."""
    m = re.search(r"\\input\{(?:\.\./)+common/preamble\}(.*?)\\title\{", main_tex, re.S)
    chunk = m.group(1) if m else ""
    return re.sub(r"\\makeatletter.*?\\makeatother", "", chunk, flags=re.S)


# Text-mode commands KaTeX lacks, mapped to close equivalents.
KATEX_EXTRA = {"\\textsc": "\\textrm{#1}", "\\textup": "\\textrm{#1}", "\\emph": "\\textit{#1}",
               "\\break": "{}"}  # LaTeX line-break hint; nothing to do on the web


def katex_macros(defs):
    """\\newcommand definitions as KaTeX macros, for math pandoc leaves unexpanded
    (e.g. inside pseudocode listings)."""
    macros = dict(KATEX_EXTRA)
    for m in re.finditer(r"\\(?:re)?newcommand\{(\\[A-Za-z]+)\}(?:\[\d\])?(?=\{)", defs):
        macros[m.group(1)] = defs[m.end() + 1:skip_group(defs, m.end()) - 1]
    return macros


def pandoc_defs(main_tex):
    """Macro/theorem definitions pandoc needs in front of every chapter."""
    shared = [l for l in PREAMBLE.read_text().splitlines()
              if l.startswith(("\\newcommand", "\\theoremstyle", "\\newtheorem"))]
    chunk = strip_comments(course_chunk(main_tex))
    for name, n in [("usepackage", 1), ("usetikzlibrary", 1), ("lstdefinelanguage", 2),
                    ("lstdefinestyle", 2), ("lstset", 1), ("setlength", 2)]:
        chunk = remove_command(chunk, name, n)
    defs = "\n".join(shared) + "\n" + chunk + "\n"
    if "\\newcommand{\\bx}" in defs:
        # Natural deduction box bars (a \vrule in the PDF).
        defs += "\\renewcommand{\\bx}{\u2502\\ }\n"
    return defs


def tikz_preamble(main_tex):
    shared = PREAMBLE.read_text().replace("[chapter]", "")
    return ("\\documentclass[tikz,border=6pt]{standalone}\n" + shared + "\n"
            + course_chunk(main_tex) + "\n")


TIKZ_RE = re.compile(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}", re.S)


def compile_tikz(preamble, pictures):
    """Compile pictures {key: source} to CACHE/key.svg. Returns failed keys."""
    todo = {k: v for k, v in pictures.items() if not (CACHE / f"{k}.svg").exists()}
    if not todo:
        return set()
    CACHE.mkdir(parents=True, exist_ok=True)

    def run(batch):
        with tempfile.TemporaryDirectory() as tmp:
            doc = Path(tmp) / "pics.tex"
            doc.write_text(preamble + "\\begin{document}\n"
                           + "\n".join(batch.values()) + "\n\\end{document}\n")
            r = subprocess.run(["pdflatex", "-interaction=nonstopmode", "-halt-on-error",
                                "pics.tex"], cwd=tmp, capture_output=True, text=True)
            if r.returncode != 0:
                return False
            for page, key in enumerate(batch, start=1):
                subprocess.run(["pdftocairo", "-svg", "-f", str(page), "-l", str(page),
                                str(Path(tmp) / "pics.pdf"), str(CACHE / f"{key}.svg")],
                               check=True)
            return True

    if run(todo):
        return set()
    failed = set()
    for key, src in todo.items():  # isolate the bad picture(s)
        if not run({key: src}):
            failed.add(key)
    return failed


# --------------------------------------------------------------------------
# Course model

# Original notes kept next to the LaTeX book (shown in the "Original notes" view).
ORIGINAL_FORMATS = {".md": "gfm", ".mdwn": "gfm", ".docx": "docx", ".tex": "latex"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg"}


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def natural_key(text):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", text)]


def match_key(text):
    """Key used to pair a LaTeX chapter with the original notes it came from."""
    t = text.lower()
    for pattern, kind in [(r"lecture\s*0*(\d+)", "lecture"), (r"tutorial\s*0*(\d+)", "tutorial"),
                          (r"\bch(?:apter|\.)\s*0*(\d+)", "chapter")]:
        m = re.search(pattern, t)
        if m:
            return (kind, int(m.group(1)))
    return ("outline", 0) if "outline" in t else None


class Original:
    def __init__(self, course, path):
        self.course, self.path = course, path
        self.title = path.stem
        self.slug = slugify(path.stem)
        self.key = match_key(path.stem)
        self.body = self.toc = ""

class Chapter:
    def __init__(self, course, number, path):
        self.course, self.number, self.path = course, number, path
        self.slug = path.stem
        self.title_html = self.title_text = ""
        self.body = self.toc = ""


class Course:
    def __init__(self, folder):
        self.folder = folder
        self.subject = folder.parent.name
        self.main_tex = (folder / "main.tex").read_text()
        m = re.search(r"\\title\{(.*?)\}", self.main_tex)
        title = m.group(1) if m else folder.name
        code, _, name = title.partition("---")
        self.code = code.strip() or folder.name
        self.name = name.strip()
        self.slug = slugify(folder.name)
        includes = re.findall(r"^\s*\\include\{(chapters/[^}]+)\}", self.main_tex, re.M)
        self.chapters = [Chapter(self, i, folder / f"{inc}.tex")
                         for i, inc in enumerate(includes, start=1)]
        self.pdf = None  # set from --pdf-dir (PDFs are built by CI, not committed)
        self.originals = sorted(
            (Original(self, p) for p in folder.iterdir()
             if p.suffix.lower() in ORIGINAL_FORMATS
             and p.name.lower() not in ("readme.md", "main.tex")),
            key=lambda o: natural_key(o.title))


def course_sort_key(folder):
    m = re.search(r"(\d+)", folder.name)
    return (folder.name.split()[0], int(m.group(1)) if m else 0)


def find_courses():
    courses = []
    for subject in SUBJECTS:
        d = ROOT / subject
        if d.is_dir():
            courses += [Course(c) for c in sorted(d.iterdir(), key=course_sort_key)
                        if (c / "main.tex").exists()]
    return courses


# --------------------------------------------------------------------------
# Conversion

TITLE_RE = re.compile(r"\\begin\{important\}\[((?:[^\[\]]|\[[^\]]*\])*)\]")
HEADING_RE = re.compile(r'<h([23])[^>]*?\sid="([^"]+)"[^>]*>(.*?)</h\1>', re.S)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S)


def strip_tags(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\\\(|\\\)", "", s)
    return html.unescape(s).strip()


def convert_chapter(ch, defs, out_dir, warnings):
    tex = ch.path.read_text()
    tex = TITLE_RE.sub(lambda m: "\\begin{important}\n\n\\textbf{@@T@@" + m.group(1) + "}\n\n", tex)

    # Styles a chapter defines with \tikzset are needed by its pictures.
    styles = []
    for m in re.finditer(r"\\tikzset\s*(?=\{)", tex):
        styles.append(tex[m.start():skip_group(tex, m.end())])
    tikz_pre = ch.course.tikz_pre + "\n".join(styles) + "\n"
    pictures = {}

    def take_tikz(m):
        src = m.group(0)
        key = hashlib.sha1((tikz_pre + src).encode()).hexdigest()[:16]
        pictures[key] = src
        return "\\includegraphics{@@TIKZ@@" + key + "}"

    tex = TIKZ_RE.sub(take_tikz, tex)
    failed = compile_tikz(tikz_pre, pictures)
    for key in failed:
        warnings.append(f"{ch.course.code} {ch.slug}: TikZ picture {key} failed to compile")
    tikz_out = out_dir / "tikz"
    tikz_out.mkdir(parents=True, exist_ok=True)
    for key in pictures:
        if key not in failed:
            shutil.copy(CACHE / f"{key}.svg", tikz_out / f"{key}.svg")

    cmd = ["pandoc", "-f", "latex", "-t", "html5", "--katex",
           "--template", str(SITE_SRC / "templates" / "fragment.html"),
           "--lua-filter", str(SITE_SRC / "filter.lua"),
           "--number-sections", f"--number-offset={ch.number - 1}",
           "-M", f"chapnum={ch.number}", "-M", "imgprefix=", "-M", "pagetitle=chapter",
           "--wrap=none"]
    r = subprocess.run(cmd, input=defs + tex, capture_output=True, text=True)
    if r.returncode != 0:
        offset = defs.count("\n")
        err = re.sub(r"line (\d+)", lambda m: f"line {int(m.group(1)) - offset}", r.stderr)
        raise SystemExit(f"pandoc failed on {ch.path}:\n{err}")
    for line in r.stderr.splitlines():
        if "WARNING" in line:
            warnings.append(f"{ch.course.code} {ch.slug}: {line.strip()}")
    body = r.stdout.split("<!--@@SPLIT@@-->", 1)[-1]

    def size_tikz(m):
        # pdftocairo writes the size in pt; show figures a bit larger than print.
        svg = CACHE / f"{m.group(1)}.svg"
        w = re.search(r'width="([\d.]+)(?:pt)?"', svg.read_text()[:500]) if svg.exists() else None
        width = f' width="{round(float(w.group(1)) * 1.333 * TIKZ_ZOOM)}"' if w else ""
        return m.group(0) + width

    body = re.sub(r'<img src="tikz/([0-9a-f]+)\.svg"', size_tikz, body)

    m = H1_RE.search(body)
    if m:
        ch.title_html = re.sub(r'<span class="header-section-number">.*?</span>\s*', "",
                               m.group(1)).strip()
        body = body[:m.start()] + body[m.end():]
    else:
        ch.title_html = html.escape(ch.slug)
    ch.title_text = strip_tags(ch.title_html)
    ch.body = body.strip()

    items = []
    for level, hid, inner in HEADING_RE.findall(body):
        label = re.sub(r'<span class="header-section-number">(.*?)</span>',
                       r'<span class="toc-num">\1</span>', inner)
        items.append(f'<li class="toc-l{level}"><a href="#{hid}">{label}</a></li>')
    ch.toc = "\n".join(items)
    ch.key = match_key(f"{ch.slug} {ch.title_text}")


REPO_IMAGE_URL = re.compile(r"^https://github\.com/\S+/([^/\s]+\.(?:png|jpe?g|gif))\s*$", re.M | re.I)
ORIG_HEADING_RE = re.compile(r'<h([1-3])[^>]*?\sid="([^"]+)"[^>]*>(.*?)</h\1>', re.S)


def convert_original(orig, out_dir, warnings):
    """Convert one original notes file (Markdown, Word or LaTeX) to an HTML body."""
    fmt = ORIGINAL_FORMATS[orig.path.suffix.lower()]
    cmd = ["pandoc", "-f", fmt, "-t", "html5", "--katex",
           "--template", str(SITE_SRC / "templates" / "fragment.html"),
           "--lua-filter", str(SITE_SRC / "filter.lua"),
           "-M", "original=true", "-M", "imgprefix=", "-M", "pagetitle=original",
           "--wrap=none"]
    if fmt == "docx":
        cmd += [f"--extract-media=media/{orig.slug}", str(orig.path)]
        source = None
    else:
        source = orig.path.read_text(errors="replace")
        if fmt == "gfm":
            # A bare link to an image in this repository: show the image itself.
            def local_image(m):
                name = urllib.parse.unquote(m.group(1))
                return f"![{name}](<{name}>)" if (orig.path.parent / name).exists() else m.group(0)
            source = REPO_IMAGE_URL.sub(local_image, source)
    r = subprocess.run(cmd, input=source, capture_output=True, text=True, cwd=out_dir)
    if r.returncode != 0:
        raise SystemExit(f"pandoc failed on {orig.path}:\n{r.stderr}")
    for line in r.stderr.splitlines():
        if "WARNING" in line:
            warnings.append(f"{orig.course.code} {orig.path.name}: {line.strip()}")
    orig.body = r.stdout.split("<!--@@SPLIT@@-->", 1)[-1].strip()
    first = re.match(r"<h1[^>]*>(.*?)</h1>\s*", orig.body, re.S)
    if first and strip_tags(first.group(1)).lower() == orig.title.lower():
        orig.body = orig.body[first.end():]  # same as the page title
    orig.toc = "\n".join(
        f'<li class="toc-l{max(int(level), 2)}"><a href="#{hid}">{inner}</a></li>'
        for level, hid, inner in ORIG_HEADING_RE.findall(orig.body))


# --------------------------------------------------------------------------
# Page rendering

PEN_ICON = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/>'
            '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>')


def page(title, body, root, sidebar="", toc="", courses=(), current=None, page_class="",
         page_title=None, kind="page"):
    macros = json.dumps(current.macros if current else KATEX_EXTRA).replace("</", "<\\/")
    course_links, subject = [], None
    for c in courses:
        if c.subject != subject:
            subject = c.subject
            course_links.append(f'<div class="dropdown-label">{subject}</div>')
        course_links.append(
            f'<a class="dropdown-item{" active" if c is current else ""}" '
            f'href="{root}{c.slug}/index.html"><b>{c.code}</b> {html.escape(c.name)}</a>')
    course_links = "\n".join(course_links)
    toc_html = (f'<aside class="toc"><div class="toc-inner"><div class="toc-title">On this page</div>'
                f'<ul>{toc}</ul></div></aside>') if toc else ""
    sidebar_html = (f'<nav class="sidebar" id="sidebar"><div class="sidebar-inner">{sidebar}</div></nav>'
                    if sidebar else "")
    meta = (f'data-root="{root}" data-kind="{kind}" data-course="{current.slug if current else ""}" '
            f'data-course-code="{html.escape(current.code) if current else ""}" '
            f'data-page-title="{html.escape(page_title or title)}"')
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<script>try{{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t;}}catch(e){{}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<link rel="stylesheet" href="{root}pagefind/pagefind-ui.css">
<link rel="stylesheet" href="{root}assets/style.css">
<script type="speculationrules">{{"prefetch":[{{"where":{{"href_matches":"*.html"}},"eagerness":"moderate"}}]}}</script>
</head>
<body class="{page_class}" {meta}>
<header class="navbar">
  <button class="nav-toggle" id="nav-toggle" aria-label="Toggle chapters">&#9776;</button>
  <a class="brand" href="{root}index.html"><span class="brand-mark">&#8721;</span> {SITE_TITLE}</a>
  <div class="dropdown">
    <button class="dropdown-btn">{current.code if current else "Courses"} &#9662;</button>
    <div class="dropdown-menu">{course_links}</div>
  </div>
  <div class="nav-spacer"></div>
  <button class="jump-btn" id="jump-open" aria-label="Jump to (Ctrl+K)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="jump-label">Jump to&hellip;</span><kbd class="jump-kbd">Ctrl K</kbd></button>
  <div id="search" class="search"></div>
  <button class="notes-btn" id="notes-toggle" aria-label="Notes (n)" title="Notes (n)">{PEN_ICON}<span class="notes-btn-label">Notes</span><span class="notes-count" id="notes-count" hidden></span></button>
  <button class="icon-nav" id="focus-toggle" aria-label="Focus mode (f)" title="Focus mode (f)"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
  <a class="nav-link" href="{REPO_URL}" aria-label="GitHub">GitHub</a>
  <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg></button>
  <div class="progress" id="progress"></div>
</header>
<div class="layout">
{sidebar_html}
<main class="content" data-pagefind-body>
{body}
</main>
{toc_html}
</div>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="{root}pagefind/pagefind-ui.js"></script>
<script>window.KATEX_MACROS = {macros};</script>
<script defer src="{root}assets/app.js"></script>
<script defer src="{root}assets/notes.js"></script>
<script defer src="{root}assets/nav.js"></script>
</body>
</html>
"""


LECTURE_TITLE_RE = re.compile(r"^(Lecture|Tutorial)\s+0*(\d+)\s*[:.\u2013\u2014-]\s*(.+)$", re.S)


def chapter_label(ch):
    """(short label, title without the 'Lecture N:' prefix) for sidebars and lists."""
    m = LECTURE_TITLE_RE.match(ch.title_html)
    if m:
        return f"{m.group(1)[0]}{m.group(2)}", m.group(3).strip()
    return str(ch.number), ch.title_html


def chapter_crumb(ch):
    m = LECTURE_TITLE_RE.match(ch.title_html)
    return f"{m.group(1)} {m.group(2)}" if m else f"Chapter {ch.number}"


def view_toggle(course, latex_href, original_href, mode):
    """'LaTeX notes | Original notes' switch, shown when a course has originals."""
    if not course.originals:
        return ""
    active = ' class="active"'
    return (f'<div class="view-toggle">'
            f'<a href="{latex_href}"{active if mode == "latex" else ""}>LaTeX notes</a>'
            f'<a href="{original_href}"{active if mode == "original" else ""}>Original notes</a>'
            f'</div>')


SIDEBAR_FILTER = ('<input class="sidebar-filter" type="search" placeholder="Filter&hellip;" '
                  'aria-label="Filter this list">')


def sidebar_for(course, active=None, mode="latex", base="", toggle=""):
    """Course sidebar. base is the path from the current page to the course folder."""
    items = [f'<a class="sidebar-course" href="{base}index.html">{course.code}'
             f'<span>{html.escape(course.name)}</span></a>', toggle]
    if mode == "latex":
        items.append(f'<a class="sidebar-link{" active" if active is None else ""}" '
                     f'href="{base}index.html">Overview</a>')
        items.append('<div class="sidebar-label">Chapters</div>')
        items.append(SIDEBAR_FILTER)
        for ch in course.chapters:
            cls = " active" if ch is active else ""
            label, short = chapter_label(ch)
            items.append(f'<a class="sidebar-link{cls}" href="{base}{ch.slug}.html" '
                         f'title="{html.escape(ch.title_text)}">'
                         f'<span class="num">{label}</span><span>{short}</span></a>')
    else:
        items.append('<div class="sidebar-label">Original notes</div>')
        items.append(SIDEBAR_FILTER)
        for o in course.originals:
            cls = " active" if o is active else ""
            sub = original_subtitle(course, o)
            sub_html = f"<small>{sub}</small>" if sub else ""
            items.append(f'<a class="sidebar-link{cls}" href="{base}original/{o.slug}.html">'
                         f'<span>{html.escape(o.title)}{sub_html}</span></a>')
    return "\n".join(items)


def pager(items, i, href, label):
    prev = items[i - 1] if i > 0 else None
    nxt = items[i + 1] if i + 1 < len(items) else None
    parts = ['<nav class="pager">']
    parts.append(f'<a class="pager-link prev" href="{href(prev)}"><small>Previous</small>'
                 f'<span>{label(prev)}</span></a>' if prev else "<span></span>")
    parts.append(f'<a class="pager-link next" href="{href(nxt)}"><small>Next</small>'
                 f'<span>{label(nxt)}</span></a>' if nxt else "<span></span>")
    parts.append("</nav>")
    return "".join(parts)


def original_for(course, ch):
    match = [o for o in course.originals if ch.key and o.key == ch.key]
    return (match or course.originals)[0]


def chapter_for(course, orig):
    return next((ch for ch in course.chapters if orig.key and ch.key == orig.key), None)


def original_subtitle(course, orig):
    """Topic of an original lecture, taken from the matching LaTeX chapter's title."""
    ch = chapter_for(course, orig)
    if not ch or not re.fullmatch(r"(lecture|tutorial)\s*\d+", orig.title.strip().lower()):
        return ""  # only bare "Lecture 10" style titles need the topic added
    short = chapter_label(ch)[1]
    return "" if strip_tags(short).lower() == orig.title.lower() else short


def render_course(course, courses, out):
    cdir = out / course.slug
    for ch in course.chapters:
        toggle = (view_toggle(course, f"{ch.slug}.html",
                              f"original/{original_for(course, ch).slug}.html", "latex")
                  if course.originals else "")
        nav = pager(course.chapters, ch.number - 1, lambda c: f"{c.slug}.html", lambda c: c.title_html)
        body = (f'<div class="breadcrumbs"><a href="index.html">{course.code}</a> / '
                f'{chapter_crumb(ch)}</div>'
                f'<h1 class="chapter-title">{ch.title_html}</h1>\n{ch.body}\n{nav}')
        (cdir / f"{ch.slug}.html").write_text(page(
            f"{ch.title_text} | {course.code} | {SITE_TITLE}", body, "../",
            sidebar_for(course, ch, toggle=toggle), ch.toc, courses, course, "doc",
            page_title=ch.title_text, kind="chapter"))

    for i, orig in enumerate(course.originals):
        ch = chapter_for(course, orig)
        toggle = view_toggle(course, f"../{ch.slug}.html" if ch else "../index.html",
                             f"{orig.slug}.html", "original")
        nav = pager(course.originals, i, lambda o: f"{o.slug}.html", lambda o: html.escape(o.title))
        sub = original_subtitle(course, orig)
        body = (f'<div class="breadcrumbs"><a href="../index.html">{course.code}</a> / '
                f'Original notes</div>'
                f'<h1 class="chapter-title">{html.escape(orig.title)}</h1>'
                + (f'<p class="chapter-subtitle">{sub}</p>' if sub else "") +
                f'<p class="original-note">Original notes from the term, as written in '
                f'<code>{html.escape(orig.path.name)}</code></p>\n'
                f'<div class="original-body">{orig.body}</div>\n{nav}')
        (cdir / "original" / f"{orig.slug}.html").write_text(page(
            f"{orig.title} (original) | {course.code} | {SITE_TITLE}", body, "../../",
            sidebar_for(course, orig, "original", "../", toggle), orig.toc, courses, course, "doc",
            page_title=f"{orig.title} (original)", kind="original"))

    rows = "\n".join(
        f'<li><a href="{ch.slug}.html"><span class="num">{chapter_label(ch)[0]}</span>'
        f'<span>{chapter_label(ch)[1]}</span></a></li>' for ch in course.chapters)
    originals = ""
    if course.originals:
        orig_rows = "\n".join(
            f'<li><a href="original/{o.slug}.html"><span>{html.escape(o.title)}'
            + (f' <span class="muted">&middot; {original_subtitle(course, o)}</span>'
               if original_subtitle(course, o) else "") + '</span></a></li>'
            for o in course.originals)
        originals = (f'<h2 class="list-heading">Original notes</h2>\n'
                     f'<p class="muted">The notes as originally written during the term.</p>\n'
                     f'<ul class="chapter-list">{orig_rows}</ul>')
    pdf = f'<a class="button" href="{course.slug}.pdf">Download PDF</a>' if course.pdf else ""
    src = f"{REPO_URL}/tree/main/{course.subject}/{course.folder.name}".replace(" ", "%20")
    toggle = (view_toggle(course, "index.html", f"original/{course.originals[0].slug}.html", "latex")
              if course.originals else "")
    body = f"""<div class="breadcrumbs"><a href="../index.html">Courses</a> / {course.code}</div>
<h1 class="chapter-title">{course.code} <span class="muted">&mdash; {html.escape(course.name)}</span></h1>
<p class="lead">{len(course.chapters)} chapters, generated from the LaTeX notes.</p>
<div class="actions">{pdf}<a class="button secondary" href="{src}">LaTeX source</a></div>
<div id="continue-reading"></div>
<h2 class="list-heading">Chapters</h2>
<ol class="chapter-list">{rows}</ol>
{originals}"""
    (cdir / "index.html").write_text(page(
        f"{course.code} — {course.name} | {SITE_TITLE}", body, "../",
        sidebar_for(course, toggle=toggle), "", courses, course, "doc",
        page_title=f"{course.code} overview", kind="overview"))
    if course.pdf:
        shutil.copy(course.pdf, cdir / f"{course.slug}.pdf")
    figs = course.folder / "figures"
    if figs.is_dir():
        shutil.copytree(figs, cdir / "figures", dirs_exist_ok=True)


def render_index(courses, out):
    sections = []
    for subject in SUBJECTS:
        group = [c for c in courses if c.subject == subject]
        if not group:
            continue
        cards = "\n".join(
            f'<div class="card" data-course="{c.slug}">'
            f'<a class="card-link" href="{c.slug}/index.html"><span class="card-code">{c.code}</span></a>'
            f'<div class="card-name">{html.escape(c.name)}</div>'
            f'<div class="card-meta">{len(c.chapters)} chapters'
            f'{" &middot; original notes" if c.originals else ""}</div></div>' for c in group)
        sections.append(f'<h2 class="subject">{subject}</h2>\n<div class="cards">{cards}</div>')
    body = f"""<section class="hero">
<h1>{SITE_TITLE}</h1>
<p class="lead">Notes for the core University of Waterloo Computer Science, Mathematics, Statistics and Economics courses, written in LaTeX and split by chapter, alongside the original notes from each term.</p>
</section>
<div id="recent-pages"></div>
{"".join(sections)}"""
    (out / "index.html").write_text(page(SITE_TITLE, body, "", courses=courses,
                                         page_class="home"))


def write_nav_index(courses, out):
    """Every course, chapter and original-notes page, for the Ctrl+K quick jump."""
    entries = []
    for c in courses:
        entries.append({"t": f"{c.code} \u2014 {c.name}", "h": f"{c.slug}/index.html",
                        "c": c.code, "k": "course"})
        for ch in c.chapters:
            label = chapter_label(ch)[0]
            entries.append({"t": ch.title_text, "h": f"{c.slug}/{ch.slug}.html", "c": c.code,
                            "k": "chapter", "l": label if not label.isdigit() else f"Ch {label}"})
        for o in c.originals:
            sub = strip_tags(original_subtitle(c, o))
            entries.append({"t": o.title + (f" \u00b7 {sub}" if sub else ""),
                            "h": f"{c.slug}/original/{o.slug}.html", "c": c.code, "k": "original"})
    (out / "assets" / "nav.json").write_text(json.dumps(entries, ensure_ascii=False))


def check_output(out):
    """Sanity checks on the generated pages: images exist, no raw LaTeX left."""
    problems = []
    for f in sorted(out.glob("*/**/*.html")):
        text = f.read_text()
        main = text[text.find("<main"):text.find("</main>")]
        for src in re.findall(r'<img src="([^"]+)"', main):
            if not src.startswith(("http:", "https:", "data:")) and \
                    not (f.parent / urllib.parse.unquote(src)).exists():
                problems.append(f"{f.relative_to(out)}: missing image {src}")
        prose = re.sub(r'<span class="math[^"]*">.*?</span>', "", main, flags=re.S)
        prose = re.sub(r"<(pre|code)[^>]*>.*?</\1>", "", prose, flags=re.S)
        prose = re.sub(r'<div class="code-block.*?</div>', "", prose, flags=re.S)
        leftovers = sorted(set(re.findall(r"\\[A-Za-z]+", prose)))
        if leftovers:
            problems.append(f"{f.relative_to(out)}: unconverted LaTeX {' '.join(leftovers[:8])}")
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(SITE_SRC / "_site"))
    ap.add_argument("--course", action="append", help="only build these (e.g. 'CS 246')")
    ap.add_argument("--strict", action="store_true", help="exit with an error on any warning (CI)")
    ap.add_argument("--pdf-dir", help="folder of PDFs built by scripts/check_latex.py (<slug>.pdf)")
    args = ap.parse_args()
    out = Path(args.out)
    if out.exists():
        shutil.rmtree(out)
    (out / "assets").mkdir(parents=True)
    for f in (SITE_SRC / "static").iterdir():
        shutil.copy(f, out / "assets" / f.name)
    (out / ".nojekyll").write_text("")

    courses = find_courses()
    if args.course:
        courses = [c for c in courses if c.code in args.course or c.folder.name in args.course]
    warnings = []
    for course in courses:
        course.tikz_pre = tikz_preamble(course.main_tex)
        defs = pandoc_defs(course.main_tex)
        course.macros = katex_macros(defs)
        cdir = out / course.slug
        cdir.mkdir(parents=True)
        for ch in course.chapters:
            convert_chapter(ch, defs, cdir, warnings)
        if course.originals:
            odir = cdir / "original"
            odir.mkdir()
            for f in course.folder.iterdir():
                if f.suffix.lower() in IMAGE_EXTS:
                    shutil.copy(f, odir / f.name)
            for orig in course.originals:
                convert_original(orig, odir, warnings)
        if args.pdf_dir and (Path(args.pdf_dir) / f"{course.slug}.pdf").exists():
            course.pdf = Path(args.pdf_dir) / f"{course.slug}.pdf"
        print(f"{course.code}: {len(course.chapters)} chapters", flush=True)
    for course in courses:
        render_course(course, courses, out)
    render_index(courses, out)
    write_nav_index(courses, out)
    warnings += check_output(out)
    for w in warnings:
        print("warning:", w, file=sys.stderr)
    print(f"Site written to {out}")
    if args.strict and warnings:
        raise SystemExit(f"{len(warnings)} warning(s); failing because of --strict")


if __name__ == "__main__":
    main()
