# Course-Notes-UW

This repository contains course notes for the UW courses that I have taken.

Every course is a LaTeX book split into one file per chapter/lecture. The original notes I wrote during each term (Markdown, Word and LaTeX) are kept next to them for reference; their content is part of the LaTeX books, which are the one version on the website and in the PDFs.

- **Website:** https://course-notes-uw.pages.dev — each course as one continuous scroll, with notes, highlights and Apple Pencil handwriting (hosted free on Cloudflare Pages, so this repository can stay private).
- **PDFs:** built by CI on every change and attached to the [`notes-latest` release](https://github.com/Vishesh-Gupta/Course-Notes-UW/releases/tag/notes-latest) (also linked from each course page on the website).

## Courses

| Subject | Course | Title |
|---|---|---|
| Computer Science | CS 135 | Designing Functional Programs |
| | CS 136 | Elementary Algorithm Design and Data Abstraction |
| | CS 240 | Data Structures and Data Management |
| | CS 241 | Foundations of Sequential Programs |
| | CS 245 | Logic and Computation |
| | CS 246 | Object-Oriented Software Development |
| | CS 251 | Computer Organization and Design |
| | CS 341 | Algorithms |
| | CS 350 | Operating Systems |
| Mathematics | Math 135 | Algebra for Honours Mathematics |
| | Math 136 | Linear Algebra 1 for Honours Mathematics |
| | Math 239 | Introduction to Combinatorics |
| Statistics | Stat 230 | Probability |
| | Stat 231 | Statistics |
| Economics | ECON 102 | Introduction to Macroeconomics |
| Languages | CHINA 101R | First-Year Chinese 1 |
| | CHINA 102R | First-Year Chinese 2 |
| | JAPAN 101R | First-Year Japanese 1 |
| | KOREA 102R | First-Year Korean 2 |
| East Asian Studies | EASIA 201R | Introduction to East Asia |
| | EASIA 120R | Monsters and Magic in Japanese Popular Culture |
| | Chinese Poetry | Classical Chinese Poetry |

## Repository layout

```
<Subject>/<Course>/
  main.tex            the book: title, course macros, \include list of chapters
                      (first line "% !TEX program = xelatex" for books with Chinese,
                      Japanese or Korean text: \zh{..}, \zht{..}, \ja{..}, \ko{..})
  chapters/NN-*.tex   one file per chapter or lecture
  figures/            images used by the chapters (optional)
  Readme.md           chapter list for the course
  *.md, *.docx, ...   original notes from the term (their content is in the LaTeX book)
common/preamble.tex   packages, theorem environments, boxes and macros shared by every book
scripts/              check_latex.py (compile + checks), new_course.py (scaffold a course)
website/              site generator (pandoc + KaTeX + TikZ->SVG) and its TypeScript page scripts
.github/workflows/    CI: compile all PDFs, build and check the website, publish PDFs, deploy
```

## Working on the notes

Needs TeX Live (latex-extra; xetex and lang-chinese for the language books) with the Noto CJK fonts, `latexmk`, `pandoc`, `pdftocairo` (poppler-utils) and Node 20 (the website scripts are TypeScript, bundled with esbuild; see `website/README.md`).

```
make deps                     # install everything below (Homebrew on macOS, apt on Linux)
make pdfs COURSE="CS 246"     # compile one course (omit COURSE for all) into build/pdfs
make site COURSE="CS 246"     # build the website into website/_site
make check                    # everything CI checks: PDFs, TypeScript, strict site build, KaTeX formulas
make build                    # the full website with PDFs and search, as it is deployed
make serve                    # preview the site on http://localhost:8000
make login                    # log in to Cloudflare in the browser (once per computer)
make deploy                   # build everything and upload it to Cloudflare Pages
make upload                   # upload the site already built in website/_site
make new-course SUBJECT=Mathematics CODE="Math 237" TITLE="Calculus 3 for Honours Mathematics"
                              # add XELATEX=1 for a book with Chinese, Japanese or Korean
```

Inside a course folder, `latexmk -pdf main.tex` builds that book on its own.

## Website hosting

CI deploys the site to Cloudflare Pages on every push to `main`. One-time setup:

1. Create a free account at https://dash.cloudflare.com and copy the **Account ID** (Workers & Pages overview, right-hand side).
2. My Profile → API Tokens → Create Token → "Custom token" with permission **Account → Cloudflare Pages → Edit**.
3. In this repository: Settings → Secrets and variables → Actions → add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.

The first deploy creates the `course-notes-uw` Pages project. Until the secrets exist, the deploy step is skipped with a notice.

To deploy from your own computer instead (for example while GitHub Actions is unavailable), run `make login` once and then `make deploy`; no API token is needed.

## Checks

CI runs the same checks on every pull request: it fails on LaTeX errors, undefined references, chapters missing from `main.tex`, pandoc/TikZ warnings, unconverted LaTeX on the website, and formulas KaTeX cannot render.
