# Course-Notes-UW

This repository contains course notes for the UW courses that I have taken.

Some files are latex, some files are markdown. I also have the pdf files there for easier access.

## LaTeX notes

Each course has a `main.tex` with one file per chapter/lecture in `chapters/`, sharing `common/preamble.tex`.
Build from inside the course folder with `latexmk -pdf main.tex`.
The notes are also published as a website (see `website/`), and CI compiles every course and checks the website build on each pull request.

### Computer Science

| Course | Title |
|---|---|
| CS 135 | Designing Functional Programs |
| CS 136 | Elementary Algorithm Design and Data Abstraction |
| CS 240 | Data Structures and Data Management |
| CS 241 | Foundations of Sequential Programs |
| CS 245 | Logic and Computation |
| CS 246 | Object-Oriented Software Development |
| CS 251 | Computer Organization and Design |
| CS 341 | Algorithms |
| CS 350 | Operating Systems |

### Mathematics

| Course | Title |
|---|---|
| Math 135 | Algebra for Honours Mathematics |
| Math 136 | Linear Algebra 1 for Honours Mathematics |

### Statistics

| Course | Title |
|---|---|
| Stat 230 | Probability |
| Stat 231 | Statistics |
