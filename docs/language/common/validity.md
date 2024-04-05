# Validity

The validity of [constants](#constants), [functions](#functions) and [data](#data) show in which timeframe they are valid. This is especially important when working in specific time periods.

It can be definied in the following ways:

## Constants

## Functions

<!-- 
TODO: Hyperlinks updaten
-->

When defining a [function](#functions), the validity can be set by using the `valid from x to y` phrase right below the function definition. The date has to be in [ISO-Syntax][date syntax] (year-month-day).

```ttsl
function foo() {
    valid from 2024-01-01 to 2024-12-31;
    return 42;
}
```

Multiple versions of the function for different timeframes can be definied by using the `valid` keyword multiple times.

```ttsl
function foo() {
    valid from 2024-01-01 to 2024-12-31;
    return 42;

    valid from 2025-01-01 to 2025-12-31;
    return 43;
}
```

Depending on when the function is called, the correct version of the function is executed.

When the start or end date is not set, the function is either valid from the beginning of time or until the end of time.

```ttsl
function foo() {
    valid from 2024-01-01;
    return 42;
}
```

```ttsl
function bar() {
    valid to 2024-12-31;
    return 42;
}
```

foo() is valid from 2024-01-01 with no upper bound while bar() is valid until 2024-12-31 with no lower bound.

When no validity is set, the function is always valid.

## Data

[date syntax]: validity.md#date
