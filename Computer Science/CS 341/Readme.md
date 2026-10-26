# CS 341 --- Algorithms

LaTeX study notes for UW CS 341 (CLRS-based, as taught 2016-2021).

## Build

```
latexmk -pdf main.tex     # produces main.pdf
latexmk -C                # clean up
```

Requires the shared preamble in `../common/preamble.tex`.

## Chapters

1. Introduction and analysis review (asymptotics, maximum subarray)
2. Recurrences and the Master theorem
3. Divide and conquer (inversions, Karatsuba, Strassen, closest pair, median of medians)
4. Greedy algorithms (interval scheduling, lateness, fractional knapsack, Huffman)
5. Dynamic programming (weighted intervals, knapsack, LCS, edit distance, LIS, matrix chain, optimal BST)
6. Graph basics, BFS and DFS (bipartiteness, edge classification, topological sort, SCCs)
7. Minimum spanning trees (cut property, Kruskal with union-find, Prim)
8. Shortest paths (DAG, Dijkstra, Bellman-Ford, Floyd-Warshall)
9. Polynomial-time reductions and NP
10. NP-completeness (Cook-Levin, 3-SAT, IS/VC/Clique, Ham cycle, TSP, subset sum, 3-colouring)
11. Undecidability and coping with hardness
