# Math 239 -- Introduction to Combinatorics

Study notes (LaTeX) for UW Math 239 as taught 2016-2021 (taken Winter 2018): counting and
combinatorial proofs, generating series, compositions, binary strings and regular expressions,
linear recurrences, and an introduction to graph theory (connectedness, trees, planarity,
colouring and matchings).

`Note.tex` holds the original notes taken during the term; `main.tex` is the expanded,
cleaned-up book built from them.

## Building

```
latexmk -pdf main.tex
```

`main.tex` inputs the shared preamble in `../../common/preamble.tex` and includes one file
per chapter from `chapters/`. Clean up with `latexmk -C`.

## Chapters

1. `01-counting-basics.tex` -- Sum and product rules, binomial coefficients, bijections, combinatorial proofs, multisets
2. `02-generating-series.tex` -- Generating series, formal power series, inverses, sum/product/string lemmas
3. `03-compositions.tex` -- Compositions of integers, restricted parts, subsets with restrictions
4. `04-binary-strings.tex` -- Regular expressions, unambiguity, block, prefix and recursive decompositions
5. `05-recurrences.tex` -- Coefficients of rational functions, linear recurrences, characteristic polynomial, partial fractions
6. `06-graph-theory-intro.tex` -- Graphs, isomorphism, handshake lemma, regular, complete, bipartite graphs, n-cubes
7. `07-paths-cycles-connectedness.tex` -- Walks, paths, cycles, connectedness, cuts, Eulerian circuits, bridges
8. `08-trees.tex` -- Trees and their characterizations, leaves, spanning trees, BFS, bipartite characterization, MSTs
9. `09-planar-graphs.tex` -- Faces, Euler's formula, edge bounds, K5 and K3,3, Kuratowski, platonic solids, 5-colour theorem
10. `10-graph-colouring.tex` -- k-colourings, chromatic number, greedy colouring, bounds, edge colouring
11. `11-matchings.tex` -- Matchings and covers, augmenting paths, bipartite matching algorithm, Konig, Hall, SDRs
