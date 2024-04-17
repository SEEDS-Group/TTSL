# Modifiers

## ID

There can also be an ID modifier added to the data and functions to implicate that the data or function is unique and can be used as an identifier. The ID modifier is added by placing the keyword `id` in front of the declaration. For example:

```ttsl
id function f(y: Int): Int {...}
id data x: Int
```

## Visibility

The visibility indicates in what parts of the project a [constant][Constants], [data][Data] or a [function][Functions] can be used.

### public

If the keyword `#!ttsl public` is used or none of the keyword above is used, the object can be used in the entire project.

### packageprivate

If the keyword `#!ttsl packageprivate` is used, the object can be used just in the package it was declared in.

### private

If the keyword `#!ttsl private` is used, the object can only be used in the scope it was declared in.

### Syntax

- One of the keywords or none for public
- The declaration of a [constant][Constants], [data][Data] or a [function][Functions]

```ttsl
private constant: Int = 1
```

## Grouping

The `groupedBy` modifier_ can be added to implicate that the return value of the function is grouped by an [Identifier](#id). Grouping values happens by using[aggregations][Aggregation]. A [function][Functions] and local variables can have the modifier grouped by. When a function is grouped by an ID there are checks to make sure either a local variable used in the function is grouped by that ID or there is an [aggregation][Aggregation] in the [function][Functions] body.

```ttsl
function taxes(name: String): List GroupedBy XYZ_ID {...}

var x: Int groupedBy XYZ_ID
```

In this example the return value of the function/ the variable is grouped by XYZ_ID.

## Time Unit

[Functions][Functions] and [data][Data] can be specified for a specific timespan such as a `#!ttsl day/ week/ month/ year`. For example:

```ttsl
# Function definition:
function per day f(): Int {...}

# Data definition:
data per month salary: Int = 5000
```

when calling the [functions][Functions] or [data][Data] the timespan also has to be given. It doesn't have to be the same as given in the declaration.

```ttsl
var x = per week f() 

y = per year salary
```


[Constants]:constants.md
[Data]:data.md
[Functions]:functions.md
[Aggregation]: aggregations.md
