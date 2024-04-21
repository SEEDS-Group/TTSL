# Data

_Data_ defines a value given by the user via an input. It can then be accessed via a chosen namespace. Data has a certain [type][types], [visibility][Visibility], [validity][Validity] and can be an [id][id].

```ttsl
data PersonAge: Int;
```

Here are the pieces of syntax:

- The keyword `#!ttsl data`
- The name of the data (here `#!ttsl PersonAge`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number. However, we suggest to use `#!ttsl lowerCamelCase` for the names of parameters.
- A colon.
- The [type][types] of the data (here `#!ttsl Int`). Data can only be and Int, Float, Boolean or String.

## Visibility

The [visibility][Visibility] of data can be chosen by putting one of the three keywords `public`, `packageprivate`, `private` in front of the constant declaration. The default [visibility][Visibility] is public. Here is an example:

```ttsl
packageprivate data PersonAge: Int;
```

## ID

There can also be an [ID modifier][id] added to the data to implicate that the data is unique and can be used to identify an object. The [ID modifier][id] is added by placing the keyword `id` in front of the data declaration. For example:

```ttsl
id data PersonID: Int;
```

## Timespan

Data can also be specified for a specific [timespan][timespan].

[types]: types.md
[id]: modifier.md#id
[Visibility]: modifier.md#visibility
[Validity]: validity.md
[timespan]: modifier.md#timespan
