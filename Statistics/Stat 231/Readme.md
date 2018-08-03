# Stat 231 -- Statistics

Study notes (LaTeX) for UW Stat 231 as taught 2016-2021, following the structure of the
department's Stat 231 course notes: data summaries, statistical models and maximum likelihood,
the PPDAC framework for empirical studies, estimation and confidence/likelihood intervals,
hypothesis tests, Gaussian response models (regression and two-sample problems), multinomial
goodness-of-fit and independence tests, and causal relationships.

## Building

```
latexmk -pdf main.tex
```

`main.tex` inputs the shared preamble in `../../common/preamble.tex` and includes one file
per chapter from `chapters/`. Clean up with `latexmk -C`.

## Chapters

1. `01-introduction.tex` -- Empirical studies, populations, variates, numerical and graphical data summaries
2. `02-models-likelihood.tex` -- Statistical models, likelihood, relative likelihood, MLEs, invariance, model checking
3. `03-empirical-studies.tex` -- PPDAC, study/sample/measurement error, sampling protocols
4. `04-estimation.tex` -- Sampling distributions, confidence intervals, pivotal quantities, likelihood intervals, sample size
5. `05-hypothesis-tests.tex` -- Test statistics, p-values, binomial/Poisson/Gaussian tests, likelihood ratio tests
6. `06-gaussian-response-models.tex` -- Simple linear regression, inference for slope and mean response, prediction, paired and two-sample t
7. `07-multinomial-tests.tex` -- Likelihood ratio and Pearson goodness-of-fit tests, two-way tables and independence
8. `08-causal-relationships.tex` -- Association vs causation, experiments vs observational studies, confounding, Simpson's paradox, Hill's criteria
9. `09-summary-tables.tex` -- Summary of distributions, pivotal quantities, intervals and tests; table values
