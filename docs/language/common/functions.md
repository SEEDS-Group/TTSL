# Functions

## Defining a Function

The syntax to define a global function is as follows:

- The keyword `#!ttsl function`
- The name of the function ("loadDataset" in the following example)
- The list of [_parameters_][Parameters] (inputs) enclosed in parentheses and separated by commas (`(name: String)` in the following snippet). For each parameter we list the name of the parameter followed by a colon and its type.
- The [_result type_][Type] (outputs) after the symbol `#!ttsl :`.
- The body of the function. The body consists of [Statements][Statement].
- At the end of the Body there must be a return statement signaled with the keyword `return`. The return value must be of the type given as the result type.

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

The validity of functions can be defined as follows: [validity of functions][functionValidity]

## Timespan modifier

A function can calculate a value for a certain timespan. The timespan is indicated by the [timespan modifier][timespan modifier].

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
[Visibility]: visibility.md
[functionValidity]: validity.md#functions
[groupedBy]: modifier.md#groupedBy
[timespan modifier]:modifier.md#timespan
[Statement]: statements.md]
