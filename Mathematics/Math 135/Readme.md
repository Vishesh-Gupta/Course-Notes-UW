# Math 135 -- Algebra for Honours Mathematics

Study notes (LaTeX) for UW Math 135 as taught 2016-2021: mathematical language and proof
techniques, sets, induction, elementary number theory (divisibility, gcd, Diophantine
equations, congruences, FLT, CRT), RSA, complex numbers and polynomials.

## Building

```
latexmk -pdf main.tex
```

`main.tex` inputs the shared preamble in `../../common/preamble.tex` and includes one file
per chapter from `chapters/`. Clean up with `latexmk -C`.

## Chapters

1. `01-mathematical-language.tex` -- Statements, truth tables, equivalence, quantifiers, negation, converse/contrapositive
2. `02-proof-techniques.tex` -- Direct proof, cases, contrapositive, contradiction, if and only if, counterexamples, uniqueness
3. `03-sets.tex` -- Set operations, subsets, proving set equality, Cartesian products, power sets
4. `04-induction.tex` -- Simple and strong induction, well-ordering, recurrences, binomial theorem
5. `05-divisibility.tex` -- Divisibility, TD, DIC, BBD, division algorithm, primes
6. `06-gcd-and-factorization.tex` -- GCD, Euclidean and extended Euclidean algorithms, Bezout, coprimeness, Euclid's lemma, UFT
7. `07-linear-diophantine-equations.tex` -- LDET 1 and 2, parametrized solutions, word problems
8. `08-congruences.tex` -- Congruence properties, Z_m, inverses, linear congruences
9. `09-flt-and-crt.tex` -- Fermat's Little Theorem, Chinese Remainder Theorem, splitting the modulus
10. `10-rsa.tex` -- RSA key generation, encryption/decryption, proof of correctness, signatures
11. `11-complex-numbers.tex` -- Arithmetic, conjugate, modulus, polar form, De Moivre, n-th roots, roots of unity
12. `12-polynomials.tex` -- Polynomial division, remainder/factor theorems, FTA, conjugate roots, rational roots, real factorization
