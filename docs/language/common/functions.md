# Functions

## Defining a Function

The syntax to define a global function is as follows:

- The keyword `#!ttsl function`
- The name of the function ("loadDataset" in the following example)
- The list of [_parameters_][Parameters] (inputs) enclosed in parentheses and separated by commas (`(name: String)` in the following snippet). For each parameter we list the name of the parameter followed by a colon and its type.
- If the function has a return value the [_result type_][Type] (outputs) must be after the symbol `#!ttsl :`.
- The body of the function. The body consists of [Statements][Statement].
- At the end of the Body there can be a return statement signaled with the keyword `return`. The return value must be of the type given as the result type. If there is no result type given, there has to be no return value.


```ttsl
function f(y: Int): Int {
    var x: Int
    x = y
    return x
}
```

## Visibility

The [visibility][Visibility] of data can be chosen by putting one of the three keywords `public`, `packageprivate`, `private` in front of the constant declaration. The default [visibility][Visibility] is public. Here is an example:

```ttsl
packageprivate function f(y: Int): Int {...}
```

## ID modifier

There can also be an [ID modifier][id] added to the data to implicate that the data is unique and can be used to identify an object. The [ID modifier][id] is added by placing the keyword `id` in front of the data declaration. For example:

```ttsl
id function f(y: Int): Int {...}
```

## Validity

with `valid from` Date ` to ` Date the period in which this constant is [valid][Validity] can be defined. Both `from` and `to` are optional. If not given the constant is [valid][Validity] the whole time, till a certain point or starting from a certain point till now. The Date is given in [ISO-Syntax][date syntax] (year-month-day). For example:

```ttsl
function f(y: Int): Int {
    valid from 2009-01-01 to 2011-01-01
    ...
}
```

## Timespan

A function can calculate a value for a certain [timespan][timespan]. The [timespan][timespan] is indicated by `#!ttsl per day/week/month/year`.

```ttsl
function taxes(name:String): List per month
```


## Grouped return value

The [Grouped by modifier][groupedBy] can be added to implicate that the return value of the function is grouped by an Identifier. This can either happen by an aggregation in the body of the function or by using an already grouped List of Values.

```ttsl
function taxes(name: String): List GroupedBy XYZ_id {...}
```

In this example the return value of the function is grouped by XYZ_id.


[Parameters]: parameters.md
[Type]: types.md
[id]: modifier.md#id
[Visibility]: modifier.md#visibility
[Validity]: validity.md
[date syntax]: validity.md#date
[groupedBy]: modifier.md#groupedBy
[timespan]:timespan.mp
[Statement]: statements.md
