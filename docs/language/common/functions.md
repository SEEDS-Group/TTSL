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
    var x: Int;
    x = y;
    return x;
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

The documentation for the [validity of functions][functionValidity] can be found in the [validity][Validity] section.

## Timespan

A function can calculate a value for a certain timespan. The timespan is indicated by the timespan [modification][modifier timespan]. When defining or calling a function with a timespan, the timespan is given using the `per x` syntax where x can either be day, week, month or year.

```ttsl
# Function definition:
function f(): Int per day {...}

# Function call:
var x = f() per day;
```

A function defined by a timespan can also be called for a different lifespan:

```ttsl
var x = f() per week;
```

## Grouped return value

The [Grouped by modifier][groupedBy] can be added to implicate that the return value of the function is grouped by an Identifier. This can either happen by an [aggregation][Aggregations] in the body of the function or by using an already grouped List of Values.

```ttsl
function taxes(name: String): List GroupedBy XYZ_id {...}
```

In this example the return value of the function is grouped by XYZ_id.

[Parameters]: parameters.md
[Type]: types.md
[id]: modifier.md#id
[Visibility]: modifier.md#visibility
[Validity]: validity.md
[functionValidity]: validity.md#functions
[groupedBy]: modifier.md#grouped-by
[modifier timespan]: modifier.md#timespan
[Statement]: statements.md
[Aggregations]: aggregations.md
