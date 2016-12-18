# ECON 102 -- Introduction to Macroeconomics

Study notes (LaTeX) for UW ECON 102 as taught 2016-2021, following Parkin & Bade,
*Macroeconomics: Canada in the Global Environment*: GDP and growth, jobs and inflation,
loanable funds, money and the quantity theory, exchange rates and the balance of payments,
AS-AD, expenditure multipliers, and fiscal and monetary policy (Bank of Canada).

The `.docx` files in this folder are the original notes from the term (one per textbook
chapter); the LaTeX chapters are a corrected and expanded version of them.

## Building

```
latexmk -pdf main.tex
```

`main.tex` inputs the shared preamble in `../../common/preamble.tex` and includes one file
per chapter from `chapters/`. Clean up with `latexmk -C`.

## Chapters

1. `01-what-is-economics.tex` -- Scarcity, factors of production, opportunity cost, marginal analysis (Text Ch. 1)
2. `02-the-economic-problem.tex` -- PPF, allocative efficiency, growth, comparative advantage (Text Ch. 2)
3. `03-measuring-gdp-and-growth.tex` -- GDP, circular flow, expenditure/income approaches, real GDP and deflator (Text Ch. 20)
4. `04-monitoring-jobs-and-inflation.tex` -- Labour Force Survey indicators, natural unemployment, CPI and inflation (Text Ch. 21)
5. `05-finance-saving-and-investment.tex` -- Financial markets, loanable funds, crowding out (Text Ch. 23)
6. `06-money-price-level-and-inflation.tex` -- Money, banks, Bank of Canada, money multiplier, quantity theory (Text Ch. 24)
7. `07-exchange-rate-and-balance-of-payments.tex` -- Forex market, parity conditions, balance of payments (Text Ch. 25)
8. `08-aggregate-supply-and-aggregate-demand.tex` -- LRAS, SRAS, AD, output gaps, schools of thought (Text Ch. 26)
9. `09-expenditure-multipliers.tex` -- Consumption function, Keynesian cross, multiplier (Text Ch. 27)
10. `10-fiscal-policy.tex` -- Budget, supply-side effects, automatic stabilizers, fiscal multipliers (Text Ch. 29)
11. `11-monetary-policy.tex` -- Inflation targeting, overnight rate, transmission, QE (Text Ch. 30)
