# Math 136 -- Linear Algebra 1 for Honours Mathematics

Study notes (LaTeX) for UW Math 136 as taught 2016-2021: vectors in R^n, systems of linear
equations, matrices and linear mappings, the fundamental subspaces, inverses, determinants,
eigenvalues and diagonalization, abstract vector spaces, and change of basis.

## Building

```
latexmk -pdf main.tex
```

`main.tex` inputs the shared preamble in `../../common/preamble.tex` and includes one file
per chapter from `chapters/`. Clean up with `latexmk -C`.

## Chapters

1. `01-vectors-in-rn.tex` -- Vector operations, span, linear independence, subspaces, lines/planes, dot and cross products
2. `02-projections.tex` -- Projections, orthogonal decomposition, minimum distance problems
3. `03-systems-of-equations.tex` -- Augmented matrices, row reduction, REF/RREF, rank, solution sets
4. `04-matrices.tex` -- Matrix algebra, matrix products, transpose, identity
5. `05-linear-mappings.tex` -- Matrix mappings, standard matrices, rotations/reflections/projections, range and kernel
6. `06-fundamental-subspaces.tex` -- Column, row, null and left null spaces, rank-nullity
7. `07-inverses.tex` -- Inverse matrices, elementary matrices, the Invertible Matrix Theorem
8. `08-determinants.tex` -- Cofactor expansion, row operations, adjugate, Cramer's rule, area and volume
9. `09-eigenvalues.tex` -- Characteristic polynomial, eigenspaces, algebraic and geometric multiplicity
10. `10-diagonalization.tex` -- Diagonalization theorem, similar matrices, powers of matrices
11. `11-vector-spaces.tex` -- Vector space axioms, subspaces, bases, dimension, coordinates
12. `12-general-linear-maps.tex` -- Matrix of a linear map, change of coordinates, isomorphisms
