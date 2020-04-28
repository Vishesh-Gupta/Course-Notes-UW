# Stat 230 -- Probability

Study notes (LaTeX) for UW Stat 230 as taught 2016-2021: probability models, counting,
conditional probability and independence, discrete and continuous random variables,
expectation and variance, multivariate distributions, the central limit theorem and
moment generating functions.

## Building

```
latexmk -pdf main.tex
```

`main.tex` inputs the shared preamble in `../../common/preamble.tex` and includes one file
per chapter from `chapters/`. Clean up with `latexmk -C`.

## Chapters

1. `01-introduction.tex` -- Interpretations of probability, sample spaces, events
2. `02-probability-models.tex` -- Axioms, complement rule, inclusion-exclusion, equally likely outcomes
3. `03-counting.tex` -- Addition/multiplication rules, permutations, combinations, arrangements with repeats, birthday problem, cards, committees
4. `04-conditional-probability.tex` -- Conditional probability, product rule, total probability, Bayes' theorem, independence
5. `05-discrete-random-variables.tex` -- pf/cdf, uniform, hypergeometric, binomial, negative binomial, geometric, Poisson, Poisson process
6. `06-expectation-variance.tex` -- Expectation, linearity, variance, means/variances of named distributions, Chebyshev
7. `07-continuous-random-variables.tex` -- pdf/cdf, quantiles, change of variables, uniform, exponential, normal and N(0,1) tables
8. `08-multivariate-distributions.tex` -- Joint/marginal/conditional pfs, independence, multinomial, covariance, correlation, linear combinations, indicators
9. `09-central-limit-theorem.tex` -- Sums of normals, CLT, normal approximation with continuity correction
10. `10-moment-generating-functions.tex` -- MGFs, moments, uniqueness, sums of independent r.v.s
11. `11-distribution-tables.tex` -- Table of distributions (pf/pdf, mean, variance, mgf) and the standard normal table
