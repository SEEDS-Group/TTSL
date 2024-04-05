# Constants

_Constants_ define a constant value, that can only be defined once and can not be changed. A constant has a certain [type][types], [visibility][Visibility] and [validity][Validity]

```ttsl
constant: Int = 1
```
Here are the pieces of syntax:

- The name of the constant (here `#!ttsl constant`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number. However, we suggest to use `#!ttsl lowerCamelCase` for the names of parameters.
- A colon.
- The [type][types] of the constant (here `#!ttsl Int`).
- An equals sign.
- The default value of the constant (here `#!ttsl 1`). This must be a constant [expression][Expressions], i.e. something that can be evaluated by the compiler. Particularly [calls][calls] usually do not fulfill this requirement.

## [Visibility][Visibility]

The visibility of constants can be chosen by putting one of the three keywords `public`, `packageprivate`, `private` in front of the constant declaration. The default visibility is public. Here is an example:

```ttsl
packageprivate constant: Int = 1
```


## [Validity][Validity]

with `valid from` Date ` to ` Date the period in which this constant is [valid][Validity] can be defined. Both `from` and `to` are optional. If not given the constant is [valid][Validity] the whole time, till a certain point or starting from a certain point till now. The Date is given in [ISO-Syntax][date syntax] (year-month-day). For example:

```ttsl
valid from 2009-01-01 to 2011-01-01
constant: Int = 1
```
Here are the pieces of syntax:

- the keyword `valid`.
- optional:
  - the keyword `from`.
  - The Date when the constant starts being valid in ISO-Syntax.
- optional:
  - the keyword `to`.
  - The Date when the constant stops being valid in ISO-Syntax.
- the _Constant_ declaration

[types]: types.md
[Expressions]: expressions.md
[calls]: expressions.md#calls
[Visibility]: visibility.md
[Validity]: validity.md
[date syntax]: validity.md#date
