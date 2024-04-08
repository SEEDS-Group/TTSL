# Types

Types describe the values that a declaration can accept. TTSL has [Int][Int], [String][String], [Float][Float], [Boolean][Boolean], [List](#List) and [Dictionaries](#dictionaries)

## Lists

In a List we can collect multiple values of one type in one element. For example, if we expect a list of integers, we could use the following Expression:

```ttsl
someList<Int>
```

Let us break down the syntax:

- The usual named type (here `#!ttsl someList`).
- Opening angle bracket.
- A positional type argument (here `#!ttsl Int`).
- A closing angle bracket.

The elements inside the list are assigned with square brackets. If we want the list to have the elements `#!ttsl 1, 2, 3`:

```ttsl
someList = [1, 2, 3]
```

The elements are always separated by a `#!ttsl ,`.

### List Access

To access a value in the list we use square brackets. For example, if we want the first object in the List, we use the following expression:

```ttsl
someList[0]
```

- The usual named type (here `#!ttsl someList`).
- Opening square bracket.
- The index of the Element we want (`#!ttsl 0`).
- A closing square bracket.

## Dictionaries

In a Dictionaries we can collect multiple pair of values. A Dictionary consists of keys with an associated value. For example, if we expect a Dictionaries of Sting keys and Int values, we could use the following Expression:

```ttsl
someDict<String, Int>
```

Let us break down the syntax:

- The usual named type (here `#!ttsl someDict`).
- Opening angle bracket.
- A positional type argument for the keys (here `#!ttsl String`).
- A comma
- A positional type argument for the value (here `#!ttsl Int`).
- A closing angle bracket.

The elements inside the Dictionary are assigned with curved brackets. If we want the Dictionary to have the keys `#!ttsl "a", "b", "c"` with the values `#!ttsl 1, 2, 3`:

```ttsl
someDict = {"a": 1, "b": 2, "c": 3}
```

The syntax is as followed:

- The usual named type (here `#!ttsl someDict`).
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
someDict["a"]
```

- The usual named type (here `#!ttsl someDict`).
- Opening square bracket.
- The key of the Element we want (`#!ttsl "a"`).
- A closing square bracket.

[Int]: expressions.md#int-literals
[Float]: expressions.md#float-literals
[String]: expressions.md#string-literals
[Boolean]: expressions.md#boolean-literals
