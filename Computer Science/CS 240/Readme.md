# CS 240 -- Data Structures and Data Management

Study notes for CS 240 at the University of Waterloo (as taught 2016-2021), written in LaTeX.

## Building

From this directory:

```
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
latexmk -C   # clean up build outputs
```

The shared preamble lives in `../common/preamble.tex`.

## Chapters

1. Introduction and Asymptotic Analysis (`chapters/01-intro-asymptotics.tex`)
2. Priority Queues (`chapters/02-priority-queues.tex`)
3. Sorting and Randomized Algorithms (`chapters/03-sorting-randomized.tex`)
4. Dictionaries and Balanced Search Trees (`chapters/04-dictionaries-avl.tex`)
5. Other Dictionary Implementations (`chapters/05-other-dictionaries.tex`)
6. Dictionaries for Special Keys (`chapters/06-special-keys.tex`)
7. Dictionaries via Hashing (`chapters/07-hashing.tex`)
8. Range Searching and Multidimensional Data (`chapters/08-range-searching.tex`)
9. String Matching (`chapters/09-string-matching.tex`)
10. Compression (`chapters/10-compression.tex`)
11. External Memory (`chapters/11-external-memory.tex`)
