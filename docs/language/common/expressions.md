# Expressions

## Date Literals

Especially when working with [validities][Validity] users are required to use date literals to define dates. The date literals have to be in ISO-Syntax. This means that the date has to be in the format `year-month-day`. The following example shows how to define date literals:

```ttsl
# January 1st, 2024
2024-01-01

# December 31st, 2024
2024-12-31
```

## Date-Time Literals

Date-Time literals are used to define a specific point in time. The date-time literals have to be in ISO-Syntax. This means that the date has to be in the format `year-month-dayThour:minute:second`. The following example shows how to define date-time literals:

```ttsl
# January 1st, 2024, 12:00:00
2024-01-01T12:00:00

# December 31st, 2024, 23:59:59
2024-12-31T23:59:59
```

[Validity]: validity.md
