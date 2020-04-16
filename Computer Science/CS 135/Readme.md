# CS 135 -- Designing Functional Programs

Study notes for UW CS 135 (Racket, DrRacket teaching languages from Beginning
Student to Intermediate Student with lambda), written as LaTeX with one file
per course module.

## Building

```
latexmk -pdf main.tex
latexmk -C            # clean up build outputs
```

The shared preamble lives in `../common/preamble.tex`.

## Chapters

1. Introduction to CS 135 and Racket (expressions, functions, substitution model)
2. The Design Recipe
3. Simple Data (booleans, cond, symbols, strings, characters)
4. Structures
5. Lists
6. Working with Recursion on Lists
7. Types of Recursion (accumulative, mutual, generative preview)
8. Natural Numbers and Processing Multiple Lists
9. Patterns of Recursion and Dictionaries (association lists)
10. Trees (binary trees, BSTs, expression trees, general trees)
11. Local Definitions and Lexical Scope
12. Functional Abstraction (lambda, map/filter/foldr/foldl/build-list)
13. Generative Recursion (gcd, quicksort, mergesort, termination)
14. Graphs (adjacency lists, backtracking path search)
15. Efficiency, Computing History, and What's Next
