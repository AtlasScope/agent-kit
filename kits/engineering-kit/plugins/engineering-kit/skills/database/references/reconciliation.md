# Reconciling a figure

Use this when a number disagrees with its source, when totals pass every check but look wrong, or when a count depends on how it is counted (`PG01`, `PG02`, `PG03`, `PG11`).

## Define it before querying

Write the figure's definition in one line before running anything: the population (which accounts, orders, users), the grain (what one row stands for), the identity key, the unit (currency, minor units, rounding), the period it describes, the knowledge cutoff (information after this moment is ignored) and the version of the rules. If the user cannot say, the dispute may be about the definition rather than the data; say so and ask the one question that settles it.

Two figures can both be right. A restated balance and the balance as known at the close differ legitimately, and so do figures over different populations. Name which one is being asked for before calling either wrong.

## Trace where the value comes from

Read what actually produces the figure: the view (`pg_get_viewdef`), the functions it calls, the application query. Separate the columns the value is computed from and the things that decide which rows count: joins, filters, grouping, the choice of version, permissions. Both kinds of dependency change the answer; a diagram of table relationships proves neither.

The `relationships` builder lists keys, unique indexes and foreign keys per relation. A missing foreign key, or a key that is not the grain the query assumes, is a lead to test, not a finding.

## Recompute from independent evidence

Use a source that did not pass through the same pipeline: the custodian statement, the original file, an invariant that must hold (debits equal credits, a parent equals the sum of its children). Never verify a figure with the view or code that produced it.

Build one row per key in a single plan (one snapshot) holding the independent value, each intermediate value the pipeline produces, and the reported value. Then sort the keys:

- **matched**: both sides have the key at the same grain, period and cutoff;
- **one side only**: in the source but not the result, or the reverse;
- **ambiguous**: one key maps to several candidates; report the ambiguity instead of picking the first;
- **unsupported**: reported with nothing independent behind it.

Compare only matched keys. Keep the other groups in their own lists with their amounts; an unsupported amount is neither a discrepancy nor confirmed.

## Grain and joins

Measure what a join does before trusting a total: the `fanout` builder counts left rows with no match (lost to an inner join) and with several (multiplied), and with a `measure` it splits the effect into amount dropped and amount added. An inner join can drop one key and double another so the row count comes out unchanged; checked on PostgreSQL 18.6, eight accounts joined to tags gave eight rows, one account twice and one not at all.

`SUM(DISTINCT amount)` is not a fix: equal amounts on different keys are not duplicates. Fix the grain instead: aggregate the many side to one row per key first, filter with `EXISTS` when the join only decides membership, and use a left join when an absent match must keep the row. The `grain` builder shows whether the columns you think identify a row actually do.

## The bridge

For an additive figure, walk from the independent value to the reported one over the matched keys, in the order the pipeline applies its steps: for example as imported, then the version chosen, then the join, then the filter. Recompute the running total after each step; `scripts/bridge.mjs` turns those totals into contributions that add up exactly to the observed difference.

- Take the reported end of the bridge from the producing view or report itself, not from your reconstruction of it. Then a zero residual means your steps explain the real number.
- A residual that is not zero means a step is missing. Report it as unexplained. Never spread it over the steps or assign it to the most likely-sounding cause.
- A bridge is order-specific. When steps interact (a correction on an account the join doubles), another order gives other contributions with the same total; state the order used.
- Put unsupported amounts in `outside`: they sit beside the bridge, and the reported total equals the bridge's end plus them.
- Pass per-key differences in `keys` to get net against gross. A net difference of $185 made of $1,565 of differences in both directions is several errors that cancel out, and matching totals prove nothing.

Ratios, averages, percentiles and distinct counts are not additive. Bridge numerator and denominator separately, or recompute the measure at each step; never add percentages. Keep money in integer minor units or exact decimals, never floating point, and do not mix currencies without a stated, versioned exchange rate. `run.mjs` keeps numbers JavaScript would round as exact text, and `bridge.mjs` accepts them.

## Missing, zero and unknown

A missing row, a row with an unknown (NULL) value, a known zero and "not applicable" are four different facts. Look in the producing query for the places they get merged: `coalesce(x, 0)` turns unknown into zero, `count(col)` skips NULLs where `count(*)` does not, `sum` over no rows is NULL, and an inner join silently removes rows with no match. Report each kind separately.

Before calling records missing, check that this role can see them (`references/running-queries.md`, "Who sees what").

## What to report

The definition used, the matched population and the separate lists, the bridge with its residual, net against gross, what is proved, what is ruled out, what is still unknown, the evidence that would change the conclusion, and the smallest fix. A failed check is a question about the data, not automatically a defect upstream.

Background on the difference between where a value comes from and why a row is included: Buneman, Khanna and Tan, *Why and Where: A Characterization of Data Provenance* (2001), https://doi.org/10.1007/3-540-44503-X_20.
