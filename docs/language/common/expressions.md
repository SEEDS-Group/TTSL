# Expressions

Expressions evaluate to some value.

## Literals

Literals are the basic building blocks of expressions. They describe a fixed, constant value.

### Int Literals

Int literals denote integers. They use the expected syntax. For example, the integer three is written as `#!ttsl 3`.

### Float Literals

Float literals denote floating point numbers. There are two ways to specify them:

- **Decimal form**: One half can be written as `#!ttsl 0.5`. Note that neither the integer part nor the decimal part can be omitted, so `#!ttsl .5` and `#!ttsl 0.` are syntax errors.
- **Scientific notation**: Writing very large or very small numbers in decimal notation can be cumbersome. In those cases, [scientific notation](https://en.wikipedia.org/wiki/Scientific_notation) is helpful. For example, one thousandth can be written in TTSL as `#!ttsl 1.0e-3` or `#!ttsl 1.0E-3`. You can read this as `#!ttsl 1.0 × 10⁻³`. When scientific notation is used, it is allowed to omit the decimal part, so this can be shortened to `#!ttsl 1e-3` or `#!ttsl 1E-3`.

### String Literals

String literals describe text. Their syntax is simply text enclosed by double quotes: `#!ttsl "Hello, world!"`. Various special characters can be denoted with _escape sequences_:

| Escape sequence | Meaning                                                              |
|-----------------|----------------------------------------------------------------------|
| `\b`            | Backspace                                                            |
| `\f`            | Form feed                                                            |
| `\n`            | New line                                                             |
| `\r`            | Carriage return                                                      |
| `\t`            | Tab                                                                  |
| `\v`            | Vertical tab                                                         |
| `\0`            | Null character                                                       |
| `\'`            | Single quote                                                         |
| `\"`            | Double quote                                                         |
| `\{`            | Opening curly brace (used for [template strings](#template-strings)) |
| `\\`            | Backslash                                                            |
| `\uXXXX`        | Unicode character, where `XXXX` is its hexadecimal code              |

String literals can contain also contain raw line breaks:

```ttsl
"Hello,

world!"
```

In order to interpolate text with other computed values, use [template strings](#template-strings).

### Boolean Literals

To work with truthiness, TTSL has the two boolean literals `#!ttsl false` and `#!ttsl true`.

### `#!ttsl null` Literal

To denote that a value is unknown or absent, use the literal `#!ttsl null`.

### Date Literals

Especially when working with [validities][Validity] users are required to use date literals to define dates. The date literals have to be in ISO-Syntax. This means that the date has to be in the format `year-month-day`. The following example shows how to define date literals:

```ttsl
# January 1st, 2024
2024-01-01

# December 31st, 2024
2024-12-31
```

### Date-Time Literals

Date-Time literals are used to define a specific point in time. The date-time literals have to be in ISO-Syntax. This means that the date has to be in the format `year-month-dayThour:minute:second`. The following example shows how to define date-time literals:

```ttsl
# January 1st, 2024, 12:00:00
2024-01-01T12:00:00

# December 31st, 2024, 23:59:59
2024-12-31T23:59:59
```

## Operations

Operations are special functions that can be applied to one or two expressions. TTSL has a fixed set of operations that cannot be extended. We distinguish between

- prefix operations (general form `#!ttsl <operator> <operand>`), and
- infix operations (general form `#!ttsl <left operand> <operator> <right operand>`).

### Operations on Numbers

Numbers can be negated using the unary `#!ttsl -` operator:

- The integer negative three is `#!ttsl -3`.
- The float negative three is `#!ttsl -3.0`.

The usual arithmetic operations are also supported for integers, floats and combinations of the two. Note that when either operand is a float, the whole expression is evaluated to a float.

- Addition: `#!ttsl 0 + 5` (result is an integer)
- Subtraction: `#!ttsl 6 - 2.9` (result is a float)
- Multiplication: `#!ttsl 1.1 * 3` (result is a float)
- Division: `#!ttsl 1.0 / 4.2` (result is a float)

Finally, two numbers can be compared, which results in a boolean. The integer `#!ttsl 3` for example is less than the integer `#!ttsl 5`. TTSL offers operators to do such checks for order:

- Less than: `#!ttsl 5 < 6`
- Less than or equal: `#!ttsl 1 <= 3`
- Greater than or equal: `#!ttsl 7 >= 7`
- Greater than: `#!ttsl 9 > 2`

### Logical Operations

To work with logic, TTSL has the two boolean literals `#!ttsl false` and `#!ttsl true` as well as operations to work with them:

- (Logical) **negation** (example `#!ttsl not a`): Output is `#!ttsl true` if and only if the operand is false:

| `#!ttsl not a` | false | true  |
|----------------|-------|-------|
| &nbsp;         | true  | false |

- **Conjunction** (example `#!ttsl a and b`): Output is `#!ttsl true` if and only if both operands are `#!ttsl true`. Note that the second operand is always evaluated, even if the first operand is `#!ttsl false` and, thus, already determines the result of the expression. The operator is not short-circuited:

| `#!ttsl a and b` | false | true  |
|------------------|-------|-------|
| **false**        | false | false |
| **true**         | false | true  |

- **Disjunction** (example `#!ttsl a or b`): Output is `#!ttsl true` if and only if at least one operand is `#!ttsl true`. Note that the second operand is always evaluated, even if the first operand is `#!ttsl true` and, thus, already determines the result of the expression. The operator is not short-circuited:

| `#!ttsl a or b` | false | true |
|-----------------|-------|------|
| **false**       | false | true |
| **true**        | true  | true |

### Equality Checks

There are two different types of equality in TTSL, _identity_ and _structural equality_. Identity checks if two objects are one and the same, whereas structural equality checks if two objects have the same structure and content. Using a real world example, two phones of the same type would be structurally equal but not identical. Both types of equality checks return a boolean literal `#!ttsl true` if the check was positive and `#!ttsl false` if the check was negative. The syntax for these operations is as follows:

- Identity: `#!ttsl 1 === 2`
- Structural equality: `#!ttsl 1 == 2`

TTSL also has shorthand versions for negated equality checks which should be used instead of an explicit logical negation with the `#!ttsl not` operator:

- Negated identity: `#!ttsl 1 !== 2`
- Negated structural equality: `#!ttsl 1 != 2`

### Elvis Operator

The elvis operator `#!ttsl ?:` (given its name because it resembles Elvis's haircut) is used to specify a default value that should be used instead if the left operand is `#!ttsl null`. This operator is not short-circuited, so both operand are always evaluated. In the following example the whole expression evaluates to `#!ttsl nullableExpression` if this value is not `#!ttsl null` and to `#!ttsl 42` if it is:

```ttsl
nullableExpression ?: 42
```

## Template Strings

[String literals](#string-literals) can only be used to denote a fixed string. Sometimes, however, parts of the string have to be computed and then interpolated into the remaining text. This is done with template strings. Here is an example:

```ttsl
"1 + 2 = {{ 1 + 2 }}"
```

The syntax for template strings is similar to [string literals](#string-literals): They are also delimited by double quotes, the text can contain escape sequences, and raw newlines can be inserted. The additional syntax are _template expressions_, which are any expression enclosed by `#!ttsl {{` and `#!ttsl }}`. There must be no space between the curly braces.

These template expressions are evaluated, converted to a string and inserted into the template string at their position. The template string in the example above is, hence, equivalent to the [string literal](#string-literals) `#!ttsl "1 + 2 = 3"`.

## References

References are used to refer to a declaration, such as a [function][functions] or a placeholder. The syntax is simply the name of the declaration, as shown in the next snippet where we first declare a placeholder called `#!ttsl one` and then refer to it when computing the value for the placeholder called `#!ttsl two`:

```ttsl
constant one: Int = 1;
val two = one + one;
```

In order to refer to global declarations in other [packages][packages], we first need to [import][imports] them.

## Calls

Calls are used to trigger the execution of a specific action, which can, for example, execute the code in a [function][functions]. Let's look at an example:

First, we show the code of the [function][functions] that we want to call.

```ttsl
function f(x: Int = 1): Int {
    // ... do something ...
}
```

This [function][functions] has a single [parameter][parameters] `#!ttsl x`, which must have [type][types] `#!ttsl Int`, and has the default value `#!ttsl 1`. In case of an [Expression Statement][ExpressionStatement] the call has to end with a `#!ttsl ;`. Since it has a default value, we are not required to specify a value when we call this [function][functions]. The most basic legal call of the [function][functions] is, thus, this:

```ttsl
y = f()
```

This calls the [function][functions] `#!ttsl f`, using the default `#!ttsl s` of `#!ttsl 1`.

The syntax consists of these elements:

- The _callee_ of the call, which is the expression to call (here a [reference](#references) to the [function][functions] `#!ttsl f`)
- The list of arguments, which is delimited by parentheses. In this case the list is empty, so no arguments are passed.

If we want to override the default value of an optional [parameter][parameters] or if the callee has required [parameters][parameters], we need to pass arguments. We can either use _positional arguments_ or _named arguments_.

In the case of positional arguments, they are mapped to parameters by position, i.e. the first argument is assigned to the first parameter, the second argument is assigned to the second parameter and so forth. We do this in the following example to set `#!ttsl x` to 5:

```ttsl
y = f(5)
```

The syntax for positional argument is simply the expression we want to pass as value.

Named arguments, however, are mapped to parameters by name. On the one hand, this can improve readability of the code, since the meaning of a value becomes obvious. On the other hand, it allows to override only specific optional parameters and keep the rest unchanged. Here is how to set `#!ttsl x` to 5 using a named argument:

```ttsl
f(x = 5)
```

These are the syntactic elements:

- The name of the parameter for which we want to specify a value.
- An equals sign.
- The value to assign to the parameter.

### Passing Multiple Arguments

We now add another parameter to the `#!ttsl f` [function][functions]:

```ttsl
function f(isBinary: Boolean, x: Int = 1): Int {
    // ... do something ...
}
```

This allows us to show how multiple arguments can be passed:

```ttsl
f(isBinary = true, x = 5)
```

We have already seen the syntax for a single argument. If we want to pass multiple arguments, we just separate them by commas. A trailing comma is allowed.

### Restrictions For Arguments

There are some restriction regarding the choice of positional vs. named arguments and passing arguments in general:

- For all [parameters][parameters] of the callee there must be at most one argument.
- For all [required parameters][required-parameters] there must be exactly one argument.
- After a named argument all arguments must be named.

### Calls with timespan modifier

When calling a [function][functions] with a [timespan modifier][timespan modifier] the [timespan modifier][timespan modifier] has to be added behind the [parameters][parameters]

### Legal Callees

Depending on the callee, a call can do different things. The following table lists all legal callees and what happens if they are called:

| Callee                                           | Meaning                                                                                                                        |
|--------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| [Function][functions]                            | Invokes the function and runs the associated Python code. The call evaluates to the result record of the function.             |

### Null-Safe Calls

If an expression can be `#!ttsl null`, it cannot be used as the callee of a normal call. Instead, a null-safe call must be used. A null-safe call evaluates to `#!ttsl null` if its callee is `#!ttsl null`. Otherwise, it works just like a normal call. This is particularly useful for [chaining](#chaining).

The syntax is identical to a normal call except that we replace the `#!ttsl ()` with `#!ttsl ?()`:

```ttsl
nullableCallee?()
```

## Member Accesses

A member access is used to refer to members of a complex data structure.

The general syntax of a member access is this:

```ttsl
<receiver>.<member>
```

Here, the receiver is some expression (the legal choices are explained below), while the member is always a [reference](#references).

### Null-Safe Member Accesses

If an expression can be `#!ttsl null`, it cannot be used as the receiver of a regular member access, since `#!ttsl null` does not have members. Instead, a null-safe member access must be used. A null-safe member access evaluates to `#!ttsl null` if its receiver is `#!ttsl null`. Otherwise, it evaluates to the accessed member, just like a normal member access.

The syntax is identical to a normal member access except that we replace the dot with the operator `#!ttsl ?.`:

```ttsl
nullableExpression?.member
```

## Indexed Accesses

An indexed access is used to access elements of a list by index or values of a map by key. In the following example, we use an index access to retrieve the first element of the `#!ttsl values` list:

```ttsl
function printFirst(values: List<Int>) {
    print(values[0]);
}
```

These are the elements of the syntax:

- An expression that evaluates to a list or map (here the [reference](#references) `#!ttsl values`).
- An opening square bracket.
- The index, which is an expression that evaluates to an integer. The first element has index 0.
- A closing square bracket.

Note that accessing a value at an index outside the bounds of the value list currently only raises an error at runtime.

### Null-Safe Indexed Accesses

If an expression can be `#!ttsl null`, it cannot be used as the receiver of a regular indexed access. Instead, a null-safe indexed access must be used. A null-safe indexed access evaluates to `#!ttsl null` if its receiver is `#!ttsl null`. Otherwise, it works just like a normal indexed access. This is particularly useful for [chaining](#chaining).

The syntax is identical to a normal indexed access except that we replace the `#!ttsl []` with `#!ttsl ?[]`:

```ttsl
nullableList?[0]
```

## Chaining

Multiple [calls](#calls),  [member accesses](#member-accesses), and [indexed accesses](#member-accesses) can be chained together. Let us first look at the declaration of the [function][functions] we need for the example:

```ttsl
function f() {
    function g()
}
```

This is a [function][functions] `#!ttsl f`, which has another [function][functions] in the functionbody called `#!Tsl drawAsGraph`.

## Type Casts

The compiler can _infer_ the [type][types] of an expression in almost all cases. However, sometimes its [type][types]
has to be specified explicitly. This is called a _type cast_. Here is an example:

```ttsl
dataset.getColumn("age") as Column<Int>
```

A type cast is written as follows:

- The expression to cast.
- The keyword `#!ttsl as`.
- The [type][types] to cast to.

Type casts are only allowed if the type of the expression is unknown. They cannot be used to override the inferred type
of an expression.

## Precedence

We all know that `#!ttsl 2 + 3 * 7` is `#!ttsl 23` and not `#!ttsl 35`. The reason is that the `#!ttsl *` operator has a higher precedence than the `#!ttsl +` operator and is, therefore, evaluated first. These precedence rules are necessary for all types of expressions listed above and shown in the following list. The higher up an expression is in the list, the higher its precedence and the earlier it is evaluated. Expressions listed beside each other have the same precedence and are evaluated from left to right:

- **HIGHER PRECEDENCE**
- `#!ttsl ()` (parentheses around an expression)
- `#!ttsl 1` ([integer literals](#int-literals)), `#!ttsl 1.0` ([float literals](#float-literals)), `#!ttsl "a"` ([string literals](#string-literals)), `#!ttsl true`/`false` ([boolean literals](#boolean-literals)), `#!ttsl null` ([null literal](#ttsl-null-literal)), `#!ttsl someName` ([references](#references)), `#!ttsl "age: {{ age }}"` ([template strings](#template-strings))
- `#!ttsl ()` ([calls](#calls)), `#!ttsl ?()` ([null-safe calls](#null-safe-calls)), `#!ttsl .` ([member accesses](#member-accesses)), `#!ttsl ?.` ([null-safe member accesses](#null-safe-member-accesses)), `#!ttsl []` ([indexed accesses](#indexed-accesses)), `#!ttsl ?[]` ([null-safe indexed accesses](#null-safe-indexed-accesses))
- `#!ttsl -` (unary, [arithmetic negations](#operations-on-numbers))
- `#!ttsl as` ([type casts](#type-casts))
- `#!ttsl ?:` ([Elvis operators](#elvis-operator))
- `#!ttsl *`, `#!ttsl /` ([multiplicative operators](#operations-on-numbers))
- `#!ttsl +`, `#!ttsl -` (binary, [additive operators](#operations-on-numbers))
- `#!ttsl <`, `#!ttsl <=`, `#!ttsl >=`, `#!ttsl >` ([comparison operators](#operations-on-numbers))
- `#!ttsl ===`, `#!ttsl ==`, `#!ttsl !==`, `#!ttsl !=` ([equality operators](#equality-checks))
- `#!ttsl not` ([logical negations](#logical-operations))
- `#!ttsl and` ([conjunctions](#logical-operations))
- `#!ttsl or` ([disjunctions](#logical-operations))
- **LOWER PRECEDENCE**

If the default precedence of operators is not sufficient, parentheses can be used to force a part of an expression to be evaluated first.

[Validity]: validity.md
[imports]: imports.md
[packages]: packages.md
[parameters]: parameters.md
[required-parameters]: parameters.md#required-parameters
[functions]: functions.md
[types]: types.md
[timespan modifier]: modifier.md#timespan
[ExpressionStatement]: statements.md#expression-statements
