# Data

_Data_ defines a value. Data has a certain [type][types], [visibility][Visibility], [validity][Validity] and can be an [id][id].

```ttsl
data: String = 'data'
```

Here are the pieces of syntax:

- The name of the data (here `#!ttsl data`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number. However, we suggest to use `#!ttsl lowerCamelCase` for the names of parameters.
- A colon.
- The [type][types] of the data (here `#!ttsl String`). Data can only be and Int, Float, Boolean or String.
- An equals sign.
- The default value of the data (here `#!ttsl 'data'`).

## Visibility

The [visibility][Visibility] of data can be chosen by putting one of the three keywords `public`, `packageprivate`, `private` in front of the constant declaration. The default [visibility][Visibility] is public. Here is an example:

```ttsl
packageprivate data: String = 'data'
```

## Validity

The documentation for the [validity of data][dataValidity] can be found in the [validity][Validity] section.

## ID modifier

There can also be an [ID modifier][id] added to the data to implicate that the data is unique and can be used to identify an object. The [ID modifier][id] is added by placing the keyword `id` in front of the data declaration. For example:

```ttsl
id data: String = 'data'
```

[types]: types.md
[id]: modifier.md#id
[Visibility]: visibility.md
[Validity]: validity.md
[dataValidity]: validity.md#data
