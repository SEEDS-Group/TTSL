# Temporal Validity Restrictions

The temporal validity of [constants](#constants), [functions](#functions) and [data](#data) show in which timeframe they are valid. This is especially important when working in specific time periods. Dates always have to be in [ISO Syntax][date syntax] (yyyy-mm-dd).

It can be definied in the following ways:

## Constants

A time period in which a constant is [valid][Validity] can be defined using `valid from x to y` where `x` and `y` are two dates. Both `from` and `to` are optional. When no validity is set, the constant is always valid. If one of the dates is not set, the constant is valid from the beginning of time or until the end of time depending on which date is not set. The dates have to be in [ISO-Syntax][date syntax] (year-month-day).

```ttsl
constant income: Int {
    from 2009-01-01 to 2009-01-31 = 1;
}
```

The constant is valid from 2009-01-01 to 2011-01-01.

Multiple versions of the constant for different timeframes can be definied by using the `from x to y` phrase multiple times. It is important that the timeframes cannot overlap.

```ttsl
constant income: Int {
    from 2009-01-01 to 2009-01-31 = 1;
    from 2009-02-01 to 2009-02-28 = 2;
    from 2009-03-01 to 2009-03-31 = 3;
}
```

When providing multiple timeframes, the upper bound of the first timeframe can be left out and will implicitly be set to the lower bound of the second timeframe.

```ttsl
constant income: Int {
    from 2009-01-01 = 1;
    from 2010-01-01 to 2010-12-31 = 2;
}
```

The constant has the value 1 for the timeframe 2009-01-01 to 2009-12-31 and the value 2 for the timeframe 2010-01-01 to 2010-12-31.

## Functions

When defining a [function](#functions), the validity can be set by using `from x to y {...}` inside of the function block.

```ttsl
function foo() {
    from 2024-01-01 to 2024-12-31 {
        return 42;
    }
}
```

Multiple versions of the function for different timeframes can be definied by using the `valid` keyword multiple times. It is important that the timeframes cannot overlap.

```ttsl
function foo() {
    from 2024-01-01 to 2024-12-31 {
        return 42;
    }

    from 2025-01-01 to 2025-12-31 {
        return 43;
    }
}
```

Depending on when the function is called, the correct version of the function is executed.

When the start or end date is not set, the function is either valid from the beginning of time or until the end of time.

```ttsl
function foo() {
    valid from 2024-01-01 {
        return 42;
    }
}
```

```ttsl
function bar() {
    valid to 2024-12-31 {
        return 42;
    }
}
```

foo() is valid from 2024-01-01 with no upper bound while bar() is valid until 2024-12-31 with no lower bound.

When no validity is set, the function is always valid.

When providing multiple timeframes, the upper bound of the first timeframe can be left out and will implicitly be set to the lower bound of the second timeframe.

```ttsl
function foo() {
    from 2024-01-01 {
        return 42;
    }

    from 2025-01-01 to 2025-12-31 {
        return 43;
    }
}
```

The function foo() returns 42 for the timeframe 2024-01-01 to 2024-12-31 and 43 for the timeframe 2025-01-01 to 2025-12-31.

## Data

Because data is provided by the user as an input to the program, it is not possible to set a validity for data. The validity of data is always the timeframe in which the program is executed.

[date syntax]: validity.md#date
[Validity]: validity.md
