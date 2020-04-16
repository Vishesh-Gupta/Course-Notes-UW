# CS 241 -- Foundations of Sequential Programs

Study notes (LaTeX) for UW CS 241, following the course as taught 2016-2021:
from bits and MIPS machine code, through assemblers, linkers and loaders, formal
languages, scanning and parsing, up to a compiler for WLP4 (a small C subset)
and memory management.

## Building

```
latexmk -pdf main.tex
```

Requires a TeX Live installation; the shared preamble lives in `../common/preamble.tex`.

## Chapters

1. Introduction and Data Representation
2. MIPS Machine Language
3. Assembly Language Programming
4. Assemblers
5. Linking, Loading and Relocation
6. Formal Languages and Regular Languages
7. Scanning
8. Context-Free Grammars
9. Top-Down Parsing
10. Bottom-Up Parsing
11. Context-Sensitive Analysis
12. Code Generation
13. Optimization and Memory Management
