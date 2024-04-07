# Constants

_Constants_ define a constant value, that can only be defined once and can not be changed. A constant has a certain [type][types], [visibility][Visibility] and [validity][Validity].

```ttsl
constant value1: Int = 1
```
Here are the pieces of syntax:

- The keyword `#!ttsl constant`
- The name of the constant (here `#!ttsl value1`). This can be any combination of upper- and lowercase letters, underscores, and numbers, as long as it does not start with a number. However, we suggest to use `#!ttsl lowerCamelCase` for the names of parameters.
- A colon.
- The [type][types] of the constant (here `#!ttsl Int`).
- An equals sign.
- The default value of the constant (here `#!ttsl 1`). This must be a constant [expression][Expressions], i.e. something that can be evaluated by the compiler. Particularly [calls][calls] usually do not fulfill this requirement.

## Visibility

The [visibility][Visibility] of constants can be chosen by putting one of the three keywords `public`, `packageprivate`, `private` in front of the constant declaration. The default [visibility][Visibility] is public. Here is an example:

```ttsl
packageprivate constant value1: Int = 1
```


## Validity

with `valid from` Date ` to ` Date the period in which this constant is [valid][Validity] can be defined. Both `from` and `to` are optional. If not given the constant is [valid][Validity] the whole time, till a certain point or starting from a certain point till now. The Date is given in [ISO-Syntax][date syntax] (year-month-day). For example:

```ttsl

constant value1: Int = 1 valid from 2009-01-01 to 2011-01-01
```
Here are the pieces of syntax:

- the _Constant_ declaration
- the keyword `valid`.
- optional:
  - the keyword `from`.
  - The Date when the constant starts being valid in ISO-Syntax.
- optional:
  - the keyword `to`.
  - The Date when the constant stops being valid in ISO-Syntax.


[types]: types.md
[Expressions]: expressions.md
[calls]: expressions.md#calls
[Visibility]: modifier.md#visibility
[Validity]: validity.md
[date syntax]: validity.md#date
