#!/usr/bin/env python3
"""Create a new course book with the standard layout.

Usage: python3 scripts/new_course.py [--xelatex] SUBJECT CODE TITLE
       e.g. python3 scripts/new_course.py Mathematics "Math 237" "Calculus 3 for Honours Mathematics"

--xelatex builds the book with XeLaTeX (needed for Chinese, Japanese or Korean
text; see \\zh, \\ja and \\ko in common/preamble.tex).

Creates <SUBJECT>/<CODE>/ with main.tex (shared preamble, title in the
"<CODE> --- <TITLE>" form the website reads), chapters/01-introduction.tex and
a Readme.md.
"""

import sys
from string import Template

from check_latex import ROOT, SUBJECTS

MAIN = Template(r"""\documentclass[11pt,oneside]{book}
\input{../../common/preamble}
% Course-specific macros go here (\newcommand only, so the website can use them).

\title{${code} --- ${title}}
\author{Vishesh Gupta}
\date{University of Waterloo}
\begin{document}
\frontmatter
\maketitle
\tableofcontents
\mainmatter
\include{chapters/01-introduction}
\end{document}
""")

CHAPTER = Template(r"""\chapter{Introduction}

\section{Overview}
Notes for ${code} start here.

\section*{Summary}
\begin{itemize}
  \item Key points of the chapter.
\end{itemize}
""")

README = Template("""# ${code} -- ${title}

## Building

```
latexmk -pdf main.tex
```

or from the repository root: `make pdfs COURSE="${code}"` and `make site COURSE="${code}"`.

## Chapters

1. `chapters/01-introduction.tex` -- Introduction
""")


def main():
    args = sys.argv[1:]
    xelatex = "--xelatex" in args
    if xelatex:
        args.remove("--xelatex")
    if len(args) != 3:
        raise SystemExit(__doc__)
    subject, code, title = args
    if subject not in SUBJECTS:
        raise SystemExit(f"unknown subject {subject!r}; expected one of {', '.join(SUBJECTS)} "
                         "(a new subject also needs adding to SUBJECTS in scripts/check_latex.py "
                         "and website/build.py)")
    folder = ROOT / subject / code
    if (folder / "main.tex").exists():
        raise SystemExit(f"{folder} already has a main.tex")
    values = {"code": code, "title": title}
    (folder / "chapters").mkdir(parents=True, exist_ok=True)
    main = MAIN.substitute(values)
    if xelatex:
        main = "% !TEX program = xelatex\n" + main
    (folder / "main.tex").write_text(main)
    (folder / "chapters" / "01-introduction.tex").write_text(CHAPTER.substitute(values))
    if not (folder / "Readme.md").exists():
        (folder / "Readme.md").write_text(README.substitute(values))
    print(f"Created {folder.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
