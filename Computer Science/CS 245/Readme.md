# CS 245 -- Logic and Computation

Study notes (LaTeX) for UW CS 245 as taught 2016-2021: propositional and first-order logic
(syntax, semantics, natural deduction, soundness and completeness), Peano arithmetic,
program verification with Hoare logic, and undecidability/incompleteness.

## Building

```
latexmk -pdf main.tex
```

`main.tex` inputs the shared preamble in `../common/preamble.tex` and includes one file
per chapter from `chapters/`. Clean up with `latexmk -C`.

## Chapters

1. `01-introduction.tex` -- Logic and CS, arguments, validity, translation
2. `02-propositional-syntax.tex` -- Well-formed formulas, structural induction, unique readability, parse trees
3. `03-propositional-semantics.tex` -- Truth valuations, tautologies, entailment, equivalence, adequate connectives, CNF/DNF
4. `04-propositional-proofs.tex` -- Natural deduction, Hilbert-style axiomatic system, resolution
5. `05-soundness-completeness.tex` -- Soundness, completeness, compactness
6. `06-predicate-syntax.tex` -- Terms, formulas, free/bound variables, substitution
7. `07-predicate-semantics.tex` -- Interpretations, environments, validity, logical consequence
8. `08-predicate-deduction.tex` -- Quantifier and equality rules, soundness/completeness
9. `09-peano-arithmetic.tex` -- Peano axioms, induction proofs, non-standard models
10. `10-program-verification.tex` -- Hoare triples, partial/total correctness, invariants, variants, arrays
11. `11-undecidability.tex` -- Turing machines, halting problem, reductions, Godel's incompleteness
