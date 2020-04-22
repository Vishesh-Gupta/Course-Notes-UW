# Notes website

Static site generated from the LaTeX notes in `Computer Science/`: one page per
chapter, a chapter sidebar per course, "On this page" navigation, dark mode and
search.

- `build.py` reads each course's `main.tex`, converts every `\include`d chapter
  with pandoc (`filter.lua`), compiles TikZ pictures to SVG and writes the site
  to `website/_site`.
- Math is rendered in the browser with KaTeX; search is built with Pagefind.
- `.github/workflows/notes-site.yml` builds and deploys it to GitHub Pages on
  every push to `main` that touches the notes.

## Build locally

Needs `pandoc`, TeX Live (latex-extra) and `pdftocairo` (poppler-utils).

```
python3 website/build.py                 # whole site
python3 website/build.py --course "CS 246"
npx pagefind --site website/_site        # optional: search index
python3 -m http.server -d website/_site
```
