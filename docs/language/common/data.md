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

with `valid from` Date ` to ` Date the period in which this constant is [valid][Validity] can be defined. Both `from` and `to` are optional. If not given the constant is [valid][Validity] the whole time, till a certain point or starting from a certain point till now. The Date is given in [ISO-Syntax][date syntax] (year-month-day). For example:

```ttsl
data PersonAge: Int = 1 valid from 2009-01-01 to 2011-01-01
```

## ID modifier

There can also be an [ID modifier][id] added to the data to implicate that the data is unique and can be used to identify an object. The [ID modifier][id] is added by placing the keyword `id` in front of the data declaration. For example:

```ttsl
id data PersonID: Int = 1
```

[types]: types.md
[id]: modifier.md#id
[Expressions]: expressions.md
[calls]: expressions.md#calls
[Visibility]: modifier.md#visibility
[Validity]: validity.md
[date syntax]: validity.md#date

