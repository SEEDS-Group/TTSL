# Data

_Data_ defines a value. Data has a certain [type][types], [visibility][Visibility], [validity][Validity] and can be an [id][id].

```ttsl
data PersonAge: Int = 1
```

Here are the pieces of syntax:

- The keyword `#!ttsl data`
- The name of the data (here `#!ttsl PersonAge`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number. However, we suggest to use `#!ttsl lowerCamelCase` for the names of parameters.
- A colon.
- The [type][types] of the data (here `#!ttsl Int`). Data can only be and Int, Float, Boolean or String.
- An equals sign.
- The default value of the data (here `#!ttsl 1`).

## Visibility

The [visibility][Visibility] of data can be chosen by putting one of the three keywords `public`, `packageprivate`, `private` in front of the constant declaration. The default [visibility][Visibility] is public. Here is an example:

```ttsl
packageprivate data PersonAge: Int = 1
```

## Validity

The documentation for the [validity of data][dataValidity] can be found in the [validity][Validity] section.

## ID

There can also be an [ID modifier][id] added to the data to implicate that the data is unique and can be used to identify an object. The [ID modifier][id] is added by placing the keyword `id` in front of the data declaration. For example:

```ttsl
id data PersonID: Int = 1
```

## Timespan

Data can also be specified for a specific [timespan][timespan].

[types]: types.md
[id]: modifier.md#id
[Expressions]: expressions.md
[calls]: expressions.md#calls
[Visibility]: modifier.md#visibility
[Validity]: validity.md
[dataValidity]: validity.md#data
[timespan]: modifier.md#timespan