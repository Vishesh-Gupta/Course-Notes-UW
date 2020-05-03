# Notes website

Static site generated from the LaTeX notes in `Computer Science/`,
`Mathematics/` and `Statistics/`: one page per chapter, a chapter sidebar per
course, "On this page" navigation, dark mode and search.

- `build.py` reads each course's `main.tex`, converts every `\include`d chapter
  with pandoc (`filter.lua`), compiles TikZ pictures to SVG and writes the site
  to `website/_site`.
- Original notes in a course folder (`.md`, `.mdwn`, `.docx`, or a `.tex`
  other than `main.tex`) are converted too and shown under "Original notes",
  with a toggle on every page; lectures are paired by lecture, tutorial or
  textbook chapter number.
- With `--pdf-dir`, PDFs built by `scripts/check_latex.py` are linked from each
  course page (CI does this; PDFs are not committed).
- Math is rendered in the browser with KaTeX; search is built with Pagefind.
- `check_math.mjs` renders every formula of the built site with KaTeX and fails
  on errors (`npm install katex` first).
- `.github/workflows/ci.yml` compiles every PDF, builds the site with
  `--strict`, checks the math, and deploys to GitHub Pages on pushes to `main`.

## Build locally

The repository `Makefile` wraps these (`make pdfs`, `make site`, `make check`).

Needs `pandoc`, TeX Live (latex-extra) and `pdftocairo` (poppler-utils).

```
python3 website/build.py                 # whole site (--strict: fail on warnings)
python3 website/build.py --course "CS 246"
npx pagefind --site website/_site        # optional: search index
python3 -m http.server -d website/_site
```
