# Notes website

Static site generated from the LaTeX notes in `Computer Science/`,
`Mathematics/`, `Statistics/` and `Economics/`. Each course is one page: every
chapter in a single scroll, with a sidebar that follows the chapter being read.

- `build.py` reads each course's `main.tex`, converts every `\include`d chapter
  with pandoc (`filter.lua`), compiles TikZ pictures to SVG and writes the site
  to `website/_site` (old per-chapter addresses redirect into the course page).
- With `--pdf-dir`, PDFs built by `scripts/check_latex.py` are linked from each
  course page (CI does this; PDFs are not committed).
- Math is rendered in the browser with KaTeX; search is built with Pagefind.
- `check_math.mjs` renders every formula of the built site with KaTeX and fails
  on errors.

## Page scripts (TypeScript)

`src/` holds the browser code, bundled per page script by esbuild into `dist/`
(not committed), which `build.py` publishes as `assets/*.js`:

| Entry | Does |
|---|---|
| `app.ts` | theme, menus, math, code copy; tracks the chapter being read (sidebar, contents, progress, address) |
| `nav.ts` | Ctrl/⌘K quick jump, sidebar filter, focus mode, recently viewed |
| `notes.ts` | notes panel, highlights with comments, notes typed into the page (`notes/`) |
| `ink.ts` | Apple Pencil / mouse handwriting on the page and the pad in the notes panel |

Shared code is in `util.ts` and `types.ts` (what is stored in `localStorage`).
Scripts talk to each other through the events declared in `globals.d.ts`.

```
cd website
npm ci              # esbuild, TypeScript and KaTeX (pinned in package-lock.json)
npm run typecheck   # tsc --noEmit (strict)
npm run build       # src/*.ts -> dist/*.js
```

## Build locally

The repository `Makefile` wraps everything (`make js`, `make site`, `make check`).
Needs `pandoc`, TeX Live (latex-extra; xetex and lang-chinese with the Noto CJK fonts for the
language books), `pdftocairo` (poppler-utils) and Node 20. TikZ figures are compiled with the
book's own engine (pdflatex, or xelatex when `main.tex` starts with `% !TEX program = xelatex`).
`\zh`, `\zht`, `\ja` and `\ko` become `lang`-tagged spans so browsers use the right CJK fonts.

```
make site COURSE="CS 246"   # bundles the scripts, then builds that course
make check                  # PDFs, type-check, strict site build, KaTeX formulas
make serve                  # http://localhost:8000
```

`.github/workflows/ci.yml` runs the same checks on every pull request and, on
`main`, publishes the PDFs and deploys the site to Cloudflare Pages.
