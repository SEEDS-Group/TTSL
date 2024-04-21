# Types

Types describe the values that a declaration can accept. TTSL has [Int](#integer), [Float](#float), [String](#string), [Boolean](#boolean), [List](#lists) and [Dictionaries](#dictionaries)

## Integer

An Integer is a whole number. For example, `#!ttsl 1` is an Integer.

## Float

A Float describes a floating point number. The syntax is the same as for [Float literals](expressions.md#float-literals).

## String

Strings are a sequence of characters. For example, `#!ttsl "Hello, World!"` is a String. Strings are always enclosed in double quotes. More information on Strings can be found [here](expressions.md#string-literals).

## Boolean

A Boolean is a value that can be either `#!ttsl true` or `#!ttsl false`. These values are used to represent the truth value of an expression and can be used in [conditional statements](statements.md#conditional-statements) or [loops](statements.md#loops).

## Lists

In a List we can collect multiple values of one type in one element. For example, if we expect a list of integers, we could use the following Expression:

```ttsl
List<Int>
```

Let us break down the syntax:

- The usual named type (here `#!ttsl List`).
- Opening angle bracket.
- A positional type argument (here `#!ttsl Int`).
- A closing angle bracket.

The elements inside the list are assigned with square brackets. If we want the list to have the elements `#!ttsl 1, 2, 3`:

```ttsl
List = [1, 2, 3]
```

The elements are always separated by a `#!ttsl ,`.

### List Access

To access a value in the list we use square brackets. For example, if we want the first object in the List, we use the following expression:

```ttsl
List[0]
```

- The usual named type (here `#!ttsl List`).
- Opening square bracket.
- The index of the Element we want (`#!ttsl 0`).
- A closing square bracket.

## Dictionaries

In a Dictionaries we can collect multiple pair of values. A Dictionary consists of keys with an associated value. For example, if we expect a Dictionaries of Sting keys and Int values, we could use the following Expression:

```ttsl
Dict<String, Int>
```

Let us break down the syntax:

- The usual named type (here `#!ttsl Dict`).
- Opening angle bracket.
- A positional type argument for the keys (here `#!ttsl String`).
- A comma
- A positional type argument for the value (here `#!ttsl Int`).
- A closing angle bracket.

The elements inside the Dictionary are assigned with curved brackets. If we want the Dictionary to have the keys `#!ttsl "a", "b", "c"` with the values `#!ttsl 1, 2, 3`:

```ttsl
Dict = {"a": 1, "b": 2, "c": 3}
```

The syntax is as followed:

- The usual named type (here `#!ttsl Dict`).
- An equals sign.
- An opening curved bracket.
- The value of the key (here `#!ttsl "a", "b", "c"`).
- A colon
- A value of the value (here `#!ttsl 1, 2, 3`).
- A closing angle bracket.
- The elements always separated by a comma

### Dictionary Access

To access a value in the Dict we use square brackets with the associated key inside. For example, if we want the object assocciated with `#!ttsl "a"` in the Dict, we use the following expression:

```ttsl
Dict["a"]
```

- The usual named type (here `#!ttsl Dict`).
- Opening square bracket.
- The key of the Element we want (`#!ttsl "a"`).
- A closing square bracket.

[Int]: expressions.md#int-literals
[Float]: expressions.md#float-literals
[String]: expressions.md#string-literals
[Boolean]: expressions.md#boolean-literals
