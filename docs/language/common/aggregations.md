# Aggregations

To _aggregate_ [data][data] [grouped by][grouped by] an [ID][id] over a [function][functions] we can use the aggregation expression:

```ttsl
aggregate sum of taxes groupedBy hh_id
```

Let's break down the syntax:

- The keyword `#!ttsl aggregate`.
- The [function][functions] to be executed on the grouped values (here `#!ttsl sum`).
- The keyword `#!ttsl of`.
- The [data][data] that is aggregated (here `#!ttsl taxes`).
- The [grouped by][grouped by] modifier (here with the id `#!ttsl hh_id`).

An aggregation can be executed on one or multiple data values that are all connected to the same given [ID][id].

[data]: data.md
[grouped by]: modifier.md#grouped-by
[id]: modifier.md#id
[functions]: functions.md
[List]: types.md#lists
